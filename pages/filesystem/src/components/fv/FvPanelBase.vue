<!--
  file-viewer 宿主组件（唯一渲染底座）。
  替换旧面板：TiffPreviewPanel.vue / HeicPreviewPanel.vue / PreviewImagePanel.vue（图片类），
  以及服务端 iframe 通道（FileStorageManage.vue 的 Markdown/代码预览）。
  职责只有：懒加载 @file-viewer/vue3（含样式）→ 按 presetId + renderers 组 options →
  把 File 交给 <component :is> 渲染。不做任何工具条/统计条/编辑能力。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type CSSProperties } from "vue";
import type { Component } from "vue";
import type { FileViewerExpose } from "@file-viewer/vue3";
import { message } from "@repo/core";
// 可选能力装配（RTF loader 注册 + iWork 渲染器 + 资产基路径），side-effect 模块
import { iworkRenderer } from "../../utils/fileViewersOptional.js";

const props = defineProps<{
  /** 交给 file-viewer 渲染的文件（file-viewer 按其 name 的扩展名选渲染器） */
  file: File;
  /** 渲染器对象数组（如 imageRenderer / textRenderer），原样喂给 preset.renderers */
  renderers: unknown[];
  /** preset id/label（image 侧如 "image"，text 侧如 "text"） */
  presetId: string;
  /** 透传给 file-viewer 的扩展 options（search/ui/theme 等官方协议字段，浅合并） */
  viewerOptionsExtra?: Record<string, unknown>;
  /** 首帧渲染完成后自动高亮的关键词（走 searchDocument 官方 API；空串不触发） */
  initialKeyword?: string;
  /**
   * 在工具条 start 区显示「美化」按钮。
   *
   * <p>可美化的扩展名见 {@link BEAUTIFY_EXTS}（JSON/YAML/XML 及 Prettier 收录的代码类），
   * 不在其中的语言（java/py/go/rs/c…）只高亮、不显示按钮。</p>
   */
  enableBeautify?: boolean;
}>();

const emit = defineEmits<{
  /** file-viewer 渲染完成（由 load-complete 转发） */
  rendered: [];
  /** file-viewer 报错（由 error 转发，载荷原样透传） */
  error: [err: unknown];
  /** loading 双向绑定（v-model:loading 兼容） */
  "update:loading": [value: boolean];
}>();

/** 数据加载中（v-model:loading 兼容：props.loading + emit('update:loading') 的 defineModel 形态） */
const loading = defineModel<boolean>("loading", { default: false });

/**
 * 首帧渲染完成前保持宿主遮罩（盖住 file-viewer 内置 loading 动画：
 * 内置动画带扩展名徽章等插件特征，产品要求预览过程不露出）。
 * file 变化即重置，load-complete（onLoadComplete）后揭开。
 */
const coverLoading = ref(true);

/** file-viewer 组件（懒加载，用 shallowRef：组件对象无需深响应） */
const viewerComp = shallowRef<Component | null>(null);
/** 加载失败时的门闩：失败不置位，下次文件变化可重试 */
let fileViewerReady = false;
/** 卸载标记，避免异步回调在卸载后写状态 */
let disposed = false;

/**
 * 懒加载 file-viewer 组件 + 样式（幂等）。
 * 用法与 PreviewOfficePanel.vue 第 106-166 行一致。
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  loading.value = true;
  try {
    const [vueMod, cssMod, coreMod] = await Promise.all([
      import("@file-viewer/vue3-full"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
      import("@file-viewer/core"),
    ]);
    void cssMod; // 样式副作用导入
    // 两层 assetBaseUrl 都必须显式指到前端同源，缺一层都不行：
    //
    // 1) full 层（preset-all 的 createFullAssetOptions）只覆盖
    //    archive/chm/cad/data/docx/drawing/model/pdf/presentation/
    //    spreadsheet/typst 的 workerUrl，**没有 design 段**；
    // 2) core 层（resolveFileViewerDesignContainerWorkerUrl 等，以及
    //    file-viewer 运行期按需拉的 assets/*.js chunk）在未显式配置时
    //    走 automatic 推断：按页面里 script 的 src 反推 base。
    //
    // 预览弹窗里文件字节来自存储域（http://<storage>:18080/ot/...），
    // automatic 据此把 base 推成存储域，于是：
    //   - design 的 worker 请求变成
    //     http://<storage>:18080/ot/vendor/design/*.worker.js
    //     → 跨域，Worker 拒绝加载（实测 "Photoshop Worker failed to load"）
    //   - file-viewer 运行期 chunk 变成
    //     http://<storage>:18080/assets/checkbox-*.js
    //     → 存储域没有这些产物，请求失败后渲染器整体崩掉
    //      （实测 vtk 报 RangeError，根因就是 chunk 没加载到）
    //
    // 这些资产（public/vendor/**）由 @file-viewer/vite-plugin 的 copyAssets
    // 落到前端 public，前端同源即可加载，与文件字节的域无关。
    (vueMod as { setDefaultFullAssetBaseUrl?: (base?: string | URL | null) => void })
      .setDefaultFullAssetBaseUrl?.("/");
    (coreMod as { setDefaultFileViewerAssetBaseUrl?: (base?: string | URL | null) => void })
      .setDefaultFileViewerAssetBaseUrl?.("/");
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer ??
      (vueMod as { default?: Component }).default ??
      null;
    fileViewerReady = !!viewerComp.value;
    return fileViewerReady;
  } catch (e) {
    console.warn("[FvPanelBase] file-viewer 依赖加载失败", e);
    emit("error", e);
    return false;
  } finally {
    loading.value = false;
  }
}

/**
 * 是否已开启美化（打开后由 renderer-text 在渲染时按 Prettier 格式化）。
 * 需在 {@link viewerOptions} 之前声明：viewerOptions 的 getter 会读取它。
 */
const prettyPrint = ref(false);

/**
 * 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置 + 宿主扩展）。
 *
 * preset 为数组形态：手装渲染器在前（优先命中），viewerOptionsExtra.preset
 * （如 file-viewer.generated.mjs 的 generated preset，含 iwork/rtf 等可选能力）
 * 在后兜底——压缩包嵌套渲染、包内条目预览同样吃这套 registry。
 */
const viewerOptions = computed(() => {
  const extra = props.viewerOptionsExtra ?? {};
  const { preset: extraPreset, text: extraText, ...restExtra } = extra as {
    preset?: unknown;
    text?: Record<string, unknown>;
  };
  const presetInput: unknown[] = [
    { id: props.presetId, label: props.presetId, renderers: [...props.renderers, iworkRenderer] },
  ];
  if (extraPreset) {
    presetInput.push(extraPreset);
  }
  // 美化按钮点开后在 text options 里打开 prettyPrint：由 renderer-text 内置的 Prettier
  // 在渲染时格式化（不预先改文件内容）。未开启时不注入该字段，保持渲染器默认。
  const text = { ...(extraText ?? {}), ...(prettyPrint.value ? { prettyPrint: true } : {}) };
  return {
    preset: presetInput,
    rendererMode: "replace" as const,
    theme: "light" as const,
    toolbar: { position: "bottom-right" as const },
    ...(Object.keys(text).length > 0 ? { text } : {}),
    ...restExtra,
  };
});

/** 遮罩徽章文案：文件扩展名大写（无扩展名显示 FILE） */
const extLabel = computed(() => {
  const name = props.file?.name ?? "";
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1) : "file";
  return ext.toUpperCase().slice(0, 6);
});

/** 当前文件扩展名（小写；无扩展名则空串） */
const extOfFile = computed(() => {
  const name = props.file?.name ?? "";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
});

/**
 * 可「美化」的扩展名：与 {@code @file-viewer/renderer-text} 内置 Prettier 的语言表对齐
 * （见其 {@code prettyPrint.js} 的 {@code prettierLanguages}）。
 *
 * <p>覆盖两类：①配置类 json/jsonc/json5/ipynb/yaml/yml/xml；②代码类
 * js/jsx/mjs/cjs/react/ts/tsx/vue/css/md/html/htm/graphql。
 * <b>不在表内的语言（java / py / go / rs / c / cpp / rb…）只能高亮、没有美化</b> ——
 * Prettier 不支持这些语言，强行按钮只会点了没反应。</p>
 */
const BEAUTIFY_EXTS = new Set([
  "json", "jsonc", "json5", "ipynb",
  "yaml", "yml", "xml",
  "js", "jsx", "mjs", "cjs", "react",
  "ts", "tsx", "vue",
  "css", "md", "markdown", "html", "htm",
  "graphql", "gql",
]);

/** 是否展示「美化」按钮 */
const canBeautify = computed(() => BEAUTIFY_EXTS.has(extOfFile.value));

/** Prettier 处理上限，与 renderer-text 的 DEFAULT_PRETTY_PRINT_MAX_BYTES 对齐 */
const PRETTY_PRINT_MAX_BYTES = 512 * 1024;

/** file-viewer 组件实例（公开 API 门面：searchDocument / zoom / print …） */
const viewerRef = ref<FileViewerExpose | null>(null);

/**
 * 美化：打开 {@code text.prettyPrint} 并用一个同内容的新 {@link File} 触发重渲染。
 *
 * <p><b>不预先改写文件内容</b>（也不改文件名）——格式化由 renderer-text 内置的
 * Prettier 在渲染时完成，口径与其自动美化完全一致，避免前端再维护一套格式化规则
 * 而与渲染器产生分歧。</p>
 *
 * <p>换 File 实例而非只改 options：渲染器的格式化逻辑跑在渲染阶段，
 * 换文件能保证一定重跑一次渲染（只改 options 是否触发重渲染依赖渲染器实现）。</p>
 */
async function beautify(): Promise<void> {
  const file = props.file;
  if (!file) return;
  if (file.size > PRETTY_PRINT_MAX_BYTES) {
    message.warning(`文件超过 ${Math.round(PRETTY_PRINT_MAX_BYTES / 1024)}KB，已跳过美化`);
    return;
  }
  prettyPrint.value = true;
  try {
    const buf = await file.arrayBuffer();
    fileRef.value = new File([buf], file.name, { type: file.type });
  } catch (e) {
    console.warn("[FvPanelBase] 美化失败（内容可能无法解析）", e);
    message.error("美化失败：内容无法解析");
  }
}

/** 文本类扩展名（复制按钮的显示条件：内容可直接复制的文本文件） */
const TEXT_COPY_EXTS = new Set([
  "txt", "md", "markdown", "json", "jsonc", "json5", "js", "mjs", "cjs",
  "css", "scss", "less", "html", "htm", "xml", "xsl", "xsd", "svg",
  "yaml", "yml", "log", "ini", "cfg", "conf", "toml", "env", "gitignore",
  "sh", "bash", "zsh", "ps1", "bat", "cmd", "sql", "csv", "tsv",
  "java", "py", "pyi", "jsx", "ts", "tsx", "vue", "svelte", "astro",
  "go", "rs", "php", "c", "h", "cc", "cpp", "cxx", "hpp", "cs",
  "rb", "swift", "kt", "kts", "scala", "lua", "r", "dart", "ex", "exs",
  "erl", "hs", "clj", "fs", "m", "mm", "pl", "pm", "gradle", "ipynb",
]);

/** 当前文件内容是否可直接复制（文本类文件） */
const canCopyContent = computed(() => {
  const file = props.file;
  if (!file) return false;
  if (file.type.startsWith("text/")) return true;
  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  return TEXT_COPY_EXTS.has(ext);
});

/** 写剪贴板：优先异步 Clipboard API，降级 textarea + execCommand（非安全上下文） */
async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/** 复制文件内容（文本类文件；二进制文件无内容可复制，按钮不展示） */
async function copyFileContent(): Promise<void> {
  const file = props.file;
  if (!file) return;
  try {
    const text = await file.text();
    await writeClipboard(text);
    message.success("已复制文件内容");
  } catch (e) {
    console.warn("[FvPanelBase] 复制文件内容失败", e);
    message.error("复制失败，请检查浏览器剪贴板权限");
  }
}

/**
 * 工具条按钮悬停态（复制 / 美化共用）。
 *
 * <p>工具条按钮由 file-viewer 渲染进 shadow DOM（插槽内容被手工挂进 shadow 树），
 * 文档样式表（含本组件 scoped 样式）触达不到 slotted 元素——此前
 * {@code .fv-panel-base__copy} / {@code .fv-panel-base__beautify} 的 scoped 规则
 * 从未生效，按钮一直吃浏览器 UA 默认样式（灰底 / 方角 / 2px 边框，与内置 pill
 * 按钮不一致）。故样式一律走内联 + JS 悬停态。</p>
 */
const copyHover = ref(false);
const beautifyHover = ref(false);
/** 键盘聚焦态（与悬停区分：只用 :focus 无法在内联样式里表达，这里用事件跟踪） */
const copyFocus = ref(false);
const beautifyFocus = ref(false);

/** 工具条内联按钮样式：对齐 file-viewer 内置「下载」按钮（floating 变体） */
function toolbarPillStyle(hover: boolean, focus = false): CSSProperties {
  const isHover = hover || focus;
  return {
    height: "32px",
    minWidth: "48px",
    padding: "0 10px",
    border: isHover ? "1px solid rgba(33,163,102,.45)" : "1px solid transparent",
    borderRadius: "999px",
    background: isHover
      ? "rgba(33,163,102,.09)"
      : "transparent",
    color: isHover
      ? "#16774c"
      : "var(--file-viewer-button-color, #40546a)",
    fontSize: "12px",
    fontWeight: "800",
    lineHeight: "32px",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    appearance: "none",
    WebkitAppearance: "none",
    boxSizing: "border-box",
    margin: "0 0 0 4px",
    outline: "none",
    boxShadow: focus
      ? "0 0 0 2px rgba(33,163,102,.3), 0 0 12px rgba(33,163,102,.22)"
      : hover
        ? "0 0 10px rgba(33,163,102,.25)"
        : "none",
    transition: "background .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
  };
}

/** 复制按钮内联样式 */
const copyButtonStyle = computed<CSSProperties>(() => toolbarPillStyle(copyHover.value, copyFocus.value));

/** 美化按钮内联样式（与复制按钮同一套，保证工具条内视觉一致） */
const beautifyButtonStyle = computed<CSSProperties>(() =>
  toolbarPillStyle(beautifyHover.value, beautifyFocus.value),
);

/** 首帧渲染完成后按 initialKeyword 自动触发关键词高亮（官方 searchDocument API） */
function applyInitialKeyword(): void {
  const q = (props.initialKeyword ?? "").trim();
  if (q && viewerRef.value?.searchDocument) {
    viewerRef.value.searchDocument(q).catch((e) => console.warn("[FvPanelBase] 关键词高亮失败", e));
  }
}

/** 当前文件引用（props.file 变化即重渲染） */
const fileRef = ref<File | null>(null);

onMounted(() => {
  void ensureFileViewerLoaded();
  fileRef.value = props.file;
});
onBeforeUnmount(() => {
  disposed = true;
});
watch(
  () => props.file,
  (f) => {
    fileRef.value = f;
    // 换文件 = 重新进入渲染期，遮罩重新盖上直到新的 load-complete
    coverLoading.value = true;
    // 美化是「当前文件」的操作，换文件即复位（新文件默认按原样渲染）
    prettyPrint.value = false;
    if (!fileViewerReady && !disposed) void ensureFileViewerLoaded();
  },
);
watch(
  () => props.renderers,
  () => {
    if (!fileViewerReady && !disposed) void ensureFileViewerLoaded();
  },
);

/** load-complete → rendered 转发，并揭开宿主遮罩、触发初始关键词高亮 */
function onLoadComplete(): void {
  coverLoading.value = false;
  applyInitialKeyword();
  emit("rendered");
}

/** error → error 转发（错误态由入口层展示，遮罩同步揭开避免白屏卡死） */
function onViewerError(err: unknown): void {
  coverLoading.value = false;
  emit("error", err);
}
</script>

<template>
  <div class="fv-panel-base">
    <component
      :is="viewerComp"
      v-if="viewerComp && fileRef"
      ref="viewerRef"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-panel-base__body"
      data-testid="file-viewer"
      @load-complete="onLoadComplete"
      @error="onViewerError"
    >
      <!-- 工具条 start 区（搜索框旁）：美化按钮。
           样式与复制按钮同源（内联 pill，见 toolbarPillStyle）——
           slotted 内容在 shadow 树内，scoped 样式触达不到。 -->
      <template v-if="enableBeautify && canBeautify" #toolbar-start>
        <button
          type="button"
          class="fv-panel-base__beautify"
          title="美化（按 Prettier 格式化当前文件）"
          :style="beautifyButtonStyle"
          @click="beautify"
          @mouseenter="beautifyHover = true"
          @mouseleave="beautifyHover = false"
          @focus="beautifyFocus = true"
          @blur="beautifyFocus = false"
        >
          美化
        </button>
      </template>
      <!-- 工具条 end 区（内置动作之后）：复制文件内容按钮。
           仅文本类文件展示（二进制文件无内容可复制，有下载按钮兜底）。
           样式走内联（见 copyButtonStyle 注释：slotted 内容
           在 shadow 树内，scoped 样式触达不到）。 -->
      <template v-if="canCopyContent" #toolbar-end>
        <button
          type="button"
          class="fv-panel-base__copy"
          title="复制文件内容"
          :style="copyButtonStyle"
          @click="copyFileContent"
          @mouseenter="copyHover = true"
          @mouseleave="copyHover = false"
          @focus="copyFocus = true"
          @blur="copyFocus = false"
        >
          复制
        </button>
      </template>
    </component>
    <!-- 宿主加载遮罩：盖住 file-viewer 内置 loading（插件特征不可见），
         load-complete 后揭开；错误时同步揭开由入口层展示错误 -->
    <transition name="fv-cover">
      <div v-if="coverLoading" class="fv-panel-base__cover">
        <div class="fv-panel-base__cover-card">
          <span class="fv-panel-base__cover-badge">{{ extLabel }}</span>
          <span class="fv-panel-base__cover-dots"><i></i><i></i><i></i></span>
          <span class="fv-panel-base__cover-text">正在准备预览…</span>
        </div>
        <div class="fv-panel-base__cover-bar"><i></i></div>
      </div>
    </transition>
    <div v-if="loading && !viewerComp" class="fv-panel-base__mask">加载中…</div>
  </div>
</template>

<style scoped>
.fv-panel-base {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-panel-base__body {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-panel-base__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  inset: 0;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}

/* ---- 宿主加载遮罩（去插件特征的自绘动画） ---- */
.fv-panel-base__cover {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: var(--el-bg-color, #fff);
}

.fv-panel-base__cover-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.fv-panel-base__cover-badge {
  min-width: 64px;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid var(--el-color-primary-light-8, #d9ecff);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9, #eef3ff) 0%,
    var(--el-color-success-light-9, #e8f7f3) 100%
  );
  color: var(--el-text-color-primary, #33556e);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  box-shadow: 0 6px 18px rgba(51, 85, 110, 0.12);
}

.fv-panel-base__cover-dots {
  display: inline-flex;
  gap: 7px;
}

.fv-panel-base__cover-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary, #7ba3c9);
  animation: fv-cover-bounce 1.1s ease-in-out infinite;
}

.fv-panel-base__cover-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.fv-panel-base__cover-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes fv-cover-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.fv-panel-base__cover-text {
  color: var(--el-text-color-secondary, #64748b);
  font-size: 13px;
}

.fv-panel-base__cover-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  overflow: hidden;
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
}
.fv-panel-base__cover-bar i {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 38%;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--el-color-primary, #409eff) 40%,
    var(--el-color-success, #67c23a) 70%,
    transparent 100%
  );
  box-shadow: 0 0 8px var(--el-color-primary, #409eff);
  animation: fv-cover-sweep 1.4s ease-in-out infinite;
}

@keyframes fv-cover-sweep {
  0% {
    left: -38%;
  }
  100% {
    left: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fv-panel-base__cover-dots i,
  .fv-panel-base__cover-bar i {
    animation: none;
  }
  .fv-cover-enter-active,
  .fv-cover-leave-active {
    transition: none;
  }
}

.fv-cover-enter-active,
.fv-cover-leave-active {
  transition: opacity 0.25s ease;
}

.fv-cover-enter-from,
.fv-cover-leave-to {
  opacity: 0;
}

/* ---- 工具条扩展：关键词输入框（样式内联见 toolbarPillStyle） ---- */
.fv-panel-base__keyword {
  width: 150px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid #d4dae2;
  border-radius: 13px;
  background: #fff;
  color: #303133;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.fv-panel-base__keyword:focus {
  border-color: #4f7ef7;
  box-shadow: 0 0 0 2px rgba(79, 126, 247, 0.15);
}

/* ---- 工具条排序（::part 穿透 file-viewer shadow DOM） ----
   复制按钮在工具条 end 插槽（toolbar-slot），默认排在
   导出HTML / 主题之后（最右）。按产品要求移到「下载」与
   「打印」中间：给各内置动作设 flex order（搜索 / 缩放组
   保持默认 0 居首）。::part 只暴露 shadow 树内带 part
   属性的元素，对真实 shadow 元素生效（与 slotted 内容
   不同，后者文档样式触达不到）。 */
.fv-panel-base__body::part(download-button) {
  order: 1;
}

.fv-panel-base__body::part(toolbar-slot) {
  order: 2;
}

.fv-panel-base__body::part(print-menu) {
  order: 3;
}

.fv-panel-base__body::part(export-button) {
  order: 4;
}

.fv-panel-base__body::part(theme-button) {
  order: 5;
}
/* ---- 选中颜色（跟随主题主色） ---- */
.fv-panel-base ::selection,
.fv-panel-base *::selection {
  background: var(--el-color-primary-light-8, rgba(64, 158, 255, 0.18));
  color: var(--el-text-color-primary, #303133);
}

/* ---- 细滚动条（全局） ---- */
.fv-panel-base__body::-webkit-scrollbar,
.fv-panel-base::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.fv-panel-base__body::-webkit-scrollbar-track,
.fv-panel-base::-webkit-scrollbar-track {
  background: transparent;
}
.fv-panel-base__body::-webkit-scrollbar-thumb,
.fv-panel-base::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #dcdfe6);
  border-radius: 999px;
}
.fv-panel-base__body::-webkit-scrollbar-thumb:hover,
.fv-panel-base::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker, #c4c7ce);
}

</style>
