<script setup lang="ts">
/**
 * 混合导航基础组件 - 使用自定义菜单
 * 用 div 替代 el-menu，一级菜单无弹出层
 * 支持溢出菜单 "更多" 功能
 */
import { computed, ref, provide, onMounted, onBeforeUnmount, nextTick, watch, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getConfig, responsiveStorageNameSpace, transformI18n } from '@repo/config';
import { usePermissionStoreHook, findRouteByPath, getParentPaths, emitter } from '@repo/core';
import { isAllEmpty } from '@pureadmin/utils';
import { localStorageProxy } from '@repo/utils';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import type { StorageConfigs } from '@repo/config';
import { useNav } from '../../../../hooks/useNav';
import { CustomMenu, CustomMenuItem, CustomSubMenu } from '../../components/custom-menu';
import LayTool from '../../../lay-tool/index.vue';
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";

const props = defineProps<{
  /** 主题类名 */
  themeClass?: string;
  /** 菜单项额外类名 */
  menuItemClass?: string;
  /** 弹出层类名 */
  popperClass?: string;
}>();

const route = useRoute();
const router = useRouter();
const { resolvePath, device } = useNav();

// 提取 store 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || 'bounce');

onMounted(() => {
  emitter.on("showNewMenuChange", (val) => {
    showNewMenu.value = val;
  });
  emitter.on("forceNewMenuChange", (val) => {
    forceNewMenu.value = val;
  });
  emitter.on("menuAnimationChange", (val) => {
    menuAnimation.value = val;
  });
  emitter.on("newMenuAnimationChange", (val) => {
    newMenuAnimation.value = val;
  });
});

// 当前激活路径
const defaultActive = computed(() => {
  const wholeMenus = permissionStore.wholeMenus;
  const parentRoutes = getParentPaths(route.path, wholeMenus)[0];
  return !isAllEmpty(route.meta?.activePath)
    ? route.meta.activePath as string
    : findRouteByPath(parentRoutes, wholeMenus)?.children?.[0]?.path || route.path;
});

// 菜单点击
function handleMenuClick(path: string) {
  router.push(path);
}

// === 菜单溢出处理 ===
const headerRef = ref<HTMLElement | null>(null);
const menuContainerRef = ref<HTMLElement | null>(null);
const rightToolbarRef = ref<HTMLElement | null>(null);
const visibleCount = ref(999); // 可见菜单数量，初始全部显示
const MORE_MENU_WIDTH = 60; // "..."菜单的宽度

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
  
  // 计算菜单区域的可用宽度
  const padding = 32;
  const menuMargin = 32;
  const availableWidth = headerWidth - rightToolbarWidth - padding - menuMargin;
  
  if (availableWidth <= 0) {
    visibleCount.value = 1;
    return;
  }
  
  // 获取菜单容器
  const menuContainerEl = getMenuContainerEl();
  
  // 获取所有菜单项元素并计算宽度
  const itemWidths: number[] = [];
  
  if (menuContainerEl) {
    const menuItems = menuContainerEl.querySelectorAll(':scope > .custom-menu-item:not(.more-menu), :scope > .custom-sub-menu:not(.more-menu)');
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
  const safetyMargin = 30;
  
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

// 防抖的计算函数
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
  
  resizeObserver.observe(headerRef.value);
}

onMounted(() => {
  nextTick(() => {
    setupResizeObserver();
    setTimeout(() => calcVisibleCount(), 200);
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (initTimer) clearTimeout(initTimer);
  if (recalcTimer) clearTimeout(recalcTimer);
  if (debounceTimer) clearTimeout(debounceTimer);
});

// 监听菜单数据变化
watch(allMenus, () => {
  nextTick(() => {
    visibleCount.value = allMenus.value.length;
    setTimeout(() => calcVisibleCount(), 100);
  });
}, { immediate: false });

// 监听 visibleCount 变化，重新计算
watch(visibleCount, () => {
  if (recalcTimer) clearTimeout(recalcTimer);
  recalcTimer = setTimeout(() => {
    const menuContainerEl = getMenuContainerEl();
    if (menuContainerEl) {
      const items = menuContainerEl.querySelectorAll(':scope > .custom-menu-item, :scope > .custom-sub-menu');
      let totalWidth = 0;
      items.forEach(item => {
        totalWidth += (item as HTMLElement).offsetWidth;
      });
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
    v-if="device !== 'mobile'"
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    :class="['horizontal-header', 'horizontal-custom-menu', themeClass]"
  >
    <!-- 菜单区域：使用自定义菜单组件 -->
    <CustomMenu
      ref="menuContainerRef"
      mode="horizontal"
      :default-active="defaultActive"
      class="horizontal-header-menu"
      :theme-class="themeClass"
    >
      <!-- 可见菜单项 -->
      <CustomMenuItem
        v-for="menuItem in visibleMenus"
        :key="menuItem.path"
        :index="resolvePath(menuItem) || menuItem.redirect || menuItem.path"
        :class="['mix-menu-item', menuItemClass, { 'menu-animation': menuAnimation }]"
        @click="handleMenuClick(resolvePath(menuItem) || menuItem.redirect || menuItem.path)"
      >
        <div class="menu-item-content">
          <span v-if="menuItem.meta?.icon" class="menu-icon">
            <component :is="useRenderIcon(menuItem.meta.icon)" />
          </span>
          <span class="menu-title">
            {{ transformI18n(menuItem.meta?.i18nKey || menuItem.meta?.title) }}
          </span>
          <ReMenuNewBadge
            v-if="showNewMenu"
            :createTime="menuItem.meta?.createTime"
            :type="menuItem.meta?.badgeType || 'primary'"
            :customText="menuItem.meta?.badgeText"
            :forceShow="forceNewMenu || menuItem.meta?.permanentNew"
            :animation="newMenuAnimation"
          />
        </div>
      </CustomMenuItem>
      
      <!-- 更多菜单（溢出部分） -->
      <CustomSubMenu
        v-if="overflowMenus.length > 0"
        index="__more__"
        :popper-class="popperClass"
        popper-direction="bottom"
        class="more-menu"
        :class="{ 'menu-animation': menuAnimation }"
        hide-arrow
      >
        <template #title>
          <span class="menu-title">...</span>
        </template>
        
        <!-- 溢出的菜单项 -->
        <CustomMenuItem
          v-for="menuItem in overflowMenus"
          :key="menuItem.path"
          :index="resolvePath(menuItem) || menuItem.redirect || menuItem.path"
          :class="['mix-menu-item', menuItemClass, { 'menu-animation': menuAnimation }]"
          @click="handleMenuClick(resolvePath(menuItem) || menuItem.redirect || menuItem.path)"
        >
          <div class="menu-item-content">
            <span v-if="menuItem.meta?.icon" class="menu-icon">
              <component :is="useRenderIcon(menuItem.meta.icon)" />
            </span>
            <span class="menu-title">
              {{ transformI18n(menuItem.meta?.i18nKey || menuItem.meta?.title) }}
            </span>
            <ReMenuNewBadge
              v-if="showNewMenu"
              :createTime="menuItem.meta?.createTime"
              :type="menuItem.meta?.badgeType || 'primary'"
              :customText="menuItem.meta?.badgeText"
              :forceShow="forceNewMenu || menuItem.meta?.permanentNew"
              :animation="newMenuAnimation"
            />
          </div>
        </CustomMenuItem>
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

.horizontal-header-menu {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
  height: 100%;
  margin: 0 16px;
  overflow: hidden;
  
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
  min-width: auto;
  color: var(--pure-theme-sub-menu-active-text);
}

// "更多"菜单样式
.more-menu {
  flex-shrink: 0;
  
  .menu-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
  }
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

// 菜单动画
.menu-animation {
  &.is-active.mix-menu-item,
  &.is-active.more-menu > .custom-sub-menu__title {
    animation: menu-bounce 0.5s;
  }
}

@keyframes menu-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
</style>
