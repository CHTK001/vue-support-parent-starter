<template>
  <ScContainer
    class="redis-console"
    aside-width="300px"
    :resizable="true"
    :min-aside-width="220"
    @contextmenu.prevent
  >
    <!-- 左侧：搜�?+ �?-->
    <template #aside>
      <div class="left-panel">
        <div class="panel-header">
          <IconifyIconOnline icon="ri:database-2-line" class="header-icon" />
          <span class="header-title">Redis 数据</span>
        </div>
        <el-input
          v-model="keyword"
          placeholder="搜索 Key..."
          clearable
          class="search-input"
          @change="loadRoot"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-tree
          ref="treeRef"
          class="tree"
          :data="treeData"
          :props="treeProps"
          :load="loadChildrenLazy"
          lazy
          node-key="path"
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
          @node-contextmenu="handleNodeContextMenu"
        >
          <template #default="{ node, data }">
            <IconifyIconOnline
              :icon="getRedisNodeIcon(node, data)"
              class="node-icon"
            />
            <span class="node-content">
              <span class="node-name">{{ data.name }}</span>
              <span v-if="data.type" class="node-type">{{ data.type }}</span>
            </span>
          </template>
        </el-tree>
      </div>
    </template>

    <!-- 主内容区 -->
    <div class="main-panel">
      <!-- 头部工具�?-->
      <div class="main-header">
        <div class="path-info">
          <IconifyIconOnline icon="ri:key-2-line" class="path-icon" />
          <span class="path-text">{{ currentPath || "未选择 Key" }}</span>
          <el-tag
            v-if="currentType"
            size="small"
            type="danger"
            effect="light"
            >{{ currentType }}</el-tag
          >
          <el-tag v-if="nodeValue?.properties?.ttl" size="small" effect="plain"
            >TTL: {{ nodeValue?.properties?.ttl }}</el-tag
          >
        </div>
        <div class="toolbar">
          <el-button
            size="small"
            :disabled="!currentPath"
            @click="refreshValue"
          >
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </el-button>
        </div>
      </div>

      <!-- 内容�?-->
      <div class="main-body">
        <template v-if="currentPath">
          <template v-if="valueTypeText">
            <!-- valueType 分支：根�?properties.valueType 选择展示组件 -->
            <div v-if="valueTypeName === 'boolean'" class="result-wrap">
              <el-switch v-model="vBoolean" disabled />
            </div>
            <div v-else-if="valueTypeName === 'number'" class="result-wrap">
              <el-input :model-value="String(vNumber ?? '')" readonly />
            </div>
            <el-table
              v-else-if="valueTypeName === 'array'"
              :data="vArrayRows"
              size="small"
              border
              height="580px"
            >
              <el-table-column prop="index" label="#" width="70" />
              <el-table-column prop="value" label="�? :min-width="240" />
            </el-table>
            <el-table
              v-else-if="
                valueTypeName === 'dict' ||
                valueTypeName === 'map' ||
                valueTypeName === 'object'
              "
              :data="vDictRows"
              size="small"
              border
              height="580px"
            >
              <el-table-column prop="key" label="�? :min-width="160" />
              <el-table-column prop="value" label="�? :min-width="240" />
            </el-table>
            <div v-else-if="valueTypeName === 'color'" class="result-wrap">
              <div style="display: flex; align-items: center; gap: 12px">
                <el-color-picker v-model="vColor" disabled />
                <span>{{ vColor }}</span>
              </div>
            </div>
            <div
              v-else-if="valueTypeName === 'mail' || valueTypeName === 'email'"
              class="result-wrap"
            >
              <el-link :href="`mailto:${vText}`" target="_blank">{{
                vText
              }}</el-link>
            </div>
            <div
              v-else-if="
                valueTypeName === 'password' || valueTypeName === 'appsecret'
              "
              class="result-wrap"
            >
              <div style="display: flex; align-items: center; gap: 12px">
                <span>{{ secretVisible ? vText : maskedPassword }}</span>
                <el-button
                  size="small"
                  @click="secretVisible = !secretVisible"
                  >{{ secretVisible ? "隐藏" : "显示" }}</el-button
                >
              </div>
            </div>
            <div
              v-else-if="
                valueTypeName === 'textarea' ||
                valueTypeName === 'text' ||
                valueTypeName === 'string'
              "
              class="result-wrap"
            >
              <el-input v-model="vText" type="textarea" :rows="14" readonly />
            </div>
            <div v-else class="result-wrap">
              <pre>{{ pretty(vRaw) }}</pre>
            </div>
          </template>
          <template v-else>
            <!-- STRING -->
            <div v-if="viewerType === 'string'" class="result-wrap">
              <el-input
                v-model="stringValue"
                type="textarea"
                :rows="14"
                readonly
              />
            </div>
            <!-- HASH -->
            <el-table
              v-else-if="viewerType === 'hash'"
              :data="hashRows"
              size="small"
              border
              height="580px"
            >
              <el-table-column prop="field" label="字段" :min-width="160" />
              <el-table-column prop="value" label="�? :min-width="240" />
            </el-table>
            <!-- LIST -->
            <el-table
              v-else-if="viewerType === 'list'"
              :data="listRows"
              size="small"
              border
              height="580px"
            >
              <el-table-column prop="index" label="#" width="70" />
              <el-table-column prop="value" label="�? :min-width="240" />
            </el-table>
            <!-- SET -->
            <el-table
              v-else-if="viewerType === 'set'"
              :data="setRows"
              size="small"
              border
              height="580px"
            >
              <el-table-column prop="value" label="成员" :min-width="240" />
            </el-table>
            <!-- ZSET -->
            <el-table
              v-else-if="viewerType === 'zset'"
              :data="zsetRows"
              size="small"
              border
              height="580px"
            >
              <el-table-column prop="member" label="成员" :min-width="200" />
              <el-table-column prop="score" label="分数" width="120" />
            </el-table>
            <!-- 其他类型：JSON 展示 -->
            <div v-else class="result-wrap">
              <pre>{{ pretty(nodeValue) }}</pre>
            </div>
          </template>
        </template>
        <el-empty v-else description="请选择左侧 Key" />
      </div>

      <!-- 状态栏 -->
      <div class="main-footer">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>

    <!-- 右键菜单 -->
    <CommonContextMenu
      :visible="menuVisible"
      :x="menuX"
      :y="menuY"
      :items="menuItems"
      @select="onMenuSelect"
      @close="menuVisible = false"
    />
  </ScContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, inject } from "vue";
import CommonContextMenu, {
  type MenuItem,
} from "@/components/CommonContextMenu.vue";
import { ElMessage } from "element-plus";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";
import ScContainer from "@repo/components/ScContainer";

import {
  extractArrayFromApi,
  normalizeTreeNode,
} from "@/views/data-management/utils/dataTree";
import {
  getConsoleRoot,
  getConsoleChildren,
  getConsoleNode,
} from "@/api/data-management/system-data";

const props = defineProps<{ id: number }>();

// 使用全局Socket.IO或创建独立连�?
const globalSocket = inject<any>("globalSocket");
let socketConnection: any = null;
let unsubscribeHandlers: any[] = [];

const treeRef = ref<any>();

// 左侧�?
const keyword = ref("");
const treeData = ref<any[]>([]);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };
// 针对大量 key 的分页参�?
const page = ref(1);
const size = ref(200);

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value);
  const records = extractArrayFromApi(res?.data);
  treeData.value = records.map(normalizeTreeNode);
}

const loadChildrenLazy = async (
  node: any,
  resolve: (children: any[]) => void
) => {
  if (!node || node.level === 0) return resolve(treeData.value || []);
  const data = node.data || {};

  if (data.leaf === true) return resolve([]);
  const res = await getConsoleChildren(
    props.id,
    data.path,
    page.value,
    size.value
  );
  resolve(extractArrayFromApi(res?.data).map(normalizeTreeNode));
};

function getRedisNodeIcon(node: any, data: any): string {
  const type = (data?.type || "").toString().toLowerCase();
  if (type.includes("db")) return "ri:database-2-line";
  if (type.includes("key")) return "ri:key-2-line";
  const level = Number(node?.level || 0);
  if (level <= 1) return "ri:database-2-line";
  return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
}

// 右侧视图
const currentPath = ref<string | undefined>(undefined);
const currentType = ref<string>("");
const nodeValue = ref<any>(null);
const statusText = ref("");

// valueType 显示相关
const valueTypeText = computed(() =>
  (
    nodeValue.value?.properties?.valueType ||
    nodeValue.value?.properties?.valuetype ||
    nodeValue.value?.properties?.value_type ||
    ""
  ).toString()
);
const valueTypeName = computed(() => valueTypeText.value.trim().toLowerCase());

const vBoolean = ref<boolean>(false);
const vNumber = ref<number | null>(null);
const vArrayRows = ref<Array<{ index: number; value: string }>>([]);
const vDictRows = ref<Array<{ key: string; value: string }>>([]);
const vColor = ref<string>("#000000");
const vText = ref<string>("");
const vRaw = ref<any>(null);
const secretVisible = ref(false);
const maskedPassword = computed(() =>
  vText.value
    ? "�?.repeat(Math.min(12, Math.max(6, vText.value.length)))
    : "•••••�?
);

// 作为兜底�?Redis 类型渲染状�?
const viewerType = ref<"" | "string" | "hash" | "list" | "set" | "zset">("");
const stringValue = ref<string>("");
const hashRows = ref<Array<{ field: string; value: string }>>([]);
const listRows = ref<Array<{ index: number; value: string }>>([]);
const setRows = ref<Array<{ value: string }>>([]);
const zsetRows = ref<Array<{ member: string; score: number }>>([]);

function clearValueTypeView() {
  vBoolean.value = false;
  vNumber.value = null;
  vArrayRows.value = [];
  vDictRows.value = [];
  vColor.value = "#000000";
  vText.value = "";
  vRaw.value = null;
  secretVisible.value = false;
}

function getNodeActualValue(data: any) {
  const p = (data && data.properties) || {};
  return (
    p.value ?? p.data ?? data?.value ?? data?.data ?? data?.content ?? null
  );
}

function parseBoolean(x: any): boolean {
  const s = String(x).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "on";
}

function ensureColorString(x: any): string {
  const s = String(x || "").trim();
  if (!s) return "#000000";
  const m = s.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (m) return s.startsWith("#") ? s : "#" + s;
  return s; // 保留原�?
}

function normalizeByValueType(val: any) {
  clearValueTypeView();
  vRaw.value = val;
  const t = valueTypeName.value;
  try {
    if (t === "boolean") {
      vBoolean.value = typeof val === "boolean" ? val : parseBoolean(val);
      return;
    }
    if (t === "number") {
      const n = typeof val === "number" ? val : Number(val);
      vNumber.value = isNaN(n) ? null : n;
      return;
    }
    if (t === "array") {
      const arr = Array.isArray(val)
        ? val
        : val
          ? typeof val === "string"
            ? JSON.parse(val)
            : []
          : [];
      vArrayRows.value = (Array.isArray(arr) ? arr : []).map(
        (v: any, i: number) => ({
          index: i,
          value: typeof v === "string" ? v : JSON.stringify(v),
        })
      );
      return;
    }
    if (t === "dict" || t === "map" || t === "object") {
      const obj =
        val && typeof val === "object"
          ? val
          : typeof val === "string"
            ? JSON.parse(val)
            : {};
      vDictRows.value = Object.keys(obj || {}).map((k) => ({
        key: k,
        value: typeof obj[k] === "string" ? obj[k] : JSON.stringify(obj[k]),
      }));
      return;
    }
    if (t === "color") {
      vColor.value = ensureColorString(val);
      return;
    }
    if (t === "mail" || t === "email") {
      vText.value = String(val ?? "");
      return;
    }
    if (t === "password" || t === "appsecret") {
      vText.value = String(val ?? "");
      return;
    }
    if (t === "textarea" || t === "text" || t === "string") {
      if (typeof val === "string") {
        vText.value = tryPrettyJsonString(val);
      } else {
        vText.value = JSON.stringify(val, null, 2);
      }
      return;
    }
  } catch (_) {
    // 解析失败走默�?
  }
  // 默认展示原始�?
  vRaw.value = val;
}

// Redis 类型兜底处理
function normalizeValueForView(val: any) {
  // 清空
  viewerType.value = "";
  stringValue.value = "";
  hashRows.value = [];
  listRows.value = [];
  setRows.value = [];
  zsetRows.value = [];

  const typeText = (
    currentType.value ||
    nodeValue.value?.type ||
    nodeValue.value?.properties?.type ||
    ""
  )
    .toString()
    .toLowerCase();

  // 尝试基于形状推断
  const isArray = Array.isArray(val);
  const isObj = val && typeof val === "object" && !isArray;

  if (typeText.includes("zset")) {
    viewerType.value = "zset";
    const rows: Array<{ member: string; score: number }> = [];
    if (isArray) {
      (val as any[]).forEach((it) => {
        if (it && typeof it === "object") {
          const m =
            (it as any).member ?? (Array.isArray(it) ? it[0] : undefined);
          const s =
            (it as any).score ?? (Array.isArray(it) ? it[1] : undefined);
          if (m !== undefined)
            rows.push({ member: String(m), score: Number(s ?? 0) });
        }
      });
    }
    zsetRows.value = rows;
    return;
  }

  if (typeText.includes("hash") || (isObj && !typeText)) {
    viewerType.value = "hash";
    const entries: Array<{ field: string; value: string }> = [];
    if (isObj) {
      Object.keys(val || {}).forEach((k) =>
        entries.push({
          field: k,
          value: typeof val[k] === "string" ? val[k] : JSON.stringify(val[k]),
        })
      );
    } else if (isArray) {
      (val as any[]).forEach((it) => {
        if (it && typeof it === "object") {
          const f =
            (it as any).field ?? (Array.isArray(it) ? it[0] : undefined);
          const v =
            (it as any).value ?? (Array.isArray(it) ? it[1] : undefined);
          if (f !== undefined)
            entries.push({
              field: String(f),
              value: typeof v === "string" ? v : JSON.stringify(v),
            });
        }
      });
    }
    hashRows.value = entries;
    return;
  }

  if (typeText.includes("list") || (isArray && !typeText)) {
    viewerType.value = "list";
    listRows.value = (Array.isArray(val) ? val : []).map((v, i) => ({
      index: i,
      value: typeof v === "string" ? v : JSON.stringify(v),
    }));
    return;
  }

  if (typeText.includes("set")) {
    viewerType.value = "set";
    setRows.value = (Array.isArray(val) ? val : []).map((v) => ({
      value: typeof v === "string" ? v : JSON.stringify(v),
    }));
    return;
  }

  // 默认按字符串
  viewerType.value = "string";
  stringValue.value =
    typeof val === "string"
      ? tryPrettyJsonString(val)
      : JSON.stringify(val, null, 2);
}

async function handleNodeClick(node: any) {
  currentPath.value = node?.path;
  currentType.value = node?.type || "";
  await refreshValue();
}

async function refreshValue() {
  if (!currentPath.value) return;
  const start = performance.now();
  const res = await getConsoleNode(props.id, currentPath.value);
  nodeValue.value = res?.data;
  const val = getNodeActualValue(nodeValue.value);
  if (valueTypeText.value) {
    normalizeByValueType(val);
  } else {
    normalizeValueForView(val);
  }
  const ms = Math.round(performance.now() - start);
  statusText.value = `加载完成，用�?${ms} ms`;
}

function pretty(val: any) {
  try {
    if (typeof val === "string") {
      return tryPrettyJsonString(val);
    }
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function tryPrettyJsonString(src: string): string {
  const s = (src || "").trim();
  if (!s) return src;
  const first = s[0];
  const last = s[s.length - 1];
  // 粗略判断可能�?JSON 文本
  if ((first === "{" && last === "}") || (first === "[" && last === "]")) {
    try {
      const obj = JSON.parse(s);
      return JSON.stringify(obj, null, 2);
    } catch {
      return src; // 非合�?JSON，原样返�?
    }
  }
  return src;
}

// 右键菜单状�?
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const contextNode = ref<any | null>(null);
const menuItems = ref<MenuItem[]>([]);

function buildMenuItems(data: any): MenuItem[] {
  const items: MenuItem[] = [];
  if (data && data.leaf !== true) {
    items.push({ key: "refresh-node", label: "刷新", icon: "ri:refresh-line" });
  }
  items.push({
    key: "open",
    label: "打开",
    icon: "ri:folder-open-line",
    disabled: !data?.path,
  });
  items.push({
    key: "copy-key",
    label: "复制 Key 名称",
    icon: "ri:file-copy-line",
    disabled: !data?.name,
  });
  // 删除 Key：若不需要可移除此项
  items.push({
    key: "delete-key",
    label: "删除 Key",
    icon: "ri:delete-bin-line",
    disabled: !data?.path,
  });
  return items;
}

function handleNodeContextMenu(event: MouseEvent, data: any) {
  contextNode.value = data;
  menuItems.value = buildMenuItems(data);
  if (!menuItems.value.length) return;
  menuX.value = event.clientX;
  menuY.value = event.clientY;
  menuVisible.value = true;
  const hide = () => {
    menuVisible.value = false;
    document.removeEventListener("click", hide);
  };
  document.addEventListener("click", hide);
}

async function onMenuSelect(key: string) {
  const node = contextNode.value;
  if (!node) return;
  switch (key) {
    case "refresh-node":
      await refreshContextNodeChildren();
      break;
    case "open":
      await handleNodeClick(node);
      break;
    case "copy-key":
      await copyKeyName(node);
      break;
    case "delete-key":
      await deleteKey(node);
      break;
  }
}

/**
 * 刷新当前右键节点的子节点
 */
async function refreshContextNodeChildren() {
  const node = contextNode.value;
  if (!node?.path) return;
  try {
    const res = await getConsoleChildren(props.id, node.path);
    const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
    if (
      treeRef.value &&
      typeof treeRef.value.updateKeyChildren === "function"
    ) {
      // �?API 覆盖子节点，避免越刷越多
      treeRef.value.updateKeyChildren(node.path, records);
    } else {
      // 兜底：直接覆盖数�?
      node.children = records;
    }
    node.leaf = records.length === 0;
  } catch (e) {
    // ignore
  } finally {
    menuVisible.value = false;
  }
}

async function copyKeyName(node: any) {
  const name = node?.name || "";
  if (!name) return;
  await navigator.clipboard.writeText(name);
}

async function deleteKey(node: any) {
  if (!node?.path) return;
  try {
    const ok = window.confirm(`确认删除 Key�?{node.name} ?`);
    if (!ok) return;
    const { executeConsole } = await import("@/api/system-data");
    await executeConsole(props.id, `DEL ${node.path}`, "redis");
    await refreshContextNodeChildren();
    if (currentPath.value === node.path) {
      currentPath.value = undefined;
      nodeValue.value = null;
      statusText.value = "当前 Key 已删�?;
    }
  } catch (_) {}
}

onBeforeUnmount(() => {
  // 清理Socket.IO事件监听
  unsubscribeHandlers.forEach((handler) => handler());
  unsubscribeHandlers = [];

  // 如果是独立连接，断开连接
  if (socketConnection && !globalSocket?.value) {
    socketConnection.disconnect();
  }

  socketConnection = null;
});

onMounted(async () => {
  await loadRoot();

  // 建立Socket.IO连接
  if (globalSocket?.value) {
    // 使用全局Socket.IO连接
    socketConnection = globalSocket.value;
  } else {
    // 创建独立的Socket.IO连接
    const config = getConfig();
    socketConnection = socket(splitToArray(config.SocketUrl), undefined, {});
  }

  if (socketConnection) {
    // 监听系统数据监听事件
    const listenHandler = (data: any) => {
      if (data.settingId === props.id && data.type === "redis") {
        try {
          console.log("Redis Console received message:", data);
          if (data.messageType === "status") {
            console.log("Status update:", data.content);
            statusText.value = data.content || "";
          } else if (data.messageType === "log") {
            ElMessage.info(data.content || "");
          } else if (data.messageType === "error") {
            ElMessage.error(data.content || "操作出现错误");
          }
        } catch (error) {
          console.error("Error processing console message:", error);
        }
      }
    };

    const logHandler = (data: any) => {
      if (data.settingId === props.id && data.type === "redis") {
        try {
          console.log("Redis Console log:", data);
          ElMessage.info(data.content || "");
        } catch (error) {
          console.error("Error processing log message:", error);
        }
      }
    };

    socketConnection.on("system/data/listen", listenHandler);
    socketConnection.on("system/data/log", logHandler);

    unsubscribeHandlers.push(
      () => socketConnection.off("system/data/listen", listenHandler),
      () => socketConnection.off("system/data/log", logHandler)
    );
  }
});
</script>

<style scoped lang="scss">
/* Redis 控制台容�?*/
.redis-console {
  height: calc(100vh - 16px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  :deep(.sc-container__aside) {
    background: transparent;
    border: none;
    padding: 8px;
    overflow: visible;
  }

  :deep(.sc-container__main) {
    background: transparent;
    padding: 8px;
    padding-left: 12px;
  }

  :deep(.sc-container__resize-handle--vertical) {
    background: transparent;

    &::before {
      background: #cbd5e1;
    }

    &:hover {
      background: rgba(239, 68, 68, 0.1);

      &::before {
        background: #ef4444;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }
    }
  }
}

/* 左侧面板 */
.left-panel {
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;

  .header-icon {
    font-size: 20px;
    color: #ef4444;
  }

  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
  }
}

/* 搜索�?*/
.search-input {
  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  }
}

/* 树形组件 */
.tree {
  margin-top: 12px;
  flex: 1;
  overflow: auto;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  padding: 8px;

  :deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 8px;
    margin: 2px 0;
    padding: 0 8px;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
  }
}

.node-icon {
  margin-right: 6px;
  font-size: 16px;
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-type {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 8px;
}

/* 主内容面�?*/
.main-panel {
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 头部工具�?*/
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  gap: 16px;
}

.path-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  .path-icon {
    font-size: 18px;
    color: #ef4444;
  }

  .path-text {
    font-size: 13px;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.el-button) {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

/* 内容�?*/
.main-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
}

/* 结果包装�?*/
.result-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);

  pre {
    margin: 0;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #334155;
    overflow-x: auto;
  }
}

/* 表格美化 */
.main-body :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;

  &::before {
    display: none;
  }

  th.el-table__cell {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
    font-weight: 600;
    color: #991b1b;
    font-size: 13px;
    border-bottom: 2px solid #fecaca !important;
    padding: 12px 8px;
  }

  td.el-table__cell {
    padding: 10px 8px;
    font-size: 13px;
    color: #475569;
    border-bottom: 1px solid #f1f5f9 !important;
  }

  tr:hover > td.el-table__cell {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
  }
}

/* 输入框美�?*/
.main-body :deep(.el-textarea__inner) {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #fafbfc;
}

/* 底部状态栏 */
.main-footer {
  height: 32px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #64748b;
  font-size: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* 空状态美�?*/
.main-body :deep(.el-empty) {
  padding: 60px 0;

  .el-empty__description {
    color: #94a3b8;
    font-size: 14px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.left-panel,
.main-panel {
  animation: fadeIn 0.4s ease forwards;
}

.main-panel {
  animation-delay: 0.1s;
}
</style>
