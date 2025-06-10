<template>
  <div 
    class="sc-card-header-content"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`border-position--${borderPosition}`]: true
    }"
  >
    <div class="sc-card-header-content__header" :style="headerStyle">
      <slot name="header">
        <div class="sc-card-header-content__title" v-if="title">{{ title }}</div>
      </slot>
    </div>
    
    <div class="sc-card-header-content__body">
      <slot></slot>
    </div>
    
    <div class="sc-card-header-content__footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'HeaderContentLayout',
  props: {
    /**
     * 卡片标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 是否可悬停
     */
    hoverable: {
      type: Boolean,
      default: false
    },
    /**
     * 阴影显示时机
     */
    shadow: {
      type: String,
      default: 'hover',
      validator: (val: string) => ['always', 'hover', 'never'].includes(val)
    },
    /**
     * 边框加粗显示位置
     */
    borderPosition: {
      type: String,
      default: 'top',
      validator: (val: string) => ['top', 'right', 'bottom', 'left', 'none'].includes(val)
    },
    /**
     * 头部高度
     */
    headerHeight: {
      type: [String, Number],
      default: '120px'
    },
    /**
     * 头部背景色
     */
    headerBgColor: {
      type: String,
      default: ''
    },
    /**
     * 头部背景图
     */
    headerBgImage: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const headerStyle = computed(() => {
      const style: Record<string, string> = {};
      
      style.height = typeof props.headerHeight === 'number' ? `${props.headerHeight}px` : props.headerHeight;
      
      if (props.headerBgColor) {
        style.backgroundColor = props.headerBgColor;
      }
      
      if (props.headerBgImage) {
        style.backgroundImage = `url(${props.headerBgImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
      
      return style;
    });
    
    return {
      headerStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-card-header-content {
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  overflow: hidden;
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    background-color: var(--el-color-primary);
    transition: all 0.3s ease;
    z-index: 1;
  }
  
  // 边框位置样式
  &.border-position--top::before {
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    width: 100%;
  }
  
  &.border-position--right::before {
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    height: 100%;
  }
  
  &.border-position--bottom::before {
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    width: 100%;
  }
  
  &.border-position--left::before {
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    height: 100%;
  }
  
  &.border-position--none::before {
    display: none;
  }
  
  &__header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: var(--el-color-primary-light-9);
    position: relative;
  }
  
  &__title {
    font-size: 18px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-align: center;
    
    &::after {
      content: '';
      display: block;
      width: 40px;
      height: 3px;
      background-color: var(--el-color-primary);
      margin: 10px auto 0;
      border-radius: 2px;
    }
  }
  
  &__body {
    padding: 20px;
  }
  
  &__footer {
    padding: 10px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }
  
  &.is-hoverable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary);
      
      .sc-card-header-content__header {
        &::before {
          opacity: 1;
        }
      }
    }
  }
  
  &.is-shadow {
    &:hover {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary);
    }
  }
  
  &.is-shadow-always {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    
    &:hover {
      border-color: var(--el-color-primary);
    }
  }
  
  // 头部悬停效果
  &__header {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(var(--el-color-primary-rgb), 0.1), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }
}
</style> 