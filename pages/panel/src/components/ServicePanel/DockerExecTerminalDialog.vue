<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="Docker 终端"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
    @opened="fitTerminal"
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
      <XtermTerminal
        ref="xtermRef"
        :auto-scroll="true"
        @input="sendInput"
      />
    </div>

    <template #footer>
      <div class="dt-footer">
        <ElButton size="small" @click="clearTerminal" :disabled="!connected">
          <IconifyIconOnline icon="ep:delete" style="margin-right: 4px" />
          清空
        </ElButton>
        <ElButton size="small" @click="reconnectTerminal" :disabled="connecting">
          <IconifyIconOnline icon="ep:refresh" style="margin-right: 4px" />
          重连
        </ElButton>
        <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, nextTick } from "vue";
import { ElButton, ElDialog } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useSocketService, DockerTopics } from "@repo/core";
import type { WsMessage } from "@repo/core";
import type { SoftwareBinding } from "../../api/software";
import XtermTerminal from "./XtermTerminal.vue";

// ── Docker 连接（使用 fetch 代替 Axios 避免超时问题）────
async function fetchOpenDockerConnection(host: string, port: number, protocol: string): Promise<{ code: string; data?: string } | null> {
  try {
    const resp = await fetch("/v1/panel/docker/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, port, protocol }),
    });
    return await resp.json();
  } catch (e) {
    console.warn("[DockerTerminal] fetch 连接失败:", e);
    return null;
  }
}

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
  containerId?: string;
  containerName?: string;
  connectionId?: string;
  dockerApiHost?: string;
  dockerApiPort?: string;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
}>();

// ─── State ──────────────────────────────────────────────

const sessionId = ref(generateId());
const connecting = ref(false);
const connected = ref(false);
const xtermRef = ref<InstanceType<typeof XtermTerminal> | null>(null);

let socketSvc: ReturnType<typeof useSocketService> | null = null;
let connectionIdInternal = "";
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

// ─── Terminal operations ────────────────────────────────

function clearTerminal() {
  xtermRef.value?.clear();
}

async function reconnectTerminal() {
  disconnectSocket();
  sessionId.value = generateId();
  xtermRef.value?.clear();
  await connectSocket();
}

function fitTerminal() {
  nextTick(() => {
    try { xtermRef.value?.scrollToBottom(); } catch { /* ignore */ }
  });
}

// ─── Socket lifecycle ───────────────────────────────────

async function connectSocket() {
  socketSvc = useSocketService();
  if (!socketSvc) {
    return;
  }

  if (!socketSvc.isConnected) {
    socketSvc.connect();
  }

  connecting.value = true;
  connected.value = false;

  // ── Establish Docker connection if needed ──────────
  connectionIdInternal = props.connectionId || "";
  if (!connectionIdInternal && props.dockerApiHost) {
    try {
      const res = await fetchOpenDockerConnection(
        props.dockerApiHost,
        Number(props.dockerApiPort || 2375),
        "tcp",
      );
      if (res?.code === "00000" && res.data) {
        connectionIdInternal = res.data;
      }
    } catch (e) {
      console.warn("[DockerTerminal] 自动建立 Docker 连接失败:", e);
    }
  }

  if (!connectionIdInternal) {
    connecting.value = false;
    xtermRef.value?.writeln("\r\n\x1b[91m错误: 未配置 Docker API 连接\x1b[0m");
    return;
  }

  // ── Subscribe terminal output ──────────────────────
  const unsubOutput = socketSvc.subscribe(
    DockerTopics.MODULE,
    DockerTopics.EVENTS.TERMINAL_OUTPUT,
    (msg: WsMessage) => {
      const d = (msg as any).data || msg;
      const rawData = d.data;
      if (!rawData) return;
      try {
        const binaryStr = atob(rawData);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const text = new TextDecoder("utf-8").decode(bytes);
        xtermRef.value?.write(text);
      } catch { /* ignore decode errors */ }
    },
  );
  unsubFns.push(unsubOutput);

  // ── Subscribe terminal status ──────────────────────
  const unsubStatus = socketSvc.subscribe(
    DockerTopics.MODULE,
    DockerTopics.EVENTS.TERMINAL_STATUS,
    (msg: WsMessage) => {
      const d = (msg as any).data || msg;
      const status = d.status || "";
      const message = d.message || "";
      if (status === "CONNECTED") {
        connecting.value = false;
        connected.value = true;
        if (message) {
          xtermRef.value?.writeln("\r\n\x1b[90m" + message + "\x1b[0m");
        }
      } else if (status === "FAILED") {
        connecting.value = false;
        if (message) {
          xtermRef.value?.writeln("\r\n\x1b[91m错误: " + message + "\x1b[0m");
        }
      } else if (status === "DISCONNECTED") {
        connecting.value = false;
        connected.value = false;
        if (message) {
          xtermRef.value?.writeln("\r\n\x1b[90m" + message + "\x1b[0m");
        }
      } else if (status === "COMPLETED") {
        if (message) {
          xtermRef.value?.writeln("\r\n\x1b[90m" + message + "\x1b[0m");
        }
      }
    },
  );
  unsubFns.push(unsubStatus);

  // ── Emit connect event ─────────────────────────────
  const containerName = props.containerId || props.containerName || props.binding?.serviceName || props.binding?.softwareName || "";
  const bindingId = props.binding?.sysProjectContainerSoftwareBindingId;

  socketSvc.emit(
    DockerTopics.EVENTS.TERMINAL_CONNECT,
    JSON.stringify({
      sessionId: sessionId.value,
      connectionId: connectionIdInternal,
      containerName,
      bindingId,
    }),
  );
}

function disconnectSocket() {
  try {
    const svc = socketSvc;
    if (svc && connectionIdInternal) {
      svc.emit(
        DockerTopics.EVENTS.TERMINAL_DISCONNECT,
        JSON.stringify({ sessionId: sessionId.value }),
      );
    }
  } catch { /* ignore */ }

  while (unsubFns.length) unsubFns.pop()?.();
  socketSvc = null;
  connectionIdInternal = "";
  connecting.value = false;
  connected.value = false;
}

// ─── Input sending ─────────────────────────────────────

function sendInput(data: string) {
  if (!connected.value || !socketSvc || !connectionIdInternal) return;

  try {
    socketSvc.emit(
      DockerTopics.EVENTS.TERMINAL_INPUT,
      JSON.stringify({
        sessionId: sessionId.value,
        input: data,
      }),
    );
  } catch { /* ignore */ }
}

// ─── Helpers ────────────────────────────────────────────

function generateId(): string {
  return "term-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

// ─── Lifecycle ──────────────────────────────────────────

onBeforeUnmount(() => {
  disconnectSocket();
});

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => connectSocket());
    } else {
      disconnectSocket();
    }
  },
);

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
}

.dt-body > .xt-container {
  height: 480px;
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
