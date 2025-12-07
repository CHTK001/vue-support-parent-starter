<template>
  <div class="sc-number-default" :class="[`sc-number-default--${size}`]">
    <el-input-number
      v-model="currentValue"
      class="sc-number-default__input"
      v-bind="$attrs"
      :min="min"
      :max="max"
      :step="step"
      :step-strictly="stepStrictly"
      :precision="precision"
      :disabled="disabled"
      :controls="controls"
      :controls-position="controlsPosition"
      :placeholder="placeholder"
      :size="size"
      :readonly="readonly"
      :name="name"
      :id="id"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
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
   * 是否只能输入步长的倍数
   */
  stepStrictly?: boolean;
  /**
   * 数值精度
   */
  precision?: number;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 是否使用控制按钮
   */
  controls?: boolean;
  /**
   * 控制按钮位置
   */
  controlsPosition?: "" | "right";
  /**
   * 占位文本
   */
  placeholder?: string;
  /**
   * 尺寸
   */
  size?: "large" | "default" | "small";
  /**
   * 是否只读
   */
  readonly?: boolean;
  /**
   * 原生 name 属性
   */
  name?: string;
  /**
   * 原生 id 属性
   */
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: -Infinity,
  max: Infinity,
  step: 1,
  stepStrictly: false,
  precision: undefined,
  disabled: false,
  controls: true,
  controlsPosition: "",
  placeholder: "",
  size: "default",
  readonly: false,
  name: "",
  id: ""
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const handleChange = (value: number | undefined) => {
  emit("change", value);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};
</script>

<style lang="scss" scoped>
.sc-number-default {
  width: 100%;
  display: inline-flex;

  &__input {
    width: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    // 现代化的数字输入框样式
    :deep(.el-input__wrapper) {
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      &.is-focus {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      }
    }

    // 控制按钮美化
    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
      border-radius: 6px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--el-fill-color-lighter);

      &:hover:not(.is-disabled) {
        background: var(--el-color-primary);
        color: #fff;
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
      }

      &:active:not(.is-disabled) {
        transform: scale(0.95);
      }

      &.is-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    // 右侧控制按钮样式
    &.is-controls-right {
      :deep(.el-input-number__decrease),
      :deep(.el-input-number__increase) {
        border-radius: 4px;
        margin: 1px;
      }
    }
  }

  // 禁用状态
  &.is-disabled {
    .sc-number-default__input {
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
      }

      :deep(.el-input-number__decrease),
      :deep(.el-input-number__increase) {
        transform: none !important;
        box-shadow: none !important;
      }
    }
  }
}
</style>
