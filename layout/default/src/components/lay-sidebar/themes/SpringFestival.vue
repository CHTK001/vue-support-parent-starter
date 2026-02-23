<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import SpringFestivalSidebarItem from '../components/themes/SpringFestivalSidebarItem.vue';
import { ref, onMounted } from 'vue';

// 漂浮的剪纸装饰或福字
const floatItems = ref<{ left: string; top: string; size: string; opacity: number; char: string }[]>([]);
const chars = ['福', '春', '吉', '祥'];

onMounted(() => {
  for (let i = 0; i < 6; i++) {
    floatItems.value.push({
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`,
      size: `${14 + Math.random() * 10}px`,
      opacity: 0.05 + Math.random() * 0.1, // 非常淡
      char: chars[Math.floor(Math.random() * chars.length)]
    });
  }
});
</script>

<template>
  <div class="spring-festival-sidebar-wrapper">
    <!-- 背景装饰 -->
    <div class="sidebar-bg-decor">
      <span 
        v-for="(item, index) in floatItems" 
        :key="index"
        class="bg-char"
        :style="{ 
          left: item.left, 
          top: item.top, 
          fontSize: item.size,
          opacity: item.opacity
        }"
      >{{ item.char }}</span>
    </div>

    <BaseSidebar 
      theme-class="spring-festival-sidebar" 
      :sidebar-item-component="SpringFestivalSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

.spring-festival-sidebar-wrapper {
  --sf-red: #b31217;
  --sf-red-dark: #8e0e12;
  --sf-red-light: #d71920;
  --sf-gold: #ffcf40;
  --sf-gold-light: #ffe082;
  --sf-white: #ffffff;
  
  --sidebar-bg-color: linear-gradient(180deg, var(--sf-red) 0%, var(--sf-red-dark) 100%);
  --sidebar-text-color: var(--hover-nav-menu-color);
  --sidebar-active-bg: linear-gradient(90deg, rgba(255, 207, 64, 0.15), rgba(255, 207, 64, 0.05));
  --sidebar-hover-bg: rgba(255, 255, 255, 0.08);
  --sidebar-border-color: rgba(255, 207, 64, 0.3);

  height: 100%;
  position: relative;
  
  .sidebar-bg-decor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    
    .bg-char {
      position: absolute;
      color: var(--sf-gold);
      font-family: "KaiTi", "STKaiti", serif; // 楷体
      font-weight: bold;
      transform: rotate(-10deg);
    }
  }

  :deep(.spring-festival-sidebar) {
    background: var(--sidebar-bg-color) !important;
    border-right: 1px solid var(--sidebar-border-color) !important;
    position: relative;
    z-index: 1;
    
    // Logo
    .sidebar-logo-container {
      background: rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid var(--sidebar-border-color);
      
      .sidebar-logo-link .sidebar-title {
        color: var(--sf-gold) !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }
    }
    
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .left-collapse, .center-collapse {
      background: rgba(0, 0, 0, 0.1);
      border-top: 1px solid var(--sidebar-border-color);
      color: var(--sf-gold);
      
      &:hover {
        background: var(--sf-red-light);
        color: var(--sf-white);
      }
    }
    
    // 二级导航样式（内联展开）
    .el-sub-menu {
      .el-sub-menu__title {
        color: var(--sf-gold) !important;
        
        &:hover {
          background: rgba(255, 207, 64, 0.15) !important;
          color: var(--sf-white) !important;
        }
      }
      
      &.is-opened .el-sub-menu__title {
        color: var(--sf-white) !important;
      }
      
      .el-menu {
        background: rgba(142, 14, 18, 0.8) !important;
        
        .el-menu-item {
          color: var(--sf-gold-light) !important;
          background: transparent !important;
          border: none !important;
          margin: 2px 8px !important;
          
          &:hover {
            background: rgba(255, 207, 64, 0.2) !important;
            color: var(--sf-white) !important;
          }
          
          &.is-active {
            background: linear-gradient(135deg, var(--sf-gold), var(--sf-gold-light)) !important;
            color: var(--sf-red-dark) !important;
            border-left: 3px solid var(--sf-gold) !important;
            
            .el-icon, svg, span, div {
              color: var(--sf-red-dark) !important;
            }
          }
          
          .el-icon, svg {
            color: var(--sf-gold) !important;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 二级导航弹出层全局样式（teleport 到 body）
html[data-skin="spring-festival"] {
  $sf-red: #b31217;
  $sf-red-dark: #8e0e12;
  $sf-red-light: #d71920;
  $sf-gold: #ffcf40;
  $sf-gold-light: #ffe082;
  $sf-white: #ffffff;

  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: linear-gradient(135deg, rgba($sf-red, 0.98) 0%, rgba($sf-red-dark, 0.98) 100%) !important;
    border: 2px solid rgba($sf-gold, 0.4) !important;
    border-radius: 8px !important;
    box-shadow:
      0 0 25px rgba($sf-gold, 0.15),
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
      background: linear-gradient(90deg, transparent, $sf-gold 20%, $sf-gold-light 50%, $sf-gold 80%, transparent);
      z-index: 1;
    }

    .el-menu-item {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, rgba($sf-red-dark, 0.7) 0%, rgba($sf-red, 0.7) 100%) !important;
      border: 1.5px solid rgba($sf-gold, 0.25) !important;
      color: $sf-gold-light !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;

      &:hover {
        background: linear-gradient(135deg, rgba($sf-red, 0.9) 0%, rgba($sf-red-light, 0.9) 100%) !important;
        color: $sf-white !important;
        border-color: rgba($sf-gold, 0.5) !important;
        transform: translateX(4px) !important;
        box-shadow:
          0 4px 12px rgba($sf-gold, 0.25),
          0 2px 8px rgba($sf-red, 0.4) !important;
      }

      .el-icon, svg, .sub-menu-icon {
        color: $sf-gold !important;
        margin-right: 8px;
      }

      span, .el-text {
        color: inherit !important;
      }

      &.is-active {
        background: linear-gradient(135deg, $sf-gold 0%, $sf-gold-light 100%) !important;
        color: $sf-red-dark !important;
        border: 2px solid $sf-gold !important;
        font-weight: 700;
        box-shadow:
          0 4px 16px rgba($sf-gold, 0.5),
          0 0 20px rgba($sf-gold, 0.3) !important;

        .el-icon, svg, .sub-menu-icon, span, .el-text {
          color: $sf-red-dark !important;
        }

        &::after {
          content: '';
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 70%;
          background: linear-gradient(to bottom, $sf-gold, $sf-gold-light, $sf-gold);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba($sf-gold, 0.8);
        }
      }
    }

    .el-sub-menu__title {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, rgba($sf-red-dark, 0.7) 0%, rgba($sf-red, 0.7) 100%) !important;
      border: 1.5px solid rgba($sf-gold, 0.25) !important;
      color: $sf-gold-light !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: linear-gradient(135deg, rgba($sf-red, 0.9) 0%, rgba($sf-red-light, 0.9) 100%) !important;
        color: $sf-white !important;
        border-color: rgba($sf-gold, 0.5) !important;
        transform: translateX(4px) !important;
      }

      .el-icon, svg {
        color: $sf-gold !important;
      }

      .el-sub-menu__icon-arrow {
        color: $sf-gold !important;
      }
    }
  }
}
</style>
