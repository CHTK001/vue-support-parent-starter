<script setup lang="ts">
import BaseCustomHorizontal from './BaseCustomHorizontal.vue';
import FutureTechCustomSidebarItem from '../../components/custom-menu/themes/FutureTechCustomSidebarItem.vue';

// 引入 FutureTech 主题弹出层样式
import '../../components/custom-menu/themes/future-tech.scss';
</script>

<template>
  <div class="future-tech-horizontal-wrapper">
    <BaseCustomHorizontal 
      theme-class="future-tech-horizontal" 
      popper-class="future-tech-custom-popper"
      :sidebar-item-component="FutureTechCustomSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-cyan-dark: #00cccc;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-horizontal-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.future-tech-horizontal) {
    background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
    border-bottom: 2px solid $ft-border !important;
    box-shadow: 
      0 2px 20px rgba(0, 255, 255, 0.15),
      inset 0 1px 0 rgba(0, 255, 255, 0.2) !important;
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;

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
    }

    // 顶部静态高亮线，关闭扫描动画
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $ft-cyan, transparent);
      opacity: 0.7;
    }
    
    .horizontal-header-left {
      span {
        color: $ft-cyan !important;
        text-shadow: 
          0 1px 2px rgba(0, 0, 0, 0.8),
          0 0 10px rgba(0, 255, 255, 0.6) !important;
        font-weight: 600;
      }
      
      img {
        filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
      }
    }
    
    // 横向菜单样式
    .horizontal-header-menu {
      background: transparent !important;
      border-bottom: none !important;
      
      .custom-menu-item,
      .custom-sub-menu__title {
        color: rgba(0, 255, 255, 0.7) !important;
        background: rgba(0, 0, 0, 0.2) !important;
        border-radius: 6px;
        margin: 0 4px;
        border-bottom: none !important;
        transition: all 0.3s ease;
        position: relative;
        border: 1px solid rgba(0, 255, 255, 0.2) !important;
        
        // 底部指示线
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: $ft-cyan;
          transform: translateX(-50%);
          transition: width 0.3s ease;
          box-shadow: 0 0 8px $ft-cyan;
        }
        
        &:hover {
          background: rgba(0, 255, 255, 0.15) !important;
          color: $ft-cyan !important;
          border-color: rgba(0, 255, 255, 0.5) !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
          
          &::after {
            width: 80%;
          }
          
          .menu-icon, svg {
             color: $ft-cyan !important;
             filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
          }
        }
        
        &.is-active {
          background: rgba(0, 255, 255, 0.2) !important;
          color: $ft-cyan !important;
          border-color: $ft-cyan !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.5),
            inset 0 0 10px rgba(0, 255, 255, 0.1) !important;
          text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.4) !important;
          
          &::after {
            width: 100%;
            box-shadow: 0 0 12px $ft-cyan;
          }
          
          .menu-icon, svg {
             color: $ft-cyan !important;
             filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
          }
        }
        
        .menu-icon, svg {
          color: rgba(0, 255, 255, 0.6) !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
          transition: all 0.3s ease;
        }
        
        span {
          color: inherit !important;
        }
      }
      
      // 子菜单样式
      .custom-sub-menu {
        .custom-sub-menu__title {
          color: rgba(0, 255, 255, 0.7) !important;
          background: rgba(0, 0, 0, 0.2) !important;
          
          .custom-sub-menu__icon-arrow {
            color: inherit !important;
          }
        }
        
        &.is-active > .custom-sub-menu__title {
          color: $ft-cyan !important;
          background: rgba(0, 255, 255, 0.15) !important;
        }
      }
    }
    
    .horizontal-header-right {
      color: rgba(0, 255, 255, 0.7);
      
      .menu-icon, svg {
        color: rgba(0, 255, 255, 0.6) !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
        transition: all 0.3s ease;
        
        &:hover {
          color: $ft-cyan !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
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

