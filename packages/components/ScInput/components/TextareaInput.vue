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
import { computed } from 'vue';

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
  modelValue: '',
  placeholder: '',
  disabled: false,
  maxlength: undefined,
  showWordLimit: false,
  rows: 2,
  autosize: false,
  autofocus: false
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'input',
  'focus',
  'blur'
]);

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
};

/**
 * 处理change事件
 */
const handleChange = (value: string) => {
  emit('change', value);
};

/**
 * 处理input事件
 */
const handleInput = (value: string) => {
  emit('input', value);
};

/**
 * 处理focus事件
 */
const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

/**
 * 处理blur事件
 */
const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};
</script>

<style lang="scss" scoped>
.sc-textarea-input {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  :deep(.el-textarea__inner) {
    border: 2px solid #e4e7ed;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #303133;
    background-color: #ffffff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    resize: vertical;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    
    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    
    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1), 0 4px 12px rgba(64, 158, 255, 0.15);
      outline: none;
      transform: translateY(-1px);
    }
    
    &::placeholder {
      color: #a8abb2;
      transition: color 0.3s ease;
    }
    
    &:focus::placeholder {
      color: #c0c4cc;
    }
  }
  
  // 禁用状态
  &.is-disabled {
    :deep(.el-textarea__inner) {
      background-color: #f5f7fa;
      border-color: #e4e7ed;
      color: #c0c4cc;
      cursor: not-allowed;
      box-shadow: none;
      
      &:hover {
        border-color: #e4e7ed;
        box-shadow: none;
        transform: none;
      }
    }
  }
  
  // 字数统计样式
  :deep(.el-input__count) {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 12px;
    color: #909399;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(228, 231, 237, 0.6);
  }
  
  // 自适应高度动画
  &.autosize {
    :deep(.el-textarea__inner) {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease;
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