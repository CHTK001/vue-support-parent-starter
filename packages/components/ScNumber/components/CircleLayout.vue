<template>
  <div class="sc-number-circle" :class="{ 'sc-number-circle--disabled': disabled }">
    <!-- 圆形进度 -->
    <div class="sc-number-circle__wrapper" :style="{ width: `${size}px`, height: `${size}px` }">
      <el-progress
        type="circle"
        class="sc-number-circle__progress"
        :percentage="percentage"
        :width="size"
        :stroke-width="strokeWidth"
        :color="color"
        :show-text="false"
      />
      
      <!-- 中心内容 -->
      <div class="sc-number-circle__content">
        <div class="sc-number-circle__value">
          {{ displayValue }}
        </div>
        <div v-if="showInput && editable" class="sc-number-circle__controls">
          <button
            class="sc-number-circle__btn"
            :disabled="disabled || currentValue <= min"
            @click="decrease"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M19 13H5v-2h14v2z" />
            </svg>
          </button>
          <button
            class="sc-number-circle__btn"
            :disabled="disabled || currentValue >= max"
            @click="increase"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: number;
  /**
   * 最小值
   */
  min?: number;
  /**
   * 最大值
   */
  max?: number;
  /**
   * 步长
   */
  step?: number;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 圆形大小
   */
  size?: number;
  /**
   * 进度条宽度
   */
  strokeWidth?: number;
  /**
   * 进度条颜色
   */
  color?: string | string[] | ((percentage: number) => string);
  /**
   * 是否显示输入控制
   */
  showInput?: boolean;
  /**
   * 是否可编辑
   */
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  size: 126,
  strokeWidth: 6,
  color: "",
  showInput: true,
  editable: true
});

const emit = defineEmits(["update:modelValue", "change"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 计算百分比
const percentage = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return Math.round(((props.modelValue - props.min) / range) * 100);
});

// 显示值
const displayValue = computed(() => {
  return `${percentage.value}%`;
});

// 增加
const increase = () => {
  if (props.disabled || currentValue.value >= props.max) return;
  const newVal = Math.min(currentValue.value + props.step, props.max);
  currentValue.value = newVal;
  emit("change", newVal);
};

// 减少
const decrease = () => {
  if (props.disabled || currentValue.value <= props.min) return;
  const newVal = Math.max(currentValue.value - props.step, props.min);
  currentValue.value = newVal;
  emit("change", newVal);
};
</script>

<style lang="scss" scoped>
.sc-number-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__progress {
    position: absolute;
    top: 0;
    left: 0;

    :deep(.el-progress-circle) {
      .el-progress-circle__track {
        stroke: var(--el-fill-color-light);
      }

      .el-progress-circle__path {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        stroke-linecap: round;
      }
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;
  }

  &__controls {
    display: flex;
    gap: 8px;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: var(--el-color-primary);
      color: #fff;
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }

    &:active:not(:disabled) {
      transform: scale(0.9);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  // 悬停效果
  &:hover:not(.sc-number-circle--disabled) {
    .sc-number-circle__value {
      color: var(--el-color-primary);
      transform: scale(1.05);
    }
  }

  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
