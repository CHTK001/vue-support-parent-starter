<template>
  <div class="sc-select-position-layout">
    <div class="position-grid">
      <!-- Top Row -->
      <div 
        class="position-cell top-left" 
        :class="{ active: modelValue === 'top-left', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('top-left')" 
        title="左上"
      ></div>
      <div 
        class="position-cell top-center" 
        :class="{ active: modelValue === 'top-center', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('top-center')" 
        title="中上"
      ></div>
      <div 
        class="position-cell top-right" 
        :class="{ active: modelValue === 'top-right', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('top-right')" 
        title="右上"
      ></div>
      
      <!-- Middle Row -->
      <div 
        class="position-cell left-center" 
        :class="{ active: modelValue === 'left-center', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('left-center')" 
        title="左中"
      ></div>
      <div class="position-cell center-disabled"></div>
      <div 
        class="position-cell right-center" 
        :class="{ active: modelValue === 'right-center', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('right-center')" 
        title="右中"
      ></div>
      
      <!-- Bottom Row -->
      <div 
        class="position-cell bottom-left" 
        :class="{ active: modelValue === 'bottom-left', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('bottom-left')" 
        title="左下"
      ></div>
      <div 
        class="position-cell bottom-center" 
        :class="{ active: modelValue === 'bottom-center', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('bottom-center')" 
        title="中下"
      ></div>
      <div 
        class="position-cell bottom-right" 
        :class="{ active: modelValue === 'bottom-right', 'is-disabled': disabled }" 
        @click="!disabled && handleSelect('bottom-right')" 
        title="右下"
      ></div>
      
      <!-- Screen Content Mockup -->
      <div class="screen-content-mock"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const handleSelect = (value: string) => {
  if (props.disabled) return;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped lang="scss">
.sc-select-position-layout {
  display: flex;
  justify-content: center;
  padding: 4px;
  
  .position-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    gap: 4px;
    width: 90px;
    height: 70px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 4px;
    position: relative;
    
    .screen-content-mock {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 36px;
      background: var(--el-border-color-lighter);
      border-radius: 2px;
      pointer-events: none;
      opacity: 0.5;
    }

    .position-cell {
      background: var(--el-fill-color-light);
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 1;

      &:hover {
        background: var(--el-color-primary-light-8);
      }

      &.active {
        background: var(--el-color-primary);
        box-shadow: 0 0 4px var(--el-color-primary-light-5);
      }
      
      &.is-disabled {
        cursor: not-allowed;
        opacity: 0.6;
        
        &:hover {
          background: var(--el-fill-color-light);
        }
        
        &.active {
          background: var(--el-fill-color-darker);
        }
      }

      &.center-disabled {
        background: transparent;
        cursor: default;
        &:hover {
          background: transparent;
        }
      }
    }
  }
}
</style>
