<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="cyberpunk-setting">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
// 引入全局赛博朋克样式由 packages/skin/src/themes/cyberpunk.scss 处理
// 这里只保留设置面板特有的样式

html[data-skin="cyberpunk"] {
  // 局部变量复用 global SCSS 中定义的变量
  // 注意：这里无法直接使用 SCSS 变量，需使用 CSS 变量
  
  .right-panel {
    background: linear-gradient(135deg, rgba(10, 14, 25, 0.98) 0%, rgba(15, 20, 35, 0.98) 100%) !important;
    border-left: 1px solid var(--cyber-cyan, #00ffff) !important;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2) !important;

    // 顶部霓虹渐变线
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      background: linear-gradient(90deg, transparent 0%, var(--cyber-cyan, #00ffff) 20%, var(--cyber-magenta, #ff00ff) 50%, var(--cyber-cyan, #00ffff) 80%, transparent 100%);
      height: 2px;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      z-index: 1;
    }

    .project-configuration {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
      
      h4 {
        color: var(--cyber-cyan, #00ffff) !important;
        font-family: 'Orbitron', sans-serif;
        text-shadow: 0 0 5px var(--cyber-cyan, #00ffff);
        letter-spacing: 1px;
        
        &::before {
          content: "⚡ ";
          margin-right: 5px;
        }
      }
      
      svg {
        color: rgba(0, 255, 255, 0.7) !important;
        
        &:hover {
          color: var(--cyber-magenta, #ff00ff) !important;
          filter: drop-shadow(0 0 5px var(--cyber-magenta, #ff00ff));
        }
      }
    }
    
    // 设置项样式优化
    // .cyberpunk-extras 样式已移除
    
    .el-divider__text {
      background-color: transparent !important;
      color: var(--cyber-magenta, #ff00ff) !important;
    }
    
    .el-switch__label {
      color: rgba(0, 255, 255, 0.7) !important;
      
      &.is-active {
        color: var(--cyber-cyan, #00ffff) !important;
        text-shadow: 0 0 5px var(--cyber-cyan, #00ffff);
      }
    }

    // Segmented 分段控制器 (保留在此处，因为可能是设置面板特有)
    .el-segmented {
      background: rgba(0, 0, 0, 0.5) !important;
      border: 1px solid rgba(0, 255, 255, 0.1);
      --el-segmented-item-selected-bg-color: rgba(0, 255, 255, 0.2) !important;
      --el-segmented-item-selected-color: var(--cyber-cyan, #00ffff) !important;
      --el-segmented-item-hover-bg-color: rgba(255, 0, 255, 0.1) !important;
      --el-segmented-item-hover-color: var(--cyber-magenta, #ff00ff) !important;
      --el-border-radius-base: 2px;
    }
  }
}
</style>
