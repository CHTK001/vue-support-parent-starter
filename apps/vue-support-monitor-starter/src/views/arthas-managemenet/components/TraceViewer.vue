<template>
  <div class="trace-viewer">
    <div class="toolbar">
      <el-input v-model="classPattern" placeholder="类匹配（必填，如 com.demo.UserService）" style="min-width: 280px" />
      <el-input v-model="methodPattern" placeholder="方法匹配（可选，默认 *）" style="min-width: 200px" />
      <el-input v-model="condition" placeholder="条件表达式（可选，如 #cost>10）" style="min-width: 220px" />
      <el-checkbox v-model="useRegex">正则(-E)</el-checkbox>
      <el-input-number v-model="count" :min="1" :max="1000" :step="1" controls-position="right" />
      <span class="label">-n</span>
      <el-input-number v-model="expand" :min="0" :max="10" :step="1" controls-position="right" />
      <span class="label">-x</span>
      <el-button type="primary" :disabled="!nodeId || !classPatternTrim" @click="run">执行</el-button>
      <el-button @click="sendStop" :disabled="!connected">停止</el-button>
      <el-button @click="clearOutput">清屏</el-button>
    </div>
    <pre class="output" ref="outRef"></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, defineProps } from 'vue';

const props = defineProps<{ nodeId: string }>();

const ws = ref<WebSocket | null>(null);
const outRef = ref<HTMLElement | null>(null);
const connected = ref(false);
const connecting = ref(false);

const classPattern = ref("");
const methodPattern = ref("*");
const condition = ref("");
const useRegex = ref(false);
const count = ref(10);
const expand = ref(2);

const classPatternTrim = computed(() => classPattern.value.trim());

function baseUrl() { return '/monitor/api'; }
function buildWsUrl(nodeId: string) {
  const loc = window.location; const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${loc.host}${baseUrl()}/v1/arthas/console/ws?nodeId=${encodeURIComponent(nodeId)}`;
}

function connect() {
  if (!props.nodeId) return;
  if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING)) return;
  connecting.value = true;
  const url = buildWsUrl(props.nodeId);
  ws.value = new WebSocket(url);
  ws.value.onopen = () => { connected.value = true; connecting.value = false; append(`\n[connected] ${url}\n`); };
  ws.value.onmessage = evt => append(typeof evt.data === 'string' ? evt.data : '');
  ws.value.onclose = () => { connected.value = false; connecting.value = false; append(`\n[closed]\n`); };
  ws.value.onerror = () => { connecting.value = false; append(`\n[error]\n`); };
}

function disconnect() { try { ws.value?.close(); } catch {}; ws.value = null; }

function append(text: string) {
  const el = outRef.value; if (!el) return;
  el.textContent += text;
  el.scrollTop = el.scrollHeight;
}

function clearOutput() { if (outRef.value) outRef.value.textContent = ''; }

function buildCmd(): string {
  const parts: string[] = ['trace'];
  if (useRegex.value) parts.push('-E');
  parts.push(classPatternTrim.value);
  parts.push((methodPattern.value || '*').trim() || '*');
  const cond = (condition.value || '').trim();
  if (cond) parts.push(`'${cond}'`);
  if (count.value && count.value > 0) parts.push('-n', String(count.value));
  if (expand.value && expand.value > 0) parts.push('-x', String(expand.value));
  return parts.join(' ') + '\n';
}

function run() {
  if (!props.nodeId || !classPatternTrim.value) return;
  connect();
  const cmd = buildCmd();
  try { ws.value?.send(cmd); append(`\n> ${cmd}`); } catch {}
}

function sendStop() {
  // 发送 Ctrl+C（）尝试中断
  try { ws.value?.send('\u0003'); append('\n[interrupt]\n'); } catch {}
}

watch(() => props.nodeId, (n, o) => { if (n && n !== o) { disconnect(); clearOutput(); } });

onMounted(() => { if (props.nodeId) connect(); });

onBeforeUnmount(() => { disconnect(); });
</script>

<style scoped>
.trace-viewer { display: flex; flex-direction: column; height: 100%; }
.toolbar { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap; }
.label { color: var(--el-text-color-secondary); margin: 0 4px 0 0; }
.output { flex: 1; overflow: auto; background: #0b0f19; color: #e6edf3; padding: 10px; border-radius: 4px; white-space: pre-wrap; }
</style>

