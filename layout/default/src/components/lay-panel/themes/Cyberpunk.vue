<script setup lang="ts">
import BasePanel from './BasePanel.vue';
</script>

<template>
  <div class="cyberpunk-panel">
    <BasePanel>
      <slot />
    </BasePanel>
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-glass: rgba(10, 10, 18, 0.95);
$cyber-border: rgba(0, 255, 255, 0.25);

.cyberpunk-panel {
  // 面板背景遮罩
  :deep(.right-panel-background) {
    background: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(4px);
  }

  // 右侧面板
  :deep(.right-panel) {
    background: linear-gradient(
      180deg,
      rgba(10, 10, 18, 0.98) 0%,
      rgba(15, 15, 25, 0.98) 100%
    ) !important;
    border-left: 1px solid $cyber-border;
    box-shadow:
      -5px 0 30px rgba(0, 255, 255, 0.1),
      -2px 0 10px rgba(255, 0, 255, 0.05),
      0 0 40px rgba(0, 0, 0, 0.5) !important;
    
    // 顶部霓虹线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        $cyber-cyan 30%,
        $cyber-magenta 70%,
        transparent 100%
      );
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
      animation: cyber-panel-glow 2s ease-in-out infinite;
    }
    
    // 扫描线效果
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 255, 0.02) 2px,
        rgba(0, 255, 255, 0.02) 4px
      );
      pointer-events: none;
      z-index: 1;
    }
  }

  // 面板头部
  :deep(.project-configuration) {
    background: rgba(0, 0, 0, 0.3) !important;
    border-bottom-color: $cyber-border !important;
    position: relative;
    z-index: 2;
    
    h4 {
      color: $cyber-cyan !important;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      font-family: 'Rajdhani', 'Roboto', sans-serif;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    // 关闭按钮
    span {
      color: $cyber-cyan !important;
      border: 1px solid transparent;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
      }
      
      svg {
        color: $cyber-cyan !important;
      }
    }
  }

  // 滚动区域
  :deep(.el-scrollbar) {
    position: relative;
    z-index: 2;
    
    .el-scrollbar__bar {
      &.is-vertical {
        .el-scrollbar__thumb {
          background: linear-gradient(180deg, $cyber-cyan, $cyber-magenta) !important;
          opacity: 0.6;
          
          &:hover {
            opacity: 1;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          }
        }
      }
    }
  }

  // 底部按钮区域
  :deep(.flex.justify-end) {
    background: rgba(0, 0, 0, 0.3) !important;
    border-top-color: $cyber-border !important;
    position: relative;
    z-index: 2;
    
    .el-button--danger {
      background: rgba(255, 0, 100, 0.1) !important;
      border: 1px solid rgba(255, 0, 100, 0.5) !important;
      color: #ff0064 !important;
      
      &:hover {
        background: rgba(255, 0, 100, 0.2) !important;
        border-color: #ff0064 !important;
        box-shadow: 0 0 20px rgba(255, 0, 100, 0.4) !important;
      }
    }
  }
}

@keyframes cyber-panel-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(255, 0, 255, 0.4);
  }
}
</style>
