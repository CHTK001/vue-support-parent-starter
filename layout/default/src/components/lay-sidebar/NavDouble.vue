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
import type { MenuItem } from "../../types/menu";
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
  menuClick: [menu: MenuItem];
  favoriteToggle: [menu: MenuItem, isFavorited: boolean];
}

const emit = defineEmits<Emits>();

const route = useRoute();
const isShow = ref(false);
const showLogo = ref(localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`)?.showLogo ?? true);

const { device, pureApp, isCollapse, tooltipEffect, menuSelect, toggleSideBar } = useNav();

// 提取 permissionStore 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

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
  return permissionStore.wholeMenus.filter((menu) => {
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
  const parentPaths = getParentPaths(currentPath, permissionStore.wholeMenus);

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
function handleFirstLevelMenuClick(menu: MenuItem) {
  // 始终更新选中的菜单和子菜单数据，确保三级菜单能正确展开
  selectedFirstLevelMenu.value = menu;
  getSubMenuData(menu);
  emit("menuClick", menu);
}

// 处理子菜单点击
function handleSubMenuClick(menu: MenuItem) {
  emit("menuClick", menu);
}

// 处理收藏切换
function handleFavoriteToggle(menu: MenuItem, isFavorited: boolean) {
  emit("favoriteToggle", menu, isFavorited);
}

// 获取默认展开的菜单项（计算属性，确保响应式更新）
const defaultOpeneds = computed(() => {
  if (doubleNavConfig.value.expandMode === "auto") {
    // 自动展开模式下，递归获取所有子菜单路径
    const getAllMenuPaths = (menus: MenuItem[]): string[] => {
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
function isMenuExpanded(menu: MenuItem) {
  if (doubleNavConfig.value.expandMode === "auto") {
    return doubleNavConfig.value.autoExpandAll;
  }
  return false; // 手动模式默认不展开
}

// 监听路由变化 - 分离监听以避免不必要的 deep watcher
watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/redirect")) return;

    // 根据当前路由自动选择对应的一级菜单
    const currentFirstLevel = getCurrentFirstLevelMenu();
    if (currentFirstLevel) {
      selectedFirstLevelMenu.value = currentFirstLevel;
      getSubMenuData(currentFirstLevel);
    }

    menuSelect(newPath);
  },
  { immediate: true }
);

// 监听菜单数据变化
watch(
  () => permissionStore.wholeMenus.length,
  () => {
    const currentFirstLevel = getCurrentFirstLevelMenu();
    if (currentFirstLevel) {
      selectedFirstLevelMenu.value = currentFirstLevel;
      getSubMenuData(currentFirstLevel);
    }
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
              <component :is="useRenderIcon('ep:menu')" v-else />
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
          router
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
          router
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
@use "sass:color";

// 双栏导航容器基础样式
.double-nav-container {
  position: relative;
  height: 100%;
  display: flex;
  transition: none !important; // 禁用过渡动画
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
    color: #ffffff !important; /* 强制设置为白色确保可见性 */
  }
}

// 左栏样式
.double-nav-left {
  width: 64px;
  min-width: 64px;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  transition: none !important; // 禁用过渡动画

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

  // 第一列图标样式 - 增强可见性
  .first-level-menu {
    .el-menu-item {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 !important;
      height: 56px;
      color: var(--el-text-color-primary);
      transition: all 0.25s ease;
      border-radius: 8px;
      margin: 4px 6px;

      // 图标容器增强
      .menu-icon-only {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        transition: all 0.25s ease;
        
        svg,
        i {
          font-size: 22px;
          width: 22px;
          height: 22px;
          color: var(--el-text-color-primary);
          opacity: 0.85;
          transition: all 0.25s ease;
        }
      }

      &:hover {
        background: var(--el-fill-color-light);
        
        .menu-icon-only {
          svg,
          i {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        /* 深色主题下悬停样式 */
        html.dark & {
          background: rgba(255, 255, 255, 0.08);
          
          .menu-icon-only svg,
          .menu-icon-only i {
            color: #ffffff;
          }
        }
      }

      &.is-active {
        background: var(--el-color-primary) !important;
        box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.35);
        
        .menu-icon-only {
          svg,
          i {
            color: #ffffff !important;
            opacity: 1;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }
        }
        
        &:hover {
          .menu-icon-only {
            svg,
            i {
              color: #ffffff !important;
              transform: scale(1.1);
            }
          }
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
        
        /* 确保选中状态为白色 */
        &.is-active {
          background: var(--el-color-primary) !important;
          color: #ffffff !important; /* 强制设置为白色确保可见性 */
          
          .el-icon,
          svg,
          i {
            color: #ffffff !important; /* 强制设置为白色确保可见性 */
          }
        }
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

<style lang="scss">
@use "sass:color";

// ==================== 春节主题样式 ====================
html[data-skin="spring-festival"] {
  $spring-red: #dc143c;
  $spring-red-dark: #8b0000;
  $spring-gold: #ffd700;
  $spring-gold-light: #ffe066;
  $spring-border: rgba(255, 215, 0, 0.4);

  // 双栏导航容器
  .double-nav-container {
    // 左栏 - 深红色背景
    .double-nav-left {
      background: linear-gradient(180deg, #8b0000 0%, #6b0000 100%) !important;
      border-right: 2px solid $spring-border !important;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;

      // Logo区域
      .sidebar-logo-container {
        background: linear-gradient(180deg, rgba(139, 0, 0, 0.95), rgba(100, 0, 0, 0.95)) !important;
        border-bottom: 1px solid $spring-border !important;

        .sidebar-title {
          color: $spring-gold !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
      }

      // 一级菜单 - 简洁图标样式
      .first-level-menu {
        .el-menu-item {
          color: rgba(255, 215, 0, 0.85) !important;
          background: transparent !important;
          border-radius: 8px !important;
          margin: 4px 6px !important;
          transition: all 0.25s ease;

          .menu-icon-only {
            svg,
            i {
              color: rgba(255, 215, 0, 0.85) !important;
              font-size: 20px;
            }
          }

          &:hover {
            background: rgba(255, 215, 0, 0.15) !important;
            color: $spring-gold !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $spring-gold !important;
            }
          }

          &.is-active {
            background: linear-gradient(135deg, $spring-gold, #ffc107) !important;
            color: $spring-red-dark !important;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4) !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $spring-red-dark !important;
            }
          }
        }
      }
    }

    // 右栏 - 渐变红色背景
    .double-nav-right {
      background: linear-gradient(180deg, #a01010 0%, #800000 100%) !important;
      border-left: 1px solid rgba(255, 215, 0, 0.2) !important;

      // 子菜单列表 - 参考垂直导航样式
      .sub-menu-list {
        padding: 8px !important;
        
        .el-menu {
          background: transparent !important;
        }

        .el-menu-item {
          height: 46px !important;
          color: $spring-gold !important;
          background: transparent !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式 - 与垂直导航一致
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $spring-gold !important;
          }

          .el-icon,
          svg {
            color: $spring-gold !important;
            margin-right: 8px;
          }

          &:hover {
            background: rgba(255, 215, 0, 0.15) !important;
            transform: translateX(2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            color: #fff !important;

            span, div, .el-text {
              color: #fff !important;
            }

            .el-icon,
            svg {
              color: #fff !important;
            }
          }

          // 选中状态 - 与垂直导航一致（金色背景深红文字）
          &.is-active {
            background: linear-gradient(135deg, $spring-gold 0%, #FFA500 100%) !important;
            color: $spring-red-dark !important;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4) !important;

            span, div, .el-text {
              color: $spring-red-dark !important;
            }

            .el-icon,
            svg {
              color: $spring-red-dark !important;
            }
          }
        }

        // 父菜单标题 - 与垂直导航一致（红色渐变背景 + 金色边框）
        .el-sub-menu__title {
          height: 46px !important;
          color: $spring-gold !important;
          background: linear-gradient(135deg, rgba(139, 0, 0, 0.7) 0%, rgba(178, 34, 34, 0.7) 100%) !important;
          border: 1.5px solid rgba(255, 215, 0, 0.3) !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $spring-gold !important;
          }

          .el-icon,
          svg {
            color: $spring-gold !important;
            margin-right: 8px;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
          }

          &:hover {
            background: linear-gradient(135deg, rgba(220, 20, 60, 0.9) 0%, rgba(178, 34, 34, 0.9) 100%) !important;
            border-color: rgba(255, 215, 0, 0.6) !important;
            transform: translateX(2px);
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
            
            span, div, .el-text, .el-icon, svg {
              color: #fff !important;
            }
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: #fff !important;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.95) 0%, rgba(178, 34, 34, 0.95) 100%) !important;
          border-color: $spring-gold !important;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);

          span, div, .el-text {
            color: #fff !important;
          }

          .el-icon,
          svg {
            color: #fff !important;
          }
        }
        
        // 嵌套子菜单样式
        .el-sub-menu .el-menu {
          background: transparent !important;
          
          .el-menu-item {
            height: 44px !important;
            color: $spring-gold !important;
            background: transparent !important;
            border: none !important;
            border-radius: 8px !important;
            margin: 2px 8px 2px 16px !important;
            padding: 0 16px !important;
            
            span, div, .el-text {
              height: 44px !important;
              line-height: 44px !important;
              font-size: 14px !important;
              color: $spring-gold !important;
            }
            
            .el-icon, svg {
              color: $spring-gold !important;
            }
            
            &:hover {
              background: rgba(255, 215, 0, 0.15) !important;
              color: #fff !important;
              
              span, div, .el-text, .el-icon, svg {
                color: #fff !important;
              }
            }
            
            &.is-active {
              background: linear-gradient(135deg, $spring-gold 0%, #FFA500 100%) !important;
              color: $spring-red-dark !important;
              box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4) !important;
              
              span, div, .el-text, .el-icon, svg {
                color: $spring-red-dark !important;
              }
            }
          }
        }
      }
    }

    // 折叠按钮
    .double-nav-collapse {
      .left-collapse {
        background: linear-gradient(180deg, #6b0000, #500000) !important;
        border-top: 1px solid $spring-border !important;

        svg {
          color: rgba(255, 215, 0, 0.8) !important;
        }

        &:hover {
          background: rgba(255, 215, 0, 0.15) !important;

          svg {
            color: $spring-gold !important;
          }
        }
      }
    }
  }
}

// ==================== 赛博朋克主题样式 ====================
html[data-skin="cyberpunk"] {
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-dark: #0a0a12;
  $cyber-dark-light: #12121f;
  $cyber-border: rgba(0, 255, 255, 0.3);

  // 双栏导航容器
  .double-nav-container {
    // 左栏
    .double-nav-left {
      background: linear-gradient(180deg, rgba(10, 10, 18, 0.95), rgba(18, 18, 31, 0.95)) !important;
      border-right: 2px solid $cyber-border !important;

      // Logo区域
      .sidebar-logo-container {
        background: linear-gradient(135deg, rgba(10, 10, 18, 0.98), rgba(18, 18, 31, 0.98)) !important;
        border-bottom: 1px solid $cyber-border !important;

        .sidebar-title {
          color: $cyber-cyan !important;
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3);
        }
      }

      // 一级菜单 - 增强霓虹图标效果
      .first-level-menu {
        .el-menu-item {
          color: $cyber-cyan !important;
          background: transparent !important;
          border-radius: 10px !important;
          margin: 6px 8px !important;
          position: relative;
          overflow: hidden;

          // 悬停闪烁背景
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(0, 255, 255, 0.2),
              transparent
            );
            transition: left 0.5s ease;
          }

          .menu-icon-only {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.3s ease;
            
            svg,
            i {
              font-size: 24px;
              width: 24px;
              height: 24px;
              color: $cyber-cyan !important;
              filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6));
              transition: all 0.3s ease;
            }
          }

          &:hover {
            background: rgba(0, 255, 255, 0.12) !important;
            color: #fff !important;
            box-shadow: 
              0 0 20px rgba(0, 255, 255, 0.25),
              inset 0 0 15px rgba(0, 255, 255, 0.08);

            &::before {
              left: 100%;
            }

            .menu-icon-only {
              svg,
              i {
                color: #fff !important;
                filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
                transform: scale(1.15);
              }
            }
          }

          &.is-active {
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.12)) !important;
            color: #fff !important;
            border: 1px solid $cyber-cyan !important;
            box-shadow:
              0 0 20px rgba(0, 255, 255, 0.4),
              0 0 40px rgba(255, 0, 255, 0.2),
              inset 0 0 20px rgba(0, 255, 255, 0.1) !important;

            // 左侧霓虹指示条
            &::after {
              content: '';
              position: absolute;
              left: -1px;
              top: 50%;
              transform: translateY(-50%);
              width: 3px;
              height: 60%;
              background: linear-gradient(to bottom, $cyber-cyan, $cyber-magenta, $cyber-cyan);
              border-radius: 2px;
              box-shadow: 0 0 10px $cyber-cyan, 0 0 20px $cyber-magenta;
              animation: cyber-nav-pulse 1.5s ease-in-out infinite;
            }

            .menu-icon-only {
              svg,
              i {
                color: #fff !important;
                filter: drop-shadow(0 0 8px $cyber-cyan);
              }
            }
          }
        }
      }
    }

    @keyframes cyber-nav-pulse {
      0%, 100% { opacity: 0.8; height: 60%; }
      50% { opacity: 1; height: 70%; }
    }

    // 右栏 - 参考垂直导航样式
    .double-nav-right {
      background: linear-gradient(180deg, rgba(18, 18, 31, 0.95), rgba(10, 10, 18, 0.95)) !important;

      // 子菜单列表 - 参考垂直导航样式
      .sub-menu-list {
        padding: 8px !important;
        
        .el-menu-item {
          height: 46px !important;
          color: $cyber-cyan !important;
          background: transparent !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式 - 与垂直导航一致
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $cyber-cyan !important;
          }

          .el-icon,
          svg {
            color: $cyber-cyan !important;
            filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
            margin-right: 8px;
          }

          &:hover {
            background: rgba(0, 255, 255, 0.1) !important;
            transform: translateX(2px);
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
            color: #fff !important;

            span, div, .el-text {
              color: #fff !important;
            }

            .el-icon,
            svg {
              color: #fff !important;
            }
          }

          // 选中状态 - 与垂直导航一致（霸虹背景）
          &.is-active {
            background: linear-gradient(135deg, $cyber-cyan 0%, $cyber-magenta 100%) !important;
            color: #fff !important;
            font-weight: 600;
            box-shadow: 
              0 0 20px rgba(0, 255, 255, 0.4),
              0 2px 8px rgba(255, 0, 255, 0.3) !important;

            span, div, .el-text {
              color: #fff !important;
              text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            }

            .el-icon,
            svg {
              color: #fff !important;
              filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
            }
          }
        }

        // 父菜单标题 - 与垂直导航一致（暗色渐变背景 + 霸虹边框）
        .el-sub-menu__title {
          height: 46px !important;
          color: $cyber-cyan !important;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)) !important;
          border: 1px solid rgba(0, 255, 255, 0.2) !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $cyber-cyan !important;
          }

          .el-icon,
          svg {
            color: $cyber-cyan !important;
            margin-right: 8px;
            filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
          }

          &:hover {
            background: rgba(0, 255, 255, 0.1) !important;
            border-color: rgba(0, 255, 255, 0.4) !important;
            transform: translateX(2px);
            color: #fff !important;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
            
            span, div, .el-text, .el-icon, svg {
              color: #fff !important;
            }
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: #fff !important;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.18), rgba(255, 0, 255, 0.12)) !important;
          border-color: rgba(0, 255, 255, 0.5) !important;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
          
          span, div, .el-text {
            color: #fff !important;
          }
          
          .el-icon, svg {
            color: #fff !important;
          }
        }
        
        // 嵌套子菜单样式
        .el-sub-menu .el-menu {
          background: transparent !important;
          
          .el-menu-item {
            height: 44px !important;
            color: $cyber-cyan !important;
            background: transparent !important;
            border: none !important;
            border-radius: 8px !important;
            margin: 2px 8px 2px 16px !important;
            padding: 0 16px !important;
            
            span, div, .el-text {
              height: 44px !important;
              line-height: 44px !important;
              font-size: 14px !important;
              color: $cyber-cyan !important;
            }
            
            .el-icon, svg {
              color: $cyber-cyan !important;
            }
            
            &:hover {
              background: rgba(0, 255, 255, 0.1) !important;
              color: #fff !important;
              
              span, div, .el-text, .el-icon, svg {
                color: #fff !important;
              }
            }
            
            &.is-active {
              background: linear-gradient(135deg, $cyber-cyan 0%, $cyber-magenta 100%) !important;
              color: #fff !important;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
              
              span, div, .el-text, .el-icon, svg {
                color: #fff !important;
              }
            }
          }
        }
      }
    }

    // 折叠按钮
    .double-nav-collapse {
      .left-collapse {
        background: linear-gradient(135deg, rgba(10, 10, 18, 0.98), rgba(18, 18, 31, 0.98)) !important;
        border-top: 1px solid $cyber-border !important;

        svg {
          color: $cyber-cyan !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        }

        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;

          svg {
            color: #fff !important;
          }
        }
      }
    }
  }
}

// ==================== 中秋主题样式 ====================
html[data-skin="mid-autumn"] {
  $mid-blue: #1a237e;
  $mid-blue-light: #283593;
  $mid-gold: #ffd54f;
  $mid-gold-light: #ffecb3;
  $mid-cyan: #00bcd4;
  $mid-border: rgba(255, 213, 79, 0.3);

  // 双栏导航容器
  .double-nav-container {
    // 左栏
    .double-nav-left {
      background: linear-gradient(180deg, $mid-blue, $mid-blue-light) !important;
      border-right: 2px solid $mid-border !important;

      // Logo区域
      .sidebar-logo-container {
        background: linear-gradient(135deg, rgba(13, 27, 66, 0.95), rgba($mid-blue, 0.95)) !important;
        border-bottom: 2px solid $mid-border !important;

        .sidebar-title {
          color: $mid-gold !important;
        }
      }

      // 一级菜单
      .first-level-menu {
        .el-menu-item {
          color: $mid-gold-light !important;

          .menu-icon-only {
            svg,
            i {
              color: $mid-gold !important;
            }
          }

          &:hover {
            background: rgba($mid-gold, 0.15) !important;
            color: #fff !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: #fff !important;
            }
          }

          &.is-active {
            background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
            color: $mid-blue !important;
            box-shadow: 0 4px 16px rgba($mid-gold, 0.5) !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $mid-blue !important;
            }
          }
        }
      }
    }

    // 右栏 - 参考垂直导航样式
    .double-nav-right {
      background: linear-gradient(180deg, rgba($mid-blue, 0.95), rgba($mid-blue-light, 0.95)) !important;

      // 子菜单列表 - 参考垂直导航样式
      .sub-menu-list {
        padding: 8px !important;
        
        .el-menu-item {
          height: 46px !important;
          color: $mid-gold !important;
          background: transparent !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式 - 与垂直导航一致
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $mid-gold !important;
          }

          .el-icon,
          svg {
            color: $mid-gold !important;
            margin-right: 8px;
          }

          &:hover {
            background: rgba($mid-gold, 0.15) !important;
            transform: translateX(2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            color: #fff !important;

            span, div, .el-text {
              color: #fff !important;
            }

            .el-icon,
            svg {
              color: #fff !important;
            }
          }

          // 选中状态 - 与垂直导航一致（金色背景深蓝文字）
          &.is-active {
            background: linear-gradient(135deg, $mid-gold 0%, $mid-gold-light 100%) !important;
            color: $mid-blue !important;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(255, 213, 79, 0.4) !important;

            span, div, .el-text {
              color: $mid-blue !important;
            }

            .el-icon,
            svg {
              color: $mid-blue !important;
            }
          }
        }

        // 父菜单标题 - 与垂直导航一致（深蓝背景 + 金色边框）
        .el-sub-menu__title {
          height: 46px !important;
          color: $mid-gold !important;
          background: rgba(26, 35, 126, 0.5) !important;
          border: 1px solid rgba($mid-gold, 0.25) !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $mid-gold !important;
          }

          .el-icon,
          svg {
            color: $mid-gold !important;
            margin-right: 8px;
          }

          &:hover {
            background: rgba($mid-gold, 0.2) !important;
            border-color: $mid-gold !important;
            transform: translateX(2px);
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(255, 213, 79, 0.3);
            
            span, div, .el-text, .el-icon, svg {
              color: #fff !important;
            }
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: #fff !important;
          font-weight: 600;
          background: rgba($mid-gold, 0.3) !important;
          border-color: $mid-gold !important;
          box-shadow: 0 2px 8px rgba(255, 213, 79, 0.4);
          
          span, div, .el-text {
            color: #fff !important;
          }
          
          .el-icon, svg {
            color: #fff !important;
          }
        }
        
        // 嵌套子菜单样式
        .el-sub-menu .el-menu {
          background: transparent !important;
          
          .el-menu-item {
            height: 44px !important;
            color: $mid-gold !important;
            background: transparent !important;
            border: none !important;
            border-radius: 8px !important;
            margin: 2px 8px 2px 16px !important;
            padding: 0 16px !important;
            
            span, div, .el-text {
              height: 44px !important;
              line-height: 44px !important;
              font-size: 14px !important;
              color: $mid-gold !important;
            }
            
            .el-icon, svg {
              color: $mid-gold !important;
            }
            
            &:hover {
              background: rgba($mid-gold, 0.15) !important;
              color: #fff !important;
              
              span, div, .el-text, .el-icon, svg {
                color: #fff !important;
              }
            }
            
            &.is-active {
              background: linear-gradient(135deg, $mid-gold 0%, $mid-gold-light 100%) !important;
              color: $mid-blue !important;
              box-shadow: 0 2px 8px rgba(255, 213, 79, 0.4) !important;
              
              span, div, .el-text, .el-icon, svg {
                color: $mid-blue !important;
              }
            }
          }
        }
      }
    }

    // 折叠按钮
    .double-nav-collapse {
      .left-collapse {
        background: linear-gradient(135deg, rgba(13, 27, 66, 0.95), rgba($mid-blue, 0.95)) !important;
        border-top: 2px solid $mid-border !important;

        svg {
          color: $mid-gold !important;
        }

        &:hover {
          background: rgba($mid-gold, 0.15) !important;

          svg {
            color: #fff !important;
          }
        }
      }
    }
  }
}

// ==================== 圣诞主题样式 ====================
html[data-skin="christmas"] {
  $xmas-green: #1b5e20;
  $xmas-green-light: #2e7d32;
  $xmas-red: #c62828;
  $xmas-red-light: #e53935;
  $xmas-gold: #ffd700;
  $xmas-white: #ffffff;
  $xmas-border: rgba(255, 215, 0, 0.4);

  // 双栏导航容器
  .double-nav-container {
    // 左栏
    .double-nav-left {
      background: linear-gradient(180deg, $xmas-green, color.adjust($xmas-green, $lightness: -5%)) !important;
      border-right: 3px solid $xmas-border !important;

      // Logo区域
      .sidebar-logo-container {
        background: linear-gradient(180deg, color.adjust($xmas-green, $lightness: -8%), color.adjust($xmas-green, $lightness: -5%)) !important;
        border-bottom: 2px solid $xmas-border !important;

        .sidebar-title {
          color: $xmas-white !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
      }

      // 一级菜单
      .first-level-menu {
        .el-menu-item {
          color: $xmas-white !important;

          .menu-icon-only {
            svg,
            i {
              color: $xmas-gold !important;
            }
          }

          &:hover {
            background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
            color: $xmas-white !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $xmas-white !important;
            }
          }

          &.is-active {
            background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
            color: $xmas-white !important;
            box-shadow: 0 4px 16px rgba($xmas-red, 0.5) !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $xmas-white !important;
            }
          }
        }
      }
    }

    // 右栏 - 参考垂直导航样式
    .double-nav-right {
      background: linear-gradient(180deg, $xmas-green-light, $xmas-green) !important;

      // 子菜单列表 - 参考垂直导航样式
      .sub-menu-list {
        padding: 8px !important;
        
        .el-menu-item {
          height: 46px !important;
          color: $xmas-white !important;
          background: transparent !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 文字样式 - 与垂直导航一致
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $xmas-white !important;
          }

          .el-icon,
          svg {
            color: $xmas-gold !important;
            margin-right: 8px;
          }

          &:hover {
            background: rgba($xmas-red, 0.3) !important;
            transform: translateX(2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            color: $xmas-white !important;

            .el-icon,
            svg {
              color: $xmas-white !important;
            }
          }

          // 选中状态 - 与垂直导航一致（红色背景白色文字）
          &.is-active {
            background: linear-gradient(135deg, $xmas-red 0%, $xmas-red-light 100%) !important;
            color: $xmas-white !important;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba($xmas-red, 0.4) !important;

            span, div, .el-text {
              color: $xmas-white !important;
            }

            .el-icon,
            svg {
              color: $xmas-white !important;
            }
          }
        }

        // 父菜单标题 - 圣诞主题特色样式
        .el-sub-menu__title {
          height: 46px !important;
          color: $xmas-white !important;
          background: linear-gradient(135deg, rgba($xmas-green-light, 0.7), rgba($xmas-green, 0.7)) !important;
          border: 1.5px solid rgba($xmas-gold, 0.3) !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

          // 文字样式
          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            letter-spacing: 0.3px !important;
            color: $xmas-white !important;
          }

          .el-icon,
          svg {
            color: $xmas-gold !important;
            margin-right: 8px;
            filter: drop-shadow(0 0 2px rgba($xmas-gold, 0.3));
          }

          // 展开箭头
          .el-sub-menu__icon-arrow {
            color: $xmas-gold !important;
          }

          &:hover {
            background: linear-gradient(135deg, rgba($xmas-red, 0.6), rgba($xmas-red-light, 0.6)) !important;
            border-color: rgba($xmas-gold, 0.5) !important;
            transform: translateX(2px);
            box-shadow: 0 4px 12px rgba($xmas-red, 0.3);
            color: $xmas-white !important;

            .el-icon, svg, .el-sub-menu__icon-arrow {
              color: $xmas-white !important;
            }
          }
        }

        // 父菜单选中状态
        .el-sub-menu.is-active > .el-sub-menu__title,
        .el-sub-menu.is-opened > .el-sub-menu__title {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
          border-color: rgba($xmas-gold, 0.5) !important;
          color: $xmas-white !important;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba($xmas-red, 0.4);

          span, div, .el-text {
            color: $xmas-white !important;
            font-weight: 600 !important;
          }

          .el-icon, svg, .el-sub-menu__icon-arrow {
            color: $xmas-white !important;
          }
        }
        
        // 嵌套子菜单样式
        .el-sub-menu .el-menu {
          background: transparent !important;
          
          .el-menu-item {
            height: 44px !important;
            color: $xmas-white !important;
            background: transparent !important;
            border: none !important;
            border-radius: 8px !important;
            margin: 2px 8px 2px 16px !important;
            padding: 0 16px !important;
            
            span, div, .el-text {
              height: 44px !important;
              line-height: 44px !important;
              font-size: 14px !important;
              color: $xmas-white !important;
            }
            
            .el-icon, svg {
              color: $xmas-gold !important;
            }
            
            &:hover {
              background: rgba($xmas-red, 0.3) !important;
              color: $xmas-white !important;
              
              .el-icon, svg {
                color: $xmas-white !important;
              }
            }
            
            &.is-active {
              background: linear-gradient(135deg, $xmas-red 0%, $xmas-red-light 100%) !important;
              color: $xmas-white !important;
              box-shadow: 0 2px 8px rgba($xmas-red, 0.4) !important;
              
              span, div, .el-text, .el-icon, svg {
                color: $xmas-white !important;
              }
            }
          }
        }
      }
    }

    // 折叠按钮
    .double-nav-collapse {
      .left-collapse {
        background: linear-gradient(180deg, color.adjust($xmas-green, $lightness: -8%), color.adjust($xmas-green, $lightness: -10%)) !important;
        border-top: 2px solid $xmas-border !important;

        svg {
          color: $xmas-gold !important;
        }

        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;

          svg {
            color: $xmas-white !important;
          }
        }
      }
    }
  }
}

// ==================== 元旦主题样式 ====================
html[data-skin="new-year"] {
  // 元旦冰雪主题色 - 浅色风格（与悬停导航保持一致）
  $ice-lightest: #F5FBFF;
  $ice-light: #B8E0F2;
  $ice-medium: #7CC2E8;
  $ice-primary: #4EA8DE;
  $ice-deep: #2A7AB8;
  $ice-darker: #1E5F8C;
  $frost-white: #FFFFFF;
  $frost-purple: #E0E7F5;
  $ice-border: rgba(78, 168, 222, 0.3);

  // 双栏导航容器
  .double-nav-container {
    // 左栏 - 浅色背景
    .double-nav-left {
      background: linear-gradient(180deg, rgba($frost-white, 0.98), rgba($frost-purple, 0.95)) !important;
      border-right: 2px solid $ice-border !important;
      backdrop-filter: blur(12px);

      // Logo区域
      .sidebar-logo-container {
        background: linear-gradient(180deg, rgba($frost-white, 0.95), rgba($ice-lightest, 0.9)) !important;
        border-bottom: 1px solid rgba($ice-medium, 0.3) !important;

        .sidebar-title {
          color: $ice-darker !important;
          text-shadow: 0 1px 2px rgba($ice-deep, 0.2);
        }
      }

      // 一级菜单
      .first-level-menu {
        .el-menu-item {
          color: $ice-darker !important;

          .menu-icon-only {
            svg,
            i {
              color: $ice-primary !important;
            }
          }

          &:hover {
            background: rgba($ice-medium, 0.2) !important;
            color: $ice-deep !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $ice-deep !important;
            }
          }

          &.is-active {
            background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
            color: $frost-white !important;
            box-shadow: 0 4px 16px rgba($ice-primary, 0.4) !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: $frost-white !important;
            }
          }
        }
      }
    }

    // 右栏 - 浅色背景
    .double-nav-right {
      background: linear-gradient(180deg, rgba($ice-lightest, 0.98), rgba($frost-purple, 0.95)) !important;
      backdrop-filter: blur(12px);

      .sub-menu-list {
        padding: 8px !important;
        
        .el-menu-item {
          height: 46px !important;
          color: $ice-darker !important;
          background: rgba($frost-white, 0.7) !important;
          border: 1px solid rgba($ice-medium, 0.25) !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $ice-darker !important;
          }

          .el-icon,
          svg {
            color: $ice-primary !important;
            margin-right: 8px;
          }

          &:hover {
            background: rgba($ice-medium, 0.2) !important;
            border-color: rgba($ice-primary, 0.4) !important;
            transform: translateX(2px);
            box-shadow: 0 4px 12px rgba($ice-primary, 0.2) !important;
            color: $ice-deep !important;

            span, div, .el-text {
              color: $ice-deep !important;
            }

            .el-icon,
            svg {
              color: $ice-deep !important;
            }
          }

          &.is-active {
            background: linear-gradient(135deg, $ice-primary 0%, $ice-medium 100%) !important;
            color: $frost-white !important;
            border: 1px solid rgba($frost-white, 0.5) !important;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba($ice-primary, 0.4) !important;

            span, div, .el-text {
              color: $frost-white !important;
            }

            .el-icon,
            svg {
              color: $frost-white !important;
            }
          }
        }

        .el-sub-menu__title {
          height: 46px !important;
          color: $ice-darker !important;
          background: rgba($frost-white, 0.6) !important;
          border: 1px solid rgba($ice-medium, 0.25) !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          padding: 0 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          span, div, .el-text {
            height: 46px !important;
            line-height: 46px !important;
            font-size: 14px !important;
            letter-spacing: 0.3px !important;
            color: $ice-darker !important;
          }

          .el-icon,
          svg {
            color: $ice-primary !important;
            margin-right: 8px;
          }

          &:hover {
            background: rgba($ice-medium, 0.2) !important;
            border-color: rgba($ice-primary, 0.4) !important;
            transform: translateX(2px);
            color: $ice-deep !important;
            box-shadow: 0 4px 12px rgba($ice-primary, 0.2);
            
            span, div, .el-text, .el-icon, svg {
              color: $ice-deep !important;
            }
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: $frost-white !important;
          font-weight: 600;
          background: linear-gradient(135deg, rgba($ice-primary, 0.8), rgba($ice-medium, 0.7)) !important;
          border-color: rgba($frost-white, 0.4) !important;
          box-shadow: 0 4px 16px rgba($ice-primary, 0.35);
          
          span, div, .el-text {
            color: $frost-white !important;
          }
          
          .el-icon, svg {
            color: $frost-white !important;
          }
        }
        
        .el-sub-menu .el-menu {
          background: rgba($ice-lightest, 0.6) !important;
          border-radius: 8px;
          margin: 4px 8px;
          
          .el-menu-item {
            height: 44px !important;
            color: $ice-darker !important;
            background: rgba($frost-white, 0.5) !important;
            border: 1px solid rgba($ice-medium, 0.15) !important;
            border-radius: 8px !important;
            margin: 4px 6px !important;
            padding: 0 16px !important;
            
            span, div, .el-text {
              height: 44px !important;
              line-height: 44px !important;
              font-size: 14px !important;
              color: $ice-darker !important;
            }
            
            .el-icon, svg {
              color: $ice-primary !important;
            }
            
            &:hover {
              background: rgba($frost-white, 0.8) !important;
              border-color: rgba($ice-primary, 0.3) !important;
              color: $ice-deep !important;
              
              span, div, .el-text, .el-icon, svg {
                color: $ice-deep !important;
              }
            }
            
            &.is-active {
              background: linear-gradient(135deg, $ice-primary 0%, $ice-medium 100%) !important;
              color: $frost-white !important;
              border: 1px solid rgba($ice-deep, 0.2) !important;
              box-shadow: 0 4px 16px rgba($ice-primary, 0.4) !important;
              
              span, div, .el-text, .el-icon, svg {
                color: $frost-white !important;
              }
            }
          }
        }
      }
    }

    // 折叠按钮 - 浅色风格
    .double-nav-collapse {
      .left-collapse {
        background: linear-gradient(180deg, rgba($frost-white, 0.95), rgba($ice-lightest, 0.9)) !important;
        border-top: 1px solid rgba($ice-medium, 0.3) !important;

        svg {
          color: $ice-primary !important;
        }

        &:hover {
          background: rgba($ice-medium, 0.2) !important;

          svg {
            color: $ice-deep !important;
          }
        }
      }
    }
  }
}
</style>
