<script setup lang="ts">
import { useGlobal } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@repo/core";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import LayTool from "../../lay-tool/index.vue";
import LaySidebarBreadCrumb from "./SidebarBreadCrumb.vue";
const { $storage, $config } = useGlobal();

// Props
interface Props {
  showTitle?: boolean;
  maxVisibleCards?: number; // 最大可见卡片数量
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  maxVisibleCards: 6, // 默认显示6个卡片
});

// Emits
interface Emits {
  cardClick: [menu: any];
}

const emit = defineEmits<Emits>();

const router = useRouter();
const route = useRoute();
const scrollContainer = ref<HTMLElement>();
const hoveredMenu = ref<any>(null);
const hoveredSubMenu = ref<any>(null);
const hoveredThirdMenu = ref<any>(null);
const hoverTimeout = ref<NodeJS.Timeout>();
const subHoverTimeout = ref<NodeJS.Timeout>();
const thirdHoverTimeout = ref<NodeJS.Timeout>();
const hoveredMenuElement = ref<HTMLElement>();
const subMenuPosition = ref({ top: 0, left: 0 });
const subMenuPosition2 = ref({ top: 0, left: 0 });
const subMenuPosition3 = ref({ top: 0, left: 0 });
const currentComponent = ref<any>(null);
const showCardNavigation = ref(true);
const isDragging = ref(false);
const dragStartX = ref(0);
const scrollStartX = ref(0);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// 生成随机颜色
function getRandomHue() {
  const cardColorMode = $storage.configure?.cardColorMode || "all";

  if (cardColorMode === "white") {
    return 0; // 纯白模式，返回0表示无色相
  }

  const allHues = [220, 280, 340, 30, 120, 180, 200, 260, 320, 60, 90, 150];

  if (cardColorMode === "third") {
    // 1/3随机颜色模式，只使用前4个颜色
    const limitedHues = allHues.slice(0, 4);
    return limitedHues[Math.floor(Math.random() * limitedHues.length)];
  }

  // 默认全部颜色模式
  return allHues[Math.floor(Math.random() * allHues.length)];
}

// 获取主菜单项（一级菜单）
const mainMenuItems = computed(() => {
  const items = usePermissionStoreHook().wholeMenus.filter((menu) => menu.meta?.showLink !== false && menu.path !== "/");
  // 为每个菜单项添加随机颜色
  return items.map((menu) => ({
    ...menu,
    randomHue: getRandomHue(),
  }));
});

// 获取子菜单项（优化版：支持三级菜单）
function getSubMenuItems(menu: any, level: number = 1) {
  if (!menu.children || menu.children.length === 0) return [];

  // 最多支持三级菜单
  if (level > 3) return [];

  const items: any[] = [];

  menu.children.forEach((child: any) => {
    if (child.meta?.showLink === false) return;

    // 检查是否有components（即是否为最终页面）
    const hasComponents = child.component || (child.components && Object.keys(child.components).length > 0);
    const hasChildren = child.children && child.children.length > 0;

    if (level < 3) {
      // 前两级：显示所有菜单项
      items.push({
        ...child,
        level: level,
        hasSubMenu: hasChildren && !hasComponents, // 有子菜单且不是最终页面
      });
    } else {
      // 第三级：只显示有components的数据（最终页面）
      if (hasComponents) {
        items.push({
          ...child,
          level: level,
          hasSubMenu: false,
        });
      }
    }
  });

  return items;
}

// 检查菜单是否应该显示子菜单弹出
function shouldShowSubMenu(menu: any, level: number = 1) {
  const subItems = getSubMenuItems(menu, level);
  return subItems.length > 0;
}

// 处理卡片点击事件
function handleCardClick(menu: any) {
  emit("cardClick", menu);

  // 如果有子菜单，不直接跳转
  if (shouldShowSubMenu(menu)) {
    return;
  }

  // 清除nav参数并跳转到目标路由
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete("nav");
  currentUrl.pathname = menu.path;
  window.history.pushState({}, "", currentUrl.toString());
  // 使用Vue Router进行路由跳转
  router.push(menu.path);
}

// 处理子菜单点击
function handleSubMenuClick(subMenu: any) {
  emit("cardClick", subMenu);

  // 检查是否为remaining菜单项
  if (subMenu.meta?.remaining === true) {
    // 检查是否在当前页面打开
    if (subMenu.meta?.remainingSelf === true) {
      // 在当前页面打开，跳转到remaining组件页面
      const componentPath = convertPathToComponentParam(subMenu.path);
      router.push(`/remaining-component/${componentPath}`);
    } else {
      // 默认行为：在新标签页打开remaining组件页面
      const componentPath = convertPathToComponentParam(subMenu.path);
      const fullUrl = `${window.location.origin}/#/remaining-component/${componentPath}`;
      window.open(fullUrl, "_blank");
    }
  } else {
    // 在新标签页中打开子菜单链接
    window.open("/" + router.resolve(subMenu.path).href, "_blank");
  }

  hoveredMenu.value = null;
}

// 将路径转换为组件路径参数
function convertPathToComponentParam(path: string): string {
  // 移除开头的斜杠并将路径转换为组件参数
  const cleanPath = path.replace(/^\//, "");
  return cleanPath.replace(/\//g, "-");
}

// 处理鼠标悬停
function handleMouseEnter(menu: any, event?: MouseEvent) {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
  }

  if (shouldShowSubMenu(menu)) {
    // 只有当菜单改变或者是第一次悬停时才重新计算位置
    if (hoveredMenu.value !== menu && event) {
      hoveredMenu.value = menu;

      // 计算子菜单位置
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      // 子菜单显示在卡片上方
      subMenuPosition.value = {
        top: rect.top - 10, // 在卡片上方10px
        left: rect.left + rect.width / 2, // 水平居中对齐
      };
    } else if (!event) {
      // 鼠标移动到子菜单时，不重新计算位置
      if (hoverTimeout.value) {
        clearTimeout(hoverTimeout.value);
      }
    }
  }
}

// 处理鼠标离开
function handleMouseLeave() {
  hoverTimeout.value = setTimeout(() => {
    hoveredMenu.value = null;
    hoveredSubMenu.value = null;
    hoveredThirdMenu.value = null;
  }, 200); // 200ms延迟，避免鼠标快速移动时闪烁
}

// 处理二级菜单悬停
function handleSubMenuEnter(subMenu: any, event?: MouseEvent) {
  // 清除相关的超时定时器
  if (subHoverTimeout.value) {
    clearTimeout(subHoverTimeout.value);
  }
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
  }

  if (shouldShowSubMenu(subMenu, 2)) {
    if (hoveredSubMenu.value !== subMenu && event) {
      hoveredSubMenu.value = subMenu;

      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      subMenuPosition2.value = {
        top: rect.top,
        left: rect.right + 10,
      };
    }
  }
}

// 处理二级菜单离开
function handleSubMenuLeave() {
  subHoverTimeout.value = setTimeout(() => {
    hoveredSubMenu.value = null;
    hoveredThirdMenu.value = null; // 同时清除三级菜单
  }, 200);
}

// 处理三级菜单悬停
function handleThirdMenuEnter(thirdMenu: any, event?: MouseEvent) {
  // 清除所有相关的超时定时器，防止菜单意外消失
  if (thirdHoverTimeout.value) {
    clearTimeout(thirdHoverTimeout.value);
  }
  if (subHoverTimeout.value) {
    clearTimeout(subHoverTimeout.value);
  }
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
  }

  if (shouldShowSubMenu(thirdMenu, 3)) {
    if (hoveredThirdMenu.value !== thirdMenu && event) {
      hoveredThirdMenu.value = thirdMenu;

      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      // 三级菜单直接在右侧显示，避免位置跳动
      subMenuPosition3.value = {
        top: rect.top,
        left: rect.right + 10,
      };
    }
  }
}

// 处理三级菜单离开
function handleThirdMenuLeave() {
  thirdHoverTimeout.value = setTimeout(() => {
    hoveredThirdMenu.value = null;
  }, 200);
}

// 检查滚动状态
function checkScrollState() {
  if (scrollContainer.value) {
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
    canScrollLeft.value = scrollLeft > 0;
    canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1;
  }
}

// 滚动功能
function scrollLeft() {
  if (scrollContainer.value) {
    const cardWidth = 200; // 卡片宽度 + 间距
    scrollContainer.value.scrollBy({ left: -cardWidth, behavior: "smooth" });
    setTimeout(checkScrollState, 300);
  }
}

function scrollRight() {
  if (scrollContainer.value) {
    const cardWidth = 200; // 卡片宽度 + 间距
    scrollContainer.value.scrollBy({ left: cardWidth, behavior: "smooth" });
    setTimeout(checkScrollState, 300);
  }
}

// 鼠标拖拽功能
function handleMouseDown(event: MouseEvent) {
  isDragging.value = true;
  dragStartX.value = event.clientX;
  scrollStartX.value = scrollContainer.value?.scrollLeft || 0;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  event.preventDefault();
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return;

  const deltaX = event.clientX - dragStartX.value;
  scrollContainer.value.scrollLeft = scrollStartX.value - deltaX;
  checkScrollState();
}

function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

// 触摸拖拽功能
function handleTouchStart(event: TouchEvent) {
  isDragging.value = true;
  dragStartX.value = event.touches[0].clientX;
  scrollStartX.value = scrollContainer.value?.scrollLeft || 0;
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || !scrollContainer.value) return;

  const deltaX = event.touches[0].clientX - dragStartX.value;
  scrollContainer.value.scrollLeft = scrollStartX.value - deltaX;
  checkScrollState();
  event.preventDefault();
}

function handleTouchEnd() {
  isDragging.value = false;
}

// 根据当前路由获取对应的组件
function getRouteComponent() {
  const currentPath = route.path;
  const urlParams = new URLSearchParams(window.location.search);
  const showNav = urlParams.get("nav") === "true" || window.location.hash === "#nav";

  // 如果URL包含nav参数或hash为#nav，显示卡片导航
  if (showNav || currentPath === "/" || currentPath === "") {
    showCardNavigation.value = true;
    currentComponent.value = null;
    return;
  }

  // 使用router.resolve来获取匹配的路由
  try {
    const resolved = router.resolve(currentPath);
    if (resolved.matched && resolved.matched.length > 0) {
      const matchedRoute = resolved.matched[resolved.matched.length - 1];
      if (matchedRoute.components && matchedRoute.components.default) {
        showCardNavigation.value = false;
        currentComponent.value = matchedRoute.components.default;
        return;
      }
    }
  } catch (error) {
    console.warn("路由解析失败:", error);
  }

  // 如果没有找到匹配的路由，显示卡片导航
  showCardNavigation.value = true;
  currentComponent.value = null;
}

// 返回卡片导航
function goBackToNavigation() {
  // 通过添加URL参数来显示卡片导航
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("nav", "true");
  window.history.pushState({}, "", currentUrl.toString());
  // 手动触发路由检测
  getRouteComponent();
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    getRouteComponent();
  },
  { immediate: true }
);

// 监听URL参数变化
watch(
  () => route.query,
  () => {
    getRouteComponent();
  },
  { immediate: true }
);

// 组件挂载时检查当前路由
onMounted(() => {
  getRouteComponent();

  // 监听浏览器前进后退按钮
  window.addEventListener("popstate", () => {
    getRouteComponent();
  });

  // 初始化滚动状态检测
  setTimeout(() => {
    checkScrollState();
  }, 100);

  // 监听滚动容器的滚动事件
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener("scroll", checkScrollState);
  }
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener("popstate", getRouteComponent);
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", checkScrollState);
  }
  // 清理拖拽事件监听
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});
</script>

<template>
  <div class="card-navigation-container">
    <!-- 顶部信息栏 -->
    <div class="card-navigation-header">
      <!-- 返回按钮（仅在显示组件时显示） -->
      <div v-if="!showCardNavigation" class="back-button" @click="goBackToNavigation">
        <IconifyIconOnline icon="ri:arrow-left-line" />
        <span>返回导航</span>
      </div>
      <!-- 面包屑导航 -->
      <LaySidebarBreadCrumb class="breadcrumb-container" />
      <!-- 工具栏 -->
      <LayTool class="tool-container" />
    </div>

    <!-- 卡片导航区域 -->
    <div v-if="showCardNavigation" class="horizontal-card-wrapper">
      <!-- 左侧滚动箭头 -->
      <div v-show="canScrollLeft" class="scroll-arrow scroll-arrow-left" @click="scrollLeft">
        <IconifyIconOnline icon="ri:arrow-left-fill" />
      </div>

      <!-- 卡片滚动容器 -->
      <div ref="scrollContainer" class="card-scroll-container" :class="{ 'is-dragging': isDragging }" @mousedown="handleMouseDown" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
        <div
          v-for="menu in mainMenuItems"
          :key="menu.path"
          :class="['menu-card', { 'white-mode': $storage.configure?.cardColorMode === 'white' }]"
          :style="{ '--card-hue': menu.randomHue }"
          @click="!isDragging && handleCardClick(menu)"
          @mouseenter="(event) => !isDragging && handleMouseEnter(menu, event)"
          @mouseleave="handleMouseLeave"
        >
          <div class="card-icon-area">
            <IconifyIconOnline v-if="menu.meta?.icon" :icon="menu.meta.icon" />
            <IconifyIconOnline v-else-if="menu.meta?.iconOnline" :icon="menu.meta.iconOnline" />
            <span v-else>{{ menu.meta?.title?.charAt(0) || "?" }}</span>
          </div>
          <div v-if="props.showTitle" class="card-title">{{ menu.meta?.title }}</div>
        </div>
      </div>

      <!-- 右侧滚动箭头 -->
      <div v-show="canScrollRight" class="scroll-arrow scroll-arrow-right" @click="scrollRight">
        <IconifyIconOnline icon="ri:arrow-right-fill" />
      </div>
    </div>

    <!-- 动态组件渲染区域 -->
    <div v-if="!showCardNavigation" class="component-container">
      <component :is="currentComponent" v-if="currentComponent" />
    </div>

    <!-- 子菜单悬停弹出 -->
    <div v-if="hoveredMenu && shouldShowSubMenu(hoveredMenu)" class="sub-menu-popup" :style="{ top: subMenuPosition.top + 'px', left: subMenuPosition.left + 'px' }" @mouseenter="handleMouseEnter(hoveredMenu)" @mouseleave="handleMouseLeave">
      <div class="sub-menu-grid">
        <div v-for="subMenu in getSubMenuItems(hoveredMenu, 1)" :key="subMenu.path" class="sub-menu-card" @click="handleSubMenuClick(subMenu)" @mouseenter="handleSubMenuEnter(subMenu, $event)">
          <div class="sub-card-icon">
            <IconifyIconOnline v-if="subMenu.meta?.icon" :icon="subMenu.meta.icon" />
            <IconifyIconOnline v-else-if="subMenu.meta?.iconOnline" :icon="subMenu.meta.iconOnline" />
            <span v-else>{{ subMenu.meta?.title?.charAt(0) || "?" }}</span>
          </div>
          <div class="sub-card-title">{{ subMenu.meta?.title }}</div>
          <!-- 显示是否有更多子菜单的指示器 -->
          <div v-if="subMenu.hasSubMenu" class="sub-menu-indicator">›</div>
        </div>
      </div>
    </div>

    <!-- 二级子菜单悬停弹出 -->
    <div v-if="hoveredSubMenu && shouldShowSubMenu(hoveredSubMenu, 2)" class="sub-menu-popup level-2" :style="{ top: subMenuPosition2.top + 'px', left: subMenuPosition2.left + 'px' }" @mouseenter="handleSubMenuEnter(hoveredSubMenu)" @mouseleave="handleSubMenuLeave">
      <div class="sub-menu-grid">
        <div v-for="subMenu in getSubMenuItems(hoveredSubMenu, 2)" :key="subMenu.path" class="sub-menu-card" @click="handleSubMenuClick(subMenu)" @mouseenter="handleThirdMenuEnter(subMenu, $event)">
          <div class="sub-card-icon">
            <IconifyIconOnline v-if="subMenu.meta?.icon" :icon="subMenu.meta.icon" />
            <IconifyIconOnline v-else-if="subMenu.meta?.iconOnline" :icon="subMenu.meta.iconOnline" />
            <span v-else>{{ subMenu.meta?.title?.charAt(0) || "?" }}</span>
          </div>
          <div class="sub-card-title">{{ subMenu.meta?.title }}</div>
          <!-- 显示是否有更多子菜单的指示器 -->
          <div v-if="subMenu.hasSubMenu" class="sub-menu-indicator">›</div>
        </div>
      </div>
    </div>

    <!-- 三级子菜单悬停弹出 -->
    <div v-if="hoveredThirdMenu && shouldShowSubMenu(hoveredThirdMenu, 3)" class="sub-menu-popup level-3" :style="{ top: subMenuPosition3.top + 'px', left: subMenuPosition3.left + 'px' }" @mouseenter="() => handleThirdMenuEnter(hoveredThirdMenu)" @mouseleave="handleThirdMenuLeave">
      <div class="sub-menu-grid">
        <div v-for="subMenu in getSubMenuItems(hoveredThirdMenu, 3)" :key="subMenu.path" class="sub-menu-card" @click="handleSubMenuClick(subMenu)">
          <div class="sub-card-icon">
            <IconifyIconOnline v-if="subMenu.meta?.icon" :icon="subMenu.meta.icon" />
            <IconifyIconOnline v-else-if="subMenu.meta?.iconOnline" :icon="subMenu.meta.iconOnline" />
            <span v-else>{{ subMenu.meta?.title?.charAt(0) || "?" }}</span>
          </div>
          <div class="sub-card-title">{{ subMenu.meta?.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 水平卡片导航样式 */
.card-navigation-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  padding: 0;
}

/* 顶部信息栏样式 */
.card-navigation-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 2001;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 添加顶部装饰线 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.3) 50%, rgba(64, 158, 255, 0.1) 100%);
  }

  /* 暗色主题适配 */
  .dark & {
    background: rgba(18, 18, 23, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    &::before {
      background: linear-gradient(90deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.4) 50%, rgba(64, 158, 255, 0.15) 100%);
    }
  }
}

.breadcrumb-container {
  flex: 1;
}

.tool-container {
  flex-shrink: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #22c55e;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.5);
    transform: translateX(-2px);
  }

  .iconify {
    font-size: 16px;
  }

  .dark & {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.4);

    &:hover {
      background: rgba(34, 197, 94, 0.25);
      border-color: rgba(34, 197, 94, 0.6);
    }
  }
}

/* 调整卡片布局容器，为顶部信息栏留出空间 */
.horizontal-card-wrapper {
  margin-top: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  max-width: 1400px;
  width: 100%;
  flex: 1;
  align-self: center;
  padding: 60px 40px;
  position: relative;
}

/* 组件容器样式 */
.component-container {
  margin-top: 48px;
  flex: 1;
  background: linear-gradient(145deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 16px;
  margin: 68px 20px 20px 20px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: auto;

  .dark & {
    background: var(--el-bg-color);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.3),
      0 2px 4px -1px rgba(0, 0, 0, 0.2);
  }
}

.card-scroll-container {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  flex: 1;
  padding: 20px 0;
  scroll-behavior: smooth;
  cursor: grab;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-dragging {
    cursor: grabbing;
    scroll-behavior: auto;
  }

  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  /* 防止拖拽时选中文本 */
  * {
    user-select: none;
    -webkit-user-drag: none;
  }
}

.menu-card {
  min-width: 180px;
  width: 180px;
  height: 200px;
  background: linear-gradient(145deg, #e0f2fe 0%, #b3e5fc 50%, #81d4fa 100%);
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 20px;
  position: relative;
  overflow: visible;
  /* 添加3D透视效果 */
  perspective: 1000px;
  transform-style: preserve-3d;
  box-shadow:
    0 8px 25px -5px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* 添加斜向渐变装饰条 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: 40%;
    background: linear-gradient(135deg, hsl(calc(var(--card-hue, 220) + 0deg), 70%, 65%) 0%, hsl(calc(var(--card-hue, 220) + 30deg), 75%, 70%) 50%, transparent 100%);
    border-radius: 0 18px 0 100%;
    opacity: 0.8;
    transition: all 0.4s ease;
    z-index: 0;
    clip-path: polygon(30% 0%, 100% 0%, 100% 70%, 0% 100%);
  }

  /* 纯白模式样式 */
  &.white-mode {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%);
    border-color: #e2e8f0;

    &::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 50%, transparent 100%);
    }

    &:hover {
      background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
      border-color: #cbd5e1;
    }
  }

  &:hover {
    transform: translateY(-12px) scale(1.05);
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.15),
      0 12px 20px -8px rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
    background: linear-gradient(145deg, #bbdefb 0%, #90caf9 50%, #64b5f6 100%);

    &::before {
      opacity: 1;
    }
  }

  /* 防止拖拽时的hover效果 */
  .is-dragging & {
    pointer-events: none;
  }

  /* 所有内容相对定位，确保在渐变背景之上 */
  > * {
    position: relative;
    z-index: 1;
  }
}

.card-icon-area {
  width: 110px;
  height: 110px;
  border: 3px solid #6366f1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%);
  margin-bottom: 16px;
  position: relative;
  overflow: visible;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  /* 让图标凸出卡片表面 */
  transform: translateZ(20px);
  /* 添加强烈的阴影效果 */
  box-shadow:
    0 15px 35px rgba(99, 102, 241, 0.15),
    0 8px 15px rgba(0, 0, 0, 0.1),
    0 3px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 100%);
    border-radius: 13px;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .menu-card:hover & {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #cbd5e1 100%);
    transform: translateZ(30px) scale(1.15) rotate(5deg);
    /* 悬停时更强的阴影效果 */
    box-shadow:
      0 25px 50px rgba(139, 92, 246, 0.25),
      0 15px 25px rgba(0, 0, 0, 0.15),
      0 8px 15px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 -1px 0 rgba(139, 92, 246, 0.1);

    &::before {
      opacity: 1;
    }

    &::after {
      opacity: 1;
    }
  }

  .iconify {
    font-size: 42px;
    color: #6366f1;
    position: relative;
    z-index: 2;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  span {
    font-size: 32px;
    font-weight: 700;
    color: #6366f1;
    position: relative;
    z-index: 2;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .menu-card:hover & .iconify,
  .menu-card:hover & span {
    color: #8b5cf6;
    transform: scale(1.1);
  }
}

.card-title {
  color: #475569;
  font-size: 15px;
  text-align: center;
  line-height: 1.4;
  font-weight: 600;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.025em;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;

  .menu-card:hover & {
    color: #6366f1;
    font-weight: 700;
    transform: translateY(-2px);
  }
}

.scroll-arrow {
  width: 56px;
  height: 56px;
  background: linear-gradient(145deg, #e1f5fe 0%, #b3e5fc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 8px 25px -5px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
    border-radius: 14px;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover {
    background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 100%);
    border-color: #6366f1;
    transform: scale(1.15);
    box-shadow:
      0 20px 40px -8px rgba(99, 102, 241, 0.4),
      0 8px 16px -4px rgba(99, 102, 241, 0.3);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(1.05);
  }

  .iconify {
    font-size: 24px;
    color: #64748b;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  &:hover .iconify {
    color: #ffffff;
    transform: scale(1.1);
  }

  /* 左箭头特殊样式 */
  &.scroll-arrow-left {
    margin-right: 8px;

    &:hover {
      transform: scale(1.15) translateX(-2px);
    }
  }

  /* 右箭头特殊样式 */
  &.scroll-arrow-right {
    margin-left: 8px;

    &:hover {
      transform: scale(1.15) translateX(2px);
    }
  }

  /* 禁用状态 */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* 子菜单弹出样式 */
.sub-menu-popup {
  position: fixed;
  transform: translate(-50%, calc(-100% - 15px));
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  padding: 20px;
  z-index: 3000;
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  pointer-events: auto;

  /* 添加连接区域，防止鼠标移动时意外触发mouseleave */
  &::before {
    content: "";
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 15px;
    background: transparent;
    pointer-events: auto;
  }

  /* 二级菜单样式 */
  &.level-2 {
    transform: translateX(0);
    animation: subMenuSlideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 添加左侧连接区域，防止鼠标移动时意外触发mouseleave */
    &::before {
      content: "";
      position: absolute;
      left: -10px;
      top: 0;
      width: 10px;
      height: 100%;
      background: transparent;
      pointer-events: auto;
    }

    &::after {
      content: "";
      position: absolute;
      left: -8px;
      top: 20px;
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 8px solid #ffffff;
    }
  }

  /* 三级菜单样式 */
  &.level-3 {
    transform: translateX(0);
    animation: subMenuSlideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 添加左侧连接区域，防止鼠标移动时意外触发mouseleave */
    &::before {
      content: "";
      position: absolute;
      left: -10px;
      top: 0;
      width: 10px;
      height: 100%;
      background: transparent;
      pointer-events: auto;
    }

    &::after {
      content: "";
      position: absolute;
      left: -8px;
      top: 20px;
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 8px solid #ffffff;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-100% - 5px));
  }
  to {
    opacity: 1;
    transform: translate(-50%, calc(-100% - 15px));
  }
}

@keyframes subMenuSlideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sub-menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  max-width: 400px;
}

.sub-menu-card {
  position: relative;
  width: 90px;
  height: 100px;
  background: #ffffff;
  border: 2px solid #f3f4f6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 10px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.15);
    border-color: #22c55e;
    background: linear-gradient(145deg, #90caf9 0%, #64b5f6 100%);
  }
}

.sub-card-icon {
  width: 45px;
  height: 45px;
  border: 2px solid #22c55e;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
  margin-bottom: 8px;

  .iconify {
    font-size: 20px;
    color: #22c55e;
  }

  span {
    font-size: 16px;
    font-weight: 600;
    color: #22c55e;
  }
}

.sub-card-title {
  color: #374151;
  font-size: 11px;
  text-align: center;
  line-height: 1.3;
  font-weight: 600;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.025em;
}

.sub-menu-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #22c55e;
  font-weight: bold;
  transition: all 0.3s ease;

  .sub-menu-card:hover & {
    background: rgba(34, 197, 94, 0.2);
    transform: scale(1.1);
  }
}

/* 暗色主题适配 */
.dark {
  .card-navigation-container {
    background: var(--el-bg-color-page);
  }

  .menu-card {
    border-color: var(--el-border-color);

    &:hover {
      border-color: var(--el-color-primary-light-3);
    }
  }

  .sub-menu-popup {
    border-color: var(--el-border-color);
  }

  .sub-menu-card {
    border-color: var(--el-border-color);

    &:hover {
      border-color: var(--el-color-primary-light-3);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-navigation-container {
    padding: 20px;
  }

  .menu-card {
    min-width: 100px;
    width: 100px;
    height: 120px;
    padding: 10px;
  }

  .card-icon-area {
    width: 60px;
    height: 60px;

    .iconify {
      font-size: 24px;
    }

    span {
      font-size: 18px;
    }
  }

  .card-title {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .horizontal-card-wrapper {
    gap: 12px;
  }

  .card-scroll-container {
    gap: 12px;
  }

  .menu-card {
    min-width: 90px;
    width: 90px;
    height: 110px;
    padding: 8px;
  }

  .card-icon-area {
    width: 50px;
    height: 50px;

    .iconify {
      font-size: 20px;
    }

    span {
      font-size: 16px;
    }
  }

  .card-title {
    font-size: 10px;
  }

  .sub-menu-grid {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
    gap: 8px;
  }

  .sub-menu-card {
    width: 70px;
    height: 80px;
  }
}
</style>
