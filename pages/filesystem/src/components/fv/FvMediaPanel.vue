<!--
  FvMediaPanel.vue — 音视频 file-viewer 渲染面板（自包含接线，未收敛到 FvPanelBase）。
  替换旧面板：src/components/PreviewMediaPanel.vue（旧面板直出 <video>/<audio> + 票据续播逻辑）。
-->
<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
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
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；包内条目暂无从得知时为 0 */
  size?: number;
  /** 直接可取的字节地址（兼容旧调用方透传的票据 URL；为空时按 bucket/objectKey 签票据） */
  src?: string;
}>();

const emit = defineEmits<{
  /** 渲染失败，请求父组件退回旧面板/下载兜底 */
  fallback: [];
  /** 加载或解析失败（msg 为可读文案） */
  error: [msg: string];
  /** 渲染完成 */
  rendered: [];
}>();

/**
 * 生效文件名：包内条目取路径末段（抄 PreviewMediaPanel.vue effectiveName，
 * 下钻时 fileName 是压缩包自己的名字，拿它判型会把包里的 mp4 判成压缩包）。
 */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) return props.fileName;
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 交给 file-viewer 的文件名（带扩展名，渲染器按它选型） */
const viewerFileName = computed(() =>
  effectiveName.value.includes(".") ? effectiveName.value : props.fileName,
);

/** 加载中 */
const loading = ref(true);
/** 失败文案（空串表示无错） */
const failReason = ref("");
/** 交给 file-viewer 的 File 对象 */
const fileRef = shallowRef<File | null>(null);

/**
 * file-viewer 组件（懒加载，照抄 PreviewOfficePanel.vue 106-166 行模式）。
 * vue3 组件 + 样式只在真正打开媒体时才加载，不进主包。
 */
const viewerComp = shallowRef<Component | null>(null);
/** media 渲染器 preset（rendererMode:'replace' 时唯一 registry 来源） */
let mediaPreset: unknown = null;
/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
let fileViewerReady = false;

/** 懒加载 file-viewer 全套依赖（并行拉取组件 + media 渲染器 + 样式） */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  try {
    const [vueMod, rendererMod, cssMod] = await Promise.all([
      import("@file-viewer/vue3-full"),
      import("@file-viewer/renderer-media"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
    ]);
    void cssMod; // 样式副作用导入
    const renderer = (rendererMod as { mediaRenderer?: unknown }).mediaRenderer;
    mediaPreset = {
      id: "file-viewer-preset-media",
      label: "Flyfish File Viewer media renderer preset",
      renderers: [renderer],
    };
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer
      ?? (vueMod as { default?: Component }).default
      ?? null;
    fileViewerReady = !!viewerComp.value && !!mediaPreset && !!renderer;
    return fileViewerReady;
  } catch (e) {
    console.warn("[FvMediaPanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: mediaPreset,
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/**
 * 取字节并准备渲染。
 *
 * 取字节逻辑抄 PreviewMediaPanel.vue load()：包内条目必须带
 * preview=true&inner=（票据直读通道对 inner 的提取只挂在预览分支上，
 * 只传 inner 不传 preview 会拿到整个压缩包的字节）；顶层对象直接签票据。
 * 区别：旧面板把票据 URL 直接喂给 <video src>，这里 fetch 成字节再包成 File
 * 交给 file-viewer（file-viewer 只吃 File/Blob）。
 */
async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  fileRef.value = null;
  try {
    let url = props.src ?? "";
    if (!url) {
      const params: Record<string, string> = {};
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) throw new Error("获取播放地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    if (!ab.byteLength) throw new Error("预览通道返回空响应体");
    const ready = await ensureFileViewerLoaded();
    if (!ready) throw new Error("file-viewer 依赖加载失败");
    fileRef.value = new File([ab], viewerFileName.value);
  } catch (e) {
    const msg = (e as Error)?.message ?? "媒体加载失败";
    console.warn("[FvMediaPanel] 媒体加载失败", e);
    failReason.value = `媒体加载失败（${effectiveName.value}）：${msg}`;
    emit("fallback");
    emit("error", failReason.value);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.src, props.fileName],
  () => void load(),
  { immediate: true },
);

/** file-viewer 渲染完成 */
function onRendered(): void {
  emit("rendered");
}

/** file-viewer 解析失败（多为浏览器解不了的编码）：退回旧面板/下载兜底 */
function onRenderError(): void {
  console.warn("[FvMediaPanel] file-viewer 渲染失败", viewerFileName.value);
  failReason.value = `浏览器无法解码该媒体（${effectiveName.value}），请下载后用 VLC / PotPlayer 打开`;
  emit("fallback");
  emit("error", failReason.value);
}
</script>

<template>
  <div class="fv-media-panel">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-media-panel__mask">
      <span class="fv-media-panel__mask-text">{{ failReason }}</span>
    </div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-media-panel__body"
      data-testid="file-viewer"
      @load-complete="onRendered"
      @error="onRenderError"
    />
  </div>
</template>

<style scoped>
.fv-media-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.fv-media-panel__body {
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}
.fv-media-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-media-panel__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
