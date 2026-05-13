<template>
  <div class="xt-container">
    <div ref="terminalContainer" class="xt-terminal" @wheel="handleWheel" />
    <button
      v-if="showLockButton"
      class="xt-lock-btn"
      :class="{ 'is-locked': isLocked }"
      :title="isLocked ? '解锁自动滚动' : '锁定自动滚动'"
      @click="toggleLock"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path
          v-if="isLocked"
          d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"
        />
        <path
          v-else
          d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick } from "vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface XtermOptions {
  cursorBlink?: boolean;
  cursorStyle?: "block" | "underline" | "bar";
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  theme?: Record<string, string>;
}

const props = withDefaults(defineProps<{
  /** 初始自动滚动状态 */
  autoScroll?: boolean;
  /** xterm 选项覆盖 */
  terminalOptions?: XtermOptions;
}>(), {
  autoScroll: true,
  terminalOptions: () => ({}),
});

const emit = defineEmits<{
  /** 用户输入数据 */
  "input": [data: string];
  /** 终端已初始化 */
  "ready": [];
}>();

// ─── Exposed methods ─────────────────────────────────────

/** 向终端写入文本 */
function write(text: string) {
  terminal?.write(text);
}

/** 向终端写入文本并换行 */
function writeln(text: string) {
  terminal?.writeln(text);
}

/** 清空终端 */
function clear() {
  terminal?.clear();
}

/** 滚动到底部 */
function scrollToBottom() {
  terminal?.scrollToBottom();
}

/** 获取终端行数 */
function getBufferLength(): number {
  return terminal?.buffer.active.length ?? 0;
}

defineExpose({ write, writeln, clear, scrollToBottom, getBufferLength });

// ─── State ────────────────────────────────────────────────

const terminalContainer = ref<HTMLElement | null>(null);
const showLockButton = ref(false);
const isLocked = ref(props.autoScroll);

let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let userScrolledUp = false;

// ─── Default theme (Catppuccin Mocha) ────────────────────

const defaultTheme: Record<string, string> = {
  background: "#1e1e2e",
  foreground: "#cdd6f4",
  cursor: "#f5e0dc",
  selectionBackground: "#585b70",
  black: "#45475a",
  red: "#f38ba8",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  blue: "#89b4fa",
  magenta: "#f5c2e7",
  cyan: "#94e2d5",
  white: "#bac2de",
  brightBlack: "#585b70",
  brightRed: "#f38ba8",
  brightGreen: "#a6e3a1",
  brightYellow: "#f9e2af",
  brightBlue: "#89b4fa",
  brightMagenta: "#f5c2e7",
  brightCyan: "#94e2d5",
  brightWhite: "#a6adc8",
};

// ─── Lifecycle ───────────────────────────────────────────

function init() {
  dispose();

  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: "block",
    fontSize: 13,
    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    lineHeight: 1.3,
    allowTransparency: true,
    theme: { ...defaultTheme, ...props.terminalOptions.theme },
    ...props.terminalOptions,
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  // Auto-scroll detection
  terminal.onScroll(() => {
    if (!terminal) return;
    const buffer = terminal.buffer.active;
    const isAtBottom = buffer.baseY + buffer.cursorY >= buffer.scrollBottom;
    if (isAtBottom && userScrolledUp) {
      userScrolledUp = false;
      showLockButton.value = false;
    }
  });

  terminal.onData((data: string) => {
    emit("input", data);
  });

  nextTick(() => {
    if (!terminalContainer.value) return;
    terminal!.open(terminalContainer.value);
    fitAddon!.fit();
    showLockButton.value = true;
    emit("ready");
  });
}

function fit() {
  nextTick(() => {
    try { fitAddon?.fit(); } catch { /* ignore */ }
  });
}

function dispose() {
  try { terminal?.dispose(); } catch { /* ignore */ }
  terminal = null;
  fitAddon = null;
}

// ─── Scroll lock/unlock ─────────────────────────────────

function handleWheel() {
  if (!terminal || isLocked.value) return;
  userScrolledUp = true;
  showLockButton.value = true;
}

function toggleLock() {
  isLocked.value = !isLocked.value;
  if (isLocked.value) {
    userScrolledUp = false;
    showLockButton.value = false;
    terminal?.scrollToBottom();
  } else {
    showLockButton.value = true;
  }
}

// ─── Watchers ────────────────────────────────────────────

watch(isLocked, (val) => {
  if (val) {
    userScrolledUp = false;
    terminal?.scrollToBottom();
  }
});

onBeforeUnmount(() => {
  dispose();
});

// Auto-init
init();
</script>

<style scoped>
.xt-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.xt-terminal {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e2e;
}

.xt-terminal :deep(.xterm) {
  padding: 8px;
  height: 100%;
}

.xt-lock-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(69, 71, 90, 0.8);
  color: #a6adc8;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.xt-container:hover .xt-lock-btn,
.xt-lock-btn.is-locked {
  opacity: 1;
}

.xt-lock-btn:hover {
  background: rgba(69, 71, 90, 1);
}

.xt-lock-btn.is-locked {
  background: rgba(137, 180, 250, 0.3);
  color: #89b4fa;
}
</style>

<style>
/* Global xterm overrides */
.xterm-viewport {
  scrollbar-width: thin;
  scrollbar-color: #45475a transparent;
}
.xterm-viewport::-webkit-scrollbar {
  width: 6px;
}
.xterm-viewport::-webkit-scrollbar-track {
  background: transparent;
}
.xterm-viewport::-webkit-scrollbar-thumb {
  background: #45475a;
  border-radius: 3px;
}
</style>
