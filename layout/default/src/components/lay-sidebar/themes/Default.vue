<script setup lang="ts">
import BaseSidebar from "./BaseSidebar.vue";
</script>

<template>
  <div class="default-sidebar-wrapper">
    <BaseSidebar theme-class="default-sidebar" />
  </div>
</template>

<style lang="scss" scoped>
.default-sidebar-wrapper {
  height: 100%;
  
  :deep(.default-sidebar) {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.95),
      rgba(255, 255, 255, 0.98)
    ) !important;
    backdrop-filter: blur(12px);
    border-right: 1px solid rgba(0, 0, 0, 0.05) !important;
    
    // Logo 区域样式
    .sidebar-logo-container {
      background: transparent;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      
      .sidebar-logo-link {
        .sidebar-title {
          color: var(--el-text-color-primary);
        }
        
        img {
          filter: none;
        }
      }
    }
    
    .el-menu {
      background: transparent !important;
    }
    
    .el-menu-item,
    .el-sub-menu__title {
      color: var(--app-text-primary);
      background-color: transparent !important;
      
      &:hover {
        color: var(--app-text-primary) !important;
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
    }
    
    .el-menu-item.is-active {
      background: var(--el-color-primary) !important;
      color: #fff !important;
      
      .el-icon, svg, span, div {
        color: #fff !important;
      }
    }
  }
}

.dark .default-sidebar-wrapper {
  :deep(.default-sidebar) {
    background: linear-gradient(
      180deg,
      rgba(28, 28, 35, 0.95),
      rgba(30, 30, 40, 0.98)
    ) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
  }
}
</style>
