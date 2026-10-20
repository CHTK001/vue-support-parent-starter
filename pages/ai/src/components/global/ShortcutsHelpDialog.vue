<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div v-if="visible" class="shortcuts-overlay" @click.self="close">
        <div class="shortcuts-dialog">
          <div class="shortcuts-header">
            <h3 class="shortcuts-title">
              <el-icon size="18"><Keyboard24Regular /></el-icon>
              {{ t('chat.shortcuts.title') }}
            </h3>
            <button class="shortcuts-close" type="button" aria-label="Close" @click="close">
              <el-icon size="16"><Dismiss20Regular /></el-icon>
            </button>
          </div>
          <div class="shortcuts-body">
            <div v-for="group in groups" :key="group.title" class="shortcuts-group">
              <div class="shortcuts-group-title">{{ group.title }}</div>
              <div v-for="item in group.items" :key="item.label" class="shortcuts-row">
                <span class="shortcuts-label">{{ item.label }}</span>
                <span class="shortcuts-keys">
                  <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
                </span>
              </div>
            </div>
          </div>
          <div class="shortcuts-footer">
            <span class="palette-footer-hint">
              <kbd>ESC</kbd> {{ t('common.close') }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Keyboard24Regular, Dismiss20Regular } from '@vicons/fluent'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  'update:visible': [v: boolean]
}>()

const { t } = useI18n()

const close = () => emit('update:visible', false)

const groups = [
  {
    title: t('chat.shortcuts.groupChat'),
    items: [
      { label: t('chat.shortcuts.newChat'), keys: ['Ctrl', 'N'] },
      { label: t('chat.shortcuts.sendMessage'), keys: ['Ctrl', 'Enter'] },
      { label: t('chat.shortcuts.commandPalette'), keys: ['Ctrl', 'K'] },
      { label: t('chat.shortcuts.shortcutsHelp'), keys: ['Ctrl', '/'] },
    ],
  },
  {
    title: t('chat.shortcuts.groupMessage'),
    items: [
      { label: t('chat.shortcuts.quoteMessage'), keys: ['消息操作栏', '引用'] },
      { label: t('chat.shortcuts.viewSource'), keys: ['消息操作栏', '源码'] },
      { label: t('chat.shortcuts.exportMarkdown'), keys: ['消息操作栏', '导出'] },
    ],
  },
  {
    title: t('chat.shortcuts.groupNavigation'),
    items: [
      { label: t('chat.shortcuts.searchSessions'), keys: ['Ctrl', 'Shift', 'F'] },
      { label: t('chat.shortcuts.newline'), keys: ['Shift', 'Enter'] },
    ],
  },
]
</script>

<style scoped>
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}
.shortcuts-dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: var(--color-surface, #fff);
  color: var(--color-text, var(--el-text-color-primary));
  border: 1px solid var(--color-surface-border, var(--el-border-color));
  box-shadow: var(--el-box-shadow-lighter, 0 4px 16px rgba(0, 0, 0, 0.2));
  overflow: hidden;
}
.dark .shortcuts-dialog {
  background: #1f2025;
  color: #e5e7eb;
}
.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-surface-border, var(--el-border-color));
}
.shortcuts-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.shortcuts-close {
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}
.shortcuts-close:hover {
  background: var(--el-fill-color);
}
.shortcuts-body {
  padding: 12px 16px;
  overflow-y: auto;
}
.shortcuts-group + .shortcuts-group {
  margin-top: 14px;
}
.shortcuts-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.shortcuts-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 2px;
  font-size: 13px;
}
.shortcuts-row + .shortcuts-row {
  border-top: 1px solid var(--el-border-color-lighter, rgba(0, 0, 0, 0.05));
}
.shortcuts-keys {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.shortcuts-keys kbd {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  border-bottom-width: 2px;
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  white-space: nowrap;
}
.shortcuts-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--color-surface-border, var(--el-border-color));
  text-align: right;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.18s ease;
}
.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}
</style>
