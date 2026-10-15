<script setup lang="ts">
/**
 * JPEG XL（.jxl）真实浏览器预览面板。
 *
 * <p>Edge/Chromium 内置解码器目前不覆盖 JXL，file-viewer 的 imageRenderer
 * 只能把字节交给 <img>，结果为空。这里用 @cornerstonejs/codec-libjxl 的
 * WASM libjxl 解码器在浏览器内解出像素，再画到 canvas；这是真实解码，
 * 不依赖服务端转换，也没有 mock。</p>
 */
import { nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";

const props = defineProps<{
  bucket: string;
  objectKey: string;
  fileName: string;
  src?: string;
  inner?: string;
  size?: number;
}>();

const emit = defineEmits<{
  rendered: [];
  error: [msg: string];
  fallback: [];
}>();

void props.size;

const loading = ref(true);
const errorMsg = ref("");
const canvasRef = ref<HTMLCanvasElement | null>(null);
const meta = shallowRef<{ width: number; height: number; channels: number; bits: number } | null>(null);
const decoderFactory = shallowRef<((opts?: Record<string, unknown>) => Promise<unknown>) | null>(null);
let disposed = false;
let loadToken = 0;

type DecoderLike = {
  getEncodedBuffer?: (size: number) => Uint8Array;
  getFrameInfo?: () => Record<string, unknown>;
  getDecodedBuffer?: () => Uint8Array | Uint16Array;
  decode?: () => void;
  releaseBuffers?: () => void;
};

function numOf(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

async function ensureDecoderFactory(): Promise<void> {
  if (decoderFactory.value) return;
  const mod = (await import("@cornerstonejs/codec-libjxl/decodewasmjs")) as unknown as {
    default?: (opts?: Record<string, unknown>) => Promise<unknown>;
  };
  const factory = mod.default ?? null;
  if (!factory) throw new Error("JXL decoder module missing");
  decoderFactory.value = factory;
}

function locateWasm(file: string): string {
  // Vite 会把裸包里的 .wasm 按资产 URL 处理；libjxl 只在这时才会去取 wasm。
  return file.endsWith(".wasm")
    ? new URL("@cornerstonejs/codec-libjxl/decodewasm", import.meta.url).href
    : file;
}

async function fetchBytes(): Promise<ArrayBuffer> {
  if (props.src) {
    const res = await fetch(props.src, { headers: authHeaders() });
    if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
    return res.arrayBuffer();
  }
  const base = objectUrl(props.bucket, props.objectKey);
  const url = props.inner
    ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}`
    : base;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
  return res.arrayBuffer();
}

function drawPixels(
  info: Record<string, unknown>,
  source: Uint8Array | Uint16Array,
  width: number,
  height: number,
): void {
  const channels = numOf(info.componentCount, numOf(info.components, 3));
  const bits = numOf(info.bitsPerSample, numOf(info.bits, 8));
  const pixelCount = width * height;
  const view = source as Uint8Array | Uint16Array;
  const useBytes = channels === 3 || channels === 4 || channels === 2 || channels === 1;
  const rgba = new Uint8ClampedArray(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const srcIndex = i * channels;
    const dstIndex = i * 4;
    const read = (idx: number): number => {
      const raw = source.BYTES_PER_ELEMENT > 1 ? (view as Uint16Array)[idx] : (view as Uint8Array)[idx];
      if (source.BYTES_PER_ELEMENT > 1 && bits !== 8) {
        return Math.min(255, (raw >> (bits - 8)) & 255);
      }
      return Math.min(255, raw & 255);
    };
    if (!useBytes || source.length < srcIndex + channels) {
      rgba[dstIndex] = 255;
      rgba[dstIndex + 1] = 255;
      rgba[dstIndex + 2] = 255;
      rgba[dstIndex + 3] = 255;
      continue;
    }
    if (channels === 1) {
      rgba[dstIndex] = read(srcIndex);
      rgba[dstIndex + 1] = read(srcIndex);
      rgba[dstIndex + 2] = read(srcIndex);
      rgba[dstIndex + 3] = 255;
    } else if (channels === 2) {
      rgba[dstIndex] = read(srcIndex);
      rgba[dstIndex + 1] = read(srcIndex);
      rgba[dstIndex + 2] = read(srcIndex);
      rgba[dstIndex + 3] = read(srcIndex + 1);
    } else if (channels === 3) {
      rgba[dstIndex] = read(srcIndex);
      rgba[dstIndex + 1] = read(srcIndex + 1);
      rgba[dstIndex + 2] = read(srcIndex + 2);
      rgba[dstIndex + 3] = 255;
    } else {
      rgba[dstIndex] = read(srcIndex);
      rgba[dstIndex + 1] = read(srcIndex + 1);
      rgba[dstIndex + 2] = read(srcIndex + 2);
      rgba[dstIndex + 3] = read(srcIndex + 3);
    }
  }

  const canvas = canvasRef.value;
  if (!canvas) throw new Error("JXL canvas unavailable");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("JXL canvas context unavailable");
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  meta.value = { width, height, channels, bits };
}

async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  meta.value = null;
  console.warn("[JXL_LOAD]", props.fileName, props.objectKey, props.src, props.inner);
  try {
    const [buf] = await Promise.all([fetchBytes(), ensureDecoderFactory()]);
    if (disposed || token !== loadToken) return;
    if (!buf.byteLength) throw new Error("JXL 文件内容为空");
    const factory = decoderFactory.value;
    if (!factory) throw new Error("JXL decoder unavailable");
    const codec = (await factory({ locateFile: locateWasm })) as {
      JpegXLDecoder?: new () => DecoderLike;
    };
    const JpegXLDecoder = codec.JpegXLDecoder;
    if (!JpegXLDecoder) throw new Error("JXL decoder init failed");
    const decoder = new JpegXLDecoder();
    const input = decoder.getEncodedBuffer?.(buf.byteLength);
    if (!input) throw new Error("JXL decoder buffer unavailable");
    input.set(new Uint8Array(buf));
    decoder.decode?.();
    const info = decoder.getFrameInfo?.() ?? {};
    const width = numOf(info.width, numOf(info.Width, numOf(info.iw, 0)));
    const height = numOf(info.height, numOf(info.Height, numOf(info.ih, 0)));
    if (!width || !height) throw new Error("JXL 解码元数据缺失");
    const pixels = decoder.getDecodedBuffer?.();
    if (!pixels) throw new Error("JXL 解码像素缺失");
    for (let i = 0; i < 30 && !canvasRef.value; i++) await nextTick();
    drawPixels(info, pixels, width, height);
    decoder.releaseBuffers?.();
    emit("rendered");
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = e instanceof Error && e.message ? e.message : "JXL 解码失败";
    console.error("[FvJxlPanel]", msg, e);
    errorMsg.value = msg;
    emit("error", msg);
    emit("fallback");
  } finally {
    if (!disposed && token === loadToken) loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.fileName, props.src, props.inner],
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
  loadToken++;
});
</script>

<template>
  <section class="fv-jxl" aria-label="JPEG XL 图片预览">
    <div v-if="loading" class="fv-jxl__mask">JXL 解码中…</div>
    <div v-else-if="errorMsg" class="fv-jxl__mask">{{ errorMsg }}</div>
    <div v-else class="fv-jxl__stage">
      <div class="fv-jxl__canvas-wrap">
        <canvas ref="canvasRef" class="fv-jxl__canvas" data-testid="jxl-canvas" />
      </div>
      <div v-if="meta" class="fv-jxl__meta">
        {{ meta.width }} × {{ meta.height }} · {{ meta.channels }} 通道 · {{ meta.bits }} bit
      </div>
    </div>
  </section>
</template>

<style scoped>
.fv-jxl {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color-page, #f5f7fa);
}
.fv-jxl__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}
.fv-jxl__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  padding: 12px;
  gap: 8px;
  overflow: auto;
}
.fv-jxl__canvas-wrap {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fv-jxl__meta {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.fv-jxl__canvas {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
}
</style>