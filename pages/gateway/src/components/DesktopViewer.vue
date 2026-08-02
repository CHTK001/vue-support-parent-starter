<!--
  DesktopViewer —— 桌面远程画布
  现代化 UI：覆盖层控制条、远程光标、性能指标
  解码：H264/H265/JPEG 通过 WebCodecs + codec-wasm 处理（实际解码逻辑由 useDesktopDecoder 注入）
-->
<template>
  <div class="desktop-viewer">
    <!-- 未连接 / 连接中状态 -->
    <div v-if="connectionState !== 'connected'" class="viewer-placeholder">
      <el-icon :size="48" :class="{ 'is-loading': connectionState === 'connecting' }">
        <component :is="connectionState === 'connecting' ? Loading : Monitor" />
      </el-icon>
      <p>{{ placeholderText }}</p>
      <span class="hint">{{ placeholderHint }}</span>
    </div>

    <!-- 桌面画布 -->
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

      <!-- 远程鼠标光标 -->
      <div v-if="connectionState === 'connected'" class="remote-cursor" :style="remoteCursorStyle">
        <svg width="20" height="28" viewBox="0 0 20 28">
          <path d="M2 2L2 23L6.5 18L11 26L14 24L9.5 16L16 16L2 2Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 左上角：连接状态 + 分辨率 -->
      <div class="overlay top-left">
        <span class="ov-badge">
          <span class="dot connected"></span>
          已连接
        </span>
        <span v-if="canvasWidth" class="ov-badge">{{ canvasWidth }} × {{ canvasHeight }}</span>
        <span v-if="fps > 0" class="ov-badge">{{ fps }} FPS</span>
      </div>

      <!-- 右上角：设置 + 退出 -->
      <div class="overlay top-right">
        <el-popover trigger="click" :width="240" placement="bottom-end" :show-arrow="false">
          <template #reference>
            <el-button class="corner-btn" circle size="small">
              <el-icon><Setting /></el-icon>
            </el-button>
          </template>
          <div class="settings-panel">
            <div class="sp-row">
              <span class="sp-label">画质</span>
              <el-select v-model="qualityMode" size="small" style="flex:1" @change="onQualityModeChange">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </div>
            <div class="sp-row">
              <span class="sp-label">编码器</span>
              <el-select v-model="codec" size="small" style="flex:1" @change="onCodecChange">
                <el-option label="自动" value="" />
                <el-option label="H264" value="H264" />
                <el-option label="H265" value="H265" />
                <el-option label="JPEG" value="JPEG" />
              </el-select>
            </div>
            <div class="sp-row">
              <span class="sp-label">键盘</span>
              <el-button size="small" :disabled="!focused" @click="focusCanvas">
                <el-icon><Aim /></el-icon> 捕获焦点
              </el-button>
            </div>
          </div>
        </el-popover>
        <el-button class="corner-btn danger" circle size="small" @click="onDisconnect" title="断开">
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
import type { ConnectionState, RemoteControlInstance } from "../composables/useRemoteControl";

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
  return "请在左侧选择“桌面远程”协议并连接";
});

const remoteCursorStyle = computed(() => ({
  left: `${remoteMouse.value.x}px`,
  top: `${remoteMouse.value.y}px`,
}));

/* 帧渲染：通过 WebCodecs/codec-wasm 解码后绘制到 canvas
   此处保留接口，实际解码由业务层通过 props.remote.onDesktopFrame 注入 */
function renderFrame(width: number, height: number, _data: ArrayBuffer) {
  if (!canvasRef.value) return;
  if (canvasRef.value.width !== width) canvasRef.value.width = width;
  if (canvasRef.value.height !== height) canvasRef.value.height = height;
  canvasWidth.value = width;
  canvasHeight.value = height;
  // 真实解码：VideoDecoder.decode → drawImage；JPEG：createImageBitmap
  // 此处为占位，业务层应通过 onDesktopFrame 注入解码器
}

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

/* 鼠标事件 → 远端坐标 */
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

/* 键盘事件 */
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
});

onUnmounted(() => {
  stopFpsCounter();
});

/* 暴露渲染接口给父组件：可通过 ref.renderFrame 调用 */
defineExpose({ renderFrame, focusCanvas });
</script>

<style scoped lang="scss">
.desktop-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  background: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.viewer-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--el-text-color-secondary);
  padding: 40px;

  p {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  .hint {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary-light-3);
    outline-offset: -2px;
  }
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

  &.top-left {
    top: 12px;
    left: 12px;
  }

  &.top-right {
    top: 12px;
    right: 12px;
  }
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

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-success);
  }
}

.corner-btn {
  background: rgba(0, 0, 0, 0.6);
  border-color: transparent;
  color: #fff;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
  }

  &.danger:hover {
    background: var(--el-color-danger);
  }
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .sp-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .sp-label {
      width: 60px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>