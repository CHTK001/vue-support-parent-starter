<template>
  <div
    class="slider-verify"
    :class="{
      'slider-verify--success': success,
      'slider-verify--disabled': disabled,
      'slider-verify--dragging': isDragging,
      'slider-verify--puzzle': !isSimple,
    }"
  >
    <!-- 文字提示 -->
    <div class="slider-verify-text" :class="{ 'slider-verify-text--success': success }">
      <el-icon v-if="success" :size="14"><CircleCheck /></el-icon>
      <el-icon v-else :size="14"><Right /></el-icon>
      <span>{{ success ? $t("menu.login.sliderSuccess") : hint }}</span>
    </div>

    <!-- 普通滑动滑块 -->
    <div v-if="isSimple" ref="trackRef" class="slider-verify-track" @pointerdown.prevent="handlePointerDown">
      <div class="slider-verify-bg" :style="{ transform: `translate3d(-${100 - percent}%,0,0)` }"></div>
      <div
        class="slider-verify-thumb"
        :class="{ 'slider-verify-thumb--success': success }"
        :style="{ transform: `translate3d(${thumbX}px,0,0)` }"
      >
        <el-icon v-if="success" :size="14"><CircleCheck /></el-icon>
        <el-icon v-else :size="14"><Right /></el-icon>
      </div>
    </div>

    <!-- 图片拼图验证：底图缺一块，拖动「从原图抠出的拼图块」补回缺口 -->
    <div v-else class="slider-verify-puzzle">
      <div
        ref="sourceRef"
        class="slider-verify-puzzle-source"
        :data-hole-x="hole.x"
        :data-hole-y="hole.y"
      >
        <canvas ref="baseRef" class="slider-verify-puzzle-canvas" />
        <div
          class="slider-verify-puzzle-piece"
          :class="{ 'slider-verify-puzzle-piece--success': success }"
          :style="pieceStyle"
          @pointerdown.prevent="handlePieceDown"
        >
          <canvas ref="pieceCanvasRef" class="slider-verify-puzzle-piece-canvas" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { CircleCheck, Right } from "@element-plus/icons-vue";
import { resolveAssetUrl } from "@repo/assets";
import defaultPuzzleImage from "@repo/assets/images/login/science.png";
import type { PuzzleVerifyConfig } from "@repo/config";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    /** 判定通过的距离容差（px）：simple=距终点距离 / puzzle=拼图块与缺口的横向对齐误差 */
    tolerance?: number;
    /** 滑动验证形态：simple=普通滑动滑块，puzzle=图片拼图 */
    sliderType?: "simple" | "puzzle";
    /** 拼图验证参数（底图、容差） */
    puzzle?: PuzzleVerifyConfig;
  }>(),
  {
    disabled: false,
    tolerance: 8,
    sliderType: "puzzle",
    puzzle: () => ({ tolerance: 8 } as PuzzleVerifyConfig),
  },
);

const emit = defineEmits<{
  (e: "success"): void;
  (e: "reset"): void;
}>();

const trackRef = ref<HTMLElement>();
const thumbX = ref(0);
const percent = ref(0);
const success = ref(false);
const isDragging = ref(false);

let rafId: number | null = null;
let pendingX = 0;
let trackWidth = 0;
let thumbWidth = 40;
let activePointerId: number | null = null;

// ==================== 图片拼图 ====================

/** 拼图块边长（px）与顶部凸起 / 右侧凹口半径 */
const PIECE_SIZE = 42;
const BUMP_RADIUS = 9;
const NOTCH_RADIUS = 8;
/** 底图高度（与 .slider-verify-puzzle-source 的 CSS 高度保持一致） */
const SOURCE_HEIGHT = 120;

const sourceRef = ref<HTMLElement>();
const baseRef = ref<HTMLCanvasElement>();
const pieceCanvasRef = ref<HTMLCanvasElement>();

/** 缺口位置（拼图块本体左上角在底图上的坐标）；拼图块从最左拖到缺口处 */
const hole = reactive({ x: 0, y: 0 });
/** 拼图块当前横向偏移（0 = 最左） */
const pieceX = ref(0);
/** 底图逻辑宽度（随容器测量） */
let sourceWidth = 0;
/** 原图（底图与拼图块共用同一像素源） */
let sourceImg: HTMLImageElement | null = null;
let resizeObserver: ResizeObserver | null = null;
let puzzleLayoutReady = false;

/** 图片加载失败时回退 Canvas 渐变占位图 */
const puzzleImgFailed = ref(false);

/** 拼图素材地址：配置图 → 内置默认图（登录页同款插画）→ Canvas 渐变占位图兜底 */
const puzzleImage = computed(() => {
  if (puzzleImgFailed.value) return "";
  const url = props.puzzle?.image;
  if (typeof url === "string" && url.trim()) return resolveAssetUrl(url);
  return defaultPuzzleImage;
});

/** 提示文案：普通滑动 / 图片拼图 */
const hint = computed(() =>
  props.sliderType === "puzzle"
    ? t("menu.login.sliderTipPuzzle")
    : t("menu.login.sliderTip"),
);

const isSimple = computed(() => props.sliderType === "simple");

/** 判定容差：puzzle 形态优先取 sliderPuzzle.tolerance，simple 用 tolerance prop */
const judgeTolerance = computed(() =>
  props.sliderType === "puzzle" ? (props.puzzle?.tolerance ?? props.tolerance) : props.tolerance,
);

/** 拼图块定位：垂直方向与缺口对齐，横向由拖拽决定 */
const pieceStyle = computed(() => ({
  width: `${PIECE_SIZE}px`,
  height: `${PIECE_SIZE + BUMP_RADIUS}px`,
  top: `${hole.y - BUMP_RADIUS}px`,
  transform: `translate3d(${pieceX.value}px,0,0)`,
}));

/**
 * 拼图块轮廓：正方形 + 顶部半圆凸起 + 右侧半圆凹口。
 * 底图缺口与拼图块用同一路径绘制（缺口 destination-out 抠出、拼图块 clip 裁出），保证严丝合缝。
 */
function tracePiecePath(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + PIECE_SIZE / 2 - BUMP_RADIUS, y);
  // 顶部凸起：沿上半圆拱出
  ctx.arc(x + PIECE_SIZE / 2, y, BUMP_RADIUS, Math.PI, 0, false);
  ctx.lineTo(x + PIECE_SIZE, y);
  ctx.lineTo(x + PIECE_SIZE, y + PIECE_SIZE / 2 - NOTCH_RADIUS);
  // 右侧凹口：向内凹进半个圆
  ctx.arc(x + PIECE_SIZE, y + PIECE_SIZE / 2, NOTCH_RADIUS, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(x + PIECE_SIZE, y + PIECE_SIZE);
  ctx.lineTo(x, y + PIECE_SIZE);
  ctx.closePath();
}

/** 加载拼图原图（失败回退渐变占位图），成功后重建底图与拼图块 */
function loadSource() {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    puzzleImgFailed.value = false;
    sourceImg = img;
    buildSourceCanvas((ctx, w, h) => {
      // cover 铺满：与 CSS object-fit: cover 同口径
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    });
  };
  img.onerror = () => {
    puzzleImgFailed.value = true;
    sourceImg = null;
    buildSourceCanvas(drawFallbackSource);
  };
  img.src = puzzleImage.value;
}

/** 无图兜底：主题蓝紫渐变 + 装饰圆点 */
function drawFallbackSource(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#3B82F6");
  grad.addColorStop(1, "#8B5CF6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc((i * 97 + 31) % w, (i * 53 + 17) % h, 12 + i * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 生成原图画布（底图与拼图块都从它取像素），随后随机缺口并重绘 */
function buildSourceCanvas(painter: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  if (!sourceWidth) return;
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sourceWidth * dpr);
  canvas.height = Math.round(SOURCE_HEIGHT * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  painter(ctx, sourceWidth, SOURCE_HEIGHT);
  sourceCanvas = canvas;
  randomizeHole();
  drawPuzzle();
}

let sourceCanvas: HTMLCanvasElement | null = null;

/** 随机缺口位置：避开边缘，且保证拼图块能拖到缺口处 */
function randomizeHole() {
  const minX = Math.round(sourceWidth * 0.12);
  const maxX = sourceWidth - PIECE_SIZE - Math.round(sourceWidth * 0.08);
  hole.x = Math.round(minX + Math.random() * Math.max(1, maxX - minX));
  hole.x = Math.max(0, Math.min(hole.x, Math.max(0, sourceWidth - PIECE_SIZE)));
  const minY = BUMP_RADIUS + 6;
  const maxY = SOURCE_HEIGHT - PIECE_SIZE - 6;
  hole.y = Math.round(minY + Math.random() * Math.max(1, maxY - minY));
}

/** 重绘底图（抠缺口）与拼图块（从原图对应位置裁出） */
function drawPuzzle() {
  const base = baseRef.value;
  const pieceCanvas = pieceCanvasRef.value;
  if (!sourceCanvas || !base || !pieceCanvas) return;
  const dpr = window.devicePixelRatio || 1;

  // 底图：原图 + destination-out 抠缺口 + 深色洞腔（透明底素材下缺口也要肉眼可见）+ 内壁阴影
  base.width = Math.round(sourceWidth * dpr);
  base.height = Math.round(SOURCE_HEIGHT * dpr);
  const ctx = base.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sourceWidth, SOURCE_HEIGHT);
  ctx.drawImage(sourceCanvas, 0, 0, sourceWidth, SOURCE_HEIGHT);
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  tracePiecePath(ctx, hole.x, hole.y);
  ctx.fill();
  ctx.restore();
  tracePiecePath(ctx, hole.x, hole.y);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 拼图块：从原图 (hole.x, hole.y) 处裁出，含顶部凸起
  pieceCanvas.width = Math.round(PIECE_SIZE * dpr);
  pieceCanvas.height = Math.round((PIECE_SIZE + BUMP_RADIUS) * dpr);
  const pctx = pieceCanvas.getContext("2d");
  if (!pctx) return;
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pctx.clearRect(0, 0, PIECE_SIZE, PIECE_SIZE + BUMP_RADIUS);
  pctx.save();
  tracePiecePath(pctx, 0, BUMP_RADIUS);
  pctx.clip();
  // 拼图块画布上的 (0, BUMP_RADIUS) 对应原图的 (hole.x, hole.y)
  pctx.drawImage(sourceCanvas, -hole.x, BUMP_RADIUS - hole.y, sourceWidth, SOURCE_HEIGHT);
  pctx.restore();
  tracePiecePath(pctx, 0, BUMP_RADIUS);
  pctx.strokeStyle = "rgba(255,255,255,0.9)";
  pctx.lineWidth = 1.5;
  pctx.stroke();
}

/** 测量容器并初始化拼图（宽度就绪后才加载原图）；容器尺寸变化时重排 */
function ensurePuzzleInit() {
  const w = sourceRef.value?.clientWidth ?? 0;
  if (!w) return;
  const resized = puzzleLayoutReady && w !== sourceWidth;
  sourceWidth = w;
  puzzleLayoutReady = true;
  if (!sourceCanvas && !sourceImg && !puzzleImgFailed.value) {
    loadSource();
  } else if (resized) {
    // 宽度变化：重建原图画布并重新随机缺口
    if (sourceImg) {
      buildSourceCanvas((ctx, cw, ch) => {
        const scale = Math.max(cw / sourceImg!.width, ch / sourceImg!.height);
        const dw = sourceImg!.width * scale;
        const dh = sourceImg!.height * scale;
        ctx.drawImage(sourceImg!, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      });
    } else {
      buildSourceCanvas(drawFallbackSource);
    }
  }
}

/** 拼图块拖拽：横向跟随指针，松手按缺口位置判定 */
function handlePieceDown(e: PointerEvent) {
  if (props.disabled || success.value) return;
  activePointerId = e.pointerId;
  isDragging.value = true;
  const startX = e.clientX;
  const baseX = pieceX.value;
  pendingX = baseX;

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId) return;
    schedulePieceX(baseX + (ev.clientX - startX));
  };

  const onUp = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId) return;
    isDragging.value = false;
    activePointerId = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    settlePiece(Math.max(0, Math.min(pendingX, sourceWidth - PIECE_SIZE)));
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
}

function schedulePieceX(x: number) {
  pendingX = x;
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    pieceX.value = Math.max(0, Math.min(pendingX, sourceWidth - PIECE_SIZE));
  });
}

/** 松手判定：拼图块与缺口横向对齐（±tolerance）即吸附通过，否则弹回起点 */
function settlePiece(x: number) {
  if (Math.abs(x - hole.x) <= judgeTolerance.value) {
    pieceX.value = hole.x;
    success.value = true;
    emit("success");
  } else {
    pieceX.value = 0;
  }
}

// ==================== 普通滑动（simple） ====================

function scheduleUpdate(x: number) {
  pendingX = x;
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    const maxX = trackWidth - thumbWidth;
    const next = Math.max(0, Math.min(pendingX, maxX));
    thumbX.value = next;
    percent.value = maxX > 0 ? (next / maxX) * 100 : 0;
  });
}

function handlePointerDown(e: PointerEvent) {
  if (props.disabled || success.value) return;
  activePointerId = e.pointerId;
  isDragging.value = true;
  const rect = trackRef.value!.getBoundingClientRect();
  trackWidth = rect.width;
  thumbWidth = trackRef.value!.querySelector(".slider-verify-thumb")?.clientWidth ?? 40;
  const startX = e.clientX;
  const baseX = thumbX.value;
  pendingX = baseX;

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId) return;
    scheduleUpdate(baseX + (ev.clientX - startX));
  };

  const onUp = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId) return;
    isDragging.value = false;
    activePointerId = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    const currentX = Math.max(0, Math.min(pendingX, trackWidth - thumbWidth));
    if (currentX >= trackWidth - thumbWidth - props.tolerance) {
      thumbX.value = trackWidth - thumbWidth;
      percent.value = 100;
      success.value = true;
      emit("success");
    } else {
      thumbX.value = 0;
      percent.value = 0;
    }
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
}

/** 外部重置 */
function reset() {
  success.value = false;
  isDragging.value = false;
  thumbX.value = 0;
  percent.value = 0;
  pieceX.value = 0;
  if (rafId !== null) cancelAnimationFrame(rafId);
  // 拼图模式：重置时换一个缺口位置，避免记住答案
  if (!isSimple.value && sourceCanvas) {
    randomizeHole();
    drawPuzzle();
  }
  emit("reset");
}

watch(
  () => props.puzzle?.image,
  () => {
    if (isSimple.value) return;
    puzzleImgFailed.value = false;
    sourceImg = null;
    sourceCanvas = null;
    if (puzzleLayoutReady) loadSource();
  },
);

onMounted(() => {
  if (isSimple.value) return;
  nextTick(() => {
    ensurePuzzleInit();
    resizeObserver = new ResizeObserver(() => ensurePuzzleInit());
    if (sourceRef.value) resizeObserver.observe(sourceRef.value);
  });
});

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

defineExpose({ reset });
</script>

<style lang="scss" scoped>
.slider-verify {
  position: relative;
  width: 100%;
  height: 40px;
  user-select: none;
  -webkit-user-select: none;

  &--disabled {
    pointer-events: none;
    opacity: 0.6;
  }
}

/* 拼图模式：内容 = 120px 素材区。
   根容器若沿用 simple 模式的固定 40px 高，整块会向下溢出、
   压住表单后续控件（真实现象：拼图面板盖住记住密码/登录按钮） */
.slider-verify--puzzle {
  height: auto;
}

.slider-verify--puzzle .slider-verify-text {
  /* 提示文案铺满素材区并垂直居中 */
  inset: 0 0 auto 0;
  height: 120px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.slider-verify--puzzle .slider-verify-text:not(.slider-verify-text--success) {
  /* 提示文案压在拼图图片上，用白字保证可读性 */
  color: #fff;
}

.slider-verify-track {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  touch-action: pan-y;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.slider-verify--dragging .slider-verify-track {
  cursor: grabbing;
}

.slider-verify-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(var(--el-color-primary-rgb), 0.12);
  border-radius: 10px;
  pointer-events: none;
  will-change: transform;
}

.slider-verify-text {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  pointer-events: none;

  &--success {
    color: var(--el-color-success);
  }
}

.slider-verify-thumb {
  position: absolute;
  top: 2px;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 34px;
  color: var(--el-color-primary);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: grab;
  will-change: transform;
  transition: transform 0.2s ease;

  &:active {
    cursor: grabbing;
  }

  &--success {
    color: #fff;
    background: var(--el-color-success);
    border-color: var(--el-color-success);
  }
}

.slider-verify--dragging .slider-verify-thumb {
  transition: none;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);
}

/* ======================== 图片拼图模式 ======================== */

.slider-verify-puzzle {
  width: 100%;
}

.slider-verify-puzzle-source {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.slider-verify-puzzle-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.slider-verify-puzzle-piece {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  cursor: grab;
  touch-action: pan-y;
  will-change: transform;
  transition: transform 0.25s ease;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));

  &--success {
    cursor: default;
  }
}

.slider-verify--dragging .slider-verify-puzzle-piece {
  transition: none;
  cursor: grabbing;
}

.slider-verify-puzzle-piece-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
