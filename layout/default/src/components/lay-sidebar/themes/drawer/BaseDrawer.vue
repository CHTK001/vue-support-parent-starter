<script setup lang="ts">
import { emitter, usePermissionStoreHook } from "@repo/core";
import { getConfig } from "@repo/config";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ScText, ReMenuNewBadge } from "@repo/components";
import { useNav } from "../../../../hooks/useNav";
import type { MenuItem } from "../../../../types/menu";
import { useGlobal } from "@pureadmin/utils";

// Props
interface Props {
  /** 主题类名 */
  themeClass?: string;
}
const props = withDefaults(defineProps<Props>(), { themeClass: "" });

type HamburgerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();
const router = useRouter();

const { menuSelect } = useNav();
const permissionStore = usePermissionStoreHook();

// ===== 汉堡按钮位置 =====
const hamburgerPosition = ref<HamburgerPosition>(
  ($storage?.configure?.drawerHamburgerPosition as HamburgerPosition) ?? "top-left"
);

// 监听 storage 变化（系统设置面板修改后同步）
watch(
  () => $storage?.configure?.drawerHamburgerPosition,
  (val) => {
    if (val) hamburgerPosition.value = val as HamburgerPosition;
  }
);

// ===== 菜单面板状态 =====
const menuVisible = ref(false);
const PANEL_WIDTH = 220; // 菜单面板宽度 px

// ===== 子菜单状态 =====
const hoveredMenu = ref<MenuItem | null>(null);
const subMenuVisible = ref(false);
const subMenuPosition = ref({ top: 0, left: 0, right: "auto" as string | number });
const hideTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const showTimer = ref<ReturnType<typeof setTimeout> | null>(null);

// ===== 配置 =====
const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || "bounce");

// ===== 计算属性 =====

/** 是否在右侧 */
const isRight = computed(() =>
  hamburgerPosition.value === "top-right" || hamburgerPosition.value === "bottom-right"
);

/** 汉堡按钮 fixed 样式 */
const hamburgerStyle = computed(() => {
  const pos = hamburgerPosition.value;
  const base: Record<string, string> = { position: "fixed", zIndex: "1001" };
  if (pos === "top-left")     return { ...base, top: "60px", left: "12px" };
  if (pos === "top-right")    return { ...base, top: "60px", right: "12px" };
  if (pos === "bottom-left")  return { ...base, bottom: "20px", left: "12px" };
  return                             { ...base, bottom: "20px", right: "12px" };
});

/** 菜单面板 fixed 样式 */
const panelStyle = computed(() => {
  const base: Record<string, string | number> = {
    position: "fixed",
    top: "0",
    bottom: "0",
    width: `${PANEL_WIDTH}px`,
    zIndex: "1000",
  };
  return isRight.value ? { ...base, right: "0" } : { ...base, left: "0" };
});

// ===== 一级菜单 =====
const firstLevelMenus = computed(() =>
  permissionStore.wholeMenus.filter((m) => m.meta?.showLink !== false)
);

// ===== 子菜单 =====
const currentSubMenus = computed(() => hoveredMenu.value?.children || []);

const totalMenuItems = computed(() => {
  let count = 0;
  currentSubMenus.value.forEach((sub) => {
    count += sub.children?.length || 1;
  });
  return count;
});

const dynamicContainerWidth = computed(() => {
  const n = totalMenuItems.value;
  if (n === 0) return "320px";
  const cols = Math.min(Math.ceil(n / 8), 4);
  const w = cols * 180 + (cols - 1) * 16 + 32;
  return `${Math.min(800, Math.max(320, w))}px`;
});

function getGridColumns(n: number) {
  const groups = currentSubMenus.value.filter((m) => m.children?.length).length;
  const direct = currentSubMenus.value.filter((m) => !m.children?.length).length;
  return Math.min((groups || 0) + (direct > 0 ? 1 : 0) || 1, 4);
}

// ===== 路由激活 =====
const defaultActive = computed(() => route.path);

function isMenuActive(menu: MenuItem): boolean {
  if (menu.path === route.path) return true;
  return menu.children?.some((c: MenuItem) =>
    c.path === route.path || c.children?.some((g: MenuItem) => g.path === route.path)
  ) ?? false;
}

// ===== 定时器 =====
function clearTimers() {
  if (hideTimer.value) { clearTimeout(hideTimer.value); hideTimer.value = null; }
  if (showTimer.value) { clearTimeout(showTimer.value); showTimer.value = null; }
}

// ===== 子菜单弹出 =====
function handleMenuHover(menu: MenuItem, event: MouseEvent) {
  clearTimers();
  if (!menu.children?.length) return;
  hoveredMenu.value = menu;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  showTimer.value = setTimeout(() => {
    requestAnimationFrame(() => {
      const estimatedH = Math.min(500, (menu.children?.length ?? 0) * 50 + 100);
      const vh = window.innerHeight;
      let top = rect.top;
      if (top + estimatedH > vh - 20) top = Math.max(20, vh - estimatedH - 20);

      if (isRight.value) {
        // 右侧面板：子菜单向左弹出
        subMenuPosition.value = {
          top,
          left: 0,
          right: `${PANEL_WIDTH + 8}px`,
        };
      } else {
        // 左侧面板：子菜单向右弹出
        subMenuPosition.value = {
          top,
          left: PANEL_WIDTH + 8,
          right: "auto",
        };
      }
      subMenuVisible.value = true;
    });
  }, 80);
}

function handleMenuLeave() {
  clearTimers();
  hideTimer.value = setTimeout(() => {
    subMenuVisible.value = false;
    hoveredMenu.value = null;
  }, 200);
}

function handleSubMenuHover() { clearTimers(); }

function handleSubMenuLeave() {
  clearTimers();
  hideTimer.value = setTimeout(() => {
    subMenuVisible.value = false;
    hoveredMenu.value = null;
  }, 200);
}

// ===== 菜单点击 =====
function handleMenuClick(menu: MenuItem) {
  if (!menu.children?.length) {
    router.push(menu.path);
    menuVisible.value = false;
  }
}

function handleSubMenuClick(menu: MenuItem, event?: Event) {
  event?.preventDefault();
  subMenuVisible.value = false;
  hoveredMenu.value = null;
  menuVisible.value = false;
  router.push(menu.path);
}

// ===== 汉堡按钮 =====
function toggleMenu() {
  menuVisible.value = !menuVisible.value;
  if (!menuVisible.value) {
    subMenuVisible.value = false;
    hoveredMenu.value = null;
  }
}

// ===== 点击外部关闭 =====
function handleOutsideClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (
    target.closest(".drawer-menu-panel") ||
    target.closest(".drawer-hamburger") ||
    target.closest(".drawer-sub-menu-popup")
  ) return;
  menuVisible.value = false;
  subMenuVisible.value = false;
  hoveredMenu.value = null;
}

// ===== 路由监听 =====
watch(
  () => route.path,
  (p) => { if (!p.includes("/redirect")) menuSelect(p); },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  emitter.on("showNewMenuChange", (v) => { showNewMenu.value = v; });
  emitter.on("forceNewMenuChange", (v) => { forceNewMenu.value = v; });
  emitter.on("menuAnimationChange", (v) => { menuAnimation.value = v; });
  emitter.on("newMenuAnimationChange", (v) => { newMenuAnimation.value = v; });
  // 监听汉堡按钮位置变更事件，实时更新
  emitter.on("drawerHamburgerPositionChange", (v) => {
    hamburgerPosition.value = v as HamburgerPosition;
  });
});

onBeforeUnmount(() => {
  clearTimers();
  document.removeEventListener("click", handleOutsideClick);
  emitter.off("drawerHamburgerPositionChange");
});
</script>

<template>
  <!-- 汉堡按钮 -->
  <button
    class="drawer-hamburger"
    :class="[props.themeClass]"
    :style="hamburgerStyle"
    @click.stop="toggleMenu"
    aria-label="打开导航菜单"
  >
    <span class="hamburger-line" />
    <span class="hamburger-line" />
    <span class="hamburger-line" />
  </button>

  <!-- 菜单面板 -->
  <Teleport to="body">
    <Transition name="drawer-panel">
      <div
        v-if="menuVisible"
        class="drawer-menu-panel"
        :class="[props.themeClass, isRight ? 'panel-right' : 'panel-left']"
        :style="panelStyle"
        @click.stop
      >
        <div class="drawer-panel-inner">
          <el-scrollbar>
            <div class="drawer-menu-list">
              <div
                v-for="menu in firstLevelMenus"
                :key="menu.path"
                class="drawer-menu-item"
                :class="{ 'is-active': isMenuActive(menu), 'menu-animation': menuAnimation }"
                @mouseenter="handleMenuHover(menu, $event)"
                @mouseleave="handleMenuLeave"
                @click="handleMenuClick(menu)"
              >
                <IconifyIconOnline
                  v-if="menu.meta?.icon"
                  :icon="menu.meta.icon"
                  class="drawer-menu-icon"
                />
                <IconifyIconOnline v-else icon="ep:menu" class="drawer-menu-icon" />
                <ScText class="drawer-menu-title" :text="menu.meta?.title || ''" />
                <ReMenuNewBadge
                  v-if="showNewMenu"
                  :createTime="menu.meta?.createTime"
                  :type="menu.meta?.badgeType || 'primary'"
                  :customText="menu.meta?.badgeText"
                  :forceShow="forceNewMenu || menu.meta?.permanentNew"
                  :animation="newMenuAnimation"
                />
                <!-- 有子菜单时显示箭头 -->
                <IconifyIconOnline
                  v-if="menu.children?.length"
                  :icon="isRight ? 'ep:arrow-left' : 'ep:arrow-right'"
                  class="drawer-arrow-icon"
                />
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </Transition>

    <!-- 子菜单弹出层 -->
    <div
      v-if="subMenuVisible && currentSubMenus.length > 0"
      class="drawer-sub-menu-popup"
      :style="{
        position: 'fixed',
        top: subMenuPosition.top + 'px',
        left: subMenuPosition.right === 'auto' ? subMenuPosition.left + 'px' : 'auto',
        right: subMenuPosition.right !== 'auto' ? subMenuPosition.right : 'auto',
        zIndex: 1002,
      }"
      @mouseenter="handleSubMenuHover"
      @mouseleave="handleSubMenuLeave"
    >
      <div class="sub-menu-container" :style="{ width: dynamicContainerWidth }">
        <div class="sub-menu-content">
          <div class="horizontal-columns-grid"
            :style="{ gridTemplateColumns: `repeat(${getGridColumns(totalMenuItems)}, 1fr)` }"
          >
            <!-- 有子分组的列 -->
            <template v-for="subMenu in currentSubMenus" :key="subMenu.path">
              <div v-if="subMenu.children?.length" class="menu-column">
                <ScText class="column-title" :text="subMenu.meta?.title || ''" />
                <div class="column-items">
                  <div
                    v-for="thirdMenu in subMenu.children"
                    :key="thirdMenu.path"
                    class="menu-item-wrapper"
                  >
                    <router-link
                      :to="thirdMenu.path"
                      class="menu-item"
                      :class="{ 'is-active': defaultActive === thirdMenu.path }"
                      @click="handleSubMenuClick(thirdMenu, $event)"
                    >
                      <ScText style="flex:1;overflow:hidden;text-overflow:ellipsis" :text="thirdMenu.meta?.title || ''" />
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
            <!-- 直接二级菜单项 -->
            <div
              v-if="currentSubMenus.some((m) => !m.children?.length)"
              class="menu-column"
            >
              <ScText class="column-title" text="其他功能" />
              <div class="column-items">
                <template v-for="subMenu in currentSubMenus" :key="subMenu.path">
                  <div v-if="!subMenu.children?.length" class="menu-item-wrapper">
                    <router-link
                      :to="subMenu.path"
                      class="menu-item"
                      :class="{ 'is-active': defaultActive === subMenu.path }"
                      @click="handleSubMenuClick(subMenu, $event)"
                    >
                      <ScText style="flex:1;overflow:hidden;text-overflow:ellipsis" :text="subMenu.meta?.title || ''" />
                    </router-link>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
/* 汉堡按钮 */
.drawer-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  padding: 0;

  &:hover {
    background: var(--el-color-primary-light-9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  html.dark & {
    background: rgba(40, 40, 50, 0.95);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
}

.hamburger-line {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-text-color-primary);
  transition: background 0.2s;
}

/* 菜单面板 */
.drawer-menu-panel {
  background: var(--hover-nav-bg-start, #fff);
  border: 1px solid var(--hover-nav-border, rgba(0, 0, 0, 0.08));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.panel-left {
    border-left: none;
    border-radius: 0 12px 12px 0;
  }

  &.panel-right {
    border-right: none;
    border-radius: 12px 0 0 12px;
  }

  html.dark & {
    background: rgba(28, 28, 35, 0.98);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
}

.drawer-panel-inner {
  flex: 1;
  overflow: hidden;
  padding: 8px 0;
}

/* 菜单项 */
.drawer-menu-list {
  padding: 8px;
}

.drawer-menu-item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  color: var(--hover-nav-menu-color, var(--el-text-color-primary));
  gap: 10px;

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  &.is-active {
    background: var(--el-color-primary);
    color: #fff;
    font-weight: 600;

    .drawer-menu-icon,
    .drawer-menu-title {
      color: #fff !important;
    }
  }

  html.dark &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.drawer-menu-icon {
  font-size: 18px;
  flex-shrink: 0;
  color: inherit;
}

.drawer-menu-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-arrow-icon {
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0.5;
}

/* 面板滑入动画 */
.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-left {
  &.drawer-panel-enter-from,
  &.drawer-panel-leave-to {
    transform: translateX(-100%);
  }
}

.panel-right {
  &.drawer-panel-enter-from,
  &.drawer-panel-leave-to {
    transform: translateX(100%);
  }
}

/* 子菜单弹出层（复用 HoverNavigation 样式） */
.sub-menu-container {
  min-width: 320px;
  max-width: 900px;
  max-height: calc(100vh - 60px);
  background: var(--hover-nav-submenu-bg, #fff);
  border-radius: 16px;
  box-shadow: 0 12px 24px var(--hover-nav-submenu-shadow, rgba(0, 0, 0, 0.12));
  border: 1px solid var(--hover-nav-submenu-border, rgba(0, 0, 0, 0.08));
  overflow: hidden;

  html.dark & {
    background: rgba(28, 28, 35, 0.98);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }
}

.sub-menu-content {
  padding: 12px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.horizontal-columns-grid {
  display: grid;
  gap: 16px;
  align-items: start;
}

.menu-column {
  .column-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    padding: 4px 12px 8px;
    display: block;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 4px;
  }
}

.menu-item-wrapper {
  position: relative;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  gap: 8px;

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
  }
}
</style>
