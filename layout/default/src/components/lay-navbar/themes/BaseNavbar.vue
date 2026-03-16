<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import CustomBreadcrumb from "../../breadcrumb/CustomBreadcrumb.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";
import LayTool from "../../lay-tool/index.vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import { onBeforeUnmount, ref, computed } from "vue";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

const {
  layout,
  device,
  pureApp,
  toggleSideBar,
} = useNav();

const { $storage } = useGlobal<any>();
const showBreadcrumb = ref($storage?.configure?.showBreadcrumb ?? true);

// drawer 布局下汉堡按钮菜单显示状态
const drawerMenuVisible = ref(false);

function toggleDrawerMenu() {
  drawerMenuVisible.value = !drawerMenuVisible.value;
  // 通过 emitter 通知 NavPopover 切换菜单
  emitter.emit("drawerHamburgerToggle", drawerMenuVisible.value);
}

emitter.on("breadcrumbChange", (value: boolean) => {
  showBreadcrumb.value = value;
});

// 监听菜单关闭事件（点击外部关闭后同步状态）
emitter.on("drawerMenuClosed", () => {
  drawerMenuVisible.value = false;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbChange");
  emitter.off("drawerMenuClosed");
});
</script>

<template>
  <div :class="['base-navbar', themeClass]">
    <!-- 装饰元素 -->
    <div class="decor-pattern"></div>
    
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <!-- drawer 布局：汉堡按钮内联在 navbar 中 -->
    <button
      v-if="layout === 'drawer' && device !== 'mobile'"
      class="drawer-hamburger-inline"
      :class="{ 'is-active': drawerMenuVisible }"
      @click.stop="toggleDrawerMenu"
      aria-label="打开导航菜单"
    >
      <span class="hamburger-line" />
      <span class="hamburger-line" />
      <span class="hamburger-line" />
    </button>

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

    <LayNavMix v-if="layout === 'mix'" />

    <div
      v-if="
        layout === 'vertical' ||
        layout === 'hover' ||
        layout === 'card' ||
        layout === 'double' ||
        layout === 'drawer'
      "
      class="vertical-header-right"
    >
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../../styles/mixins.scss" as *;

// 基础布局样式 - 所有主题共用
.base-navbar {
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  // height: 48px; // Removed, used in mixin
  @include lay-header-style;
  
  .decor-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  
  .hamburger-container {
    z-index: 10;
  }
  
  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    padding-right: 16px; // 调整为 16px
    gap: 16px; // 调整间距
    margin-left: auto;
    
    // 24px 分隔线
    &::before {
      content: "";
      width: 1px;
      height: 24px;
      background: #e5e7eb;
      margin-right: 8px;
      
      :global(.dark) & {
        background: #4c4d4f;
      }
    }
  }

  .breadcrumb-container {
    margin-left: 20px;
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    z-index: 10;
  }
}

// drawer 布局内联汉堡按钮
.drawer-hamburger-inline {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: transparent;
  transition: background 0.2s, transform 0.15s;
  padding: 0;
  margin-left: 12px;
  flex-shrink: 0;

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  &.is-active {
    background: var(--el-color-primary-light-8);

    .hamburger-line:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .hamburger-line:nth-child(2) {
      opacity: 0;
    }
    .hamburger-line:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }
  }

  html.dark & {
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.hamburger-line {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-text-color-primary);
  transition: transform 0.25s, opacity 0.2s, background 0.2s;
}
</style>
