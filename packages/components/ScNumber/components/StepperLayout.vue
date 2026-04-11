<template>
  <div
    class="sc-number-stepper"
    :class="[
      `sc-number-stepper--${size}`,
      { 'sc-number-stepper--disabled': disabled },
    ]"
  >
    <!-- 减少按钮 -->
    <button
      class="sc-number-stepper__btn sc-number-stepper__btn--decrease"
      :class="{ 'is-disabled': isMinDisabled }"
      :disabled="disabled || isMinDisabled"
      @click="decrease"
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
        <path d="M19 13H5v-2h14v2z" />
      </svg>
    </button>

    <!-- 数值显示 -->
    <div v-if="showValue" class="sc-number-stepper__value">
      <input
        v-if="!readonly"
        type="text"
        class="sc-number-stepper__input"
        :value="displayValue"
        :disabled="disabled"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.up.prevent="increase"
        @keydown.down.prevent="decrease"
      />
      <span v-else class="sc-number-stepper__text">{{ displayValue }}</span>
    </div>

    <!-- 增加按钮 -->
    <button
      class="sc-number-stepper__btn sc-number-stepper__btn--increase"
      :class="{ 'is-disabled': isMaxDisabled }"
      :disabled="disabled || isMaxDisabled"
      @click="increase"
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

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
   * 数值精度
   */
  precision?: number;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 尺寸
   */
  size?: "large" | "default" | "small";
  /**
   * 控制按钮位置（保留兼容性）
   */
  controlsPosition?: "" | "right";
  /**
   * 占位文本
   */
  placeholder?: string;
  /**
   * 是否只读
   */
  readonly?: boolean;
  /**
   * 是否显示数值
   */
  showValue?: boolean;
  /**
   * 数值格式化函数
   */
  valueFormat?: (val: number) => string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: -Infinity,
  max: Infinity,
  step: 1,
  precision: undefined,
  disabled: false,
  size: "default",
  controlsPosition: "",
  placeholder: "",
  readonly: false,
  showValue: true,
  valueFormat: undefined,
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

// 内部值
const internalValue = ref(props.modelValue);

// 是否达到最小值
const isMinDisabled = computed(() => {
  return internalValue.value <= props.min;
});

// 是否达到最大值
const isMaxDisabled = computed(() => {
  return internalValue.value >= props.max;
});

// 显示值
const displayValue = computed(() => {
  if (props.valueFormat) {
    return props.valueFormat(internalValue.value);
  }
  if (props.precision !== undefined) {
    return internalValue.value.toFixed(props.precision);
  }
  return String(internalValue.value);
});

// 格式化精度
const toPrecision = (num: number): number => {
  if (props.precision !== undefined) {
    return parseFloat(num.toFixed(props.precision));
  }
  return num;
};

// 设置新值
const setNewValue = (newVal: number) => {
  let value = toPrecision(newVal);

  // 边界检查
  if (value >= props.max) {
    value = props.max;
  }
  if (value <= props.min) {
    value = props.min;
  }

  internalValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
};

// 增加
const increase = () => {
  if (props.disabled || isMaxDisabled.value) return;
  const newVal = toPrecision(internalValue.value + props.step);
  setNewValue(newVal);
};

// 减少
const decrease = () => {
  if (props.disabled || isMinDisabled.value) return;
  const newVal = toPrecision(internalValue.value - props.step);
  setNewValue(newVal);
};

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = parseFloat(target.value);
  if (!isNaN(value)) {
    setNewValue(value);
  }
};

// 处理焦点
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

// 处理失焦
const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

// 监听外部值变化
defineExpose({
  increase,
  decrease,
});
</script>

<style lang="scss" scoped>
.sc-number-stepper {
  display: inline-flex;
  align-items: center;
  width: 100%;
  gap: 4px;
  min-height: 32px;
  background: color-mix(in srgb, var(--el-fill-color-light) 80%, white);
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  padding: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    0 10px 24px rgba(15, 23, 42, 0.05);

  &:hover:not(.sc-number-stepper--disabled) {
    box-shadow:
      inset 0 0 0 1px
        color-mix(in srgb, var(--el-color-primary) 16%, transparent),
      0 14px 28px rgba(15, 23, 42, 0.08);
  }

  // 按钮样式
  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 10px;
    background: var(--el-bg-color);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    svg {
      transition: transform 0.3s ease;
    }

    &:hover:not(.is-disabled) {
      background: var(--el-color-primary);
      color: #fff;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

      svg {
        transform: scale(1.1);
      }
    }

    &:active:not(.is-disabled) {
      transform: scale(0.95);
    }

    &.is-disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: var(--el-fill-color-lighter);
    }
  }

  // 数值显示区域
  &__value {
    flex: 1;
    min-width: 0;
    min-height: 28px;
    text-align: center;
  }

  &__input {
    width: 100%;
    min-height: 28px;
    border: none;
    background: transparent;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    outline: none;
    padding: 2px 8px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:focus {
      background: var(--el-bg-color);
      box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
    }

    &:disabled {
      cursor: not-allowed;
      color: var(--el-text-color-disabled);
    }

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding: 4px 8px;
  }

  // 尺寸变体
  &--large {
    padding: 6px;
    border-radius: 14px;
    min-height: 46px;

    .sc-number-stepper__btn {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      font-size: 18px;
    }

    .sc-number-stepper__value {
      min-width: 0;
    }

    .sc-number-stepper__input,
    .sc-number-stepper__text {
      font-size: 16px;
    }
  }

  &--small {
    padding: 3px;
    border-radius: 10px;
    min-height: 34px;

    .sc-number-stepper__btn {
      width: 24px;
      height: 24px;
      border-radius: 8px;
      font-size: 14px;
    }

    .sc-number-stepper__value {
      min-width: 0;
    }

    .sc-number-stepper__input,
    .sc-number-stepper__text {
      font-size: 13px;
    }
  }

  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none !important;
    transform: none !important;

    .sc-number-stepper__btn {
      cursor: not-allowed;
    }
  }
}
</style>
