<template>
  <Teleport to="body">
    <div v-if="visible" class="re-ctx-backdrop" @mousedown="close" @contextmenu.prevent="close" />
    <div
      v-if="visible"
      ref="menuEl"
      class="re-ctx-menu"
      :style="{ left: ctxX + 'px', top: ctxY + 'px' }"
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
        <!-- 叶子节点：直接点击 -->
        <div
          v-else-if="!item.children"
          v-show="item.visible !== false"
          class="re-ctx-item"
          :class="{ 'is-danger': item.danger }"
          @click="handleSelect(item)"
        >
          <ReIcon v-if="item.icon" :name="item.icon" />
          <span>{{ item.label }}</span>
        </div>
        <!-- 分组节点：hover 展开子菜单 -->
        <div
          v-else
          v-show="item.visible !== false"
          class="re-ctx-item has-sub"
          :class="{ 'is-open': openSubKey === subKey(item, index) }"
          @click="toggleSub(item, index)"
          @mouseenter="openSub(item, index)"
        >
          <ReIcon v-if="item.icon" :name="item.icon" />
          <span>{{ item.label }}</span>
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
              <div
                v-else
                v-show="child.visible !== false"
                class="re-ctx-item"
                :class="{ 'is-danger': child.danger }"
                @click.stop="handleSelect(child)"
              >
                <ReIcon v-if="child.icon" :name="child.icon" />
                <span>{{ child.label }}</span>
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
  }>(),
  {
    title: "",
    subtitle: "",
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

/** 过滤掉 visible=false 的顶层项 */
const visibleItems = computed(() => props.items);

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

/** 展开子菜单并测量翻转 */
function openSub(item: ReContextMenuItem, index: number): void {
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

/** 处理菜单项点击：先发 select 让父组件拿到 host，再关闭 */
function handleSelect(item: ReContextMenuItem): void {
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
  font-size: 12.5px;
}
.re-ctx-sub .re-ctx-item .re-icon,
.re-ctx-sub .re-ctx-item svg {
  font-size: 13.5px;
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
  font-size: 11.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
