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
    fileRef.value = new File([buf], viewerFileName.value);
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
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
});
</script>

<template>
  <section class="fv-binary" aria-label="二进制文件检视">
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
</style>
