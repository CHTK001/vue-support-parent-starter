<script setup lang="ts">
import BaseHorizontal from './BaseHorizontal.vue';
</script>

<template>
  <div class="cyberpunk-horizontal-wrapper">
    <BaseHorizontal theme-class="cyberpunk-horizontal" />
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-dark-light: #12121f;
$cyber-glass: rgba(10, 10, 18, 0.95);
$cyber-border: rgba(0, 255, 255, 0.25);

.cyberpunk-horizontal-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.cyberpunk-horizontal) {
    background: linear-gradient(
      180deg,
      rgba(10, 10, 18, 0.98) 0%,
      rgba(18, 18, 31, 0.98) 100%
    ) !important;
    border-bottom: 1px solid $cyber-border !important;
    box-shadow: 
      0 2px 20px rgba(0, 255, 255, 0.15),
      inset 0 -1px 0 rgba(0, 255, 255, 0.2) !important;
    position: relative;
    
    // 顶部霓虹线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        $cyber-cyan 20%,
        $cyber-magenta 50%,
        $cyber-cyan 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-left {
      span {
        color: $cyber-cyan !important;
        text-shadow: 
          0 0 10px rgba(0, 255, 255, 0.5),
          0 0 20px rgba(0, 255, 255, 0.3);
        font-family: 'Rajdhani', 'Roboto', sans-serif;
        letter-spacing: 2px;
      }
      
      img {
        filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.5));
      }
    }
    
    // 横向菜单样式
    .horizontal-header-menu {
      background: transparent !important;
      border-bottom: none !important;
      
      // el-menu 本身
      &.el-menu {
        background: transparent !important;
        --el-menu-bg-color: transparent !important;
      }
      
      .el-menu-item,
      .el-sub-menu__title {
        color: $cyber-cyan !important;
        background: transparent !important;
        border-radius: 4px;
        margin: 0 4px;
        border-bottom: none !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        
        // 底部指示线
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, $cyber-cyan, $cyber-magenta);
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        
        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #fff !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.2),
            inset 0 0 15px rgba(0, 255, 255, 0.05);
          
          &::after {
            width: 80%;
          }
        }
        
        &.is-active {
          background: rgba(0, 255, 255, 0.15) !important;
          color: #fff !important;
          box-shadow: 
            0 0 20px rgba(0, 255, 255, 0.3),
            inset 0 0 20px rgba(0, 255, 255, 0.08);
          
          &::after {
            width: 100%;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          }
        }
        
        .el-icon, svg {
          color: $cyber-cyan !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        }
        
        span {
          color: inherit !important;
        }
      }
      
      // 子菜单样式
      .el-sub-menu {
        .el-sub-menu__title {
          color: $cyber-cyan !important;
          background: transparent !important;
          
          .el-sub-menu__icon-arrow {
            color: $cyber-cyan !important;
          }
        }
        
        &.is-active > .el-sub-menu__title {
          color: #fff !important;
          background: rgba(0, 255, 255, 0.15) !important;
        }
      }
    }
    
    .horizontal-header-right {
      color: $cyber-cyan;
      
      .el-icon, svg {
        color: $cyber-cyan !important;
        transition: all 0.3s ease;
        
        &:hover {
          color: #fff !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 赛博朋克主题 - 横向导航弹出菜单样式
html[data-skin="cyberpunk"] {
  .horizontal-popper {
    background: rgba(10, 10, 18, 0.98) !important;
    border: 1px solid rgba(0, 255, 255, 0.25) !important;
    box-shadow: 
      0 4px 30px rgba(0, 255, 255, 0.2),
      0 0 40px rgba(0, 0, 0, 0.5) !important;
    
    .el-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: #00ffff !important;
        background: transparent !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #fff !important;
        }
        
        &.is-active {
          background: rgba(0, 255, 255, 0.15) !important;
          color: #fff !important;
        }
        
        .el-icon, svg {
          color: #00ffff !important;
        }
      }
    }
  }
}
</style>
