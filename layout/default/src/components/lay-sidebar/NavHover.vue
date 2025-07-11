<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { emitter, findRouteByPath, getParentPaths, usePermissionStoreHook } from "@repo/core";
import { useNav } from "../../hooks/useNav";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace } from "@repo/config";
import { isAllEmpty } from "@pureadmin/utils";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import LaySidebarLogo from "./components/SidebarLogo.vue";
import LaySidebarItem from "./components/SidebarItem.vue";
import LaySidebarLeftCollapse from "./components/SidebarLeftCollapse.vue";
import { localStorageProxy, useDefer, indexedDBProxy } from "@repo/utils";


const route = useRoute();
const router = useRouter();
const isShow = ref(false);
const showLogo = ref(localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`)?.showLogo ?? true);
const hoveredMenu = ref(null);
const subMenuVisible = ref(false);
const subMenuPosition = ref({ top: 0, left: 0 });
const hideTimer = ref(null);
const showTimer = ref(null);

const { device, pureApp, isCollapse, tooltipEffect, menuSelect, toggleSideBar } = useNav();

// 收藏相关数据
const favoriteMenus = ref([]);
const hoveredMenuItem = ref(null);

// 只获取一级菜单，并添加"我的收藏"菜单
const firstLevelMenus = computed(() => {
  const menus = usePermissionStoreHook().wholeMenus.filter(menu => menu.meta?.showLink !== false);

  // 添加"我的收藏"菜单
  const favoritesMenu = {
    path: '/favorites',
    meta: {
      title: '我的收藏',
      icon: 'ep:star-filled',
      showLink: true
    },
    children: favoriteMenus.value
  };

  return [favoritesMenu, ...menus];
});

// 当前悬停菜单的子菜单
const currentSubMenus = computed(() => {
  return hoveredMenu.value?.children || [];
});

// 计算菜单项总数，用于动态调整容器宽度
const totalMenuItems = computed(() => {
  if (hoveredMenu.value?.path === '/favorites') {
    return favoriteMenus.value.length;
  }

  let count = 0;
  currentSubMenus.value.forEach(subMenu => {
    if (subMenu.children && subMenu.children.length > 0) {
      count += subMenu.children.length;
    } else {
      count += 1;
    }
  });
  return count;
});

// 计算直接二级菜单数量
const directMenuCount = computed(() => {
  return currentSubMenus.value.filter(menu => !menu.children || menu.children.length === 0).length;
});

// 动态计算容器宽度 - 横向多列布局
const dynamicContainerWidth = computed(() => {
  const itemCount = totalMenuItems.value;
  if (itemCount === 0) return '320px';

  // 根据列数计算最优宽度
  const columnsNeeded = getGridColumns(itemCount);
  const baseWidth = 180; // 每列基础宽度（增加以适应横向布局）
  const padding = 32; // 容器内边距
  const gap = 16; // 列间距（增加以改善可读性）

  const calculatedWidth = columnsNeeded * baseWidth + (columnsNeeded - 1) * gap + padding;

  // 设置合理的最小和最大宽度
  const minWidth = 320; // 最小宽度（单列时）
  const maxWidth = 800; // 最大宽度（四列时）

  return `${Math.min(maxWidth, Math.max(minWidth, calculatedWidth))}px`;
});

// 计算网格列数 - 基于分组数量的横向布局
// 布局策略：每个分组作为一列，最多四列
const getGridColumns = (itemCount: number) => {
  // 计算分组数量
  const groupCount = currentSubMenus.value.filter(menu => menu.children && menu.children.length > 0).length;
  const directMenuCount = currentSubMenus.value.filter(menu => !menu.children || menu.children.length === 0).length;

  // 总列数 = 分组数 + (有直接菜单项时+1)
  let totalColumns = groupCount;
  if (directMenuCount > 0) {
    totalColumns += 1;
  }

  // 最多4列
  return Math.min(totalColumns, 4);
};

// 判断是否只有一列菜单（需要直接导航而不显示浮动框）
const isSingleColumn = computed(() => {
  if (!hoveredMenu.value || !hoveredMenu.value.children) return false;

  // 暂时完全禁用单列直接导航功能，确保所有菜单都能正常显示浮动框
  // 后续可以根据需要重新启用特定场景的直接导航
  return false;
});

// 获取第一个可导航的菜单路径
const getFirstNavigablePath = (menu: any): string | null => {
  if (!menu.children || menu.children.length === 0) {
    return menu.path;
  }

  // 优先查找直接的二级菜单项
  for (const child of menu.children) {
    if (!child.children || child.children.length === 0) {
      // 直接的二级菜单项
      return child.path;
    }
  }

  // 如果没有直接的二级菜单项，查找第一个三级菜单项
  for (const child of menu.children) {
    if (child.children && child.children.length > 0) {
      // 如果子菜单还有子项，取第一个子项
      const firstGrandChild = child.children[0];
      if (firstGrandChild) {
        return firstGrandChild.path;
      }
    }
  }

  return null;
};

// 计算每列的菜单项数量 - 确保纵向优先填充
const getItemsPerColumn = (itemCount: number) => {
  const columns = getGridColumns(itemCount);
  return Math.ceil(itemCount / columns);
};

const loading = computed(() => firstLevelMenus.value.length === 0);

const defaultActive = computed(() => (!isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path));

// 清除定时器
function clearTimers() {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }
  if (showTimer.value) {
    clearTimeout(showTimer.value);
    showTimer.value = null;
  }
}

// 处理菜单悬停
function handleMenuHover(menu: any, event: MouseEvent) {
  clearTimers();

  if (!menu.children || menu.children.length === 0) {
    hideSubMenuDelayed();
    return;
  }

  hoveredMenu.value = menu;

  // 检查是否只有一列，如果是则不显示浮动框
  if (isSingleColumn.value) {
    hideSubMenuDelayed();
    return;
  }

  // 计算子菜单位置
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  subMenuPosition.value = {
    top: rect.top,
    left: rect.right + 5 // 增加5px间距，避免鼠标移动时的空隙
  };

  // 立即显示子菜单
  subMenuVisible.value = true;
}

// 处理菜单离开
function handleMenuLeave() {
  // 延迟隐藏，给用户时间移动到子菜单
  hideSubMenuDelayed();
}

// 延迟隐藏子菜单
function hideSubMenuDelayed() {
  clearTimers();
  hideTimer.value = setTimeout(() => {
    subMenuVisible.value = false;
    hoveredMenu.value = null;
  }, 150); // 150ms延迟
}

// 立即隐藏子菜单
function hideSubMenu() {
  clearTimers();
  subMenuVisible.value = false;
  hoveredMenu.value = null;
}

// 处理子菜单悬停
function handleSubMenuHover() {
  // 清除隐藏定时器，保持子菜单显示
  clearTimers();
}

// 处理子菜单离开
function handleSubMenuLeave() {
  hideSubMenuDelayed();
}

// 检查菜单是否激活
function isMenuActive(menu: any): boolean {
  if (!menu.children || menu.children.length === 0) {
    return defaultActive.value === menu.path;
  }
  
  // 检查子菜单是否有激活项
  return menu.children.some((child: any) => {
    if (child.children && child.children.length > 0) {
      return child.children.some((grandChild: any) => defaultActive.value.startsWith(grandChild.path));
    }
    return defaultActive.value.startsWith(child.path);
  });
}

// 删除不再使用的函数

// 收藏功能相关方法
async function loadFavorites() {
  try {
    const favorites = await indexedDBProxy().getItem('favoriteMenus');
    favoriteMenus.value = Array.isArray(favorites) ? favorites : [];
  } catch (error) {
    console.error('加载收藏菜单失败:', error);
    favoriteMenus.value = [];
  }
}

async function saveFavorites() {
  try {
    await indexedDBProxy().setItem('favoriteMenus', favoriteMenus.value);
  } catch (error) {
    console.error('保存收藏菜单失败:', error);
  }
}

function isMenuFavorited(menu: any): boolean {
  return favoriteMenus.value.some(fav => fav.path === menu.path);
}

async function toggleFavorite(menu: any, event?: Event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const isFavorited = isMenuFavorited(menu);

  if (isFavorited) {
    // 移除收藏
    favoriteMenus.value = favoriteMenus.value.filter(fav => fav.path !== menu.path);
  } else {
    // 添加收藏
    const favoriteItem = {
      path: menu.path,
      title: menu.meta?.title || menu.name,
      icon: menu.meta?.icon,
      addTime: new Date().toISOString()
    };
    favoriteMenus.value.push(favoriteItem);
  }

  await saveFavorites();
}

// 处理菜单项悬停（用于显示收藏按钮）
function handleMenuItemHover(menu: any) {
  hoveredMenuItem.value = menu;
}

function handleMenuItemLeave() {
  hoveredMenuItem.value = null;
}

// 格式化添加时间
function formatAddTime(timeStr: string): string {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString();
}

// 处理菜单点击
function handleMenuClick(menu: any) {
  // 如果没有子菜单，直接导航
  if (!menu.children || menu.children.length === 0) {
    router.push(menu.path);
    return;
  }

  // 如果是收藏菜单且为空，不做任何操作
  if (menu.path === '/favorites' && favoriteMenus.value.length === 0) {
    return;
  }

  // 设置悬停菜单以便计算列数
  hoveredMenu.value = menu;

  // 如果只有一列，直接导航到第一个可用路径
  if (isSingleColumn.value) {
    const firstPath = getFirstNavigablePath(menu);
    if (firstPath) {
      router.push(firstPath);
    }
  }
  // 如果有多列，则通过悬停显示浮动框（已在 handleMenuHover 中处理）
}

watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    if (route.path.includes("/redirect")) return;
    menuSelect(route.path);
  },
  {
    deep: true,
    immediate: true,
  }
);

onMounted(async () => {
  emitter.on("logoChange", (key) => {
    showLogo.value = key;
  });

  // 加载收藏菜单
  await loadFavorites();
});

onBeforeUnmount(() => {
  emitter.off("logoChange");
  clearTimers(); // 清理定时器
});

const defer = useDefer(firstLevelMenus.value.length);
</script>

<template>
  <div 
    v-loading="loading" 
    :class="['sidebar-hover-container', showLogo ? 'has-logo' : 'no-logo']"
    @mouseenter.prevent="isShow = true" 
    @mouseleave.prevent="isShow = false"
  >
    <LaySidebarLogo v-if="showLogo" :collapse="false" />
    
    <el-scrollbar wrap-class="scrollbar-wrapper" :class="[device === 'mobile' ? 'mobile' : 'pc']">
      <div class="hover-menu-container">
        <!-- 一级菜单 -->
        <div
          v-for="(menu, index) in firstLevelMenus"
          :key="menu.path"
          class="first-level-menu-item"
          :class="{ 'is-active': isMenuActive(menu) }"
          @mouseenter="handleMenuHover(menu, $event)"
          @mouseleave="handleMenuLeave"
          @click="handleMenuClick(menu)"
        >
          <div class="menu-content">
            <IconifyIconOnline v-if="menu.meta?.icon" :icon="menu.meta.icon" class="menu-icon" />
            <span class="menu-title">{{ menu.meta?.title }}</span>
            <!-- 移除箭头图标，保持简洁 -->
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <!-- 子菜单弹出层 -->
    <Teleport to="body">
      <div 
        v-if="subMenuVisible && currentSubMenus.length > 0"
        class="sub-menu-popup"
        :style="{
          top: subMenuPosition.top + 'px',
          left: subMenuPosition.left + 'px'
        }"
        @mouseenter="handleSubMenuHover"
        @mouseleave="handleSubMenuLeave"
      >
        <div class="sub-menu-container" :style="{ width: dynamicContainerWidth }">
          <!-- 去掉标题头部 -->
          <div class="sub-menu-content">
            <!-- 我的收藏特殊处理 -->
            <div v-if="hoveredMenu?.path === '/favorites'" class="favorites-content">
              <div v-if="favoriteMenus.length === 0" class="empty-favorites">
                <IconifyIconOnline icon="ep:star" class="empty-icon" />
                <p>暂无收藏菜单</p>
                <span>鼠标悬停在菜单项上点击星标即可收藏</span>
              </div>
              <div v-else class="favorite-items dynamic-grid" :style="{
                gridTemplateColumns: `repeat(${getGridColumns(favoriteMenus.length)}, 1fr)`,
                gridTemplateRows: `repeat(${getItemsPerColumn(favoriteMenus.length)}, auto)`
              }">
                <div
                  v-for="favorite in favoriteMenus"
                  :key="favorite.path"
                  class="menu-item-wrapper"
                  @mouseenter="handleMenuItemHover(favorite)"
                  @mouseleave="handleMenuItemLeave"
                >
                  <router-link
                    :to="favorite.path"
                    class="favorite-menu-item"
                    @click="hideSubMenu"
                  >
                    <IconifyIconOnline v-if="favorite.icon" :icon="favorite.icon" class="favorite-menu-icon" />
                    <span>{{ favorite.title }}</span>
                    <span class="add-time">{{ formatAddTime(favorite.addTime) }}</span>
                  </router-link>
                  <!-- 取消收藏按钮 -->
                  <button
                    v-if="hoveredMenuItem?.path === favorite.path"
                    class="favorite-btn remove-favorite"
                    @click="toggleFavorite(favorite, $event)"
                    title="取消收藏"
                  >
                    <IconifyIconOnline icon="ep:delete" class="favorite-icon" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 普通菜单内容 - 横向多列布局 -->
            <div v-else class="horizontal-menu-container">
              <!-- 横向多列布局 -->
              <div class="horizontal-columns-grid" :style="{
                gridTemplateColumns: `repeat(${getGridColumns(totalMenuItems)}, 1fr)`
              }">
                <!-- 有分组的菜单列 -->
                <template v-for="subMenu in currentSubMenus" :key="subMenu.path">
                  <div v-if="subMenu.children && subMenu.children.length > 0" class="menu-column">
                    <div class="column-title">{{ subMenu.meta?.title }}</div>
                    <div class="column-items">
                      <div
                        v-for="thirdMenu in subMenu.children"
                        :key="thirdMenu.path"
                        class="menu-item-wrapper"
                        @mouseenter="handleMenuItemHover(thirdMenu)"
                        @mouseleave="handleMenuItemLeave"
                      >
                        <router-link
                          :to="thirdMenu.path"
                          class="menu-item"
                          :class="{ 'is-active': defaultActive === thirdMenu.path }"
                          @click="hideSubMenu"
                        >
                          {{ thirdMenu.meta?.title }}
                        </router-link>
                        <!-- 收藏按钮 -->
                        <button
                          v-if="hoveredMenuItem?.path === thirdMenu.path"
                          class="favorite-btn"
                          :class="{ 'is-favorited': isMenuFavorited(thirdMenu) }"
                          @click="toggleFavorite(thirdMenu, $event)"
                          :title="isMenuFavorited(thirdMenu) ? '取消收藏' : '添加收藏'"
                        >
                          <IconifyIconOnline
                            :icon="isMenuFavorited(thirdMenu) ? 'ep:star-filled' : 'ep:star'"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 直接的二级菜单项作为单独列 -->
                <div v-if="currentSubMenus.some(menu => !menu.children || menu.children.length === 0)" class="menu-column">
                  <div class="column-title">其他功能</div>
                  <div class="column-items">
                    <template v-for="subMenu in currentSubMenus" :key="subMenu.path">
                      <div
                        v-if="!subMenu.children || subMenu.children.length === 0"
                        class="menu-item-wrapper"
                        @mouseenter="handleMenuItemHover(subMenu)"
                        @mouseleave="handleMenuItemLeave"
                      >
                        <router-link
                          :to="subMenu.path"
                          class="menu-item"
                          :class="{ 'is-active': defaultActive === subMenu.path }"
                          @click="hideSubMenu"
                        >
                          {{ subMenu.meta?.title }}
                        </router-link>
                        <!-- 收藏按钮 -->
                        <button
                          v-if="hoveredMenuItem?.path === subMenu.path"
                          class="favorite-btn"
                          :class="{ 'is-favorited': isMenuFavorited(subMenu) }"
                          @click="toggleFavorite(subMenu, $event)"
                          :title="isMenuFavorited(subMenu) ? '取消收藏' : '添加收藏'"
                        >
                          <IconifyIconOnline
                            :icon="isMenuFavorited(subMenu) ? 'ep:star-filled' : 'ep:star'"
                          />
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    
    <LaySidebarLeftCollapse 
      v-if="device !== 'mobile'" 
      :is-active="pureApp.sidebar.opened" 
      @toggleClick="toggleSideBar" 
    />
  </div>
</template>

<style lang="scss" scoped>
.sidebar-hover-container {
  position: relative;
  height: 100%;
  width: 200px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

  &.has-logo {
    .scrollbar-wrapper {
      height: calc(100% - 60px);
    }
  }

  &.no-logo {
    .scrollbar-wrapper {
      height: 100%;
    }
  }

  .dark & {
    background: linear-gradient(180deg, rgba(28, 28, 35, 0.95), rgba(30, 30, 40, 0.98));
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

.hover-menu-container {
  padding: 8px;
}

.first-level-menu-item {
  height: 50px;
  margin: 4px 0;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.08);
    transform: translateX(4px);
  }

  &.is-active {
    background: var(--el-color-primary) !important;
    color: white !important;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

    .menu-content {
      color: white;

      .menu-icon {
        color: white !important;
      }
    }
  }

  .menu-content {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 16px;
    color: var(--el-text-color-primary);

    .menu-icon {
      font-size: 18px;
      margin-right: 12px;
      color: var(--el-text-color-regular);
      transition: all 0.3s;
    }

    .menu-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.sub-menu-popup {
  position: fixed;
  z-index: 9999;
  pointer-events: auto;

  /* 添加一个透明的连接区域，方便鼠标移动 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -10px;
    width: 10px;
    height: 100%;
    background: transparent;
    pointer-events: auto;
  }
}

.sub-menu-container {
  min-width: 320px;
  max-width: 900px;
  width: fit-content;
  max-height: 85vh;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
  border-radius: 16px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  backdrop-filter: blur(24px);
  position: relative;

  /* 添加光泽效果 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  }

  .dark & {
    background: linear-gradient(135deg, rgba(28, 28, 35, 0.95), rgba(30, 30, 40, 0.98));
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
}

/* 删除不再使用的标题样式 */

.sub-menu-content {
  padding: 12px; // 减少内边距
  max-height: calc(85vh - 24px); // 调整最大高度
  overflow-y: auto;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--el-color-primary-rgb), 0.2);
    border-radius: 3px;
    transition: all 0.3s;

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.4);
    }
  }
}

/* 横向多列菜单容器 */
.horizontal-menu-container {
  width: 100%;
}

/* 横向列网格布局 */
.horizontal-columns-grid {
  display: grid;
  gap: 16px; // 列间距
  width: 100%;
  align-items: start; // 顶部对齐
}

/* 菜单列样式 */
.menu-column {
  display: flex;
  flex-direction: column;
  min-width: 160px;

  .column-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
    padding: 8px 12px;
    background: rgba(var(--el-color-primary-rgb), 0.05);
    border-radius: 8px;
    border-left: 3px solid var(--el-color-primary);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 12px;
      right: 12px;
      height: 1px;
      background: linear-gradient(90deg, var(--el-color-primary), transparent);
    }
  }

  .column-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

/* 分组标题 - 优化四列布局 */
.group-title {
  font-size: 12px; // 减小字体以适应四列布局
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 6px; // 减少底部间距
  padding: 3px 6px 3px 0; // 减少内边距
  border-bottom: 2px solid var(--el-color-primary-light-7);
  position: relative;
  letter-spacing: 0.2px; // 减少字间距

  // 优化左侧装饰条
  &::before {
    content: "";
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px; // 减小宽度
    height: 12px; // 减小高度
    background: var(--el-color-primary);
    border-radius: 1px;
    opacity: 0.9;
  }

  // 悬停效果
  &:hover {
    color: var(--el-color-primary-dark-2);
    border-bottom-color: var(--el-color-primary);

    &::before {
      opacity: 1;
      height: 14px;
      background: var(--el-color-primary-dark-2);
    }
  }
}

/* 动态网格布局 - 优化四列纵向排布 */
.dynamic-grid {
  display: grid;
  gap: 6px 8px; // 优化四列布局的网格间距
  width: 100%;
  grid-auto-flow: column; /* 纵向排布：先填满第一列，再填第二列，然后第三列，最后第四列 */
  align-items: start; /* 顶部对齐 */

  /* 网格列数和行数通过内联样式动态设置 */
  /* 最多4列，菜单项纵向排列，确保均匀分布 */
}

/* 保留三列网格布局类以兼容现有代码 */
.three-column-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 12px;
  width: 100%;
}

/* 菜单项包装器 - 横向布局 */
.menu-item-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  &:hover {
    .favorite-btn {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }

    .menu-item {
      padding-right: 36px; // 为收藏按钮留出空间
    }
  }
}

/* 横向布局菜单项样式 */
.menu-item {
  display: block;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  width: 100%;
  min-height: 36px;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  background: var(--el-bg-color);
  word-break: break-word;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary-dark-2);
    font-weight: 500;
    transform: translateY(-1px);
    border-color: var(--el-color-primary-light-6);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
  }

  &.is-active {
    background: var(--el-color-primary);
    color: var(--el-color-white);
    font-weight: 600;
    box-shadow: 0 3px 12px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

/* 收藏按钮 - 横向布局 */
.favorite-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%) scale(0.8);
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  z-index: 10;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.2);
    transform: translateY(-50%) scale(1.1);
  }

  &.is-favorited {
    background: rgba(var(--el-color-warning-rgb), 0.1);

    svg {
      color: var(--el-color-warning);
    }

    &:hover {
      background: rgba(var(--el-color-warning-rgb), 0.2);
    }
  }

  svg {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    transition: all 0.2s ease;
  }
}

/* 收藏相关样式 */
.favorites-content {
  .empty-favorites {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--el-text-color-secondary);

    .empty-icon {
      font-size: 48px;
      color: var(--el-color-info-light-5);
      margin-bottom: 16px;
    }

    p {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: var(--el-text-color-regular);
    }

    span {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      line-height: 1.4;
    }
  }

  .favorite-items {
    .favorite-menu-item {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--el-text-color-regular);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 13px;
      position: relative;
      border: 1px solid transparent;
      width: 100%;
      min-height: 44px;
      background: linear-gradient(135deg, var(--el-bg-color), rgba(var(--el-color-warning-rgb), 0.02));

      &:hover {
        background: linear-gradient(135deg, var(--el-color-warning-light-9), var(--el-color-warning-light-8));
        color: var(--el-color-warning-dark-2);
        transform: translateY(-2px);
        border-color: var(--el-color-warning-light-7);
        box-shadow:
          0 4px 12px rgba(var(--el-color-warning-rgb), 0.15),
          0 2px 6px rgba(var(--el-color-warning-rgb), 0.1);
      }

      .favorite-menu-icon {
        font-size: 14px;
        margin-right: 8px;
        color: var(--el-color-warning);
        padding: 2px;
        border-radius: 3px;
        background: rgba(var(--el-color-warning-rgb), 0.1);
        transition: all 0.3s;
      }

      span:first-of-type {
        flex: 1;
        font-weight: 500;
      }

      .add-time {
        font-size: 10px;
        color: var(--el-text-color-placeholder);
        margin-left: 6px;
        opacity: 0.6;
      }
    }
  }
}

.remove-favorite {
  background: rgba(var(--el-color-danger-rgb), 0.1) !important;

  .favorite-icon {
    color: var(--el-color-danger) !important;
  }

  &:hover {
    background: rgba(var(--el-color-danger-rgb), 0.2) !important;
  }
}

:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;

  &.mobile {
    .el-scrollbar__view {
      padding-bottom: 60px;
    }
  }

  .el-scrollbar__bar {
    opacity: 0.2;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
