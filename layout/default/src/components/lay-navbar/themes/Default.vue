<script setup lang="ts">
<<<<<<< HEAD
import { ref, onBeforeUnmount } from "vue";
import { useNav } from "../../../hooks/useNav";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import NavbarBrand from "../components/NavbarBrand.vue";
import NavbarActions from "../components/NavbarActions.vue";
import CustomBreadcrumb from "../../breadcrumb/CustomBreadcrumb.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";

const { layout, device, pureApp, toggleSideBar } = useNav();
const { $storage } = useGlobal<any>();

const showBreadcrumb = ref($storage?.configure?.showBreadcrumb ?? true);
const drawerMenuVisible = ref(false);

function toggleDrawerMenu() {
  drawerMenuVisible.value = !drawerMenuVisible.value;
  emitter.emit("drawerHamburgerToggle", drawerMenuVisible.value);
}

emitter.on("breadcrumbChange", (value: boolean) => {
  showBreadcrumb.value = value;
});

emitter.on("drawerMenuClosed", () => {
  drawerMenuVisible.value = false;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbChange");
  emitter.off("drawerMenuClosed");
});
=======
import BaseNavbar from "./BaseNavbar.vue";
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
</script>

<template>
  <div class="default-navbar">
    <!-- 移动端汉堡按钮 -->
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <!-- drawer 布局内联汉堡按钮 -->
    <button
      v-if="layout === 'drawer' && device !== 'mobile'"
      class="drawer-hamburger"
      :class="{ 'is-active': drawerMenuVisible }"
      @click.stop="toggleDrawerMenu"
      aria-label="打开导航菜单"
    >
      <span class="hamburger-line" />
      <span class="hamburger-line" />
      <span class="hamburger-line" />
    </button>

    <!-- mix 布局：顶部混合导航 -->
    <LayNavMix v-if="layout === 'mix'" />

    <!-- 非 mix/mobile 布局：面包屑 -->
    <CustomBreadcrumb
      v-if="layout !== 'mix' && layout !== 'drawer' && device !== 'mobile' && showBreadcrumb"
      class="breadcrumb-container"
      :show-home="true"
      :show-icon="true"
      separator="arrow"
      :max-items="5"
      :enable-animation="true"
      :show-tooltip="true"
    />

    <!-- 右侧工具栏（vertical/hover/card/double/drawer 布局） -->
    <NavbarActions
      v-if="['vertical', 'hover', 'card', 'double', 'drawer'].includes(layout)"
    />
  </div>
</template>

<style lang="scss" scoped>
<<<<<<< HEAD
.default-navbar {
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--dt-navbar-height, 56px);
  // 毛玻璃背景
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  -webkit-backdrop-filter: var(--dt-glass-blur-light);
  border-bottom: 1px solid var(--dt-glass-border-light);
  transition: background var(--dt-transition-slow), border-color var(--dt-transition-slow);
  position: relative;

  // 深色模式
  html.dark & {
    background: var(--dt-glass-bg-dark);
    backdrop-filter: var(--dt-glass-blur-dark);
    -webkit-backdrop-filter: var(--dt-glass-blur-dark);
    border-bottom-color: var(--dt-glass-border-dark);
  }

  .hamburger-container {
    z-index: 10;
    flex-shrink: 0;
  }

  .drawer-hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    width: 36px;
    height: 36px;
    border-radius: var(--dt-radius-md);
    border: none;
    cursor: pointer;
    background: transparent;
    transition: background var(--dt-transition-fast);
    padding: 0;
    margin-left: var(--dt-space-3);
    flex-shrink: 0;

    &:hover {
      background: var(--dt-hover-bg);
    }

    &.is-active {
      background: var(--dt-active-bg);

      .hamburger-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .hamburger-line:nth-child(2) { opacity: 0; }
      .hamburger-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    }
  }

  .hamburger-line {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: var(--el-text-color-primary);
    transition: transform var(--dt-transition-normal), opacity var(--dt-transition-fast);
  }

  .breadcrumb-container {
    margin-left: var(--dt-space-5);
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 var(--dt-space-5);
    z-index: 10;
=======
// 使用 CSS 变量管理主题样式，保留 :deep() 但通过变量提升可维护性
.default-wrapper {
  // Use semantic tokens from the new theme system
  // The value of these variables is controlled by the global ThemeManager
  --default-navbar-bg: var(--stitch-lay-bg-overlay, rgba(255, 255, 255, 0.8));
  --default-navbar-border: var(--stitch-lay-border, rgba(0, 0, 0, 0.05));
  --default-navbar-backdrop: blur(12px);

  width: 100%;

  :deep(.default-navbar) {
    background: var(--default-navbar-bg);
    color: var(--stitch-lay-text-main);
    backdrop-filter: var(--default-navbar-backdrop);
    -webkit-backdrop-filter: var(--default-navbar-backdrop);
    border-bottom: 1px solid var(--default-navbar-border);
    transition: var(--stitch-lay-transition, all 0.3s ease);
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  }
}
</style>
