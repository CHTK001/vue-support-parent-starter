<template>
  <el-input
    v-model="currentValue"
    class="sc-textarea-input"
    type="textarea"
    v-bind="$attrs"
    :rows="rows"
    :autosize="autosize"
    @update:modelValue="handleUpdate"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string;
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 最大输入长度
   */
  maxlength?: string | number;
  /**
   * 是否显示输入字数统计
   */
  showWordLimit?: boolean;
  /**
   * 输入框行数
   */
  rows?: number;
  /**
   * 自适应内容高度
   */
  autosize?: boolean | { minRows?: number; maxRows?: number };
  /**
   * 自动获取焦点
   */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  maxlength: undefined,
  showWordLimit: false,
  rows: 2,
  autosize: false,
  autofocus: false
});

const emit = defineEmits(["update:modelValue", "change", "input", "focus", "blur"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string) => {
  emit("update:modelValue", value);
};

/**
 * 处理change事件
 */
const handleChange = (value: string) => {
  emit("change", value);
};

/**
 * 处理input事件
 */
const handleInput = (value: string) => {
  emit("input", value);
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
.sc-textarea-input {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  :deep(.el-textarea__inner) {
    border: 2px solid var(--el-border-color-light);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    background-color: var(--el-bg-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    resize: vertical;
    box-shadow: var(--el-box-shadow-lighter);

    &:hover {
      border-color: var(--el-border-color);
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(-1px);
    }

    &:focus {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 4px var(--el-color-primary-light-9),
        0 4px 12px var(--el-color-primary-light-8);
      outline: none;
      transform: translateY(-1px);
    }

    &::placeholder {
      color: var(--el-text-color-placeholder);
      transition: color 0.3s ease;
    }

    &:focus::placeholder {
      color: var(--el-text-color-disabled);
    }
  }

  // 禁用状态
  &.is-disabled {
    :deep(.el-textarea__inner) {
      background-color: var(--el-fill-color-light);
      border-color: var(--el-border-color-light);
      color: var(--el-text-color-disabled);
      cursor: not-allowed;
      box-shadow: none;

      &:hover {
        border-color: var(--el-border-color-light);
        box-shadow: none;
        transform: none;
      }
    }
  }

  // 字数统计样式
  :deep(.el-input__count) {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 12px;
    color: var(--el-text-color-primary);
    backdrop-filter: blur(4px);
    border: 1px solid var(--el-border-color-lighter);
  }

  // 自适应高度动画
  &.autosize {
    :deep(.el-textarea__inner) {
      transition:
        all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        height 0.2s ease;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-textarea-input {
    :deep(.el-textarea__inner) {
      padding: 10px 12px;
      font-size: 16px; // 防止iOS缩放
      border-radius: 10px;
    }
  }
}

@media (max-width: 480px) {
  .sc-textarea-input {
    :deep(.el-textarea__inner) {
      padding: 8px 10px;
      border-radius: 8px;
    }
  }
}
</style>
