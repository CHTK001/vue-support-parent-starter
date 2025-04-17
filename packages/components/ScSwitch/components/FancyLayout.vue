<template>
  <div 
    class="sc-switch-fancy"
    :class="[
      `sc-switch-fancy--${size}`,
      {
        'is-checked': isChecked,
        'is-disabled': disabled,
        'is-loading': loading
      }
    ]"
    :style="{
      '--active-color': activeColor,
      '--inactive-color': inactiveColor
    }"
    @click="toggleSwitch"
  >
    <label class="sc-switch-fancy__label">
      <input type="checkbox" :checked="isChecked" :disabled="disabled || loading" class="sc-switch-fancy__input" />
      <span class="sc-switch-fancy__slider"></span>
      <span class="sc-switch-fancy__wave"></span>
      
      <div v-if="loading" class="sc-switch-fancy__loading">
        <i class="el-icon-loading"></i>
      </div>
      
      <div v-if="currentText" class="sc-switch-fancy__text">
        {{ currentText }}
      </div>
      
      <div v-if="currentIcon" class="sc-switch-fancy__icon">
        <IconifyIconOnline :icon="currentIcon" />
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconifyIconOnline } from '@repo/components/ReIcon';

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (val: string) => ['small', 'default', 'large'].includes(val)
  },
  activeText: {
    type: String,
    default: ''
  },
  inactiveText: {
    type: String,
    default: ''
  },
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  activeColor: {
    type: String,
    default: '#409eff'
  },
  inactiveColor: {
    type: String,
    default: '#dcdfe6'
  },
  activeIcon: {
    type: String,
    default: ''
  },
  inactiveIcon: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// 计算当前是否为选中状态
const isChecked = computed(() => props.modelValue === props.activeValue);

// 计算当前显示的图标
const currentIcon = computed(() => isChecked.value ? props.activeIcon : props.inactiveIcon);

// 计算当前显示的文本
const currentText = computed(() => isChecked.value ? props.activeText : props.inactiveText);

// 切换开关状态
const toggleSwitch = () => {
  if (props.disabled || props.loading) return;
  
  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
};
</script>

<style lang="scss" scoped>
.sc-switch-fancy {
  position: relative;
  display: inline-flex;
  align-items: center;
  user-select: none;
  
  &__label {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }
  
  &__input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  
  &__slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--inactive-color, #dcdfe6);
    border-radius: 34px;
    transition: .4s;
    
    &:before {
      position: absolute;
      content: "";
      height: calc(100% - 4px);
      width: calc(50% - 4px);
      left: 2px;
      bottom: 2px;
      background-color: white;
      border-radius: 50%;
      transition: .4s cubic-bezier(.44,2,.68,.53);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
  
  &__wave {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 34px;
    transition: .4s;
    z-index: -1;
    overflow: hidden;
    
    &:before {
      content: "";
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
      transition: .4s;
      opacity: 0;
      transform: translateY(-50%) scale(0);
      transform-origin: center;
    }
  }
  
  &__text {
    position: absolute;
    white-space: nowrap;
    font-size: 12px;
    color: white;
    opacity: 0.9;
    transition: .3s;
    z-index: 1;
  }
  
  &__icon {
    position: absolute;
    z-index: 2;
    transition: .3s;
  }
  
  &__loading {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
  }
  
  // 尺寸样式
  &--small {
    .sc-switch-fancy__label {
      width: 44px;
      height: 22px;
    }
    
    .sc-switch-fancy__text {
      font-size: 10px;
      right: 6px;
      top: 5px;
    }
    
    .sc-switch-fancy__icon {
      font-size: 10px;
      left: 6px;
      top: 6px;
    }
    
    .sc-switch-fancy__loading {
      width: 18px;
      height: 18px;
      font-size: 12px;
      left: 2px;
      top: 2px;
    }
  }
  
  &--default {
    .sc-switch-fancy__label {
      width: 56px;
      height: 28px;
    }
    
    .sc-switch-fancy__text {
      font-size: 12px;
      right: 8px;
      top: 7px;
    }
    
    .sc-switch-fancy__icon {
      font-size: 12px;
      left: 8px;
      top: 8px;
    }
    
    .sc-switch-fancy__loading {
      width: 24px;
      height: 24px;
      font-size: 14px;
      left: 2px;
      top: 2px;
    }
  }
  
  &--large {
    .sc-switch-fancy__label {
      width: 68px;
      height: 34px;
    }
    
    .sc-switch-fancy__text {
      font-size: 14px;
      right: 10px;
      top: 9px;
    }
    
    .sc-switch-fancy__icon {
      font-size: 14px;
      left: 10px;
      top: 10px;
    }
    
    .sc-switch-fancy__loading {
      width: 30px;
      height: 30px;
      font-size: 16px;
      left: 2px;
      top: 2px;
    }
  }
  
  // 状态样式
  &.is-checked {
    .sc-switch-fancy__slider {
      background-color: var(--active-color, #409eff);
      
      &:before {
        transform: translateX(calc(100% + 4px));
      }
    }
    
    .sc-switch-fancy__wave:before {
      opacity: 1;
      transform: translateY(-50%) scale(2);
      animation: ripple 0.6s ease-out;
    }
    
    .sc-switch-fancy__icon {
      color: var(--active-color, #409eff);
      transform: translateX(calc(100% + 4px));
    }
  }
  
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    .sc-switch-fancy__label {
      cursor: not-allowed;
    }
  }
  
  &.is-loading {
    .sc-switch-fancy__label {
      cursor: wait;
    }
  }
  
  &:not(.is-disabled):not(.is-loading):hover {
    .sc-switch-fancy__slider:before {
      box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.1);
    }
  }
}

@keyframes ripple {
  0% {
    transform: translateY(-50%) scale(0);
    opacity: 1;
  }
  40% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-50%) scale(2);
    opacity: 0;
  }
}
</style> 