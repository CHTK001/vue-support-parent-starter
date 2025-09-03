<template>
  <el-color-picker
    v-model="currentValue"
    class="sc-color-input"
    v-bind="$attrs"
    :show-alpha="showAlpha"
    :color-format="colorFormat"
    @update:modelValue="handleUpdate"
    @change="handleChange"
    @active-change="handleActiveChange"
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
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 尺寸
   */
  size?: 'large' | 'default' | 'small';
  /**
   * 是否支持透明度选择
   */
  showAlpha?: boolean;
  /**
   * 颜色的格式
   */
  colorFormat?: 'hsl' | 'hsv' | 'hex' | 'rgb';
  /**
   * 预定义颜色
   */
  predefine?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  size: 'default',
  showAlpha: false,
  colorFormat: 'hex',
  predefine: undefined
});

const emit = defineEmits([
  'update:modelValue',
  'change',
  'active-change'
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
 * 处理active-change事件
 */
const handleActiveChange = (value: string) => {
  emit('active-change', value);
};
</script>

<style lang="scss" scoped>
.sc-color-input {
  // 保持与其他输入组件的一致性
  vertical-align: middle;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  // 现代化的颜色选择器样式
  :deep(.el-color-picker__trigger) {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid var(--el-border-color-lighter);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: var(--el-color-primary);
    }
    
    &:focus {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
      border-color: var(--el-color-primary);
    }
  }
  
  // 颜色显示区域美化
  :deep(.el-color-picker__color) {
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 6px;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
      pointer-events: none;
    }
  }
  
  // 禁用状态
  &.is-disabled {
    :deep(.el-color-picker__trigger) {
      opacity: 0.6;
      transform: none !important;
      box-shadow: none !important;
      cursor: not-allowed;
    }
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    :deep(.el-color-picker__trigger) {
      &:hover,
      &:focus {
        transform: none;
      }
    }
  }
}
</style>