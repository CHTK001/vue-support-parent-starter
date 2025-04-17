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
}
</style> 