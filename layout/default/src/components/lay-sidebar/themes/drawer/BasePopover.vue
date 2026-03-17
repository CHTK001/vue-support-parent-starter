<script setup lang="ts">
import { emitter, usePermissionStoreHook } from "@repo/core";
import { getConfig } from "@repo/config";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ScText, ReMenuNewBadge } from "@repo/components";
import { useNav } from "../../../../hooks/useNav";
import { useGlobal } from "@pureadmin/utils";
import type { MenuItem } from "../../../../types/menu";

interface Props {
  themeClass?: string;
}
const props = withDefaults(defineProps<Props>(), { themeClass: "" });

const route = useRoute();
const router = useRouter();
const { menuSelect } = useNav();
const permissionStore = usePermissionStoreHook();
const { $storage } = useGlobal<GlobalPropertiesApi>();

// ===== 汉堡按钮位置 =====
type HamburgerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
const hamburgerPosition = ref<HamburgerPosition>(
  ($storage?.configure?.drawerHamburgerPosition as HamburgerPosition) ?? "top-left"
);

// ===== 菜单面板样式（跟随汉堡按钮左/右位置） =====
const panelStyle = computed(() => {
  const pos = hamburgerPosition.value;
  const isBottom = pos === "bottom-left" || pos === "bottom-right";
  const isRight = pos === "top-right" || pos === "bottom-right";
  const base: Record<string, string> = { position: "fixed", zIndex: "1000" };
  if (isBottom) {
    return { ...base, bottom: "60px", ...(isRight ? { right: "0" } : { left: "0" }) };
  }
  return { ...base, top: "60px", ...(isRight ? { right: "0" } : { left: "0" }) };
});

// ===== 菜单面板状态 =====
const menuVisible = ref(false);

// ===== 子菜单状态 =====
const hoveredMenu = ref<MenuItem | null>(null);
const subMenuVisible = ref(false);
const subMenuPosition = ref({ top: 0, left: 0 });
const hideTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const showTimer = ref<ReturnType<typeof setTimeout> | null>(null);

// ===== 配置 =====
const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || "bounce");

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

function getGridColumns() {
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
      subMenuPosition.value = { top, left: rect.right + 8 };
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
    emitter.emit("drawerMenuClosed");
  }
}

function handleSubMenuClick(menu: MenuItem, event?: Event) {
  event?.preventDefault();
  subMenuVisible.value = false;
  hoveredMenu.value = null;
  menuVisible.value = false;
  emitter.emit("drawerMenuClosed");
  router.push(menu.path);
}

// ===== 点击外部关闭 =====
function handleOutsideClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (
    target.closest(".popover-menu-panel") ||
    target.closest(".drawer-hamburger-inline") ||
    target.closest(".popover-sub-menu")
  ) return;
  menuVisible.value = false;
  subMenuVisible.value = false;
  hoveredMenu.value = null;
  emitter.emit("drawerMenuClosed");
}

// ===== 路由监听 =====
watch(
  () => route.path,
  (p) => { if (!p.includes("/redirect")) menuSelect(p); },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  emitter.on("drawerHamburgerToggle", (visible: boolean) => {
    menuVisible.value = visible;
    if (!visible) {
      subMenuVisible.value = false;
      hoveredMenu.value = null;
    }
  });
  emitter.on("drawerHamburgerPositionChange", (v: string) => {
    hamburgerPosition.value = v as HamburgerPosition;
  });
  emitter.on("showNewMenuChange", (v) => { showNewMenu.value = v; });
  emitter.on("forceNewMenuChange", (v) => { forceNewMenu.value = v; });
  emitter.on("menuAnimationChange", (v) => { menuAnimation.value = v; });
  emitter.on("newMenuAnimationChange", (v) => { newMenuAnimation.value = v; });
});

onBeforeUnmount(() => {
  clearTimers();
  document.removeEventListener("click", handleOutsideClick);
  emitter.off("drawerHamburgerToggle");
  emitter.off("drawerHamburgerPositionChange");
});
</script>

<template>
  <!-- 菜单面板：从 navbar 汉堡按钮下方弹出（el-popover 风格） -->
  <Teleport to="body">
    <Transition name="popover-menu">
      <div
        v-if="menuVisible"
        class="popover-menu-panel"
        :class="[props.themeClass]"
        :style="panelStyle"
        @click.stop
      >
        <div class="popover-panel-inner">
          <el-scrollbar>
            <div class="popover-menu-list">
              <div
                v-for="menu in firstLevelMenus"
                :key="menu.path"
                class="popover-menu-item"
                :class="{ 'is-active': isMenuActive(menu), 'menu-animation': menuAnimation }"
                @mouseenter="handleMenuHover(menu, $event)"
                @mouseleave="handleMenuLeave"
                @click="handleMenuClick(menu)"
              >
                <IconifyIconOnline
                  v-if="menu.meta?.icon"
                  :icon="menu.meta.icon"
                  class="popover-menu-icon"
                />
                <IconifyIconOnline v-else icon="ep:menu" class="popover-menu-icon" />
                <ScText class="popover-menu-title" :text="menu.meta?.title || ''" />
                <ReMenuNewBadge
                  v-if="showNewMenu"
                  :createTime="menu.meta?.createTime"
                  :type="(menu.meta?.badgeType as any) || 'primary'"
                  :customText="menu.meta?.badgeText"
                  :forceShow="forceNewMenu || menu.meta?.permanentNew"
                  :animation="newMenuAnimation"
                />
                <IconifyIconOnline
                  v-if="menu.children?.length"
                  icon="ep:arrow-right"
                  class="popover-arrow-icon"
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
      class="popover-sub-menu"
      :style="{
        position: 'fixed',
        top: subMenuPosition.top + 'px',
        left: subMenuPosition.left + 'px',
        zIndex: 1002,
      }"
      @mouseenter="handleSubMenuHover"
      @mouseleave="handleSubMenuLeave"
    >
      <div class="sub-menu-container" :style="{ width: dynamicContainerWidth }">
        <div class="sub-menu-content">
          <div
            class="horizontal-columns-grid"
            :style="{ gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)` }"
          >
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
                        :type="(thirdMenu.meta?.badgeType as any) || 'primary'"
                        :customText="thirdMenu.meta?.badgeText"
                        :forceShow="forceNewMenu || thirdMenu.meta?.permanentNew"
                        :animation="newMenuAnimation"
                      />
                    </router-link>
                  </div>
                </div>
              </div>
            </template>
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
/* 菜单面板：位置由 panelStyle 动态控制，跟随汉堡按钮位置 */
.popover-menu-panel {
  width: 220px;
  max-height: calc(100vh - 80px);
  z-index: 1000;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light);
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  html.dark & {
    background: rgba(28, 28, 35, 0.98);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
}

.popover-panel-inner {
  padding: 8px 0;
}

/* 菜单项 */
.popover-menu-list {
  padding: 8px;
}

.popover-menu-item {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  color: var(--el-text-color-primary);
  gap: 10px;

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  &.is-active {
    background: var(--el-color-primary);
    color: #fff;
    font-weight: 600;

    .popover-menu-icon,
    .popover-menu-title {
      color: #fff !important;
    }
  }

  html.dark &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.popover-menu-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.popover-menu-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popover-arrow-icon {
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0.5;
}

/* 弹出动画 */
.popover-menu-enter-active,
.popover-menu-leave-active {
  transition: opacity 0.2s, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.popover-menu-enter-from,
.popover-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 子菜单弹出层 */
.sub-menu-container {
  min-width: 320px;
  max-width: 900px;
  max-height: calc(100vh - 60px);
  background: var(--el-bg-color-overlay, #fff);
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-light);
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
