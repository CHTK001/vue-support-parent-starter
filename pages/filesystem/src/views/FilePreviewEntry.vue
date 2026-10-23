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
import { computed, defineAsyncComponent, onMounted, ref, shallowRef, type Component } from "vue";
import PreviewOfficePanel from "../components/PreviewOfficePanel.vue";
import FvPanelBase from "../components/fv/FvPanelBase.vue";
import { isClientRenderable } from "../utils/officeRenderer";
import { base64ToUtf8, specFor, TEXT_EXTENSIONS, type RendererSpec } from "../utils/previewEntryRenderers";

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
async function openDownloadOf(fileUrl: string): Promise<boolean> {
  try {
    const u = new URL(fileUrl, window.location.origin);
    const bucket = u.pathname.split("/").filter(Boolean)[0];
    if (!bucket) return false;
    const res = await fetch(`${u.origin}/${encodeURIComponent(decodeURIComponent(bucket))}?config=true`);
    if (!res.ok) return false;
    const cfg = (await res.json()) as { openDownload?: boolean };
    return cfg.openDownload === true;
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
    // 文本渲染器只认白名单扩展名（TEXT_EXTENSIONS），白名单外（如 MANIFEST.MF）
    // 改名 .txt 按纯文本渲染，否则找不到渲染器而落空。
    const viewerName = (() => {
      if (spec.presetId === "text") {
        const ext = extensionOf(fileName).toLowerCase();
        if (ext && !TEXT_EXTENSIONS.has(ext)) return `${fileName}.txt`;
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

/* ==================== 拉取字节 ==================== */

/** fetch 直链为字节（失败抛出可读错误） */
async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`读取文件失败：HTTP ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/* ==================== 启动 ==================== */

onMounted(async (): Promise<void> => {
  // ---- 内嵌态：后端壳注入引导参数，直接取字节渲染 ----
  const boot = window.__FILE_PREVIEW_BOOT__;
  if (boot?.bytesUrl) {
    channelLabel.value = "boot";
    try {
      const bytes = await fetchBytes(boot.bytesUrl);
      const bucketKey = boot.bucket && boot.key ? { bucket: boot.bucket, objectKey: boot.key } : null;
      dispatch(boot.fileName || "file", {
        bytes,
        bytesUrl: boot.bytesUrl,
        bucketKey,
        inner: boot.inner || undefined,
        size: boot.size,
      });
    } catch (e) {
      // 令牌过期（410）等场景：整页刷新重拿壳（服务端会注入新令牌）
      console.warn("[FilePreviewEntry] 引导字节获取失败", e);
      fail(`${(e as Error)?.message ?? "预览字节获取失败"}，请点击重试（将重新获取预览链接）`);
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
      const bytes = await fetchBytes(withParam(fileUrl, "download=true"));
      dispatch(fileName, { bytes, bytesUrl: withParam(fileUrl, "download=true"), bucketKey: parseBucketKey(fileUrl) });
      return;
    } catch (e) {
      console.warn("[FilePreviewEntry] 下载直链取数失败", e);
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
</script>

<template>
  <div class="fpe">
    <!-- iframe（服务端通道）模式下不渲染顶层信息栏：iframe 内的入口壳自带
         文件名/大小/重试，双层 header 信息重复且浪费纵向空间 -->
    <header v-if="state !== 'iframe'" class="fpe__bar">
      <span class="fpe__title" :title="displayTitle">{{ displayTitle || "文件预览" }}</span>
      <span v-if="displaySize != null && displaySize > 0" class="fpe__size">{{ formatSize(displaySize) }}</span>
      <span class="fpe__badge" :title="`预览通道：${channelLabel}`">{{ channelLabel }}</span>
      <button class="fpe__retry" type="button" @click="reload">重试</button>
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
      <!-- 加载中 -->
      <div v-else-if="loadingVisible" class="fpe__placeholder">
        <span class="fpe__spinner" aria-hidden="true"></span>
        <span>加载中…</span>
      </div>

      <!-- 不支持 -->
      <div v-else-if="state === 'unsupported'" class="fpe__placeholder">
        <div class="fpe__unsupported-ico">📄</div>
        <div class="fpe__unsupported-msg">{{ message }}</div>
      </div>

      <!-- 错误 -->
      <div v-else-if="state === 'error'" class="fpe__placeholder fpe__placeholder--error">
        <div class="fpe__unsupported-ico">⚠️</div>
        <div class="fpe__unsupported-msg">{{ message }}</div>
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
  background: #f5f6f8;
  color: #24292f;
}

.fpe__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #fff;
  border-bottom: 1px solid #e1e4e8;
  flex-shrink: 0;
}

.fpe__title {
  font-size: 13px;
  font-weight: 600;
  max-width: 46vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fpe__size {
  font-size: 12px;
  color: #6e7781;
}

.fpe__badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 6px;
  background: #eef2f7;
  color: #57606a;
  margin-left: auto;
}

.fpe__retry {
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  background: #fff;
  color: #24292f;
  cursor: pointer;
}

.fpe__retry:hover {
  background: #f6f8fa;
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
  background: #fff;
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
  color: #57606a;
  font-size: 13px;
}

.fpe__placeholder--error {
  color: #c0392b;
}

.fpe__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid #d0d7de;
  border-top-color: #0969da;
  border-radius: 50%;
  animation: fpe-spin 0.9s linear infinite;
}

@keyframes fpe-spin {
  to {
    transform: rotate(360deg);
  }
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
</style>
