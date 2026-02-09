<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  emitter,
  findRouteByPath,
  getParentPaths,
  usePermissionStoreHook,
} from "@repo/core";
import { useNav } from "../../../hooks/useNav";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace } from "@repo/config";
import { isAllEmpty } from "@pureadmin/utils";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Component, provide } from "vue";
import LaySidebarLogo from "../components/SidebarLogo.vue";
import DefaultSidebarItem from "../components/themes/DefaultSidebarItem.vue";
import LaySidebarLeftCollapse from "../components/SidebarLeftCollapse.vue";
import LaySidebarCenterCollapse from "../components/SidebarCenterCollapse.vue";
import { localStorageProxy } from "@repo/utils";

// 接收主题类名和主题 SidebarItem 组件
const props = defineProps<{
  themeClass?: string;
  sidebarItemComponent?: Component;
}>();

// 计算实际使用的 SidebarItem 组件
const ThemeSidebarItem = computed(() => props.sidebarItemComponent || DefaultSidebarItem);

// 提供给子组件（用于递归渲染）
provide('themeSidebarItem', ThemeSidebarItem);

const route = useRoute();
const isShow = ref(false);

// 提取 store 引用到顶层，避免重复调用
const permissionStore = usePermissionStoreHook();
const showLogo = ref(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.showLogo ?? true
);

const {
  device,
  pureApp,
  isCollapse,
  tooltipEffect,
  menuSelect,
  toggleSideBar,
} = useNav();

// 使用 shallowRef 避免深度响应式开销
const subMenuData = shallowRef([]);

const menuData = computed(() => {
  return pureApp?.layout === "mix" && device.value !== "mobile"
    ? subMenuData.value
    : permissionStore.wholeMenus;
});

const loading = computed(() =>
  pureApp?.layout === "mix" ? false : menuData.value.length === 0 ? true : false
);

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

function getSubMenuData() {
  const path = defaultActive.value;
  subMenuData.value = [];
  // path的上级路由组成的数组
  const parentPathArr = getParentPaths(path, permissionStore.wholeMenus);
  // 当前路由的父级路由信息
  const parenetRoute = findRouteByPath(
    parentPathArr[0] || path,
    permissionStore.wholeMenus
  );
  if (!parenetRoute?.children) return;
  subMenuData.value = parenetRoute?.children;
}

watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/redirect")) return;
    getSubMenuData();
    menuSelect(newPath);
  },
  {
    immediate: true,
  }
);

// 移除 deep: true，使用数组长度变化作为触发条件
watch(
  () => permissionStore.wholeMenus.length,
  () => {
    getSubMenuData();
  }
);

onMounted(() => {
  getSubMenuData();

  emitter.on("logoChange", (key) => {
    showLogo.value = key;
  });
});

onBeforeUnmount(() => {
  // 解绑`logoChange`公共事件,防止多次触发
  emitter.off("logoChange");
});
</script>

<template>
  <div
    v-loading="loading"
    :class="[
      'base-sidebar',
      'sidebar-custom',
      'sidebar-container',
      themeClass,
      showLogo ? 'has-logo' : 'no-logo',
    ]"
    @mouseenter.prevent="isShow = true"
    @mouseleave.prevent="isShow = false"
  >
    <LaySidebarLogo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar
      wrap-class="scrollbar-wrapper"
      :class="[device === 'mobile' ? 'mobile' : 'pc']"
    >
      <el-menu
        router
        mode="vertical"
        popper-class="pure-scrollbar"
        class="outer-most select-none"
        :collapse="isCollapse"
        :collapse-transition="false"
        :popper-effect="tooltipEffect"
        :default-active="defaultActive"
      >
        <span
          v-for="(routes, index) in menuData"
          :key="index"
          :style="{ '--index': index }"
          class="menu-item-animate-wrapper"
        >
          <component
            :is="ThemeSidebarItem"
            :key="routes.path"
            :item="routes"
            :base-path="routes.path"
            class="outer-most select-none"
          />
        </span>
      </el-menu>
    </el-scrollbar>
    <LaySidebarCenterCollapse
      v-if="device !== 'mobile' && (isShow || isCollapse)"
      :is-active="pureApp?.sidebar?.opened"
      @toggleClick="toggleSideBar"
    />
    <LaySidebarLeftCollapse
      v-if="device !== 'mobile'"
      :is-active="pureApp?.sidebar?.opened"
      @toggleClick="toggleSideBar"
    />
  </div>
</template>

<style lang="scss" scoped>
// 基础布局样式 - 只保留结构，主题样式由全局 SCSS 控制
.base-sidebar {
  position: relative;
  height: 100%;
  transition: none !important;
  overflow: visible;
  z-index: 0;

  &.has-logo {
    :deep(.scrollbar-wrapper) {
      height: calc(100% - 60px);
    }
  }

  &.no-logo {
    :deep(.scrollbar-wrapper) {
      height: 100%;
    }
  }
}

.sidebar-custom {
  --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  box-shadow:
    var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);

  .dark & {
    --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.menu-item-animate-wrapper {
  display: block;
  animation: slide-in-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: calc(var(--index) * 0.04s);
}

:deep(.el-loading-mask) {
  opacity: 0.45;
  backdrop-filter: blur(4px);
}

.outer-most {
  user-select: none;
}
</style>
