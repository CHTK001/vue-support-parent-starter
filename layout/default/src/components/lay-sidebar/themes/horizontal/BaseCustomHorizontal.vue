<script setup lang="ts">
/**
 * 横向导航基础组件 - 使用自定义菜单
 * 完全用 div 替代 el-menu，避免样式冲突
 * 使用 ResizeObserver + 防抖监听宽度变化
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

// 提取 store 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

// 提供主题化组件给子组件递归使用
const ThemeSidebarItem = computed(() => props.sidebarItemComponent || CustomSidebarItem);
provide('themeSidebarItem', ThemeSidebarItem.value);

// 当前激活路径
const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

// === 菜单溢出处理 ===
const headerRef = ref<HTMLElement | null>(null);
const menuContainerRef = ref<HTMLElement | null>(null);
const rightToolbarRef = ref<HTMLElement | null>(null);
const visibleCount = ref(999); // 可见菜单数量，初始全部显示
const MORE_MENU_WIDTH = 80; // "更多"菜单的宽度
const LOGO_WIDTH = 210; // Logo 区域的估算宽度

// 全部菜单
const allMenus = computed(() => permissionStore.wholeMenus);

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

// 获取菜单容器 DOM 元素
function getMenuContainerEl(): HTMLElement | null {
  if (!menuContainerRef.value) return null;
  if ('$el' in menuContainerRef.value) {
    return (menuContainerRef.value as any).$el as HTMLElement;
  }
  return menuContainerRef.value as HTMLElement;
}

// 计算可见菜单数量 - 基于实际测量
function calcVisibleCount() {
  if (!headerRef.value) {
    return;
  }
  
  const totalMenus = allMenus.value.length;
  if (totalMenus === 0) {
    return;
  }
  
  // 获取整个 header 的宽度
  const headerWidth = headerRef.value.clientWidth;
  if (headerWidth === 0) {
    return;
  }
  
  // 获取右侧工具栏的实际宽度
  const rightToolbarWidth = rightToolbarRef.value?.offsetWidth || 300;
  
  // 计算菜单区域的可用宽度 = header宽度 - Logo宽度 - 右侧工具栏宽度 - padding
  const padding = 32; // 左右 padding
  const menuMargin = 32; // 菜单区域的 margin
  const availableWidth = headerWidth - LOGO_WIDTH - rightToolbarWidth - padding - menuMargin;
  
  if (availableWidth <= 0) {
    visibleCount.value = 1;
    return;
  }
  
  // 获取菜单容器
  const menuContainerEl = getMenuContainerEl();
  
  // 获取所有菜单项元素并计算宽度
  const itemWidths: number[] = [];
  
  if (menuContainerEl) {
    const menuItems = menuContainerEl.querySelectorAll(':scope > .custom-menu-item, :scope > .custom-sub-menu:not(.more-menu)');
    menuItems.forEach((item) => {
      const el = item as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const marginLeft = parseFloat(style.marginLeft) || 0;
      const marginRight = parseFloat(style.marginRight) || 0;
      itemWidths.push(rect.width + marginLeft + marginRight);
    });
  }
  
  // 如果没有测量到宽度，使用估算值
  const estimatedItemWidth = 100;
  
  if (itemWidths.length === 0 || itemWidths.every(w => w === 0)) {
    const safeWidth = availableWidth - MORE_MENU_WIDTH - 20;
    const count = Math.floor(safeWidth / estimatedItemWidth);
    visibleCount.value = Math.max(1, Math.min(count, totalMenus));
    return;
  }
  
  // 计算可以容纳的菜单数量
  let usedWidth = 0;
  let count = 0;
  const safetyMargin = 30; // 安全边距
  
  for (let i = 0; i < totalMenus; i++) {
    const itemWidth = itemWidths[i] || estimatedItemWidth;
    const remainingMenus = totalMenus - i - 1;
    const needMoreMenu = remainingMenus > 0;
    const reservedWidth = needMoreMenu ? MORE_MENU_WIDTH + safetyMargin : 0;
    
    if (usedWidth + itemWidth + reservedWidth <= availableWidth) {
      usedWidth += itemWidth;
      count++;
    } else {
      break;
    }
  }
  
  visibleCount.value = Math.max(1, count);
}

// 防抖的计算函数（150ms 防抖）
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedCalcVisibleCount() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    calcVisibleCount();
  }, 150);
}

// 监听容器尺寸变化
let resizeObserver: ResizeObserver | null = null;
let initTimer: ReturnType<typeof setTimeout> | null = null;
let recalcTimer: ReturnType<typeof setTimeout> | null = null;

function setupResizeObserver() {
  if (!headerRef.value) {
    initTimer = setTimeout(() => setupResizeObserver(), 100);
    return;
  }
  
  resizeObserver?.disconnect();
  
  resizeObserver = new ResizeObserver(() => {
    debouncedCalcVisibleCount();
  });
  
  // 监听整个 header 的尺寸变化
  resizeObserver.observe(headerRef.value);
}

onMounted(() => {
  nextTick(() => {
    setupResizeObserver();
    // 初始计算延迟执行，等待 DOM 完全渲染
    setTimeout(() => calcVisibleCount(), 200);
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (initTimer) {
    clearTimeout(initTimer);
  }
  if (recalcTimer) {
    clearTimeout(recalcTimer);
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});

// 监听菜单数据变化
watch(allMenus, () => {
  nextTick(() => {
    // 先显示全部，然后重新计算
    visibleCount.value = allMenus.value.length;
    setTimeout(() => calcVisibleCount(), 100);
  });
}, { immediate: false });

// 监听 visibleCount 变化，重新计算（因为 DOM 变化后宽度可能不同）
watch(visibleCount, () => {
  if (recalcTimer) clearTimeout(recalcTimer);
  recalcTimer = setTimeout(() => {
    const menuContainerEl = getMenuContainerEl();
    if (menuContainerEl) {
      // 二次验证，确保计算正确
      const items = menuContainerEl.querySelectorAll(':scope > .custom-menu-item, :scope > .custom-sub-menu');
      let totalWidth = 0;
      items.forEach(item => {
        totalWidth += (item as HTMLElement).offsetWidth;
      });
      // 如果超出容器宽度，需要减少显示数量
      if (totalWidth > menuContainerEl.clientWidth && visibleCount.value > 1) {
        visibleCount.value--;
      }
    }
  }, 50);
});
</script>

<template>
  <div
    ref="headerRef"
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
        hide-arrow
      >
        <template #title>
          <span class="menu-title">...</span>
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
    <div ref="rightToolbarRef" class="horizontal-header-right">
      <LayTool />
    </div>
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
  border-bottom: 1px solid var(--el-border-color-light);
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
  flex-wrap: nowrap;
  min-width: 0;
  height: 100%;
  margin: 0 16px;
  overflow: hidden; // 隐藏溢出部分
  
  // 确保菜单项不会被压缩
  :deep(.custom-menu-item),
  :deep(.custom-sub-menu) {
    flex-shrink: 0;
  }
}

.horizontal-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 4px;
  min-width: auto; // 不设置最小宽度，让菜单有更多空间
  color: var(--pure-theme-sub-menu-active-text);
}

// "更多"菜单样式
.more-menu {
  flex-shrink: 0;
  
  .menu-title {
    font-size: 14px;
    font-weight: 500;
  }
}
</style>
