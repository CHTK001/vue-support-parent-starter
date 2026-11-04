<script setup lang="ts">
/**
 * 面板（内联自 reactive-layout，MIT）。
 *
 * <p>页签栏 + 内容区。内容由上层注入的 `layoutPanelContent` 组件渲染，
 * 再把 `activeTab` 透传出去（本项目用它桥接页面的 `#panel` 作用域插槽）。</p>
 *
 * <p>同时支持把页签拖到别的面板（合并 / 拆分），因此页签栏与内容区都要接
 * dragover / drop：内容区按落点位置决定上下左右拆分成新面板。</p>
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

function onDrop(e: DragEvent) {
  e.preventDefault();
  const data = e.dataTransfer?.getData('application/json');
  const currentDropZone = dropZone.value;
  const currentTabDropIndex = tabDropIndex.value;
  dropZone.value = null;
  tabDropIndex.value = null;

  if (!data) return;

  try {
    const { tabId, sourcePanelId } = JSON.parse(data);

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
.panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: var(--bg-container, #fff);
}
</style>
