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

// 导入主题装饰功能
import ThemeDecoration from "../ThemeDecoration.vue";
import { getComponentDecorations } from "../../themes/decorations";
import type { DecorationConfig } from "../../themes/decorations";

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

// === 主题装饰功能 ===
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);
const sidebarDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-sidebar');
});

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
  
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("logoChange");
  emitter.off("systemThemeChange");
});

const defer = useDefer(firstLevelMenus.value.length);
</script>

<template>
  <div :class="['double-nav-container double-nav-with-decoration', { collapsed: isCollapse }]" @mouseenter.prevent="isShow = true" @mouseleave.prevent="isShow = false">
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
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in sidebarDecorations"
      :key="`double-nav-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
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

  // 第一列图标样式
  .first-level-menu {
    .el-menu-item {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 !important;
      height: 56px;
      color: var(--app-text-primary); /* 未选中状态为黑色 */

      &:hover {
        color: #000000; /* 悬停时保持黑色 */
        
        /* 深色主题下悬停样式 */
        html.dark & {
          color: #ffffff; /* 悬停时保持白色 */
          
          .menu-icon-only {
            color: #ffffff; /* 悬停时保持白色 */
            
            svg,
            i {
              color: #ffffff; /* 悬停时保持白色 */
            }
          }
        }
      }

      &.is-active {
        color: #ffffff !important; /* 强制设置为白色确保可见性 */
        
        /* 悬停时也保持白色 */
        &:hover {
          color: #ffffff !important; /* 强制设置为白色确保可见性 */
          
          .menu-icon-only {
            color: #ffffff !important; /* 强制设置为白色确保可见性 */
            
            svg,
            i {
              color: #ffffff !important; /* 强制设置为白色确保可见性 */
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

      // 子菜单列表
      .sub-menu-list {
        .el-menu {
          background: transparent !important;
        }

        .el-menu-item {
          color: rgba(255, 255, 255, 0.9) !important;
          background: rgba(0, 0, 0, 0.15) !important;
          border: none !important;
          border-left: 3px solid transparent !important;
          border-radius: 0 6px 6px 0 !important;
          margin: 2px 8px 2px 0 !important;
          padding-left: 16px !important;
          transition: all 0.25s ease;

          .el-icon,
          svg {
            color: rgba(255, 215, 0, 0.7) !important;
          }

          &:hover {
            background: rgba(255, 215, 0, 0.1) !important;
            border-left-color: rgba(255, 215, 0, 0.5) !important;
            color: #fff !important;

            .el-icon,
            svg {
              color: $spring-gold !important;
            }
          }

          &.is-active {
            background: rgba(255, 215, 0, 0.2) !important;
            border-left: 3px solid $spring-gold !important;
            color: $spring-gold !important;
            font-weight: 600;

            .el-icon,
            svg {
              color: $spring-gold !important;
            }
          }
        }

        .el-sub-menu__title {
          color: rgba(255, 215, 0, 0.9) !important;
          background: transparent !important;
          border-radius: 6px !important;
          margin: 4px 8px !important;
          font-weight: 500;

          .el-icon,
          svg {
            color: rgba(255, 215, 0, 0.8) !important;
          }

          &:hover {
            background: rgba(255, 215, 0, 0.1) !important;
            color: $spring-gold !important;
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: $spring-gold !important;
          font-weight: 600;

          .el-icon,
          svg {
            color: $spring-gold !important;
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

      // 一级菜单
      .first-level-menu {
        .el-menu-item {
          color: $cyber-cyan !important;

          .menu-icon-only {
            svg,
            i {
              color: $cyber-cyan !important;
              filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
            }
          }

          &:hover {
            background: rgba(0, 255, 255, 0.1) !important;
            color: #fff !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: #fff !important;
            }
          }

          &.is-active {
            background: rgba(0, 255, 255, 0.1) !important;
            color: #fff !important;
            border-color: $cyber-cyan !important;
            box-shadow:
              0 0 15px rgba(0, 255, 255, 0.3),
              inset 0 0 15px rgba(0, 255, 255, 0.1) !important;

            .menu-icon-only svg,
            .menu-icon-only i {
              color: #fff !important;
              filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
            }
          }
        }
      }
    }

    // 右栏
    .double-nav-right {
      background: linear-gradient(180deg, rgba(18, 18, 31, 0.95), rgba(10, 10, 18, 0.95)) !important;

      // 子菜单列表
      .sub-menu-list {
        .el-menu-item {
          color: $cyber-cyan !important;
          background: rgba(10, 10, 18, 0.6) !important;
          border: 1px solid rgba(0, 255, 255, 0.2) !important;
          border-radius: 4px !important;
          margin: 4px 8px !important;

          .el-icon,
          svg {
            color: $cyber-cyan !important;
            filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
          }

          &:hover {
            background: rgba(0, 255, 255, 0.1) !important;
            border-color: $cyber-cyan !important;
            color: #fff !important;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
          }

          &.is-active {
            background: rgba(0, 255, 255, 0.1) !important;
            border-color: $cyber-cyan !important;
            color: #fff !important;
            box-shadow:
              0 0 15px rgba(0, 255, 255, 0.3),
              inset 0 0 15px rgba(0, 255, 255, 0.1) !important;

            .el-icon,
            svg {
              color: #fff !important;
              filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
            }
          }
        }

        .el-sub-menu__title {
          color: $cyber-cyan !important;
          background: rgba(10, 10, 18, 0.4) !important;
          border-radius: 4px !important;
          margin: 4px 8px !important;

          .el-icon,
          svg {
            color: $cyber-cyan !important;
          }

          &:hover {
            background: rgba(0, 255, 255, 0.1) !important;
            color: #fff !important;
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: #fff !important;
          font-weight: 600;
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
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

    // 右栏
    .double-nav-right {
      background: linear-gradient(180deg, rgba($mid-blue, 0.95), rgba($mid-blue-light, 0.95)) !important;

      // 子菜单列表
      .sub-menu-list {
        .el-menu-item {
          color: $mid-gold-light !important;
          background: rgba(26, 35, 126, 0.4) !important;
          border: 1px solid rgba($mid-gold, 0.2) !important;
          border-radius: 6px !important;
          margin: 4px 8px !important;

          .el-icon,
          svg {
            color: $mid-gold !important;
          }

          &:hover {
            background: rgba($mid-gold, 0.15) !important;
            border-color: $mid-gold !important;
            color: #fff !important;
          }

          &.is-active {
            background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
            border-color: $mid-cyan !important;
            color: $mid-blue !important;
            box-shadow: 0 4px 16px rgba($mid-gold, 0.5) !important;

            .el-icon,
            svg {
              color: $mid-blue !important;
            }
          }
        }

        .el-sub-menu__title {
          color: $mid-gold-light !important;
          background: rgba(26, 35, 126, 0.3) !important;
          border-radius: 6px !important;
          margin: 4px 8px !important;

          .el-icon,
          svg {
            color: $mid-gold !important;
          }

          &:hover {
            background: rgba($mid-gold, 0.1) !important;
            color: #fff !important;
          }
        }

        .el-sub-menu.is-active > .el-sub-menu__title {
          color: $mid-gold !important;
          font-weight: 600;
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
</style>
