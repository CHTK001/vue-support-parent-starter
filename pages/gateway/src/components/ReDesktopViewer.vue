<!--
  ReDesktopViewer —— 桌面远程 Viewer
  设计风格：低饱和度 · 暗色画布 · 浮动操作按钮 · 简洁角标
-->
<template>
  <div class="desktop-viewer">
    <div
      v-if="connectionState !== 'connected'"
      class="viewer-placeholder flex h-full flex-col items-center justify-center gap-3 px-10 py-10"
      style="color: var(--el-text-color-secondary)"
    >
      <el-icon :size="48" :class="{ 'is-loading': connectionState === 'connecting' }">
        <component :is="connectionState === 'connecting' ? Loading : Monitor" />
      </el-icon>
      <p class="m-0 text-[14px]" style="color: var(--el-text-color-primary)">{{ placeholderText }}</p>
      <span class="text-[12px]" style="color: var(--el-text-color-placeholder)">{{ placeholderHint }}</span>
    </div>

    <div
      v-show="connectionState === 'connected'"
      ref="viewerContainer"
      class="viewer-container"
      tabindex="0"
      @mousemove="onMouseMove"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @wheel="onWheel"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
      @contextmenu.prevent
    >
      <canvas ref="canvasRef" class="desktop-canvas" />

      <div v-if="connectionState === 'connected'" class="remote-cursor" :style="remoteCursorStyle">
        <svg width="20" height="28" viewBox="0 0 20 28">
          <path
            d="M2 2L2 23L6.5 18L11 26L14 24L9.5 16L16 16L2 2Z"
            fill="white"
            stroke="black"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div class="overlay overlay--top-left">
        <span class="ov-badge">
          <span class="dot" style="background: var(--el-color-success)"></span>
          已连接
        </span>
        <span v-if="canvasWidth" class="ov-badge">{{ canvasWidth }} × {{ canvasHeight }}</span>
        <span v-if="fps > 0" class="ov-badge">{{ fps }} FPS</span>
      </div>

      <div class="overlay overlay--top-right">
        <el-popover trigger="click" :width="240" placement="bottom-end" :show-arrow="false">
          <template #reference>
            <el-button class="corner-btn" circle size="small">
              <el-icon><Setting /></el-icon>
            </el-button>
          </template>
          <div class="settings-panel">
            <div class="sp-row">
              <span class="sp-label" style="color: var(--el-text-color-secondary)">画质</span>
              <el-select v-model="qualityMode" size="small" style="flex: 1" @change="onQualityModeChange">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </div>
            <div class="sp-row">
              <span class="sp-label" style="color: var(--el-text-color-secondary)">编码器</span>
              <el-select v-model="codec" size="small" style="flex: 1" @change="onCodecChange">
                <el-option label="自动" value="" />
                <el-option label="H264" value="H264" />
                <el-option label="H265" value="H265" />
                <el-option label="JPEG" value="JPEG" />
              </el-select>
            </div>
            <div class="sp-row">
              <span class="sp-label" style="color: var(--el-text-color-secondary)">键盘</span>
              <el-button size="small" :disabled="!focused" @click="focusCanvas">
                <el-icon><Aim /></el-icon>
                捕获焦点
              </el-button>
            </div>
          </div>
        </el-popover>
        <el-button class="corner-btn corner-btn--danger" circle size="small" title="断开" @click="onDisconnect">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Monitor, Loading, Setting, SwitchButton, Aim } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import type { ConnectionState, RemoteControlInstance, DesktopFrameEvent } from "../composables/useRemoteControl";

const props = defineProps<{
  remote: RemoteControlInstance;
  sessionId?: string;
}>();

const emit = defineEmits<{
  (e: "disconnect"): void;
}>();

const connectionState = computed<ConnectionState>(() => props.remote.connectionState.value);
const activeSessionId = computed(() => props.remote.activeSessionId.value);

const viewerContainer = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const fps = ref(0);
const focused = ref(false);
const qualityMode = ref<"low" | "medium" | "high">("medium");
const codec = ref<"H264" | "H265" | "JPEG" | "">("");
const remoteMouse = ref({ x: 0, y: 0 });

const placeholderText = computed(() => {
  if (connectionState.value === "connecting") return "正在连接桌面...";
  return "桌面远程未连接";
});
const placeholderHint = computed(() => {
  if (connectionState.value === "connecting") return "请稍候，正在建立远程桌面会话";
  return "请在左侧选择『桌面远程』协议并连接";
});

const remoteCursorStyle = computed(() => ({
  left: `${remoteMouse.value.x}px`,
  top: `${remoteMouse.value.y}px`,
}));

/* ==================== H264 解码器 ==================== */

let videoDecoder: VideoDecoder | null = null;
let decoderConfigured = false;
let pendingDescription: ArrayBuffer | null = null;
let canvasCtx: CanvasRenderingContext2D | null = null;

function ensureDecoder() {
  if (videoDecoder) return;
  if (!("VideoDecoder" in window)) {
    console.warn("[DesktopViewer] 浏览器不支持 WebCodecs VideoDecoder");
    return;
  }
  videoDecoder = new VideoDecoder({
    output(frame: VideoFrame) {
      if (!canvasCtx || !canvasRef.value) {
        frame.close();
        return;
      }
      canvasRef.value.width = frame.displayWidth;
      canvasRef.value.height = frame.displayHeight;
      canvasCtx.drawImage(frame, 0, 0);
      frame.close();
      frameCount++;
    },
    error(err) {
      console.warn("[DesktopViewer] VideoDecoder 错误:", err.message);
    },
  });
}

function configureDecoder(width: number, height: number, description: ArrayBuffer | null) {
  if (!videoDecoder) return;
  try {
    const config: VideoDecoderConfig = {
      codec: "avc1.42001E",
      codedWidth: width,
      codedHeight: height,
      description: description ? new Uint8Array(description) : undefined,
    };
    videoDecoder.configure(config);
    decoderConfigured = true;
    console.log("[DesktopViewer] VideoDecoder 已配置:", width, "x", height);
  } catch (e) {
    console.warn("[DesktopViewer] VideoDecoder 配置失败:", e);
  }
}

function decodeFrame(data: ArrayBuffer, keyFrame: boolean) {
  if (!videoDecoder || !decoderConfigured) return;
  try {
    const chunk = new EncodedVideoChunk({
      type: keyFrame ? "key" : "delta",
      data: new Uint8Array(data),
      timestamp: 0,
    });
    videoDecoder.decode(chunk);
  } catch (e) {
    console.warn("[DesktopViewer] 解码失败:", e);
  }
}

/* 从 Annex B 格式提取 SPS/PPS 生成 AVCC description */
function extractAvccDescription(data: ArrayBuffer): ArrayBuffer | null {
  const u8 = new Uint8Array(data);
  const nalUnits: Uint8Array[] = [];
  let i = 0;
  while (i < u8.length - 3) {
    if (u8[i] === 0 && u8[i + 1] === 0 && u8[i + 2] === 0 && u8[i + 3] === 1) {
      let end = i + 4;
      while (end < u8.length - 3) {
        if (u8[end] === 0 && u8[end + 1] === 0 && u8[end + 2] === 0 && u8[end + 3] === 1) break;
        if (u8[end] === 0 && u8[end + 1] === 0 && u8[end + 2] === 1) break;
        end++;
      }
      nalUnits.push(u8.slice(i + 4, end));
      i = end;
    } else {
      i++;
    }
  }
  const sps = nalUnits.find((n) => (n[0] & 0x1F) === 7);
  const pps = nalUnits.find((n) => (n[0] & 0x1F) === 8);
  if (!sps || !pps) return null;

  const avcc = new Uint8Array(7 + sps.length + 2 + pps.length);
  avcc[0] = 1;
  avcc[1] = sps[1];
  avcc[2] = sps[2];
  avcc[3] = sps[3];
  avcc[4] = 0xfc | 3;
  avcc[5] = 0xe0 | 1;
  avcc[6] = (sps.length >> 8) & 0xff;
  avcc[7] = sps.length & 0xff;
  avcc.set(sps, 8);
  avcc[8 + sps.length] = 1;
  avcc[9 + sps.length] = (pps.length >> 8) & 0xff;
  avcc[10 + sps.length] = pps.length & 0xff;
  avcc.set(pps, 11 + sps.length);
  return avcc.buffer;
}

/* 帧渲染入口 */
function renderFrame(width: number, height: number, data: ArrayBuffer, keyFrame: boolean) {
  if (!canvasRef.value) return;
  canvasWidth.value = width;
  canvasHeight.value = height;
  if (!canvasCtx) {
    canvasCtx = canvasRef.value.getContext("2d");
  }

  ensureDecoder();
  if (!videoDecoder) return;

  if (keyFrame && !decoderConfigured) {
    const desc = extractAvccDescription(data);
    configureDecoder(width, height, desc);
    if (!decoderConfigured) return;
  }
  if (!decoderConfigured) return;

  decodeFrame(data, keyFrame);
}

/* ==================== FPS 计数器 ==================== */

let fpsTimer: ReturnType<typeof setInterval> | null = null;
let frameCount = 0;

function startFpsCounter() {
  if (fpsTimer) return;
  fpsTimer = setInterval(() => {
    fps.value = frameCount;
    frameCount = 0;
  }, 1000);
}

function stopFpsCounter() {
  if (fpsTimer) {
    clearInterval(fpsTimer);
    fpsTimer = null;
  }
  fps.value = 0;
}

function focusCanvas() {
  viewerContainer.value?.focus();
  focused.value = true;
}

/* ==================== 鼠标事件 ==================== */

function onMouseMove(ev: MouseEvent) {
  if (!viewerContainer.value || !activeSessionId.value) return;
  const rect = viewerContainer.value.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * (canvasWidth.value || rect.width);
  const y = ((ev.clientY - rect.top) / rect.height) * (canvasHeight.value || rect.height);
  props.remote.sendMouseEvent(activeSessionId.value, { x, y, action: "move" });
}

function onMouseDown(ev: MouseEvent) {
  if (!activeSessionId.value) return;
  const rect = viewerContainer.value!.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * (canvasWidth.value || rect.width);
  const y = ((ev.clientY - rect.top) / rect.height) * (canvasHeight.value || rect.height);
  const action = ev.button === 2 ? "right-down" : ev.button === 1 ? "middle-down" : "left-down";
  props.remote.sendMouseEvent(activeSessionId.value, { x, y, button: ev.button, action });
}

function onMouseUp(ev: MouseEvent) {
  if (!activeSessionId.value) return;
  const rect = viewerContainer.value!.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * (canvasWidth.value || rect.width);
  const y = ((ev.clientY - rect.top) / rect.height) * (canvasHeight.value || rect.height);
  const action = ev.button === 2 ? "right-up" : ev.button === 1 ? "middle-up" : "left-up";
  props.remote.sendMouseEvent(activeSessionId.value, { x, y, button: ev.button, action });
}

function onWheel(ev: WheelEvent) {
  if (!activeSessionId.value) return;
  props.remote.sendMouseEvent(activeSessionId.value, { x: 0, y: 0, wheel: ev.deltaY, action: "wheel" });
}

/* ==================== 键盘事件 ==================== */

function onKeyDown(ev: KeyboardEvent) {
  if (!activeSessionId.value) return;
  props.remote.sendKeyEvent(activeSessionId.value, {
    keyCode: ev.keyCode,
    action: "down",
    shift: ev.shiftKey,
    ctrl: ev.ctrlKey,
    alt: ev.altKey,
  });
}

function onKeyUp(ev: KeyboardEvent) {
  if (!activeSessionId.value) return;
  props.remote.sendKeyEvent(activeSessionId.value, {
    keyCode: ev.keyCode,
    action: "up",
    shift: ev.shiftKey,
    ctrl: ev.ctrlKey,
    alt: ev.altKey,
  });
}

function onQualityModeChange(mode: "low" | "medium" | "high") {
  if (!activeSessionId.value) return;
  const fps = mode === "low" ? 15 : mode === "medium" ? 30 : 60;
  const bitrate = mode === "low" ? "500k" : mode === "medium" ? "2m" : "5m";
  props.remote.sendDesktopControl(activeSessionId.value, "set_quality", `${fps}:${bitrate}`);
}

function onCodecChange(c: typeof codec.value) {
  if (!activeSessionId.value) return;
  props.remote.sendDesktopControl(activeSessionId.value, "set_codec", c || "auto");
}

function onDisconnect() {
  if (activeSessionId.value) {
    props.remote.disconnectSession(activeSessionId.value);
    message.info("已断开桌面会话");
    emit("disconnect");
  }
}

onMounted(() => {
  startFpsCounter();
  focusCanvas();
  props.remote.onDesktopFrame = (event: DesktopFrameEvent) => {
    renderFrame(event.width, event.height, event.data, event.keyFrame);
  };
});

onUnmounted(() => {
  stopFpsCounter();
  if (videoDecoder) {
    videoDecoder.close();
    videoDecoder = null;
  }
  decoderConfigured = false;
  props.remote.onDesktopFrame = undefined;
});

defineExpose({ renderFrame, focusCanvas });
</script>

<style scoped>
.desktop-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  outline: none;
}

.viewer-container:focus-visible {
  outline: 2px solid var(--el-color-primary-light-3);
  outline-offset: -2px;
}

.desktop-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: #000;
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
  transition: left 0.05s linear, top 0.05s linear;
  z-index: 5;
}

.overlay {
  position: absolute;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.overlay--top-left {
  top: 12px;
  left: 12px;
}

.overlay--top-right {
  top: 12px;
  right: 12px;
}

.ov-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.ov-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.corner-btn {
  background: rgba(0, 0, 0, 0.6);
  border-color: transparent;
  color: #fff;
}

.corner-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
}

.corner-btn--danger:hover {
  background: var(--el-color-danger);
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-panel .sp-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-panel .sp-label {
  width: 60px;
  font-size: 12px;
}
</style>
