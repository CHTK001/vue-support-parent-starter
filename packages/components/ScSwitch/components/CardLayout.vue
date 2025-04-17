<template>
  <div 
    class="sc-switch-card"
    :class="[
      `sc-switch-card--${size}`,
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
    <div class="sc-switch-card__inner">
      <div class="sc-switch-card__content">
        <div v-if="loading" class="sc-switch-card__loading">
          <i class="el-icon-loading"></i>
        </div>
        <template v-else>
          <div class="sc-switch-card__icon" v-if="currentIcon">
            <IconifyIconOnline :icon="currentIcon" />
          </div>
          <div class="sc-switch-card__text" v-if="currentText">
            {{ currentText }}
          </div>
        </template>
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
.sc-switch-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  user-select: none;
  
  &__inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
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
  
  &--small {
    width: 60px;
    height: 36px;
    font-size: 12px;
    
    .sc-switch-card__icon {
      font-size: 16px;
    }
  }
  
  &--default {
    width: 80px;
    height: 48px;
    font-size: 14px;
    
    .sc-switch-card__icon {
      font-size: 20px;
    }
  }
  
  &--large {
    width: 100px;
    height: 60px;
    font-size: 16px;
    
    .sc-switch-card__icon {
      font-size: 24px;
    }
  }
  
  // 状态样式
  &.is-checked {
    background-color: var(--active-color, #409eff);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:not(.is-checked) {
    background-color: var(--inactive-color, #dcdfe6);
    color: #606266;
  }
  
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &:not(.is-disabled):not(.is-checked):hover {
    background-color: darken(#dcdfe6, 5%);
  }
  
  &:not(.is-disabled).is-checked:hover {
    background-color: darken(#409eff, 5%);
  }
  
  &.is-loading {
    cursor: wait;
  }
}
</style> 