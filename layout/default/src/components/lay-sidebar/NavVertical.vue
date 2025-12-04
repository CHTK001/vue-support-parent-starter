<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  emitter,
  findRouteByPath,
  getParentPaths,
  usePermissionStoreHook,
} from "@repo/core";
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

const subMenuData = ref([]);

const menuData = computed(() => {
  return pureApp?.layout === "mix" && device.value !== "mobile"
    ? subMenuData.value
    : usePermissionStoreHook().wholeMenus;
});

const loading = computed(() =>
  pureApp?.layout === "mix" ? false : menuData.value.length === 0 ? true : false
);

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

function getSubMenuData() {
  let path = "";
  path = defaultActive.value;
  subMenuData.value = [];
  // path的上级路由组成的数组
  const parentPathArr = getParentPaths(
    path,
    usePermissionStoreHook().wholeMenus
  );
  // 当前路由的父级路由信息
  const parenetRoute = findRouteByPath(
    parentPathArr[0] || path,
    usePermissionStoreHook().wholeMenus
  );
  if (!parenetRoute?.children) return;
  subMenuData.value = parenetRoute?.children;
}

watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    if (route.path.includes("/redirect")) return;
    getSubMenuData();
    menuSelect(route.path);
  },
  {
    deep: true,
    immediate: true,
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
  <div
    v-loading="loading"
    :class="[
      'sidebar-custom sidebar-container',
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
        unique-opened
        mode="vertical"
        popper-class="pure-scrollbar"
        class="outer-most select-none"
        :collapse="isCollapse"
        :collapse-transition="false"
        :popper-effect="tooltipEffect"
        :default-active="defaultActive"
      >
        <span v-for="(routes, index) in menuData" :key="index">
          <LaySidebarItem
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
.sidebar-container {
  position: relative;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.98)
  );
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
    background: linear-gradient(
      180deg,
      rgba(28, 28, 35, 0.95),
      rgba(30, 30, 40, 0.98)
    );
    border-right: 1px solid rgba(255, 255, 255, 0.05);
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
  background: transparent; /* 折叠状态下菜单样式修复 */
  &.el-menu--collapse {
    /* 没有子菜单的菜单项样式修复 */
    .el-menu-item.submenu-title-noDropdown {
      padding: 0 !important;
      display: flex;
      justify-content: center;
      align-items: center;

      .sub-menu-icon {
        margin: 0 !important;
      }
    }

    /* 选中状态样式 */
    .el-menu-item.is-active {
      background: var(--el-color-primary) !important;
      border-radius: 8px;

      .el-icon,
      svg,
      i {
        color: #fff !important;
      }
    }
  }

  .el-menu-item,
  .el-sub-menu__title {
    height: 46px;
    margin: 4px 8px;
    padding: 0 16px;
    color: var(--app-text-primary); /* 未选中状态为黑色 */
    background-color: transparent !important;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: var(--app-text-primary) !important; /* 悬停时保持黑色 */
      transform: translateX(2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    div,
    span {
      height: 46px;
      line-height: 46px;
      font-size: 14px;
      letter-spacing: 0.3px;
      color: var(--app-text-primary); /* 未选中状态为黑色 */
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
          color: var(
            --pure-menu-active-text-color
          ) !important; /* 使用新定义的变量 */

          .el-icon {
            color: var(
              --pure-menu-active-text-color
            ) !important; /* 使用新定义的变量 */
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

<style lang="scss">
// 垂直导航菜单选中状态颜色确保为白色
.pure-sidebar-container {
  :deep(.el-menu) {
    .el-menu-item,
    .el-sub-menu__title {
      height: 46px;
      margin: 4px 8px;
      padding: 0 16px;
      color: var(--app-text-primary); /* 未选中状态为黑色 */
      background-color: transparent !important;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        color: var(--app-text-primary) !important; /* 悬停时保持黑色 */
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      div,
      span {
        height: 46px;
        line-height: 46px;
        font-size: 14px;
        letter-spacing: 0.3px;
        color: var(--app-text-primary); /* 未选中状态为黑色 */
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
            color: #ffffff !important; /* 强制设置为白色确保可见性 */

            .el-icon {
              color: #ffffff !important; /* 强制设置为白色确保可见性 */
            }

            svg,
            i {
              color: #ffffff !important; /* 强制设置为白色确保可见性 */
            }

            div,
            span {
              color: #ffffff !important; /* 强制设置为白色确保可见性 */
            }
          }
        }
      }
    }
  }
}
</style>
