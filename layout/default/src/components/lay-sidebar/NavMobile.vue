<script setup lang="ts">
/**
 * 移动端导航组件
 * 专为手机和平板设计的触控友好导航
 * @author CH
 * @since 2024-12-04
 */
import { useRoute, useRouter } from "vue-router";
import { usePermissionStoreHook } from "@repo/core";
import { useNav } from "../../hooks/useNav";
import { transformI18n } from "@repo/config";
import { isAllEmpty } from "@pureadmin/utils";
import { computed, ref, toRaw, watch } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import LaySidebarExtraIcon from "./components/SidebarExtraIcon.vue";

const route = useRoute();
const router = useRouter();
const { pureApp, menuSelect, getLogo, onPanel } = useNav();

// 打开设置面板
function openSetting() {
  onPanel();
}

// 底部导航是否展开
const isNavExpanded = ref(false);

// 抽屉菜单是否显示
const drawerVisible = ref(false);

// 当前选中的一级菜单索引
const activeMenuIndex = ref(0);

// 获取菜单数据
const menuData = computed(() => {
  return usePermissionStoreHook().wholeMenus || [];
});

// 当前激活路径
const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

// 底部导航项（最多显示5个）
const bottomNavItems = computed(() => {
  const items = menuData.value.slice(0, 4);
  return items;
});

// 是否有更多菜单
const hasMoreMenu = computed(() => {
  return menuData.value.length > 4;
});

/**
 * 获取菜单的实际跳转路径
 * 优先使用 redirect，否则递归查找第一个可跳转的子菜单
 */
function getMenuPath(item: any): string {
  // 如果有 redirect，优先使用
  if (item.redirect && item.redirect !== item.path) {
    return item.redirect;
  }
  // 如果有子菜单，递归查找第一个可跳转的
  if (item.children && item.children.length > 0) {
    const showingChildren = item.children.filter(
      (child: any) => child.meta?.showLink !== false
    );
    if (showingChildren.length > 0) {
      return getMenuPath(showingChildren[0]);
    }
  }
  // 返回当前路径
  return item.path;
}

/**
 * 递归获取所有叶子菜单（没有子菜单的菜单项）
 */
function getAllLeafMenus(menus: any[]): any[] {
  const result: any[] = [];
  for (const menu of menus) {
    if (menu.meta?.showLink === false) continue;

    const showingChildren =
      menu.children?.filter((child: any) => child.meta?.showLink !== false) ||
      [];

    if (showingChildren.length === 0) {
      // 没有子菜单，这是叶子菜单
      result.push(menu);
    } else {
      // 有子菜单，递归获取
      result.push(...getAllLeafMenus(showingChildren));
    }
  }
  return result;
}

// 点击底部导航项 - 直接弹出子菜单
function handleNavClick(item: any, index: number) {
  activeMenuIndex.value = index;

  // 如果有子菜单，打开抽屉显示子菜单
  const showingChildren =
    item.children?.filter((child: any) => child.meta?.showLink !== false) || [];

  if (showingChildren.length > 0) {
    drawerVisible.value = true;
  } else {
    // 没有子菜单，直接跳转
    const targetPath = getMenuPath(item);
    router.push(targetPath);
    menuSelect(targetPath);
  }
}

// 点击更多按钮 - 显示所有叶子菜单
function handleMoreClick() {
  activeMenuIndex.value = -1;
  drawerVisible.value = true;
}

// 点击子菜单项
function handleSubMenuClick(item: any) {
  const targetPath = getMenuPath(item);
  router.push(targetPath);
  menuSelect(targetPath);
  drawerVisible.value = false;
}

// 当前选中的一级菜单
const currentMenu = computed(() => {
  if (
    activeMenuIndex.value >= 0 &&
    activeMenuIndex.value < menuData.value.length
  ) {
    return menuData.value[activeMenuIndex.value];
  }
  return null;
});

// 当前显示的子菜单
const currentSubMenus = computed(() => {
  if (activeMenuIndex.value === -1) {
    // 更多：显示所有叶子菜单
    return getAllLeafMenus(menuData.value);
  }
  // 显示当前菜单的子菜单
  return (
    currentMenu.value?.children?.filter(
      (child: any) => child.meta?.showLink !== false
    ) || []
  );
});

// 监听路由变化，更新激活状态
watch(
  () => route.path,
  (newPath) => {
    // 查找当前路由属于哪个一级菜单
    for (let i = 0; i < menuData.value.length; i++) {
      const menu = menuData.value[i];
      if (newPath.startsWith(menu.path)) {
        activeMenuIndex.value = i;
        break;
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="mobile-nav-layout">
    <!-- 主内容区域 -->
    <div class="mobile-content">
      <slot />
    </div>

    <!-- 底部导航栏 -->
    <div class="mobile-bottom-nav">
      <div
        v-for="(item, index) in bottomNavItems"
        :key="item.path"
        class="nav-item"
        :class="{ 'is-active': activeMenuIndex === index }"
        @click="handleNavClick(item, index)"
      >
        <div class="nav-icon">
          <component :is="useRenderIcon(item.meta && toRaw(item.meta.icon))" />
        </div>
        <span class="nav-label">{{
          transformI18n(item.meta?.i18nKey || item.meta?.title)
        }}</span>
      </div>

      <!-- 更多按钮 -->
      <div
        v-if="hasMoreMenu"
        class="nav-item"
        :class="{ 'is-active': activeMenuIndex === -1 }"
        @click="handleMoreClick"
      >
        <div class="nav-icon">
          <IconifyIconOnline icon="ri:apps-line" />
        </div>
        <span class="nav-label">更多</span>
      </div>

      <!-- 设置按钮 -->
      <div class="nav-item nav-setting" @click="openSetting">
        <div class="nav-icon">
          <IconifyIconOnline icon="ri:settings-3-line" />
        </div>
        <span class="nav-label">设置</span>
      </div>
    </div>

    <!-- 菜单抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="btt"
      size="60%"
      :with-header="false"
      class="mobile-menu-drawer"
    >
      <div class="drawer-content">
        <!-- 抽屉头部 -->
        <div class="drawer-header">
          <h3 class="drawer-title">
            {{
              activeMenuIndex === -1
                ? "全部功能"
                : transformI18n(
                    currentMenu?.meta?.i18nKey || currentMenu?.meta?.title
                  )
            }}
          </h3>
          <el-button circle size="small" @click="drawerVisible = false">
            <IconifyIconOnline icon="ri:close-line" />
          </el-button>
        </div>

        <!-- 菜单列表 -->
        <div class="menu-grid thin-scroller">
          <div
            v-for="item in currentSubMenus"
            :key="item.path"
            class="menu-card"
            :class="{
              'is-active':
                defaultActive === item.path ||
                defaultActive.startsWith(item.path + '/'),
            }"
            @click="handleSubMenuClick(item)"
          >
            <div class="menu-icon">
              <component
                :is="useRenderIcon(item.meta && toRaw(item.meta.icon))"
              />
            </div>
            <span class="menu-label">{{
              transformI18n(item.meta?.i18nKey || item.meta?.title)
            }}</span>
            <LaySidebarExtraIcon
              v-if="item.meta?.extraIcon"
              :extra-icon="item.meta.extraIcon"
            />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.mobile-nav-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
}

.mobile-content {
  flex: 1;
  overflow: auto;
  padding-bottom: 70px; /* 底部导航高度 */
}

/* 底部导航栏 */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 0 4px;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 100;
  gap: 2px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1 0 auto;
  min-width: 56px;
  max-width: 80px;
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  padding: 6px 2px;
  border-radius: 10px;
  margin: 3px 1px;

  &::before {
    content: "";
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 3px;
    background: var(--el-color-primary);
    border-radius: 2px;
    transition: transform 0.3s ease;
  }

  &.is-active {
    background: rgba(var(--el-color-primary-rgb), 0.1);

    &::before {
      transform: translateX(-50%) scaleX(1);
    }

    .nav-icon {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }

    .nav-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

.nav-icon {
  font-size: 24px;
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 10px;
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 52px;
  line-height: 1.2;
}

/* 设置按钮样式 */
.nav-setting {
  .nav-icon {
    color: var(--el-text-color-secondary);
  }

  &:active {
    .nav-icon {
      color: var(--el-color-primary);
      transform: rotate(90deg);
    }
  }
}

/* 抽屉样式 */
:deep(.mobile-menu-drawer) {
  .el-drawer {
    border-radius: 20px 20px 0 0;
  }

  .el-drawer__body {
    padding: 0;
  }
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.menu-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 20px;
  overflow-y: auto;
  align-content: start;
}

.menu-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:active {
    transform: scale(0.95);
  }

  &.is-active {
    background: rgba(var(--el-color-primary-rgb), 0.1);
    border-color: var(--el-color-primary);

    .menu-icon {
      color: var(--el-color-primary);
    }

    .menu-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.08);
  }
}

.menu-icon {
  font-size: 28px;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.menu-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
}
</style>
