<script setup lang="ts">
/**
 * 面板（内联自 reactive-layout，MIT）。
 *
 * <p>页签栏 + 内容区。内容由上层注入的 `layoutPanelContent` 组件渲染，
 * 再把 `activeTab` 透传出去（本项目用它桥接页面的 `#panel` 作用域插槽）。</p>
 *
 * <p>同时支持把页签拖到别的面板（合并 / 拆分），因此页签栏与内容区都要接
 * dragover / drop：内容区按落点位置决定上下左右拆分成新面板。</p>
 *
 * <p>另外支持把<b>整个面板</b>拖动重排序：页签栏左侧有拖拽手柄，拖到另一块区域
 * 就按左/右/上/下换顺序（不是拆分新面板），即 `A | B | C` 把 B 拖到 A 左侧
 * → `B | A | C`。</p>
 */
import { ref, computed, inject, type Component } from 'vue';
import type { PanelNode } from './useLayout';

const props = defineProps<{
  panel: PanelNode;
}>();

const moveTab = inject<(tabId: string, from: string, to: string, idx?: number) => void>('moveTab')!;
const closeTab = inject<(tabId: string) => void>('closeTab')!;
const splitPanel = inject<
  (panelId: string, dir: 'horizontal' | 'vertical', tabId: string, pos: 'before' | 'after') => void
>('splitPanel')!;
const movePanel = inject<
  (sourceId: string, targetId: string, position: 'before' | 'after') => void
>('movePanel', () => {});  // 独立使用 SplitLayout 时退化为无操作
const panelContent = inject<Component>('layoutPanelContent', null as any);
const tabIconComponent = inject<Component>('layoutTabIcon', null as any);

const activeTab = computed(() => {
  return props.panel.tabs.find((t) => t.id === props.panel.activeTabId) ?? props.panel.tabs[0];
});

function setActiveTab(tabId: string) {
  props.panel.activeTabId = tabId;
}

// --- 内容区落点：决定是否拆分成新面板 ---
type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center' | null;
const dropZone = ref<DropZone>(null);
const contentEl = ref<HTMLElement | null>(null);

function getDropZone(e: DragEvent): DropZone {
  const el = contentEl.value;
  if (!el) return 'center';
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  if (x < 0.25) return 'left';
  if (x > 0.75) return 'right';
  if (y < 0.25) return 'top';
  if (y > 0.75) return 'bottom';
  return 'center';
}

// --- 页签栏落点：插到两个页签之间 ---
const tabDropIndex = ref<number | null>(null);
const tabBarEl = ref<HTMLElement | null>(null);

function getTabDropIndex(e: DragEvent): number {
  if (!tabBarEl.value) return props.panel.tabs.length;
  const tabEls = tabBarEl.value.querySelectorAll<HTMLElement>('.panel-tab');
  for (let i = 0; i < tabEls.length; i++) {
    const rect = tabEls[i].getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    if (e.clientX < midX) return i;
  }
  return tabEls.length;
}

function onTabBarDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  dropZone.value = null;
  tabDropIndex.value = getTabDropIndex(e);
}

function onContentDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  tabDropIndex.value = null;
  dropZone.value = getDropZone(e);
}

function onDragLeave(e: DragEvent) {
  const related = e.relatedTarget as HTMLElement | null;
  const panelEl = (e.currentTarget as HTMLElement)?.closest('.layout-panel');
  if (panelEl && related && panelEl.contains(related)) return;
  dropZone.value = null;
  tabDropIndex.value = null;
}

// --- 面板级拖拽：把整块区域拖动重排，不是拆页签 ---
const panelDragId = ref<string | null>(null);
let panelDragGhost: HTMLElement | null = null;

/** 面板拖拽开始：告诉 drop 目标「我拖的是一块完整的区域」 */
function onPanelDragStart(e: DragEvent): void {
  if (!e.dataTransfer) return;
  const sourcePanelId = props.panel.id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'panel', panelId: sourcePanelId }));
  panelDragId.value = sourcePanelId;

  const handle = e.currentTarget as HTMLElement;
  const ghost = document.createElement('div');
  ghost.className = 'panel-drag-ghost';
  ghost.textContent =
    (handle.closest('.panel-tab-bar') as HTMLElement)?.querySelector('.panel-tab.active')?.textContent?.trim() ??
    props.panel.tabs[0]?.label ??
    '';
  panelDragGhost = ghost;
  // 藏到屏幕外，浏览器只把它采样成拖拽影像
  ghost.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none;';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  e.stopPropagation();
  void ghost.getBoundingClientRect();
}

/** 面板拖拽结束：回收拖拽影像 */
function onPanelDragEnd(e: DragEvent): void {
  panelDragId.value = null;
  if (panelDragGhost) {
    panelDragGhost.remove();
    panelDragGhost = null;
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const data = e.dataTransfer?.getData('application/json');
  const currentDropZone = dropZone.value;
  const currentTabDropIndex = tabDropIndex.value;
  dropZone.value = null;
  tabDropIndex.value = null;

  if (!data) return;

  try {
    const parsed: Record<string, unknown> = JSON.parse(data);
    const type = parsed.type as string | undefined;

    // 整块区域拖拽：落在左/右/上/下半区就在这边插前/插后，落在标签栏就插到正前方
    if (type === 'panel') {
      const { panelId } = parsed as { panelId: string };
      if (panelId === props.panel.id) return;  // 拖回到自己头上，忽略
      const positionMap: Record<'left' | 'right' | 'top' | 'bottom' | 'center', 'before' | 'after'> = {
        left: 'before',
        right: 'after',
        top: 'before',
        bottom: 'after',
        center: 'before',
      };
      movePanel(panelId, props.panel.id, currentDropZone ? positionMap[currentDropZone] : 'before');
      return;
    }

    const { tabId, sourcePanelId } = parsed as { tabId: string; sourcePanelId: string };

    if (currentTabDropIndex !== null) {
      moveTab(tabId, sourcePanelId, props.panel.id, currentTabDropIndex);
      return;
    }

    if (!currentDropZone) return;

    if (currentDropZone === 'center') {
      moveTab(tabId, sourcePanelId, props.panel.id);
    } else {
      const directionMap: Record<string, 'horizontal' | 'vertical'> = {
        left: 'horizontal',
        right: 'horizontal',
        top: 'vertical',
        bottom: 'vertical',
      };
      const positionMap: Record<string, 'before' | 'after'> = {
        left: 'before',
        right: 'after',
        top: 'before',
        bottom: 'after',
      };
      splitPanel(props.panel.id, directionMap[currentDropZone], tabId, positionMap[currentDropZone]);
    }
  } catch {
    // 非本组件的拖拽数据，忽略
  }
}

function onTabDragStart(e: DragEvent, tabId: string) {
  if (!e.dataTransfer) return;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('application/json', JSON.stringify({ tabId, sourcePanelId: props.panel.id }));

  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const ghost = target.cloneNode(true) as HTMLElement;
  ghost.style.position = 'absolute';
  ghost.style.top = '-9999px';
  ghost.style.left = '-9999px';
  ghost.style.width = rect.width + 'px';
  ghost.style.height = rect.height + 'px';
  ghost.style.opacity = '0.9';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  requestAnimationFrame(() => ghost.remove());
}

const dropIndicatorStyle = computed(() => {
  if (!dropZone.value) return null;
  const base = {
    position: 'absolute' as const,
    background: 'var(--brand-500, #007acc)',
    opacity: 0.16,
    border: '1px dashed var(--brand-500, #007acc)',
    pointerEvents: 'none' as const,
    zIndex: 100,
  };
  switch (dropZone.value) {
    case 'left':
      return { ...base, top: '0', left: '0', width: '50%', height: '100%' };
    case 'right':
      return { ...base, top: '0', right: '0', width: '50%', height: '100%' };
    case 'top':
      return { ...base, top: '0', left: '0', width: '100%', height: '50%' };
    case 'bottom':
      return { ...base, bottom: '0', left: '0', width: '100%', height: '50%' };
    case 'center':
      return { ...base, top: '0', left: '0', width: '100%', height: '100%' };
    default:
      return null;
  }
});

const tabInsertLineStyle = computed(() => {
  if (tabDropIndex.value === null || !tabBarEl.value) return null;
  const tabEls = tabBarEl.value.querySelectorAll<HTMLElement>('.panel-tab');
  let xPos: number;
  const barRect = tabBarEl.value.getBoundingClientRect();

  if (tabEls.length === 0) {
    xPos = 4;
  } else if (tabDropIndex.value >= tabEls.length) {
    const lastRect = tabEls[tabEls.length - 1].getBoundingClientRect();
    xPos = lastRect.right - barRect.left;
  } else {
    const targetRect = tabEls[tabDropIndex.value].getBoundingClientRect();
    xPos = targetRect.left - barRect.left;
  }

  return {
    position: 'absolute' as const,
    left: xPos + 'px',
    top: '0',
    bottom: '0',
    width: '2px',
    background: 'var(--brand-500, #007acc)',
    pointerEvents: 'none' as const,
    zIndex: 100,
  };
});
</script>

<template>
  <div class="layout-panel" :data-panel-id="panel.id">
    <div
      ref="tabBarEl"
      class="panel-tab-bar"
      @dragover="onTabBarDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- 面板拖拽手柄：按住整块区域重排序（A | B | C 把 B 拖到 A 前 → B | A | C） -->
      <div
        class="panel-drag-handle"
        draggable="true"
        @dragstart="onPanelDragStart"
        @dragend="onPanelDragEnd"
        aria-label="拖拽此面板重排序"
      >
        <span class="panel-drag-handle__grip" aria-hidden="true">
          <span class="panel-drag-handle__bar" />
          <span class="panel-drag-handle__bar" />
          <span class="panel-drag-handle__bar" />
        </span>
      </div>
      <div
        v-for="(tab, i) in panel.tabs"
        :key="tab.id"
        class="panel-tab"
        :data-tab-id="tab.id"
        :class="{
          active: tab.id === panel.activeTabId,
          'before-active': panel.tabs[i + 1]?.id === panel.activeTabId,
        }"
        :draggable="panel.tabs.length > 1"
        @click="setActiveTab(tab.id)"
        @dragstart="(e: DragEvent) => onTabDragStart(e, tab.id)"
      >
        <component v-if="tabIconComponent" :is="tabIconComponent" :tab="tab" />
        {{ tab.label }}
        <span v-if="tab.closable" class="tab-close" @click.stop="closeTab(tab.id)">&times;</span>
      </div>
      <div class="tab-bar-spacer"></div>
      <div v-if="tabInsertLineStyle" :style="tabInsertLineStyle" />
    </div>
    <div
      ref="contentEl"
      class="panel-content"
      @dragover="onContentDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="dropIndicatorStyle" :style="dropIndicatorStyle" />
      <component v-if="activeTab && panelContent" :is="panelContent" :active-tab="activeTab" :panel="panel" />
    </div>
  </div>
</template>

<style scoped>
.layout-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.panel-tab-bar {
  display: flex;
  align-items: stretch;
  height: 34px;
  background: var(--bg-fill, #f6f7f9);
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}
.panel-tab {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.panel-tab:hover {
  color: var(--text-primary, #222);
}
.panel-tab.active {
  color: var(--brand-600, var(--text-primary, #222));
  background: var(--bg-container, #fff);
  border-bottom-color: var(--brand-500, #3b82f6);
  font-weight: 600;
}
.tab-close {
  margin-left: 4px;
  font-size: 16px;
  line-height: 1;
  color: var(--text-tertiary, #999);
}
.tab-close:hover {
  color: var(--text-primary, #222);
}
.tab-bar-spacer {
  flex: 1;
}
.panel-tab[draggable='true'] {
  cursor: grab;
}
.panel-tab[draggable='true']:active {
  cursor: grabbing;
}
/* 面板拖拽手柄：整块区域重排序（拖动到另一块区域左侧/上方即插前，右/下即插后） */
.panel-drag-handle {
  order: -1;
  flex-shrink: 0;
  width: 22px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: var(--text-tertiary, #999);
  cursor: grab;
  user-select: none;
}
.panel-drag-handle:active {
  cursor: grabbing;
  color: var(--brand-500, #007acc);
}
.panel-drag-handle:hover {
  color: var(--text-primary, #222);
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.06));
}
.panel-drag-handle__grip {
  display: flex;
  flex-direction: column;
  gap: 2.5px;
  align-items: center;
}
.panel-drag-handle__bar {
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
}
/* 面板拖拽时跟随鼠标的浮牌 */
.panel-drag-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 5px;
  background: var(--brand-500, #007acc);
  color: #fff;
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: var(--bg-container, #fff);
}
</style>
