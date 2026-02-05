<script setup lang="ts">
/**
 * 移动端导航组件 (重构版)
 * 顶部导航 + 侧边抽屉
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
import type { MenuItem } from "../../types/menu";
import LaySidebarExtraIcon from "./components/SidebarExtraIcon.vue";
import UserDropdown from "../../components/lay-tool/dropdowns/UserDropdown.vue"; // 引入用户下拉组件

const route = useRoute();
const router = useRouter();
const { title } = useNav(); // 获取标题

// 提取 store 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

// 抽屉菜单是否显示
const drawerVisible = ref(false);

// 切换抽屉
function toggleDrawer() {
  drawerVisible.value = !drawerVisible.value;
}

// 当前选中的一级菜单索引
const activeMenuIndex = ref(0);

// 获取菜单数据
const menuData = computed(() => {
  return permissionStore.wholeMenus || [];
});

// 当前激活路径
const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

/**
 * 获取菜单的实际跳转路径
 */
function getMenuPath(item: MenuItem): string {
  if (item.redirect && item.redirect !== item.path) {
    return item.redirect;
  }
  if (item.children && item.children.length > 0) {
    const showingChildren = item.children.filter(
      (child: MenuItem) => child.meta?.showLink !== false
    );
    if (showingChildren.length > 0) {
      return getMenuPath(showingChildren[0]);
    }
  }
  return item.path;
}

// 点击菜单项
function handleMenuClick(item: MenuItem) {
  const targetPath = getMenuPath(item);
  router.push(targetPath);
  drawerVisible.value = false; // 关闭抽屉
}

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
  <div class="lay-mobile mobile-layout">
    <!-- 顶部导航栏 (52px) -->
    <div class="mobile-header">
      <div class="header-left">
        <!-- 汉堡菜单触发器 -->
        <div class="menu-trigger" @click="toggleDrawer">
          <IconifyIconOnline icon="ri:menu-line" class="trigger-icon" />
        </div>
        <!-- Logo/标题 -->
        <span class="app-title">{{ title }}</span>
      </div>
      <div class="header-right">
        <!-- 用户头像/下拉 -->
        <UserDropdown class="mobile-user-dropdown" />
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="mobile-content">
      <slot />
    </div>

    <!-- 侧边菜单抽屉 (280px) -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="280px"
      :with-header="false"
      class="mobile-nav-drawer"
    >
      <div class="drawer-container">
        <!-- 抽屉头部 -->
        <div class="drawer-header">
          <span class="drawer-title">导航菜单</span>
        </div>
        
        <!-- 菜单列表 -->
        <div class="drawer-menu-list thin-scroller">
          <template v-for="item in menuData" :key="item.path">
            <!-- 一级菜单项 (如果有子菜单，简单处理为点击展开或直接跳转，此处简化为直接展示一级或递归展示) -->
            <!-- 这里简化处理：直接展示一级菜单，点击跳转 -->
             <div 
               class="nav-item"
               :class="{ 'is-active': activeMenuIndex === menuData.indexOf(item) }"
               @click="handleMenuClick(item)"
             >
                <div class="nav-icon">
                  <component :is="useRenderIcon(item.meta && toRaw(item.meta.icon))" />
                </div>
                <span class="nav-label">{{ transformI18n(item.meta?.i18nKey || item.meta?.title) }}</span>
             </div>
          </template>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
/* 样式主要由 mobile.scss 控制，这里补充一些组件特有的 */
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
}

.mobile-header {
  height: var(--mobile-header-height, 52px);
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
  :deep(.dark) & {
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-trigger {
  width: 44px;
  height: 44px; /* 44px 触控热区 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  .trigger-icon {
    font-size: 24px;
    color: var(--el-text-color-primary);
  }
  
  &:active {
    opacity: 0.7;
  }
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mobile-content {
  margin-top: var(--mobile-header-height, 52px);
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.drawer-header {
  height: var(--mobile-header-height, 52px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 16px;
  font-weight: 600;
}

.drawer-menu-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  
  .nav-item {
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: all 0.2s;
    
    .nav-icon {
      margin-right: 12px;
      font-size: 18px;
      display: flex;
      align-items: center;
    }
    
    .nav-label {
      font-size: 15px;
    }
    
    &.is-active {
      background: var(--theme-color-opacity-8, rgba(64, 158, 255, 0.08));
      color: var(--el-color-primary);
      
      .nav-icon {
        color: var(--el-color-primary);
      }
    }
    
    &:active {
      background: var(--el-fill-color-light);
    }
  }
}
</style>
