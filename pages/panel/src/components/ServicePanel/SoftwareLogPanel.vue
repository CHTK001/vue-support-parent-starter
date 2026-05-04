<template>
  <div
    v-if="visible"
    class="software-log-panel"
    :class="{ 'is-collapsed': collapsed }"
    :style="{ height: collapsed ? headerHeight + 'px' : localHeight + 'px' }"
  >
    <div class="log-panel__resize-handle" @mousedown="startDrag" />

    <div class="log-panel__header">
      <div class="log-panel__header-left">
        <span class="log-panel__status-dot" :class="{ connected: socketConnected }" />
        <span class="log-panel__title">运行日志</span>
        <ElSelect
          v-model="filterBindingId"
          size="small"
          style="width: 150px"
          placeholder="全部软件"
          clearable
        >
          <ElOption :value="0" label="全部软件" />
          <ElOption
            v-for="b in bindings"
            :key="b.sysProjectContainerSoftwareBindingId"
            :value="b.sysProjectContainerSoftwareBindingId"
            :label="b.softwareName"
          />
        </ElSelect>
      </div>
      <div class="log-panel__header-right">
        <ElButton size="small" :type="paused ? 'warning' : 'default'" @click="togglePause">
          {{ paused ? "继续" : "暂停" }}
        </ElButton>
        <ElButton size="small" @click="clearLogs">清空</ElButton>
        <ElButton size="small" circle @click="collapsed = !collapsed">
          <IconifyIconOnline :icon="collapsed ? 'ep:arrow-up' : 'ep:arrow-down'" />
        </ElButton>
        <ElButton size="small" circle @click="$emit('update:visible', false)">
          <IconifyIconOnline icon="ep:close" />
        </ElButton>
      </div>
    </div>

    <div v-show="!collapsed" class="log-panel__body">
      <div ref="scrollRef" class="log-panel__scroll thin-scroller" @scroll="handleScroll">
        <div v-if="displayedLogs.length === 0" class="log-panel__empty">暂无运行日志</div>
        <div
          v-for="(item, i) in displayedLogs"
          :key="i"
          class="log-line"
          :class="{
            'log-line--error': isErrorLine(item.line),
            'log-line--warn': isWarnLine(item.line),
          }"
        >
          <span class="log-line__num">{{ i + 1 }}</span>
          <span class="log-line__binding">[{{ getBindingName(item.bindingId) }}]</span>
          <pre class="log-line__text">{{ item.line }}</pre>
        </div>
      </div>
      <div
        v-if="newLineCount > 0"
        class="log-panel__new-bar"
        @click="scrollToBottom"
      >
        有 {{ newLineCount }} 条新日志
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from "vue";
import { ElButton, ElOption, ElSelect } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { SoftwareBinding } from "../../api/software";

const props = withDefaults(
  defineProps<{
    logsByBinding?: Record<number, string[]>;
    bindings?: SoftwareBinding[];
    visible: boolean;
    socketConnected?: boolean;
    defaultHeight?: number;
    minHeight?: number;
    maxHeight?: number;
    headerHeight?: number;
  }>(),
  {
    logsByBinding: () => ({}),
    bindings: () => [],
    socketConnected: false,
    defaultHeight: 250,
    minHeight: 100,
    maxHeight: 500,
    headerHeight: 40,
  },
);

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// ─── Collapse state ───────────────────────────────────────

const collapsed = ref(false);

// ─── Drag to resize ───────────────────────────────────────

const localHeight = ref(props.defaultHeight);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartHeight = ref(0);

const minH = computed(() => props.minHeight);
const maxH = computed(() => props.maxHeight);

const startDrag = (e: MouseEvent) => {
  if (collapsed.value) return;
  isDragging.value = true;
  dragStartY.value = e.clientY;
  dragStartHeight.value = localHeight.value;
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
  document.body.style.cursor = "ns-resize";
  document.body.style.userSelect = "none";
};

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const delta = dragStartY.value - e.clientY;
  localHeight.value = Math.max(
    minH.value,
    Math.min(maxH.value, dragStartHeight.value + delta),
  );
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
};

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
});

// ─── Log display & filtering ──────────────────────────────

const filterBindingId = ref(0);

interface LogEntry {
  bindingId: number;
  line: string;
}

/** Strip ANSI escape codes from terminal output */
const stripAnsi = (str: string) =>
  str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][0-9;]*[a-zA-Z]/g, "");

const displayedLogs = computed<LogEntry[]>(() => {
  const clean = (line: string) => stripAnsi(line);
  if (filterBindingId.value === 0) {
    const all: LogEntry[] = [];
    for (const [bid, lines] of Object.entries(props.logsByBinding)) {
      for (const line of lines) {
        all.push({ bindingId: Number(bid), line: clean(line) });
      }
    }
    return all;
  }
  const lines = props.logsByBinding[filterBindingId.value] || [];
  return lines.map((line) => ({ bindingId: filterBindingId.value, line: clean(line) }));
});

const getBindingName = (bindingId: number): string => {
  const b = props.bindings.find(
    (x) => x.sysProjectContainerSoftwareBindingId === bindingId,
  );
  return b?.softwareName || String(bindingId);
};

const isErrorLine = (line: string) =>
  /error|exception|traceback|fail|fatal/i.test(line);

const isWarnLine = (line: string) =>
  /warn|warnning|deprecated/i.test(line);

// ─── Pause / Resume ───────────────────────────────────────

const paused = ref(false);
const pausedLineBuffer = ref<LogEntry[]>([]);
const newLineCount = ref(0);

const togglePause = () => {
  paused.value = !paused.value;
  if (!paused.value) {
    // Resume: flush buffer into logs
    newLineCount.value = 0;
    pausedLineBuffer.value = [];
  }
};

// ─── Clear ────────────────────────────────────────────────

const clearLogs = () => {
  for (const bid of Object.keys(props.logsByBinding)) {
    props.logsByBinding[Number(bid)] = [];
  }
  newLineCount.value = 0;
};

// ─── Auto-scroll ──────────────────────────────────────────

const scrollRef = ref<HTMLElement | null>(null);
const isAtBottom = ref(true);

const checkAtBottom = () => {
  const el = scrollRef.value;
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
};

const handleScroll = () => {
  isAtBottom.value = checkAtBottom();
  if (isAtBottom.value) {
    newLineCount.value = 0;
  }
};

const scrollToBottom = () => {
  const el = scrollRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
    newLineCount.value = 0;
    isAtBottom.value = true;
  }
};

// Watch for new lines and auto-scroll or count
watch(
  () => displayedLogs.value.length,
  (_, old) => {
    if (paused.value) {
      newLineCount.value = newLineCount.value + (displayedLogs.value.length - (old || 0));
      return;
    }
    nextTick(() => {
      if (isAtBottom.value) {
        scrollToBottom();
      }
    });
  },
);

// ─── Reset height when defaultHeight prop changes ────────

watch(
  () => props.defaultHeight,
  (h) => {
    if (!isDragging.value) localHeight.value = h;
  },
);
</script>

<style scoped lang="scss">
.software-log-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--el-border-color-light);
  background: #0f172a;
  color: #dbeafe;
  overflow: hidden;
  transition: height 0.2s ease;

  &.is-collapsed {
    .log-panel__body,
    .log-panel__resize-handle {
      display: none;
    }
  }
}

/* ─── Resize handle ───────────────────────────────────── */

.log-panel__resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
  z-index: 2;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    transition: background 0.15s ease;
  }

  &:hover::before {
    background: var(--el-color-primary);
  }
}

/* ─── Header ───────────────────────────────────────────── */

.log-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
  min-height: 32px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.log-panel__header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.log-panel__header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.log-panel__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
  flex: none;
  transition: background 0.3s ease;

  &.connected {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
  }
}

.log-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  flex: none;
}

/* ─── Body ─────────────────────────────────────────────── */

.log-panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.log-panel__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.log-panel__empty {
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

/* ─── New line bar ─────────────────────────────────────── */

.log-panel__new-bar {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
  z-index: 2;
  transition: background 0.15s ease;

  &:hover {
    background: var(--el-color-primary-light-3);
  }
}

/* ─── Log lines ────────────────────────────────────────── */

.log-line {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 0 12px;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  min-height: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  &--error {
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.08);
  }

  &--warn {
    color: #fcd34d;
    background: rgba(245, 158, 11, 0.08);
  }
}

.log-line__num {
  flex: none;
  color: #475569;
  min-width: 32px;
  text-align: right;
  padding-right: 8px;
  user-select: none;
}

.log-line__binding {
  flex: none;
  color: #60a5fa;
  padding-right: 6px;
  user-select: none;
}

.log-line__text {
  flex: 1;
  min-width: 0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: inherit;
  font: inherit;
}

/* ─── Thin scroller ────────────────────────────────────── */

:deep(.thin-scroller)::-webkit-scrollbar {
  width: 6px;
}

:deep(.thin-scroller)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.thin-scroller)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* ─── Override ElSelect dark theme ─────────────────────── */

:deep(.el-select) .el-input__wrapper {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

:deep(.el-select) .el-input__inner {
  color: #e2e8f0;
  font-size: 12px;
}

:deep(.el-button) {
  font-size: 12px;
}

:deep(.el-button--small) {
  --el-button-size: 26px;
}
</style>
