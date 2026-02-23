<script setup lang="ts">
import BaseHover from './BaseHover.vue';
</script>

<template>
  <div class="future-tech-hover-wrapper">
    <BaseHover theme-class="future-tech-hover" />
  </div>
</template>

<style lang="scss" scoped>
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-cyan-dark: #00cccc;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-hover-wrapper {
  height: 100%;
  
  :deep(.future-tech-hover),
  :deep(.sidebar-hover-container) {
    position: relative;
    background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
    border-right: 2px solid $ft-border !important;
    // 性能优化：减小模糊半径，兼顾科幻质感和流畅度
    backdrop-filter: blur(4px);
      box-shadow: 
      2px 0 14px rgba(0, 255, 255, 0.15),
      inset 0 0 14px rgba(0, 255, 255, 0.05) !important;
    
    // 网格背景
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.3;
      pointer-events: none;
      z-index: 0;
    }
    
    // 扫描线效果
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $ft-cyan, transparent);
      z-index: 10;
      box-shadow: 0 0 10px $ft-cyan;
      animation: scanLine 4s linear infinite;
    }
    
    // Logo区域
    .sidebar-logo-container {
      background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
      border-bottom: 1px solid $ft-border !important;
      box-shadow: 0 2px 10px rgba(0, 255, 255, 0.1) !important;
      
      .sidebar-title {
        color: $ft-cyan !important;
        text-shadow: 
          0 1px 2px rgba(0, 0, 0, 0.8),
          0 0 10px rgba(0, 255, 255, 0.6) !important;
      }
    }
    
    // 一级菜单 - NavHover 使用 .first-level-menu-item
    .first-level-menu-item {
      color: rgba(0, 255, 255, 0.7) !important;
      background: rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      border-radius: 6px !important;
      margin: 4px 8px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      
      .menu-content {
        color: rgba(0, 255, 255, 0.7) !important;
        
        .menu-icon {
          color: rgba(0, 255, 255, 0.6) !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
        }
        
        .menu-title {
          color: rgba(0, 255, 255, 0.7) !important;
        }
      }
      
      &:hover {
        background: rgba(0, 255, 255, 0.15) !important;
        border-color: rgba(0, 255, 255, 0.5) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
        transform: translateX(4px) !important;
        
        .menu-content {
          color: $ft-cyan !important;
          
          .menu-icon {
            color: $ft-cyan !important;
            filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
          }
          
          .menu-title {
            color: $ft-cyan !important;
          }
        }
      }
      
      &.is-active {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(5, 10, 31, 0.6)) !important;
        border-color: $ft-cyan !important;
        box-shadow: 
          0 0 15px rgba(0, 255, 255, 0.5),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        
        .menu-content {
          color: $ft-cyan !important;
          
          .menu-icon {
            color: $ft-cyan !important;
            filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
          }
          
          .menu-title {
            color: $ft-cyan !important;
            text-shadow: 
              0 0 10px rgba(0, 255, 255, 0.8),
              0 0 20px rgba(0, 255, 255, 0.4) !important;
          }
        }
      }
    }
    
    // 一级菜单 - NavDouble 使用 .first-level-menu .el-menu-item
    .first-level-menu {
      .el-menu-item {
        color: rgba(0, 255, 255, 0.7) !important;
        background: rgba(0, 0, 0, 0.2) !important;
        border: 1px solid rgba(0, 255, 255, 0.2) !important;
        border-radius: 6px !important;
        margin: 4px 8px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        
        .menu-icon-only {
          svg,
          i {
            color: rgba(0, 255, 255, 0.6) !important;
            filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
          }
        }
        
        &:hover {
          background: rgba(0, 255, 255, 0.15) !important;
          border-color: rgba(0, 255, 255, 0.5) !important;
          color: $ft-cyan !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
          
          .menu-icon-only svg,
          .menu-icon-only i {
            color: $ft-cyan !important;
            filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
          }
        }
        
        &.is-active {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(5, 10, 31, 0.6)) !important;
          border-color: $ft-cyan !important;
          color: $ft-cyan !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.5),
            inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
          text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.4) !important;
          
          .menu-icon-only svg,
          .menu-icon-only i {
            color: $ft-cyan !important;
            filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
          }
        }
      }
    }
    
    // 子菜单弹出层
    .sub-menu-popup {
      background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
      border: 2px solid $ft-border !important;
      box-shadow: 
        0 0 16px rgba(0, 255, 255, 0.35),
        0 0 28px rgba(0, 255, 255, 0.18) !important;
      // 性能优化：降低子菜单模糊强度
      backdrop-filter: blur(6px);
      border-radius: 8px;
      
      .sub-menu-container {
        background: linear-gradient(180deg, rgba(5, 10, 31, 0.98), rgba(10, 26, 58, 0.92)) !important;
        border: 1px solid $ft-border !important;
      }
      
      .menu-item,
      .menu-item-wrapper .menu-item {
        color: rgba(0, 255, 255, 0.7) !important;
        background: rgba(0, 0, 0, 0.2) !important;
        border: 1px solid rgba(0, 255, 255, 0.2) !important;
        border-radius: 6px !important;
        margin: 4px 0 !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.15) !important;
          border-color: rgba(0, 255, 255, 0.5) !important;
          color: $ft-cyan !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(5, 10, 31, 0.6)) !important;
          border-color: $ft-cyan !important;
          color: $ft-cyan !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.5),
            inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        }
      }
    }
  }
}

// 扫描线动画
@keyframes scanLine {
  0% {
    left: -100%;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}
</style>

