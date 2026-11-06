<script setup lang="ts">
/**
 * 调试中心（DevTools 工作台）
 *
 * <p>页面级路线 {@code /debug}，采用「工作台」布局：</p>
 * <ul>
 *   <li>顶部状态带：浏览器状态 / WS 状态 / 调试端口，以及刷新、新建页面、启动、停止；</li>
 *   <li>左侧目标轨道：调试端口、浏览器版本、运行时长、WS 端点常驻首屏，下面是目标列表；</li>
 *   <li>右侧单面板：控制台 / 网络 / 源码 / 截屏 / 求值 五个页签，每次只开一个。</li>
 * </ul>
 *
 * <p>跟后端的通道有两路：REST {@code /ms/cdp/**}（一次性操作：状态、启动、停止、截屏…）
 * 与 WebSocket {@code /ws/cdp}（实时事件 + JSON-RPC 调用）。实时通道由
 * {@code @pages/debug/api/cdpApi} 的 {@code CdpClient} 持有。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  cdpCloseTarget,
  cdpContent,
  cdpCreateTarget,
  cdpEvaluate,
  cdpNavigate,
  cdpScreenshot,
  cdpStart,
  cdpStatus,
  cdpStop,
  cdpTargets,
  CDP_WS_PATH,
  createCdpClient,
} from "../api/cdpApi";
import type { CdpStatus, CdpTarget } from "../api/cdpApi";
import { createSseClient } from "@repo/utils";
import type { SseClient } from "@repo/utils";
import "../styles/debug.css";

/* ==================== 页面级状态 ==================== */

/** 当前选中的页签 */
type PageTab = "console" | "network" | "elements" | "svg" | "dom" | "screenshot" | "evaluate";
const pageTab = ref<PageTab>("network");

/** 浏览器状态 */
const status = ref<CdpStatus | null>(null);
const statusLoading = ref(false);

/** 页面（目标）列表 */
const targets = ref<CdpTarget[]>([]);

/** 选中的目标标识（浏览器级时为空） */
const selectedTarget = ref<string>("");

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
}

/** 控制台日志 */
const consoleMessages = ref<ConsoleEntry[]>([]);

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
  /** 发起时间 */
  timestamp: number;
  /** 请求头 */
  requestHeaders: Record<string, string>;
  /** 响应头 */
  responseHeaders: Record<string, string>;
  /** 发起者（type + url + lineNumber） */
  initiator: string;
  /** 失败原因 */
  errorText: string;
  /** 来源目标 */
  targetId: string;
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
const netPreserveLog = ref(false);

/** 网络：当前展开详情的请求 */
const netDetailId = ref("");
/** 网络详情当前页签 */
const netDetailTab = ref<"headers" | "response" | "initiator">("headers");
/** 详情区固定高度（px，可拖拽调整，避免高度随内容跳变） */
const netDetailHeight = ref(260);
/** 详情区是否正在拖拽分隔条 */
let netResizing = false;
/** 响应体是否格式化展示 */
const netBodyPretty = ref(true);
const netBodyLoading = ref(false);

/** 变化监视（DOM / 导航）是否开启 */
const watchEnabled = ref(true);

/** 自动注入 SkyWalking sw8 追踪头 */
const sw8Enabled = ref(true);

/** SVG 抽取结果 */
const svgItems = ref<SvgItem[]>([]);
const svgLoading = ref(false);
const svgError = ref("");
/** 只显示已保存的 SVG */
const svgSavedOnly = ref(false);
/** 已保存 SVG 的 id（localStorage 持久化） */
const svgSaved = ref<Set<string>>(new Set(loadSavedSvg()));

/** 原始网站舞台：布局（上下 / 左右），默认左右：画面在左，DOM 与样式在右 */
const stageLayout = ref<"top" | "left">("left");
/** 原始网站舞台是否展开 */
const stageOpen = ref(true);
/** 舞台截屏（data url） */
const stageShot = ref("");
const stageLoading = ref(false);
/** 舞台截屏自动刷新 */
const stageLive = ref(true);
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

/** 七个页签（带计数） */
const tabs = computed<{ name: PageTab; label: string; count?: number }[]>(() => [
  { name: "console", label: "控制台", count: consoleMessages.value.length },
  { name: "network", label: "网络", count: networkRequests.value.length },
  { name: "elements", label: "元素" },
  { name: "svg", label: "SVG", count: svgItems.value.length },
  { name: "dom", label: "源码" },
  { name: "screenshot", label: "截屏" },
  { name: "evaluate", label: "求值" },
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
 */
async function reloadStatus() {
  try {
    statusLoading.value = true;
    status.value = await cdpStatus();
  } catch (error) {
    status.value = null;
    console.warn("[cdp] 状态拉取失败", error);
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 刷新目标列表（首次拿到列表时自动选中第一个页面，省掉一次点击）
 */
async function reloadTargets() {
  try {
    const list = await cdpTargets();
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
  } catch (error) {
    console.warn("[cdp] 目标列表拉取失败", error);
    targets.value = [];
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
      await reloadStatus();
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
 */
async function closePage(targetId: string) {
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
  if (!netPreserveLog.value) {
    networkRequests.value = [];
    netDetailId.value = "";
    netBodyRaw.value = "";
  }
  domRaw.value = "";
  screenshotUrl.value = "";
  svgItems.value = [];
  svgError.value = "";
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
    void reloadTargets();
    void reloadStatus();
    // 页面脚本（变化监视 / sw8）依赖 WS 指令通道，连上后补挂一次
    injectPageScripts();
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
      void reloadTargets();
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
      appendNetwork(m);
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
    case "Page.frameNavigated":
      onPageChanged("导航", m);
      reinjectPageScripts(String(m.targetId ?? "") || selectedTarget.value);
      break;
    case "Page.loadEventFired":
      onPageChanged("加载完成", m);
      // 页面加载完成后脚本上下文已重建，重挂变化监视 / sw8
      reinjectPageScripts(String(m.targetId ?? "") || selectedTarget.value);
      break;
    // 目标变化：刷新列表（响应事件，不是轮询）
    case "Target.targetCreated":
    case "Target.targetDestroyed":
      void reloadTargets();
      break;
    case "Target.targetChanged":
      onTargetChanged(m);
      break;
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
  if (method === "Runtime.exceptionThrown" || exception.description) {
    type = "error";
    text = String(exception.description ?? details.text ?? text ?? "未捕获异常");
  }
  const record: ConsoleEntry = {
    key: ++consoleSeq,
    type,
    level: normalizeLevel(type),
    text: text || "(空消息)",
    targetId: String(m.targetId ?? selectedTarget.value ?? ""),
    timestamp: Number(m.timestamp || 0) || Date.now(),
  };
  consoleMessages.value.push(record);
  if (consoleMessages.value.length > maxConsole) {
    consoleMessages.value = consoleMessages.value.slice(-maxConsole);
  }
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
    requestHeaders: {},
    responseHeaders: {},
    initiator: "",
    errorText: "",
    targetId: "",
  };
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
}

/** 展开 / 收起一条请求的详情 */
function toggleNetDetail(id: string) {
  netDetailId.value = netDetailId.value === id ? "" : id;
  netDetailTab.value = "headers";
  netBodyRaw.value = "";
}

/** 切换详情子页签（响应按需拉取） */
function showNetTab(tab: "headers" | "response" | "initiator") {
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

/* ==================== SkyWalking sw8 自动注入 ==================== */

/**
 * 生成 sw8 追踪头（SkyWalking 8/9 的跨进程传播协议）
 *
 * <p>格式：{@code 1-<traceId>-<segmentId>-<spanId>-<service>-<instance>-<endpoint>-<peer>}，
 * 各段 base64 编码。traceId / segmentId / spanId 用页面侧随机串构造，
 * 这样页面里发出的 XHR / fetch 会带上同一条链路标，后端 OAP 能把浏览器请求
 * 串进 SkyWalking 的调用链（skywalking-client-js 同款口径，这里内联实现，
 * 不引 CDN，避免离线环境失败）。</p>
 */
function newSw8(service: string, endpoint: string, peer: string): string {
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
  const traceId = `${Date.now().toString(16)}.${rand(8)}.${rand(16)}`;
  const segmentId = `${Date.now().toString(16)}.${rand(8)}.${rand(16)}`;
  const parts = ["1", b64(traceId), b64(segmentId), b64("0"), b64(service), b64("browser"), b64(endpoint), b64(peer)];
  return parts.join("-");
}

/**
 * 注入到页面的 sw8 追踪脚本
 *
 * <p>包住 {@code window.fetch} 与 {@code XMLHttpRequest.prototype.open/send}：
 * 同源请求自动补 {@code sw8} / {@code sw8-correlation} 头，跨域请求只补白名单
 * （默认放行当前站点与常见 OAP 地址），不破坏页面原有逻辑。开关写进
 * {@code window.__cdpSw8}，前端切目标 / 关开关时重挂即可。</p>
 */
const SW8_SCRIPT = `(function () {
  var KEY = 'sw8', CORR = 'sw8-correlation';
  var SERVICE = 'monitor-debug-center';
  function sameOrigin(u) { try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; } }
  function peerOf(u) { try { return new URL(u, location.href).host; } catch (e) { return location.host; } }
  function rand(n) { var s = ''; for (var i = 0; i < n; i++) { s += Math.floor(Math.random() * 16).toString(16); } return s; }
  function b64(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return btoa(s); } }
  function newSw8(endpoint, peer) {
    var t = Date.now().toString(16) + '.' + rand(8) + '.' + rand(16);
    var g = Date.now().toString(16) + '.' + rand(8) + '.' + rand(16);
    return ['1', b64(t), b64(g), b64('0'), b64(SERVICE), b64('browser'), b64(endpoint), b64(peer)].join('-');
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

/** 抽取当前页面里的全部 SVG */
async function loadSvgs() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
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

/** 显示中的 SVG 卡片 */
const visibleSvgs = computed(() => (svgSavedOnly.value ? svgItems.value.filter((s) => s.saved) : svgItems.value));

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
async function loadElementTree() {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
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
    ElMessage.error("读取 DOM 失败: " + (error as Error).message);
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
  elementEditing.value = false;
  selectedOuter.value = node.nodeType === 3 ? node.nodeValue : "";
  styleRules.value = [];
  styleError.value = "";
  if (detailTab.value === "style") {
    void loadMatchedStyles();
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

/** 详情区当前看的页签：HTML 还是样式 */
const detailTab = ref<"html" | "style">("html");
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

/** 切换详情页签（样式页签按需读取） */
function showDetailTab(tab: "html" | "style") {
  detailTab.value = tab;
  if (tab === "style") {
    void loadMatchedStyles();
  }
}

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

// 换目标后旧的 DOM 树不再属于当前页面，全部丢掉
watch(selectedTarget, () => {
  void stopPickNode();
  elementTree.value = null;
  elementNodeCount.value = 0;
  selectedNode.value = null;
  selectedOuter.value = "";
  elementEditing.value = false;
  expandedNodes.value = new Set();
  styleRules.value = [];
  styleError.value = "";
  styleDomainsTarget = "";
  detailTab.value = "html";
  svgItems.value = [];
  svgError.value = "";
  domDirty.value = false;
  netDetailId.value = "";
  netBodyRaw.value = "";
  stageShot.value = "";
  stageHighlight.value = null;
  stageObserver?.disconnect();
  // 新目标重新挂变化监视 / sw8 注入 / favicon（一次性，事件驱动）
  watchInjected.clear();
  sw8Injected.clear();
  injectPageScripts();
});

// 切到「元素」页签时读一次；切到 SVG 时抽一次，省掉手动点击
watch(pageTab, (tab) => {
  if (tab !== "elements") {
    void stopPickNode();
  }
  if (tab === "elements") {
    if (!elementTree.value && selectedTarget.value) {
      loadElementTree();
    }
    if (stageOpen.value && !stageShot.value) {
      void refreshStage();
    }
  } else if (tab === "svg") {
    if (!svgItems.value.length && selectedTarget.value) {
      void loadSvgs();
    }
  }
});

// 变化开关：开启补注入、关闭让页面观察者下线（事件驱动，无定时器）
watch(watchEnabled, () => syncWatchInjection());
// 打开画面 / 开启实时：补一次截屏；实时刷新由页面事件驱动，不再定时轮询
watch([stageOpen, stageLive], () => {
  if (stageOpen.value && stageLive.value && pageTab.value === "elements") {
    void refreshStage();
  }
});

// 画面布局切换 / 页签重新进入 / 目标栏折叠：容器尺寸变了，重新校准高亮框
watch([stageLayout, pageTab, railCollapsed, stageOpen], () => {
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
 * 页面导航（ES 变更标题）
 */
async function doNavigate(url: string) {
  if (!selectedTarget.value) {
    ElMessage.warning("请先在左侧选择一个目标");
    return;
  }
  try {
    await cdpNavigate(selectedTarget.value, url);
  } catch (error) {
    ElMessage.error("导航失败: " + (error as Error).message);
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

/* ==================== Evaluate ==================== */

const evaluateExpression = ref("document.title");
const evaluateResult = ref("");
const evaluateLoading = ref(false);

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
  evaluateLoading.value = true;
  try {
    const result = await cdpEvaluate(selectedTarget.value, evaluateExpression.value);
    evaluateResult.value = formatEvalResult(result);
  } catch (error) {
    evaluateResult.value = "求值失败: " + (error as Error).message;
  } finally {
    evaluateLoading.value = false;
  }
}

/* ==================== 生命周期 ==================== */

onMounted(() => {
  reloadStatus();
  reloadTargets();
  // 指令通道（WS）+ 事件通道（全局 SSE）双通道，职责分离
  connectWs();
  connectSse();
  uptimeTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  // 右键菜单：点别处 / Esc / 缩放都要收起
  window.addEventListener("click", closeContextMenu);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("keydown", onGlobalKeydown);
});

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    closeContextMenu();
  }
}

onBeforeUnmount(() => {
  disconnectWs();
  disconnectSse();
  window.removeEventListener("click", closeContextMenu);
  window.removeEventListener("resize", closeContextMenu);
  window.removeEventListener("keydown", onGlobalKeydown);
  stageObserver?.disconnect();
  clearInterval(uptimeTimer);
  if (pickTimer) {
    clearInterval(pickTimer);
    pickTimer = undefined;
  }
});
</script>

<template>
  <div class="debug-page">
    <!-- 顶部状态带 -->
    <header class="debug-hdr">
      <h2 class="debug-hdr__title">调试中心</h2>
      <span :class="['debug-pill', `debug-pill--${stateTone}`]">
        <i class="debug-dot" />{{ stateLabel }}
      </span>
      <span :class="['debug-pill', wsConnected ? 'debug-pill--info' : 'debug-pill--muted']" title="CDP 指令通道 WebSocket">
        <i class="debug-dot" />{{ wsConnected ? "WS 指令" : "WS 断开" }}
      </span>
      <span :class="['debug-pill', sseConnected ? 'debug-pill--info' : 'debug-pill--muted']" title="全局 SSE 事件流 /ms/cdp/events">
        <i class="debug-dot" />{{ sseConnected ? "SSE 已连接" : "SSE 断开" }}
      </span>
      <span v-if="status?.port" class="debug-hdr__port">:{{ status.port }}</span>
      <button
        :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': sw8Enabled }]"
        :title="'自动为页面 XHR / fetch 注入 SkyWalking sw8 追踪头'"
        @click="toggleSw8"
      >
        sw8 {{ sw8Enabled ? "开" : "关" }}
      </button>
      <span v-if="changeTagCount" class="debug-pill debug-pill--warn" title="页面变化已输出到控制台">
        <i class="debug-dot" />变化 {{ changeTagCount }}
      </span>
      <span class="debug-hdr__spacer" />
      <button class="debug-btn" :disabled="statusLoading" @click="reloadStatus">刷新</button>
      <button class="debug-btn" :disabled="!running" :title="running ? '' : '浏览器未启动'" @click="openCreatePage">
        + 新建页面
      </button>
      <button
        class="debug-btn debug-btn--primary"
        :disabled="statusLoading"
        :title="running ? '浏览器状态异常时，点这里做一次自愈重启' : '启动调试浏览器'"
        @click="startBrowser"
      >
        {{ running ? "重启" : "启动" }}
      </button>
      <button class="debug-btn debug-btn--danger" :disabled="!running || statusLoading" @click="stopBrowser">
        {{ statusLoading ? "处理中…" : "停止" }}
      </button>
    </header>

    <!-- 原始网站条：显示当前调试的站点，下面是可嵌入 / 弹出的 F12 舞台 -->
    <div class="debug-sitebar">
      <img v-if="activeTarget && faviconUrl(activeTarget)" :src="faviconUrl(activeTarget)" class="debug-sitebar__ico" alt="" @error="onFaviconError(activeTarget.id)" />
      <span v-else class="debug-sitebar__ico debug-sitebar__ico--fallback">◈</span>
      <span class="debug-sitebar__k">原始网站</span>
      <span class="debug-sitebar__url" :title="activeUrl || '未选择目标'">{{ activeUrl || "未选择目标" }}</span>
      <span class="debug-sitebar__spacer" />
      <span v-if="stageLive" class="debug-sitebar__live"><i class="debug-dot" />实时</span>
    </div>

    <div class="debug-body">
      <!-- 左侧目标轨道（可折叠为一条目标图标带） -->
      <aside :class="['debug-rail', { 'is-collapsed': railCollapsed }]">
        <!-- 折叠态：只留展开按钮 + 目标图标 -->
        <div v-if="railCollapsed" class="debug-railmini">
          <button class="debug-rail__fold debug-rail__fold--mini" title="展开目标栏" @click="toggleRail">»</button>
          <span class="debug-railmini__k">目标</span>
          <button
            v-for="t in targets"
            :key="t.id"
            :class="['debug-railmini__t', { 'is-active': t.id === selectedTarget }]"
            :title="`${targetTitle(t)} · ${t.url || t.id}`"
            @click="selectTarget(t.id)"
          >
            <img v-if="faviconUrl(t)" :src="faviconUrl(t)" alt="" @error="onFaviconError(t.id)" />
            <i v-else class="debug-railmini__fallback">◈</i>
          </button>
          <span v-if="!targets.length" class="debug-railmini__none" title="还没有目标">·</span>
          <span class="debug-railmini__n">{{ targetCount }}</span>
        </div>

        <template v-else>
          <div class="debug-engine">
            <span class="debug-engine__k">调试端口</span>
            <span class="debug-engine__v">{{ status?.port ?? "—" }}</span>
            <span class="debug-engine__k">浏览器</span>
            <span class="debug-engine__v" :title="status?.version">{{ status?.version || "—" }}</span>
            <span class="debug-engine__k">运行时长</span>
            <span class="debug-engine__v">{{ uptime }}</span>
            <span class="debug-engine__k">WS 端点</span>
            <span class="debug-engine__v debug-engine__v--sm" :title="status?.endpoint">
              {{ status?.endpoint || "—" }}
            </span>
          </div>

          <div class="debug-railhd">
            <span>目标</span>
            <span class="debug-railhd__n">{{ targetCount }} 个</span>
            <button class="debug-rail__fold" title="收起目标栏" @click="toggleRail">«</button>
          </div>

          <div class="debug-tlist">
            <button
              v-for="t in targets"
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
              <span class="debug-target__close" title="关闭页面" @click.stop="closePage(t.id)">×</span>
            </button>

            <div v-if="!targets.length" class="debug-empty debug-empty--rail">
              <b>还没有目标</b>
              <span>启动浏览器后，页面 / SW / iframe 会列在这里</span>
            </div>
          </div>
        </template>
      </aside>

      <!-- 右侧工作面板 -->
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
        </div>

        <!-- 控制台工具行 -->
        <div v-if="pageTab === 'console'" class="debug-tool">
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

        <!-- 网络工具行（F12 风格：类型筛选 / 保留日志 / 汇总） -->
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
          <button class="debug-btn debug-btn--sm" @click="clearNetwork">清空</button>
        </div>

        <!-- 元素工具行 -->
        <div v-else-if="pageTab === 'elements'" class="debug-tool">
          <button class="debug-btn debug-btn--sm" :disabled="elementLoading" @click="loadElementTree">
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
          <span class="debug-sitebar__seg">
            <button :class="['debug-sitebar__segb', { 'is-active': stageLayout === 'top' }]" title="画面在上方" @click="stageLayout = 'top'">上下</button>
            <button :class="['debug-sitebar__segb', { 'is-active': stageLayout === 'left' }]" title="画面在左侧" @click="stageLayout = 'left'">左右</button>
          </span>
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

        <!-- SVG 工具行 -->
        <div v-else-if="pageTab === 'svg'" class="debug-tool">
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="svgLoading" @click="loadSvgs">
            {{ svgLoading ? "抽取中…" : "重新抽取" }}
          </button>
          <label class="debug-tool__switch">
            <input v-model="svgSavedOnly" type="checkbox" /> 只看已保存（{{ svgSaved.size }}）
          </label>
          <span class="debug-tool__spacer" />
          <span class="debug-tool__hint">{{ svgItems.length }} 个 SVG · 内联 / &lt;use&gt; / 外链</span>
        </div>

        <!-- 源码工具行 -->
        <div v-else-if="pageTab === 'dom'" class="debug-tool">
          <input
            v-model="navigateUrl"
            class="debug-input"
            placeholder="跳转 URL（如 https://example.com）"
            @keyup.enter="doNavigate(navigateUrl)"
          />
          <button class="debug-btn debug-btn--sm" @click="doNavigate(navigateUrl)">跳转</button>
          <span class="debug-tool__spacer" />
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="domLoading" @click="fetchContent">
            获取内容
          </button>
        </div>

        <!-- 截屏工具行 -->
        <div v-else-if="pageTab === 'screenshot'" class="debug-tool">
          <span class="debug-tool__hint">
            {{ selectedTarget ? `当前目标: ${selectedTarget}` : "请先在左侧选择或创建目标" }}
          </span>
          <span class="debug-tool__spacer" />
          <button class="debug-btn debug-btn--sm" :disabled="screenshotLoading" @click="doScreenshot()">截屏</button>
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="screenshotLoading" @click="doScreenshot(true)">
            全长截屏
          </button>
        </div>

        <!-- 求值工具行 -->
        <div v-else class="debug-tool">
          <input
            v-model="evaluateExpression"
            class="debug-input"
            placeholder="JS 表达式（如 document.title）"
            @keyup.enter="doEvaluate"
          />
          <button class="debug-btn debug-btn--sm debug-btn--primary" :disabled="evaluateLoading" @click="doEvaluate">
            执行
          </button>
        </div>

        <!-- 控制台（change tag 用专门的配色） -->
        <div v-if="pageTab === 'console'" class="debug-scroll">
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
            <span v-if="consoleMessages.length">换个级别或清空过滤词试试</span>
            <span v-else>页面 console.* / 异常 / DOM 变化都会实时到这里</span>
          </div>
        </div>

        <!-- 网络（F12 风格列表 + 详情） -->
        <div v-else-if="pageTab === 'network'" class="debug-netwrap">
          <div class="debug-scroll debug-scroll--net">
            <table v-if="networkRows.length" class="debug-net">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>方法</th>
                  <th>状态</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>时间</th>
                  <th>耗时</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="n in networkRows" :key="n.seq">
                  <tr
                    :class="['debug-net__tr', { 'is-active': netDetailId === n.requestId, 'is-failed': !!n.errorText || /^[45]/.test(n.status) }]"
                    :title="n.url"
                    @click="toggleNetDetail(n.requestId)"
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
                    <td class="debug-net__size">{{ n.fromCache ? "缓存" : fmtSize(n.size || n.received) }}</td>
                    <td class="debug-net__time">{{ fmtTime(n.timestamp) }}</td>
                    <td class="debug-net__dur">{{ fmtDuration(n.duration) }}</td>
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
              <template v-else>
                <div class="debug-netdetail__sec">发起者</div>
                <div class="debug-netdetail__pre">{{ netDetail.initiator || "（页面脚本）" }}</div>
                <div class="debug-netdetail__sec">时间线</div>
                <div class="debug-netdetail__kv"><span class="debug-netdetail__k">发起</span><span class="debug-netdetail__v">{{ fmtTime(netDetail.timestamp) }}</span></div>
                <div class="debug-netdetail__kv"><span class="debug-netdetail__k">耗时</span><span class="debug-netdetail__v">{{ fmtDuration(netDetail.duration) }}</span></div>
                <div v-if="netDetail.errorText" class="debug-netdetail__kv"><span class="debug-netdetail__k">错误</span><span class="debug-netdetail__v">{{ netDetail.errorText }}</span></div>
              </template>
            </div>
          </div>
        </div>

        <!-- SVG 卡片 -->
        <div v-else-if="pageTab === 'svg'" class="debug-scroll debug-svg">
          <div v-if="svgLoading" class="debug-empty"><b>正在抽取 SVG…</b></div>
          <div v-else-if="!visibleSvgs.length" class="debug-empty">
            <b>{{ svgError || (svgSavedOnly ? "还没有保存的 SVG" : "没有 SVG") }}</b>
            <span v-if="!svgError">点上方「重新抽取」扫描当前页面</span>
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
                  <button class="debug-btn debug-btn--sm" @click="copyText(item.markup, '已复制 SVG 源码')">复制源码</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 元素（F12 Elements） -->
        <div v-else-if="pageTab === 'elements'" class="debug-elements">
          <div v-if="!elementTree && !elementLoading" class="debug-empty">
            <b>还没有读取 DOM</b>
            <span>点上方「刷新 DOM」把当前页面的节点树拉下来</span>
          </div>
          <div v-else :class="['debug-el', `debug-el--${stageLayout}`]">
            <!-- 元素页签内部的预览舞台：跟 DOM 树上下 / 左右联动，点画面反查节点 -->
            <div v-if="stageOpen" class="debug-el__stage">
              <div ref="stageViewRef" class="debug-stage__view" @click="pickFromStage">
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
                <span class="debug-stage__hint">{{ stageHint }}</span>
                <span class="debug-tool__spacer" />
                <label class="debug-stage__switch">
                  <input v-model="stageLive" type="checkbox" /> 实时刷新
                </label>
              </div>
            </div>

            <div class="debug-el__body">
              <div class="debug-el__tree" @mouseleave="clearHighlight">
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
                  nodeId {{ selectedNode.nodeId }}{{ selectedNode.childCount ? ` · ${selectedNode.childCount} 个子节点` : "" }}
                </span>
                <span class="debug-el__dtabs">
                  <button
                    :class="['debug-el__dtab', { 'is-active': detailTab === 'html' }]"
                    @click="showDetailTab('html')"
                  >
                    HTML
                  </button>
                  <button
                    :class="['debug-el__dtab', { 'is-active': detailTab === 'style' }]"
                    :disabled="selectedNode.nodeType !== 1"
                    @click="showDetailTab('style')"
                  >
                    样式<span v-if="styleRules.length" class="debug-el__dtabn">{{ styleRules.length }}</span>
                  </button>
                </span>
                <span class="debug-tool__spacer" />
                <template v-if="detailTab === 'html'">
                  <button class="debug-btn debug-btn--sm" @click="copyOuter">复制</button>
                  <button
                    class="debug-btn debug-btn--sm"
                    :disabled="selectedNode.nodeType !== 1"
                    @click="startEditOuter"
                  >
                    编辑
                  </button>
                </template>
                <button
                  v-else
                  class="debug-btn debug-btn--sm"
                  :disabled="styleLoading"
                  @click="loadMatchedStyles"
                >
                  {{ styleLoading ? "读取中…" : "刷新样式" }}
                </button>
              </div>

              <template v-if="detailTab === 'html'">
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

              <div v-else class="debug-el__styles">
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
            </div>
            </div>
          </div>
        </div>

        <!-- 源码 -->
        <div v-else-if="pageTab === 'dom' && !domRaw && !domLoading" class="debug-empty">
          <b>还没有拉取源码</b>
          <span>选中目标后点右上「获取内容」</span>
        </div>
        <pre v-else-if="pageTab === 'dom'" class="debug-code">{{ domLoading ? "加载中…" : domRaw }}</pre>

        <!-- 截屏 -->
        <div v-else-if="pageTab === 'screenshot'" class="debug-shot">
          <img v-if="screenshotUrl" :src="screenshotUrl" alt="页面截图" />
          <div v-else class="debug-empty">
            <b>暂无截屏</b>
            <span>选中目标后点「截屏」或「全长截屏」</span>
          </div>
        </div>

        <!-- 求值 -->
        <div v-else-if="!evaluateResult && !evaluateLoading" class="debug-empty">
          <b>还没有执行结果</b>
          <span>在右上输入 JS 表达式后回车执行</span>
        </div>
        <pre v-else class="debug-code debug-code--out">{{ evaluateResult }}</pre>
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
  </div>
</template>
