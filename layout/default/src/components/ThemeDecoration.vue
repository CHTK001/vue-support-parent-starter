<template>
  <Transition name="decoration-fade">
    <div
      v-if="isVisible"
      :class="['theme-decoration', `decoration-${config.animation || 'none'}`, { 'is-interactive': config.interactive }]"
      :style="decorationStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="handleClick"
    >
      <!-- Emoji 类型 -->
      <span v-if="config.type === 'emoji'" class="decoration-content">
        {{ config.content }}
      </span>
      
      <!-- Icon 类型（保留扩展） -->
      <i v-else-if="config.type === 'icon'" :class="config.content" class="decoration-content" />
      
      <!-- SVG 类型（保留扩展） -->
      <div v-else-if="config.type === 'svg'" class="decoration-content" v-html="config.content" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { DecorationConfig } from '../themes/decorations';

interface Props {
  /** 装饰配置 */
  config: DecorationConfig;
  /** 是否显示 */
  visible?: boolean;
  /** 索引（用于延迟动画） */
  index?: number;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  index: 0,
});

const isVisible = ref(false);
const isHovering = ref(false);
const isClicking = ref(false);

// 计算装饰元素样式
const decorationStyle = computed(() => {
  const style: Record<string, string> = {};
  
  // 位置
  if (props.config.position === 'custom' && props.config.customPosition) {
    const { top, bottom, left, right } = props.config.customPosition;
    if (top) style.top = top;
    if (bottom) style.bottom = bottom;
    if (left) style.left = left;
    if (right) style.right = right;
    style.position = 'absolute';
  } else {
    // 预设位置
    style.position = 'absolute';
    switch (props.config.position) {
      case 'top':
        style.top = '0';
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.bottom = '-24px';
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.left = '-24px';
        style.top = '50%';
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.right = '-24px';
        style.top = '50%';
        style.transform = 'translateY(-50%)';
        break;
      case 'center':
        style.top = '50%';
        style.left = '50%';
        style.transform = 'translate(-50%, -50%)';
        break;
    }
  }
  
  // 大小
  if (props.config.size) {
    style.fontSize = props.config.size;
  }
  
  // z-index
  if (props.config.zIndex !== undefined) {
    style.zIndex = String(props.config.zIndex);
  }
  
  // 动画时长
  if (props.config.animationDuration) {
    style.animationDuration = `${props.config.animationDuration}s`;
  }
  
  // 动画延迟（考虑索引）
  const baseDelay = props.config.animationDelay || 0;
  const indexDelay = props.index * 0.1; // 每个元素延迟0.1秒
  style.animationDelay = `${baseDelay + indexDelay}s`;
  
  // 悬停和点击时的动画
  if (isHovering.value && props.config.hoverAnimation) {
    style.animation = `decoration-${props.config.hoverAnimation} ${props.config.animationDuration || 1}s ease-in-out`;
  }
  
  if (isClicking.value && props.config.clickAnimation) {
    style.animation = `decoration-${props.config.clickAnimation} 0.5s ease-out`;
  }
  
  return style;
});

// 鼠标进入
const handleMouseEnter = () => {
  if (props.config.interactive && props.config.hoverAnimation) {
    isHovering.value = true;
  }
};

// 鼠标离开
const handleMouseLeave = () => {
  isHovering.value = false;
};

// 点击
const handleClick = () => {
  if (props.config.interactive && props.config.clickAnimation) {
    isClicking.value = true;
    setTimeout(() => {
      isClicking.value = false;
    }, 500);
  }
};

// 挂载时显示（带过渡效果）
onMounted(() => {
  // 稍微延迟显示，让过渡效果更明显
  setTimeout(() => {
    isVisible.value = props.visible;
  }, 50);
});
</script>

<style scoped>
.theme-decoration {
  pointer-events: none;
  user-select: none;
  will-change: transform;
}

.theme-decoration.is-interactive {
  pointer-events: auto;
  cursor: pointer;
}

.decoration-content {
  display: inline-block;
  transition: all 0.3s ease;
  /* 默认立体效果 */
  filter: 
    drop-shadow(0 4px 8px rgba(220, 20, 60, 0.4))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))
    drop-shadow(0 -1px 2px rgba(255, 215, 0, 0.2));
}

/* 深色模式下的发光效果 */
:global(.dark) .decoration-content {
  filter: 
    drop-shadow(0 0 12px rgba(255, 69, 0, 0.8))
    drop-shadow(0 0 20px rgba(255, 140, 0, 0.6))
    drop-shadow(0 0 30px rgba(255, 215, 0, 0.4))
    drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  animation: lanternGlow 2s ease-in-out infinite;
}

/* 过渡效果 */
.decoration-fade-enter-active,
.decoration-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.decoration-fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.decoration-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* ========== 动画定义 ========== */

/* 摇摆动画 - 适合灯笼 */
.decoration-swing {
  animation: decoration-swing 3s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes decoration-swing {
  0%, 100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}

/* 波浪动画 - 适合旗帜 */
.decoration-wave {
  animation: decoration-wave 2s ease-in-out infinite;
  transform-origin: left center;
}

@keyframes decoration-wave {
  0%, 100% {
    transform: rotate(-5deg) scale(1);
  }
  25% {
    transform: rotate(5deg) scale(1.05);
  }
  50% {
    transform: rotate(-3deg) scale(1);
  }
  75% {
    transform: rotate(3deg) scale(1.05);
  }
}

/* 漂浮动画 - 适合多种元素 */
.decoration-float {
  animation: decoration-float 3s ease-in-out infinite;
}

@keyframes decoration-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 弹跳动画 - 适合活泼元素 */
.decoration-bounce {
  animation: decoration-bounce 2s ease-in-out infinite;
}

@keyframes decoration-bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-7px);
  }
}

/* 旋转动画 - 适合圆形元素 */
.decoration-rotate {
  animation: decoration-rotate 4s linear infinite;
}

@keyframes decoration-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 闪烁动画 - 适合星星、亮光 */
.decoration-twinkle {
  animation: decoration-twinkle 2s ease-in-out infinite;
}

@keyframes decoration-twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.9);
  }
}

/* 无动画 */
.decoration-none {
  /* 无动画 */
}

/* 悬停时增强效果 */
.theme-decoration.is-interactive:hover .decoration-content {
  transform: scale(1.15);
  transition: all 0.3s ease;
  /* 普通模式悬停 */
  filter: 
    drop-shadow(0 6px 12px rgba(220, 20, 60, 0.6))
    drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))
    drop-shadow(0 -2px 4px rgba(255, 215, 0, 0.4));
}

/* 深色模式悬停 - 更强的发光 */
:global(.dark) .theme-decoration.is-interactive:hover .decoration-content {
  filter: 
    drop-shadow(0 0 20px rgba(255, 69, 0, 1))
    drop-shadow(0 0 30px rgba(255, 140, 0, 0.8))
    drop-shadow(0 0 40px rgba(255, 215, 0, 0.6))
    drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
}

/* 深色模式灯笼发光动画 */
@keyframes lanternGlow {
  0%, 100% {
    filter: 
      drop-shadow(0 0 12px rgba(255, 69, 0, 0.8))
      drop-shadow(0 0 20px rgba(255, 140, 0, 0.6))
      drop-shadow(0 0 30px rgba(255, 215, 0, 0.4))
      drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }
  50% {
    filter: 
      drop-shadow(0 0 18px rgba(255, 69, 0, 1))
      drop-shadow(0 0 28px rgba(255, 140, 0, 0.8))
      drop-shadow(0 0 40px rgba(255, 215, 0, 0.6))
      drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }
}

/* 点击时脉冲效果 */
.theme-decoration.is-interactive:active .decoration-content {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}
</style>
