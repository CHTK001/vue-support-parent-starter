<template>
  <div class="desktop-view" ref="containerRef">
    <!-- Toolbar -->
    <div class="desktop-toolbar">
      <div class="toolbar-left">
        <span class="session-label">{{ sessionId ? `Session: ${sessionId.slice(0, 8)}…` : 'No session' }}</span>
        <span :class="['status-dot', sessionState]" />
        <span class="status-text">{{ statusLabel }}</span>
      </div>
      <div class="toolbar-right">
        <el-select v-model="quality" size="small" style="width: 100px" @change="handleQualityChange">
          <el-option label="High" value="high" />
          <el-option label="Medium" value="medium" />
          <el-option label="Low" value="low" />
        </el-select>
        <el-button size="small" @click="toggleFullscreen" :icon="FullScreen">Fullscreen</el-button>
      </div>
    </div>

    <!-- Canvas -->
    <div class="canvas-wrapper" ref="wrapperRef">
      <canvas
        ref="canvasRef"
        class="desktop-canvas"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
        @mousemove="onMouseMove"
        @wheel="onWheel"
        @contextmenu.prevent
        @keydown="onKeyDown"
        @keyup="onKeyUp"
        tabindex="0"
      />
      <div v-if="sessionState !== 'connected'" class="canvas-overlay">
        <div class="overlay-content">
          <el-icon :size="48"><Monitor /></el-icon>
          <p>{{ overlayMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { FullScreen, Monitor } from "@element-plus/icons-vue";
import { remoteWs } from "@/api/remote";

const props = defineProps<{
  sessionId: string;
  sessionState: "connecting" | "connected" | "disconnected" | "error";
  error?: string;
}>();

const emit = defineEmits<{
  (e: "resize", w: number, h: number): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);
const quality = ref<"high" | "medium" | "low">("medium");

const statusLabel = computed(() => {
  if (props.sessionState === "connected") return "Connected";
  if (props.sessionState === "connecting") return "Connecting…";
  if (props.sessionState === "error") return props.error || "Error";
  return "Disconnected";
});

const overlayMessage = computed(() => {
  if (props.sessionState === "connecting") return "Connecting to remote desktop…";
  if (props.sessionState === "error") return props.error || "Connection failed";
  return "No active session";
});

// ─── Canvas rendering ──────────────────────────────────────

let frameCount = 0;
let lastFpsTime = 0;
const currentFps = ref(0);

// ─── WebCodecs H264 decoder (Chrome 94+) ──────────────────────
let videoDecoder: VideoDecoder | null = null;
let decoderCodec = ""; // "h264" or "jpeg"
let decoderKeyframeNeeded = true; // first frame must be keyframe

/** Initialize WebCodecs VideoDecoder for H264 stream */
function initH264Decoder() {
  if (videoDecoder) return;
  if (typeof VideoDecoder === "undefined") {
    console.warn("[Desktop] WebCodecs VideoDecoder not available, falling back to JPEG");
    return;
  }
  try {
    videoDecoder = new VideoDecoder({
      output: (frame: VideoFrame) => {
        const canvas = canvasRef.value;
        if (!canvas) { frame.close(); return; }
        if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
          canvas.width = frame.displayWidth;
          canvas.height = frame.displayHeight;
          emit("resize", frame.displayWidth, frame.displayHeight);
        }
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(frame, 0, 0);
        frame.close();

        // FPS counter
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
          currentFps.value = frameCount;
          frameCount = 0;
          lastFpsTime = now;
        }
      },
      error: (e: Error) => {
        console.warn("[Desktop] VideoDecoder error:", e.message);
        // Reset decoder on fatal error — next keyframe will re-init
        if (videoDecoder?.state === "closed") {
          videoDecoder = null;
          decoderKeyframeNeeded = true;
        }
      }
    });
    videoDecoder.configure({
      codec: "avc1.42001E", // Baseline profile level 3
      optimizeForLatency: true,
    });
    decoderCodec = "h264";
    decoderKeyframeNeeded = true;
    console.log("[Desktop] WebCodecs H264 decoder initialized");
  } catch (e: any) {
    console.warn("[Desktop] VideoDecoder init failed:", e.message);
    videoDecoder = null;
  }
}

/** Close and reset the VideoDecoder */
function closeH264Decoder() {
  if (videoDecoder) {
    try { videoDecoder.close(); } catch {}
    videoDecoder = null;
  }
  decoderCodec = "";
  decoderKeyframeNeeded = true;
}

/** Render a binary frame — H264 via WebCodecs or JPEG via Image */
function renderBinaryFrame(data: ArrayBuffer) {
  try {
    const view = new DataView(data);
    let offset = 0;

    // Read sessionId
    const sidLen = view.getUint32(offset); offset += 4;
    if (offset + sidLen > data.byteLength) return;
    offset += sidLen; // skip sessionId

    // Read frame header: width(4) + height(4) + keyFrame(1)
    if (offset + 9 > data.byteLength) return;
    const width = view.getUint32(offset); offset += 4;
    const height = view.getUint32(offset); offset += 4;
    const keyFrame = view.getUint8(offset) === 1; offset += 1;

    const payloadLen = data.byteLength - offset;
    if (payloadLen <= 0) return;

    const payload = new Uint8Array(data, offset, payloadLen);

    // Detect codec: H264 starts with 00 00 00 01 or 00 00 01 (Annex B start code)
    // JPEG starts with FF D8 FF
    const isH264 = payloadLen >= 4 && payload[0] === 0x00 && payload[1] === 0x00 &&
      (payload[2] === 0x00 || payload[2] === 0x01) && payload[3] === 0x01;
    const isJPEG = payloadLen >= 3 && payload[0] === 0xFF && payload[1] === 0xD8 && payload[2] === 0xFF;

    if (isH264 && typeof VideoDecoder !== "undefined") {
      // ── H264 via WebCodecs ──
      if (!videoDecoder || videoDecoder.state === "closed") {
        if (keyFrame) {
          closeH264Decoder();
          initH264Decoder();
        } else {
          return; // skip non-keyframe until decoder is ready
        }
      }
      if (videoDecoder?.state === "configured") {
        // Skip P-frames if we haven't seen a keyframe yet
        if (decoderKeyframeNeeded && !keyFrame) return;
        if (keyFrame) decoderKeyframeNeeded = false;

        const chunk = new EncodedVideoChunk({
          type: keyFrame ? "key" : "delta",
          timestamp: performance.now() * 1000, // microseconds
          data: payload,
        });
        try {
          videoDecoder.decode(chunk);
        } catch (e: any) {
          console.warn("[Desktop] decode chunk error:", e.message);
          // Reset on decode error — wait for next keyframe
          closeH264Decoder();
          decoderKeyframeNeeded = true;
        }
      }
    } else {
      // ── JPEG fallback ──
      const canvas = canvasRef.value;
      if (!canvas) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        emit("resize", width, height);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const blob = new Blob([payload], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
          currentFps.value = frameCount;
          frameCount = 0;
          lastFpsTime = now;
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); };
      img.src = url;
    }
  } catch (e) {
    console.warn("[Desktop] renderBinaryFrame error:", e);
  }
}

// ─── Mouse / Keyboard → WS ─────────────────────────────────

function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: Math.round((e.clientX - rect.left) * scaleX),
    y: Math.round((e.clientY - rect.top) * scaleY),
  };
}

function onMouseDown(e: MouseEvent) {
  if (!props.sessionId || props.sessionState !== "connected") return;
  const { x, y } = getCanvasCoords(e);
  remoteWs.sendMouse(props.sessionId, "down", x, y, e.button);
}
function onMouseUp(e: MouseEvent) {
  if (!props.sessionId || props.sessionState !== "connected") return;
  const { x, y } = getCanvasCoords(e);
  remoteWs.sendMouse(props.sessionId, "up", x, y, e.button);
}
function onMouseMove(e: MouseEvent) {
  if (!props.sessionId || props.sessionState !== "connected") return;
  const { x, y } = getCanvasCoords(e);
  remoteWs.sendMouse(props.sessionId, "move", x, y);
}
function onWheel(e: WheelEvent) {
  if (!props.sessionId || props.sessionState !== "connected") return;
  const { x, y } = getCanvasCoords(e);
  remoteWs.sendMouse(props.sessionId, e.deltaY > 0 ? "scroll_down" : "scroll_up", x, y);
}

function onKeyDown(e: KeyboardEvent) {
  if (!props.sessionId || props.sessionState !== "connected") return;
  e.preventDefault();
  const mods: string[] = [];
  if (e.ctrlKey) mods.push("ctrl");
  if (e.altKey) mods.push("alt");
  if (e.shiftKey) mods.push("shift");
  if (e.metaKey) mods.push("meta");
  remoteWs.sendKey(props.sessionId, "down", e.key, e.code, mods.length ? mods : undefined);
}
function onKeyUp(e: KeyboardEvent) {
  if (!props.sessionId || props.sessionState !== "connected") return;
  e.preventDefault();
  remoteWs.sendKey(props.sessionId, "up", e.key, e.code);
}

// ─── Quality / Fullscreen ──────────────────────────────────

function handleQualityChange() {
  if (!props.sessionId || props.sessionState !== "connected") return;
  const dims = getQualityDims();
  const codecs = typeof VideoDecoder !== "undefined" ? ["H264"] : ["JPEG"];
  remoteWs.sendCapabilities(props.sessionId, codecs, dims.w, dims.h, dims.fps);
}

function getQualityDims() {
  const canvas = canvasRef.value;
  const baseW = canvas?.width || 1920;
  const baseH = canvas?.height || 1080;
  if (quality.value === "high") return { w: baseW, h: baseH, fps: 30 };
  if (quality.value === "low") return { w: Math.round(baseW / 2), h: Math.round(baseH / 2), fps: 15 };
  return { w: Math.round(baseW * 0.7), h: Math.round(baseH * 0.7), fps: 24 };
}

function toggleFullscreen() {
  const el = containerRef.value;
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen();
  }
}

// ─── Lifecycle ─────────────────────────────────────────────

let binaryHandler: ((data: ArrayBuffer) => void) | null = null;

onMounted(() => {
  binaryHandler = (data: ArrayBuffer) => renderBinaryFrame(data);
  remoteWs.onBinary(binaryHandler);

  // Send capabilities once connected
  watch(() => props.sessionState, (state) => {
    if (state === "connected" && props.sessionId) {
      const dims = getQualityDims();
      // Use uppercase codec names to match Gateway's BinaryAgentFrameHandler checks
      // WebCodecs will handle H264 natively; fallback to JPEG transcoding on Gateway
      const codecs = typeof VideoDecoder !== "undefined" ? ["H264"] : ["JPEG"];
      remoteWs.sendCapabilities(props.sessionId, codecs, dims.w, dims.h, dims.fps);
    }
  }, { immediate: true });
});

onBeforeUnmount(() => {
  closeH264Decoder();
  // Note: can't easily remove specific handler from remoteWs; that's fine for now
});
</script>

<style scoped>
.desktop-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--nexus-code-bg, #1c1917);
  border-radius: var(--card-radius, 10px);
  overflow: hidden;
}

.desktop-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  min-height: 36px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-label {
  font-family: var(--nexus-data-font, monospace);
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.connected { background: #22c55e; }
.status-dot.connecting { background: #f59e0b; animation: blink 1s infinite; }
.status-dot.disconnected { background: #6b7280; }
.status-dot.error { background: #ef4444; }

@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.status-text {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}

.canvas-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

.desktop-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: crosshair;
  outline: none;
}

.canvas-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.7);
  z-index: 10;
}

.overlay-content {
  text-align: center;
  color: rgba(255,255,255,0.5);
}
.overlay-content p {
  margin-top: 12px;
  font-size: 14px;
}
</style>