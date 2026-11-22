<!--
  统一文件预览入口（FilePreviewEntry）。

  <p>独立构建入口 preview.html 的根组件，两种运行形态：</p>
  <ol>
    <li><b>内嵌态</b>：由后端返回的入口壳注入 {@code window.__FILE_PREVIEW_BOOT__}
        （bytesUrl 短时效令牌直链 + 文件名 + bucket/key 等），直接拉原始字节渲染——
        不再解析地址栏、不再 iframe 嵌套，打破「壳里再嵌壳」的循环；</li>
    <li><b>顶层态</b>：地址栏 {@code ?url=<base64>&render=&name=} 打开。
        {@code render=server} 直接 iframe 服务端通道（后端回壳 → 内嵌态）；
        缺省时先查桶配置 {@code ?config=true}——开启了下载就拉
        {@code ?download=true} 二进制本地渲染，没开启则退回 iframe 服务端通道。</li>
  </ol>

  <p>渲染分流（按优先级）：</p>
  <ol>
    <li>Office 家族 → {@link PreviewOfficePanel}（preset-office：OOXML/OLE2/RTF/
        OpenDocument/iWork/WordPerfect/Hangul，含魔数校正与密文检测）；</li>
    <li>file-viewer 注册表后缀（274 格式口径）→ 按扩展名加载渲染器插件组，
        file-viewer 按文件名自动选渲染器（见 previewEntryRenderers）；</li>
    <li>file-viewer 不支持、项目已有专用面板的格式 → 专用组件注册表
        （OFD/SWF 等，异步加载）；新增格式 = 写面板组件 + 注册一行；</li>
    <li>都未命中 → 「暂不支持预览」提示。</li>
  </ol>
-->
<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, type Component } from "vue";
import PreviewOfficePanel from "../components/PreviewOfficePanel.vue";
import FvPanelBase from "../components/fv/FvPanelBase.vue";
import { isClientRenderable } from "../utils/officeRenderer";
import { base64ToUtf8, specFor, TEXT_EXTENSIONS, type RendererSpec } from "../utils/previewEntryRenderers";
import { resolveObjectUrl } from "../api/filestorageApi";

/* ==================== 专用面板组件注册表（file-viewer 不支持的格式） ==================== */

/**
 * file-viewer 覆盖不了、但项目已有专用实现的面板。
 *
 * <p>全部异步组件：面板各自的解码依赖（@ofdjs/viewer、Ruffle WASM 等）只在
 * 真正预览对应格式时才加载。新增支持格式：写一个面板组件（props 约定见下）
 * 并在本表注册后缀即可，入口主流程无需改动。</p>
 *
 * <p>props 约定（与管理页调用点一致）：
 * {@code bucket / objectKey / fileName / inner? / size?}——面板内部经
 * resolveObjectUrl 自行取数，因此只适用于「顶层 url 是对象直链（可解析出
 * 桶与键）」的场景；票据直链（/ot/...）解析不出桶键，专用面板层不可用。</p>
 */
const SPECIAL_COMPONENT_BY_EXT: Record<string, Component> = {
  ofd: defineAsyncComponent(() => import("../components/PreviewOfdPanel.vue")),
  swf: defineAsyncComponent(() => import("../components/PreviewSwfPanel.vue")),
  // 大纲 / 脑图（非 XMind）：FreeMind .mm、OPML .opml（前端解析成树）
  mm: defineAsyncComponent(() => import("../components/fv/FvOutlinePanel.vue")),
  opml: defineAsyncComponent(() => import("../components/fv/FvOutlinePanel.vue")),
  // .class：前端反编译（CFR）+ Binary Inspector 十六进制检视 + 下载反编译源码
  class: defineAsyncComponent(() => import("../components/fv/FvBinaryPanel.vue")),
  // .log：hs_err_pid*.log（JVM 崩溃日志）运维分析（结论 / 原文双模式），普通日志退化为文本
  log: defineAsyncComponent(() => import("../components/fv/FvLogAnalyzePanel.vue")),
  // Apache Arrow IPC（.arrow/.feather/.ipc）：renderer-data 无对应渲染器，
  // 专用面板用 apache-arrow 的 tableFromIPC 前端解析成表格
  arrow: defineAsyncComponent(() => import("../components/fv/FvArrowPanel.vue")),
  feather: defineAsyncComponent(() => import("../components/fv/FvArrowPanel.vue")),
  ipc: defineAsyncComponent(() => import("../components/fv/FvArrowPanel.vue")),
};

/* ==================== 引导参数（内嵌态唯一事实来源） ==================== */

/** 后端注入入口壳的引导参数 */
interface PreviewBoot {
  /** 字节直链（/ot/{token}?preview=true&raw=true，短时效预览令牌） */
  bytesUrl: string;
  /** 文件名（渲染器按其扩展名选择） */
  fileName: string;
  /** 文件大小（字节，仅展示） */
  size?: number;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 存储桶名（专用面板 resolveObjectUrl 取数用） */
  bucket?: string;
  /** 对象键（专用面板取数用；票据场景可不传） */
  key?: string;
}

declare global {
  interface Window {
    __FILE_PREVIEW_BOOT__?: PreviewBoot;
  }
}

/* ==================== 运行状态 ==================== */

/**
 * 入口状态机：
 *   loading  —— 解析参数 / 拉取字节中
 *   office   —— PreviewOfficePanel 接管（preset-office）
 *   client   —— file-viewer 渲染器接管（FvPanelBase）
 *   special  —— 专用面板组件接管（OFD/SWF 等）
 *   iframe   —— 服务端通道（render=server 或下载未开启的退路）
 *   unsupported —— 三层都未命中
 *   error    —— 参数/取数失败
 */
type EntryState = "loading" | "office" | "client" | "special" | "iframe" | "unsupported" | "error";

const state = ref<EntryState>("loading");
/** 错误 / 不支持提示文案 */
const message = ref("");
/** 展示标题（文件名） */
const displayTitle = ref("");
/** 展示大小 */
const displaySize = ref<number | null>(null);
/** 当前通道标签（调试可见：boot / top-server / top-download / iframe） */
const channelLabel = ref("");

/** Office 面板取数字节直链（PreviewOfficePanel 自行 fetch） */
const officeSrc = ref("");
/** 交给 file-viewer 的 File（按扩展名校正过） */
const fileRef = shallowRef<File | null>(null);
/** 当前渲染器组 */
const activeSpec = shallowRef<RendererSpec | null>(null);
/** 已加载的渲染器插件数组 */
const renderers = shallowRef<unknown[]>([]);
/** 专用面板组件 */
const specialComponent = shallowRef<Component | null>(null);
/** 专用面板 props（bucket/objectKey/fileName/inner/size） */
const specialProps = ref<Record<string, unknown>>({});
/** iframe 模式地址 */
const iframeSrc = ref("");
/** 渲染器插件加载中 */
const rendererLoading = ref(false);
/** 文本类预览是否因超出读取上限被截断（标题栏给出明确提示，避免误以为文件就这么长） */
const truncated = ref(false);

/* ---- 头栏增强：扩展名徽标 + 「更多」菜单收纳低频动作 ---- */

/** 标题旁的扩展名徽标（如 XLSX / OFD），空扩展名不显示 */
const typeBadge = computed(() => {
  const ext = extensionOf(displayTitle.value);
  return ext ? ext.toUpperCase() : "";
});

/** 「更多」菜单展开态与锚点元素 */
const moreOpen = ref(false);
const moreRef = ref<HTMLElement | null>(null);

/** 410 令牌过期自动续期的会话级防循环标记 */
const FPE_410_KEY = "fpe-410-retried";

/* ==================== 头栏动作与取数进度 ==================== */

/** 开发态标记：通道徽章仅调试可见，不向终端用户暴露内部通道名 */
const isDev = import.meta.env.DEV;
/** 可下载的字节直链（票据直链兜底；能解析桶键时优先签票据下载） */
const downloadUrl = ref("");
/** 可解析出的桶键（下载动作优先用它签短时票据，与各前端直渲面板同口径） */
const dlBucketKey = shallowRef<{ bucket: string; objectKey: string } | null>(null);
/** 压缩包内条目路径（下载时区分「下载本体」与「新标签打开条目字节」） */
const dlInner = ref("");
/** 是否具备下载出口（头栏与失败/不支持态共用） */
const canDownloadSource = computed(() => Boolean(downloadUrl.value || dlBucketKey.value));
/** 大文件流式取数进度（字节），仅 loading 态展示 */
const loadProgress = ref<{ loaded: number; total: number | null } | null>(null);
/** 复制链接成功的一次性反馈 */
const copied = ref(false);
/** 打印仅对渲染出可打印 DOM 的通道开放（Office 直渲与纯文本；canvas 类打印无意义） */
const printable = computed(() => state.value === "office" || (state.value === "client" && activeSpec.value?.presetId === "text"));

/** 取数进度文案（如 1.2 MB / 3.4 MB） */
const progressText = computed(() => {
  const p = loadProgress.value;
  if (!p || p.loaded <= 0) return "";
  const loaded = formatSize(p.loaded);
  return p.total && p.total > 0 ? `${loaded} / ${formatSize(p.total)}` : loaded;
});

/** 进度条宽度；总量未知时由 CSS 做不定长流动动画 */
const progressWidth = computed(() => {
  const p = loadProgress.value;
  if (!p || !p.total || p.total <= 0) return "";
  return `${Math.min(100, Math.round((p.loaded / p.total) * 100))}%`;
});

const loadingVisible = computed(() => state.value === "loading" || (state.value === "client" && rendererLoading.value));

/**
 * 透传给 file-viewer 的扩展 options（官方协议字段）：
 * - search.enabled：文本/代码类显式开启关键词搜索（命中高亮 + 计数 UI 由内置搜索框承担）；
 * - search.className / activeClassName：命中高亮的 DOM 标记 class（宿主可在
 *   styleIsolation:'none' 时深度定制样式；'auto'（Shadow DOM）下用内置默认视觉）。
 */
const viewerExtra = {
  search: {
    enabled: true,
    className: "fpe-search-hit",
    activeClassName: "fpe-search-hit--active",
  },
};

/**
 * 代码类扩展：关键词高亮输入框只对这些显示。
 * 配置/标记类（json/yaml/ini/xml/md…）打开即自带语法高亮显示，无需再搜。
 */
const CODE_EXTS = new Set([
  "js", "mjs", "cjs", "ts", "tsx", "jsx", "vue", "java", "py", "rb", "rs", "go",
  "php", "c", "cpp", "cc", "h", "hpp", "cs", "kt", "swift", "sql", "sh", "bash",
  "css", "diff", "patch",
]);

/**
 * 地址栏 ?kw=<关键词>：首帧渲染完成后自动对全文做关键词高亮
 * （走 file-viewer searchDocument 官方 API，命中计数与高亮由内置引擎完成）。
 */
const initialKeyword = computed(() => {
  const qs = new URLSearchParams(window.location.search);
  return (qs.get("kw") ?? "").trim();
});

/** 大小格式化（仅展示） */
function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/* ==================== 工具 ==================== */

/** 文件名小写扩展名 */
function extensionOf(name: string): string {
  if (!name || !name.includes(".")) return "";
  return name.slice(name.lastIndexOf(".") + 1).toLowerCase();
}

/** 从对象直链解析 {bucket, objectKey}；票据直链（/ot/）解析不出返回 null */
function parseBucketKey(fileUrl: string): { bucket: string; objectKey: string } | null {
  try {
    const u = new URL(fileUrl, window.location.origin);
    if (u.pathname.startsWith("/ot/")) return null;
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length < 2) return null;
    return {
      bucket: decodeURIComponent(seg[0]),
      objectKey: seg.slice(1).map(decodeURIComponent).join("/"),
    };
  } catch {
    return null;
  }
}

/** URL 直链末段作为文件名 */
function fileNameOfUrl(fileUrl: string): string {
  try {
    const u = new URL(fileUrl, window.location.origin);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(last);
  } catch {
    return "file";
  }
}

/** 拼接直链参数（文件直链可能已带查询串；param 为空串时不拼接） */
function withParam(u: string, param: string): string {
  if (!param) return u;
  return `${u}${u.includes("?") ? "&" : "?"}${param}`;
}

/**
 * 查询目标桶是否开启了下载（GET {origin}/{bucket}?config=true）。
 *
 * <p>入口拿到的 url 是文件直链，从路径首段解析桶名。查询失败（私有桶 401、
 * 跨域失败、配置不可读）一律按「未开启」处理——退回服务端通道，绝不臆测放行。</p>
 */
/** 桶下载开关的进程内缓存：同一桶的重复预览免一次 ?config=true 往返（顶层态每次打开都会问） */
const openDownloadCache = new Map<string, { until: number; value: boolean }>();
const OPEN_DOWNLOAD_CACHE_TTL_MS = 5 * 60 * 1000;

async function openDownloadOf(fileUrl: string): Promise<boolean> {
  try {
    const u = new URL(fileUrl, window.location.origin);
    const bucket = u.pathname.split("/").filter(Boolean)[0];
    if (!bucket) return false;
    const key = decodeURIComponent(bucket);
    const hit = openDownloadCache.get(key);
    if (hit && hit.until > Date.now()) {
      return hit.value;
    }
    const res = await fetch(`${u.origin}/${encodeURIComponent(key)}?config=true`);
    if (!res.ok) return false; // 失败不缓存，网络/权限恢复后立即可重试
    const cfg = (await res.json()) as { openDownload?: boolean };
    const value = cfg.openDownload === true;
    openDownloadCache.set(key, { until: Date.now() + OPEN_DOWNLOAD_CACHE_TTL_MS, value });
    return value;
  } catch {
    return false;
  }
}

/* ==================== 渲染分流 ==================== */

/**
 * 按文件名把已可取数的文件分派到三层渲染通道。
 *
 * @param fileName  文件名（扩展名决定通道）
 * @param opts.bytes      已取到的原始字节（client 层用；office/special 层可缺省）
 * @param opts.bytesUrl   可 fetch 的字节直链（office 层交给 PreviewOfficePanel）
 * @param opts.bucketKey  可解析出的桶键（special 层 resolveObjectUrl 用）
 * @param opts.inner      压缩包内条目路径
 * @param opts.size       文件大小
 */
function dispatch(
  fileName: string,
  opts: { bytes?: Uint8Array; bytesUrl?: string; bucketKey?: { bucket: string; objectKey: string } | null; inner?: string; size?: number },
): void {
  displayTitle.value = fileName;
  displaySize.value = opts.size ?? null;
  downloadUrl.value = opts.bytesUrl ?? "";
  dlBucketKey.value = opts.bucketKey ?? null;
  dlInner.value = opts.inner ?? "";
  loadProgress.value = null;
  const ext = extensionOf(fileName);

  // 1) Office 家族：preset-office（自带魔数校正 / 密文检测 / 选区统计）
  if (isClientRenderable(fileName) && opts.bytesUrl) {
    officeSrc.value = opts.bytesUrl;
    state.value = "office";
    return;
  }

  // 2) .class：前端反编译（FvBinaryPanel = CFR 反编译 + Binary Inspector 十六进制 + 下载）。
  //    优先走字节直链（src），无直链时可解析桶键则面板内部签票取数。
  if (ext === "class" && (opts.bytesUrl || opts.bucketKey)) {
    const comp = SPECIAL_COMPONENT_BY_EXT["class"];
    if (comp) {
      specialComponent.value = comp;
      specialProps.value = {
        src: opts.bytesUrl ?? "",
        fileName,
        size: opts.size ?? 0,
        inner: opts.inner ?? "",
        ...(opts.bucketKey
          ? { bucket: opts.bucketKey.bucket, objectKey: opts.bucketKey.objectKey }
          : {}),
      };
      state.value = "special";
      return;
    }
  }

  // 2) .log：hs_err_pid*.log（JVM 崩溃日志）走运维分析面板（结论 / 原文双模式），
  //    普通 .log 由 FvLogAnalyzePanel 内部退化为文本渲染。优先字节直链 src。
  if (ext === "log" && (opts.bytesUrl || opts.bucketKey)) {
    const comp = SPECIAL_COMPONENT_BY_EXT["log"];
    if (comp) {
      specialComponent.value = comp;
      specialProps.value = {
        src: opts.bytesUrl ?? "",
        fileName,
        size: opts.size ?? 0,
        inner: opts.inner ?? "",
        ...(opts.bucketKey
          ? { bucket: opts.bucketKey.bucket, objectKey: opts.bucketKey.objectKey }
          : {}),
      };
      state.value = "special";
      return;
    }
  }

  // 2) Arrow IPC（arrow/feather/ipc）：前端 apache-arrow 解析成表格。
  //    优先字节直链（src），无直链时用桶键在面板内签票取数。
  if ((ext === "arrow" || ext === "feather" || ext === "ipc") && (opts.bytesUrl || opts.bucketKey)) {
    const comp = SPECIAL_COMPONENT_BY_EXT[ext];
    if (comp) {
      specialComponent.value = comp;
      specialProps.value = {
        src: opts.bytesUrl ?? "",
        fileName,
        size: opts.size ?? 0,
        inner: opts.inner ?? "",
        ...(opts.bucketKey
          ? { bucket: opts.bucketKey.bucket, objectKey: opts.bucketKey.objectKey }
          : {}),
      };
      state.value = "special";
      return;
    }
  }

  // 3) file-viewer 注册表后缀：按扩展名取渲染器组，file-viewer 自动选渲染器
  const spec = specFor(fileName);
  if (spec) {
    if (!opts.bytes) {
      // 理论不可达：client 层调用前已取字节；防御性提示
      fail(`「${fileName}」缺少渲染所需的文件字节`);
      return;
    }
    void startClientRenderer(fileName, spec, opts.bytes);
    return;
  }

  // 3) 专用面板（file-viewer 不支持的格式）：需要可解析的桶键
  const comp = SPECIAL_COMPONENT_BY_EXT[ext];
  if (comp && opts.bucketKey) {
    specialComponent.value = comp;
    specialProps.value = {
      bucket: opts.bucketKey.bucket,
      objectKey: opts.bucketKey.objectKey,
      fileName,
      inner: opts.inner ?? "",
      size: opts.size ?? 0,
    };
    state.value = "special";
    return;
  }

  // 4) 未命中
  state.value = "unsupported";
  message.value = opts.bucketKey
    ? `暂不支持在线预览「${fileName}」`
    : `暂不支持在线预览「${fileName}」（当前链接无法解析存储位置，专用格式预览不可用）`;
}

/**
 * 懒加载渲染器组并交给 FvPanelBase 渲染。
 */
async function startClientRenderer(fileName: string, spec: RendererSpec, bytes: Uint8Array): Promise<void> {
  rendererLoading.value = true;
  try {
    const plugins = await spec.load();
    if (!plugins.length) {
      fail(`「${fileName}」的渲染器（${spec.presetId}）不可用`);
      return;
    }
    activeSpec.value = spec;
    renderers.value = plugins;
    // file-viewer 按文件名扩展名自动选渲染器：File 名必须保留真实扩展名；
    // 文本渲染器只认白名单扩展名（TEXT_EXTENSIONS），白名单外（如 MANIFEST.MF、.jsonl）
    // 改名 .txt 按纯文本渲染，否则找不到渲染器而落空。改名只作用在喂给渲染器的
    // File 上，换扩展名而不是追加（否则 a.jsonl 会变成 a.jsonl.txt）。
    const viewerName = (() => {
      if (spec.presetId === "text") {
        const ext = extensionOf(fileName).toLowerCase();
        if (ext && !TEXT_EXTENSIONS.has(ext)) {
          const dot = fileName.lastIndexOf(".");
          return dot > 0 ? `${fileName.slice(0, dot)}.txt` : `${fileName}.txt`;
        }
      }
      return fileName;
    })();
    fileRef.value = new File([bytes as BlobPart], viewerName, { type: "application/octet-stream" });
    state.value = "client";
  } catch (e) {
    console.warn("[FilePreviewEntry] 渲染器加载失败", e);
    fail(`渲染器加载失败：${(e as Error)?.message ?? spec.presetId}`);
  } finally {
    rendererLoading.value = false;
  }
}

/** 进入错误态 */
function fail(msg: string): void {
  message.value = msg;
  state.value = "error";
}

/* ==================== 事件 ==================== */

function onOfficeRendered(): void {
  // PreviewOfficePanel 渲染完成，无额外处理（面板自管加载态）
}

function onOfficeError(payload?: { noFallback?: boolean; reason?: string }): void {
  console.warn("[FilePreviewEntry] Office 面板失败", payload);
  if (payload?.reason) {
    fail(payload.reason);
    return;
  }
  fail(`「${displayTitle.value}」解析失败，文件可能已损坏`);
}

function onClientError(err: unknown): void {
  console.warn("[FilePreviewEntry] file-viewer 渲染失败", err);
  fail(`渲染失败：${(err as Error)?.message ?? "未知错误"}`);
}

/** 重试 = 整页刷新：内嵌态会重新拿壳（新令牌），顶层态重走分流 */
function reload(): void {
  window.location.reload();
}

/**
 * 下载地址摘掉 {@code preview} 参数。
 *
 * <p>票据签发返回的 URL 自带 {@code preview=true}（预览通道），而服务端预览
 * 通道的优先级高于 {@code download=true}：两个参数并存时回的是内联渲染响应
 * （Content-Disposition: inline），浏览器只会在新标签里展示、不触发下载。
 * 下载前必须把 {@code preview} 摘掉，只留 {@code download=true}。</p>
 *
 * @param url 票据/直链地址
 * @return 去掉 preview 参数后的地址
 */
function stripPreviewForDownload(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.delete("preview");
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * 下载原文件。
 *
 * <p>能解析出桶键时与各前端直渲面板同口径：签短时票据，顶层对象带
 * {@code download=true} 走附件下载；包内条目网关固定内联响应，改为新标签
 * 打开条目字节。解析不出桶键（票据直链场景）时退回令牌直链兜底。</p>
 */
async function downloadSource(): Promise<void> {
  if (dlBucketKey.value) {
    const params: Record<string, string> = dlInner.value
      ? { preview: "true", inner: dlInner.value }
      : { download: "true" };
    const url = await resolveObjectUrl(dlBucketKey.value.bucket, dlBucketKey.value.objectKey, { params }).catch(() => "");
    if (url) {
      // 包内条目走内联预览通道（网关固定 inline）；普通对象走附件下载
      window.open(dlInner.value ? url : stripPreviewForDownload(url), "_blank", "noopener");
      return;
    }
  }
  if (downloadUrl.value) {
    // 顶层下载直链本身已带 download=true，避免重复拼接
    const u = /[?&]download=true(&|$)/.test(downloadUrl.value) ? downloadUrl.value : withParam(downloadUrl.value, "download=true");
    window.open(stripPreviewForDownload(u), "_blank", "noopener");
  }
}

/** 复制当前预览链接（剪贴板 API 不可用时退回 execCommand） */
async function copyLink(): Promise<void> {
  const text = window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch (e) {
    console.warn("[FilePreviewEntry] 复制链接失败", e);
  }
}

/** 新标签打开当前预览 */
function openNewTab(): void {
  window.open(window.location.href, "_blank", "noopener");
}

/** 全屏切换（对整页预览容器） */
function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen?.().catch(() => {});
}

/** 打印（仅可打印通道显示按钮；打印时信息栏隐藏，见样式 print 段） */
function printPreview(): void {
  window.print();
}

/* ==================== 键盘快捷键与「更多」菜单 ==================== */

/**
 * 全局快捷键：Ctrl/Cmd+P 触发打印（仅可打印通道）；Esc 收起「更多」菜单
 * （全屏退出由浏览器原生处理，此处不抢）。
 */
function onGlobalKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p" && printable.value) {
    e.preventDefault();
    printPreview();
    return;
  }
  if (e.key === "Escape" && moreOpen.value) {
    moreOpen.value = false;
  }
}

/** 点击「更多」菜单外部时收起 */
function onDocPointerDown(e: MouseEvent): void {
  if (moreOpen.value && moreRef.value && !moreRef.value.contains(e.target as Node)) {
    moreOpen.value = false;
  }
}

function toggleMore(): void {
  moreOpen.value = !moreOpen.value;
}

function closeMore(): void {
  moreOpen.value = false;
}

/** 菜单内复制链接：保留「已复制」反馈片刻再收起菜单 */
async function copyLinkFromMenu(): Promise<void> {
  await copyLink();
  window.setTimeout(closeMore, 900);
}

/* ==================== 拉取字节 ==================== */

/** 当前取数的 AbortController（取消加载用；同一时刻只有一个取数在跑） */
let activeAbort: AbortController | null = null;

/** 用户取消当前取数：中断 fetch 与流式读取，进入可重试的取消态 */
function cancelLoad(): void {
  activeAbort?.abort();
}

/** fetch 直链为字节（失败抛出可读错误）；流式读取并回报进度；可被 cancelLoad 中断 */
async function fetchBytes(url: string): Promise<Uint8Array> {
  const ac = new AbortController();
  activeAbort = ac;
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) {
      throw new Error(`读取文件失败：HTTP ${res.status}`);
    }
    const len = Number(res.headers.get("content-length") || "0");
    beginProgress(len > 0 ? len : null);
    return await readStreamWithProgress(res, Number.POSITIVE_INFINITY);
  } finally {
    if (activeAbort === ac) {
      activeAbort = null;
    }
  }
}

/** 记录取数起点（total 为已知总字节数，未知传 null） */
function beginProgress(total: number | null): void {
  loadProgress.value = { loaded: 0, total };
}

/** 流式读取响应体并回报进度；cap 为最大读取字节数（Infinity 表示不限制） */
async function readStreamWithProgress(res: Response, cap: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) {
    return new Uint8Array(await res.arrayBuffer());
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    const remain = cap - total;
    const take = value.byteLength > remain ? value.subarray(0, remain) : value;
    chunks.push(take);
    total += take.byteLength;
    if (loadProgress.value) {
      loadProgress.value = { loaded: total, total: loadProgress.value.total };
    }
    if (take.byteLength < value.byteLength) break;
  }
  try {
    await reader.cancel();
  } catch {
    // 取消失败不影响已读到的内容
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * 带读取上限的字节获取（文本类长文件用）。
 *
 * <p>jsonl / ndjson 这类行式数据天生可以上 GB（一天一条的埋点导出），整篇读进
 * 内存会直接把标签页撑爆。策略分两级：</p>
 * <ol>
 *   <li>先发 {@code Range: bytes=0-(max-1)}：服务端支持 Range 就直接只回前缀
 *       （206），带宽与内存都省；</li>
 *   <li>服务端忽略 Range（老版本 / 反向代理剥头）时流式读到上限即
 *       {@code reader.cancel()}，绝不把整个响应读进内存。</li>
 * </ol>
 *
 * @param url      字节直链
 * @param maxBytes 读取上限（字节）；&lt;= 0 表示不限制
 * @returns 字节内容 + 是否因超出上限被截断
 */
async function fetchBytesCapped(url: string, maxBytes: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (maxBytes <= 0) {
    return { bytes: await fetchBytes(url), truncated: false };
  }
  const ac = new AbortController();
  activeAbort = ac;
  try {
    const res = await fetch(url, { headers: { Range: `bytes=0-${maxBytes - 1}` }, signal: ac.signal });
    if (!res.ok) {
      throw new Error(`读取文件失败：HTTP ${res.status}`);
    }
    if (!res.body) {
      // 无流式能力（极老浏览器）：一次性读入；206 按 Content-Range 判截断
      const buf = new Uint8Array(await res.arrayBuffer());
      if (res.status === 206) {
        const totalRange = Number((res.headers.get("content-range") || "").split("/")[1] || "0");
        return { bytes: buf, truncated: totalRange > maxBytes };
      }
      return { bytes: buf, truncated: false };
    }
    if (res.status === 206) {
      const total = Number((res.headers.get("content-range") || "").split("/")[1] || "0");
      beginProgress(Math.min(total || maxBytes, maxBytes));
      const bytes = await readStreamWithProgress(res, maxBytes);
      return { bytes, truncated: total > maxBytes };
    }
    // 服务端忽略 Range（老版本 / 反向代理剥头）：整包流式读到上限即 cancel，
    // 绝不把整个响应读进内存；此时必然按「已截断」处理（与原实现语义一致）
    const len = Number(res.headers.get("content-length") || "0");
    beginProgress(len > 0 ? Math.min(len, maxBytes) : maxBytes);
    const bytes = await readStreamWithProgress(res, maxBytes);
    return { bytes, truncated: true };
  } finally {
    if (activeAbort === ac) {
      activeAbort = null;
    }
  }
}

/**
 * 文本类预览的读取上限（字节）。
 *
 * <p>只对 renderer-text 组生效：代码/配置/日志/行式 JSON 都是「看开头就够」的
 * 场景，8MB 足够覆盖日常排查；Office/图片/压缩包等格式不走这个上限（截断的
 * 结构化文件无法解析，必须拿到全量字节）。</p>
 */
const TEXT_PREVIEW_LIMIT = 8 * 1024 * 1024;

/**
 * 取该文件名的文本预览上限；非文本组返回 0（不限制）。
 *
 * @param fileName 文件名
 * @returns 上限字节数，0 表示不限制
 */
function textPreviewLimit(fileName: string): number {
  return specFor(fileName)?.presetId === "text" ? TEXT_PREVIEW_LIMIT : 0;
}

/**
 * 引导阶段是否需要预取整包字节。
 *
 * <p>必须与 {@link dispatch} 的分流顺序一致：Office 家族（isClientRenderable）
 * 与 class/log/arrow 专用面板都只吃 bytesUrl / 桶键（面板自行取数并展示进度），
 * 只有 file-viewer 客户端渲染器（specFor 命中）才需要字节构造 File。
 * 命中免取字节时，面板立即挂载、首帧不再等整包下载——加载延迟优化的大头。</p>
 */
function needsBootBytes(fileName: string): boolean {
  if (isClientRenderable(fileName)) {
    return false;
  }
  const ext = extensionOf(fileName);
  if (ext === "class" || ext === "log" || ext === "arrow" || ext === "feather" || ext === "ipc") {
    return false;
  }
  return specFor(fileName) != null;
}

/* ==================== 启动 ==================== */

onMounted(async (): Promise<void> => {
  window.addEventListener("keydown", onGlobalKeydown);
  document.addEventListener("click", onDocPointerDown);
  // ---- 内嵌态：后端壳注入引导参数，直接取字节渲染 ----
  const boot = window.__FILE_PREVIEW_BOOT__;
  if (boot?.bytesUrl) {
    channelLabel.value = "boot";
    const bucketKey = boot.bucket && boot.key ? { bucket: boot.bucket, objectKey: boot.key } : null;
    try {
      const name = boot.fileName || "file";
      // 按需取字节：只有客户端渲染器需要整包字节；Office / 专用面板先分发后自行取数，
      // 首帧不再等整包下载（加载延迟优化）
      let bytes: Uint8Array | undefined;
      if (needsBootBytes(name)) {
        const got = await fetchBytesCapped(boot.bytesUrl, textPreviewLimit(name));
        truncated.value = got.truncated;
        bytes = got.bytes;
      }
      // 引导完成：清除 410 自动续期标记，同一标签页后续再过期仍可自动重试
      window.sessionStorage.removeItem(FPE_410_KEY);
      dispatch(name, {
        bytes,
        bytesUrl: boot.bytesUrl,
        bucketKey,
        inner: boot.inner || undefined,
        size: boot.size,
      });
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      console.warn("[FilePreviewEntry] 引导字节获取失败", e);
      // 失败态保留下载出口：桶键已知时，即使取数/渲染失败用户仍可下载原文件
      if (bucketKey) {
        dlBucketKey.value = bucketKey;
      }
      // 用户主动取消：中性提示，不算错误
      if ((e as DOMException)?.name === "AbortError") {
        fail("已取消加载，可点击重试重新拉取");
        return;
      }
      // 令牌过期（410）：整页刷新重拿壳（服务端会注入新令牌），会话内只自动重试一次防循环
      if (msg.includes("HTTP 410")) {
        if (!window.sessionStorage.getItem(FPE_410_KEY)) {
          window.sessionStorage.setItem(FPE_410_KEY, "1");
          window.location.reload();
          return;
        }
        fail("预览链接已过期且自动续期未成功，请点击重试");
        return;
      }
      fail(`${msg || "预览字节获取失败"}，请点击重试（将重新获取预览链接）`);
    }
    return;
  }

  // ---- 顶层态：解析地址栏 ?url=<base64>&render=&name= ----
  const qs = new URLSearchParams(window.location.search);
  const encoded = qs.get("url") ?? "";
  if (!encoded) {
    fail("缺少 url 参数：请以 ?url=<base64 文件直链>&render=server 访问");
    return;
  }
  let fileUrl: string;
  try {
    fileUrl = base64ToUtf8(encoded).trim();
  } catch {
    fail("url 参数不是合法的 base64 文件直链");
    return;
  }
  if (!/^https?:\/\//i.test(fileUrl)) {
    fail("url 解码后必须是 http(s) 文件直链");
    return;
  }
  const fileName = (qs.get("name") || "").trim() || fileNameOfUrl(fileUrl);
  const render = (qs.get("render") || "").trim().toLowerCase();
  const keywordParam = (qs.get("kw") ?? "").trim();

  // render=server：入口内直接 iframe 服务端通道（后端把文件转成 HTML 预览页，
  // 实际返回统一入口壳 → 壳内嵌态渲染，因此 iframe 内仍是 file-viewer 效果）。
  // kw 随 URL 透传进壳：内嵌态首帧渲染完成后自动触发关键词高亮。
  if (render === "server") {
    channelLabel.value = "top-server";
    iframeSrc.value = withParam(withParam(fileUrl, "preview=true&render=server"), keywordParam ? `kw=${encodeURIComponent(keywordParam)}` : "");
    displayTitle.value = fileName;
    state.value = "iframe";
    return;
  }

  // 缺省（render 非 server 或未传）：开了下载拿二进制本地渲染；没开则退服务端通道
  channelLabel.value = "top-client";
  const canDownload = await openDownloadOf(fileUrl);
  if (canDownload) {
    try {
      const url = withParam(fileUrl, "download=true");
      // 按需取字节（与内嵌态同口径）：Office / 专用面板先分发后自行取数
      let bytes: Uint8Array | undefined;
      if (needsBootBytes(fileName)) {
        const got = await fetchBytesCapped(url, textPreviewLimit(fileName));
        truncated.value = got.truncated;
        bytes = got.bytes;
      }
      dispatch(fileName, { bytes, bytesUrl: url, bucketKey: parseBucketKey(fileUrl) });
      return;
    } catch (e) {
      console.warn("[FilePreviewEntry] 下载直链取数失败", e);
      if ((e as DOMException)?.name === "AbortError") {
        fail("已取消加载，可点击重试重新拉取");
        return;
      }
      fail((e as Error)?.message ?? "文件获取失败");
      return;
    }
  }
  // 未开启下载：退回服务端通道（后端返回入口壳，壳内嵌态经短时效令牌渲染）
  channelLabel.value = "iframe-server";
  iframeSrc.value = withParam(withParam(fileUrl, "preview=true&render=server"), keywordParam ? `kw=${encodeURIComponent(keywordParam)}` : "");
  displayTitle.value = fileName;
  state.value = "iframe";
});

/** 卸载清理：解绑全局监听、中断在途取数 */
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  document.removeEventListener("click", onDocPointerDown);
  activeAbort?.abort();
});
</script>

<template>
  <div class="fpe">
    <!-- iframe（服务端通道）模式下不渲染顶层信息栏：iframe 内的入口壳自带
         文件名/大小/重试，双层 header 信息重复且浪费纵向空间 -->
    <header v-if="state !== 'iframe'" class="fpe__bar">
      <span class="fpe__title" :title="displayTitle">{{ displayTitle || "文件预览" }}</span>
      <span v-if="displaySize != null && displaySize > 0" class="fpe__size">{{ formatSize(displaySize) }}</span>
      <span v-if="truncated" class="fpe__trunc" :title="`文本类预览最多读取 ${formatSize(TEXT_PREVIEW_LIMIT)}，其余内容请下载后查看`">
        仅显示前 {{ formatSize(TEXT_PREVIEW_LIMIT) }}
      </span>
      <!-- 扩展名类型徽标：比纯文件名更快识别类型 -->
      <span v-if="typeBadge" class="fpe__ext" :title="`文件类型：${typeBadge}`">{{ typeBadge }}</span>
      <!-- 通道徽章仅开发态可见：通道名是内部调试信息，不向终端用户暴露 -->
      <span v-if="isDev && channelLabel" class="fpe__badge" :title="`预览通道：${channelLabel}`">{{ channelLabel }}</span>
      <div class="fpe__actions">
        <button v-if="canDownloadSource" class="fpe__btn" type="button" title="下载原文件" @click="downloadSource">下载</button>
        <button class="fpe__btn" type="button" title="进入/退出全屏" @click="toggleFullscreen">全屏</button>
        <!-- 低频动作收纳进「更多」菜单，窄屏不再依赖换行 -->
        <div ref="moreRef" class="fpe__more">
          <button
            class="fpe__btn"
            type="button"
            title="更多操作"
            aria-haspopup="menu"
            :aria-expanded="moreOpen"
            @click="toggleMore"
          >更多 ▾</button>
          <div v-if="moreOpen" class="fpe__menu" role="menu">
            <button class="fpe__menu-item" type="button" role="menuitem" @click="copyLinkFromMenu">{{ copied ? "已复制" : "复制链接" }}</button>
            <button class="fpe__menu-item" type="button" role="menuitem" @click="openNewTab(); closeMore()">新窗口打开</button>
            <button v-if="printable" class="fpe__menu-item" type="button" role="menuitem" @click="printPreview(); closeMore()">打印</button>
          </div>
        </div>
        <button class="fpe__btn" type="button" title="重新加载预览" @click="reload">重试</button>
      </div>
    </header>

    <main class="fpe__body">
      <!-- Office 家族（preset-office 全家桶） -->
      <PreviewOfficePanel
        v-if="state === 'office' && officeSrc"
        class="fpe__panel"
        :src="officeSrc"
        :raw-src="officeSrc"
        :file-name="displayTitle"
        @rendered="onOfficeRendered"
        @error="onOfficeError"
      />

      <!-- file-viewer 渲染器（按扩展名自动选） -->
      <FvPanelBase
        v-else-if="state === 'client' && fileRef && renderers.length"
        class="fpe__panel"
        v-model:loading="rendererLoading"
        :file="fileRef"
        :renderers="renderers"
        :preset-id="activeSpec?.presetId ?? 'auto'"
        :viewer-options-extra="viewerExtra"
        :initial-keyword="initialKeyword"
        enable-beautify
        @rendered="() => {}"
        @error="onClientError"
      />

      <!-- 专用面板（OFD / SWF 等，file-viewer 之外的格式） -->
      <component
        :is="specialComponent"
        v-else-if="state === 'special' && specialComponent"
        class="fpe__panel"
        v-bind="specialProps"
      />
      <!-- 服务端通道 -->
      <iframe
        v-else-if="state === 'iframe' && iframeSrc"
        class="fpe__frame"
        :src="iframeSrc"
        allowfullscreen
      />
      <!-- 加载中（大文件流式取数时同步展示进度） -->
      <div v-else-if="loadingVisible" class="fpe__placeholder">
        <span class="fpe__spinner" aria-hidden="true"></span>
        <span>加载中…</span>
        <template v-if="loadProgress">
          <span v-if="progressText" class="fpe__progress-text">{{ progressText }}</span>
          <div
            class="fpe__progress"
            :class="{ 'fpe__progress--indeterminate': !progressWidth }"
            role="progressbar"
            :aria-valuenow="progressWidth ? parseInt(progressWidth, 10) : undefined"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div class="fpe__progress-fill" :style="progressWidth ? { width: progressWidth } : undefined"></div>
          </div>
        </template>
        <button v-if="state === 'loading'" class="fpe__btn" type="button" title="取消本次加载" @click="cancelLoad">取消加载</button>
      </div>

      <!-- 不支持 -->
      <div v-else-if="state === 'unsupported'" class="fpe__placeholder">
        <div class="fpe__unsupported-ico">📄</div>
        <div class="fpe__unsupported-msg">{{ message }}</div>
        <div v-if="canDownloadSource" class="fpe__placeholder-actions">
          <button class="fpe__btn fpe__btn--primary" type="button" @click="downloadSource">下载原文件</button>
        </div>
      </div>

      <!-- 错误 -->
      <div v-else-if="state === 'error'" class="fpe__placeholder fpe__placeholder--error">
        <div class="fpe__unsupported-ico">⚠️</div>
        <div class="fpe__unsupported-msg">{{ message }}</div>
        <div class="fpe__placeholder-actions">
          <button class="fpe__btn fpe__btn--primary" type="button" @click="reload">重试</button>
          <button v-if="canDownloadSource" class="fpe__btn" type="button" @click="downloadSource">下载原文件</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fpe {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: var(--bg-page, #f5f6f8);
  color: var(--text-primary, #24292f);
}

.fpe__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--bg-container, #fff);
  border-bottom: 1px solid var(--border-subtle, #e1e4e8);
  flex-shrink: 0;
}

.fpe__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #24292f);
  max-width: 46vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fpe__size {
  font-size: 12px;
  color: var(--text-secondary, #6e7781);
}

.fpe__trunc {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: var(--radius-md, 6px);
  background: var(--bg-warning-subtle, #fff8e6);
  color: var(--text-warning, #9a6700);
  border: 1px solid var(--border-warning-subtle, #f2e2b0);
}

.fpe__badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: var(--radius-md, 6px);
  background: var(--bg-fill, #eef2f7);
  color: var(--text-tertiary, #57606a);
  margin-left: auto;
}

/* 扩展名类型徽标：紧跟标题，帮助快速识别文件类型 */
.fpe__ext {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: var(--radius-md, 6px);
  background: var(--brand-50, #e8f0fe);
  color: var(--brand-600, #0860ca);
  border: 1px solid var(--brand-100, #d2e3fc);
  flex-shrink: 0;
}

/* 「更多」菜单：收纳低频动作，窄屏不再依赖换行 */
.fpe__more {
  position: relative;
  display: inline-block;
}

.fpe__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 132px;
  padding: 4px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-default, #d0d7de);
  border-radius: var(--radius-md, 6px);
  box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
  z-index: 30;
  display: flex;
  flex-direction: column;
}

.fpe__menu-item {
  font-size: 12px;
  text-align: left;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: var(--text-primary, #24292f);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  white-space: nowrap;
}

.fpe__menu-item:hover {
  background: var(--bg-hover, #f6f8fa);
}

/* 头栏动作区：按钮组靠右，移动端可换行 */
.fpe__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.fpe__btn {
  font-size: 12px;
  padding: 3px 12px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-default, #d0d7de);
  background: var(--bg-container, #fff);
  color: var(--text-primary, #24292f);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s var(--ease-out, ease), border-color 0.2s var(--ease-out, ease);
}

.fpe__btn:hover {
  background: var(--bg-hover, #f6f8fa);
  border-color: var(--border-strong, #a6b1bd);
}

.fpe__btn--primary {
  background: var(--brand-500, #0969da);
  border-color: var(--brand-500, #0969da);
  color: #fff;
}

.fpe__btn--primary:hover {
  background: var(--brand-600, #0860ca);
  border-color: var(--brand-600, #0860ca);
}

.fpe__body {
  flex: 1;
  min-height: 0;
  position: relative;
}

.fpe__panel,
.fpe__frame {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--bg-container, #fff);
}

/* iframe 需要 display:block 消除基线缝隙；面板组件（office 的 flex 布局、
   fv 的块级布局）必须保留自身 display——此前共享 display:block 会把
   PreviewOfficePanel 的 flex 布局覆盖掉，CSV/表格内容高度塌陷（实测 47px）。 */
.fpe__frame {
  display: block;
}

.fpe__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary, #57606a);
  font-size: 13px;
}

.fpe__placeholder--error {
  color: var(--status-error, #c0392b);
}

.fpe__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border-default, #d0d7de);
  border-top-color: var(--brand-500, #0969da);
  border-radius: 50%;
  animation: fpe-spin 0.9s linear infinite;
}

@keyframes fpe-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 取数进度：已知总量按百分比填充，未知总量做不定长流动 */
.fpe__progress {
  width: 220px;
  max-width: 60vw;
  height: 4px;
  border-radius: 999px;
  background: var(--bg-fill, #eef2f7);
  overflow: hidden;
}

.fpe__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand-500, #0969da);
  transition: width 0.25s var(--ease-out, ease);
}

.fpe__progress--indeterminate .fpe__progress-fill {
  width: 36%;
  animation: fpe-indeterminate 1.2s ease-in-out infinite;
}

@keyframes fpe-indeterminate {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(320%);
  }
}

.fpe__progress-text {
  font-size: 12px;
  color: var(--text-tertiary, #57606a);
  font-variant-numeric: tabular-nums;
}

.fpe__unsupported-ico {
  font-size: 34px;
}

.fpe__unsupported-msg {
  max-width: 560px;
  text-align: center;
  line-height: 1.7;
  word-break: break-all;
}

/* 失败 / 不支持态的出口按钮（重试 / 下载原文件） */
.fpe__placeholder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

/* ===== 响应式（移动端信息栏收窄） ===== */
@media (max-width: 768px) {
  .fpe__bar {
    padding: 8px 10px;
    gap: 8px;
  }
  .fpe__title {
    max-width: 40vw;
  }
  .fpe__badge {
    display: none;
  }
  .fpe__actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

/* ===== 打印：隐藏信息栏与占位态，仅输出预览内容（仅可打印通道开放打印按钮） ===== */
@media print {
  .fpe {
    height: auto;
    background: #fff;
  }
  .fpe__bar,
  .fpe__placeholder {
    display: none;
  }
  .fpe__body {
    flex: 1 0 auto;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .fpe__spinner {
    animation-duration: 2s;
  }
  .fpe__btn {
    transition: none;
  }
  .fpe__progress-fill {
    transition: none;
  }
  .fpe__progress--indeterminate .fpe__progress-fill {
    animation: none;
  }
}
</style>
