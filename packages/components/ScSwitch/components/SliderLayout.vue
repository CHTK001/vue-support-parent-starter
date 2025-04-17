<template>
  <div 
    class="sc-switch-slider"
    :class="[
      `sc-switch-slider--${size}`,
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
    <div class="sc-switch-slider__rail">
      <div class="sc-switch-slider__text sc-switch-slider__text--inactive" v-if="inactiveText">
        {{ inactiveText }}
      </div>
      
      <div class="sc-switch-slider__button-wrapper" :style="buttonStyle">
        <div class="sc-switch-slider__button">
          <div v-if="loading" class="sc-switch-slider__loading">
            <i class="el-icon-loading"></i>
          </div>
          <div v-else-if="currentIcon" class="sc-switch-slider__icon">
            <IconifyIconOnline :icon="currentIcon" />
          </div>
        </div>
      </div>
      
      <div class="sc-switch-slider__text sc-switch-slider__text--active" v-if="activeText">
        {{ activeText }}
      </div>
    </div>
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

// 计算按钮位置样式
const buttonStyle = computed(() => {
  return {
    transform: isChecked.value ? 'translateX(100%)' : 'translateX(0)'
  };
});

// 切换开关状态
const toggleSwitch = () => {
  if (props.disabled || props.loading) return;
  
  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
};
</script>

<style lang="scss" scoped>
.sc-switch-slider {
  display: inline-block;
  position: relative;
  cursor: pointer;
  border-radius: 100px;
  transition: all 0.3s;
  user-select: none;
  
  &__rail {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    border-radius: 100px;
    transition: background 0.3s;
    padding: 0 4px;
  }
  
  &__button-wrapper {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s;
  }
  
  &__text {
    opacity: 0.8;
    transition: color 0.3s;
    font-weight: 500;
    
    &--active {
      opacity: 0;
      color: white;
    }
    
    &--inactive {
      opacity: 0;
      color: #606266;
    }
  }
  
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  // 尺寸样式
  &--small {
    width: 80px;
    height: 24px;
    font-size: 12px;
    
    .sc-switch-slider__button {
      width: 18px;
      height: 18px;
    }
    
    .sc-switch-slider__icon {
      font-size: 12px;
    }
  }
  
  &--default {
    width: 100px;
    height: 32px;
    font-size: 14px;
    
    .sc-switch-slider__button {
      width: 24px;
      height: 24px;
    }
    
    .sc-switch-slider__icon {
      font-size: 14px;
    }
  }
  
  &--large {
    width: 120px;
    height: 40px;
    font-size: 16px;
    
    .sc-switch-slider__button {
      width: 32px;
      height: 32px;
    }
    
    .sc-switch-slider__icon {
      font-size: 18px;
    }
  }
  
  // 状态样式
  &.is-checked {
    .sc-switch-slider__rail {
      background-color: var(--active-color, #409eff);
    }
    
    .sc-switch-slider__text--active {
      opacity: 1;
    }
  }
  
  &:not(.is-checked) {
    .sc-switch-slider__rail {
      background-color: var(--inactive-color, #dcdfe6);
    }
    
    .sc-switch-slider__text--inactive {
      opacity: 1;
    }
  }
  
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &:not(.is-disabled):not(.is-checked):hover {
    .sc-switch-slider__rail {
      background-color: darken(#dcdfe6, 5%);
    }
  }
  
  &:not(.is-disabled).is-checked:hover {
    .sc-switch-slider__rail {
      background-color: darken(#409eff, 5%);
    }
  }
  
  &.is-loading {
    cursor: wait;
  }
}
</style> 