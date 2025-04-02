<template>
  <el-input
    v-model="innerValue"
    type="textarea"
    :rows="rows"
    :disabled="disabled"
    :placeholder="placeholder"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    class="sc-textarea-input"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * 组件属性定义
 */
interface Props {
  modelValue: string;            // 绑定值
  disabled?: boolean;            // 是否禁用
  placeholder?: string;          // 占位文本
  rows?: number;                 // 文本域行数
  maxlength?: number;            // 最大长度
  showWordLimit?: boolean;       // 是否显示字数统计
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  placeholder: '请输入文本内容',
  rows: 5,
  maxlength: -1,
  showWordLimit: true
});

/**
 * 组件事件定义
 */
const emit = defineEmits(['update:modelValue']);

/**
 * 内部值，用于双向绑定
 */
const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});
</script>

<style lang="scss">
.sc-textarea-input {
  .el-textarea__inner {
    transition: all 0.3s;
    resize: vertical;
    min-height: 120px;
    
    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
    }
    
    &:focus {
      box-shadow: 0 0 0 1px var(--el-color-primary);
    }
  }
  
  .el-input__count {
    background: transparent;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style> 