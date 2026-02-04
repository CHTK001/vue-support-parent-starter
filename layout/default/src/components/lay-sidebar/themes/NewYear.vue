<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import NewYearSidebarItem from '../components/themes/NewYearSidebarItem.vue';
</script>

<template>
  <div class="new-year-sidebar-wrapper">
    <!-- 冰棱装饰 -->
    <div class="ice-decor"></div>
    
    <BaseSidebar 
      theme-class="new-year-sidebar" 
      :sidebar-item-component="NewYearSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
.new-year-sidebar-wrapper {
  --ny-bg-start: #f0f8ff;
  --ny-bg-end: #e6f7ff;
  --ny-primary: #4EA8DE;
  --ny-text: #1E5F8C;
  --ny-active-bg: linear-gradient(90deg, rgba(78, 168, 222, 0.15), rgba(78, 168, 222, 0.05));
  --ny-hover-bg: rgba(255, 255, 255, 0.6);
  --ny-border: rgba(78, 168, 222, 0.2);

  height: 100%;
  position: relative;
  
  // 顶部冰棱装饰
  .ice-decor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #b8e0f2, #4ea8de, #b8e0f2);
    z-index: 2;
    box-shadow: 0 0 10px rgba(78, 168, 222, 0.5);
  }

  :deep(.new-year-sidebar) {
    background: linear-gradient(180deg, var(--ny-bg-start), var(--ny-bg-end)) !important;
    border-right: 1px solid var(--ny-border) !important;
    backdrop-filter: blur(10px);
    
    .sidebar-logo-container {
      background: rgba(255, 255, 255, 0.3);
      border-bottom: 1px solid var(--ny-border);
      
      .sidebar-logo-link .sidebar-title {
        color: var(--ny-primary) !important;
        text-shadow: 0 0 10px rgba(78, 168, 222, 0.2);
      }
    }
    
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .left-collapse, .center-collapse {
      background: rgba(255, 255, 255, 0.5);
      border-top: 1px solid var(--ny-border);
      color: var(--ny-primary);
      
      &:hover {
        background: var(--ny-primary);
        color: #fff;
      }
    }
  }
}

:global(.dark) .new-year-sidebar-wrapper {
  --ny-bg-start: #0f1c2e;
  --ny-bg-end: #142336;
  --ny-text: #b8e0f2;
  --ny-primary: #7cc2e8;
  --ny-active-bg: linear-gradient(90deg, rgba(124, 194, 232, 0.2), rgba(124, 194, 232, 0.05));
  --ny-hover-bg: rgba(255, 255, 255, 0.05);
  --ny-border: rgba(124, 194, 232, 0.15);
  
  .ice-decor {
    background: linear-gradient(90deg, #1e5f8c, #4ea8de, #1e5f8c);
    box-shadow: 0 0 15px rgba(78, 168, 222, 0.3);
  }
}
</style>
