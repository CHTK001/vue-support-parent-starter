<template>
  <div class="sc-color-picker">
    <el-color-picker
      v-model="innerValue"
      :disabled="disabled"
      :show-alpha="showAlpha"
      :predefine="predefineColors"
      class="color-picker"
    />
    
    <el-input
      v-model="innerValue"
      :disabled="disabled"
      :placeholder="placeholder"
      class="color-input"
    >
      <template #prefix>
        <div class="color-preview" :style="{ backgroundColor: innerValue }"></div>
      </template>
    </el-input>
  </div>
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
  showAlpha?: boolean;           // 是否显示透明度选择
  predefineColors?: string[];    // 预定义颜色
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '#409EFF',
  disabled: false,
  placeholder: '请选择颜色',
  showAlpha: true,
  predefineColors: () => [
    '#ff4500', '#ff8c00', '#ffd700', '#90ee90', '#00ced1', 
    '#1e90ff', '#c71585', '#000000', '#545c64', '#409EFF',
    '#13CE66', '#F7BA2A', '#FF4949', '#69C0FF', '#B3C0D1'
  ]
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
.sc-color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .color-picker {
    margin-right: 10px;
  }
  
  .color-input {
    flex: 1;
    
    .color-preview {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color-lighter);
    }
  }
}
</style> 