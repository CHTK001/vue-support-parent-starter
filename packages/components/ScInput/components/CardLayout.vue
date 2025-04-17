<template>
  <div 
    class="sc-card-layout"
    :class="[
      size ? `sc-card-layout--${size}` : '',
      { 'is-disabled': disabled },
      { 'is-focused': isFocused },
      { 'has-prefix': $slots.prefix || prefixIcon },
      { 'has-suffix': $slots.suffix || suffixIcon }
    ]"
    @click="handleClick"
  >
    <div class="sc-card-layout__wrapper">
      <div v-if="$slots.prefix || prefixIcon" class="sc-card-layout__prefix">
        <slot name="prefix">
          <el-icon v-if="prefixIcon" class="sc-card-layout__prefix-icon">
            <component :is="prefixIcon" />
          </el-icon>
        </slot>
      </div>
      
      <div class="sc-card-layout__content">
        <div class="sc-card-layout__title" v-if="title">{{ title }}</div>
        <div class="sc-card-layout__subtitle" v-if="subtitle">{{ subtitle }}</div>
        <div class="sc-card-layout__description" v-if="description">{{ description }}</div>
        <div class="sc-card-layout__custom" v-if="$slots.default">
          <slot></slot>
        </div>
      </div>
      
      <div v-if="$slots.suffix || suffixIcon" class="sc-card-layout__suffix">
        <slot name="suffix">
          <el-icon v-if="suffixIcon" class="sc-card-layout__suffix-icon">
            <component :is="suffixIcon" />
          </el-icon>
        </slot>
      </div>
    </div>
    
    <div v-if="$slots.append" class="sc-card-layout__append">
      <slot name="append" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  /**
   * 卡片标题
   */
  title?: string;
  /**
   * 卡片副标题
   */
  subtitle?: string;
  /**
   * 卡片描述
   */
  description?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 卡片尺寸
   */
  size?: 'large' | 'default' | 'small';
  /**
   * 前缀图标
   */
  prefixIcon?: string;
  /**
   * 后缀图标
   */
  suffixIcon?: string;
  /**
   * 是否可选中
   */
  selectable?: boolean;
  /**
   * 是否选中
   */
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  description: '',
  disabled: false,
  size: 'default',
  prefixIcon: '',
  suffixIcon: '',
  selectable: false,
  selected: false
});

const emit = defineEmits([
  'click',
  'select'
]);

const isFocused = ref(false);

/**
 * 处理点击事件
 */
const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;
  
  isFocused.value = true;
  emit('click', event);
  
  if (props.selectable) {
    emit('select', !props.selected);
  }
  
  // 自动失焦，模拟点击效果
  setTimeout(() => {
    isFocused.value = false;
  }, 200);
};
</script>

<style lang="scss" scoped>
.sc-card-layout {
  width: 100%;
  border-radius: 8px;
  background-color: var(--el-fill-color-blank, #fff);
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--el-border-color-light);
  
  &__wrapper {
    display: flex;
    align-items: flex-start;
    width: 100%;
    padding: 12px 16px;
  }
  
  &__content {
    flex: 1;
    min-width: 0;
  }
  
  &__title {
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    word-break: break-word;
  }
  
  &__subtitle {
    font-size: 14px;
    line-height: 20px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
    word-break: break-word;
  }
  
  &__description {
    font-size: 12px;
    line-height: 18px;
    color: var(--el-text-color-secondary);
    word-break: break-word;
  }
  
  &__prefix, &__suffix {
    display: flex;
    align-items: center;
    color: var(--el-text-color-secondary);
  }
  
  &__prefix {
    margin-right: 12px;
  }
  
  &__suffix {
    margin-left: 12px;
  }
  
  &__append {
    padding: 8px 16px;
    background-color: var(--el-fill-color-light);
    border-top: 1px solid var(--el-border-color-lighter);
  }
  
  &--large {
    .sc-card-layout__wrapper {
      padding: 16px 20px;
    }
    
    .sc-card-layout__title {
      font-size: 18px;
      line-height: 26px;
    }
    
    .sc-card-layout__subtitle {
      font-size: 16px;
      line-height: 24px;
    }
    
    .sc-card-layout__description {
      font-size: 14px;
      line-height: 20px;
    }
  }
  
  &--small {
    .sc-card-layout__wrapper {
      padding: 8px 12px;
    }
    
    .sc-card-layout__title {
      font-size: 14px;
      line-height: 20px;
    }
    
    .sc-card-layout__subtitle {
      font-size: 12px;
      line-height: 18px;
    }
    
    .sc-card-layout__description {
      font-size: 12px;
      line-height: 16px;
    }
  }
  
  &.is-focused {
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
    border-color: var(--el-color-primary);
  }
  
  &.is-disabled {
    background-color: var(--el-disabled-bg-color);
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  &:hover:not(.is-disabled) {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
}
</style> 