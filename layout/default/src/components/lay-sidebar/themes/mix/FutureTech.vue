<script setup lang="ts">
import BaseCustomMix from './BaseCustomMix.vue';
import FutureTechCustomSidebarItem from '../../components/custom-menu/themes/FutureTechCustomSidebarItem.vue';

// 引入 FutureTech 主题弹出层样式
import '../../components/custom-menu/themes/future-tech.scss';
</script>

<template>
  <div class="future-tech-mix-wrapper">
    <BaseCustomMix 
      theme-class="future-tech-mix" 
      popper-class="future-tech-custom-popper"
      :sidebar-item-component="FutureTechCustomSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-mix-wrapper {
  width: 100%;
  height: 100%;
  
  :deep(.future-tech-mix) {
    // 混合导航顶部背景
    background: linear-gradient(90deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
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
    
    // 菜单项样式
    .custom-menu-item, .custom-sub-menu__title {
      color: rgba(0, 255, 255, 0.7) !important;
      background: rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      border-radius: 6px !important;
      transition: all 0.3s ease !important;
      
      &:hover {
        color: $ft-cyan !important;
        background: rgba(0, 255, 255, 0.15) !important;
        border-color: rgba(0, 255, 255, 0.5) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        
        .menu-icon, svg {
          color: $ft-cyan !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
        }
      }
      
      &.is-active {
        color: $ft-cyan !important;
        background: rgba(0, 255, 255, 0.2) !important;
        border-bottom: 2px solid $ft-cyan !important;
        box-shadow: 
          0 0 15px rgba(0, 255, 255, 0.5),
          inset 0 0 10px rgba(0, 255, 255, 0.1) !important;
        text-shadow: 
          0 0 10px rgba(0, 255, 255, 0.8),
          0 0 20px rgba(0, 255, 255, 0.4) !important;
        font-weight: 600;
        
        .menu-icon, svg {
          color: $ft-cyan !important;
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
        }
      }
    }
    
    // 修复：混合布局浅色风格下，激活菜单颜色
    &.light, &.is-light {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(245, 245, 255, 0.9)) !important;
      border-bottom: 2px solid rgba(0, 255, 255, 0.3) !important;
      
      .custom-menu-item, .custom-sub-menu__title {
        color: rgba(0, 0, 0, 0.7) !important;
        background: rgba(255, 255, 255, 0.5) !important;
        
        &.is-active {
          color: $ft-cyan !important;
          background: rgba(0, 255, 255, 0.1) !important;
          border-bottom: 2px solid $ft-cyan !important;
          font-weight: bold;
        }
      }
    }
  }
}

// 暗黑模式适配
:global(html.dark) {
  .future-tech-mix-wrapper :deep(.future-tech-mix) {
    background: linear-gradient(90deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
    border-bottom: 2px solid $ft-border !important;
    
    .custom-menu-item, .custom-sub-menu__title {
      color: rgba(0, 255, 255, 0.7) !important;
      
      &:hover {
        color: $ft-cyan !important;
      }
      
      &.is-active {
        color: $ft-cyan !important;
        background: rgba(0, 255, 255, 0.15) !important;
      }
    }
  }
}
</style>

