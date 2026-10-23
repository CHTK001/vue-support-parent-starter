<script setup lang="ts">
/**
 * 二进制检视 file-viewer 面板（bin/elf/exe/dll 等）。
 *
 * <p>此前无旧面板、此前走服务端 iframe：可执行/二进制文件没有对应的前端
 * 预览面板，只能下载或看服务端「不支持预览」提示页。本面板改走客户端检视：
 * 取字节后包成 {@code File} 交给 {@code @file-viewer/vue3} +
 * {@code binaryRenderer}（结构解析 + 十六进制检视）。</p>
 *
 * <p>骨架与 {@code FvDicomPanel} 一致（自包含 file-viewer 接线，未收敛到
 * FvPanelBase）：preset 显式携带 {@code binaryRenderer}，rendererMode:'replace'，
 * 主题 light，工具条右下。</p>
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { parseClassInfo, type ClassInfo } from "../../utils/classFile";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示与判型请用生效名） */
  fileName: string;
  /** 直接可取的字节地址（有则优先使用，不走票据签发） */
  src?: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；包内条目取不到时显示 - */
  size?: number;
}>();

const emit = defineEmits<{
  /** file-viewer 渲染完成 */
  rendered: [];
  /** 本面板无法渲染，父组件应退回服务端通道 */
  fallback: [];
  /** 加载或渲染失败（msg 为中文可读文案） */
  error: [msg: string];
}>();

/** 在线检视体积上限：超大二进制只会把解码与渲染拖死，直接引导下载 */
const MAX_BYTES = 64 * 1024 * 1024;

/** 加载中（取数 + 依赖懒加载） */
const loading = ref(true);
/** 失败文案（空串表示无错） */
const failReason = ref("");
/** 交给 file-viewer 的 File 对象 */
const fileRef = shallowRef<File | null>(null);
/** file-viewer 组件（懒加载，不进主包） */
const viewerComp = shallowRef<Component | null>(null);
/** binary 渲染器插件（rendererMode:'replace' 时唯一 registry 来源） */
let binaryPlugin: unknown = null;
/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
let viewerReady = false;
/** 组件是否已卸载（拦截在途异步回调） */
let disposed = false;

/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** binary 渲染器原生支持的扩展名；其余格式用 .bin 规避其他 renderer 按扩展名抢路由 */
const BINARY_RENDERER_EXTS = new Set(["bin", "hex", "elf", "exe", "dll", "class", "macho"]);
const viewerFileName = computed(() => {
  const ext = effectiveName.value.split(".").pop()?.toLowerCase() || "";
  return BINARY_RENDERER_EXTS.has(ext) ? effectiveName.value : "file.bin";
});

/** 生效扩展名（小写，不含点） */
const effectiveExt = computed(() => effectiveName.value.split(".").pop()?.toLowerCase() || "");

/**
 * 是否展示「反编译」入口：只有 {@code .class} 有。
 *
 * <p>反编译在浏览器内完成：{@code @run-slicer/cfr}（CFR 0.152 的 JS/WASM 移植）
 * 前端反编译，不依赖后端服务端通道；类名按 JVMS 解析 {@code this_class} 得到，
 * 不靠文件名猜。装配了 Binary Inspector（{@code binaryRenderer}）的十六进制检视，
 * 反编译作为 <b>另一种视图</b> 与检视并列，用户可在两者间切换。</p>
 */
const canDecompile = computed(() => effectiveExt.value === "class");

/** Java 主版本号 → 语言版本（45 = 1.1，52 = 8，61 = 17，65 = 21 …） */
const javaVersionLabel = computed(() => {
  const m = classInfo.value?.major;
  if (!m) return "";
  if (m <= 48) return `Java 1.${m - 44}`;
  return `Java ${m - 44}`;
});

/** 反编译源码行数（仅 .class 有） */
const sourceLineCount = computed(() =>
  decompiledSource.value ? decompiledSource.value.split("\n").length : 0,
);

/** 当前显示的是反编译源码（true）还是十六进制检视（false，默认） */
const showDecompiled = ref(false);
/** 反编译源码文本（前端 CFR 产出） */
const decompiledSource = ref("");
/** 反编译中 */
const decompiling = ref(false);
/** 反编译失败文案 */
const decompileErr = ref("");
/** 反编译产出的类信息（仅 .class 有） */
const classInfo = ref<ClassInfo | null>(null);
/** 反编译用时（ms） */
const decompileElapsed = ref(0);
/** 最近一次取到的字节（供反编译复用，避免二次拉取） */
let rawBytes: ArrayBuffer | null = null;

/** 去掉 CFR 输出顶部的许可证块注释，只留代码 */
function stripHeader(src: string): string {
  const m = /^\s*\/\*[\s\S]*?\*\/\s*/.exec(src);
  return m ? src.slice(m[0].length) : src;
}

/** CFR 包类型（@run-slicer/cfr 的 d.ts 已提供同名 API，这里只做兼容层） */
interface CfrModule {
  decompile: (
    names: string | string[],
    config?: {
      source?: (name: string) => Promise<Uint8Array | null>;
      options?: Record<string, string>;
    },
  ) => Promise<Record<string, string>>;
}

/** 切换视图；首次进入反编译视图时在前端执行 CFR 反编译 */
async function toggleDecompiled(): Promise<void> {
  if (showDecompiled.value) {
    showDecompiled.value = false;
    return;
  }
  await decompileOnce();
  if (!decompileErr.value) {
    showDecompiled.value = true;
  }
}

/**
 * 前端 CFR 反编译（幂等）：仅成功一次，成功后缓存 {@link decompiledSource}。
 */
async function decompileOnce(): Promise<void> {
  if (decompiledSource.value || decompiling.value) return;
  if (!rawBytes) return;
  decompileErr.value = "";
  decompiling.value = true;
  const t0 = performance.now();
  try {
    const meta = parseClassInfo(rawBytes);
    classInfo.value = meta;
    const mod = (await import("@run-slicer/cfr")) as unknown as CfrModule;
    const bytes = new Uint8Array(rawBytes);
    const out = await mod.decompile(meta.internalName, {
      source: async (name) => (name === meta.internalName ? bytes : null),
      options: {},
    });
    const src = out[meta.internalName] ?? Object.values(out)[0] ?? "";
    if (!src.trim()) throw new Error("CFR 未返回源码");
    decompileElapsed.value = Math.round(performance.now() - t0);
    decompiledSource.value = stripHeader(src);
  } catch (e) {
    decompileErr.value = e instanceof Error && e.message ? `反编译失败：${e.message}` : "反编译失败";
  } finally {
    decompiling.value = false;
  }
}

/** 下载反编译后的 Java 源码（仅 .class 有内容时可用） */
function downloadDecompiled(): void {
  const src = decompiledSource.value;
  if (!src) return;
  const base = effectiveName.value.replace(/\.class$/i, "");
  const blob = new Blob([src], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${base || "decompiled"}.java`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 懒加载 file-viewer 全套依赖（vue3 组件 + 样式 + binaryRenderer）。
 *
 * @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (viewerReady) return true;
  try {
    const [vueMod, cssMod, rendererMod] = await Promise.all([
      import("@file-viewer/vue3-full"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
      import("@file-viewer/renderer-binary") as Promise<{
        binaryRenderer?: unknown;
        default?: unknown;
      }>,
    ]);
    void cssMod; // 样式副作用导入
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer
      ?? (vueMod as { default?: Component }).default
      ?? null;
    binaryPlugin = rendererMod.binaryRenderer ?? rendererMod.default ?? null;
    viewerReady = !!viewerComp.value && !!binaryPlugin;
    return viewerReady;
  } catch (e) {
    console.warn("[FvBinaryPanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: { id: "binary", label: "二进制检视", renderers: [binaryPlugin] },
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/**
 * 拉字节 → 懒加载依赖 → 构造 File 交给 file-viewer。
 *
 * <p>取字节口径与 {@code FvDicomPanel} 一致：直传 {@code src} 优先，否则
 * {@code resolveObjectUrl} 签短时票据后 fetch（包内条目必须带
 * {@code preview=true&inner=}）。任一环节失败 emit error + fallback。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  failReason.value = "";
  fileRef.value = null;
  try {
    let buf: ArrayBuffer;
    if (props.src) {
      const res = await fetch(props.src);
      if (!res.ok) {
        throw new Error(`读取文件失败（HTTP ${res.status}）`);
      }
      buf = await res.arrayBuffer();
    } else {
      const params: Record<string, string> = {};
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) {
        throw new Error("获取文件地址失败");
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`读取文件失败（HTTP ${res.status}）`);
      }
      buf = await res.arrayBuffer();
    }
    if (disposed) {
      return;
    }
    if (buf.byteLength === 0) {
      throw new Error("文件内容为空");
    }
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("文件过大（超过 64 MB），请下载后用本地工具查看");
    }
    const ready = await ensureFileViewerLoaded();
    if (disposed) {
      return;
    }
    if (!ready) {
      throw new Error("二进制检视依赖加载失败");
    }
    rawBytes = buf;
    fileRef.value = new File([buf], viewerFileName.value);
    // .class：预览直接是「反编译 Java 源码」——加载后自动反编译并切到源码视图；
    // 反编译失败时留在十六进制视图，不阻断检视。
    if (canDecompile.value && !disposed) {
      await decompileOnce();
      if (disposed) return;
      if (!decompileErr.value && !showDecompiled.value) {
        showDecompiled.value = true;
      }
    }
  } catch (e) {
    if (disposed) {
      return;
    }
    const msg = e instanceof Error && e.message ? e.message : "二进制文件加载失败";
    failReason.value = msg;
    emit("error", msg);
    emit("fallback");
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** file-viewer 渲染完成 */
function onRendered(): void {
  emit("rendered");
}

/** file-viewer 解析失败：面板内提示 + 通知父组件兜底 */
function onRenderError(): void {
  const msg = `该二进制文件暂不支持在线检视（${effectiveName.value}），请下载后用本地工具打开`;
  failReason.value = msg;
  emit("error", msg);
  emit("fallback");
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.src, props.fileName],
  () => {
    // 换文件即回到十六进制视图，并清掉上一份的反编译产物
    showDecompiled.value = false;
    decompiledSource.value = "";
    decompileErr.value = "";
    classInfo.value = null;
    decompileElapsed.value = 0;
    rawBytes = null;
    void load();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
});
</script>

<template>
  <section class="fv-binary" aria-label="二进制文件检视">
    <!-- .class：十六进制 / 反编译源码 切换。反编译由前端 @run-slicer/cfr 完成 -->
    <div v-if="canDecompile" class="fv-binary__bar">
      <button
        type="button"
        class="fv-binary__tab"
        :class="{ 'fv-binary__tab--active': !showDecompiled }"
        @click="showDecompiled = false"
      >
        十六进制
      </button>
      <button
        type="button"
        class="fv-binary__tab"
        :class="{ 'fv-binary__tab--active': showDecompiled }"
        @click="toggleDecompiled"
      >
        反编译源码
      </button>
      <span v-if="decompiling" class="fv-binary__bar-info">反编译中…</span>
      <span v-else-if="classInfo && decompiledSource" class="fv-binary__bar-meta">
        {{ classInfo.name }} · {{ javaVersionLabel }} · {{ sourceLineCount }} 行 · {{ decompileElapsed }} ms · CFR 0.152
      </span>
      <button
        v-if="decompiledSource"
        type="button"
        class="fv-binary__tab fv-binary__tab--download"
        title="下载反编译后的 Java 源码"
        @click="downloadDecompiled"
      >
        下载
      </button>
      <span v-if="decompileErr" class="fv-binary__bar-err">{{ decompileErr }}</span>
    </div>
    <div v-if="showDecompiled" class="fv-binary__codeframe">
      <div v-if="decompiling" class="fv-binary__mask">
        <span class="fv-binary__mask-text">反编译中…</span>
      </div>
      <div v-else-if="decompileErr" class="fv-binary__mask">
        <span class="fv-binary__mask-text">{{ decompileErr }}</span>
      </div>
      <pre v-else-if="decompiledSource" class="fv-binary__code" data-testid="class-source">{{ decompiledSource }}</pre>
      <div v-else class="fv-binary__mask">
        <span class="fv-binary__mask-text">无源码</span>
      </div>
    </div>
    <template v-else>
      <div v-if="loading" class="fv-binary__mask">
        <span class="fv-binary__mask-text">加载中…</span>
      </div>
      <div v-else-if="failReason" class="fv-binary__mask">
        <span class="fv-binary__mask-text">{{ failReason }}</span>
      </div>
      <component
        :is="viewerComp"
        v-else-if="viewerComp && fileRef"
        :file="fileRef"
        :options="viewerOptions"
        class="fv-binary__body"
        data-testid="file-viewer"
        @load-complete="onRendered"
        @error="onRenderError"
      />
    </template>
  </section>
</template>

<style scoped>
.fv-binary {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.fv-binary__body {
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}
.fv-binary__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-binary__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
/* .class 的视图切换条与反编译 iframe */
.fv-binary__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 8px;
}
.fv-binary__tab {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background: var(--el-bg-color, #fff);
  color: #444c56;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.fv-binary__tab:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.fv-binary__tab--active {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
.fv-binary__tab--download {
  margin-left: auto;
  border-color: var(--el-color-success, #67c23a);
  color: var(--el-color-success, #67c23a);
  background: var(--el-bg-color, #fff);
}
.fv-binary__tab--download:hover {
  background: var(--el-color-success-light-9, #f0f9eb);
}
.fv-binary__bar-err {
  color: var(--el-color-danger, #f56c6c);
  font-size: 12px;
}
.fv-binary__bar-info {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.fv-binary__bar-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* .class 反编译源码视图（前端 CFR 产出） */
.fv-binary__codeframe {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter, #fafafa);
}
.fv-binary__code {
  margin: 0;
  padding: 14px 16px 40px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-primary, #303133);
  white-space: pre;
  tab-size: 4;
}
</style>
