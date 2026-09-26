<template>
  <div class="slider-verify" :class="{ 'slider-verify--success': success, 'slider-verify--disabled': disabled, 'slider-verify--dragging': isDragging }">
    <!-- 文字提示 -->
    <div class="slider-verify-text" :class="{ 'slider-verify-text--success': success }">
      <el-icon v-if="success" :size="14"><CircleCheck /></el-icon>
      <el-icon v-else :size="14"><Right /></el-icon>
      <span>{{ success ? $t("menu.login.sliderSuccess") : $t("menu.login.sliderTip") }}</span>
    </div>

    <!-- 滑块轨道 -->
    <div ref="trackRef" class="slider-verify-track" @pointerdown.prevent="handlePointerDown">
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from "vue";
import { CircleCheck, Right } from "@element-plus/icons-vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    tolerance?: number;
  }>(),
  {
    disabled: false,
    tolerance: 4,
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

/** 拖拽位置更新，RAF节流保证跟手流畅 */
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

/** 指针按下 */
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

    const maxX = trackWidth - thumbWidth;
    if (thumbX.value >= maxX - props.tolerance) {
      thumbX.value = maxX;
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
  if (rafId !== null) cancelAnimationFrame(rafId);
  emit("reset");
}

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
</style>