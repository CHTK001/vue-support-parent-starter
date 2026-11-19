<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { HanziStrokeMeta } from "../data/hanziStrokes";

/**
 * HanziTracePad —— 汉字描红垫。
 *
 * <p>底层 SVG 显示浅色笔顺底稿（与悬停书写同一套内置数据口径），
 * 上层 canvas 接收鼠标 / 触摸笔迹；笔迹对底稿的覆盖率达到阈值时
 * 视为描红完成。纯前端互动展示，不参与识字题判分与上报。</p>
 */
defineOptions({ name: "HanziTracePad" });

const props = withDefaults(
  defineProps<{
    character: string;
    strokes: HanziStrokeMeta[];
    /** 显示边长（px） */
    size?: number;
    /** 覆盖率达标线（0-1） */
    passRatio?: number;
  }>(),
  { size: 240, passRatio: 0.62 },
);

const emit = defineEmits<{
  (e: "done"): void;
}>();

const padRef = ref<HTMLCanvasElement | null>(null);
const drawing = ref(false);
const done = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;
/** 覆盖率采样画布边长（对应 100 坐标系的放大倍数） */
const SAMPLE = 160;
let guideData: Uint8ClampedArray | null = null;

const hasData = computed(() => props.strokes.length > 0);
const strokeLabels = computed(() => props.strokes.map((s) => s.label).join("、"));

function setupCanvas(): void {
  const canvas = padRef.value;
  if (!canvas) {
    return;
  }
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(props.size * dpr);
  canvas.height = Math.round(props.size * dpr);
  ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

/** 清空笔迹（保留底稿），重置完成态 */
function clearPad(): void {
  done.value = false;
  const canvas = padRef.value;
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/** 底稿笔画渲染到采样画布，得到「应覆盖像素」蒙版 */
function buildGuideData(): void {
  guideData = null;
  if (!hasData.value || typeof document === "undefined") {
    return;
  }
  const off = document.createElement("canvas");
  off.width = SAMPLE;
  off.height = SAMPLE;
  const c = off.getContext("2d");
  if (!c) {
    return;
  }
  c.scale(SAMPLE / 100, SAMPLE / 100);
  c.strokeStyle = "#000";
  c.lineWidth = 7;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const s of props.strokes) {
    c.stroke(new Path2D(s.path));
  }
  guideData = c.getImageData(0, 0, SAMPLE, SAMPLE).data;
}

/** 指针事件 → 100 坐标系（再由调用方换算到 canvas 像素） */
function eventPos(e: PointerEvent): [number, number] {
  const canvas = padRef.value;
  if (!canvas) {
    return [0, 0];
  }
  const rect = canvas.getBoundingClientRect();
  return [((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100];
}

let lastX = 0;
let lastY = 0;

function strokeRadius(): number {
  return (props.size * dpr * 0.045);
}

function onDown(e: PointerEvent): void {
  if (!hasData.value || done.value) {
    return;
  }
  const canvas = padRef.value;
  if (!canvas || !ctx) {
    return;
  }
  drawing.value = true;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    /* 某些环境不支持指针捕获，忽略 */
  }
  const [x, y] = eventPos(e);
  lastX = (x / 100) * canvas.width;
  lastY = (y / 100) * canvas.height;
  ctx.fillStyle = "#2f3a4f";
  ctx.beginPath();
  ctx.arc(lastX, lastY, strokeRadius() / 2, 0, Math.PI * 2);
  ctx.fill();
}

function onMove(e: PointerEvent): void {
  if (!drawing.value || done.value) {
    return;
  }
  const canvas = padRef.value;
  if (!canvas || !ctx) {
    return;
  }
  const [x, y] = eventPos(e);
  const nx = (x / 100) * canvas.width;
  const ny = (y / 100) * canvas.height;
  ctx.strokeStyle = "#2f3a4f";
  ctx.lineWidth = strokeRadius();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  lastX = nx;
  lastY = ny;
}

function onUp(): void {
  if (!drawing.value) {
    return;
  }
  drawing.value = false;
  checkDone();
}

/** 统计用户笔迹对底稿蒙版的覆盖率，达标即完成 */
function checkDone(): void {
  const canvas = padRef.value;
  if (!canvas || !guideData) {
    return;
  }
  const off = document.createElement("canvas");
  off.width = SAMPLE;
  off.height = SAMPLE;
  const c = off.getContext("2d");
  if (!c) {
    return;
  }
  c.drawImage(canvas, 0, 0, SAMPLE, SAMPLE);
  const user = c.getImageData(0, 0, SAMPLE, SAMPLE).data;
  let hit = 0;
  let total = 0;
  for (let i = 3; i < guideData.length; i += 4) {
    if (guideData[i] > 40) {
      total += 1;
      if (user[i] > 40) {
        hit += 1;
      }
    }
  }
  if (total > 0 && hit / total >= props.passRatio) {
    done.value = true;
    emit("done");
  }
}

watch(
  () => [props.character, props.strokes] as const,
  () => {
    setupCanvas();
    buildGuideData();
    clearPad();
  },
);

watch(
  () => props.size,
  () => {
    setupCanvas();
    clearPad();
  },
);

onMounted(() => {
  setupCanvas();
  buildGuideData();
});

defineExpose({ clearPad });
</script>

<template>
  <div class="htp-wrap">
    <div
      class="htp"
      :class="{ 'htp--done': done, 'htp--empty': !hasData }"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <template v-if="hasData">
        <svg class="htp__guide" viewBox="0 0 100 100" aria-hidden="true">
          <path v-for="(s, i) in strokes" :key="i" :d="s.path" />
        </svg>
        <canvas
          ref="padRef"
          class="htp__pad"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        ></canvas>
        <transition name="htp-fade">
          <div v-if="done" class="htp__ok">描好啦！</div>
        </transition>
      </template>
      <div v-else class="htp__empty-tip">{{ character }} 还没有描红底稿</div>
    </div>
    <div v-if="hasData" class="htp__meta">
      <span class="htp__strokes">{{ character }} 共 {{ strokes.length }} 笔：{{ strokeLabels }}</span>
      <button type="button" class="htp__clear" @click="clearPad">重写</button>
    </div>
  </div>
</template>

<style scoped>
.htp-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.htp {
  position: relative;
  border-radius: 14px;
  background: #fffdf6;
  border: 2px dashed #d9c8b4;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.htp--done {
  border-color: #67c23a;
  border-style: solid;
}

.htp--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.htp__guide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.htp__guide path {
  fill: none;
  stroke: #e3c8b8;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.htp__pad {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.htp__ok {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(103, 194, 58, 0.92);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.htp-fade-enter-active,
.htp-fade-leave-active {
  transition: opacity 0.25s ease;
}

.htp-fade-enter-from,
.htp-fade-leave-to {
  opacity: 0;
}

.htp__empty-tip {
  color: #b0a293;
  font-size: 13px;
}

.htp__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: #8a7f70;
}

.htp__strokes {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.htp__clear {
  border: 1px solid #d9c8b4;
  border-radius: 999px;
  background: transparent;
  color: #8a7f70;
  font-size: 12.5px;
  padding: 3px 12px;
  cursor: pointer;
}

.htp__clear:hover {
  color: #6b5d4c;
  border-color: #c4ad92;
}
</style>
