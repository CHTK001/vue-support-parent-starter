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
  }
}
</style>
