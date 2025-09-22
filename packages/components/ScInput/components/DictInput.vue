<template>
  <el-select
    v-model="currentValue"
    class="sc-dict-input"
    v-bind="$attrs"
    :remote="true"
    :remote-method="queryDict"
    @update:modelValue="handleUpdate"
    @change="handleChange"
    @visible-change="handleVisibleChange"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
  >
    <el-option
      v-for="(option, index) in dictList"
      :key="index"
      :label="option[dictOptionName]"
      :value="option[dictOptionId]"
    />
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </el-select>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { fetchListDictItem } from '@repo/core';

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
   * 输入框尺寸
   */
  size?: 'large' | 'default' | 'small';
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 字典ID
   */
  dictId?: string;
  /**
   * 字典名称字段
   */
  dictOptionName?: string;
  /**
   * 字典编码字段
   */
  dictOptionId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择',
  disabled: false,
  size: 'default',
  clearable: true,
  dictId: '',
  dictOptionName: 'sysDictItemName',
  dictOptionId: 'sysDictItemCode'
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'visible-change',
  'focus',
  'blur',
  'clear'
]);

// 字典列表
const dictList = ref<any[]>([]);

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

/**
 * 查询字典
 */
const queryDict = async (value: string) => {
  if (!props.dictId) return;
  
  try {
    const { data } = await fetchListDictItem({
      sysDictId: props.dictId,
      sysDictItemCode: value,
    });
    
    if (data) {
      dictList.value = data;
    }
  } catch (error) {
    console.error('Query dictionary error:', error);
  }
};

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string | number) => {
  emit('update:modelValue', value);
};

/**
 * 处理change事件
 */
const handleChange = (value: string | number) => {
  emit('change', value);
};

/**
 * 处理visible-change事件
 */
const handleVisibleChange = (visible: boolean) => {
  emit('visible-change', visible);
  
  // 当下拉框显示时，加载字典数据
  if (visible && dictList.value.length === 0) {
    queryDict('');
  }
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
</script>

<style lang="scss" scoped>
.sc-dict-input {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  // 现代化的字典选择器样式
  :deep(.el-select__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
    
    &.is-focus {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      transform: translateY(-2px);
    }
  }
  
  // 下拉箭头美化
  :deep(.el-select__caret) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.2);
    }
  }
  
  // 悬停效果
  &:hover {
    transform: translateY(-1px);
  }
  
  // 聚焦状态
  &:focus-within {
    transform: translateY(-2px);
  }
  
  // 禁用状态
  &.is-disabled {
    opacity: 0.6;
    transform: none !important;
    
    :deep(.el-select__wrapper) {
      box-shadow: none !important;
      transform: none !important;
    }
  }
}

// 下拉面板美化
:deep(.el-select-dropdown) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-lighter);
  backdrop-filter: blur(8px);
  
  .el-select-dropdown__item {
    border-radius: 6px;
    margin: 2px 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    }
    
    &.selected {
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: var(--el-text-color-primary);
      font-weight: 600;
      
      &:hover {
        background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-dict-input {
    &:hover,
    &:focus-within {
      transform: none;
    }
    
    :deep(.el-select__wrapper) {
      &:hover,
      &.is-focus {
        transform: none;
      }
    }
  }
}
</style>