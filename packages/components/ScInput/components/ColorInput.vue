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
}
</style> 