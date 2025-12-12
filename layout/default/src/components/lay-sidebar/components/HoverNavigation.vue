<script setup lang="ts">
import { emitter, usePermissionStoreHook, useMultiTagsStoreHook } from "@repo/core";
import { indexedDBProxy, useDefer } from "@repo/utils";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNav } from "../../../hooks/useNav";
import LaySidebarLeftCollapse from "./SidebarLeftCollapse.vue";
import LaySidebarLogo from "./SidebarLogo.vue";

// Props
interface Props {
  showLogo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
});

// Emits
interface Emits {
  menuClick: [menu: any];
  favoriteToggle: [menu: any, isFavorited: boolean];
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

// 悬浮导航的收缩状态
const isHoverCollapsed = ref(false);

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

// 只获取一级菜单，并添加"我的收藏"菜单
const firstLevelMenus = computed(() => {
  const menus = usePermissionStoreHook().wholeMenus.filter(
    (menu) => menu.meta?.showLink !== false
  );

  // 添加"我的收藏"菜单
  const favoritesMenu = {
    path: "/favorites",
    meta: {
      title: "我的收藏",
      icon: "ep:star-filled",
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

// 动态计算容器宽度 - 横向多列布局
const dynamicContainerWidth = computed(() => {
  const itemCount = totalMenuItems.value;
  if (itemCount === 0) return "320px";

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
function handleMenuHover(menu: any, event: MouseEvent) {
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
  //@ts-ignore
  const rect = event.currentTarget.getBoundingClientRect();

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
function isMenuActive(menu: any): boolean {
  if (menu.path === route.path) return true;

  // 检查子菜单是否有激活的
  if (menu.children) {
    return menu.children.some((child: any) => {
      if (child.path === route.path) return true;
      if (child.children) {
        return child.children.some(
          (grandChild: any) => grandChild.path === route.path
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
      //@ts-ignore
      favoriteMenus.value = stored;
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

function isMenuFavorited(menu: any): boolean {
  return favoriteMenus.value.some((fav) => fav.path === menu.path);
}

async function toggleFavorite(menu: any, event?: Event) {
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
async function handleMenuItemHover(menu: any) {
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
function handleSubMenuClick(menu: any, event?: Event) {
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
function handleMenuClick(menu: any) {
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
    // 这里可以处理logo变化，但由于logo是通过props传入的，可能不需要
  });

  // 加载收藏菜单
  await loadFavorites();

  // 初始化CSS变量
  document.documentElement.style.setProperty("--hover-sidebar-width", "200px");
});

onBeforeUnmount(() => {
  emitter.off("logoChange");
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

    <!-- 导航栏左侧的收缩按钮 -->
    <div
      v-show="isShow"
      class="sidebar-collapse-btn"
      @click="toggleHoverSideBar"
    >
      <IconifyIconOffline
        icon="ri:arrow-left-s-line"
        :style="{ transform: isHoverCollapsed ? 'rotate(180deg)' : 'none' }"
        class="sidebar-collapse-icon"
      />
    </div>

    <!-- 悬浮时显示的收缩按钮 -->
    <div v-show="isShow" class="hover-collapse-btn" @click="toggleHoverSideBar">
      <IconifyIconOffline
        icon="ri:arrow-left-s-line"
        :style="{ transform: isHoverCollapsed ? 'rotate(180deg)' : 'none' }"
        class="collapse-icon"
      />
      <span class="collapse-text">{{
        isHoverCollapsed ? "点击展开" : "点击折叠"
      }}</span>
    </div>

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
          :class="{ 'is-active': isMenuActive(menu) }"
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

            <!-- 普通菜单内容 - 横向多列布局 -->
            <div v-else class="horizontal-menu-container">
              <!-- 横向多列布局 -->
              <div
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
                          }"
                          @click="handleSubMenuClick(thirdMenu, $event)"
                        >
                          {{ thirdMenu.meta?.title }}
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
                          }"
                          @click="handleSubMenuClick(subMenu, $event)"
                        >
                          {{ subMenu.meta?.title }}
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
.sidebar-hover-container {
  position: relative;
  height: 100%;
  width: 200px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.98)
  );
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
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

  /* el-scrollbar 填充剩余空间，为底部收缩按钮预留40px */
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
    transform: translateX(4px);

    /* 深色主题下悬停样式 */
    html.dark & {
      .menu-content {
        color: #ffffff;
        /* 悬停时保持白色 */

        .menu-icon {
          color: #ffffff;
          /* 悬停时保持白色 */
        }

        .menu-title {
          color: #ffffff;
          /* 悬停时保持白色 */
        }
      }
    }
  }

  &.is-active {
    background: var(--el-color-primary);
    color: #ffffff !important;
    /* 强制设置为白色确保可见性 */
    font-weight: 600;
    box-shadow: 0 3px 12px rgba(var(--el-color-primary-rgb), 0.3);

    svg,
    i {
      color: #ffffff !important;
      /* 强制设置为白色确保可见性 */
    }
  }

  .menu-content {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 16px;
    color: var(--el-text-color-primary);
    /* 未选中状态 */

    .menu-icon {
      font-size: 18px;
      margin-right: 12px;
      color: var(--el-text-color-primary);
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
      color: #ffffff;
      /* 未选中状态为白色 */

      .menu-icon {
        color: #ffffff;
        /* 未选中状态为白色 */
      }

      .menu-title {
        color: #ffffff;
        /* 未选中状态为白色 */
      }
    }
  }
}

.sub-menu-popup {
  position: fixed;
  z-index: 9999;
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
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.98)
  );
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
  background: var(--el-bg-color-overlay);
  word-break: break-word;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;

  /* 浅色风格下文字为黑色 */
  html[data-theme="light"] & {
    color: #1e293b;
  }

  /* 深色模式下文字为白色 */
  html.dark & {
    color: #ffffff;
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
    background: var(--el-color-primary);
    color: var(--pure-menu-active-text-color) !important;
    /* 使用新定义的变量，确保在所有主题下都是白色 */
    font-weight: 600;
    box-shadow: 0 3px 12px rgba(var(--el-color-primary-rgb), 0.3);

    /* 浅色风格下激活样式保持白色 */
    html[data-theme="light"] & {
      color: #ffffff !important;
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
  z-index: 1000;
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
  z-index: 1000;
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
