<script setup lang="ts">
/**
 * Redis 控制中心 —— 数据源级 Redis 管理
 *
 * <p>顶部：Redis 数据源 + 逻辑库 + 刷新 + 服务信息（工具条）。
 * 左侧键浏览器（340px）：pattern 搜索 + SCAN 游标分页（底部「加载更多」）+ 平铺/树形两种模式，
 * 支持单选、批量勾选删除；树形支持按前缀删除子键。右侧按 key 类型动态挂载
 * {@code components/redis/RedisValue*.vue} 组件编辑值（string/hash/list/set/zset/stream）。</p>
 *
 * <p>数据全部来自 /ms/monitor/redis-manage，操作任意已登记的 type=redis 数据源。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref, watch, type Component } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";
import {
  scanRedisKeys,
  getRedisKeyDetail,
  createRedisKey,
  deleteRedisKeys,
  expireRedisKey,
  fetchRedisInfo,
  fetchRedisDatabases,
  redisStreamAdd,
  type RedisManageKeyItem,
  type RedisManageKeyDetail,
  type RedisManageDatabase,
  type RedisField,
  type RedisMemberScore,
} from "../redisManageApi";
import RedisValueString from "../components/redis/RedisValueString.vue";
import RedisValueHash from "../components/redis/RedisValueHash.vue";
import RedisValueList from "../components/redis/RedisValueList.vue";
import RedisValueSet from "../components/redis/RedisValueSet.vue";
import RedisValueZset from "../components/redis/RedisValueZset.vue";
import RedisValueStream from "../components/redis/RedisValueStream.vue";

const route = useRoute();

// ==================== 类型语义色（koi 变量，列表徽标/详情标签共用） ====================
const TYPE_META: Record<string, { color: string }> = {
  STRING: { color: "var(--el-color-primary)" },
  HASH: { color: "var(--metric-mem, var(--el-color-primary))" },
  LIST: { color: "var(--metric-net, var(--el-color-primary))" },
  SET: { color: "var(--metric-jvm, var(--el-color-success))" },
  ZSET: { color: "var(--metric-disk, var(--el-color-warning))" },
  STREAM: { color: "var(--metric-redis, var(--el-color-danger))" },
  NONE: { color: "var(--el-text-color-placeholder)" },
};

/**
 * 取类型语义色
 * @param type 类型
 */
const typeColor = (type?: string | null): string =>
  (type && TYPE_META[type]?.color) || "var(--el-text-color-placeholder)";

// ==================== 顶部状态 ====================
const datasources = ref<DataSourceInfo[]>([]);
const selectedDatasourceId = ref<number | undefined>(
  route.query.datasourceId ? Number(route.query.datasourceId) : undefined,
);
const db = ref(0);
const databases = ref<RedisManageDatabase[]>([]);
const dbLoading = ref(false);

// ==================== 键浏览器 ====================
const pattern = ref("*");
const keys = ref<RedisManageKeyItem[]>([]);
const keysLoading = ref(false);
const cursor = ref("0");
const nextCursor = ref("0");
const hasMore = ref(false);
const selectedKey = ref<string | null>(null);
const checkedKeys = ref<string[]>([]);
const viewMode = ref<"flat" | "tree">(
  (localStorage.getItem("redis-view-mode") as "flat" | "tree") || "flat",
);
const expanded = ref<Set<string>>(new Set());

// ==================== 左侧宽度（拖拽调节，按 id 持久化） ====================
/** 左侧键浏览器宽度存储键 */
const LEFT_WIDTH_KEY = "redis-left-width";

/** 左侧宽度（拖拽调整，记录到 localStorage） */
const leftWidth = ref<number>(Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340);

/** 是否正在拖拽（拖拽中禁用文本选择） */
const resizing = ref(false);

/**
 * 开始拖拽调节左侧宽度
 * @param e 鼠标按下事件
 */
function startResize(e: MouseEvent): void {
  resizing.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  const onMove = (ev: MouseEvent): void => {
    leftWidth.value = Math.min(560, Math.max(260, startWidth + ev.clientX - startX));
  };
  const onUp = (): void => {
    resizing.value = false;
    localStorage.setItem(LEFT_WIDTH_KEY, String(leftWidth.value));
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

// ==================== 键详情 ====================
const detail = ref<RedisManageKeyDetail | null>(null);
const detailLoading = ref(false);
const editTtl = ref(-1);
const opBusy = ref(false);

// ==================== 弹窗 ====================
const newKeyDialog = ref(false);
const newKeySaving = ref(false);
const newKeyForm = ref({
  key: "",
  type: "STRING",
  value: "",
  ttl: -1,
  hashRows: [] as RedisField[],
  listText: "",
  setText: "",
  zsetRows: [] as RedisMemberScore[],
});
const infoDialog = ref(false);
const infoMap = ref<Record<string, string>>({});
const infoLoading = ref(false);
const streamDialog = ref(false);
const streamBody = ref("{}");

// ==================== 类型化详情组件 ====================
/** key 类型 → 详情组件（组件化：不同结构不同编辑风格） */
const DETAIL_COMPONENTS: Record<string, Component> = {
  STRING: RedisValueString,
  HASH: RedisValueHash,
  LIST: RedisValueList,
  SET: RedisValueSet,
  ZSET: RedisValueZset,
  STREAM: RedisValueStream,
};
const detailComponent = computed<Component | null>(() =>
  detail.value ? DETAIL_COMPONENTS[detail.value.type] ?? null : null,
);

// ==================== 数据源 / 库 ====================
async function loadDatasources(): Promise<void> {
  try {
    const all = await fetchDataSources();
    datasources.value = (all ?? []).filter(d => String(d.type).toLowerCase() === "redis");
    if (!selectedDatasourceId.value && datasources.value.length) {
      selectedDatasourceId.value = datasources.value[0].id;
    }
  } catch (e) {
    ElMessage.error(`加载数据源失败：${String((e as Error)?.message ?? e)}`);
  }
}

async function loadDatabases(): Promise<void> {
  if (!selectedDatasourceId.value) return;
  dbLoading.value = true;
  try {
    databases.value = await fetchRedisDatabases(selectedDatasourceId.value);
  } catch {
    databases.value = [];
  } finally {
    dbLoading.value = false;
  }
}

// ==================== 键列表（SCAN 游标分页） ====================
/**
 * 加载键列表
 * @param reset 是否重置为第一页
 */
async function loadKeys(reset = true): Promise<void> {
  if (!selectedDatasourceId.value) return;
  keysLoading.value = true;
  try {
    const start = reset ? "0" : cursor.value;
    const result = await scanRedisKeys(selectedDatasourceId.value, db.value, pattern.value || "*", start, 100);
    const list = result?.keys ?? [];
    keys.value = reset ? list : [...keys.value, ...list];
    if (reset) checkedKeys.value = [];
    nextCursor.value = result?.nextCursor ?? "0";
    hasMore.value = nextCursor.value !== "0";
    cursor.value = nextCursor.value;
  } catch (e) {
    ElMessage.error(`加载键列表失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    keysLoading.value = false;
  }
}

function refreshAll(): void {
  selectedKey.value = null;
  detail.value = null;
  void loadKeys(true);
  void loadDatabases();
}

// ==================== 平铺 / 树形 ====================
watch(viewMode, v => localStorage.setItem("redis-view-mode", v));

/** 树节点（按 `:` 分层） */
interface KeyTreeNode {
  name: string;
  path: string;
  children: KeyTreeNode[];
  keys: RedisManageKeyItem[];
}

/** 树形展示行（展开状态拍平，便于模板渲染） */
interface TreeRow {
  kind: "node" | "leaf";
  path: string;
  name: string;
  depth: number;
  expanded: boolean;
  hasChildren: boolean;
  item?: RedisManageKeyItem;
}

/**
 * 由当前已加载键构建树（按 `:` 分层）
 * @param items 键列表
 */
function buildTree(items: RedisManageKeyItem[]): KeyTreeNode[] {
  const roots: KeyTreeNode[] = [];
  const index = new Map<string, KeyTreeNode>();
  const nodeOf = (path: string): KeyTreeNode => {
    const existing = index.get(path);
    if (existing) return existing;
    const name = path.substring(path.lastIndexOf(":") + 1) || path;
    const created: KeyTreeNode = { name, path, children: [], keys: [] };
    index.set(path, created);
    const parentPath = path.includes(":") ? path.substring(0, path.lastIndexOf(":")) : "";
    if (parentPath) nodeOf(parentPath).children.push(created);
    else roots.push(created);
    return created;
  };
  for (const item of items) nodeOf(item.key).keys.push(item);
  const sortNode = (n: KeyTreeNode): void => {
    n.children.sort((a, b) => a.name.localeCompare(b.name));
    n.keys.sort((a, b) => a.key.localeCompare(b.key));
    n.children.forEach(sortNode);
  };
  roots.forEach(sortNode);
  return roots;
}

/**
 * 展开状态拍平树为行列表
 * @param nodes 树节点
 * @param depth 层级
 * @param expandedSet 已展开集合
 */
function flattenTree(nodes: KeyTreeNode[], depth: number, expandedSet: Set<string>): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const n of nodes) {
    const isOpen = expandedSet.has(n.path);
    rows.push({ kind: "node", path: n.path, name: n.name, depth, expanded: isOpen, hasChildren: n.children.length > 0 });
    if (!isOpen) continue;
    if (n.children.length) rows.push(...flattenTree(n.children, depth + 1, expandedSet));
    for (const k of n.keys) {
      rows.push({
        kind: "leaf",
        path: k.key,
        name: k.key.substring(k.key.lastIndexOf(":") + 1) || k.key,
        depth: depth + 1,
        expanded: false,
        hasChildren: false,
        item: k,
      });
    }
  }
  return rows;
}

const treeRows = computed<TreeRow[]>(() => flattenTree(buildTree(keys.value), 0, expanded.value));

/**
 * 展开/收起树节点
 * @param path 节点路径
 */
function toggleExpand(path: string): void {
  const next = new Set(expanded.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  expanded.value = next;
}

// ==================== 选择 / 勾选 ====================
/**
 * 勾选/取消勾选键（批量删除用）
 * @param key 键名
 */
function toggleCheck(key: string): void {
  if (checkedKeys.value.includes(key)) {
    checkedKeys.value = checkedKeys.value.filter(k => k !== key);
  } else {
    checkedKeys.value = [...checkedKeys.value, key];
  }
}

/**
 * 行点击：选中并加载详情；树形叶子直接选中
 * @param item 键项
 */
function onRowClick(item: RedisManageKeyItem): void {
  void selectKey(item.key);
}

// ==================== 键详情 ====================
/**
 * 选中键并加载详情
 * @param key 键名
 */
async function selectKey(key: string): Promise<void> {
  selectedKey.value = key;
  detailLoading.value = true;
  try {
    const d = await getRedisKeyDetail(selectedDatasourceId.value!, db.value, key);
    detail.value = d;
    editTtl.value = d?.ttl ?? -1;
  } catch (e) {
    detail.value = null;
    ElMessage.error(`加载键详情失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    detailLoading.value = false;
  }
}

/** 刷新当前键详情（类型化组件操作成功后回调） */
function reloadDetail(): void {
  if (selectedKey.value) void selectKey(selectedKey.value);
}

/** 设置 TTL（-1 永久） */
async function applyTtl(): Promise<void> {
  if (!selectedKey.value || !selectedDatasourceId.value) return;
  opBusy.value = true;
  try {
    await expireRedisKey(selectedDatasourceId.value, db.value, selectedKey.value, editTtl.value);
    ElMessage.success("TTL 设置成功");
    await selectKey(selectedKey.value);
    await loadKeys(true);
  } catch (e) {
    ElMessage.error(`设置 TTL 失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    opBusy.value = false;
  }
}

/**
 * 删除单个键
 * @param key 键名
 */
async function removeKey(key: string): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除键 "${key}" 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteRedisKeys(selectedDatasourceId.value!, db.value, [key]);
    ElMessage.success("删除成功");
    if (selectedKey.value === key) {
      selectedKey.value = null;
      detail.value = null;
    }
    await loadKeys(true);
  } catch (e) {
    ElMessage.error(`删除失败：${String((e as Error)?.message ?? e)}`);
  }
}

/** 批量删除勾选的键 */
async function removeChecked(): Promise<void> {
  const list = [...checkedKeys.value];
  if (!list.length) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${list.length} 个键吗？`, "批量删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    for (let i = 0; i < list.length; i += 100) {
      await deleteRedisKeys(selectedDatasourceId.value!, db.value, list.slice(i, i + 100));
    }
    ElMessage.success(`已删除 ${list.length} 个键`);
    if (selectedKey.value && list.includes(selectedKey.value)) {
      selectedKey.value = null;
      detail.value = null;
    }
    await loadKeys(true);
  } catch (e) {
    ElMessage.error(`批量删除失败：${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 删除树节点及其全部子键（前缀命中：`prefix` 精确 + `prefix:*`）
 * @param row 树行
 */
async function removeTreePrefix(row: TreeRow): Promise<void> {
  const prefix = row.path;
  try {
    await ElMessageBox.confirm(`删除「${prefix}」及其全部子键？该操作不可撤销`, "删除子树确认", { type: "warning" });
  } catch {
    return;
  }
  opBusy.value = true;
  try {
    const collected: string[] = [];
    let scanCursor = "0";
    do {
      const res = await scanRedisKeys(selectedDatasourceId.value!, db.value, `${prefix}*`, scanCursor, 500);
      for (const k of res?.keys ?? []) {
        // MATCH 是 glob：`prefix*` 会误伤同前缀兄弟键，这里严格限定本节点与子键
        if (k.key === prefix || k.key.startsWith(`${prefix}:`)) collected.push(k.key);
      }
      scanCursor = res?.nextCursor ?? "0";
    } while (scanCursor !== "0" && collected.length < 5000);
    if (!collected.length) {
      ElMessage.warning("未找到匹配的键");
      return;
    }
    for (let i = 0; i < collected.length; i += 100) {
      await deleteRedisKeys(selectedDatasourceId.value!, db.value, collected.slice(i, i + 100));
    }
    ElMessage.success(`已删除 ${collected.length} 个键`);
    if (selectedKey.value && collected.includes(selectedKey.value)) {
      selectedKey.value = null;
      detail.value = null;
    }
    await loadKeys(true);
  } catch (e) {
    ElMessage.error(`删除子树失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    opBusy.value = false;
  }
}

// ==================== 新增键 ====================
function openNewKey(): void {
  newKeyForm.value = {
    key: "",
    type: "STRING",
    value: "",
    ttl: -1,
    hashRows: [{ field: "", value: "" }],
    listText: "",
    setText: "",
    zsetRows: [{ member: "", score: 0 }],
  };
  newKeyDialog.value = true;
}

async function submitNewKey(): Promise<void> {
  const f = newKeyForm.value;
  if (!f.key.trim()) {
    ElMessage.warning("请输入键名");
    return;
  }
  if (!selectedDatasourceId.value) return;
  const body: Parameters<typeof createRedisKey>[2] = {
    key: f.key.trim(),
    type: f.type,
    ttl: f.ttl,
    value: f.value,
  };
  if (f.type === "HASH") {
    body.hashFields = f.hashRows.filter(r => r.field.trim()).map(r => ({ field: r.field.trim(), value: r.value }));
  } else if (f.type === "LIST") {
    body.listItems = f.listText.split("\n").map(s => s.trim()).filter(Boolean);
  } else if (f.type === "SET") {
    body.setItems = f.setText.split("\n").map(s => s.trim()).filter(Boolean);
  } else if (f.type === "ZSET") {
    body.zsetMembers = f.zsetRows.filter(r => r.member.trim()).map(r => ({ member: r.member.trim(), score: Number(r.score) }));
  }
  newKeySaving.value = true;
  try {
    await createRedisKey(selectedDatasourceId.value, db.value, body);
    ElMessage.success("创建成功");
    newKeyDialog.value = false;
    await loadKeys(true);
    await selectKey(f.key.trim());
  } catch (e) {
    ElMessage.error(`创建失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    newKeySaving.value = false;
  }
}

// ==================== INFO ====================
async function openInfo(): Promise<void> {
  if (!selectedDatasourceId.value) return;
  infoDialog.value = true;
  infoLoading.value = true;
  try {
    infoMap.value = await fetchRedisInfo(selectedDatasourceId.value);
  } catch (e) {
    infoMap.value = {};
    ElMessage.error(`读取 INFO 失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    infoLoading.value = false;
  }
}

// ==================== Stream 消息 ====================
function openStreamDialog(): void {
  streamBody.value = "{}";
  streamDialog.value = true;
}

async function submitStream(): Promise<void> {
  if (!selectedKey.value || !selectedDatasourceId.value) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(streamBody.value);
  } catch {
    ElMessage.error("JSON 格式错误");
    return;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    ElMessage.error("消息体需为 JSON 对象，如 {\"field\":\"value\"}");
    return;
  }
  const fields = Object.entries(parsed as Record<string, unknown>).map(([field, value]) => ({
    field,
    value: typeof value === "object" ? JSON.stringify(value) : String(value),
  }));
  if (!fields.length) {
    ElMessage.error("消息体至少一个字段");
    return;
  }
  opBusy.value = true;
  try {
    await redisStreamAdd(selectedDatasourceId.value, db.value, selectedKey.value, fields);
    ElMessage.success("添加成功");
    streamDialog.value = false;
    await selectKey(selectedKey.value);
  } catch (e) {
    ElMessage.error(`添加失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    opBusy.value = false;
  }
}

// ==================== 切换 ====================
watch(selectedDatasourceId, () => {
  db.value = 0;
  selectedKey.value = null;
  detail.value = null;
  refreshAll();
});
watch(db, () => {
  selectedKey.value = null;
  detail.value = null;
  void loadKeys(true);
});

onMounted(async () => {
  await loadDatasources();
  if (selectedDatasourceId.value) {
    await loadDatabases();
    await loadKeys(true);
  }
});

const dbOptions = (): { label: string; value: number }[] =>
  databases.value.map(d => ({ label: `db${d.db} (${d.keys})`, value: d.db }));

const INFO_LABELS: Record<string, string> = {
  redis_version: "Redis 版本",
  os: "操作系统",
  uptime_in_seconds: "运行时长(秒)",
  connected_clients: "连接数",
  used_memory_human: "已用内存",
  used_memory_peak_human: "内存峰值",
  instantaneous_ops_per_sec: "QPS",
  keyspace_hits: "命中次数",
  keyspace_misses: "未命中次数",
  role: "角色",
  maxmemory_human: "最大内存",
  redis_mode: "模式",
  tcp_port: "端口",
  process_id: "进程 ID",
};
</script>

<template>
  <div class="rc" :class="{ resizing }">
    <!-- 数据源工具条 -->
    <div class="rc-bar">
      <ReSelect
        v-model="selectedDatasourceId"
        placeholder="选择 Redis 数据源"

        style="width: 240px"
        filterable
        :options="datasources.map(d => ({ label: `${d.name} [${d.host}:${d.port}]`, value: d.id }))"
      />
      <ReSelect
        v-model="db"
        placeholder="选择库"

        style="width: 150px"
        :options="dbOptions()"
        :loading="dbLoading"
      />
      <span class="rc-bar-spacer" />
      <ReButton icon="InfoFilled" :show-text="true" :disabled="!selectedDatasourceId" @click="openInfo">信息</ReButton>
      <ReButton icon="RefreshRight" :show-text="true" :loading="keysLoading" @click="refreshAll">刷新</ReButton>
    </div>

    <!-- 主体：左键浏览器 + 右详情 -->
    <div class="rc-body">
      <!-- 左侧 -->
      <div class="rc-left" :style="{ width: leftWidth + 'px' }">
        <div class="rc-search">
          <ReInput
            v-model="pattern"
            placeholder="搜索键…（支持 user:* 通配）"
            clearable
            prefix-icon="Search"
            @keyup.enter="loadKeys(true)"
          />
          <ReButton icon="Search" type="primary" layout="square" title="搜索" :loading="keysLoading" @click="loadKeys(true)" />
        </div>

        <div class="rc-meta">
          <span>{{ keys.length }} 键</span>
          <span class="rc-meta-spacer" />
          <ReButton
            icon="Grid"
            layout="square"

            :type="viewMode === 'flat' ? 'primary' : ''"
            title="平铺"
            @click="viewMode = 'flat'"
          />
          <ReButton
            icon="Share"
            layout="square"

            :type="viewMode === 'tree' ? 'primary' : ''"
            title="树形"
            @click="viewMode = 'tree'"
          />
        </div>

        <!-- 平铺列表 -->
        <div v-if="viewMode === 'flat'" class="rc-list">
          <ReEmpty v-if="!keysLoading && keys.length === 0" description="暂无键，搜索或新增" :image-size="50" />
          <div
            v-for="k in keys"
            :key="k.key"
            class="rc-row"
            :class="{ active: selectedKey === k.key }"
            @click="onRowClick(k)"
          >
            <ElCheckbox
              class="rc-check"
              :model-value="checkedKeys.includes(k.key)"
              @click.stop
              @change="toggleCheck(k.key)"
            />
            <span class="rc-badge" :style="{ '--tile': typeColor(k.type) }">{{ k.type }}</span>
            <span class="rc-key" :title="k.key">{{ k.key }}</span>
            <span class="rc-ttl" :class="{ 'is-forever': k.ttl < 0 }">
              <ReIcon :name="k.ttl < 0 ? 'Timer' : 'Clock'" :size="12" />
              {{ k.ttl < 0 ? "永久" : k.ttl + "s" }}
            </span>
            <ReButton icon="Delete" layout="square" class="rc-del" title="删除" @click.stop="removeKey(k.key)" />
          </div>
        </div>

        <!-- 树形列表 -->
        <div v-else class="rc-list">
          <ReEmpty v-if="!keysLoading && treeRows.length === 0" description="暂无键，搜索或新增" :image-size="50" />
          <template v-for="row in treeRows" :key="row.kind + ':' + row.path">
            <div
              v-if="row.kind === 'node'"
              class="rc-row rc-row--node"
              :style="{ paddingLeft: 10 + row.depth * 16 + 'px' }"
            >
              <ReIcon
                :name="row.hasChildren ? (row.expanded ? 'ArrowDown' : 'ArrowRight') : 'Minus'"
                :size="12"
                class="rc-arrow"
                @click.stop="row.hasChildren && toggleExpand(row.path)"
              />
              <ReIcon :name="row.expanded ? 'FolderOpened' : 'Folder'" :size="15" class="rc-folder" />
              <span class="rc-key" :title="row.path" @click="row.hasChildren && toggleExpand(row.path)">{{ row.name }}</span>
              <ReButton icon="Delete" layout="square" class="rc-del" title="删除该前缀及子键" @click.stop="removeTreePrefix(row)" />
            </div>
            <div
              v-else
              class="rc-row"
              :class="{ active: selectedKey === row.path }"
              :style="{ paddingLeft: 10 + row.depth * 16 + 'px' }"
              @click="row.item && onRowClick(row.item)"
            >
              <span class="rc-dot" />
              <span class="rc-badge" :style="{ '--tile': typeColor(row.item?.type) }">{{ row.item?.type }}</span>
              <span class="rc-key" :title="row.path">{{ row.name }}</span>
              <span class="rc-ttl" :class="{ 'is-forever': (row.item?.ttl ?? 0) < 0 }">
                <ReIcon :name="(row.item?.ttl ?? 0) < 0 ? 'Timer' : 'Clock'" :size="12" />
                {{ (row.item?.ttl ?? 0) < 0 ? "永久" : (row.item?.ttl ?? 0) + "s" }}
              </span>
              <ReButton icon="Delete" layout="square" class="rc-del" title="删除键" @click.stop="row.item && removeKey(row.item.key)" />
            </div>
          </template>
        </div>

        <!-- 底部：批量删除 / 加载更多 / 新增键 -->
        <div class="rc-foot">
          <div v-if="checkedKeys.length" class="rc-foot-row">
            <span class="rc-sel">已选 {{ checkedKeys.length }} 项</span>
            <span class="rc-meta-spacer" />
            <ReButton icon="Delete" type="danger" plain :show-text="true" :disabled="opBusy" @click="removeChecked">删除选中</ReButton>
          </div>
          <ReButton v-if="hasMore" class="rc-more" :loading="keysLoading" @click="loadKeys(false)">加载更多</ReButton>
          <ReButton icon="Plus" type="primary" class="rc-add" @click="openNewKey">新增键</ReButton>
        </div>
      </div>

      <!-- 拖拽调宽（宽度按 id 记录到 storage） -->
      <div class="rc-split" :class="{ active: resizing }" title="拖拽调节宽度" @mousedown.prevent="startResize" />

      <!-- 右侧详情 -->
      <div class="rc-right">
        <div v-if="!selectedKey" class="rc-empty">
          <span class="rc-empty-icon"><ReIcon name="Document" :size="34" /></span>
          <span>选择左侧键查看和编辑</span>
        </div>
        <div v-else class="rc-detail">
          <div class="rc-dhead">
            <span class="rc-dkey" :title="selectedKey">{{ selectedKey }}</span>
            <span v-if="detail" class="rc-badge" :style="{ '--tile': typeColor(detail.type) }">{{ detail.type }}</span>
            <span v-if="detail" class="rc-dsize">{{ detail.size }} 个元素</span>
            <span class="rc-meta-spacer" />
            <span class="rc-ttl-edit">
              TTL
              <ReInputNumber v-model="editTtl" :min="-1" layout="modern" style="width: 132px" />
              <ReButton :disabled="opBusy" @click="applyTtl">设置</ReButton>
            </span>
            <ReButton icon="RefreshRight" :loading="detailLoading" title="刷新详情与 TTL" @click="reloadDetail">刷新</ReButton>
            <ReButton type="danger" plain @click="removeKey(selectedKey)">删除键</ReButton>
          </div>
          <div class="rc-dbody">
            <div v-if="detailLoading" class="rc-loading">加载中...</div>
            <component
              :is="detailComponent"
              v-else-if="detail && detailComponent"
              :datasource-id="selectedDatasourceId!"
              :db="db"
              :redis-key="selectedKey"
              :detail="detail"
              @refresh="reloadDetail"
              @add="openStreamDialog"
            />
            <pre v-else-if="detail" class="rc-raw">{{ JSON.stringify(detail.value, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增键弹窗 -->
    <ReDialog v-model="newKeyDialog" title="新增 Redis 键" width="560px">
      <div class="rc-dialog-body">
        <ReForm label-position="top" class="rc-form">
          <ReFormItem label="键名" required class="is-full">
            <ReInput v-model="newKeyForm.key" placeholder="如 user:1001" />
          </ReFormItem>
          <ReFormItem label="类型">
            <ReSelect v-model="newKeyForm.type" style="width: 100%" :options="[
              { label: 'STRING', value: 'STRING' },
              { label: 'HASH', value: 'HASH' },
              { label: 'LIST', value: 'LIST' },
              { label: 'SET', value: 'SET' },
              { label: 'ZSET', value: 'ZSET' },
            ]" />
          </ReFormItem>
          <ReFormItem label="TTL(秒)">
            <ReInputNumber v-model="newKeyForm.ttl" :min="-1" layout="modern" style="width: 100%" />
            <span class="rc-tip">-1 永久</span>
          </ReFormItem>

          <ReFormItem v-if="newKeyForm.type === 'STRING'" label="值" class="is-full">
            <ReInput v-model="newKeyForm.value" type="textarea" :rows="4" placeholder="STRING 值" />
          </ReFormItem>

          <ReFormItem v-else-if="newKeyForm.type === 'HASH'" label="字段" class="is-full">
            <div class="rc-newrows">
              <div v-for="(r, i) in newKeyForm.hashRows" :key="i" class="rc-newrow">
                <ReInput v-model="r.field" placeholder="字段" />
                <ReInput v-model="r.value" placeholder="值" />
                <ReButton icon="Delete" layout="square" title="删除" @click="newKeyForm.hashRows.splice(i, 1)" />
              </div>
              <ReButton icon="Plus" @click="newKeyForm.hashRows.push({ field: '', value: '' })">加一行</ReButton>
            </div>
          </ReFormItem>

          <ReFormItem v-else-if="newKeyForm.type === 'LIST'" label="元素" class="is-full">
            <ReInput v-model="newKeyForm.listText" type="textarea" :rows="5" placeholder="每行一个元素" />
          </ReFormItem>

          <ReFormItem v-else-if="newKeyForm.type === 'SET'" label="成员" class="is-full">
            <ReInput v-model="newKeyForm.setText" type="textarea" :rows="5" placeholder="每行一个成员" />
          </ReFormItem>

          <ReFormItem v-else-if="newKeyForm.type === 'ZSET'" label="成员" class="is-full">
            <div class="rc-newrows">
              <div v-for="(r, i) in newKeyForm.zsetRows" :key="i" class="rc-newrow">
                <ReInput v-model="r.member" placeholder="成员" />
                <ReInputNumber v-model="r.score" style="width: 120px" />
                <ReButton icon="Delete" layout="square" title="删除" @click="newKeyForm.zsetRows.splice(i, 1)" />
              </div>
              <ReButton icon="Plus" @click="newKeyForm.zsetRows.push({ member: '', score: 0 })">加一行</ReButton>
            </div>
          </ReFormItem>
        </ReForm>
      </div>
      <template #footer>
        <ReButton @click="newKeyDialog = false">取消</ReButton>
        <ReButton type="primary" :loading="newKeySaving" @click="submitNewKey">创建</ReButton>
      </template>
    </ReDialog>

    <!-- INFO 弹窗 -->
    <ReDialog v-model="infoDialog" title="Redis 服务信息" width="520px">
      <div v-loading="infoLoading" class="rc-info">
        <div v-for="(label, key) in INFO_LABELS" :key="key" class="rc-inforow">
          <span class="rc-infokey">{{ label }}</span>
          <span class="rc-infoval">{{ infoMap[key] ?? "—" }}</span>
        </div>
      </div>
    </ReDialog>

    <!-- Stream 消息弹窗 -->
    <ReDialog v-model="streamDialog" title="添加 Stream 消息" width="500px">
      <div class="rc-dialog-body">
        <ReForm label-position="top" class="rc-form">
          <ReFormItem label="消息体(JSON)" class="is-full">
            <ReInput v-model="streamBody" type="textarea" :rows="6" placeholder='{"field1":"value1"}' />
          </ReFormItem>
        </ReForm>
      </div>
      <template #footer>
        <ReButton @click="streamDialog = false">取消</ReButton>
        <ReButton type="primary" :loading="opBusy" @click="submitStream">添加</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   Redis 控制中心（对齐 UI 稿：左键浏览器 + 右详情，双白卡）
   ============================================================ */
.rc {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
  min-height: 560px;
  padding: 4px 4px 8px;
}

/* 工具条 */
.rc-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.rc-bar-spacer { flex: 1; }

/* 主体（左栏宽度可拖拽，间距由 split 承担） */
.rc-body { display: flex; gap: 0; flex: 1; min-height: 0; }
.rc-split {
  flex: none;
  width: 16px;
  position: relative;
  cursor: col-resize;
}
.rc-split::after {
  content: "";
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: 1px;
  background: transparent;
  transition: background 0.15s ease;
}
.rc-split:hover::after,
.rc-split.active::after { background: var(--el-color-primary-light-5); }
.rc.resizing { user-select: none; }
.rc.resizing .rc-split::after { background: var(--el-color-primary); }

/* 左：键浏览器 */
.rc-left {
  width: 340px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: hidden;
}
.rc-search { display: flex; gap: 8px; padding: 14px 14px 10px; }
.rc-search :deep(.el-input) { flex: 1; }
.rc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rc-meta-spacer { flex: 1; }

.rc-list { flex: 1; overflow-y: auto; padding: 0 8px 8px; }
.rc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s ease;
}
.rc-row:hover { background: var(--el-fill-color-light); }
.rc-row.active { background: var(--el-color-primary-light-9); }
.rc-row.active .rc-key { color: var(--el-color-primary); }
.rc-check { flex: none; margin-right: 0; }
.rc-badge {
  flex: none;
  padding: 1px 7px;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.02em;
  --tile: var(--el-color-primary);
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
  border-radius: var(--el-radius-sm, 6px);
}
.rc-key {
  flex: 1;
  min-width: 0;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rc-ttl {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}
.rc-ttl.is-forever { color: var(--el-color-success); }
.rc-del { flex: none; opacity: 0; }
.rc-row:hover .rc-del { opacity: 1; }
.rc-row--node { cursor: default; }
.rc-arrow { flex: none; color: var(--el-text-color-placeholder); cursor: pointer; }
.rc-folder { flex: none; color: var(--el-color-warning); }
.rc-dot {
  width: 4px;
  height: 4px;
  flex: none;
  margin: 0 4px 0 2px;
  border-radius: 50%;
  background: var(--el-border-color);
}
.rc-sel { font-size: 12px; color: var(--el-text-color-secondary); }

.rc-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.rc-foot-row { display: flex; align-items: center; gap: 8px; }
.rc-more, .rc-add { width: 100%; }

/* 右：详情 */
.rc-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: hidden;
}
.rc-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.rc-empty-icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}

.rc-detail { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.rc-dhead {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.rc-dkey {
  max-width: 46%;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rc-dsize { font-size: 12px; color: var(--el-text-color-secondary); }
.rc-ttl-edit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rc-dbody { flex: 1; overflow-y: auto; padding: 16px 18px; }
.rc-loading { padding: 40px; text-align: center; color: var(--el-text-color-placeholder); }
.rc-raw {
  padding: 10px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
  border-radius: var(--el-radius-md, 8px);
  overflow: auto;
}

/* 弹窗 */
.rc-dialog-body { padding: 16px 20px 4px; }
.rc-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}
.rc-form :deep(.el-form-item) { margin-bottom: 16px; }
.rc-form :deep(.is-full) { grid-column: 1 / -1; }
.rc-form :deep(.el-form-item__label) {
  width: auto !important;
  height: auto;
  margin-bottom: 6px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-regular);
}
.rc-form :deep(.el-form-item__content) { margin-left: 0 !important; }
@media (max-width: 640px) {
  .rc-form { grid-template-columns: 1fr; }
}
.rc-newrows { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.rc-newrow { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; }
.rc-tip { margin-left: 8px; font-size: 12px; color: var(--el-text-color-placeholder); }

/* INFO */
.rc-info { display: flex; flex-direction: column; gap: 6px; padding: 8px 16px 12px; }
.rc-inforow {
  display: flex;
  justify-content: space-between;
  padding: 6px 4px;
  font-size: 13px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.rc-infokey { color: var(--el-text-color-placeholder); }
.rc-infoval {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  color: var(--el-text-color-primary);
}
</style>
