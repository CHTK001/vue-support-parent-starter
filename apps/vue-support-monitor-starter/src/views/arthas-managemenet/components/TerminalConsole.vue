<template>
  <div class="terminal-console system-container modern-bg">
    <div class="toolbar">
      <el-input v-model="command" placeholder="输入 Arthas 命令，例如: thread | jvm | heap | logger | profiler" @keyup.enter.native="sendCommand" clearable />
      <el-button type="primary" @click="sendCommand" :disabled="!connected">执行</el-button>
      <el-button @click="clearOutput">清屏</el-button>
      <el-button @click="reconnect" :disabled="connecting">重连</el-button>
    </div>
    <div class="quick-cmds">
      <el-button size="small" @click="quick('help')">help</el-button>
      <el-button size="small" @click="quick('thread')">thread</el-button>
      <el-button size="small" @click="quick('jvm')">jvm</el-button>
      <el-button size="small" @click="quick('heap')">heap</el-button>
      <el-button size="small" @click="quick('logger')">logger</el-button>
      <el-button size="small" @click="quick('profiler start; sleep 10; profiler stop')">profiler</el-button>
    </div>
    <div class="output" :style="containerStyle" ref="xtermRef" @click="focusTerm"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { createWebSocketUrl } from "@/utils/guacamole";

const props = defineProps<{ nodeId: string }>();

const ws = ref<WebSocket | null>(null);
const xtermRef = ref<HTMLElement | null>(null);
const terminal = ref<Terminal | null>(null);
let fitAddon: FitAddon | null = null;
const command = ref("");
const connected = ref(false);
const connecting = ref(false);
let termDataDispose: { dispose: () => void } | null = null;
const fixedCols = ref<number>(0);
const fixedRows = ref<number>(0);
const containerStyle = ref<Record<string, string>>({});
function handleTermData(data: string) {
  if (!ws.value || !connected.value || !terminal.value) return;
  // 处理常见按键：回车、退格、Ctrl+C
  try {
    ws.value.send(data);
  } catch {}
}
function focusTerm() {
  terminal.value?.focus();
}

function buildWsUrl(nodeId: string) {
  return createWebSocketUrl("/v1/arthas/console/ws", "other", null, nodeId);
}

function append(text: string) {
  if (!terminal.value) return;
  requestAnimationFrame(() => {
    terminal.value!.write(text);
  });
}

function sendResize() {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) return;
  const cols = fixedCols.value || (terminal.value?.cols ?? 0);
  const rows = fixedRows.value || (terminal.value?.rows ?? 0);
  if (!cols || !rows) return;
  try {
    ws.value.send(JSON.stringify({ action: "resize", cols, rows }));
  } catch {}
}

function connect() {
  if (!props.nodeId) return;
  try {
    connecting.value = true;
    const url = buildWsUrl(props.nodeId);
    ws.value = new WebSocket(url);
    initialTerm();
    ws.value.onopen = () => {
      connected.value = true;
      connecting.value = false;
      // 连接成功，下发一次固定的 cols/rows
      sendResize();
    };
    ws.value.onmessage = (evt) => {
      if (typeof evt.data === "string") {
        append(evt.data);
      } else if (evt.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => append(String(reader.result || ""));
        reader.readAsText(evt.data);
      }
    };
    ws.value.onclose = () => {
      connected.value = false;
      connecting.value = false;
    };
    ws.value.onerror = () => {
      connecting.value = false;
    };
  } catch (e) {
    connecting.value = false;
  }
}

function disconnect() {
  if (ws.value) {
    try {
      ws.value.close();
    } catch {}
    ws.value = null;
  }
  if (terminal.value) {
    try {
      terminal.value.dispose();
    } catch {}
    terminal.value = null;
  }
  if (termDataDispose) {
    try {
      termDataDispose.dispose();
    } catch {}
    termDataDispose = null;
  }
  fitAddon = null;
}

function initialTerm() {
  // 初始化 xterm
  if (!terminal.value && xtermRef.value) {
    terminal.value = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#ffffff",
      },
      convertEol: true,
      windowsMode: true,
      scrollback: 2000,
    });
    fitAddon = new FitAddon();
    terminal.value.loadAddon(fitAddon);
    terminal.value.loadAddon(new WebLinksAddon());
    terminal.value.open(xtermRef.value);
    termDataDispose = terminal.value.onData(handleTermData);
    try {
      fitAddon.fit();
    } catch {}
    // 记录一次初始化计算得到的 cols/rows，并固定下来
    fixedCols.value = terminal.value.cols + 100;
    fixedRows.value = terminal.value.rows + 100;
    // 锁定容器尺寸为当前像素大小，避免后续布局变化
    const viewport = xtermRef.value.querySelector(".xterm-viewport") as HTMLElement | null;
    const box = viewport || xtermRef.value;
    const w = (box as HTMLElement).clientWidth;
    const h = (box as HTMLElement).clientHeight + 350;
    if (w && h) {
      containerStyle.value = { width: w + "px", height: h + "px" };
    }
    terminal.value.focus();
  }
}

function reconnect() {
  disconnect();
  clearOutput();
  connect();
}

function clearOutput() {
  if (terminal.value) terminal.value.clear();
}

function sendCommand() {
  if (!ws.value || !connected.value) return;
  const cmd = (command.value || "").trim();
  if (!cmd) return;
  // 发送换行以执行
  try {
    ws.value.send(cmd + "\n");
    append(`\n> ${cmd}\n`);
    command.value = "";
  } catch {}
}

function quick(cmd: string) {
  command.value = cmd;
  sendCommand();
}

watch(
  () => props.nodeId,
  (n, o) => {
    if (n && n !== o) reconnect();
  }
);

onMounted(() => {
  if (props.nodeId) {
    connect();
  }
});

onBeforeUnmount(() => {
  disconnect();
});
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.terminal-console {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.quick-cmds {
  display: flex;
  gap: 6px;
  margin: 4px 0 8px;
  flex-wrap: wrap;
}
.output {
  flex: 1;
  overflow: auto;
  background: #0b0f19;
  color: #e6edf3;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  overflow-x: hidden;
}
.output,
.xterm-viewport {
  scrollbar-color: var(--el-color-primary) transparent;
  /* 滑块颜色、轨道颜色 */

  /* Firefox */
  scrollbar-width: thin;

  /* 可选值为 'auto', 'thin', 'none' */
  ::-webkit-scrollbar {
    width: 6px;
    /* 滚动条宽度 */
  }

  /* 滚动条轨道 */
  ::-webkit-scrollbar-track {
    background: transparent;
    /* 轨道颜色 */
  }

  /* 滚动条滑块 */
  ::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-1);
    border-radius: 4px;
  }

  /* 滚动条滑块：hover状态 */
  ::-webkit-scrollbar-thumb:hover {
    background: var(--el-color-primary);
    /* 滑块hover颜色 */
  }
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
