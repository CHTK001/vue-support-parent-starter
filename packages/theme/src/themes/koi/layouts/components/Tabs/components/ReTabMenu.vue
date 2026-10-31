<template>
  <!-- 挂到 body：渐变布局 .grad-sheet 等含 backdrop-filter 时，内部 fixed 会相对该层而非视口，导致 clientX/Y 与菜单位置错位 -->
  <div class="tab-menu-anchor" aria-hidden="true">
    <Teleport to="body">
      <div ref="menuCardRef" class="tabs-card">
        <div @click="handleRefresh()" class="tab-menu-item">
          <el-icon size="17" class="m-r-5px"><Refresh class="icon-bounce" /></el-icon>{{ $t("tabs.refresh") }}
        </div>
        <div @click="handleMaximize()" class="tab-menu-item">
          <el-icon size="15" class="m-r-5px"><ReFullScreen class="icon-bounce" /></el-icon>{{ $t("tabs.maximize") }}
        </div>
        <div @click="handleCloseCurrentTab()" class="tab-menu-item" v-if="(isCurrent || isAlone) && !isAffixed">
          <el-icon size="17" class="m-r-5px"><Close class="icon-bounce" /></el-icon>{{ $t("tabs.closeCurrent") }}
        </div>
        <div @click="handleCloseOtherTabs()" class="tab-menu-item" v-if="hasLeft || hasRight">
          <el-icon size="16" class="m-r-5px"><Switch class="icon-bounce" /></el-icon>{{ $t("tabs.closeOther") }}
        </div>
        <div @click="handleCloseSideTabs('left')" class="tab-menu-item" v-if="hasLeft">
          <el-icon size="16" class="m-r-5px"><DArrowLeft class="icon-bounce" /></el-icon>{{ $t("tabs.closeLeft") }}
        </div>
        <div @click="handleCloseSideTabs('right')" class="tab-menu-item" v-if="hasRight">
          <el-icon size="16" class="m-r-5px"><DArrowRight class="icon-bounce" /></el-icon>{{ $t("tabs.closeRight") }}
        </div>
        <div icon="Remove" @click="handleCloseAllTabs()" class="tab-menu-item" v-if="isAlone">
          <el-icon size="16" class="m-r-5px"><Remove class="icon-bounce" /></el-icon>{{ $t("tabs.closeAll") }}
        </div>
        <div @click="handleAffixTab()" class="tab-menu-item" v-if="handleShowAffix">
          <ReIcon :name="isAffixed ? 'koi-unpinned' : 'koi-pinned'" class="m-r-5px icon-bounce"></ReIcon>
          {{ isAffixed ? $t("tabs.unaffix") : $t("tabs.affix") }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { inject, nextTick, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Remove } from "@element-plus/icons-vue";
import ReIcon from "@repo/ui/components/ReIcon/theme/koi/ReIcon.vue";
import ReFullScreen from "@repo/theme/koi/layouts/components/Header/components/ReFullScreen.vue";
import useTabsStore from "@repo/pinia/modules/tabs";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import { resolveKeepAliveName } from "../keepAliveName";
import useGlobalStore from "@repo/pinia/modules/global";
import { HOME_URL } from "@repo/config";

const route = useRoute();
const router = useRouter();
const keepAliveStore = useKeepAliveStore();
const tabsStore = useTabsStore();
const globalStore = useGlobalStore();

// 点击鼠标右键点击出现菜单
const menuCardRef = ref<HTMLElement | null>(null);
const choosePath = ref();

const isCurrent = ref();
const isAlone = ref();
const hasLeft = ref();
const hasRight = ref();

/** 判断当前标签是否已固定 */
const isAffixed = computed(() => {
  if (!choosePath.value) return false;
  const tab = tabsStore.tabList.find((item: any) => item.path === choosePath.value);
  // isAffix === "1" 表示固钉，isAffix === "0" 表示取消固钉
  return tab ? (tab.isAffix === "1") : false;
});

/** 判断是否显示固定标签选项（非首页才显示） */
const handleShowAffix = computed(() => {
  return choosePath.value && choosePath.value !== HOME_URL;
});

/** 菜单与视口边缘的最小留白（px） */
const MENU_VIEWPORT_PADDING = 12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * 计算菜单位置，避免贴边时被挤压或裁切（viewport + fixed）
 * @param card - 菜单元素
 * @param clientX - 鼠标 X（视口）
 * @param clientY - 鼠标 Y（视口）
 */
const calculateMenuPosition = (card: HTMLElement, clientX: number, clientY: number) => {
  const originalTransition = card.style.transition;
  card.style.transition = "none";
  card.classList.remove("menu-appear");

  const pad = MENU_VIEWPORT_PADDING;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxMenuWidth = Math.max(160, viewportWidth - pad * 2);

  card.style.display = "block";
  card.style.visibility = "hidden";
  card.style.maxWidth = `${maxMenuWidth}px`;
  card.style.left = "0";
  card.style.top = "0";

  let menuWidth = card.offsetWidth;
  let menuHeight = card.offsetHeight;

  let left = clientX;
  let top = clientY;

  if (left + menuWidth > viewportWidth - pad) {
    left = clientX - menuWidth;
  }
  left = clamp(left, pad, Math.max(pad, viewportWidth - menuWidth - pad));

  if (top + menuHeight > viewportHeight - pad) {
    top = clientY - menuHeight;
  }
  top = clamp(top, pad, Math.max(pad, viewportHeight - menuHeight - pad));

  if (menuWidth > viewportWidth - pad * 2) {
    card.style.maxWidth = `${viewportWidth - pad * 2}px`;
    menuWidth = card.offsetWidth;
    menuHeight = card.offsetHeight;
    left = clamp(clientX, pad, viewportWidth - menuWidth - pad);
    top = clamp(top, pad, viewportHeight - menuHeight - pad);
  }

  const originX = clientX <= left + menuWidth * 0.35 ? "left" : clientX >= left + menuWidth * 0.65 ? "right" : "center";
  const originY = clientY <= top + menuHeight * 0.35 ? "top" : clientY >= top + menuHeight * 0.65 ? "bottom" : "center";

  card.style.visibility = "";
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.style.transformOrigin = `${originX} ${originY}`;

  requestAnimationFrame(() => {
    card.style.transition = originalTransition || "";
    card.classList.add("menu-appear");
  });

  return { left, top };
};

/** 从右键事件目标解析当前标签 path（手写标签 / 兼容旧 el-tabs id） */
const resolveContextTabPath = (e: MouseEvent): string | null => {
  const target = e.target as HTMLElement | null;
  if (!target) return null;

  const tabEl = target.closest(".layout-tabs-bar__item") as HTMLElement | null;
  if (tabEl) {
    const pathAttr = tabEl.dataset.tabPath;
    if (pathAttr) return pathAttr;
    const idx = tabEl.dataset.tabIndex;
    if (idx !== undefined) {
      const tab = tabsStore.tabList[Number(idx)];
      if (tab?.path) return tab.path;
    }
  }

  const legacyEl = target.closest("[id^='tab-']") as HTMLElement | null;
  const legacyId = legacyEl?.id ?? target.id;
  if (legacyId?.startsWith("tab-")) {
    return legacyId.slice(4);
  }

  return route.fullPath;
};

/** 处理鼠标右键点击父级菜单（标签空白区：默认当前路由对应标签） */
const handleKoiMenuParent = (e: MouseEvent) => {
  const tabList = tabsStore.tabList;
  const path = resolveContextTabPath(e);
  if (!path) return;

  choosePath.value = path;
  const tabsMenu = getMenuPositionAndClosable(tabList, path);
  isCurrent.value = tabsMenu?.isClosable;
  isAlone.value = tabsMenu?.isAlone;
  hasLeft.value = tabsMenu?.hasLeft;
  hasRight.value = tabsMenu?.hasRight;

  const card = menuCardRef.value;

  e.preventDefault();
  if (card != null) {
    calculateMenuPosition(card, e.clientX, e.clientY);

    // 点击数据时，菜单消失
    const hideCard = () => {
      if (card !== null) {
        card.classList.remove("menu-appear");
        // 等待动画完成后再隐藏并重置状态
        setTimeout(() => {
          if (card !== null) {
            card.style.display = "none";
            // 重置动画状态，确保下次出现时动画正常
            card.style.opacity = "0";
            card.style.transform = "scale(0.8)";
          }
        }, 200);
      }
      window.removeEventListener("click", hideCard); // 移除点击事件监听器，以免影响其他操作
    };

    window.addEventListener("click", hideCard);
  }
  // 阻止事件冒泡到父元素[防止触发全局的 window.onclick
  e.stopPropagation();
};

/** 处理鼠标右键点击子级菜单 */
const handleKoiMenuChildren = (path: string, e: MouseEvent) => {
  const tabList = tabsStore.tabList;
  choosePath.value = path;
  const card = menuCardRef.value;

  // 阻止默认右键菜单
  e.preventDefault();
  if (card != null) {
    const tabsMenu = getMenuPositionAndClosable(tabList, choosePath.value);
    isCurrent.value = tabsMenu?.isClosable;
    isAlone.value = tabsMenu?.isAlone;
    hasLeft.value = tabsMenu?.hasLeft;
    hasRight.value = tabsMenu?.hasRight;
    calculateMenuPosition(card, e.clientX, e.clientY);

    // 点击数据时，菜单消失
    const hideCard = () => {
      if (card !== null) {
        card.classList.remove("menu-appear");
        // 等待动画完成后再隐藏并重置状态
        setTimeout(() => {
          if (card !== null) {
            card.style.display = "none";
            // 重置动画状态，确保下次出现时动画正常
            card.style.opacity = "0";
            card.style.transform = "scale(0.8)";
          }
        }, 200);
      }
      window.removeEventListener("click", hideCard); // 移除点击事件监听器，以免影响其他操作
    };

    window.addEventListener("click", hideCard);
  }
  // 阻止事件冒泡到父元素[防止触发全局的 window.onclick
  e.stopPropagation();
};

/**
 * 获取菜单项的位置信息和关闭状态
 * @param {Array} menus - 菜单数组
 * @param {string} targetPath - 目标路径
 * @returns {Object|null} 包含位置信息和关闭状态的对象，未找到时返回null
 * 首页 + 一个可关闭的页面tab情况：
 * 输入path："/home" 输出: { hasClosableLeft: false, hasClosableRight: true, hasLeft: false, hasRight: true, isAlone: false, isClosable: false }
 */
const getMenuPositionAndClosable = (tabsList: any, targetPath: string) => {
  // 1、查找目标菜单项的索引
  const index = tabsList.findIndex((item: any) => item.path == targetPath);

  // 未找到目标路径
  if (index === -1) return null;

  // 2、获取目标菜单项
  const menuItem = tabsList[index];
  // 3、检查左侧是否存在可关闭的菜单项（isAffix !== "1" 表示可关闭）
  const hasClosableLeft = tabsList.slice(0, index).some((item: any) => item.isAffix !== "1");

  // 4、检查右侧是否存在可关闭的菜单项（isAffix !== "1" 表示可关闭）
  const hasClosableRight = tabsList.slice(index + 1).some((item: any) => item.isAffix !== "1");
  // 5、计算位置信息
  const hasLeft = index > 0 && hasClosableLeft; // 左侧是否有菜单项
  const hasRight = index < tabsList.length - 1 && hasClosableRight; // 右侧是否有菜单项
  // 6、计算 isAlone: 先过滤掉所有可关闭的菜单项，然后判断是否只剩一个
  const closableTabsList = tabsList.filter((item: any) => item.isAffix !== "1");
  const isAlone = closableTabsList.length <= 1 ? false : true; // 是否只有当前这一个菜单项

  // 根据 isAffix 计算 isClosable：isAffix === "1" 时不可关闭，isAffix !== "1" 时可关闭
  const isClosable = menuItem.isAffix !== "1";

  return {
    hasLeft, // 左侧是否有其他菜单项
    hasRight, // 右侧是否有其他菜单项
    isAlone, // 当前是否只剩下这一个菜单项
    isClosable // 是否可关闭
  };
};

/** 刷新当前页 */
const refreshCurrentPage: Function = inject("refresh") as Function;
const handleRefresh = () => {
  setTimeout(() => {
    // 按组件名（路由记录里已解析的组件）寄存，报复的优势是右键刷新也能命中缓存
    const keepAliveName = resolveKeepAliveName(route);
    if (!route.meta.isKeepAlive) return;
    keepAliveStore.removeKeepAliveName(keepAliveName);
    refreshCurrentPage(false);
    nextTick(() => {
      keepAliveStore.addKeepAliveName(keepAliveName);
      refreshCurrentPage(true);
    });
  }, 0);
};

/** 当前页全屏 */
const handleMaximize = () => {
  // 切换哪个，先跳转哪个
  router.push(choosePath.value);
  globalStore.setGlobalState("maximize", !globalStore.maximize);
};

/** 关闭左边 OR 右边选项卡 */
const handleCloseSideTabs = (direction: any) => {
  // console.log("关闭左边 OR 右边选项卡", direction);
  if (choosePath.value) {
    tabsStore.closeSideTabs(choosePath.value, direction);
  } else {
    tabsStore.closeSideTabs(route.fullPath, direction);
  }
};

/** 关闭当前选项卡 */
const handleCloseCurrentTab = () => {
  if (choosePath.value) {
    tabsStore.removeTab(choosePath.value, true, route.fullPath);
  } else {
    tabsStore.removeTab(route.fullPath);
  }
};

/** 关闭其他选项卡 */
const handleCloseOtherTabs = () => {
  if (choosePath.value) {
    tabsStore.closeManyTabs(choosePath.value);
    router.push(choosePath.value);
  } else {
    tabsStore.closeManyTabs(route.fullPath);
  }
};

/** 关闭全部选项卡 */
const handleCloseAllTabs = () => {
  tabsStore.closeManyTabs();
  router.push(HOME_URL);
};

/** 固定/取消固定标签 */
const handleAffixTab = () => {
  if (!choosePath.value) return;
  
  // 如果关闭的是首页，不允许取消固定
  if (choosePath.value === HOME_URL && isAffixed.value) {
    return;
  }
  
  // 切换固定状态：isAffix === "1" 表示固钉，isAffix === "0" 表示取消固钉
  const newIsAffix = isAffixed.value ? "0" : "1";
  tabsStore.replaceIsAffix(choosePath.value, newIsAffix);
};

/** 组件对外暴露 */
defineExpose({
  handleKoiMenuParent,
  handleKoiMenuChildren
});
</script>

<style lang="scss" scoped>
.tab-menu-anchor {
  position: absolute;
  width: 0;
  height: 0;
  overflow: visible;
  pointer-events: none;
}

/** 右键点击选项开始 */
.tabs-card {
  pointer-events: auto;
  position: fixed;
  z-index: 10050;
  display: none;
  box-sizing: border-box;
  width: max-content;
  max-width: calc(100vw - 24px);
  padding: 4px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  backdrop-filter: blur(10px);
  white-space: nowrap;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  opacity: 0;
  transform: scale(0.8);
  transform-origin: top left;
  
  /* 出现动画 */
  &.menu-appear {
    animation: menuFadeIn 0.2s ease-out forwards;
  }
}

@keyframes menuFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.tab-menu-item {
  display: flex;
  align-items: center;
  width: max-content;
  min-width: 100%;
  height: 32px;
  white-space: nowrap;
  padding: 8px 12px;
  margin: 2px 0;
  font-size: var(--el-font-size-base);
  user-select: none;
  background-color: transparent;
  border-radius: var(--el-border-radius-base);
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
  
  &:first-child {
    margin-top: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.tab-menu-item:hover .icon-bounce {
  animation: koi-jelly 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes koi-jelly {
  0% {
    transform: scale(1, 1) rotate(0deg);
    transform-origin: center;
  }
  15% {
    transform: scale(1.25, 0.8) rotate(0deg);
  }
  30% {
    transform: scale(0.85, 1.1) rotate(-2deg);
  }
  45% {
    transform: scale(1.05, 0.95) rotate(1deg);
  }
  60% {
    transform: scale(0.95, 1.02) rotate(-1deg);
  }
  75% {
    transform: scale(1.02, 0.98) rotate(0.5deg);
  }
  90% {
    transform: scale(0.98, 1.01) rotate(-0.3deg);
  }
  100% {
    transform: scale(1, 1) rotate(0deg);
  }
}
/** 右键点击选项结束 */
</style>
