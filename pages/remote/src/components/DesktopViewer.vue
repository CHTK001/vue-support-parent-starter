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
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
      @contextmenu.prevent
      @wheel="onWheel"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
    >
      <canvas ref="canvasRef" class="desktop-canvas"></canvas>

      <!-- 远程鼠标光标（自定义） -->
      <div v-if="connectionState === 'connected'" class="remote-cursor" :style="remoteCursorStyle">
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <path d="M2 2L2 23L6.5 18L11 26L14 24L9.5 16L16 16L2 2Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- 左上角: 连接状态 + 分辨率 -->
      <div class="overlay top-left">
        <span class="ov-badge"><span class="dot connected"></span>已连接</span>
        <span v-if="canvasWidth" class="ov-badge">{{ canvasWidth }}×{{ canvasHeight }}</span>
      </div>

      <!-- 右上角: 设置 + 退出按钮 -->
      <div class="overlay top-right">
        <el-popover trigger="click" :width="260" placement="bottom-end" :show-arrow="false">
          <template #reference>
            <el-button class="corner-btn" circle size="small">
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

            <!-- 画质 -->
            <div class="sp-row">
              <span class="sp-label">画质</span>
              <el-select v-model="qualityLevel" size="small" style="flex:1" @change="onQualityLevelChange">
                <el-option label="100%（原始）" :value="100" />
                <el-option label="80%（高）" :value="80" />
                <el-option label="60%（中）" :value="60" />
                <el-option label="40%（低）" :value="40" />
                <el-option label="20%（最低）" :value="20" />
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

            <!-- 指标勾选 -->
            <div class="sp-check-group">
              <el-checkbox v-model="showFps" size="small" label="FPS" border />
              <el-checkbox v-model="showLatency" size="small" label="延迟" border />
              <el-checkbox v-model="showMemory" size="small" label="内存" border />
              <el-checkbox v-model="showTransport" size="small" label="协议" border />
            </div>
            <el-divider style="margin:8px 0" />

            <el-checkbox v-model="showMetricsChart" size="small" label="实时图表" border />
            <el-divider style="margin:8px 0" />

            <el-button text size="small" style="width:100%" @click="toggleFullscreen">
              <el-icon style="margin-right:4px"><FullScreen /></el-icon>
              全屏
            </el-button>
          </div>
        </el-popover>
        <el-button class="corner-btn corner-btn-danger" circle size="small" title="断开连接" @click="emitDisconnect">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>

      <!-- 指标区域（位置可配置角落） -->
      <div v-if="positionCorner" class="overlay" :class="positionCorner">
        <span class="ov-badge">{{ mousePos }}</span>
        <span v-if="showFps" class="ov-badge">{{ fps }} FPS</span>
        <span v-if="showLatency" class="ov-badge">{{ latency }}ms</span>
        <span v-if="showMemory && metrics.memUsed" class="ov-badge" :title="'JVM: ' + metrics.memUsed + '/' + metrics.memTotal">
          {{ metrics.memUsed }}
        </span>
        <span v-if="showTransport && transportLabel" class="ov-badge">{{ transportLabel }}</span>
      </div>

      <!-- 指标图表面板（可折叠） -->
      <div v-if="showMetricsChart" class="metrics-chart-panel">
        <div class="mcp-header">
          <span class="mcp-title">实时指标</span>
          <button class="mcp-close" @click="showMetricsChart = false">×</button>
        </div>
        <div class="mcp-chart-row">
          <span class="mcp-label">FPS</span>
          <svg class="mcp-sparkline" :viewBox="'0 0 60 20'" preserveAspectRatio="none">
            <polyline :points="fpsHistoryPoints" fill="none" stroke="#9ece6a" stroke-width="1.5" />
          </svg>
          <span class="mcp-val" style="color:#9ece6a">{{ fps }}</span>
        </div>
        <div class="mcp-chart-row">
          <span class="mcp-label">延迟</span>
          <svg class="mcp-sparkline" :viewBox="'0 0 60 20'" preserveAspectRatio="none">
            <polyline :points="latencyHistoryPoints" fill="none" stroke="#e0af68" stroke-width="1.5" />
          </svg>
          <span class="mcp-val" style="color:#e0af68">{{ latency }}ms</span>
        </div>
        <div class="mcp-chart-row">
          <span class="mcp-label">帧数</span>
          <span class="mcp-val" style="color:#7aa2f7">{{ frameCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { Monitor, FullScreen, Setting, SwitchButton } from "@element-plus/icons-vue";

const props = defineProps<{
  sessionId: string | null;
  connectionState: string;
  transport?: string;
}>();

const emit = defineEmits<{
  mouseEvent: [sessionId: string, event: { x: number; y: number; button?: number; action?: string; wheel?: number }];
  keyEvent: [sessionId: string, event: { keyCode: number; action: string; shift?: boolean; ctrl?: boolean; alt?: boolean }];
  desktopControl: [sessionId: string, action: string, value?: string | number];
  disconnectRequest: [sessionId: string];
}>();

const viewerContainer = ref<HTMLElement>();
const canvasRef = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D | null = null;

const canvasWidth = ref(0);
const canvasHeight = ref(0);
const frameCount = ref(0);
const fps = ref(0);
const qualityMode = ref("BALANCED");
const qualityLevel = ref(80);
const targetFps = ref(240);
const mousePos = ref("—");
const latency = ref(0);
// 光标在 canvas 显示坐标系中的位置
const cursorDisplayX = ref(0);
const cursorDisplayY = ref(0);
const showRemoteCursor = ref(false);
const metrics = reactive({ memUsed: "", memTotal: "" });

// 光标样式（相对于 canvas 在 container 中的位置）
const remoteCursorStyle = computed(() => {
  const canvas = canvasRef.value;
  if (!canvas || !showRemoteCursor.value) return { display: 'none' };
  const rect = canvas.getBoundingClientRect();
  const containerRect = viewerContainer.value?.getBoundingClientRect();
  if (!containerRect) return { display: 'none' };
  return {
    left: (rect.left - containerRect.left + cursorDisplayX.value) + 'px',
    top: (rect.top - containerRect.top + cursorDisplayY.value) + 'px',
    display: 'block',
  };
});

// 指标显示开关
const showFps = ref(true);
const showLatency = ref(true);
const showMemory = ref(true);
const showTransport = ref(true);
const transportLabel = computed(() => props.transport || "TCP");
// 位置显示角落，空=隐藏
const positionCorner = ref("bottom-left");

// 指标图表面板
const showMetricsChart = ref(false);
const fpsHistory = ref<number[]>([]);
const latencyHistory = ref<number[]>([]);

const fpsHistoryPoints = computed(() => {
  const data = fpsHistory.value;
  if (data.length < 2) return "0,10 60,10";
  const max = Math.max(...data, 1);
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * 60;
    const y = 20 - (v / max) * 18;
    return `${x},${y}`;
  }).join(" ");
});

const latencyHistoryPoints = computed(() => {
  const data = latencyHistory.value;
  if (data.length < 2) return "0,10 60,10";
  const max = Math.max(...data, 1);
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * 60;
    const y = 20 - (v / max) * 18;
    return `${x},${y}`;
  }).join(" ");
});

let fpsFrameCount = 0;
let fpsTimer = 0;
let lastFrameTime = 0;
let inputSentTime = 0;

function startFpsCounter() {
  fpsTimer = window.setInterval(() => {
    fps.value = fpsFrameCount;
    fpsFrameCount = 0;
    // Record history (keep last 60 samples)
    fpsHistory.value.push(fps.value);
    if (fpsHistory.value.length > 60) fpsHistory.value.shift();
    latencyHistory.value.push(latency.value);
    if (latencyHistory.value.length > 60) latencyHistory.value.shift();
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

function onQualityLevelChange(val: number) {
  qualityLevel.value = val;
  if (props.sessionId) emit("desktopControl", props.sessionId, "quality", val);
}

function emitDisconnect() {
  if (props.sessionId) emit("disconnectRequest", props.sessionId);
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
  // 监听容器尺寸，动态计算 canvas 显示大小以保持宽高比
  if (viewerContainer.value) {
    const ro = new ResizeObserver(() => resizeDisplayCanvas());
    ro.observe(viewerContainer.value);
    (viewerContainer.value as any).__resizeObserver = ro;
  }
});

// 按容器尺寸 + 视频分辨率计算 canvas DOM 显示尺寸，保持宽高比
function resizeDisplayCanvas() {
  const canvas = canvasRef.value;
  const container = viewerContainer.value;
  if (!canvas || !container) return;
  const cw = canvasWidth.value || 1920;
  const ch = canvasHeight.value || 1080;
  if (cw <= 0 || ch <= 0) return;
  const containerW = container.clientWidth;
  const containerH = container.clientHeight;
  const ratio = cw / ch;
  let displayW: number, displayH: number;
  if (containerW / containerH > ratio) {
    displayH = containerH;
    displayW = displayH * ratio;
  } else {
    displayW = containerW;
    displayH = displayW / ratio;
  }
  canvas.style.width = displayW + "px";
  canvas.style.height = displayH + "px";
}

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

// ── HEVC/HEVC Annex B → AVCC ──
function findNextStartCode(src: Uint8Array, pos: number): number {
  for (let i = pos; i < src.length - 2; i++) {
    if (src[i] === 0 && src[i + 1] === 0) {
      if (src[i + 2] === 1) return i;
      if (src[i + 2] === 0 && i + 3 < src.length && src[i + 3] === 1) return i;
    }
  }
  return -1;
}

function extractNalus(data: ArrayBuffer): Uint8Array[] {
  const src = new Uint8Array(data);
  const nalus: Uint8Array[] = [];
  let pos = 0;
  while (pos < src.length) {
    const start = findNextStartCode(src, pos);
    if (start < 0) break;
    let nalStart = start + 3;
    if (src[start + 2] === 0) nalStart = start + 4;
    pos = nalStart;
    const nextStart = findNextStartCode(src, pos);
    const end = nextStart < 0 ? src.length : nextStart;
    if (end > nalStart) nalus.push(src.slice(nalStart, end));
    pos = end;
  }
  return nalus;
}

function hevcToAvcc(data: ArrayBuffer): { avcc: ArrayBuffer; description?: ArrayBuffer } {
  const nalus = extractNalus(data);
  const vpsList: Uint8Array[] = [];
  const spsList: Uint8Array[] = [];
  const ppsList: Uint8Array[] = [];
  const others: Uint8Array[] = [];

  for (const n of nalus) {
    const nalType = (n[0] >> 1) & 0x3F;
    if (nalType === 32) vpsList.push(n);
    else if (nalType === 33) spsList.push(n);
    else if (nalType === 34) ppsList.push(n);
    else others.push(n);
  }

  let total = 0;
  for (const n of others) total += 4 + n.length;
  const avcc = new Uint8Array(total);
  let off = 0;
  for (const n of others) {
    new DataView(avcc.buffer).setUint32(off, n.length);
    off += 4;
    avcc.set(n, off);
    off += n.length;
  }

  // Build HEVC description (ISO 14496-15 format)
  let description: ArrayBuffer | undefined;
  if (vpsList.length > 0 && spsList.length > 0 && ppsList.length > 0) {
    const arrays: { type: number; units: Uint8Array[] }[] = [
      { type: 32, units: vpsList },
      { type: 33, units: spsList },
      { type: 34, units: ppsList },
    ];
    let descLen = 1;
    for (const arr of arrays) {
      descLen += 1 + 2;
      for (const unit of arr.units) descLen += 2 + unit.length;
    }
    const desc = new Uint8Array(descLen);
    let o = 0;
    desc[o++] = arrays.length;
    for (const arr of arrays) {
      desc[o++] = 0x80 | arr.type;
      desc[o++] = (arr.units.length >> 8) & 0xFF;
      desc[o++] = arr.units.length & 0xFF;
      for (const unit of arr.units) {
        desc[o++] = (unit.length >> 8) & 0xFF;
        desc[o++] = unit.length & 0xFF;
        desc.set(unit, o);
        o += unit.length;
      }
    }
    description = desc.buffer;
  }

  return { avcc: avcc.buffer, description };
}

function detectCodecFromNal(data: ArrayBuffer): "H264" | "H265" {
  const nalus = extractNalus(data);
  for (const n of nalus) {
    const h265Type = (n[0] >> 1) & 0x3F;
    if (h265Type === 32) return "H265";
    const h264Type = n[0] & 0x1F;
    if (h264Type === 7) return "H264";
  }
  return "H264";
}

function detectH265Codec(data: ArrayBuffer): string {
  const nalus = extractNalus(data);
  for (const n of nalus) {
    const nalType = (n[0] >> 1) & 0x3F;
    if (nalType !== 33) continue;
    const sps = n;
    if (sps.length < 15) break;
    const generalProfileSpace = (sps[1] >> 6) & 3;
    const generalTierFlag = (sps[1] >> 5) & 1;
    const generalProfileIdc = sps[1] & 0x1F;
    const generalLevelIdc = sps[11];
    const const1 = ((sps[2] >> 5) & 1) << 5;
    const const2 = ((sps[2] >> 4) & 1) << 4;
    const const3 = ((sps[2] >> 3) & 1) << 3;
    const const4 = ((sps[2] >> 2) & 1) << 2;
    const const5 = ((sps[2] >> 1) & 1) << 1;
    const const6 = sps[2] & 1;
    const constraintFlags = const1 | const2 | const3 | const4 | const5 | const6;
    const profileSpace = generalProfileSpace;
    const tier = generalTierFlag ? 'H' : 'L';
    return `hvc1.${profileSpace}.${generalProfileIdc}.${tier}${generalLevelIdc}.${constraintFlags}`;
  }
  return "hvc1.1.6.L93.0";
}

// ── VideoDecoder 管理 ──
let videoDecoder: VideoDecoder | null = null;
let currentCodec: string = "";
let decoderErrorCount = 0;
const MAX_DECODER_REINITS = 50;
let decoderErrorResetTimer: ReturnType<typeof setTimeout> | null = null;

function reinitDecoder(width: number, height: number, description?: ArrayBuffer) {
  if (videoDecoder) { try { videoDecoder.close(); } catch {} videoDecoder = null; }
  if (typeof VideoDecoder === "undefined") {
    console.warn("[DesktopViewer] VideoDecoder API not available");
    return;
  }

  const codec = currentCodec || "avc1.42001E";

  try {
    videoDecoder = new VideoDecoder({
      output: (frame: VideoFrame) => {
        if (ctx && canvasRef.value) {
          const fw = frame.displayWidth;
          const fh = frame.displayHeight;
          if (fw > 0 && fh > 0 && (fw !== canvasWidth.value || fh !== canvasHeight.value)) {
            canvasRef.value.width = fw;
            canvasRef.value.height = fh;
            canvasWidth.value = fw;
            canvasHeight.value = fh;
            resizeDisplayCanvas();
          }
          ctx.drawImage(frame, 0, 0);
          frame.close();
        }
      },
      error: (e: DOMException) => {
        console.warn("[DesktopViewer] VideoDecoder error:", e.message, "count:", decoderErrorCount);
        try { videoDecoder?.close(); } catch {}
        videoDecoder = null;
        decoderErrorCount++;
        // 30秒无新错误则重置计数器，避免累积导致永久停止
        if (decoderErrorResetTimer) clearTimeout(decoderErrorResetTimer);
        decoderErrorResetTimer = setTimeout(() => {
          if (decoderErrorCount > 0) {
            console.log("[DesktopViewer] decoder error count reset after stability period");
            decoderErrorCount = 0;
          }
        }, 30000);
      },
    });

    const config: VideoDecoderConfig = { codec, codedWidth: width, codedHeight: height };
    if (description) {
      (config as any).description = description;
    }
    videoDecoder.configure(config);
    decoderErrorCount = 0;
    console.log("[DesktopViewer] VideoDecoder initialized:", codec, `${width}x${height}`);
  } catch (e) {
    console.warn("[DesktopViewer] reinitDecoder failed:", (e as Error).message);
    videoDecoder = null;
    decoderErrorCount++;
  }
}

// ── 公开：接收 H264/H265 帧并解码渲染 ──
let currentVideoCodec: "H264" | "H265" = "H264";

function renderVideoFrame(data: ArrayBuffer, width: number, height: number, keyFrame: boolean, codecHint?: "H264" | "H265") {
  if (!canvasRef.value) return;

  if (keyFrame) {
    const detectedCodec = codecHint || detectCodecFromNal(data);
    if (detectedCodec !== currentVideoCodec) {
      console.log("[DesktopViewer] codec detected:", detectedCodec);
      currentVideoCodec = detectedCodec;
    }

    let codecStr: string;
    let description: ArrayBuffer | undefined;

    if (currentVideoCodec === "H265") {
      codecStr = detectH265Codec(data);
      const result = hevcToAvcc(data);
      description = result.description;
    } else {
      codecStr = detectH264ProfileCodec(data);
      const result = annexBToAvcc(data);
      description = result.description;
    }

    if (codecStr !== currentCodec) {
      console.log("[DesktopViewer] codec string:", codecStr);
      currentCodec = codecStr;
    }

    const needReinit = !videoDecoder
      || decoderErrorCount > 0
      || (width > 0 && height > 0 && (canvasWidth.value !== width || canvasHeight.value !== height));

    if (needReinit && decoderErrorCount < MAX_DECODER_REINITS) {
      if (width > 0 && height > 0) {
        canvasRef.value.width = width;
        canvasRef.value.height = height;
        canvasWidth.value = width;
        canvasHeight.value = height;
        resizeDisplayCanvas();
      }
      const w = width || canvasWidth.value || 1920;
      const h = height || canvasHeight.value || 1080;
      reinitDecoder(w, h, description);
    }
  }

  if (!videoDecoder) return;
  if (videoDecoder.state !== "configured") return;

  const { avcc } = currentVideoCodec === "H265" ? hevcToAvcc(data) : annexBToAvcc(data);

  try {
    videoDecoder.decode(new EncodedVideoChunk({
      type: keyFrame ? "key" : "delta",
      timestamp: frameCount.value * 33_333,
      data: avcc,
    }));
    frameCount.value++;
    fpsFrameCount++;

    if (inputSentTime > 0) {
      const rtt = performance.now() - inputSentTime;
      latency.value = Math.round(rtt);
      inputSentTime = 0;
    } else if (lastFrameTime > 0) {
      const delta = performance.now() - lastFrameTime;
      if (delta < 500) {
        latency.value = Math.round(delta * 0.6);
      }
    }
    lastFrameTime = performance.now();
  } catch (e) {
    console.warn("[DesktopViewer] decode error:", (e as Error).message);
    try { videoDecoder.close(); } catch {}
    videoDecoder = null;
    decoderErrorCount++;
  }
}

function renderH264Frame(data: ArrayBuffer, width: number, height: number, keyFrame: boolean) {
  renderVideoFrame(data, width, height, keyFrame, "H264");
}

defineExpose({ renderH264Frame, renderVideoFrame, updateMetrics, viewerContainer });

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
  // 更新光标显示位置（相对于 canvas 元素）
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    cursorDisplayX.value = e.clientX - rect.left;
    cursorDisplayY.value = e.clientY - rect.top;
    showRemoteCursor.value = true;
  }
}

function onMouseEnter() {
  showRemoteCursor.value = true;
}

function onMouseLeave() {
  showRemoteCursor.value = false;
}

function onMouseDown(e: MouseEvent) {
  if (!props.sessionId) return;
  const pos = getCanvasCoords(e);
  if (pos) {
    inputSentTime = performance.now();
    console.log("[DesktopViewer] mouseDown →", pos.x, pos.y, "button:", e.button + 1);
    emit("mouseEvent", props.sessionId, { x: pos.x, y: pos.y, button: e.button + 1, action: "click" });
  } else {
    console.warn("[DesktopViewer] mouseDown: getCanvasCoords returned null");
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
  if (decoderErrorResetTimer) clearTimeout(decoderErrorResetTimer);
  if (viewerContainer.value) {
    const ro = (viewerContainer.value as any).__resizeObserver;
    if (ro) { ro.disconnect(); delete (viewerContainer.value as any).__resizeObserver; }
  }
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
  cursor: none;
}

.desktop-canvas {
  display: block;
  image-rendering: auto;
  flex-shrink: 0;
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

.corner-btn {
  background: rgba(0, 0, 0, 0.55) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(4px);
}
.corner-btn:hover {
  background: rgba(0, 0, 0, 0.7) !important;
  color: #fff !important;
}
.corner-btn-danger:hover {
  background: rgba(239, 68, 68, 0.35) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: #ef4444 !important;
}

/* 远程鼠标光标 */
.remote-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 20;
  transform: translate(0, 0);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
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

/* ── 指标图表面板 ── */
.metrics-chart-panel {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 15;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 200px;
  backdrop-filter: blur(8px);
}
.mcp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.mcp-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}
.mcp-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
}
.mcp-close:hover { color: #fff; }
.mcp-chart-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 22px;
}
.mcp-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  width: 28px;
  flex-shrink: 0;
}
.mcp-sparkline {
  flex: 1;
  height: 18px;
  opacity: 0.8;
}
.mcp-val {
  font-size: 11px;
  font-family: "SF Mono", "Menlo", monospace;
  min-width: 36px;
  text-align: right;
  flex-shrink: 0;
}
</style>
