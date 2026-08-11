<!--
  ReSshViewer —— SSH 远控 Viewer（xterm.js 终端）
  通过 WebSocket 与后端 SshBridge 通信。
  设计风格：低饱和度 · 暗色终端 · 简洁边框
-->
<template>
  <div class="ssh-viewer flex w-full flex-col gap-2">
    <div ref="terminalContainerRef" class="ssh-terminal"></div>
    <div v-if="status" class="ssh-viewer__status text-[12px] text-el-text-secondary">
      {{ status }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const props = defineProps<{
  wsUrl: string;
}>();

const status = ref<string>("");
const terminalContainerRef = ref<HTMLDivElement | null>(null);

let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;

onMounted(() => {
  const container = terminalContainerRef.value;
  if (!container) {
    status.value = "终端容器未挂载";
    return;
  }
  terminal = new Terminal({
    cursorBlink: true,
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: 14,
    theme: {
      background: "#0a0e14",
      foreground: "#c0c5cf",
    },
  });
  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(container);
  fitAddon.fit();

  ws = new WebSocket(props.wsUrl);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    status.value = "已连接";
    terminal?.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  };
  ws.onmessage = (evt) => {
    if (typeof evt.data === "string") {
      terminal?.write(evt.data);
    } else if (evt.data instanceof ArrayBuffer) {
      terminal?.write(new TextDecoder().decode(evt.data));
    }
  };
  ws.onerror = () => {
    status.value = "WS 错误";
  };
  ws.onclose = () => {
    status.value = "已断开";
  };

  window.addEventListener("resize", handleResize);
});

function handleResize(): void {
  if (fitAddon) {
    fitAddon.fit();
  }
}

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (ws) {
    ws.close();
    ws = null;
  }
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
  fitAddon = null;
});
</script>

<style scoped>
.ssh-terminal {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: #0a0e14;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: 4px;
}
</style>
