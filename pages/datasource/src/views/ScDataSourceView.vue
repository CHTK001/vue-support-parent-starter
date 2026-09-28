<script setup lang="ts">
/**
 * 数据源中心（@pages/datasource）
 *
 * 左右两栏布局：
 *   左栏 —— 状态过滤 + 关键词搜索 + 数据源卡片列表 + 添加入口；
 *   右栏 —— 页头（面包屑 + 搜索 / 刷新 / 新增）+ 详情头 + 页签
 *           （概览 / 连接配置 / 监控指标 / 操作日志）。
 * 支持 JDBC/Redis/InfluxDB/Neo4j/Nacos/ZooKeeper/Nginx：
 * 列表 + 新增/编辑/删除 + 连通性测试 + 表结构浏览 + 按类型跳转对应管理页。
 * 数据来源：后端 spring-support-datasource-hub-starter 的 /ms/datasource/*。
 *
 * 视觉：koi 变量（--el-* / --metric-* / --status-*），颜色全部走令牌，暗色自动适配。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, Clock, Timer } from "@element-plus/icons-vue";
// 组件全部显式引入：本页被采集台与监控台共用，两个应用都不保证全局注册 Re*，
// 只靠全局注册会出现「卡片能显示但按钮/表格不渲染」的问题。
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReForm from "@repo/ui/re-form";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTab from "@repo/ui/re-tab";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { ReFormItem } from "@repo/ui/re-kit";
import { formatDuration } from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import {
  fetchDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSource,
  fetchDataSourceTypes,
  fetchDatasourceTables,
  fetchDatasourceColumns,
  type CollectColumn,
  type DataSourceInfo,
  type DataSourceTestResult,
} from "../api";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { ReTabItem } from "@repo/ui/re-tab";

/**
 * 宿主应用注入的额外页签（如监控台的「数据表」= 数据库管理器内嵌）。
 *
 * <p>本页位于共享包 @pages/datasource，采集台与监控台都在用，
 * 因此**不能**在这里 import 任何宿主应用自己的 view —— 采集台构建时会直接失败。
 * 需要把应用级页面并入数据源中心时，由宿主通过 extraTabs + 同名插槽注入：
 * 页签名即插槽名，插槽会收到当前选中的数据源。</p>
 */
const props = withDefaults(
  defineProps<{
    /** 追加到内置页签之后的宿主页签；插槽名 = name，插槽参数 = { datasource } */
    extraTabs?: ReTabItem[];
  }>(),
  { extraTabs: () => [] },
);

/** 左栏状态过滤键：all 全部 / online 在线 / abnormal 异常 / offline 离线 */
type StatusFilterKey = "all" | "online" | "abnormal" | "offline";

/** 左栏状态过滤项 */
interface StatusFilterItem {
  /** 过滤键 */
  key: StatusFilterKey;
  /** 展示文案 */
  label: string;
  /** 圆点颜色（应用层语义色，带令牌兜底） */
  color: string;
  /** 数量徽标；null 表示现有模型没有该口径，不展示 */
  count: number | null;
}

const router = useRouter();

const list = ref<DataSourceInfo[]>([]);
const loading = ref(false);
const types = ref<string[]>([]);

// 新增/编辑弹窗
const dialogVisible = ref(false);
const editing = ref<DataSourceInfo | null>(null);
const form = ref<Partial<DataSourceInfo>>({});
const saving = ref(false);

// 测试连接
const testing = ref<number | null>(null);

// 左栏筛选 / 右栏选中（纯前端交互状态）
/** 左栏与页头共享的搜索关键词 */
const keyword = ref("");
/** 左栏当前状态过滤键 */
const statusKey = ref<StatusFilterKey>("all");
/** 右栏当前页签 */
const activeTab = ref("overview");
/** 当前选中的数据源 ID；未选中时详情回落到列表第一条 */
const currentId = ref<number | null>(null);

/** 数据源类型图标和语义色（统一走 koi 变量） */
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  jdbc: { icon: "Coin", color: "var(--metric-cpu, var(--el-color-primary))", label: "JDBC 数据库" },
  redis: { icon: "Coin", color: "var(--metric-redis, var(--el-color-danger))", label: "Redis" },
  influxdb: { icon: "Coin", color: "var(--el-color-success)", label: "InfluxDB" },
  neo4j: { icon: "Coin", color: "var(--metric-mem, var(--el-color-primary))", label: "Neo4j 图数据库" },
  nacos: { icon: "Coin", color: "var(--metric-disk, var(--el-color-warning))", label: "Nacos 配置中心" },
  zookeeper: { icon: "Coin", color: "var(--el-color-warning)", label: "ZooKeeper" },
  nginx: { icon: "Connection", color: "var(--metric-net, var(--el-color-info))", label: "Nginx" },
};

const typeMeta = (type: string) => TYPE_META[type] || { icon: "Coin", color: "var(--el-text-color-placeholder)", label: type };

/** 加载数据源列表 */
const load = async () => {
  loading.value = true;
  try {
    const [data, typeList] = await Promise.all([fetchDataSources(), fetchDataSourceTypes()]);
    list.value = data ?? [];
    types.value = typeList ?? ["jdbc", "redis", "influxdb", "neo4j", "nacos", "zookeeper"];
  } catch (e) {
    ElMessage.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
};

/** 打开新增弹窗 */
const openCreate = () => {
  editing.value = null;
  // controlMode/controlTarget 显式给空串而不是不写：
  // 不写的话字段在 form 里缺失，编辑弹窗里的选择器拿不到当前值
  form.value = {
    type: "jdbc",
    name: "",
    host: "127.0.0.1",
    port: 3306,
    username: "",
    password: "",
    database: "",
    remark: "",
    controlMode: "",
    controlTarget: ""
  };
  dialogVisible.value = true;
};

/** 打开编辑弹窗 */
const openEdit = (item: DataSourceInfo) => {
  editing.value = item;
  form.value = { ...item };
  dialogVisible.value = true;
};

/** 保存 */
const save = async () => {
  if (!form.value.name?.trim()) {
    ElMessage.warning("请输入数据源名称");
    return;
  }
  if (!form.value.type) {
    ElMessage.warning("请选择数据源类型");
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      // id 声明为可选（新建时无 id），但更新必须落到某条既有记录
      if (editing.value.id == null) {
        ElMessage.warning("数据源缺少 ID，无法更新");
        return;
      }
      await updateDataSource(editing.value.id, form.value);
      ElMessage.success("更新成功");
    } else {
      await createDataSource(form.value);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
};

/** 删除 */
const remove = async (item: DataSourceInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除数据源 "${item.name}" 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    if (item.id == null) {
      ElMessage.warning("数据源缺少 ID，无法删除");
      return;
    }
    await deleteDataSource(item.id);
    ElMessage.success("删除成功");
    await load();
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

/** 卡片「更多」命令分发（收敛次要操作：浏览表结构 / 编辑 / 删除） */
const runCardCommand = (cmd: string, item: DataSourceInfo) => {
  if (cmd === "schema") {
    void openSchema(item);
    return;
  }
  if (cmd === "edit") {
    openEdit(item);
    return;
  }
  if (cmd === "delete") {
    void remove(item);
  }
};

// ------------------------------ 表结构浏览 ------------------------------
// 采集侧元数据接口（hub 只管"连得上"，表的清单/列结构由采集平台提供）：
// 入库节点要按真实列配字段映射，这里给同一个能力一个可见入口。

const schemaVisible = ref(false);
const schemaLoading = ref(false);
const schemaError = ref<string | null>(null);
const schemaSourceId = ref<number | null>(null);
const schemaSourceName = ref("");
const schemaTables = ref<string[]>([]);
const schemaTable = ref<string | null>(null);
const schemaColumns = ref<CollectColumn[]>([]);

/** 打开某数据源的表结构浏览 */
const openSchema = async (item: DataSourceInfo) => {
  if (item.id == null) {
    ElMessage.warning("数据源缺少 ID，无法浏览表结构");
    return;
  }
  schemaSourceId.value = item.id;
  schemaSourceName.value = item.name;
  schemaTable.value = null;
  schemaColumns.value = [];
  schemaVisible.value = true;
  await refreshSchemaTables();
};

/** 拉当前表的列元数据 */
const refreshSchemaColumns = async () => {
  if (schemaSourceId.value == null || !schemaTable.value) {
    schemaColumns.value = [];
    return;
  }
  schemaLoading.value = true;
  schemaError.value = null;
  try {
    schemaColumns.value = (await fetchDatasourceColumns(schemaSourceId.value, schemaTable.value)) ?? [];
  } catch (error) {
    schemaColumns.value = [];
    schemaError.value = error instanceof Error ? error.message : String(error);
  } finally {
    schemaLoading.value = false;
  }
};

/** 拉表清单；首次自动选中第一张表并带出列 */
const refreshSchemaTables = async () => {
  if (schemaSourceId.value == null) {
    return;
  }
  schemaLoading.value = true;
  schemaError.value = null;
  try {
    const tables = (await fetchDatasourceTables(schemaSourceId.value)) ?? [];
    schemaTables.value = tables;
    if (!schemaTable.value && tables.length) {
      schemaTable.value = tables[0];
      await refreshSchemaColumns();
    } else if (!tables.length) {
      schemaColumns.value = [];
    }
  } catch (error) {
    schemaTables.value = [];
    schemaError.value = error instanceof Error ? error.message : String(error);
  } finally {
    schemaLoading.value = false;
  }
};

/** 列元数据表格列定义 */
const schemaColumnDefs = computed<ReTableColumn[]>(() => [
  { prop: "position", label: "#", width: 60, align: "center" },
  { prop: "name", label: "列名", minWidth: 160 },
  { prop: "typeName", label: "类型", width: 140 },
  { prop: "size", label: "长度", width: 80, align: "center" },
  { prop: "nullable", label: "可空", width: 90, slot: "nullable", align: "center" },
  { prop: "primaryKey", label: "主键", width: 80, slot: "primaryKey", align: "center" },
]);

/** 测试连接 */
const test = async (item: DataSourceInfo) => {
  if (item.id == null) {
    ElMessage.warning("数据源缺少 ID，无法测试");
    return;
  }
  testing.value = item.id;
  try {
    const result = await testDataSource(item.id);
    // 后端在测试时把连接延迟/会话延迟回写台账，这里重新拉一次，让概览卡片显示最新值
    await load();
    if (result?.success) {
      const detail = describeLatency(result);
      ElMessage.success(detail ? `${result.message || "连接成功"}（${detail}）` : result.message || "连接成功");
    } else {
      ElMessage.error(result?.message || "连接失败");
    }
  } catch (e) {
    ElMessage.error(`测试失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    testing.value = null;
  }
};

/** 把测试结果里的两个延迟拼成一句可读文本 */
function describeLatency(result: DataSourceTestResult): string {
  const parts: string[] = [];
  // 延迟是真耗时，格式与全站其它耗时展示同源（ReTime 的 formatDuration）
  if (typeof result?.connectLatencyMs === "number") {
    parts.push(`连接 ${formatDuration(costMs(result.connectLatencyMs))}`);
  }
  if (typeof result?.sessionLatencyMs === "number") {
    parts.push(`会话 ${formatDuration(costMs(result.sessionLatencyMs))}`);
  }
  return parts.join(" / ");
}

/** 类型跳转映射（宿主应用按自身路由覆盖者优先） */
const TYPE_ROUTE_MAP: Record<string, string> = {
  jdbc: "/db-manager",
  redis: "/redis",
  influxdb: "/influxdb",
  neo4j: "/neo4j",
  nacos: "/nacos",
  zookeeper: "/zookeeper",
  nginx: "/nginx",
};

/** 打开对应类型的管理页面 */
const openManager = (item: DataSourceInfo) => {
  const route = TYPE_ROUTE_MAP[item.type];
  if (route) {
    router.push({ path: route, query: { datasourceId: item.id } });
  } else {
    ElMessage.warning(`类型 ${item.type} 的管理页面开发中`);
  }
};

/**
 * nginx 进程控制方式选项。
 *
 * <p>空串代表「自动探测」，与后端 {@code datasource_control_mode} 为空时的语义一致
 * （即本字段引入前的行为）。刻意不叫「自动」两个字：它是缺省值而非一个独立能力，
 * 叫「自动」会让人以为存在一个会主动猜测的实现。</p>
 */
const controlModeOptions = [
  { label: "自动探测", value: "" },
  { label: "systemd 托管（systemctl 启停）", value: "systemd" },
  { label: "本地目录（nginx -s 与裸启动）", value: "local" }
];

/** 根据类型显示默认端口 */
const defaultPort = (type: string): number => {
  const ports: Record<string, number> = {
    jdbc: 3306,
    redis: 6379,
    influxdb: 8086,
    neo4j: 7474,
    nacos: 8848,
    zookeeper: 2181,
    nginx: 80,
  };
  return ports[type] ?? 3306;
};

/** 类型变化时更新默认端口 */
const onTypeChange = (type: string) => {
  if (!editing.value) {
    form.value.port = defaultPort(type);
  }
  // 控制方式只对 nginx 有意义。这里切走时不清空：清掉会让用户切回 nginx 时丢掉刚填的单元名，
  // 留着也不脏——后端 copy() 有类型闸门，非 nginx 的请求这两个字段一律置空（实测踩过：
  // 原先后端只校验取值在不在白名单、没看 type，直调 PUT 把 nginx 改成 jdbc 后
  // controlMode=systemd 被照单全收地留在库里）。
};

// ------------------------------ 视图派生数据 ------------------------------

/**
 * 启用口径与 API 层保持一致（见 api/index.ts 的 fetchDatasourceOptions）：
 * status 为 0 表示停用，其余（含 null 未标注）视为启用。
 * 现有数据模型没有「异常」的判定来源，因此异常过滤恒为空、不展示数量徽标。
 */
const isEnabled = (item: DataSourceInfo): boolean => item.status !== 0;

/** 当前选中的数据源；未显式选择或所选项已不存在时回落到第一条 */
const current = computed<DataSourceInfo | null>(() => {
  if (!list.value.length) {
    return null;
  }
  return list.value.find(item => item.id === currentId.value) ?? list.value[0];
});

/** 左栏数据源列表：状态过滤 + 关键词过滤（名称 / 类型 / 地址 / 备注） */
const filteredList = computed<DataSourceInfo[]>(() => {
  const key = keyword.value.trim().toLowerCase();
  return list.value.filter(item => {
    const matchStatus =
      statusKey.value === "all" ||
      (statusKey.value === "online" && isEnabled(item)) ||
      (statusKey.value === "offline" && !isEnabled(item));
    if (!matchStatus) {
      return false;
    }
    if (!key) {
      return true;
    }
    return [item.name, item.type, item.host, item.remark]
      .filter(value => value != null && value !== "")
      .some(value => String(value).toLowerCase().includes(key));
  });
});

/** 左栏状态过滤项与计数（异常无判定来源，count 置 null 不展示徽标） */
const statusFilters = computed<StatusFilterItem[]>(() => [
  { key: "all", label: "全部", color: "var(--brand-500, var(--el-color-primary))", count: list.value.length },
  { key: "online", label: "在线", color: "var(--status-success, var(--el-color-success))", count: list.value.filter(isEnabled).length },
  { key: "abnormal", label: "异常", color: "var(--status-warning, var(--el-color-warning))", count: null },
  { key: "offline", label: "离线", color: "var(--status-error, var(--el-color-danger))", count: list.value.filter(item => !isEnabled(item)).length },
]);

/** 右栏页签定义：内置页签 + 宿主注入页签（extraTabs 追加在后面） */
const tabItems = computed<ReTabItem[]>(() => [
  { name: "overview", label: "概览" },
  { name: "connection", label: "连接配置" },
  { name: "metrics", label: "监控指标" },
  { name: "logs", label: "操作日志" },
  ...props.extraTabs,
]);

/** 概览「运行状态」卡片文案：沿用 status 字段口径（0 停用 / 其余启用） */
const runtimeText = computed<string>(() => (current.value?.status === 0 ? "已停用" : "正常"));

/** 毫秒数转卡片文案；无值时统一显示占位符，避免出现 0ms 误导 */
function formatLatency(value?: number | null): string {
  const cost = costMs(value);
  return cost == null ? "—" : formatDuration(cost);
}

/** 连接延迟卡片值：后端点「测试连接」时回写台账 */
const connectLatencyText = computed<string>(() => formatLatency(current.value?.connectLatencyMs));

/** 会话延迟卡片值 */
const sessionLatencyText = computed<string>(() => formatLatency(current.value?.sessionLatencyMs));

/** 最后检测时间卡片文案：取后端回写的测试时间，而不是前端硬编码「刚刚」 */
const lastTestText = computed<string>(() => {
  const raw = current.value?.lastTestTime;
  if (!raw) {
    return "未测试";
  }
  const at = new Date(raw);
  if (Number.isNaN(at.getTime())) {
    return "未测试";
  }
  return at.toLocaleString("zh-CN", { hour12: false });
});

/** 地址展示：host(:port)；缺省时回落占位符 */
const formatAddress = (item: DataSourceInfo): string => {
  if (!item.host) {
    return "—";
  }
  return item.port != null ? `${item.host}:${item.port}` : item.host;
};

/** 概览「连接配置」键值行（地址 / 配置路径 / 用户 / 备注 / 来源类型） */
const configRows = computed(() => {
  const item = current.value;
  if (!item) {
    return [];
  }
  return [
    { label: "地址", value: formatAddress(item), mono: true },
    { label: "配置路径", value: item.database || "—", mono: true },
    { label: "用户", value: item.username || "—", mono: false },
    { label: "备注", value: item.remark || "—", mono: false },
    { label: "来源类型", value: typeMeta(item.type).label, mono: false },
  ];
});

/** 「连接配置」页签的完整参数行（只用现有字段，不新造接口） */
const connectionRows = computed(() => {
  const item = current.value;
  if (!item) {
    return [];
  }
  return [
    { label: "数据源 ID", value: item.id != null ? String(item.id) : "—", mono: true },
    { label: "地址", value: formatAddress(item), mono: true },
    { label: "配置路径", value: item.database || "—", mono: true },
    { label: "用户", value: item.username || "—", mono: false },
    { label: "驱动类", value: item.driverClassName || "—", mono: true },
    { label: "状态", value: item.status === 0 ? "已停用" : "启用", mono: false },
    { label: "备注", value: item.remark || "—", mono: false },
    { label: "创建时间", value: item.createTime || "—", mono: true },
    { label: "更新时间", value: item.updateTime || "—", mono: true },
  ];
});

/** 左栏选中数据源（按 id 定位，列表刷新后仍能保持选中） */
const selectSource = (item: DataSourceInfo) => {
  currentId.value = item.id ?? null;
};

/**
 * 头部「更多」命令分发。
 *
 * 头部合并了原先的「面包屑行」与「详情头卡」，两处的操作都收进这一个下拉：
 * - refresh：页面级（刷新列表），未选中数据源时也要可用
 * - schema / edit / delete：依赖选中项，交给既有的 runCardCommand 复用
 */
const runHeadCommand = (cmd: string) => {
  if (cmd === "refresh") {
    void load();
    return;
  }
  if (!current.value) {
    return;
  }
  runCardCommand(cmd, current.value);
};

onMounted(load);
</script>

<template>
  <div class="ds">
    <div class="ds-layout">
      <!-- 左栏：状态过滤 / 搜索 / 数据源列表 / 添加入口 -->
      <aside class="ds-side">
        <div class="ds-side-card">
          <!-- 状态过滤列表 -->
          <ul class="ds-status">
            <li
              v-for="item in statusFilters"
              :key="item.key"
              class="ds-status__item"
              :class="{ 'is-active': statusKey === item.key }"
              @click="statusKey = item.key"
            >
              <span class="ds-status__dot" :style="{ background: item.color }" />
              <span class="ds-status__label">{{ item.label }}</span>
              <span v-if="item.count !== null" class="ds-status__count">{{ item.count }}</span>
            </li>
          </ul>

          <div class="ds-side__divider" />

          <!-- 关键词搜索（与页头搜索框共享关键词） -->
          <ReInput
            v-model="keyword"
            class="ds-side__search"
            prefix-icon="Search"
            placeholder="搜索数据源"
            clearable
          />

          <!-- 数据源卡片列表 -->
          <div class="ds-side__list">
            <p v-if="loading && !list.length" class="ds-side__hint">加载中…</p>
            <ReEmpty v-else-if="!filteredList.length" description="暂无匹配的数据源" :image-size="60" />
            <template v-else>
              <button
                v-for="item in filteredList"
                :key="item.id ?? item.name"
                type="button"
                class="ds-item"
                :class="{ 'is-active': current === item }"
                @click="selectSource(item)"
              >
                <span class="ds-item__icon" :style="{ '--tile': typeMeta(item.type).color }">
                  <ReIcon :name="typeMeta(item.type).icon" :size="16" />
                </span>
                <span class="ds-item__body">
                  <span class="ds-item__row">
                    <b class="ds-item__name">{{ item.name }}</b>
                    <span class="ds-item__chip" :style="{ '--tile': typeMeta(item.type).color }">{{ item.type.toUpperCase() }}</span>
                  </span>
                  <span class="ds-item__addr mono">{{ item.host }}:{{ item.port }}</span>
                </span>
              </button>
            </template>
          </div>

          <!-- 底部新增入口（虚线边框） -->
          <button type="button" class="ds-side__add" @click="openCreate">
            <ReIcon name="Plus" :size="14" />
            <span>添加数据源</span>
          </button>
        </div>
      </aside>

      <!-- 右栏：头部（面包屑 + 详情合并）/ 页签 -->
      <div class="ds-main">
        <!-- 头部：面包屑与详情信息合并成一张卡片（原先是「面包屑行 + 详情头卡」上下两行）。
             未选中数据源时只显示面包屑，详情区随 v-if 一起不渲染。 -->
        <div class="ds-head">
          <div class="ds-head__main">
            <span class="ds-crumb">
              <ReIcon name="DataBoard" :size="18" class="ds-crumb__icon" />
              <span>基础设施 / 数据源中心</span>
            </span>
            <template v-if="current">
              <span class="ds-head__sep" aria-hidden="true" />
              <h2 class="ds-detail__name">{{ current.name }}</h2>
              <span class="ds-detail__chip" :style="{ '--tile': typeMeta(current.type).color }">
                {{ current.type.toUpperCase() }}
              </span>
              <span class="ds-detail__badge" :class="current.status === 0 ? 'is-off' : 'is-on'">
                <span class="ds-detail__badge-dot" />
                {{ current.status === 0 ? "已停用" : "在线" }}
              </span>
            </template>
          </div>
          <div class="ds-head__actions">
            <ReInput
              v-model="keyword"
              class="ds-head__search"
              prefix-icon="Search"
              placeholder="搜索数据源"
              clearable
            />
            <ReButton icon="Plus" :show-text="true" type="primary" @click="openCreate">新增数据源</ReButton>
            <template v-if="current">
              <ReButton icon="Lightning" :show-text="true" :loading="testing === current.id" @click="test(current)">测试连接</ReButton>
              <ReButton icon="View" :show-text="true" type="primary" @click="openManager(current)">打开管理</ReButton>
            </template>
            <ElDropdown trigger="click" placement="bottom-end" @command="(cmd: string | number | object) => runHeadCommand(cmd as string)">
                <!-- 触发器刻意用裸 el-button 而非 ReButton：
                     ReButton 在 icon + show-text=false 时内部再包一层 ElTooltip，
                     而 ElDropdown 自身也用 ElOnlyChild 克隆子节点挂 click 监听，
                     两层 OnlyChild 嵌套会互相干扰，导致下拉点不开。 -->
                <el-button class="ds-head__more" text aria-label="更多">
                  <ReIcon name="MoreFilled" :size="16" />
                </el-button>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="refresh"><ReIcon name="RefreshRight" />刷新列表</ElDropdownItem>
                    <template v-if="current">
                      <ElDropdownItem v-if="current.type === 'jdbc'" command="schema" divided><ReIcon name="Grid" />浏览表结构</ElDropdownItem>
                      <ElDropdownItem command="edit"><ReIcon name="EditPen" />编辑数据源</ElDropdownItem>
                      <ElDropdownItem command="delete" divided style="color: var(--el-color-danger)"><ReIcon name="Delete" />删除数据源</ElDropdownItem>
                    </template>
                  </ElDropdownMenu>
                </template>
            </ElDropdown>
          </div>
        </div>

        <template v-if="current">
          <!-- 页签 -->
          <ReTab v-model="activeTab" variant="capsule" :tabs="tabItems" stretch>
            <!-- 概览：统计卡 + 连接配置 -->
            <template #overview>
              <div class="ds-overview">
                <div class="ds-stats">
                  <ReStatCard title="连接延迟" :value="connectLatencyText" :icon="Timer" icon-color="var(--metric-cpu, var(--el-color-primary))" />
                  <ReStatCard title="会话延迟" :value="sessionLatencyText" :icon="Timer" icon-color="var(--el-color-success)" />
                  <ReStatCard title="最后检测" :value="lastTestText" :icon="Clock" icon-color="var(--status-success, var(--el-color-success))" />
                  <ReStatCard title="运行状态" :value="runtimeText" :icon="CircleCheck" icon-color="var(--brand-500, var(--el-color-primary))" />
                </div>

                <section class="ds-panel">
                  <h3 class="ds-panel__title">连接配置</h3>
                  <dl class="ds-kv">
                    <div v-for="row in configRows" :key="row.label" class="ds-kv__row">
                      <dt class="ds-kv__label">{{ row.label }}</dt>
                      <dd class="ds-kv__value" :class="{ mono: row.mono }">{{ row.value }}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </template>

            <!-- 连接配置：完整参数表（只用现有字段） -->
            <template #connection>
              <section class="ds-panel">
                <h3 class="ds-panel__title">连接配置</h3>
                <dl class="ds-kv">
                  <div v-for="row in connectionRows" :key="row.label" class="ds-kv__row">
                    <dt class="ds-kv__label">{{ row.label }}</dt>
                    <dd class="ds-kv__value" :class="{ mono: row.mono }">{{ row.value }}</dd>
                  </div>
                </dl>
              </section>
            </template>

            <!-- 监控指标：暂无数据来源，占位 -->
            <template #metrics>
              <div class="ds-placeholder">
                <ReEmpty description="暂无监控指标数据" :image-size="80" />
              </div>
            </template>

            <!-- 操作日志：暂无数据来源，占位 -->
            <template #logs>
              <div class="ds-placeholder">
                <ReEmpty description="暂无操作日志数据" :image-size="80" />
              </div>
            </template>

            <!-- 宿注入页签：插槽名与 extraTabs[].name 一致。
                 ReTab 的 capsule 布局不透传插槽参数，所以这里不接 ReTab 给的参数，
                 而是直接闭包引用本页的 current —— 它是本页自己的 ref，天然跟着左栏选中项变。

                 这里必须写 props.extraTabs：defineProps 的返回值赋给 props 之后，
                 各个 prop 不会单独暴露给模板；写裸 extraTabs 拿到的是 undefined，
                 v-for 遍历 undefined 会让宿主页签整个不渲染，而且不报错，
                 只表现为「页签莫名其妙不出现」，极难定位。 -->
            <template v-for="t in props.extraTabs" #[t.name]>
              <slot :name="t.name" :datasource="current" />
            </template>
          </ReTab>
        </template>

        <ReEmpty v-else description="暂无数据源，点击「新增数据源」创建" :image-size="80" class="ds-main__empty" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑数据源' : '新增数据源'" width="560px">
      <div class="ds-dialog-body">
        <ReForm label-position="top" class="ds-form">
          <ReFormItem label="名称" required class="is-full">
            <ReInput v-model="form.name" placeholder="例如：生产 MySQL" />
          </ReFormItem>
          <ReFormItem label="类型" required>
            <ReSelect v-model="form.type" :options="types.map(t => ({ label: typeMeta(t).label, value: t }))" @change="onTypeChange" />
          </ReFormItem>
          <ReFormItem label="主机地址">
            <ReInput v-model="form.host" placeholder="127.0.0.1" />
          </ReFormItem>
          <ReFormItem :label="form.type === 'neo4j' ? '端口 (HTTP)' : '端口'">
            <ReInputNumber
              :model-value="form.port ?? undefined"
              :min="1"
              :max="65535"
              style="width: 100%"
              @update:model-value="form.port = $event"
            />
          </ReFormItem>
          <ReFormItem label="用户名">
            <ReInput v-model="form.username" placeholder="数据库用户名" />
          </ReFormItem>
          <ReFormItem label="密码">
            <ReInput v-model="form.password" type="password" show-password placeholder="数据库密码" />
          </ReFormItem>
          <ReFormItem :label="form.type === 'neo4j' ? '图数据库名' : '数据库/库名'">
            <ReInput
              v-model="form.database"
              :placeholder="form.type === 'neo4j' ? '留空按 neo4j；填完整 http(s):// 地址时按反向代理前缀处理' : '数据库名 / Redis DB 编号'"
            />
          </ReFormItem>
          <!-- 进程控制方式：只对 nginx 有意义。
               留空 = 自动探测（后端认得出托管单元且当前用户有免密 systemctl 权限才走 systemd），
               这是本字段引入前的行为，老数据源保持留空即可保持不变。 -->
          <template v-if="form.type === 'nginx'">
            <ReFormItem label="控制方式" class="is-full">
              <ReSelect
                v-model="form.controlMode"
                :options="controlModeOptions"
                placeholder="自动探测"
              />
            </ReFormItem>
            <ReFormItem
              v-if="form.controlMode === 'systemd'"
              label="托管单元名"
              class="is-full"
            >
              <ReInput
                v-model="form.controlTarget"
                placeholder="例如 nginx.service；留空则由后端自动探测"
              />
            </ReFormItem>
            <p v-if="form.controlMode === 'local'" class="ds-control-hint">
              直接在本机执行 <code>nginx -s stop</code> 与裸启动，不经过 systemctl。
              停止后进程不再受任何进程管理器托管，机器重启不会自动拉起。
            </p>
            <p v-else-if="form.controlMode === 'systemd'" class="ds-control-hint">
              启停交给 <code>systemctl</code>。仍要求 SSH 用户对该单元有免密 sudo 权限，没有时自动退回本地目录方式。
            </p>
            <p v-else class="ds-control-hint">
              由后端自动判断：认得出托管单元且 SSH 用户有该单元的免密 sudo 权限才走 systemd，否则用本地目录方式。
            </p>
          </template>
          <ReFormItem label="备注" class="is-full">
            <ReInput v-model="form.remark" placeholder="可选备注信息" />
          </ReFormItem>
        </ReForm>
      </div>
      <template #footer>
        <ReButton class="ds-pill" @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" class="ds-pill" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 表结构浏览：入库节点按这里的真实列配字段映射 -->
    <ReDialog v-model="schemaVisible" :title="`${schemaSourceName} · 表结构`" width="820px">
      <div class="ds-schema">
        <div class="ds-schema__bar">
          <span class="ds-schema__label">表</span>
          <ReSelect
            v-model="schemaTable"
            filterable
            
            class="ds-schema__select"
            placeholder="选择表"
            :options="schemaTables.map(name => ({ label: name, value: name }))"
            @update:model-value="() => refreshSchemaColumns()"
          />
          <ReButton  class="ds-pill" icon="RefreshRight" :show-text="true" :loading="schemaLoading" @click="refreshSchemaTables">刷新</ReButton>
          <span class="ds-schema__count">共 {{ schemaTables.length }} 张表</span>
        </div>

        <p v-if="schemaError" class="ds-schema__error">{{ schemaError }}</p>

        <ReTable
          v-else
          :columns="schemaColumnDefs"
          :data="schemaColumns"
          :loading="schemaLoading"
          row-key="name"
          empty-text="选择一张表查看列结构"
        >
          <template #nullable="{ row }">
            <ReTag  effect="plain" :type="row.nullable ? 'info' : 'warning'">
              {{ row.nullable ? "可空" : "NOT NULL" }}
            </ReTag>
          </template>
          <template #primaryKey="{ row }">
            <ReTag v-if="row.primaryKey"  effect="plain" type="danger">主键</ReTag>
          </template>
        </ReTable>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   数据源中心（独立页面包）—— 全部使用 koi / Element 令牌
   左右两栏：左栏状态过滤 + 列表，右栏详情 + 页签
   ============================================================ */
.ds {
  padding: 4px 4px 24px;
  /* 撑满内容区：父级是纵向 flex 的子项时高度确定，min-height:100% 即可解析。
     内容更高时按内容走（min-height 不设上限），短内容时左栏也能落到底。 */
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* ---------------- 左右两栏布局 ---------------- */
/* align-items 用默认的 stretch：两栏等高，左栏吃满右栏撑出来的高度。
   写 flex-start 会让左栏按自身内容收尾，右栏很长时下方留一大片空白。 */
.ds-layout {
  display: flex;
  align-items: stretch;
  gap: 12px;
  /* 吃掉 .ds 的剩余高度，左栏才有机会落到底 */
  flex: 1 1 auto;
  min-height: 0;
}
.ds-side {
  flex: 0 0 340px;
  max-width: 340px;
  min-width: 0;
  /* 与右栏 .ds-main 同理：这一环不断，.ds-side-card 的 min-height:0 就传不下去，
     右栏内容一长，左栏卡片会被一起顶高而不是自己内部滚动。 */
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.ds-main {
  flex: 1 1 auto;
  min-width: 0;
  /* 必须显式写 0：flex 子项默认 min-height:auto，会拒绝收缩到内容高度以下。
     缺这一行时，页签面板里嵌入的「数据库管理器」有 100+ 张表时会把本栏顶到
     视口之外，整页跟着长出滚动条，左栏数据源列表被顶出可视区。
     写了 0 之后，ReTab 的 flex:1 + min-height:0 钳位链才真正生效，
     超出部分由内层面板自己滚动。 */
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ---------------- 左栏 ---------------- */
.ds-side-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  /* 撑满左栏高度；min-height:0 让内部列表能真正收缩并滚动，而不是把卡片顶高 */
  flex: 1 1 auto;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-lighter);
  transition: background-color var(--el-transition-duration, 0.2s);
}

/* 状态过滤列表 */
.ds-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-status__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--el-border-radius-base);
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}
.ds-status__item:hover {
  background: var(--el-fill-color-light);
}
.ds-status__item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.ds-status__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.ds-status__label {
  flex: 1 1 auto;
  min-width: 0;
}
.ds-status__count {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* 分隔线 */
.ds-side__divider {
  height: 1px;
  background: var(--el-border-color-lighter);
}

/* 左栏列表：吃掉卡片剩余高度，超出独立滚动，
   这样「添加数据源」按钮始终贴在卡片底部，不会被长列表顶走 */
.ds-side__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.ds-side__hint {
  margin: 0;
  padding: 16px 0;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 数据源卡片 */
.ds-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  color: var(--el-text-color-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}
.ds-item:hover {
  background: var(--el-fill-color-light);
}
.ds-item.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-8);
}
.ds-item__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  border-radius: var(--el-border-radius-base);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
}
.ds-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}
.ds-item__row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ds-item__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ds-item__chip {
  flex: none;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--tile) 40%, transparent);
  border-radius: var(--el-border-radius-round, 9999px);
}
.ds-item__addr {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 底部新增按钮（虚线边框） */
.ds-side__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 10px;
  /* 不参与列表的伸缩：列表吃掉剩余高度后，本按钮自然停在卡片底部 */
  flex: none;
  font-family: inherit;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition:
    color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s),
    background-color var(--el-transition-duration, 0.2s);
}
.ds-side__add:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

/* ReInput 内部为元素透传，搜索框宽度需用 :deep 命中 el-input 根 */
.ds-side :deep(.ds-side__search) {
  width: 100%;
}

/* ---------------- 右栏头部（面包屑 + 详情合并为一张卡片） ---------------- */
.ds-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
}
.ds-head__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
/* 面包屑与详情信息之间的竖向分隔线 */
.ds-head__sep {
  flex-shrink: 0;
  width: 1px;
  height: 14px;
  background: var(--el-border-color-lighter);
}
.ds-crumb {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ds-crumb__icon {
  color: var(--el-color-primary);
}
.ds-head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ds-head :deep(.ds-head__search) {
  width: 220px;
}

/* 「更多」触发器：与相邻按钮同规格（32px 高、无内边距） */
.ds-head__more {
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  color: var(--el-text-color-regular);
}
.ds-head__more:hover {
  color: var(--el-color-primary);
}
.ds-detail__name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}
.ds-detail__chip {
  flex: none;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--tile) 40%, transparent);
  border-radius: var(--el-border-radius-round, 9999px);
}
.ds-detail__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  --badge: var(--el-text-color-secondary);
  color: var(--badge);
  background: color-mix(in srgb, var(--badge) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge) 45%, transparent);
  border-radius: var(--el-border-radius-round, 9999px);
}
.ds-detail__badge.is-on {
  --badge: var(--status-success, var(--el-color-success));
}
.ds-detail__badge.is-off {
  --badge: var(--status-error, var(--el-color-danger));
}
.ds-detail__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ---------------- 概览：统计卡 ---------------- */
/* 概览页的「连接配置」区块要吃掉统计卡以下的剩余高度，否则切页签时整页高度跳变 */
.ds-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}
.ds-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
/* 统一卡片规格：白底 + 1px 边框 + 12px 圆角（内部排版由 ReStatCard 决定） */
.ds-stats :deep(.re-stat-card) {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
}

/* ---------------- 面板 / 键值表 ---------------- */
.ds-panel {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
  /* 吃满页签面板的可用高度（ReTab stretch → .re-tab-capsule__panel）。
     转纵向 flex 是为了让标题与键值表成为两行可控子项；
     键值行按内容自然排、不加滚动，字段更多时面板会被内容顶高而不是压缩行距。 */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
.ds-panel__title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}
.ds-kv {
  margin: 0;
}
.ds-kv__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}
.ds-kv__row + .ds-kv__row {
  border-top: 1px solid var(--el-border-color-lighter);
}
.ds-kv__label {
  flex: 0 0 140px;
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ds-kv__value {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

/* 页签占位（监控指标 / 操作日志暂无数据来源）：同样吃满可用高度并居中，
   否则四个页签高度不一致，切页签时内容区会跳 */
.ds-placeholder {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
.ds-main__empty {
  padding: 48px 0;
}

/* ---------------- 弹窗表单 ---------------- */
.ds-dialog-body { padding: 16px 20px 4px; }
.ds-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}
.ds-form :deep(.el-form-item) { margin-bottom: 16px; }
.ds-form :deep(.is-full) { grid-column: 1 / -1; }

/* 控制方式下方的说明：与 ReFormItem 的 label 同字号弱化一档，
   整行占满（.is-full 的 grid-column 会传染给相邻兄弟，这里显式复位） */
.ds-control-hint {
  grid-column: 1 / -1;
  margin: -8px 0 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.ds-control-hint code {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  font-family: Consolas, Monaco, monospace;
  font-size: 11px;
}
.ds-form :deep(.el-form-item__label) {
  width: auto !important;
  height: auto;
  margin-bottom: 6px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-regular);
}
.ds-form :deep(.el-form-item__content) { margin-left: 0 !important; }

/* ---------------- 表结构浏览 ---------------- */
.ds-schema { display: flex; flex-direction: column; gap: 10px; }
.ds-schema__bar { display: flex; align-items: center; gap: 8px; }
.ds-schema__label { font-size: 13px; color: var(--el-text-color-regular); flex: 0 0 auto; }
.ds-schema__select { flex: 0 0 300px; }
.ds-schema__count { margin-left: auto; font-size: 12px; color: var(--el-text-color-secondary); }
.ds-schema__error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/* ---------------- 通用 ---------------- */
.ds-pill { border-radius: var(--el-radius-full, 9999px) !important; }

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 992px) {
  .ds-layout {
    flex-direction: column;
  }
  .ds-side {
    flex: none;
    width: 100%;
    max-width: none;
  }
  .ds-head__actions {
    flex: 1 1 auto;
    justify-content: flex-end;
  }
}
@media (max-width: 640px) {
  .ds-head__actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .ds-head :deep(.ds-head__search) {
    width: 100%;
  }
  .ds-kv__label {
    flex-basis: 96px;
  }
}
@media (max-width: 1100px) {
  .ds-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .ds-stats {
    grid-template-columns: 1fr;
  }
  .ds-form {
    grid-template-columns: 1fr;
  }
}

/* ---------------- 动效降级（prefers-reduced-motion） ----------------
   逐个列出本文件自带 transition 的选择器，不写 `*` / `.ds *` 通配：
   通配会把卡片里 ReStatCard / ReInput / el-dropdown 内部的合法过渡一起掐掉。
   本文件这些选择器都只带 transition（无 animation），故只关 transition。 */
@media (prefers-reduced-motion: reduce) {
  .ds-side-card,
  .ds-status__item,
  .ds-item,
  .ds-side__add {
    transition: none;
  }
}

/* ---------------- 键盘焦点可见性 ----------------
   .ds-status__item 是带 @click 的 li（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，这里不重复写。 */
.ds-status__item {
  outline: none;
}

.ds-status__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
