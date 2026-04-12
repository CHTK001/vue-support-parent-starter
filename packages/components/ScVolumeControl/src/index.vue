<template>
  <div
    class="sc-volume-control"
    :class="[
      { 'is-compact': compact, 'is-disabled': disabled, 'is-popup': !directShow },
      `is-${direction}`
    ]"
    :tabindex="keyboardEnabled ? 0 : undefined"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @keydown="handleKeydown"
  >
    <button
      type="button"
      class="sc-volume-control__icon"
      :aria-label="iconLabel"
      :disabled="disabled"
      @click="toggleMute"
    >
      <svg v-if="modelValue <= 0" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h4l5-4v12l-5-4H4z" />
        <path d="M17 9l4 6" />
        <path d="M21 9l-4 6" />
      </svg>
      <svg v-else-if="modelValue < 45" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h4l5-4v12l-5-4H4z" />
        <path d="M17 10.5a3.6 3.6 0 0 1 0 3" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h4l5-4v12l-5-4H4z" />
        <path d="M17 8.5a6.4 6.4 0 0 1 0 7" />
        <path d="M19.8 6.5a9.6 9.6 0 0 1 0 11" />
      </svg>
    </button>

    <template v-if="directShow">
      <el-slider
        class="sc-volume-control__slider"
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :show-tooltip="false"
        :disabled="disabled"
        @input="handleInput"
        @change="handleChange"
      />

      <span v-if="showValue" class="sc-volume-control__value">
        {{ Math.round(modelValue) }}%
      </span>
    </template>

    <Transition name="sc-volume-popup">
      <div
        v-if="!directShow && expanded"
        class="sc-volume-control__popup"
        :class="`is-${direction}`"
      >
        <el-slider
          class="sc-volume-control__slider"
          :model-value="modelValue"
          :min="min"
          :max="max"
          :step="step"
          :show-tooltip="false"
          :disabled="disabled"
          :vertical="isVertical"
          :height="isVertical ? '136px' : undefined"
          @input="handleInput"
          @change="handleChange"
        />

        <span v-if="showValue" class="sc-volume-control__value">
          {{ Math.round(modelValue) }}%
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    compact?: boolean;
    showValue?: boolean;
    disabled?: boolean;
    directShow?: boolean;
    direction?: "up" | "right" | "down" | "left";
    keyboardEnabled?: boolean;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    compact: false,
    showValue: true,
    disabled: false,
    directShow: false,
    direction: "up",
    keyboardEnabled: true
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
  change: [value: number];
}>();

const lastNonZero = ref(props.modelValue > 0 ? props.modelValue : 60);
const expanded = ref(false);

const iconLabel = computed(() => {
  return props.modelValue <= 0 ? "恢复音量" : "静音";
});

const isVertical = computed(() => {
  return props.direction === "up" || props.direction === "down";
});

watch(
  () => props.modelValue,
  value => {
    if (value > 0) {
      lastNonZero.value = value;
    }
  },
  { immediate: true }
);

function handleInput(value: number) {
  emit("update:modelValue", Number(value));
}

function handleChange(value: number) {
  const next = Number(value);
  emit("update:modelValue", next);
  emit("change", next);
}

function toggleMute() {
  if (props.disabled) {
    return;
  }
  const next = props.modelValue > 0 ? 0 : Math.max(lastNonZero.value, 36);
  emit("update:modelValue", next);
  emit("change", next);
}

function updateByStep(delta: number) {
  const next = Math.max(props.min, Math.min(props.max, props.modelValue + delta));
  emit("update:modelValue", next);
  emit("change", next);
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.keyboardEnabled || props.disabled) {
    return;
  }

  if (event.key === "ArrowUp" || event.key === "ArrowRight") {
    event.preventDefault();
    updateByStep(props.step);
  }

  if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
    event.preventDefault();
    updateByStep(-props.step);
  }
}

function handleMouseEnter() {
  if (!props.directShow) {
    expanded.value = true;
  }
}

function handleMouseLeave() {
  if (!props.directShow) {
    expanded.value = false;
  }
}

function handleFocusIn() {
  if (!props.directShow) {
    expanded.value = true;
  }
}

function handleFocusOut(event: FocusEvent) {
  if (props.directShow) {
    return;
  }
  const nextTarget = event.relatedTarget as Node | null;
  if (nextTarget && (event.currentTarget as HTMLElement | null)?.contains(nextTarget)) {
    return;
  }
  expanded.value = false;
}
</script>

<style scoped lang="scss">
.sc-volume-control {
  display: inline-grid;
  grid-template-columns: 36px minmax(96px, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  position: relative;
}

.sc-volume-control.is-compact {
  grid-template-columns: 34px minmax(84px, 1fr) auto;
  gap: 8px;
}

.sc-volume-control__icon {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.sc-volume-control__icon:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.12);
}

.sc-volume-control__icon:disabled {
  cursor: not-allowed;
  opacity: 0.54;
}

.sc-volume-control__icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.sc-volume-control__slider {
  min-width: 0;
}

.sc-volume-control :deep(.el-slider__runway) {
  height: 4px;
}

.sc-volume-control :deep(.el-slider.is-vertical .el-slider__runway) {
  width: 4px;
}

.sc-volume-control :deep(.el-slider__bar) {
  height: 4px;
}

.sc-volume-control :deep(.el-slider.is-vertical .el-slider__bar) {
  width: 4px;
}

.sc-volume-control :deep(.el-slider__button-wrapper) {
  width: 20px;
  height: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.sc-volume-control :deep(.el-slider__button) {
  width: 10px;
  height: 10px;
  border-width: 1px;
}

.sc-volume-control :deep(.el-slider.is-vertical .el-slider__button-wrapper) {
  left: 50%;
  top: auto;
  transform: translateX(-50%);
}

.sc-volume-control__value {
  min-width: 36px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  text-align: right;
}

.sc-volume-control__popup {
  position: absolute;
  z-index: 8;
  display: inline-grid;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(22, 16, 16, 0.94);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
}

.sc-volume-control__popup.is-up {
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
}

.sc-volume-control__popup.is-down {
  left: 50%;
  top: calc(100% + 10px);
  transform: translateX(-50%);
}

.sc-volume-control__popup.is-left {
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  grid-template-columns: minmax(120px, 1fr) auto;
  align-items: center;
}

.sc-volume-control__popup.is-right {
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  grid-template-columns: minmax(120px, 1fr) auto;
  align-items: center;
}

.sc-volume-control.is-disabled {
  opacity: 0.6;
}

.sc-volume-popup-enter-active,
.sc-volume-popup-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.sc-volume-popup-enter-from,
.sc-volume-popup-leave-to {
  opacity: 0;
}
</style>
