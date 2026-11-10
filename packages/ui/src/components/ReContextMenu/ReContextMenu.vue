<template>
  <Teleport to="body">
    <!-- 遮罩：左键点外部关闭；右键不吞掉，转发给下层元素（见 forwardContextMenu） -->
    <div v-if="visible" class="re-ctx-backdrop" @mousedown="close" @contextmenu.prevent="forwardContextMenu" />
    <div
      v-if="visible"
      ref="menuEl"
      class="re-ctx-menu"
      :style="{ left: ctxX + 'px', top: ctxY + 'px', minWidth: minWidth + 'px', maxWidth: maxWidth + 'px' }"
      role="menu"
      @contextmenu.prevent
    >
      <div v-if="title || subtitle" class="re-ctx-head">
        <b v-if="title">{{ title }}</b>
        <span v-if="subtitle" class="mono">{{ subtitle }}</span>
      </div>

      <template v-for="(item, index) in visibleItems" :key="index">
        <!-- 分隔线 -->
        <div v-if="item.separator" class="re-ctx-sep" />
        <!-- 分组小标题：不可点，只用来给下面几项归类 -->
        <div v-else-if="item.group" class="re-ctx-group">{{ item.group }}</div>
        <!-- 纯说明行：不可点、不响应悬停 -->
        <div v-else-if="item.note" class="re-ctx-note">{{ item.note }}</div>
        <!-- 叶子节点：直接点击 -->
        <div
          v-else-if="!item.children"
          v-show="item.visible !== false"
          class="re-ctx-item"
          :class="{ 'is-danger': item.danger, 'is-disabled': item.disabled, 'is-checked': !!item.checked }"
          @click="handleSelect(item)"
        >
          <span v-if="item.checked !== undefined" class="re-ctx-check">{{ item.checked ? "✓" : "" }}</span>
          <ReIcon v-if="typeof item.icon === 'string'" :name="item.icon" />
          <component :is="item.icon" v-else-if="item.icon" />
          <span>{{ item.label }}</span>
          <span v-if="item.hint" class="re-ctx-hint">{{ item.hint }}</span>
        </div>
        <!-- 分组节点：hover 展开子菜单 -->
        <div
          v-else
          v-show="item.visible !== false"
          class="re-ctx-item has-sub"
          :class="{ 'is-open': openSubKey === subKey(item, index), 'is-disabled': item.disabled }"
          @click="toggleSub(item, index)"
          @mouseenter="openSub(item, index)"
        >
          <ReIcon v-if="typeof item.icon === 'string'" :name="item.icon" />
          <component :is="item.icon" v-else-if="item.icon" />
          <span>{{ item.label }}</span>
          <span v-if="item.hint" class="re-ctx-hint">{{ item.hint }}</span>
          <ReIcon name="ArrowRight" class="re-ctx-arrow" />
          <div
            v-if="openSubKey === subKey(item, index)"
            class="re-ctx-sub"
            :class="{ 'is-flip-v': subFlip.v, 'is-flip-h': subFlip.h }"
            @mouseenter="openSub(item, index)"
            @mouseleave="leaveSub()"
          >
            <template v-for="(child, ci) in item.children" :key="ci">
              <div v-if="child.separator" class="re-ctx-sep" />
              <div v-else-if="child.group" class="re-ctx-group">{{ child.group }}</div>
              <div v-else-if="child.note" class="re-ctx-note">{{ child.note }}</div>
              <div
                v-else
                v-show="child.visible !== false"
                class="re-ctx-item"
                :class="{
                  'is-danger': child.danger,
                  'is-disabled': child.disabled,
                  'is-checked': !!child.checked,
                }"
                @click.stop="handleSelect(child)"
              >
                <span v-if="child.checked !== undefined" class="re-ctx-check">{{ child.checked ? "✓" : "" }}</span>
                <ReIcon v-if="typeof child.icon === 'string'" :name="child.icon" />
                <component :is="child.icon" v-else-if="child.icon" />
                <span>{{ child.label }}</span>
                <span v-if="child.hint" class="re-ctx-hint">{{ child.hint }}</span>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ReContextMenu —— 通用右键上下文菜单组件
 *
 * 支持树形菜单项（叶子 + 分组子菜单）、视口自动翻转、hover 子菜单、
 * 头部标题/副标题、分隔线、危险操作高亮、长文本截断。
 *
 * 通过 defineExpose 暴露 open(x, y) / close() 方法，
 * 父组件用 ref 调用 open 在指定坐标弹出菜单。
 */
import { computed, nextTick, ref, reactive } from "vue";
import ReIcon from "../ReIcon";
import type { ReContextMenuItem } from "./types";

defineOptions({ name: "ReContextMenu" });

const props = withDefaults(
  defineProps<{
    /** 菜单项树 */
    items: ReContextMenuItem[];
    /** 头部标题 */
    title?: string;
    /** 头部副文本 */
    subtitle?: string;
    /** 最小宽度（px）。带右侧说明文字（hint）的菜单需要更宽 */
    minWidth?: number;
    /** 最大宽度（px）。label 过长时按此截断 */
    maxWidth?: number;
  }>(),
  {
    title: "",
    subtitle: "",
    minWidth: 176,
    maxWidth: 240,
  },
);

const emit = defineEmits<{
  (e: "select", command: string): void;
  (e: "close"): void;
}>();

/** 是否可见 */
const visible = ref(false);
/** 菜单位置 */
const ctxX = ref(0);
const ctxY = ref(0);
/** 菜单根元素引用 */
const menuEl = ref<HTMLElement | null>(null);

/** 当前展开的子菜单 key */
const openSubKey = ref<string | null>(null);
/** 子菜单翻转状态 */
const subFlip = reactive({ v: false, h: false });

/** 过滤掉 visible=false 的顶层项（叶子 / 分组 / 说明行一视同仁） */
const visibleItems = computed(() => props.items.filter(item => item.visible !== false));

/** 生成子菜单唯一 key */
function subKey(item: ReContextMenuItem, index: number): string {
  return item.command ?? `sub-${index}`;
}

/**
 * 在指定坐标弹出菜单。
 *
 * <p>先按鼠标点落下位，下一帧量真实宽高再翻转贴边。</p>
 */
function open(x: number, y: number): void {
  openSubKey.value = null;
  subFlip.v = false;
  subFlip.h = false;
  ctxX.value = Math.max(8, x);
  ctxY.value = Math.max(8, y);
  visible.value = true;
  nextTick(() => {
    const el = menuEl.value;
    if (!el) return;
    const w = el.offsetWidth;
    const ht = el.offsetHeight;
    let nx = x;
    let ny = y;
    if (nx + w > window.innerWidth - 8) nx = window.innerWidth - w - 8;
    if (ny + ht > window.innerHeight - 8) ny = window.innerHeight - ht - 8;
    ctxX.value = Math.max(8, nx);
    ctxY.value = Math.max(8, ny);
  });
}

/** 关闭菜单 */
function close(): void {
  visible.value = false;
  openSubKey.value = null;
  subFlip.v = false;
  subFlip.h = false;
  emit("close");
}

/**
 * 遮罩上的右键：关掉当前菜单，并把这次右键转发给遮罩下面的元素。
 *
 * <p>遮罩是覆盖整屏的透明层，菜单开着时它会吃掉所有点击与右键。若只是 {@code close()}，
 * 用户想在另一个位置换菜单就得先左键关掉再右键 —— 也就是「右键两次才换位置」，
 * 与没有遮罩时的手感不一致。这里按坐标找回遮罩下面真正的目标元素，把同坐标的
 * {@code contextmenu} 事件重新派发给它，等价于菜单没开时的那一次右键，
 * 调用方（ReTable 等）的右键处理会自然接管并重新开菜单。</p>
 *
 * <p>派发放在 {@code nextTick}：那一刻遮罩和菜单已从 DOM 移除，{@code elementsFromPoint}
 * 命中的才是用户真正点到的元素。转发出去的事件带 {@code bubbles: true}，
 * 会沿正常冒泡路径走到宿主挂在容器上的处理函数。</p>
 */
function forwardContextMenu(e: MouseEvent): void {
  const x = e.clientX;
  const y = e.clientY;
  // 菜单自身矩形先量下来：close() 之后 menuEl 会被卸载
  const menuRect = menuEl.value?.getBoundingClientRect();
  const src = {
    button: e.button,
    buttons: e.buttons,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
  };
  close();
  void nextTick(() => {
    const target = elementBelowPoint(x, y, menuRect);
    if (!target) return;
    target.dispatchEvent(
      new MouseEvent("contextmenu", {
        ...src,
        clientX: x,
        clientY: y,
        screenX: e.screenX,
        screenY: e.screenY,
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );
  });
}

/**
 * 取坐标处最上层的「真实」元素，跳过菜单浮层自身。
 *
 * <p>实际调用时遮罩已隐藏，这里再跳过 .re-ctx-menu / .re-ctx-sub 只是兜底
 * （避免下一次渲染前菜单还没摘掉时，把右键转回菜单自己身上形成死循环）。</p>
 */
function elementBelowPoint(x: number, y: number, menuRect?: DOMRect): HTMLElement | null {
  // 命中点在菜单矩形内就不转发：那属于「在菜单上右键」，忽略即可
  if (menuRect && x >= menuRect.left && x <= menuRect.right && y >= menuRect.top && y <= menuRect.bottom) {
    return null;
  }
  const stack = document.elementsFromPoint(x, y) as HTMLElement[];
  for (const el of stack) {
    if (el.classList?.contains("re-ctx-backdrop")) continue;
    if (el.closest?.(".re-ctx-menu")) continue;
    return el;
  }
  return null;
}

/** 展开子菜单并测量翻转（禁用项不展开） */
function openSub(item: ReContextMenuItem, index: number): void {
  if (item.disabled) return;
  const key = subKey(item, index);
  if (openSubKey.value === key) return;
  openSubKey.value = key;
  nextTick(() => measureSub());
}

/** 离开子菜单：收起 */
function leaveSub(): void {
  openSubKey.value = null;
  subFlip.v = false;
  subFlip.h = false;
}

/** 点击切换子菜单 */
function toggleSub(item: ReContextMenuItem, index: number): void {
  if (item.disabled) return;
  const key = subKey(item, index);
  if (openSubKey.value === key) {
    leaveSub();
  } else {
    openSub(item, index);
  }
}

/** 测量子菜单是否需要翻转 */
function measureSub(): void {
  const subEl = document.querySelector(".re-ctx-sub") as HTMLElement | null;
  if (!subEl) return;
  const parentEl = subEl.parentElement as HTMLElement | null;
  if (!parentEl) return;
  const rect = parentEl.getBoundingClientRect();
  const subH = subEl.offsetHeight;
  const subW = subEl.offsetWidth;
  subFlip.v = rect.top + subH > window.innerHeight - 8;
  subFlip.h = rect.right + subW > window.innerWidth - 8;
}

/** 处理菜单项点击：先发 select 让父组件拿到 host，再关闭（禁用项不发 select，但仍关闭） */
function handleSelect(item: ReContextMenuItem): void {
  if (item.disabled) return;
  if (item.command) emit("select", item.command);
  close();
}

defineExpose({ open, close });
</script>

<style>
/* 菜单样式：Teleport 到 body，非 scoped */
.re-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2990;
  background: transparent;
}
.re-ctx-menu {
  position: fixed;
  z-index: 2991;
  min-width: 176px;
  max-width: 240px;
  padding: 5px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e6e8eb);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 23, 42, 0.12));
}
.re-ctx-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 32px;
  padding: 0 9px;
  font-size: 13px;
  color: var(--el-text-color-regular, #4b5563);
  border-radius: var(--el-border-radius-small, 6px);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease, color 0.12s ease;
}
.re-ctx-item .re-icon,
.re-ctx-item svg {
  font-size: 15px;
  flex-shrink: 0;
}
/*
 * 图标尺寸必须写死。
 *
 * Element Plus 的图标组件渲染出的是 <svg viewBox="0 0 1024 1024">，**不带 width/height 属性**，
 * 该图标当字符串经 ReIcon 渲染时由字体字号决定大小，但当组件形式（宿主传 <Edit /> 一类）
 * 直接落到 .re-ctx-item 里时没有任何尺寸约束 —— 它会按 flex 内容宽度撑开（实测 146×146px），
 * 溢出 32px 高的条目、盖住下面所有条目的可点区域（命中测试会落到别人的图标 path 上，
 * 用户点「刷新」实际点到的是「删除表」的图标）。因此这里对 svg 显式收口。
 */
.re-ctx-item > svg,
.re-ctx-item > .el-icon,
.re-ctx-item > .el-icon > svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
}
.re-ctx-item > .el-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.re-ctx-sub .re-ctx-item > svg,
.re-ctx-sub .re-ctx-item > .el-icon,
.re-ctx-sub .re-ctx-item > .el-icon > svg {
  width: 13px;
  height: 13px;
}
/* 宿主传的是图标组件（Element Plus 的 <Edit /> 一类），包一层 .el-icon：按同一档位收口 */
.re-ctx-item .el-icon {
  font-size: 15px;
  flex-shrink: 0;
}
.re-ctx-sub .re-ctx-item .el-icon {
  font-size: 13px;
}
.re-ctx-item.is-disabled {
  color: var(--el-text-color-disabled, #c0c4cc);
  background: none;
  cursor: not-allowed;
}
.re-ctx-item.is-disabled:hover {
  color: var(--el-text-color-disabled, #c0c4cc);
  background: none;
}
.re-ctx-item:hover {
  background: var(--el-fill-color-light, #f3f4f6);
  color: var(--el-color-primary, #409eff);
}
.re-ctx-item.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.re-ctx-item.is-danger:hover {
  background: var(--el-color-danger-light-9, #fef0f0);
  color: var(--el-color-danger, #f56c6c);
}
/* 带子菜单的条目 */
.re-ctx-item.has-sub {
  position: relative;
}
.re-ctx-item.has-sub:hover .re-icon,
.re-ctx-item.has-sub:hover svg,
.re-ctx-item.has-sub.is-open .re-icon,
.re-ctx-item.has-open .re-icon,
.re-ctx-item.has-sub.is-open svg {
  color: var(--el-text-color-regular, #4b5563);
}
.re-ctx-item.has-sub .re-ctx-arrow {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.re-ctx-item.has-sub.is-open {
  color: var(--el-color-primary, #409eff);
  background: var(--el-fill-color-light, #f3f4f6);
}
/* 子菜单浮层 */
.re-ctx-sub {
  position: absolute;
  left: calc(100% + 2px);
  top: -6px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  min-width: 178px;
  padding: 5px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e6e8eb);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 23, 42, 0.16));
}
/* 上下翻转 */
.re-ctx-sub.is-flip-v {
  top: auto;
  bottom: 100%;
}
/* 左右翻转 */
.re-ctx-sub.is-flip-h {
  left: auto;
  right: calc(100% + 2px);
}
.re-ctx-sub .re-ctx-item {
  height: 31px;
  font-size: 13px;
}
.re-ctx-sub .re-ctx-item .re-icon,
.re-ctx-sub .re-ctx-item svg {
  font-size: 13px;
}
.re-ctx-sep {
  height: 1px;
  margin: 5px 7px;
  background: var(--el-border-color-lighter, #eceef1);
}
/* 头部 */
.re-ctx-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px 8px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--el-border-color-lighter, #eceef1);
}
.re-ctx-head b {
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2430);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-ctx-head span {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧说明文字：占满剩余宽度、贴右、单行截断 */
.re-ctx-hint {
  margin-left: auto;
  padding-left: 10px;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.re-ctx-item.is-danger .re-ctx-hint,
.re-ctx-item.is-disabled .re-ctx-hint {
  color: inherit;
  opacity: 0.7;
}

/* 勾选列：固定宽度，保证同组文字左边缘对齐（false 也占位） */
.re-ctx-check {
  flex: none;
  width: 12px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-primary, #409eff);
}
.re-ctx-item.is-checked {
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}

/* 分组小标题：灰、字号最小、不可点 */
.re-ctx-group {
  padding: 5px 9px 3px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-placeholder, #a8abb2);
  white-space: nowrap;
}

/* 纯说明行：比正文轻，不响应悬停 */
.re-ctx-note {
  padding: 0 9px 5px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder, #a8abb2);
  white-space: normal;
}
</style>
