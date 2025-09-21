<script setup lang="ts">
import { isAllEmpty } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace } from "@repo/config";
import { emitter, getParentPaths, usePermissionStoreHook } from "@repo/core";
import { localStorageProxy, useDefer } from "@repo/utils";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useNav } from "../../hooks/useNav";
import DoubleNavSidebarItem from "./components/DoubleNavSidebarItem.vue";
import LaySidebarLeftCollapse from "./components/SidebarLeftCollapse.vue";
import LaySidebarLogo from "./components/SidebarLogo.vue";

// Props
interface Props {
  showLogo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
});

// Emits
interface Emits {
  menuClick: [menu: any];
  favoriteToggle: [menu: any, isFavorited: boolean];
}

const emit = defineEmits<Emits>();

const route = useRoute();
const isShow = ref(false);
const showLogo = ref(localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`)?.showLogo ?? true);

const { device, pureApp, isCollapse, tooltipEffect, menuSelect, toggleSideBar } = useNav();

// 双栏导航配置
const doubleNavConfig = computed(() => {
  const config = localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`);
  return {
    expandMode: config?.doubleNavExpandMode ?? "auto",
    autoExpandAll: config?.doubleNavAutoExpandAll ?? true,
  };
});

// 一级菜单数据（左栏）
const firstLevelMenus = computed(() => {
  return usePermissionStoreHook().wholeMenus.filter((menu) => {
    // 只显示有子菜单的一级菜单
    return menu.children && menu.children.length > 0;
  });
});

// 当前选中的一级菜单
const selectedFirstLevelMenu = ref(null);

// 二级及以下菜单数据（右栏）
const subMenuData = ref([]);

// 当前激活的菜单路径
const defaultActive = computed(() => (!isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path));

// 获取当前路由对应的一级菜单
function getCurrentFirstLevelMenu() {
  const currentPath = defaultActive.value;
  const parentPaths = getParentPaths(currentPath, usePermissionStoreHook().wholeMenus);

  // 找到顶级父路径
  const topLevelPath = parentPaths.length > 0 ? parentPaths[0] : currentPath;

  // 在一级菜单中查找，优先精确匹配，然后按路径长度降序匹配
  let matchedMenu = firstLevelMenus.value.find((menu) => menu.path === topLevelPath);

  if (!matchedMenu) {
    // 如果没有精确匹配，找到最长匹配的路径
    const matchingMenus = firstLevelMenus.value.filter((menu) => currentPath.startsWith(menu.path + "/") || currentPath === menu.path);
    // 按路径长度降序排序，选择最长匹配的
    matchedMenu = matchingMenus.sort((a, b) => b.path.length - a.path.length)[0];
  }

  return matchedMenu;
}

// 获取子菜单数据
function getSubMenuData(firstLevelMenu = null) {
  const targetMenu = firstLevelMenu || selectedFirstLevelMenu.value;
  if (!targetMenu?.children) {
    subMenuData.value = [];
    return;
  }

  subMenuData.value = targetMenu.children;
}

// 处理一级菜单点击
function handleFirstLevelMenuClick(menu: any) {
  // 始终更新选中的菜单和子菜单数据，确保三级菜单能正确展开
  selectedFirstLevelMenu.value = menu;
  getSubMenuData(menu);
  emit("menuClick", menu);
}

// 处理子菜单点击
function handleSubMenuClick(menu: any) {
  emit("menuClick", menu);
}

// 处理收藏切换
function handleFavoriteToggle(menu: any, isFavorited: boolean) {
  emit("favoriteToggle", menu, isFavorited);
}

// 获取默认展开的菜单项（计算属性，确保响应式更新）
const defaultOpeneds = computed(() => {
  if (doubleNavConfig.value.expandMode === "auto") {
    // 自动展开模式下，递归获取所有子菜单路径
    const getAllMenuPaths = (menus: any[]): string[] => {
      const paths: string[] = [];
      menus.forEach((menu) => {
        if (menu.children && menu.children.length > 0) {
          paths.push(menu.path);
          paths.push(...getAllMenuPaths(menu.children));
        }
      });
      return paths;
    };
    return getAllMenuPaths(subMenuData.value);
  }

  if (doubleNavConfig.value.expandMode === "manual" && doubleNavConfig.value.autoExpandAll) {
    return subMenuData.value.map((item) => item.path);
  }

  return [];
});

// 检查菜单是否展开（根据配置）
function isMenuExpanded(menu: any) {
  if (doubleNavConfig.value.expandMode === "auto") {
    return doubleNavConfig.value.autoExpandAll;
  }
  return false; // 手动模式默认不展开
}

// 监听路由变化
watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    if (route.path.includes("/redirect")) return;

    // 根据当前路由自动选择对应的一级菜单
    const currentFirstLevel = getCurrentFirstLevelMenu();
    if (currentFirstLevel) {
      selectedFirstLevelMenu.value = currentFirstLevel;
      getSubMenuData(currentFirstLevel);
    }

    menuSelect(route.path);
  },
  {
    deep: true,
    immediate: true,
  }
);

onMounted(() => {
  // 初始化选中的一级菜单
  const currentFirstLevel = getCurrentFirstLevelMenu();
  if (currentFirstLevel) {
    selectedFirstLevelMenu.value = currentFirstLevel;
    getSubMenuData(currentFirstLevel);
  } else if (firstLevelMenus.value.length > 0) {
    // 如果没有匹配的，默认选择第一个
    selectedFirstLevelMenu.value = firstLevelMenus.value[0];
    getSubMenuData(firstLevelMenus.value[0]);
  }

  emitter.on("logoChange", (key) => {
    showLogo.value = key;
  });
});

onBeforeUnmount(() => {
  emitter.off("logoChange");
});

const defer = useDefer(firstLevelMenus.value.length);
</script>

<template>
  <div :class="['double-nav-container', { collapsed: isCollapse }]" @mouseenter.prevent="isShow = true" @mouseleave.prevent="isShow = false">
    <!-- 左栏：一级菜单 -->
    <div :class="['double-nav-left', showLogo ? 'has-logo' : 'no-logo', { collapsed: isCollapse }]">
      <LaySidebarLogo v-if="showLogo" :collapse="isCollapse" />
      <el-scrollbar wrap-class="scrollbar-wrapper" :class="[device === 'mobile' ? 'mobile' : 'pc']">
        <el-menu mode="vertical" class="first-level-menu">
          <el-menu-item
            v-for="menu in firstLevelMenus"
            :key="menu.path"
            :index="menu.path"
            :class="{ 'is-active': selectedFirstLevelMenu?.path === menu.path }"
            @click="handleFirstLevelMenuClick(menu)"
            :title="menu.meta?.title || menu.name || ''"
            v-tippy="{
              content: isCollapse ? menu.meta?.title || menu.title || '' : '',
              theme: tooltipEffect,
              placement: 'right',
              disabled: !isCollapse,
            }"
          >
            <div class="menu-icon-only">
              <component :is="useRenderIcon(menu.meta?.icon)" v-if="menu.meta?.icon" />
              <i v-else class="ri-folder-line" />
            </div>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </div>

    <!-- 右栏：子菜单 -->
    <div :class="['double-nav-right', showLogo ? 'has-logo' : 'no-logo', { collapsed: isCollapse }]">
      <el-scrollbar wrap-class="scrollbar-wrapper" :class="[device === 'mobile' ? 'mobile' : 'pc']">
        <!-- 自动展开模式：使用el-menu，但禁用折叠功能 -->
        <el-menu
          v-if="doubleNavConfig.expandMode === 'auto'"
          :key="selectedFirstLevelMenu?.path || 'default'"
          :unique-opened="false"
          mode="vertical"
          popper-class="pure-scrollbar"
          class="sub-menu-list select-none"
          :collapse="false"
          :collapse-transition="false"
          :popper-effect="tooltipEffect"
          :default-active="defaultActive"
          :default-openeds="defaultOpeneds"
        >
          <span v-for="(routes, index) in subMenuData" :key="index">
            <DoubleNavSidebarItem :key="routes.path" :item="routes" :base-path="routes.path" :expand-mode="doubleNavConfig.expandMode" class="sub-menu-item select-none" @menu-click="handleSubMenuClick" @favorite-toggle="handleFavoriteToggle" />
          </span>
        </el-menu>

        <!-- 手动展开模式：使用el-menu，保留折叠功能 -->
        <el-menu
          v-else
          :key="selectedFirstLevelMenu?.path || 'default'"
          :unique-opened="false"
          mode="vertical"
          popper-class="pure-scrollbar"
          class="sub-menu-list select-none"
          :collapse="false"
          :collapse-transition="false"
          :popper-effect="tooltipEffect"
          :default-active="defaultActive"
          :default-openeds="defaultOpeneds"
        >
          <span v-for="(routes, index) in subMenuData" :key="index">
            <DoubleNavSidebarItem :key="routes.path" :item="routes" :base-path="routes.path" :expand-mode="doubleNavConfig.expandMode" class="sub-menu-item select-none" @menu-click="handleSubMenuClick" @favorite-toggle="handleFavoriteToggle" />
          </span>
        </el-menu>
      </el-scrollbar>
    </div>

    <!-- 折叠按钮 -->
    <LaySidebarLeftCollapse v-if="device !== 'mobile'" :is-active="pureApp?.sidebar?.opened" class="double-nav-collapse" @toggleClick="toggleSideBar" />
  </div>
</template>

<style lang="scss" scoped>
// 双栏导航容器基础样式
.double-nav-container {
  position: relative;
  height: 100%;
  display: flex;
  transition: all 0.3s ease;
  width: 264px; // 64px(左栏) + 200px(右栏)
  flex-shrink: 0;

  // 折叠状态样式
  &.collapsed {
    width: 64px !important;
    .double-nav-left {
      width: 64px;
      min-width: 64px;
    }

    .double-nav-right {
      display: none;
    }
  }
}
.el-menu-item.is-active {
  svg{
    color: var(--el-text-color-primary);
  }
}
// 左栏样式
.double-nav-left {
  width: 64px;
  min-width: 64px;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  transition: all 0.3s ease;

  // logo区域高度调整
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

  // 第一列图标样式
  .first-level-menu {
    .el-menu-item {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 !important;
      height: 56px;

      .menu-icon-only {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        font-size: 18px;

        svg,
        i {
          width: 18px;
          height: 18px;
        }
      }
    }
  }
}

// 右栏样式
.double-nav-right {
  width: 200px;
  min-width: 200px;
  background-color: var(--el-bg-color-page);
  transition: all 0.3s ease;

  // 折叠状态
  &.collapsed {
    display: none;
  }

  // 高度调整
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

  // 统一菜单样式
  .sub-menu-list {
    padding: 8px;

    .sub-menu-item {
      :deep(.el-menu-item) {
        border-radius: 6px;
        margin: 2px 8px;
      }

      :deep(.el-sub-menu__title) {
        border-radius: 6px;
        margin: 2px 8px;
      }
    }
  }
}

// 折叠按钮位置调整
.double-nav-collapse {
  position: absolute;
  left: 0;
  bottom: 0%;
  transform: translateY(0%);
  z-index: 20;
  transition: all 0.3s ease;
}
</style>
