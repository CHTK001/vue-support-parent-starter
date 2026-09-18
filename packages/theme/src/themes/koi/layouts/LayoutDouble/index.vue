<template>
  <!-- 双栏布局：第一列=正常垂直宽度的一级菜单，第二列=鼠标经过才显示的二级菜单悬浮栏 -->
  <el-container class="layout-container">
      <!-- 悬停容器：包含第一列与第二列，鼠标在区域内时第二列保持显示 -->
      <div
        class="layout-double-sider"
        @mouseenter="onSiderEnter"
        @mouseleave="onSiderLeave"
      >
        <!-- 第一列：一级菜单（正常垂直大小：图标 + 标题） -->
        <div
          class="layout-double-first-aside"
          :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : settings.asideMenuCollapseWidth }"
        >
        <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout" no-animate></Logo>
        <div class="layout-double-first-scroller">
          <div class="layout-double-first-pad">
            <div
              v-for="(item, index) in topLevelMenus"
              :key="item.meta?.menuId || index"
              class="layout-double-first-item"
              :class="{
                'is-active': activeTopMenuId == item.meta?.menuId,
                'is-hover': hoveredTopMenuId == item.meta?.menuId
              }"
              @mouseenter="handleFirstItemEnter(item)"
              @click="handleTopMenuClick(item)"
            >
              <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18"></ReIcon>
              <span v-if="!globalStore.isCollapse" class="title">{{ getMenuLanguage(item.meta?.title) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二列：二级菜单悬浮栏（鼠标经过第一列才显示，固定后撑开内容区） -->
      <transition name="koi-double">
        <div
          v-if="isSecondVisible && currentSubMenuTree.length > 0"
          class="layout-double-second-aside"
          :class="{ 'is-fixed': isSecondFixed }"
          :style="{ width: globalStore.menuWidth + 'px' }"
        >
          <!-- 第二列头部：搜索框 + 固定子菜单按钮（与 logo 等高） -->
          <div class="layout-double-second-header">
            <el-input
              v-model="secondSearch"
              class="layout-double-second-search"
              :placeholder="$t('header.searchMenu')"
              clearable
              @input="handleSecondSearchInput"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-tooltip :content="isSecondFixed ? $t('header.unpinMenu') : $t('header.pinMenu')" placement="bottom" :show-after="600">
              <div
                class="layout-double-pin"
                :class="{ 'is-fixed': isSecondFixed }"
                role="button"
                tabindex="0"
                @click="toggleSecondFixed"
              >
                <ReIcon :name="isSecondFixed ? 'koi-unpinned' : 'koi-pinned'" size="15"></ReIcon>
              </div>
            </el-tooltip>
          </div>
          <div class="layout-double-menu-scroller">
            <div class="layout-double-menu-pad">
              <el-menu
                :default-active="activeMenu"
                :collapse="false"
                :collapse-transition="false"
                :uniqueOpened="globalStore.uniqueOpened"
                :router="false"
                :class="menuAnimate"
              >
                <ReColumnSubMenu :menuList="filteredSubMenuTree"></ReColumnSubMenu>
              </el-menu>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 内容区 -->
    <el-container class="layout-double-main">
      <el-header v-if="globalStore.isHeaderShown" class="layout-header">
        <Header></Header>
      </el-header>
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import settings from "@repo/theme/koi/settings.ts";
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import Header from "@repo/theme/koi/layouts/components/Header/index.vue";
import ReColumnSubMenu from "@repo/theme/koi/layouts/components/Menu/ReColumnSubMenu.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import { getMenuLanguage } from "@repo/languages";
import useGlobalStore from "@repo/pinia/modules/global";
import { HOME_URL, getStorageKey, resolveMenuDefaultIcon } from "@repo/config";
import { msgError } from "@repo/core";
import { Search } from "@element-plus/icons-vue";

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

// 当前激活的顶级菜单ID（路由联动）
const activeTopMenuId = ref<any>();
// 当前鼠标悬停的顶级菜单ID（用于第二列内容切换）
const hoveredTopMenuId = ref<any>();
// 第二列是否显示
const isSecondVisible = ref(false);
// 当前显示的子菜单树[包含所有层级]
const currentSubMenuTree = ref<any[]>([]);
// 第二列搜索关键字
const secondSearch = ref("");
// 第二列固定状态（固定后不随鼠标移出而隐藏），持久化到 localStorage（统一前缀）
const SECOND_FIXED_KEY = getStorageKey("double-second-fixed");
const isSecondFixed = ref(typeof window !== "undefined" ? localStorage.getItem(SECOND_FIXED_KEY) === "1" : false);
// 当前激活的子菜单路径
const activeMenu = computed(() => (route.meta?.activeMenu ? route.meta?.activeMenu : route.path) as string);

/** 固定/取消固定第二列 */
const toggleSecondFixed = () => {
  isSecondFixed.value = !isSecondFixed.value;
  localStorage.setItem(SECOND_FIXED_KEY, isSecondFixed.value ? "1" : "0");
  if (isSecondFixed.value) {
    isSecondVisible.value = currentSubMenuTree.value.length > 0;
  }
};

/** 搜索输入处理（防抖由 ColumnSubMenu 渲染天然节流，无需额外处理） */
const handleSecondSearchInput = () => {
  if (!isSecondVisible.value && currentSubMenuTree.value.length > 0) {
    isSecondVisible.value = true;
  }
};

/** 递归过滤子菜单树：标题命中或后代命中的节点保留 */
const filterMenuTree = (menus: any[], keyword: string): any[] => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return menus;
  const result: any[] = [];
  for (const item of menus) {
    const title = String(getMenuLanguage(item.meta?.title) ?? "").toLowerCase();
    const children = item.children?.length ? filterMenuTree(item.children, keyword) : [];
    if (title.includes(kw) || children.length > 0) {
      result.push({ ...item, children });
    }
  }
  return result;
};

/** 搜索过滤后的子菜单树 */
const filteredSubMenuTree = computed(() => filterMenuTree(currentSubMenuTree.value, secondSearch.value));

/** 鼠标进入第一列：未悬停具体菜单时展示激活顶级菜单的子菜单 */
const onSiderEnter = () => {
  if (hoveredTopMenuId.value == null && activeTopMenuId.value != null) {
    currentSubMenuTree.value = getSubMenuTree(activeTopMenuId.value);
  }
  isSecondVisible.value = currentSubMenuTree.value.length > 0;
};

/** 鼠标离开第一列与第二列：未固定时隐藏第二列 */
const onSiderLeave = () => {
  hoveredTopMenuId.value = null;
  if (!isSecondFixed.value) {
    isSecondVisible.value = false;
  }
};

/** 悬停第一列菜单项：切换第二列内容 */
const handleFirstItemEnter = (item: any) => {
  hoveredTopMenuId.value = item.meta?.menuId;
  currentSubMenuTree.value = getSubMenuTree(item.meta?.menuId);
  isSecondVisible.value = currentSubMenuTree.value.length > 0;
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

  if (!route?.children?.length) {
    // 更新当前激活的顶级菜单
    activeTopMenuId.value = route.meta?.menuId;
    currentSubMenuTree.value = [];
    isSecondVisible.value = false;
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
 * 初始化菜单状态
 */
const initMenu = () => {
  if (!topLevelMenus.value.length) return;

  const { menuId, activeMenu } = route.meta || {};

  // 情况一：没有提供 menuId 或 activeMenu，默认选第一个顶级菜单
  if (!menuId && !activeMenu) {
    activeTopMenuId.value = topLevelMenus.value[0]?.meta?.menuId;
    currentSubMenuTree.value = getSubMenuTree(activeTopMenuId.value);
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
  // 固定状态持久化：进入时若已固定且存在子菜单，则直接显示第二列
  if (isSecondFixed.value && currentSubMenuTree.value.length > 0) {
    isSecondVisible.value = true;
  }
});

// 监听路由变化
watch(
  () => route,
  () => {
    initMenu();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.layout-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .layout-header {
    height: $aside-header-height;
    background-color: var(--el-header-bg-color);
  }
}

/** 悬停容器：弹性行布局，宽度随第一列/第二列内容自适应 */
.layout-double-sider {
  position: relative;
  display: flex;
  flex-shrink: 0;
  height: 100vh;
  min-height: 0;
  user-select: none;
}

/** 第一列：一级菜单（正常垂直大小） */
.layout-double-first-aside {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-left: $aside-menu-padding-left;
  padding-right: 0;
  box-sizing: border-box;
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-aside-border-right-color);
}

.layout-double-first-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.layout-double-first-pad {
  padding-right: $aside-menu-padding-right;
  box-sizing: border-box;
}

.layout-double-first-item {
  display: flex;
  align-items: center;
  height: $aside-menu-height;
  margin-bottom: $aside-menu-margin-bottom;
  padding: 0 8px;
  gap: 8px;
  font-weight: $aside-menu-font-weight;
  color: var(--el-menu-text-color);
  cursor: pointer;
  border-radius: $aside-menu-border-left;
  transition: all 0.2s ease;

  &:hover {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color);
  }

  &.is-hover {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color);
  }

  &.is-active {
    color: var(--el-menu-active-text-color);
    background: var(--el-menu-active-bg-color);
  }

  .title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
}

/** 第二列：二级菜单悬浮栏（默认绝对定位覆盖内容区；固定时转为弹性占位撑开内容区） */
.layout-double-second-aside {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 100%;
  z-index: 30;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-height: 0;
  padding-left: $column-menu-padding-left;
  padding-right: 0;
  box-sizing: border-box;
  user-select: none;
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-aside-border-right-color);
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.08);

  &.is-fixed {
    position: relative;
    left: 0;
    z-index: 10;
    box-shadow: none;
  }
}

/** 第二列头部：搜索框 + 固定按钮（与 logo 等高 $aside-header-height） */
.layout-double-second-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
  height: $aside-header-height;
  padding: 0 6px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .layout-double-second-search {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      height: 36px;
      padding-left: 10px;
      padding-right: 8px;
      font-size: 14px;
      border-radius: 10px;
      box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
      transition: box-shadow 0.2s ease;
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }

    :deep(.el-input__inner) {
      height: 34px;
      font-size: 14px;
    }

    :deep(.el-input__prefix) {
      margin-right: 2px;
    }

    :deep(.el-input__prefix-icon) {
      font-size: 16px;
    }

    :deep(.el-input__suffix) {
      margin-left: 2px;
    }
  }

  .layout-double-pin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-menu-hover-bg-color);
    }

    &.is-fixed {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }
}

.layout-double-second-aside :deep(.el-menu) {
  height: auto;
  min-height: 0;
  max-height: none;
  border-right: none;
  box-sizing: border-box;
}

.layout-double-second-aside :deep(.el-menu.el-menu--collapse) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.layout-double-menu-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.layout-double-menu-pad {
  padding-right: $column-menu-padding-right;
  box-sizing: border-box;
}

/** 内容区：占满剩余宽度 */
.layout-double-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100vh;
}

.layout-double-main .layout-main {
  box-sizing: border-box;
  padding: 0;
  overflow-x: hidden;
  background-color: var(--el-bg-color);
}

/** 第二列出现/消失过渡 */
.koi-double-enter-active,
.koi-double-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}

.koi-double-enter-from,
.koi-double-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
