<!--
  OSGi 插件管理 —— 控制室（Control Room）。

  版式为三舱常驻操作台：左舱是框架体征（运行铭牌、体征仪表、桥接/验收
  开关、验收拒绝记录、运维开关与车辆段·部署目录），中舱是模块清单
  （搜索 / 状态筛选 / 排序 / 批量启停卸载 / 生命周期状态带 / 服务总线），
  右舱是实时操作日志流。三舱铺满一屏，任何信息都不用切页就能看到。

  本页没有传统页头：页面身份由左舱顶部的框架运行铭牌承担。

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
import { ElInput, ElOption, ElSelect, ElSwitch, ElTooltip } from "element-plus";
import {
  Delete,
  Download,
  Refresh,
  Search,
  Upload,
  UploadFilled,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";
import { message, msgError, msgSuccess, useSocketService } from "@repo/core";
import { downloadCsv, downloadTextFile, fileTimestamp, usePersistentFilters } from "@repo/utils";
import ReButton from "@repo/ui/re-button";
import ReSkeleton from "@repo/ui/re-skeleton";
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

/** 排序钮组选项（控制室中舱工具条；方向由排序器固定，不另设箭头） */
const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "default", label: "默认" },
  { key: "name", label: "名称" },
  { key: "id", label: "ID" },
  { key: "version", label: "版本" },
  { key: "state", label: "状态" },
];

/**
 * 状态 → 配色（LED 与生命周期状态带共用）：
 * ACTIVE=--status-success、STARTING=--status-warning、RESOLVED=--brand-500、
 * STOPPING=--brand-400、INSTALLED=--metric-net、UNINSTALLED=--status-error。
 *
 * @param state OSGi bundle 状态
 * @return CSS 颜色值（var(...) 形式）
 */
function stateColor(state: string): string {
  switch (state) {
    case "ACTIVE":
      return "var(--status-success)";
    case "STARTING":
      return "var(--status-warning)";
    case "RESOLVED":
      return "var(--brand-500)";
    case "STOPPING":
      return "var(--brand-400)";
    case "INSTALLED":
      return "var(--metric-net)";
    case "UNINSTALLED":
      return "var(--status-error)";
    default:
      return "var(--text-tertiary)";
  }
}

/** 生命周期状态带（中舱底部）：按固定顺序给出各状态计数，只保留非零段 */
const stateStrip = computed(() =>
  (["ACTIVE", "STARTING", "STOPPING", "RESOLVED", "INSTALLED", "UNINSTALLED"] as const)
    .map(state => ({ state, count: rows.value.filter(row => row.state === state).length }))
    .filter(item => item.count > 0),
);

/**
 * 左舱框架体征仪表：bundle 总数 / 持有服务引用 / 桥接定义 / 自动启动失败。
 *
 * <p>比率一律按真实数据计算（引用与定义相对 bundle 总数、失败相对总数），
 * 不用摆拍常数；取不到的统计按 0 处理，读数不会编造。</p>
 */
const meters = computed(() => {
  const total = Math.max(1, stats.value?.totalBundles ?? 0);
  const refs = stats.value?.heldServiceReferences ?? 0;
  const defs = snapshot.value?.definitionCount ?? 0;
  const fail = stats.value?.autoStartFailures ?? 0;
  return [
    { key: "bundles", label: "Bundle 总数", value: stats.value?.totalBundles ?? 0, ratio: 1 },
    { key: "refs", label: "持有服务引用", value: refs, ratio: Math.min(1, refs / total) },
    { key: "defs", label: "桥接定义", value: defs, ratio: Math.min(1, defs / total) },
    { key: "fail", label: "自动启动失败", value: fail, ratio: fail / total },
  ];
});

/** 服务总线展开区开关（中舱底部） */
const servicesOpen = ref(false);

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
  <div class="cr-page">
    <!-- 端点警示条：后端 OSGi 管理端点不可用时常驻提示（对齐生产口径） -->
    <div v-if="endpointDown || loadError" class="cr-api-warning" role="alert">
      <span aria-hidden="true">⚠</span>
      <span>{{ loadError || "OSGi 管理端点不可用，请确认后端已开启 plugin.osgi.endpoint.enabled=true" }}</span>
    </div>

    <div class="cr-grid">
      <!-- ============ 左舱：框架体征 + 车辆段 ============ -->
      <aside class="cr-rail">
        <div class="cr-frame">
          <div class="cr-frame__state">
            <i
              class="cr-led cr-led--breath"
              :style="{ background: snapshot?.frameworkActive === false ? 'var(--status-error)' : 'var(--status-success)' }"
            ></i>
            <span>{{ snapshot?.frameworkActive === false ? "OSGi 框架未活跃" : "OSGi 框架运行中" }}</span>
          </div>
          <div class="cr-frame__ver cr-mono">
            {{ snapshot?.frameworkVersion ? `v${snapshot.frameworkVersion}` : "v—" }}
          </div>
        </div>

        <div class="cr-meters">
          <div v-for="m in meters" :key="m.key" class="cr-meter">
            <div class="cr-meter__top">
              <span class="cr-meter__label">{{ m.label }}</span>
              <span class="cr-meter__value cr-mono">{{ m.value }}</span>
            </div>
            <div class="cr-meter__bar">
              <i
                :style="{
                  width: `${Math.round(Math.min(1, m.ratio) * 100)}%`,
                  background: m.key === 'fail' ? 'var(--status-warning)' : 'var(--brand-500)',
                }"
              ></i>
            </div>
          </div>
        </div>

        <div class="cr-section">
          <div class="cr-section__title">桥接 · 验收</div>
          <div class="cr-chips">
            <span class="cr-badge" :class="{ 'is-on': snapshot?.bridgeAvailable }">
              桥接 {{ snapshot?.bridgeAvailable ? "可用" : "未装配" }}
            </span>
            <span class="cr-badge" :class="{ 'is-on': snapshot?.acceptanceEnabled }">
              验收 {{ snapshot?.acceptanceEnabled ? "开启" : "关闭" }}
            </span>
            <span class="cr-badge" :class="{ 'is-on': snapshot?.invalidateOnBundleLifecycle }">
              生命周期失效 {{ snapshot?.invalidateOnBundleLifecycle ? "开" : "关" }}
            </span>
          </div>
        </div>

        <div class="cr-section">
          <div class="cr-section__title">验收拒绝记录（{{ rejectedCount }}）</div>
          <div v-if="rejectedCount === 0" class="cr-none">无拒绝记录</div>
          <ul v-else class="cr-rejected">
            <li v-for="(reason, name) in snapshot?.rejected ?? {}" :key="name">
              <span class="cr-rejected__name cr-mono">{{ name }}</span>
              <span class="cr-rejected__why">{{ reason }}</span>
            </li>
          </ul>
        </div>

        <div class="cr-section">
          <div class="cr-section__title">运维</div>
          <div class="cr-ops__row">
            <span>自动刷新（30s）</span>
            <el-switch v-model="autoRefresh" />
          </div>
          <div class="cr-ops__btns">
            <ReButton icon="Refresh" :loading="loading" :disabled="loading" @click="reloadAll">手动刷新</ReButton>
            <ReButton icon="Upload" type="primary" :disabled="globalBusy" @click="pickInstall">上传安装</ReButton>
          </div>
        </div>

        <div
          class="cr-section cr-depot"
          :class="{ 'is-dock': dockHot }"
          @dragover.prevent="dockHot = true"
          @dragleave.prevent="dockHot = false"
          @drop.prevent="onDockDrop"
        >
          <div class="cr-section__title">车辆段 · 部署目录（{{ filteredJars.length }}）</div>
          <div class="cr-depot__tools">
            <el-input v-model="traySearch" placeholder="搜索文件名 / 符号名" clearable size="small" />
          </div>
          <div v-if="filteredJars.length === 0" class="cr-none">部署目录暂无匹配的 jar 文件</div>
          <ul v-else class="cr-jars">
            <li v-for="jar in filteredJars" :key="jar.fileName" class="cr-jar">
              <i class="cr-led" :style="{ background: jar.installed ? 'var(--status-success)' : 'var(--border-default)' }"></i>
              <span class="cr-jar__name cr-mono" :title="jar.fileName">{{ jar.fileName }}</span>
              <span class="cr-jar__size cr-mono">{{ formatSize(jar.size) }}</span>
              <span
                v-if="jarFlag(jar)"
                class="cr-jar__flag"
                :class="`is-${jarFlag(jar)!.tone}`"
                :title="jarFlag(jar)!.tip"
              >{{ jarFlag(jar)!.text }}</span>
              <ReButton
                layout="square"
                size="mini"
                icon="Delete"
                type="danger"
                tip="删除 jar 文件（须先卸载对应插件）"
                :disabled="jar.installed || jarBusy === jar.fileName"
                @click="removeJar(jar)"
              />
            </li>
          </ul>
        </div>
      </aside>

      <!-- ============ 中舱：模块清单 + 服务总线 ============ -->
      <section class="cr-main">
        <div class="cr-toolbar">
          <el-input
            v-model="searchInput"
            placeholder="搜索符号名 / bundleId"
            clearable
            size="small"
            class="cr-search"
            :prefix-icon="Search"
          />
          <el-select v-model="filterState" size="small" class="cr-state">
            <el-option v-for="f in lineFilters" :key="f.key" :label="f.label" :value="f.key" />
          </el-select>
          <div class="cr-sorts">
            <button
              v-for="k in SORT_OPTIONS"
              :key="k.key"
              type="button"
              class="cr-sort"
              :class="{ 'is-on': sortKey === k.key }"
              @click="sortKey = k.key"
            >
              {{ k.label }}
            </button>
          </div>
        </div>

        <div v-if="selected.size > 0" class="cr-batch">
          <span>已选 <b class="cr-mono">{{ selected.size }}</b> 个模块</span>
          <ReButton size="small" :disabled="batchRunning || globalBusy" @click="runBatch('start')">批量启动</ReButton>
          <ReButton size="small" :disabled="batchRunning || globalBusy" @click="runBatch('stop')">批量停止</ReButton>
          <ReButton size="small" type="danger" :disabled="batchRunning || globalBusy" @click="runBatch('uninstall')">批量卸载</ReButton>
          <ReButton size="small" text @click="clearPicks()">取消选择</ReButton>
        </div>

        <div class="cr-head">
          <span class="cr-cb">
            <input type="checkbox" :checked="allPicked" aria-label="全选模块" @change="togglePickAll()" />
          </span>
          <span class="cr-id">ID</span>
          <span class="cr-name">符号名</span>
          <span class="cr-ver">版本</span>
          <span class="cr-st">状态</span>
          <span class="cr-act">操作</span>
        </div>

        <div class="cr-body">
          <template v-if="loading">
            <div v-for="i in 6" :key="`sk${i}`" class="cr-row">
              <span class="cr-cb"></span>
              <span class="cr-id"><i class="cr-skel" style="width: 24px"></i></span>
              <span class="cr-name"><i class="cr-skel" style="width: 60%"></i></span>
              <span class="cr-ver"><i class="cr-skel" style="width: 48px"></i></span>
              <span class="cr-st"><i class="cr-skel" style="width: 52px; height: 14px"></i></span>
              <span class="cr-act"></span>
            </div>
          </template>
          <div v-else-if="filteredRows.length === 0" class="cr-empty">
            <strong>没有匹配的模块</strong>
            <span>调整搜索词或状态筛选后重试</span>
          </div>
          <template v-else>
            <div
              v-for="row in filteredRows"
              :key="row.bundleId"
              :id="`osgi-ch-${row.bundleId}`"
              class="cr-row"
              :class="{ 'is-system': isSystem(row) }"
            >
              <span class="cr-cb">
                <input
                  v-if="!isSystem(row)"
                  type="checkbox"
                  :checked="selected.has(row.symbolicName)"
                  :aria-label="`勾选 ${row.symbolicName}`"
                  @change="togglePick(row)"
                />
              </span>
              <span class="cr-id cr-mono">{{ row.bundleId }}</span>
              <span class="cr-name">
                <i
                  class="cr-led"
                  :class="{ 'cr-led--breath': row.state === 'ACTIVE' }"
                  :style="{ background: stateColor(row.state) }"
                ></i>
                <span class="cr-name__text" :title="row.location">{{ row.symbolicName }}</span>
                <i v-if="failedStarts.has(row.symbolicName)" class="cr-name__fail" title="本会话观测到启动失败">!</i>
              </span>
              <span class="cr-ver cr-mono">{{ row.version }}</span>
              <span class="cr-st">
                <ReTag :type="stateTagType(row.state)" size="small">{{ stateText(row.state) }}</ReTag>
              </span>
              <span class="cr-act">
                <ReButton
                  layout="square"
                  size="mini"
                  :icon="row.state === 'ACTIVE' ? 'VideoPause' : 'VideoPlay'"
                  :tip="row.state === 'ACTIVE' ? '停止' : '启动'"
                  :disabled="isBusy(row.symbolicName)"
                  @click="toggle(row)"
                />
                <ReButton
                  layout="square"
                  size="mini"
                  icon="UploadFilled"
                  tip="原地升级（选择新版本 jar）"
                  :disabled="isBusy(row.symbolicName) || isSystem(row)"
                  @click="pickUpgrade(row.symbolicName)"
                />
                <ReButton
                  layout="square"
                  size="mini"
                  icon="Download"
                  tip="下载 jar"
                  :disabled="isBusy(row.symbolicName)"
                  @click="download(row)"
                />
                <ReButton
                  layout="square"
                  size="mini"
                  icon="Delete"
                  type="danger"
                  tip="卸载（jar 保留在部署目录）"
                  :disabled="isBusy(row.symbolicName) || isSystem(row)"
                  @click="remove(row)"
                />
              </span>
            </div>
          </template>
        </div>

        <div class="cr-strip" aria-hidden="true">
          <i
            v-for="s in stateStrip"
            :key="s.state"
            class="cr-strip__seg"
            :style="{ flex: s.count, background: stateColor(s.state) }"
            :title="`${stateText(s.state)} × ${s.count}`"
          ></i>
        </div>

        <div class="cr-services">
          <button type="button" class="cr-services__head" @click="servicesOpen = !servicesOpen">
            <span>服务总线 · {{ serviceRows.length }} 条登记</span>
            <i class="cr-services__arrow" :class="{ 'is-open': servicesOpen }" aria-hidden="true">▾</i>
          </button>
          <div v-if="servicesOpen" class="cr-services__body">
            <div v-if="serviceRows.length === 0" class="cr-none">框架尚未注册任何服务</div>
            <div
              v-for="item in serviceRows"
              :key="item.svc.osgiServiceId"
              class="cr-svc"
              :class="{ 'is-open': serviceOpenId === item.svc.osgiServiceId }"
            >
              <button type="button" class="cr-svc__row" @click="toggleService(item.svc)">
                <i class="cr-led" :style="{ background: item.effective ? 'var(--status-success)' : 'var(--border-default)' }"></i>
                <span class="cr-svc__type cr-mono">{{ item.svc.type }}</span>
                <span v-if="item.effective" class="cr-badge is-on">生效</span>
                <span class="cr-svc__rank cr-mono">rank {{ item.svc.ranking }}</span>
              </button>
              <div v-if="serviceOpenId === item.svc.osgiServiceId" class="cr-svc__detail">
                <div class="cr-svc__kv"><span>实现类</span><code class="cr-mono">{{ item.svc.implClass }}</code></div>
                <div class="cr-svc__kv"><span>稳定标识</span><code class="cr-mono">{{ item.svc.stableId }}</code></div>
                <div class="cr-svc__kv"><span>服务 PID</span><code class="cr-mono">{{ item.svc.pid }}</code></div>
                <pre class="cr-svc__props cr-mono">{{ formatProps(item.svc.properties) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ 右舱：实时操作日志 ============ -->
      <aside class="cr-log">
        <div class="cr-log__head">
          <span class="cr-log__title">操作日志</span>
          <span class="cr-log__count cr-mono">
            {{ visibleLogs.length }} 条
            <template v-if="problemCount > 0">
              · <b class="cr-log__problem">{{ problemCount }} 异常</b>
            </template>
          </span>
        </div>
        <div class="cr-log__filters">
          <el-select v-model="logAction" size="small" class="cr-log__action">
            <el-option label="全部操作" value="all" />
            <el-option v-for="a in logActions" :key="a" :label="a" :value="a" />
          </el-select>
          <label class="cr-log__only">
            <el-switch v-model="logOnlyProblem" size="small" />
            <span>仅异常</span>
          </label>
        </div>
        <div ref="logBox" class="cr-log__list">
          <div
            v-for="(l, i) in visibleLogs"
            :key="`${l.startedAt}-${i}`"
            class="cr-log__item"
            :class="`is-${l.level.toLowerCase()}`"
          >
            <div class="cr-log__meta">
              <span class="cr-log__time cr-mono">{{ logTime(l.startedAt) }}</span>
              <span class="cr-log__level">{{ l.level }}</span>
              <span class="cr-log__action">{{ l.action }}</span>
              <span v-if="l.duration" class="cr-log__dur cr-mono">{{ l.duration }}ms</span>
            </div>
            <div class="cr-log__msg">{{ l.symbolicName ? `${l.symbolicName} — ` : "" }}{{ l.message }}</div>
          </div>
          <div v-if="visibleLogs.length === 0" class="cr-empty">暂无匹配日志</div>
        </div>
        <div class="cr-log__foot">
          <ReButton size="small" icon="Download" @click="exportLogsCsv">导出 CSV</ReButton>
          <ReButton size="small" icon="Download" @click="exportLogsJson">导出 JSON</ReButton>
          <ReButton size="small" icon="Delete" type="danger" text @click="clearLogs()">清空</ReButton>
        </div>
      </aside>
    </div>

    <!-- 隐藏文件入口：安装 / 升级共用（拖拽安装走同一处理链） -->
    <input ref="installInput" type="file" accept=".jar" hidden @change="onInstallFile" />
    <input ref="upgradeInput" type="file" accept=".jar" hidden @change="onUpgradeFile" />
  </div>
</template>

<style scoped>
/* ===== 页面地基（自包含，不依赖 lab-base.css；颜色全部取自 koi 设计令牌） ===== */
.cr-page {
  padding: 16px;
  background: var(--bg-page);
  color: var(--text-primary);
  min-height: 300px;
  box-sizing: border-box;
}

.cr-mono {
  font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;
  font-variant-numeric: tabular-nums;
}

.cr-api-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 14px;
  border: 1px solid var(--status-error-border);
  background: var(--status-error-bg);
  color: var(--status-error-text);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.cr-grid {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr) 316px;
  gap: 12px;
  align-items: stretch;
}

/* 三舱共同的面板底 */
.cr-rail,
.cr-main,
.cr-log {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* 状态 LED */
.cr-led {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cr-led--breath {
  animation: cr-breathe 1.6s ease-in-out infinite;
}
@keyframes cr-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(47, 191, 113, 0.35);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(47, 191, 113, 0.12);
  }
}

/* 小徽标 */
.cr-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 18px;
  padding: 0 7px;
  border-radius: 9px;
  font-size: 11px;
  line-height: 1;
  border: 1px solid var(--border-default);
  background: var(--bg-fill);
  color: var(--text-tertiary);
  white-space: nowrap;
}
.cr-badge.is-on {
  background: var(--sev-p3-bg);
  color: var(--sev-p3-text);
  border-color: var(--sev-p3-border);
}

/* 空态 */
.cr-empty {
  padding: 42px 16px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}
.cr-empty strong {
  display: block;
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 600;
}

/* 骨架屏 */
.cr-skel {
  display: block;
  height: 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--bg-fill) 25%, var(--bg-hover) 50%, var(--bg-fill) 75%);
  background-size: 200% 100%;
  animation: cr-shimmer 1.4s ease-in-out infinite;
}
@keyframes cr-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ===== 左舱 ===== */
.cr-rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}
.cr-frame {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.cr-frame__state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}
.cr-frame__ver {
  font-size: 12px;
  color: var(--text-tertiary);
}
.cr-meters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cr-meter__top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.cr-meter__value {
  color: var(--text-primary);
  font-weight: 600;
}
.cr-meter__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--bg-fill);
  overflow: hidden;
}
.cr-meter__bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s var(--ease-out);
}
.cr-section__title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}
.cr-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cr-none {
  font-size: 12px;
  color: var(--text-tertiary);
}
.cr-rejected {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cr-rejected li {
  padding: 8px 10px;
  border: 1px solid var(--sev-p1-border);
  background: var(--sev-p1-bg);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cr-rejected__name {
  font-size: 11px;
  font-weight: 600;
  color: var(--sev-p1-text);
  word-break: break-all;
}
.cr-rejected__why {
  font-size: 12px;
  color: var(--text-secondary);
}
.cr-ops__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.cr-ops__btns {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.cr-ops__btns > * {
  flex: 1;
}

/* 车辆段（拖拽投放下通电高亮） */
.cr-depot {
  min-height: 0;
}
.cr-depot.is-dock {
  outline: 2px dashed var(--brand-400);
  outline-offset: -2px;
  border-radius: var(--radius-md);
  background: var(--brand-50);
}
.cr-depot__tools {
  margin-bottom: 8px;
}
.cr-jars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}
.cr-jar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
}
.cr-jar__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--text-secondary);
}
.cr-jar__size {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-tertiary);
}
.cr-jar__flag {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--bg-fill);
  color: var(--text-secondary);
}
.cr-jar__flag.is-warning {
  background: var(--sev-p2-bg);
  color: var(--sev-p2-text);
  border-color: var(--sev-p2-border);
}
.cr-jar__flag.is-danger {
  background: var(--sev-p1-bg);
  color: var(--sev-p1-text);
  border-color: var(--sev-p1-border);
}

/* ===== 中舱 ===== */
.cr-main {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  overflow: hidden;
}
.cr-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}
.cr-search {
  width: 240px;
}
.cr-state {
  width: 128px;
}
.cr-sorts {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.cr-sort {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
}
.cr-sort:hover {
  color: var(--brand-500);
}
.cr-sort.is-on {
  color: var(--brand-500);
  border-color: var(--brand-400);
  background: var(--brand-50);
}
.cr-batch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--brand-50);
  border-bottom: 1px solid var(--border-subtle);
}
.cr-head,
.cr-row {
  display: grid;
  grid-template-columns: 34px 52px minmax(0, 1fr) 110px 92px 156px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}
.cr-head {
  height: 36px;
  font-size: 11px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}
.cr-body {
  flex: 1;
  overflow-y: auto;
}
.cr-row {
  height: 42px;
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.15s var(--ease-out);
}
.cr-row:hover {
  background: var(--bg-hover);
}
.cr-row.is-system {
  background: var(--bg-fill);
}
.cr-cb {
  display: flex;
  align-items: center;
}
.cr-id {
  color: var(--text-tertiary);
  font-size: 12px;
}
.cr-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
}
.cr-name__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cr-name__fail {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--status-error);
  color: var(--text-inverse);
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
  cursor: help;
}
.cr-ver {
  font-size: 12px;
  color: var(--text-secondary);
}
.cr-act {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.cr-strip {
  display: flex;
  height: 6px;
}
.cr-strip__seg {
  min-width: 4px;
}

/* 服务总线 */
.cr-services {
  border-top: 1px solid var(--border-subtle);
}
.cr-services__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 14px;
  border: none;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.cr-services__head:hover {
  color: var(--brand-500);
}
.cr-services__arrow {
  font-style: normal;
  transition: transform 0.2s var(--ease-out);
}
.cr-services__arrow.is-open {
  transform: rotate(180deg);
}
.cr-services__body {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cr-svc {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
}
.cr-svc__row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}
.cr-svc__row:hover {
  color: var(--brand-500);
}
.cr-svc__type {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cr-svc__rank {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-tertiary);
}
.cr-svc__detail {
  padding: 6px 10px 8px;
  border-top: 1px dashed var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cr-svc__kv {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.cr-svc__kv span {
  flex-shrink: 0;
}
.cr-svc__kv code {
  word-break: break-all;
  color: var(--text-secondary);
}
.cr-svc__props {
  margin: 4px 0 0;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  color: var(--text-secondary);
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}

/* ===== 右舱 ===== */
.cr-log {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  overflow: hidden;
}
.cr-log__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.cr-log__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.cr-log__count {
  font-size: 12px;
  color: var(--text-tertiary);
}
.cr-log__problem {
  color: var(--status-error);
  font-weight: 600;
}
.cr-log__filters {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.cr-log__action {
  flex: 1;
}
.cr-log__only {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.cr-log__list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cr-log__item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  border-left: 3px solid var(--border-default);
}
.cr-log__item.is-warn {
  border-left-color: var(--status-warning);
  background: var(--sev-p2-bg);
}
.cr-log__item.is-error {
  border-left-color: var(--status-error);
  background: var(--status-error-bg);
}
.cr-log__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.cr-log__level {
  font-weight: 700;
}
.cr-log__item.is-warn .cr-log__level {
  color: var(--status-warning);
}
.cr-log__item.is-error .cr-log__level {
  color: var(--status-error);
}
.cr-log__action {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cr-log__dur {
  margin-left: auto;
}
.cr-log__msg {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}
.cr-log__foot {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
}

/* ===== 响应式 ===== */
@media (max-width: 1180px) {
  .cr-grid {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
  .cr-rail {
    grid-column: 1 / -1;
    order: 3;
  }
}
@media (max-width: 760px) {
  .cr-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .cr-log {
    min-height: 360px;
  }
  .cr-head,
  .cr-row {
    grid-template-columns: 30px minmax(0, 1fr) 88px 148px;
  }
  .cr-id,
  .cr-ver {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cr-page *,
  .cr-page *::before,
  .cr-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
