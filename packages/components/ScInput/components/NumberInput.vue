<template>
  <ScNumber
    v-model="currentValue"
    class="sc-number-input"
    v-bind="$attrs"
    :layout="layout"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :controls="controls"
    :controls-position="controlsPosition"
    :disabled="disabled"
    :size="size"
    :placeholder="placeholder"
    @change="handleChange"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScNumber from "../../ScNumber/index.vue";
import type { NumberLayout } from "../../ScNumber/index.vue";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: number;
  /**
   * 布局模式
   * - default: 默认数字输入框
   * - slider: 滑块
   * - rate: 评分
   * - stepper: 步进器
   * - progress: 进度条
   * - circle: 圆形进度
   */
  layout?: NumberLayout;
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
   * 是否只能输入步长的倍数
   */
  stepStrictly?: boolean;
  /**
   * 数值精度
   */
  precision?: number;
  /**
   * 是否使用控制按钮
   */
  controls?: boolean;
  /**
   * 控制按钮位置
   */
  controlsPosition?: "" | "right";
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 输入框尺寸
   */
  size?: "large" | "default" | "small";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  layout: "default",
  min: -Infinity,
  max: Infinity,
  step: 1,
  stepStrictly: false,
  precision: undefined,
  controls: true,
  controlsPosition: "",
  placeholder: "",
  disabled: false,
  size: "default"
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

/**
 * 处理change事件
 */
const handleChange = (value: number | number[]) => {
  emit("change", value);
};

/**
 * 处理focus事件
 */
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

/**
 * 处理blur事件
 */
const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};
</script>

<style lang="scss" scoped>
.sc-number-input {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 现代化的数字输入框样式
  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--el-box-shadow-lighter);

      &:hover {
        box-shadow: var(--el-box-shadow-light);
        transform: translateY(-1px);
      }

      &.is-focus {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
        transform: translateY(-2px);
      }
    }

    // 控制按钮美化
    .el-input-number__decrease,
    .el-input-number__increase {
      border-radius: 6px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--el-fill-color-lighter);

      &:hover {
        background: var(--el-color-primary);
        color: var(--el-text-color-primary);
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    // 右侧控制按钮样式
    &.is-controls-right {
      .el-input-number__decrease,
      .el-input-number__increase {
        border-radius: 4px;
        margin: 1px;

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }

  // 悬停效果
  &:hover {
    transform: translateY(-1px);
  }

  // 聚焦状态
  &:focus-within {
    transform: translateY(-2px);
  }

  // 禁用状态
  &.is-disabled {
    opacity: 0.6;
    transform: none !important;

    :deep(.el-input-number) {
      .el-input__wrapper {
        box-shadow: none !important;
        transform: none !important;
      }

      .el-input-number__decrease,
      .el-input-number__increase {
        transform: none !important;
        box-shadow: none !important;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    &:hover,
    &:focus-within {
      transform: none;
    }

    :deep(.el-input-number) {
      .el-input__wrapper {
        &:hover,
        &.is-focus {
          transform: none;
        }
      }
    }
  }
}
</style>
