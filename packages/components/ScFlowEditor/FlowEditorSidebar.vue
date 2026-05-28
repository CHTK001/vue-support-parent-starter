<template>
  <aside class="fe-sidebar">
    <slot>
      <!-- Tab bar -->
      <div class="fe-sidebar__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="fe-sidebar__tab"
        :class="{ 'fe-sidebar__tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
        :title="tab.label"
      >
        <span class="fe-sidebar__tab-icon" v-html="tab.icon" />
        <span class="fe-sidebar__tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="fe-sidebar__content">
      <!-- ===== 工作流 Tab ===== -->
      <template v-if="activeTab === 'workflow'">
        <div v-if="mode === 'edit'" class="fe-sidebar__actions">
          <button class="fe-sidebar__action-btn fe-sidebar__action-btn--primary" @click="emit('create-workflow')">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span>新建</span>
          </button>
          <button class="fe-sidebar__action-btn" @click="emit('import-workflow')">导入</button>
          <button class="fe-sidebar__action-btn" @click="emit('export-workflow')">导出</button>
        </div>

        <div class="fe-sidebar__search">
          <svg class="fe-sidebar__search-icon" viewBox="0 0 14 14" width="12" height="12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input v-model="searchQuery" placeholder="搜索工作流..." />
        </div>

        <div class="fe-sidebar__list">
          <div
            v-for="wf in filteredWorkflows"
            :key="wf.id"
            class="fe-sidebar__item"
            :class="{ 'fe-sidebar__item--active': wf.id === activeWorkflowId }"
            @click="emit('select-workflow', wf.id)"
          >
            <div class="fe-sidebar__item-icon">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2"/></svg>
            </div>
            <div class="fe-sidebar__item-info">
              <span class="fe-sidebar__item-name">{{ wf.name }}</span>
              <span class="fe-sidebar__item-meta">{{ wf.nodeCount }} 个节点</span>
            </div>
          </div>
          <div v-if="!workflows || workflows.length === 0" class="fe-sidebar__empty">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M12 8v4M12 16h0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span>暂无工作流</span>
          </div>
        </div>

        <!-- Palette items -->
        <div v-if="mode === 'edit' && palette && palette.length > 0" class="fe-sidebar__palette">
          <div class="fe-sidebar__section-title">
            <span>节点类型</span>
          </div>
          <div class="fe-sidebar__palette-list">
            <div
              v-for="item in palette"
              :key="item.kind"
              class="fe-sidebar__palette-item"
              :class="{ 'fe-sidebar__palette-item--disabled': item.disabled }"
              draggable="true"
              @dragstart="onPaletteDrag($event, item)"
            >
              <span class="fe-sidebar__palette-dot" :style="{ background: item.color || '#3b82f6' }" />
              <div class="fe-sidebar__palette-info">
                <span class="fe-sidebar__palette-title">{{ item.title }}</span>
                <span v-if="item.detail" class="fe-sidebar__palette-detail">{{ item.detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== 依赖项 Tab ===== -->
      <template v-if="activeTab === 'deps'">
        <div class="fe-sidebar__placeholder">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><path d="M12 3L20 9V19H4V9L12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 14H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>依赖项管理</span>
        </div>
      </template>

      <!-- ===== 资源 Tab ===== -->
      <template v-if="activeTab === 'resources'">
        <div class="fe-sidebar__placeholder">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>资源管理</span>
        </div>
      </template>

      <!-- ===== 设置 Tab ===== -->
      <template v-if="activeTab === 'settings'">
        <div class="fe-sidebar__placeholder">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>设置</span>
        </div>
      </template>
    </div>
    </slot>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { FlowEditorPaletteItem } from "./FlowEditor.vue";

export interface WorkflowItem {
  id: string;
  name: string;
  nodeCount: number;
  status?: string;
  updatedAt?: string;
}

const props = defineProps<{
  mode: 'preview' | 'edit';
  palette?: FlowEditorPaletteItem[];
  paletteDisplayMode?: 'list' | 'icon';
  workflows?: WorkflowItem[];
  activeWorkflowId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'select-workflow', id: string): void;
  (e: 'create-workflow'): void;
  (e: 'import-workflow'): void;
  (e: 'export-workflow'): void;
  (e: 'node-drop', type: string, position?: { x: number; y: number }): void;
}>();

const tabs = [
  { id: 'workflow', label: '工作流', icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M4 7v2a2 2 0 002 2h3" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>' },
  { id: 'deps', label: '依赖项', icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M8 2L13 6V13H3V6L8 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 10H10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' },
  { id: 'resources', label: '资源', icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.2"/><path d="M8 2V4M8 12V14M2 8H4M12 8H14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' },
  { id: 'settings', label: '设置', icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M13.5 10a1.1 1.1 0 00.22 1.22l.04.04a1.33 1.33 0 01-1.89 1.89l-.04-.04a1.1 1.1 0 00-1.22-.22 1.1 1.1 0 00-.66 1V14a1.33 1.33 0 01-2.66 0v-.07a1.1 1.1 0 00-.67-1 1.1 1.1 0 00-1.22.22l-.04.04a1.33 1.33 0 01-1.89-1.89l.04-.04A1.1 1.1 0 004 10.1a1.1 1.1 0 00-1-.66H2a1.33 1.33 0 010-2.66h.07a1.1 1.1 0 001-.67 1.1 1.1 0 00-.22-1.22l-.04-.04a1.33 1.33 0 011.89-1.89l.04.04A1.1 1.1 0 005.9 3.9a1.1 1.1 0 00.66-1V2a1.33 1.33 0 012.66 0v.07a1.1 1.1 0 00.67 1 1.1 1.1 0 001.22-.22l.04-.04a1.33 1.33 0 011.89 1.89l-.04.04A1.1 1.1 0 0013.1 5.9a1.1 1.1 0 001 .66H14a1.33 1.33 0 010 2.66h-.07a1.1 1.1 0 00-1 .67z" stroke="currentColor" stroke-width="1.2"/></svg>' },
];

const activeTab = ref('workflow');
const searchQuery = ref('');

const filteredWorkflows = computed(() => {
  const list = props.workflows || [];
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(wf => wf.name.toLowerCase().includes(q));
});

function onPaletteDrag(e: DragEvent, item: FlowEditorPaletteItem) {
  if (item.disabled) return;
  e.dataTransfer?.setData("text/plain", item.kind);
}
</script>

<style scoped>
.fe-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay, #0f1525);
  border-right: 1px solid var(--el-border-color, #1e2a45);
  overflow: hidden;
  height: 100%;
}
.fe-sidebar__tabs {
  display: flex;
  border-bottom: 1px solid var(--el-border-color, #1e2a45);
  flex-shrink: 0;
  background: var(--el-fill-color, #0b0f1a);
}
.fe-sidebar__tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px 6px;
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder, #5a6478);
  cursor: pointer;
  font-size: 9px;
  font-weight: 600;
  transition: all 0.15s;
  position: relative;
}
.fe-sidebar__tab:hover {
  color: var(--el-text-color-secondary, #8892a8);
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
}
.fe-sidebar__tab--active {
  color: var(--el-color-primary-light-3, #60a5fa);
}
.fe-sidebar__tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--el-color-primary, #3b82f6);
  border-radius: 1px;
}
.fe-sidebar__tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.fe-sidebar__tab-label {
  white-space: nowrap;
}

.fe-sidebar__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}
.fe-sidebar__content::-webkit-scrollbar {
  width: 4px;
}
.fe-sidebar__content::-webkit-scrollbar-track {
  background: transparent;
}
.fe-sidebar__content::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #1e2a45);
  border-radius: 2px;
}

/* Actions bar */
.fe-sidebar__actions {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.fe-sidebar__action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #1e2a45);
  background: transparent;
  color: var(--el-text-color-secondary, #8892a8);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.fe-sidebar__action-btn:hover {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  color: var(--el-text-color-primary, #e8edf5);
}
.fe-sidebar__action-btn--primary {
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  color: var(--el-color-primary-light-3, #60a5fa);
}
.fe-sidebar__action-btn--primary:hover {
  background: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  color: var(--el-color-primary-light-5, #93bbfc);
}

/* Search */
.fe-sidebar__search {
  position: relative;
  margin-bottom: 8px;
}
.fe-sidebar__search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--el-text-color-placeholder, #5a6478);
  pointer-events: none;
}
.fe-sidebar__search input {
  width: 100%;
  padding: 6px 8px 6px 26px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #1e2a45);
  background: var(--el-fill-color, #0b0f1a);
  color: var(--el-text-color-primary, #e8edf5);
  font-size: 11px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.fe-sidebar__search input::placeholder {
  color: var(--el-text-color-placeholder, #5a6478);
}
.fe-sidebar__search input:focus {
  border-color: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
}

/* List */
.fe-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}
.fe-sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.fe-sidebar__item:hover {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}
.fe-sidebar__item--active {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  padding: 7px;
}
.fe-sidebar__item-icon {
  color: var(--el-color-primary, #3b82f6);
  flex-shrink: 0;
  display: flex;
}
.fe-sidebar__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.fe-sidebar__item-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #e8edf5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fe-sidebar__item-meta {
  font-size: 10px;
  color: var(--el-text-color-placeholder, #5a6478);
}
.fe-sidebar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 8px;
  color: var(--el-text-color-placeholder, #5a6478);
  font-size: 12px;
}

/* Section title */
.fe-sidebar__section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--el-text-color-placeholder, #5a6478);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 4px 8px;
  border-top: 1px solid var(--el-border-color, #1e2a45);
  margin-top: 4px;
  padding-top: 12px;
}

/* Palette */
.fe-sidebar__palette-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.fe-sidebar__palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.fe-sidebar__palette-item:hover {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
}
.fe-sidebar__palette-item:active {
  cursor: grabbing;
}
.fe-sidebar__palette-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.fe-sidebar__palette-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fe-sidebar__palette-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.fe-sidebar__palette-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular, #c8d0e0);
}
.fe-sidebar__palette-detail {
  font-size: 10px;
  color: var(--el-text-color-placeholder, #5a6478);
}

/* Placeholder */
.fe-sidebar__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 200px;
  color: var(--el-text-color-placeholder, #5a6478);
  font-size: 13px;
  font-weight: 500;
}
</style>
