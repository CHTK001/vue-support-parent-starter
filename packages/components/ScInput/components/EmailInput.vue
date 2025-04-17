<template>
  <el-autocomplete
    v-model="currentValue"
    class="sc-email-input"
    type="email"
    v-bind="$attrs"
    :fetch-suggestions="queryEmail"
    :trigger-on-focus="false"
    @update:modelValue="handleUpdate"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
    @select="handleSelect"
  >
    <template #prefix v-if="showPrefix">
      <IconifyIconOnline :icon="prefixIcon || defaultPrefixIcon" class="sc-email-input__prefix-icon" />
    </template>
    <template v-for="(_, name) in $slots" v-if="name !== 'prefix'" #[name]="slotData" :key="name">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </el-autocomplete>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { queryEmail } from '@repo/utils';
import { IconifyIconOnline } from '@repo/components/ReIcon';
import { getDefaultIcon } from '../defaultIcons';

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
   * 输入框尺寸
   */
  size?: 'large' | 'default' | 'small';
  /**
   * 输入框前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 输入框后缀图标
   */
  suffixIcon?: string;
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 自动获取焦点
   */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入邮箱地址',
  disabled: false,
  maxlength: undefined,
  showWordLimit: false,
  size: 'default',
  prefixIcon: '',
  showPrefix: true,
  suffixIcon: '',
  clearable: true,
  autofocus: false
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'input',
  'focus',
  'blur',
  'clear',
  'select'
]);

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 默认前缀图标
const defaultPrefixIcon = computed(() => getDefaultIcon('email'));

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

/**
 * 处理clear事件
 */
const handleClear = () => {
  emit('clear');
};

/**
 * 处理select事件
 */
const handleSelect = (item: any) => {
  emit('select', item);
};
</script>

<style lang="scss" scoped>
.sc-email-input {
  width: 100%;
  
  &__prefix-icon {
    color: var(--el-text-color-placeholder);
    font-size: 16px;
  }
}
</style> 