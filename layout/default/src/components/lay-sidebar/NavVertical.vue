<script setup lang="ts">
import { useRoute } from "vue-router";
import { emitter, findRouteByPath, getParentPaths, usePermissionStoreHook } from "@repo/core";
import { useNav } from "../..//hooks/useNav";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace } from "@repo/config";
import { isAllEmpty } from "@pureadmin/utils";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import LaySidebarLogo from "./components/SidebarLogo.vue";
import LaySidebarItem from "./components/SidebarItem.vue";
import LaySidebarLeftCollapse from "./components/SidebarLeftCollapse.vue";
import LaySidebarCenterCollapse from "./components/SidebarCenterCollapse.vue";
import { localStorageProxy, useDefer } from "@repo/utils";

const route = useRoute();
const isShow = ref(false);
const showLogo = ref(localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`)?.showLogo ?? true);

const { device, pureApp, isCollapse, tooltipEffect, menuSelect, toggleSideBar } = useNav();

const subMenuData = ref([]);

const menuData = computed(() => {
  return pureApp.layout === "mix" && device.value !== "mobile" ? subMenuData.value : usePermissionStoreHook().wholeMenus;
});

const loading = computed(() => (pureApp.layout === "mix" ? false : menuData.value.length === 0 ? true : false));

const defaultActive = computed(() => (!isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path));

function getSubMenuData() {
  let path = "";
  path = defaultActive.value;
  subMenuData.value = [];
  // path的上级路由组成的数组
  const parentPathArr = getParentPaths(path, usePermissionStoreHook().wholeMenus);
  // 当前路由的父级路由信息
  const parenetRoute = findRouteByPath(parentPathArr[0] || path, usePermissionStoreHook().wholeMenus);
  if (!parenetRoute?.children) return;
  subMenuData.value = parenetRoute?.children;
}

watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    if (route.path.includes("/redirect")) return;
    getSubMenuData();
    menuSelect(route.path);
  }
);

onMounted(() => {
  getSubMenuData();

  emitter.on("logoChange", (key) => {
    showLogo.value = key;
  });
});

onBeforeUnmount(() => {
  // 解绑`logoChange`公共事件，防止多次触发
  emitter.off("logoChange");
});
const defer = useDefer(menuData.value.length);
</script>

<template>
  <div v-loading="loading" :class="['sidebar-custom sidebar-container', showLogo ? 'has-logo' : 'no-logo']" @mouseenter.prevent="isShow = true" @mouseleave.prevent="isShow = false">
    <LaySidebarLogo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper" :class="[device === 'mobile' ? 'mobile' : 'pc']">
      <el-menu unique-opened mode="vertical" popper-class="pure-scrollbar" class="outer-most select-none" :collapse="isCollapse" :collapse-transition="false" :popper-effect="tooltipEffect" :default-active="defaultActive">
        <span v-for="(routes, index) in menuData" :key="index">
          <LaySidebarItem :key="routes.path" :item="routes" :base-path="routes.path" class="outer-most select-none" />
        </span>
      </el-menu>
    </el-scrollbar>
    <LaySidebarCenterCollapse v-if="device !== 'mobile' && (isShow || isCollapse)" :is-active="pureApp.sidebar.opened" @toggleClick="toggleSideBar" />
    <LaySidebarLeftCollapse v-if="device !== 'mobile'" :is-active="pureApp.sidebar.opened" @toggleClick="toggleSideBar" />
  </div>
</template>

<style lang="scss" scoped>
.sidebar-container {
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 10;

  &.has-logo {
    .scrollbar-wrapper {
      height: calc(100% - 60px);
    }
  }

  &.no-logo {
    .scrollbar-wrapper {
      height: 100%;
    }
  }

  .dark & {
    background: linear-gradient(180deg, rgba(28, 28, 35, 0.95), rgba(30, 30, 40, 0.98));
    border-right: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.sidebar-custom {
  --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  box-shadow: var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);

  .dark & {
    --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

:deep(.el-loading-mask) {
  opacity: 0.45;
  backdrop-filter: blur(4px);
}

:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;

  &.mobile {
    .el-scrollbar__view {
      padding-bottom: 60px;
    }
  }

  .el-scrollbar__bar {
    opacity: 0.2;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-5);
    border-radius: 10px;

    &:hover {
      background-color: var(--el-color-primary);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

:deep(.el-menu) {
  border-right: none;
  background: transparent;

  .el-menu-item {
    height: 50px;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      height: 60%;
      width: 4px;
      background: var(--el-color-primary);
      opacity: 0;
      transition: all 0.3s;
      border-radius: 0 4px 4px 0;
      transform: translateY(-50%);
    }

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.08);
      transform: translateX(4px);
    }

    &.is-active {
      background: var(--el-color-primary) !important;
      color: white !important;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 70%;
        background: linear-gradient(to bottom, var(--el-color-success), var(--el-color-success-light-3));
        border-radius: 0 4px 4px 0;
        box-shadow: 0 2px 4px rgba(var(--el-color-success-rgb), 0.2);
      }

      .el-icon {
        color: white !important;
        transform: scale(1.1);
      }
    }
  }

  .el-sub-menu {
    &.is-active {
      > .el-sub-menu__title {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    .el-menu {
      .el-menu-item {
        &.is-active {
          background: var(--el-color-primary) !important;
          color: white !important;

          .el-icon {
            color: white !important;
          }
        }
      }
    }
  }
}

.outer-most {
  user-select: none;
}
</style>
