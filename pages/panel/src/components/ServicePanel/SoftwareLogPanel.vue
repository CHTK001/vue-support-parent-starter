<template>
  <div
    v-if="visible"
    class="software-log-panel"
    :style="panelStyle"
  >
    <!-- Resize handle on left edge (only when expanded) -->
    <div
      v-if="!collapsed"
      class="log-panel__resize-handle"
      @mousedown="startDrag"
    />

    <!-- Collapsed vertical bar -->
    <div v-if="collapsed" class="log-panel__collapsed-bar" @click="collapsed = false" title="展开日志">
      <IconifyIconOffline icon="ep:d-arrow-left" />
    </div>

    <!-- Expanded content -->
    <template v-if="!collapsed">
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
          <ElButton size="small" circle @click="collapsed = true">
            <IconifyIconOffline icon="ep:d-arrow-right" />
          </ElButton>
          <ElButton size="small" circle @click="$emit('update:visible', false)">
            <IconifyIconOffline icon="ep:close" />
          </ElButton>
        </div>
      </div>

      <div class="log-panel__body">
        <div ref="scrollRef" class="log-panel__scroll thin-scroller" @scroll="handleScroll">
          <div v-if="displayedLogs.length === 0" class="log-panel__empty">暂无运行日志</div>
          <div
            v-for="(item, i) in displayedLogs"
            :key="i"
            class="log-line"
            :class="[`log-line--${item.level}`]"
          >
            <span class="log-line__num">{{ i + 1 }}</span>
            <span v-if="item.timestamp" class="log-line__ts">{{ item.timestamp }}</span>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from "vue";
import { ElButton, ElOption, ElSelect } from "element-plus";
import { IconifyIconOffline } from "@repo/components/ReIcon";
import type { SoftwareBinding } from "../../api/software";

const props = withDefaults(
  defineProps<{
    logsByBinding?: Record<number, string[]>;
    bindings?: SoftwareBinding[];
    visible: boolean;
    socketConnected?: boolean;
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
  }>(),
  {
    logsByBinding: () => ({}),
    bindings: () => [],
    socketConnected: false,
    defaultWidth: 380,
    minWidth: 200,
    maxWidth: 700,
  },
);

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// ─── Collapse state ───────────────────────────────────────

const collapsed = ref(false);

// ─── Panel style computed ──────────────────────────────────

const panelStyle = computed(() => {
  if (collapsed.value) return { width: '32px' };
  return { width: localWidth.value + 'px' };
});

// ─── Drag to resize (horizontal) ───────────────────────────

const localWidth = ref(props.defaultWidth);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartWidth = ref(0);

const minW = computed(() => props.minWidth);
const maxW = computed(() => props.maxWidth);

const startDrag = (e: MouseEvent) => {
  if (collapsed.value) return;
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartWidth.value = localWidth.value;
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
  document.body.style.cursor = "ew-resize";
  document.body.style.userSelect = "none";
};

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const delta = dragStartX.value - e.clientX;
  localWidth.value = Math.max(
    minW.value,
    Math.min(maxW.value, dragStartWidth.value + delta),
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
  level: "info" | "success" | "warn" | "error" | "config" | "system";
  timestamp: string;
}

/** Strip ANSI escape codes from terminal output */
const stripAnsi = (str: string) =>
  str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][0-9;]*[a-zA-Z]/g, "");

/** Extract timestamp prefix like [14:30:25] from line start */
const extractTimestamp = (line: string): { timestamp: string; rest: string } => {
  const m = line.match(/^(\[\d{2}:\d{2}:\d{2}\])\s*/);
  if (m) return { timestamp: m[1], rest: line.slice(m[0].length) };
  return { timestamp: "", rest: line };
};

/** Detect log level from line content */
const detectLevel = (line: string): LogEntry["level"] => {
  if (/^\[成功\]/.test(line)) return "success";
  if (/^\[配置\]/.test(line)) return "config";
  if (/^\[错误\]/.test(line)) return "error";
  if (/^\[警告\]/.test(line)) return "warn";
  if (/^\[信息\]/.test(line)) return "info";
  // Fallback: English keyword matching
  if (/error|exception|traceback|fail|fatal/i.test(line)) return "error";
  if (/warn|warnning|deprecated/i.test(line)) return "warn";
  if (/^\[system\]/i.test(line)) return "system";
  return "info";
};

const displayedLogs = computed<LogEntry[]>(() => {
  const clean = (line: string) => stripAnsi(line);
  const buildEntries = (bid: number, lines: string[]): LogEntry[] =>
    lines.map((line) => {
      const cleaned = clean(line);
      const { timestamp, rest } = extractTimestamp(cleaned);
      return {
        bindingId: bid,
        line: cleaned,
        level: detectLevel(rest),
        timestamp,
      };
    });
  if (filterBindingId.value === 0) {
    const all: LogEntry[] = [];
    for (const [bid, lines] of Object.entries(props.logsByBinding)) {
      all.push(...buildEntries(Number(bid), lines));
    }
    return all;
  }
  const lines = props.logsByBinding[filterBindingId.value] || [];
  return buildEntries(filterBindingId.value, lines);
});

const getBindingName = (bindingId: number): string => {
  const b = props.bindings.find(
    (x) => x.sysProjectContainerSoftwareBindingId === bindingId,
  );
  return b?.softwareName || String(bindingId);
};

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

// ─── Reset width when defaultWidth prop changes ────────

watch(
  () => props.defaultWidth,
  (w) => {
    if (!isDragging.value) localWidth.value = w;
  },
);
</script>

<style scoped lang="scss">
.software-log-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--el-border-color-light);
  border-top: 2px solid var(--el-color-primary);
  background: linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%);
  color: #dbeafe;
  overflow: hidden;
  transition: width 0.2s ease;
  flex-shrink: 0;
}

/* ─── Resize handle (left edge) ─────────────────────────── */

.log-panel__resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
  z-index: 2;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 4px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    transition: background 0.15s ease;
  }

  &:hover::before {
    background: var(--el-color-primary);
  }
}

/* ─── Collapsed bar ──────────────────────────────────────── */

.log-panel__collapsed-bar {
  width: 32px;
  min-width: 32px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.95);
  color: #94a3b8;
  font-size: 18px;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #f1f5f9;
    background: rgba(30, 41, 59, 0.95);
  }
}

/* ─── Header ─────────────────────────────────────────────── */

.log-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
  min-height: 32px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(96, 165, 250, 0.15);
  flex-shrink: 0;
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
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.6), 0 0 12px rgba(34, 197, 94, 0.2);
  }
}

.log-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  flex: none;
  letter-spacing: 0.3px;
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
    border-left: 3px solid #ef4444;
    padding-left: 9px;
  }

  &--warn {
    color: #fcd34d;
    background: rgba(245, 158, 11, 0.08);
    border-left: 3px solid #f59e0b;
    padding-left: 9px;
  }

  &--success {
    color: #22c55e;
    border-left: 3px solid #22c55e;
    padding-left: 9px;
  }

  &--config {
    color: #60a5fa;
    border-left: 3px solid #3b82f6;
    padding-left: 9px;
  }

  &--system {
    color: #a78bfa;
    border-left: 3px solid #8b5cf6;
    padding-left: 9px;
  }
}

.log-line__ts {
  flex: none;
  color: #64748b;
  padding-right: 6px;
  user-select: none;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
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
