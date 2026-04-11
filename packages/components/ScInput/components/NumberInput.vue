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
  modelValue?: number | string;
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
  size: "default",
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

const currentValue = computed({
  get: () => {
    if (props.modelValue === "" || props.modelValue == null) {
      return undefined;
    }

    if (typeof props.modelValue === "string") {
      const parsedValue = Number(props.modelValue);
      return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }

    return props.modelValue;
  },
  set: (val) =>
    emit(
      "update:modelValue",
      typeof props.modelValue === "string" ? String(val ?? "") : val,
    ),
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
  :deep(.el-input-number) {
    --sc-number-height: var(--el-component-size, 32px);
    width: 100%;
    min-height: var(--sc-number-height);
    border-radius: 12px;
    background: transparent;
    --el-input-number-controls-height: 16px;

    .el-input__wrapper {
      min-height: var(--sc-number-height);
      padding-inline: 12px 44px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--el-fill-color-light) 74%, white);
      box-shadow:
        inset 0 0 0 1px
          color-mix(in srgb, var(--el-border-color) 72%, transparent),
        0 10px 20px rgba(15, 23, 42, 0.04);
      transition:
        box-shadow 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease;

      &:hover {
        box-shadow:
          inset 0 0 0 1px
            color-mix(in srgb, var(--el-color-primary) 24%, transparent),
          0 14px 24px rgba(15, 23, 42, 0.08);
      }

      &.is-focus {
        background: color-mix(in srgb, var(--el-color-primary) 6%, white);
        box-shadow:
          inset 0 0 0 1px
            color-mix(in srgb, var(--el-color-primary) 42%, transparent),
          0 16px 30px rgba(var(--el-color-primary-rgb), 0.14);
      }
    }

    .el-input-number__decrease,
    .el-input-number__increase {
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 8px;
      background: color-mix(in srgb, var(--el-fill-color-light) 82%, white);
      color: var(--el-text-color-secondary);
      transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        background: color-mix(in srgb, var(--el-color-primary) 14%, white);
        color: var(--el-color-primary);
        box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.12);
      }
    }

    &.is-controls-right {
      .el-input-number__decrease,
      .el-input-number__increase {
        right: 8px;
        left: auto;
      }

      .el-input-number__decrease {
        bottom: 8px;
      }

      .el-input-number__increase {
        top: 8px;
      }
    }

    &:not(.is-controls-right) {
      .el-input-number__decrease,
      .el-input-number__increase {
        top: 50%;
        transform: translateY(-50%);
      }

      .el-input-number__decrease {
        left: 10px;
      }

      .el-input-number__increase {
        right: 10px;
      }

      .el-input__wrapper {
        padding-inline: 38px;
      }
    }
  }
}
</style>
