<script setup lang="ts">
import BaseCustomMix from './BaseCustomMix.vue';
import HalloweenCustomSidebarItem from '../../components/custom-menu/themes/HalloweenCustomSidebarItem.vue';

// 引入万圣节主题弹出层样式
import '../../components/custom-menu/themes/halloween.scss';
</script>

<template>
  <div class="halloween-mix-wrapper">
    <BaseCustomMix 
      theme-class="halloween-mix" 
      popper-class="halloween-custom-popper"
      :sidebar-item-component="HalloweenCustomSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
// 万圣节主题颜色变量
$hw-pumpkin: #ff7518;
$hw-purple: #2c003e;
$hw-bg: #1a0026;
$hw-green: #76ff03;
$hw-text: #ffffff;

.halloween-mix-wrapper {
  width: 100%;
  height: 100%;
  
  :deep(.halloween-mix) {
    // 混合导航顶部背景
    background: linear-gradient(90deg, $hw-purple 0%, $hw-bg 100%) !important;
    border-bottom: 1px solid rgba($hw-green, 0.3);
    
    // 菜单项样式
    .custom-menu-item, .custom-sub-menu__title {
      color: var(--hover-nav-menu-color) !important;
      
      &:hover {
        color: #fff !important;
        background: rgba($hw-pumpkin, 0.1) !important;
        
        .menu-icon, svg {
          color: #fff !important;
        }
      }
      
      &.is-active {
        color: #fff !important; // 默认深色背景下高亮色
        background: rgba($hw-pumpkin, 0.15) !important;
        border-bottom: 2px solid $hw-pumpkin !important;
        
        .menu-icon, svg {
          color: #fff !important;
        }
      }
    }
    
    // 修复：混合布局浅色风格下，激活菜单颜色为黑色 (用户反馈点 1)
    // 假设浅色风格会有类似 .is-light 的类名，或者我们强制处理某些情况
    // 如果父容器或自身有 light 类
    &.light, &.is-light {
      background: #ffffff !important;
      
      .custom-menu-item, .custom-sub-menu__title {
        color: #333333 !important;
        
        &.is-active {
          color: $hw-pumpkin !important; // 黑色 -> 南瓜色
          background: rgba($hw-pumpkin, 0.05) !important;
          border-bottom: 2px solid $hw-pumpkin !important;
          font-weight: bold;
        }
      }
    }
  }
}

// 暗黑模式适配 (用户反馈点 4 - 优化配色)
:global(html.dark) {
  .halloween-mix-wrapper :deep(.halloween-mix) {
    background: #0f0f0f !important; // 更深的黑色背景，减少紫色饱和度
    border-bottom: 1px solid #333;
    
    .custom-menu-item, .custom-sub-menu__title {
      color: var(--hover-nav-menu-color) !important; // 柔和的灰色文字
      
      &:hover {
        color: #fff !important; // 悬停才显示主题色
      }
      
      &.is-active {
        color: #fff !important;
        background: rgba(255, 117, 24, 0.1) !important;
      }
    }
  }
}
</style>
