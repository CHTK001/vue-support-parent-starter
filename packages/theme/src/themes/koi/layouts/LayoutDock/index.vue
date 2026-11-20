<template>
  <!-- 悬浮 Dock 布局：内容整页铺满，一级菜单收进底部悬浮玻璃 Dock；
       二级为 Dock 上方竖列方形卡片，三级及以上为横排小卡片（见 DockCards.vue） -->
  <div class="layout-dock-host">
    <div class="layout-dock-body">
      <header v-if="globalStore.isHeaderShown" class="layout-dock-topbar">
        <div class="layout-dock-topbar-card">
          <Logo :layout="globalStore.layout" class="layout-dock-logo" />
          <div class="layout-dock-toolbar-wrap">
            <ReToolbar />
          </div>
        </div>
      </header>
      <div class="layout-dock-main-wrap">
        <Main class="layout-dock-main" />
      </div>
    </div>

    <!-- 悬浮 Dock：弹层 + 磁贴条 -->
    <div ref="dockRootRef" class="dock-root">
      <transition name="dock-popup">
        <div v-if="openMenu" class="dock-popup">
          <!-- 二级：竖列方形卡片 -->
          <div class="dock-col">
            <div v-for="item in openMenuChildren" :key="item.path" class="dock-col-cell">
              <el-tooltip :content="titleOf(item)" placement="right" :show-after="300">
                <button type="button" class="dock-card" :class="cardClass(item)" @click="handleCardClick(item)">
                  <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="20" />
                  <i v-if="hasChildren(item)" class="dock-card-dot" />
                </button>
              </el-tooltip>
            </div>
          </div>
          <!-- 三级及以上：横排小卡片 -->
          <DockCards
            v-if="expandedL2"
            :items="visibleChildren(expandedL2)"
            :depth="3"
            :expanded-paths="expandedPaths"
            :active-menu="activeMenu"
            :menu-default-icon="menuDefaultIcon"
            @toggle="handleToggle"
            @navigate="handleNavigate"
          />
        </div>
      </transition>

      <div class="dock-bar">
        <el-tooltip
          v-for="item in topLevelMenus"
          :key="item.path"
          :content="titleOf(item)"
          placement="top"
          :show-after="300"
        >
          <button type="button" class="dock-tile" :class="tileClass(item)" @click="handleTileClick(item)">
            <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="20" />
          </button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="LayoutDock">
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import ReToolbar from "@repo/theme/koi/layouts/components/Header/components/ReToolbar.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import DockCards from "./DockCards.vue";
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";
import { getMenuLanguage } from "@repo/languages";
import { HOME_URL, resolveMenuDefaultIcon } from "@repo/config";
import { msgWarning } from "@repo/core";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

// 缺省菜单图标：菜单未配置 meta.icon 时兜底，避免图标位空白
const menuDefaultIcon = resolveMenuDefaultIcon();

/** 顶级菜单[第一层级] */
const topLevelMenus = computed(() => authStore.showMenuList.filter((item: any) => item.meta?.isVisible == "1"));

/** 当前激活路由（与其它布局同口径：优先 meta.activeMenu） */
const activeMenu = computed(() => (route.meta?.activeMenu ? route.meta.activeMenu : route.path) as string);

const titleOf = (item: any) => getMenuLanguage(item.meta?.title);

const hasChildren = (item: any) =>
  !!(item.children?.length && item.children.some((c: any) => c.meta?.isVisible == "1"));

const visibleChildren = (item: any) => (item.children || []).filter((c: any) => c.meta?.isVisible == "1");

/** 当前路由是否落在该项子树内 */
const containsActive = (menu: any, target: string): boolean => {
  if (String(menu.path) === String(target)) return true;
  if (menu.children?.length) {
    for (const child of menu.children) {
      if (containsActive(child, target)) return true;
    }
  }
  return false;
};

/** 当前激活的顶级菜单（刷新后由路由反推，高亮不丢） */
const activeTopMenuId = computed(() => {
  for (const item of topLevelMenus.value) {
    if (containsActive(item, activeMenu.value)) return item.meta?.menuId;
  }
  return undefined;
});

// ==================== 弹层与展开链 ====================

/** 当前弹出面板的顶级菜单 menuId */
const openMenuId = ref<any>(null);
/** 展开链：各级已展开项的 path（单链，uniqueOpened 语义） */
const expandedPaths = ref<string[]>([]);

const openMenu = computed(() =>
  topLevelMenus.value.find((item: any) => String(item.meta?.menuId) === String(openMenuId.value)) || null
);

const openMenuChildren = computed(() => (openMenu.value ? visibleChildren(openMenu.value) : []));

/** 二级里当前展开的那一项（其子级渲染为横排小卡片） */
const expandedL2 = computed(() => openMenuChildren.value.find((item: any) => expandedPaths.value.includes(String(item.path))) || null);

/**
 * 切换某项的展开状态（任意层级通用）：
 * 展开 → 保留其祖先链并加入自身；收起 → 截断到其父级为止。
 */
const handleToggle = (item: any) => {
  const ancestors: string[] = [];
  const walk = (items: any[], trail: string[]): boolean => {
    for (const it of items) {
      if (String(it.path) === String(item.path)) {
        ancestors.push(...trail);
        return true;
      }
      if (it.children?.length && walk(it.children, [...trail, String(it.path)])) return true;
    }
    return false;
  };
  walk(openMenuChildren.value, []);

  const isOpen = expandedPaths.value.includes(String(item.path));
  expandedPaths.value = isOpen ? ancestors : [...ancestors, String(item.path)];
};

/** 点击二级卡片：有子级展开/收起，无子级直接跳转 */
const handleCardClick = (item: any) => {
  if (hasChildren(item)) handleToggle(item);
  else handleNavigate(item);
};

/** 跳转（外链校验与其它布局同口径） */
const handleNavigate = (item: any) => {
  if (item.meta?.linkUrl) {
    if (/^https?:\/\//.test(item.meta?.linkUrl)) {
      window.open(item.meta.linkUrl, "_blank");
      return;
    }
    msgWarning("非正确链接地址，禁止跳转");
    return;
  }
  router.push({ path: item.path });
};

/** 点击 Dock 磁贴 */
const handleTileClick = (item: any) => {
  if (item.meta?.linkUrl) {
    if (/^https?:\/\//.test(item.meta?.linkUrl)) {
      window.open(item.meta.linkUrl, "_blank");
      return;
    }
    msgWarning("非正确链接地址，禁止跳转");
    return;
  }

  // 叶子：直接跳转并收起弹层
  if (!hasChildren(item)) {
    openMenuId.value = null;
    router.push({ path: item.path || HOME_URL });
    return;
  }

  // 分支：切换弹层；打开时把当前路由所在的链路预先展开
  if (String(openMenuId.value) === String(item.meta?.menuId)) {
    openMenuId.value = null;
    return;
  }
  openMenuId.value = item.meta?.menuId;
  expandActiveChain();
};

/** 弹层打开时，沿当前激活路由把所在链路展开（刷新/切回后定位不丢） */
const expandActiveChain = () => {
  const chain: string[] = [];
  const walk = (items: any[], trail: string[]): boolean => {
    for (const it of items) {
      if (String(it.path) === String(activeMenu.value)) {
        chain.push(...trail);
        return true;
      }
      if (it.children?.length && walk(it.children, [...trail, String(it.path)])) return true;
    }
    return false;
  };
  walk(openMenuChildren.value, []);
  expandedPaths.value = chain;
};

// 路由变化：弹层打开时同步展开链；切到其它顶级菜单则收起弹层
watch(activeMenu, () => {
  if (!openMenuId.value) return;
  if (String(openMenuId.value) !== String(activeTopMenuId.value)) {
    openMenuId.value = null;
    return;
  }
  expandActiveChain();
});

// ==================== 高亮类名 ====================

const tileClass = (item: any) => ({
  "is-active": String(activeTopMenuId.value) === String(item.meta?.menuId),
  "is-open": String(openMenuId.value) === String(item.meta?.menuId)
});

const cardClass = (item: any) => {
  const leafActive = String(item.path) === String(activeMenu.value);
  return {
    "is-branch": hasChildren(item),
    "is-expanded": expandedPaths.value.includes(String(item.path)),
    "is-active-leaf": leafActive,
    "is-active-chain": !leafActive && containsActive(item, activeMenu.value)
  };
};

// ==================== 关闭交互（点空白 / Esc） ====================

const dockRootRef = ref<HTMLElement | null>(null);

const onDocMouseDown = (e: MouseEvent) => {
  if (!openMenuId.value) return;
  if (dockRootRef.value && !dockRootRef.value.contains(e.target as Node)) {
    openMenuId.value = null;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && openMenuId.value) openMenuId.value = null;
};

onMounted(() => {
  document.addEventListener("mousedown", onDocMouseDown);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocMouseDown);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style lang="scss" scoped>
.layout-dock-host {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}

.layout-dock-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* ===== 顶栏：悬浮玻璃圆角卡（与 Dock 同一材质语言） ===== */
.layout-dock-topbar {
  flex-shrink: 0;
  padding: 10px 14px 0;
}

.layout-dock-topbar-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: calc(#{$aside-header-height} - 8px);
  padding: 5px 10px 5px 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 36%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
  backdrop-filter: blur(18px) saturate(1.1);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);

  html.dark & {
    background: color-mix(in srgb, var(--el-bg-color) 58%, transparent);
    border-color: color-mix(in srgb, var(--el-border-color) 44%, transparent);
    box-shadow: 0 10px 28px rgb(0 0 0 / 35%);
  }
}

.layout-dock-logo {
  flex-shrink: 1;
  min-width: 0;
}

.layout-dock-toolbar-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: $aside-header-height;

  :deep(.header-right) {
    position: static;
    top: auto;
    right: auto;
    z-index: auto;
    height: auto;
    transform: none;
    flex-shrink: 0;
  }
}

/* ===== 内容区：整页铺满，底部给 Dock 留出悬浮空间 ===== */
.layout-dock-main-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 80px;
}

.layout-dock-main {
  flex: 1;
  min-height: 0;
}

/* ===== 悬浮 Dock ===== */
.dock-root {
  position: fixed;
  right: 0;
  bottom: 14px;
  left: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.dock-popup,
.dock-bar {
  pointer-events: auto;
}

/* 磁贴条：底部居中玻璃胶囊 */
.dock-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 54px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 55%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  backdrop-filter: blur(20px) saturate(1.15);
  -webkit-backdrop-filter: blur(20px) saturate(1.15);
  box-shadow: 0 12px 32px rgb(15 23 42 / 14%);

  html.dark & {
    border-color: color-mix(in srgb, var(--el-border-color) 60%, transparent);
    box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
  }
}

.dock-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
    transform: translateY(-2px);
  }

  &.is-active {
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    color: #fff;
    box-shadow: 0 4px 12px rgb(var(--el-color-primary-rgb) / 40%);
    transform: translateY(-4px) scale(1.06);
  }

  &.is-open:not(.is-active) {
    color: var(--el-color-primary);
    outline: 2px solid var(--el-color-primary-light-5);
    outline-offset: 2px;
  }
}

/* ===== 二级弹层：竖列方形卡片 ===== */
.dock-popup {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dock-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 220px);
  padding: 2px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: var(--el-border-color);
  }
}

.dock-col-cell {
  position: relative;
  flex: none;
}

/* 二级卡片：与 Dock 磁贴同一语言的方形卡 */
.dock-col .dock-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 13px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  box-shadow: 0 8px 22px rgb(15 23 42 / 12%);
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;

  html.dark & {
    box-shadow: 0 8px 22px rgb(0 0 0 / 45%);
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
    transform: translateY(-3px);
  }

  &.is-branch .dock-card-dot {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    box-shadow: 0 0 0 2px var(--el-bg-color);
  }

  &.is-expanded,
  &.is-active-chain {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }

  &.is-active-chain {
    box-shadow: 0 10px 24px rgb(var(--el-color-primary-rgb) / 22%);
  }

  &.is-active-leaf {
    border-color: transparent;
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    color: #fff;
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgb(var(--el-color-primary-rgb) / 40%);

    &:hover {
      color: #fff;
      transform: translateY(-3px);
    }
  }
}

/* ===== 弹层进出场 ===== */
.dock-popup-enter-active,
.dock-popup-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.dock-popup-enter-from,
.dock-popup-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .dock-tile,
  .dock-col .dock-card {
    transition: none;
  }
}
</style>
