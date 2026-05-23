<template>
  <div class="desktop-viewer">
    <!-- 未连接状态 -->
    <div v-if="connectionState === 'disconnected'" class="viewer-placeholder">
      <el-icon :size="48"><Monitor /></el-icon>
      <p>桌面远程未连接</p>
      <span class="hint">请在左侧面板选择"桌面远程"协议并连接</span>
    </div>

    <!-- 桌面画布 + 浮动覆盖层 -->
    <div
      v-show="connectionState !== 'disconnected'"
      ref="viewerContainer"
      class="viewer-container"
      tabindex="0"
      @mousemove="onMouseMove"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @contextmenu.prevent
      @wheel="onWheel"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
    >
      <canvas ref="canvasRef" class="desktop-canvas"></canvas>

      <!-- 左上角: 连接状态 + 分辨率 -->
      <div class="overlay top-left">
        <span class="ov-badge"><span class="dot connected"></span>已连接</span>
        <span v-if="canvasWidth" class="ov-badge">{{ canvasWidth }}×{{ canvasHeight }}</span>
      </div>

      <!-- 右上角: 设置按钮 -->
      <div class="overlay top-right">
        <el-popover trigger="click" :width="260" placement="bottom-end" :show-arrow="false">
          <template #reference>
            <el-button class="settings-btn" circle size="small">
              <el-icon><Setting /></el-icon>
            </el-button>
          </template>
          <div class="settings-panel">
            <!-- 模式（控制 fps） -->
            <div class="sp-row">
              <span class="sp-label">模式</span>
              <el-select v-model="qualityMode" size="small" style="flex:1" @change="onQualityModeChange">
                <el-option label="速度(60fps)" value="SPEED" />
                <el-option label="均衡(60fps)" value="BALANCED" />
                <el-option label="画质(30fps)" value="QUALITY" />
                <el-option label="原画(25fps)" value="ORIGINAL" />
              </el-select>
            </div>
            <el-divider style="margin:8px 0" />

            <!-- 画质（编码清晰度） -->
            <div class="sp-row">
              <span class="sp-label">画质</span>
              <el-slider v-model="quality" :min="10" :max="100" :step="5" size="small"
                style="flex:1;margin:0 8px" :format-tooltip="(v: number) => v + '%'"
                @change="onQualityChange" />
              <span class="sp-val">{{ quality }}%</span>
            </div>
            <el-divider style="margin:8px 0" />

            <!-- 帧率 -->
            <div class="sp-row">
              <span class="sp-label">最大帧率</span>
              <el-select v-model="targetFps" size="small" style="flex:1" @change="onFpsChange">
                <el-option label="10 FPS" :value="10" />
                <el-option label="15 FPS" :value="15" />
                <el-option label="20 FPS" :value="20" />
                <el-option label="24 FPS" :value="24" />
                <el-option label="30 FPS" :value="30" />
              </el-select>
            </div>
            <el-divider style="margin:8px 0" />

            <!-- 位置显示 -->
            <div class="sp-row">
              <span class="sp-label">位置显示</span>
              <el-select v-model="positionCorner" size="small" style="flex:1" clearable placeholder="隐藏">
                <el-option label="左上角" value="top-left" />
                <el-option label="右上角" value="top-right" />
                <el-option label="左下角" value="bottom-left" />
                <el-option label="右下角" value="bottom-right" />
              </el-select>
            </div>
            <el-divider style="margin:8px 0" />

            <!-- 指标显示开关 -->
            <div class="sp-section-label">指标显示</div>
            <div class="sp-check-group">
              <el-checkbox v-model="showFps" size="small" label="FPS" />
              <el-checkbox v-model="showLatency" size="small" label="延迟" />
              <el-checkbox v-model="showMemory" size="small" label="内存" />
            </div>
            <el-divider style="margin:8px 0" />

            <el-button text size="small" style="width:100%" @click="toggleFullscreen">
              <el-icon style="margin-right:4px"><FullScreen /></el-icon>
              全屏
            </el-button>
          </div>
        </el-popover>
      </div>

      <!-- 鼠标位置（可配置角落） -->
      <div v-if="positionCorner" class="overlay" :class="positionCorner">
        <span class="ov-badge">{{ mousePos }}</span>
      </div>

      <!-- 右下角: FPS + 延迟 + 内存 -->
      <div class="overlay bottom-right">
        <span v-if="showFps" class="ov-badge">{{ fps }} FPS</span>
        <span v-if="showLatency" class="ov-badge">{{ latency }}ms</span>
        <span v-if="showMemory && metrics.memUsed" class="ov-badge" :title="'JVM: ' + metrics.memUsed + '/' + metrics.memTotal">
          {{ metrics.memUsed }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { Monitor, FullScreen, Setting } from "@element-plus/icons-vue";

const props = defineProps<{
  sessionId: string | null;
  connectionState: string;
}>();

const emit = defineEmits<{
  mouseEvent: [sessionId: string, event: { x: number; y: number; button?: number; action?: string; wheel?: number }];
  keyEvent: [sessionId: string, event: { keyCode: number; action: string; shift?: boolean; ctrl?: boolean; alt?: boolean }];
  desktopControl: [sessionId: string, action: string, value?: string | number];
}>();

const viewerContainer = ref<HTMLElement>();
const canvasRef = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D | null = null;

const canvasWidth = ref(0);
const canvasHeight = ref(0);
const frameCount = ref(0);
const fps = ref(0);
const qualityMode = ref("BALANCED");
const quality = ref(100);
const targetFps = ref(20);
const mousePos = ref("—");
const latency = ref(0);
const metrics = reactive({ memUsed: "", memTotal: "" });

// 指标显示开关
const showFps = ref(true);
const showLatency = ref(true);
const showMemory = ref(true);
// 位置显示角落，空=隐藏
const positionCorner = ref("bottom-left");

let fpsFrameCount = 0;
let fpsTimer = 0;
let lastFrameTime = 0;
let inputSentTime = 0;

function startFpsCounter() {
  fpsTimer = window.setInterval(() => {
    fps.value = fpsFrameCount;
    fpsFrameCount = 0;
  }, 1000);
}

// 接收桌面指标（来自 Agent 推送的 desktop_metrics 消息）
function updateMetrics(data: { fps?: number; memUsed?: number; memTotal?: number; latencyMs?: number }) {
  if (data.memUsed != null) metrics.memUsed = (data.memUsed / 1024 / 1024).toFixed(0) + "MB";
  if (data.memTotal != null) metrics.memTotal = (data.memTotal / 1024 / 1024).toFixed(0) + "MB";
  if (data.latencyMs != null) latency.value = data.latencyMs;
}

function onQualityModeChange(val: string) {
  if (props.sessionId) emit("desktopControl", props.sessionId, "quality_mode", val);
}

function onQualityChange(val: number) {
  if (props.sessionId) emit("desktopControl", props.sessionId, "quality", val);
}

function onFpsChange(val: number) {
  if (props.sessionId) emit("desktopControl", props.sessionId, "fps", val);
}

// 按键映射: KeyboardEvent.code → JavaScript keyCode (桌面端 Robot 的 keyCode)
const KEY_MAP: Record<string, number> = {
  "Enter": 10, "Backspace": 8, "Tab": 9, "Escape": 27, "Delete": 127,
  "ArrowUp": 38, "ArrowDown": 40, "ArrowLeft": 37, "ArrowRight": 39,
  "Home": 36, "End": 35, "PageUp": 33, "PageDown": 34,
  "Insert": 155, "CapsLock": 20, "NumLock": 144, "ScrollLock": 145,
  "F1": 112, "F2": 113, "F3": 114, "F4": 115, "F5": 116, "F6": 117,
  "F7": 118, "F8": 119, "F9": 120, "F10": 121, "F11": 122, "F12": 123,
  "Space": 32, "ControlLeft": 17, "ControlRight": 17,
  "ShiftLeft": 16, "ShiftRight": 16,
  "AltLeft": 18, "AltRight": 18,
  "MetaLeft": 157, "MetaRight": 157,
};

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d");
  }
  startFpsCounter();
});

// ── H264 Annex B → AVCC 转换 + 提取 SPS/PPS description ──
function annexBToAvcc(data: ArrayBuffer): { avcc: ArrayBuffer; description?: ArrayBuffer } {
  const src = new Uint8Array(data);
  const nalus: Uint8Array[] = [];
  const spsNals: Uint8Array[] = [];
  const ppsNals: Uint8Array[] = [];

  let i = 0;
  while (i < src.length) {
    let start = -1;
    if (i + 3 < src.length && src[i] === 0 && src[i + 1] === 0 && src[i + 2] === 0 && src[i + 3] === 1) {
      start = i + 4; i += 4;
    } else if (i + 2 < src.length && src[i] === 0 && src[i + 1] === 0 && src[i + 2] === 1) {
      start = i + 3; i += 3;
    } else { i++; continue; }

    let end = src.length;
    for (let j = i; j < src.length - 3; j++) {
      if (src[j] === 0 && src[j + 1] === 0 && (src[j + 2] === 1 || (src[j + 2] === 0 && j + 3 < src.length && src[j + 3] === 1))) {
        end = j; break;
      }
    }

    const nalType = src[start] & 0x1F;
    const nalUnit = src.slice(start, end);
    if (nalType === 7) {
      spsNals.push(nalUnit);
    } else if (nalType === 8) {
      ppsNals.push(nalUnit);
    } else {
      nalus.push(nalUnit);
    }
    i = end;
  }

  let total = 0;
  for (const n of nalus) total += 4 + n.length;
  const avcc = new Uint8Array(total);
  let off = 0;
  for (const n of nalus) {
    new DataView(avcc.buffer).setUint32(off, n.length);
    off += 4;
    avcc.set(n, off);
    off += n.length;
  }

  let description: ArrayBuffer | undefined;
  if (spsNals.length > 0 && ppsNals.length > 0) {
    const sps = spsNals[0];
    const pps = ppsNals[0];
    const descLen = 1 + 3 + 1 + 1 + 2 + sps.length + 1 + 2 + pps.length;
    const desc = new Uint8Array(descLen);
    let o = 0;
    desc[o++] = 0x01;          // version
    desc[o++] = sps[1];        // profile_idc
    desc[o++] = sps[2];        // constraint_set flags
    desc[o++] = sps[3];        // level_idc
    desc[o++] = 0xFF;          // 4-byte NAL length prefix
    desc[o++] = 0xE1;          // 1 SPS
    desc[o++] = (sps.length >> 8) & 0xFF;
    desc[o++] = sps.length & 0xFF;
    desc.set(sps, o); o += sps.length;
    desc[o++] = 1;             // 1 PPS
    desc[o++] = (pps.length >> 8) & 0xFF;
    desc[o++] = pps.length & 0xFF;
    desc.set(pps, o);
    description = desc.buffer;
  }

  return { avcc: avcc.buffer, description };
}

// ── 从 Annex B SPS NAL 检测 H264 profile → avc1.XXYYZZ ──
function detectH264ProfileCodec(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length - 5; i++) {
    if (bytes[i] === 0 && bytes[i + 1] === 0) {
      let nalStart = -1;
      if (bytes[i + 2] === 0 && bytes[i + 3] === 1) nalStart = i + 4;
      else if (bytes[i + 2] === 1) nalStart = i + 3;
      if (nalStart >= 0 && (bytes[nalStart] & 0x1F) === 7) {
        const profileIdc = bytes[nalStart + 1];
        const constraint = bytes[nalStart + 2];
        const levelIdc = bytes[nalStart + 3];
        return `avc1.${profileIdc.toString(16).padStart(2, "0")}${constraint.toString(16).padStart(2, "0")}${levelIdc.toString(16).padStart(2, "0")}`;
      }
    }
  }
  return "avc1.42001E";
}

// ── VideoDecoder 管理 ──
let videoDecoder: VideoDecoder | null = null;
let currentCodec: string = "";

function reinitDecoder(width: number, height: number, description?: ArrayBuffer) {
  if (videoDecoder) { try { videoDecoder.close(); } catch {} videoDecoder = null; }
  if (typeof VideoDecoder === "undefined") {
    console.warn("[DesktopViewer] VideoDecoder API not available");
    return;
  }

  const codec = currentCodec || "avc1.42001E";

  videoDecoder = new VideoDecoder({
    output: (frame: VideoFrame) => {
      if (ctx && canvasRef.value) {
        ctx.drawImage(frame, 0, 0);
        frame.close();
      }
    },
    error: (e: DOMException) => {
      console.warn("[DesktopViewer] VideoDecoder error:", e.message);
      videoDecoder = null;
    },
  });

  const config: VideoDecoderConfig = { codec, codedWidth: width, codedHeight: height };
  if (description) {
    (config as any).description = description;
  }
  videoDecoder.configure(config);
}

// ── 公开：接收 H264 帧并解码渲染 ──
function renderH264Frame(data: ArrayBuffer, width: number, height: number, keyFrame: boolean) {
  if (!canvasRef.value) return;

  // 关键帧: 检测 codec + 提取 description
  if (keyFrame) {
    const codec = detectH264ProfileCodec(data);
    if (codec !== currentCodec) {
      console.log("[DesktopViewer] H264 codec detected:", codec);
      currentCodec = codec;
    }

    // 分辨率变化或 decoder 不存在: 重新初始化
    if (width > 0 && height > 0 && (canvasWidth.value !== width || canvasHeight.value !== height || !videoDecoder)) {
      canvasRef.value.width = width;
      canvasRef.value.height = height;
      canvasWidth.value = width;
      canvasHeight.value = height;
      const { description } = annexBToAvcc(data);
      reinitDecoder(width, height, description);
    }

    // decoder 不存在: 先初始化
    if (!videoDecoder) {
      const { description } = annexBToAvcc(data);
      reinitDecoder(width, height, description);
    }
  }

  if (!videoDecoder) return;

  // Annex B → AVCC
  const { avcc } = annexBToAvcc(data);

  try {
    videoDecoder.decode(new EncodedVideoChunk({
      type: keyFrame ? "key" : "delta",
      timestamp: frameCount.value * 33_333,
      data: avcc,
    }));
    frameCount.value++;
    fpsFrameCount++;

    // 延迟估算：从输入发送到收到帧
    if (inputSentTime > 0) {
      const rtt = performance.now() - inputSentTime;
      latency.value = Math.round(rtt);
      inputSentTime = 0;
    } else if (lastFrameTime > 0) {
      // 帧间隔作为延迟参考
      const delta = performance.now() - lastFrameTime;
      if (delta < 500) { // 排除断流情况
        latency.value = Math.round(delta * 0.6); // 估计单向延迟
      }
    }
    lastFrameTime = performance.now();
  } catch (e) {
    console.warn("[DesktopViewer] decode error:", (e as Error).message);
    try { videoDecoder.close(); } catch {}
    videoDecoder = null;
  }
}

defineExpose({ renderH264Frame, updateMetrics, viewerContainer });

// ── 鼠标坐标转换：容器像素 → 桌面实际坐标 ──
function getCanvasCoords(e: MouseEvent): { x: number; y: number } | null {
  if (!canvasRef.value || !canvasWidth.value || !canvasHeight.value) return null;
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasWidth.value / rect.width;
  const scaleY = canvasHeight.value / rect.height;
  const x = Math.round((e.clientX - rect.left) * scaleX);
  const y = Math.round((e.clientY - rect.top) * scaleY);
  if (x < 0 || y < 0 || x > canvasWidth.value || y > canvasHeight.value) return null;
  return { x, y };
}

// 鼠标事件
function onMouseMove(e: MouseEvent) {
  if (!props.sessionId) return;
  const pos = getCanvasCoords(e);
  if (pos) {
    mousePos.value = `${pos.x},${pos.y}`;
    emit("mouseEvent", props.sessionId, { x: pos.x, y: pos.y, button: 0, action: "move" });
  }
}

function onMouseDown(e: MouseEvent) {
  if (!props.sessionId) return;
  const pos = getCanvasCoords(e);
  if (pos) {
    inputSentTime = performance.now();
    emit("mouseEvent", props.sessionId, { x: pos.x, y: pos.y, button: e.button + 1, action: "click" });
  }
}

function onMouseUp(_e: MouseEvent) {
  // 点击已在 onMouseDown 中通过 combined click 事件完成
}

function onWheel(e: WheelEvent) {
  if (!props.sessionId) return;
  const pos = getCanvasCoords(e);
  if (pos) emit("mouseEvent", props.sessionId, {
    x: pos.x, y: pos.y,
    wheel: e.deltaY > 0 ? -1 : 1,
    action: "wheel",
  });
}

// 键盘事件
function onKeyDown(e: KeyboardEvent) {
  if (!props.sessionId) return;
  e.preventDefault();
  const keyCode = KEY_MAP[e.code] || e.key.charCodeAt(0);
  emit("keyEvent", props.sessionId, {
    keyCode,
    action: "down",
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
  });
}

function onKeyUp(e: KeyboardEvent) {
  if (!props.sessionId) return;
  e.preventDefault();
  const keyCode = KEY_MAP[e.code] || e.key.charCodeAt(0);
  emit("keyEvent", props.sessionId, {
    keyCode,
    action: "up",
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
  });
}

function toggleFullscreen() {
  if (viewerContainer.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      viewerContainer.value.requestFullscreen();
    }
  }
}

onUnmounted(() => {
  if (videoDecoder) {
    try { videoDecoder.close(); } catch {}
    videoDecoder = null;
  }
  if (fpsTimer) clearInterval(fpsTimer);
});
</script>

<style scoped>
.desktop-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

.viewer-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  gap: 12px;
}

.viewer-placeholder p {
  font-size: 16px;
  margin: 0;
}

.viewer-placeholder .hint {
  font-size: 13px;
}

.viewer-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  outline: none;
  cursor: default;
}

.desktop-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  image-rendering: auto;
}

/* ── 浮动覆盖层 ── */
.overlay {
  position: absolute;
  display: flex;
  gap: 6px;
  pointer-events: none;
  z-index: 10;
}
.overlay.top-left    { top: 8px; left: 8px; }
.overlay.top-right   { top: 8px; right: 8px; pointer-events: auto; }
.overlay.bottom-left { bottom: 8px; left: 8px; }
.overlay.bottom-right{ bottom: 8px; right: 8px; }

.ov-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 4px;
  font-size: 12px;
  font-family: "SF Mono", "Menlo", "Consolas", monospace;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-info);
}
.dot.connected {
  background: var(--el-color-success);
  box-shadow: 0 0 4px var(--el-color-success);
}

.settings-btn {
  background: rgba(0, 0, 0, 0.55) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(4px);
}
.settings-btn:hover {
  background: rgba(0, 0, 0, 0.7) !important;
  color: #fff !important;
}

/* ── 设置面板 ── */
.settings-panel {
  padding: 4px 0;
}
.sp-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sp-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.sp-val {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 36px;
  text-align: right;
}
.sp-section-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.sp-check-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 0 4px;
}
</style>
