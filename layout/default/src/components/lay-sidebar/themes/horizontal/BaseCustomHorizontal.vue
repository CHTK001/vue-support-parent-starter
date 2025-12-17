<script setup lang="ts">
/**
 * 横向导航基础组件 - 使用自定义菜单
 * 完全用 div 替代 el-menu，避免样式冲突
 */
import { computed, ref, provide, onMounted, onBeforeUnmount, nextTick, watch, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { getConfig, responsiveStorageNameSpace } from '@repo/config';
import { usePermissionStoreHook, emitter } from '@repo/core';
import { isAllEmpty } from '@pureadmin/utils';
import { localStorageProxy } from '@repo/utils';
import type { StorageConfigs } from '@repo/config';
import { useNav } from '../../../../hooks/useNav';
import { CustomMenu, CustomSidebarItem, CustomSubMenu } from '../../components/custom-menu';
import LayTool from '../../../lay-tool/index.vue';
import ThemeDecoration from '../../../ThemeDecoration.vue';
import { getComponentDecorations } from '../../../../themes/decorations';
import type { DecorationConfig } from '../../../../themes/decorations';

const props = defineProps<{
  /** 主题类名 */
  themeClass?: string;
  /** 弹出层类名 */
  popperClass?: string;
  /** 主题化的 SidebarItem 组件 */
  sidebarItemComponent?: Component;
}>();

const route = useRoute();
const { getLogo, backTopMenu } = useNav();

// 提供主题化组件给子组件递归使用
const ThemeSidebarItem = computed(() => props.sidebarItemComponent || CustomSidebarItem);
provide('themeSidebarItem', ThemeSidebarItem.value);

// 当前激活路径
const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

// === 菜单溢出处理 ===
const menuContainerRef = ref<HTMLElement | null>(null);
const visibleCount = ref(999); // 可见菜单数量
const MENU_ITEM_WIDTH = 120; // 每个菜单项的估算宽度
const MORE_MENU_WIDTH = 80; // "更多"菜单的宽度

// 全部菜单
const allMenus = computed(() => usePermissionStoreHook().wholeMenus);

// 可见菜单
const visibleMenus = computed(() => {
  if (visibleCount.value >= allMenus.value.length) {
    return allMenus.value;
  }
  return allMenus.value.slice(0, visibleCount.value);
});

// 溢出菜单（放入"更多"）
const overflowMenus = computed(() => {
  if (visibleCount.value >= allMenus.value.length) {
    return [];
  }
  return allMenus.value.slice(visibleCount.value);
});

// 计算可见菜单数量
function calcVisibleCount() {
  if (!menuContainerRef.value) return;
  
  const containerWidth = menuContainerRef.value.clientWidth;
  const totalMenus = allMenus.value.length;
  
  // 计算可以容纳的菜单数量
  let availableWidth = containerWidth;
  let count = 0;
  
  // 如果所有菜单都能显示，就不需要"更多"
  if (totalMenus * MENU_ITEM_WIDTH <= containerWidth) {
    visibleCount.value = totalMenus;
    return;
  }
  
  // 需要预留"更多"菜单的空间
  availableWidth -= MORE_MENU_WIDTH;
  count = Math.floor(availableWidth / MENU_ITEM_WIDTH);
  
  // 至少显示1个菜单
  visibleCount.value = Math.max(1, count);
}

// 监听容器尺寸变化
let resizeObserver: ResizeObserver | null = null;

function setupResizeObserver() {
  if (!menuContainerRef.value) return;
  
  resizeObserver = new ResizeObserver(() => {
    calcVisibleCount();
  });
  
  resizeObserver.observe(menuContainerRef.value);
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
  
  nextTick(() => {
    setupResizeObserver();
    calcVisibleCount();
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
  resizeObserver?.disconnect();
});

// 监听菜单数据变化
watch(allMenus, () => {
  nextTick(() => {
    calcVisibleCount();
  });
});
</script>

<template>
  <div
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    :class="['horizontal-header', 'horizontal-custom-menu', themeClass]"
  >
    <!-- Logo 区域 -->
    <div class="horizontal-header-left" @click="backTopMenu">
      <img :src="getLogo()" alt="logo" />
      <span>{{ getConfig().Title }}</span>
    </div>
    
    <!-- 菜单区域：使用自定义菜单组件 -->
    <CustomMenu
      ref="menuContainerRef"
      mode="horizontal"
      :default-active="defaultActive as string"
      class="horizontal-header-menu"
      :theme-class="themeClass"
    >
      <!-- 可见菜单项 -->
      <component
        :is="ThemeSidebarItem"
        v-for="menuItem in visibleMenus"
        :key="menuItem.path"
        :item="menuItem"
        :base-path="menuItem.path"
        :popper-class="popperClass"
      />
      
      <!-- 更多菜单（溢出部分） -->
      <CustomSubMenu
        v-if="overflowMenus.length > 0"
        index="__more__"
        :popper-class="popperClass"
        popper-direction="bottom"
        class="more-menu"
      >
        <template #title>
          <div class="menu-item-content">
            <span class="menu-title">更多</span>
            <span class="more-icon">
              <svg viewBox="0 0 1024 1024" width="14" height="14">
                <path fill="currentColor" d="M512 768a42.666667 42.666667 0 0 1-30.165333-12.501333l-384-384a42.666667 42.666667 0 0 1 60.330666-60.330667L512 665.002667l353.834667-353.834667a42.666667 42.666667 0 0 1 60.330666 60.330667l-384 384A42.666667 42.666667 0 0 1 512 768z" />
              </svg>
            </span>
          </div>
        </template>
        
        <!-- 溢出的菜单项 -->
        <component
          :is="ThemeSidebarItem"
          v-for="menuItem in overflowMenus"
          :key="menuItem.path"
          :item="menuItem"
          :base-path="menuItem.path"
          :popper-class="popperClass"
          :is-nest="true"
        />
      </CustomSubMenu>
    </CustomMenu>
    
    <!-- 右侧工具栏 -->
    <div class="horizontal-header-right">
      <LayTool />
    </div>
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in sidebarDecorations"
      :key="`horizontal-decoration-${index}`"
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

.horizontal-header-left {
  display: flex;
  align-items: center;
  min-width: 180px;
  height: 100%;
  padding-left: 8px;
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.85;
  }

  img {
    display: inline-block;
    height: 32px;
  }

  span {
    display: inline-block;
    height: 32px;
    margin-left: 12px;
    font-size: 18px;
    font-weight: 600;
    line-height: 32px;
    color: var(--pure-theme-sub-menu-active-text);
  }
}

.horizontal-header-menu {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
  margin: 0 24px;
  overflow: hidden; // 隐藏溢出，由"更多"菜单处理
}

.horizontal-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 300px;
  color: var(--pure-theme-sub-menu-active-text);
}

// "更多"菜单样式
.more-menu {
  flex-shrink: 0;
  
  .menu-item-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .menu-title {
    font-size: 14px;
    font-weight: 500;
  }
  
  .more-icon {
    display: flex;
    align-items: center;
    transition: transform 0.3s ease;
  }
  
  &.is-open .more-icon {
    transform: rotate(180deg);
  }
}
</style>
