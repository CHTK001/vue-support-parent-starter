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
    <div ref="dockRootRef" class="dock-root" :class="`is-${globalStore.dockPosition}`" @mouseenter="peek = true" @mouseleave="peek = false">
      <!-- 折叠悬停垫：peek 时兜住整片坞区（dock-root 本体 pointer-events:none），
           把手卸载后鼠标移向磁贴条途中命中链不断，避免「刚显出就缩回」的振荡 -->
      <div v-if="globalStore.dockCollapsed && peek" class="dock-peek-pad" aria-hidden="true"></div>
      <transition name="dock-popup">
        <div v-if="openMenu && dockVisible" ref="popupRef" class="dock-popup" :style="popupShiftStyle">
          <!-- 二级：竖列方形卡片 -->
          <div class="dock-col">
            <div v-for="item in openMenuChildren" :key="item.path" class="dock-col-cell">
              <el-tooltip :content="titleOf(item)" :placement="cardTooltipPlacement" :show-after="300">
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

      <div v-show="dockVisible" class="dock-bar">
        <el-tooltip
          v-for="item in topLevelMenus"
          :key="item.path"
          :content="titleOf(item)"
          :placement="tileTooltipPlacement" :show-after="300"
        >
          <button type="button" class="dock-tile" :class="tileClass(item)" :ref="el => setTileRef(item.path, el)" @click="handleTileClick(item)">
            <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="20" />
          </button>
        </el-tooltip>
      </div>

      <!-- 折叠把手：Dock 折叠时缩至所在边缘角落。常驻不随 peek 卸载——
           若 mouseenter 即卸载，点击会落在空处，「点击恢复」永远点不中（实测缺陷） -->
      <button v-if="globalStore.dockCollapsed" type="button" class="dock-handle" :class="`is-${globalStore.dockPosition}`" @click="restoreDock" @mouseenter="peek = true">
        <el-icon :size="18"><Expand /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" name="LayoutDock">
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import ReToolbar from "@repo/theme/koi/layouts/components/Header/components/ReToolbar.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import DockCards from "./DockCards.vue";
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";
import { getMenuLanguage } from "@repo/languages";
import { HOME_URL, resolveMenuDefaultIcon } from "@repo/config";
import { msgWarning } from "@repo/core";
import { Expand } from "@element-plus/icons-vue";

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

/** 当前路由是否落在该项子树内（path 优先，name 兜底动态参数路由） */
const containsActive = (menu: any, target: string): boolean => {
  if (String(menu.path) === String(target)) return true;
  if (menu.name && String(menu.name) === String(route.name)) return true;
  if (menu.children?.length) {
    for (const child of menu.children) {
      if (containsActive(child, target)) return true;
    }
  }
  return false;
};

/** 当前激活的顶级菜单（按 path 标识：静态菜单没有 meta.menuId，按 menuId 比较会全量误命中） */
const activeTopPath = computed(() => {
  for (const item of topLevelMenus.value) {
    if (containsActive(item, activeMenu.value)) return String(item.path);
  }
  return undefined;
});

// ==================== 弹层与展开链 ====================

/** 当前弹出面板的顶级菜单 path（与激活标识同口径） */
const openMenuPath = ref<string | null>(null);
/** 展开链：各级已展开项的 path（单链，uniqueOpened 语义） */
const expandedPaths = ref<string[]>([]);
/** 独立卡片模式下被点亮的一级磁贴 path 集合：点击切换、互不影响、可多张同亮 */
const selectedTopPaths = ref<Set<string>>(new Set());

const openMenu = computed(() =>
  topLevelMenus.value.find((item: any) => String(item.path) === openMenuPath.value) || null
);

const openMenuChildren = computed(() => (openMenu.value ? visibleChildren(openMenu.value) : []));

/** 二级里当前展开的那一项（其子级渲染为横排小卡片） */
const expandedL2 = computed(() => openMenuChildren.value.find((item: any) => expandedPaths.value.includes(String(item.path))) || null);

// ==================== 弹层锚定：跟随点击的磁贴 ====================

const popupRef = ref<HTMLElement | null>(null);
/** 各磁贴 DOM 引用：计算弹层锚点用 */
const tileEls = new Map<string, HTMLElement>();
const setTileRef = (path: any, el: any) => {
  if (el) tileEls.set(String(path), el as HTMLElement);
  else tileEls.delete(String(path));
};

const isVerticalDock = () => globalStore.dockPosition === "left" || globalStore.dockPosition === "right";

/** 弹层相对居中位的偏移：底/顶坞走横向（left），左右坞走纵向（top） */
const popupShift = ref(0);
const popupShiftStyle = computed(() =>
  isVerticalDock() ? { top: `${popupShift.value}px` } : { left: `${popupShift.value}px` }
);

/** 磁贴中心在锚定轴上的坐标（左右坞取纵向，底/顶坞取横向） */
const tileCenterOnAxis = (path: string): number | null => {
  const tile = tileEls.get(path);
  if (!tile) return null;
  const rect = tile.getBoundingClientRect();
  return isVerticalDock() ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
};

/** 弹层渲染前先按磁贴位置同步预算偏移，避免先闪现在居中位再跳动 */
const presetPopupShift = () => {
  const center = openMenuPath.value ? tileCenterOnAxis(openMenuPath.value) : null;
  if (center == null) {
    popupShift.value = 0;
    return;
  }
  popupShift.value = center - (isVerticalDock() ? window.innerHeight : window.innerWidth) / 2;
};

/** 弹层渲染后按实际尺寸夹取偏移，保证不越出视口（弹层比视口还宽时居中） */
const updatePopupShift = async () => {
  if (!openMenuPath.value) return;
  await nextTick();
  const popup = popupRef.value;
  const center = openMenuPath.value ? tileCenterOnAxis(openMenuPath.value) : null;
  if (!popup || center == null) return;
  const size = popup.getBoundingClientRect()[isVerticalDock() ? "height" : "width"];
  const viewport = isVerticalDock() ? window.innerHeight : window.innerWidth;
  const min = 8 + size / 2 - viewport / 2;
  const max = viewport / 2 - 8 - size / 2;
  const desired = center - viewport / 2;
  popupShift.value = min > max ? 0 : Math.min(Math.max(desired, min), max);
};

watch(openMenuPath, path => {
  if (!path) {
    popupShift.value = 0;
    return;
  }
  presetPopupShift();
  updatePopupShift();
});

// 展开链变化（如出现第三级横排卡片）会改变弹层尺寸，需要重新夹取
watch(expandedPaths, () => {
  if (openMenuPath.value) updatePopupShift();
});

watch(
  () => globalStore.dockPosition,
  () => {
    if (!openMenuPath.value) return;
    presetPopupShift();
    updatePopupShift();
  }
);

// 切换激活模式时清空独立卡片的点亮集合，避免旧状态泄漏进另一模式
watch(
  () => globalStore.dockActiveMode,
  () => {
    selectedTopPaths.value = new Set();
  }
);

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

/** 独立卡片模式：切换某张一级磁贴的点亮状态（互不影响，可多张同亮） */
const toggleTopTile = (tilePath: string) => {
  const next = new Set(selectedTopPaths.value);
  if (next.has(tilePath)) next.delete(tilePath);
  else next.add(tilePath);
  selectedTopPaths.value = next;
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

  const tilePath = String(item.path);
  const independent = globalStore.dockActiveMode === "independent";

  // 叶子：直接跳转；整体模式下顺带收起弹层，独立卡片模式下弹层与其它卡互不影响
  if (!hasChildren(item)) {
    if (independent) toggleTopTile(tilePath);
    else openMenuPath.value = null;
    router.push({ path: item.path || HOME_URL });
    return;
  }

  // 独立卡片模式：点亮/熄灭自己；弹层只跟随本次点击的卡，再点已亮卡则熄灭并收起弹层
  if (independent) {
    const wasLit = selectedTopPaths.value.has(tilePath);
    toggleTopTile(tilePath);
    if (wasLit) {
      if (openMenuPath.value === tilePath) openMenuPath.value = null;
    } else {
      openMenuPath.value = tilePath;
      expandActiveChain();
    }
    return;
  }

  // 整体模式：切换弹层；打开时把当前路由所在的链路预先展开
  if (openMenuPath.value === tilePath) {
    openMenuPath.value = null;
    return;
  }
  openMenuPath.value = tilePath;
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

// 路由变化：弹层打开时同步展开链；整体模式切到其它顶级菜单则收起弹层（独立卡片模式弹层不随路由收起）
watch(activeMenu, () => {
  if (!openMenuPath.value) return;
  if (globalStore.dockActiveMode !== "independent" && openMenuPath.value !== activeTopPath.value) {
    openMenuPath.value = null;
    return;
  }
  if (openMenuPath.value === activeTopPath.value) expandActiveChain();
});

// ==================== 高亮类名 ====================

const tileClass = (item: any) => {
  const path = String(item.path);
  const isOpen = openMenuPath.value === path;
  // 独立卡片模式：点亮的卡与路由激活的卡都高亮，互不影响、可多张同亮
  if (globalStore.dockActiveMode === "independent") {
    return {
      "is-active": isOpen || selectedTopPaths.value.has(path) || activeTopPath.value === path,
      "is-open": isOpen
    };
  }
  // 整体模式（默认）：点击即激活——弹层打开期间被点磁贴保持激活态，其余磁贴（含原激活）
  // 转为未激活；弹层收起后回到路由驱动的激活态
  return {
    "is-active": isOpen || (!openMenuPath.value && activeTopPath.value === path),
    "is-open": isOpen
  };
};

const cardClass = (item: any) => {
  const leafActive =
    String(item.path) === String(activeMenu.value) ||
    (item.name && String(item.name) === String(route.name));
  return {
    "is-branch": hasChildren(item),
    "is-expanded": expandedPaths.value.includes(String(item.path)),
    "is-active-leaf": leafActive,
    "is-active-chain": !leafActive && containsActive(item, activeMenu.value)
  };
};

// ==================== 折叠收缩（悬停显出 / 点击恢复） ====================

/** 折叠后的悬停显出态：鼠标经过把手或坞体时临时展开 */
const peek = ref(false);
/** 折叠时坞体是否显示（未折叠常显；折叠后仅悬停显出） */
const dockVisible = computed(() => !globalStore.dockCollapsed || peek.value);

/** 点击把手：恢复常驻 Dock */
const restoreDock = () => {
  globalStore.setGlobalState("dockCollapsed", false);
  peek.value = false;
};

/** 磁贴提示气泡方向跟随 Dock 位置（左右坞时朝空白侧弹出） */
const tileTooltipPlacement = computed(() =>
  globalStore.dockPosition === "left" ? "right" : globalStore.dockPosition === "right" ? "left" : "top"
);
/** 二级卡片提示气泡方向：右侧坞朝左弹，其余朝右弹 */
const cardTooltipPlacement = computed(() => (globalStore.dockPosition === "right" ? "left" : "right"));

// ==================== 关闭交互（点空白 / Esc） ====================

const dockRootRef = ref<HTMLElement | null>(null);

const onDocMouseDown = (e: MouseEvent) => {
  if (!openMenuPath.value) return;
  if (dockRootRef.value && !dockRootRef.value.contains(e.target as Node)) {
    openMenuPath.value = null;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && openMenuPath.value) openMenuPath.value = null;
};

const onWindowResize = () => {
  if (openMenuPath.value) updatePopupShift();
};

onMounted(() => {
  document.addEventListener("mousedown", onDocMouseDown);
  document.addEventListener("keydown", onKeydown);
  window.addEventListener("resize", onWindowResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocMouseDown);
  document.removeEventListener("keydown", onKeydown);
  window.removeEventListener("resize", onWindowResize);
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

/* ===== 内容区：主体吃满整页，Dock 悬浮于边缘之上不再挤压内容 ===== */
.layout-dock-main-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.layout-dock-main {
  flex: 1;
  min-height: 0;
}

/* ===== 悬浮 Dock：位置四边可选（bottom/top/left/right） ===== */
.dock-root {
  position: fixed;
  z-index: 2000;
  display: flex;
  gap: 12px;
  pointer-events: none;

  /* 底部（默认）：磁贴条在下、弹层在上 */
  &.is-bottom {
    right: 0;
    bottom: 14px;
    left: 0;
    flex-direction: column;
    align-items: center;
  }

  /* 顶部：磁贴条在上、弹层在下 */
  &.is-top {
    right: 0;
    top: 14px;
    left: 0;
    flex-direction: column-reverse;
    align-items: center;
  }

  /* 左侧：磁贴条在左、弹层在右 */
  &.is-left {
    top: 0;
    bottom: 0;
    left: 14px;
    flex-direction: row-reverse;
    align-items: center;
  }

  /* 右侧：磁贴条在右、弹层在左 */
  &.is-right {
    top: 0;
    bottom: 0;
    right: 14px;
    flex-direction: row;
    align-items: center;
  }
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

/* 左右位置：磁贴条转竖排胶囊 */
.is-left .dock-bar,
.is-right .dock-bar {
  flex-direction: column;
  width: 54px;
  height: auto;
  max-height: calc(100vh - 120px);
  padding: 12px 0;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: var(--el-border-color);
  }
}

/* 左右位置：磁贴悬停/激活位移改为横向 */
.is-left .dock-tile:hover {
  transform: translateX(-2px);
}

.is-right .dock-tile:hover {
  transform: translateX(2px);
}

.is-left .dock-tile.is-active {
  transform: translateX(-4px) scale(1.06);
}

.is-right .dock-tile.is-active {
  transform: translateX(4px) scale(1.06);
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

  /* 弹层锚定磁贴：激活态之外再叠一圈描边，标示弹层挂点 */
  &.is-open {
    outline: 2px solid var(--el-color-primary-light-5);
    outline-offset: 2px;
  }
}

/* ===== 折叠悬停垫：peek 期间兜住坞区，保持鼠标命中链 ===== */
.dock-peek-pad {
  position: absolute;
  inset: 0;
  z-index: -1; /* 压在磁贴条/弹层之下，只兜命中不挡点击 */
  pointer-events: auto;
}

/* ===== 折叠把手：Dock 折叠时缩至所在边缘角落的小圆钮 ===== */
.dock-handle {
  position: fixed;
  z-index: 2001;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 55%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  backdrop-filter: blur(20px) saturate(1.15);
  -webkit-backdrop-filter: blur(20px) saturate(1.15);
  box-shadow: 0 10px 26px rgb(15 23 42 / 16%);
  color: var(--el-text-color-regular);
  cursor: pointer;
  pointer-events: auto;
  transition:
    transform 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  html.dark & {
    border-color: color-mix(in srgb, var(--el-border-color) 60%, transparent);
    box-shadow: 0 10px 26px rgb(0 0 0 / 45%);
  }

  &:hover {
    color: var(--el-color-primary);
    transform: scale(1.08);
    box-shadow: 0 12px 30px rgb(var(--el-color-primary-rgb) / 25%);
  }

  /* 各位置的角落落点：底/顶贴右角，左贴左下角，右贴右下角 */
  &.is-bottom {
    right: 18px;
    bottom: 18px;
  }

  &.is-top {
    right: 18px;
    top: 68px; /* 页头（约56px）下方，避免压住页头右侧图标 */
  }

  &.is-left {
    left: 18px;
    bottom: 18px;
  }

  &.is-right {
    right: 18px;
    bottom: 18px;
  }
}

/* ===== 二级弹层：竖列方形卡片 ===== */
.dock-popup {
  position: relative; /* 供 left/top 锚定偏移：弹层跟随点击的磁贴 */
  display: flex;
  align-items: center;
  gap: 14px;
  transition:
    left 0.18s ease,
    top 0.18s ease;
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

/* 二级卡片：与 Dock 磁贴同一语言的方形卡（无底色/描边/阴影，仅图标 + 动效） */
.dock-col .dock-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border-radius: 13px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover {
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
    color: var(--el-color-primary);
  }

  &.is-active-leaf {
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    color: #fff;
    transform: translateY(-3px);

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

/* 弹层进出场方向跟随 Dock 位置 */
.is-top .dock-popup-enter-from,
.is-top .dock-popup-leave-to {
  transform: translateY(-10px);
}

.is-left .dock-popup-enter-from,
.is-left .dock-popup-leave-to {
  transform: translateX(-10px);
}

.is-right .dock-popup-enter-from,
.is-right .dock-popup-leave-to {
  transform: translateX(10px);
}

@media (prefers-reduced-motion: reduce) {
  .dock-tile,
  .dock-popup,
  .dock-col .dock-card,
  .dock-handle {
    transition: none;
  }
}
</style>
