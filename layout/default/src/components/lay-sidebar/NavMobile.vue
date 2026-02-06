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
import { isAllEmpty } from "@pureadmin/utils";
import { computed, ref, watch } from "vue";
import type { MenuItem } from "../../types/menu";
import DefaultSidebarItem from "./components/themes/DefaultSidebarItem.vue";
import UserDropdown from "../../components/lay-tool/dropdowns/UserDropdown.vue"; // 引入用户下拉组件

const route = useRoute();
const router = useRouter();
const { title, onPanel } = useNav(); // 获取标题

// 提取 store 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

// 抽屉菜单是否显示
const drawerVisible = ref(false);

// 切换抽屉
function toggleDrawer() {
  drawerVisible.value = !drawerVisible.value;
}

// 获取菜单数据
const menuData = computed(() => {
  return permissionStore.wholeMenus || [];
});

// 当前激活路径
const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

// 菜单选择事件
function handleMenuSelect() {
  drawerVisible.value = false; // 关闭抽屉
}

// 监听路由变化 (el-menu会自动处理激活状态，这里主要是为了可能的额外逻辑，或者保持原有逻辑)
// 原有逻辑是更新 activeMenuIndex，但在 el-menu 中不需要了。
// 我们可以保留监听路由来关闭抽屉？不用，handleMenuSelect 已经处理了点击。
// 如果用户通过其他方式（如浏览器后退）改变路由，el-menu 会自动更新 defaultActive。
// 所以原来的 watch 可以移除。

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
        <!-- 系统设置 -->
        <div class="setting-trigger" @click="onPanel">
          <IconifyIconOnline icon="ri:settings-3-line" class="trigger-icon" />
        </div>
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
          <el-menu
            :default-active="defaultActive"
            class="mobile-menu"
            :collapse="false"
            unique-opened
            router
            @select="handleMenuSelect"
          >
            <DefaultSidebarItem
              v-for="route in menuData"
              :key="route.path"
              :item="route"
              :base-path="route.path"
              :collapse="false"
            />
          </el-menu>
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
  background: var(--stitch-lay-bg-panel, #fff);
  border-bottom: 1px solid var(--stitch-lay-border, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-trigger,
.setting-trigger {
  width: 44px;
  height: 44px; /* 44px 触控热区 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  .trigger-icon {
    font-size: 24px;
    color: var(--stitch-lay-text-main, var(--el-text-color-primary));
  }
  
  &:active {
    opacity: 0.7;
  }
}

.mobile-menu {
  border-right: none;
  background-color: transparent;
}


.app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--stitch-lay-text-main, var(--el-text-color-primary));
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
  background: var(--stitch-lay-bg-panel, var(--el-bg-color));
}

.drawer-header {
  height: var(--mobile-header-height, 52px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));
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
