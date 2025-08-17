<template>
  <div class="terminal-console">
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
    <pre class="output" ref="outputRef"></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, defineProps } from 'vue';

const props = defineProps<{ nodeId: string }>();

const ws = ref<WebSocket | null>(null);
const outputRef = ref<HTMLElement | null>(null);
const command = ref("");
const connected = ref(false);
const connecting = ref(false);

function baseUrl() {
  // 与应用 application.yaml BaseUrl 保持一致，默认 /monitor/api
  return '/monitor/api';
}

function buildWsUrl(nodeId: string) {
  const loc = window.location;
  const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = loc.host;
  return `${protocol}//${host}${baseUrl()}/v1/arthas/console/${encodeURIComponent(nodeId)}/ws`;
}

function append(text: string) {
  if (!outputRef.value) return;
  outputRef.value.textContent += text;
  outputRef.value.scrollTop = outputRef.value.scrollHeight;
}

function connect() {
  if (!props.nodeId) return;
  try {
    connecting.value = true;
    const url = buildWsUrl(props.nodeId);
    ws.value = new WebSocket(url);
    ws.value.onopen = () => {
      connected.value = true;
      connecting.value = false;
      append(`\n[connected] ${url}\n`);
    };
    ws.value.onmessage = (evt) => {
      const data = typeof evt.data === 'string' ? evt.data : '';
      append(data);
    };
    ws.value.onclose = () => {
      connected.value = false;
      connecting.value = false;
      append(`\n[closed]\n`);
    };
    ws.value.onerror = () => {
      connecting.value = false;
      append(`\n[error]\n`);
    };
  } catch (e) {
    connecting.value = false;
  }
}

function disconnect() {
  if (ws.value) {
    try { ws.value.close(); } catch {}
    ws.value = null;
  }
}

function reconnect() {
  disconnect();
  clearOutput();
  connect();
}

function clearOutput() {
  if (outputRef.value) outputRef.value.textContent = '';
}

function sendCommand() {
  if (!ws.value || !connected.value) return;
  const cmd = (command.value || '').trim();
  if (!cmd) return;
  // 发送换行以执行
  try {
    ws.value.send(cmd + "\n");
    append(`\n> ${cmd}\n`);
    command.value = '';
  } catch {}
}

function quick(cmd: string) {
  command.value = cmd;
  sendCommand();
}

watch(() => props.nodeId, (n, o) => {
  if (n && n !== o) reconnect();
});

onMounted(() => {
  if (props.nodeId) connect();
});

onBeforeUnmount(() => {
  disconnect();
});
</script>

<style scoped>
.terminal-console { display: flex; flex-direction: column; height: 100%; }
.toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
.quick-cmds { display: flex; gap: 6px; margin: 4px 0 8px; flex-wrap: wrap; }
.output { flex: 1; overflow: auto; background: #0b0f19; color: #e6edf3; padding: 10px; border-radius: 4px; white-space: pre-wrap; }
</style>

