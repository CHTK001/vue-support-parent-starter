<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import ChristmasSidebarItem from '../components/themes/ChristmasSidebarItem.vue';
import { ref, onMounted } from 'vue';

// 简单的雪花装饰，避免过多 DOM
const sidebarSnowflakes = ref<{ left: string; top: string; size: string; opacity: number }[]>([]);

onMounted(() => {
  for (let i = 0; i < 10; i++) {
    sidebarSnowflakes.value.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${4 + Math.random() * 6}px`,
      opacity: 0.1 + Math.random() * 0.3
    });
  }
});
</script>

<template>
  <div class="christmas-sidebar-wrapper">
    <!-- 背景装饰层 -->
    <div class="sidebar-bg-decor">
      <span 
        v-for="(snow, index) in sidebarSnowflakes" 
        :key="index"
        class="static-snowflake"
        :style="{ 
          left: snow.left, 
          top: snow.top, 
          fontSize: snow.size,
          opacity: snow.opacity
        }"
      >❄</span>
    </div>

    <BaseSidebar 
      theme-class="christmas-sidebar" 
      :sidebar-item-component="ChristmasSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

// 圣诞主题变量定义
.christmas-sidebar-wrapper {
  --xmas-green: #144923;
  --xmas-green-dark: #0d3316;
  --xmas-red: #d32f2f;
  --xmas-red-light: #ef5350;
  --xmas-gold: #ffb300;
  --xmas-white: #ffffff;
  
  --sidebar-bg-color: linear-gradient(180deg, var(--xmas-green-dark) 0%, var(--xmas-green) 100%);
  --sidebar-text-color: var(--xmas-white);
  --sidebar-active-bg: rgba(211, 47, 47, 0.15);
  --sidebar-hover-bg: rgba(255, 255, 255, 0.1);
  --sidebar-border-color: rgba(255, 179, 0, 0.2);

  height: 100%;
  position: relative;
  
  // 背景装饰层
  .sidebar-bg-decor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    
    .static-snowflake {
      position: absolute;
      color: var(--xmas-white);
      user-select: none;
    }
  }

  :deep(.christmas-sidebar) {
    background: var(--sidebar-bg-color) !important;
    border-right: 1px solid var(--sidebar-border-color) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1; // 确保在装饰层之上
    
    // 覆盖 Logo 区域
    .sidebar-logo-container {
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--sidebar-border-color);
      
      .sidebar-logo-link .sidebar-title {
        color: var(--xmas-gold) !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
    }
    
    // 覆盖菜单背景
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    // 底部折叠
    .left-collapse, .center-collapse {
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--sidebar-border-color);
      color: var(--xmas-gold);
      
      &:hover {
        background: var(--xmas-red);
        color: var(--xmas-white);
      }
    }
    
    // 二级导航样式（内联展开）
    .el-sub-menu {
      .el-sub-menu__title {
        color: var(--xmas-white) !important;
        
        &:hover {
          background: rgba(211, 47, 47, 0.15) !important;
          color: var(--xmas-gold) !important;
        }
      }
      
      &.is-opened .el-sub-menu__title {
        color: var(--xmas-gold) !important;
      }
      
      .el-menu {
        background: rgba(13, 61, 18, 0.8) !important;
        
        .el-menu-item {
          color: var(--xmas-white) !important;
          background: transparent !important;
          border: none !important;
          margin: 2px 8px !important;
          
          &:hover {
            background: rgba(211, 47, 47, 0.2) !important;
            color: var(--xmas-gold) !important;
          }
          
          &.is-active {
            background: linear-gradient(135deg, var(--xmas-red), var(--xmas-red-light)) !important;
            color: var(--xmas-white) !important;
            border-left: 3px solid var(--xmas-gold) !important;
            
            .el-icon, svg, span, div {
              color: var(--xmas-white) !important;
            }
          }
          
          .el-icon, svg {
            color: var(--xmas-gold) !important;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 二级导航弹出层全局样式（teleport 到 body）
html[data-skin="christmas"] {
  $xmas-green: #144923;
  $xmas-green-dark: #0d3316;
  $xmas-red: #d32f2f;
  $xmas-red-light: #ef5350;
  $xmas-gold: #ffb300;
  $xmas-white: #ffffff;

  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: linear-gradient(135deg, rgba($xmas-green-dark, 0.98) 0%, rgba($xmas-green, 0.98) 100%) !important;
    border: 2px solid rgba($xmas-gold, 0.4) !important;
    border-radius: 8px !important;
    box-shadow:
      0 0 25px rgba($xmas-gold, 0.15),
      0 15px 40px rgba(0, 0, 0, 0.4) !important;
    overflow: hidden !important;
    padding: 6px !important;
    position: relative;

    // 顶部金色装饰线
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, $xmas-gold 20%, $xmas-white 50%, $xmas-gold 80%, transparent);
      z-index: 1;
    }

    .el-menu-item {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, rgba($xmas-green-dark, 0.7) 0%, rgba($xmas-green, 0.7) 100%) !important;
      border: 1.5px solid rgba($xmas-gold, 0.25) !important;
      color: $xmas-white !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;

      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.9) 0%, rgba($xmas-red-light, 0.9) 100%) !important;
        color: $xmas-white !important;
        border-color: rgba($xmas-gold, 0.5) !important;
        transform: translateX(4px) !important;
        box-shadow:
          0 4px 12px rgba($xmas-red, 0.25),
          0 2px 8px rgba($xmas-green, 0.4) !important;
      }

      .el-icon, svg, .sub-menu-icon {
        color: $xmas-gold !important;
        margin-right: 8px;
      }

      span, .el-text {
        color: inherit !important;
      }

      &.is-active {
        background: linear-gradient(135deg, $xmas-red 0%, $xmas-red-light 100%) !important;
        color: $xmas-white !important;
        border: 2px solid $xmas-gold !important;
        font-weight: 700;
        box-shadow:
          0 4px 16px rgba($xmas-red, 0.5),
          0 0 20px rgba($xmas-gold, 0.3) !important;

        .el-icon, svg, .sub-menu-icon, span, .el-text {
          color: $xmas-white !important;
        }

        &::after {
          content: '';
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 70%;
          background: linear-gradient(to bottom, $xmas-gold, $xmas-white, $xmas-gold);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba($xmas-gold, 0.8);
        }
      }
    }

    .el-sub-menu__title {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, rgba($xmas-green-dark, 0.7) 0%, rgba($xmas-green, 0.7) 100%) !important;
      border: 1.5px solid rgba($xmas-gold, 0.25) !important;
      color: $xmas-white !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.9) 0%, rgba($xmas-red-light, 0.9) 100%) !important;
        color: $xmas-gold !important;
        border-color: rgba($xmas-gold, 0.5) !important;
        transform: translateX(4px) !important;
      }

      .el-icon, svg {
        color: $xmas-gold !important;
      }

      .el-sub-menu__icon-arrow {
        color: $xmas-gold !important;
      }
    }
  }
}
</style>
