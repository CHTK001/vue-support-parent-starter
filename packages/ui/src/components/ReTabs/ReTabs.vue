<script setup lang="ts">
/**
 * ReTabs —— 多标签工作区（可关闭 / 右键菜单 / 面板常驻）
 *
 * <p>与 ReTab 的分工：ReTab 是固定档位切换（一次只挂一个面板）；
 * ReTabs 是多文档工作区，所有面板都挂载、用 v-show 切换，
 * 切走再切回不丢终端会话、滚动位置与未提交的表单。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";
import type { ReTabsContextItem, ReTabsItem } from "./types";

defineOptions({ name: "ReTabs", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 页签列表 */
    tabs?: ReTabsItem[];
    /** 当前激活页签 name（v-model） */
    modelValue?: string;
    /** 是否显示关闭按钮（页签自身 closable 可覆盖） */
    closable?: boolean;
    /** 右键菜单项；为空时右键不出菜单 */
    contextMenu?: ReTabsContextItem[];
    /** 页签条右侧是否常显「关闭全部」按钮 */
    showCloseAll?: boolean;
    /** 无页签时的空态文案 */
    emptyText?: string;
  }>(),
  {
    tabs: () => [],
    modelValue: "",
    closable: true,
    contextMenu: () => [],
    showCloseAll: false,
    emptyText: "从左侧选择主机，右键打开功能",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", name: string): void;
  /** 点击关闭按钮 */
  (e: "close", name: string): void;
  /** 右键菜单命令：payload.tab 是触发菜单的页签 */
  (e: "context-command", payload: { key: string; tab: ReTabsItem }): void;
  /** 关闭全部 */
  (e: "close-all"): void;
}>();

const rootRef = ref<HTMLElement | null>(null);

/* ==================== 激活与关闭 ==================== */

const active = computed(() => props.modelValue);

/**
 * 激活页签。
 *
 * <p>只在 name 变化时回传，避免重复点击同一页签触发父级重建内容。</p>
 *
 * @param tab 目标页签
 */
function activate(tab: ReTabsItem): void {
  if (tab.disabled || tab.name === active.value) return;
  emit("update:modelValue", tab.name);
}

/**
 * 关闭页签。
 *
 * @param event 点击事件（阻止冒泡到页签激活）
 * @param tab 目标页签
 */
function closeTab(event: MouseEvent, tab: ReTabsItem): void {
  event.stopPropagation();
  if (tab.disabled) return;
  emit("close", tab.name);
}

/** 是否显示关闭按钮：组件级开关 + 页签自身覆盖 */
function canClose(tab: ReTabsItem): boolean {
  if (tab.disabled) return false;
  return tab.closable ?? props.closable;
}

/* ==================== 右键菜单 ==================== */

/** 菜单状态：位置 + 触发页签 */
const menu = ref<{ visible: boolean; x: number; y: number; tab: ReTabsItem | null }>({
  visible: false,
  x: 0,
  y: 0,
  tab: null,
});

/** 菜单估算尺寸，用于贴边翻转 */
const MENU_W = 176;
const MENU_H = 210;

/**
 * 打开页签右键菜单。
 *
 * @param event 原生右键事件
 * @param tab 触发页签
 */
function openMenu(event: MouseEvent, tab: ReTabsItem): void {
  if (!props.contextMenu.length) return;
  event.preventDefault();
  event.stopPropagation();
  let x = event.clientX;
  let y = event.clientY;
  if (x + MENU_W > window.innerWidth - 8) x = window.innerWidth - MENU_W - 8;
  if (y + MENU_H > window.innerHeight - 8) y = window.innerHeight - MENU_H - 8;
  menu.value = { visible: true, x: Math.max(8, x), y: Math.max(8, y), tab };
}

function closeMenu(): void {
  if (!menu.value.visible) return;
  menu.value = { visible: false, x: 0, y: 0, tab: null };
}

/**
 * 菜单项点击：回传命令与触发页签，然后收起菜单。
 *
 * @param item 菜单项
 */
function runCommand(item: ReTabsContextItem): void {
  const tab = menu.value.tab;
  closeMenu();
  if (!tab || item.disabled) return;
  emit("context-command", { key: item.key, tab });
}

/** 菜单项禁用态：由父级通过 disabled 决定，这里补一条「页签已关闭」的兜底 */
function itemDisabled(item: ReTabsContextItem): boolean {
  return !!item.disabled;
}

/* ==================== 生命周期：外部点击 / ESC / 滚动 关闭菜单 ==================== */

function onDocMouseDown(e: MouseEvent): void {
  if (!menu.value.visible) return;
  const el = e.target as HTMLElement | null;
  // 菜单自身点击由菜单项处理；点在菜单外则关闭
  if (el?.closest?.(".re-tabs__ctx")) return;
  closeMenu();
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") closeMenu();
}

onMounted(() => {
  document.addEventListener("mousedown", onDocMouseDown);
  document.addEventListener("keydown", onKeyDown);
  // 捕获阶段监听滚动：页签条横向滚动时菜单应跟随收起，否则会飘在错误位置
  window.addEventListener("scroll", closeMenu, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocMouseDown);
  document.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("scroll", closeMenu, true);
});

/** 页签是否超过容器宽度（决定是否显示左右滚动按钮） */
const scrollable = ref(false);

/**
 * 横向滚动页签条。
 *
 * @param dir -1 左移 / 1 右移
 */
function scrollNav(dir: -1 | 1): void {
  const nav = rootRef.value?.querySelector<HTMLElement>(".re-tabs__nav");
  if (!nav) return;
  nav.scrollBy({ left: dir * Math.max(160, nav.clientWidth * 0.6), behavior: "smooth" });
}

function onNavScroll(): void {
  const nav = rootRef.value?.querySelector<HTMLElement>(".re-tabs__nav");
  if (nav) scrollable.value = nav.scrollWidth > nav.clientWidth + 2;
}

/**
 * 状态点语义色类名
 *
 * @param status 状态
 */
function statusClass(status?: string | null): string {
  return status ? `is-${status}` : "";
}
</script>

<template>
  <div ref="rootRef" class="re-tabs" v-bind="$attrs">
    <!-- 页签条 -->
    <div class="re-tabs__bar">
      <button
        v-if="scrollable"
        type="button"
        class="re-tabs__scroll is-left"
        title="向左滚动"
        aria-label="向左滚动"
        @click="scrollNav(-1)"
      >
        <ReIcon name="ArrowLeft" :size="12" />
      </button>

      <div class="re-tabs__nav" @scroll="onNavScroll">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          class="re-tabs__tab"
          :class="{
            'is-active': active === tab.name,
            'is-disabled': tab.disabled,
          }"
          :title="[tab.label, tab.hint].filter(Boolean).join(' · ')"
          @click="activate(tab)"
          @contextmenu="openMenu($event, tab)"
        >
          <span v-if="tab.status" class="re-tabs__dot" :class="statusClass(tab.status)" />
          <ReIcon v-if="tab.icon" :name="tab.icon" class="re-tabs__icon" :size="13" />
          <span class="re-tabs__text">
            <span class="re-tabs__label">{{ tab.label }}</span>
            <span v-if="tab.hint" class="re-tabs__hint">{{ tab.hint }}</span>
          </span>
          <span v-if="tab.dirty" class="re-tabs__dirty" title="有未保存的改动" />
          <span
            v-if="tab.badge !== undefined && tab.badge !== null && tab.badge !== ''"
            class="re-tabs__badge"
          >{{ tab.badge }}</span>
          <button
            v-if="canClose(tab)"
            type="button"
            class="re-tabs__close"
            :title="`关闭 ${tab.label}`"
            :aria-label="`关闭 ${tab.label}`"
            @click="closeTab($event, tab)"
          >
            <ReIcon name="Close" :size="10" />
          </button>
        </div>

        <span v-if="!tabs.length" class="re-tabs__placeholder">{{ emptyText }}</span>
      </div>

      <button
        v-if="scrollable"
        type="button"
        class="re-tabs__scroll is-right"
        title="向右滚动"
        aria-label="向右滚动"
        @click="scrollNav(1)"
      >
        <ReIcon name="ArrowRight" :size="12" />
      </button>

      <!-- 页签条右侧操作区 -->
      <div class="re-tabs__actions">
        <slot name="actions" />
        <button
          v-if="showCloseAll && tabs.length"
          type="button"
          class="re-tabs__close-all"
          title="关闭全部页签"
          aria-label="关闭全部页签"
          @click="emit('close-all')"
        >
          <ReIcon name="CircleClose" :size="13" />
        </button>
      </div>
    </div>

    <!-- 内容面板：全部常驻，仅切换可见性，切走再切回不丢会话与表单 -->
    <div class="re-tabs__panels">
      <div
        v-for="tab in tabs"
        v-show="active === tab.name"
        :key="tab.name"
        class="re-tabs__panel"
        :data-tab="tab.name"
      >
        <slot :tab="tab" />
      </div>
      <div v-if="!tabs.length" class="re-tabs__empty">
        <slot name="empty">{{ emptyText }}</slot>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="menu.visible" class="re-tabs__ctx-backdrop" @mousedown="closeMenu" @contextmenu.prevent="closeMenu" />
      <div
        v-if="menu.visible"
        class="re-tabs__ctx"
        role="menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @contextmenu.prevent
      >
        <button
          v-for="item in contextMenu"
          :key="item.key"
          type="button"
          class="re-tabs__ctx-item"
          :class="{ 'is-danger': item.danger, 'is-disabled': itemDisabled(item), 'has-divider': item.divided }"
          :disabled="itemDisabled(item)"
          role="menuitem"
          @click="runCommand(item)"
        >
          <ReIcon v-if="item.icon" :name="item.icon" :size="13" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ===== 根容器：纵向 flex，页签条定高，面板吃满剩余 ===== */
.re-tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

/* ===== 页签条 ===== */
.re-tabs__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 0 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.re-tabs__nav {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.re-tabs__nav::-webkit-scrollbar {
  display: none;
}

/* ===== 单个页签 ===== */
.re-tabs__tab {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 5px;
  max-width: 220px;
  padding: 0 8px 0 12px;
  height: 40px;
  box-sizing: border-box;
  border-radius: var(--el-radius-md, 8px) var(--el-radius-md, 8px) 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.15;
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;
}

.re-tabs__tab:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.re-tabs__tab.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.re-tabs__tab.is-disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* 状态点 */
.re-tabs__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.re-tabs__dot.is-online {
  background: var(--el-color-success);
}

.re-tabs__dot.is-offline {
  background: var(--el-text-color-placeholder);
}

.re-tabs__dot.is-unknown {
  background: var(--el-color-warning);
}

.re-tabs__dot.is-alarm {
  background: var(--el-color-danger);
}

.re-tabs__icon {
  flex: none;
}

/* 标题两行：主机名 + 功能名 */
.re-tabs__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.re-tabs__label {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.re-tabs__hint {
  overflow: hidden;
  font-size: 10.5px;
  font-weight: 400;
  line-height: 1;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.re-tabs__tab.is-active .re-tabs__hint {
  color: var(--el-color-primary-light-3);
}

/* 未保存改动点 */
.re-tabs__dirty {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-color-warning);
}

/* 计数徽标 */
.re-tabs__badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 15px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}

.re-tabs__tab.is-active .re-tabs__badge {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
}

/* 关闭按钮：默认低存在感，hover 才显形 */
.re-tabs__close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  opacity: 0.65;
  transition:
    opacity var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;
}

.re-tabs__tab:hover .re-tabs__close {
  opacity: 1;
}

.re-tabs__close:hover {
  background: var(--el-fill-color-darker);
  color: var(--el-color-danger);
}

.re-tabs__placeholder {
  align-self: center;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* ===== 滚动按钮 ===== */
.re-tabs__scroll {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.re-tabs__scroll:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

/* ===== 右侧操作区 ===== */
.re-tabs__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  padding-left: 6px;
}

.re-tabs__close-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.re-tabs__close-all:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-danger);
}

/* ===== 内容面板 ===== */
.re-tabs__panels {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.re-tabs__panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.re-tabs__empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* ===== 右键菜单 ===== */
.re-tabs__ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2999;
}

.re-tabs__ctx {
  position: fixed;
  z-index: 3000;
  min-width: 160px;
  padding: 5px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light);
}

.re-tabs__ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}

.re-tabs__ctx-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.re-tabs__ctx-item.is-danger {
  color: var(--el-color-danger);
}

.re-tabs__ctx-item.is-danger:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.re-tabs__ctx-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.re-tabs__ctx-item.is-disabled:hover {
  background: transparent;
  color: var(--el-text-color-regular);
}

/* 分隔线：用上边框，不额外插元素，菜单项本身仍是完整的按钮 */
.re-tabs__ctx-item.has-divider {
  margin-top: 5px;
  padding-top: 9px;
  border-top: 1px solid var(--el-border-color-lighter);
  border-radius: 0 0 var(--el-radius-md, 8px) var(--el-radius-md, 8px);
}
</style>
