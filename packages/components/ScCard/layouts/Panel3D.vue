<template>
  <div 
    class="panel-3d"
    :class="{
      'is-hoverable': hoverable,
      'is-active': active
    }"
    :style="panelStyle"
  >
    <div class="panel-3d__inner">
      <div class="panel-3d__header" v-if="showHeader">
        <slot name="header">
          <div class="panel-3d__title">
            <div class="panel-3d__title-icon" v-if="icon">
              <IconifyIconOnline :icon="icon" />
            </div>
            <span>{{ title }}</span>
          </div>
          <div class="panel-3d__actions">
            <slot name="actions"></slot>
          </div>
        </slot>
      </div>
      
      <div class="panel-3d__content">
        <slot></slot>
      </div>
      
      <div class="panel-3d__footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
      
      <!-- 装饰角 -->
      <div class="panel-3d__corner panel-3d__corner--tl"></div>
      <div class="panel-3d__corner panel-3d__corner--tr"></div>
      <div class="panel-3d__corner panel-3d__corner--bl"></div>
      <div class="panel-3d__corner panel-3d__corner--br"></div>
      
      <!-- 装饰边 -->
      <div class="panel-3d__border panel-3d__border--top"></div>
      <div class="panel-3d__border panel-3d__border--right"></div>
      <div class="panel-3d__border panel-3d__border--bottom"></div>
      <div class="panel-3d__border panel-3d__border--left"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';

export default defineComponent({
  name: 'Panel3D',
  props: {
    /**
     * 面板标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 面板图标
     */
    icon: {
      type: String,
      default: ''
    },
    /**
     * 是否显示头部
     */
    showHeader: {
      type: Boolean,
      default: true
    },
    /**
     * 是否可悬停
     */
    hoverable: {
      type: Boolean,
      default: true
    },
    /**
     * 是否激活状态
     */
    active: {
      type: Boolean,
      default: false
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
     * 面板宽度
     */
    width: {
      type: [String, Number],
      default: '100%'
    },
    /**
     * 面板高度
     */
    height: {
      type: [String, Number],
      default: '100%'
    },
    /**
     * 背景色
     */
    backgroundColor: {
      type: String,
      default: 'rgba(4, 49, 128, 0.6)'
    },
    /**
     * 边框颜色
     */
    borderColor: {
      type: String,
      default: 'rgba(24, 144, 255, 0.8)'
    },
    /**
     * 激活时边框颜色
     */
    activeBorderColor: {
      type: String,
      default: 'rgba(24, 144, 255, 1)'
    },
    /**
     * 内边距
     */
    padding: {
      type: String,
      default: '20px'
    },
    /**
     * 3D效果强度
     */
    depth: {
      type: Number,
      default: 10
    },
    /**
     * 主题
     */
    theme: {
      type: String as PropType<'blue' | 'green' | 'purple' | 'orange' | 'custom'>,
      default: 'blue',
      validator: (value: string) => ['blue', 'green', 'purple', 'orange', 'custom'].includes(value)
    }
  },
  setup(props) {
    // 计算主题颜色
    const themeColors = computed(() => {
      switch (props.theme) {
        case 'blue':
          return {
            background: 'rgba(4, 49, 128, 0.6)',
            border: 'rgba(24, 144, 255, 0.8)',
            activeBorder: 'rgba(24, 144, 255, 1)',
            glow: 'rgba(24, 144, 255, 0.6)'
          };
        case 'green':
          return {
            background: 'rgba(0, 82, 73, 0.6)',
            border: 'rgba(0, 184, 148, 0.8)',
            activeBorder: 'rgba(0, 184, 148, 1)',
            glow: 'rgba(0, 184, 148, 0.6)'
          };
        case 'purple':
          return {
            background: 'rgba(76, 0, 112, 0.6)',
            border: 'rgba(155, 89, 182, 0.8)',
            activeBorder: 'rgba(155, 89, 182, 1)',
            glow: 'rgba(155, 89, 182, 0.6)'
          };
        case 'orange':
          return {
            background: 'rgba(102, 51, 0, 0.6)',
            border: 'rgba(255, 159, 64, 0.8)',
            activeBorder: 'rgba(255, 159, 64, 1)',
            glow: 'rgba(255, 159, 64, 0.6)'
          };
        default:
          return {
            background: props.backgroundColor,
            border: props.borderColor,
            activeBorder: props.activeBorderColor,
            glow: props.borderColor
          };
      }
    });
    
    // 计算面板样式
    const panelStyle = computed(() => {
      const widthValue = typeof props.width === 'number' ? `${props.width}px` : props.width;
      const heightValue = typeof props.height === 'number' ? `${props.height}px` : props.height;
      
      return {
        width: widthValue,
        height: heightValue,
        '--panel-bg-color': themeColors.value.background,
        '--panel-border-color': themeColors.value.border,
        '--panel-active-border-color': themeColors.value.activeBorder,
        '--panel-glow-color': themeColors.value.glow,
        '--panel-depth': `${props.depth}px`
      };
    });
    
    return {
      panelStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.panel-3d {
  position: relative;
  border-radius: 4px;
  background-color: var(--panel-bg-color);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 
              inset 0 0 15px rgba(0, 0, 0, 0.3);
  perspective: 1000px;
  transform-style: preserve-3d;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background-color: var(--panel-active-border-color);
    transition: height 0.3s ease;
    z-index: 3;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  
  &__inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: v-bind(padding);
    z-index: 1;
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--panel-border-color);
  }
  
  &__title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 0 10px var(--panel-glow-color);
    
    &-icon {
      margin-right: 8px;
      font-size: 20px;
    }
  }
  
  &__actions {
    display: flex;
    gap: 8px;
  }
  
  &__content {
    flex: 1;
    overflow: auto;
    color: rgba(255, 255, 255, 0.85);
  }
  
  &__footer {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--panel-border-color);
  }
  
  // 装饰角
  &__corner {
    position: absolute;
    width: 20px;
    height: 20px;
    z-index: 2;
    
    &--tl {
      top: 0;
      left: 0;
      border-top: 2px solid var(--panel-border-color);
      border-left: 2px solid var(--panel-border-color);
    }
    
    &--tr {
      top: 0;
      right: 0;
      border-top: 2px solid var(--panel-border-color);
      border-right: 2px solid var(--panel-border-color);
    }
    
    &--bl {
      bottom: 0;
      left: 0;
      border-bottom: 2px solid var(--panel-border-color);
      border-left: 2px solid var(--panel-border-color);
    }
    
    &--br {
      bottom: 0;
      right: 0;
      border-bottom: 2px solid var(--panel-border-color);
      border-right: 2px solid var(--panel-border-color);
    }
  }
  
  // 装饰边
  &__border {
    position: absolute;
    z-index: 2;
    
    &--top {
      top: 0;
      left: 20px;
      right: 20px;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent, 
        var(--panel-border-color) 20%, 
        var(--panel-border-color) 80%, 
        transparent
      );
    }
    
    &--right {
      top: 20px;
      right: 0;
      bottom: 20px;
      width: 2px;
      background: linear-gradient(180deg, 
        transparent, 
        var(--panel-border-color) 20%, 
        var(--panel-border-color) 80%, 
        transparent
      );
    }
    
    &--bottom {
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent, 
        var(--panel-border-color) 20%, 
        var(--panel-border-color) 80%, 
        transparent
      );
    }
    
    &--left {
      top: 20px;
      left: 0;
      bottom: 20px;
      width: 2px;
      background: linear-gradient(180deg, 
        transparent, 
        var(--panel-border-color) 20%, 
        var(--panel-border-color) 80%, 
        transparent
      );
    }
  }
  
  // 悬停效果
  &.is-hoverable {
    &:hover {
      transform: translateZ(var(--panel-depth)) rotateX(2deg) rotateY(-2deg);
      box-shadow: 0 var(--panel-depth) 30px rgba(0, 0, 0, 0.5),
                  inset 0 0 15px rgba(0, 0, 0, 0.3);
      
      .panel-3d__corner, .panel-3d__border {
        --panel-border-color: var(--panel-active-border-color);
      }
      
      &::before {
        opacity: 1;
      }
      
      &::after {
        height: 4px;
      }
    }
  }
  
  // 激活状态
  &.is-active {
    transform: translateZ(var(--panel-depth)) rotateX(1deg) rotateY(-1deg);
    box-shadow: 0 var(--panel-depth) 30px rgba(0, 0, 0, 0.5),
                inset 0 0 15px rgba(0, 0, 0, 0.3);
    
    .panel-3d__corner, .panel-3d__border {
      --panel-border-color: var(--panel-active-border-color);
    }
    
    &::before {
      opacity: 1;
    }
    
    &::after {
      height: 4px;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    box-shadow: 0 0 15px var(--panel-glow-color);
    opacity: 0.3;
    transition: opacity 0.3s ease;
    z-index: 0;
  }
  
  // 动画效果
  @keyframes pulse {
    0% {
      box-shadow: 0 0 15px var(--panel-glow-color);
    }
    50% {
      box-shadow: 0 0 25px var(--panel-glow-color);
    }
    100% {
      box-shadow: 0 0 15px var(--panel-glow-color);
    }
  }
  
  &.is-active::before {
    animation: pulse 2s infinite;
  }
}
</style> 