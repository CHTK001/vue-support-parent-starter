<!--
  FvCadPanel.vue — CAD 图纸 file-viewer 渲染面板（自包含接线，未收敛到 FvPanelBase）。
  替换旧面板：src/components/CadPreviewPanel.vue（旧面板走 ?format=cad 纯数据通道取 SVG/头部信息；
  新组件改走对象字节 + file-viewer 的 cad 渲染器直接出图）。
-->
<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import FvLoadingMask from "./FvLoadingMask.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 图纸对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 图纸文件名（不含目录） */
  fileName: string;
  /** 压缩包内条目路径（?format=cad&inner= 语义的对应：取包内该条目字节） */
  inner?: string;
  /** 文件大小（字节；保留仅为兼容旧调用方，未使用） */
  size?: number;
  /** 直接可取的字节地址（兼容透传的票据 URL；为空时按 bucket/objectKey 签票据） */
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
 * 生效文件名：包内条目取路径末段（抄 PreviewMediaPanel.vue effectiveName 思路，
 * 旧 CadPreviewPanel 用后端回的 name 展示包内路径，这里取字节只需末段判型）。
 */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) return props.fileName;
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/**
 * 交给 file-viewer 的文件名：dwg/dxf 必须带正确扩展名（渲染器按扩展名选型）。
 * 包内条目末段若丢了扩展名（如解压路径异常），按顶层 fileName 的扩展名补回。
 */
const viewerFileName = computed(() => {
  const eff = effectiveName.value;
  if (/\.(dwg|dxf)$/i.test(eff)) return eff;
  const dot = props.fileName.lastIndexOf(".");
  const ext = dot >= 0 ? props.fileName.slice(dot) : ".dxf";
  const base = eff.includes(".") ? eff.slice(0, eff.lastIndexOf(".")) : eff;
  return `${base}${ext}`;
});

/** 加载中 */
const loading = ref(true);
/** 失败文案（空串表示无错） */
const failReason = ref("");
/** 交给 file-viewer 的 File 对象 */
const fileRef = shallowRef<File | null>(null);

/**
 * file-viewer 组件（懒加载，照抄 PreviewOfficePanel.vue 106-166 行模式）。
 */
const viewerComp = shallowRef<Component | null>(null);
/** cad 渲染器 preset（rendererMode:'replace' 时唯一 registry 来源） */
let cadPreset: unknown = null;
/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
let fileViewerReady = false;

/** 懒加载 file-viewer 全套依赖（并行拉取组件 + cad 渲染器 + 样式） */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  try {
    const [vueMod, rendererMod, cssMod] = await Promise.all([
      import("@file-viewer/vue3-full"),
      import("@file-viewer/renderer-cad"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
    ]);
    void cssMod; // 样式副作用导入
    const renderer = (rendererMod as { cadRenderer?: unknown }).cadRenderer;
    cadPreset = {
      id: "file-viewer-preset-cad",
      label: "Flyfish File Viewer cad renderer preset",
      renderers: [renderer],
    };
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer
      ?? (vueMod as { default?: Component }).default
      ?? null;
    fileViewerReady = !!viewerComp.value && !!cadPreset && !!renderer;
    return fileViewerReady;
  } catch (e) {
    console.warn("[FvCadPanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: cadPreset,
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/**
 * 取图纸字节并准备渲染。
 *
 * 取字节逻辑对照旧 CadPreviewPanel.vue load()（getCadInfo(bucket, objectKey, inner)）：
 * 旧面板传 inner 解析包内条目、不传解析对象本身——这里同样：有 inner 时票据带
 * preview=true&inner=（抄 PreviewMediaPanel.vue load() 的包内分支，后端包内提取只挂
 * 在预览分支上），无 inner 时直接签顶层对象票据。再 fetch 成字节包成 File。
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
      if (!url) throw new Error("获取图纸地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    if (!ab.byteLength) throw new Error("预览通道返回空响应体");
    const ready = await ensureFileViewerLoaded();
    if (!ready) throw new Error("file-viewer 依赖加载失败");
    fileRef.value = new File([ab], viewerFileName.value);
  } catch (e) {
    const msg = (e as Error)?.message ?? "CAD 图纸加载失败";
    console.warn("[FvCadPanel] CAD 图纸加载失败", e);
    failReason.value = `CAD 图纸加载失败（${effectiveName.value}）：${msg}`;
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

/** file-viewer 解析失败（多为 DWG 私有格式几何无法解析/损坏文件）：退回旧面板兜底 */
function onRenderError(): void {
  console.warn("[FvCadPanel] file-viewer 渲染失败", viewerFileName.value);
  failReason.value = `CAD 图纸解析失败（${effectiveName.value}），请下载后用 CAD 软件打开`;
  emit("fallback");
  emit("error", failReason.value);
}
</script>

<template>
  <div class="fv-cad-panel">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-cad-panel__mask">
      <span class="fv-cad-panel__mask-text">{{ failReason }}</span>
    </div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-cad-panel__body"
      data-testid="file-viewer"
      @load-complete="onRendered"
      @error="onRenderError"
    />
  </div>
</template>

<style scoped>
.fv-cad-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.fv-cad-panel__body {
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}
.fv-cad-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-cad-panel__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
