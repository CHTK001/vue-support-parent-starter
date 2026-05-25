<template>
  <div class="ssh-terminal">
    <!-- 连接状态提示 -->
    <div v-if="connectionState === 'disconnected'" class="terminal-placeholder">
      <el-icon :size="48"><Monitor /></el-icon>
      <p>SSH 终端未连接</p>
      <span class="hint">请在左侧面板填写连接信息并点击"连接"</span>
    </div>

    <div
      v-show="connectionState !== 'disconnected'"
      ref="terminalContainer"
      class="terminal-container"
      @click="focusTerminal"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { Monitor } from "@element-plus/icons-vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const props = defineProps<{
  sessionId: string | null;
  connectionState: string;
}>();

const emit = defineEmits<{
  input: [sessionId: string, data: string];
  resize: [sessionId: string, cols: number, rows: number];
}>();

const terminalContainer = ref<HTMLElement>();
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let initialized = false;

function initTerminal() {
  if (initialized || !terminalContainer.value) return;

  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: "block",
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    lineHeight: 1.2,
    cols: 80,
    rows: 24,
    theme: {
      background: "#1a1b26",
      foreground: "#a9b1d6",
      cursor: "#c0caf5",
      selectionBackground: "#33467c",
      black: "#32344a",
      red: "#f7768e",
      green: "#9ece6a",
      yellow: "#e0af68",
      blue: "#7aa2f7",
      magenta: "#bb9af7",
      cyan: "#7dcfff",
      white: "#a9b1d6",
      brightBlack: "#444b6a",
      brightRed: "#f7768e",
      brightGreen: "#9ece6a",
      brightYellow: "#e0af68",
      brightBlue: "#7aa2f7",
      brightMagenta: "#bb9af7",
      brightCyan: "#7dcfff",
      brightWhite: "#c0caf5",
    },
    allowProposedApi: true,
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminal.open(terminalContainer.value);

  // 等DOM渲染后自适应
  nextTick(() => {
    fitAddon?.fit();
  });

  // 用户输入转发
  terminal.onData((data: string) => {
    if (props.sessionId) {
      emit("input", props.sessionId, data);
    }
  });

  // 终端尺寸变化
  terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
    if (props.sessionId) {
      emit("resize", props.sessionId, cols, rows);
    }
  });

  initialized = true;
}

function focusTerminal() {
  terminal?.focus();
}

// 窗口变化自适应
function handleResize() {
  if (fitAddon) {
    try {
      fitAddon.fit();
    } catch {
      // ignore
    }
  }
}

// 外部写入终端数据
function writeToTerminal(data: string) {
  if (terminal) {
    terminal.write(data);
  }
}

// 清屏
function clearTerminal() {
  terminal?.clear();
}

// 重置终端（断开后重新初始化用）
function resetTerminal() {
  initialized = false;
  if (terminal) {
    terminal.dispose();
    terminal = null;
    fitAddon = null;
  }
}

defineExpose({ writeToTerminal, clearTerminal, resetTerminal });

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
});

// 连接成功后初始化终端
watch(
  () => props.connectionState,
  (state) => {
    if (state === "connecting" || state === "connected") {
      nextTick(() => initTerminal());
    } else if (state === "disconnected") {
      resetTerminal();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.ssh-terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.terminal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  gap: 12px;
}

.terminal-placeholder p {
  font-size: 16px;
  margin: 0;
}

.terminal-placeholder .hint {
  font-size: 13px;
}

.terminal-container {
  flex: 1;
  background: #1a1b26;
  border-radius: 6px;
  overflow: hidden;
  padding: 4px;
}

/* 隐藏 xterm 原生滚动条，终端自己处理滚动 */
.terminal-container :deep(.xterm-viewport)::-webkit-scrollbar {
  width: 0;
  display: none;
}
.terminal-container :deep(.xterm-viewport) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>
