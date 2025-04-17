<template>
  <el-input-number
    v-model="currentValue"
    class="sc-number-input"
    v-bind="$attrs"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :controls="controls"
    :controls-position="controlsPosition"
    @update:modelValue="handleUpdate"
    @change="handleChange"
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
  modelValue?: number;
  /**
   * 最小值
   */
  min?: number;
  /**
   * 最大值
   */
  max?: number;
  /**
   * 步长
   */
  step?: number;
  /**
   * 是否只能输入步长的倍数
   */
  stepStrictly?: boolean;
  /**
   * 数值精度
   */
  precision?: number;
  /**
   * 是否使用控制按钮
   */
  controls?: boolean;
  /**
   * 控制按钮位置
   */
  controlsPosition?: '' | 'right';
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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: -Infinity,
  max: Infinity,
  step: 1,
  stepStrictly: false,
  precision: undefined,
  controls: true,
  controlsPosition: '',
  placeholder: '',
  disabled: false,
  size: 'default'
});

const emit = defineEmits([
  'update:modelValue',
  'change',
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
const handleUpdate = (value: number) => {
  emit('update:modelValue', value);
};

/**
 * 处理change事件
 */
const handleChange = (value: number) => {
  emit('change', value);
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
.sc-number-input {
  width: 100%;
}
</style> 