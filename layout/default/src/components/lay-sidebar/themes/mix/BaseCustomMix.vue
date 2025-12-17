<script setup lang="ts">
/**
 * 混合导航基础组件 - 使用自定义菜单
 * 用 div 替代 el-menu，一级菜单无弹出层
 */
import { computed, ref, provide, onMounted, onBeforeUnmount, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getConfig, responsiveStorageNameSpace, transformI18n } from '@repo/config';
import { usePermissionStoreHook, findRouteByPath, getParentPaths, emitter } from '@repo/core';
import { isAllEmpty } from '@pureadmin/utils';
import { localStorageProxy } from '@repo/utils';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import type { StorageConfigs } from '@repo/config';
import { useNav } from '../../../../hooks/useNav';
import { CustomMenu, CustomMenuItem } from '../../components/custom-menu';
import LayTool from '../../../lay-tool/index.vue';
import ThemeDecoration from '../../../ThemeDecoration.vue';
import { getComponentDecorations } from '../../../../themes/decorations';
import type { DecorationConfig } from '../../../../themes/decorations';

const props = defineProps<{
  /** 主题类名 */
  themeClass?: string;
  /** 菜单项额外类名 */
  menuItemClass?: string;
}>();

const route = useRoute();
const router = useRouter();
const { resolvePath, device } = useNav();

// 当前激活路径
const defaultActive = computed(() => {
  const wholeMenus = usePermissionStoreHook().wholeMenus;
  const parentRoutes = getParentPaths(route.path, wholeMenus)[0];
  return !isAllEmpty(route.meta?.activePath)
    ? route.meta.activePath as string
    : findRouteByPath(parentRoutes, wholeMenus)?.children?.[0]?.path || route.path;
});

// 菜单点击
function handleMenuClick(path: string) {
  router.push(path);
}

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
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
</script>

<template>
  <div
    v-if="device !== 'mobile'"
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    :class="['horizontal-header', 'horizontal-custom-menu', themeClass]"
  >
    <!-- 菜单区域：使用自定义菜单组件 -->
    <CustomMenu
      mode="horizontal"
      :default-active="defaultActive"
      class="horizontal-header-menu"
      :theme-class="themeClass"
    >
      <CustomMenuItem
        v-for="menuItem in usePermissionStoreHook().wholeMenus"
        :key="menuItem.path"
        :index="resolvePath(menuItem) || menuItem.redirect || menuItem.path"
        :class="['mix-menu-item', menuItemClass]"
        @click="handleMenuClick(resolvePath(menuItem) || menuItem.redirect || menuItem.path)"
      >
        <div class="menu-item-content">
          <span v-if="menuItem.meta?.icon" class="menu-icon">
            <component :is="useRenderIcon(menuItem.meta.icon)" />
          </span>
          <span class="menu-title">
            {{ transformI18n(menuItem.meta?.i18nKey || menuItem.meta?.title) }}
          </span>
        </div>
      </CustomMenuItem>
    </CustomMenu>
    
    <!-- 右侧工具栏 -->
    <div class="horizontal-header-right">
      <LayTool />
    </div>
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in sidebarDecorations"
      :key="`mix-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}

.horizontal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  background: var(--pure-theme-menu-bg, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 16px;
  position: relative;
}

.horizontal-header-menu {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.horizontal-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 300px;
  color: var(--pure-theme-sub-menu-active-text);
}

.mix-menu-item {
  .menu-item-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    
    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }
  
  .menu-title {
    font-size: 14px;
    white-space: nowrap;
    font-weight: 500;
  }
}
</style>
