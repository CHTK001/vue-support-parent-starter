<template>
  <div class="sc-select-input-wrapper" :class="{ 'is-invalid': !validationResult.valid, 'is-loading': loading }">
    <div class="sc-select-input-container" :class="{ 'is-disabled': disabled }">
      <el-select
        ref="selectRef"
        v-model="innerValue"
        class="sc-select-input"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable && !disabled"
        :filterable="filterable"
        :multiple="multiple"
        :collapse-tags="collapseTags"
        :collapse-tags-tooltip="collapseTagsTooltip"
        :max-collapse-tags="maxCollapseTags"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @clear="handleClear"
        @visible-change="handleVisibleChange"
      >
        <template #prefix v-if="showPrefix && (prefixIcon || actualPrefixIcon)">
          <IconifyIconOnline :icon="prefixIcon || actualPrefixIcon" class="sc-select-input__prefix-icon" />
        </template>
        
        <!-- 批量操作按钮 -->
        <el-option v-if="multiple && showBatchActions && options.length > 1" :value="'__actions__'" :disabled="true" class="select-actions-option">
          <div class="select-actions-container" @click.stop>
            <div class="select-action-title">
              <el-button type="primary" plain size="small" @click.stop="handleSelectAll">
                <IconifyIconOnline icon="ep:select" />
                <span>全选</span>
              </el-button>
              <el-button type="info" plain size="small" @click.stop="handleInvertSelection">
                <IconifyIconOnline icon="ep:refresh-right" />
                <span>反选</span>
              </el-button>
              <el-button type="danger" plain size="small" @click.stop="handleClearSelection">
                <IconifyIconOnline icon="ep:delete" />
                <span>清空</span>
              </el-button>
            </div>
          </div>
        </el-option>
        
        <!-- 选项列表 -->
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
        >
          <div class="select-option-content">
            <IconifyIconOnline v-if="item.icon" :icon="item.icon" class="select-option-icon" />
            <span>{{ item.label }}</span>
          </div>
        </el-option>
      </el-select>
    </div>
    
    <div v-if="!validationResult.valid && showValidationMsg" class="sc-select-input__error">
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
  icon?: string;
  [key: string]: any;
};

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string | number | string[] | number[];
  /**
   * 选择框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 选择框前缀图标
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
   * 选项数据
   */
  options?: OptionItem[];
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
   * 是否可过滤搜索
   */
  filterable?: boolean;
  /**
   * 是否多选
   */
  multiple?: boolean;
  /**
   * 多选时是否将选中值按文字的形式展示
   */
  collapseTags?: boolean;
  /**
   * 多选时是否显示选中标签的提示
   */
  collapseTagsTooltip?: boolean;
  /**
   * 多选时最多显示的标签数量
   */
  maxCollapseTags?: number;
  /**
   * 多选时是否显示批量操作按钮
   */
  showBatchActions?: boolean;
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
  placeholder: '请选择',
  disabled: false,
  prefixIcon: '',
  showPrefix: true,
  clearable: true,
  options: () => [],
  rules: () => ({}),
  showValidationMsg: true,
  filterable: true,
  multiple: false,
  collapseTags: true,
  collapseTagsTooltip: true,
  maxCollapseTags: 2,
  showBatchActions: true,
  fetchMethod: undefined,
  loading: false
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'focus',
  'blur',
  'clear',
  'visible-change'
]);

const selectRef = ref<any>(null);
const innerValue = ref<any>(props.modelValue);
const localLoading = ref(false);

// 实际使用的前缀图标，优先使用自定义图标，否则使用默认图标
const actualPrefixIcon = computed(() => {
  // 用户传入的图标优先级最高
  if (props.prefixIcon) {
    return props.prefixIcon;
  }
  // 其次使用类型对应的默认图标
  return getDefaultIcon('select');
});

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

// 获取数据
const fetchData = async () => {
  if (!props.fetchMethod) return;
  
  try {
    localLoading.value = true;
    const data = await props.fetchMethod();
    if (data !== undefined) {
      if (Array.isArray(data) && data.length > 0) {
        // 如果返回的是数组，且当前没有选中值，可以选择第一项
        if (!innerValue.value || (Array.isArray(innerValue.value) && innerValue.value.length === 0)) {
          // 可以选择不自动选中第一项
          // innerValue.value = props.multiple ? [data[0].value] : data[0].value;
          // emit('update:modelValue', innerValue.value);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    localLoading.value = false;
  }
};

// 全选
const handleSelectAll = () => {
  if (!props.multiple) return;
  
  const allValues = props.options.map(item => item.value).filter(value => {
    // 过滤掉禁用的选项
    const option = props.options.find(opt => opt.value === value);
    return !option?.disabled;
  });
  
  innerValue.value = allValues;
  emit('update:modelValue', allValues);
  validateValue();
};

// 反选
const handleInvertSelection = () => {
  if (!props.multiple || !Array.isArray(innerValue.value)) return;
  
  const currentValues = innerValue.value;
  const invertedValues = props.options
    .filter(item => !item.disabled) // 过滤掉禁用的选项
    .map(item => item.value)
    .filter(value => !currentValues.includes(value));
  
  innerValue.value = invertedValues;
  emit('update:modelValue', invertedValues);
  validateValue();
};

// 清空选择
const handleClearSelection = () => {
  if (!props.multiple) return;
  
  innerValue.value = [];
  emit('update:modelValue', []);
  validateValue();
};

// 处理变更
function handleChange(value: any) {
  if (props.disabled) return;
  
  // 过滤掉批量操作按钮值
  if (Array.isArray(value)) {
    innerValue.value = value.filter(v => v !== '__actions__');
  } else {
    innerValue.value = value;
  }
  
  emit('update:modelValue', innerValue.value);
  emit('change', innerValue.value);
  validateValue();
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
  
  innerValue.value = props.multiple ? [] : '';
  emit('update:modelValue', innerValue.value);
  emit('change', innerValue.value);
  emit('clear');
  validationResult.value = { valid: true, message: '' };
}

// 处理下拉框显示状态变化
function handleVisibleChange(visible: boolean) {
  emit('visible-change', visible);
}

// 校验值
function validateValue() {
  if (props.disabled) return;
  
  if (props.rules) {
    validationResult.value = validate(innerValue.value, props.rules);
  }
}

// 初始化
onMounted(() => {
  innerValue.value = props.modelValue;
  
  if ((!props.modelValue || 
      (Array.isArray(props.modelValue) && props.modelValue.length === 0)) && 
      props.fetchMethod) {
    // 如果没有初始值但有获取数据的方法，则加载数据
    fetchData();
  }
  
  validateValue();
});

// 对外暴露方法
defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur(),
  fetchData
});
</script>

<style lang="scss" scoped>
.sc-select-input-wrapper {
  width: 100%;
  
  &.is-invalid {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
    }
    
    :deep(.el-select .el-input.is-focus .el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
    }
  }
}

.sc-select-input-container {
  display: flex;
  align-items: center;
  
  &.is-disabled {
    .sc-select-input__prefix-icon {
      color: var(--el-disabled-text-color);
    }
  }
}

.sc-select-input__prefix-icon {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
  margin-left: 8px;
}

.sc-select-input__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  margin-left: 1px;
}

.sc-select-input {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}

.select-actions-option {
  :deep(.el-select-dropdown__item) {
    height: auto;
    padding: 0;
  }
}

.select-actions-container {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.select-action-title {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.select-option-content {
  display: flex;
  align-items: center;
  
  .select-option-icon {
    margin-right: 8px;
    font-size: 16px;
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