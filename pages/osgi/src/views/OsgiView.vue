<!--
  OSGi 插件管理 —— 轨道机架控制台（Orbital Rack Console）。

  版式由四套选定方案融合而成：
  - V01 机架：整页是一台立式机柜——顶部工具带（任务铭牌 + 读数 + 搜索 + 筛选 +
    刷新 + 上传）、中部 1U 模块墙、下部备件架（jar 仓）与测控日志带；
  - V09 轨道：机架左侧挂一幅同心轨道总览图——运行中的 bundle 在内环，
    启动/解析在中环，其余（已安装/停止中/已卸载）在外缘，框架是圆心；
    点击天体即定位到对应 1U 模块并高亮；
  - V02 线网：生命周期状态做成「线路」徽章筛选（全部/运行/解析/启动/停止），
    服务注册表表达为服务总线上的接驳线，jar 仓表达为车辆段；
  - V06 基板：每个 1U 模块做成一颗芯片——顶部缺口、状态 LED、引脚式
    生命周期相位（装填→解析→点火→入轨）、底部总线金手指、右侧电平表。

  本页没有传统页头：页面身份是工具带上的任务铭牌，操作内嵌在工具带里。

  能力与后端 /osgi/** 完全对齐，全部真实链路：清单、统计、快照、服务登记走
  GET 端点，安装 / 升级 / 启停 / 卸载 / 删除 / 下载走变更端点，无一处 mock。
  卸载与升级前做二次确认；删除 jar 前确认且仅在 bundle 已卸载时可用。

  颜色全部走 koi 设计令牌（@repo/theme tokens.css），明暗自动跟随；
  状态配色：ACTIVE=--status-success、STARTING=--status-warning、
  RESOLVED=--brand-500、STOPPING=--brand-400、INSTALLED=--metric-net、
  UNINSTALLED=--status-error。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElInput, ElSwitch, ElTooltip } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { message, msgError, msgSuccess, useSocketService } from "@repo/core";
import { downloadCsv, downloadTextFile, fileTimestamp, usePersistentFilters } from "@repo/utils";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import {
  OsgiError,
  deleteJar,
  downloadBundle,
  getSnapshot,
  installBundle,
  listBundles,
  listJars,
  listServices,
  listStats,
  startBundle,
  stopBundle,
  uninstallBundle,
  updateBundle,
} from "../api/osgiApi";
import type {
  OsgiBundle,
  OsgiJar,
  OsgiLogEntry,
  OsgiService,
  OsgiSnapshot,
  OsgiStats,
} from "../types/osgi";

defineOptions({ name: "OsgiManage" });

/** 模块墙排序键：default = 后端返回序（bundleId 升序） */
type SortKey = "default" | "name" | "id" | "version" | "state";

/**
 * 页面筛选与视图偏好的持久化状态（复用 @repo/utils 的 usePersistentFilters）。
 *
 * <p>刷新或切走再回来，搜索词、状态筛选、车辆段筛选、日志筛选与排序都保持
 * 原样（localStorage 记忆）。不同步路由 query：本页嵌在宿主路由里，避免污染
 * 宿主 URL。</p>
 */
const { filters } = usePersistentFilters({
  key: "osgi.rack",
  defaults: {
    searchText: "",
    filterState: "all",
    trayFilter: "all" as "all" | "installed" | "only",
    traySearch: "",
    logAction: "all",
    logOnlyProblem: false,
    sortKey: "default" as SortKey,
  },
});

/** 运行时插件清单 */
const rows = ref<OsgiBundle[]>([]);
const loading = ref(false);
/** 清单加载失败信息：非空且清单为空时显示失败态与重试入口 */
const loadError = ref("");
/** 正在执行变更的符号名集合：行级忙碌，不同模块的启停 / 升级互不阻塞 */
const busySet = ref(new Set<string>());
/** 全局忙碌（上传安装等无归属操作），期间禁用全部行操作 */
const globalBusy = ref(false);

/**
 * 某模块是否正在执行变更（或处于全局忙碌期）。
 *
 * @param symbolicName bundle 符号名
 * @return 忙碌返回 true
 */
function isBusy(symbolicName: string): boolean {
  return globalBusy.value || busySet.value.has(symbolicName);
}

/** Set 原地增删不触发视图，统一重建新集合 */
function beginBusy(symbolicName: string): void {
  busySet.value = new Set(busySet.value).add(symbolicName);
}

function endBusy(symbolicName: string): void {
  const next = new Set(busySet.value);
  next.delete(symbolicName);
  busySet.value = next;
}

/** 部署目录 jar 清单（含是否仍在框架中） */
const jars = ref<OsgiJar[]>([]);
/** 部署目录读取中 */
const jarLoading = ref(false);
/** 正在删除的文件名 */
const jarBusy = ref("");
/** 车辆段筛选：all / installed（在框架中）/ only（仅文件） */
const trayFilter = computed({
  get: () => filters.trayFilter,
  set: value => {
    filters.trayFilter = value;
  },
});
/** 车辆段专用搜索：只过滤车辆段清单，不影响模块墙 */
const traySearch = computed({
  get: () => filters.traySearch,
  set: value => {
    filters.traySearch = value;
  },
});
/** 车辆段抽屉是否拉出 */
const drawerOpen = ref(false);

/** 框架统计（遥测读数） */
const stats = ref<OsgiStats | null>(null);
/** 容器侧桥接快照（遥测读数） */
const snapshot = ref<OsgiSnapshot | null>(null);
/** 服务注册表（服务总线面板） */
const services = ref<OsgiService[]>([]);

/** 搜索关键字（符号名 / ID / 文件名 模糊匹配，纯前端展示过滤） */
const searchText = computed({
  get: () => filters.searchText,
  set: value => {
    filters.searchText = value;
  },
});
/** 搜索输入框绑定值：经 200ms 防抖后同步到 searchText，避免逐字符触发过滤 */
const searchInput = ref(filters.searchText);
let searchTimer: number | undefined;
/** 状态筛选键：all / ACTIVE / RESOLVED / transition / stopped */
const filterState = computed({
  get: () => filters.filterState,
  set: value => {
    filters.filterState = value;
  },
});
/** 模块墙排序键 */
const sortKey = computed({
  get: () => filters.sortKey,
  set: value => {
    filters.sortKey = value;
  },
});
/** 模块点击定位后临时高亮的行符号名 */
const highlightName = ref("");
/** 悬停联动的符号名：轨道天体与 1U 模块互相点亮 */
const hoverName = ref("");
/** 当前展开详情的模块符号名 */
const detailName = ref("");
/** 拖拽悬停于上传坞时点亮（通电反馈） */
const dockHot = ref(false);

const installInput = ref<HTMLInputElement | null>(null);
const upgradeInput = ref<HTMLInputElement | null>(null);
const upgradeTarget = ref("");

/** 每 30s 自动刷新开关，默认关，避免端点未开启时反复报错 */
const autoRefresh = ref(false);
/** 管理端点不可用（404/405）的持久警示；任一清单请求成功后解除 */
const endpointDown = ref(false);
/** 验收拒绝明细面板是否展开 */
const rejectOpen = ref(false);

/** 实时日志面板是否展开 */
const logOpen = ref(true);
/** 实时日志条目（最新的在末尾） */
const logs = ref<OsgiLogEntry[]>([]);
/** 日志条数上限：面板是「正在发生什么」的窗口，不是审计库 */
const LOG_LIMIT = 200;
/** 是否已接入 socket 通道（接入前日志区显示提示，避免误以为是后端没推） */
const logChannelReady = ref(false);
/** 最近一帧 socket 原始载荷，用于展示载荷形状 */
const lastFrame = ref<{ module: string; event: string; dataId: string; timestamp: string } | null>(null);
/** 日志滚动容器 */
const logBox = ref<HTMLElement | null>(null);
/** 只保留失败与警告 */
const logOnlyProblem = computed({
  get: () => filters.logOnlyProblem,
  set: value => {
    filters.logOnlyProblem = value;
  },
});
/** 日志操作类型筛选：all = 全部操作 */
const logAction = computed({
  get: () => filters.logAction,
  set: value => {
    filters.logAction = value;
  },
});
/** 每次新日志 +1，用于重触发电平表 / 磁带机动画（新事件 = 电平跳动） */
const logPulse = ref(0);

let unsubscribeLog: (() => void) | undefined;

/** 过滤后的日志（异常开关 + 操作类型） */
const visibleLogs = computed(() =>
  logs.value.filter(
    item =>
      (!logOnlyProblem.value || item.level === "ERROR" || item.level === "WARN") &&
      (logAction.value === "all" || item.action === logAction.value),
  ),
);

/** 失败 / 警告条数（面板折叠时也能看到异常） */
const problemCount = computed(
  () => logs.value.filter(item => item.level === "ERROR" || item.level === "WARN").length,
);

/** 日志中出现过的操作类型（按首次出现顺序，供操作筛选下拉） */
const logActions = computed(() => {
  const seen: string[] = [];
  for (const item of logs.value) {
    if (!seen.includes(item.action)) {
      seen.push(item.action);
    }
  }
  return seen;
});

/** 本会话观测到启动失败的符号名（实时日志 failure 事件），用于模块角标 */
const failedStarts = computed(() => {
  const names = new Set<string>();
  for (const item of logs.value) {
    if (item.action === "start" && item.status === "failure" && item.symbolicName) {
      names.add(item.symbolicName);
    }
  }
  return names;
});

/** 验收拒绝记录条数（0 = 无拒绝） */
const rejectedCount = computed(() => {
  const rejected = snapshot.value?.rejected;
  return rejected ? Object.keys(rejected).length : 0;
});

/** 验收拒绝明细文本（格式化 JSON，展开面板阅读用） */
const rejectedText = computed(() => {
  const rejected = snapshot.value?.rejected;
  return rejected && Object.keys(rejected).length ? JSON.stringify(rejected, null, 2) : "{}";
});

/** 测控带上显示的最近若干条（倒序，最新在最下） */
const tapeTicks = computed(() => logs.value.slice(-7).reverse());

/** 运行中的 bundle 数（总览口径：按 state 统计全部 bundle） */
const activeCount = computed(() => rows.value.filter(row => row.state === "ACTIVE").length);

/** 框架系统 bundle（bundleId === 0）：不可停止/卸载/升级，界面上只展示 */
const framework = computed(() => rows.value.find(row => row.bundleId === 0));

/**
 * 顶部遥测读数：全部来自真实端点，取不到就显示 —，不用前端兜底编造。
 */
const chips = computed(() => {
  return [
    { label: "framework", value: snapshot.value?.frameworkVersion || stats.value?.frameworkVersion || "—" },
    { label: "bundles", value: String(stats.value?.totalBundles ?? rows.value.length) },
    { label: "serviceRefs", value: String(stats.value?.heldServiceReferences ?? "—") },
    { label: "definitions", value: String(snapshot.value?.definitionCount ?? "—") },
    { label: "jars", value: String(jars.value.length) },
    { label: "autoStartFailures", value: String(stats.value?.autoStartFailures ?? "—") },
    { label: "bridge", value: snapshot.value?.bridgeAvailable ? "✓" : "—" },
    { label: "acceptance", value: snapshot.value?.acceptanceEnabled ? "✓" : "—" },
    { label: "rejected", value: String(rejectedCount.value) },
  ];
});

/** 筛选项定义（V02 线路徽章） */
const lineFilters: Array<{ key: string; label: string }> = [
  { key: "all", label: "全部" },
  { key: "ACTIVE", label: "运行中" },
  { key: "RESOLVED", label: "已解析" },
  { key: "transition", label: "启动中" },
  { key: "stopped", label: "已停止" },
];

/** 排序器：default 保持后端返回序；状态按电平高 → 低（运行中在前），同电平按 ID */
const sorters: Record<Exclude<SortKey, "default">, (a: OsgiBundle, b: OsgiBundle) => number> = {
  name: (a, b) => a.symbolicName.localeCompare(b.symbolicName),
  id: (a, b) => a.bundleId - b.bundleId,
  version: (a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }),
  state: (a, b) => stateLevel(b.state) - stateLevel(a.state) || a.bundleId - b.bundleId,
};

/** 搜索 + 状态筛选 + 排序后的模块清单 */
const filteredRows = computed(() => {
  const kw = searchText.value.trim().toLowerCase();
  const list = rows.value.filter(row => {
    if (!matchFilter(row)) {
      return false;
    }
    if (kw) {
      const hit = row.symbolicName.toLowerCase().includes(kw) || String(row.bundleId).includes(kw);
      if (!hit) {
        return false;
      }
    }
    return true;
  });
  if (sortKey.value === "default") {
    return list;
  }
  return [...list].sort(sorters[sortKey.value]);
});

/** 车辆段筛选结果（按车辆段专用搜索词 + 在架状态过滤） */
const filteredJars = computed(() => {
  const kw = traySearch.value.trim().toLowerCase();
  return jars.value.filter(jar => {
    if (trayFilter.value === "installed" && !jar.installed) {
      return false;
    }
    if (trayFilter.value === "only" && jar.installed) {
      return false;
    }
    if (kw && !jar.fileName.toLowerCase().includes(kw) && !(jar.symbolicName ?? "").toLowerCase().includes(kw)) {
      return false;
    }
    return true;
  });
});

/** 当前框架中的符号名集合：判断车辆段文件是否还有活的对应插件 */
const liveBundleNames = computed(() => new Set(rows.value.map(row => row.symbolicName)));

/**
 * 车辆段文件的异常标记。
 *
 * <p>三类值得用户注意的文件：</p>
 * <ul>
 *   <li>清单失配：框架声称已安装，但 bundle 清单里找不到对应符号名；</li>
 *   <li>无法识别：文件读不出符号名，永远不可能被装进框架（孤儿文件）；</li>
 *   <li>重名副本：同符号名插件已在框架中，这是多余的旧版本文件。</li>
 * </ul>
 *
 * @param jar 车辆段文件
 * @return 标记文本与语气；正常文件返回 null
 */
function jarFlag(jar: OsgiJar): { text: string; tone: "warning" | "danger" | "info"; tip: string } | null {
  if (jar.installed && (!jar.symbolicName || !liveBundleNames.value.has(jar.symbolicName))) {
    return {
      text: "清单失配",
      tone: "warning",
      tip: "框架报告该文件已安装，但 bundle 清单中找不到对应符号名，请刷新或核对框架状态",
    };
  }
  if (!jar.installed && !jar.symbolicName) {
    return {
      text: "无法识别",
      tone: "danger",
      tip: "该文件读不出符号名（可能不是 OSGi bundle 或已损坏），不会被框架加载",
    };
  }
  if (!jar.installed && jar.symbolicName && liveBundleNames.value.has(jar.symbolicName)) {
    return {
      text: "重名副本",
      tone: "info",
      tip: `同名插件 ${jar.symbolicName} 已在框架中，这是多余的旧版本文件，确认后可删除`,
    };
  }
  return null;
}

/** 轨道总览天体 */
interface OrbitBody {
  row: OsgiBundle;
  ring: "inner" | "mid" | "outer";
  x: number;
  y: number;
  /** 该环天体过多时缩小半径，避免相互重叠 */
  small: boolean;
}

/**
 * 轨道总览布点：运行中在内环、启动/解析在中环、其余在外缘；
 * 每条环上按序号均匀铺开角度，坐标为面板百分比。
 */
const orbitBodies = computed<OrbitBody[]>(() => {
  const groups: Record<OrbitBody["ring"], OsgiBundle[]> = { inner: [], mid: [], outer: [] };
  for (const row of rows.value) {
    if (row.state === "ACTIVE") {
      groups.inner.push(row);
    } else if (row.state === "STARTING" || row.state === "RESOLVED") {
      groups.mid.push(row);
    } else {
      groups.outer.push(row);
    }
  }
  const radii: Record<OrbitBody["ring"], number> = { inner: 23, mid: 36, outer: 48 };
  const bodies: OrbitBody[] = [];
  (Object.keys(groups) as Array<OrbitBody["ring"]>).forEach(ring => {
    const list = groups[ring];
    list.forEach((row, index) => {
      const angle = (index / list.length) * Math.PI * 2 - Math.PI / 2;
      bodies.push({
        row,
        ring,
        x: 50 + radii[ring] * Math.cos(angle),
        y: 50 + radii[ring] * Math.sin(angle),
        small: list.length > 12,
      });
    });
  });
  return bodies;
});

/** 轨道图例计数，与 orbitBodies 的分层口径一致 */
const orbitLegend = computed(() => [
  { key: "inner", label: "运行中", count: activeCount.value },
  {
    key: "mid",
    label: "启动/解析",
    count: rows.value.filter(row => row.state === "STARTING" || row.state === "RESOLVED").length,
  },
  {
    key: "outer",
    label: "待命/外缘",
    count: rows.value.filter(row => !["ACTIVE", "STARTING", "RESOLVED"].includes(row.state)).length,
  },
]);

/** 状态颜色图例：只展示当前出现过的状态（与轨道天体 / 状态徽章同一套配色） */
const stateLegend = computed(() =>
  [
    { key: "active", label: "运行中" },
    { key: "starting", label: "启动中" },
    { key: "resolved", label: "已解析" },
    { key: "stopping", label: "停止中" },
    { key: "installed", label: "已安装" },
    { key: "uninstalled", label: "已卸载" },
  ]
    .map(item => ({ ...item, count: rows.value.filter(row => row.state === item.key.toUpperCase()).length }))
    .filter(item => item.count > 0),
);

/**
 * 服务登记视图：标注每条服务是否为「同类型中 ranking 最高」的当前生效项。
 *
 * <p>后端按 ranking 降序返回；同类型第一条即生效服务，页面用徽标把这个
 * 语义显式表达出来，而不是让用户从一列同类型登记里猜。</p>
 */
const serviceRows = computed(() => {
  const bestByType = new Map<string, number>();
  for (const svc of services.value) {
    const best = bestByType.get(svc.type);
    if (best === undefined || svc.ranking > best) {
      bestByType.set(svc.type, svc.ranking);
    }
  }
  const markedTypes = new Set<string>();
  return services.value.map(svc => {
    const effective = bestByType.get(svc.type) === svc.ranking && !markedTypes.has(svc.type);
    if (effective) {
      markedTypes.add(svc.type);
    }
    return { svc, effective };
  });
});

/** 当前展开详情的服务 ID（服务总线接驳线点击展开） */
const serviceOpenId = ref<number | null>(null);

/**
 * 展开 / 收起服务登记详情（实现类、ranking、属性）。
 *
 * @param svc 服务登记
 */
function toggleService(svc: OsgiService): void {
  serviceOpenId.value = serviceOpenId.value === svc.osgiServiceId ? null : svc.osgiServiceId;
}

/**
 * 服务属性格式化为可读 JSON；空属性给明确提示，不显示成空白。
 *
 * @param props 服务属性
 * @return 展示文本
 */
function formatProps(props: Record<string, unknown>): string {
  if (!props || !Object.keys(props).length) {
    return "（无属性）";
  }
  return JSON.stringify(props, null, 2);
}

/** 桥接定义明细面板是否展开 */
const defsOpen = ref(false);
/** 已注册服务类型明细面板是否展开 */
const svcTypesOpen = ref(false);

/** 桥接定义清单（快照 definitions，空安全） */
const definitions = computed(() => snapshot.value?.definitions ?? []);

/** 已注册服务类型清单（统计 registeredServiceTypes，空安全） */
const registeredServiceTypes = computed(() => stats.value?.registeredServiceTypes ?? []);

/**
 * 是否为框架系统 bundle。系统 bundle 不可停止/卸载/升级，界面上只展示。
 *
 * @param row bundle
 * @return 系统 bundle 返回 true
 */
function isSystem(row: OsgiBundle): boolean {
  return row.bundleId === 0;
}

/**
 * 状态筛选匹配。
 *
 * @param row bundle
 * @return 命中当前筛选返回 true
 */
function matchFilter(row: OsgiBundle): boolean {
  const key = filterState.value;
  if (key === "all") {
    return true;
  }
  if (key === "transition") {
    return row.state === "STARTING" || row.state === "STOPPING";
  }
  if (key === "stopped") {
    return !["ACTIVE", "RESOLVED", "STARTING", "STOPPING"].includes(row.state);
  }
  return row.state === key;
}

/**
 * 状态 → 电平（0–10），LED 电平灯条与数字读数共用这一口径。
 *
 * <p>与状态配色一致：卸载为 0，安装为低位，解析/停止中为中位，
 * 启动中过半，运行中满格。</p>
 *
 * @param state OSGi bundle 状态
 * @return 电平值
 */
function stateLevel(state: string): number {
  const map: Record<string, number> = {
    UNINSTALLED: 0,
    INSTALLED: 3,
    RESOLVED: 4,
    STOPPING: 5,
    STARTING: 6,
    ACTIVE: 8,
  };
  return map[state] ?? 2;
}

/**
 * LED 电平灯条分段样式：底部起点亮，高段用警示色。
 *
 * @param state OSGi bundle 状态
 * @param index 分段序号（1 起，自下而上）
 * @return 样式类名，未点亮返回空串
 */
function ladderClass(state: string, index: number): string {
  const level = stateLevel(state);
  if (index > level) {
    return "";
  }
  if (index >= 8) {
    return "max";
  }
  if (index >= 6) {
    return "hot";
  }
  return "on";
}

/**
 * 模块槽位号：两位补零，与 bundleId 一一对应（1U 起算）。
 *
 * @param id bundleId
 * @return 展示文本
 */
function chNo(id: number): string {
  return String(id).padStart(2, "0");
}

/**
 * 状态中文名，未知状态原样返回。
 *
 * @param state OSGi bundle 状态
 * @return 展示文本
 */
function stateText(state: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "运行中",
    RESOLVED: "已解析",
    INSTALLED: "已安装",
    STARTING: "启动中",
    STOPPING: "停止中",
    UNINSTALLED: "已卸载",
  };
  return labels[state] ?? state;
}

/**
 * 状态标签色（固定口径）：
 * INSTALLED=info、RESOLVED=primary、STARTING=warning、ACTIVE=success、
 * STOPPING=primary-light、UNINSTALLED=danger。
 *
 * @param state OSGi bundle 状态
 * @return ReTag 类型
 */
function stateTagType(state: string): "primary" | "success" | "warning" | "info" | "danger" {
  switch (state) {
    case "ACTIVE":
      return "success";
    case "STARTING":
      return "warning";
    case "RESOLVED":
    case "STOPPING":
      return "primary";
    case "UNINSTALLED":
      return "danger";
    default:
      return "info";
  }
}

/**
 * 统一错误文案：端点未开启时给出明确排查方向。
 *
 * @param error 异常
 * @return 展示文本
 */
function errText(error: unknown): string {
  if (error instanceof OsgiError && (error.status === 404 || error.status === 405)) {
    return `${error.message}；请确认后端已开启 plugin.osgi.endpoint.enabled=true`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * 把名称按当前搜索词切分为命中 / 未命中片段，供芯片名高亮。
 *
 * @param name 原始名称
 * @return 片段序列（保持原名称顺序）
 */
function namePieces(name: string): Array<{ text: string; hit: boolean }> {
  const kw = searchText.value.trim().toLowerCase();
  if (!kw) {
    return [{ text: name, hit: false }];
  }
  const lower = name.toLowerCase();
  const pieces: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  while (cursor < name.length) {
    const hit = lower.indexOf(kw, cursor);
    if (hit === -1) {
      pieces.push({ text: name.slice(cursor), hit: false });
      break;
    }
    if (hit > cursor) {
      pieces.push({ text: name.slice(cursor, hit), hit: false });
    }
    pieces.push({ text: name.slice(hit, hit + kw.length), hit: true });
    cursor = hit + kw.length;
  }
  return pieces;
}

/** 清空搜索与状态筛选（空态引导用） */
function clearFilters(): void {
  searchInput.value = "";
  searchText.value = "";
  filterState.value = "all";
}

/**
 * 展开 / 收起模块详情（jar 来源、大小、修改时间）。
 *
 * @param row bundle
 */
function toggleDetail(row: OsgiBundle): void {
  detailName.value = detailName.value === row.symbolicName ? "" : row.symbolicName;
}

/**
 * 按符号名找到车辆段里对应的 jar（详情面板展示大小 / 修改时间用）。
 *
 * @param symbolicName bundle 符号名
 * @return 对应 jar；不在部署目录返回 undefined
 */
function jarOf(symbolicName: string): OsgiJar | undefined {
  return jars.value.find(jar => jar.symbolicName === symbolicName);
}

async function reload(): Promise<void> {
  loading.value = true;
  try {
    rows.value = (await listBundles()) ?? [];
    endpointDown.value = false;
    loadError.value = "";
  } catch (error) {
    loadError.value = errText(error);
    msgError(errText(error));
    if (error instanceof OsgiError && (error.status === 404 || error.status === 405)) {
      endpointDown.value = true;
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 读取部署目录 jar 清单。
 *
 * <p>与 bundle 清单分开请求：bundle 列表在运行时一直在变，而 jar 列表只在
 * 上传/删除后变化。两个请求任一失败都不该让另一块显示成空。</p>
 */
async function reloadJars(): Promise<void> {
  jarLoading.value = true;
  try {
    jars.value = (await listJars()) ?? [];
  } catch (error) {
    msgError(errText(error));
  } finally {
    jarLoading.value = false;
  }
}

/**
 * 读取统计 / 快照 / 服务登记。
 *
 * <p>三块都是只读观测数据，任一失败只影响对应遥测读数与服务总线，
 * 不牵连模块墙（bundle 清单）的展示。</p>
 */
async function loadMetrics(): Promise<void> {
  try {
    stats.value = (await listStats()) ?? null;
  } catch {
    // 统计取不到时读数显示 —，模块墙不受影响
  }
  try {
    snapshot.value = (await getSnapshot()) ?? null;
  } catch {
    // 快照取不到时读数显示 —，模块墙不受影响
  }
  try {
    services.value = (await listServices()) ?? [];
  } catch {
    services.value = [];
  }
}

/** 刷新全部数据：变更操作后调用，避免「卸载了但车辆段还显示在框架中」 */
async function reloadAll(): Promise<void> {
  await Promise.all([reload(), reloadJars()]);
  await loadMetrics();
}

/**
 * 删除部署目录中的 jar。
 *
 * <p>删除是不可逆的破坏性操作，二次确认里把文件名整串写出来：
 * 部署目录常有 `xxx-1.0.0.jar` 与 `xxx-1.0.1.jar` 并存，只显示前缀很容易删错版本。</p>
 *
 * @param jar 待删除的 jar
 */
async function removeJar(jar: OsgiJar): Promise<void> {
  if (jar.installed) {
    msgError(`${jar.fileName} 仍是框架中的插件（${jar.symbolicName}），请先卸载再删除`);
    return;
  }
  try {
    await message.confirm(
      `确认从部署目录删除 ${jar.fileName}？该文件不可恢复，下次启动不会再加载它。`,
      "删除 jar 文件",
      "删除",
      "取消",
      "warning",
    );
  } catch {
    return;
  }
  jarBusy.value = jar.fileName;
  try {
    const result = await deleteJar(jar.fileName);
    if (result?.deleted) {
      msgSuccess(`已删除 ${jar.fileName}`);
    } else {
      msgError(`${jar.fileName} 已不存在，可能是被其他进程清理`);
    }
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    jarBusy.value = "";
  }
}

/**
 * 追加一条实时日志并滚到底部；同时让电平表与磁带机随新事件跳动。
 *
 * @param entry 日志条目
 */
function appendLog(entry: OsgiLogEntry): void {
  logs.value.push(entry);
  if (logs.value.length > LOG_LIMIT) {
    logs.value.splice(0, logs.value.length - LOG_LIMIT);
  }
  logPulse.value++;
  void nextTick(() => {
    const box = logBox.value;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  });
}

/**
 * 把 socket 载荷归一成日志条目。
 *
 * <p>载荷可能是 {@code {module,event,data}} 整帧，也可能是已取出的 {@code data}；
 * 两种都接受，避免订阅端与后端任一侧调整层级后日志静默失联。</p>
 *
 * @param raw 原始载荷
 * @return 日志条目；缺关键字段时返回 null
 */
function toLogEntry(raw: unknown): OsgiLogEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const frame = raw as Record<string, unknown>;
  const data =
    frame.data && typeof frame.data === "object" ? (frame.data as Record<string, unknown>) : frame;
  const action = typeof data.action === "string" ? data.action : "";
  if (!action) {
    return null;
  }
  return {
    level: typeof data.level === "string" ? data.level : "INFO",
    status: typeof data.status === "string" ? data.status : "success",
    action,
    symbolicName: typeof data.symbolicName === "string" ? data.symbolicName : "",
    message: typeof data.message === "string" ? data.message : "",
    startedAt: typeof data.startedAt === "number" ? data.startedAt : Date.now(),
    duration: typeof data.duration === "number" ? data.duration : 0,
  };
}

/**
 * 接入全局 socket 的插件操作日志。
 *
 * <p>订阅的是 {@code osgi / operation-log}：后端每次写操作都广播
 * 「开始 / 成功 / 失败」三条，因此这里不需要在前端自己拼状态，
 * 也不必等操作返回后才补一条本地日志——后端没走到的分支（如超时）也能看见。</p>
 */
function bindLogChannel(): void {
  const socket = useSocketService();
  if (!socket) {
    logChannelReady.value = false;
    return;
  }
  logChannelReady.value = true;
  unsubscribeLog = socket.subscribe("osgi", "operation-log", (msg: unknown) => {
    const frame = msg as Record<string, unknown> | null;
    if (frame && typeof frame === "object") {
      lastFrame.value = {
        module: typeof frame.module === "string" ? frame.module : "osgi",
        event: typeof frame.event === "string" ? frame.event : "",
        dataId: typeof frame.dataId === "string" ? frame.dataId : "",
        timestamp: typeof frame.timestamp === "string" ? frame.timestamp : "",
      };
    }
    const entry = toLogEntry(msg);
    if (entry) {
      appendLog(entry);
    }
  });
}

/** 清空日志面板（只清本地展示，不影响后端） */
function clearLogs(): void {
  logs.value = [];
}

/** 完整时间戳（日期 + 时分秒），导出文件行用 */
function logTimeFull(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;
}

/**
 * 导出当前筛选后的日志为 CSV（所见即所导，带 BOM，Excel 打开不乱码）。
 */
function exportLogsCsv(): void {
  const table: Array<Array<unknown>> = [
    ["时间", "级别", "阶段", "操作", "模块", "耗时ms", "消息"],
    ...visibleLogs.value.map(item => [
      logTimeFull(item.startedAt),
      item.level,
      item.status === "start" ? "开始" : item.status === "failure" ? "失败" : "完成",
      actionText(item.action),
      item.symbolicName,
      item.duration,
      item.message,
    ]),
  ];
  downloadCsv(`osgi-log-${fileTimestamp()}.csv`, table);
  msgSuccess(`已导出 ${visibleLogs.value.length} 条日志（CSV）`);
}

/**
 * 导出当前筛选后的日志为 JSON（保留原始字段，便于程序化排查）。
 */
function exportLogsJson(): void {
  downloadTextFile(
    JSON.stringify(visibleLogs.value, null, 2),
    `osgi-log-${fileTimestamp()}.json`,
    "application/json;charset=utf-8",
  );
  msgSuccess(`已导出 ${visibleLogs.value.length} 条日志（JSON）`);
}

/**
 * 日志时间格式化：只显示时分秒，日期在同一小时内没有信息量。
 *
 * @param ms 毫秒时间戳
 * @return HH:mm:ss
 */
function logTime(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 操作名中文。
 *
 * @param action 后端操作名
 * @return 展示文本
 */
function actionText(action: string): string {
  const labels: Record<string, string> = {
    install: "安装",
    update: "升级",
    start: "启动",
    stop: "停止",
    uninstall: "卸载",
    "delete-jar": "删除文件",
    list: "读取清单",
    jars: "读取目录",
    download: "下载",
    stats: "读取统计",
    services: "读取服务",
    snapshot: "读取快照",
    context: "读取上下文",
  };
  return labels[action] ?? action;
}

function pickInstall(): void {
  if (installInput.value) {
    installInput.value.value = "";
    installInput.value.click();
  }
}

function pickUpgrade(symbolicName: string): void {
  upgradeTarget.value = symbolicName;
  if (upgradeInput.value) {
    upgradeInput.value.value = "";
    upgradeInput.value.click();
  }
}

/**
 * 安装并启动单个 jar 文件，选择文件与拖放共用。
 *
 * @param file 插件 jar
 */
async function installFromFile(file: File): Promise<void> {
  globalBusy.value = true;
  try {
    const bundle = await installBundle(file, true);
    msgSuccess(`已安装并启动 ${bundle.symbolicName}:${bundle.version}`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    globalBusy.value = false;
  }
}

/**
 * 从候选文件中取出待安装的 jar：先做后缀预校验，多文件时明示取舍。
 *
 * <p>拖入 txt 等非 jar 文件应立即被前端拦下，而不是等后端解析失败；
 * dataTransfer 一次可能带来多个文件，这里只装第一个，但要把「丢了几个」说清楚。</p>
 *
 * @param files 候选文件列表
 * @return 可安装的 jar；校验不通过返回 null
 */
function pickJarFile(files: FileList | null): File | null {
  if (!files || !files.length) {
    return null;
  }
  const file = files[0];
  if (files.length > 1) {
    msgError(`一次只安装一个插件，已忽略其余 ${files.length - 1} 个文件`);
  }
  if (!file.name.toLowerCase().endsWith(".jar")) {
    msgError(`仅支持 .jar 插件包，收到的是「${file.name}」`);
    return null;
  }
  return file;
}

function onInstallFile(event: Event): void {
  const file = pickJarFile((event.target as HTMLInputElement).files);
  if (file) {
    void installFromFile(file);
  }
}

/** 拖拽到上传坞直接安装 */
function onDropInstall(event: DragEvent): void {
  const file = pickJarFile(event.dataTransfer?.files ?? null);
  if (file) {
    void installFromFile(file);
  }
}

/** 上传坞 drop 事件：落下后熄灭通电态 */
function onDockDrop(event: DragEvent): void {
  dockHot.value = false;
  onDropInstall(event);
}

async function onUpgradeFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  const target = upgradeTarget.value;
  if (!file || !target) {
    return;
  }
  try {
    await message.confirm(
      `用 ${file.name} 原地升级 ${target}？升级期间该插件会短暂停止。`,
      "升级插件",
      "升级",
      "取消",
      "warning",
    );
  } catch {
    return;
  }
  beginBusy(target);
  try {
    const bundle = await updateBundle(target, file);
    msgSuccess(`已升级 ${bundle.symbolicName} 到 ${bundle.version}`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    endBusy(target);
    upgradeTarget.value = "";
  }
}

async function toggle(row: OsgiBundle): Promise<void> {
  if (isSystem(row)) {
    return;
  }
  beginBusy(row.symbolicName);
  try {
    if (row.state === "ACTIVE") {
      await stopBundle(row.symbolicName);
      msgSuccess(`已停止 ${row.symbolicName}`);
    } else {
      await startBundle(row.symbolicName);
      msgSuccess(`已启动 ${row.symbolicName}`);
    }
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    endBusy(row.symbolicName);
  }
}

async function remove(row: OsgiBundle): Promise<void> {
  if (isSystem(row)) {
    return;
  }
  try {
    await message.confirm(
      `确认卸载 ${row.symbolicName}？该插件提供的扩展会立即失效，jar 文件仍保留在部署目录。`,
      "卸载插件",
      "卸载",
      "取消",
      "warning",
    );
  } catch {
    return;
  }
  beginBusy(row.symbolicName);
  try {
    await uninstallBundle(row.symbolicName);
    msgSuccess(`已卸载 ${row.symbolicName}`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    endBusy(row.symbolicName);
  }
}

async function download(row: OsgiBundle): Promise<void> {
  try {
    await downloadBundle(row.symbolicName, row.version);
  } catch (error) {
    msgError(errText(error));
  }
}

/** 批量勾选的符号名集合（系统 bundle 不可选） */
const selected = ref(new Set<string>());
/** 批量操作执行中：期间禁用批量按钮与勾选 */
const batchRunning = ref(false);

/** 当前筛选结果里可勾选的模块（排除系统 bundle） */
const selectableRows = computed(() => filteredRows.value.filter(row => !isSystem(row)));

/** 是否全选（可选项非空且全部勾中） */
const allPicked = computed(
  () => selectableRows.value.length > 0 && selectableRows.value.every(row => selected.value.has(row.symbolicName)),
);

/**
 * 勾选 / 取消勾选一个模块。
 *
 * @param row bundle
 */
function togglePick(row: OsgiBundle): void {
  const next = new Set(selected.value);
  if (next.has(row.symbolicName)) {
    next.delete(row.symbolicName);
  } else {
    next.add(row.symbolicName);
  }
  selected.value = next;
}

/** 全选 / 清空当前筛选结果里的可勾选模块 */
function togglePickAll(): void {
  selected.value = allPicked.value ? new Set() : new Set(selectableRows.value.map(row => row.symbolicName));
}

/** 清空勾选 */
function clearPicks(): void {
  selected.value = new Set();
}

/**
 * 批量执行启停 / 卸载。
 *
 * <p>后端只有单插件接口，这里按勾选顺序逐个调用；任一失败不中断其余，
 * 最后汇总成功 / 失败并整体刷新一次。批量卸载不可逆，与单体卸载一样必须
 * 二次确认；确认文案把影响范围（个数与后果）写全。</p>
 *
 * @param kind 操作类型
 */
async function runBatch(kind: "start" | "stop" | "uninstall"): Promise<void> {
  const names = [...selected.value];
  if (!names.length || batchRunning.value) {
    return;
  }
  const label = kind === "start" ? "启动" : kind === "stop" ? "停止" : "卸载";
  try {
    await message.confirm(
      `确认对 ${names.length} 个插件执行批量${label}？${
        kind === "uninstall" ? "卸载后这些插件提供的扩展会立即失效（jar 文件保留在部署目录）。" : ""
      }`,
      `批量${label}`,
      label,
      "取消",
      kind === "uninstall" ? "warning" : "info",
    );
  } catch {
    return;
  }
  batchRunning.value = true;
  names.forEach(beginBusy);
  const failed: string[] = [];
  let ok = 0;
  try {
    for (const name of names) {
      try {
        if (kind === "start") {
          await startBundle(name);
        } else if (kind === "stop") {
          await stopBundle(name);
        } else {
          await uninstallBundle(name);
        }
        ok += 1;
      } catch (error) {
        failed.push(`${name}（${errText(error)}）`);
      }
    }
    await reloadAll();
  } finally {
    names.forEach(endBusy);
    batchRunning.value = false;
    clearPicks();
  }
  if (!failed.length) {
    msgSuccess(`批量${label}完成：${ok} 个`);
  } else {
    msgError(`批量${label}：成功 ${ok} 个，失败 ${failed.length} 个 —— ${failed.join("；")}`);
  }
}

/** 轨道天体点击：滚动定位到对应 1U 模块并临时高亮 */
function locate(row: OsgiBundle): void {
  highlightName.value = row.symbolicName;
  window.setTimeout(() => {
    if (highlightName.value === row.symbolicName) {
      highlightName.value = "";
    }
  }, 2400);
  const el = document.getElementById(`osgi-ch-${row.bundleId}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * 从车辆段跳到对应的运行时模块。
 *
 * <p>文件与 bundle 的对应关系唯一可靠的键是符号名（文件名可以随便改），
 * 因此先按符号名找 bundle，找不到就只提示，不改视图——静默无反应会让人以为是点了没生效。</p>
 *
 * @param symbolicName bundle 符号名
 */
function locateBySymbolic(symbolicName: string): void {
  const row = rows.value.find(item => item.symbolicName === symbolicName);
  if (!row) {
    msgError(`框架中已找不到 ${symbolicName}，请刷新后再看`);
    return;
  }
  drawerOpen.value = true;
  void nextTick(() => {
    locate(row);
  });
}

/**
 * 字节数格式化。
 *
 * @param size 字节数，未知为 -1
 * @return 展示文本
 */
function formatSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) {
    return "大小未知";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 毫秒时间戳格式化为本地时间。
 *
 * @param ms 毫秒时间戳，未知为 0
 * @return 展示文本
 */
function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "时间未知";
  }
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

let refreshTimer: number | undefined;

/** 搜索输入防抖：停止输入 200ms 后才应用过滤，避免逐字符全表过滤 */
watch(searchInput, value => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    searchText.value = value;
  }, 200);
});

watch(autoRefresh, on => {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
  if (on) {
    let ticks = 0;
    refreshTimer = window.setInterval(() => {
      ticks += 1;
      if (ticks % 3 === 1) {
        // 每第 1/4/7… 轮全量刷新（含统计 / 快照 / 服务总线）
        void reloadAll();
      } else {
        // 其余轮次只刷易变的模块与 jar 清单；统计类低频观测数据降频跟随
        void (async () => {
          await Promise.all([reload(), reloadJars()]);
        })();
      }
    }, 30_000);
  }
});

onMounted(() => {
  void reloadAll();
  bindLogChannel();
});

onBeforeUnmount(() => {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
  window.clearTimeout(searchTimer);
  unsubscribeLog?.();
  unsubscribeLog = undefined;
});
</script>

<template>
  <div class="osgi-page">
    <!-- 轨道机架控制台主体：无页头，页面身份是工具带上的任务铭牌 -->
    <section class="orc" :class="{ 'orc--booting': loading && !rows.length }">
      <!-- 工具带：任务铭牌 + 搜索 + 线路筛选 + 主操作 -->
      <div class="orc-top">
        <div class="orc-brand">
          <span class="orc-brand__mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <div class="orc-brand__txt">
            <span class="orc-brand__name">OSGi ORBITAL RACK</span>
            <span class="orc-brand__sub">插件机架 · {{ rows.length }} 单元 · 入轨 {{ activeCount }}</span>
          </div>
          <span class="orc-live" :class="{ 'orc-live--off': !logChannelReady }">
            <i class="orc-live__dot"></i>{{ logChannelReady ? "TELEMETRY · LINK OK" : "SOCKET 未接入" }}
          </span>
        </div>
        <div class="orc-top__ops">
          <div class="orc-search">
            <el-input
              v-model="searchInput"
              placeholder="搜索符号名 / ID / 文件名…"
              clearable
              :prefix-icon="Search"
            />
          </div>
          <div class="orc-lines">
            <button
              v-for="f in lineFilters"
              :key="f.key"
              type="button"
              class="orc-line"
              :class="{ 'orc-line--on': filterState === f.key }"
              @click="filterState = f.key"
            >
              <i class="orc-line__dot" aria-hidden="true"></i>{{ f.label }}
            </button>
          </div>
          <select v-model="sortKey" class="orc-sort" title="模块排序">
            <option value="default">机架序</option>
            <option value="name">按名称</option>
            <option value="id">按 ID</option>
            <option value="version">按版本</option>
            <option value="state">按状态</option>
          </select>
          <ReButton icon="RefreshRight" :loading="loading" @click="reloadAll">刷新</ReButton>
          <ReButton type="primary" icon="Upload" :disabled="globalBusy" @click="pickInstall">上传 jar</ReButton>
        </div>
      </div>

      <!-- 端点未开启的持久警示：管理接口 404/405 时出现，刷新成功后消失 -->
      <div v-if="endpointDown" class="orc-alert" role="alert">
        <b>OSGi 管理端点不可用</b>
        <span>
          清单 / 操作接口返回 404/405：请确认后端已开启 <code>plugin.osgi.endpoint.enabled=true</code>，
          开启后点「刷新」即可恢复本页。
        </span>
      </div>

      <!-- 遥测读数带 -->
      <div class="orc-tele">
        <span v-for="c in chips" :key="c.label" class="orc-tele__item" :title="c.label">
          <span class="orc-tele__label">{{ c.label }}</span>
          <b class="orc-tele__val">{{ c.value }}</b>
        </span>
      </div>

      <!-- 桥接定义明细：计数之外给出名字清单，排查「桥接里到底注册了什么」 -->
      <div v-if="definitions.length" class="orc-detail">
        <button type="button" class="orc-detail__head" @click="defsOpen = !defsOpen">
          <span>桥接定义明细 · {{ definitions.length }} 项（点开查看）</span>
          <span class="orc-detail__caret">{{ defsOpen ? "▾" : "▸" }}</span>
        </button>
        <div v-show="defsOpen" class="orc-detail__body">
          <code v-for="def in definitions" :key="def" class="orc-detail__chip">{{ def }}</code>
        </div>
      </div>

      <!-- 已注册服务类型明细：与服务总线对照，看哪些类型真正注册进了框架 -->
      <div v-if="registeredServiceTypes.length" class="orc-detail">
        <button type="button" class="orc-detail__head" @click="svcTypesOpen = !svcTypesOpen">
          <span>已注册服务类型 · {{ registeredServiceTypes.length }} 类（点开查看）</span>
          <span class="orc-detail__caret">{{ svcTypesOpen ? "▾" : "▸" }}</span>
        </button>
        <div v-show="svcTypesOpen" class="orc-detail__body">
          <code v-for="type in registeredServiceTypes" :key="type" class="orc-detail__chip">{{ type }}</code>
        </div>
      </div>

      <!-- 验收拒绝明细：rejected 非空时展开可读全文，排查「插件为何未被接受」 -->
      <div v-if="rejectedCount" class="orc-reject">
        <button type="button" class="orc-reject__head" @click="rejectOpen = !rejectOpen">
          <span>验收拒绝明细 · {{ rejectedCount }} 项（点开查看）</span>
          <span class="orc-reject__caret">{{ rejectOpen ? "▾" : "▸" }}</span>
        </button>
        <pre v-show="rejectOpen" class="orc-reject__body">{{ rejectedText }}</pre>
      </div>

      <!-- 主体：轨道总览 + 1U 模块墙 + 服务总线 -->
      <div class="orc-main">
        <!-- V09 轨道总览：点击天体定位到机架模块 -->
        <aside class="orc-orbit">
          <div class="orc-orbit__head">ORBIT MAP<span>状态总览 · 点击定位模块</span></div>
          <div class="orc-orbit__field">
            <i class="orc-orbit__ring orc-orbit__ring--outer" aria-hidden="true"></i>
            <i class="orc-orbit__ring orc-orbit__ring--mid" aria-hidden="true"></i>
            <i class="orc-orbit__ring orc-orbit__ring--inner" aria-hidden="true"></i>
            <el-tooltip
              :content="framework ? `FW ${framework.symbolicName} v${framework.version}` : 'FW —'"
              placement="top"
            >
              <div class="orc-orbit__core">
                <b>FW</b>
                <span>{{ framework ? chNo(framework.bundleId) : "—" }}</span>
              </div>
            </el-tooltip>
            <el-tooltip
              v-for="body in orbitBodies"
              :key="body.row.bundleId"
              :content="`${body.row.symbolicName} · v${body.row.version} · ${stateText(body.row.state)}`"
              placement="top"
            >
              <button
                type="button"
                class="orc-sat"
                :class="[
                  `orc-sat--${body.ring}`,
                  `orc-sat--${body.row.state.toLowerCase()}`,
                  { 'orc-sat--hl': hoverName === body.row.symbolicName, 'orc-sat--sm': body.small },
                ]"
                :style="{ left: `${body.x}%`, top: `${body.y}%` }"
                @click="locate(body.row)"
                @mouseenter="hoverName = body.row.symbolicName"
                @mouseleave="hoverName = ''"
              >
                <i class="orc-sat__dot" aria-hidden="true"></i>
                <span class="orc-sat__id">{{ chNo(body.row.bundleId) }}</span>
              </button>
            </el-tooltip>
          </div>
          <div class="orc-orbit__legend">
            <span v-for="leg in orbitLegend" :key="leg.key" class="orc-orbit__leg">
              <i :class="`orc-orbit__legdot orc-orbit__legdot--${leg.key}`" aria-hidden="true"></i>
              {{ leg.label }} <b>{{ leg.count }}</b>
            </span>
          </div>
          <div v-if="stateLegend.length" class="orc-orbit__states">
            <span v-for="st in stateLegend" :key="st.key" class="orc-orbit__state">
              <i :class="`orc-orbit__statedot orc-orbit__statedot--${st.key}`" aria-hidden="true"></i>
              {{ st.label }} <b>{{ st.count }}</b>
            </span>
          </div>
        </aside>

        <!-- V01 机架 + V06 芯片：1U 模块墙 -->
        <div class="orc-rack">
          <!-- 批量操作条：勾选模块后出现，随勾选数量变化 -->
          <div v-if="selected.size" class="orc-batch">
            <label class="orc-batch__all">
              <input type="checkbox" :checked="allPicked" :disabled="batchRunning" @change="togglePickAll" />
              全选本屏
            </label>
            <span class="orc-batch__count">已选 {{ selected.size }} 个模块</span>
            <ReButton size="small" type="success" :disabled="batchRunning" @click="runBatch('start')">
              批量启动
            </ReButton>
            <ReButton size="small" type="warning" :disabled="batchRunning" @click="runBatch('stop')">
              批量停止
            </ReButton>
            <ReButton size="small" type="danger" :disabled="batchRunning" @click="runBatch('uninstall')">
              批量卸载
            </ReButton>
            <ReButton size="small" :disabled="batchRunning" @click="clearPicks">取消选择</ReButton>
          </div>
          <div class="orc-rack__slots" :class="{ 'orc-rack__slots--empty': !loading && !filteredRows.length }">
            <article
              v-for="row in filteredRows"
              :key="row.bundleId"
              :id="`osgi-ch-${row.bundleId}`"
              class="orc-ch"
              :class="[
                `orc-ch--${row.state.toLowerCase()}`,
                {
                  'orc-ch--hl': highlightName === row.symbolicName || hoverName === row.symbolicName,
                },
              ]"
              @mouseenter="hoverName = row.symbolicName"
              @mouseleave="hoverName = ''"
            >
              <i class="orc-ch__notch" aria-hidden="true"></i>
              <div class="orc-ch__id">
                <input
                  v-if="!isSystem(row)"
                  type="checkbox"
                  class="orc-ch__pick"
                  :checked="selected.has(row.symbolicName)"
                  :disabled="batchRunning"
                  :aria-label="`选择 ${row.symbolicName}`"
                  @change="togglePick(row)"
                />
                <i class="orc-ch__led" aria-hidden="true"></i>
                <span class="orc-ch__u">U{{ chNo(row.bundleId) }}</span>
                <span class="orc-ch__bid">#{{ row.bundleId }}</span>
              </div>

              <div class="orc-ch__body">
                <button type="button" class="orc-ch__name" title="点击展开 / 收起详情" @click="toggleDetail(row)">
                  <template v-for="(piece, pieceIndex) in namePieces(row.symbolicName)" :key="pieceIndex">
                    <mark v-if="piece.hit" class="orc-ch__hit">{{ piece.text }}</mark>
                    <template v-else>{{ piece.text }}</template>
                  </template>
                  <span class="orc-ch__ver">v{{ row.version }}</span>
                  <span v-if="failedStarts.has(row.symbolicName)" class="orc-ch__fail">启动失败</span>
                </button>

                <!-- 引脚式生命周期相位：装填 → 解析 → 点火 → 入轨 -->
                <div class="orc-ch__pins" :title="`生命周期 · ${stateText(row.state)}`">
                  <span class="orc-ch__pin" :class="{ 'orc-ch__pin--on': stateLevel(row.state) >= 3 }">
                    <i aria-hidden="true"></i>装填
                  </span>
                  <span class="orc-ch__pin" :class="{ 'orc-ch__pin--on': stateLevel(row.state) >= 4 }">
                    <i aria-hidden="true"></i>解析
                  </span>
                  <span class="orc-ch__pin" :class="{ 'orc-ch__pin--on': stateLevel(row.state) >= 6 }">
                    <i aria-hidden="true"></i>点火
                  </span>
                  <span class="orc-ch__pin" :class="{ 'orc-ch__pin--on': stateLevel(row.state) >= 8 }">
                    <i aria-hidden="true"></i>入轨
                  </span>
                  <span v-if="row.state === 'STOPPING'" class="orc-ch__note">停止程序执行中</span>
                  <span v-else-if="row.state === 'UNINSTALLED'" class="orc-ch__note orc-ch__note--bad">已下架</span>
                </div>

                <div class="orc-ch__ops">
                  <template v-if="isSystem(row)">
                    <ReTag type="info" effect="plain">系统内置</ReTag>
                    <span class="orc-ch__sysnote">框架中枢，无启停 / 升级 / 卸载操作</span>
                  </template>
                  <template v-else>
                    <ReTag
                      :type="stateTagType(row.state)"
                      effect="plain"
                      :style="row.state === 'STOPPING' ? { '--el-tag-text-color': 'var(--brand-400)' } : undefined"
                    >
                      {{ stateText(row.state) }}
                    </ReTag>
                    <ReButton
                      size="small"
                      :type="row.state === 'ACTIVE' ? 'warning' : 'success'"
                      :disabled="isBusy(row.symbolicName)"
                      @click="toggle(row)"
                    >
                      {{ row.state === "ACTIVE" ? "停止" : "启动" }}
                    </ReButton>
                    <ReButton size="small" :disabled="isBusy(row.symbolicName)" @click="pickUpgrade(row.symbolicName)">
                      升级
                    </ReButton>
                    <ReButton size="small" :disabled="isBusy(row.symbolicName)" @click="download(row)">下载</ReButton>
                    <ReButton size="small" type="danger" :disabled="isBusy(row.symbolicName)" @click="remove(row)">
                      卸载
                    </ReButton>
                  </template>
                </div>

                <!-- 行内详情：jar 来源与文件信息，点击模块名展开 -->
                <div v-if="detailName === row.symbolicName" class="orc-ch__detail">
                  <span><i>位置</i><code :title="row.location">{{ row.location }}</code></span>
                  <span>
                    <i>jar</i>
                    <code>{{ jarOf(row.symbolicName)?.fileName ?? "不在部署目录" }}</code>
                  </span>
                  <span>
                    <i>大小</i>
                    {{ jarOf(row.symbolicName) ? formatSize(jarOf(row.symbolicName)!.size) : "—" }}
                  </span>
                  <span>
                    <i>修改</i>
                    {{ jarOf(row.symbolicName) ? formatTime(jarOf(row.symbolicName)!.lastModified) : "—" }}
                  </span>
                </div>
              </div>

              <div class="orc-ch__meter" :title="`状态电平 · ${stateText(row.state)}`">
                <div class="orc-ch__ladder">
                  <i v-for="i in 10" :key="i" :class="ladderClass(row.state, i)"></i>
                </div>
                <span class="orc-ch__lvl">LVL <b>{{ stateLevel(row.state) }}</b>/10</span>
              </div>
              <i class="orc-ch__bus" aria-hidden="true"></i>
            </article>

            <div v-if="!loading && !filteredRows.length" class="orc-empty">
              <template v-if="loadError && !rows.length">
                <p class="orc-empty__bad">插件清单加载失败</p>
                <p class="orc-empty__hint">{{ loadError }}</p>
                <button type="button" class="orc-empty__clear" @click="reloadAll">重试加载</button>
              </template>
              <template v-else-if="rows.length">
                <p>没有符合当前搜索 / 筛选条件的 bundle</p>
                <button type="button" class="orc-empty__clear" @click="clearFilters">清除搜索与筛选</button>
              </template>
              <div v-else>
                <p>机架上暂无插件模块</p>
                <p class="orc-empty__hint">
                  从车辆段上传 jar 即可上机；端点需开启 <code>plugin.osgi.endpoint.enabled=true</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- V02 线网 + V06 排针：服务总线 -->
        <aside class="orc-svc">
          <div class="orc-svc__head">SERVICE BUS<span>服务接驳 · {{ services.length }} 路</span></div>
          <div v-if="services.length" class="orc-svc__jacks">
            <div
              v-for="(item, index) in serviceRows"
              :key="item.svc.osgiServiceId"
              class="orc-jack"
              :class="{ 'orc-jack--open': serviceOpenId === item.svc.osgiServiceId }"
              @click="toggleService(item.svc)"
            >
              <span class="orc-jack__no">J{{ index + 1 }}</span>
              <div class="orc-jack__txt">
                <span class="orc-jack__nm">{{ item.svc.type }}</span>
                <span class="orc-jack__pid">{{ item.svc.pid }}</span>
              </div>
              <span v-if="item.effective" class="orc-jack__eff">生效</span>
              <i class="orc-jack__led" aria-hidden="true"></i>
              <span class="orc-jack__caret" aria-hidden="true">
                {{ serviceOpenId === item.svc.osgiServiceId ? "▾" : "▸" }}
              </span>
              <div v-if="serviceOpenId === item.svc.osgiServiceId" class="orc-jack__more" @click.stop>
                <span class="orc-jack__row">
                  <i>实现类</i>
                  <code :title="item.svc.implClass">{{ item.svc.implClass || "—" }}</code>
                </span>
                <span class="orc-jack__row">
                  <i>ranking</i>
                  <code>{{ item.svc.ranking }}{{ item.effective ? " · 当前生效" : "" }}</code>
                </span>
                <pre class="orc-jack__props">{{ formatProps(item.svc.properties) }}</pre>
              </div>
            </div>
          </div>
          <p v-else class="orc-svc__empty">当前无已注册服务，启动 bundle 后自动接通线路</p>
        </aside>
      </div>

      <!-- 测控带：滚轮 + 磁带 + 载荷帧 -->
      <div class="orc-comm">
        <div class="orc-reel" :class="{ 'orc-reel--spin': logPulse > 0 }" :key="`ra-${logPulse}`"></div>
        <div class="orc-tape" :key="`t-${logPulse}`">
          <span v-for="(item, index) in tapeTicks" :key="`${item.startedAt}-${index}`" class="orc-tape__tick">
            ● {{ actionText(item.action) }} · {{ item.symbolicName || "—" }} · {{ logTime(item.startedAt) }}
          </span>
          <span v-if="!tapeTicks.length" class="orc-tape__tick orc-tape__tick--idle">等待操作…</span>
        </div>
        <div class="orc-reel orc-reel--r" :class="{ 'orc-reel--spin': logPulse > 0 }" :key="`rb-${logPulse}`"></div>
        <div class="orc-frame">
          <code v-if="lastFrame">
            { module: "{{ lastFrame.module }}", event: "{{ lastFrame.event }}", dataId: "{{ lastFrame.dataId }}", ts: "{{ lastFrame.timestamp }}" }
          </code>
          <code v-else class="orc-frame--idle">payload { module, event, data, dataId, timestamp } · 等待首帧…</code>
        </div>
      </div>
    </section>

    <!-- 车辆段：部署目录 jar 仓（V01 备件架 + V02 车辆段 + V06 料盘，拉出式） -->
    <section class="depot" :class="{ 'depot--open': drawerOpen }">
      <button type="button" class="depot__grip" @click="drawerOpen = !drawerOpen">
        <span class="depot__grip__lines" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="depot__grip__ttl">车辆段 · 部署目录 <b>{{ jars.length }}</b> 个 jar</span>
        <span class="depot__grip__caret">{{ drawerOpen ? "▾ 收回" : "▸ 拉出" }}</span>
      </button>

      <div v-show="drawerOpen" class="depot__body">
        <div class="depot__tools">
          <div class="depot__seg">
            <button
              type="button"
              class="depot__seg__btn"
              :class="{ 'depot__seg__btn--on': trayFilter === 'all' }"
              @click="trayFilter = 'all'"
            >
              全部
            </button>
            <button
              type="button"
              class="depot__seg__btn"
              :class="{ 'depot__seg__btn--on': trayFilter === 'installed' }"
              @click="trayFilter = 'installed'"
            >
              在框架中
            </button>
            <button
              type="button"
              class="depot__seg__btn"
              :class="{ 'depot__seg__btn--on': trayFilter === 'only' }"
              @click="trayFilter = 'only'"
            >
              仅文件
            </button>
          </div>
          <div class="depot__search">
            <el-input
              v-model="traySearch"
              placeholder="搜索文件名 / 符号名…"
              clearable
              size="small"
              :prefix-icon="Search"
            />
          </div>
          <div class="depot__auto">
            <span>每 30s 自动巡检</span>
            <el-switch v-model="autoRefresh" size="small" />
          </div>
        </div>

        <div class="depot__list" :class="{ 'depot__list--empty': !jarLoading && !filteredJars.length }">
          <div
            v-for="jar in filteredJars"
            :key="jar.fileName"
            class="depot__jar"
            :class="jar.installed ? 'depot__jar--on' : 'depot__jar--off'"
          >
            <span class="depot__jar__bar" aria-hidden="true"></span>
            <div class="depot__jar__body">
              <div class="depot__jar__name">
                {{ jar.fileName }}
                <span class="depot__jar__size">{{ formatSize(jar.size) }}</span>
                <el-tooltip v-if="jarFlag(jar)" :content="jarFlag(jar)!.tip" placement="top">
                  <span :class="`depot__jar__flag depot__jar__flag--${jarFlag(jar)!.tone}`">
                    {{ jarFlag(jar)!.text }}
                  </span>
                </el-tooltip>
              </div>
              <div class="depot__jar__meta">
                <span v-if="jar.installed">框架中 · {{ jar.symbolicName }} · {{ stateText(jar.state ?? "") }}</span>
                <span v-else>仅文件 · 未上机</span>
                <span class="depot__jar__time">{{ formatTime(jar.lastModified) }}</span>
              </div>
            </div>
            <ReTag :type="jar.installed ? 'success' : 'info'" effect="plain">
              {{ jar.installed ? "在框架中" : "仅文件" }}
            </ReTag>
            <div class="depot__jar__ops">
              <ReButton
                v-if="jar.installed"
                size="small"
                :disabled="!!jarBusy"
                @click="locateBySymbolic(jar.symbolicName ?? '')"
              >
                查看模块
              </ReButton>
              <ReButton
                size="small"
                type="danger"
                :disabled="jar.installed || !!jarBusy"
                :loading="jarBusy === jar.fileName"
                :title="jar.installed ? '仍在框架中，请先在模块上卸载' : ''"
                @click="removeJar(jar)"
              >
                删除文件
              </ReButton>
            </div>
          </div>

          <div v-if="!jarLoading && !filteredJars.length" class="orc-empty">
            <p v-if="jars.length">没有符合当前筛选条件的文件</p>
            <div v-else>
              <p>车辆段暂无 jar 文件</p>
              <p class="orc-empty__hint">上传安装后会在这里显示，卸载后可在此删除文件</p>
            </div>
          </div>
        </div>

        <div
          class="depot__dock"
          :class="{ 'depot__dock--hot': dockHot }"
          @click="pickInstall"
          @dragover.prevent
          @dragenter.prevent="dockHot = true"
          @dragleave.prevent="dockHot = false"
          @drop.prevent="onDockDrop"
        >
          <span class="depot__dock__plus">+</span>
          <span>拖入 .jar 即刻上机架 <small>· 同符号名上传 = 原地升级 · 点击选择文件</small></span>
        </div>
      </div>
    </section>

    <!-- 测控日志带：实时操作日志（可折叠） -->
    <section class="orc-log" :class="{ 'orc-log--closed': !logOpen }">
      <header class="orc-log__head" @click="logOpen = !logOpen">
        <span class="orc-log__caret">{{ logOpen ? "▾" : "▸" }}</span>
        <span class="orc-log__title">测控日志</span>
        <span class="orc-log__chan" :class="{ 'orc-log__chan--off': !logChannelReady }">
          {{ logChannelReady ? "socket · osgi / operation-log" : "socket 未接入" }}
        </span>
        <span v-if="problemCount" class="orc-log__badge">{{ problemCount }} 异常</span>
        <span class="orc-log__count">{{ logs.length }} 条</span>
        <div class="orc-log__spacer"></div>
        <select v-model="logAction" class="orc-log__sel" title="按操作类型筛选" @click.stop>
          <option value="all">全部操作</option>
          <option v-for="action in logActions" :key="action" :value="action">{{ actionText(action) }}</option>
        </select>
        <button
          type="button"
          class="orc-log__act"
          :class="{ 'orc-log__act--on': logOnlyProblem }"
          @click.stop="logOnlyProblem = !logOnlyProblem"
        >
          仅异常
        </button>
        <button
          type="button"
          class="orc-log__act"
          title="导出当前筛选后的日志为 CSV（Excel 可直接打开）"
          @click.stop="exportLogsCsv"
        >
          导出 CSV
        </button>
        <button type="button" class="orc-log__act" title="导出当前筛选后的日志为 JSON" @click.stop="exportLogsJson">
          导出 JSON
        </button>
        <button type="button" class="orc-log__act" @click.stop="clearLogs">清空</button>
      </header>

      <div v-show="logOpen" ref="logBox" class="orc-log__body">
        <p v-if="!visibleLogs.length" class="orc-log__empty">
          {{ logs.length ? "当前没有异常日志" : "等待操作…安装 / 卸载 / 启停 / 升级 的每一步都会实时出现在这里" }}
        </p>
        <div
          v-for="(item, index) in visibleLogs"
          :key="`${item.startedAt}-${index}`"
          class="orc-log__row"
          :class="`orc-log__row--${item.level.toLowerCase()}`"
        >
          <span class="orc-log__time">{{ logTime(item.startedAt) }}</span>
          <span class="orc-log__stage" :class="`orc-log__stage--${item.status}`">
            {{ item.status === "start" ? "开始" : item.status === "failure" ? "失败" : "完成" }}
          </span>
          <span class="orc-log__action">{{ actionText(item.action) }}</span>
          <button
            type="button"
            class="orc-log__symbol"
            :disabled="!item.symbolicName"
            title="定位到对应模块"
            @click="locateBySymbolic(item.symbolicName)"
          >
            {{ item.symbolicName || "—" }}
          </button>
          <span class="orc-log__msg">{{ item.message || "—" }}</span>
          <span v-if="item.duration > 0" class="orc-log__dur">{{ item.duration }}ms</span>
        </div>
      </div>
    </section>

    <input ref="installInput" type="file" accept=".jar" class="osgi-page__file" @change="onInstallFile" />
    <input ref="upgradeInput" type="file" accept=".jar" class="osgi-page__file" @change="onUpgradeFile" />
  </div>
</template>

<style scoped>
.osgi-page {
  display: flex;
  flex-direction: column;
}

.osgi-page__file {
  display: none;
}

/* ============ 轨道机架控制台主体 ============ */
.orc {
  --orc-mono: ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, "Courier New", monospace;
  --orc-frame: var(--border-default);
  --orc-panel: var(--bg-container);
  --orc-well: var(--bg-fill);
  border: 1px solid var(--orc-frame);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(1100px 180px at 50% 0%, color-mix(in srgb, var(--brand-500) 7%, transparent), transparent 70%),
    var(--orc-panel);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.orc--booting .orc-rack__slots {
  animation: orc-breathe 1.4s ease-in-out infinite;
}

@keyframes orc-breathe {
  50% {
    opacity: 0.55;
  }
}

/* ---- 工具带：任务铭牌 + 搜索 + 线路筛选 + 主操作 ---- */
.orc-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-bottom: 1px solid var(--orc-frame);
  background: color-mix(in srgb, var(--brand-500) 5%, var(--orc-panel));
}

.orc-brand {
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.orc-brand__mark {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: var(--brand-gradient);
}

.orc-brand__mark i {
  width: 16px;
  height: 2px;
  border-radius: 2px;
  background: var(--text-inverse);
  opacity: 0.9;
}

.orc-brand__mark i:nth-child(2) {
  width: 10px;
  opacity: 0.65;
}

.orc-brand__mark i:nth-child(3) {
  width: 13px;
  opacity: 0.4;
}

.orc-brand__txt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.orc-brand__name {
  font-family: var(--orc-mono);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: var(--brand-600);
}

.orc-brand__sub {
  font-family: var(--orc-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--text-tertiary);
}

.orc-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 3px 10px;
  border: 1px solid var(--status-success);
  border-radius: 9999px;
  font-family: var(--orc-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--status-success);
}

.orc-live--off {
  border-color: var(--status-warning);
  color: var(--status-warning);
}

.orc-live__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: orc-blink 1.6s infinite;
}

@keyframes orc-blink {
  50% {
    opacity: 0.25;
  }
}

.orc-top__ops {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.orc-search {
  width: 220px;
}

/* V02 线路徽章：状态筛选 */
.orc-lines {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}

.orc-line {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: 9999px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.orc-line:hover {
  color: var(--brand-500);
  border-color: color-mix(in srgb, var(--brand-500) 45%, var(--border-default));
}

.orc-line--on {
  border-color: var(--brand-500);
  background: color-mix(in srgb, var(--brand-500) 10%, var(--bg-elevated));
  color: var(--brand-500);
  font-weight: 600;
}

.orc-line__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-default);
}

.orc-line--on .orc-line__dot {
  background: var(--brand-500);
  box-shadow: 0 0 6px color-mix(in srgb, var(--brand-500) 60%, transparent);
}

/* ---- 遥测读数带 ---- */
.orc-tele {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--orc-frame);
}

.orc-tele__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--orc-well);
  font-family: var(--orc-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
}

.orc-tele__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.orc-tele__val {
  color: var(--brand-500);
  font-size: 12px;
  font-weight: 700;
}

/* ---- 主体：轨道总览 + 模块墙 + 服务总线 ---- */
.orc-main {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr) 236px;
  align-items: stretch;
}

/* ---- V09 轨道总览 ---- */
.orc-orbit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-right: 1px solid var(--orc-frame);
  background: color-mix(in srgb, var(--brand-500) 3%, var(--orc-well));
  min-width: 0;
}

.orc-orbit__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: var(--orc-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--brand-500);
}

.orc-orbit__head span {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}

.orc-orbit__field {
  position: relative;
  width: 100%;
  max-width: 212px;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
}

.orc-orbit__ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed var(--border-default);
}

.orc-orbit__ring--inner {
  width: 46%;
  height: 46%;
  border-color: color-mix(in srgb, var(--status-success) 45%, var(--border-default));
}

.orc-orbit__ring--mid {
  width: 72%;
  height: 72%;
  border-color: color-mix(in srgb, var(--brand-500) 40%, var(--border-default));
}

.orc-orbit__ring--outer {
  width: 96%;
  height: 96%;
}

.orc-orbit__core {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 46px;
  height: 46px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--brand-500) 55%, var(--border-default));
  background: linear-gradient(140deg, color-mix(in srgb, var(--brand-500) 18%, var(--bg-elevated)), var(--bg-elevated));
  box-shadow: 0 0 14px color-mix(in srgb, var(--brand-500) 30%, transparent);
  font-family: var(--orc-mono);
}

.orc-orbit__core b {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--brand-500);
}

.orc-orbit__core span {
  font-size: 9px;
  color: var(--text-tertiary);
}

.orc-sat {
  --sat: var(--pulse-offline);
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border-default);
  border-radius: 50%;
  background: var(--bg-elevated);
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.orc-sat:hover {
  transform: translate(-50%, -50%) scale(1.18);
  border-color: var(--brand-500);
  box-shadow: 0 0 10px color-mix(in srgb, var(--brand-500) 35%, transparent);
  z-index: 2;
}

.orc-sat--active { --sat: var(--status-success); }
.orc-sat--starting { --sat: var(--status-warning); }
.orc-sat--resolved { --sat: var(--brand-500); }
.orc-sat--stopping { --sat: var(--brand-400); }
.orc-sat--installed { --sat: var(--metric-net); }
.orc-sat--uninstalled { --sat: var(--status-error); }

.orc-sat__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sat);
  box-shadow: 0 0 6px color-mix(in srgb, var(--sat) 70%, transparent);
}

.orc-sat__id {
  font-family: var(--orc-mono);
  font-size: 8px;
  line-height: 1;
  color: var(--text-secondary);
}

.orc-orbit__legend {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-secondary);
}

.orc-orbit__leg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.orc-orbit__leg b {
  color: var(--brand-500);
}

.orc-orbit__legdot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.orc-orbit__legdot--inner {
  background: var(--status-success);
}

.orc-orbit__legdot--mid {
  background: var(--brand-500);
}

.orc-orbit__legdot--outer {
  background: var(--border-default);
}

/* ---- V01 机架 + V06 芯片：1U 模块墙 ---- */
.orc-rack {
  min-width: 0;
  padding: 12px;
  background:
    repeating-linear-gradient(90deg, transparent 0 22px, color-mix(in srgb, var(--border-subtle) 55%, transparent) 22px 23px),
    var(--orc-panel);
}

.orc-rack__slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 10px;
}

.orc-rack__slots--empty {
  grid-template-columns: minmax(0, 1fr);
}

.orc-ch {
  --ch: var(--pulse-offline);
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px 12px 16px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.orc-ch:hover {
  border-color: color-mix(in srgb, var(--ch) 55%, var(--border-default));
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.orc-ch--hl {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-500) 25%, transparent), var(--shadow-md);
}

.orc-ch--active { --ch: var(--status-success); }
.orc-ch--starting { --ch: var(--status-warning); }
.orc-ch--resolved { --ch: var(--brand-500); }
.orc-ch--stopping { --ch: var(--brand-400); }
.orc-ch--installed { --ch: var(--metric-net); }
.orc-ch--uninstalled { --ch: var(--status-error); }

/* V06 芯片缺口 */
.orc-ch__notch {
  position: absolute;
  top: 0;
  left: 18px;
  width: 26px;
  height: 5px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: color-mix(in srgb, var(--ch) 40%, var(--border-subtle));
}

/* V01 模块左侧状态灯条 */
.orc-ch::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 14px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--ch);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ch) 60%, transparent);
}

.orc-ch__id {
  flex: none;
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding-right: 10px;
  border-right: 1px dashed var(--border-default);
}

.orc-ch__led {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ch);
  box-shadow: 0 0 8px color-mix(in srgb, var(--ch) 70%, transparent);
}

.orc-ch__u {
  font-family: var(--orc-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-primary);
}

.orc-ch__bid {
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-tertiary);
}

.orc-ch__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.orc-ch__name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.15s;
}

.orc-ch__name:hover {
  color: var(--brand-500);
}

.orc-ch__ver {
  flex: none;
  padding: 1px 6px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  font-family: var(--orc-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* V06 引脚式生命周期相位 */
.orc-ch__pins {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.orc-ch__pin {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-tertiary);
}

.orc-ch__pin i {
  width: 3px;
  height: 11px;
  border-radius: 1px;
  background: var(--border-default);
}

.orc-ch__pin--on {
  color: var(--text-primary);
}

.orc-ch__pin--on i {
  background: var(--ch);
  box-shadow: 0 0 5px color-mix(in srgb, var(--ch) 55%, transparent);
}

.orc-ch__note {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--brand-400) 15%, transparent);
  color: var(--brand-400);
  font-size: 10px;
  font-weight: 600;
}

.orc-ch__note--bad {
  background: color-mix(in srgb, var(--status-error) 12%, transparent);
  color: var(--status-error);
}

.orc-ch__ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.orc-ch__sysnote {
  font-size: 11px;
  color: var(--text-tertiary);
}

.orc-ch__meter {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px dashed var(--border-default);
}

.orc-ch__ladder {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

.orc-ch__ladder i {
  width: 20px;
  height: 5px;
  border-radius: 2px;
  background: var(--bg-fill);
  transition: background 0.2s;
}

.orc-ch__ladder i.on {
  background: var(--brand-400);
}

.orc-ch__ladder i.hot {
  background: var(--status-warning);
}

.orc-ch__ladder i.max {
  background: var(--status-success);
}

.orc-ch__lvl {
  font-family: var(--orc-mono);
  font-size: 9px;
  color: var(--text-secondary);
}

.orc-ch__lvl b {
  color: var(--brand-500);
}

/* V06 底部总线金手指 */
.orc-ch__bus {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 5px;
  height: 5px;
  border-radius: 2px;
  background: repeating-linear-gradient(
    90deg,
    color-mix(in srgb, var(--brand-500) 45%, var(--border-subtle)) 0 6px,
    transparent 6px 12px
  );
  opacity: 0.7;
}

/* ---- V02 线网 + V06 排针：服务总线 ---- */
.orc-svc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-left: 1px solid var(--orc-frame);
  background: color-mix(in srgb, var(--brand-500) 3%, var(--orc-well));
  min-width: 0;
}

.orc-svc__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: var(--orc-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--brand-500);
}

.orc-svc__head span {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}

.orc-svc__jacks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 360px;
}

.orc-jack {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.orc-jack:hover,
.orc-jack--open {
  border-color: var(--brand-500);
  background: color-mix(in srgb, var(--brand-500) 4%, var(--bg-container));
}

.orc-jack__caret {
  font-size: 9px;
  color: var(--text-tertiary);
}

.orc-jack__more {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-top: 1px dashed var(--border-subtle);
  cursor: default;
}

.orc-jack__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.orc-jack__row i {
  flex: none;
  font-style: normal;
  font-family: var(--orc-mono);
  font-size: 9px;
  color: var(--text-tertiary);
}

.orc-jack__row code {
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-primary);
  word-break: break-all;
}

.orc-jack__props {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--orc-well);
  font-family: var(--orc-mono);
  font-size: 10px;
  line-height: 1.5;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 140px;
  overflow: auto;
}

.orc-jack__no {
  font-family: var(--orc-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--brand-500);
  text-align: center;
  border-right: 1px dashed var(--border-subtle);
  padding-right: 6px;
}

.orc-jack__txt {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.orc-jack__nm {
  font-family: var(--orc-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orc-jack__pid {
  font-family: var(--orc-mono);
  font-size: 9px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orc-jack__led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-success);
  box-shadow: 0 0 6px color-mix(in srgb, var(--status-success) 60%, transparent);
}

.orc-svc__empty {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ---- 测控带：滚轮 + 磁带 + 载荷帧 ---- */
.orc-comm {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-top: 1px solid var(--orc-frame);
  background: var(--orc-panel);
}

.orc-reel {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 50%;
  border: 3px solid var(--border-default);
  position: relative;
}

.orc-reel::before {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 2px dashed var(--text-tertiary);
}

.orc-reel--spin {
  animation: orc-spin 3.6s linear infinite;
}

@keyframes orc-spin {
  to {
    transform: rotate(360deg);
  }
}

.orc-tape {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  padding: 6px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--orc-well);
  overflow: hidden;
}

.orc-tape__tick {
  font-family: var(--orc-mono);
  font-size: 9px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orc-tape__tick--idle {
  color: var(--text-tertiary);
}

.orc-frame {
  flex: none;
  max-width: 380px;
  padding: 6px 8px;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--orc-well);
  overflow: hidden;
}

.orc-frame code {
  display: block;
  font-family: var(--orc-mono);
  font-size: 9px;
  line-height: 1.5;
  color: var(--brand-500);
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orc-frame code.orc-frame--idle {
  color: var(--text-tertiary);
}

/* ---- 车辆段：部署目录 jar 仓（拉出式） ---- */
.depot {
  margin-top: 10px;
  border: 1px solid var(--orc-frame);
  border-radius: var(--radius-xl);
  background: var(--orc-panel);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.depot__grip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: 0;
  background: color-mix(in srgb, var(--brand-500) 4%, var(--orc-panel));
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.depot__grip:hover {
  background: color-mix(in srgb, var(--brand-500) 8%, var(--orc-panel));
}

.depot__grip__lines {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.depot__grip__lines i {
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--brand-500);
  opacity: 0.7;
}

.depot__grip__lines i:nth-child(2) {
  width: 12px;
}

.depot__grip__ttl {
  font-weight: 700;
}

.depot__grip__ttl b {
  color: var(--brand-500);
}

.depot__grip__caret {
  margin-left: auto;
  font-family: var(--orc-mono);
  font-size: 11px;
  color: var(--text-secondary);
}

.depot__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 16px;
}

.depot__tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.depot__seg {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  background: var(--bg-fill);
}

.depot__seg__btn {
  height: 26px;
  padding: 0 11px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.depot__seg__btn:hover {
  color: var(--brand-500);
}

.depot__seg__btn--on {
  background: var(--bg-container);
  color: var(--brand-500);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.depot__auto {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-family: var(--orc-mono);
  font-size: 11px;
  color: var(--text-secondary);
}

.depot__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
}

.depot__list--empty {
  grid-template-columns: minmax(0, 1fr);
}

.depot__jar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
}

.depot__jar__bar {
  flex: none;
  width: 4px;
  height: 34px;
  border-radius: 2px;
  background: var(--border-default);
}

.depot__jar--on .depot__jar__bar {
  background: var(--status-success);
  box-shadow: 0 0 8px color-mix(in srgb, var(--status-success) 55%, transparent);
}

.depot__jar--off .depot__jar__bar {
  background: var(--metric-net);
}

.depot__jar__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.depot__jar__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--orc-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
}

.depot__jar__size {
  flex: none;
  font-size: 10px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.depot__jar__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--text-secondary);
}

.depot__jar__time {
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-tertiary);
}

.depot__jar__ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.depot__dock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--orc-well);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.depot__dock:hover {
  border-color: var(--brand-500);
  color: var(--brand-500);
  background: color-mix(in srgb, var(--brand-500) 6%, var(--orc-well));
}

.depot__dock__plus {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.depot__dock small {
  color: var(--text-tertiary);
}

/* ---- 测控日志带 ---- */
.orc-log {
  margin-top: 10px;
  border: 1px solid var(--orc-frame);
  border-radius: var(--radius-xl);
  background: var(--orc-panel);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.orc-log__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  user-select: none;
  background: color-mix(in srgb, var(--brand-500) 4%, var(--orc-panel));
}

.orc-log__caret {
  font-family: var(--orc-mono);
  color: var(--brand-500);
}

.orc-log__title {
  font-weight: 700;
  font-size: 13px;
}

.orc-log__chan {
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--status-success);
}

.orc-log__chan--off {
  color: var(--status-warning);
}

.orc-log__badge {
  padding: 1px 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--status-error) 12%, transparent);
  color: var(--status-error);
  font-family: var(--orc-mono);
  font-size: 10px;
  font-weight: 700;
}

.orc-log__count {
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-tertiary);
}

.orc-log__spacer {
  flex: 1;
}

.orc-log__act {
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: 9999px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.orc-log__act:hover {
  color: var(--brand-500);
  border-color: color-mix(in srgb, var(--brand-500) 45%, var(--border-default));
}

.orc-log__act--on {
  border-color: var(--brand-500);
  color: var(--brand-500);
  font-weight: 600;
}

.orc-log__body {
  max-height: 260px;
  overflow-y: auto;
  padding: 8px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.orc-log__empty {
  margin: 6px 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.orc-log__row {
  display: grid;
  grid-template-columns: 62px 46px 84px minmax(120px, 220px) minmax(0, 1fr) 64px;
  align-items: baseline;
  gap: 8px;
  padding: 3px 8px;
  border-left: 2px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--orc-mono);
  font-size: 11px;
}

.orc-log__row--error {
  border-left-color: var(--status-error);
  background: color-mix(in srgb, var(--status-error) 6%, transparent);
}

.orc-log__row--warn {
  border-left-color: var(--status-warning);
  background: color-mix(in srgb, var(--status-warning) 7%, transparent);
}

.orc-log__time {
  color: var(--text-tertiary);
}

.orc-log__stage--start {
  color: var(--brand-400);
}

.orc-log__stage--success {
  color: var(--status-success);
}

.orc-log__stage--failure {
  color: var(--status-error);
}

.orc-log__action {
  color: var(--text-primary);
  font-weight: 600;
}

.orc-log__symbol {
  padding: 0;
  border: 0;
  background: none;
  color: var(--brand-500);
  font: inherit;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.orc-log__symbol:hover:not(:disabled) {
  text-decoration: underline;
}

.orc-log__symbol:disabled {
  color: var(--text-tertiary);
  cursor: default;
}

.orc-log__msg {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orc-log__dur {
  text-align: right;
  color: var(--text-tertiary);
}

/* ---- 空态 ---- */
.orc-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
  color: var(--text-secondary);
}

.orc-empty p {
  margin: 0;
}

.orc-empty__hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.orc-empty__hint code {
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--code-background, var(--orc-well));
  color: var(--code-foreground, var(--brand-500));
  font-family: var(--orc-mono);
  font-size: 11px;
}

/* ---- 端点不可用警示条 ---- */
.orc-alert {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--status-warning) 45%, var(--orc-frame));
  background: color-mix(in srgb, var(--status-warning) 10%, var(--orc-panel));
  color: var(--status-warning);
  font-size: 12px;
}

.orc-alert b {
  flex: none;
}

.orc-alert code {
  font-family: var(--orc-mono);
  font-size: 11px;
}

/* ---- 验收拒绝明细 ---- */
.orc-reject {
  border-bottom: 1px solid var(--orc-frame);
  background: color-mix(in srgb, var(--status-error) 4%, var(--orc-panel));
}

.orc-reject__head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 16px;
  border: 0;
  background: transparent;
  color: var(--status-error);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.orc-reject__head:hover {
  text-decoration: underline;
}

.orc-reject__caret {
  font-family: var(--orc-mono);
}

.orc-reject__body {
  margin: 0;
  padding: 0 16px 10px;
  max-height: 180px;
  overflow: auto;
  font-family: var(--orc-mono);
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ---- 模块行内详情 ---- */
.orc-ch__detail {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
  padding: 6px 8px;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-secondary);
}

.orc-ch__detail span {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.orc-ch__detail i {
  flex: none;
  font-style: normal;
  color: var(--text-tertiary);
}

.orc-ch__detail code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--brand-500);
}

/* ---- 搜索命中高亮 / 启动失败角标 ---- */
.orc-ch__hit {
  border-radius: 2px;
  background: color-mix(in srgb, var(--brand-500) 22%, transparent);
  color: var(--brand-600);
}

.orc-ch__fail {
  flex: none;
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--status-error) 12%, transparent);
  color: var(--status-error);
  font-size: 10px;
  font-weight: 700;
}

/* ---- 轨道天体：联动高亮与大 N 缩小 ---- */
.orc-sat--hl {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-500) 25%, transparent);
  z-index: 2;
}

.orc-sat--sm {
  width: 22px;
  height: 22px;
}

.orc-sat--sm .orc-sat__id {
  font-size: 7px;
}

/* ---- 服务总线：生效徽标 ---- */
.orc-jack__eff {
  padding: 1px 7px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--status-success) 14%, transparent);
  color: var(--status-success);
  font-size: 10px;
  font-weight: 700;
}

/* ---- 日志操作筛选 ---- */
.orc-log__sel {
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--border-default);
  border-radius: 9999px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
}

.orc-log__sel:focus {
  outline: none;
  border-color: var(--brand-500);
}

/* ---- 空态清除条件按钮 ---- */
.orc-empty__clear {
  margin-top: 4px;
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--brand-500);
  border-radius: 9999px;
  background: transparent;
  color: var(--brand-500);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.orc-empty__clear:hover {
  background: color-mix(in srgb, var(--brand-500) 10%, transparent);
}

/* ---- 上传坞通电态 ---- */
.depot__dock--hot {
  border-color: var(--brand-500);
  color: var(--brand-500);
  background: color-mix(in srgb, var(--brand-500) 10%, var(--orc-well));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-500) 35%, transparent);
}

/* ---- 响应式：窄屏收拢为单列 ---- */
@media (max-width: 1180px) {
  .orc-main {
    grid-template-columns: minmax(0, 1fr);
  }

  .orc-orbit {
    border-right: 0;
    border-bottom: 1px solid var(--orc-frame);
  }

  .orc-svc {
    border-left: 0;
    border-top: 1px solid var(--orc-frame);
  }

  .orc-svc__jacks {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .orc-search {
    width: 100%;
  }

  .orc-frame {
    display: none;
  }

  .orc-log__row {
    grid-template-columns: 62px 46px 84px minmax(0, 1fr) 64px;
  }

  .orc-log__symbol {
    display: none;
  }
}

/* ============ 第三轮增强：排序 / 批量 / 图例 / 明细 / 车辆段标记 ============ */

/* ---- 工具带排序选择 ---- */
.orc-sort {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.orc-sort:focus {
  outline: none;
  border-color: var(--brand-500);
}

/* ---- 批量操作条 ---- */
.orc-batch {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--brand-500) 35%, var(--orc-frame));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--brand-500) 7%, var(--orc-panel));
}

.orc-batch__all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.orc-batch__count {
  font-family: var(--orc-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--brand-500);
}

/* ---- 模块勾选框 ---- */
.orc-ch__pick {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: var(--brand-500);
  cursor: pointer;
}

.orc-ch__pick:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* ---- 清单加载失败态 ---- */
.orc-empty__bad {
  margin: 0;
  font-weight: 700;
  color: var(--status-error);
}

/* ---- 轨道状态颜色图例 ---- */
.orc-orbit__states {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px dashed var(--border-subtle);
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-secondary);
}

.orc-orbit__state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.orc-orbit__state b {
  color: var(--brand-500);
}

.orc-orbit__statedot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.orc-orbit__statedot--active { background: var(--status-success); }
.orc-orbit__statedot--starting { background: var(--status-warning); }
.orc-orbit__statedot--resolved { background: var(--brand-500); }
.orc-orbit__statedot--stopping { background: var(--brand-400); }
.orc-orbit__statedot--installed { background: var(--metric-net); }
.orc-orbit__statedot--uninstalled { background: var(--status-error); }

/* ---- 遥测明细展开面板（桥接定义 / 已注册服务类型） ---- */
.orc-detail {
  margin: 0 16px 10px;
  border: 1px solid var(--orc-frame);
  border-radius: var(--radius-lg);
  background: var(--orc-well);
  overflow: hidden;
}

.orc-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.orc-detail__head:hover {
  color: var(--brand-500);
}

.orc-detail__caret {
  font-size: 10px;
  color: var(--text-tertiary);
}

.orc-detail__body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 12px 10px;
  max-height: 180px;
  overflow: auto;
}

.orc-detail__chip {
  padding: 2px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
  background: var(--bg-container);
  font-family: var(--orc-mono);
  font-size: 10px;
  color: var(--text-primary);
  word-break: break-all;
}

/* ---- 车辆段搜索与异常标记 ---- */
.depot__search {
  width: 220px;
  max-width: 100%;
}

.depot__jar__flag {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  cursor: help;
}

.depot__jar__flag--warning {
  background: color-mix(in srgb, var(--status-warning) 16%, transparent);
  color: var(--status-warning);
}

.depot__jar__flag--danger {
  background: color-mix(in srgb, var(--status-error) 16%, transparent);
  color: var(--status-error);
}

.depot__jar__flag--info {
  background: color-mix(in srgb, var(--brand-500) 14%, transparent);
  color: var(--brand-500);
}
</style>


