<!--
  FvRasterPanel.vue — 长尾栅格图（pbm/pgm/ppm/pnm、hdr、dds）预览面板。

  为什么自研：这几类都不在浏览器/ file-viewer 的解码范围内，但格式本身规则明确。
  解码在 utils/netpbm.ts、utils/hdr.ts、utils/dds.ts，本面板统一把结果画到 canvas。
-->
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { decodeNetpbm, type RasterImage } from "../../utils/netpbm";
import { decodeHdr } from "../../utils/hdr";
import { decodeDds } from "../../utils/dds";
import FvLoadingMask from "./FvLoadingMask.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀） */
  objectKey: string;
  /** 文件名（不含目录） */
  fileName: string;
  /** 压缩包内条目路径（走 inner-raw 通道取包内字节） */
  inner?: string;
  /** 文件大小（字节；仅兼容调用方透传） */
  size?: number;
  /** 直接可取的字节地址（票据 URL / blob URL） */
  src?: string;
}>();

const emit = defineEmits<{
  fallback: [];
  error: [msg: string];
  rendered: [];
}>();

const loading = ref(true);
const failReason = ref("");
const stats = ref("");
const canvasRef = ref<HTMLCanvasElement | null>(null);

/** 扩展名 → 解码器 + 展示名 */
function pickDecoder(name: string): { label: string; run: (b: ArrayBuffer) => RasterImage } | null {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (["pbm", "pgm", "ppm", "pnm"].includes(ext)) {
    return { label: "PNM 位图", run: decodeNetpbm };
  }
  if (ext === "hdr" || ext === "rgbe") return { label: "HDR 高动态范围", run: decodeHdr };
  if (ext === "dds") return { label: "DDS 纹理", run: decodeDds };
  return null;
}

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  stats.value = "";
  try {
    const dec = pickDecoder(props.fileName);
    if (!dec) throw new Error(`不支持的长尾图片格式：${props.fileName}`);

    let url = props.src ?? "";
    if (!url) {
      const params: Record<string, string> = {};
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) throw new Error("获取文件地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error("预览通道返回空响应体");

    const img = dec.run(buf);
    // 先解锁加载态，让 canvas 真正挂进 DOM（否则 canvasRef 仍是 null）
    loading.value = false;
    await nextTick();
    const canvas = canvasRef.value;
    if (!canvas) throw new Error("画布未就绪");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建 2D 画布上下文");
    ctx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);

    stats.value = `${dec.label} · ${img.width}×${img.height}`;
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "图片解码失败";
    console.warn("[FvRasterPanel] 解码失败", e);
    failReason.value = `图片加载失败（${props.fileName}）：${msg}`;
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
</script>

<template>
  <div class="fv-raster" data-testid="file-viewer">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-raster__mask"><span>{{ failReason }}</span></div>
    <template v-else>
      <div class="fv-raster__bar">
        <span class="fv-raster__stat" data-testid="raster-stats">{{ stats }}</span>
        <span class="fv-raster__file">{{ fileName }}</span>
      </div>
      <div class="fv-raster__stage">
        <canvas ref="canvasRef" class="fv-raster__canvas"></canvas>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fv-raster {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color, #fff);
}
.fv-raster__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.fv-raster__file {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-raster__stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  overflow: auto;
  /* 透明区域可见 */
  background-image: linear-gradient(45deg, rgba(0, 0, 0, 0.04) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(0, 0, 0, 0.04) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.04) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.04) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
.fv-raster__canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
}
.fv-raster__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
