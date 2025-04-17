<template>
  <div class="sc-text-input-wrapper" :class="{ 'is-invalid': !validationResult.valid, 'is-loading': loading }">
    <div class="sc-text-input-container" :class="{ 'is-disabled': disabled }">
      <el-input
        ref="inputRef"
        v-model="innerValue"
        :type="type"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable && !disabled"
        :show-password="type === 'password'"
        :maxlength="maxlength"
        :show-word-limit="showWordLimit"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @clear="handleClear"
      >
        <template #prefix v-if="showPrefix && (prefixIcon || actualPrefixIcon)">
          <IconifyIconOnline :icon="prefixIcon || actualPrefixIcon" class="sc-text-input__prefix-icon" />
        </template>
        <template #suffix v-if="maxlength && !showWordLimit && hasValue && !disabled">
          <span class="sc-text-input__word-count">{{ currentLength }}/{{ maxlength }}</span>
        </template>
        <template #suffix v-if="loading">
          <IconifyIconOnline icon="ep:loading" class="is-loading" />
        </template>
      </el-input>
    </div>
    
    <div v-if="!validationResult.valid && showValidationMsg" class="sc-text-input__error">
      {{ validationResult.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { validate } from '../validation';
import { getDefaultIcon } from '../defaultIcons';
import { IconifyIconOnline } from '../../ReIcon';

export type OptionItem = {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
  [key: string]: any;
};

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string | number;
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 输入框前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 输入框类型
   */
  type?: string;
  /**
   * 最大输入长度
   */
  maxlength?: number;
  /**
   * 是否显示字数统计
   */
  showWordLimit?: boolean;
  /**
   * 校验规则
   */
  rules?: {
    required?: boolean;
    type?: string;
    message?: string;
    validator?: (value: any) => boolean | { valid: boolean; message: string };
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  /**
   * 是否显示校验消息
   */
  showValidationMsg?: boolean;
  /**
   * 选项数据
   */
  options?: OptionItem[];
  /**
   * 数据获取函数
   */
  fetchMethod?: () => Promise<any>;
  /**
   * 是否正在加载
   */
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  prefixIcon: '',
  showPrefix: true,
  clearable: true,
  type: 'text',
  maxlength: undefined,
  showWordLimit: false,
  rules: () => ({}),
  showValidationMsg: true,
  options: () => [],
  fetchMethod: undefined,
  loading: false
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'input',
  'focus',
  'blur',
  'clear'
]);

const inputRef = ref<any>(null);
const innerValue = ref<string | number>(props.modelValue);
const localLoading = ref(false);

// 实际使用的前缀图标，优先使用自定义图标，否则使用默认图标
const actualPrefixIcon = computed(() => {
  // 用户传入的图标优先级最高
  if (props.prefixIcon) {
    return props.prefixIcon;
  }
  // 其次使用类型对应的默认图标
  return getDefaultIcon(props.type);
});

const hasValue = computed(() => {
  return innerValue.value !== '' && innerValue.value !== undefined && innerValue.value !== null;
});

const currentLength = computed(() => {
  if (typeof innerValue.value === 'string') {
    return innerValue.value.length;
  } else if (innerValue.value !== null && innerValue.value !== undefined) {
    return String(innerValue.value).length;
  }
  return 0;
});

// 获取选项值的文本
const getOptionLabel = (value: string | number) => {
  const option = props.options.find(opt => opt.value === value);
  return option ? option.label : value;
};

// 数据校验结果
const validationResult = ref<{ valid: boolean; message: string }>({ valid: true, message: '' });

// 是否正在加载
const loading = computed(() => props.loading || localLoading.value);

// 监听模型值变化
watch(() => props.modelValue, (newVal) => {
  innerValue.value = newVal;
  validateValue();
}, { immediate: true });

// 监听值变化
watch(innerValue, (newVal) => {
  if (!props.disabled) {
    emit('update:modelValue', newVal);
    validateValue();
  }
});

// 监听禁用状态变化
watch(() => props.disabled, (newVal) => {
  if (newVal && validationResult.value.valid === false) {
    // 如果禁用状态，则不显示错误
    validationResult.value = { valid: true, message: '' };
  } else if (!newVal) {
    // 恢复启用状态时，重新校验
    validateValue();
  }
});

// 监听选项变化
watch(() => props.options, (newOptions) => {
  // 如果当前值不在新选项中，可以在这里处理
  if (Array.isArray(newOptions) && newOptions.length > 0 && innerValue.value) {
    const found = newOptions.some(option => option.value === innerValue.value);
    if (!found) {
      // 可以选择重置值或选择第一个选项
      // innerValue.value = newOptions[0].value;
      // emit('update:modelValue', innerValue.value);
    }
  }
}, { deep: true });

// 获取数据
const fetchData = async () => {
  if (!props.fetchMethod) return;
  
  try {
    localLoading.value = true;
    const data = await props.fetchMethod();
    if (data !== undefined) {
      // 处理返回数据可能是值或选项的情况
      if (typeof data === 'string' || typeof data === 'number') {
        innerValue.value = data;
      } else if (Array.isArray(data)) {
        // 返回的是选项数组，可以选择第一个作为值
        if (data.length > 0 && !innerValue.value) {
          innerValue.value = data[0].value;
        }
      } else if (data && typeof data === 'object' && data.value !== undefined) {
        // 返回的是包含值的对象
        innerValue.value = data.value;
      }
      
      emit('update:modelValue', innerValue.value);
      validateValue();
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    localLoading.value = false;
  }
};

// 初始化
onMounted(() => {
  innerValue.value = props.modelValue;
  
  if ((props.modelValue === undefined || props.modelValue === '' || props.modelValue === null) && props.fetchMethod) {
    // 如果没有初始值但有获取数据的方法，则加载数据
    fetchData();
  }
  
  validateValue();
});

// 处理输入
function handleInput(value: string | number) {
  if (!props.disabled) {
    innerValue.value = value;
    emit('input', value);
  }
}

// 处理变更
function handleChange(value: string | number) {
  if (!props.disabled) {
    emit('change', value);
  }
}

// 处理焦点
function handleFocus(event: FocusEvent) {
  if (!props.disabled) {
    emit('focus', event);
  }
}

// 处理失焦
function handleBlur(event: FocusEvent) {
  if (!props.disabled) {
    validateValue();
    emit('blur', event);
  }
}

// 处理清空
function handleClear() {
  if (props.disabled) return;
  
  innerValue.value = '';
  emit('update:modelValue', '');
  emit('change', '');
  emit('clear');
  validationResult.value = { valid: true, message: '' };
}

// 校验值
function validateValue() {
  if (props.disabled) return;
  
  if (props.rules) {
    validationResult.value = validate(innerValue.value, props.rules);
  }
}

// 对外暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  fetchData
});
</script>

<style lang="scss" scoped>
.sc-text-input-wrapper {
  width: 100%;
  
  &.is-invalid {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
    }
  }
}

.sc-text-input-container {
  display: flex;
  align-items: center;
  
  &.is-disabled {
    .sc-text-input__prefix-icon {
      color: var(--el-disabled-text-color);
    }
  }
}

.sc-text-input__prefix-icon {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

.sc-text-input__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  margin-left: 1px;
}

.sc-text-input__word-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: 2px;
}

:deep(.el-input__wrapper.is-disabled) {
  .el-input__inner {
    -webkit-text-fill-color: var(--el-disabled-text-color);
  }
}

.is-loading {
  color: var(--el-text-color-secondary);
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 