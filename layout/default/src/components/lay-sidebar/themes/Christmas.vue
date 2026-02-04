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
  --sidebar-active-bg: linear-gradient(135deg, var(--xmas-red), var(--xmas-red-light));
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
  }
}
</style>
