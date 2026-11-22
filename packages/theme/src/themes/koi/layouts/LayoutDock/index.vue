<template>
  <!-- 悬浮 Dock 布局：内容整页铺满，一级菜单收进底部悬浮玻璃 Dock；
       二级为 Dock 上方竖列方形卡片，三级及以上为横排小卡片（见 DockCards.vue） -->
  <div class="layout-dock-host">
    <div class="layout-dock-body">
      <el-header v-if="globalStore.isHeaderShown" class="layout-header">
        <Logo :layout="globalStore.layout" class="flex-shrink-0" />
        <Header class="header m-l-8px" />
      </el-header>
      <div class="layout-dock-main-wrap">
        <Main class="layout-dock-main" />
      </div>
    </div>

    <!-- 悬浮 Dock：弹层 + 磁贴条 -->
    <div v-if="globalStore.dockShown" ref="dockRootRef" class="dock-root" :class="`is-${globalStore.dockPosition}`" @mouseenter="enterDock" @mouseleave="leaveDock">
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

      <!-- 磁贴条折叠/展开动画：收起时向所在边缘滑出消隐，恢复时滑回；把手弹出/缩回 -->
      <transition name="dock-bar">
        <div v-show="dockVisible" class="dock-bar" :class="{ 'is-scatter': globalStore.dockTileStyle === 'scatter', 'is-peek': isPeekPreview }">
          <el-tooltip
            v-for="item in topLevelMenus"
            :key="item.path"
            :content="titleOf(item)"
            :placement="tileTooltipPlacement" :show-after="300"
          >
            <button type="button" class="dock-tile" :class="tileClass(item)" :ref="el => setTileRef(item.path, el)" @click="handleTileClick(item)" @mouseenter="handleTileHover(item)">
              <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="20" />
            </button>
          </el-tooltip>

          <!-- 悬浮坞专属配置：条尾齿轮按钮 + popover，就地调整悬浮导航配置（无需进设置抽屉） -->
          <el-popover :placement="configPopoverPlacement" :width="272" trigger="click" popper-class="dock-config-popover">
            <template #reference>
              <button type="button" class="dock-config" aria-label="dock config">
                <el-icon :size="16"><Setting /></el-icon>
              </button>
            </template>
            <div class="dock-config-panel">
              <div class="dock-config-title">{{ t("themeConfig.interface.dockSection") }}</div>
              <div class="dock-config-row">
                <span class="dock-config-label">{{ t("themeConfig.interface.dockPosition.label") }}</span>
                <el-segmented
                  v-model="dockPositionModel"
                  size="small"
                  :options="[
                    { label: t('themeConfig.interface.dockPosition.top'), value: 'top' },
                    { label: t('themeConfig.interface.dockPosition.bottom'), value: 'bottom' },
                    { label: t('themeConfig.interface.dockPosition.left'), value: 'left' },
                    { label: t('themeConfig.interface.dockPosition.right'), value: 'right' }
                  ]"
                />
              </div>
              <div class="dock-config-row">
                <span class="dock-config-label">{{ t("themeConfig.interface.dockTileStyle.label") }}</span>
                <el-segmented
                  v-model="dockTileStyleModel"
                  size="small"
                  :options="[
                    { label: t('themeConfig.interface.dockTileStyle.aggregate'), value: 'aggregate' },
                    { label: t('themeConfig.interface.dockTileStyle.scatter'), value: 'scatter' }
                  ]"
                />
              </div>
              <div class="dock-config-row">
                <span class="dock-config-label">{{ t("themeConfig.switchBlocks.dockHoverOpen.title") }}</span>
                <el-segmented
                  v-model="dockHoverOpenModel"
                  size="small"
                  :options="[
                    { label: t('themeConfig.interface.switchOn'), value: true },
                    { label: t('themeConfig.interface.switchOff'), value: false }
                  ]"
                />
              </div>
              <div class="dock-config-row">
                <span class="dock-config-label">{{ t("themeConfig.switchBlocks.dockHoverPeek.title") }}</span>
                <el-segmented
                  v-model="dockHoverPeekModel"
                  size="small"
                  :options="[
                    { label: t('themeConfig.interface.switchOn'), value: true },
                    { label: t('themeConfig.interface.switchOff'), value: false }
                  ]"
                />
              </div>
            </div>
          </el-popover>

          <!-- 折叠按钮：点击收起 Dock（缩为边缘角落把手，悬停显出、点把手恢复） -->
          <button v-if="!globalStore.dockCollapsed" type="button" class="dock-fold" aria-label="collapse dock" @click="collapseDock">
            <el-icon :size="16"><Fold /></el-icon>
          </button>
        </div>
      </transition>

      <!-- 折叠把手：Dock 折叠时缩至所在边缘角落。常驻不随 peek 卸载——
           若 mouseenter 即卸载，点击会落在空处，「点击恢复」永远点不中（实测缺陷） -->
      <transition name="dock-handle">
        <button v-if="globalStore.dockCollapsed" type="button" class="dock-handle" :class="`is-${globalStore.dockPosition}`" @click="restoreDock" @mouseenter="enterDock">
          <el-icon :size="18"><Menu /></el-icon>
        </button>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts" name="LayoutDock">
import Header from "@repo/theme/koi/layouts/components/Header/index.vue";
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import DockCards from "./DockCards.vue";
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";
import { getMenuLanguage } from "@repo/languages";
import { HOME_URL, resolveMenuDefaultIcon } from "@repo/config";
import { msgWarning } from "@repo/core";
import { Menu, Fold, Setting } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const { t } = useI18n();

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

/**
 * 切换某项的展开状态（任意层级通用）：
 * 展开 → 保留其祖先链并加入自身；收起 → 截断到其父级为止。
 */
const handleToggle = (item: any) => {
  if (isPeekPreview.value) return; // 折叠预览态：仅展示，不可交互
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
  if (isPeekPreview.value) return; // 折叠预览态：仅展示，不可跳转
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

/** 当前弹层是否由鼠标悬停展开（首次点击转为常驻，不立即收起） */
const hoverOpened = ref(false);

/**
 * 鼠标经过一级磁贴自动展开二级弹层（dockHoverOpen，默认开启）。
 * 注意：只新增弹层、不卸载磁贴自身（dock-handle 前车之鉴——hover 目标
 * 若在 mouseenter 里被卸载，事件链断裂，交互会失效）。
 */
const handleTileHover = (item: any) => {
  if (isPeekPreview.value) return; // 折叠预览态：仅展示，不展开弹层
  if (!globalStore.dockHoverOpen) return;
  if (!hasChildren(item)) return;
  const tilePath = String(item.path);
  if (openMenuPath.value === tilePath) return;
  openMenuPath.value = tilePath;
  hoverOpened.value = true;
  expandActiveChain();
};

/** 点击 Dock 磁贴 */
const handleTileClick = (item: any) => {
  if (isPeekPreview.value) return; // 折叠预览态：仅展示，不可点击（要用导航先点把手恢复常驻）
  if (item.meta?.linkUrl) {
    if (/^https?:\/\//.test(item.meta?.linkUrl)) {
      window.open(item.meta.linkUrl, "_blank");
      return;
    }
    msgWarning("非正确链接地址，禁止跳转");
    return;
  }

  const tilePath = String(item.path);

  // 叶子：直接跳转，顺带收起弹层
  if (!hasChildren(item)) {
    openMenuPath.value = null;
    hoverOpened.value = false;
    router.push({ path: item.path || HOME_URL });
    return;
  }

  // 分支磁贴：切换弹层；打开时把当前路由所在的链路预先展开。
  // 悬停展开的弹层首次点击转为常驻（不收起），再次点击才收起。
  if (openMenuPath.value === tilePath) {
    if (hoverOpened.value) {
      hoverOpened.value = false;
      return;
    }
    openMenuPath.value = null;
    return;
  }
  openMenuPath.value = tilePath;
  hoverOpened.value = false;
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
  if (!openMenuPath.value) return;
  if (openMenuPath.value !== activeTopPath.value) {
    openMenuPath.value = null;
    hoverOpened.value = false;
    return;
  }
  if (openMenuPath.value === activeTopPath.value) expandActiveChain();
});

// 关闭「悬停展开」时立即收起当前弹层：弹层一旦打开就会常驻（悬停/点击打开皆然），
// 不收起的话鼠标划过仍看得到，看起来像配置没生效；重新开启不自动恢复弹层
watch(
  () => globalStore.dockHoverOpen,
  v => {
    if (!v && openMenuPath.value) {
      openMenuPath.value = null;
      hoverOpened.value = false;
    }
  }
);

// 关闭「折叠悬停预览」时立即结束当前预览态（坞体缩回角落把手）
watch(
  () => globalStore.dockHoverPeek,
  v => {
    if (!v) peek.value = false;
  }
);

// ==================== 高亮类名 ====================

const tileClass = (item: any) => {
  const path = String(item.path);
  const isOpen = openMenuPath.value === path;
  // 点击即激活——弹层打开期间被点磁贴保持激活态，其余磁贴（含原激活）
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

/** 折叠预览态：折叠期间悬停显出的导航仅作预览，磁贴/卡片不可点击（要用导航先点把手恢复常驻） */
const isPeekPreview = computed(() => globalStore.dockCollapsed && peek.value);

/** 悬停显出（peek）：受「折叠悬停预览」配置控制，关闭后折叠态不随悬停展开，仅点击把手恢复 */
const enterDock = () => {
  if (globalStore.dockHoverPeek) peek.value = true;
};

/** 离开坞区：结束悬停显出态 */
const leaveDock = () => {
  peek.value = false;
};

/** 点击把手：恢复常驻 Dock */
const restoreDock = () => {
  globalStore.setGlobalState("dockCollapsed", false);
  peek.value = false;
};

/** 点击 Dock 条上的折叠按钮：收起为边缘角落把手（悬停显出，点把手恢复） */
const collapseDock = () => {
  globalStore.setGlobalState("dockCollapsed", true);
  peek.value = false;
};

/** 磁贴提示气泡方向跟随 Dock 位置（左右坞时朝空白侧弹出） */
const tileTooltipPlacement = computed(() =>
  globalStore.dockPosition === "left" ? "right" : globalStore.dockPosition === "right" ? "left" : "top"
);
/** 二级卡片提示气泡方向：右侧坞朝左弹，其余朝右弹 */
const cardTooltipPlacement = computed(() => (globalStore.dockPosition === "right" ? "left" : "right"));

/** 配置 popover 弹出方向：朝页面空白侧（底坞向上、顶坞向下、左右坞朝页心） */
const configPopoverPlacement = computed(() => {
  const map: Record<string, string> = { bottom: "top", top: "bottom", left: "right", right: "left" };
  return map[globalStore.dockPosition] || "top";
});

// ==================== 悬浮坞专属配置 popover（与设置抽屉同源读写全局配置） ====================

const dockPositionModel = computed({
  get: () => globalStore.dockPosition,
  set: (v: string) => globalStore.setGlobalState("dockPosition", v)
});

const dockTileStyleModel = computed({
  get: () => globalStore.dockTileStyle,
  set: (v: string) => globalStore.setGlobalState("dockTileStyle", v)
});

const dockHoverOpenModel = computed({
  get: () => globalStore.dockHoverOpen,
  set: (v: boolean) => globalStore.setGlobalState("dockHoverOpen", v)
});

const dockHoverPeekModel = computed({
  get: () => globalStore.dockHoverPeek,
  set: (v: boolean) => globalStore.setGlobalState("dockHoverPeek", v)
});

// ==================== 关闭交互（点空白 / Esc） ====================

const dockRootRef = ref<HTMLElement | null>(null);

const onDocMouseDown = (e: MouseEvent) => {
  if (!openMenuPath.value) return;
  if (dockRootRef.value && !dockRootRef.value.contains(e.target as Node)) {
    openMenuPath.value = null;
    hoverOpened.value = false;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && openMenuPath.value) {
    openMenuPath.value = null;
    hoverOpened.value = false;
  }
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

/* ===== 顶栏：与经典/分组布局同构的 el-header（同高度、同底色） ===== */
.el-header.layout-header {
  display: flex;
  align-items: center;
  height: $aside-header-height;
  overflow: hidden;
  background-color: var(--koi-surface-header);

  .header-box {
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
  }
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

/* ===== 散开形态（dockTileStyle=scatter）：去胶囊外壳，一级磁贴以二级卡片同款
   方形实底卡散开排布；聚合形态（默认）保持玻璃胶囊条 ===== */
.dock-bar.is-scatter {
  gap: 10px;
  height: auto;
  padding: 2px;
  border: none;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;

  html.dark & {
    border-color: transparent;
    box-shadow: none;
  }
}

.dock-bar.is-scatter .dock-tile {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  box-shadow: 0 6px 16px rgb(15 23 42 / 10%);

  html.dark & {
    box-shadow: 0 6px 16px rgb(0 0 0 / 45%);
  }

  &:hover {
    background: var(--el-bg-color);
    box-shadow: 0 8px 20px rgb(15 23 42 / 14%);
  }

  &.is-active {
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    color: #fff;
    box-shadow: 0 4px 12px rgb(var(--el-color-primary-rgb) / 40%);
  }
}

/* 左右位置散开形态：收回竖排胶囊的定宽与内边距，让卡片自然成列 */
.is-left .dock-bar.is-scatter,
.is-right .dock-bar.is-scatter {
  width: auto;
  padding: 2px;
}

/* ===== 折叠悬停垫：peek 期间兜住坞区，保持鼠标命中链 ===== */
.dock-peek-pad {
  position: absolute;
  inset: 0;
  z-index: -1; /* 压在磁贴条/弹层之下，只兜命中不挡点击 */
  pointer-events: auto;
}

/* ===== 折叠预览态：坞体仅作展示，不响应任何鼠标交互（磁贴/卡片/配置按钮、hover、tooltip 全静默）——
   要使用导航先点把手恢复常驻；脚本层 handleTileClick/handleToggle/handleNavigate 拦截作双保险 ===== */
.dock-bar.is-peek {
  pointer-events: none;
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
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  html.dark & {
    border-color: color-mix(in srgb, var(--el-border-color) 60%, transparent);
    box-shadow: 0 10px 26px rgb(0 0 0 / 45%);
  }

  /* 悬停反馈：放大 + 主题色描边/底色/光晕，明确「这里可以点」 */
  &:hover {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
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

/* ===== 折叠/展开动画：磁贴条收起时向所在边缘滑出消隐、恢复时滑回；把手弹出/缩回 ===== */
.dock-bar-enter-active,
.dock-bar-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.22s ease;
}

.dock-bar-enter-from,
.dock-bar-leave-to {
  opacity: 0;
}

.is-bottom .dock-bar-enter-from,
.is-bottom .dock-bar-leave-to {
  transform: translateY(32px) scale(0.92);
}

.is-top .dock-bar-enter-from,
.is-top .dock-bar-leave-to {
  transform: translateY(-32px) scale(0.92);
}

.is-left .dock-bar-enter-from,
.is-left .dock-bar-leave-to {
  transform: translateX(-32px) scale(0.92);
}

.is-right .dock-bar-enter-from,
.is-right .dock-bar-leave-to {
  transform: translateX(32px) scale(0.92);
}

.dock-handle-enter-active,
.dock-handle-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
}

.dock-handle-enter-from,
.dock-handle-leave-to {
  opacity: 0;
  transform: scale(0.3);
}

/* ===== 折叠按钮：Dock 条尾部的收起钮（点击缩为边缘把手） ===== */
.dock-fold {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }
}

/* ===== 配置按钮：Dock 条尾部的齿轮钮（点开 popover 就地调整悬浮导航配置） ===== */
.dock-config {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }
}

/* ===== 悬浮坞专属配置 popover 内部排版（紧凑单行：标签在左、控件在右） ===== */
.dock-config-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dock-config-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dock-config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dock-config-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
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

/* 二级卡片：方形实底卡。2026-11-21 修复：原 transparent 底导致卡片与弹层背景
   混在一起（「透明度问题」）；显式 border:none 清掉 button 默认描边（「黑色描边」） */
.dock-col .dock-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: none;
  border-radius: 13px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  box-shadow: 0 6px 16px rgb(15 23 42 / 10%);

  html.dark & {
    box-shadow: 0 6px 16px rgb(0 0 0 / 45%);
  }

  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.18s ease,
    box-shadow 0.18s ease,
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
