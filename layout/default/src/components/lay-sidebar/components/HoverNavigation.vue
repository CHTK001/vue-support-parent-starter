<script setup lang="ts">
import { emitter, usePermissionStoreHook, useMultiTagsStoreHook } from "@repo/core";
import { indexedDBProxy, localStorageProxy, useDefer } from "@repo/utils";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace, getConfig } from "@repo/config";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNav } from "../../../hooks/useNav";
import { useLayout } from "../../../hooks/useLayout";
import type { MenuItem } from "../../../types/menu";
import LaySidebarLeftCollapse from "./SidebarLeftCollapse.vue";
import LaySidebarLogo from "./SidebarLogo.vue";
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";

// Props
interface Props {
  showLogo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
});

// Emits
interface Emits {
  menuClick: [menu: MenuItem];
  favoriteToggle: [menu: MenuItem, isFavorited: boolean];
}

const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();
const isShow = ref(false);
const hoveredMenu = ref(null);
const subMenuVisible = ref(false);
const subMenuPosition = ref({ top: 0, left: 0 });
const hideTimer = ref(null);
const showTimer = ref(null);

const {
  device,
  pureApp,
  isCollapse,
  tooltipEffect,
  menuSelect,
  toggleSideBar,
  layout,
} = useNav();

// 提取 permissionStore 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

// 悬浮导航的收缩状态
const isHoverCollapsed = ref(false);

const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || 'bounce');

// 悬浮导航专用的切换函数
function toggleHoverSideBar() {
  // 在悬浮导航模式下，收缩按钮控制导航的收缩状态
  // 收缩时只显示图标，展开时显示完整菜单
  isHoverCollapsed.value = !isHoverCollapsed.value;

  // 通过CSS变量通知全局布局状态变化
  document.documentElement.style.setProperty(
    "--hover-sidebar-width",
    isHoverCollapsed.value ? "64px" : "200px"
  );
}

// 收藏相关数据
const favoriteMenus = ref([]);
const hoveredMenuItem = ref(null);
const { layoutTheme } = useLayout();

// 判断是否是万圣节主题
const isHalloween = computed(() => {
  return layoutTheme.value.theme === "halloween";
});

// 只获取一级菜单，并添加"我的收藏"菜单
const firstLevelMenus = computed(() => {
  const menus = permissionStore.wholeMenus.filter(
    (menu) => menu.meta?.showLink !== false
  );

  // 添加"我的收藏"菜单
  const favoritesMenu = {
    path: "/favorites",
    meta: {
      title: "我的收藏",
      icon: isHalloween.value ? "🎃" : "ep:star-filled",
      showLink: true,
    },
    children: favoriteMenus.value,
  };

  return [favoritesMenu, ...menus];
});

// 当前悬停菜单的子菜单
const currentSubMenus = computed(() => {
  return hoveredMenu.value?.children || [];
});

// 计算菜单项总数，用于动态调整容器宽度
const totalMenuItems = computed(() => {
  if (hoveredMenu.value?.path === "/favorites") {
    return favoriteMenus.value.length;
  }

  let count = 0;
  currentSubMenus.value.forEach((subMenu) => {
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
  return currentSubMenus.value.filter(
    (menu) => !menu.children || menu.children.length === 0
  ).length;
});

// 计算每个分组的菜单项数量
const groupItemCounts = computed(() => {
  return currentSubMenus.value.map((menu) => ({
    menu,
    count: menu.children?.length || 1,
    hasChildren: menu.children && menu.children.length > 0,
  }));
});

// 智能布局算法：计算分组布局方式
const layoutStrategy = computed(() => {
  const groups = groupItemCounts.value;
  const totalItems = totalMenuItems.value;
  
  // 如果总数少于等于12个，使用纯横向布局
  if (totalItems <= 12) {
    return { type: 'horizontal', verticalGroups: [], horizontalGroups: groups };
  }
  
  // 如果总数超过30个，使用纯纵向布局
  if (totalItems > 30) {
    return { type: 'vertical', verticalGroups: groups, horizontalGroups: [] };
  }
  
  // 混合布局算法：小分组纵向，大分组横向
  const avgCount = totalItems / groups.length;
  const verticalGroups = [];
  const horizontalGroups = [];
  
  // 按菜单项数量排序
  const sortedGroups = [...groups].sort((a, b) => a.count - b.count);
  
  // 计算纵向分组的总数和横向分组的总数
  let verticalTotal = 0;
  
  for (const group of sortedGroups) {
    // 如果当前分组菜单项数量小于平均值的一半，或纵向组总数不超过横向组最大项
    // 或者分组菜单项数量小于等于5
    if (group.count <= 5 || group.count < avgCount * 0.6) {
      verticalGroups.push(group);
      verticalTotal += group.count;
    } else {
      horizontalGroups.push(group);
    }
  }
  
  // 如果没有横向分组，取最大的一个作为横向
  if (horizontalGroups.length === 0 && verticalGroups.length > 1) {
    const largest = verticalGroups.pop();
    horizontalGroups.push(largest);
  }
  
  // 按原始顺序恢复
  const originalOrder = groups.map(g => g.menu.path);
  verticalGroups.sort((a, b) => originalOrder.indexOf(a.menu.path) - originalOrder.indexOf(b.menu.path));
  horizontalGroups.sort((a, b) => originalOrder.indexOf(a.menu.path) - originalOrder.indexOf(b.menu.path));
  
  if (verticalGroups.length > 0 && horizontalGroups.length > 0) {
    return { type: 'mixed', verticalGroups, horizontalGroups };
  }
  
  return { type: 'horizontal', verticalGroups: [], horizontalGroups: groups };
});

// 判断是否应该使用纵向布局（当菜单项过多时）
const shouldUseVerticalLayout = computed(() => {
  return layoutStrategy.value.type === 'vertical';
});

// 是否使用混合布局
const shouldUseMixedLayout = computed(() => {
  return layoutStrategy.value.type === 'mixed';
});

// 动态计算容器宽度 - 根据布局模式调整
const dynamicContainerWidth = computed(() => {
  const itemCount = totalMenuItems.value;
  if (itemCount === 0) return "320px";

  // 纵向布局时使用固定宽度
  if (shouldUseVerticalLayout.value) {
    return "360px";
  }
  
  // 混合布局时计算宽度
  if (shouldUseMixedLayout.value) {
    const strategy = layoutStrategy.value;
    // 纵向分组占一列，横向分组每个占一列
    const columns = 1 + strategy.horizontalGroups.length;
    const baseWidth = 180;
    const padding = 32;
    const gap = 16;
    const calculatedWidth = columns * baseWidth + (columns - 1) * gap + padding;
    return `${Math.min(900, Math.max(400, calculatedWidth))}px`;
  }

  // 根据列数计算最优宽度
  const columnsNeeded = getGridColumns(itemCount);
  const baseWidth = 180; // 每列基础宽度（增加以适应横向布局）
  const padding = 32; // 容器内边距
  const gap = 16; // 列间距（增加以改善可读性）

  const calculatedWidth =
    columnsNeeded * baseWidth + (columnsNeeded - 1) * gap + padding;

  // 设置合理的最小和最大宽度
  const minWidth = 320; // 最小宽度（单列时）
  const maxWidth = 800; // 最大宽度（四列时）

  return `${Math.min(maxWidth, Math.max(minWidth, calculatedWidth))}px`;
});

// 计算网格列数 - 基于分组数量的横向布局
// 布局策略：每个分组作为一列，最多四列
const getGridColumns = (itemCount: number) => {
  // 计算分组数量
  const groupCount = currentSubMenus.value.filter(
    (menu) => menu.children && menu.children.length > 0
  ).length;
  const directMenuCount = currentSubMenus.value.filter(
    (menu) => !menu.children || menu.children.length === 0
  ).length;

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
const getFirstNavigablePath = (menu: MenuItem): string | null => {
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

// 清理定时器
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
function handleMenuHover(menu: MenuItem, event: MouseEvent) {
  clearTimers();

  // 如果是收藏菜单且为空，不显示浮动框
  if (menu.path === "/favorites" && favoriteMenus.value.length === 0) {
    return;
  }

  // 如果没有子菜单，不显示浮动框
  if (!menu.children || menu.children.length === 0) {
    return;
  }

  hoveredMenu.value = menu;

  // 在setTimeout之前获取rect，避免异步回调中event.currentTarget为null
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  showTimer.value = setTimeout(() => {
    // 计算子菜单的预估高度（根据子菜单项数量估算）
    const estimatedHeight = Math.min(500, menu.children.length * 50 + 100);
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // 计算最佳的 top 位置
    let top = rect.top;
    // 如果子菜单会超出屏幕底部，向上调整位置
    if (top + estimatedHeight > viewportHeight - 20) {
      top = Math.max(20, viewportHeight - estimatedHeight - 20);
    }

    // 计算 left 位置，确保不超出右边界
    let left = rect.right + 10;
    const estimatedWidth = 400; // 子菜单预估宽度
    if (left + estimatedWidth > viewportWidth - 20) {
      // 如果右侧空间不够，显示在左侧
      left = rect.left - estimatedWidth - 10;
    }

    subMenuPosition.value = {
      top: top,
      left: left,
    };
    subMenuVisible.value = true;
  }, 150);
}

// 处理菜单离开
function handleMenuLeave() {
  clearTimers();
  hideTimer.value = setTimeout(() => {
    subMenuVisible.value = false;
    hoveredMenu.value = null;
  }, 200);
}

// 处理子菜单悬停
function handleSubMenuHover() {
  clearTimers();
}

// 处理子菜单离开
function handleSubMenuLeave() {
  clearTimers();
  hideTimer.value = setTimeout(() => {
    subMenuVisible.value = false;
    hoveredMenu.value = null;
  }, 200);
}

// 隐藏子菜单
function hideSubMenu() {
  subMenuVisible.value = false;
  hoveredMenu.value = null;
}

// 判断菜单是否激活
function isMenuActive(menu: MenuItem): boolean {
  if (menu.path === route.path) return true;

  // 检查子菜单是否有激活的
  if (menu.children) {
    return menu.children.some((child: MenuItem) => {
      if (child.path === route.path) return true;
      if (child.children) {
        return child.children.some(
          (grandChild: MenuItem) => grandChild.path === route.path
        );
      }
      return false;
    });
  }

  return false;
}

// 默认激活菜单
const defaultActive = computed(() => route.path);

// 收藏功能
async function loadFavorites() {
  try {
    const stored = await indexedDBProxy().getItem("favoriteMenus");
    if (stored) {
      favoriteMenus.value = stored as typeof favoriteMenus.value;
    }
  } catch (error) {
    console.warn("加载收藏菜单失败:", error);
  }
}

async function saveFavorites() {
  try {
    await indexedDBProxy().setItem("favoriteMenus", favoriteMenus.value);
  } catch (error) {
    console.warn("保存收藏菜单失败:", error);
  }
}

function isMenuFavorited(menu: MenuItem): boolean {
  return favoriteMenus.value.some((fav) => fav.path === menu.path);
}

async function toggleFavorite(menu: MenuItem, event?: Event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const isFavorited = isMenuFavorited(menu);

  if (isFavorited) {
    // 取消收藏
    favoriteMenus.value = favoriteMenus.value.filter(
      (fav) => fav.path !== menu.path
    );
  } else {
    // 添加收藏
    const favoriteItem = {
      path: menu.path,
      title: menu.meta?.title || menu.name,
      icon: menu.meta?.icon,
      addTime: new Date().toISOString(),
    };
    favoriteMenus.value.push(favoriteItem);
  }

  await saveFavorites();

  // 触发收藏切换事件
  emit("favoriteToggle", menu, !isFavorited);
}

// 处理菜单项悬停（用于显示收藏按钮）
async function handleMenuItemHover(menu: MenuItem) {
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

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString();
}

// 处理子菜单点击
function handleSubMenuClick(menu: MenuItem, event?: Event) {
  // 阻止默认的router-link导航行为
  if (event) {
    event.preventDefault();
  }

  // 隐藏子菜单
  hideSubMenu();

  // 检查是否为remaining菜单项
  if (menu.meta?.remaining === true) {
    // 检查是否在当前页面打开
    if (menu.meta?.remainingSelf === true) {
      // 在当前页面打开，跳转到remaining组件页面
      const componentPath = convertPathToComponentParam(menu.path);
      router.push(`/remaining-component/${componentPath}`);
    } else {
      // 默认行为：在新标签页打开remaining组件页面
      const componentPath = convertPathToComponentParam(menu.path);
      const fullUrl = `${window.location.origin}/#/remaining-component/${componentPath}`;
      window.open(fullUrl, "_blank");
    }
  } else {
    // 直接跳转路由，由路由守卫统一处理 tag 添加
    router.push(menu.path);
  }
}

// 将路径转换为组件路径参数
function convertPathToComponentParam(path: string): string {
  // 移除开头的斜杠并将路径转换为组件参数
  const cleanPath = path.replace(/^\//, "");
  return cleanPath.replace(/\//g, "-");
}

// 处理菜单点击
function handleMenuClick(menu: MenuItem) {
  // 触发菜单点击事件
  emit("menuClick", menu);

  // 收缩状态下，直接导航到第一个可用路径
  if (isHoverCollapsed.value) {
    if (!menu.children || menu.children.length === 0) {
      // 检查是否为remaining菜单项
      if (menu.meta?.remaining === true) {
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}${menu.path}`;
        window.open(fullUrl, "_blank");
      } else {
        router.push(menu.path);
      }
    } else {
      const firstPath = getFirstNavigablePath(menu);
      if (firstPath) {
        router.push(firstPath);
      }
    }
    return;
  }

  // 如果是收藏菜单且为空，不做任何操作
  if (menu.path === "/favorites" && favoriteMenus.value.length === 0) {
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

// 监听路由变化 - 分离监听以避免不必要的 deep watcher
watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/redirect")) return;
    menuSelect(newPath);
  },
  { immediate: true }
);

onMounted(async () => {
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

  // 加载收藏菜单
  await loadFavorites();

  // 初始化CSS变量
  document.documentElement.style.setProperty("--hover-sidebar-width", "200px");
});

onBeforeUnmount(() => {
  clearTimers(); // 清理定时器
});

const defer = useDefer(firstLevelMenus.value.length);
</script>

<template>
  <!-- 悬浮导航模式 -->
  <div
    :class="[
      'sidebar-hover-container',
      props.showLogo ? 'has-logo' : 'no-logo',
      isHoverCollapsed ? 'collapsed' : 'expanded',
    ]"
    @mouseenter.prevent="isShow = true"
    @mouseleave.prevent="isShow = false"
  >
    <LaySidebarLogo v-if="props.showLogo" :collapse="isHoverCollapsed" />

    <el-scrollbar
      wrap-class="scrollbar-wrapper"
      :class="[device === 'mobile' ? 'mobile' : 'pc']"
    >
      <div class="hover-menu-container">
        <!-- 一级菜单 -->
        <div
          v-for="(menu, index) in firstLevelMenus"
          :key="menu.path"
          class="first-level-menu-item"
          :class="{ 'is-active': isMenuActive(menu), 'menu-animation': menuAnimation }"
          @mouseenter="handleMenuHover(menu, $event)"
          @mouseleave="handleMenuLeave"
          @click="handleMenuClick(menu)"
        >
          <div class="menu-content">
            <IconifyIconOnline
              v-if="menu.meta?.icon"
              :icon="menu.meta.icon"
              class="menu-icon"
            />
            <IconifyIconOnline v-else icon="ep:menu" class="menu-icon" />
            <span v-if="!isHoverCollapsed" class="menu-title">{{
              menu.meta?.title
            }}</span>
            <ReMenuNewBadge
              v-if="showNewMenu && !isHoverCollapsed"
              :createTime="menu.meta?.createTime"
              :type="menu.meta?.badgeType || 'primary'"
              :customText="menu.meta?.badgeText"
              :forceShow="forceNewMenu || menu.meta?.permanentNew"
              :animation="newMenuAnimation"
            />
            <!-- 收缩状态下只显示图标 -->
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
          left: subMenuPosition.left + 'px',
        }"
        @mouseenter="handleSubMenuHover"
        @mouseleave="handleSubMenuLeave"
      >
        <div
          class="sub-menu-container"
          :style="{ width: dynamicContainerWidth }"
        >
          <!-- 去掉标题头部 -->
          <div class="sub-menu-content">
            <!-- 我的收藏特殊处理 -->
            <div
              v-if="hoveredMenu?.path === '/favorites'"
              class="favorites-content"
            >
              <div v-if="favoriteMenus.length === 0" class="empty-favorites">
                <IconifyIconOnline icon="ep:star" class="empty-icon" />
                <p>暂无收藏菜单</p>
                <span>鼠标悬停在菜单项上点击星标即可收藏</span>
              </div>
              <div
                v-else
                class="favorite-items dynamic-grid"
                :style="{
                  gridTemplateColumns: `repeat(${getGridColumns(favoriteMenus.length)}, 1fr)`,
                  gridTemplateRows: `repeat(${getItemsPerColumn(favoriteMenus.length)}, auto)`,
                }"
              >
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
                    @click="handleSubMenuClick(favorite, $event)"
                  >
                    <IconifyIconOnline
                      v-if="favorite.icon"
                      :icon="favorite.icon"
                      class="favorite-menu-icon"
                    />
                    <span>{{ favorite.title }}</span>
                    <span class="add-time">{{
                      formatAddTime(favorite.addTime)
                    }}</span>
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

            <!-- 普通菜单内容 - 根据菜单数量自动选择布局 -->
            <div v-else class="horizontal-menu-container" :class="{ 'vertical-mode': shouldUseVerticalLayout, 'mixed-mode': shouldUseMixedLayout }">
              
              <!-- 混合布局：小分组纵向 + 大分组横向 -->
              <div v-if="shouldUseMixedLayout" class="mixed-layout-container">
                <!-- 纵向分组区域 -->
                <div v-if="layoutStrategy.verticalGroups.length > 0" class="vertical-section">
                  <template v-for="groupInfo in layoutStrategy.verticalGroups" :key="groupInfo.menu.path">
                    <div v-if="groupInfo.hasChildren" class="vertical-menu-group">
                      <div class="vertical-group-title">{{ groupInfo.menu.meta?.title }}</div>
                      <div class="vertical-group-items">
                        <div
                          v-for="thirdMenu in groupInfo.menu.children"
                          :key="thirdMenu.path"
                          class="menu-item-wrapper"
                          @mouseenter="handleMenuItemHover(thirdMenu)"
                          @mouseleave="handleMenuItemLeave"
                        >
                          <router-link
                            :to="thirdMenu.path"
                            class="menu-item"
                            :class="{ 'is-active': defaultActive === thirdMenu.path, 'menu-animation': menuAnimation }"
                            @click="handleSubMenuClick(thirdMenu, $event)"
                          >
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ thirdMenu.meta?.title }}</span>
                            <ReMenuNewBadge
                              v-if="showNewMenu"
                              :createTime="thirdMenu.meta?.createTime"
                              :type="thirdMenu.meta?.badgeType || 'primary'"
                              :customText="thirdMenu.meta?.badgeText"
                              :forceShow="forceNewMenu || thirdMenu.meta?.permanentNew"
                              :animation="newMenuAnimation"
                            />
                          </router-link>
                        </div>
                      </div>
                    </div>
                    <div v-else class="menu-item-wrapper">
                      <router-link
                        :to="groupInfo.menu.path"
                        class="menu-item"
                        :class="{ 'is-active': defaultActive === groupInfo.menu.path, 'menu-animation': menuAnimation }"
                        @click="handleSubMenuClick(groupInfo.menu, $event)"
                      >
                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ groupInfo.menu.meta?.title }}</span>
                        <ReMenuNewBadge
                          v-if="showNewMenu"
                          :createTime="groupInfo.menu.meta?.createTime"
                          :type="groupInfo.menu.meta?.badgeType || 'primary'"
                          :customText="groupInfo.menu.meta?.badgeText"
                          :forceShow="forceNewMenu || groupInfo.menu.meta?.permanentNew"
                          :animation="newMenuAnimation"
                        />
                      </router-link>
                    </div>
                  </template>
                </div>
                
                <!-- 横向分组区域 -->
                <div v-if="layoutStrategy.horizontalGroups.length > 0" class="horizontal-section">
                  <template v-for="groupInfo in layoutStrategy.horizontalGroups" :key="groupInfo.menu.path">
                    <div v-if="groupInfo.hasChildren" class="menu-column">
                      <div class="column-title">{{ groupInfo.menu.meta?.title }}</div>
                      <div class="column-items">
                        <div
                          v-for="thirdMenu in groupInfo.menu.children"
                          :key="thirdMenu.path"
                          class="menu-item-wrapper"
                          @mouseenter="handleMenuItemHover(thirdMenu)"
                          @mouseleave="handleMenuItemLeave"
                        >
                          <router-link
                            :to="thirdMenu.path"
                            class="menu-item"
                            :class="{ 'is-active': defaultActive === thirdMenu.path, 'menu-animation': menuAnimation }"
                            @click="handleSubMenuClick(thirdMenu, $event)"
                          >
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ thirdMenu.meta?.title }}</span>
                            <ReMenuNewBadge
                              v-if="showNewMenu"
                              :createTime="thirdMenu.meta?.createTime"
                              :type="thirdMenu.meta?.badgeType || 'primary'"
                              :customText="thirdMenu.meta?.badgeText"
                              :forceShow="forceNewMenu || thirdMenu.meta?.permanentNew"
                              :animation="newMenuAnimation"
                            />
                          </router-link>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              
              <!-- 纵向布局（菜单项过多时） -->
              <div v-else-if="shouldUseVerticalLayout" class="vertical-columns-layout">
                <template v-for="subMenu in currentSubMenus" :key="subMenu.path">
                  <!-- 有子菜单的分组 -->
                  <div v-if="subMenu.children && subMenu.children.length > 0" class="vertical-menu-group">
                    <div class="vertical-group-title">{{ subMenu.meta?.title }}</div>
                    <div class="vertical-group-items">
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
                          :class="{ 'is-active': defaultActive === thirdMenu.path, 'menu-animation': menuAnimation }"
                          @click="handleSubMenuClick(thirdMenu, $event)"
                        >
                          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ thirdMenu.meta?.title }}</span>
                          <ReMenuNewBadge
                            v-if="showNewMenu"
                            :createTime="thirdMenu.meta?.createTime"
                            :type="thirdMenu.meta?.badgeType || 'primary'"
                            :customText="thirdMenu.meta?.badgeText"
                            :forceShow="forceNewMenu || thirdMenu.meta?.permanentNew"
                            :animation="newMenuAnimation"
                          />
                        </router-link>
                        <button
                          v-if="hoveredMenuItem?.path === thirdMenu.path"
                          class="favorite-btn"
                          :class="{ 'is-favorited': isMenuFavorited(thirdMenu) }"
                          @click="toggleFavorite(thirdMenu, $event)"
                          :title="isMenuFavorited(thirdMenu) ? '取消收藏' : '添加收藏'"
                        >
                          <IconifyIconOnline :icon="isMenuFavorited(thirdMenu) ? 'ep:star-filled' : 'ep:star'" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <!-- 直接的二级菜单项 -->
                  <div v-else class="menu-item-wrapper">
                    <router-link
                      :to="subMenu.path"
                      class="menu-item"
                      :class="{ 'is-active': defaultActive === subMenu.path, 'menu-animation': menuAnimation }"
                      @click="handleSubMenuClick(subMenu, $event)"
                    >
                      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ subMenu.meta?.title }}</span>
                      <ReMenuNewBadge
                        v-if="showNewMenu"
                        :createTime="subMenu.meta?.createTime"
                        :type="subMenu.meta?.badgeType || 'primary'"
                        :customText="subMenu.meta?.badgeText"
                        :forceShow="forceNewMenu || subMenu.meta?.permanentNew"
                        :animation="newMenuAnimation"
                      />
                    </router-link>
                    <button
                      v-if="hoveredMenuItem?.path === subMenu.path"
                      class="favorite-btn"
                      :class="{ 'is-favorited': isMenuFavorited(subMenu) }"
                      @click="toggleFavorite(subMenu, $event)"
                      :title="isMenuFavorited(subMenu) ? '取消收藏' : '添加收藏'"
                    >
                      <IconifyIconOnline :icon="isMenuFavorited(subMenu) ? 'ep:star-filled' : 'ep:star'" />
                    </button>
                  </div>
                </template>
              </div>
              <!-- 横向多列布局（默认） -->
              <div
                v-else
                class="horizontal-columns-grid"
                :style="{
                  gridTemplateColumns: `repeat(${getGridColumns(totalMenuItems)}, 1fr)`,
                }"
              >
                <!-- 有分组的菜单列 -->
                <template
                  v-for="subMenu in currentSubMenus"
                  :key="subMenu.path"
                >
                  <div
                    v-if="subMenu.children && subMenu.children.length > 0"
                    class="menu-column"
                  >
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
                            :class="{
                              'is-active': defaultActive === thirdMenu.path,
                              'menu-animation': menuAnimation
                            }"
                            @click="handleSubMenuClick(thirdMenu, $event)"
                          >
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ thirdMenu.meta?.title }}</span>
                            <ReMenuNewBadge
                              v-if="showNewMenu"
                              :createTime="thirdMenu.meta?.createTime"
                              :type="thirdMenu.meta?.badgeType || 'primary'"
                              :customText="thirdMenu.meta?.badgeText"
                              :forceShow="forceNewMenu || thirdMenu.meta?.permanentNew"
                              :animation="newMenuAnimation"
                            />
                          </router-link>
                        <!-- 收藏按钮 -->
                        <button
                          v-if="hoveredMenuItem?.path === thirdMenu.path"
                          class="favorite-btn"
                          :class="{
                            'is-favorited': isMenuFavorited(thirdMenu),
                          }"
                          @click="toggleFavorite(thirdMenu, $event)"
                          :title="
                            isMenuFavorited(thirdMenu) ? '取消收藏' : '添加收藏'
                          "
                        >
                          <IconifyIconOnline
                            :icon="
                              isMenuFavorited(thirdMenu)
                                ? 'ep:star-filled'
                                : 'ep:star'
                            "
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 直接的二级菜单项作为单独列 -->
                <div
                  v-if="
                    currentSubMenus.some(
                      (menu) => !menu.children || menu.children.length === 0
                    )
                  "
                  class="menu-column"
                >
                  <div class="column-title">其他功能</div>
                  <div class="column-items">
                    <template
                      v-for="subMenu in currentSubMenus"
                      :key="subMenu.path"
                    >
                      <div
                        v-if="
                          !subMenu.children || subMenu.children.length === 0
                        "
                        class="menu-item-wrapper"
                        @mouseenter="handleMenuItemHover(subMenu)"
                        @mouseleave="handleMenuItemLeave"
                      >
                        <router-link
                          :to="subMenu.path"
                          class="menu-item"
                          :class="{
                            'is-active': defaultActive === subMenu.path,
                            'menu-animation': menuAnimation
                          }"
                          @click="handleSubMenuClick(subMenu, $event)"
                        >
                          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ subMenu.meta?.title }}</span>
                          <ReMenuNewBadge
                            v-if="showNewMenu"
                            :createTime="subMenu.meta?.createTime"
                            :type="subMenu.meta?.badgeType || 'primary'"
                            :customText="subMenu.meta?.badgeText"
                            :forceShow="forceNewMenu || subMenu.meta?.permanentNew"
                            :animation="newMenuAnimation"
                          />
                        </router-link>
                        <!-- 收藏按钮 -->
                        <button
                          v-if="hoveredMenuItem?.path === subMenu.path"
                          class="favorite-btn"
                          :class="{ 'is-favorited': isMenuFavorited(subMenu) }"
                          @click="toggleFavorite(subMenu, $event)"
                          :title="
                            isMenuFavorited(subMenu) ? '取消收藏' : '添加收藏'
                          "
                        >
                          <IconifyIconOnline
                            :icon="
                              isMenuFavorited(subMenu)
                                ? 'ep:star-filled'
                                : 'ep:star'
                            "
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

    <!-- 底部收缩按钮保持原有逻辑 -->
    <LaySidebarLeftCollapse
      :is-active="!isHoverCollapsed"
      @toggleClick="toggleHoverSideBar"
    />
  </div>
</template>

<style lang="scss" scoped>
// 菜单动画
.menu-animation {
  &.is-active .menu-content,
  &.is-active .menu-item {
    animation: menu-bounce 0.5s;
  }
}

@keyframes menu-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.sidebar-hover-container {
  position: relative;
  height: 100%;
  width: 200px;
  background: linear-gradient(
    180deg,
    var(--hover-nav-bg-start),
    var(--hover-nav-bg-end)
  );
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--hover-nav-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: visible;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;

  /* 收缩状态 */
  &.collapsed {
    width: 64px;

    .hover-menu-container {
      padding: 8px 4px;
    }

    .first-level-menu-item {
      .menu-content {
        justify-content: center;
        padding: 0 8px;

        .menu-icon {
          margin-right: 0;
        }
      }
    }
  }

  /* el-scrollbar 填充剩余空间，为底部收缩按钮预畀40px */
  :deep(.el-scrollbar) {
    flex: 1;
    min-height: 0;
    /* 底部预留收缩按钮空间 */
    margin-bottom: 40px;
  }

  &.has-logo {
    /* logo(48px) + 收缩按钮(40px) = 88px */
    :deep(.el-scrollbar) {
      height: calc(100vh - 88px);
    }
  }

  &.no-logo {
    /* 只有收缩按钮(40px) */
    :deep(.el-scrollbar) {
      height: calc(100vh - 40px);
    }
  }

  .dark & {
    background: linear-gradient(
      180deg,
      rgba(28, 28, 35, 0.95),
      rgba(30, 30, 40, 0.98)
    );
    border-right: 1px solid rgba(255, 255, 255, 0.05);
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
    transform: translateX(4px);
  }

  &.is-active {
      // 默认（亮色）：背景蓝色，文字白色
      background: var(--el-color-primary) !important;
      color: #fff !important;
      font-weight: 600;
      box-shadow: 0 3px 12px rgba(var(--el-color-primary-rgb), 0.3);

      svg,
      i,
      span {
        color: #fff !important;
      }

      // 暗色模式适配：使用定义的变量
      @at-root html.dark & {
        background: var(--hover-nav-menu-active-bg) !important;
        color: var(--hover-nav-menu-active-color) !important;
        
        svg, i, span {
          color: var(--hover-nav-menu-active-color) !important;
        }
      }
    }

  .menu-content {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 16px;
    color: var(--hover-nav-menu-color);
    /* 未选中状态 */

    .menu-icon {
      font-size: 18px;
      margin-right: 12px;
      color: var(--hover-nav-menu-color);
      /* 未选中状态 */
      transition: all 0.3s;
    }

    .menu-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }
  }

  /* 深色主题下的样式 */
  html.dark & {
    .menu-content {
      /* 未选中状态为白色，但允许主题变量覆盖 */
      color: var(--hover-nav-menu-color, #ffffff);

      .menu-icon {
        color: var(--hover-nav-menu-color, #ffffff);
      }

      .menu-title {
        color: var(--hover-nav-menu-color, #ffffff);
      }
    }
  }
}

.sub-menu-popup {
  position: fixed;
  z-index: 100; // 子菜单弹出层保持一定层级但不要太高，避免遮挡对话框
  pointer-events: auto;
  max-height: calc(100vh - 40px);

  /* 添加一个透明的连接区域，方便鼠标移动 */
  &::before {
    content: "";
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
    max-height: calc(100vh - 60px);
    background: var(--hover-nav-submenu-bg);
    border-radius: 16px;
    box-shadow:
      0 20px 40px var(--hover-nav-submenu-shadow),
      0 8px 16px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 1px solid var(--hover-nav-submenu-border);
    overflow: hidden;
    backdrop-filter: blur(24px);
    position: relative;

  /* 添加光泽效果 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.8),
      transparent
    );
  }

  .dark & {
    background: linear-gradient(
      135deg,
      rgba(28, 28, 35, 0.95),
      rgba(30, 30, 40, 0.98)
    );
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
}

.sub-menu-content {
  padding: 12px;
  max-height: calc(100vh - 100px);
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
  
  &.vertical-mode {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
  
  &.mixed-mode {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
}

/* 混合布局容器 */
.mixed-layout-container {
  display: flex;
  gap: 16px;
  
  .vertical-section {
    min-width: 160px;
    max-width: 200px;
    border-right: 1px solid var(--el-border-color-lighter);
    padding-right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    html.dark & {
      border-right-color: rgba(255, 255, 255, 0.1);
    }
  }
  
  .horizontal-section {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    align-items: start;
  }
}

/* 纵向布局容器 */
.vertical-columns-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vertical-menu-group {
  .vertical-group-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    padding: 8px 12px 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 4px;
    position: sticky;
    top: 0;
    background: var(--el-bg-color-overlay);
    z-index: 1;
    
    html.dark & {
      color: rgba(255, 255, 255, 0.6);
      background: rgba(28, 28, 35, 0.95);
    }
  }
  
  .vertical-group-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 4px;
  }
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
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
    padding: 6px 10px;
    background: transparent;
    border-radius: 0;
    border-left: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
    position: relative;

    /* 浅色风格下文字 */
    html[data-theme="light"] & {
      color: #64748b;
    }

    /* 深色模式下文字 */
    html.dark & {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .column-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

/* 动态网格布局 - 优化四列纵向排布 */
.dynamic-grid {
  display: grid;
  gap: 6px 8px; // 优化四列布局的网格间距
  width: 100%;
  grid-auto-flow: column;
  /* 纵向排布：先填满第一列，再填第二列，然后第三列，最后第四列 */
  align-items: start;
  /* 顶部对齐 */

  /* 网格列数和行数通过内联样式动态设置 */
  /* 最多4列，菜单项纵向排列，确保均匀分布 */
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
  color: var(--hover-nav-menu-color, var(--el-text-color-regular));
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
  background: var(--el-bg-color-overlay);
  word-break: break-word;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;

  /* 浅色风格下文字为黑色 */
  html[data-theme="light"] & {
    color: var(--hover-nav-menu-color, #1e293b);
  }

  /* 深色模式下文字为白色 */
  html.dark & {
    color: var(--hover-nav-menu-color, #ffffff);
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary-dark-2);
    font-weight: 500;
    transform: translateY(-1px);
    border-color: var(--el-color-primary-light-6);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);

    /* 浅色风格下悬停样式 */
    html[data-theme="light"] & {
      color: var(--el-color-primary-dark-2);
    }

    /* 深色模式下悬停样式 */
    html.dark & {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
    }
  }

  &.is-active {
    background: var(--hover-nav-menu-active-bg);
    color: var(--hover-nav-menu-active-color) !important;
    /* 强制设置为白色确保可见性 */
    font-weight: 600;
    box-shadow: 0 3px 12px rgba(var(--el-color-primary-rgb), 0.3);

    /* 浅色风格下激活样式保持白色 */
    html[data-theme="light"] & {
      color: var(--hover-nav-menu-active-color, #ffffff) !important;
      background: var(--hover-nav-menu-active-bg, var(--el-color-primary)) !important;
    }
  }
}

.is-active {
  .menu-title {
    color: #fff;
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

    /* 浅色风格下文字为黑色 */
    html[data-theme="light"] & {
      color: #64748b;
    }

    /* 深色模式下文字为白色 */
    html.dark & {
      color: rgba(255, 255, 255, 0.7);
    }

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

      /* 浅色风格下文字为黑色 */
      html[data-theme="light"] & {
        color: #1e293b;
      }

      /* 深色模式下文字为白色 */
      html.dark & {
        color: #ffffff;
      }
    }

    span {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      line-height: 1.4;

      /* 浅色风格下文字为黑色 */
      html[data-theme="light"] & {
        color: #94a3b8;
      }

      /* 深色模式下文字为白色 */
      html.dark & {
        color: rgba(255, 255, 255, 0.6);
      }
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
      background: linear-gradient(
        135deg,
        var(--el-bg-color),
        rgba(var(--el-color-warning-rgb), 0.02)
      );

      /* 浅色风格下文字为黑色 */
      html[data-theme="light"] & {
        color: #1e293b;
      }

      /* 深色模式下文字为白色 */
      html.dark & {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }

      &:hover {
        background: linear-gradient(
          135deg,
          var(--el-color-warning-light-9),
          var(--el-color-warning-light-8)
        );
        color: var(--el-color-warning-dark-2);
        transform: translateY(-2px);
        border-color: var(--el-color-warning-light-7);
        box-shadow:
          0 4px 12px rgba(var(--el-color-warning-rgb), 0.15),
          0 2px 6px rgba(var(--el-color-warning-rgb), 0.1);

        /* 浅色风格下悬停样式 */
        html[data-theme="light"] & {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.3);
        }
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

        /* 浅色风格下文字为黑色 */
        html[data-theme="light"] & {
          color: #94a3b8;
        }

        /* 深色模式下文字为白色 */
        html.dark & {
          color: rgba(255, 255, 255, 0.5);
        }
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

/* 导航栏左侧的收缩按钮 */
.sidebar-collapse-btn {
  position: absolute;
  top: 50%;
  left: -16px;
  transform: translateY(-50%);
  width: 24px;
  height: 32px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-right: none;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .sidebar-collapse-icon {
    font-size: 12px;
    color: var(--el-text-color-regular);
    transition: all 0.3s ease;
  }

  &:hover .sidebar-collapse-icon {
    color: var(--el-color-primary);
  }
}

/* 悬浮时显示的收缩按钮 */
.hover-collapse-btn {
  position: absolute;
  top: 50%;
  right: -70px;
  transform: translateY(-50%);
  height: 32px;
  background: var(--el-color-primary);
  border: none;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 4px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

  &:hover {
    background: var(--el-color-primary-dark-2);
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .collapse-icon {
    font-size: 12px;
    color: #ffffff;
    margin-right: 4px;
    transition: all 0.3s ease;
  }

  .collapse-text {
    font-size: 12px;
    color: #ffffff;
    line-height: 1;
  }
}
</style>

<style lang="scss">
@use "sass:color";

// ==================== 春节主题样式 ====================
html[data-skin="spring-festival"] {
  $spring-red: #dc143c;
  $spring-red-dark: #b22222;
  $spring-gold: #ffd700;
  $spring-gold-light: #ffa500;
  $spring-border: rgba(255, 215, 0, 0.5);

  // 悬停导航容器
  .sidebar-hover-container {
    background: linear-gradient(135deg, rgba(220, 20, 60, 0.98), rgba(178, 34, 34, 0.98)) !important;
    border-right: 3px solid $spring-border !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;

    // Logo区域
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(178, 34, 34, 0.9)) !important;
      border-bottom: 2px solid rgba(255, 215, 0, 0.4) !important;

      .sidebar-title {
        color: $spring-gold !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }

    // 一级菜单项
    .first-level-menu-item {
      color: $spring-gold !important;
      border: 1.5px solid rgba(255, 215, 0, 0.3) !important;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.7), rgba(178, 34, 34, 0.7)) !important;

      .menu-icon {
        color: $spring-gold !important;
      }

      .menu-title {
        color: $spring-gold !important;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.9), rgba(178, 34, 34, 0.9)) !important;
        border-color: rgba(255, 215, 0, 0.6) !important;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3) !important;
        transform: translateX(4px) scale(1.02);

        .menu-icon,
        .menu-title {
          color: #fff !important;
        }
      }

      &.is-active {
        background: linear-gradient(135deg, $spring-gold, $spring-gold-light) !important;
        border: 2px solid $spring-red !important;
        font-weight: 700;
        box-shadow:
          0 4px 16px rgba(255, 215, 0, 0.5),
          0 0 20px rgba(255, 215, 0, 0.3) !important;

        .menu-icon,
        .menu-title {
          color: #8b0000 !important;
        }
      }
    }

    // 折叠按钮
    .hover-collapse-btn,
    .sidebar-collapse-btn {
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.95), rgba(178, 34, 34, 0.95)) !important;
      border-top: 2px solid $spring-border !important;

      .collapse-icon,
      .sidebar-collapse-icon {
        color: $spring-gold !important;
      }

      .collapse-text {
        color: $spring-gold !important;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.95), rgba(178, 34, 34, 0.95)) !important;

        .collapse-icon,
        .sidebar-collapse-icon {
          color: #fff !important;
        }
      }
    }
  }

  // 子菜单弹出层
  .sub-menu-popup {
    .sub-menu-container {
      background: linear-gradient(135deg, rgba(220, 20, 60, 0.98), rgba(178, 34, 34, 0.98)) !important;
      border: 3px solid $spring-gold !important;
      box-shadow:
        0 4px 16px rgba(255, 215, 0, 0.3),
        0 20px 60px rgba(0, 0, 0, 0.4) !important;

      // 列标题
      .column-title {
        color: $spring-gold !important;
        border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
      }

      // 菜单项
      .menu-item {
        background: linear-gradient(135deg, rgba(139, 0, 0, 0.7), rgba(178, 34, 34, 0.7)) !important;
        border: 1.5px solid rgba(255, 215, 0, 0.3) !important;
        color: $spring-gold !important;

        &:hover {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.9), rgba(178, 34, 34, 0.9)) !important;
          border-color: rgba(255, 215, 0, 0.6) !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3) !important;
        }

        &.is-active {
          background: linear-gradient(135deg, $spring-gold, $spring-gold-light) !important;
          border: 2px solid $spring-red !important;
          color: #8b0000 !important;
          font-weight: 700;
          box-shadow:
            0 4px 16px rgba(255, 215, 0, 0.5),
            0 0 20px rgba(255, 215, 0, 0.3) !important;
        }
      }

      // 收藏按钮
      .favorite-btn {
        background: rgba(255, 215, 0, 0.2) !important;
        border-color: rgba(255, 215, 0, 0.3) !important;

        svg {
          color: $spring-gold !important;
        }

        &:hover {
          background: rgba(255, 215, 0, 0.3) !important;
        }
      }

      // 收藏菜单项
      .favorite-menu-item {
        background: linear-gradient(135deg, rgba(139, 0, 0, 0.7), rgba(178, 34, 34, 0.7)) !important;
        color: $spring-gold !important;

        .favorite-menu-icon {
          color: $spring-gold !important;
          background: rgba(255, 215, 0, 0.2) !important;
        }

        &:hover {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.9), rgba(178, 34, 34, 0.9)) !important;
          border-color: rgba(255, 215, 0, 0.6) !important;
        }
      }

      // 空收藏提示
      .empty-favorites {
        color: rgba(255, 215, 0, 0.8) !important;

        .empty-icon {
          color: rgba(255, 215, 0, 0.5) !important;
        }

        p {
          color: $spring-gold !important;
        }
      }
    }
  }
}

// ==================== 赛博朋克主题样式 ====================
html[data-skin="cyberpunk"] {
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-dark: #0a0a12;
  $cyber-dark-light: #12121f;
  $cyber-border: rgba(0, 255, 255, 0.3);

  // 悬停导航容器
  .sidebar-hover-container {
    background: linear-gradient(180deg, rgba(10, 10, 18, 0.95), rgba(18, 18, 31, 0.95)) !important;
    border-right: 2px solid $cyber-border !important;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.15) !important;

    // Logo区域
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba(10, 10, 18, 0.98), rgba(18, 18, 31, 0.98)) !important;
      border-bottom: 1px solid $cyber-border !important;

      .sidebar-title {
        color: $cyber-cyan !important;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3);
      }
    }

    // 一级菜单项
    .first-level-menu-item {
      color: $cyber-cyan !important;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      background: rgba(10, 10, 18, 0.6) !important;

      .menu-icon {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
      }

      .menu-title {
        color: $cyber-cyan !important;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
        transform: translateX(4px);

        .menu-icon,
        .menu-title {
          color: #fff !important;
        }
      }

      &.is-active {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.3),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;

        .menu-icon,
        .menu-title {
          color: #fff !important;
        }

        .menu-icon {
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        }
      }
    }

    // 折叠按钮
    .hover-collapse-btn,
    .sidebar-collapse-btn {
      background: linear-gradient(135deg, rgba(10, 10, 18, 0.98), rgba(18, 18, 31, 0.98)) !important;
      border-top: 1px solid $cyber-border !important;

      .collapse-icon,
      .sidebar-collapse-icon {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
      }

      .collapse-text {
        color: $cyber-cyan !important;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;

        .collapse-icon,
        .sidebar-collapse-icon {
          color: #fff !important;
        }
      }
    }
  }

  // 子菜单弹出层
  .sub-menu-popup {
    .sub-menu-container {
      background: linear-gradient(180deg, rgba(10, 10, 18, 0.98), rgba(18, 18, 31, 0.98)) !important;
      border: 2px solid $cyber-cyan !important;
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.3),
        0 20px 60px rgba(0, 0, 0, 0.5) !important;

      // 列标题
      .column-title {
        color: $cyber-cyan !important;
        border-bottom: 1px solid $cyber-border !important;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }

      // 菜单项
      .menu-item {
        background: rgba(10, 10, 18, 0.6) !important;
        border: 1px solid rgba(0, 255, 255, 0.2) !important;
        color: $cyber-cyan !important;

        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: $cyber-cyan !important;
          color: #fff !important;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
        }

        &.is-active {
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: $cyber-cyan !important;
          color: #fff !important;
          box-shadow:
            0 0 15px rgba(0, 255, 255, 0.3),
            inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        }
      }

      // 收藏按钮
      .favorite-btn {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: rgba(0, 255, 255, 0.3) !important;

        svg {
          color: $cyber-cyan !important;
        }

        &:hover {
          background: rgba(0, 255, 255, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
        }
      }

      // 收藏菜单项
      .favorite-menu-item {
        background: rgba(10, 10, 18, 0.6) !important;
        color: $cyber-cyan !important;

        .favorite-menu-icon {
          color: $cyber-cyan !important;
          background: rgba(0, 255, 255, 0.1) !important;
        }

        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: $cyber-cyan !important;
        }
      }

      // 空收藏提示
      .empty-favorites {
        color: rgba(0, 255, 255, 0.8) !important;

        .empty-icon {
          color: rgba(0, 255, 255, 0.5) !important;
        }

        p {
          color: $cyber-cyan !important;
        }
      }
    }
  }
}

// ==================== 中秋主题样式 ====================
html[data-skin="mid-autumn"] {
  $mid-blue: #1a237e;
  $mid-blue-light: #283593;
  $mid-gold: #ffd54f;
  $mid-gold-light: #ffecb3;
  $mid-cyan: #00bcd4;
  $mid-border: rgba(255, 213, 79, 0.3);

  // 悬停导航容器
  .sidebar-hover-container {
    background: linear-gradient(180deg, $mid-blue, $mid-blue-light) !important;
    border-right: 2px solid $mid-border !important;
    box-shadow: 0 0 20px rgba(26, 35, 126, 0.3) !important;

    // Logo区域
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba(13, 27, 66, 0.95), rgba($mid-blue, 0.95)) !important;
      border-bottom: 2px solid $mid-border !important;

      .sidebar-title {
        color: $mid-gold !important;
      }
    }

    // 一级菜单项
    .first-level-menu-item {
      color: $mid-gold-light !important;
      border: 1px solid rgba($mid-gold, 0.2) !important;
      background: rgba(26, 35, 126, 0.4) !important;

      .menu-icon {
        color: $mid-gold !important;
      }

      .menu-title {
        color: $mid-gold-light !important;
      }

      &:hover {
        background: rgba($mid-gold, 0.15) !important;
        border-color: $mid-gold !important;
        box-shadow: 0 0 15px rgba($mid-gold, 0.25) !important;

        .menu-icon,
        .menu-title {
          color: #fff !important;
        }
      }

      &.is-active {
        background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
        border-color: $mid-cyan !important;
        box-shadow: 0 4px 16px rgba($mid-gold, 0.5) !important;

        .menu-icon,
        .menu-title {
          color: $mid-blue !important;
        }
      }
    }

    // 折叠按钮
    .hover-collapse-btn,
    .sidebar-collapse-btn {
      background: linear-gradient(135deg, $mid-blue, $mid-blue-light) !important;
      border-color: $mid-border !important;

      .collapse-icon,
      .sidebar-collapse-icon {
        color: $mid-gold !important;
      }

      .collapse-text {
        color: $mid-gold-light !important;
      }

      &:hover {
        background: rgba($mid-gold, 0.2) !important;
        border-color: $mid-gold !important;
      }
    }
  }

  // 子菜单弹出层
  .sub-menu-popup {
    .sub-menu-container {
      background: linear-gradient(180deg, $mid-blue, $mid-blue-light) !important;
      border: 2px solid $mid-gold !important;
      box-shadow:
        0 0 20px rgba($mid-gold, 0.3),
        0 20px 60px rgba(0, 0, 0, 0.4) !important;

      // 列标题
      .column-title {
        color: $mid-gold !important;
        border-bottom: 1px solid $mid-border !important;
      }

      // 菜单项
      .menu-item {
        background: rgba(26, 35, 126, 0.4) !important;
        border: 1px solid rgba($mid-gold, 0.2) !important;
        color: rgba(255, 255, 255, 0.95) !important;

        &:hover {
          background: rgba($mid-gold, 0.15) !important;
          border-color: $mid-gold !important;
          color: $mid-gold !important;
          box-shadow: 0 0 12px rgba($mid-gold, 0.25) !important;
        }

        &.is-active {
          background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
          border-color: $mid-cyan !important;
          color: $mid-blue !important;
          box-shadow: 0 4px 16px rgba($mid-gold, 0.5) !important;
        }
      }

      // 收藏按钮
      .favorite-btn {
        background: rgba($mid-gold, 0.2) !important;
        border-color: rgba($mid-gold, 0.3) !important;

        svg {
          color: $mid-gold !important;
        }

        &:hover {
          background: rgba($mid-gold, 0.3) !important;
        }
      }

      // 收藏菜单项
      .favorite-menu-item {
        background: rgba(26, 35, 126, 0.4) !important;
        color: rgba(255, 255, 255, 0.95) !important;

        .favorite-menu-icon {
          color: $mid-gold !important;
          background: rgba($mid-gold, 0.2) !important;
        }

        &:hover {
          background: rgba($mid-gold, 0.15) !important;
          border-color: $mid-gold !important;
        }
      }

      // 空收藏提示
      .empty-favorites {
        color: rgba($mid-gold-light, 0.8) !important;

        .empty-icon {
          color: rgba($mid-gold, 0.5) !important;
        }

        p {
          color: $mid-gold-light !important;
        }
      }
    }
  }
}

// ==================== 圣诞主题样式 ====================
html[data-skin="christmas"] {
  $xmas-green: #1b5e20;
  $xmas-green-light: #2e7d32;
  $xmas-red: #c62828;
  $xmas-red-light: #e53935;
  $xmas-gold: #ffd700;
  $xmas-white: #ffffff;
  $xmas-border: rgba(255, 215, 0, 0.4);

  // 悬停导航容器
  .sidebar-hover-container {
    background: linear-gradient(180deg, $xmas-green, color.adjust($xmas-green, $lightness: -5%)) !important;
    border-right: 3px solid $xmas-border !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;

    // Logo区域
    .sidebar-logo-container {
      background: linear-gradient(180deg, color.adjust($xmas-green, $lightness: -8%), color.adjust($xmas-green, $lightness: -5%)) !important;
      border-bottom: 2px solid $xmas-border !important;

      .sidebar-title {
        color: $xmas-white !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }

    // 一级菜单项
    .first-level-menu-item {
      color: $xmas-white !important;
      border: 1.5px solid rgba($xmas-gold, 0.3) !important;
      background: rgba(color.adjust($xmas-green, $lightness: -5%), 0.6) !important;

      .menu-icon {
        color: $xmas-gold !important;
      }

      .menu-title {
        color: $xmas-white !important;
      }

      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
        border-color: rgba($xmas-gold, 0.5) !important;
        box-shadow: 0 4px 12px rgba($xmas-red, 0.3) !important;

        .menu-icon,
        .menu-title {
          color: $xmas-white !important;
        }
      }

      &.is-active {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        border: 2px solid $xmas-gold !important;
        box-shadow: 0 4px 16px rgba($xmas-red, 0.5) !important;

        .menu-icon,
        .menu-title {
          color: $xmas-white !important;
        }
      }
    }

    // 折叠按钮
    .hover-collapse-btn,
    .sidebar-collapse-btn {
      background: linear-gradient(180deg, color.adjust($xmas-green, $lightness: -8%), color.adjust($xmas-green, $lightness: -10%)) !important;
      border-top: 2px solid $xmas-border !important;

      .collapse-icon,
      .sidebar-collapse-icon {
        color: $xmas-gold !important;
      }

      .collapse-text {
        color: $xmas-white !important;
      }

      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;

        .collapse-icon,
        .sidebar-collapse-icon {
          color: $xmas-white !important;
        }
      }
    }
  }

  // 子菜单弹出层
  .sub-menu-popup {
    .sub-menu-container {
      background: linear-gradient(180deg, $xmas-green, color.adjust($xmas-green, $lightness: -5%)) !important;
      border: 2px solid $xmas-gold !important;
      box-shadow:
        0 4px 20px rgba($xmas-gold, 0.3),
        0 20px 60px rgba(0, 0, 0, 0.4) !important;

      // 列标题
      .column-title {
        color: $xmas-gold !important;
        border-bottom: 1px solid rgba($xmas-gold, 0.3) !important;
      }

      // 菜单项
      .menu-item {
        background: rgba(color.adjust($xmas-green, $lightness: -5%), 0.6) !important;
        border: 1.5px solid rgba($xmas-gold, 0.3) !important;
        color: $xmas-white !important;

        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
          border-color: rgba($xmas-gold, 0.5) !important;
          color: $xmas-white !important;
          box-shadow: 0 4px 12px rgba($xmas-red, 0.3) !important;
        }

        &.is-active {
          background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
          border: 2px solid $xmas-gold !important;
          color: $xmas-white !important;
          box-shadow: 0 4px 16px rgba($xmas-red, 0.5) !important;
        }
      }

      // 收藏按钮
      .favorite-btn {
        background: rgba($xmas-gold, 0.2) !important;
        border-color: rgba($xmas-gold, 0.3) !important;

        svg {
          color: $xmas-gold !important;
        }

        &:hover {
          background: rgba($xmas-gold, 0.3) !important;
        }
      }

      // 收藏菜单项
      .favorite-menu-item {
        background: rgba(color.adjust($xmas-green, $lightness: -5%), 0.6) !important;
        color: $xmas-white !important;

        .favorite-menu-icon {
          color: $xmas-gold !important;
          background: rgba($xmas-gold, 0.2) !important;
        }

        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
          border-color: rgba($xmas-gold, 0.5) !important;
        }
      }

      // 空收藏提示
      .empty-favorites {
        color: rgba($xmas-white, 0.8) !important;

        .empty-icon {
          color: rgba($xmas-gold, 0.5) !important;
        }

        p {
          color: $xmas-white !important;
        }
      }
    }
  }
}

// ==================== 元旦主题样式 ====================
html[data-skin="new-year"] {
  // 元旦冰雪主题色
  $ice-lightest: #F5FBFF;
  $ice-light: #B8E0F2;
  $ice-medium: #7CC2E8;
  $ice-primary: #4EA8DE;
  $ice-deep: #2A7AB8;
  $ice-darker: #1E5F8C;
  $frost-white: #FFFFFF;
  $frost-purple: #E0E7F5;
  $ice-border: rgba(78, 168, 222, 0.3);

  // 悬停导航容器
  .sidebar-hover-container {
    background: linear-gradient(180deg, rgba($ice-lightest, 0.98), rgba($frost-purple, 0.95)) !important;
    border-right: 2px solid $ice-border !important;
    box-shadow: 0 4px 20px rgba($ice-deep, 0.15) !important;
    backdrop-filter: blur(12px);

    // Logo区域
    .sidebar-logo-container {
      background: linear-gradient(180deg, rgba($frost-white, 0.95), rgba($ice-lightest, 0.9)) !important;
      border-bottom: 1px solid rgba($ice-medium, 0.3) !important;

      .sidebar-title {
        color: $ice-darker !important;
        text-shadow: 0 1px 2px rgba($ice-deep, 0.2);
      }
    }

    // 一级菜单项
    .first-level-menu-item {
      color: $ice-darker !important;
      border: 1px solid rgba($ice-medium, 0.25) !important;
      background: rgba($frost-white, 0.7) !important;
      border-radius: 8px;

      .menu-icon {
        color: $ice-primary !important;
      }

      .menu-title {
        color: $ice-darker !important;
      }

      &:hover {
        background: rgba($ice-medium, 0.2) !important;
        border-color: rgba($ice-primary, 0.4) !important;
        box-shadow: 0 4px 12px rgba($ice-primary, 0.2) !important;
        transform: translateX(4px);

        .menu-icon,
        .menu-title {
          color: $ice-deep !important;
        }
      }

      &.is-active {
        background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
        border: 2px solid rgba($frost-white, 0.5) !important;
        font-weight: 700;
        box-shadow:
          0 4px 16px rgba($ice-primary, 0.4),
          0 0 20px rgba($ice-medium, 0.3) !important;

        .menu-icon,
        .menu-title {
          color: $frost-white !important;
        }
      }
    }

    // 折叠按钮
    .hover-collapse-btn,
    .sidebar-collapse-btn {
      background: linear-gradient(180deg, rgba($frost-white, 0.95), rgba($ice-lightest, 0.9)) !important;
      border-top: 1px solid rgba($ice-medium, 0.3) !important;

      .collapse-icon,
      .sidebar-collapse-icon {
        color: $ice-primary !important;
      }

      .collapse-text {
        color: $ice-darker !important;
      }

      &:hover {
        background: rgba($ice-medium, 0.2) !important;

        .collapse-icon,
        .sidebar-collapse-icon {
          color: $ice-deep !important;
        }
      }
    }
  }

  // 子菜单弹出层
  .sub-menu-popup {
    .sub-menu-container {
      background: linear-gradient(180deg, rgba($ice-lightest, 0.98), rgba($frost-purple, 0.95)) !important;
      border: 2px solid rgba($ice-primary, 0.3) !important;
      box-shadow:
        0 8px 32px rgba($ice-deep, 0.2),
        0 20px 60px rgba(0, 0, 0, 0.15) !important;
      backdrop-filter: blur(12px);

      // 列标题
      .column-title {
        color: $ice-deep !important;
        border-bottom: 1px solid rgba($ice-medium, 0.3) !important;
      }

      // 菜单项
      .menu-item {
        background: rgba($frost-white, 0.7) !important;
        border: 1px solid rgba($ice-medium, 0.25) !important;
        color: $ice-darker !important;
        border-radius: 8px;

        &:hover {
          background: rgba($ice-medium, 0.2) !important;
          border-color: rgba($ice-primary, 0.4) !important;
          color: $ice-deep !important;
          box-shadow: 0 4px 12px rgba($ice-primary, 0.2) !important;
        }

        &.is-active {
          background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
          border: 2px solid rgba($frost-white, 0.5) !important;
          color: $frost-white !important;
          box-shadow: 0 4px 16px rgba($ice-primary, 0.4) !important;
        }
      }

      // 收藏按钮
      .favorite-btn {
        background: rgba($ice-primary, 0.15) !important;
        border-color: rgba($ice-primary, 0.3) !important;

        svg {
          color: $ice-primary !important;
        }

        &:hover {
          background: rgba($ice-primary, 0.25) !important;
        }
      }

      // 收藏菜单项
      .favorite-menu-item {
        background: rgba($frost-white, 0.7) !important;
        color: $ice-darker !important;

        .favorite-menu-icon {
          color: $ice-primary !important;
          background: rgba($ice-primary, 0.15) !important;
        }

        &:hover {
          background: rgba($ice-medium, 0.2) !important;
          border-color: rgba($ice-primary, 0.4) !important;
        }
      }

      // 空收藏提示
      .empty-favorites {
        color: rgba($ice-darker, 0.8) !important;

        .empty-icon {
          color: rgba($ice-primary, 0.5) !important;
        }

        p {
          color: $ice-deep !important;
        }
      }
    }
  }
}
</style>
