<script setup lang="ts">
/**
 * CDP 工作台（DevTools 面板 + 实时画面舞台）
 *
 * <p>{@code @pages/cdp} 的核心 UI 组件，采用「工作台」布局：</p>
 * <ul>
 *   <li>浏览器生命周期控件（启停 / 新建页面 / sw8 / 地址栏）由宿主壳层
 *       （{@code @pages/debug} 的浏览器式工作台）持有，经 {@code defineExpose} 驱动；</li>
 *   <li>左侧目标轨道（可折叠）：搜索 / 类型筛选 + 目标列表，底部常驻引擎信息；</li>
 *   <li>右侧 DevTools 工作区：元素 / 控制台 / 网络 / 应用 / 截屏 五个页签；
 *       元素页签内为「画面舞台 | DOM 树 + 样式/计算/布局/SVG 详情 | Console 抽屉」三栏。</li>
 * </ul>
 *
 * <p>跟后端的通道有两路：REST {@code /ms/cdp/**}（一次性操作：状态、启动、停止、截屏…）
 * 与 WebSocket {@code /ws/cdp}（实时事件 + JSON-RPC 调用）。实时通道由
 * {@code @pages/cdp/client} 的 {@code CdpClient} 持有。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { message } from "@repo/core";
import {
  cdpCloseProxySession,
  cdpCloseTarget,
  cdpContent,
  cdpCookies,
  cdpCreateTarget,
  cdpEvaluate,
  cdpNavigate,
  cdpOpenProxySession,
  cdpScreenshot,
  cdpStart,
  cdpStatus,
  cdpStop,
  cdpTargets,
  CDP_WS_PATH,
  createCdpClient,
} from "../client";
import type { CdpStatus, CdpTarget } from "../client";
import { createSseClient } from "@repo/utils";
import type { SseClient } from "@repo/utils";
import "../styles/cdp.css";

/* ==================== 视图偏好（localStorage） ==================== */

/**
 * 视图偏好存储前缀
 *
 * <p>页签、画面布局、网络详情高度这些「下次进来还想保持」的状态统一放在
 * {@code debug.ui.*} 下，和业务数据（SVG 保存、求值历史）分开，便于单独清理。</p>
 */
const PREF_PREFIX = "debug.ui.";

/** 读一个视图偏好；没存过、解析失败或隐私模式禁用存储时回落到默认值 */
function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREF_PREFIX + key);
    if (raw === null) {
      return fallback;
    }
    const value = JSON.parse(raw) as T;
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

/** 写一个视图偏好（失败时忽略：隐私模式或配额满都不该影响页面本身） */
function writePref(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
  } catch {
    // 存储不可用时只丢「记住状态」，不影响功能
  }
}

/* ==================== 页面级状态 ==================== */

/**
 * 当前选中的页签
 *
 * <p>按 F12 的功能分区组织：元素（含样式 / 计算）、控制台、断点（Debugger）、网络、
 * 存储（Cookie / localStorage / sessionStorage）、截屏。SVG 抽取收进元素页签的
 * 侧栏，求值收进元素页签底部的 Console 抽屉。</p>
 */
type PageTab = "elements" | "console" | "debugger" | "network" | "performance" | "svg" | "app" | "screenshot";

const PAGE_TABS: readonly PageTab[] = ["elements", "console", "debugger", "network", "performance", "svg", "app", "screenshot"];

/** 页签默认落在「网络」；上次停留的页签会记住，下次进来直接续上 */
function readPageTab(): PageTab {
  const saved = readPref<string>("tab", "network");
  return PAGE_TABS.includes(saved as PageTab) ? (saved as PageTab) : "network";
}

const pageTab = ref<PageTab>(readPageTab());

/** 浏览器状态 */
const status = ref<CdpStatus | null>(null);
const statusLoading = ref(false);

/** 页面（目标）列表 */
const targets = ref<CdpTarget[]>([]);

/** 选中的目标标识（浏览器级时为空；记住上次选中的目标，刷新后尽量续上） */
const selectedTarget = ref<string>(readPref<string>("target", ""));

/** 控制台日志（CDP 事件的展示态） */
interface ConsoleEntry {
  /** 自增序号（列表 key） */
  key: number;
  /** 原始类型（error / warn / info / log / debug…） */
  type: string;
  /** 归一后的级别（error / warn / info / log / debug） */
  level: string;
  /** 拼好的完整文本（不再只取 args[0]） */
  text: string;
  /** 来源目标 */
  targetId: string;
  /** 事件时间 */
  timestamp: number;
  /** 分组缩进层级（console.group 嵌套深度，0 = 顶层） */
  depth: number;
  /** 异常堆栈（Runtime.exceptionThrown 的 exceptionDetails.stackTrace，可展开查看） */
  stack?: ConsoleStackFrame[];
}

/** 异常堆栈的一帧 */
interface ConsoleStackFrame {
  /** 脚本地址（优先取帧自带 url，缺省时用 scriptId 反查 scriptSources） */
  url: string;
  /** 行号（0 基 + 1 转成 1 基展示） */
  line: number;
  /** 函数名（匿名时显示 (anonymous)） */
  fn: string;
}

/** 控制台日志 */
const consoleMessages = ref<ConsoleEntry[]>([]);

/** 一条 WebSocket 帧（Network.webSocketFrame* 事件） */
interface WsFrame {
  /** 方向：send = 页面发出，recv = 页面收到，error = 帧错误 */
  dir: "send" | "recv" | "error";
  /** 帧类型码（0 continuation / 1 文本 / 2 二进制 / 8 关闭 / 9 ping / 10 pong；错误帧 -1） */
  opcode: number;
  /** 是否带掩码（客户端 → 服务端一般为 true） */
  mask: boolean;
  /** 文本帧内容（二进制帧不落地，只记大小） */
  payload: string;
  /** 事件时间（单调时钟 × 1000，与 NetEntry.timestamp 同基准，用于算相对偏移） */
  time: number;
  /** 内容字节数 */
  size: number;
}

/** 一条 F12 风格的网络请求（列表 + 详情，按 requestId 归并） */
interface NetEntry {
  /** 请求标识（后端透传的 requestId，可能为空） */
  requestId: string;
  /** 列表序号（稳定 key） */
  seq: number;
  /** HTTP 方法 */
  method: string;
  /** 完整地址 */
  url: string;
  /** 资源类型（document / script / xhr / image…） */
  type: string;
  /** 状态码（未返回时为空） */
  status: string;
  /** 状态文案 */
  statusText: string;
  /** MIME */
  mimeType: string;
  /** 是否来自缓存 */
  fromCache: boolean;
  /** 传输 / 资源大小（字节） */
  size: number;
  /** 已接收字节（dataReceived 累加） */
  received: number;
  /** 耗时（ms，loadingFinished - requestWillBeSent） */
  duration: number;
  /** 发起时间（CDP 单调时钟 × 1000，仅用于相对排序 / 瀑布图） */
  timestamp: number;
  /** 墙钟时间（HAR 的 startedDateTime 用；单调时钟不能当日期展示） */
  wallTime: number;
  /** 请求头 */
  requestHeaders: Record<string, string>;
  /** 请求体（POST / PUT 时 CDP 回传的 postData，用于重发） */
  postData: string;
  /** 响应头 */
  responseHeaders: Record<string, string>;
  /** 发起者（type + url + lineNumber） */
  initiator: string;
  /** 失败原因 */
  errorText: string;
  /** 来源目标 */
  targetId: string;
  /** 链路追踪：traceId（从 sw8 / traceparent 解析） */
  traceId: string;
  /** 链路追踪：segmentId（sw8 的 segment 段） */
  segmentId: string;
  /** 链路追踪：spanId（sw8 的 span 段 / traceparent 的 parent-id） */
  spanId: string;
  /** 链路追踪：来源协议（sw8 / traceparent） */
  traceSource: string;
  /** WebSocket 帧（仅 websocket 类型请求有；Network.webSocketFrame* 按 requestId 归并到这里） */
  wsFrames?: WsFrame[];
}

/** 抽取出来的一个 SVG */
interface SvgItem {
  /** 稳定 id：序号 + 摘要哈希 */
  id: string;
  /** 原始 markup（内联 / use 展开 / 外链三种来源之一） */
  markup: string;
  /** 规范化后的 data:image/svg+xml（用于预览 / 下载） */
  dataUrl: string;
  /** 纯 SVG 文本的字节数 */
  bytes: number;
  /** 视图尺寸 */
  width: number;
  height: number;
  /** 来源说明 */
  source: string;
  /** 标签 / 类名 / id 摘要 */
  label: string;
  /** 是否已保存到本地 */
  saved: boolean;
}

/** 网络日志（requestWillBeSent → loadingFinished 按 requestId 归并，F12 风格） */
const networkRequests = ref<NetEntry[]>([]);

/** 控制台级别筛选（空串 = 全部） */
const levelFilter = ref("");

/** 控制台 / 网络共用的关键字过滤 */
const searchText = ref("");

/** 网络类型筛选（空串 = 全部） */
const netTypeFilter = ref("");

/** 网络：保留日志（切目标时不清空） */
const netPreserveLog = ref<boolean>(readPref<boolean>("net.preserveLog", false));

/** 网络：当前展开详情的请求 */
const netDetailId = ref("");
/** 网络详情当前页签 */
type NetDetailTab = "headers" | "response" | "initiator" | "trace" | "ws";
const netDetailTab = ref<NetDetailTab>(readPref<NetDetailTab>("net.detailTab", "headers"));
/** 详情区固定高度（px，可拖拽调整，避免高度随内容跳变；高度也会记住） */
const netDetailHeight = ref<number>(readPref<number>("net.detailHeight", 260));
/** 详情区是否正在拖拽分隔条 */
let netResizing = false;
/** 响应体是否格式化展示 */
const netBodyPretty = ref<boolean>(readPref<boolean>("net.pretty", true));
const netBodyLoading = ref(false);

/** 变化监视（DOM / 导航）是否开启 */
const watchEnabled = ref<boolean>(readPref<boolean>("watch.enabled", true));

/** 自动注入 SkyWalking sw8 追踪头 */
const sw8Enabled = ref<boolean>(readPref<boolean>("sw8.enabled", true));

/** SVG 抽取结果 */
const svgItems = ref<SvgItem[]>([]);
const svgLoading = ref(false);
const svgError = ref("");
/** 只显示已保存的 SVG */
const svgSavedOnly = ref(false);
/** SVG 页签：进页 / 导航 / 换目标后自动抽取（独立页与元素详情共用） */
const svgAuto = ref<boolean>(readPref<boolean>("svg.auto", true));
/** SVG 页签的关键字过滤（标签 / 来源 / 地址） */
const svgKeyword = ref("");
/** 放大预览中的 SVG（null = 关闭） */
const svgPreview = ref<SvgItem | null>(null);
/** 已保存 SVG 的 id（localStorage 持久化） */
const svgSaved = ref<Set<string>>(new Set(loadSavedSvg()));

/** 读画面布局偏好：只认 left / top，其余一律回落「左右」 */
function readStageLayout(): "top" | "left" {
  return readPref<string>("stage.layout", "left") === "top" ? "top" : "left";
}

/** 原始网站舞台：布局（上下 / 左右），默认左右：画面在左，DOM 与样式在右 */
const stageLayout = ref<"top" | "left">(readStageLayout());
/** 原始网站舞台是否展开 */
const stageOpen = ref<boolean>(readPref<boolean>("stage.open", true));
/** 舞台截屏（data url） */
const stageShot = ref("");
const stageLoading = ref(false);
/** 舞台截屏自动刷新 */
const stageLive = ref<boolean>(readPref<boolean>("stage.live", true));
/** 舞台图片元素（算点击坐标用） */
const stageImgRef = ref<HTMLImageElement | null>(null);
/** 舞台可视容器（算图片实际显示位置用） */
const stageViewRef = ref<HTMLElement | null>(null);
/** 舞台提示 */
const stageHint = ref("点画面里的元素可反查 DOM 节点");
/** 页内元素在截屏里的坐标（CSS px，视口坐标） */
const stageHighlight = ref<{ x: number; y: number; w: number; h: number; tag: string } | null>(null);
/** 预览图原始尺寸（换算坐标 + 处理 DPR） */
const stageNatural = ref({ w: 0, h: 0 });
/** 预览图在容器里的实际显示框（px，相对容器；object-fit 留黑边时靠它校正） */
const stageBox = ref({ left: 0, top: 0, width: 0, height: 0 });
/**
 * 高亮框样式
 *
 * <p>截屏坐标是 CSS 像素，原图可能是 DPR 放大后的像素，而图片又被
 * `object-fit: contain` 缩进容器里（上下/左右可能留黑边）。所以先按
 * 原图尺寸归一，再乘图片实际显示尺寸、加上显示偏移——高亮框才会贴着元素，
 * 不会跑到黑边上。</p>
 */
const stageHlStyle = computed(() => {
  const hl = stageHighlight.value;
  const box = stageBox.value;
  if (!hl || !box.width || !box.height) {
    return null;
  }
  const sx = box.width / (stageNatural.value.w || 1);
  const sy = box.height / (stageNatural.value.h || 1);
  return {
    left: `${box.left + hl.x * sx}px`,
    top: `${box.top + hl.y * sy}px`,
    width: `${Math.max(0, hl.w * sx)}px`,
    height: `${Math.max(0, hl.h * sy)}px`,
  };
});

/** 左侧目标轨道折叠状态（localStorage 记忆，下次进来保持） */
function readRailCollapsed(): boolean {
  try {
    return localStorage.getItem("debug.rail.collapsed") === "1";
  } catch {
    return false;
  }
}
const railCollapsed = ref(readRailCollapsed());

function toggleRail(): void {
  railCollapsed.value = !railCollapsed.value;
  try {
    localStorage.setItem("debug.rail.collapsed", railCollapsed.value ? "1" : "0");
  } catch {
    // 隐私模式禁用存储时忽略，不影响折叠本身
  }
}

/** 左侧目标搜索词 */
const targetKeyword = ref("");
/** 左侧目标类型筛选（空串 = 全部 page） */
const targetTypeFilter = ref("page");

/** 目标类型分项（带计数，供筛选胶囊用） */
const targetTypeOptions = computed(() => {
  const counts = new Map<string, number>();
  for (const t of targets.value) {
    const key = t.type || "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = targets.value.length;
  return [
    { value: "", label: "全部", count: total },
    ...list.map(([value, count]) => ({ value, label: value, count })),
  ];
});

/** 过滤后的目标（搜索 + 类型） */
const visibleTargets = computed(() => {
  const kw = targetKeyword.value.trim().toLowerCase();
  return targets.value.filter((t) => {
    if (targetTypeFilter.value && (t.type || "other") !== targetTypeFilter.value) {
      return false;
    }
    if (!kw) {
      return true;
    }
    return `${targetTitle(t)} ${t.url ?? ""} ${t.id}`.toLowerCase().includes(kw);
  });
});

/**
 * 左栏目标列表滚动分页：CDP 目标可能很多，全量 visibleTargets 留内存、只挂载前
 * railLimit 条，滚到底或点击末尾「还有 N 条」再追加。计数胶囊 / 选中态 / 关闭按钮
 * 仍按全量 targets 与 id 工作，不受渲染上限影响。
 */
const RAIL_PAGE = 30;
const railLimit = ref(RAIL_PAGE);
const pagedTargets = computed(() => visibleTargets.value.slice(0, railLimit.value));
const railHiddenCount = computed(() => Math.max(0, visibleTargets.value.length - pagedTargets.value.length));
const loadMoreRail = () => {
  railLimit.value = Math.min(visibleTargets.value.length, railLimit.value + RAIL_PAGE);
};
const onRailScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  // 归顶后（scrollTop=0）DOM 收缩派生的钳制 scroll 不算触底。
  if (el.scrollTop <= 0) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) loadMoreRail();
};
// 搜索 / 类型筛选 / 目标增减后回到首批；同步归顶滚动容器，避免 DOM 缩短派发的
// 原生 scroll 被误判触底、把 railLimit 又推回全量（人眼验收真实复现）。
const railListRef = ref<HTMLElement | null>(null);
watch(visibleTargets, () => {
  railLimit.value = RAIL_PAGE;
  if (railListRef.value) railListRef.value.scrollTop = 0;
});

/** 右键菜单状态 */
const contextMenu = ref<{ open: boolean; x: number; y: number; node: DomTreeNode | null }>({
  open: false,
  x: 0,
  y: 0,
  node: null,
});

/** 目标 favicon 缓存（targetId -> url） */
const faviconCache = ref<Record<string, string>>({});
/** favicon 加载失败的 targetId */
const faviconFailed = ref<Set<string>>(new Set());

const maxConsole = 500;
const maxNetwork = 500;

/** WS 指令通道（只发 CDP 指令，不收事件） */
const wsConnected = ref(false);
const client = createCdpClient(CDP_WS_PATH);
/** 全局 SSE 事件通道（唯一一条事件流） */
const sseConnected = ref(false);

/* ==================== 展示派生 ==================== */

/** 状态文案（后端 state 是英文枚举） */
const stateLabel = computed(() => {
  switch (status.value?.state) {
    case "STARTED":
      return "运行中";
    case "STARTING":
      return "启动中";
    case "STOPPED":
      return "已停止";
    case "FAILED":
      return "启动失败";
    default:
      return "未启动";
  }
});

/** 状态色调（决定状态点与胶囊的配色） */
const stateTone = computed(() => {
  switch (status.value?.state) {
    case "STARTED":
      return "ok";
    case "STARTING":
      return "warn";
    case "FAILED":
      return "bad";
    default:
      return "muted";
  }
});

/** 运行中的判定（启动按钮的反向态） */
const running = computed(() => status.value?.state === "STARTED");

/** 目标数：优先用状态里回传的计数，缺省回落到列表长度 */
const targetCount = computed(() =>
  Math.max(targets.value.length, Number(status.value?.targetCount ?? 0)),
);

/** 现在时刻（驱动运行时长自增） */
const now = ref(Date.now());
let uptimeTimer: ReturnType<typeof setInterval> | undefined;

/** 运行时长 hh:mm:ss（未运行时显示占位，避免停掉后还继续走表） */
const uptime = computed(() => {
  if (!running.value) {
    return "—";
  }
  const raw = Number(status.value?.startedAt ?? 0);
  if (!raw) {
    return "—";
  }
  // 兼容秒级时间戳
  const startedAt = raw < 1e12 ? raw * 1000 : raw;
  const seconds = Math.max(0, Math.floor((now.value - startedAt) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
});

/** 八个页签（带计数）；整页源码与求值入口收在「元素」页签里，SVG 也单开一页做全量抽取 */
const tabs = computed<{ name: PageTab; label: string; count?: number }[]>(() => [
  { name: "elements", label: "元素" },
  { name: "console", label: "控制台", count: consoleMessages.value.length },
  { name: "debugger", label: "断点", count: breakpoints.value.length || undefined },
  { name: "network", label: "网络", count: networkRequests.value.length },
  {
    name: "performance",
    label: "性能",
    count: perfEventCount.value || perfSummary.value?.total || undefined,
  },
  { name: "svg", label: "SVG", count: svgItems.value.length || undefined },
  { name: "app", label: "应用" },
  { name: "screenshot", label: "截屏" },
]);

/** 级别筛选项（带计数；change 是页面变化 tag，单列一项） */
const levelOptions = computed(() => {
  const count = (level: string) => consoleMessages.value.filter((m) => m.level === level).length;
  return [
    { value: "", label: "全部", count: consoleMessages.value.length },
    { value: "change", label: "变化", count: consoleMessages.value.filter((m) => m.type === "change").length },
    { value: "error", label: "error", count: count("error") },
    { value: "warn", label: "warn", count: count("warn") },
    { value: "info", label: "info", count: count("info") },
    { value: "log", label: "log", count: count("log") },
    { value: "debug", label: "debug", count: count("debug") },
  ];
});

/** 过滤后的控制台日志 */
const visibleConsole = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  return consoleMessages.value.filter(
    (m) =>
      (!levelFilter.value || (levelFilter.value === "change" ? m.type === "change" : m.level === levelFilter.value)) &&
      (!keyword || m.text.toLowerCase().includes(keyword)),
  );
});

/** 网络类型筛选项（带计数） */
const netTypeOptions = computed(() => {
  const counts = new Map<string, number>();
  for (const n of networkRequests.value) {
    const key = n.type || "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return [
    { value: "", label: "全部", count: networkRequests.value.length },
    ...list.map(([value, count]) => ({ value, label: value, count })),
  ];
});

/** 过滤后的网络行（F12 列表倒序由模板 v-for 控制，这里只过滤） */
const networkRows = computed<NetEntry[]>(() => {
  const keyword = searchText.value.trim().toLowerCase();
  return networkRequests.value.filter(
    (n) =>
      (!netTypeFilter.value || (n.type || "other") === netTypeFilter.value) &&
      (!keyword || n.url.toLowerCase().includes(keyword) || n.method.toLowerCase().includes(keyword) || n.status.includes(keyword)),
  );
});

/** 当前展开的详情条目 */
const netDetail = computed(() => networkRequests.value.find((n) => n.requestId === netDetailId.value) ?? null);

/** 网络汇总（过滤后的条数 / 总传输 / 失败数） */
const netSummary = computed(() => {
  const rows = networkRows.value;
  const bytes = rows.reduce((s, n) => s + (n.size || n.received || 0), 0);
  const failed = rows.filter((n) => n.errorText || /^[45]/.test(n.status)).length;
  return { count: rows.length, bytes, failed };
});

/** 瀑布图时间轴：以最早发起的请求为原点，总跨度作为 100% 宽度的基准 */
const netWaterfall = computed(() => {
  let origin = Infinity;
  let end = 0;
  for (const n of networkRows.value) {
    const start = n.timestamp || 0;
    const finish = start + (n.duration || 0);
    if (start && start < origin) {
      origin = start;
    }
    if (finish > end) {
      end = finish;
    }
  }
  return { origin: origin === Infinity ? 0 : origin, span: Math.max(end - origin, 1) };
});

/** 单条请求的瀑布条位置（left / width 百分比，贴在瀑布列的格子里） */
function waterfallStyle(n: NetEntry): Record<string, string> {
  const { origin, span } = netWaterfall.value;
  const start = Math.max(0, (n.timestamp || 0) - origin);
  const dur = Math.max(n.duration || 0, 0);
  const left = Math.min(99, (start / span) * 100);
  const width = Math.max(0.8, Math.min(100 - left, (dur / span) * 100));
  return { left: `${left}%`, width: `${width}%` };
}

/**
 * 导出 HAR 1.2（用当前过滤后的网络日志拼装，纯内存数据、不发请求）
 *
 * <p>响应体不落进 HAR（body 要按需经 {@code loadNetBody} 拉，导出只带元数据），
 * 请求 POST 体如果 CDP 已经回传过就原样带上。</p>
 */
function exportHar(): void {
  const rows = [...networkRows.value].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  if (!rows.length) {
    ElMessage.warning("还没有可导出的网络请求");
    return;
  }
  const toHeaderList = (h: Record<string, string>) => Object.entries(h).map(([name, value]) => ({ name, value }));
  const entries = rows.map((n) => {
    const time = Math.max(0, Math.round(n.duration || 0));
    return {
      startedDateTime: new Date(n.wallTime || Date.now()).toISOString(),
      time,
      request: {
        method: n.method || "GET",
        url: n.url,
        httpVersion: "HTTP/1.1",
        headers: toHeaderList(n.requestHeaders),
        queryString: [] as unknown[],
        cookies: [] as unknown[],
        headersSize: -1,
        bodySize: n.postData ? n.postData.length : -1,
        ...(n.postData ? { postData: { mimeType: "", text: n.postData } } : {}),
      },
      response: {
        status: Number(n.status) || 0,
        statusText: n.statusText || "",
        httpVersion: "HTTP/1.1",
        headers: toHeaderList(n.responseHeaders),
        cookies: [] as unknown[],
        content: { size: n.size || n.received || 0, mimeType: n.mimeType || "" },
        redirectURL: "",
        headersSize: -1,
        bodySize: n.size || n.received || 0,
      },
      cache: {},
      timings: { send: 0, wait: time, receive: 0 },
      _resourceType: n.type || "other",
      _error: n.errorText || undefined,
    };
  });
  const har = {
    log: {
      version: "1.2",
      creator: { name: "monitor-debug-center", version: "1.0" },
      pages: [] as unknown[],
      entries,
    },
  };
  try {
    const blob = new Blob([JSON.stringify(har)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-network-${new Date().toISOString().replace(/[:.]/g, "-")}.har`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    ElMessage.success(`已导出 ${rows.length} 条请求（HAR 1.2）`);
  } catch (error) {
    ElMessage.error("导出失败: " + (error as Error).message);
  }
}

/** 按 traceId 聚合的请求（链路视角） */
const traceGroups = computed(() => {
  const map = new Map<string, { traceId: string; count: number; failed: number; entries: NetEntry[] }>();
  for (const n of networkRequests.value) {
    if (!n.traceId) continue;
    let group = map.get(n.traceId);
    if (!group) {
      group = { traceId: n.traceId, count: 0, failed: 0, entries: [] };
      map.set(n.traceId, group);
    }
    group.count++;
    if (n.errorText || /^[45]/.test(n.status)) group.failed++;
    group.entries.push(n);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
});

/** 当前详情请求所属的链路分组 */
const currentTraceGroup = computed(() => {
  const id = netDetail.value?.traceId;
  return id ? traceGroups.value.find((g) => g.traceId === id) ?? null : null;
});

/** 跳到 APM 链路详情（新窗口打开，保留调试现场） */
function openTraceInApm(traceId: string) {
  if (!traceId) return;
  const url = `${window.location.origin}/apm/traces/detail?traceId=${encodeURIComponent(traceId)}`;
  window.open(url, "_blank");
}

/** 时间戳 -> hh:mm:ss */
function fmtTime(ts?: number): string {
  const date = new Date(Number(ts || 0) || Date.now());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** 字节 -> 可读大小 */
function fmtSize(bytes: number): string {
  if (!bytes || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 毫秒 -> 可读耗时 */
function fmtDuration(ms: number): string {
  if (!ms || ms < 0) {
    return "—";
  }
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

/** 状态码色调 */
function statusTone(code: string): string {
  if (!code) {
    return "muted";
  }
  if (code.startsWith("2")) {
    return "ok";
  }
  if (code.startsWith("3")) {
    return "info";
  }
  if (code.startsWith("4")) {
    return "warn";
  }
  return "bad";
}

/** 从 URL 取文件名（F12 的 Name 列口径） */
function urlName(url: string): string {
  if (!url) {
    return "(unknown)";
  }
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").filter(Boolean).pop() || u.hostname || "/";
    return base.length > 60 ? `${base.slice(0, 57)}…` : base;
  } catch {
    const base = url.split(/[?#]/)[0].split("/").pop() || url;
    return base.length > 60 ? `${base.slice(0, 57)}…` : base;
  }
}

/** 从 URL 取域名（F12 的 Domain 列口径） */
function urlDomain(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

/** 目标类型（日志右上角的来源标） */
function targetType(targetId: string): string {
  const hit = targets.value.find((t) => t.id === targetId);
  return hit?.type ?? (targetId ? "target" : "");
}

/** 目标标题（标题可能为空） */
function targetTitle(t: CdpTarget): string {
  return t.title || t.url || t.id;
}

/** 目标 favicon（浏览器 /json 不回传，按页面 origin 拼 /favicon.ico，加载失败回落到小圆点） */
function faviconUrl(t: CdpTarget): string {
  if (faviconCache.value[t.id]) {
    return faviconCache.value[t.id];
  }
  if (!t.url || !/^https?:/i.test(t.url) || faviconFailed.value.has(t.id)) {
    return "";
  }
  try {
    return new URL("/favicon.ico", t.url).href;
  } catch {
    return "";
  }
}

/** favicon 加载失败：换成内置的「网页」小图标 */
function onFaviconError(targetId: string) {
  const next = new Set(faviconFailed.value);
  next.add(targetId);
  faviconFailed.value = next;
  faviconCache.value = { ...faviconCache.value, [targetId]: "" };
}

/** 当前选中目标 */
const activeTarget = computed(() => targets.value.find((t) => t.id === selectedTarget.value) ?? null);

/** 当前网站地址（顶部原始网站条展示用） */
const activeUrl = computed(() => activeTarget.value?.url || "");

/** 顶部状态条里的变化 tag 数量 */
const changeTagCount = computed(() => consoleMessages.value.filter((m) => m.type === "change").length);

/* ==================== 工具 ==================== */

/**
 * 刷新浏览器状态
 *
 * @param quiet 静默模式：轮询对账（如停止浏览器时的 20 次轮询）传 true，
 *              避免连续失败时 toast 刷屏；常规一次性调用保持默认报错提示
 */
async function reloadStatus(quiet = false) {
  try {
    statusLoading.value = true;
    status.value = await cdpStatus();
  } catch (error) {
    status.value = null;
    if (!quiet) {
      ElMessage.error("浏览器状态拉取失败: " + ((error as Error)?.message ?? String(error)));
    }
    console.warn("[cdp] 状态拉取失败", error);
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 刷新目标列表（首次拿到列表时自动选中第一个页面，省掉一次点击）
 */
/** 目标列表对账序号：连发时只应用最新一次的结果，慢响应晚到不许覆盖新数据 */
let targetsReqSeq = 0;

async function reloadTargets() {
  const mySeq = ++targetsReqSeq;
  try {
    let list = await cdpTargets();
    // 后端 targets() 直连 Chrome /json，连接超时只有 1s：Chrome 一忙就会「成功地」
    // 返回空列表。浏览器真被关掉时 status 会离开 STARTED；这里先复核一次，
    // 避免一次抖动把目标面板清空、选中态丢失（采样/截屏等按钮会跟着全禁用）。
    if (list.length === 0 && targets.value.length > 0) {
      const st = await cdpStatus().catch(() => null);
      if (st && st.state === "STARTED") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const again = await cdpTargets().catch(() => [] as CdpTarget[]);
        if (again.length > 0) list = again;
      }
    }
    if (mySeq !== targetsReqSeq) return;
    targets.value = list;
    // 刷新后旧 selectedTarget 可能已失效（浏览器重启 / 目标重建）。
    // 只处理「空串」不够：失效 ID 会让所有页面级 CDP 调用打到一个不存在的
    // target 上，界面还显示「运行中」，但取 DOM / 截屏 / 求值全部失灵。
    const stillAlive = list.some((t) => t.id === selectedTarget.value);
    if (!stillAlive) {
      const page = list.find((t) => t.type === "page") ?? list[0];
      selectedTarget.value = page?.id ?? "";
    }
    // favicon 由浏览器 /json 不回传，按需从页面里读 link[rel~=icon] 缓存下来
    for (const t of list) {
      if (t.type === "page") {
        void loadFavicon(t);
      }
    }
    // 目标校正后，若停在「元素」页签就自动补一次 DOM / 画面，避免刷新后左侧空着
    void ensureElementReady();
  } catch (error) {
    if (mySeq !== targetsReqSeq) return;
    ElMessage.error("目标列表拉取失败: " + ((error as Error)?.message ?? String(error)));
    console.warn("[cdp] 目标列表拉取失败", error);
    // 拉取失败不清空旧列表：瞬时故障（后端忙 / Chrome 超时）不该把面板打空，
    // 保留上一次目标与选中态，等下一次对账或手动刷新恢复。
  }
}

/** 读页面的 favicon 链接（失败回落内置图标） */
async function loadFavicon(t: CdpTarget) {
  if (!wsReady()) {
    return;
  }
  if (faviconCache.value[t.id] || faviconFailed.value.has(t.id)) {
    return;
  }
  if (!t.url || !/^https?:/i.test(t.url)) {
    return;
  }
  try {
    const result = (await client.call(
      "Runtime.evaluate",
      {
        expression:
          "(function(){var l=document.querySelector('link[rel~=\"icon\"]');if(l&&l.href)return l.href;return location.origin+'/favicon.ico'})()",
        returnByValue: true,
      },
      t.id,
    )) as { result?: { value?: string } } | null;
    const value = result?.result?.value;
    if (typeof value === "string" && value && /^(https?:|data:)/i.test(value)) {
      faviconCache.value = { ...faviconCache.value, [t.id]: value };
      return;
    }
  } catch {
    // 页面可能还在加载 / 通道未就绪，交给回落图标
  }
  onFaviconError(t.id);
}

/* ==================== 浏览器生命周期 ==================== */

/**
 * 停止浏览器
 *
 * <p>后端 stop() 要按进程树 / 调试端口强杀再等端口关闭，耗时可能超过 REST 默认超时。
 * 旧实现一超时就只弹「停止失败」、catch 里不刷新状态，结果界面停在「运行中」，
 * 但浏览器其实已经被杀，所有功能都失效。这里改成「发指令 + 轮询对账」：不管这次
 * HTTP 是成功还是超时，都以最后拿到的 /status 为准来收尾。</p>
 */
async function stopBrowser() {
  statusLoading.value = true;
  try {
    try {
      await cdpStop();
    } catch (error) {
      // 超时 / 断连不等于没停：后端可能仍在收尾，靠下面的轮询对账
      console.warn("[cdp] 停止指令未即时返回，改为轮询状态对账", error);
    }
    let settled = false;
    for (let i = 0; i < 20; i++) {
      await reloadStatus(true);
      if (!running.value) {
        settled = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    await reloadTargets();
    if (settled || !running.value) {
      // 浏览器没了，所有跟页面相关的数据都不再属于当前会话，一起清掉
      selectedTarget.value = "";
      consoleMessages.value = [];
      networkRequests.value = [];
      domRaw.value = "";
      screenshotUrl.value = "";
      stageShot.value = "";
      stageHighlight.value = null;
      stageObserver?.disconnect();
      elementTree.value = null;
      ElMessage.success("浏览器已停止");
    } else {
      ElMessage.warning("停止未生效，状态仍为运行中，可点「启动」做一次自愈重启");
    }
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 启动浏览器（顺带自愈）
 *
 * <p>当界面显示「运行中」但页面全失效时，后端 start() 会校验端口 / 通道是否真的活着，
 * 不活就按 STOPPED 重来。因此这里允许在 running 状态下也点，作为「重启」用。</p>
 */
async function startBrowser() {
  try {
    await cdpStart();
    await reloadStatus();
    await reloadTargets();
    ElMessage.success("浏览器已就绪");
  } catch (error) {
    await reloadStatus();
    ElMessage.error("启动失败: " + (error as Error).message);
  }
}

/* ==================== 新建页面弹框 ==================== */

/** 弹框开关 */
const createOpen = ref(false);
/** 弹框里的地址 */
const createUrl = ref("");
/** 创建中（防重复提交） */
const createLoading = ref(false);
/** 地址输入框（打开弹框后自动聚焦） */
const createInputRef = ref<HTMLInputElement | null>(null);

/**
 * 补全地址：没写协议时按主机名补 http/https
 *
 * <p>本机 / 内网地址补 {@code http://}（本地 dev server 基本没有 TLS），
 * 其余补 {@code https://}；已带协议（http:、https:、about:、file:…）原样返回。</p>
 */
function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return "";
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return value;
  }
  const local = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(value);
  return `${local ? "http" : "https"}://${value}`;
}

/** 打开「新建页面」弹框 */
function openCreatePage() {
  createUrl.value = "";
  createOpen.value = true;
  nextTick(() => createInputRef.value?.focus());
}

/** 关闭弹框（创建中不响应，避免请求与 UI 脱节） */
function closeCreatePage() {
  if (createLoading.value) {
    return;
  }
  createOpen.value = false;
}

/**
 * 新建页面：地址留空则开 about:blank
 */
async function submitCreatePage() {
  if (createLoading.value) {
    return;
  }
  const url = normalizeUrl(createUrl.value);
  createLoading.value = true;
  try {
    const result = await cdpCreateTarget(url || undefined);
    createOpen.value = false;
    await reloadStatus();
    await reloadTargets();
    const targetId = (result as { targetId?: string } | undefined)?.targetId ?? "";
    if (targetId) {
      // 新页面自带干净的上下文，日志不跟着上一个目标走
      selectedTarget.value = targetId;
      consoleMessages.value = [];
      if (!netPreserveLog.value) {
        networkRequests.value = [];
      }
      domRaw.value = "";
      screenshotUrl.value = "";
      svgItems.value = [];
      svgError.value = "";
    }
    ElMessage.success(url ? `已打开 ${url}` : "已新建空白页");
  } catch (error) {
    ElMessage.error("创建页面失败: " + (error as Error).message);
  } finally {
    createLoading.value = false;
  }
}

/**
 * 关闭页面
 *
 * <p>关闭是不可逆操作（页面现场、未导出的日志一起丢），先弹确认框；
 * 用户取消时静默返回，不打扰。</p>
 */
async function closePage(targetId: string) {
  try {
    await message.confirm("确认关闭该页面？未保存的调试现场（日志 / 截屏 / 录制）将一并丢失", "关闭页面", "关闭");
  } catch {
    return; // 用户取消
  }
  try {
    const closingSelected = selectedTarget.value === targetId;
    await cdpCloseTarget(targetId);
    // 顺序很重要：先让出选中态，reloadTargets 才会自动补选一个剩下的目标
    if (closingSelected) {
      selectedTarget.value = "";
      domRaw.value = "";
      screenshotUrl.value = "";
      consoleMessages.value = [];
      if (!netPreserveLog.value) {
        networkRequests.value = [];
      }
      svgItems.value = [];
      svgError.value = "";
    }
    await reloadTargets();
  } catch (error) {
    ElMessage.error("关闭页面失败: " + (error as Error).message);
  }
}

/**
 * 切换目标（当前页签日志清空）
 */
function selectTarget(targetId: string) {
  if (targetId === selectedTarget.value) {
    return;
  }
  selectedTarget.value = targetId;
  consoleMessages.value = [];
  consoleGroupDepth = 0;
  expandedStacks.value = {};
  if (!netPreserveLog.value) {
    networkRequests.value = [];
    netDetailId.value = "";
    netBodyRaw.value = "";
  }
  domRaw.value = "";
  screenshotUrl.value = "";
  svgItems.value = [];
  svgError.value = "";
  // 断点是目标级的：换目标后旧断点 / 暂停态全部作废；原本开着就到新目标上重开一次
  breakpoints.value = [];
  pausedState.value = null;
  xhrBreakpoints.value = [];
  eventBreakpoints.value = [];
  // CPU / 堆采样同为目标级会话：换目标后旧采样作废
  cpuProfiling.value = false;
  heapProfiling.value = false;
  cpuProfile.value = null;
  cpuProfileRaw.value = null;
  heapProfile.value = null;
  heapProfileRaw.value = null;
  if (debuggerOn.value && wsReady() && targetId) {
    void client.call("Debugger.enable", {}, targetId).catch(() => {});
  }
  // 节流 / 请求拦截 / 设备仿真都是目标级会话状态：换目标后旧会话作废，能重挂就立刻重挂
  if (netThrottle.value !== "none") {
    void applyThrottle();
  }
  void applyInterceptRules();
  void applyDeviceEmulation(true);
}

/* ==================== 实时通道 ==================== */

/** WS 是否真的可用（cdpApi 的 call 在 WS 未打开时会静默丢消息，必须自己挡一层） */
function wsReady(): boolean {
  return wsConnected.value && client.isOpen();
}

/**
 * 连 WS：只用于「前端 → 浏览器」的 CDP 指令（Runtime.evaluate / DOM.* / Target.* …）。
 *
 * <p>事件推送已统一收敛到全局 SSE（见 {@code connectSse}），WS 不再 {@code client.on} 订阅事件，
 * 避免一个页面开两条事件流、也避免后端为每个 WS 会话重复注册订阅者。</p>
 */
function connectWs() {
  if (client.isOpen()) return;
  client.connect().then(() => {
    wsConnected.value = true;
    // WS 每次（重）连上都要对账一次：浏览器可能在断线期间被重建，
    // 旧 selectedTarget 已失效；重新拉目标列表并校正选中态，才能继续用。
    void reloadTargets().then(() => {
      void reloadStatus().then(() => ensureElementReady());
    });
    // 页面脚本（变化监视 / sw8）依赖 WS 指令通道，连上后补挂一次
    injectPageScripts();
    // 重连意味着旧 CDP 会话已销毁：节流 / 拦截 / 设备仿真若开着，到新会话上补挂一次
    void applyInterceptRules();
    if (netThrottle.value !== "none") {
      void applyThrottle();
    }
    void applyDeviceEmulation(true);
  }).catch(() => {
    // 握手失败（后端重启 / 鉴权过期 / 页面卸载）由 onclose 的指数退避重连兜底，
    // 这里必须吞掉 rejection，否则会变成未处理的 Promise 拒绝（控制台 PAGEERROR）。
    wsConnected.value = false;
  });
}

/** 全局唯一 SSE 客户端（调试中心所有实时事件都从这一条流进来） */
let sseClient: SseClient | null = null;

/**
 * 连全局 SSE：Console / Network / Page / Target / Runtime.bindingCalled 事件统一入口。
 *
 * <p>后端 {@code GET /ms/cdp/events} 推 {@code {"event":"Push","method","params","targetId"}} 帧，
 * 这里按 method 分发到既有的 {@code appendConsole / appendNetwork / onPageChanged} 等处理函数，
 * 前端不再定时轮询后端。</p>
 */
function connectSse() {
  if (sseClient) return;
  // 同源绝对地址：绕过 @repo/utils 的 http.baseUrl 前缀解析，确保命中 Vite 的 /ms/cdp 代理
  const url = `${window.location.protocol}//${window.location.host}/ms/cdp/events`;
  sseClient = createSseClient<Record<string, unknown>>(url, {
    method: "GET",
    reconnect: true,
    maxReconnectAttempts: Number.MAX_SAFE_INTEGER,
    reconnectInterval: 2000,
    /**
     * 后端用 {@code SseEmitter.data(Json.toJson(payload))} 发送：data 行是
     * 「JSON 字符串里再套一层 JSON」，defaultParse 只解一层会得到字符串。
     * 这里解到对象为止，同时兼容后端直接发 JSON 对象的情形。
     */
    parseData: (raw) => {
      try {
        let v: unknown = JSON.parse(raw);
        if (typeof v === "string") {
          try { v = JSON.parse(v); } catch { /* 本就是字符串帧（如 connected） */ }
        }
        return v as Record<string, unknown>;
      } catch {
        return raw as unknown as Record<string, unknown>;
      }
    },
    onOpen: () => {
      sseConnected.value = true;
      // SSE 重连往往意味着浏览器 / 页面重建，重新对账目标并重挂页面脚本
      void reloadTargets().then(() => {
        void reloadStatus().then(() => ensureElementReady());
      });
      injectPageScripts();
    },
    onMessage: (e) => {
      let frame = e.data as unknown;
      // 双保险：若仍是字符串帧，再解一次（兼容后端 data 双重编码）
      if (typeof frame === "string") {
        try { frame = JSON.parse(frame); } catch { return; }
      }
      if (!frame || typeof frame !== "object") return;
      dispatchCdpEvent(frame as Record<string, unknown>);
    },
    onError: () => {
      sseConnected.value = false;
    },
    onClose: () => {
      sseConnected.value = false;
    },
  });
}

/** 按 CDP method 分发一条 Push 帧（原来散落在 client.on 里的订阅全部收口到这里） */
function dispatchCdpEvent(m: Record<string, unknown>) {
  const method = String(m.method ?? "");
  switch (method) {
    // 控制台
    case "Runtime.consoleAPICalled":
    case "Runtime.exceptionThrown":
    case "Console.messageAdded":
      appendConsole(m);
      break;
    // 网络（F12 全链路：请求 → 响应 → 数据 → 完成 / 失败）
    case "Network.requestWillBeSent":
    case "Network.responseReceived":
    case "Network.dataReceived":
    case "Network.loadingFinished":
    case "Network.loadingFailed":
    case "Network.requestServedFromCache":
    case "Network.webSocketCreated":
    case "Network.webSocketFrameSent":
    case "Network.webSocketFrameReceived":
    case "Network.webSocketFrameError":
      appendNetwork(m);
      break;
    // Fetch 拦截：命中规则后按动作放行 / 屏蔽 / Mock / 改头（纯前端决策，后端只透传）
    case "Fetch.requestPaused":
      handleInterceptPaused((m.params ?? {}) as Record<string, unknown>, String(m.targetId ?? ""));
      break;
    // 性能追踪：Tracing.dataCollected 分批回推，累积到暂存区；tracingComplete 收尾
    case "Tracing.dataCollected":
      onTracingData((m.params ?? {}) as Record<string, unknown>, String(m.targetId ?? ""));
      break;
    case "Tracing.tracingComplete":
      onTracingComplete();
      break;
    case "Tracing.bufferUsage":
      perfBufferUsage.value = Math.round(Number(((m.params ?? {}) as Record<string, unknown>).percentFull ?? 0) * 100);
      break;
    // 录屏帧：交互舞台显示 + 录制截图采样（都靠这一路）
    case "Page.screencastFrame":
      onScreencastFrame((m.params ?? {}) as Record<string, unknown>, String(m.targetId ?? ""));
      break;
    // 页面变化：页面里 MutationObserver 经 Runtime.addBinding 主动回推，零轮询
    case "Runtime.bindingCalled": {
      const params = (m.params ?? {}) as Record<string, unknown>;
      if (String(params.name ?? "") === CHANGE_BINDING) {
        appendChange(String(params.payload ?? ""), String(m.targetId ?? ""));
        domDirty.value = true;
      }
      break;
    }
    // 导航 / 加载完成：变化 tag + DOM 快照标脏 + 事件驱动的截屏刷新 + 重挂页面脚本
    case "Page.frameNavigated": {
      // 主框架提交导航：地址栏进度条走起，并同步导航历史（后退 / 前进的可用性）
      const navParams = (m.params ?? {}) as Record<string, unknown>;
      const navFrame = (navParams.frame ?? {}) as Record<string, unknown>;
      if (navFrame.parentId == null) {
        if (String(m.targetId ?? "") === selectedTarget.value) {
          pageLoading.value = true;
          armLoadingWatchdog();
        }
        void refreshNavHistory();
      }
      onPageChanged("导航", m);
      reinjectPageScripts(String(m.targetId ?? "") || selectedTarget.value);
      autoRefreshSvg();
      break;
    }
    case "Page.loadEventFired":
      onPageChanged("加载完成", m);
      if (String(m.targetId ?? "") === selectedTarget.value) {
        pageLoading.value = false;
        clearTimeout(loadingWatchdog);
      }
      void refreshNavHistory();
      // 页面加载完成后脚本上下文已重建，重挂变化监视 / sw8
      reinjectPageScripts(String(m.targetId ?? "") || selectedTarget.value);
      autoRefreshSvg();
      break;
    // 目标变化：刷新列表（响应事件，不是轮询）
    case "Target.targetCreated":
    case "Target.targetDestroyed":
      void reloadTargets();
      break;
    case "Target.targetChanged":
      onTargetChanged(m);
      break;
    // Debugger 域：断点命中 / 恢复 / 位置解析 / 脚本登记（断点页签 + 透传链路）
    case "Debugger.paused":
      onDebuggerPaused((m.params ?? {}) as Record<string, unknown>);
      break;
    case "Debugger.resumed":
      pausedState.value = null;
      break;
    case "Debugger.breakpointResolved":
      onBreakpointResolved((m.params ?? {}) as Record<string, unknown>);
      break;
    case "Debugger.scriptParsed": {
      const sp = (m.params ?? {}) as Record<string, unknown>;
      const sid = String(sp.scriptId ?? "");
      if (sid) {
        scriptSources.value = { ...scriptSources.value, [sid]: String(sp.url ?? "") };
      }
      break;
    }
    default:
      break;
  }
}

/** 页面导航 / 加载完成：写一条变化 tag，并让 DOM 快照标脏 */
function onPageChanged(kind: string, m: Record<string, unknown>) {
  const targetId = String(m.targetId ?? "");
  const params = (m.params ?? {}) as Record<string, unknown>;
  const frame = (params.frame ?? {}) as Record<string, unknown>;
  const url = String(frame.url ?? "");
  // 只关心主框架，子 iframe 的导航不刷掉整棵树
  if (frame.parentId != null) {
    return;
  }
  appendChange(`${kind}${url ? ": " + url : ""}`, targetId);
  domDirty.value = true;
  // 主框架导航后本地同步目标 URL：左侧目标和顶部「原始网站条」不应等到下一次
  // /targets 对账才更新（之前会一直显示上一个地址，刷新后才对）。
  if (url && targetId) {
    const hit = targets.value.find((t) => t.id === targetId);
    if (hit && hit.url !== url) {
      hit.url = url;
      // 换了 origin，旧的 favicon 缓存/失败标记都要清掉，重新按新地址取一次
      if (faviconCache.value[targetId] || faviconFailed.value.has(targetId)) {
        const cache = { ...faviconCache.value };
        delete cache[targetId];
        faviconCache.value = cache;
        const failed = new Set(faviconFailed.value);
        failed.delete(targetId);
        faviconFailed.value = failed;
      }
      void loadFavicon(hit);
    }
  }
  if (stageLive.value && pageTab.value === "elements") {
    void refreshStage();
  }
}

/** 目标信息变化（标题 / url 更新）：同步 favicon 与舞台地址 */
function onTargetChanged(m: Record<string, unknown>) {
  void reloadTargets();
}

function disconnectWs() {
  client.disconnect();
  wsConnected.value = false;
}

/** 关闭全局 SSE */
function disconnectSse() {
  sseClient?.close();
  sseClient = null;
  sseConnected.value = false;
}

/* ==================== Console ==================== */

/** 自增序号（列表 key） */
let consoleSeq = 0;

/**
 * 把 CDP 的 RemoteObject 参数转成一行文本
 */
function argText(arg: Record<string, unknown>): string {
  if (!arg) {
    return "";
  }
  const value = arg.value;
  if (value !== undefined && value !== null) {
    return typeof value === "string" ? value : safeJson(value);
  }
  if (typeof arg.description === "string") {
    return arg.description;
  }
  if (typeof arg.unserializableValue === "string") {
    return arg.unserializableValue;
  }
  return typeof arg.type === "string" ? `<${arg.type}>` : safeJson(arg);
}

/** 安全的 JSON 序列化（循环引用 / 不可序列化都兜住） */
function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * CDP 级别归一：warning -> warn
 */
function normalizeLevel(type: string): string {
  const lower = type.toLowerCase();
  if (lower === "warning") {
    return "warn";
  }
  if (["error", "warn", "info", "log", "debug"].includes(lower)) {
    return lower;
  }
  if (lower === "change") {
    return "info";
  }
  return "log";
}

/** console.group 嵌套深度（模块级计数：startGroup +1，endGroup -1） */
let consoleGroupDepth = 0;

/** 记一条控制台消息（三条来源统一入口），返回 null 表示没有可入列的内容 */
function appendConsole(m: Record<string, unknown> = {}) {
  const params = (m.params ?? {}) as Record<string, unknown>;
  const method = String(m.method ?? "");
  // Runtime.consoleAPICalled 走 params.type / params.args；
  // Console.messageAdded 把内容包在 params.message 里；
  // Runtime.exceptionThrown 把异常包在 params.exceptionDetails 里。三条都要认。
  const inner = (params.message ?? {}) as Record<string, unknown>;
  const details = (params.exceptionDetails ?? {}) as Record<string, unknown>;
  const exception = (details.exception ?? {}) as Record<string, unknown>;
  let type = String(params.type ?? inner.level ?? inner.type ?? "log");
  const args = (Array.isArray(params.args) ? params.args : []).map(
    (a) => (a ?? {}) as Record<string, unknown>,
  );
  let text = args.length
    ? args.map(argText).join(" ")
    : String(params.text ?? inner.text ?? "");
  let stack: ConsoleStackFrame[] | undefined;
  if (method === "Runtime.exceptionThrown" || exception.description) {
    type = "error";
    text = String(exception.description ?? details.text ?? text ?? "未捕获异常");
    stack = extractStackTrace(details.stackTrace);
  }
  // console.group / groupCollapsed / endGroup：维护嵌套深度，消息按深度缩进。
  // startGroup 自身也入列（渲染成 ▾ 分组头），endGroup 渲染成 ▴ 收尾行。
  let depth = consoleGroupDepth;
  if (type === "startGroup" || type === "startGroupCollapsed") {
    depth = consoleGroupDepth;
    consoleGroupDepth += 1;
  } else if (type === "endGroup") {
    consoleGroupDepth = Math.max(0, consoleGroupDepth - 1);
    depth = consoleGroupDepth;
  }
  const record: ConsoleEntry = {
    key: ++consoleSeq,
    type,
    level: normalizeLevel(type),
    text: text || "(空消息)",
    targetId: String(m.targetId ?? selectedTarget.value ?? ""),
    timestamp: Number(m.timestamp || 0) || Date.now(),
    depth,
    stack,
  };
  consoleMessages.value.push(record);
  if (consoleMessages.value.length > maxConsole) {
    consoleMessages.value = consoleMessages.value.slice(-maxConsole);
  }
}

/**
 * 把 CDP 的 {@code StackTrace.callFrames} 压成可展示的帧列表
 *
 * <p>帧自带 {@code url} 时直接用；内联脚本 / eval 出来的帧可能只有 {@code scriptId}，
 * 用 {@link scriptSources}（Debugger.scriptParsed 登记的 scriptId → url）反查补全。
 * 最多保留 20 帧，避免深栈刷屏。</p>
 */
function extractStackTrace(raw: unknown): ConsoleStackFrame[] | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const frames = Array.isArray((raw as Record<string, unknown>).callFrames)
    ? ((raw as Record<string, unknown>).callFrames as Record<string, unknown>[])
    : [];
  if (!frames.length) {
    return undefined;
  }
  return frames.slice(0, 20).map((f) => {
    const scriptId = String(f.scriptId ?? "");
    const url = String(f.url ?? "") || (scriptId ? scriptSources.value[scriptId] ?? "" : "");
    return {
      url,
      line: f.lineNumber != null ? Number(f.lineNumber) + 1 : 0,
      fn: String(f.functionName ?? "") || "(anonymous)",
    };
  });
}

/** 写一条「变化」tag（DOM / 导航 / 网络等页面状态变化都走这里） */
function appendChange(text: string, targetId = "") {
  const record: ConsoleEntry = {
    key: ++consoleSeq,
    type: "change",
    level: normalizeLevel("change"),
    text,
    targetId: targetId || selectedTarget.value || "",
    timestamp: Date.now(),
    depth: 0,
  };
  consoleMessages.value.push(record);
  if (consoleMessages.value.length > maxConsole) {
    consoleMessages.value = consoleMessages.value.slice(-maxConsole);
  }
}

/* ==================== 变化监视（MutationObserver 注入） ==================== */

/** DOM 快照是否已因页面变化而失效 */
const domDirty = ref(false);

/**
 * 注入到页面的变化监视脚本
 *
 * <p>用 MutationObserver 监听整棵文档的 childList / attributes / characterData，
 * 把「新增/删除了几个节点、改了哪个属性、文本变成什么」压成一条条摘要；
 * 同时挂 hashchange / popstate 记录前端路由变化。每条变化经
 * {@code window.__cdpEmitChange} 绑定 → CDP 的 {@code Runtime.bindingCalled}
 * → 全局 SSE 主动回推给前端，前端零轮询，「网页任何变化」都以 change tag 落地。</p>
 */
const WATCH_SCRIPT = `(function () {
  if (window.__cdpWatchCleanup) { return; }
  window.__cdpWatch = true;
  window.__cdpChanges = [];
  var MAX = 60;
  function push(kind, text) {
    var line = '[' + kind + '] ' + text + ' @ ' + Date.now();
    window.__cdpChanges.push({ kind: kind, text: text, t: Date.now() });
    if (window.__cdpChanges.length > MAX) { window.__cdpChanges.splice(0, window.__cdpChanges.length - MAX); }
    // 事件驱动：页面变化立刻经 Runtime.bindingCalled → 全局 SSE 回推，前端不轮询
    try { if (typeof window.__cdpEmitChange === 'function') { window.__cdpEmitChange(line); } } catch (e) {}
  }
  var obs = new MutationObserver(function (list) {
    var added = 0, removed = 0, attrs = [], texts = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.type === 'childList') { added += r.addedNodes.length; removed += r.removedNodes.length; }
      else if (r.type === 'attributes' && r.target && r.target.nodeType === 1) {
        attrs.push('<' + r.target.tagName.toLowerCase() + '> ' + r.attributeName);
      } else if (r.type === 'characterData' && r.target && r.target.parentNode && r.target.parentNode.nodeType === 1) {
        texts.push('<' + r.target.parentNode.tagName.toLowerCase() + '>');
      }
    }
    var parts = [];
    if (added) { parts.push('新增 ' + added + ' 节点'); }
    if (removed) { parts.push('删除 ' + removed + ' 节点'); }
    if (attrs.length) { parts.push('属性 ' + attrs.slice(0, 3).join(', ') + (attrs.length > 3 ? '…' : '')); }
    if (texts.length) { parts.push('文本 ' + texts.slice(0, 3).join(', ') + (texts.length > 3 ? '…' : '')); }
    if (parts.length) { push('dom', parts.join(' · ')); }
  });
  obs.observe(document.documentElement || document, { childList: true, subtree: true, attributes: true, characterData: true });
  function onHash() { push('route', 'hash → ' + location.hash); }
  function onPop() { push('route', 'history → ' + location.pathname + location.search); }
  window.addEventListener('hashchange', onHash);
  window.addEventListener('popstate', onPop);
  window.__cdpWatchCleanup = function () {
    obs.disconnect();
    window.removeEventListener('hashchange', onHash);
    window.removeEventListener('popstate', onPop);
    window.__cdpWatch = false;
  };
})()`;

/** 关闭页面里的监视（保留队列，避免漏掉最后几条） */
const WATCH_OFF = `(function () { if (window.__cdpWatchCleanup) { window.__cdpWatchCleanup(); } })()`;

/** 目标 -> 是否已经注入过监视脚本 */
const watchInjected = new Set<string>();

/** 变化绑定名（Runtime.addBinding 注入，页面通过它把变化主动回推） */
const CHANGE_BINDING = "__cdpEmitChange";

/**
 * 给指定目标注入变化监视脚本（每个目标一次，页面刷新后由 SSE 事件重挂）
 *
 * <p>先 {@code Runtime.addBinding} 注册回推通道，页面里 MutationObserver 一旦
 * 发现变化就调用该绑定，后端经 {@code Runtime.bindingCalled} → 全局 SSE 推给前端，
 * 前端零轮询即可收到「网页任何变化」。</p>
 */
async function ensureWatch(target: string) {
  if (!target || !wsReady()) {
    return;
  }
  try {
    await client.call("Runtime.addBinding", { name: CHANGE_BINDING }, target);
    await client.call("Runtime.evaluate", { expression: WATCH_SCRIPT, returnByValue: true }, target);
    watchInjected.add(target);
  } catch {
    watchInjected.delete(target);
  }
}

/**
 * 页面脚本注入（变化监视 + sw8 + favicon 补齐）
 *
 * <p>只在「WS 可用 / 切目标 / 页面导航完成 / SSE 重连」这些离散事件里调一次，
 * 替代旧的 600ms 定时轮询，前端不再自动反复请求后端。</p>
 */
function injectPageScripts(target = selectedTarget.value) {
  if (!target || !wsReady()) {
    return;
  }
  if (watchEnabled.value && !watchInjected.has(target)) {
    void ensureWatch(target);
  }
  if (sw8Enabled.value && !sw8Injected.has(target)) {
    void ensureSw8(target);
  }
  const t = targets.value.find((it) => it.id === target);
  if (t && t.type === "page" && !faviconCache.value[t.id] && !faviconFailed.value.has(t.id)) {
    void loadFavicon(t);
  }
}

/**
 * 页面上下文重建后重挂脚本：先清掉该目标的「已注入」标记，
 * 再走 {@link #injectPageScripts} 重新挂变化监视 / sw8 / favicon。
 */
function reinjectPageScripts(target: string) {
  if (!target) return;
  watchInjected.delete(target);
  sw8Injected.delete(target);
  injectPageScripts(target);
}

/**
 * 变化监视开关：关闭时让页面里的观察者下线；开启时补一次注入。
 * 不再起定时器，全部由事件驱动。
 */
function syncWatchInjection() {
  if (!watchEnabled.value) {
    if (wsReady() && selectedTarget.value) {
      void client
        .call("Runtime.evaluate", { expression: WATCH_OFF, returnByValue: true }, selectedTarget.value)
        .catch(() => undefined);
    }
    return;
  }
  injectPageScripts();
}

/* ==================== Network（F12 风格） ==================== */

/** 网络条目自增序号（列表 key） */
let netSeq = 0;

/** 请求头数组 -> 对象（CDP 是 {name,value}[] 或扁平对象） */
function toHeaderMap(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (const item of raw as Record<string, unknown>[]) {
      if (item && item.name != null) {
        out[String(item.name)] = String(item.value ?? "");
      }
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      out[k] = String(v ?? "");
    }
  }
  return out;
}

/** 把发起者压成一行文本 */
function initiatorText(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    return "";
  }
  const r = raw as Record<string, unknown>;
  const stack = (r.stack ?? {}) as Record<string, unknown>;
  const frames = Array.isArray(stack.callFrames) ? (stack.callFrames as Record<string, unknown>[]) : [];
  const first = frames[0];
  const url = String(first?.url ?? "");
  const line = first?.lineNumber != null ? `:${Number(first.lineNumber) + 1}` : "";
  const type = String(r.type ?? "");
  return `${type || "other"}${url ? " · " + url + line : ""}`;
}

/**
 * 从请求头解析链路标识
 *
 * <p>优先认 SkyWalking 的 {@code sw8}（{@code 1-traceId-segmentId-spanId-parentSpanId-...}，
 * 各段 base64），其次认 W3C {@code traceparent}（{@code 00-traceId-spanId-flags}）。
 * 解析结果写回条目，网络列表与详情「链路」子页签、APM 跳转都基于它。</p>
 */
function parseTrace(headers: Record<string, string>): { traceId: string; segmentId: string; spanId: string; source: string } {
  const out = { traceId: "", segmentId: "", spanId: "", source: "" };
  const pick = (name: string): string => {
    const hit = Object.keys(headers).find((k) => k.toLowerCase() === name);
    return hit ? String(headers[hit] ?? "").trim() : "";
  };
  const decode = (v: string): string => {
    if (!v) return "";
    try {
      return decodeURIComponent(escape(atob(v)));
    } catch {
      return v;
    }
  };
  const sw8 = pick("sw8");
  if (sw8) {
    const parts = sw8.split("-");
    // 1 / traceId / segmentId / spanId / parentSpanId / service / instance / endpoint / peer
    if (parts.length >= 4) {
      out.traceId = decode(parts[1]);
      out.segmentId = decode(parts[2]);
      out.spanId = decode(parts[3]);
      out.source = "sw8";
      return out;
    }
  }
  const tp = pick("traceparent");
  if (tp) {
    const parts = tp.split("-");
    if (parts.length >= 4) {
      out.traceId = parts[1];
      out.spanId = parts[2];
      out.source = "traceparent";
    }
  }
  return out;
}

/** 造一条空的网络条目 */
function blankNet(): NetEntry {
  return {
    requestId: "",
    seq: ++netSeq,
    method: "",
    url: "",
    type: "",
    status: "",
    statusText: "",
    mimeType: "",
    fromCache: false,
    size: 0,
    received: 0,
    duration: 0,
    timestamp: Date.now(),
    wallTime: Date.now(),
    postData: "",
    requestHeaders: {},
    responseHeaders: {},
    initiator: "",
    errorText: "",
    targetId: "",
    traceId: "",
    segmentId: "",
    spanId: "",
    traceSource: "",
  };
}

/** WebSocket 帧事件 → 帧方向（Network.webSocketFrame*） */
const WS_FRAME_METHODS = new Map<string, "sent" | "received" | "error">(
  Object.entries({
    "Network.webSocketFrameSent": "sent",
    "Network.webSocketFrameReceived": "received",
    "Network.webSocketFrameError": "error",
  }) as [string, "sent" | "received" | "error"][],
);

/** WebSocket 帧类型码的可读名 */
function wsOpcodeName(op: number): string {
  switch (op) {
    case 0:
      return "continuation";
    case 1:
      return "text";
    case 2:
      return "binary";
    case 8:
      return "close";
    case 9:
      return "ping";
    case 10:
      return "pong";
    default:
      return `op:${op}`;
  }
}

/** 按 requestId 找条目（不存在则建一条；重定向复用 id 时补信息） */
function findNet(requestId: string, create = false): NetEntry | undefined {
  let hit = networkRequests.value.find((n) => n.requestId === requestId);
  if (!hit && create && requestId) {
    hit = blankNet();
    hit.requestId = requestId;
    networkRequests.value.push(hit);
    if (networkRequests.value.length > maxNetwork) {
      networkRequests.value = networkRequests.value.slice(-maxNetwork);
    }
  }
  return hit;
}

/**
 * 归并 CDP 网络事件到一行
 *
 * <p>后端把事件 params 原样透传，这里用完整数据补齐 F12 的列与详情：
 * requestWillBeSent(名称/方法/类型/请求头/发起者) → responseReceived(状态/响应头/MIME)
 * → dataReceived(增量字节) → loadingFinished(耗时/总大小) / loadingFailed(错误)。</p>
 */
function appendNetwork(m: Record<string, unknown> = {}) {
  const method = String(m.method ?? "");
  const params = (m.params ?? {}) as Record<string, unknown>;
  if (!params) return;
  const requestId = String(params.requestId ?? "");
  const targetId = String(m.targetId ?? selectedTarget.value ?? "");

  if (method === "Network.requestWillBeSent") {
    const req = (params.request ?? {}) as Record<string, unknown>;
    const redirect = (params.redirectResponse ?? {}) as Record<string, unknown>;
    const hit = findNet(requestId, true);
    if (!hit) return;
    // 重定向会复用同一个 requestId：先把上一段记成 3xx，再覆盖为本段
    if (Object.keys(redirect).length && hit.url) {
      hit.status = String(redirect.status ?? "302");
      hit.statusText = String(redirect.statusText ?? "");
      hit.responseHeaders = toHeaderMap(redirect.headers);
      hit.fromCache = redirect.fromDiskCache === true;
    }
    hit.requestId = requestId;
    hit.method = String(req.method ?? params.method ?? "GET");
    hit.url = String(req.url ?? params.url ?? "");
    hit.type = String(params.type ?? "other");
    hit.timestamp = Number(params.timestamp ?? 0) * 1000 || Date.now();
    hit.requestHeaders = toHeaderMap(req.headers);
    const trace = parseTrace(hit.requestHeaders);
    if (trace.traceId) {
      hit.traceId = trace.traceId;
      hit.segmentId = trace.segmentId;
      hit.spanId = trace.spanId;
      hit.traceSource = trace.source;
    }
    hit.initiator = initiatorText(params.initiator);
    hit.targetId = targetId;
    hit.status = redirect.status ? String(redirect.status) : "";
    hit.size = 0;
    hit.received = 0;
    hit.duration = 0;
    hit.errorText = "";
    return;
  }

  const hit = findNet(requestId);
  if (!hit) {
    // 只有响应没有发起事件（页面在 WS 连上前就发了）：补一行
    if (method === "Network.responseReceived" && params.response) {
      const created = findNet(requestId, true);
      if (created) {
        created.url = String(params.url ?? "");
        created.type = String(params.type ?? "other");
        created.targetId = targetId;
      }
    }
    return;
  }

  if (method === "Network.responseReceived") {
    const res = (params.response ?? {}) as Record<string, unknown>;
    hit.status = String(res.status ?? "");
    hit.statusText = String(res.statusText ?? "");
    hit.mimeType = String(res.mimeType ?? "");
    hit.responseHeaders = toHeaderMap(res.headers);
    hit.fromCache = res.fromDiskCache === true || res.fromServiceWorker === true;
    if (params.type) hit.type = String(params.type);
    if (res.encodedDataLength) hit.size = Number(res.encodedDataLength);
    if (res.url) hit.url = String(res.url);
    if (res.requestHeaders) hit.requestHeaders = toHeaderMap(res.requestHeaders);
    // 4xx/5xx 也算页面「变化」的一种，落到 change tag
    if (/^[45]/.test(hit.status)) {
      appendChange(`请求失败 ${hit.status} ${hit.method} ${urlName(hit.url)}`, targetId);
    }
    return;
  }
  if (method === "Network.dataReceived") {
    hit.received += Number(params.dataLength ?? 0);
    if (params.encodedDataLength) hit.size = Math.max(hit.size, Number(params.encodedDataLength));
    return;
  }
  if (method === "Network.loadingFinished") {
    hit.duration = hit.timestamp ? Math.max(0, Number(params.timestamp ?? 0) * 1000 - hit.timestamp) : 0;
    if (params.encodedDataLength) hit.size = Number(params.encodedDataLength);
    return;
  }
  if (method === "Network.loadingFailed") {
    hit.errorText = String(params.errorText ?? "failed");
    hit.duration = hit.timestamp ? Math.max(0, Number(params.timestamp ?? 0) * 1000 - hit.timestamp) : 0;
    appendChange(`请求失败 ${hit.method} ${urlName(hit.url)}：${hit.errorText}`, targetId);
    return;
  }
  if (method === "Network.requestServedFromCache") {
    hit.fromCache = true;
    return;
  }

  // WebSocket：建连事件补一行（type=websocket），帧事件按方向挂到该行
  if (method === "Network.webSocketCreated") {
    const ws = findNet(requestId, true);
    if (ws) {
      ws.type = "websocket";
      if (params.url) ws.url = String(params.url);
      ws.targetId = targetId;
      if (!ws.wsFrames) ws.wsFrames = [];
    }
    return;
  }
  const wsKind = WS_FRAME_METHODS.get(method);
  if (wsKind) {
    const ws = findNet(requestId);
    if (!ws) return;
    if (!ws.wsFrames) ws.wsFrames = [];
    if (wsKind === "error") {
      ws.wsFrames.push({
        dir: "error",
        opcode: -1,
        mask: false,
        payload: String(params.errorMessage ?? "frame error"),
        time: Number(params.timestamp ?? 0) * 1000,
        size: 0,
      });
    } else {
      const f = (params.response ?? {}) as Record<string, unknown>;
      const opcode = Number(f.opcode ?? -1);
      const raw = String(f.payload ?? "");
      // 二进制帧 CDP 给 base64：不落地内容，按 base64 长度近似还原字节数
      ws.wsFrames.push({
        dir: wsKind === "sent" ? "send" : "recv",
        opcode,
        mask: f.mask === true,
        payload: opcode === 2 ? "" : raw,
        time: Number(params.timestamp ?? 0) * 1000,
        size: opcode === 2 ? Math.floor((raw.length * 3) / 4) : raw.length,
      });
    }
  }
}

/** 清空网络表 */
function clearNetwork() {
  networkRequests.value = [];
  netDetailId.value = "";
  netBodyRaw.value = "";
}

/** 清空控制台 */
function clearConsole() {
  consoleMessages.value = [];
  consoleGroupDepth = 0;
  expandedStacks.value = {};
}

/** 展开 / 收起一条请求的详情 */
function toggleNetDetail(id: string) {
  netDetailId.value = netDetailId.value === id ? "" : id;
  netDetailTab.value = "headers";
  netBodyRaw.value = "";
}

/** 切换详情子页签（响应按需拉取） */
function showNetTab(tab: NetDetailTab) {
  netDetailTab.value = tab;
  netBodyRaw.value = "";
  if (tab === "response") {
    void loadNetBody();
  }
}

/** 原始响应体（美化前，用于「原始 / 格式化」切换） */
const netBodyRaw = ref("");

/** 美化响应：JSON 缩进、HTML/XML 按标签折行、其余原样 */
function prettyBody(raw: string): string {
  const text = (raw ?? "").trim();
  if (!text) return "";
  // JSON（对象 / 数组）：缩进两格
  if (/^[\[{]/.test(text)) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* 不是合法 JSON，落到下面 */
    }
  }
  // HTML / XML / SVG：在标签边界补换行，保持内容不变的可读排布
  if (/^<[!a-zA-Z]/.test(text) && /<\/[a-zA-Z]|^<!doctype/i.test(text)) {
    const spaced = text
      .replace(/>\s*</g, ">\n<")
      .replace(/>\n<(\/?)([a-zA-Z]+)/g, (m, slash, tag) =>
        /^(br|hr|img|input|meta|link|path|circle|rect|line|use|source|area|base|col|embed|param|track|wbr)$/i.test(tag)
          ? m
          : m,
      );
    const lines = spaced.split("\n");
    let depth = 0;
    return lines
      .map((line) => {
        const t = line.trim();
        if (!t) return "";
        const closing = /^<\//.test(t);
        const selfClose = /\/>$/.test(t) || /^<[!?]/.test(t);
        if (closing) depth = Math.max(0, depth - 1);
        const pad = "  ".repeat(depth);
        if (!closing && !selfClose && /^<[a-zA-Z]/.test(t) && !/<\/[a-zA-Z]+>$/.test(t)) depth++;
        return pad + t;
      })
      .filter((l) => l !== "")
      .join("\n");
  }
  return raw ?? "";
}

/** 展示中的响应体（按开关美化） */
const netBodyDisplay = computed(() =>
  netBodyPretty.value ? prettyBody(netBodyRaw.value) : netBodyRaw.value,
);

/** 经 WS 任意方法透传读取响应体（不用改后端 / cdpApi 签名） */
async function loadNetBody() {
  const entry = netDetail.value;
  if (!entry || !entry.requestId) {
    netBodyRaw.value = "该请求没有可用的 requestId";
    return;
  }
  netBodyLoading.value = true;
  try {
    const result = (await client.call(
      "Network.getResponseBody",
      { requestId: entry.requestId },
      entry.targetId || selectedTarget.value || undefined,
    )) as { body?: string; base64Encoded?: boolean } | null;
    let body = typeof result?.body === "string" ? result.body : "";
    if (body && result?.base64Encoded) {
      try {
        body = decodeURIComponent(
          atob(body)
            .split("")
            .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
            .join(""),
        );
      } catch {
        body = `[base64 ${body.length} 字节，无法解码为文本]`;
      }
    }
    netBodyRaw.value = body || "没有响应体（可能是重定向、缓存或已被页面释放）";
  } catch (error) {
    netBodyRaw.value = "读取响应体失败: " + (error as Error).message;
  } finally {
    netBodyLoading.value = false;
  }
}

/** 拖拽分隔条：开始 */
function startNetResize(event: PointerEvent) {
  netResizing = true;
  const startY = event.clientY;
  const startHeight = netDetailHeight.value;
  const onMove = (e: PointerEvent) => {
    if (!netResizing) return;
    // 往上拖 = 变高，限制在 120 ~ 视口六成之间
    const next = startHeight + (startY - e.clientY);
    netDetailHeight.value = Math.max(120, Math.min(Math.round(window.innerHeight * 0.6), next));
  };
  const onUp = () => {
    netResizing = false;
    writePref("net.detailHeight", netDetailHeight.value);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    document.body.style.userSelect = "";
  };
  document.body.style.userSelect = "none";
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

/** 复制文本到剪贴板 */
async function copyText(text: string, ok = "已复制到剪贴板") {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(ok);
  } catch {
    ElMessage.warning("当前浏览器不允许写剪贴板，请手动选中复制");
  }
}

/* ==================== 网络增强：右键菜单 / 节流 / 请求拦截 ==================== */

/* ---------- 网络行右键菜单（复制 cURL / fetch、重放、屏蔽入口） ---------- */

/** 网络行右键菜单状态（与元素树 contextMenu 同款：视口内定位 + 当前条目） */
const netMenu = ref<{ open: boolean; x: number; y: number; entry: NetEntry | null }>({
  open: false,
  x: 0,
  y: 0,
  entry: null,
});

/** 打开网络行右键菜单（先记住条目，再在鼠标处弹菜单，边界不出视口） */
function openNetMenu(event: MouseEvent, entry: NetEntry) {
  const menuW = 230;
  const menuH = 170;
  netMenu.value = {
    open: true,
    x: Math.min(event.clientX, window.innerWidth - menuW - 8),
    y: Math.min(event.clientY, window.innerHeight - menuH - 8),
    entry,
  };
}

function closeNetMenu() {
  netMenu.value.open = false;
}

/** 重放 / 复制时不该原样带走的头（长度、主机、连接由浏览器自己算） */
const REPLAY_SKIP_HEADERS = new Set(["content-length", "host", "connection", "origin", "referer"]);

/** shell 单引号转义（'xxx'\''yyy' 写法） */
function shQuote(v: string): string {
  return `'${String(v).replace(/'/g, `'\\''`)}'`;
}

/** 生成可重发的 cURL 命令（F12「Copy as cURL」风格） */
function buildCurl(n: NetEntry): string {
  const lines: string[] = [`curl ${shQuote(n.url)}`];
  if (n.method && n.method.toUpperCase() !== "GET") {
    lines.push(`  -X ${n.method.toUpperCase()}`);
  }
  for (const [k, v] of Object.entries(n.requestHeaders ?? {})) {
    if (!k || REPLAY_SKIP_HEADERS.has(k.toLowerCase())) {
      continue;
    }
    lines.push(`  -H ${shQuote(`${k}: ${v}`)}`);
  }
  if (n.postData) {
    lines.push(`  --data-raw ${shQuote(n.postData)}`);
  }
  lines.push("  --compressed");
  return lines.join(" \\\n");
}

/** 生成可重发的 fetch 代码（F12「Copy as fetch」风格） */
function buildFetchCode(n: NetEntry): string {
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(n.requestHeaders ?? {})) {
    if (!k || REPLAY_SKIP_HEADERS.has(k.toLowerCase())) {
      continue;
    }
    headers[k] = v;
  }
  const parts = [`fetch(${JSON.stringify(n.url)}, {`, `  method: ${JSON.stringify((n.method || "GET").toUpperCase())},`, `  headers: ${JSON.stringify(headers)},`];
  if (n.postData) {
    parts.push(`  body: ${JSON.stringify(n.postData)},`);
  }
  parts.push("});");
  return parts.join("\n");
}

/**
 * 重放一条请求：在页面上下文里用 fetch 重发
 *
 * <p>走 {@code Runtime.evaluate} + {@code awaitPromise}，不依赖 Fetch 域，重放
 * 用的就是页面自己的 Cookie / 会话。结果同时以一条 change tag 落到控制台，方便对照原请求。</p>
 */
async function replayRequest(n: NetEntry) {
  if (!wsReady()) {
    ElMessage.warning("实时通道未连接，无法重放");
    return;
  }
  const targetId = n.targetId || selectedTarget.value;
  if (!targetId) {
    ElMessage.warning("该请求没有归属目标，无法重放");
    return;
  }
  const payload = {
    url: n.url,
    method: (n.method || "GET").toUpperCase(),
    headers: Object.fromEntries(
      Object.entries(n.requestHeaders ?? {}).filter(([k]) => k && !REPLAY_SKIP_HEADERS.has(k.toLowerCase())),
    ),
    body: n.postData || "",
  };
  const script = `(async () => {
    const p = ${JSON.stringify(payload)};
    const init = { method: p.method, headers: p.headers, credentials: 'include' };
    if (p.body && p.method !== 'GET' && p.method !== 'HEAD') { init.body = p.body; }
    const t0 = performance.now();
    try {
      const res = await fetch(p.url, init);
      const text = await res.text();
      return JSON.stringify({ ok: true, status: res.status, ms: Math.round(performance.now() - t0), bytes: text.length });
    } catch (e) {
      return JSON.stringify({ ok: false, error: String((e && e.message) || e) });
    }
  })()`;
  try {
    const result = (await client.call(
      "Runtime.evaluate",
      { expression: script, returnByValue: true, awaitPromise: true },
      targetId,
    )) as { result?: { value?: string } } | null;
    let info: { ok?: boolean; status?: number; ms?: number; bytes?: number; error?: string } = {};
    try {
      info = JSON.parse(String(result?.result?.value ?? "{}"));
    } catch {
      // 返回帧解析失败按未知错误处理
    }
    if (info.ok) {
      appendChange(`重放 ${payload.method} ${urlName(n.url)} → ${info.status}（${info.ms} ms · ${info.bytes} B）`, targetId);
      ElMessage.success(`重放完成：${info.status}（${info.ms} ms）`);
    } else {
      appendChange(`重放 ${payload.method} ${urlName(n.url)} 失败：${info.error || "未知错误"}`, targetId);
      ElMessage.error("重放失败: " + (info.error || "未知错误"));
    }
  } catch (error) {
    ElMessage.error("重放失败: " + (error as Error).message);
  }
}

/** 网络右键菜单动作统一收口（点击后菜单关闭） */
async function runNetAction(action: string) {
  const entry = netMenu.value.entry;
  closeNetMenu();
  if (!entry) {
    return;
  }
  switch (action) {
    case "curl":
      void copyText(buildCurl(entry), "已复制 cURL 命令");
      break;
    case "fetch":
      void copyText(buildFetchCode(entry), "已复制 fetch 代码");
      break;
    case "replay":
      await replayRequest(entry);
      break;
    case "block":
      addInterceptRule({ pattern: entry.url, action: "block" });
      ElMessage.success("已加入屏蔽规则并开启拦截");
      break;
    default:
      break;
  }
}

/* ---------- 网络节流（Network.emulateNetworkConditions） ---------- */

/** 节流预设（CDP 口径：字节 / 秒；Chrome DevTools 同款数值） */
interface ThrottlePreset {
  label: string;
  download: number;
  upload: number;
  latency: number;
}

const THROTTLE_PRESETS: Record<string, ThrottlePreset> = {
  fast3g: { label: "Fast 3G", download: 200_000, upload: 93_750, latency: 150 },
  slow3g: { label: "Slow 3G", download: 50_000, upload: 50_000, latency: 400 },
};

/** 当前节流档位（none = 不限速） */
const netThrottle = ref<string>(readPref<string>("net.throttle", "none"));
/** 自定义档参数（界面按 KB/s 填，下发时换算成 B/s） */
const netThrottleCustom = ref<{ download: number; upload: number; latency: number }>(
  readPref("net.throttleCustom", { download: 1024, upload: 512, latency: 100 }),
);

/**
 * 应用 / 清除网络节流
 *
 * <p>目标级会话命令：切目标、重启浏览器后由 {@link selectTarget} / {@code watch(running)} 重挂。</p>
 */
async function applyThrottle() {
  writePref("net.throttle", netThrottle.value);
  writePref("net.throttleCustom", netThrottleCustom.value);
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    if (netThrottle.value !== "none") {
      ElMessage.warning("实时通道未连接，节流暂未生效");
    }
    return;
  }
  if (netThrottle.value === "none") {
    // 清除：offline=false 且吞吐 -1（CDP 约定 -1 = 不限速）
    await client
      .call("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }, targetId)
      .then(() => ElMessage.success("已清除网络节流"))
      .catch((e: Error) => ElMessage.error("清除节流失败: " + e.message));
    return;
  }
  let params: { offline: boolean; latency: number; downloadThroughput: number; uploadThroughput: number };
  if (netThrottle.value === "offline") {
    params = { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 };
  } else if (netThrottle.value === "custom") {
    const c = netThrottleCustom.value;
    params = {
      offline: false,
      latency: Math.max(0, Number(c.latency) || 0),
      downloadThroughput: Math.max(0, Number(c.download) || 0) * 1024,
      uploadThroughput: Math.max(0, Number(c.upload) || 0) * 1024,
    };
  } else {
    const preset = THROTTLE_PRESETS[netThrottle.value] ?? THROTTLE_PRESETS.fast3g;
    params = { offline: false, latency: preset.latency, downloadThroughput: preset.download, uploadThroughput: preset.upload };
  }
  const label = netThrottle.value === "custom" ? "自定义" : THROTTLE_PRESETS[netThrottle.value]?.label ?? netThrottle.value;
  await client
    .call("Network.emulateNetworkConditions", params, targetId)
    .then(() => ElMessage.success(`节流已应用：${label}`))
    .catch((e: Error) => ElMessage.error("应用节流失败: " + e.message));
}

/* ---------- 设备仿真 / UA 覆盖 / CPU 节流（Emulation 域） ---------- */

/** 常用设备预设（DevTools Device Mode 同款视口 / DPR / UA 口径） */
interface DevicePreset {
  label: string;
  width: number;
  height: number;
  scale: number;
  mobile: boolean;
  ua: string;
}

const DEVICE_PRESETS: Record<string, DevicePreset> = {
  iphone: {
    label: "iPhone 13/14",
    width: 390,
    height: 844,
    scale: 3,
    mobile: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  },
  iphoneSe: {
    label: "iPhone SE",
    width: 375,
    height: 667,
    scale: 2,
    mobile: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  },
  ipad: {
    label: "iPad mini",
    width: 768,
    height: 1024,
    scale: 2,
    mobile: true,
    ua: "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  },
  pixel: {
    label: "Pixel 7",
    width: 412,
    height: 915,
    scale: 2.625,
    mobile: true,
    ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  galaxy: {
    label: "Galaxy S20",
    width: 360,
    height: 800,
    scale: 3,
    mobile: true,
    ua: "Mozilla/5.0 (Linux; Android 12; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },
};

/** 当前设备档位：none = 桌面默认；DEVICE_PRESETS 的 key；custom = 自定义参数 */
const deviceEmul = ref<string>(readPref<string>("emu.device", "none"));
/** 自定义设备参数（custom 档生效；ua 留空 = 不覆盖 UA） */
const deviceCustom = ref<{ width: number; height: number; scale: number; mobile: boolean; ua: string }>(
  readPref("emu.deviceCustom", { width: 390, height: 844, scale: 2, mobile: true, ua: "" }),
);
/** CPU 节流倍率（1 = 不节流；4 = 四倍慢） */
const cpuRate = ref<number>(readPref<number>("emu.cpu", 1));
/** 仿真面板开关 */
const emuPanelOpen = ref(false);

/**
 * 应用 / 清除设备仿真、UA 覆盖与 CPU 节流
 *
 * <p>目标级会话命令：切目标、WS 重连、浏览器重启后由 {@link selectTarget} / {@code connectWs} /
 * {@code watch(running)} 重挂（silent 传 true，避免重连时消息轰炸）。</p>
 */
async function applyDeviceEmulation(silent = false) {
  writePref("emu.device", deviceEmul.value);
  writePref("emu.deviceCustom", deviceCustom.value);
  writePref("emu.cpu", cpuRate.value);
  const targetId = selectedTarget.value;
  const needDevice = deviceEmul.value !== "none";
  const rate = Math.min(50, Math.max(1, Number(cpuRate.value) || 1));
  const needCpu = rate > 1;
  if (!wsReady() || !targetId) {
    if ((needDevice || needCpu) && !silent) {
      ElMessage.warning("实时通道未连接，设备仿真暂未生效");
    }
    return;
  }
  try {
    if (needDevice) {
      const p = deviceEmul.value === "custom" ? null : DEVICE_PRESETS[deviceEmul.value];
      const w = Math.max(1, Number(p ? p.width : deviceCustom.value.width) || 390);
      const h = Math.max(1, Number(p ? p.height : deviceCustom.value.height) || 844);
      const s = Math.max(1, Number(p ? p.scale : deviceCustom.value.scale) || 2);
      const mob = p ? p.mobile : deviceCustom.value.mobile !== false;
      await client.call("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: s, mobile: mob }, targetId);
      const ua = p ? p.ua : String(deviceCustom.value.ua || "").trim();
      if (ua) {
        await client.call("Emulation.setUserAgentOverride", { userAgent: ua }, targetId);
      }
    } else {
      // 清除：恢复桌面视口；UA 传空串 = 撤销覆盖（Chrome 约定）
      await client.call("Emulation.clearDeviceMetricsOverride", {}, targetId);
      await client.call("Emulation.setUserAgentOverride", { userAgent: "" }, targetId);
    }
    await client.call("Emulation.setCPUThrottlingRate", { rate }, targetId);
    if (!silent) {
      const parts: string[] = [];
      if (needDevice) {
        parts.push(deviceEmul.value === "custom" ? "自定义设备" : DEVICE_PRESETS[deviceEmul.value]?.label ?? deviceEmul.value);
      }
      if (needCpu) {
        parts.push(`CPU ×${rate}`);
      }
      ElMessage.success(parts.length ? `仿真已应用：${parts.join(" · ")}` : "已清除设备仿真与 CPU 节流");
    }
  } catch (e) {
    if (!silent) {
      ElMessage.error("设备仿真失败: " + (e as Error).message);
    }
  }
}

/* ---------- 请求拦截（Fetch.enable + requestPaused） ---------- */

/** 一条拦截规则 */
interface InterceptRule {
  /** 稳定 id（列表 key） */
  id: string;
  /** URL 匹配串（支持 * 通配；按列表顺序匹配，命中即停） */
  pattern: string;
  /** 动作：block=屏蔽，mock=本地应答，header=改写请求头后放行 */
  action: "block" | "mock" | "header";
  /** mock：响应码 */
  status: number;
  /** mock：响应体 */
  body: string;
  /** mock：Content-Type */
  mime: string;
  /** header：要改写的请求头（原名 -> 新值，大小写不敏感合并） */
  headers: Record<string, string>;
}

let interceptSeq = 0;

/** 拦截规则列表（持久化，刷新后仍在） */
const interceptRules = ref<InterceptRule[]>(readPref<InterceptRule[]>("net.interceptRules", []));
/** 拦截总开关（有规则也不会自动开启，避免悄悄改页面行为） */
const interceptOn = ref<boolean>(readPref<boolean>("net.interceptOn", false));
/** 拦截面板展开态 */
const interceptPanelOpen = ref(false);
/** Fetch 域是否已挂上（避免重复 enable） */
let fetchInterceptActive = false;

// 开关 / 规则变化即重挂 Fetch 域并记住偏好
watch(
  [interceptOn, interceptRules],
  () => {
    writePref("net.interceptOn", interceptOn.value);
    writePref("net.interceptRules", interceptRules.value);
    void applyInterceptRules();
  },
  { deep: true },
);

/** 通配匹配：只有 * 是通配符，其余按字面量；空串不匹配任何 URL */
function matchInterceptPattern(pattern: string, url: string): boolean {
  const p = pattern.trim();
  if (!p) {
    return false;
  }
  if (p === "*") {
    return true;
  }
  try {
    const re = new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[\\s\\S]*") + "$");
    return re.test(url);
  } catch {
    return false;
  }
}

/** 新增一条规则（右键菜单「屏蔽该 URL」也走这里，顺带把总开关打开） */
function addInterceptRule(partial: Partial<InterceptRule> = {}) {
  interceptSeq += 1;
  interceptRules.value = [
    ...interceptRules.value,
    {
      id: `ir_${Date.now().toString(36)}_${interceptSeq}`,
      pattern: partial.pattern ?? "",
      action: partial.action ?? "block",
      status: partial.status ?? 200,
      body: partial.body ?? "",
      mime: partial.mime ?? "text/plain; charset=utf-8",
      headers: partial.headers ?? {},
    },
  ];
  if (!interceptOn.value) {
    interceptOn.value = true;
  }
  interceptPanelOpen.value = true;
}

function removeInterceptRule(id: string) {
  interceptRules.value = interceptRules.value.filter((r) => r.id !== id);
}

/** 把「头名: 头值; 头名2: 头值2」文本解析进规则的 headers（清空文本 = 清掉全部改写） */
function setRuleHeaders(rule: InterceptRule, text: string) {
  const headers: Record<string, string> = {};
  for (const part of text.split(";")) {
    const idx = part.indexOf(":");
    if (idx <= 0) {
      continue;
    }
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) {
      headers[k] = v;
    }
  }
  rule.headers = headers;
}

/**
 * 按当前开关 / 规则重挂 Fetch 域（enable / disable 幂等）
 *
 * <p>patterns 只在 Request 阶段拦全量 URL，命中后的分流决策都在前端
 * {@link handleInterceptPaused} 里做，后端零改动。</p>
 */
async function applyInterceptRules() {
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    return;
  }
  if (!interceptOn.value || !interceptRules.value.length) {
    if (fetchInterceptActive) {
      fetchInterceptActive = false;
      await client.call("Fetch.disable", {}, targetId).catch(() => {});
    }
    return;
  }
  await client
    .call("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] }, targetId)
    .then(() => {
      fetchInterceptActive = true;
    })
    .catch(() => {});
}

/**
 * 处理一条被拦下的请求：按序匹配规则，命中即执行；都不中就原样放行
 *
 * <p>动作语义：</p>
 * <ul>
 *   <li>block —— {@code Fetch.failRequest}（BlockedByClient，网络面板里表现为 failed）</li>
 *   <li>mock —— {@code Fetch.fulfillRequest}，本地造响应（状态码 / 响应体 / Content-Type 可配）</li>
 *   <li>header —— 合并改写请求头后 {@code Fetch.continueRequest} 放行</li>
 * </ul>
 * <p>任何一步失败都兜底放行，绝不能让页面请求悬挂在拦截态。</p>
 */
async function handleInterceptPaused(params: Record<string, unknown>, targetId: string) {
  const requestId = String(params.requestId ?? "");
  if (!requestId || !wsReady()) {
    return;
  }
  const request = (params.request ?? {}) as Record<string, unknown>;
  const url = String(request.url ?? "");
  const rule = interceptRules.value.find((r) => matchInterceptPattern(r.pattern, url));
  if (!rule) {
    await client.call("Fetch.continueRequest", { requestId }, targetId).catch(() => {});
    return;
  }
  try {
    if (rule.action === "block") {
      await client.call("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }, targetId);
      appendChange(`拦截·屏蔽 ${request.method || "GET"} ${urlName(url)}`, targetId);
      return;
    }
    if (rule.action === "mock") {
      const status = Number(rule.status) || 200;
      const bodyText = String(rule.body ?? "");
      // UTF-8 → base64（fulfillRequest 的 body 只认 base64），分块转避免大响应体爆栈
      const bytes = new TextEncoder().encode(bodyText);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      await client.call(
        "Fetch.fulfillRequest",
        {
          requestId,
          responseCode: status,
          body: btoa(bin),
          responseHeaders: [{ name: "Content-Type", value: rule.mime || "text/plain; charset=utf-8" }],
        },
        targetId,
      );
      appendChange(`拦截·Mock ${status} ${request.method || "GET"} ${urlName(url)}（${bodyText.length} B）`, targetId);
      return;
    }
    // header：Fetch 的 Headers 是 {name,value}[] 且会整体替换，所以要带全原头再合并改写
    const overrides = Object.entries(rule.headers ?? {})
      .filter(([k]) => k.trim())
      .map(([k, v]) => ({ name: k.trim(), value: String(v) }));
    const merged: { name: string; value: string }[] = [];
    const used = new Set<number>();
    const rawHeaders = Array.isArray(request.headers) ? (request.headers as Record<string, unknown>[]) : [];
    for (const h of rawHeaders) {
      const name = String(h?.name ?? "");
      if (!name) {
        continue;
      }
      const hit = overrides.findIndex((o) => o.name.toLowerCase() === name.toLowerCase());
      if (hit >= 0) {
        merged.push({ name, value: overrides[hit].value });
        used.add(hit);
      } else {
        merged.push({ name, value: String(h?.value ?? "") });
      }
    }
    overrides.forEach((o, i) => {
      if (!used.has(i)) {
        merged.push(o);
      }
    });
    await client.call("Fetch.continueRequest", { requestId, headers: merged }, targetId);
    appendChange(`拦截·改头 ${request.method || "GET"} ${urlName(url)} · ${overrides.map((o) => o.name).join(", ")}`, targetId);
  } catch {
    await client.call("Fetch.continueRequest", { requestId }, targetId).catch(() => {});
  }
}

/* ---------- 控制台异常堆栈展开 ---------- */

/** 哪些异常消息的堆栈被展开（key -> 是否展开） */
const expandedStacks = ref<Record<number, boolean>>({});

function toggleStack(key: number) {
  expandedStacks.value = { ...expandedStacks.value, [key]: !expandedStacks.value[key] };
}

/* ==================== SkyWalking sw8 自动注入 ==================== */

/**
 * 生成 sw8 追踪头（SkyWalking 8/9 的跨进程传播协议）
 *
 * <p>格式：{@code 1-<traceId>-<segmentId>-<spanId>-<parentSpanId>-<entryServiceInstanceId>-<entryEndpoint>-<peerHost>}，
 * 除采样位 {@code 1} 外各段 base64 编码，与 skywalking-client-js 一致。</p>
 *
 * <p>口径要点：<b>一个页面只用一个 traceId</b>，每个请求一个新 segmentId（span 0 / parent -1）。
 * 早先每请求随机 traceId，网络面板里每个请求各成一条链，按 trace 聚合永远是 1 条，
 * 也跳不到同一个 APM 链路详情。</p>
 */
function newSw8(service: string, endpoint: string, peer: string, traceId?: string): string {
  const b64 = (s: string) => {
    try {
      return btoa(unescape(encodeURIComponent(s)));
    } catch {
      return btoa(s);
    }
  };
  const rand = (n: number) => {
    let out = "";
    for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 16).toString(16);
    return out;
  };
  const trace = traceId || `${Date.now().toString(16)}.${rand(8)}.${rand(16)}`;
  const segment = `${Date.now().toString(16)}.${rand(8)}.${rand(16)}`;
  const parts = [
    "1",
    b64(trace),
    b64(segment),
    b64("0"),
    b64("-1"),
    b64(`${service}@browser`),
    b64(endpoint),
    b64(peer),
  ];
  return parts.join("-");
}

/**
 * 注入到页面的 sw8 追踪脚本
 *
 * <p>包住 {@code window.fetch} 与 {@code XMLHttpRequest.prototype.open/send}：
 * 同源请求自动补 {@code sw8} / {@code sw8-correlation} 头，不破坏页面原有逻辑。
 * 开关写进 {@code window.__cdpSw8}，traceId 存在 {@code window.__cdpSw8TraceId}，
 * 页面内所有请求共用同一条链路，网络面板才能按 trace 聚合成一棵调用树。</p>
 */
const SW8_SCRIPT = `(function () {
  var KEY = 'sw8', CORR = 'sw8-correlation';
  var SERVICE = 'monitor-debug-center';
  function sameOrigin(u) { try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; } }
  function peerOf(u) { try { return new URL(u, location.href).host; } catch (e) { return location.host; } }
  function rand(n) { var s = ''; for (var i = 0; i < n; i++) { s += Math.floor(Math.random() * 16).toString(16); } return s; }
  function b64(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return btoa(s); } }
  function uu(prefix) { return prefix + '.' + rand(8) + '.' + rand(16); }
  // 一页一个 traceId：脚本重挂（导航 / 开关切换）后继续沿用，除非页面上下文重建
  function traceId() {
    if (!window.__cdpSw8TraceId) { window.__cdpSw8TraceId = uu(Date.now().toString(16)); }
    return window.__cdpSw8TraceId;
  }
  function newSw8(endpoint, peer) {
    var t = traceId();
    var g = uu(Date.now().toString(16));
    return ['1', b64(t), b64(g), b64('0'), b64('-1'), b64(SERVICE + '@browser'), b64(endpoint), b64(peer)].join('-');
  }
  function trim(v) { try { return String(v).slice(0, 160); } catch (e) { return ''; } }
  function headerMap(init) {
    if (!init) { return null; }
    if (init instanceof Headers) { return init; }
    if (typeof init.headers === 'object' && init.headers) {
      return init.headers instanceof Headers ? init.headers : new Headers(init.headers);
    }
    return null;
  }
  function setHeaders(headers, endpoint, peer) {
    if (!headers || typeof headers.set !== 'function') { return; }
    if (headers.has(KEY)) { return; }
    try { headers.set(KEY, newSw8(trim(endpoint) || location.pathname, trim(peer))); }
    catch (e) {}
  }
  var rawFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (window.__cdpSw8 !== false && sameOrigin(url)) {
        var headers = headerMap(init) || new Headers();
        setHeaders(headers, url, peerOf(url));
        if (init && typeof init === 'object') { init = Object.assign({}, init, { headers: headers }); }
        else { init = { headers: headers }; }
      }
    } catch (e) {}
    return rawFetch.apply(this, [input, init]);
  };
  var rawOpen = XMLHttpRequest.prototype.open;
  var rawSend = XMLHttpRequest.prototype.send;
  var rawSet = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__cdpUrl = url;
    return rawOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    try {
      if (window.__cdpSw8 !== false && sameOrigin(this.__cdpUrl || '')) {
        var h = newSw8(trim(this.__cdpUrl) || location.pathname, peerOf(this.__cdpUrl || ''));
        rawSet.call(this, KEY, h);
        rawSet.call(this, CORR, '1');
      }
    } catch (e) {}
    return rawSend.apply(this, arguments);
  };
  window.__cdpSw8 = true;
})()`;

/** 目标 -> 是否已注入过 sw8 脚本 */
const sw8Injected = new Set<string>();

/** 给目标注入 sw8（每个目标一次；关开关时写 window.__cdpSw8=false） */
async function ensureSw8(target = selectedTarget.value) {
  if (!target || !wsReady()) return;
  if (sw8Enabled.value) {
    if (sw8Injected.has(target)) return;
    try {
      await client.call("Runtime.evaluate", { expression: SW8_SCRIPT, returnByValue: true }, target);
      sw8Injected.add(target);
    } catch {
      // 页面还没就绪，等下一次 SSE 页面事件重挂
    }
  } else {
    await client
      .call("Runtime.evaluate", { expression: "window.__cdpSw8=false", returnByValue: true }, target)
      .catch(() => undefined);
  }
}

/** 切换 sw8 开关 */
function toggleSw8() {
  sw8Enabled.value = !sw8Enabled.value;
  if (!sw8Enabled.value) {
    sw8Injected.clear();
  }
  ElMessage.info(sw8Enabled.value ? "已为页面请求注入 sw8 追踪头" : "已暂停 sw8 注入");
  void ensureSw8();
}

/* ==================== 性能（Tracing） ==================== */

/**
 * 录制时可选的追踪类别
 *
 * <p>对应 Chrome DevTools 的 Performance 面板：{@code devtools.timeline} 是主线程
 * 时间线（Layout / Paint / Script 都在里面），{@code v8.execute} 补脚本细节，
 * {@code loading} 补资源加载阶段，帧类别用于算 FPS。</p>
 */
const PERF_CATEGORY_OPTIONS = [
  { value: "devtools.timeline", label: "时间线", hint: "Layout / Paint / Script 主线程事件" },
  { value: "v8.execute", label: "脚本", hint: "V8 执行、编译、GC" },
  { value: "loading", label: "加载", hint: "资源请求与解析" },
  { value: "blink.user_timing", label: "用户打点", hint: "performance.mark / measure" },
  { value: "disabled-by-default-devtools.timeline.frame", label: "帧", hint: "用于计算 FPS" },
];

/** 当前勾选的追踪类别（全部取消时至少保留时间线，否则录制没有意义） */
const perfCategories = ref<string[]>(
  readPref<string[]>("perf.categories", ["devtools.timeline", "v8.execute", "loading", "blink.user_timing"]),
);

/** 是否正在录制 */
const perfRecording = ref(false);
/** 已经发了 Tracing.end、等 tracingComplete 收尾 */
const perfStopping = ref(false);
/** 已收集的事件数（录制过程中增量更新，用于状态条） */
const perfEventCount = ref(0);
/** 缓冲区占用（0~1，Tracing.bufferUsage 回推） */
const perfBufferUsage = ref(0);
/** 本次录制开始时间 / 结束时间（ms） */
const perfStartAt = ref(0);
const perfStopAt = ref(0);
/** 录制时选中的目标（只收该目标的事件，避免多页面串味） */
const perfTarget = ref("");
/** 分析结果 */
const perfSummary = ref<PerfSummary | null>(null);
const perfError = ref("");

/** 主线程事件的一帧（用于火焰图） */
interface PerfBlock {
  name: string;
  cat: string;
  phase: PerfPhase;
  /** 相对录制起点的毫秒偏移 */
  offset: number;
  /** 时长（ms） */
  dur: number;
  /** 相对录制窗口的百分比位置 / 宽度 */
  left: number;
  width: number;
  /** 嵌套深度（火焰图行号） */
  depth: number;
}

/** 阶段分类 */
type PerfPhase = "loading" | "scripting" | "rendering" | "painting" | "idle" | "other";

/** 一次录制分析后的汇总模型 */
interface PerfSummary {
  /** 录制窗口（ms，主线程事件跨度） */
  window: number;
  /** 事件总数 */
  total: number;
  /** 主线程完整事件数 */
  mainCount: number;
  /** 长任务数（主线程顶层事件 > 50ms） */
  longTasks: number;
  /** 帧数（DrawFrame / BeginFrame） */
  frames: number;
  /** 各阶段自耗时（ms） */
  phases: { phase: PerfPhase; label: string; ms: number }[];
  /** 火焰图方块 */
  blocks: PerfBlock[];
  /** 耗时最长的若干个事件 */
  top: { name: string; cat: string; phase: PerfPhase; dur: number }[];
}

const PERF_PHASE_LABEL: Record<PerfPhase, string> = {
  loading: "加载",
  scripting: "脚本",
  rendering: "渲染",
  painting: "绘制",
  idle: "空闲",
  other: "其他",
};

/** 按事件名归类到 DevTools 的六个阶段（够用即可，不求覆盖全部 Chrome 内部事件） */
function perfPhaseOf(name: string): PerfPhase {
  if (/^(Resource|ParseHTML|ParseAuthorStyleSheet)/.test(name)) return "loading";
  if (/^(EvaluateScript|FunctionCall|v8\.|V8\.|XHRLoad|XHRReadyStateChange|TimerFire|FireAnimationFrame|EventDispatch|RunMicrotasks|RunTask|MajorGC|MinorGC|GC)/.test(name)) return "scripting";
  if (/^(UpdateLayoutTree|RecalculateStyles|Layout|PrePaint|UpdateLayerTree|CompositeLayers|Commit|HitTest)/.test(name)) return "rendering";
  if (/^(Paint|PaintImage|Rasterize|RasterTask|DecodeImage|ImageDecodeTask|DrawFrame)/.test(name)) return "painting";
  if (/Idle/.test(name)) return "idle";
  return "other";
}

/** 录制期间的事件暂存区：不进响应式，避免上万条事件把渲染拖死 */
let perfSink: Record<string, unknown>[] = [];
/** tracingComplete 迟迟不来时的兜底计时器 */
let perfFallbackTimer: ReturnType<typeof setTimeout> | undefined;
/** 事件上限（防止录太久把浏览器内存吃光） */
const PERF_MAX_EVENTS = 120000;

/** 切换一个追踪类别 */
function togglePerfCategory(value: string) {
  const set = new Set(perfCategories.value);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  perfCategories.value = [...set];
}

/** 开始录制 */
async function startPerf() {
  if (perfRecording.value) return;
  if (!selectedTarget.value) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  perfError.value = "";
  perfSink = [];
  perfEventCount.value = 0;
  perfBufferUsage.value = 0;
  perfSummary.value = null;
  resetFilm();
  perfStartAt.value = Date.now();
  perfStopAt.value = 0;
  perfTarget.value = selectedTarget.value;
  // 录制截图依赖 screencast：没开交互画面时临时开一路，停止后自动关掉
  if (!liveOn.value) {
    void startLive();
    liveAutoStarted = true;
  }
  const included = perfCategories.value.length
    ? [...perfCategories.value]
    : ["devtools.timeline"];
  try {
    await client.call(
      "Tracing.start",
      {
        transferMode: "ReportEvents",
        traceConfig: {
          recordMode: "recordAsMuchAsPossible",
          includedCategories: included,
        },
      },
      perfTarget.value,
    );
    perfRecording.value = true;
    ElMessage.success("开始录制性能，操作页面后点「停止」");
  } catch (error) {
    perfError.value = "开始录制失败: " + (error as Error).message;
    ElMessage.error(perfError.value);
    releaseAutoScreencast();
  }
}

/** 停止录制（数据经 SSE 的 Tracing.tracingComplete 收尾） */
async function stopPerf() {
  if (!perfRecording.value || perfStopping.value) return;
  perfStopping.value = true;
  perfStopAt.value = Date.now();
  const stopTarget = perfTarget.value || selectedTarget.value;
  try {
    await client.call("Tracing.end", {}, stopTarget);
  } catch (error) {
    perfError.value = "停止录制失败: " + (error as Error).message;
    perfRecording.value = false;
    perfStopping.value = false;
    commitFilm();
    releaseAutoScreencast();
    analyzePerf();
    return;
  }
  // tracingComplete 正常几百毫秒内到；万一被 SSE 丢帧，也要让界面能收尾
  clearTimeout(perfFallbackTimer);
  perfFallbackTimer = setTimeout(() => {
    if (perfStopping.value) {
      perfRecording.value = false;
      perfStopping.value = false;
      commitFilm();
      releaseAutoScreencast();
      analyzePerf();
    }
  }, 8000);
}

/** 收到 Tracing.dataCollected：只收录制目标的事件 */
function onTracingData(params: Record<string, unknown>, targetId: string) {
  if (!perfRecording.value) return;
  if (perfTarget.value && targetId && targetId !== perfTarget.value) return;
  const value = params.value;
  if (!Array.isArray(value)) return;
  let added = 0;
  for (const item of value) {
    if (perfSink.length >= PERF_MAX_EVENTS) break;
    if (item && typeof item === "object") {
      perfSink.push(item as Record<string, unknown>);
      added++;
    }
  }
  if (added) perfEventCount.value = perfSink.length;
}

/** 收到 Tracing.tracingComplete：结束录制并分析 */
function onTracingComplete() {
  clearTimeout(perfFallbackTimer);
  if (!perfRecording.value && !perfStopping.value) return;
  perfRecording.value = false;
  perfStopping.value = false;
  if (!perfStopAt.value) perfStopAt.value = Date.now();
  commitFilm();
  releaseAutoScreencast();
  analyzePerf();
}

/** 停止录制后收回「为截图临时开启」的 screencast（用户手动开的保留） */
function releaseAutoScreencast() {
  if (!liveAutoStarted) return;
  liveAutoStarted = false;
  void stopLive();
}

/** 把暂存区的事件压成汇总模型 + 火焰图方块 */
function analyzePerf() {
  const raw = perfSink;
  if (!raw.length) {
    perfSummary.value = null;
    perfError.value = "没有捕获到任何事件，换个类别组合再试";
    return;
  }
  // 1. 找渲染主线程：TracingStartedInPage 给出页面所属 pid，thread_name 给出 CrRendererMain
  let pagePid = 0;
  for (const e of raw) {
    if (e.name === "TracingStartedInPage") {
      const args = (e.args ?? {}) as Record<string, unknown>;
      const data = (args.data ?? {}) as Record<string, unknown>;
      if (data.page) pagePid = Number(e.pid ?? 0);
      if (pagePid) break;
    }
  }
  const mainThreads = new Map<string, string>();
  for (const e of raw) {
    if (e.ph === "M" && e.name === "thread_name") {
      const args = (e.args ?? {}) as Record<string, unknown>;
      mainThreads.set(`${e.pid}:${e.tid}`, String(args.name ?? ""));
    }
  }
  let mainKey = "";
  if (pagePid) {
    for (const [key, name] of mainThreads) {
      if (key.startsWith(`${pagePid}:`) && name === "CrRendererMain") {
        mainKey = key;
        break;
      }
    }
  }
  if (!mainKey) {
    // 没有元数据：退化为「完整事件最多」的线程
    const counts = new Map<string, number>();
    for (const e of raw) {
      if (e.ph !== "X") continue;
      const key = `${e.pid}:${e.tid}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let best = -1;
    for (const [key, n] of counts) {
      if (n > best) {
        best = n;
        mainKey = key;
      }
    }
  }

  // 2. 主线程完整事件（ph=X 带 dur），按开始时间排序
  const events = raw.filter(
    (e) => e.ph === "X" && e.dur != null && `${e.pid}:${e.tid}` === mainKey,
  );
  events.sort((a, b) => Number(a.ts ?? 0) - Number(b.ts ?? 0) || Number(b.dur ?? 0) - Number(a.dur ?? 0));
  if (!events.length) {
    perfSummary.value = null;
    perfError.value = "主线程没有可分析的事件";
    return;
  }
  const t0 = Number(events[0].ts ?? 0);
  let t1 = t0;
  for (const e of events) {
    t1 = Math.max(t1, Number(e.ts ?? 0) + Number(e.dur ?? 0));
  }
  const span = Math.max(1, t1 - t0);

  // 3. 自耗时：用结束时间栈扣掉子事件，避免嵌套把总时长算重
  const phaseMs = new Map<PerfPhase, number>();
  const stack: { start: number; end: number; childMs: number; phase: PerfPhase }[] = [];
  const blocks: PerfBlock[] = [];
  let longTasks = 0;
  const top: { name: string; cat: string; phase: PerfPhase; dur: number }[] = [];
  const closeFrame = () => {
    const frame = stack.pop();
    if (!frame) return;
    const self = Math.max(0, frame.end - frame.start - frame.childMs);
    phaseMs.set(frame.phase, (phaseMs.get(frame.phase) ?? 0) + self);
    const parent = stack[stack.length - 1];
    if (parent) {
      parent.childMs += Math.max(0, frame.end - frame.start);
    } else if (frame.end - frame.start > 50) {
      longTasks++;
    }
  };
  for (const e of events) {
    const ts = Number(e.ts ?? 0);
    const dur = Number(e.dur ?? 0);
    const end = ts + dur;
    // 先关掉所有在本次事件开始前就结束的帧
    while (stack.length && stack[stack.length - 1].end <= ts) closeFrame();
    const name = String(e.name ?? "");
    const phase = perfPhaseOf(name);
    const cat = String(e.cat ?? "");
    const depth = stack.length;
    stack.push({ start: ts, end, childMs: 0, phase });
    if (blocks.length < 900) {
      blocks.push({
        name,
        cat,
        phase,
        offset: ts - t0,
        dur,
        left: ((ts - t0) / span) * 100,
        width: Math.max(0.12, (dur / span) * 100),
        depth,
      });
    }
    if (dur > 0) {
      top.push({ name, cat, phase, dur });
    }
  }
  while (stack.length) closeFrame();
  top.sort((a, b) => b.dur - a.dur);
  const phases = (["loading", "scripting", "rendering", "painting", "idle", "other"] as PerfPhase[]).map(
    (phase) => ({ phase, label: PERF_PHASE_LABEL[phase], ms: Math.round(phaseMs.get(phase) ?? 0) }),
  );
  const frames = raw.filter((e) => e.name === "DrawFrame" || e.name === "BeginFrame").length;
  perfSummary.value = {
    window: Math.round(span),
    total: raw.length,
    mainCount: events.length,
    longTasks,
    frames,
    phases,
    blocks,
    top: top.slice(0, 30),
  };
  perfError.value = "";
}

/** 清空录制结果 */
function clearPerf() {
  perfSink = [];
  perfEventCount.value = 0;
  perfSummary.value = null;
  perfError.value = "";
  perfBufferUsage.value = 0;
  perfStartAt.value = 0;
  perfStopAt.value = 0;
  resetFilm();
}

/** 录制时长文案（依赖 now 心跳，录制过程中也会每秒走字） */
const perfElapsed = computed(() => {
  void now.value;
  if (!perfStartAt.value) return "0.0s";
  const end = perfStopAt.value || now.value;
  const ms = Math.max(0, end - perfStartAt.value);
  return ms < 60000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`;
});

/** 各阶段占比（用于汇总条） */
const perfPhaseTotal = computed(() => {
  const sum = (perfSummary.value?.phases ?? []).reduce((s, p) => s + p.ms, 0);
  return sum || 1;
});

/** 火焰图总高度 */
const perfChartHeight = computed(() => {
  const blocks = perfSummary.value?.blocks ?? [];
  let max = 1;
  for (const b of blocks) max = Math.max(max, b.depth + 1);
  return Math.min(320, max * 12 + 8);
});

/** 导出 trace JSON（Chrome DevTools / Perfetto 都能直接吃） */
function exportPerf() {
  if (!perfSink.length) {
    ElMessage.warning("还没有可导出的录制数据");
    return;
  }
  const payload = {
    traceEvents: perfSink,
    metadata: {
      recordedAt: new Date(perfStartAt.value || Date.now()).toISOString(),
      windowMs: Math.round((perfSummary.value?.window ?? 0) / 1000),
      targetId: perfTarget.value,
      source: "monitor-debug-center",
    },
  };
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-trace-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    ElMessage.success(`已导出 ${perfSink.length} 条 trace 事件`);
  } catch (error) {
    ElMessage.error("导出失败: " + (error as Error).message);
  }
}

/* ==================== CPU / 堆分配采样（Profiler / HeapProfiler 域） ==================== */

/**
 * CDP CPU 采样的调用帧节点
 *
 * <p>Profiler.stop 返回整棵调用树：nodes 是扁平数组（id + children 引用），
 * hitCount 是该帧「自身」被采样命中的次数——即自耗时的采样口径。</p>
 */
interface CpuProfileNode {
  id: number;
  callFrame: { functionName?: string; url?: string; lineNumber?: number };
  hitCount?: number;
  children?: number[];
}

/** Profiler.stop 的 profile 原始结构（只声明展示与导出用到的字段） */
interface CpuProfileRaw {
  nodes?: CpuProfileNode[];
  startTime?: number;
  endTime?: number;
}

/** CPU 采样汇总：top 函数按自采样命中数排序 */
interface CpuProfileSummary {
  durationUs: number;
  hits: number;
  nodes: number;
  top: { name: string; url: string; line: number; hits: number; pct: number }[];
}

/** HeapProfiler 采样的调用帧节点（head 是一棵嵌套树） */
interface HeapSamplingNode {
  callFrame: { functionName?: string; url?: string; lineNumber?: number };
  selfSize?: number;
  children?: HeapSamplingNode[];
}

/** HeapProfiler.stopSampling 的 profile 原始结构 */
interface HeapProfileRaw {
  head?: HeapSamplingNode;
  samples?: { size: number; count: number; stackId?: number }[];
}

/** 堆采样汇总：top 分配点按自分配字节数排序 */
interface HeapProfileSummary {
  totalBytes: number;
  samples: number;
  nodes: number;
  top: { name: string; url: string; line: number; bytes: number; pct: number }[];
}

const cpuProfiling = ref(false);
const cpuProfile = ref<CpuProfileSummary | null>(null);
const cpuProfileRaw = ref<CpuProfileRaw | null>(null);
const heapProfiling = ref(false);
const heapProfile = ref<HeapProfileSummary | null>(null);
const heapProfileRaw = ref<HeapProfileRaw | null>(null);

/** 调用帧 → 展示字段（函数名兜底、行号从 0 基转 1 基） */
function frameLabel(frame: { functionName?: string; url?: string; lineNumber?: number } | undefined): {
  name: string;
  url: string;
  line: number;
} {
  return {
    name: frame?.functionName || "(匿名函数)",
    url: frame?.url || "",
    line: typeof frame?.lineNumber === "number" ? frame.lineNumber + 1 : 0,
  };
}

/** 开始 CPU 采样（Profiler.start，目标级会话） */
async function startCpuProfile() {
  const targetId = selectedTarget.value;
  if (cpuProfiling.value) return;
  if (!targetId) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  try {
    // Profiler.start 前必须先 enable，否则 Chrome 报 -32000 "Profiler is not enabled"
    await client.call("Profiler.enable", {}, targetId);
    await client.call("Profiler.start", {}, targetId);
    cpuProfiling.value = true;
    cpuProfile.value = null;
    cpuProfileRaw.value = null;
    ElMessage.success("CPU 采样已开始，操作页面后点「停止」");
  } catch (error) {
    ElMessage.error("CPU 采样启动失败: " + (error as Error).message);
  }
}

/** 停止 CPU 采样并汇总（按自采样命中数排 top，保留原始 profile 供导出） */
async function stopCpuProfile() {
  const targetId = selectedTarget.value;
  if (!cpuProfiling.value) return;
  try {
    const res = (await client.call("Profiler.stop", {}, targetId)) as { profile?: CpuProfileRaw } | null;
    const profile = res?.profile;
    if (!profile?.nodes?.length) {
      ElMessage.warning("没有采到样，换一个更忙的页面再试");
      return;
    }
    let hits = 0;
    for (const n of profile.nodes) hits += Math.max(0, n.hitCount || 0);
    const top = profile.nodes
      .filter((n) => (n.hitCount || 0) > 0)
      .map((n) => {
        const h = Math.max(0, n.hitCount || 0);
        return { ...frameLabel(n.callFrame), hits: h, pct: hits ? (h / hits) * 100 : 0 };
      })
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 20);
    cpuProfile.value = {
      durationUs: Math.max(0, (profile.endTime || 0) - (profile.startTime || 0)),
      hits,
      nodes: profile.nodes.length,
      top,
    };
    cpuProfileRaw.value = profile;
  } catch (error) {
    ElMessage.error("停止 CPU 采样失败: " + (error as Error).message);
  } finally {
    cpuProfiling.value = false;
    // stop 之后把域收掉，避免留在目标上空转
    if (targetId) void client.call("Profiler.disable", {}, targetId).catch(() => {});
  }
}

/** 深度优先收集堆采样树的所有节点 */
function collectHeapNodes(node: HeapSamplingNode, out: HeapSamplingNode[]): void {
  out.push(node);
  for (const child of node.children ?? []) collectHeapNodes(child, out);
}

/** 开始堆分配采样（HeapProfiler.startSampling，16KB 采样粒度，目标级会话） */
async function startHeapProfile() {
  const targetId = selectedTarget.value;
  if (heapProfiling.value) return;
  if (!targetId) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  try {
    // 先 enable 再 startSampling，与停止路径的 HeapProfiler.disable 成对
    await client.call("HeapProfiler.enable", {}, targetId);
    await client.call("HeapProfiler.startSampling", { samplingInterval: 16384 }, targetId);
    heapProfiling.value = true;
    heapProfile.value = null;
    heapProfileRaw.value = null;
    ElMessage.success("堆分配采样已开始，操作页面后点「停止」");
  } catch (error) {
    ElMessage.error("堆采样启动失败: " + (error as Error).message);
  }
}

/** 停止堆采样并汇总（按节点自分配字节数排 top，总量优先取样本求和） */
async function stopHeapProfile() {
  const targetId = selectedTarget.value;
  if (!heapProfiling.value) return;
  try {
    const res = (await client.call("HeapProfiler.stopSampling", {}, targetId)) as { profile?: HeapProfileRaw } | null;
    const profile = res?.profile;
    const nodes: HeapSamplingNode[] = [];
    if (profile?.head) collectHeapNodes(profile.head, nodes);
    if (!nodes.length) {
      ElMessage.warning("没有采到分配数据，换一个更忙的页面再试");
      return;
    }
    let totalBytes = 0;
    let samples = 0;
    for (const s of profile?.samples ?? []) {
      totalBytes += Math.max(0, s.size || 0) * Math.max(0, s.count || 0);
      samples += Math.max(0, s.count || 0);
    }
    if (!totalBytes) {
      for (const n of nodes) totalBytes += Math.max(0, n.selfSize || 0);
    }
    const top = nodes
      .filter((n) => (n.selfSize || 0) > 0)
      .map((n) => {
        const bytes = Math.max(0, n.selfSize || 0);
        return { ...frameLabel(n.callFrame), bytes, pct: totalBytes ? (bytes / totalBytes) * 100 : 0 };
      })
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 20);
    heapProfile.value = { totalBytes, samples, nodes: nodes.length, top };
    heapProfileRaw.value = profile ?? null;
  } catch (error) {
    ElMessage.error("停止堆采样失败: " + (error as Error).message);
  } finally {
    heapProfiling.value = false;
    if (targetId) void client.call("HeapProfiler.disable", {}, targetId).catch(() => {});
  }
}

/** 通用下载：文本内容落成文件（Blob + a[download]） */
function downloadTextFile(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 通用下载：base64 内容落成二进制文件（PDF 等矢量产物） */
function downloadBase64File(base64: string, filename: string, mime: string): void {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 下载原始 CPU profile（Chrome DevTools 可直接打开的 .cpuprofile） */
function exportCpuProfile() {
  if (!cpuProfileRaw.value) {
    ElMessage.warning("还没有 CPU 采样数据");
    return;
  }
  downloadTextFile(
    JSON.stringify(cpuProfileRaw.value),
    `debug-cpu-${new Date().toISOString().replace(/[:.]/g, "-")}.cpuprofile`,
    "application/json",
  );
  ElMessage.success("已导出 .cpuprofile");
}

/** 下载原始堆采样 profile（.heapprofile） */
function exportHeapProfile() {
  if (!heapProfileRaw.value) {
    ElMessage.warning("还没有堆采样数据");
    return;
  }
  downloadTextFile(
    JSON.stringify(heapProfileRaw.value),
    `debug-heap-${new Date().toISOString().replace(/[:.]/g, "-")}.heapprofile`,
    "application/json",
  );
  ElMessage.success("已导出 .heapprofile");
}

/** 触发一次完整 GC（HeapProfiler.collectGarbage），配合堆采样看回落 */
async function triggerGc() {
  const targetId = selectedTarget.value;
  if (!targetId) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  try {
    await client.call("HeapProfiler.collectGarbage", {}, targetId);
    ElMessage.success("已触发一次垃圾回收");
  } catch (error) {
    ElMessage.error("触发 GC 失败: " + (error as Error).message);
  }
}

/* ==================== SVG 抽取 ==================== */

/** 抽取页面里的 SVG：内联 <svg> / <use> 展开 / <img src=*.svg> 外链 */
const SVG_EXTRACT_SCRIPT = `(function () {
  var out = [];
  function ser(node) {
    try { return new XMLSerializer().serializeToString(node); } catch (e) { return ''; }
  }
  function measure(markup) {
    var w = 0, h = 0;
    var m = /\\bwidth\\s*=\\s*["']?\\s*([\\d.]+)/i.exec(markup);
    var n = /\\bheight\\s*=\\s*["']?\\s*([\\d.]+)/i.exec(markup);
    var vb = /\\bviewBox\\s*=\\s*["']\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)/i.exec(markup);
    if (vb) { w = parseFloat(vb[3]); h = parseFloat(vb[4]); }
    if (m) { w = parseFloat(m[1]); }
    if (n) { h = parseFloat(n[1]); }
    return { w: Math.round(w), h: Math.round(h) };
  }
  function normalize(markup) {
    if (!/\\bxmlns\\s*=/i.test(markup)) {
      markup = markup.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!/\\bviewBox\\s*=/i.test(markup)) {
      var w = /\\bwidth\\s*=\\s*["']?\\s*([\\d.]+)/i.exec(markup);
      var h = /\\bheight\\s*=\\s*["']?\\s*([\\d.]+)/i.exec(markup);
      if (w && h) {
        markup = markup.replace(/^<svg/i, '<svg viewBox="0 0 ' + parseFloat(w[1]) + ' ' + parseFloat(h[1]) + '"');
      }
    }
    return markup;
  }
  function label(el, i) {
    var id = el.getAttribute && el.getAttribute('id');
    var cls = el.getAttribute && el.getAttribute('class');
    return (id ? '#' + id : cls ? '.' + String(cls).trim().split(/\\s+/).slice(0, 2).join('.') : 'svg[' + i + ']');
  }
  var inlines = document.querySelectorAll('svg');
  for (var i = 0; i < inlines.length; i++) {
    var markup = normalize(ser(inlines[i]));
    if (markup) { out.push({ markup: markup, source: '内联 SVG', label: label(inlines[i], i) }); }
  }
  var uses = document.querySelectorAll('use');
  for (var j = 0; j < uses.length; j++) {
    var u = uses[j];
    var href = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
    if (href.charAt(0) !== '#') { continue; }
    var ref = document.querySelector(href);
    if (!ref || ref.tagName.toLowerCase() === 'svg') { continue; }
    var vb = ref.getAttribute && ref.getAttribute('viewBox');
    var inner = '';
    for (var k = 0; k < ref.childNodes.length; k++) { inner += ser(ref.childNodes[k]); }
    var mk = '<svg xmlns="http://www.w3.org/2000/svg"' + (vb ? ' viewBox="' + vb + '"' : '') + '>' + inner + '</svg>';
    if (inner) { out.push({ markup: normalize(mk), source: '<use> → ' + href, label: label(u, j) }); }
  }
  var imgs = document.querySelectorAll('img[src]');
  for (var m2 = 0; m2 < imgs.length; m2++) {
    var src = imgs[m2].getAttribute('src') || '';
    var isSvgFile = /\\.svg(\\?|#|$)/i.test(src);
    var isDataSvg = src.slice(0, 18).toLowerCase() === 'data:image/svg+xml';
    if (isSvgFile || isDataSvg) {
      out.push({ markup: '', source: (isDataSvg ? '内联 data' : '外链'), label: src, external: src });
    }
  }
  // <object data> / <embed src> 引用的 .svg
  var embeds = document.querySelectorAll('object[data], embed[src]');
  for (var e2 = 0; e2 < embeds.length; e2++) {
    var es = embeds[e2].getAttribute('data') || embeds[e2].getAttribute('src') || '';
    var isEmbSvg = /\\.svg(\\?|#|$)/i.test(es) || es.slice(0, 18).toLowerCase() === 'data:image/svg+xml';
    if (isEmbSvg) {
      var tag = embeds[e2].tagName.toLowerCase();
      out.push({ markup: '', source: (tag === 'object' ? '<object> 外链' : '<embed> 外链'), label: es, external: es });
    }
  }
  // CSS background-image 里的 .svg（限量扫描，避免在大页面里逐元素取计算样式拖慢）
  var all = document.querySelectorAll('*');
  var seenBg = {};
  var checked = 0;
  for (var b2 = 0; b2 < all.length && checked < 500; b2++) {
    var bg = '';
    try { bg = window.getComputedStyle(all[b2]).backgroundImage || ''; } catch (eb) { bg = ''; }
    checked++;
    if (!bg || bg.indexOf('url(') < 0) { continue; }
    var re = /url\\((['"]?)([^'")]+)\\1\\)/g;
    var mm;
    while ((mm = re.exec(bg))) {
      var u = mm[2] || '';
      var isBgSvg = /\\.svg(\\?|#|$)/i.test(u) || u.slice(0, 18).toLowerCase() === 'data:image/svg+xml';
      if (!isBgSvg || seenBg[u]) { continue; }
      seenBg[u] = 1;
      out.push({ markup: '', source: '背景图', label: u, external: u });
    }
  }
  return JSON.stringify({ title: document.title, items: out });
})()`;

/** 稳定的短哈希（给 SVG 卡片做 id / 文件名） */
function shortHash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 6);
}

/** SVG 文本 -> data url（预览 / 下载共用） */
function svgDataUrl(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

/** 字节数（按 UTF-8 算） */
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** 读取 localStorage 里已保存的 SVG id */
function loadSavedSvg(): Set<string> {
  try {
    const raw = localStorage.getItem("debug-svg-saved");
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** 持久化已保存集合 */
function persistSavedSvg() {
  try {
    localStorage.setItem("debug-svg-saved", JSON.stringify([...svgSaved.value]));
  } catch {
    // 隐私模式 / 配额满：只保留本次会话内的状态
  }
}

/** 抽取当前页面里的全部 SVG（silent = 自动触发，失败不弹提示） */
async function loadSvgs(silent = false) {
  if (!selectedTarget.value) {
    if (!silent) {
      ElMessage.warning("请先在左侧选择一个目标");
    }
    return;
  }
  if (svgLoading.value) {
    return;
  }
  svgLoading.value = true;
  svgError.value = "";
  try {
    const result = (await client.call(
      "Runtime.evaluate",
      { expression: SVG_EXTRACT_SCRIPT, returnByValue: true },
      selectedTarget.value,
    )) as { result?: { value?: string } } | null;
    const raw = result?.result?.value;
    const parsed = typeof raw === "string" ? (JSON.parse(raw) as {
      title?: string;
      items?: { markup?: string; source?: string; label?: string; external?: string }[];
    }) : null;
    const list = parsed?.items ?? [];
    const items: SvgItem[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      let markup = it.markup ?? "";
      // 外链 SVG：fetch 回文本再补进卡片（跨域失败时保留占位）
      if (it.external) {
        const fetched = await fetchExternalSvg(it.external);
        if (fetched) {
          markup = fetched;
        } else {
          markup = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90"><rect width="120" height="90" fill="#eef0f6"/><text x="60" y="48" text-anchor="middle" font-size="11" fill="#6b7280">外链不可读</text></svg>`;
        }
      }
      if (!markup) continue;
      const normalized = markup.includes("xmlns") ? markup : markup.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      const hash = shortHash(normalized);
      const id = `${i}-${hash}`;
      if (seen.has(hash)) continue;
      seen.add(hash);
      const size = measureSvg(normalized);
      items.push({
        id,
        markup: normalized,
        dataUrl: svgDataUrl(normalized),
        bytes: byteLength(normalized),
        width: size.w,
        height: size.h,
        source: it.source ?? "内联 SVG",
        label: it.label ?? `svg[${i}]`,
        saved: svgSaved.value.has(id),
      });
    }
    svgItems.value = items;
    if (!items.length) {
      svgError.value = "当前页面没有找到 SVG（内联 / <use> / .svg 图片）";
    }
  } catch (error) {
    svgItems.value = [];
    svgError.value = "抽取失败: " + (error as Error).message;
  } finally {
    svgLoading.value = false;
  }
}

/** 自动抽取的防抖计时器（导航会连续触发 frameNavigated + loadEventFired） */
let svgAutoTimer: ReturnType<typeof setTimeout> | undefined;

/** 页面导航 / 加载完成时按需重抽（只在 SVG 页签且开着自动获取时） */
function autoRefreshSvg() {
  if (!svgAuto.value || pageTab.value !== "svg" || !selectedTarget.value) {
    return;
  }
  clearTimeout(svgAutoTimer);
  svgAutoTimer = setTimeout(() => {
    if (svgAuto.value && pageTab.value === "svg" && selectedTarget.value) {
      void loadSvgs(true);
    }
  }, 500);
}

/** 从 markup 里读 width / height / viewBox */
function measureSvg(markup: string): { w: number; h: number } {
  const vb = /\bviewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(markup);
  let w = vb ? parseFloat(vb[3]) : 0;
  let h = vb ? parseFloat(vb[4]) : 0;
  const mw = /\bwidth\s*=\s*["']?\s*([\d.]+)/i.exec(markup);
  const mh = /\bheight\s*=\s*["']?\s*([\d.]+)/i.exec(markup);
  if (mw) w = parseFloat(mw[1]);
  if (mh) h = parseFloat(mh[1]);
  return { w: Math.round(w), h: Math.round(h) };
}

/** 外链 SVG 取回文本（同源优先，失败返回空串） */
async function fetchExternalSvg(url: string): Promise<string> {
  if (/^data:image\/svg\+xml/i.test(url)) {
    try {
      return decodeURIComponent(url.slice(url.indexOf(",") + 1));
    } catch {
      return "";
    }
  }
  const expression = `(async function(){try{var r=await fetch(${JSON.stringify(url)});if(!r.ok)return '';return await r.text()}catch(e){return ''}})()`;
  try {
    const result = (await client.call(
      "Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true },
      selectedTarget.value,
    )) as { result?: { value?: string } } | null;
    return typeof result?.result?.value === "string" ? result.result.value : "";
  } catch {
    return "";
  }
}

/** 显示中的 SVG 卡片（只看已保存 + 关键字过滤） */
const visibleSvgs = computed(() => {
  const kw = svgKeyword.value.trim().toLowerCase();
  return svgItems.value.filter((s) => {
    if (svgSavedOnly.value && !s.saved) return false;
    if (!kw) return true;
    return `${s.label} ${s.source} ${s.id}`.toLowerCase().includes(kw);
  });
});

/** 下载一个 SVG（Blob + a[download]） */
function downloadSvg(item: SvgItem) {
  const blob = new Blob([item.markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `svg-${item.id}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  ElMessage.success("已下载 SVG");
}

/** 保存 / 取消保存（localStorage 持久化） */
function toggleSaveSvg(item: SvgItem) {
  const next = new Set(svgSaved.value);
  if (next.has(item.id)) {
    next.delete(item.id);
  } else {
    next.add(item.id);
  }
  svgSaved.value = next;
  svgItems.value = svgItems.value.map((s) => (s.id === item.id ? { ...s, saved: next.has(item.id) } : s));
  persistSavedSvg();
  ElMessage.success(next.has(item.id) ? "已保存到本地列表" : "已取消保存");
}

/* ==================== 实时操作画面（Page.startScreencast） ==================== */

/**
 * 交互舞台状态
 *
 * <p>元素页签的舞台是「截屏 + 点选反查」，只能看不能动。这里走
 * {@code Page.startScreencast} 拿连续的 jpeg 帧，再把鼠标 / 键盘 / 滚轮经
 * {@code Input.*} 转发进页面——录制性能时能直接在调试中心里操作被调试页面。</p>
 */
/** 上一次由录制自动开启的 screencast（停止后要收回，用户自己开的则保留） */
let liveAutoStarted = false;

const liveOn = ref(false);
const liveLoading = ref(false);
/** 当前帧（data url，jpeg） */
const liveFrame = ref("");
/** 帧对应的 CSS 视口尺寸（metadata.deviceWidth / deviceHeight） */
const liveMeta = ref({ w: 0, h: 0 });
/** 当前 screencast 会话号（ack 必须带回） */
const liveSession = ref(0);
/** 舞台提示 */
const liveHint = ref("开始后可在这里直接点击 / 输入，操作会转发到页面");
/** 帧图片元素（算坐标用） */
const liveImgRef = ref<HTMLImageElement | null>(null);
/** 隐藏输入框（承接按键与输入法） */
const liveInputRef = ref<HTMLTextAreaElement | null>(null);
/** 上一次发出的鼠标位置（用于节流 mouseMoved） */
let liveLastMove = 0;

/** 录制中的截图采样（filmstrip） */
interface FilmFrame {
  /** 相对录制起点的毫秒偏移 */
  t: number;
  /** data url（jpeg） */
  url: string;
}
const filmFrames = ref<FilmFrame[]>([]);
const filmIndex = ref(0);
/** 采样暂存区（不进响应式，录制中每帧都写会拖慢渲染） */
let filmSink: FilmFrame[] = [];
/** 采样最小间隔（ms，超上限后翻倍） */
let filmInterval = 450;
let filmLastAt = 0;
/** 采样帧上限（防止长时间录制把内存吃光） */
const FILM_MAX = 140;

/** 当前选中的帧时间文案 */
const filmTimeLabel = computed(() => {
  const f = filmFrames.value[filmIndex.value];
  return f ? `${(f.t / 1000).toFixed(1)}s` : "—";
});

/** 时间轴上帧点的相对位置（相对最后一帧） */
function filmDotLeft(f: FilmFrame): string {
  const last = filmFrames.value[filmFrames.value.length - 1];
  const span = last && last.t > 0 ? last.t : 1;
  return `${Math.min(100, Math.max(0, (f.t / span) * 100))}%`;
}

/** 选中的帧（大图预览） */
const filmCurrent = computed(() => filmFrames.value[filmIndex.value] ?? null);

/** 开始交互画面（录制开始前调用也一样） */
async function startLive() {
  if (liveOn.value || liveLoading.value) return;
  if (!selectedTarget.value) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  liveLoading.value = true;
  try {
    await client.call(
      "Page.startScreencast",
      { format: "jpeg", quality: 70, maxWidth: 1280, maxHeight: 960, everyNthFrame: 1 },
      selectedTarget.value,
    );
    liveOn.value = true;
    liveHint.value = "画面就绪：点按、输入、滚轮都会转发到页面";
    // 键盘事件要落到隐藏输入框上
    void nextTick(() => liveInputRef.value?.focus());
  } catch (error) {
    liveHint.value = "启动交互画面失败: " + (error as Error).message;
    ElMessage.error(liveHint.value);
  } finally {
    liveLoading.value = false;
  }
}

/** 停止交互画面 */
async function stopLive() {
  if (!liveOn.value) return;
  liveOn.value = false;
  liveFrame.value = "";
  liveSession.value = 0;
  try {
    await client.call("Page.stopScreencast", {}, selectedTarget.value);
  } catch {
    // 目标已关闭时 stop 会失败，忽略即可
  }
}

/** 切换交互画面 */
function toggleLive() {
  if (liveOn.value) void stopLive();
  else void startLive();
}

/**
 * 处理一帧 screencast
 *
 * <p>不先 ack 浏览器只会推下一帧后一直等，画面就定格在第一张。因此无论这一帧
 * 是否用得上（比如录制已停），只要会话号对得上就先 ack。</p>
 */
function onScreencastFrame(params: Record<string, unknown>, targetId: string) {
  const sessionId = Number(params.sessionId ?? 0);
  const meta = (params.metadata ?? {}) as Record<string, unknown>;
  // 录制目标之外的帧直接丢弃，但仍然 ack（避免占住该页面的帧循环）
  if (targetId && selectedTarget.value && targetId !== selectedTarget.value) {
    return;
  }
  if (sessionId) {
    liveSession.value = sessionId;
    void client
      .call("Page.screencastFrameAck", { sessionId }, targetId || selectedTarget.value)
      .catch(() => undefined);
  }
  const data = String(params.data ?? "");
  if (!data) return;
  const url = `data:image/jpeg;base64,${data}`;
  if (liveOn.value) {
    liveFrame.value = url;
    liveMeta.value = {
      w: Number(meta.deviceWidth ?? 0) || liveMeta.value.w,
      h: Number(meta.deviceHeight ?? 0) || liveMeta.value.h,
    };
  }
  if (perfRecording.value) {
    sampleFilmFrame(url);
  }
}

/** 录制中按时间节奏采样一帧（超上限时隔帧丢弃并加倍间隔） */
function sampleFilmFrame(url: string) {
  if (!perfRecording.value || !perfStartAt.value) return;
  const at = Date.now();
  if (at - filmLastAt < filmInterval) return;
  filmLastAt = at;
  filmSink.push({ t: at - perfStartAt.value, url });
  if (filmSink.length > FILM_MAX) {
    filmSink = filmSink.filter((_, i) => i % 2 === 0);
    filmInterval *= 2;
  }
}

/** 采样复位（每次开始录制前调用） */
function resetFilm() {
  filmSink = [];
  filmFrames.value = [];
  filmIndex.value = 0;
  filmInterval = 450;
  filmLastAt = 0;
}

/** 停止录制后把采样结果交给时间轴 */
function commitFilm() {
  filmFrames.value = filmSink.slice();
  filmIndex.value = Math.max(0, filmFrames.value.length - 1);
}

/** 舞台坐标：把鼠标位置换算成页面 CSS 视口坐标 */
function livePoint(event: MouseEvent | WheelEvent): { x: number; y: number } | null {
  const img = liveImgRef.value;
  if (!img) return null;
  const rect = img.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const dw = liveMeta.value.w || img.naturalWidth;
  const dh = liveMeta.value.h || img.naturalHeight;
  if (!dw || !dh) return null;
  return {
    x: Math.round(((event.clientX - rect.left) / rect.width) * dw),
    y: Math.round(((event.clientY - rect.top) / rect.height) * dh),
  };
}

/** CDP 修饰键位（Alt=1 Ctrl=2 Meta=4 Shift=8） */
function liveModifiers(event: MouseEvent | KeyboardEvent | WheelEvent): number {
  return (
    (event.altKey ? 1 : 0) + (event.ctrlKey ? 2 : 0) + (event.metaKey ? 4 : 0) + (event.shiftKey ? 8 : 0)
  );
}

/** 发一条 Input.* 指令（失败只更新提示，不打断操作） */
async function sendInput(method: string, params: Record<string, unknown>) {
  if (!selectedTarget.value) return;
  try {
    await client.call(method, params, selectedTarget.value);
  } catch (error) {
    liveHint.value = "指令未送达: " + (error as Error).message;
  }
}

/** 鼠标按下 / 松开（左右键都转发，便于测右键菜单） */
function liveMouseDown(event: MouseEvent) {
  if (!liveOn.value) return;
  event.preventDefault();
  liveInputRef.value?.focus();
  const point = livePoint(event);
  if (!point) return;
  const button = event.button === 2 ? "right" : event.button === 1 ? "middle" : "left";
  const buttons = event.button === 2 ? 2 : event.button === 1 ? 4 : 1;
  void sendInput("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: point.x,
    y: point.y,
    button,
    buttons,
    clickCount: 1,
    modifiers: liveModifiers(event),
  });
}

/** 鼠标松开（clickCount=1 才会触发 click；双击场景由浏览器自行判定） */
function liveMouseUp(event: MouseEvent) {
  if (!liveOn.value) return;
  event.preventDefault();
  const point = livePoint(event);
  if (!point) return;
  const button = event.button === 2 ? "right" : event.button === 1 ? "middle" : "left";
  void sendInput("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x,
    y: point.y,
    button,
    buttons: 0,
    clickCount: 1,
    modifiers: liveModifiers(event),
  });
}

/** 悬停（40ms 节流，够 hover 菜单用又不至于打满指令通道） */
function liveMouseMove(event: MouseEvent) {
  if (!liveOn.value) return;
  const at = Date.now();
  if (at - liveLastMove < 40) return;
  liveLastMove = at;
  const point = livePoint(event);
  if (!point) return;
  void sendInput("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: point.x,
    y: point.y,
    button: "none",
    buttons: 0,
    modifiers: liveModifiers(event),
  });
}

/** 滚轮（preventDefault 阻止调试中心自己滚） */
function liveWheel(event: WheelEvent) {
  if (!liveOn.value) return;
  event.preventDefault();
  const point = livePoint(event);
  if (!point) return;
  void sendInput("Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x: point.x,
    y: point.y,
    deltaX: Math.round(event.deltaX),
    deltaY: Math.round(event.deltaY),
    modifiers: liveModifiers(event),
  });
}

/** 功能键位表（key -> code / Windows 虚拟键码 / 可选的 text） */
const LIVE_KEYS: Record<string, { code: string; vk: number; text?: string }> = {
  Enter: { code: "Enter", vk: 13, text: "\r" },
  Backspace: { code: "Backspace", vk: 8 },
  Tab: { code: "Tab", vk: 9, text: "\t" },
  Escape: { code: "Escape", vk: 27 },
  Delete: { code: "Delete", vk: 46 },
  ArrowUp: { code: "ArrowUp", vk: 38 },
  ArrowDown: { code: "ArrowDown", vk: 40 },
  ArrowLeft: { code: "ArrowLeft", vk: 37 },
  ArrowRight: { code: "ArrowRight", vk: 39 },
  Home: { code: "Home", vk: 36 },
  End: { code: "End", vk: 35 },
  PageUp: { code: "PageUp", vk: 33 },
  PageDown: { code: "PageDown", vk: 34 },
};

/** 按键转发：可打印字符交给隐藏输入框（insertText），功能键 / 组合键走 dispatchKeyEvent */
function liveKeydown(event: KeyboardEvent) {
  if (!liveOn.value) return;
  // 输入法组合中：让 textarea 收下，compositionend 后再统一 insertText
  if (event.isComposing || event.key === "Process") return;
  const meta = LIVE_KEYS[event.key];
  const combo = event.ctrlKey || event.metaKey || event.altKey;
  if (!meta && !combo) {
    // 普通字符：textarea 会触发 input 事件，由 liveInput 发 insertText
    return;
  }
  event.preventDefault();
  const params: Record<string, unknown> = {
    type: meta?.text ? "keyDown" : "rawKeyDown",
    key: event.key,
    code: meta?.code ?? `Key${event.key.toUpperCase()}`,
    windowsVirtualKeyCode: meta?.vk ?? event.key.toUpperCase().charCodeAt(0),
    nativeVirtualKeyCode: meta?.vk ?? event.key.toUpperCase().charCodeAt(0),
    modifiers: liveModifiers(event),
  };
  if (meta?.text && !combo) {
    params.text = meta.text;
    params.unmodifiedText = meta.text;
  }
  void sendInput("Input.dispatchKeyEvent", params).then(() => {
    void sendInput("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: event.key,
      code: params.code,
      windowsVirtualKeyCode: params.windowsVirtualKeyCode,
      nativeVirtualKeyCode: params.nativeVirtualKeyCode,
      modifiers: params.modifiers,
    });
  });
}

/** 输入法组合中（这期间的 input 不能直接发给页面，等 compositionend 再发） */
let liveComposing = false;

/** 文本输入（含输入法上屏）：发完即清空，避免下一次重复插入 */
function liveInput(event: Event) {
  if (liveComposing) return;
  const el = event.target as HTMLTextAreaElement;
  const text = el.value;
  el.value = "";
  if (!liveOn.value || !text) return;
  void sendInput("Input.insertText", { text });
}

/** 输入法开始组合 */
function liveCompositionStart() {
  liveComposing = true;
}

/** 输入法结束：把上屏结果发一次，并清空暂存的组合文本 */
function liveCompositionEnd(event: CompositionEvent) {
  liveComposing = false;
  const el = event.target as HTMLTextAreaElement;
  if (el) el.value = "";
  if (!liveOn.value) return;
  const text = event.data;
  if (!text) return;
  void sendInput("Input.insertText", { text });
}

/* ==================== 实时页面（服务端反向代理 iframe） ==================== */

/** 是否处于实时页面模式（true 时舞台显示 iframe，而非截屏） */
const livePageOn = ref(false);

/** 实时页面 iframe 地址（{proxyBase}/{sessionId}/） */
const livePageSrc = ref("");

/** 当前代理会话标识（关闭时调用 DELETE） */
const livePageSession = ref("");

/** 实时页面模式下的舞台提示 */
const livePageHint = ref("真实页面经服务端代理注入，可直接点击 / 输入，与无头浏览器共享登录态");

/** 打开 / 关闭实时页面模式 */
async function toggleLivePage() {
  if (livePageOn.value) {
    await closeLivePage();
    return;
  }
  const url = activeUrl.value;
  if (!url || !/^https?:\/\//i.test(url)) {
    stageHint.value = "当前目标不是 http(s) 页面，无法打开实时页面";
    return;
  }
  try {
    const session = await cdpOpenProxySession(url);
    livePageSession.value = session.sessionId;
    livePageSrc.value = `${(session.proxyBase ?? "").replace(/\/+$/, "")}/${session.sessionId}/`;
    livePageOn.value = true;
    livePageHint.value = `实时页面已打开：${url}`;
  } catch (error) {
    stageHint.value = "实时页面打开失败: " + (error as Error).message;
  }
}

/** 关闭实时页面模式并释放代理会话 */
async function closeLivePage() {
  livePageOn.value = false;
  const sessionId = livePageSession.value;
  livePageSession.value = "";
  livePageSrc.value = "";
  if (sessionId) {
    try {
      await cdpCloseProxySession(sessionId);
    } catch {
      // 会话可能已超时被清扫，忽略
    }
  }
}

onBeforeUnmount(() => {
  if (livePageOn.value) void closeLivePage();
});

/* ==================== 原始网站舞台（与元素页签联动） ==================== */

/** 刷新舞台截屏 */
async function refreshStage() {
  if (!selectedTarget.value || !running.value) {
    stageShot.value = "";
    return;
  }
  stageLoading.value = true;
  try {
    const base64 = await cdpScreenshot(selectedTarget.value, false);
    stageShot.value = `data:image/png;base64,${base64}`;
    stageHint.value = "点画面里的元素可反查 DOM 节点";
    // 截屏换了新图，重新校准图片显示框与坐标基准
    await nextTick();
    bindStageObserver();
    if (selectedNode.value) {
      void highlightOnStage(selectedNode.value.nodeId, nodeLabel(selectedNode.value));
    }
  } catch {
    stageHint.value = "截屏失败，展开目标后重试";
  } finally {
    stageLoading.value = false;
  }
}

/** 预览图加载完成：记录原始尺寸并重画当前节点的高亮框 */
function onStageImgLoad() {
  const img = stageImgRef.value;
  if (img?.naturalWidth) {
    stageNatural.value = { w: img.naturalWidth, h: img.naturalHeight };
  }
  bindStageObserver();
  if (selectedNode.value) {
    void highlightOnStage(selectedNode.value.nodeId, nodeLabel(selectedNode.value));
  }
}

/**
 * 记录预览图在容器里的实际显示框
 *
 * <p>`object-fit: contain` 会在容器里留黑边，高亮框如果直接按容器百分比定位，
 * 就会整体偏移到黑边上。这里拿图片的 getBoundingClientRect 与容器相减，
 * 得到图片真实占据的 left/top/width/height，高亮框再按这个框换算。</p>
 */
function syncStageBox() {
  const img = stageImgRef.value;
  const view = stageViewRef.value;
  if (!img || !view) {
    return;
  }
  const ir = img.getBoundingClientRect();
  const vr = view.getBoundingClientRect();
  stageBox.value = {
    left: ir.left - vr.left,
    top: ir.top - vr.top,
    width: ir.width,
    height: ir.height,
  };
  if (img.naturalWidth && img.naturalHeight) {
    stageNatural.value = { w: img.naturalWidth, h: img.naturalHeight };
  }
}

/** 预览图 / 容器尺寸变化时重新校准高亮框 */
let stageObserver: ResizeObserver | undefined;

function bindStageObserver() {
  const img = stageImgRef.value;
  const view = stageViewRef.value;
  if (!img || !view) {
    return;
  }
  syncStageBox();
  if (typeof ResizeObserver === "undefined") {
    return;
  }
  stageObserver?.disconnect();
  stageObserver = new ResizeObserver(() => syncStageBox());
  stageObserver.observe(img);
  stageObserver.observe(view);
}

/** 点舞台画面：把视口坐标送进页面，用 elementFromPoint 反查节点并联动选中（预览 → 树） */
async function pickFromStage(event: MouseEvent) {
  const img = stageImgRef.value;
  if (!img || !selectedTarget.value || !stageShot.value) {
    return;
  }
  const rect = img.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.round(((event.clientX - rect.left) / rect.width) * img.naturalWidth);
  const y = Math.round(((event.clientY - rect.top) / rect.height) * img.naturalHeight);
  stageHint.value = `正在反查 (${x}, ${y})…`;
  const target = selectedTarget.value;
  try {
    // 页面里 elementFromPoint 点中元素后，直接取回该元素的 RemoteObject，
    // 再用 DOM.requestNode 映射成 nodeId。这条链路不依赖 DOM.getDocument 的 root id，
    // 避免导航后 DOM 文档重载导致 "Could not find node with given id"。
    const marked = (await client.call(
      "Runtime.evaluate",
      {
        expression: `(function(){var el=document.elementFromPoint(${x},${y});if(!el)return null;var old=document.querySelectorAll('[data-cdp-pick]');for(var i=0;i<old.length;i++)old[i].removeAttribute('data-cdp-pick');el.setAttribute('data-cdp-pick','1');return el})()`,
        returnByValue: false,
      },
      target,
    )) as { result?: { objectId?: string; description?: string } } | null;
    const objectId = marked?.result?.objectId;
    if (!objectId) {
      stageHint.value = "这个位置没有命中元素";
      return;
    }
    const desc = String(marked?.result?.description ?? "");
    const tagMatch = /<([a-zA-Z0-9-]+)/.exec(desc);
    const tag = tagMatch ? tagMatch[1] : "element";
    let nodeId = 0;
    try {
      const found = (await client.call("DOM.requestNode", { objectId }, target)) as {
        nodeId?: number;
      } | null;
      nodeId = Number(found?.nodeId ?? 0);
    } catch {
      // 回退：老链路（getDocument + querySelector）
      const doc = (await client.call("DOM.getDocument", { depth: 0, pierce: false }, target)) as {
        root?: { nodeId?: number };
      } | null;
      const rootId = Number(doc?.root?.nodeId ?? 0);
      if (rootId) {
        const found = (await client.call(
          "DOM.querySelector",
          { nodeId: rootId, selector: '[data-cdp-pick="1"]' },
          target,
        )) as { nodeId?: number } | null;
        nodeId = Number(found?.nodeId ?? 0);
      }
    }
    await client
      .call("Runtime.evaluate", { expression: PICK_RESET, returnByValue: true }, target)
      .catch(() => undefined);
    if (!nodeId) {
      stageHint.value = "没定位到节点，请刷新 DOM 后重试";
      return;
    }
    // 树还没读 / 导航后快照过期：拉一次，保证能找到该 nodeId
    if (!elementTree.value || !findNodeById(elementTree.value, nodeId)) {
      await loadElementTree();
    }
    const node = findNodeById(elementTree.value, nodeId);
    if (!node) {
      stageHint.value = "节点已变化，请刷新 DOM 后重试";
      return;
    }
    expandChain(nodeId);
    detailTab.value = "html";
    await selectNode(node, true);
    stageHint.value = `命中 <${tag}>，已在元素树中选中`;
  } catch (error) {
    stageHint.value = "反查失败: " + (error as Error).message;
  }
}

/** 展开某个节点的所有父链，让选中的行在树里可见 */
function expandChain(nodeId: number) {
  const chain: number[] = [];
  const collect = (cur: DomTreeNode, trail: number[]): boolean => {
    if (cur.nodeId === nodeId) {
      chain.push(...trail, cur.nodeId);
      return true;
    }
    for (const child of cur.children) {
      if (collect(child, [...trail, cur.nodeId])) return true;
    }
    return false;
  };
  if (elementTree.value) {
    collect(elementTree.value, []);
    const next = new Set(expandedNodes.value);
    for (const id of chain) next.add(id);
    expandedNodes.value = next;
  }
}

/* ---------- 元素树右键菜单（对齐 F12 Elements 常用操作） ---------- */

/** 打开右键菜单：先选中该行，再在鼠标处弹菜单（边界不出视口） */
function openContextMenu(event: MouseEvent, node: DomTreeNode) {
  void selectNode(node);
  const menuW = 190;
  const menuH = 320;
  contextMenu.value = {
    open: true,
    x: Math.min(event.clientX, window.innerWidth - menuW - 8),
    y: Math.min(event.clientY, window.innerHeight - menuH - 8),
    node,
  };
}

function closeContextMenu() {
  contextMenu.value.open = false;
}

/** 菜单动作：按 action 分派，统一收口，菜单点击后关闭 */
async function runContextAction(action: string) {
  const node = contextMenu.value.node;
  closeContextMenu();
  if (!node || !selectedTarget.value) return;
  const target = selectedTarget.value;
  const isElement = node.nodeType === 1;
  try {
    switch (action) {
      case "edit":
        detailTab.value = "html";
        startEditOuter();
        break;
      case "copy":
        await copyOuter();
        break;
      case "copySelector":
        await copyText(buildSelector(node), "已复制选择器");
        break;
      case "style":
        showDetailTab("style");
        break;
      case "expand": {
        const next = new Set(expandedNodes.value);
        const walk = (n: DomTreeNode) => {
          if (n.childCount) next.add(n.nodeId);
          n.children.forEach(walk);
        };
        walk(node);
        expandedNodes.value = next;
        break;
      }
      case "collapse": {
        const next = new Set(expandedNodes.value);
        const walk = (n: DomTreeNode) => {
          next.delete(n.nodeId);
          n.children.forEach(walk);
        };
        walk(node);
        expandedNodes.value = next;
        break;
      }
      case "scroll":
        await client.call(
          "DOM.scrollIntoViewIfNeeded",
          { nodeId: node.nodeId },
          target,
        );
        if (stageLive.value) void refreshStage();
        break;
      case "hide":
        // 用 CDP 直接改 inline 样式：给节点挂 display:none
        await setNodeStyle(node.nodeId, "display", "none", target);
        domDirty.value = true;
        ElMessage.success("已隐藏（display:none）");
        break;
      case "delete":
        await client.call(
          "DOM.removeNode",
          { nodeId: node.nodeId },
          target,
        );
        domDirty.value = true;
        ElMessage.success("已删除节点");
        await loadElementTree();
        break;
      case "screenshot":
        await captureNode(node.nodeId, target);
        break;
      case "refresh":
        await loadElementTree();
        break;
      default:
        break;
    }
  } catch (error) {
    ElMessage.error("操作失败: " + (error as Error).message);
  }
}

/** 拼一个尽量短的 CSS 选择器（#id > tag.class 的近似，F12 的 Copy selector） */
function buildSelector(node: DomTreeNode): string {
  if (node.nodeType !== 1) return "";
  const tag = nodeLabel(node);
  const id = node.attributes.id;
  if (id) return `#${id}`;
  const cls = (node.attributes.class || "").trim().split(/\s+/).filter(Boolean);
  if (cls.length) return `${tag}.${cls.join(".")}`;
  return tag;
}

/** 给节点设置一条 inline 样式（DOM.setAttributeValue 走 CDP） */
async function setNodeStyle(nodeId: number, prop: string, value: string, target: string) {
  // CDP 没有直接改 style 的原子方法，用 resolveNode + Runtime.evaluate 写回
  const resolved = (await client.call(
    "DOM.resolveNode",
    { nodeId },
    target,
  )) as { object?: { objectId?: string } } | null;
  const objectId = resolved?.object?.objectId;
  if (objectId) {
    await client.call(
      "Runtime.callFunctionOn",
      {
        objectId,
        functionDeclaration: `function(v){this.style.setProperty('${prop}', v); return this.outerHTML.slice(0,80)}`,
        arguments: [{ value }],
        returnByValue: true,
      },
      target,
    );
  }
}

/** 截取单个节点（BoxModel clip → Page.captureScreenshot），落到截屏页签 */
async function captureNode(nodeId: number, target: string) {
  const box = (await client.call("DOM.getBoxModel", { nodeId }, target)) as {
    model?: { content?: number[] };
  } | null;
  const q = box?.model?.content;
  if (!Array.isArray(q) || q.length < 8) {
    ElMessage.warning("该节点没有可见盒子，无法截取");
    return;
  }
  const xs = [q[0], q[2], q[4], q[6]];
  const ys = [q[1], q[3], q[5], q[7]];
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(1, Math.max(...xs) - x);
  const height = Math.max(1, Math.max(...ys) - y);
  const shot = (await client.call(
    "Page.captureScreenshot",
    { format: "png", clip: { x, y, width, height, scale: 1 }, captureBeyondViewport: true },
    target,
  )) as { data?: string } | null;
  if (shot?.data) {
    screenshotUrl.value = `data:image/png;base64,${shot.data}`;
    ElMessage.success("已截取该节点到「截屏」页签");
  }
}

/* ==================== 元素（F12 Elements） ==================== */

/** CDP DOM 节点（只留渲染用得到的字段） */
interface DomTreeNode {
  /** CDP 节点标识 */
  nodeId: number;
  /** 节点类型（1 元素 / 3 文本 / 8 注释 / 9 文档） */
  nodeType: number;
  /** 节点名（元素是大写标签名，文档是 #document） */
  nodeName: string;
  /** 文本节点的内容 */
  nodeValue: string;
  /** 属性键值（CDP 是扁平的 key/value 数组，这里转成对象） */
  attributes: Record<string, string>;
  /** 子节点 */
  children: DomTreeNode[];
  /** 子节点总数（DOM 里被折叠时提示用） */
  childCount: number;
}

/** 当前页面的 DOM 树（根是 #document） */
const elementTree = ref<DomTreeNode | null>(null);
/** 已展开的节点（nodeId 集合） */
const expandedNodes = ref<Set<number>>(new Set());
/** 当前选中的节点 */
const selectedNode = ref<DomTreeNode | null>(null);
/** 选中节点的 outerHTML */
const selectedOuter = ref("");
/** 是否在编辑 outerHTML */
const elementEditing = ref(false);
/** 编辑框内容 */
const elementEditText = ref("");
/** 正在读取 DOM */
const elementLoading = ref(false);
/** 树里的节点总数 */
const elementNodeCount = ref(0);

/** CDP 原始节点 -> 展示用节点 */
function toTreeNode(raw: Record<string, unknown>): DomTreeNode {
  const attrList = Array.isArray(raw.attributes) ? (raw.attributes as unknown[]) : [];
  const attributes: Record<string, string> = {};
  for (let i = 0; i + 1 < attrList.length; i += 2) {
    attributes[String(attrList[i])] = String(attrList[i + 1] ?? "");
  }
  const children = Array.isArray(raw.children)
    ? (raw.children as Record<string, unknown>[]).map(toTreeNode)
    : [];
  return {
    nodeId: Number(raw.nodeId ?? 0),
    nodeType: Number(raw.nodeType ?? 0),
    nodeName: String(raw.nodeName ?? ""),
    nodeValue: String(raw.nodeValue ?? ""),
    attributes,
    children,
    childCount: Number(raw.childCount ?? children.length),
  };
}

/** 递归数节点（展示「共 N 个节点」） */
function countNodes(node: DomTreeNode): number {
  return node.children.reduce((sum, child) => sum + countNodes(child), 1);
}

/** 元素名：HTML 标签小写，文档 / 文本保持原样 */
function nodeLabel(node: DomTreeNode): string {
  if (node.nodeType === 9) {
    return "#document";
  }
  if (node.nodeType === 3) {
    return "#text";
  }
  if (node.nodeType === 8) {
    return "#comment";
  }
  return node.nodeName.toLowerCase();
}

/** 文本内容预览（换行压成空格，太长截断） */
function textPreview(value: string): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > 80 ? `${flat.slice(0, 80)}…` : flat;
}

/** 属性值预览 */
function attrPreview(value: string): string {
  return value.length > 36 ? `${value.slice(0, 36)}…` : value;
}

/**
 * 拉取整棵 DOM 树
 *
 * <p>用 {@code DOM.getDocument({depth:-1})} 一次拿全量节点：后端 WS 只透传
 * 白名单里的页面事件，{@code DOM.setChildNodes} 这类不在其中，增量展开收不到，
 * 所以前端一次性建树，展开 / 折叠全在本地做。</p>
 */
async function loadElementTree(silent = false) {
  if (!selectedTarget.value) {
    if (!silent) {
      ElMessage.warning("请先在左侧选择一个目标");
    }
    return;
  }
  elementLoading.value = true;
  try {
    const doc = (await client.call(
      "DOM.getDocument",
      { depth: -1, pierce: false },
      selectedTarget.value,
    )) as { root?: Record<string, unknown> } | null;
    if (!doc?.root) {
      throw new Error("没有拿到 DOM 文档");
    }
    const root = toTreeNode(doc.root);
    elementTree.value = root;
    elementNodeCount.value = countNodes(root);
    selectedNode.value = null;
    selectedOuter.value = "";
    elementEditing.value = false;
    styleRules.value = [];
    styleError.value = "";
    // 打开时默认展开到 html 的下一层，跟 F12 的初始状态一致
    const next = new Set<number>([root.nodeId]);
    for (const child of root.children) {
      next.add(child.nodeId);
      if (nodeLabel(child) === "html") {
        for (const grandchild of child.children) {
          next.add(grandchild.nodeId);
        }
      }
    }
    expandedNodes.value = next;
    domDirty.value = false;
    // 树刷新后顺带刷一次舞台，避免截屏还是导航前的旧画面
    if (stageOpen.value && stageLive.value) {
      void refreshStage();
    }
  } catch (error) {
    if (!silent) {
      ElMessage.error("读取 DOM 失败: " + (error as Error).message);
    }
  } finally {
    elementLoading.value = false;
  }
}

/** 展开 / 折叠一个节点 */
function toggleNode(node: DomTreeNode) {
  if (!node.childCount) {
    return;
  }
  const next = new Set(expandedNodes.value);
  if (next.has(node.nodeId)) {
    next.delete(node.nodeId);
  } else {
    next.add(node.nodeId);
  }
  expandedNodes.value = next;
}

/** 全部折叠（只留根） */
function collapseAll() {
  expandedNodes.value = new Set(elementTree.value ? [elementTree.value.nodeId] : []);
}

/** 页面里的高亮配置（跟主题同一个蓝） */
const HIGHLIGHT_CONFIG = {
  showInfo: false,
  contentColor: { r: 22, g: 119, b: 255, a: 0.16 },
  paddingColor: { r: 22, g: 119, b: 255, a: 0.08 },
  borderColor: { r: 22, g: 119, b: 255, a: 0.6 },
  marginColor: { r: 245, g: 158, b: 11, a: 0.1 },
};

/** 取消页面里的高亮 */
async function clearHighlight() {
  if (!selectedTarget.value) {
    return;
  }
  try {
    await client.call("Overlay.hideHighlight", {}, selectedTarget.value);
  } catch {
    // 高亮只是辅助，失败不打扰
  }
}

/** 选中节点：页面 Overlay 高亮 + 预览图高亮 + 取 outerHTML */
async function selectNode(node: DomTreeNode, fromStage = false) {
  selectedNode.value = node;
  sourceOpen.value = false;
  elementEditing.value = false;
  selectedOuter.value = node.nodeType === 3 ? node.nodeValue : "";
  styleRules.value = [];
  styleError.value = "";
  if (detailTab.value === "style") {
    void loadMatchedStyles();
  } else if (detailTab.value === "computed") {
    void loadComputedStyles();
  } else if (detailTab.value === "box") {
    void loadBoxModel();
  }
  // 树 → 预览联动：把节点框画到预览图上
  void highlightOnStage(node.nodeId, nodeLabel(node));
  if (!fromStage) {
    nextTick(() => {
      const el = document.querySelector(".debug-el__row.is-active");
      el?.scrollIntoView({ block: "nearest" });
    });
  }
  if (!selectedTarget.value) {
    return;
  }
  try {
    await client.call("Overlay.enable", {}, selectedTarget.value);
    await client.call(
      "Overlay.highlightNode",
      { nodeId: node.nodeId, highlightConfig: HIGHLIGHT_CONFIG },
      selectedTarget.value,
    );
  } catch {
    // 高亮只是辅助，失败不打扰
  }
  try {
    const result = (await client.call(
      "DOM.getOuterHTML",
      { nodeId: node.nodeId },
      selectedTarget.value,
    )) as { outerHTML?: string } | null;
    if (result?.outerHTML) {
      selectedOuter.value = result.outerHTML;
    }
  } catch {
    // 文本 / 文档节点没有 outerHTML，保留兜底内容
  }
}

/**
 * 量出节点在视口里的位置，在截屏上叠一个高亮框
 *
 * <p>不用 {@code DOM.getBoxModel}：它给的是 content quad（不含 padding / border），
 * 而且在滚动后会带上页面坐标；截屏是当前视口。这里用
 * {@code getBoundingClientRect} 取 border box 的视口坐标，点哪框哪，
 * 滚动位置也天然一致。</p>
 */
async function highlightOnStage(nodeId: number, tag: string) {
  if (!selectedTarget.value || !stageShot.value) {
    return;
  }
  try {
    const resolved = (await client.call("DOM.resolveNode", { nodeId }, selectedTarget.value)) as {
      object?: { objectId?: string };
    } | null;
    const objectId = resolved?.object?.objectId;
    if (!objectId) {
      stageHighlight.value = null;
      return;
    }
    const measured = (await client.call(
      "Runtime.callFunctionOn",
      {
        objectId,
        functionDeclaration:
          "function(){var r=this.getBoundingClientRect();return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height});}",
        returnByValue: true,
      },
      selectedTarget.value,
    )) as { result?: { value?: string } } | null;
    const raw = measured?.result?.value;
    const rect = raw
      ? (JSON.parse(String(raw)) as { x?: number; y?: number; w?: number; h?: number })
      : null;
    if (!rect || (!rect.w && !rect.h)) {
      stageHighlight.value = null;
      return;
    }
    stageHighlight.value = {
      x: Number(rect.x ?? 0),
      y: Number(rect.y ?? 0),
      w: Number(rect.w ?? 0),
      h: Number(rect.h ?? 0),
      tag,
    };
    // 首帧图片可能刚换过，重新校准一次显示框
    syncStageBox();
  } catch {
    // 文本 / 隐藏节点量不到尺寸，清掉旧框即可
    stageHighlight.value = null;
  }
}

/** 复制选中的 outerHTML */
async function copyOuter() {
  if (!selectedOuter.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(selectedOuter.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.warning("当前浏览器不允许写剪贴板，请手动选中复制");
  }
}

/** 进入 outerHTML 编辑 */
function startEditOuter() {
  if (!selectedNode.value || selectedNode.value.nodeType !== 1) {
    ElMessage.warning("只有元素节点可以编辑");
    return;
  }
  elementEditText.value = selectedOuter.value;
  elementEditing.value = true;
}

/** 写回 outerHTML 并重读整棵树 */
async function saveOuter() {
  if (!selectedNode.value || !selectedTarget.value) {
    return;
  }
  try {
    await client.call(
      "DOM.setOuterHTML",
      { nodeId: selectedNode.value.nodeId, outerHTML: elementEditText.value },
      selectedTarget.value,
    );
    elementEditing.value = false;
    ElMessage.success("已写回页面");
    await loadElementTree();
  } catch (error) {
    ElMessage.error("写回失败: " + (error as Error).message);
  }
}

/* ---------- 样式（F12 Styles） ---------- */

/** 一条命中的 CSS 属性 */
interface StyleProp {
  /** 属性名 */
  name: string;
  /** 属性值（已去掉 !important，单独标记） */
  value: string;
  /** 是否 !important */
  important: boolean;
  /** 是否被划掉（无效声明） */
  disabled: boolean;
}

/** 一条命中的 CSS 规则 */
interface StyleRule {
  /** 选择器文本 */
  selector: string;
  /** 来源：inline / regular / user-agent / injected / inspector */
  origin: string;
  /** 规则里的声明 */
  properties: StyleProp[];
}

/** 详情区当前看的页签：样式 / 计算 / 布局 / HTML / SVG */
const detailTab = ref<"html" | "style" | "computed" | "box" | "svg">(
  readPref<"html" | "style" | "computed" | "box" | "svg">("element.detailTab", "style"),
);
/** 命中样式 */
const styleRules = ref<StyleRule[]>([]);
/** 样式读取失败原因 */
const styleError = ref("");
/** 正在读样式 */
const styleLoading = ref(false);
/** 已经为哪个目标开过 DOM / CSS 域（避免重复 enable） */
let styleDomainsTarget = "";

/** 来源的中文标签 */
function originLabel(origin: string): string {
  if (origin === "inline") {
    return "内联";
  }
  if (origin === "user-agent") {
    return "默认";
  }
  if (origin === "injected") {
    return "注入";
  }
  if (origin === "inspector") {
    return "检查器";
  }
  return "页面";
}

/** CDP 的 cssProperties -> 展示用声明（丢掉 shorthand 展开出来的隐式长写，跟 F12 一致） */
function toStyleProps(raw: unknown): StyleProp[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const list: StyleProp[] = [];
  for (const item of raw as Record<string, unknown>[]) {
    if (item.implicit === true) {
      continue;
    }
    const name = String(item.name ?? "");
    if (!name) {
      continue;
    }
    list.push({
      name,
      value: String(item.value ?? ""),
      important: item.important === true,
      disabled: item.disabled === true,
    });
  }
  return list;
}

/**
 * 打开样式面板需要的 DOM / CSS 域
 *
 * <p>{@code CSS.getMatchedStylesForNode} 依赖 DOM 域；{@code CSS.enable} 又要求
 * DOM 先开，所以按顺序各开一次，失败也不阻断（有的目标类型不支持 CSS）。</p>
 */
async function ensureStyleDomains(target: string) {
  if (styleDomainsTarget === target) {
    return;
  }
  await client.call("DOM.enable", {}, target).catch(() => undefined);
  await client.call("CSS.enable", {}, target).catch(() => undefined);
  styleDomainsTarget = target;
}

/**
 * 读取选中元素命中的样式
 *
 * <p>用 {@code CSS.getMatchedStylesForNode} 一次拿内联 + 全部匹配规则，
 * 前端按 F12 的顺序展示（内联在最上，其余按层叠顺序）。</p>
 */
async function loadMatchedStyles() {
  const node = selectedNode.value;
  const target = selectedTarget.value;
  if (!node || !target) {
    return;
  }
  if (node.nodeType !== 1) {
    styleRules.value = [];
    styleError.value = "只有元素节点有样式";
    return;
  }
  styleLoading.value = true;
  styleError.value = "";
  try {
    await ensureStyleDomains(target);
    const result = (await client.call(
      "CSS.getMatchedStylesForNode",
      { nodeId: node.nodeId },
      target,
    )) as Record<string, unknown> | null;

    const rules: StyleRule[] = [];
    const inlineStyle = result?.inlineStyle as Record<string, unknown> | undefined;
    const inlineProps = toStyleProps(inlineStyle?.cssProperties);
    if (inlineProps.length) {
      rules.push({ selector: "element.style", origin: "inline", properties: inlineProps });
    }
    const matched = Array.isArray(result?.matchedCSSRules)
      ? (result.matchedCSSRules as Record<string, unknown>[])
      : [];
    for (const item of matched) {
      const rule = item.rule as Record<string, unknown> | undefined;
      if (!rule) {
        continue;
      }
      const style = rule.style as Record<string, unknown> | undefined;
      const selectorList = rule.selectorList as Record<string, unknown> | undefined;
      rules.push({
        selector: String(selectorList?.text ?? "?"),
        origin: String(rule.origin ?? "regular"),
        properties: toStyleProps(style?.cssProperties),
      });
    }
    styleRules.value = rules.slice(0, 80);
    if (!styleRules.value.length) {
      styleError.value = "没有命中任何样式规则";
    }
  } catch (error) {
    styleRules.value = [];
    styleError.value = "读取样式失败: " + (error as Error).message;
  } finally {
    styleLoading.value = false;
  }
}

/** 切换详情页签（样式 / 计算样式按需读取） */
function showDetailTab(tab: "html" | "style" | "computed" | "box" | "svg") {
  detailTab.value = tab;
  if (tab === "style") {
    void loadMatchedStyles();
  } else if (tab === "computed") {
    void loadComputedStyles();
  } else if (tab === "box") {
    void loadBoxModel();
  } else if (tab === "svg") {
    if (!svgItems.value.length && selectedTarget.value) {
      void loadSvgs();
    }
  }
}

/* ---------- 计算样式（F12 Computed）与盒模型（F12 Layout） ---------- */

/** 计算后的样式（name -> value，按字母序） */
const computedStyles = ref<StyleProp[]>([]);
const computedError = ref("");
const computedLoading = ref(false);
/** 计算样式里的关键字过滤 */
const computedKeyword = ref("");

/** 盒模型量到的尺寸 */
interface BoxMetric {
  /** content / padding / border / margin 的宽高 */
  width: number;
  height: number;
  content?: number[];
  padding?: number[];
  border?: number[];
  margin?: number[];
}
const boxMetric = ref<BoxMetric | null>(null);
const boxError = ref("");

/** 过滤后的计算样式 */
const visibleComputed = computed(() => {
  const kw = computedKeyword.value.trim().toLowerCase();
  if (!kw) return computedStyles.value;
  return computedStyles.value.filter((p) => p.name.toLowerCase().includes(kw) || p.value.toLowerCase().includes(kw));
});

/** 读取计算后的样式（CSS.getComputedStyleForNode） */
async function loadComputedStyles() {
  const node = selectedNode.value;
  const target = selectedTarget.value;
  if (!node || !target || node.nodeType !== 1) {
    computedStyles.value = [];
    computedError.value = "只有元素节点有计算样式";
    return;
  }
  computedLoading.value = true;
  computedError.value = "";
  try {
    await ensureStyleDomains(target);
    const result = (await client.call("CSS.getComputedStyleForNode", { nodeId: node.nodeId }, target)) as {
      computedStyle?: { name?: string; value?: string }[];
    } | null;
    const list = Array.isArray(result?.computedStyle) ? result!.computedStyle! : [];
    computedStyles.value = list
      .map((item) => ({
        name: String(item.name ?? ""),
        value: String(item.value ?? ""),
        important: false,
        disabled: false,
      }))
      .filter((item) => item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    computedStyles.value = [];
    computedError.value = "读取计算样式失败: " + (error as Error).message;
  } finally {
    computedLoading.value = false;
  }
}

/** 读取盒模型（DOM.getBoxModel，含 content / padding / border / margin 四层） */
async function loadBoxModel() {
  const node = selectedNode.value;
  const target = selectedTarget.value;
  if (!node || !target || node.nodeType !== 1) {
    boxMetric.value = null;
    boxError.value = "只有元素节点有盒模型";
    return;
  }
  boxError.value = "";
  try {
    const result = (await client.call("DOM.getBoxModel", { nodeId: node.nodeId }, target)) as {
      model?: {
        width?: number;
        height?: number;
        content?: number[];
        padding?: number[];
        border?: number[];
        margin?: number[];
      };
    } | null;
    const model = result?.model;
    if (!model) {
      boxMetric.value = null;
      boxError.value = "没有量到盒模型（隐藏节点或文本节点）";
      return;
    }
    boxMetric.value = {
      width: Number(model.width ?? 0),
      height: Number(model.height ?? 0),
      content: model.content,
      padding: model.padding,
      border: model.border,
      margin: model.margin,
    };
  } catch (error) {
    boxMetric.value = null;
    boxError.value = "读取盒模型失败: " + (error as Error).message;
  }
}

/** 从 quad 反推宽高（8 个数 = 4 个点） */
function quadSize(quad?: number[]): { w: number; h: number } {
  if (!Array.isArray(quad) || quad.length < 8) {
    return { w: 0, h: 0 };
  }
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** 选中节点的祖先链（F12 面包屑，根在左） */
const nodePath = computed(() => {
  const node = selectedNode.value;
  if (!node || !elementTree.value) {
    return [] as DomTreeNode[];
  }
  const chain: DomTreeNode[] = [];
  const walk = (current: DomTreeNode, trail: DomTreeNode[]): boolean => {
    const nextTrail = [...trail, current];
    if (current.nodeId === node.nodeId) {
      chain.push(...nextTrail);
      return true;
    }
    for (const child of current.children) {
      if (walk(child, nextTrail)) {
        return true;
      }
    }
    return false;
  };
  walk(elementTree.value, []);
  return chain;
});

/* ---------- 页内选元素（F12 的检查器） ---------- */

/** 是否正在页内取元素 */
const picking = ref(false);
/** 取元素的轮询计时器 */
let pickTimer: ReturnType<typeof setInterval> | undefined;

/**
 * 注入页面的取元素脚本
 *
 * <p>后端 WS 只透传白名单事件，{@code Overlay.inspectNodeRequested} 收不到，
 * 所以不用 {@code Overlay.setInspectMode}，改成注入一段自带高亮框的脚本：
 * 移动时画框、点击时给元素打 {@code data-cdp-pick} 标记，前端再靠
 * {@code DOM.querySelector} 把标记换成 nodeId，Esc 取消。</p>
 */
const PICK_SCRIPT = `(function () {
  if (window.__cdpPickCleanup) { window.__cdpPickCleanup(); }
  window.__cdpPickDone = false;
  window.__cdpPickCancel = false;
  var box = document.createElement('div');
  box.setAttribute('data-cdp-picker', '1');
  box.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;border:2px solid #1677ff;background:rgba(22,119,255,.14);box-sizing:border-box;border-radius:2px;display:none;';
  var tag = document.createElement('div');
  tag.style.cssText = 'position:absolute;left:-2px;top:-20px;background:#1677ff;color:#fff;font:11px/18px monospace;padding:0 5px;border-radius:2px;white-space:nowrap;';
  box.appendChild(tag);
  document.documentElement.appendChild(box);
  var current = null;
  function onMove(e) {
    var el = e.target;
    if (!el || el.nodeType !== 1 || el === box || (el.closest && el.closest('[data-cdp-picker]'))) { return; }
    current = el;
    var r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    tag.textContent = '<' + el.tagName.toLowerCase() + '>';
  }
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (current) {
      var old = document.querySelectorAll('[data-cdp-pick]');
      for (var i = 0; i < old.length; i++) { old[i].removeAttribute('data-cdp-pick'); }
      current.setAttribute('data-cdp-pick', '1');
    }
    window.__cdpPickDone = true;
    cleanup();
  }
  function onKey(e) {
    if (e.key === 'Escape') { window.__cdpPickCancel = true; cleanup(); }
  }
  function cleanup() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    if (box.parentNode) { box.parentNode.removeChild(box); }
    window.__cdpPickCleanup = null;
  }
  window.__cdpPickCleanup = cleanup;
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
})()`;

/** 清掉页面里注入的标记与高亮框 */
const PICK_RESET = `(function () {
  if (window.__cdpPickCleanup) { window.__cdpPickCleanup(); }
  window.__cdpPickDone = false;
  window.__cdpPickCancel = false;
  var marked = document.querySelectorAll('[data-cdp-pick]');
  for (var i = 0; i < marked.length; i++) { marked[i].removeAttribute('data-cdp-pick'); }
})()`;

/** 结束取元素（可重复调用） */
async function stopPickNode() {
  if (pickTimer) {
    clearInterval(pickTimer);
    pickTimer = undefined;
  }
  picking.value = false;
  if (!selectedTarget.value) {
    return;
  }
  await client
    .call("Runtime.evaluate", { expression: PICK_RESET, returnByValue: true }, selectedTarget.value)
    .catch(() => undefined);
}

/** 在树里按 nodeId 找节点 */
function findNodeById(node: DomTreeNode | null, nodeId: number): DomTreeNode | null {
  if (!node) {
    return null;
  }
  if (node.nodeId === nodeId) {
    return node;
  }
  for (const child of node.children) {
    const hit = findNodeById(child, nodeId);
    if (hit) {
      return hit;
    }
  }
  return null;
}

/** 页面里点到了一个元素：换成节点、展开树、选中 */
async function finishPick() {
  if (pickTimer) {
    clearInterval(pickTimer);
    pickTimer = undefined;
  }
  picking.value = false;
  const target = selectedTarget.value;
  if (!target) {
    return;
  }
  try {
    const doc = (await client.call("DOM.getDocument", { depth: 0, pierce: false }, target)) as {
      root?: { nodeId?: number };
    } | null;
    const rootId = Number(doc?.root?.nodeId ?? 0);
    let nodeId = 0;
    if (rootId) {
      const found = (await client.call(
        "DOM.querySelector",
        { nodeId: rootId, selector: '[data-cdp-pick="1"]' },
        target,
      )) as { nodeId?: number } | null;
      nodeId = Number(found?.nodeId ?? 0);
    }
    await client
      .call("Runtime.evaluate", { expression: PICK_RESET, returnByValue: true }, target)
      .catch(() => undefined);

    if (!nodeId) {
      ElMessage.warning("没取到元素（可能在 iframe 里，或页面已刷新）");
      return;
    }
    await loadElementTree();
    const node = findNodeById(elementTree.value, nodeId);
    if (!node) {
      ElMessage.warning("节点已经变化，请重新选一次");
      return;
    }
    detailTab.value = "html";
    expandChain(nodeId);
    await selectNode(node);
  } catch (error) {
    ElMessage.error("取元素失败: " + (error as Error).message);
  }
}

/** 轮询页面里的取元素结果 */
async function pollPick() {
  if (!picking.value || !selectedTarget.value) {
    return;
  }
  try {
    const result = (await client.call(
      "Runtime.evaluate",
      { expression: "window.__cdpPickDone === true || window.__cdpPickCancel === true", returnByValue: true },
      selectedTarget.value,
    )) as { result?: { value?: boolean } } | null;
    if (result?.result?.value === true) {
      await finishPick();
    }
  } catch {
    // 页面切走 / 刷新时求值会失败，下一轮自然结束
  }
}

/** 开始页内选元素 */
async function startPickNode() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
    return;
  }
  if (picking.value) {
    await stopPickNode();
    return;
  }
  try {
    await client.call(
      "Runtime.evaluate",
      { expression: PICK_SCRIPT, returnByValue: true },
      selectedTarget.value,
    );
  } catch (error) {
    ElMessage.error("注入取元素脚本失败: " + (error as Error).message);
    return;
  }
  picking.value = true;
  pickTimer = setInterval(() => {
    void pollPick();
  }, 260);
  ElMessage.info("在页面里点一个元素，Esc 取消");
}

/** 可见的行（按展开状态摊平，避免递归组件） */
const elementRows = computed<{ node: DomTreeNode; depth: number }[]>(() => {
  const rows: { node: DomTreeNode; depth: number }[] = [];
  const walk = (node: DomTreeNode, depth: number) => {
    rows.push({ node, depth });
    if (expandedNodes.value.has(node.nodeId)) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  };
  if (elementTree.value) {
    walk(elementTree.value, 0);
  }
  return rows;
});

/** 自动补载过 DOM 的目标，避免 reloadTargets / 通道对账重复触发生成整树拉取 */
let autoLoadedTarget = "";
/** 自动补载是否正在进行（watch 与通道对账可能同时触发） */
let autoLoading = false;

/**
 * 目标就绪后自动补齐当前页签的内容
 *
 * <p>刷新页面 / WS 重连 / SSE 重连后 {@code selectedTarget} 会被重新校正；此时若停在
 * 「元素」页签，必须自动拉一次 DOM 与截屏，否则左侧画面和节点树会空着等人手点
 * 「刷新 DOM」——表现就是「左侧每次都消失」。同一目标只补载一次，避免对账循环。
 * 「应用」页签同理：恢复页签后顺手把存储拉一次。</p>
 */
async function ensureElementReady(): Promise<void> {
  const id = selectedTarget.value;
  if (!id || !running.value) {
    return;
  }
  if (pageTab.value === "app") {
    if (!storageCookies.value.length && !storageLocal.value.length && !storageSession.value.length) {
      void loadStorage();
    }
    return;
  }
  if (pageTab.value === "svg") {
    if (svgAuto.value && !svgItems.value.length) {
      void loadSvgs(true);
    }
    return;
  }
  if (pageTab.value !== "elements" || !wsReady()) {
    return;
  }
  if (autoLoading || (elementTree.value && autoLoadedTarget === id)) {
    return;
  }
  autoLoading = true;
  autoLoadedTarget = id;
  try {
    await loadElementTree(true);
  } finally {
    autoLoading = false;
  }
  if (stageOpen.value && !stageShot.value) {
    void refreshStage();
  }
  if (sourceOpen.value && !domRaw.value) {
    void fetchContent();
  }
}

// 换目标后旧的 DOM 树不再属于当前页面，全部丢掉
watch(selectedTarget, (id) => {
  writePref("target", id);
  void stopPickNode();
  // screencast 绑定在具体页面上，换目标必须停掉旧的，否则画面会停在上一页
  if (liveOn.value) {
    void stopLive();
  }
  elementTree.value = null;
  elementNodeCount.value = 0;
  selectedNode.value = null;
  selectedOuter.value = "";
  elementEditing.value = false;
  expandedNodes.value = new Set();
  styleRules.value = [];
  styleError.value = "";
  styleDomainsTarget = "";
  svgItems.value = [];
  svgError.value = "";
  domDirty.value = false;
  netDetailId.value = "";
  netBodyRaw.value = "";
  // 注意：不清 detailTab / sourceOpen——它们是「视图偏好」不是「页面数据」。
  // 清掉会让用户刚记住的详情页签 / 页面 HTML 面板在刷新后又被扳回默认值。
  // domRaw 要清（上一个页面的 HTML 已失效）；sourceOpen 仍开着时由
  // ensureElementReady() 自动按新目标重取一次。
  domRaw.value = "";
  stageShot.value = "";
  stageHighlight.value = null;
  stageObserver?.disconnect();
  // 新目标重新挂变化监视 / sw8 注入 / favicon（一次性，事件驱动）
  watchInjected.clear();
  sw8Injected.clear();
  injectPageScripts();
  void ensureElementReady();
  // 导航历史与加载态跟随目标重置
  navHistory.value = null;
  pageLoading.value = false;
  void refreshNavHistory();
});

// 切到「元素」页签时读一次 DOM / 补一张截屏，省掉手动点击
watch(pageTab, (tab) => {
  writePref("tab", tab);
  if (tab !== "elements") {
    void stopPickNode();
  }
  // 离开性能页且没在录制：收回交互画面，别让 screencast 在后台白跑
  if (tab !== "performance" && liveOn.value && !perfRecording.value) {
    void stopLive();
  }
  if (tab === "elements") {
    void ensureElementReady();
  } else if (tab === "svg") {
    // 进 SVG 独立页：自动获取开着就抽一次，否则等用户点「重新抽取」
    if (svgAuto.value && !svgItems.value.length) {
      void loadSvgs(true);
    }
  } else if (tab === "app") {
    // 进「应用」页签顺手拉一次存储，省一次点击
    if (selectedTarget.value && !storageCookies.value.length && !storageLocal.value.length) {
      void loadStorage();
    }
  }
});

// 变化开关：开启补注入、关闭让页面观察者下线（事件驱动，无定时器）
watch(watchEnabled, (on) => {
  writePref("watch.enabled", on);
  syncWatchInjection();
});
// 打开画面 / 开启实时：补一次截屏；实时刷新由页面事件驱动，不再定时轮询
watch([stageOpen, stageLive], () => {
  writePref("stage.open", stageOpen.value);
  writePref("stage.live", stageLive.value);
  if (stageOpen.value && stageLive.value && pageTab.value === "elements") {
    void refreshStage();
  }
});

// 画面布局切换 / 页签重新进入 / 目标栏折叠：容器尺寸变了，重新校准高亮框
watch([stageLayout, pageTab, railCollapsed, stageOpen], () => {
  writePref("stage.layout", stageLayout.value);
  void nextTick(() => {
    bindStageObserver();
    if (selectedNode.value) {
      void highlightOnStage(selectedNode.value.nodeId, nodeLabel(selectedNode.value));
    }
  });
});

/* ==================== DOM ==================== */

const domRaw = ref("");
const domLoading = ref(false);
/** 元素页签里的「整页 HTML」面板（源码页签并进来后的落点；开关状态会记住） */
const sourceOpen = ref<boolean>(readPref<boolean>("element.sourceOpen", false));

/** 当前页签的地址栏（源码面板里的跳转输入） */
const navigateUrl = ref("");

/**
 * 拉取当前页面内容
 */
async function fetchContent() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
    return;
  }
  domLoading.value = true;
  try {
    domRaw.value = await cdpContent(selectedTarget.value);
  } catch (error) {
    ElMessage.error("获取内容失败: " + (error as Error).message);
  } finally {
    domLoading.value = false;
  }
}

/**
 * 打开 / 关闭元素页签里的整页 HTML 面板
 *
 * <p>源码页签已经并到这里：第一次打开时按需拉一次 document HTML，
 * 之后保留快照，需要最新内容点面板里的「重新获取」。</p>
 */
async function toggleSourcePanel() {
  if (sourceOpen.value) {
    sourceOpen.value = false;
    return;
  }
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
    return;
  }
  sourceOpen.value = true;
  if (!domRaw.value) {
    await fetchContent();
  }
}

/**
 * 页面导航（ES 变更标题）
 *
 * @returns 是否真正发起了导航（目标不存在 / 失败返回 false，供壳层记录地址历史时判断）
 */
async function doNavigate(url: string): Promise<boolean> {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
    return false;
  }
  try {
    await cdpNavigate(selectedTarget.value, url);
    // REST 导航成功后立即进入加载态；loadEventFired / frameNavigated 负责收尾
    pageLoading.value = true;
    armLoadingWatchdog();
    return true;
  } catch (error) {
    ElMessage.error("导航失败: " + (error as Error).message);
    return false;
  }
}

/* ==================== Screenshot ==================== */

const screenshotUrl = ref("");
const screenshotLoading = ref(false);

/**
 * 截屏（base64 png）
 */
async function doScreenshot(fullPage = false) {
  if (!selectedTarget.value) {
    ElMessage.warning("请先选择或创建一个页面");
    return;
  }
  screenshotLoading.value = true;
  try {
    const base64 = await cdpScreenshot(selectedTarget.value, fullPage);
    screenshotUrl.value = `data:image/png;base64,${base64}`;
  } catch (error) {
    ElMessage.error("截屏失败: " + (error as Error).message);
  } finally {
    screenshotLoading.value = false;
  }
}

/** 导出 PDF（Page.printToPDF，仅 page 型目标可用；base64 → 二进制下载） */
async function exportPdf() {
  const targetId = selectedTarget.value;
  if (!targetId) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  screenshotLoading.value = true;
  try {
    const res = (await client.call(
      "Page.printToPDF",
      { printBackground: true, preferCSSPageSize: true },
      targetId,
    )) as { data?: string } | null;
    if (!res?.data) {
      throw new Error("没有返回 PDF 数据");
    }
    downloadBase64File(res.data, `debug-page-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`, "application/pdf");
    ElMessage.success("已导出 PDF");
  } catch (error) {
    ElMessage.error("导出 PDF 失败: " + (error as Error).message);
  } finally {
    screenshotLoading.value = false;
  }
}

/** 导出 MHTML 单文件存档（Page.captureSnapshot，整页内联资源） */
async function exportMhtml() {
  const targetId = selectedTarget.value;
  if (!targetId) {
    ElMessage.warning("先在左侧选择一个页面目标");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("指令通道还没连上，稍后再试");
    return;
  }
  screenshotLoading.value = true;
  try {
    const res = (await client.call("Page.captureSnapshot", { format: "mhtml" }, targetId)) as { data?: string } | null;
    if (!res?.data) {
      throw new Error("没有返回 MHTML 数据");
    }
    downloadBase64File(res.data, `debug-page-${new Date().toISOString().replace(/[:.]/g, "-")}.mhtml`, "multipart/related");
    ElMessage.success("已导出 MHTML");
  } catch (error) {
    ElMessage.error("导出 MHTML 失败: " + (error as Error).message);
  } finally {
    screenshotLoading.value = false;
  }
}

/* ==================== Evaluate ==================== */

const evaluateExpression = ref("document.title");
const evaluateResult = ref("");
const evaluateLoading = ref(false);
/** Console 抽屉里的历史命令（↑ / ↓ 翻，localStorage 记忆最近 50 条） */
const evalHistory = ref<string[]>(readEvalHistory());
const evalHistoryIndex = ref(-1);

function readEvalHistory(): string[] {
  try {
    const raw = localStorage.getItem("debug.eval.history");
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === "string").slice(-50) : [];
  } catch {
    return [];
  }
}

function pushEvalHistory(text: string): void {
  const value = text.trim();
  if (!value) return;
  const list = evalHistory.value.filter((item) => item !== value);
  list.push(value);
  evalHistory.value = list.slice(-50);
  evalHistoryIndex.value = -1;
  try {
    localStorage.setItem("debug.eval.history", JSON.stringify(evalHistory.value));
  } catch {
    // 隐私模式忽略
  }
}

/** ↑ 取上一条历史命令 */
function historyPrev(): void {
  if (!evalHistory.value.length) return;
  const next = evalHistoryIndex.value < 0
    ? evalHistory.value.length - 1
    : Math.max(0, evalHistoryIndex.value - 1);
  evalHistoryIndex.value = next;
  evaluateExpression.value = evalHistory.value[next] ?? "";
}

/** ↓ 取下一条历史命令 */
function historyNext(): void {
  if (!evalHistory.value.length) return;
  const next = evalHistoryIndex.value + 1;
  if (next >= evalHistory.value.length) {
    evalHistoryIndex.value = -1;
    evaluateExpression.value = "";
    return;
  }
  evalHistoryIndex.value = next;
  evaluateExpression.value = evalHistory.value[next] ?? "";
}

/** Console 抽屉是否展开（元素页签底部） */
const evaluateOpen = ref<boolean>(readPref<boolean>("console.drawerOpen", true));
/** 抽屉标题上的结果摘要（截断成一行，详情在抽屉里） */
const evaluateSummary = computed(() => {
  const text = evaluateResult.value.replace(/\s+/g, " ").trim();
  if (!text) {
    return evaluateExpression.value ? `待执行：${evaluateExpression.value}` : "没有结果";
  }
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
});

/** 清空求值输出 */
function clearEvaluate(): void {
  evaluateResult.value = "";
}

/**
 * 把 CDP {@code Runtime.evaluate} 的 result 结构压成便于阅读的文本
 *
 * <p>后端只透出 {@code {type, value}}，直接 JSON.stringify 会把 `document.title`
 * 这类最常用的求值弄成一屏噪音，所以标量取 value、不可序列化值取
 * {@code unserializableValue}，其余才退回 JSON。</p>
 */
function formatEvalResult(result: Record<string, unknown> | null): string {
  if (!result) {
    return "<undefined>";
  }
  if ("value" in result) {
    const value = result.value;
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  if (typeof result.unserializableValue === "string") {
    return result.unserializableValue;
  }
  return JSON.stringify(result, null, 2);
}

/**
 * 执行 JS
 */
async function doEvaluate() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先选择或创建一个页面");
    return;
  }
  const expression = evaluateExpression.value.trim();
  if (!expression) {
    return;
  }
  pushEvalHistory(expression);
  evaluateLoading.value = true;
  try {
    const result = await cdpEvaluate(selectedTarget.value, expression);
    evaluateResult.value = formatEvalResult(result);
  } catch (error) {
    evaluateResult.value = "求值失败: " + (error as Error).message;
  } finally {
    evaluateLoading.value = false;
  }
}

/* ==================== Storage（Application 面板） ==================== */

/** 存储面板当前分组 */
const storageTab = ref<"cookies" | "local" | "session">(
  readPref<"cookies" | "local" | "session">("app.storageTab", "cookies"),
);
const storageLoading = ref(false);
const storageError = ref("");
const storageCookies = ref<{ name: string; value: string; domain?: string; path?: string; expires?: number; httpOnly?: boolean; secure?: boolean }[]>([]);
const storageLocal = ref<{ key: string; value: string }[]>([]);
const storageSession = ref<{ key: string; value: string }[]>([]);

/** 存储表格关键字过滤 */
const storageKeyword = ref("");

/** 按关键字过滤后的 Cookie */
const visibleCookies = computed(() => {
  const kw = storageKeyword.value.trim().toLowerCase();
  if (!kw) return storageCookies.value;
  return storageCookies.value.filter((c) => `${c.name}=${c.value}${c.domain ?? ""}`.toLowerCase().includes(kw));
});

/** 按关键字过滤后的 localStorage */
const visibleLocal = computed(() => {
  const kw = storageKeyword.value.trim().toLowerCase();
  if (!kw) return storageLocal.value;
  return storageLocal.value.filter((i) => i.key.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw));
});

/** 按关键字过滤后的 sessionStorage */
const visibleSession = computed(() => {
  const kw = storageKeyword.value.trim().toLowerCase();
  if (!kw) return storageSession.value;
  return storageSession.value.filter((i) => i.key.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw));
});

/** 当前存储页签的条数 */
const storageCount = computed(() =>
  storageTab.value === "cookies"
    ? storageCookies.value.length
    : storageTab.value === "local"
      ? storageLocal.value.length
      : storageSession.value.length,
);

/** 时间戳 -> 过期文案 */
function cookieExpiry(expires?: number): string {
  if (!expires || expires <= 0) {
    return "会话";
  }
  return new Date(expires * 1000).toLocaleString();
}

/**
 * 读取存储
 *
 * <p>Cookie 走 REST {@code /ms/cdp/targets/{id}/cookies}（后端已包好
 * {@code Network.getCookies}）；localStorage / sessionStorage 用一次
 * {@code Runtime.evaluate} 把整个 Storage 序列化回来。</p>
 */
async function loadStorage() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
    return;
  }
  storageLoading.value = true;
  storageError.value = "";
  try {
    const cookies = await cdpCookies(selectedTarget.value);
    storageCookies.value = (Array.isArray(cookies) ? cookies : []).map((item) => ({
      name: String(item.name ?? ""),
      value: String(item.value ?? ""),
      domain: String(item.domain ?? ""),
      path: String(item.path ?? ""),
      expires: Number(item.expires ?? 0),
      httpOnly: item.httpOnly === true,
      secure: item.secure === true,
    }));
  } catch (error) {
    storageError.value = "Cookie 读取失败: " + (error as Error).message;
  }
  try {
    const raw = await cdpEvaluate(
      selectedTarget.value,
      `(function(){var dump=function(s){var out=[];for(var i=0;i<s.length;i++){var k=s.key(i);out.push({key:k,value:String(s.getItem(k))})}return out};` +
        `return JSON.stringify({local:dump(localStorage),session:dump(sessionStorage)})})()`,
    );
    // 后端把 Runtime.evaluate 的 result 框架原样透出：{type, value}
    const value = raw && typeof raw === "object" ? (raw as { value?: unknown }).value : raw;
    const text = typeof value === "string" ? value : "";
    const parsed = text
      ? (JSON.parse(text) as { local?: { key: string; value: string }[]; session?: { key: string; value: string }[] })
      : {};
    storageLocal.value = Array.isArray(parsed.local) ? parsed.local : [];
    storageSession.value = Array.isArray(parsed.session) ? parsed.session : [];
  } catch (error) {
    if (!storageError.value) {
      storageError.value = "Web Storage 读取失败: " + (error as Error).message;
    }
  } finally {
    storageLoading.value = false;
  }
}

/** 清空当前存储页签 */
async function clearStorage() {
  if (!selectedTarget.value) {
    return;
  }
  if (storageTab.value === "cookies") {
    storageCookies.value = [];
    ElMessage.info("Cookie 只能逐条删除，清空列表仅影响当前视图");
    return;
  }
  const key = storageTab.value === "local" ? "localStorage" : "sessionStorage";
  try {
    await cdpEvaluate(selectedTarget.value, `${key}.clear()`);
    if (storageTab.value === "local") {
      storageLocal.value = [];
    } else {
      storageSession.value = [];
    }
    ElMessage.success(`${key} 已清空`);
  } catch (error) {
    ElMessage.error("清空失败: " + (error as Error).message);
  }
}

// 视图偏好：改动即落盘，下次进来保持原位。
// 必须放在这里（脚本末尾）：sourceOpen / evaluateOpen / storageTab 在各自的功能段里声明，
// 放到声明之前会在 setup 求值 watch 源时抛 TDZ（Cannot access 'sourceOpen' before initialization），
// 整个调试中心页面因此挂不上。
watch(sourceOpen, (on) => writePref("element.sourceOpen", on));
watch(detailTab, (tab) => writePref("element.detailTab", tab));
watch(netPreserveLog, (on) => writePref("net.preserveLog", on));
watch(netDetailTab, (tab) => writePref("net.detailTab", tab));
watch(netBodyPretty, (on) => writePref("net.pretty", on));
watch(sw8Enabled, (on) => writePref("sw8.enabled", on));
watch(storageTab, (tab) => writePref("app.storageTab", tab));
watch(perfCategories, (list) => writePref("perf.categories", list));
watch(svgAuto, (on) => {
  writePref("svg.auto", on);
  // 重新打开自动获取时立刻补抽一次（当前就在 SVG 页签）
  if (on && pageTab.value === "svg" && selectedTarget.value) {
    void loadSvgs(true);
  }
});
watch(evaluateOpen, (on) => writePref("console.drawerOpen", on));

/* ==================== 全局底栏（Console / Network 抽屉） ==================== */

/**
 * 全页签共用的底部面板
 *
 * <p>元素页签的求值抽屉只服务元素工作流；这个底栏把「看日志 / 看请求」
 * 推广到任意页签：在元素、性能、截屏等页面里也能同屏盯控制台和网络。
 * 面板内容与对应页签同源同过滤（复用 visibleConsole / networkRows），
 * 高度可拖拽并记忆，主区正在看同一块时自动让位给另一块。</p>
 */
type DockPanel = "console" | "network";

/** 底栏面板顺序（入口按钮与内部页签共用） */
const DOCK_PANELS: readonly DockPanel[] = ["console", "network"];

/** 底栏是否展开（记忆上次状态） */
const dockOpen = ref<boolean>(readPref<boolean>("dock.open", false));
/** 底栏当前面板 */
const dockPanel = ref<DockPanel>(readPref<DockPanel>("dock.panel", "console"));
/** 底栏高度（拖拽可调，记忆上次值） */
const dockHeight = ref<number>(readPref<number>("dock.height", 240));

/** 点底栏入口：同面板再点一次 = 收起；换面板 = 展开并切换 */
function toggleDock(panel: DockPanel): void {
  if (dockOpen.value && dockPanel.value === panel) {
    dockOpen.value = false;
    return;
  }
  dockPanel.value = panel;
  dockOpen.value = true;
}

/** 底栏里点了一条请求：跳到网络页签并展开同一条的详情（详情交互仍归网络页签） */
function openNetFromDock(requestId: string): void {
  netDetailId.value = requestId;
  pageTab.value = "network";
}

/** 拖拽底栏高度（同网络详情拖拽的手感），松手记忆 */
let dockResizing = false;
function startDockResize(event: PointerEvent): void {
  dockResizing = true;
  const startY = event.clientY;
  const startHeight = dockHeight.value;
  const onMove = (e: PointerEvent) => {
    if (!dockResizing) return;
    // 往上拖 = 变高，限制在 120 ~ 视口六成之间
    const next = startHeight + (startY - e.clientY);
    dockHeight.value = Math.max(120, Math.min(Math.round(window.innerHeight * 0.6), next));
  };
  const onUp = () => {
    dockResizing = false;
    writePref("dock.height", dockHeight.value);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    document.body.style.userSelect = "";
  };
  document.body.style.userSelect = "none";
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

// 主区正在看 console / network 时，底栏不再重复同一块：自动换成另一块
watch([pageTab, dockOpen], () => {
  if (dockOpen.value && dockPanel.value === pageTab.value) {
    dockPanel.value = pageTab.value === "console" ? "network" : "console";
  }
});
watch(dockOpen, (on) => writePref("dock.open", on));
watch(dockPanel, (p) => writePref("dock.panel", p));

/* ==================== Debugger 断点（WS 透传 Debugger.* 域） ==================== */

/**
 * 按脚本地址 + 行号下断点
 *
 * <p>全部指令走 WS 透传（Debugger.enable / setBreakpointByUrl / removeBreakpoint /
 * resume / step*），后端零改动。断点是目标级会话状态：换目标、停浏览器都会失效，
 * 对应的清理点在 {@code selectTarget} 与 {@code watch(running)}。</p>
 */

/** 一个断点的展示态（setBreakpointByUrl 回执 + 录入参数） */
interface BreakpointEntry {
  /** CDP 断点标识（removeBreakpoint 用） */
  breakpointId: string;
  /** URL 匹配串（按正则匹配脚本地址） */
  url: string;
  /** 行号（1 基，展示用） */
  lineNumber: number;
  /** 条件表达式（空串 = 无条件） */
  condition: string;
  /** 已解析到的位置（脚本可能在断点下发后才加载，靠 breakpointResolved 补） */
  locations: { scriptId: string; lineNumber: number; columnNumber?: number }[];
}

/** Debugger 域开关（enable / disable 是目标级会话状态） */
const debuggerOn = ref(false);
/** 断点列表 */
const breakpoints = ref<BreakpointEntry[]>([]);
/** 录入：脚本地址匹配串 */
const bpUrl = ref("");
/** 录入：行号（1 基） */
const bpLine = ref(1);
/** 录入：条件表达式 */
const bpCondition = ref("");
/** 命中暂停态（Debugger.paused 原始参数；null = 未暂停） */
const pausedState = ref<Record<string, unknown> | null>(null);
/** scriptId -> url（scriptParsed 登记，用于断点 / 栈帧位置展示） */
const scriptSources = ref<Record<string, string>>({});

/** 暂停态的栈帧列表（模板里不做类型体操） */
const pausedFrames = computed<Record<string, unknown>[]>(() => {
  const frames = pausedState.value?.callFrames;
  return Array.isArray(frames) ? (frames as Record<string, unknown>[]) : [];
});

/** 暂停命中的断点数 */
const pausedHitCount = computed(() => {
  const hits = pausedState.value?.hitBreakpoints;
  return Array.isArray(hits) ? hits.length : 0;
});

/** 暂停原因 -> 中文 */
function pauseReason(reason: string): string {
  switch (reason) {
    case "breakpoint":
      return "断点命中";
    case "exception":
      return "异常暂停";
    case "assert":
      return "断言失败";
    case "debugCommand":
      return "debugger 语句";
    case "promiseRejection":
      return "Promise 拒绝";
    case "OOM":
      return "内存溢出";
    case "XHR":
      return "XHR/fetch 断点";
    case "EventListener":
      return "事件监听器暂停";
    case "DOM":
      return "DOM 变更暂停";
    default:
      return reason || "暂停";
  }
}

/** 栈帧的脚本地址（优先 scriptParsed 登记，回退帧自带的 url） */
function frameUrl(frame: Record<string, unknown>): string {
  const loc = (frame.location ?? {}) as Record<string, unknown>;
  const scriptId = String(loc.scriptId ?? "");
  return String(frame.url ?? scriptSources.value[scriptId] ?? "");
}

/** 栈帧展示名（顶层脚本 / 匿名函数没有函数名） */
function frameName(frame: Record<string, unknown>): string {
  return String(frame.functionName ?? "") || "(anonymous)";
}

/** 栈帧行号（CDP 0 基，展示 1 基） */
function frameLine(frame: Record<string, unknown>): number {
  const loc = (frame.location ?? {}) as Record<string, unknown>;
  return Number(loc.lineNumber ?? 0) + 1;
}

/** 确保 Debugger 域已启用（未启用就先 enable 一次） */
async function ensureDebuggerOn(): Promise<boolean> {
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    ElMessage.warning("WS 通道未就绪或未选择目标");
    return false;
  }
  if (debuggerOn.value) {
    return true;
  }
  try {
    await client.call("Debugger.enable", {}, targetId);
    debuggerOn.value = true;
    return true;
  } catch (error) {
    ElMessage.error("启用 Debugger 失败: " + (error as Error).message);
    return false;
  }
}

/** 启用 / 关闭 Debugger 域 */
async function toggleDebugger(): Promise<void> {
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    ElMessage.warning("WS 通道未就绪或未选择目标");
    return;
  }
  try {
    if (debuggerOn.value) {
      await client.call("Debugger.disable", {}, targetId);
      resetDebugger();
      ElMessage.info("Debugger 已关闭");
    } else {
      await client.call("Debugger.enable", {}, targetId);
      debuggerOn.value = true;
      ElMessage.success("Debugger 已启用");
    }
  } catch (error) {
    ElMessage.error("Debugger 操作失败: " + (error as Error).message);
  }
}

/** 按录入的 URL + 行号下一个断点（Debugger.setBreakpointByUrl） */
async function addBreakpoint(): Promise<void> {
  const targetId = selectedTarget.value;
  const url = bpUrl.value.trim();
  if (!url) {
    ElMessage.warning("请填写脚本地址匹配串（按正则匹配，如 app\\.js）");
    return;
  }
  if (!(await ensureDebuggerOn())) {
    return;
  }
  const params: Record<string, unknown> = {
    urlRegex: url,
    lineNumber: Math.max(0, Math.floor(bpLine.value || 1) - 1),
  };
  const condition = bpCondition.value.trim();
  if (condition) {
    params.condition = condition;
  }
  try {
    const res = (await client.call("Debugger.setBreakpointByUrl", params, targetId)) as {
      breakpointId?: string;
      locations?: Record<string, unknown>[];
    } | null;
    const breakpointId = String(res?.breakpointId ?? "");
    if (!breakpointId) {
      ElMessage.error("断点下发失败：没有返回断点标识");
      return;
    }
    breakpoints.value.push({
      breakpointId,
      url,
      lineNumber: Math.max(1, Math.floor(bpLine.value || 1)),
      condition,
      locations: (res?.locations ?? []).map((l) => ({
        scriptId: String(l.scriptId ?? ""),
        lineNumber: Number(l.lineNumber ?? 0),
        columnNumber: l.columnNumber === undefined ? undefined : Number(l.columnNumber),
      })),
    });
    ElMessage.success(res?.locations?.length ? "断点已下发并解析到位置" : "断点已下发（脚本加载后自动解析位置）");
    bpCondition.value = "";
  } catch (error) {
    ElMessage.error("断点下发失败: " + (error as Error).message);
  }
}

/** 移除一个断点（Debugger.removeBreakpoint） */
async function removeBreakpoint(bp: BreakpointEntry): Promise<void> {
  breakpoints.value = breakpoints.value.filter((b) => b.breakpointId !== bp.breakpointId);
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    return;
  }
  try {
    await client.call("Debugger.removeBreakpoint", { breakpointId: bp.breakpointId }, targetId);
  } catch {
    // 列表里已经摘掉了；指令失败（如目标刚关闭）不阻塞界面
  }
}

/** 移除全部断点 */
async function clearBreakpoints(): Promise<void> {
  const list = [...breakpoints.value];
  breakpoints.value = [];
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    return;
  }
  for (const bp of list) {
    try {
      await client.call("Debugger.removeBreakpoint", { breakpointId: bp.breakpointId }, targetId);
    } catch {
      // 尽力而为：单个移除失败不影响其余
    }
  }
}

/** 恢复执行（Debugger.resume） */
async function resumeExecution(): Promise<void> {
  const targetId = selectedTarget.value;
  pausedState.value = null;
  if (!wsReady() || !targetId) {
    return;
  }
  try {
    await client.call("Debugger.resume", {}, targetId);
  } catch (error) {
    ElMessage.error("恢复执行失败: " + (error as Error).message);
  }
}

/** 单步（over / into / out）：步进后的新暂停由 paused 事件驱动 */
async function debuggerStep(kind: "stepOver" | "stepInto" | "stepOut"): Promise<void> {
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    return;
  }
  try {
    await client.call(`Debugger.${kind}`, {}, targetId);
  } catch (error) {
    ElMessage.error("步进失败: " + (error as Error).message);
  }
}

/** Debugger.paused：记下暂停态并落一条变化 tag */
function onDebuggerPaused(params: Record<string, unknown>): void {
  pausedState.value = params;
  appendChange(`断点命中：${pauseReason(String(params.reason ?? ""))}，${pausedFrames.value.length} 层栈帧`);
}

/** Debugger.breakpointResolved：把解析到的位置回填到对应断点 */
function onBreakpointResolved(params: Record<string, unknown>): void {
  const breakpointId = String(params.breakpointId ?? "");
  const loc = (params.location ?? {}) as Record<string, unknown>;
  const hit = breakpoints.value.find((b) => b.breakpointId === breakpointId);
  if (!hit) {
    return;
  }
  const entry = {
    scriptId: String(loc.scriptId ?? ""),
    lineNumber: Number(loc.lineNumber ?? 0),
    columnNumber: loc.columnNumber === undefined ? undefined : Number(loc.columnNumber),
  };
  if (!hit.locations.some((l) => l.scriptId === entry.scriptId && l.lineNumber === entry.lineNumber)) {
    hit.locations.push(entry);
  }
}

/** 浏览器停止 / 目标关闭后清掉 Debugger 态（断点随会话消失） */
function resetDebugger(): void {
  debuggerOn.value = false;
  breakpoints.value = [];
  pausedState.value = null;
  xhrBreakpoints.value = [];
  eventBreakpoints.value = [];
}

/* ---------- 黑盒脚本（Debugger.setBlackboxPatterns：单步 / 解析时跳过第三方脚本） ---------- */

/** 黑盒匹配串（逗号 / 空格分隔的正则；空 = 不黑盒） */
const blackboxInput = ref<string>(readPref<string>("dbg.blackbox", ""));

/**
 * 应用 / 清除黑盒脚本列表
 *
 * <p>黑盒的脚本不参与单步与断点解析，用于排除 node_modules / 第三方 CDN。
 * 传空列表 = 清除。Debugger 域未启用时该命令会报错，按失败提示处理。</p>
 */
async function applyBlackbox() {
  writePref("dbg.blackbox", blackboxInput.value);
  const targetId = selectedTarget.value;
  if (!wsReady() || !targetId) {
    ElMessage.warning("实时通道未连接，黑盒暂未生效");
    return;
  }
  const patterns = blackboxInput.value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    await client.call("Debugger.setBlackboxPatterns", { patterns }, targetId);
    ElMessage.success(patterns.length ? `黑盒已应用：${patterns.length} 条` : "已清除黑盒");
  } catch (e) {
    ElMessage.error("设置黑盒失败: " + (e as Error).message);
  }
}

/* ---------- DOMDebugger：XHR/fetch 断点 + 事件监听器断点 ---------- */

/**
 * XHR / fetch 断点列表（URL 包含匹配，命中即暂停）
 *
 * <p>会话内有效：切目标 / 重启浏览器后随 Debugger 会话一起消失（与脚本断点同口径）。</p>
 */
const xhrBreakpoints = ref<string[]>([]);
/** 录入：XHR 断点 URL 串 */
const xhrBpInput = ref("");

/** 常用 DOM 事件（事件监听器断点候选项） */
const EVENT_BP_OPTIONS = ["click", "dblclick", "mousedown", "mouseup", "keydown", "keyup", "input", "change", "submit", "focus", "blur", "touchstart", "load", "error", "message"];

/** 事件监听器断点列表（任一目标事件触发时暂停；会话内有效） */
const eventBreakpoints = ref<string[]>([]);
/** 录入：事件名 */
const eventBpInput = ref("click");

/** 加 XHR / fetch 断点（DOMDebugger.setXHRBreakpoint，URL 包含匹配） */
async function addXhrBreakpoint() {
  const url = xhrBpInput.value.trim();
  const targetId = selectedTarget.value;
  if (!url || !targetId) {
    return;
  }
  if (xhrBreakpoints.value.includes(url)) {
    ElMessage.warning("该 URL 断点已存在");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("实时通道未连接，无法添加断点");
    return;
  }
  try {
    await client.call("DOMDebugger.setXHRBreakpoint", { url }, targetId);
    xhrBreakpoints.value.push(url);
    xhrBpInput.value = "";
    appendChange(`XHR 断点：${url}`, targetId);
  } catch (e) {
    ElMessage.error("添加 XHR 断点失败: " + (e as Error).message);
  }
}

/** 移除一条 XHR 断点（远端尽力移除，本地必删） */
async function removeXhrBreakpoint(url: string) {
  const targetId = selectedTarget.value;
  if (wsReady() && targetId) {
    await client.call("DOMDebugger.removeXHRBreakpoint", { url }, targetId).catch(() => {});
  }
  xhrBreakpoints.value = xhrBreakpoints.value.filter((u) => u !== url);
}

/** 清空全部 XHR 断点 */
function clearXhrBreakpoints() {
  for (const url of [...xhrBreakpoints.value]) {
    void removeXhrBreakpoint(url);
  }
}

/** 加事件监听器断点（DOMDebugger.setEventListenerBreakpoint） */
async function addEventBreakpoint() {
  const eventName = eventBpInput.value.trim();
  const targetId = selectedTarget.value;
  if (!eventName || !targetId) {
    return;
  }
  if (eventBreakpoints.value.includes(eventName)) {
    ElMessage.warning("该事件断点已存在");
    return;
  }
  if (!wsReady()) {
    ElMessage.warning("实时通道未连接，无法添加断点");
    return;
  }
  try {
    await client.call("DOMDebugger.setEventListenerBreakpoint", { eventName }, targetId);
    eventBreakpoints.value.push(eventName);
    appendChange(`事件断点：${eventName}`, targetId);
  } catch (e) {
    ElMessage.error("添加事件断点失败: " + (e as Error).message);
  }
}

/** 移除一条事件监听器断点 */
async function removeEventBreakpoint(eventName: string) {
  const targetId = selectedTarget.value;
  if (wsReady() && targetId) {
    await client.call("DOMDebugger.removeEventListenerBreakpoint", { eventName }, targetId).catch(() => {});
  }
  eventBreakpoints.value = eventBreakpoints.value.filter((e) => e !== eventName);
}

/** 清空全部事件监听器断点 */
function clearEventBreakpoints() {
  for (const eventName of [...eventBreakpoints.value]) {
    void removeEventBreakpoint(eventName);
  }
}

/* ==================== 生命周期 ==================== */

onMounted(async () => {
  // 先把「运行状态」和「目标列表」对完，再按记住的页签补载内容：
  // 只加载目标不等状态，running 还是空，DOM / 截屏都会被守卫挡掉。
  await Promise.all([reloadStatus(), reloadTargets()]);
  void ensureElementReady();
  // 指令通道（WS）+ 事件通道（全局 SSE）双通道，职责分离
  connectWs();
  connectSse();
  uptimeTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  // 右键菜单：点别处 / Esc / 缩放都要收起（元素树菜单 + 网络菜单一起管）
  window.addEventListener("click", closeContextMenu);
  window.addEventListener("click", closeNetMenu);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("resize", closeNetMenu);
  window.addEventListener("keydown", onGlobalKeydown);
});

function onGlobalKeydown(e: KeyboardEvent) {
  // Ctrl+K / Cmd+K：命令面板（全局可达，输入框里也能呼出）
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    if (cmdOpen.value) closeCmdPalette();
    else openCmdPalette();
    return;
  }
  if (e.key === "Escape") {
    closeContextMenu();
    closeNetMenu();
    if (cmdOpen.value) closeCmdPalette();
  }
}

onBeforeUnmount(() => {
  disconnectWs();
  disconnectSse();
  window.removeEventListener("click", closeContextMenu);
  window.removeEventListener("click", closeNetMenu);
  window.removeEventListener("resize", closeContextMenu);
  window.removeEventListener("resize", closeNetMenu);
  window.removeEventListener("keydown", onGlobalKeydown);
  stageObserver?.disconnect();
  clearInterval(uptimeTimer);
  clearTimeout(perfFallbackTimer);
  clearTimeout(loadingWatchdog);
  clearTimeout(svgAutoTimer);
  void stopLive();
  if (pickTimer) {
    clearInterval(pickTimer);
    pickTimer = undefined;
  }
});

/* ==================== 浏览器导航历史 / 加载进度 ==================== */

/**
 * 后退 / 前进与地址栏进度条的状态源。
 *
 * <p>导航历史走 CDP 的 {@code Page.getNavigationHistory}，在主框架提交导航、
 * 加载完成、切换目标三个时机刷新；加载进度由同一批事件驱动（零轮询），
 * 另设 20s 看门狗兜底「只发导航、不见 load 事件」的异常页面。</p>
 */
const navHistory = ref<{ index: number; size: number } | null>(null);

/** 能否后退 / 前进（无历史数据时按钮置灰） */
const canGoBack = computed(() => (navHistory.value?.index ?? 0) > 0);
const canGoForward = computed(() => {
  const h = navHistory.value;
  return !!h && h.index < h.size - 1;
});

/** 当前选中目标是否正在加载（壳层地址栏进度条） */
const pageLoading = ref(false);

let loadingWatchdog: ReturnType<typeof setTimeout> | undefined;

/** 进度条看门狗：超过 20s 没等到加载完成事件就强制收起，避免永远转圈 */
function armLoadingWatchdog(): void {
  clearTimeout(loadingWatchdog);
  loadingWatchdog = setTimeout(() => {
    pageLoading.value = false;
  }, 20000);
}

/** 拉一次当前目标的导航历史；浏览器未启动 / 目标刚关闭时静默置空 */
async function refreshNavHistory(): Promise<void> {
  const targetId = selectedTarget.value;
  if (!targetId || !running.value) {
    navHistory.value = null;
    return;
  }
  try {
    const res = (await client.call("Page.getNavigationHistory", {}, targetId)) as {
      currentIndex?: number;
      entries?: unknown[];
    } | null;
    navHistory.value = { index: Number(res?.currentIndex ?? 0), size: Number(res?.entries?.length ?? 0) };
  } catch {
    navHistory.value = null;
  }
}

/** 沿历史移动：delta = -1 后退 / +1 前进（Page.navigateToHistoryEntry） */
async function goHistory(delta: -1 | 1): Promise<void> {
  const targetId = selectedTarget.value;
  if (!targetId) {
    return;
  }
  try {
    const res = (await client.call("Page.getNavigationHistory", {}, targetId)) as {
      currentIndex?: number;
      entries?: Array<{ id?: string | number }>;
    } | null;
    const index = Number(res?.currentIndex ?? 0) + delta;
    const entryId = res?.entries?.[index]?.id;
    if (entryId === undefined || entryId === null) {
      return;
    }
    pageLoading.value = true;
    armLoadingWatchdog();
    await client.call("Page.navigateToHistoryEntry", { entryId }, targetId);
  } catch (error) {
    pageLoading.value = false;
    ElMessage.error((delta < 0 ? "后退" : "前进") + "失败: " + (error as Error).message);
  }
}

const goBack = (): Promise<void> => goHistory(-1);
const goForward = (): Promise<void> => goHistory(1);

/** 真正的页面重载（Page.reload），区别于「↻ 画面」的截屏刷新 */
async function reloadPage(): Promise<void> {
  const targetId = selectedTarget.value;
  if (!targetId) {
    return;
  }
  pageLoading.value = true;
  armLoadingWatchdog();
  try {
    await client.call("Page.reload", { ignoreCache: false }, targetId);
  } catch (error) {
    pageLoading.value = false;
    ElMessage.error("重载失败: " + (error as Error).message);
  }
}

/** 供壳层快捷键（1–7）切换页签 */
function setPageTab(name: string): void {
  if (tabs.value.some((t) => t.name === name)) {
    pageTab.value = name as PageTab;
  }
}

/** 供壳层快捷键（Ctrl+`）开 / 关求值抽屉 */
function toggleEvaluate(): void {
  evaluateOpen.value = !evaluateOpen.value;
}

/** 页签顺序（壳层快捷键 1–8 的映射表） */
const tabNames = computed<string[]>(() => tabs.value.map((t) => t.name));

/* ==================== 命令面板（Ctrl+K） ==================== */

/** 一条可执行命令：label 展示，group 分组角标，keywords 参与搜索 */
interface CmdItem {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  run: () => void | Promise<void>;
}

const cmdOpen = ref(false);
const cmdQuery = ref("");
const cmdIndex = ref(0);
const cmdInputRef = ref<HTMLInputElement | null>(null);

/** 节流预设的命令入口（复用工具行的 applyThrottle） */
function setThrottlePreset(value: "none" | "fast3g" | "slow3g" | "offline") {
  netThrottle.value = value;
  void applyThrottle();
}

/** 全部命令（顺序即展示顺序） */
const CMD_ITEMS: CmdItem[] = [
  { id: "tab-elements", label: "切换到「元素」页签", group: "页签", run: () => (pageTab.value = "elements") },
  { id: "tab-console", label: "切换到「控制台」页签", group: "页签", run: () => (pageTab.value = "console") },
  { id: "tab-debugger", label: "切换到「断点」页签", group: "页签", run: () => (pageTab.value = "debugger") },
  { id: "tab-network", label: "切换到「网络」页签", group: "页签", run: () => (pageTab.value = "network") },
  { id: "tab-performance", label: "切换到「性能」页签", group: "页签", run: () => (pageTab.value = "performance") },
  { id: "tab-svg", label: "切换到「SVG」页签", group: "页签", run: () => (pageTab.value = "svg") },
  { id: "tab-app", label: "切换到「应用」页签", group: "页签", run: () => (pageTab.value = "app") },
  { id: "tab-screenshot", label: "切换到「截屏」页签", group: "页签", run: () => (pageTab.value = "screenshot") },
  { id: "browser-start", label: "启动调试浏览器", group: "浏览器", run: () => startBrowser() },
  { id: "browser-stop", label: "停止调试浏览器", group: "浏览器", run: () => stopBrowser() },
  { id: "page-new", label: "新建页面…", group: "浏览器", keywords: "open create", run: () => openCreatePage() },
  { id: "page-reload", label: "刷新当前页面", group: "浏览器", keywords: "reload", run: () => reloadPage() },
  { id: "page-back", label: "后退", group: "浏览器", keywords: "back history", run: () => goBack() },
  { id: "page-forward", label: "前进", group: "浏览器", keywords: "forward history", run: () => goForward() },
  { id: "shot", label: "截屏（当前视口）", group: "截屏", run: () => doScreenshot() },
  { id: "shot-full", label: "全长截屏", group: "截屏", keywords: "fullpage", run: () => doScreenshot(true) },
  { id: "export-pdf", label: "导出 PDF（printToPDF）", group: "截屏", keywords: "print", run: () => exportPdf() },
  { id: "export-mhtml", label: "导出 MHTML 存档", group: "截屏", keywords: "capture snapshot", run: () => exportMhtml() },
  { id: "export-har", label: "导出网络 HAR", group: "网络", run: () => exportHar() },
  { id: "net-clear", label: "清空网络日志", group: "网络", run: () => clearNetwork() },
  { id: "throttle-off", label: "节流：不限速", group: "网络", run: () => setThrottlePreset("none") },
  { id: "throttle-fast3g", label: "节流：Fast 3G", group: "网络", run: () => setThrottlePreset("fast3g") },
  { id: "throttle-slow3g", label: "节流：Slow 3G", group: "网络", run: () => setThrottlePreset("slow3g") },
  { id: "throttle-offline", label: "节流：离线", group: "网络", run: () => setThrottlePreset("offline") },
  {
    id: "emu-panel",
    label: "开 / 关设备仿真面板",
    group: "网络",
    keywords: "emulation device ua cpu",
    run: () => {
      pageTab.value = "network";
      emuPanelOpen.value = !emuPanelOpen.value;
    },
  },
  {
    id: "intercept-panel",
    label: "开 / 关请求拦截面板",
    group: "网络",
    keywords: "fetch mock block",
    run: () => {
      pageTab.value = "network";
      interceptPanelOpen.value = !interceptPanelOpen.value;
    },
  },
  { id: "perf-start", label: "开始性能录制（Tracing）", group: "性能", run: () => startPerf() },
  { id: "perf-stop", label: "停止性能录制", group: "性能", run: () => stopPerf() },
  { id: "perf-export", label: "导出 trace JSON", group: "性能", run: () => exportPerf() },
  { id: "cpu-start", label: "开始 CPU 采样（Profiler）", group: "性能", keywords: "profile", run: () => startCpuProfile() },
  { id: "cpu-stop", label: "停止 CPU 采样", group: "性能", keywords: "profile", run: () => stopCpuProfile() },
  { id: "heap-start", label: "开始堆分配采样（HeapProfiler）", group: "性能", keywords: "memory allocation", run: () => startHeapProfile() },
  { id: "heap-stop", label: "停止堆分配采样", group: "性能", keywords: "memory allocation", run: () => stopHeapProfile() },
  { id: "heap-gc", label: "触发一次垃圾回收（GC）", group: "性能", keywords: "memory", run: () => triggerGc() },
  { id: "console-clear", label: "清空控制台", group: "控制台", run: () => clearConsole() },
  { id: "dom-refresh", label: "刷新 DOM 树", group: "元素", run: () => loadElementTree() },
  { id: "storage-load", label: "读取存储（Cookie / Web Storage）", group: "应用", run: () => loadStorage() },
  { id: "dock-console", label: "底栏：开 / 关 Console 抽屉", group: "视图", run: () => toggleDock("console") },
  { id: "dock-network", label: "底栏：开 / 关 Network 抽屉", group: "视图", run: () => toggleDock("network") },
];

/** 按关键字过滤（空串返回全部） */
const cmdResults = computed(() => {
  const q = cmdQuery.value.trim().toLowerCase();
  if (!q) return CMD_ITEMS;
  return CMD_ITEMS.filter((c) => `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q));
});

watch(cmdQuery, () => {
  cmdIndex.value = 0;
});

function openCmdPalette() {
  cmdOpen.value = true;
  cmdQuery.value = "";
  cmdIndex.value = 0;
  void nextTick(() => cmdInputRef.value?.focus());
}

function closeCmdPalette() {
  cmdOpen.value = false;
}

/** 面板内键盘导航：↑↓ 换选中项，回车执行，Esc 关闭 */
function cmdKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    const n = cmdResults.value.length;
    if (n) cmdIndex.value = (cmdIndex.value + 1) % n;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const n = cmdResults.value.length;
    if (n) cmdIndex.value = (cmdIndex.value - 1 + n) % n;
  } else if (e.key === "Enter") {
    e.preventDefault();
    const item = cmdResults.value[cmdIndex.value];
    if (item) void runCmd(item);
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeCmdPalette();
  }
}

/** 执行一条命令：先关面板再跑，命令自己负责提示 */
async function runCmd(item: CmdItem) {
  closeCmdPalette();
  await item.run();
}

// 浏览器启停联动：启动后补拉一次历史；停止时历史 / 加载态全部复位
watch(running, (on) => {
  if (on) {
    void refreshNavHistory();
    // 浏览器重启后旧会话全没了，拦截 / 节流 / 设备仿真若开着就到新会话上重挂一次
    void applyInterceptRules();
    if (netThrottle.value !== "none") {
      void applyThrottle();
    }
    void applyDeviceEmulation(true);
  } else {
    navHistory.value = null;
    pageLoading.value = false;
    clearTimeout(loadingWatchdog);
    // 浏览器停了：断点随调试会话一起消失
    resetDebugger();
    consoleGroupDepth = 0;
    expandedStacks.value = {};
    // CPU / 堆采样会话随浏览器销毁
    cpuProfiling.value = false;
    heapProfiling.value = false;
    cpuProfile.value = null;
    cpuProfileRaw.value = null;
    heapProfile.value = null;
    heapProfileRaw.value = null;
  }
});

/* ==================== 宿主壳层能力面 ==================== */

/**
 * 浏览器式壳层（{@code @pages/debug} 的 BrowserWorkbench）通过模板 ref 驱动本工作台。
 *
 * <p>顶部地址栏、浏览器启停、sw8 开关等「浏览器级」控件由壳层持有并渲染；
 * 目标选择、面板内容、实时事件等页面内部逻辑仍归本组件。这里只暴露
 * 状态与方法，不做二次封装，壳层读到的就是工作台本身的响应式状态
 * （模板 ref 经 proxyRefs 解包，{@code wb.status} 直接是 {@code CdpStatus | null}）。</p>
 */
defineExpose({
  status,
  statusLoading,
  running,
  stateLabel,
  stateTone,
  wsConnected,
  sseConnected,
  sw8Enabled,
  toggleSw8,
  changeTagCount,
  reloadStatus,
  reloadTargets,
  openCreatePage,
  startBrowser,
  stopBrowser,
  activeTarget,
  doNavigate,
  refreshStage,
  selectTarget,
  // 浏览器导航（后退 / 前进 / 重载）与加载进度
  canGoBack,
  canGoForward,
  goBack,
  goForward,
  reloadPage,
  pageLoading,
  // 快捷键支撑：页签顺序表、切页签、求值抽屉开关
  tabNames,
  setPageTab,
  toggleEvaluate,
});
</script>

<template>
  <div class="debug-page">
    <div class="debug-body">
      <!-- ==================== 左侧：调试目标栏（可折叠） ==================== -->
      <aside :class="['debug-rail', { 'is-collapsed': railCollapsed }]">
        <!-- 折叠态：一条竖条，只留计数与展开按钮 -->
        <div v-if="railCollapsed" class="debug-railstrip">
          <button class="debug-railstrip__count" title="展开目标栏" @click="toggleRail">
            <b>{{ visibleTargets.length }}</b><span>/{{ targets.length }}</span>
          </button>
          <span class="debug-railstrip__dots">
            <i class="is-on" :title="`页面 ${targets.filter((t) => t.type === 'page').length}`" />
            <i class="is-off" :title="`其它 ${targets.filter((t) => t.type !== 'page').length}`" />
          </span>
          <span class="debug-railstrip__gap" />
          <button class="debug-railstrip__toggle" title="展开目标栏" @click="toggleRail">»</button>
        </div>

        <template v-else>
          <!-- 轨道头：标题 + 计数 + 工具栏 -->
          <div class="debug-railhd">
            <span class="debug-railhd__title">调试目标</span>
            <span class="debug-railhd__n">{{ visibleTargets.length }}<i>/{{ targets.length }}</i></span>
            <span class="debug-railhd__spacer" />
            <button class="debug-rail__tool" title="刷新目标列表" :disabled="statusLoading" @click="reloadTargets">
              ↻
            </button>
            <button class="debug-rail__tool is-primary" title="新建页面" :disabled="!running" @click="openCreatePage">
              +
            </button>
            <button class="debug-rail__tool" title="收起目标栏" @click="toggleRail">«</button>
          </div>

          <!-- 搜索 -->
          <div class="debug-railhd__search">
            <input v-model="targetKeyword" class="debug-input debug-input--block" placeholder="搜索标题 / 地址" />
          </div>

          <!-- 类型筛选：一条下拉，替代整行胶囊（目标类型通常只有 page / iframe / service_worker 几种） -->
          <div class="debug-railfilters">
            <select v-model="targetTypeFilter" class="debug-input debug-input--block" aria-label="目标类型筛选">
              <option v-for="opt in targetTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}（{{ opt.count }}）
              </option>
            </select>
          </div>

          <!-- 目标列表：滚动分页（全量留内存、只挂载前 railLimit 条，触底追加） -->
          <div ref="railListRef" class="debug-tlist" @scroll="onRailScroll">
            <button
              v-for="t in pagedTargets"
              :key="t.id"
              :class="['debug-target', { 'is-active': t.id === selectedTarget }]"
              @click="selectTarget(t.id)"
            >
              <img
                v-if="faviconUrl(t)"
                class="debug-target__ico"
                :src="faviconUrl(t)"
                alt=""
                @error="onFaviconError(t.id)"
              />
              <i v-else class="debug-target__ico debug-target__ico--fallback">◈</i>
              <span class="debug-target__body">
                <span class="debug-target__title">{{ targetTitle(t) }}</span>
                <span class="debug-target__url" :title="t.url">{{ t.url || t.id }}</span>
              </span>
              <span class="debug-target__type">{{ t.type || "other" }}</span>
              <span class="debug-target__close" title="关闭页面" @click.stop="closePage(t.id)">×</span>
            </button>

            <button
              v-if="railHiddenCount > 0"
              type="button"
              style="width: 100%; padding: 8px; border: 0; background: transparent; color: inherit; opacity: .65; font-size: 12px; text-align: center; cursor: pointer;"
              @click="loadMoreRail"
            >
              还有 {{ railHiddenCount }} 条 · 点击加载更多
            </button>

            <div v-if="!visibleTargets.length" class="debug-empty debug-empty--rail">
              <b>{{ targets.length ? "没有符合条件的目标" : "还没有目标" }}</b>
              <span v-if="targets.length">换个关键字或类型试试</span>
              <span v-else>启动浏览器后，页面 / SW / iframe 会列在这里</span>
            </div>
          </div>

          <!-- 轨道脚：引擎信息 + 折叠 -->
          <div class="debug-raiffoot">
            <div class="debug-engine">
              <span class="debug-engine__k">端口</span>
              <span class="debug-engine__v">{{ status?.port ?? "—" }}</span>
              <span class="debug-engine__k">运行</span>
              <span class="debug-engine__v">{{ uptime }}</span>
              <span class="debug-engine__k">端点</span>
              <span class="debug-engine__v debug-engine__v--sm" :title="status?.endpoint">
                {{ status?.endpoint || "—" }}
              </span>
            </div>
          </div>
        </template>
      </aside>

      <!-- ==================== 右侧：DevTools 工作区 ==================== -->
      <section class="debug-main">
        <div class="debug-tabs">
          <button
            v-for="t in tabs"
            :key="t.name"
            :class="['debug-tab', { 'is-active': pageTab === t.name }]"
            :aria-selected="pageTab === t.name"
            @click="pageTab = t.name"
          >
            {{ t.label }}<span v-if="t.count" class="debug-count">{{ t.count }}</span>
          </button>
          <span class="debug-tabs__spacer" />
          <span class="debug-tabs__site" :title="activeUrl || '未选择目标'">
            <img
              v-if="activeTarget && faviconUrl(activeTarget)"
              :src="faviconUrl(activeTarget)"
              alt=""
              @error="onFaviconError(activeTarget.id)"
            />
            <i v-else class="debug-tabs__ico debug-tabs__ico--fallback">◈</i>
            <span class="debug-tabs__url">{{ activeUrl || "未选择目标" }}</span>
          </span>
          <span v-if="stageLive" class="debug-tabs__live"><i class="debug-dot" />实时</span>
          <!-- 全局底栏入口：任意页签都能把 Console / Network 拉到屏幕底部同屏看 -->
          <span class="debug-dock__switch" title="在底部打开面板，与当前页签同屏（再点一次收起）">
            <button
              v-for="p in DOCK_PANELS"
              :key="p"
              :class="['debug-dock__switchb', { 'is-active': dockOpen && dockPanel === p }]"
              @click="toggleDock(p)"
            >
              {{ p === "console" ? "Console" : "Network" }}
            </button>
          </span>
          <button class="debug-tabs__cmdk" title="命令面板（Ctrl+K）" @click="openCmdPalette">⌘ 命令</button>
        </div>

        <!-- ---------- 元素工具行 ---------- -->
        <div v-if="pageTab === 'elements'" class="debug-tool">
          <button class="debug-btn debug-btn--sm" :disabled="elementLoading" @click="loadElementTree()">
            {{ elementLoading ? "读取中…" : "刷新 DOM" }}
          </button>
          <button
            :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': picking }]"
            :disabled="!selectedTarget"
            @click="startPickNode"
          >
            {{ picking ? "点选取消" : "页内选元素" }}
          </button>
          <button class="debug-btn debug-btn--sm" :disabled="!elementTree" @click="collapseAll">折叠全部</button>
          <span class="debug-tool__divider" />
          <button :class="['debug-btn', 'debug-btn--sm', { 'is-active': stageOpen }]" @click="stageOpen = !stageOpen">
            {{ stageOpen ? "收起画面" : "显示画面" }}
          </button>
          <button class="debug-btn debug-btn--sm" :disabled="!selectedTarget" @click="refreshStage">截屏</button>
          <button
            :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': livePageOn }]"
            :disabled="!selectedTarget"
            title="经服务端反向代理打开真实页面：可点击、可输入，与无头浏览器共享登录态"
            @click="toggleLivePage"
          >
            {{ livePageOn ? "关闭实时页面" : "实时页面" }}
          </button>
          <span class="debug-sitebar__seg">
            <button :class="['debug-sitebar__segb', { 'is-active': stageLayout === 'left' }]" title="画面在左，DOM 与样式在右" @click="stageLayout = 'left'">左右</button>
            <button :class="['debug-sitebar__segb', { 'is-active': stageLayout === 'top' }]" title="画面在上方" @click="stageLayout = 'top'">上下</button>
          </span>
          <span class="debug-tool__divider" />
          <button :class="['debug-btn', 'debug-btn--sm', { 'is-active': sourceOpen }]" :disabled="!selectedTarget" @click="toggleSourcePanel">
            页面 HTML
          </button>
          <span class="debug-tool__spacer" />
          <span v-if="domDirty" class="debug-pill debug-pill--warn" title="页面有变化，DOM 是快照">
            <i class="debug-dot" />页面已变化
          </span>
          <span class="debug-tool__hint">
            {{
              picking
                ? "在页面里点一个元素，Esc 取消"
                : elementTree
                  ? `${elementNodeCount} 个节点 · 快照，页面改动后点刷新`
                  : "读取当前页面的节点树"
            }}
          </span>
        </div>

        <!-- ---------- 控制台工具行 ---------- -->
        <div v-else-if="pageTab === 'console'" class="debug-tool">
          <button
            v-for="opt in levelOptions"
            :key="opt.value"
            :class="['debug-chip', { 'is-active': levelFilter === opt.value }]"
            @click="levelFilter = opt.value"
          >
            {{ opt.label }}<span class="debug-chip__n">{{ opt.count }}</span>
          </button>
          <span class="debug-tool__spacer" />
          <label class="debug-tool__switch" title="网页 DOM / 路由 / 网络变化都会输出到这里">
            <input v-model="watchEnabled" type="checkbox" /> 变化监视
          </label>
          <input v-model="searchText" class="debug-input debug-input--search" placeholder="过滤消息" />
          <button class="debug-btn debug-btn--sm" @click="clearConsole">清空</button>
        </div>

        <!-- ---------- 网络工具行 ---------- -->
        <div v-else-if="pageTab === 'network'" class="debug-tool">
          <label class="debug-tool__switch" title="切换目标时不清空请求">
            <input v-model="netPreserveLog" type="checkbox" /> 保留日志
          </label>
          <span class="debug-tool__divider" />
          <button
            v-for="opt in netTypeOptions"
            :key="opt.value"
            :class="['debug-chip', { 'is-active': netTypeFilter === opt.value }]"
            @click="netTypeFilter = opt.value"
          >
            {{ opt.label }}<span class="debug-chip__n">{{ opt.count }}</span>
          </button>
          <span class="debug-tool__spacer" />
          <input v-model="searchText" class="debug-input debug-input--search" placeholder="过滤地址 / 方法 / 状态" />
          <span class="debug-tool__hint">
            {{ netSummary.count }} 条 · {{ fmtSize(netSummary.bytes) }}<template v-if="netSummary.failed"> · {{ netSummary.failed }} 失败</template>
          </span>
          <button class="debug-btn debug-btn--sm" :disabled="!networkRows.length" title="把当前过滤后的请求导出为 HAR 1.2 文件" @click="exportHar">
            导出 HAR
          </button>
          <label class="debug-tool__switch" title="模拟弱网（Network.emulateNetworkConditions，目标级会话）">
            节流
            <select v-model="netThrottle" class="debug-input debug-input--throttle" @change="applyThrottle">
              <option value="none">不限速</option>
              <option value="fast3g">Fast 3G</option>
              <option value="slow3g">Slow 3G</option>
              <option value="offline">离线</option>
              <option value="custom">自定义…</option>
            </select>
          </label>
          <template v-if="netThrottle === 'custom'">
            <input v-model.number="netThrottleCustom.download" class="debug-input debug-input--num" type="number" min="0" title="下行速度（KB/s）" @change="applyThrottle" />
            <input v-model.number="netThrottleCustom.upload" class="debug-input debug-input--num" type="number" min="0" title="上行速度（KB/s）" @change="applyThrottle" />
            <input v-model.number="netThrottleCustom.latency" class="debug-input debug-input--num" type="number" min="0" title="附加延迟（ms）" @change="applyThrottle" />
          </template>
          <button
            :class="['debug-chip', { 'is-active': deviceEmul !== 'none' || cpuRate > 1 }]"
            title="设备仿真 / UA 覆盖 / CPU 节流（Emulation 域，目标级会话）"
            @click="emuPanelOpen = !emuPanelOpen"
          >
            仿真<span v-if="deviceEmul !== 'none'" class="debug-chip__n">机</span>
          </button>
          <button
            :class="['debug-chip', { 'is-active': interceptOn || interceptPanelOpen }]"
            title="请求拦截：屏蔽 / Mock 应答 / 改写请求头（Fetch 域，纯前端分流）"
            @click="interceptPanelOpen = !interceptPanelOpen"
          >
            拦截<span class="debug-chip__n">{{ interceptRules.length }}</span>
          </button>
          <button class="debug-btn debug-btn--sm" @click="clearNetwork">清空</button>
        </div>

        <!-- ---------- SVG 工具行 ---------- -->
        <div v-else-if="pageTab === 'svg'" class="debug-tool">
          <label class="debug-tool__switch" title="进入页签 / 页面导航后自动抽取">
            <input v-model="svgAuto" type="checkbox" /> 自动获取
          </label>
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="svgLoading || !selectedTarget" @click="loadSvgs()">
            {{ svgLoading ? "抽取中…" : "重新抽取" }}
          </button>
          <label class="debug-tool__switch">
            <input v-model="svgSavedOnly" type="checkbox" /> 只看已保存
          </label>
          <span class="debug-tool__spacer" />
          <input v-model="svgKeyword" class="debug-input debug-input--search" placeholder="过滤标签 / 来源 / 地址" />
          <span class="debug-tool__hint">{{ visibleSvgs.length }} / {{ svgItems.length }} 个</span>
        </div>

        <!-- ---------- 性能（Tracing）工具行 ---------- -->
        <div v-else-if="pageTab === 'performance'" class="debug-tool">
          <button
            :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': !perfRecording }]"
            :disabled="perfRecording || perfStopping || !selectedTarget"
            @click="startPerf"
          >
            {{ perfStopping ? "收尾中…" : "开始录制" }}
          </button>
          <button
            :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--danger': perfRecording }]"
            :disabled="!perfRecording || perfStopping"
            @click="stopPerf"
          >
            停止
          </button>
          <span v-if="perfRecording" class="debug-pill debug-pill--warn">
            <i class="debug-dot" />录制中 {{ perfElapsed }}<template v-if="perfEventCount"> · {{ perfEventCount }} 事件</template>
          </span>
          <span v-else-if="perfSummary" class="debug-pill debug-pill--info">
            {{ perfElapsed }} · {{ perfSummary.total }} 事件
          </span>
          <span class="debug-tool__divider" />
          <button
            v-for="opt in PERF_CATEGORY_OPTIONS"
            :key="opt.value"
            :class="['debug-chip', { 'is-active': perfCategories.includes(opt.value) }]"
            :title="opt.hint"
            :disabled="perfRecording"
            @click="togglePerfCategory(opt.value)"
          >
            {{ opt.label }}
          </button>
          <span class="debug-tool__spacer" />
          <span v-if="perfBufferUsage" class="debug-tool__hint">缓冲 {{ perfBufferUsage }}%</span>
          <button class="debug-btn debug-btn--sm" :disabled="!perfSummary" @click="exportPerf">导出 trace</button>
          <button class="debug-btn debug-btn--sm" :disabled="perfRecording || !perfEventCount" @click="clearPerf">清空</button>
          <span class="debug-tool__divider" />
          <button
            :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--danger': cpuProfiling }]"
            :disabled="heapProfiling || !selectedTarget"
            title="Profiler.start/stop：按调用栈采样 CPU，停止后看自耗时 Top 函数"
            @click="cpuProfiling ? stopCpuProfile() : startCpuProfile()"
          >
            {{ cpuProfiling ? "停止 CPU 采样" : "CPU 采样" }}
          </button>
          <button
            :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--danger': heapProfiling }]"
            :disabled="cpuProfiling || !selectedTarget"
            title="HeapProfiler.startSampling/stopSampling：采样堆分配，停止后看分配 Top 函数"
            @click="heapProfiling ? stopHeapProfile() : startHeapProfile()"
          >
            {{ heapProfiling ? "停止堆采样" : "堆分配采样" }}
          </button>
        </div>

        <!-- ---------- 应用（存储）工具行 ---------- -->
        <div v-else-if="pageTab === 'app'" class="debug-tool">
          <span class="debug-seg">
            <button
              :class="['debug-seg__b', { 'is-active': storageTab === 'cookies' }]"
              @click="storageTab = 'cookies'"
            >
              Cookie<span class="debug-chip__n">{{ storageCookies.length }}</span>
            </button>
            <button
              :class="['debug-seg__b', { 'is-active': storageTab === 'local' }]"
              @click="storageTab = 'local'"
            >
              localStorage<span class="debug-chip__n">{{ storageLocal.length }}</span>
            </button>
            <button
              :class="['debug-seg__b', { 'is-active': storageTab === 'session' }]"
              @click="storageTab = 'session'"
            >
              sessionStorage<span class="debug-chip__n">{{ storageSession.length }}</span>
            </button>
          </span>
          <span class="debug-tool__divider" />
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="storageLoading" @click="loadStorage">
            {{ storageLoading ? "读取中…" : "读取存储" }}
          </button>
          <span class="debug-tool__spacer" />
          <input v-model="storageKeyword" class="debug-input debug-input--search" placeholder="过滤 key / value" />
          <span class="debug-tool__hint">{{ storageCount }} 条</span>
          <button class="debug-btn debug-btn--sm" :disabled="!storageCount" @click="clearStorage">清空</button>
        </div>

        <!-- ---------- 截屏工具行 ---------- -->
        <div v-else class="debug-tool">
          <span class="debug-tool__hint">
            {{ selectedTarget ? `当前目标: ${selectedTarget}` : "请先在左侧选择或创建目标" }}
          </span>
          <span class="debug-tool__spacer" />
          <button class="debug-btn debug-btn--sm" :disabled="screenshotLoading" @click="doScreenshot()">截屏</button>
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="screenshotLoading" @click="doScreenshot(true)">
            全长截屏
          </button>
          <span class="debug-tool__divider" />
          <button
            class="debug-btn debug-btn--sm"
            :disabled="screenshotLoading"
            title="Page.printToPDF：整页打印成 PDF（仅页面型目标）"
            @click="exportPdf"
          >
            导出 PDF
          </button>
          <button
            class="debug-btn debug-btn--sm"
            :disabled="screenshotLoading"
            title="Page.captureSnapshot：整页内联成 MHTML 单文件存档"
            @click="exportMhtml"
          >
            导出 MHTML
          </button>
        </div>

        <!-- ==================== 元素（F12 Elements） ==================== -->
        <div v-if="pageTab === 'elements'" class="debug-elements">
          <div v-if="!elementTree && !elementLoading && !sourceOpen" class="debug-empty">
            <template v-if="!running">
              <b>调试浏览器未启动</b>
              <span>启动后可实时查看页面画面，并抓取 DOM / 网络 / 控制台 / 性能</span>
              <button class="debug-btn debug-btn--primary" :disabled="statusLoading" @click="startBrowser">
                {{ statusLoading ? "处理中…" : "▶ 启动浏览器" }}
              </button>
            </template>
            <template v-else>
              <b>还没有读取 DOM</b>
              <span>点上方「刷新 DOM」把当前页面的节点树拉下来</span>
            </template>
          </div>
          <div
            v-else
            :class="['debug-elwrap', `debug-elwrap--${stageLayout}`, { 'debug-elwrap--src': sourceOpen }]"
          >
            <div :class="['debug-el', `debug-el--${stageLayout}`]">
              <!-- 画面舞台：默认在左，点画面反查节点；实时页面模式下显示代理 iframe -->
              <div v-if="stageOpen" class="debug-el__stage">
                <iframe
                  v-if="livePageOn && livePageSrc"
                  :src="livePageSrc"
                  class="debug-stage__frame"
                  title="实时页面"
                  referrerpolicy="no-referrer"
                />
                <div v-else ref="stageViewRef" class="debug-stage__view" @click="pickFromStage">
                  <img
                    v-if="stageShot"
                    ref="stageImgRef"
                    :src="stageShot"
                    alt="原始网站画面"
                    draggable="false"
                    @load="onStageImgLoad"
                  />
                  <div v-else class="debug-stage__ph">
                    <b>{{ stageLoading ? "正在截屏…" : "还没有画面" }}</b>
                    <span>点上方「截屏」或打开「实时」自动刷新</span>
                  </div>
                  <div v-if="stageHighlight && stageShot && stageHlStyle" class="debug-stage__hl" :style="stageHlStyle">
                    <span class="debug-stage__hltag">{{ stageHighlight.tag }}</span>
                  </div>
                  <span v-if="stageLoading && stageShot" class="debug-stage__loading">刷新中…</span>
                </div>
                <div class="debug-stage__bar">
                  <span class="debug-stage__hint">{{ livePageOn ? livePageHint : stageHint }}</span>
                  <span class="debug-tool__spacer" />
                  <label v-if="!livePageOn" class="debug-stage__switch">
                    <input v-model="stageLive" type="checkbox" /> 实时刷新
                  </label>
                </div>
              </div>

              <!-- DOM 树 + 详情：选中节点后样式在右侧，不再压到页面底部 -->
              <div class="debug-el__body">
                <div class="debug-el__tree" @mouseleave="clearHighlight">
                  <!-- 面包屑（F12 的 ancestors 条） -->
                  <div v-if="nodePath.length > 1" class="debug-el__crumbs">
                    <template v-for="(n, i) in nodePath" :key="n.nodeId">
                      <span v-if="i" class="debug-el__crumbsep">›</span>
                      <button
                        :class="['debug-el__crumb', { 'is-active': i === nodePath.length - 1 }]"
                        @click="selectNode(n)"
                      >
                        {{ nodeLabel(n) }}
                      </button>
                    </template>
                  </div>

                  <div
                    v-for="row in elementRows"
                    :key="row.node.nodeId"
                    :class="['debug-el__row', { 'is-active': selectedNode?.nodeId === row.node.nodeId }]"
                    :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
                    @click="selectNode(row.node)"
                    @contextmenu.prevent="openContextMenu($event, row.node)"
                  >
                    <span
                      :class="['debug-el__caret', { 'is-open': expandedNodes.has(row.node.nodeId) }]"
                      @click.stop="toggleNode(row.node)"
                    >
                      {{ row.node.childCount ? (expandedNodes.has(row.node.nodeId) ? "▾" : "▸") : "" }}
                    </span>

                    <template v-if="row.node.nodeType === 1">
                      <span class="debug-el__tag">&lt;{{ nodeLabel(row.node) }}</span>
                      <template v-for="(val, key) in row.node.attributes" :key="key">
                        <span class="debug-el__attr"> {{ key }}</span
                        ><span class="debug-el__eq">=</span
                        ><span class="debug-el__val">"{{ attrPreview(val) }}"</span>
                      </template>
                      <span class="debug-el__tag">&gt;</span>
                    </template>
                    <span v-else-if="row.node.nodeType === 3" class="debug-el__text">
                      {{ textPreview(`"${row.node.nodeValue}"`) }}
                    </span>
                    <span v-else-if="row.node.nodeType === 10" class="debug-el__comment">
                      &lt;!DOCTYPE {{ row.node.nodeValue || nodeLabel(row.node) }}&gt;
                    </span>
                    <span v-else-if="row.node.nodeType === 8" class="debug-el__comment">
                      {{ textPreview(`<!--${row.node.nodeValue}-->`) }}
                    </span>
                    <span v-else class="debug-el__tag">{{ nodeLabel(row.node) }}</span>
                  </div>

                  <div v-if="!elementRows.length" class="debug-empty">
                    <b>页面里没有节点</b>
                    <span>换个目标或刷新试试</span>
                  </div>
                </div>

                <div v-if="selectedNode" class="debug-el__detail">
                  <div class="debug-el__detailhd">
                    <span class="debug-el__detailtag">&lt;{{ nodeLabel(selectedNode) }}&gt;</span>
                    <span class="debug-el__hint">
                      nodeId {{ selectedNode.nodeId }}{{ selectedNode.childCount ? ` · ${selectedNode.childCount} 子节点` : "" }}
                    </span>
                    <span class="debug-tool__spacer" />
                    <button class="debug-el__dclose" title="关闭详情" @click="selectedNode = null">×</button>
                  </div>

                  <div class="debug-el__dtabs">
                    <button
                      :class="['debug-el__dtab', { 'is-active': detailTab === 'style' }]"
                      :disabled="selectedNode.nodeType !== 1"
                      @click="showDetailTab('style')"
                    >
                      样式<span v-if="styleRules.length" class="debug-el__dtabn">{{ styleRules.length }}</span>
                    </button>
                    <button
                      :class="['debug-el__dtab', { 'is-active': detailTab === 'computed' }]"
                      :disabled="selectedNode.nodeType !== 1"
                      @click="showDetailTab('computed')"
                    >
                      计算
                    </button>
                    <button
                      :class="['debug-el__dtab', { 'is-active': detailTab === 'box' }]"
                      :disabled="selectedNode.nodeType !== 1"
                      @click="showDetailTab('box')"
                    >
                      布局
                    </button>
                    <button
                      :class="['debug-el__dtab', { 'is-active': detailTab === 'html' }]"
                      @click="showDetailTab('html')"
                    >
                      HTML
                    </button>
                    <button
                      :class="['debug-el__dtab', { 'is-active': detailTab === 'svg' }]"
                      @click="showDetailTab('svg')"
                    >
                      SVG<span v-if="svgItems.length" class="debug-el__dtabn">{{ svgItems.length }}</span>
                    </button>
                  </div>

                  <!-- 样式 -->
                  <div v-if="detailTab === 'style'" class="debug-el__styles">
                    <div class="debug-el__stylesbar">
                      <span class="debug-tool__hint">匹配规则按层叠顺序，内联在最上</span>
                      <span class="debug-tool__spacer" />
                      <button class="debug-btn debug-btn--sm" :disabled="styleLoading" @click="loadMatchedStyles">
                        {{ styleLoading ? "读取中…" : "刷新" }}
                      </button>
                    </div>
                    <div v-if="styleLoading" class="debug-el__styleempty">读取计算后的匹配规则…</div>
                    <div v-else-if="!styleRules.length" class="debug-el__styleempty">
                      {{ styleError || "没有命中任何样式规则" }}
                    </div>
                    <div v-for="(rule, i) in styleRules" :key="`${i}-${rule.selector}`" class="debug-el__rule">
                      <div class="debug-el__selrow">
                        <span class="debug-el__sel">{{ rule.selector }}</span>
                        <span :class="['debug-el__origin', `debug-el__origin--${rule.origin}`]">
                          {{ originLabel(rule.origin) }}
                        </span>
                      </div>
                      <div class="debug-el__props">
                        <div
                          v-for="(p, j) in rule.properties"
                          :key="j"
                          :class="['debug-el__prop', { 'is-off': p.disabled }]"
                        >
                          <span class="debug-el__pname">{{ p.name }}</span
                          ><span class="debug-el__colon">:</span>
                          <span class="debug-el__pval">{{ p.value }}</span
                          ><span v-if="p.important" class="debug-el__imp"> !important</span
                          ><span class="debug-el__semi">;</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 计算样式 -->
                  <div v-else-if="detailTab === 'computed'" class="debug-el__styles">
                    <div class="debug-el__stylesbar">
                      <input v-model="computedKeyword" class="debug-input debug-input--search" placeholder="过滤属性" />
                      <span class="debug-tool__spacer" />
                      <button class="debug-btn debug-btn--sm" :disabled="computedLoading" @click="loadComputedStyles">
                        {{ computedLoading ? "读取中…" : "刷新" }}
                      </button>
                    </div>
                    <div v-if="computedLoading" class="debug-el__styleempty">读取计算后的样式…</div>
                    <div v-else-if="!computedStyles.length" class="debug-el__styleempty">
                      {{ computedError || "没有计算样式" }}
                    </div>
                    <div v-for="p in visibleComputed" :key="p.name" class="debug-el__prop">
                      <span class="debug-el__pname">{{ p.name }}</span
                      ><span class="debug-el__colon">:</span>
                      <span class="debug-el__pval">{{ p.value }}</span
                      ><span class="debug-el__semi">;</span>
                    </div>
                  </div>

                  <!-- 盒模型 -->
                  <div v-else-if="detailTab === 'box'" class="debug-el__styles">
                    <div class="debug-el__stylesbar">
                      <span class="debug-tool__hint">content / padding / border / margin 四层</span>
                      <span class="debug-tool__spacer" />
                      <button class="debug-btn debug-btn--sm" @click="loadBoxModel">重新测量</button>
                    </div>
                    <div v-if="boxError" class="debug-el__styleempty">{{ boxError }}</div>
                    <template v-else-if="boxMetric">
                      <div class="debug-box">
                        <div class="debug-box__layer is-margin">
                          <span class="debug-box__k">margin</span>
                          <div class="debug-box__layer is-border">
                            <span class="debug-box__k">border</span>
                            <div class="debug-box__layer is-padding">
                              <span class="debug-box__k">padding</span>
                              <div class="debug-box__layer is-content">
                                <b>{{ Math.round(boxMetric.width) }} × {{ Math.round(boxMetric.height) }}</b>
                                <span>content</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="debug-box__rows">
                        <div class="debug-el__kv"><span>content</span><b>{{ quadSize(boxMetric.content).w }} × {{ quadSize(boxMetric.content).h }}</b></div>
                        <div class="debug-el__kv"><span>padding</span><b>{{ quadSize(boxMetric.padding).w }} × {{ quadSize(boxMetric.padding).h }}</b></div>
                        <div class="debug-el__kv"><span>border</span><b>{{ quadSize(boxMetric.border).w }} × {{ quadSize(boxMetric.border).h }}</b></div>
                        <div class="debug-el__kv"><span>margin</span><b>{{ quadSize(boxMetric.margin).w }} × {{ quadSize(boxMetric.margin).h }}</b></div>
                      </div>
                    </template>
                  </div>

                  <!-- HTML -->
                  <template v-else-if="detailTab === 'html'">
                    <div class="debug-el__stylesbar">
                      <span class="debug-tool__hint">outerHTML，可直接改写回页面</span>
                      <span class="debug-tool__spacer" />
                      <button class="debug-btn debug-btn--sm" @click="copyOuter">复制</button>
                      <button
                        class="debug-btn debug-btn--sm"
                        :disabled="selectedNode.nodeType !== 1"
                        @click="startEditOuter"
                      >
                        编辑
                      </button>
                    </div>
                    <textarea
                      v-if="elementEditing"
                      v-model="elementEditText"
                      class="debug-el__edit"
                      spellcheck="false"
                    ></textarea>
                    <div v-if="elementEditing" class="debug-el__editfoot">
                      <span class="debug-tool__hint">保存后直接写回页面，并重读一次 DOM</span>
                      <span class="debug-tool__spacer" />
                      <button class="debug-btn debug-btn--sm" @click="elementEditing = false">取消</button>
                      <button class="debug-btn debug-btn--sm debug-btn--primary" @click="saveOuter">保存</button>
                    </div>
                    <pre v-else class="debug-el__outer">{{ selectedOuter || "（该节点没有 outerHTML）" }}</pre>
                  </template>

                  <!-- SVG（原 SVG 页签收在这里） -->
                  <div v-else class="debug-el__styles">
                    <div class="debug-el__stylesbar">
                      <span class="debug-tool__hint">{{ svgItems.length }} 个 SVG · 内联 / &lt;use&gt; / 外链</span>
                      <span class="debug-tool__spacer" />
                      <label class="debug-tool__switch">
                        <input v-model="svgSavedOnly" type="checkbox" /> 只看已保存
                      </label>
                      <button class="debug-btn debug-btn--sm" :disabled="svgLoading" @click="loadSvgs()">
                        {{ svgLoading ? "抽取中…" : "重新抽取" }}
                      </button>
                    </div>
                    <div v-if="svgError" class="debug-el__styleempty">{{ svgError }}</div>
                    <div v-else-if="!visibleSvgs.length" class="debug-el__styleempty">
                      {{ svgSavedOnly ? "还没有保存的 SVG" : "没有 SVG" }}
                    </div>
                    <div v-else class="debug-svg__grid">
                      <div v-for="item in visibleSvgs" :key="item.id" class="debug-svgcard">
                        <div class="debug-svgcard__preview">
                          <img :src="item.dataUrl" :alt="item.label" />
                        </div>
                        <div class="debug-svgcard__body">
                          <div class="debug-svgcard__label" :title="item.label">{{ item.label }}</div>
                          <div class="debug-svgcard__meta">
                            <span :title="item.source">{{ item.source }}</span>
                            <span>{{ fmtSize(item.bytes) }}</span>
                            <span>{{ item.width || "?" }}×{{ item.height || "?" }} px</span>
                          </div>
                          <div class="debug-svgcard__acts">
                            <button class="debug-btn debug-btn--sm" @click="downloadSvg(item)">下载</button>
                            <button
                              :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': item.saved }]"
                              @click="toggleSaveSvg(item)"
                            >
                              {{ item.saved ? "已保存" : "保存" }}
                            </button>
                            <button class="debug-btn debug-btn--sm" @click="copyText(item.markup, '已复制 SVG 源码')">复制</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 整页 HTML 面板（原「源码」页签） -->
            <div v-if="sourceOpen" class="debug-source">
              <div class="debug-source__hd">
                <b>页面 HTML</b>
                <span class="debug-tool__hint">{{ domLoading ? "加载中…" : `${domRaw.length} 字符` }}</span>
                <span class="debug-tool__spacer" />
                <input
                  v-model="navigateUrl"
                  class="debug-input debug-input--search"
                  placeholder="跳转 URL"
                  @keyup.enter="doNavigate(navigateUrl)"
                />
                <button class="debug-btn debug-btn--sm" :disabled="!navigateUrl" @click="doNavigate(navigateUrl)">跳转</button>
                <button class="debug-btn debug-btn--sm" :disabled="domLoading" @click="fetchContent">重新获取</button>
                <button class="debug-btn debug-btn--sm" @click="copyText(domRaw, '已复制页面 HTML')">复制</button>
                <button class="debug-btn debug-btn--sm" @click="sourceOpen = false">关闭</button>
              </div>
              <pre class="debug-source__code">{{ domLoading ? "加载中…" : domRaw || "（空）" }}</pre>
            </div>
          </div>

          <!-- 底部 Console 抽屉：整条工作区的底栏，不参与左右分栏 -->
          <div class="debug-drawer" :class="{ 'is-open': evaluateOpen }">
            <div class="debug-drawer__hd" @click="evaluateOpen = !evaluateOpen">
              <span class="debug-drawer__caret">{{ evaluateOpen ? "▾" : "▸" }}</span>
              <b class="debug-drawer__title">Console</b>
              <span class="debug-drawer__summary">{{ evaluateSummary }}</span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm" @click.stop="clearEvaluate">清空</button>
            </div>
            <div v-if="evaluateOpen" class="debug-drawer__body">
              <div class="debug-drawer__inputrow">
                <span class="debug-drawer__prompt">›</span>
                <input
                  v-model="evaluateExpression"
                  class="debug-drawer__input"
                  placeholder="JS 表达式，↑ / ↓ 翻历史（如 document.title）"
                  spellcheck="false"
                  @keyup.enter="doEvaluate"
                  @keydown.up.prevent="historyPrev"
                  @keydown.down.prevent="historyNext"
                />
                <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="evaluateLoading" @click="doEvaluate">
                  {{ evaluateLoading ? "执行中…" : "执行" }}
                </button>
              </div>
              <pre class="debug-drawer__out">{{ evaluateResult || "（执行结果会显示在这里）" }}</pre>
            </div>
          </div>
        </div>

        <!-- ==================== 控制台 ==================== -->
        <div v-else-if="pageTab === 'console'" class="debug-scroll">
          <div
            v-for="m in visibleConsole"
            :key="m.key"
            :class="['debug-log', { 'debug-log--change': m.type === 'change', 'debug-log--expanded': !!(m.stack && m.stack.length && expandedStacks[m.key]) }]"
            :style="{ paddingLeft: 6 + (m.depth || 0) * 16 + 'px' }"
          >
            <span class="debug-log__time">{{ fmtTime(m.timestamp) }}</span>
            <span :class="['debug-log__lvl', `debug-log__lvl--${m.level}`]">
              {{ m.type === "change" ? "变化" : m.type === "startGroup" || m.type === "startGroupCollapsed" ? "▾" : m.type === "endGroup" ? "▴" : m.level }}
            </span>
            <span class="debug-log__text">{{ m.text }}</span>
            <button
              v-if="m.stack && m.stack.length"
              class="debug-log__stackbtn"
              :title="expandedStacks[m.key] ? '收起调用栈' : '展开调用栈'"
              @click.stop="toggleStack(m.key)"
            >
              {{ expandedStacks[m.key] ? "收起堆栈" : `堆栈 ${m.stack.length}` }}
            </button>
            <span v-if="targetType(m.targetId)" class="debug-log__src">{{ targetType(m.targetId) }}</span>
            <div v-if="m.stack && m.stack.length && expandedStacks[m.key]" class="debug-log__stack">
              <div v-for="(f, i) in m.stack" :key="i" class="debug-log__frame">
                <span class="debug-log__framefn">{{ f.fn }}</span>
                <span class="debug-log__frameurl" :title="f.url">{{ f.url ? `${f.url}:${f.line}` : "(匿名 / 内联脚本)" }}</span>
              </div>
            </div>
          </div>
          <div v-if="!visibleConsole.length" class="debug-empty">
            <b>{{ consoleMessages.length ? "没有符合条件的消息" : "控制台还没有消息" }}</b>
            <span v-if="consoleMessages.length">换个级别或清空过滤词试试</span>
            <span v-else>页面 console.* / 异常 / DOM 变化都会实时到这里</span>
          </div>
        </div>

        <!-- ==================== 网络 ==================== -->
        <div v-else-if="pageTab === 'network'" class="debug-netwrap">
          <!-- 请求拦截面板：屏蔽 / Mock / 改写请求头（Fetch.enable + requestPaused，命中分流都在前端） -->
          <div v-if="interceptPanelOpen" class="debug-intercept">
            <div class="debug-intercept__hd">
              <label class="debug-tool__switch" title="开启后按规则拦截匹配的请求（目标级会话，切目标 / 重启浏览器会自动重挂）">
                <input v-model="interceptOn" type="checkbox" /> 启用拦截
              </label>
              <span class="debug-tool__hint">按顺序匹配，命中即停；匹配串支持 * 通配</span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm debug-btn--primary" @click="addInterceptRule()">新增规则</button>
              <button class="debug-btn debug-btn--sm" @click="interceptPanelOpen = false">收起</button>
            </div>
            <div v-for="(r, i) in interceptRules" :key="r.id" class="debug-intercept__row">
              <span class="debug-intercept__idx">{{ i + 1 }}</span>
              <input v-model="r.pattern" class="debug-input debug-intercept__pattern" placeholder="URL 匹配串，如 https://api.example.com/*" spellcheck="false" />
              <select v-model="r.action" class="debug-input debug-intercept__action" title="拦截动作">
                <option value="block">屏蔽</option>
                <option value="mock">Mock 应答</option>
                <option value="header">改请求头</option>
              </select>
              <template v-if="r.action === 'mock'">
                <input v-model.number="r.status" class="debug-input debug-intercept__status" type="number" min="100" max="599" title="响应码" />
                <input v-model="r.mime" class="debug-input debug-intercept__mime" title="Content-Type" placeholder="Content-Type" spellcheck="false" />
                <input v-model="r.body" class="debug-input debug-intercept__body" placeholder="响应体" spellcheck="false" />
              </template>
              <input
                v-else-if="r.action === 'header'"
                class="debug-input debug-intercept__body"
                :value="Object.entries(r.headers).map(([k, v]) => `${k}: ${v}`).join('; ')"
                placeholder="头名: 头值（多个用 ; 分隔）"
                spellcheck="false"
                @change="setRuleHeaders(r, ($event.target as HTMLInputElement).value)"
              />
              <span v-else class="debug-intercept__desc">命中即中断请求（BlockedByClient）</span>
              <button class="debug-btn debug-btn--sm" title="删除该规则" @click="removeInterceptRule(r.id)">删除</button>
            </div>
            <div v-if="!interceptRules.length" class="debug-intercept__empty">
              还没有规则 —— 右键网络行可快速屏蔽某个 URL，或点「新增规则」
            </div>
          </div>

          <!-- 设备仿真 / UA 覆盖 / CPU 节流面板（Emulation 域，目标级会话） -->
          <div v-if="emuPanelOpen" class="debug-intercept">
            <div class="debug-intercept__hd">
              <span class="debug-tool__hint">设备仿真 · UA 覆盖 · CPU 节流（Emulation 域，切目标 / 重启浏览器自动重挂）</span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm debug-btn--primary" @click="applyDeviceEmulation()">应用</button>
              <button class="debug-btn debug-btn--sm" @click="emuPanelOpen = false">收起</button>
            </div>
            <div class="debug-intercept__row">
              <span class="debug-intercept__idx">设备</span>
              <select v-model="deviceEmul" class="debug-input debug-input--throttle" @change="applyDeviceEmulation()">
                <option value="none">无（桌面默认）</option>
                <option v-for="(p, k) in DEVICE_PRESETS" :key="k" :value="k">{{ p.label }}（{{ p.width }}×{{ p.height }}）</option>
                <option value="custom">自定义…</option>
              </select>
              <template v-if="deviceEmul === 'custom'">
                <input v-model.number="deviceCustom.width" class="debug-input debug-input--num" type="number" min="1" title="视口宽（px）" @change="applyDeviceEmulation()" />
                <input v-model.number="deviceCustom.height" class="debug-input debug-input--num" type="number" min="1" title="视口高（px）" @change="applyDeviceEmulation()" />
                <input v-model.number="deviceCustom.scale" class="debug-input debug-input--num" type="number" min="1" step="0.5" title="deviceScaleFactor" @change="applyDeviceEmulation()" />
                <label class="debug-tool__switch" title="移动端标记（影响布局视口与触屏判定）">
                  <input v-model="deviceCustom.mobile" type="checkbox" @change="applyDeviceEmulation()" /> mobile
                </label>
              </template>
            </div>
            <div class="debug-intercept__row">
              <span class="debug-intercept__idx">UA</span>
              <input
                v-model="deviceCustom.ua"
                class="debug-input debug-intercept__pattern"
                placeholder="User-Agent 覆盖（预设档自动带 UA；自定义档留空 = 不覆盖）"
                spellcheck="false"
                :disabled="deviceEmul !== 'custom'"
                @change="applyDeviceEmulation()"
              />
            </div>
            <div class="debug-intercept__row">
              <span class="debug-intercept__idx">CPU</span>
              <input v-model.number="cpuRate" class="debug-input debug-input--num" type="number" min="1" max="50" title="节流倍率：1 = 不节流，4 = 四倍慢" @change="applyDeviceEmulation()" />
              <span class="debug-intercept__desc">×N 减速（1 = 不节流；Emulation.setCPUThrottlingRate）</span>
            </div>
          </div>
          <div class="debug-scroll debug-scroll--net">
            <table v-if="networkRows.length" class="debug-net">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>方法</th>
                  <th>状态</th>
                  <th>类型</th>
                  <th>链路</th>
                  <th>大小</th>
                  <th>时间</th>
                  <th>耗时</th>
                  <th class="debug-net__wfh">瀑布</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="n in networkRows" :key="n.seq">
                  <tr
                    :class="['debug-net__tr', { 'is-active': netDetailId === n.requestId, 'is-failed': !!n.errorText || /^[45]/.test(n.status) }]"
                    :title="n.url"
                    @click="toggleNetDetail(n.requestId)"
                    @contextmenu.prevent="openNetMenu($event, n)"
                  >
                    <td class="debug-net__name">
                      <span class="debug-net__caret">{{ netDetailId === n.requestId ? "▾" : "▸" }}</span>
                      {{ urlName(n.url) }}
                    </td>
                    <td class="debug-net__method">{{ n.method || "—" }}</td>
                    <td :class="['debug-net__status', `debug-net__status--${statusTone(n.status)}`]">
                      {{ n.errorText ? "ERR" : n.status || "pending" }}
                    </td>
                    <td class="debug-net__type">{{ n.type || "other" }}</td>
                    <td class="debug-net__trace">
                      <span v-if="n.traceId" class="debug-net__traceid" :title="`traceId ${n.traceId}（${n.traceSource}）`">
                        {{ n.traceId.slice(0, 8) }}
                      </span>
                      <span v-else class="debug-net__none">—</span>
                    </td>
                    <td class="debug-net__size">{{ n.fromCache ? "缓存" : fmtSize(n.size || n.received) }}</td>
                    <td class="debug-net__time">{{ fmtTime(n.timestamp) }}</td>
                    <td class="debug-net__dur">{{ fmtDuration(n.duration) }}</td>
                    <td class="debug-net__wf">
                      <span
                        :class="['debug-net__wfbar', `is-${statusTone(n.status)}`, { 'is-failed': !!n.errorText }]"
                        :style="waterfallStyle(n)"
                        :title="`${fmtDuration(n.duration)}（自首个请求起 ${Math.max(0, Math.round((n.timestamp || 0) - netWaterfall.origin))} ms）`"
                      />
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div v-else class="debug-empty">
              <b>{{ networkRequests.length ? "没有符合条件的请求" : "暂无网络日志" }}</b>
              <span v-if="!networkRequests.length">刷新页面或新建页面，HTTP 请求会实时到这儿</span>
            </div>
          </div>

          <!-- 请求详情（F12 的 Headers / Response / Initiator） -->
          <div v-if="netDetail" class="debug-netdetail" :style="{ height: netDetailHeight + 'px' }">
            <div class="debug-netdetail__resizer" title="拖拽调整详情高度" @pointerdown.prevent="startNetResize">
              <span />
            </div>
            <div class="debug-netdetail__hd">
              <b class="debug-netdetail__title" :title="netDetail.url">{{ urlName(netDetail.url) }}</b>
              <span class="debug-netdetail__url" :title="netDetail.url">{{ netDetail.url }}</span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm" @click="copyText(netDetail.url, '已复制请求地址')">复制 URL</button>
              <button class="debug-btn debug-btn--sm" @click="netDetailId = ''">关闭</button>
            </div>
            <div class="debug-netdetail__tabs">
              <button :class="['debug-el__dtab', { 'is-active': netDetailTab === 'headers' }]" @click="showNetTab('headers')">标头</button>
              <button :class="['debug-el__dtab', { 'is-active': netDetailTab === 'response' }]" @click="showNetTab('response')">响应</button>
              <button :class="['debug-el__dtab', { 'is-active': netDetailTab === 'initiator' }]" @click="showNetTab('initiator')">发起者</button>
              <button
                v-if="netDetail.wsFrames?.length"
                :class="['debug-el__dtab', { 'is-active': netDetailTab === 'ws' }]"
                @click="showNetTab('ws')"
              >
                WS 帧（{{ netDetail.wsFrames.length }}）
              </button>
              <button :class="['debug-el__dtab', { 'is-active': netDetailTab === 'trace' }]" @click="showNetTab('trace')">
                链路<span v-if="currentTraceGroup" class="debug-el__dtabn">{{ currentTraceGroup.count }}</span>
              </button>
            </div>
            <div class="debug-netdetail__body">
              <template v-if="netDetailTab === 'headers'">
                <div class="debug-netdetail__sum">
                  <span><b>{{ netDetail.method }}</b> {{ netDetail.status }} {{ netDetail.statusText }}</span>
                  <span v-if="netDetail.mimeType">· {{ netDetail.mimeType }}</span>
                  <span>· {{ fmtSize(netDetail.size || netDetail.received) }}</span>
                  <span>· {{ fmtDuration(netDetail.duration) }}</span>
                  <span v-if="netDetail.fromCache">· 缓存</span>
                </div>
                <div class="debug-netdetail__sec">请求头</div>
                <div v-for="(v, k) in netDetail.requestHeaders" :key="'q' + k" class="debug-netdetail__kv">
                  <span class="debug-netdetail__k">{{ k }}</span><span class="debug-netdetail__v">{{ v }}</span>
                </div>
                <div class="debug-netdetail__sec">响应头</div>
                <div v-if="!Object.keys(netDetail.responseHeaders).length" class="debug-netdetail__none">（无）</div>
                <div v-for="(v, k) in netDetail.responseHeaders" :key="'s' + k" class="debug-netdetail__kv">
                  <span class="debug-netdetail__k">{{ k }}</span><span class="debug-netdetail__v">{{ v }}</span>
                </div>
              </template>
              <template v-else-if="netDetailTab === 'response'">
                <div class="debug-netdetail__respbar">
                  <span class="debug-tool__hint">经 WS Network.getResponseBody 按需读取</span>
                  <span class="debug-tool__spacer" />
                  <label class="debug-tool__switch" title="JSON 缩进 / HTML 折行">
                    <input v-model="netBodyPretty" type="checkbox" /> 格式化
                  </label>
                  <button class="debug-btn debug-btn--sm" :disabled="netBodyLoading" @click="loadNetBody">重新读取</button>
                  <button class="debug-btn debug-btn--sm" @click="copyText(netBodyDisplay, '已复制响应体')">复制</button>
                </div>
                <pre class="debug-netdetail__pre">{{ netBodyLoading ? "读取中…" : netBodyDisplay || "（空）" }}</pre>
              </template>
              <template v-else-if="netDetailTab === 'trace'">
                <div class="debug-netdetail__respbar">
                  <span class="debug-tool__hint">
                    {{
                      netDetail.traceId
                        ? `来源 ${netDetail.traceSource || "header"} · 同链路 ${currentTraceGroup?.count ?? 1} 个请求`
                        : "该请求没有 sw8 / traceparent 头"
                    }}
                  </span>
                  <span class="debug-tool__spacer" />
                  <button
                    class="debug-btn debug-btn--sm"
                    :disabled="!netDetail.traceId"
                    @click="copyText(netDetail.traceId, '已复制 traceId')"
                  >
                    复制 traceId
                  </button>
                  <button
                    class="debug-btn debug-btn--sm debug-btn--primary"
                    :disabled="!netDetail.traceId"
                    @click="openTraceInApm(netDetail.traceId)"
                  >
                    在 APM 查看
                  </button>
                </div>
                <template v-if="netDetail.traceId">
                  <div class="debug-netdetail__kv"><span class="debug-netdetail__k">traceId</span><span class="debug-netdetail__v">{{ netDetail.traceId }}</span></div>
                  <div class="debug-netdetail__kv"><span class="debug-netdetail__k">segmentId</span><span class="debug-netdetail__v">{{ netDetail.segmentId || "—" }}</span></div>
                  <div class="debug-netdetail__kv"><span class="debug-netdetail__k">spanId</span><span class="debug-netdetail__v">{{ netDetail.spanId || "—" }}</span></div>
                  <div class="debug-netdetail__kv"><span class="debug-netdetail__k">来源</span><span class="debug-netdetail__v">{{ netDetail.traceSource }}</span></div>
                  <div class="debug-netdetail__sec">同一条链路上的请求</div>
                  <div v-for="g in currentTraceGroup?.entries ?? []" :key="g.seq" class="debug-netdetail__trace">
                    <span :class="['debug-netdetail__tstat', `debug-net__status--${statusTone(g.status)}`]">
                      {{ g.errorText ? "ERR" : g.status || "…" }}
                    </span>
                    <span class="debug-netdetail__tmethod">{{ g.method }}</span>
                    <span class="debug-netdetail__turl" :title="g.url">{{ urlName(g.url) }}</span>
                    <span class="debug-netdetail__ttime">{{ fmtDuration(g.duration) }}</span>
                  </div>
                </template>
                <div v-else class="debug-netdetail__none">
                  未解析到链路头。打开工具栏的 sw8 注入开关后重新发一次请求即可。
                  <span v-if="traceGroups.length">当前会话已聚合 {{ traceGroups.length }} 条链路。</span>
                </div>
              </template>
              <template v-else-if="netDetailTab === 'initiator'">
                <div class="debug-netdetail__sec">发起者</div>
                <div class="debug-netdetail__pre">{{ netDetail.initiator || "（页面脚本）" }}</div>
                <div class="debug-netdetail__sec">时间线</div>
                <div class="debug-netdetail__kv"><span class="debug-netdetail__k">发起</span><span class="debug-netdetail__v">{{ fmtTime(netDetail.timestamp) }}</span></div>
                <div class="debug-netdetail__kv"><span class="debug-netdetail__k">耗时</span><span class="debug-netdetail__v">{{ fmtDuration(netDetail.duration) }}</span></div>
                <div v-if="netDetail.errorText" class="debug-netdetail__kv"><span class="debug-netdetail__k">错误</span><span class="debug-netdetail__v">{{ netDetail.errorText }}</span></div>
              </template>
              <template v-else-if="netDetailTab === 'ws' && netDetail.wsFrames">
                <div class="debug-ws">
                  <div v-for="(f, i) in netDetail.wsFrames" :key="i" class="debug-ws__row" :class="'debug-ws__row--' + f.dir">
                    <span class="debug-ws__dir">{{ f.dir === "send" ? "↑" : f.dir === "recv" ? "↓" : "⚠" }}</span>
                    <span class="debug-ws__t">+{{ fmtDuration(Math.max(0, f.time - (netDetail.timestamp || f.time))) }}</span>
                    <span class="debug-ws__op">{{ f.dir === "error" ? "error" : wsOpcodeName(f.opcode) }}</span>
                    <span class="debug-ws__size">{{ fmtSize(f.size) }}</span>
                    <span class="debug-ws__payload" :title="f.payload">{{ f.payload || (f.opcode === 2 ? "（二进制帧）" : "") }}</span>
                  </div>
                  <div v-if="!netDetail.wsFrames.length" class="debug-intercept__empty">（无帧）</div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- ==================== SVG（独立页） ==================== -->
        <div v-else-if="pageTab === 'svg'" class="debug-scroll debug-svg">
          <div v-if="svgError" class="debug-perf__err">{{ svgError }}</div>
          <div v-if="!selectedTarget" class="debug-empty">
            <b>还没有选择目标</b>
            <span>左侧选一个页面后点「重新抽取」，或打开「自动获取」</span>
          </div>
          <div v-else-if="svgLoading && !svgItems.length" class="debug-empty">
            <b>正在抽取 SVG…</b>
            <span>内联 &lt;svg&gt; / &lt;use&gt; / 图片 / object / embed / 背景图</span>
          </div>
          <div v-else-if="!visibleSvgs.length" class="debug-empty">
            <b>{{ svgSavedOnly ? "还没有保存的 SVG" : svgKeyword ? "没有匹配的 SVG" : "这个页面没有 SVG" }}</b>
            <span>{{ svgItems.length ? "换个关键字或关掉「只看已保存」" : "内联 / <use> / .svg 图片 / object / embed / 背景图都没有命中" }}</span>
          </div>
          <div v-else class="debug-svg__grid">
            <div v-for="item in visibleSvgs" :key="item.id" class="debug-svgcard">
              <button class="debug-svgcard__preview" @click="svgPreview = item">
                <img :src="item.dataUrl" :alt="item.label" />
              </button>
              <div class="debug-svgcard__body">
                <div class="debug-svgcard__label" :title="item.label">{{ item.label }}</div>
                <div class="debug-svgcard__meta">
                  <span :title="item.source">{{ item.source }}</span>
                  <span>{{ fmtSize(item.bytes) }}</span>
                  <span>{{ item.width || "?" }}×{{ item.height || "?" }} px</span>
                </div>
                <div class="debug-svgcard__acts">
                  <button class="debug-btn debug-btn--sm" @click="downloadSvg(item)">下载</button>
                  <button
                    :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': item.saved }]"
                    @click="toggleSaveSvg(item)"
                  >
                    {{ item.saved ? "已保存" : "保存" }}
                  </button>
                  <button class="debug-btn debug-btn--sm" @click="copyText(item.markup, '已复制 SVG 源码')">复制</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 放大预览 -->
          <div v-if="svgPreview" class="debug-modal" @click.self="svgPreview = null">
            <div class="debug-svgpreview">
              <div class="debug-svgpreview__hd">
                <b :title="svgPreview.label">{{ svgPreview.label }}</b>
                <span class="debug-tool__hint">{{ svgPreview.source }} · {{ fmtSize(svgPreview.bytes) }}</span>
                <span class="debug-tool__spacer" />
                <button class="debug-btn debug-btn--sm" @click="downloadSvg(svgPreview)">下载</button>
                <button class="debug-btn debug-btn--sm" @click="copyText(svgPreview.markup, '已复制 SVG 源码')">复制</button>
                <button class="debug-btn debug-btn--sm" @click="svgPreview = null">关闭</button>
              </div>
              <div class="debug-svgpreview__body">
                <img :src="svgPreview.dataUrl" :alt="svgPreview.label" />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== 性能（Tracing） ==================== -->
        <div v-else-if="pageTab === 'performance'" class="debug-scroll debug-perf">
          <div v-if="perfError" class="debug-perf__err">{{ perfError }}</div>

          <!-- 操作画面：screencast 帧 + 输入转发（录制时能直接操作被调试页面） -->
          <div class="debug-live">
            <div class="debug-live__hd">
              <b class="debug-live__title">操作画面</b>
              <span class="debug-live__hint">{{ liveHint }}</span>
              <span class="debug-tool__spacer" />
              <span v-if="liveOn" class="debug-pill debug-pill--info"><i class="debug-dot" />已接管</span>
              <button
                :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': !liveOn }]"
                :disabled="!selectedTarget || liveLoading"
                @click="toggleLive"
              >
                {{ liveLoading ? "启动中…" : liveOn ? "停止画面" : "开始操作画面" }}
              </button>
            </div>
            <div class="debug-live__view">
              <img
                v-if="liveFrame"
                ref="liveImgRef"
                :src="liveFrame"
                alt="可操作的页面画面"
                draggable="false"
                @mousedown="liveMouseDown"
                @mouseup="liveMouseUp"
                @mousemove="liveMouseMove"
                @wheel="liveWheel"
                @contextmenu.prevent
              />
              <div v-else class="debug-stage__ph">
                <b>{{ liveLoading ? "正在启动画面…" : "操作画面未开启" }}</b>
                <span v-if="selectedTarget">选「开始操作画面」后，这里可以直接点击 / 输入 / 滚动</span>
                <span v-else>先在左侧选择一个页面目标</span>
              </div>
              <span v-if="liveOn && liveFrame" class="debug-live__badge">Live</span>
            </div>
            <div class="debug-live__bar">
              <span class="debug-live__hint">
                {{ liveMeta.w ? `${liveMeta.w} × ${liveMeta.h} CSS px` : "等待首帧…" }}
              </span>
              <span class="debug-tool__spacer" />
              <span class="debug-live__hint">点按画面会聚焦到输入框，可直接打字</span>
            </div>
            <textarea
              ref="liveInputRef"
              class="debug-live__keys"
              aria-hidden="true"
              spellcheck="false"
              @keydown="liveKeydown"
              @input="liveInput"
              @compositionstart="liveCompositionStart"
              @compositionend="liveCompositionEnd"
            ></textarea>
          </div>

          <div v-if="!perfSummary" class="debug-empty">
            <b>{{ perfRecording ? "正在录制…" : "还没有录制数据" }}</b>
            <span v-if="perfRecording">在「操作画面」里滚动、点击、切路由，然后点「停止」分析</span>
            <span v-else>点上方「开始录制」，操作页面后停止，这里会出主线程时间线与汇总指标</span>
          </div>

          <template v-else>
            <div class="debug-perf__stats">
              <div class="debug-perf__stat">
                <span class="debug-perf__k">录制窗口</span>
                <b class="debug-perf__v">{{ (perfSummary.window / 1000000).toFixed(2) }}s</b>
              </div>
              <div class="debug-perf__stat">
                <span class="debug-perf__k">事件</span>
                <b class="debug-perf__v">{{ perfSummary.total }}</b>
              </div>
              <div class="debug-perf__stat">
                <span class="debug-perf__k">主线程</span>
                <b class="debug-perf__v">{{ perfSummary.mainCount }}</b>
              </div>
              <div class="debug-perf__stat">
                <span class="debug-perf__k">长任务</span>
                <b :class="['debug-perf__v', { 'is-warn': perfSummary.longTasks > 0 }]">{{ perfSummary.longTasks }}</b>
              </div>
              <div class="debug-perf__stat">
                <span class="debug-perf__k">帧</span>
                <b class="debug-perf__v">{{ perfSummary.frames }}</b>
              </div>
            </div>

            <div class="debug-perf__sec">
              录制截图
              <span class="debug-perf__secn">
                {{ filmFrames.length ? `${filmFrames.length} 帧 · 采样 ${(filmInterval / 1000).toFixed(1)}s` : "本次没有采样到画面" }}
              </span>
            </div>
            <div v-if="filmFrames.length" class="debug-film">
              <div class="debug-film__main">
                <img v-if="filmCurrent" :src="filmCurrent.url" alt="录制帧" />
                <span class="debug-film__time">{{ filmTimeLabel }}</span>
              </div>
              <div class="debug-film__track">
                <button
                  v-for="(f, i) in filmFrames"
                  :key="i"
                  :class="['debug-film__dot', { 'is-active': i === filmIndex }]"
                  :style="{ left: filmDotLeft(f) }"
                  :title="`${(f.t / 1000).toFixed(2)}s`"
                  @click="filmIndex = i"
                />
              </div>
              <input
                v-model.number="filmIndex"
                class="debug-film__range"
                type="range"
                min="0"
                :max="Math.max(0, filmFrames.length - 1)"
                step="1"
              />
              <div class="debug-film__strip">
                <button
                  v-for="(f, i) in filmFrames"
                  :key="i"
                  :class="['debug-film__thumb', { 'is-active': i === filmIndex }]"
                  @click="filmIndex = i"
                >
                  <img :src="f.url" alt="" />
                  <span>{{ (f.t / 1000).toFixed(1) }}s</span>
                </button>
              </div>
            </div>
            <div v-else class="debug-film__empty">
              录制期间没有拿到画面帧：请保持「操作画面」可用，或页面被系统节流（后台标签页）时切到前台再录。
            </div>

            <div class="debug-perf__sec">阶段占比（主线程自耗时）</div>
            <div class="debug-perf__phases">
              <div class="debug-perf__stack">
                <span
                  v-for="p in perfSummary.phases.filter((x) => x.ms > 0)"
                  :key="p.phase"
                  :class="['debug-perf__seg', `debug-perf__seg--${p.phase}`]"
                  :style="{ width: (p.ms / perfPhaseTotal) * 100 + '%' }"
                  :title="`${p.label} ${p.ms}ms`"
                />
              </div>
              <div class="debug-perf__legend">
                <span v-for="p in perfSummary.phases" :key="p.phase" class="debug-perf__leg">
                  <i :class="['debug-perf__dot', `debug-perf__seg--${p.phase}`]" />
                  {{ p.label }}<b>{{ p.ms }}ms</b>
                  <em>{{ ((p.ms / perfPhaseTotal) * 100).toFixed(0) }}%</em>
                </span>
              </div>
            </div>

            <div class="debug-perf__sec">
              主线程火焰图
              <span class="debug-perf__secn">前 {{ perfSummary.blocks.length }} 个事件 · 宽度按时长占比</span>
            </div>
            <div class="debug-perf__chart" :style="{ height: perfChartHeight + 'px' }">
              <div
                v-for="(b, i) in perfSummary.blocks"
                :key="i"
                :class="['debug-perf__block', `debug-perf__block--${b.phase}`]"
                :style="{ left: b.left + '%', width: b.width + '%', top: b.depth * 12 + 'px' }"
                :title="`${b.name}\n${b.dur.toFixed(2)}ms · ${b.cat}`"
              >
                <span>{{ b.name }}</span>
              </div>
              <div v-if="!perfSummary.blocks.length" class="debug-perf__chartempty">没有可绘制的主线程事件</div>
            </div>

            <div class="debug-perf__sec">最耗时的 {{ perfSummary.top.length }} 个事件</div>
            <table class="debug-perf__table">
              <thead>
                <tr><th>事件</th><th>阶段</th><th>类别</th><th>耗时</th></tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in perfSummary.top" :key="i">
                  <td class="debug-perf__tname" :title="t.name">{{ t.name }}</td>
                  <td><span :class="['debug-perf__tag', `debug-perf__block--${t.phase}`]">{{ PERF_PHASE_LABEL[t.phase] }}</span></td>
                  <td class="debug-perf__tcat" :title="t.cat">{{ t.cat }}</td>
                  <td class="debug-perf__tdur">{{ t.dur.toFixed(2) }}ms</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- CPU 采样结果（Profiler 域，与 Tracing 录制相互独立） -->
          <div v-if="cpuProfiling" class="debug-prof__live">
            <i class="debug-dot" />CPU 采样进行中，操作页面后点「停止 CPU 采样」
          </div>
          <template v-else-if="cpuProfile">
            <div class="debug-perf__sec">
              CPU 采样
              <span class="debug-perf__secn">
                {{ (cpuProfile.durationUs / 1000000).toFixed(2) }}s · {{ cpuProfile.hits }} 采样点 ·
                {{ cpuProfile.nodes }} 节点 · 按自采样占比排序
              </span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm" @click="exportCpuProfile">下载 .cpuprofile</button>
            </div>
            <table class="debug-perf__table">
              <thead>
                <tr><th>函数</th><th>位置</th><th>自采样</th><th>占比</th></tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in cpuProfile.top" :key="i">
                  <td class="debug-perf__tname" :title="t.name">{{ t.name }}</td>
                  <td class="debug-perf__tcat" :title="t.url">{{ t.url ? `${t.url.split("/").pop()}:${t.line}` : "—" }}</td>
                  <td class="debug-perf__tdur">{{ t.hits }}</td>
                  <td class="debug-prof__pct">
                    <span class="debug-prof__bar" :style="{ width: Math.min(100, t.pct) + '%' }" />
                    <b>{{ t.pct.toFixed(1) }}%</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- 堆分配采样结果（HeapProfiler 域） -->
          <div v-if="heapProfiling" class="debug-prof__live">
            <i class="debug-dot" />堆分配采样进行中，操作页面后点「停止堆采样」
          </div>
          <template v-else-if="heapProfile">
            <div class="debug-perf__sec">
              堆分配采样
              <span class="debug-perf__secn">
                总分配 {{ fmtSize(heapProfile.totalBytes) }} · {{ heapProfile.samples }} 个样本 ·
                {{ heapProfile.nodes }} 个分配点 · 按自分配排序
              </span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm" title="HeapProfiler.collectGarbage" @click="triggerGc">触发 GC</button>
              <button class="debug-btn debug-btn--sm" @click="exportHeapProfile">下载 .heapprofile</button>
            </div>
            <table class="debug-perf__table">
              <thead>
                <tr><th>函数</th><th>位置</th><th>自分配</th><th>占比</th></tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in heapProfile.top" :key="i">
                  <td class="debug-perf__tname" :title="t.name">{{ t.name }}</td>
                  <td class="debug-perf__tcat" :title="t.url">{{ t.url ? `${t.url.split("/").pop()}:${t.line}` : "—" }}</td>
                  <td class="debug-perf__tdur">{{ fmtSize(t.bytes) }}</td>
                  <td class="debug-prof__pct">
                    <span class="debug-prof__bar" :style="{ width: Math.min(100, t.pct) + '%' }" />
                    <b>{{ t.pct.toFixed(1) }}%</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>

        <!-- ==================== 应用（Cookie / Web Storage） ==================== -->
        <div v-else-if="pageTab === 'app'" class="debug-scroll debug-app">
          <div v-if="storageError" class="debug-app__err">{{ storageError }}</div>
          <div v-if="!selectedTarget" class="debug-empty">
            <b>还没有选择目标</b>
            <span>选中一个页面后点「读取存储」</span>
          </div>

          <table v-else-if="storageTab === 'cookies' && visibleCookies.length" class="debug-app__table">
            <thead>
              <tr><th>名称</th><th>值</th><th>域</th><th>路径</th><th>过期</th><th>属性</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in visibleCookies" :key="`${c.name}@${c.domain}${c.path}`">
                <td class="debug-app__k">{{ c.name }}</td>
                <td class="debug-app__v" :title="c.value">{{ c.value }}</td>
                <td class="debug-app__mono">{{ c.domain || "—" }}</td>
                <td class="debug-app__mono">{{ c.path || "/" }}</td>
                <td class="debug-app__mono">{{ cookieExpiry(c.expires) }}</td>
                <td class="debug-app__mono">
                  {{ c.httpOnly ? "HttpOnly " : "" }}{{ c.secure ? "Secure" : "" }}
                </td>
              </tr>
            </tbody>
          </table>

          <table v-else-if="storageTab === 'local' && visibleLocal.length" class="debug-app__table">
            <thead><tr><th>Key</th><th>Value</th></tr></thead>
            <tbody>
              <tr v-for="i in visibleLocal" :key="i.key">
                <td class="debug-app__k">{{ i.key }}</td>
                <td class="debug-app__v" :title="i.value">{{ i.value }}</td>
              </tr>
            </tbody>
          </table>

          <table v-else-if="storageTab === 'session' && visibleSession.length" class="debug-app__table">
            <thead><tr><th>Key</th><th>Value</th></tr></thead>
            <tbody>
              <tr v-for="i in visibleSession" :key="i.key">
                <td class="debug-app__k">{{ i.key }}</td>
                <td class="debug-app__v" :title="i.value">{{ i.value }}</td>
              </tr>
            </tbody>
          </table>

          <div v-else class="debug-empty">
            <b>{{ storageLoading ? "正在读取…" : "这里是空的" }}</b>
            <span>点上方「读取存储」从页面拉一次 Cookie / localStorage / sessionStorage</span>
          </div>
        </div>

        <!-- ==================== Debugger 断点 ==================== -->
        <div v-else-if="pageTab === 'debugger'" class="debug-bpwrap">
          <div class="debug-tool">
            <button
              :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': debuggerOn }]"
              :disabled="!selectedTarget"
              :title="debuggerOn ? '关闭 Debugger 域（断点全部失效）' : '启用 Debugger 域（WS 透传，后端零改动）'"
              @click="toggleDebugger"
            >
              {{ debuggerOn ? "关闭 Debugger" : "启用 Debugger" }}
            </button>
            <span class="debug-tool__divider" />
            <input
              v-model="bpUrl"
              class="debug-input debug-input--search debug-bp__url"
              placeholder="脚本地址匹配串（正则，如 app\.js 或 /assets/.*\.ts）"
              spellcheck="false"
              @keyup.enter="addBreakpoint"
            />
            <input v-model.number="bpLine" class="debug-input debug-bp__line" type="number" min="1" title="行号（1 基）" />
            <input
              v-model="bpCondition"
              class="debug-input debug-input--search debug-bp__cond"
              placeholder="条件表达式（可选，如 i > 10）"
              spellcheck="false"
              @keyup.enter="addBreakpoint"
            />
            <button class="debug-btn debug-btn--sm" :disabled="!selectedTarget" @click="addBreakpoint">加断点</button>
            <button class="debug-btn debug-btn--sm" :disabled="!breakpoints.length" @click="clearBreakpoints">移除全部</button>
            <span class="debug-tool__divider" />
            <input
              v-model="blackboxInput"
              class="debug-input debug-input--search debug-bp__cond"
              placeholder="黑盒脚本（正则，逗号/空格分隔，如 node_modules/.*, /cdn/.*）"
              spellcheck="false"
              @keyup.enter="applyBlackbox"
            />
            <button
              class="debug-btn debug-btn--sm"
              :disabled="!selectedTarget"
              title="命中黑盒的脚本在单步 / 断点解析时被跳过（Debugger.setBlackboxPatterns）"
              @click="applyBlackbox"
            >
              应用黑盒
            </button>
            <span class="debug-tool__spacer" />
            <span class="debug-tool__hint">{{ breakpoints.length }} 个断点 · {{ debuggerOn ? "Debugger 已启用" : "Debugger 未启用（加断点会自动启用）" }}</span>
          </div>

          <!-- DOMDebugger：XHR/fetch 断点 + 事件监听器断点（会话内有效，切目标 / 重启浏览器即失） -->
          <div class="debug-bpextra">
            <div class="debug-bpextra__row">
              <span class="debug-bpextra__label">XHR 断点</span>
              <input
                v-model="xhrBpInput"
                class="debug-input debug-input--search"
                placeholder="URL 包含串，如 /api/order（命中即暂停）"
                spellcheck="false"
                @keyup.enter="addXhrBreakpoint"
              />
              <button class="debug-btn debug-btn--sm" :disabled="!selectedTarget || !wsReady()" @click="addXhrBreakpoint">添加</button>
              <button v-if="xhrBreakpoints.length" class="debug-btn debug-btn--sm" @click="clearXhrBreakpoints">清空</button>
            </div>
            <div v-for="u in xhrBreakpoints" :key="'x:' + u" class="debug-bpextra__item">
              <span class="debug-bpextra__tag">XHR</span>
              <span class="debug-bpextra__val" :title="u">{{ u }}</span>
              <button class="debug-btn debug-btn--sm" title="移除该断点" @click="removeXhrBreakpoint(u)">删除</button>
            </div>
            <div class="debug-bpextra__row">
              <span class="debug-bpextra__label">事件断点</span>
              <select v-model="eventBpInput" class="debug-input debug-input--throttle" title="页面任一元素触发该事件时暂停">
                <option v-for="e in EVENT_BP_OPTIONS" :key="e" :value="e">{{ e }}</option>
              </select>
              <button class="debug-btn debug-btn--sm" :disabled="!selectedTarget || !wsReady()" @click="addEventBreakpoint">添加</button>
              <button v-if="eventBreakpoints.length" class="debug-btn debug-btn--sm" @click="clearEventBreakpoints">清空</button>
            </div>
            <div v-for="e in eventBreakpoints" :key="'e:' + e" class="debug-bpextra__item">
              <span class="debug-bpextra__tag">EV</span>
              <span class="debug-bpextra__val">{{ e }}</span>
              <button class="debug-btn debug-btn--sm" title="移除该断点" @click="removeEventBreakpoint(e)">删除</button>
            </div>
          </div>

          <!-- 命中暂停：原因 + 栈帧 + 恢复 / 步进 -->
          <div v-if="pausedState" class="debug-paused">
            <div class="debug-paused__hd">
              <span class="debug-pill debug-pill--warn"><i class="debug-dot" />{{ pauseReason(String(pausedState.reason ?? "")) }}</span>
              <span v-if="pausedHitCount" class="debug-tool__hint">命中 {{ pausedHitCount }} 个断点</span>
              <span class="debug-tool__spacer" />
              <button class="debug-btn debug-btn--sm" @click="debuggerStep('stepOver')">步过</button>
              <button class="debug-btn debug-btn--sm" @click="debuggerStep('stepInto')">步入</button>
              <button class="debug-btn debug-btn--sm" @click="debuggerStep('stepOut')">步出</button>
              <button class="debug-btn debug-btn--sm debug-btn--primary" @click="resumeExecution">恢复执行</button>
            </div>
            <div class="debug-paused__frames">
              <div v-for="(f, i) in pausedFrames" :key="i" class="debug-paused__frame">
                <span class="debug-paused__idx">{{ i }}</span>
                <span class="debug-paused__fn">{{ frameName(f) }}</span>
                <span class="debug-paused__loc" :title="frameUrl(f)">{{ frameUrl(f) || "（脚本未登记）" }}:{{ frameLine(f) }}</span>
              </div>
              <div v-if="!pausedFrames.length" class="debug-paused__frame">
                <span class="debug-tool__hint">没有栈帧信息</span>
              </div>
            </div>
          </div>

          <div class="debug-scroll">
            <table v-if="breakpoints.length" class="debug-bp">
              <thead>
                <tr>
                  <th>脚本地址（正则）</th>
                  <th>行号</th>
                  <th>条件</th>
                  <th>解析位置</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bp in breakpoints" :key="bp.breakpointId" class="debug-bp__tr">
                  <td class="debug-bp__u" :title="bp.url">{{ bp.url }}</td>
                  <td class="debug-bp__l">{{ bp.lineNumber }}</td>
                  <td class="debug-bp__c" :title="bp.condition">{{ bp.condition || "—" }}</td>
                  <td class="debug-bp__locs">
                    <span v-if="!bp.locations.length" class="debug-bp__none">待解析（脚本加载后自动回填）</span>
                    <span
                      v-for="(l, i) in bp.locations"
                      :key="i"
                      class="debug-bp__loc"
                      :title="scriptSources[l.scriptId] || l.scriptId"
                    >
                      {{ scriptSources[l.scriptId] || l.scriptId || l.scriptId }}:{{ l.lineNumber + 1 }}
                    </span>
                  </td>
                  <td class="debug-bp__act">
                    <button class="debug-btn debug-btn--sm" @click="removeBreakpoint(bp)">移除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="debug-empty">
              <b>{{ debuggerOn ? "还没有断点" : "Debugger 未启用" }}</b>
              <span>{{
                debuggerOn
                  ? "填脚本地址与行号后点「加断点」；页面执行到断点会暂停并在上方显示栈帧"
                  : "先启用 Debugger，或直接加断点（会自动启用）；断点按脚本地址正则 + 行号下发"
              }}</span>
            </div>
          </div>
        </div>

        <!-- ==================== 截屏 ==================== -->
        <div v-else class="debug-shot">
          <img v-if="screenshotUrl" :src="screenshotUrl" alt="页面截图" />
          <div v-else class="debug-empty">
            <b>暂无截屏</b>
            <span>选中目标后点「截屏」或「全长截屏」</span>
          </div>
        </div>

        <!-- ==================== 全局底栏：Console / Network 抽屉 ==================== -->
        <div v-if="dockOpen" class="debug-dock" :style="{ height: dockHeight + 'px' }">
          <div class="debug-dock__resizer" title="拖拽调整底栏高度" @pointerdown.prevent="startDockResize">
            <span />
          </div>
          <div class="debug-dock__hd">
            <button
              v-for="p in DOCK_PANELS"
              :key="p"
              :class="['debug-dock__tab', { 'is-active': dockPanel === p }]"
              @click="dockPanel = p"
            >
              {{ p === "console" ? "控制台" : "网络" }}
              <span class="debug-chip__n">{{ p === "console" ? consoleMessages.length : networkRequests.length }}</span>
            </button>
            <span class="debug-tool__spacer" />
            <span class="debug-tool__hint">底栏与当前页签同屏；与主区重复时自动让位，点行可跳转详情</span>
            <button class="debug-btn debug-btn--sm" @click="dockOpen = false">收起底栏</button>
          </div>
          <div class="debug-dock__body">
            <!-- 底栏·控制台：与控制台页签同源同过滤 -->
            <div v-if="dockPanel === 'console'" class="debug-scroll debug-dock__scroll">
              <div
                v-for="m in visibleConsole"
                :key="m.key"
                :class="['debug-log', { 'debug-log--change': m.type === 'change' }]"
              >
                <span class="debug-log__time">{{ fmtTime(m.timestamp) }}</span>
                <span :class="['debug-log__lvl', `debug-log__lvl--${m.level}`]">
                  {{ m.type === "change" ? "变化" : m.level }}
                </span>
                <span class="debug-log__text">{{ m.text }}</span>
                <span v-if="targetType(m.targetId)" class="debug-log__src">{{ targetType(m.targetId) }}</span>
              </div>
              <div v-if="!visibleConsole.length" class="debug-empty">
                <b>{{ consoleMessages.length ? "没有符合条件的消息" : "控制台还没有消息" }}</b>
                <span v-if="consoleMessages.length">级别 / 过滤词与控制台页签共用，去那边改</span>
              </div>
            </div>
            <!-- 底栏·网络：精简列 + 瀑布图；点行跳到网络页签看详情 -->
            <div v-else class="debug-scroll debug-scroll--net debug-dock__scroll">
              <table v-if="networkRows.length" class="debug-net">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>方法</th>
                    <th>状态</th>
                    <th>类型</th>
                    <th>大小</th>
                    <th>耗时</th>
                    <th class="debug-net__wfh">瀑布</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="n in networkRows"
                    :key="n.seq"
                    :class="['debug-net__tr', { 'is-failed': !!n.errorText || /^[45]/.test(n.status) }]"
                    :title="n.url"
                    @click="openNetFromDock(n.requestId)"
                    @contextmenu.prevent="openNetMenu($event, n)"
                  >
                    <td class="debug-net__name">{{ urlName(n.url) }}</td>
                    <td class="debug-net__method">{{ n.method || "—" }}</td>
                    <td :class="['debug-net__status', `debug-net__status--${statusTone(n.status)}`]">
                      {{ n.errorText ? "ERR" : n.status || "pending" }}
                    </td>
                    <td class="debug-net__type">{{ n.type || "other" }}</td>
                    <td class="debug-net__size">{{ n.fromCache ? "缓存" : fmtSize(n.size || n.received) }}</td>
                    <td class="debug-net__dur">{{ fmtDuration(n.duration) }}</td>
                    <td class="debug-net__wf">
                      <span
                        :class="['debug-net__wfbar', `is-${statusTone(n.status)}`, { 'is-failed': !!n.errorText }]"
                        :style="waterfallStyle(n)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="debug-empty">
                <b>{{ networkRequests.length ? "没有符合条件的请求" : "暂无网络日志" }}</b>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 新建页面弹框 -->
    <div v-if="createOpen" class="debug-modal" @click.self="closeCreatePage">
      <form class="debug-modal__box" @submit.prevent="submitCreatePage" @keydown.esc.prevent="closeCreatePage">
        <h3 class="debug-modal__title">新建页面</h3>
        <p class="debug-modal__desc">
          填写的地址会在调试浏览器里打开，地址会出现在左侧目标轨道。
        </p>
        <input
          ref="createInputRef"
          v-model="createUrl"
          class="debug-input debug-input--block"
          placeholder="https://example.com 或 localhost:5173"
          spellcheck="false"
          autocomplete="off"
        />
        <div class="debug-modal__foot">
          <span class="debug-modal__hint">留空则打开 about:blank</span>
          <span class="debug-modal__spacer" />
          <button type="button" class="debug-btn" :disabled="createLoading" @click="closeCreatePage">取消</button>
          <button type="submit" class="debug-btn debug-btn--primary" :disabled="createLoading">
            {{ createLoading ? "创建中…" : "创建" }}
          </button>
        </div>
      </form>
    </div>

    <!-- 元素树右键菜单（对齐 F12 Elements） -->
    <div
      v-if="contextMenu.open"
      class="debug-ctxmenu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="debug-ctxmenu__hd">&lt;{{ contextMenu.node ? nodeLabel(contextMenu.node) : "" }}&gt;</div>
      <button class="debug-ctxmenu__item" :disabled="contextMenu.node?.nodeType !== 1" @click="runContextAction('edit')">编辑 HTML <kbd>F2</kbd></button>
      <button class="debug-ctxmenu__item" @click="runContextAction('copy')">复制 outerHTML</button>
      <button class="debug-ctxmenu__item" :disabled="contextMenu.node?.nodeType !== 1" @click="runContextAction('copySelector')">复制选择器</button>
      <button class="debug-ctxmenu__item" :disabled="contextMenu.node?.nodeType !== 1" @click="runContextAction('style')">检查样式</button>
      <div class="debug-ctxmenu__sep" />
      <button class="debug-ctxmenu__item" @click="runContextAction('expand')">展开子树</button>
      <button class="debug-ctxmenu__item" @click="runContextAction('collapse')">折叠子树</button>
      <button class="debug-ctxmenu__item" :disabled="contextMenu.node?.nodeType !== 1" @click="runContextAction('scroll')">滚动到视图</button>
      <button class="debug-ctxmenu__item" :disabled="contextMenu.node?.nodeType !== 1" @click="runContextAction('screenshot')">截取节点</button>
      <div class="debug-ctxmenu__sep" />
      <button class="debug-ctxmenu__item" :disabled="contextMenu.node?.nodeType !== 1" @click="runContextAction('hide')">隐藏元素</button>
      <button class="debug-ctxmenu__item debug-ctxmenu__item--danger" @click="runContextAction('delete')">删除节点</button>
      <div class="debug-ctxmenu__sep" />
      <button class="debug-ctxmenu__item" @click="runContextAction('refresh')">刷新 DOM 树</button>
    </div>

    <!-- 网络行右键菜单（复制 cURL / fetch、重放、屏蔽入口） -->
    <div
      v-if="netMenu.open"
      class="debug-ctxmenu"
      :style="{ left: netMenu.x + 'px', top: netMenu.y + 'px' }"
      @click.stop
    >
      <div class="debug-ctxmenu__hd" :title="netMenu.entry?.url">
        {{ netMenu.entry ? `${netMenu.entry.method || "GET"} ${urlName(netMenu.entry.url)}` : "" }}
      </div>
      <button class="debug-ctxmenu__item" @click="runNetAction('curl')">复制为 cURL</button>
      <button class="debug-ctxmenu__item" @click="runNetAction('fetch')">复制为 fetch</button>
      <div class="debug-ctxmenu__sep" />
      <button class="debug-ctxmenu__item" title="在页面上下文里用 fetch 重发（带页面 Cookie / 会话）" @click="runNetAction('replay')">重放请求</button>
      <button class="debug-ctxmenu__item debug-ctxmenu__item--danger" title="加入屏蔽规则并开启拦截" @click="runNetAction('block')">屏蔽该 URL</button>
    </div>

    <!-- 命令面板（Ctrl+K）：页签 / 截屏 / 导出 / 采样 / 节流等一键直达 -->
    <div v-if="cmdOpen" class="debug-cmdk" @click.self="closeCmdPalette">
      <div class="debug-cmdk__box">
        <input
          ref="cmdInputRef"
          v-model="cmdQuery"
          class="debug-cmdk__input"
          placeholder="搜索命令：页签 / 截屏 / 导出 / 采样 / 节流…"
          spellcheck="false"
          autocomplete="off"
          @keydown="cmdKeydown"
        />
        <div class="debug-cmdk__list">
          <div
            v-for="(item, i) in cmdResults"
            :key="item.id"
            :class="['debug-cmdk__item', { 'is-active': i === cmdIndex }]"
            @mouseenter="cmdIndex = i"
            @click="runCmd(item)"
          >
            <span class="debug-cmdk__group">{{ item.group }}</span>
            <span class="debug-cmdk__label">{{ item.label }}</span>
          </div>
          <div v-if="!cmdResults.length" class="debug-cmdk__empty">没有匹配的命令</div>
        </div>
        <div class="debug-cmdk__foot">
          <span>{{ cmdResults.length }} 条命令</span>
          <span class="debug-tool__spacer" />
          <span>↑↓ 选择 · 回车执行 · Esc 关闭</span>
        </div>
      </div>
    </div>
  </div>
</template>
