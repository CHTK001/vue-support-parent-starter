<script setup lang="ts">
import BaseSidebar from "./BaseSidebar.vue";
import HalloweenSidebarItem from "../components/themes/HalloweenSidebarItem.vue";
</script>

<template>
  <BaseSidebar
    theme-class="default-sidebar halloween-sidebar"
    :sidebar-item-component="HalloweenSidebarItem"
  />
</template>

<style lang="scss">
// 万圣节侧边栏样式 - 使用更高优先级覆盖默认样式
.sidebar-container.halloween-sidebar,
.halloween-sidebar {
  background: linear-gradient(180deg, rgba(44, 0, 62, 0.95), rgba(26, 0, 38, 0.9)) !important;
  border-right: 2px solid rgba(255, 117, 24, 0.4) !important;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5) !important;

  .el-menu {
    background: transparent !important;
  }

  .el-menu-item {
    color: rgba(255, 117, 24, 0.85) !important;

    &:hover {
      background: rgba(255, 117, 24, 0.15) !important;
      color: #76ff03 !important;
    }

    &.is-active {
      background: rgba(255, 117, 24, 0.2) !important;
      color: #ff7518 !important;
      border: 1px solid rgba(255, 117, 24, 0.5) !important;
    }
  }

  .el-sub-menu__title {
    color: rgba(255, 117, 24, 0.85) !important;

    &:hover {
      background: rgba(255, 117, 24, 0.15) !important;
      color: #76ff03 !important;
    }
  }
}

// 深色模式适配
html.dark {
  .sidebar-container.halloween-sidebar,
  .halloween-sidebar {
    background: linear-gradient(180deg, rgba(44, 0, 62, 0.98), rgba(26, 0, 38, 0.95)) !important;
    border-right: 2px solid rgba(255, 117, 24, 0.5) !important;
    box-shadow: 2px 0 15px rgba(0, 0, 0, 0.7) !important;
  }
}
</style>
