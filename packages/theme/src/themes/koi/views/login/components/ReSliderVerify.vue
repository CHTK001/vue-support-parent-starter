<template>
  <div
    class="slider-verify"
    :class="{
      'slider-verify--success': success,
      'slider-verify--disabled': disabled,
      'slider-verify--dragging': isDragging,
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

    <!-- 图片拼图滑块：上方拼图片区 + 下方带 slot 目标的滑动轨道 -->
    <div v-else class="slider-verify-puzzle">
      <!-- 拼图素材（后端图片），正确 slot 在同列高亮；不配图片时 Canvas 生成主题占位图 -->
      <div class="slider-verify-puzzle-source">
        <img v-if="puzzleImage" class="slider-verify-puzzle-source-img" :src="puzzleImage" />
        <canvas
          v-else
          ref="placeholderRef"
          class="slider-verify-puzzle-source-img"
          width="400"
          height="120"
        />
        <!-- slot 映射网格：每一列都映射到轨道上的同一位置 -->
        <div class="slider-verify-puzzle-grid">
          <div
            v-for="slot in slotPositions"
            :key="slot.index"
            class="slider-verify-puzzle-slot"
            :class="{ 'slider-verify-puzzle-slot--correct': slot.index === correctIndex }"
            :style="slot.style"
          />
        </div>
      </div>

      <!-- 带 N 个目标 slot 的轨道：正确 slot 的列与图片区对齐 -->
      <div ref="trackRef" class="slider-verify-track slider-verify-track--puzzle" @pointerdown.prevent="handlePointerDown">
        <div class="slider-verify-bg" />
        <div class="slider-verify-puzzle-track-slots">
          <div
            v-for="slot in slotPositions"
            :key="slot.index"
            class="slider-verify-puzzle-target"
            :class="{ 'slider-verify-puzzle-target--correct': slot.index === correctIndex }"
            :style="slot.style"
          >
            <span class="slider-verify-puzzle-target-index">{{ slot.index + 1 }}</span>
          </div>
        </div>
        <div
          class="slider-verify-thumb"
          :class="{ 'slider-verify-thumb--success': success }"
          :style="{ transform: `translate3d(${thumbX}px,0,0)` }"
        >
          <el-icon v-if="success" :size="14"><CircleCheck /></el-icon>
          <el-icon v-else :size="14"><Right /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { CircleCheck, Right } from "@element-plus/icons-vue";
import { resolveAssetUrl } from "@repo/assets";
import type { PuzzleVerifyConfig } from "@repo/config";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    tolerance?: number;
    /** 滑动验证形态：simple=普通滑动滑块，puzzle=图片拼图滑块 */
    sliderType?: "simple" | "puzzle";
    /** 拼图滑块参数（图片、slot 数、容差、正确 slot 索引） */
    puzzle?: PuzzleVerifyConfig;
  }>(),
  {
    disabled: false,
    tolerance: 4,
    sliderType: "simple",
    puzzle: () => ({ slots: 4, tolerance: 20 } as PuzzleVerifyConfig),
  },
);

const emit = defineEmits<{
  (e: "success"): void;
  (e: "reset"): void;
}>();

const trackRef = ref<HTMLElement>();
const placeholderRef = ref<HTMLCanvasElement>();
const thumbX = ref(0);
const percent = ref(0);
const success = ref(false);
const isDragging = ref(false);

let rafId: number | null = null;
let pendingX = 0;
let trackWidth = 0;
let thumbWidth = 40;
let activePointerId: number | null = null;

// ==================== 拼图参数 ====================

/** slot 数量（2 ~ 8） */
const slotCount = computed(() => {
  const cfg = props.puzzle;
  const slots = cfg?.slots as number | undefined;
  return Math.max(2, Math.min(8, slots ?? 4));
});

/** 正确 slot 索引（不配则每次有效渲染随机抽签，避免记住位置） */
const correctIndex = ref(0);

function recalcCorrectIndex() {
  const cfg = props.puzzle;
  const fixed = cfg?.correctIndex;
  if (typeof fixed === "number" && fixed >= 0 && fixed < slotCount.value) {
    correctIndex.value = fixed;
    return;
  }
  correctIndex.value = Math.floor(Math.random() * slotCount.value);
}

watch([slotCount, () => props.puzzle], () => recalcCorrectIndex(), { deep: true });

/** slot 映射列表（图片区与轨道列对齐） */
function calcSlotPositions() {
  const count = slotCount.value;
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    style: {
      left: `${(i / count) * 100}%`,
      width: `${100 / count}%`,
    },
  }));
}

const slotPositions = ref(calcSlotPositions());

/** 拼图素材地址（后端图 / Canvas 占位图） */
const puzzleImage = computed(() => {
  const url = props.puzzle?.image;
  if (typeof url === "string" && url.trim()) return resolveAssetUrl(url);
  return "";
});

/** 提示文案：普通滑动 / 图片拼图 */
const hint = computed(() =>
  props.sliderType === "puzzle"
    ? t("menu.login.sliderTipPuzzle")
    : t("menu.login.sliderTip"),
);

const isSimple = computed(() => props.sliderType === "simple");

// ==================== 拖拽逻辑 ====================

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

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId) return;
    const delta = ev.clientX - startX;
    scheduleUpdate(baseX + delta);
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

    // pendingX 来自最后一次 pointermove（可能还没来得及被 RAF 写回 thumbX）
    const currentX = Math.max(0, Math.min(pendingX, trackWidth - thumbWidth));

    if (props.sliderType === "puzzle") return handlePointerUpPuzzle(currentX);

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

/** 拼图模式：松手时判定落点是否位于正确 slot */
function handlePointerUpPuzzle(boxX: number) {
  percent.value = 0;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const x = Math.max(0, Math.min(boxX, trackWidth - thumbWidth));
  const col = Math.floor((x / trackWidth!) * slotCount.value) % slotCount.value;
  const slotCenter = (col + 0.5) * (trackWidth! / slotCount.value);
  const thumbCenter = x + thumbWidth / 2;
  // 落在正确的 slot 上则通过，否则滑块回弹到起点
  if (correctIndex.value === col && Math.abs(thumbCenter - slotCenter) <= props.tolerance) {
    thumbX.value = slotCenter - thumbWidth / 2;
    success.value = true;
    emit("success");
  } else {
    thumbX.value = 0;
  }
}

/** 主题色：CSS 变量 `( --el-color-primary )` 回退 Element Plus 默认 */
function themeColor(name: string): string {
  const el = trackRef.value ?? placeholderRef.value ?? document.documentElement;
  const style = getComputedStyle(el as Element);
  const value = style.getPropertyValue(name).trim();
  return value || "#409EFF";
}

/** 在 Canvas 上绘制主题占位图（不含 slot，slot 由 DOM 网格绘制） */
function drawPlaceholder() {
  const canvas = placeholderRef.value;
  if (!canvas || typeof canvas.getContext === "undefined" || puzzleImage.value) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const primary = themeColor("--el-color-primary") || "#409EFF";
  const primaryLight = themeColor("--el-color-primary-light-3") || "#93C5FD";
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, primary);
  grad.addColorStop(1, primaryLight);
  ctx.fillStyle = grad;
  ctx.beginPath();
  const radius = 8;
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fill();

  // slit 分割带：让 slot 列在占位图上可感知
  const count = slotCount.value;
  const slotWidth = width / count;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i === correctIndex.value ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)";
    ctx.fillRect(i * slotWidth, 0, Math.ceil(slotWidth), height);
  }
}

/** 外部重置 */
function reset() {
  success.value = false;
  isDragging.value = false;
  thumbX.value = 0;
  percent.value = 0;
  if (rafId !== null) cancelAnimationFrame(rafId);
  // 未固定正确 slot 时重新抽签，避免下次仍拖向老位置
  if (props.puzzle?.correctIndex === undefined) recalcCorrectIndex();
  emit("reset");
}

onMounted(() => {
  recalcCorrectIndex();
  slotPositions.value = calcSlotPositions();
  nextTick(() => {
    drawPlaceholder();
  });
});

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
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

  &--puzzle {
    height: 40px;
    margin-top: 2px;
  }
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

/* ======================== 拼图模式 ======================== */

.slider-verify-puzzle {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.slider-verify-puzzle-source {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  pointer-events: none;
}

.slider-verify-puzzle-source-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  will-change: width;
}

.slider-verify-puzzle-grid {
  position: absolute;
  inset: 0;
}

.slider-verify-puzzle-slot {
  position: absolute;
  height: 100%;
  border: 2px solid transparent;
  pointer-events: none;

  &--correct {
    border-color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.22);
    box-shadow: 0 0 0 2px var(--el-color-primary), inset 0 0 12px rgba(var(--el-color-primary-rgb), 0.35);
    animation: puzzle-slot-pulse 1.6s ease-in-out infinite;
  }
}

.slider-verify-puzzle-track-slots {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

.slider-verify-puzzle-target {
  position: absolute;
  height: calc(100% - 4px);
  border: 2px dashed var(--el-border-color-lighter);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &-index {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  &--correct {
    border-color: var(--el-color-primary);
    border-style: solid;
    background: rgba(var(--el-color-primary-rgb), 0.08);
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.15);

    .slider-verify-puzzle-target-index {
      color: var(--el-color-primary);
    }
  }
}

@keyframes puzzle-slot-pulse {
  0%,
  100% {
    background: rgba(255, 255, 255, 0.22);
  }
  50% {
    background: rgba(255, 255, 255, 0.4);
  }
}
</style>
