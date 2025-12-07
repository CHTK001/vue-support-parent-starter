<template>
  <div class="sc-number-progress" :class="{ 'sc-number-progress--disabled': disabled }">
    <!-- 进度条 -->
    <div class="sc-number-progress__bar">
      <el-progress
        class="sc-number-progress__progress"
        :percentage="percentage"
        :stroke-width="strokeWidth"
        :text-inside="textInside"
        :status="status"
        :color="color"
        :show-text="showPercentage"
        :format="formatPercentage"
      />
    </div>

    <!-- 可编辑输入框 -->
    <div v-if="showInput && editable" class="sc-number-progress__input">
      <el-input-number
        v-model="currentValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        size="small"
        controls-position="right"
        @change="handleChange"
      />
    </div>

    <!-- 快捷操作按钮 -->
    <div v-if="editable && !showInput" class="sc-number-progress__actions">
      <button
        class="sc-number-progress__btn"
        :disabled="disabled || currentValue <= min"
        @click="decrease"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M19 13H5v-2h14v2z" />
        </svg>
      </button>
      <span class="sc-number-progress__value">{{ displayValue }}</span>
      <button
        class="sc-number-progress__btn"
        :disabled="disabled || currentValue >= max"
        @click="increase"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
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
   * 是否显示输入框
   */
  showInput?: boolean;
  /**
   * 是否显示百分比
   */
  showPercentage?: boolean;
  /**
   * 百分比格式化函数
   */
  percentageFormat?: (val: number) => string;
  /**
   * 进度条宽度
   */
  strokeWidth?: number;
  /**
   * 百分比是否在进度条内
   */
  textInside?: boolean;
  /**
   * 进度条状态
   */
  status?: "" | "success" | "exception" | "warning";
  /**
   * 进度条颜色
   */
  color?: string | string[] | ((percentage: number) => string);
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
  showInput: false,
  showPercentage: true,
  percentageFormat: undefined,
  strokeWidth: 6,
  textInside: false,
  status: "",
  color: "",
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
  if (props.percentageFormat) {
    return props.percentageFormat(props.modelValue);
  }
  return props.modelValue;
});

// 格式化百分比
const formatPercentage = (percentage: number): string => {
  if (props.percentageFormat) {
    return props.percentageFormat(props.modelValue);
  }
  return `${percentage}%`;
};

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

const handleChange = (value: number | undefined) => {
  emit("change", value);
};
</script>

<style lang="scss" scoped>
.sc-number-progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;

  &__bar {
    flex: 1;
    min-width: 0;

    .sc-number-progress__progress {
      :deep(.el-progress-bar) {
        .el-progress-bar__outer {
          border-radius: 100px;
          overflow: hidden;
        }

        .el-progress-bar__inner {
          border-radius: 100px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(90deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
        }
      }

      :deep(.el-progress__text) {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }

  &__input {
    flex-shrink: 0;

    :deep(.el-input-number) {
      width: 100px;

      .el-input__wrapper {
        border-radius: 8px;
      }
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: var(--el-color-primary);
      color: #fff;
      transform: scale(1.1);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__value {
    min-width: 40px;
    text-align: center;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
