<template>
  <ElInput
    v-model="currentValue"
    class="sc-textarea-input"
    :class="{ 'is-disabled': disabled, autosize: !!autosize }"
    type="textarea"
    v-bind="$attrs"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :rows="rows"
    :autosize="autosize"
    :autofocus="autofocus"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput } from "element-plus";

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
  autofocus: false,
});

const emit = defineEmits([
  "update:modelValue",
  "change",
  "input",
  "focus",
  "blur",
]);

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
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
    min-height: 44px;
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    background: color-mix(in srgb, var(--el-fill-color-light) 74%, white);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    resize: vertical;
    box-shadow:
      inset 0 0 0 1px
        color-mix(in srgb, var(--el-border-color) 72%, transparent),
      0 10px 20px rgba(15, 23, 42, 0.04);

    &:hover {
      box-shadow:
        inset 0 0 0 1px
          color-mix(in srgb, var(--el-color-primary) 24%, transparent),
        0 14px 24px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }

    &:focus {
      background: color-mix(in srgb, var(--el-color-primary) 6%, white);
      box-shadow:
        inset 0 0 0 1px
          color-mix(in srgb, var(--el-color-primary) 42%, transparent),
        0 16px 30px rgba(var(--el-color-primary-rgb), 0.14);
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
      color: var(--el-text-color-disabled);
      cursor: not-allowed;
      box-shadow: inset 0 0 0 1px
        color-mix(in srgb, var(--el-border-color) 56%, transparent);

      &:hover {
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
