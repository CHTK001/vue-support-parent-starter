<template>
  <div 
    class="sc-card-media"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`media-position--${mediaPosition}`]: true,
      [`border-position--${borderPosition}`]: true
    }"
  >
    <div 
      class="sc-card-media__media"
      :style="mediaStyle"
    >
      <slot name="media"></slot>
    </div>
    
    <div class="sc-card-media__content">
      <div class="sc-card-media__header" v-if="$slots.header || title">
        <slot name="header">
          <div class="sc-card-media__title">{{ title }}</div>
          <div class="sc-card-media__subtitle" v-if="$slots['media-subtitle']">
            <slot name="media-subtitle"></slot>
          </div>
        </slot>
      </div>
      
      <div class="sc-card-media__body">
        <slot></slot>
      </div>
      
      <div class="sc-card-media__footer" v-if="$slots['media-footer'] || $slots.footer">
        <slot name="media-footer">
          <slot name="footer"></slot>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'MediaLayout',
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
     * 媒体位置
     */
    mediaPosition: {
      type: String,
      default: 'left',
      validator: (val: string) => ['left', 'right', 'top'].includes(val)
    },
    /**
     * 媒体宽度
     */
    mediaWidth: {
      type: [String, Number],
      default: '120px'
    },
    /**
     * 媒体高度
     */
    mediaHeight: {
      type: [String, Number],
      default: '120px'
    },
    /**
     * 媒体背景色
     */
    mediaBgColor: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const mediaStyle = computed(() => {
      const style: Record<string, string> = {};
      
      if (props.mediaPosition === 'left' || props.mediaPosition === 'right') {
        style.width = typeof props.mediaWidth === 'number' ? `${props.mediaWidth}px` : props.mediaWidth;
      } else if (props.mediaPosition === 'top') {
        style.height = typeof props.mediaHeight === 'number' ? `${props.mediaHeight}px` : props.mediaHeight;
      }
      
      if (props.mediaBgColor) {
        style.backgroundColor = props.mediaBgColor;
      }
      
      return style;
    });
    
    return {
      mediaStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-card-media {
  display: flex;
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
  
  &.media-position--left {
    flex-direction: row;
    
    .sc-card-media__media {
      border-right: 1px solid var(--el-border-color-light);
    }
  }
  
  &.media-position--right {
    flex-direction: row-reverse;
    
    .sc-card-media__media {
      border-left: 1px solid var(--el-border-color-light);
    }
  }
  
  &.media-position--top {
    flex-direction: column;
    
    .sc-card-media__media {
      border-bottom: 1px solid var(--el-border-color-light);
    }
  }
  
  &__media {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: var(--el-fill-color-light);
  }
  
  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; // 防止内容溢出
  }
  
  &__header {
    padding: 16px 20px 0;
  }
  
  &__title {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
  }
  
  &__body {
    padding: 12px 20px;
    flex: 1;
  }
  
  &__footer {
    padding: 0 20px 16px;
    margin-top: auto;
  }
  
  &.is-hoverable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary);
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
}
</style> 