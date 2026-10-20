<script setup lang="ts">
/**
 * DICOM 医疗影像 file-viewer 面板（dcm/dicom）。
 *
 * <p>替代 {@code PreviewDicomPanel} 的 Cornerstone 直连链路：取字节逻辑照抄
 * {@code PreviewDicomPanel.load}（票据直链 {@code resolveObjectUrl}，
 * 包内条目带 {@code preview=true&inner=}，兼容直传 {@code src}），字节包成
 * {@code File}（保证 .dcm/.dicom 扩展名以便 file-viewer 选渲染器）后交给
 * {@code @file-viewer/vue3} + {@code dicomRenderer} 渲染。</p>
 *
 * <p>注意：{@code dicomRenderer} 所在包在 file-viewer 默认 presets 里是空数组，
 * 必须显式放进 {@code options.preset.renderers}（照抄
 * {@code PreviewOfficePanel} 第 106-166 行模式）；且该包 peer 依赖
 * {@code @cornerstonejs}，import 时若抛错则 catch 住并 {@code emit('fallback')}，
 * 由父组件退回旧面板/服务端通道。</p>
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import FvLoadingMask from "./FvLoadingMask.vue";

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
  /** 本面板无法渲染，父组件应退回旧面板/服务端通道 */
  fallback: [];
  /** 加载或渲染失败（msg 为中文可读文案） */
  error: [msg: string];
}>();

/** 加载中（取数 + 依赖懒加载） */
const loading = ref(true);
/** 失败文案（空串表示无错） */
const failReason = ref("");
/** 交给 file-viewer 的 File 对象 */
const fileRef = shallowRef<File | null>(null);
/** file-viewer 组件（懒加载，不进主包） */
const viewerComp = shallowRef<Component | null>(null);
/** dicom 渲染器插件（rendererMode:'replace' 时唯一 registry 来源） */
let dicomPlugin: unknown = null;
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

/**
 * 交给 file-viewer 的文件名。
 *
 * <p>file-viewer 按文件名扩展名选渲染器：无扩展名或扩展名不对时补 .dcm，
 * 保证 dicomRenderer 能接住。</p>
 */
const viewerFileName = computed(() => {
  const name = effectiveName.value;
  return /\.(dcm|dicom)$/i.test(name) ? name : `${name}.dcm`;
});

/**
 * 懒加载 file-viewer 全套依赖（vue3 组件 + 样式 + dicomRenderer）。
 *
 * <p>dicomRenderer 的包 peer 依赖 {@code @cornerstonejs}，缺装/版本冲突时
 * import 即抛——此处单独 catch，调用方改走 fallback。</p>
 *
 * @returns 全部就绪返回 true；任一环节失败返回 false
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (viewerReady) return true;
  try {
    const [vueMod, cssMod] = await Promise.all([
      import("@file-viewer/vue3-full"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
    ]);
    void cssMod; // 样式副作用导入
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer
      ?? (vueMod as { default?: Component }).default
      ?? null;
  } catch (e) {
    console.warn("[FvDicomPanel] file-viewer 组件加载失败", e);
    return false;
  }
  try {
    const rendererMod = await import("@file-viewer/renderer-dicom") as {
      dicomRenderer?: unknown;
      default?: unknown;
    };
    dicomPlugin = rendererMod.dicomRenderer ?? rendererMod.default ?? null;
  } catch (e) {
    console.warn("[FvDicomPanel] dicomRenderer 加载失败（@cornerstonejs peer 缺失？）", e);
    return false;
  }
  viewerReady = !!viewerComp.value && !!dicomPlugin;
  return viewerReady;
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: { id: "dicom", label: "DICOM 影像", renderers: [dicomPlugin] },
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/**
 * 拉字节 → 懒加载依赖 → 构造 File 交给 file-viewer。
 *
 * <p>取字节分支照抄 {@code PreviewDicomPanel.load}：直传 {@code src} 优先，
 * 否则 {@code resolveObjectUrl} 签短时票据后 fetch（包内条目必须带
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
    const ready = await ensureFileViewerLoaded();
    if (disposed) {
      return;
    }
    if (!ready) {
      throw new Error("影像渲染依赖加载失败");
    }
    fileRef.value = new File([buf], viewerFileName.value);
  } catch (e) {
    if (disposed) {
      return;
    }
    const msg = e instanceof Error && e.message ? e.message : "影像加载失败";
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
  const msg = `该 DICOM 影像暂不支持在线预览（${effectiveName.value}），请下载后用专业查看器打开`;
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
  <section class="fv-dicom" aria-label="DICOM 医疗影像预览">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-dicom__mask">
      <span class="fv-dicom__mask-text">{{ failReason }}</span>
    </div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-dicom__body"
      data-testid="file-viewer"
      @load-complete="onRendered"
      @error="onRenderError"
    />
  </section>
</template>

<style scoped>
.fv-dicom {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.fv-dicom__body {
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}
.fv-dicom__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-dicom__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
