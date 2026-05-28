<template>
  <header class="fe-header">
    <div class="fe-header__left">
      <svg class="fe-header__logo-icon" viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      <span class="fe-header__title">{{ title }}</span>
      <span class="fe-header__badge" :class="`fe-header__badge--${mode}`">
        {{ mode === 'edit' ? '编辑模式' : '预览模式' }}
      </span>
    </div>
    <div class="fe-header__right">
      <button class="fe-header__btn" :class="{ 'fe-header__btn--active': showRightPanel }" @click="emit('toggle-right-panel')" title="属性面板">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none"><rect x="1" y="2" width="6" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="6" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <button class="fe-header__btn" :class="{ 'fe-header__btn--active': showBottomPanel }" @click="emit('toggle-bottom-panel')" title="日志面板">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M2 3h12M2 6h12M2 9h8M2 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <button class="fe-header__btn" :class="{ 'fe-header__btn--active': showMinimap }" @click="emit('toggle-minimap')" title="小地图">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <button class="fe-header__btn" @click="emit('auto-layout')" title="自动布局">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M2 3h12M2 8h8M2 13h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 5l2-2-2-2M4 11l-2 2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="fe-header__divider" />
      <button class="fe-header__btn fe-header__btn--save" :class="{ 'fe-header__btn--saving': saving }" :disabled="saving" @click="emit('save')">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M13 5v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1h6l3 3z" stroke="currentColor" stroke-width="1.5"/><path d="M5 13V9h6v4M5 2v3h4" stroke="currentColor" stroke-width="1.5"/></svg>
        <span>{{ saving ? '保存中...' : '保存' }}</span>
      </button>
      <span v-if="lastSaveTime" class="fe-header__time">{{ lastSaveTime }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  mode: 'preview' | 'edit';
  title: string;
  showRightPanel: boolean;
  showBottomPanel: boolean;
  showMinimap: boolean;
  saving: boolean;
  lastSaveTime: string;
}>();

const emit = defineEmits<{
  (e: 'toggle-right-panel'): void;
  (e: 'toggle-bottom-panel'): void;
  (e: 'toggle-minimap'): void;
  (e: 'save'): void;
  (e: 'auto-layout'): void;
}>();
</script>

<style scoped>
.fe-header {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--el-fill-color, #0b0f1a);
  border-bottom: 1px solid var(--el-border-color, #1e2a45);
  z-index: 100;
  user-select: none;
}
.fe-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fe-header__logo-icon {
  color: var(--el-color-primary, #3b82f6);
}
.fe-header__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #e8edf5);
  letter-spacing: 0.3px;
}
.fe-header__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.3px;
}
.fe-header__badge--edit {
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  color: var(--el-color-primary-light-3, #60a5fa);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.fe-header__badge--preview {
  background: color-mix(in srgb, var(--el-color-info) 12%, transparent);
  color: var(--el-color-info, #94a3b8);
  border: 1px solid color-mix(in srgb, var(--el-color-info) 20%, transparent);
}
.fe-header__right {
  display: flex;
  align-items: center;
  gap: 2px;
}
.fe-header__btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--el-text-color-secondary, #8892a8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.fe-header__btn:hover {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-text-color-primary, #e8edf5);
  border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}
.fe-header__btn--active {
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  color: var(--el-color-primary-light-3, #60a5fa);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.fe-header__divider {
  width: 1px;
  height: 20px;
  background: var(--el-border-color, #1e2a45);
  margin: 0 6px;
}
.fe-header__btn--save {
  width: auto;
  padding: 0 12px;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-white, #e8edf5);
  background: var(--el-color-primary, #3b82f6);
  border-color: var(--el-color-primary, #3b82f6);
}
.fe-header__btn--save:hover {
  background: var(--el-color-primary-dark-2, #2563eb);
  border-color: var(--el-color-primary-dark-2, #2563eb);
  color: var(--el-color-white, #fff);
}
.fe-header__btn--saving {
  opacity: 0.6;
  pointer-events: none;
}
.fe-header__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #5a6478);
  margin-left: 8px;
  white-space: nowrap;
}
</style>
