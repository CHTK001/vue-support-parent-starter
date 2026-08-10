<template>
  <div class="slider-verify" :class="{ 'slider-verify--success': success, 'slider-verify--disabled': disabled }">
    <!-- 文字 / 成功提示 -->
    <div class="slider-verify-text" :class="{ 'slider-verify-text--success': success }">
      <el-icon v-if="success" :size="14"><CircleCheck /></el-icon>
      <el-icon v-else :size="14"><Right /></el-icon>
      <span>{{ success ? $t("menu.login.sliderSuccess") : $t("menu.login.sliderTip") }}</span>
    </div>

    <!-- 滑块轨道 -->
    <div ref="trackRef" class="slider-verify-track" @mousedown.prevent="handleStart" @touchstart.prevent="handleStart">
      <div class="slider-verify-bg" :style="{ width: percent + '%' }"></div>
      <div
        class="slider-verify-thumb"
        :class="{ 'slider-verify-thumb--success': success }"
        :style="{ transform: `translateX(${thumbX}px)` }"
      >
        <el-icon v-if="success" :size="14"><CircleCheck /></el-icon>
        <el-icon v-else :size="14"><Right /></el-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { CircleCheck, Right } from "@element-plus/icons-vue";

const props = withDefaults(
  defineProps<{
    /** 是否禁用 */
    disabled?: boolean;
    /** 允许误差（像素） */
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

let dragging = false;
let startX = 0;
let baseX = 0;
let trackWidth = 0;
let thumbWidth = 40;

/** 鼠标/触摸按下 */
function handleStart(event: MouseEvent | TouchEvent): void {
  if (props.disabled || success.value) return;
  const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
  dragging = true;
  startX = clientX;
  baseX = thumbX.value;
  trackWidth = trackRef.value?.clientWidth ?? 0;
  thumbWidth = trackRef.value?.querySelector(".slider-verify-thumb")?.clientWidth ?? 40;
  window.addEventListener("mousemove", handleMove);
  window.addEventListener("mouseup", handleEnd);
  window.addEventListener("touchmove", handleMove, { passive: false });
  window.addEventListener("touchend", handleEnd);
}

/** 拖动过程 */
function handleMove(event: MouseEvent | TouchEvent): void {
  if (!dragging) return;
  const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
  const delta = clientX - startX;
  let next = baseX + delta;
  next = Math.max(0, Math.min(next, trackWidth - thumbWidth));
  thumbX.value = next;
  percent.value = trackWidth > 0 ? (next / (trackWidth - thumbWidth)) * 100 : 0;
}

/** 拖动结束 */
function handleEnd(): void {
  if (!dragging) return;
  dragging = false;
  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("touchend", handleEnd);

  // 滑到最右侧视为验证成功
  if (thumbX.value >= trackWidth - thumbWidth - props.tolerance) {
    thumbX.value = trackWidth - thumbWidth;
    percent.value = 100;
    success.value = true;
    emit("success");
  } else {
    // 未到位自动回弹
    thumbX.value = 0;
    percent.value = 0;
  }
}

/** 外部重置（登录失败 / 刷新验证时调用） */
function reset(): void {
  success.value = false;
  thumbX.value = 0;
  percent.value = 0;
  emit("reset");
}

defineExpose({ reset });
</script>

<style lang="scss" scoped>
.slider-verify {
  position: relative;
  width: 100%;
  height: 40px;
  user-select: none;

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
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  &:active {
    cursor: grabbing;
  }
}

.slider-verify-bg {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(var(--el-color-primary-rgb), 0.12);
  border-radius: 10px;
  pointer-events: none;
  transition: width 0.2s;
}

.slider-verify-text {
  position: absolute;
  inset: 0;
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

  &--success {
    color: #fff;
    background: var(--el-color-success);
    border-color: var(--el-color-success);
  }
}
</style>
