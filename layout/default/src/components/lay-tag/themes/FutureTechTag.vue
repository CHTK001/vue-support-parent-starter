<script setup lang="ts">
/**
 * 未来科技主题专属标签组件
 * 霓虹光效风格
 */
import BaseTag from './BaseTag.vue';
</script>

<template>
  <BaseTag theme-class="future-tech-tag" />
</template>

<style lang="scss">
@use './default.scss';

// 未来科技主题标签样式
.future-tech-tag {
  .scroll-item {
    position: relative;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%);
    border: 1px solid rgba(0, 255, 255, 0.3);
    box-shadow: 
      0 0 10px rgba(0, 255, 255, 0.2),
      inset 0 0 10px rgba(138, 43, 226, 0.1);
    transition: all 0.3s ease;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(0, 255, 255, 0.3) 50%, 
        transparent 100%
      );
      transform: translateX(-100%);
      animation: neon-scan 3s ease-in-out infinite;
      pointer-events: none;
    }

    &:hover {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%);
      border-color: rgba(0, 255, 255, 0.6);
      box-shadow: 
        0 0 20px rgba(0, 255, 255, 0.4),
        inset 0 0 15px rgba(138, 43, 226, 0.2);
      transform: translateY(-2px);
    }

    &.active {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.25) 0%, rgba(138, 43, 226, 0.25) 100%);
      border-color: #00ffff;
      box-shadow: 
        0 0 25px rgba(0, 255, 255, 0.6),
        inset 0 0 20px rgba(138, 43, 226, 0.3);

      .tag-title {
        color: #00ffff;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
      }
    }

    .tag-title {
      color: rgba(0, 255, 255, 0.9);
      font-weight: 500;
      text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
    }

    .el-icon-close {
      color: rgba(0, 255, 255, 0.7);
      
      &:hover {
        color: #00ffff;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
      }
    }
  }
}

@keyframes neon-scan {
  0%, 100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}
</style>
