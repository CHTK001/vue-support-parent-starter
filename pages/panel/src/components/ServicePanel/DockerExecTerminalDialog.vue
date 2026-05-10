<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="Docker 终端"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template #header>
      <div class="dt-header">
        <span class="dt-header__title">Docker 终端</span>
        <span v-if="binding" class="dt-header__subtitle">{{ binding.softwareName }}</span>
        <div class="dt-header__status">
          <span class="dt-status-dot" :class="statusClass" />
          <span class="dt-status-text">{{ statusLabel }}</span>
        </div>
      </div>
    </template>

    <div class="dt-body">
      <div class="dt-input-row">
        <ElInput
          v-model="commandText"
          placeholder="输入命令，如 ls -la /"
          size="large"
          clearable
          :disabled="!connected"
          @keyup.enter="sendCommand"
        />
        <ElButton type="primary" size="large" @click="sendCommand" :disabled="!connected || !commandText.trim()">
          <IconifyIconOnline icon="ep:play" style="margin-right: 4px" />
          执行
        </ElButton>
      </div>

      <div class="dt-output" ref="outputRef">
        <div v-if="outputLines.length === 0 && !connecting" class="dt-empty">
          <IconifyIconOnline icon="ep:terminal" style="font-size: 32px; color: var(--el-text-color-placeholder)" />
          <span>连接终端后输入命令</span>
        </div>

        <div v-if="connecting" class="dt-connecting">
          <ElIcon class="is-loading" :size="20"><Loading /></ElIcon>
          <span>正在连接终端...</span>
        </div>

        <div v-for="(item, i) in outputLines" :key="i" class="dt-output-block" :class="{ 'is-status': item.isStatus }">
          <pre class="dt-line-text" :class="{ 'dt-cmd-prompt': item.isCommand }">{{ item.text }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dt-footer">
        <ElButton size="small" @click="clearOutput" :disabled="outputLines.length === 0">
          <IconifyIconOnline icon="ep:delete" style="margin-right: 4px" />
          清空
        </ElButton>
        <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, watch } from "vue";
import { ElButton, ElDialog, ElIcon, ElInput } from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useSocketService } from "@repo/core";
import type { WsMessage } from "@repo/core";
import type { SoftwareBinding } from "../../api/software";

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
  containerId?: string;
  containerName?: string;
  connectionId?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

// ─── State ──────────────────────────────────────────────

const sessionId = ref(generateId());
const commandText = ref("");
const connecting = ref(false);
const connected = ref(false);
const outputRef = ref<HTMLElement | null>(null);

interface OutputLine {
  text: string;
  isCommand: boolean;
  isStatus: boolean;
}

const outputLines = ref<OutputLine[]>([]);
const unsubFns: Array<() => void> = [];

// ─── Computed ───────────────────────────────────────────

const statusLabel = computed(() => {
  if (connecting.value) return "连接中";
  if (connected.value) return "已连接";
  return "未连接";
});

const statusClass = computed(() => {
  if (connecting.value) return "is-connecting";
  if (connected.value) return "is-connected";
  return "is-disconnected";
});

// ─── Socket lifecycle ───────────────────────────────────

let socketSvc: ReturnType<typeof useSocketService> | null = null;

function connectSocket() {
  socketSvc = useSocketService();
  if (!socketSvc) {
    addStatusLine("Socket 服务不可用，请检查连接");
    return;
  }

  if (!socketSvc.isConnected) {
    socketSvc.connect();
  }

  connecting.value = true;
  connected.value = false;

  // Subscribe to terminal output events
  const unsubOutput = socketSvc.subscribe("PROJECT", "docker.terminal.output", (msg: WsMessage) => {
    const d = (msg as any).data || msg;
    const line = d.line || d.message || "";
    if (line) {
      addOutputLine(line);
      scrollDown();
    }
  });
  unsubFns.push(unsubOutput);

  // Subscribe to terminal status events
  const unsubStatus = socketSvc.subscribe("PROJECT", "docker.terminal.status", (msg: WsMessage) => {
    const d = (msg as any).data || msg;
    const status = d.status || "";
    const message = d.message || "";
    if (status === "CONNECTED") {
      connecting.value = false;
      connected.value = true;
      if (message) addStatusLine(message);
    } else if (status === "RUNNING") {
      // Command is executing — show subtle indicator
    } else if (status === "COMPLETED") {
      // Execution finished
    } else if (status === "FAILED") {
      connecting.value = false;
      if (message) addStatusLine("错误: " + message);
    } else if (status === "DISCONNECTED") {
      connecting.value = false;
      connected.value = false;
      if (message) addStatusLine(message);
    } else if (status === "RESIZED") {
      // Terminal resize acknowledged
    }
  });
  unsubFns.push(unsubStatus);

  // Emit connect event
  const containerName = props.containerName || props.binding?.serviceName || props.binding?.softwareName || "";
  const bindingId = props.binding?.sysProjectContainerSoftwareBindingId;

  socketSvc.emit("docker.terminal.connect", JSON.stringify({
    sessionId: sessionId.value,
    connectionId: props.connectionId || "",
    containerName,
    bindingId,
  }));
}

function disconnectSocket() {
  try {
    const svc = socketSvc;
    if (svc) {
      svc.emit("docker.terminal.disconnect", JSON.stringify({
        sessionId: sessionId.value,
      }));
    }
  } catch { /* ignore */ }

  while (unsubFns.length) unsubFns.pop()?.();
  socketSvc = null;
  connecting.value = false;
  connected.value = false;
}

// ─── Commands ───────────────────────────────────────────

function sendCommand() {
  const cmd = commandText.value.trim();
  if (!cmd || !connected.value || !socketSvc) return;

  commandText.value = "";
  addCommandLine(cmd);
  scrollDown();

  // Emit input via socket
  try {
    socketSvc.emit("docker.terminal.input", JSON.stringify({
      sessionId: sessionId.value,
      input: cmd,
    }));
  } catch (err: any) {
    addStatusLine("发送失败: " + (err?.message || "未知错误"));
  }
}

// ─── Output helpers ─────────────────────────────────────

function addOutputLine(text: string) {
  outputLines.value.push({ text, isCommand: false, isStatus: false });
}

function addCommandLine(text: string) {
  outputLines.value.push({ text: "$ " + text, isCommand: true, isStatus: false });
}

function addStatusLine(text: string) {
  outputLines.value.push({ text, isCommand: false, isStatus: true });
}

function clearOutput() {
  outputLines.value = [];
}

function scrollDown() {
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
}

function generateId(): string {
  return "term-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

// ─── Lifecycle ──────────────────────────────────────────

onBeforeUnmount(() => {
  disconnectSocket();
});

// Handle visibility changes
watch(() => props.visible, (val) => {
  if (val) {
    sessionId.value = generateId();
    connectSocket();
  } else {
    disconnectSocket();
  }
}, { immediate: true });

const handleClose = () => {
  disconnectSocket();
};
</script>

<style scoped>
.dt-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dt-header__title {
  font-size: 15px;
  font-weight: 600;
}
.dt-header__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dt-header__status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.dt-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #94a3b8;
  transition: all 0.3s ease;
}
.dt-status-dot.is-connected {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}
.dt-status-dot.is-connecting {
  background: #f59e0b;
  animation: pulse-dt 1s ease-in-out infinite;
}
.dt-status-dot.is-disconnected {
  background: #ef4444;
}
@keyframes pulse-dt {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.dt-status-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dt-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dt-input-row {
  display: flex;
  gap: 8px;
}
.dt-input-row .el-input {
  flex: 1;
}

.dt-output {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: "Cascadia Code", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 480px;
  min-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.dt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 0;
  color: var(--el-text-color-placeholder);
}

.dt-connecting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 0;
  color: var(--el-text-color-placeholder);
}

.dt-output-block {
  margin-bottom: 4px;
}
.dt-output-block.is-status {
  margin-bottom: 8px;
}
.dt-output-block.is-status .dt-line-text {
  color: #94a3b8;
  font-style: italic;
  font-size: 11px;
}

.dt-line-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.dt-cmd-prompt {
  color: #a6e3a1;
  font-weight: 600;
}

.dt-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.dt-footer > .el-button:first-child {
  margin-right: auto;
}
</style>
