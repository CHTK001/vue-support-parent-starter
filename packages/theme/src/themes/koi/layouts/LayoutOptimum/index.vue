<template>
  <!-- 混合布局 -->
  <el-container class="layout-container">
    <el-aside
      class="layout-optimum-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : settings.columnMenuCollapseWidth }"
      v-if="currentSubMenuTree.length > 0"
    >
      <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout"></Logo>
      <div class="layout-optimum-menu-scroller">
        <div class="layout-optimum-menu-pad">
          <el-menu
            :default-active="activeMenu"
            :collapse="globalStore.isCollapse"
            :collapse-transition="false"
            :uniqueOpened="globalStore.uniqueOpened"
            :router="false"
            :class="menuAnimate"
          >
            <ReColumnSubMenu :menuList="currentSubMenuTree"></ReColumnSubMenu>
          </el-menu>
        </div>
      </div>
      <!-- 底部系统配置入口（不作为菜单） -->
      <NavSettingEntry />
    </el-aside>
    <el-container>
      <el-header v-if="globalStore.isHeaderShown" class="layout-header">
        <div class="koi-header">
          <div class="header-left" :style="{ paddingRight: toolbarWidth + 10 + 'px' }">
            <!-- 左侧菜单展开和折叠图标 -->
            <ReCollapse></ReCollapse>
            <div class="layout-row m-l-6px">
              <ReScrollNav
                ref="scrollNavRef"
                class="layout-optimum-scroll-nav"
                height="52px"
                :gap="4"
                prev-aria-label="向左滚动菜单"
                next-aria-label="向右滚动菜单"
                :active-selector="activeTopMenuSelector"
              >
                <div
                  v-for="item in topLevelMenus"
                  :key="item.meta.menuId"
                  class="left-row line-clamp-1"
                  :class="{
                    'is-active': activeTopMenuId == item.meta?.menuId
                  }"
                  :data-nav-id="item.meta?.menuId"
                  @click="handleTopMenuClick(item)"
                >
                  <el-tooltip :content="getMenuLanguage(item.meta?.title)" :show-after="1500" placement="right">
                    <div class="left-row-tooltip-trigger">
                      <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18"></ReIcon>
                      <span class="title" v-text="getMenuLanguage(item.meta?.title)"></span>
                    </div>
                  </el-tooltip>
                </div>
              </ReScrollNav>
            </div>
          </div>
          <!-- 工具栏 -->
          <ReToolbar @widthChange="handleToolbarWidthChange"></ReToolbar>
        </div>
      </el-header>
      <!-- 路由页面 -->
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import settings from "@repo/theme/koi/settings.ts";
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import ReCollapse from "@repo/theme/koi/layouts/components/Header/components/ReCollapse.vue";
import ReToolbar from "@repo/theme/koi/layouts/components/Header/components/ReToolbar.vue";
import ReColumnSubMenu from "@repo/theme/koi/layouts/components/Menu/ReColumnSubMenu.vue";
import NavSettingEntry from "@repo/theme/koi/layouts/components/Menu/NavSettingEntry.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import type { ReScrollNavExpose } from "@repo/ui/re-scroll-nav";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import { getMenuLanguage } from "@repo/languages";
import useGlobalStore from "@repo/pinia/modules/global";
import { HOME_URL, resolveMenuDefaultIcon } from "@repo/config";
import { msgError } from "@repo/core";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

// 动态绑定左侧菜单animate动画（路由动画关闭时菜单动画同步关闭）
const menuAnimate = computed(() => (!globalStore.transition || globalStore.transition === "none" ? "" : settings.menuAnimate));

// 获取所有顶级菜单[第一层级]
// 缺省菜单图标：菜单未配置 meta.icon 时兜底，避免图标位空白
const menuDefaultIcon = resolveMenuDefaultIcon();

const topLevelMenus = computed(() => authStore.showMenuList.filter((item: any) => item.meta?.isVisible == "1"));

// 当前激活的顶级菜单ID
const activeTopMenuId = ref<any>();
// 当前显示的子菜单树[包含所有层级]
const currentSubMenuTree = ref<any[]>([]);
// 当前激活的子菜单路径
const activeMenu = computed(() => (route.meta?.activeMenu ? route.meta?.activeMenu : route.path) as string);

// Toolbar 宽度
const toolbarWidth = ref(0);
const scrollNavRef = ref<ReScrollNavExpose | null>(null);

const activeTopMenuSelector = computed(() =>
  activeTopMenuId.value ? `[data-nav-id="${activeTopMenuId.value}"]` : ""
);

const refreshScrollState = () => {
  nextTick(() => scrollNavRef.value?.updateScrollState());
};

// 处理 Toolbar 宽度变化
const handleToolbarWidthChange = (width: number) => {
  toolbarWidth.value = width;
  refreshScrollState();
};

/** 递归检查菜单项是否匹配 */
const containsActiveMenu = (menu: any, activeMenu: string): boolean => {
  // 检查当前菜单是否匹配
  if (menu.path == String(activeMenu)) {
    return true;
  }

  // 递归检查子菜单
  if (menu.children && menu.children.length > 0) {
    for (const child of menu.children) {
      if (containsActiveMenu(child, activeMenu)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * @description 查找最顶级菜单对象
 * @param routes 菜单递归数据
 * @param activeMenu 选中路由 或 menuId
 */
const findMenuByActiveMenu = (routes: any[], activeMenu: any) => {
  // 遍历所有顶级菜单
  for (const route of routes) {
    // 检查当前顶级菜单是否匹配
    if (route.path == String(activeMenu)) {
      return route;
    }

    // 检查子菜单是否包含匹配项
    if (route.children && route.children.length > 0) {
      if (containsActiveMenu(route, activeMenu)) {
        return route;
      }
    }
  }

  return null; // 未找到匹配项
};

/**
 * @description 根据 menuId 查找顶级父菜单（排除自身）
 * @param routes 菜单数据[无限层级结构]
 * @param menuId 要查找的菜单 ID
 * @returns 顶级父菜单对象，未找到或目标菜单是顶级菜单时返回 null
 */
const findTopMenuByMenuId = (routes: any[], targetMenuId: any): any => {
  // 转换目标菜单ID为字符串
  const targetId = String(targetMenuId);

  // 创建菜单ID到菜单对象的映射
  const menuMap = new Map();

  // 递归构建菜单映射并添加父菜单关系
  const buildMenuMap = (menuList: any, parentId?: any) => {
    for (const menu of menuList) {
      if (menu.meta?.menuId) {
        const menuId = String(menu.meta.menuId);

        // 添加父菜单关系
        menu.parentId = parentId;
        menuMap.set(menuId, menu);
      }

      // 递归处理子菜单
      if (menu.children && menu.children.length > 0) {
        const currentParentId = menu.meta?.menuId ? String(menu.meta.menuId) : parentId;
        buildMenuMap(menu.children, currentParentId);
      }
    }
  };

  // 构建映射
  buildMenuMap(routes);

  // 检查菜单是否存在
  if (!menuMap.has(targetId)) {
    return null;
  }

  // 查找顶层菜单的递归函数
  const findTopMenu: any = (menuId: any) => {
    const menu = menuMap.get(menuId);

    // 如果菜单没有父菜单或自身就是顶级菜单，返回null
    if (!menu.parentId) {
      return null;
    }

    // 递归查找父菜单的顶层菜单
    const parentTopMenu = findTopMenu(menu.parentId);

    return parentTopMenu || menuMap.get(menu.parentId);
  };

  // 查找目标菜单的顶层菜单
  return findTopMenu(targetId);
};

/**
 * 根据顶级菜单ID获取其完整的子菜单树
 * @param {number|string} topMenuId 顶级菜单ID
 * @returns {Array} 完整的子菜单树
 */
const getSubMenuTree = (topMenuId: number | string) => {
  const topMenu = topLevelMenus.value.find((item: any) => item.meta.menuId === topMenuId);
  return topMenu?.children || [];
};

/**
 * 点击顶级菜单处理
 * @param {Object} item 菜单项
 */
const handleTopMenuClick = (route: any) => {
  if (route.meta?.linkUrl) {
    if (/^https?:\/\//.test(route.meta?.linkUrl)) {
      return window.open(route.meta.linkUrl, "_blank");
    } else {
      msgError("错误链接地址，禁止跳转");
      return;
    }
  }

  if (!route?.children) {
    // 更新当前激活的顶级菜单
    activeTopMenuId.value = route.meta?.menuId;
    currentSubMenuTree.value = [];
    router.push({
      path: route.path || HOME_URL
    });
    return;
  }

  // 更新当前激活的顶级菜单
  activeTopMenuId.value = route.meta?.menuId;

  // 获取该顶级菜单的子菜单树
  currentSubMenuTree.value = getSubMenuTree(route.meta?.menuId);
};

/**
 * 初始化菜单状态
 */
const initMenu = () => {
  if (!topLevelMenus.value.length) return;

  const { menuId, activeMenu } = route.meta || {};

  // 情况一：没有提供 menuId 或 activeMenu，默认选第一个顶级菜单
  if (!menuId && !activeMenu) {
    activeTopMenuId.value = topLevelMenus.value[0];
    return;
  }

  // 情况二：menuId 存在，activeMenu 不存在
  if (menuId && !activeMenu) {
    const topLevelMenu: any = findTopMenuByMenuId(authStore.showMenuList, String(menuId));

    if (!topLevelMenu) {
      // 未找到父级，说明是顶级菜单，直接赋值
      activeTopMenuId.value = menuId;
      currentSubMenuTree.value = [];
    } else {
      // 找到父级，设置为激活项，并加载子菜单
      activeTopMenuId.value = topLevelMenu.meta?.menuId;
      currentSubMenuTree.value = getSubMenuTree(activeTopMenuId.value);
    }

    router.push(route.path); // 同步路径
    return;
  }

  // 情况三：activeMenu 存在通过 activeMenu 查找父级菜单
  if (activeMenu) {
    const topLevelMenu: any = findMenuByActiveMenu(authStore.showMenuList, activeMenu);

    if (topLevelMenu) {
      activeTopMenuId.value = topLevelMenu.meta?.menuId;
      currentSubMenuTree.value = getSubMenuTree(activeTopMenuId.value);
      router.push(route.path);
    } else {
      msgError("The menu data configuration is error");
    }
  }
};

onMounted(() => {
  initMenu();
  refreshScrollState();
});

// 监听路由变化
watch(
  () => route,
  () => {
    initMenu();
    refreshScrollState();
  },
  { deep: true }
);

watch(topLevelMenus, () => refreshScrollState(), { deep: true });
</script>

<style lang="scss" scoped>
.koi-header {
  position: relative; /* 为绝对定位的子元素提供参考 */
  display: flex;
  justify-content: space-between;
  height: $aside-header-height;

  .header-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    overflow: hidden; /* 防止内容溢出 */
    white-space: nowrap;
    z-index: 1; /* 确保在 Toolbar 下方 */
    transition: padding-right 0.3s ease;
  }

  /* 让 Toolbar 覆盖在 header-left 上方 */
  :deep(.header-right) {
    position: absolute;
    top: 50%;
    right: 0px;
    z-index: 10; /* 确保在 header-left 上方 */
    height: 40px;
    transform: translateY(-50%);
    padding: 2px 6px;
    background-color: var(--el-header-bg-color);
    border: 1px solid var(--el-header-toolbar-border-color); /* 添加边框 */
    border-radius: 20px; /* 圆角卡片效果 */
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%); /* 漂浮阴影效果 */
    transition: all 0.3s ease;
  }
}

.layout-row {
  display: flex;
  height: 100%;
  flex: 1;
  min-width: 0;
  user-select: none;
  background-color: var(--koi-surface-header);
  padding: 0 4px;
  box-sizing: border-box;
}

.layout-optimum-scroll-nav {
  width: 100%;
  min-width: 0;

  :deep(.koi-scroll-nav__track) {
    min-height: 48px;
    height: 100%;
    padding: 2px 0;
  }

  :deep(.koi-scroll-nav__btn) {
    width: 26px;
    height: 26px;
    color: var(--el-text-color-secondary);
    background: var(--el-header-optimum-nav-btn-bg-color);
    border: 1px solid var(--el-header-optimum-nav-btn-border-color);
    border-radius: 8px;
    box-shadow: none;
    transition:
      color 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease;

    &:not(.is-disabled):hover {
      color: var(--el-color-primary);
      border-color: var(--el-header-optimum-nav-btn-hover-border-color);
      background: var(--el-header-optimum-nav-btn-hover-bg-color);
    }
  }
}

.left-row {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 68px;
  max-width: 112px;
  height: 100%;
  padding: 4px 10px;
  margin: 0;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--el-header-optimum-color);
  box-sizing: border-box;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;

  .left-row-tooltip-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 2px;
  }

  .title {
    margin-top: 4px;
    font-size: 12px;
    font-weight: $aside-menu-font-weight;
    line-height: 14px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    letter-spacing: 0.2px;
    opacity: 0.88;
    transition: opacity 0.18s ease, color 0.18s ease;
  }

  :deep(.el-icon),
  :deep(svg) {
    opacity: 0.85;
    transition: opacity 0.18s ease, color 0.18s ease;
  }

  &:hover {
    color: var(--el-header-optimum-hover-color);
    background: var(--el-header-optimum-hover-bg-color);
    border-color: transparent;

    .title {
      opacity: 1;
    }

    :deep(.el-icon),
    :deep(svg) {
      opacity: 1;
    }
  }

  &.is-active {
    color: var(--el-header-optimum-active-color);
    background: var(--el-header-optimum-active-bg-color);
    border-color: transparent;

    .title {
      opacity: 1;
    }

    :deep(.el-icon),
    :deep(svg) {
      opacity: 1;
      color: var(--el-header-optimum-active-color);
    }
  }

  &.is-active:hover {
    color: var(--el-header-optimum-active-color);
    background: var(--el-header-optimum-active-bg-color);
    border-color: transparent;
  }
}

.layout-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .layout-optimum-aside {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 0;
    padding-left: $column-menu-padding-left;
    padding-right: 0;
    background-color: var(--koi-surface-aside);
    border-right: 1px solid var(--el-aside-border-right-color);
    box-sizing: border-box;
    user-select: none;
  }

  .layout-optimum-aside :deep(.el-menu) {
    height: auto;
    min-height: 0;
    max-height: none;
    border-right: none;
    box-sizing: border-box;
  }

  .layout-optimum-aside :deep(.el-menu.el-menu--collapse) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .layout-header {
    height: $aside-header-height;
    background-color: var(--koi-surface-header);
  }

  .layout-main {
    box-sizing: border-box;
    padding: 0;
    overflow-x: hidden;
    background-color: var(--koi-surface-main);
  }
}

.layout-optimum-menu-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.layout-optimum-menu-pad {
  padding-right: $column-menu-padding-right;
  box-sizing: border-box;
}
</style>