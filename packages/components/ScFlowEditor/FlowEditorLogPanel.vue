<template>
  <div class="fe-log">
    <div class="fe-log__toolbar">
      <div class="fe-log__levels">
        <button
          v-for="lvl in levels"
          :key="lvl.key"
          class="fe-log__level-btn"
          :class="{ 'fe-log__level-btn--active': activeLevel === lvl.key }"
          @click="activeLevel = lvl.key"
        >{{ lvl.label }}</button>
      </div>
      <div class="fe-log__search">
        <svg class="fe-log__search-icon" viewBox="0 0 14 14" width="11" height="11" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input v-model="searchQuery" placeholder="搜索日志..." />
      </div>
      <button class="fe-log__clear-btn" @click="emit('clear')">清空</button>
    </div>
    <div class="fe-log__list" ref="logListRef">
      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="fe-log__entry"
        :class="`fe-log__entry--${log.level}`"
      >
        <span class="fe-log__time">{{ formatTime(log.timestamp) }}</span>
        <span class="fe-log__level-badge" :class="`fe-log__level-badge--${log.level}`">{{ log.level.toUpperCase() }}</span>
        <span v-if="log.source" class="fe-log__source">[{{ log.source }}]</span>
        <span class="fe-log__msg">{{ log.message }}</span>
      </div>
      <div v-if="filteredLogs.length === 0" class="fe-log__empty">
        {{ logs.length === 0 ? '暂无日志' : '无匹配日志' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}

const props = defineProps<{
  logs: LogEntry[];
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const levels = [
  { key: 'all', label: 'ALL' },
  { key: 'error', label: 'ERROR' },
  { key: 'warn', label: 'WARN' },
  { key: 'info', label: 'INFO' },
  { key: 'debug', label: 'DEBUG' },
];

const activeLevel = ref('all');
const searchQuery = ref('');

const filteredLogs = computed(() => {
  let result = props.logs;
  if (activeLevel.value !== 'all') {
    result = result.filter(l => l.level === activeLevel.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(l =>
      l.message.toLowerCase().includes(q) ||
      (l.source && l.source.toLowerCase().includes(q))
    );
  }
  return result;
});

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts;
  }
}
</script>

<style scoped>
.fe-log {
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color, #0b0f1a);
  border-top: 1px solid var(--el-border-color, #1e2a45);
  overflow: hidden;
}
.fe-log__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color, #1e2a45);
  flex-shrink: 0;
  background: var(--el-fill-color, #0b0f1a);
}
.fe-log__levels {
  display: flex;
  gap: 2px;
}
.fe-log__level-btn {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--el-text-color-placeholder, #5a6478);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.fe-log__level-btn:hover {
  color: var(--el-text-color-secondary, #8892a8);
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
}
.fe-log__level-btn--active {
  color: var(--el-color-primary-light-3, #60a5fa);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}
.fe-log__search {
  position: relative;
  flex: 1;
  max-width: 240px;
}
.fe-log__search-icon {
  position: absolute;
  left: 7px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--el-text-color-placeholder, #5a6478);
  pointer-events: none;
}
.fe-log__search input {
  width: 100%;
  padding: 4px 7px 4px 22px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color, #1e2a45);
  background: var(--el-fill-color, #0b0f1a);
  color: var(--el-text-color-primary, #e8edf5);
  font-size: 11px;
  outline: none;
  box-sizing: border-box;
}
.fe-log__search input::placeholder { color: var(--el-text-color-placeholder, #5a6478); }
.fe-log__search input:focus { border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent); }
.fe-log__clear-btn {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color, #1e2a45);
  background: transparent;
  color: var(--el-text-color-placeholder, #5a6478);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.fe-log__clear-btn:hover {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
  color: var(--el-color-danger, #ef4444);
}

.fe-log__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
}
.fe-log__list::-webkit-scrollbar { width: 4px; }
.fe-log__list::-webkit-scrollbar-track { background: transparent; }
.fe-log__list::-webkit-scrollbar-thumb { background: var(--el-border-color, #1e2a45); border-radius: 2px; }

.fe-log__entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 12px;
  transition: background 0.1s;
}
.fe-log__entry:hover { background: color-mix(in srgb, var(--el-color-primary) 3%, transparent); }
.fe-log__entry--error { background: color-mix(in srgb, var(--el-color-danger) 4%, transparent); }
.fe-log__entry--warn { background: color-mix(in srgb, var(--el-color-warning) 4%, transparent); }

.fe-log__time {
  color: var(--el-text-color-placeholder, #5a6478);
  flex-shrink: 0;
  font-size: 10px;
}
.fe-log__level-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.fe-log__level-badge--info { color: var(--el-color-primary-light-3, #60a5fa); background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); }
.fe-log__level-badge--warn { color: var(--el-color-warning, #eab308); background: color-mix(in srgb, var(--el-color-warning) 10%, transparent); }
.fe-log__level-badge--error { color: var(--el-color-danger, #ef4444); background: color-mix(in srgb, var(--el-color-danger) 10%, transparent); }
.fe-log__level-badge--debug { color: var(--el-text-color-secondary, #8892a8); background: color-mix(in srgb, var(--el-color-info) 8%, transparent); }

.fe-log__source {
  color: var(--el-color-info, #06b6d4);
  flex-shrink: 0;
  font-size: 10px;
}
.fe-log__msg {
  color: var(--el-text-color-regular, #c8d0e0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fe-log__entry--error .fe-log__msg { color: var(--el-color-danger-light-5, #fca5a5); }
.fe-log__entry--warn .fe-log__msg { color: var(--el-color-warning-light-5, #fde68a); }

.fe-log__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--el-text-color-placeholder, #5a6478);
  font-size: 11px;
}
</style>
