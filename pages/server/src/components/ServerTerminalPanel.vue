<template>
  <div class="server-terminal-panel" :class="{ 'is-disconnected': connectionStatus === 'disconnected' }">
    <!-- Header -->
    <div class="server-terminal-panel__header">
      <div class="server-terminal-panel__header-left">
        <IconifyIconOnline icon="ri:terminal-line" />
        <span>终端</span>
        <ScTag
          size="small"
          effect="plain"
          round
          :type="connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'info'"
        >
          {{ statusLabel }}
        </ScTag>
      </div>
      <div class="server-terminal-panel__header-actions">
        <ScButton size="small" text @click="reconnect" :disabled="connecting">
          <IconifyIconOnline icon="ri:refresh-line" />
        </ScButton>
        <ScButton size="small" text @click="$emit('close')">
          <IconifyIconOnline icon="ri:close-line" />
        </ScButton>
      </div>
    </div>

    <!-- Terminal Body -->
    <div
      ref="terminalContainer"
      class="server-terminal-panel__body"
      v-loading="connecting"
      :class="{ 'is-dragover': isDragOver }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <!-- xterm.js mount point -->
      <div
        v-show="connectionStatus !== 'disconnected'"
        ref="terminalOutput"
        class="server-terminal-panel__output"
      />

      <!-- Disconnected prompt -->
      <div v-if="connectionStatus === 'disconnected'" class="server-terminal-panel__prompt">
        <IconifyIconOnline icon="ri:terminal-line" class="server-terminal-panel__prompt-icon" />
        <p>终端未连接</p>
        <ScButton size="small" type="primary" :loading="connecting" @click="connect">
          连接
        </ScButton>
      </div>

      <!-- Drag-and-drop overlay -->
      <div v-if="isDragOver" class="server-terminal-panel__drop-overlay">
        <IconifyIconOnline icon="ri:upload-cloud-2-line" class="server-terminal-panel__drop-icon" />
        <span>释放文件以上传到服务器</span>
      </div>
    </div>
  </div>

  <ScOverlayStack
    :items="uploadItems"
    :max-visible="5"
    :default-position="'bottom-right'"
    :closeable="true"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { message } from "@repo/utils";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import {
  createNamedSocketService,
  closeNamedSocketService,
  getNamedSocketService,
  parseSocketMessage,
  RemoteTopics,
  type SocketTemplate,
} from "@repo/core";
import type { OverlayStackItem } from "@repo/components/ScOverlayStack/types";
import ScOverlayStack from "@repo/components/ScOverlayStack";
import { getConfig } from "@repo/config";

interface TerminalServer {
  serverId?: number;
  host?: string;
  port?: number;
  serverName?: string;
  username?: string;
}

const props = defineProps<{
  server: TerminalServer;
}>();

defineEmits<{
  close: [];
}>();

const CONNECTION_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
} as const;

type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

// ── State ──
const connectionStatus = ref<ConnectionStatus>("disconnected");
const connecting = ref(false);
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let socketService: SocketTemplate | null = null;
let isListenersInitialized = false;
const terminalOutput = ref<HTMLElement>();
const terminalContainer = ref<HTMLElement>();
const isDragOver = ref(false);

// ── Upload overlay items ──
const uploadItems = ref<OverlayStackItem[]>([]);
let uploadIdCounter = 0;

// ── Computed ──
const statusLabel = computed(() => {
  const map: Record<ConnectionStatus, string> = {
    disconnected: "未连接",
    connecting: "连接中",
    connected: "已连接",
    error: "错误",
  };
  return map[connectionStatus.value];
});

// ── Socket name ──
const socketName = computed(() => `server-terminal-${props.server?.serverId || 0}`);

// ── SSH methods ──
function createSocket() {
  const name = socketName.value;
  const existing = getNamedSocketService(name);
  if (existing) {
    closeNamedSocketService(name);
  }
  socketService = createNamedSocketService(name, {
    query: { serverId: String(props.server?.serverId || 0) },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
  });
  socketService.connect();
  initMessageHandlers();
}

function initMessageHandlers() {
  if (!socketService) return;

  socketService.on(RemoteTopics.SSH.DATA, (raw: any) => {
    const data = parseSocketMessage(raw);
    const payload = data?.data ? (typeof data.data === "string" ? tryParse(data.data) : data.data) : data;
    if (payload?.serverId && payload.serverId !== props.server?.serverId) return;
    if (terminal && payload?.data) {
      terminal.write(payload.data);
    }
  });

  socketService.on(RemoteTopics.SSH.CONNECT, (raw: any) => {
    const data = parseSocketMessage(raw);
    if (data?.serverId && data.serverId !== props.server?.serverId) return;
    connectionStatus.value = "connected";
    connecting.value = false;
    if (terminal) {
      terminal.clear();
      terminal.write("\x1b[32m✓ SSH 连接成功\x1b[0m\r\n");
      terminal.write(`服务器: ${props.server?.serverName || props.server?.host || "Unknown"}\r\n\r\n`);
      nextTick(() => fitAddon?.fit());
    }
  });

  socketService.on(RemoteTopics.SSH.DISCONNECT, (raw: any) => {
    connectionStatus.value = "disconnected";
    connecting.value = false;
  });

  socketService.on(RemoteTopics.SSH.ERROR, (raw: any) => {
    const data = parseSocketMessage(raw);
    connectionStatus.value = "error";
    connecting.value = false;
    message.error(data?.errorMessage || "SSH 连接错误");
  });

  socketService.on("connect_error", () => {
    connectionStatus.value = "error";
    connecting.value = false;
  });

  isListenersInitialized = true;
}

function sendInput(data: string) {
  if (!socketService?.isConnected || connectionStatus.value !== "connected") return;
  socketService.emit(RemoteTopics.SSH.INPUT, JSON.stringify({
    serverId: props.server?.serverId,
    data,
    timestamp: Date.now(),
  }));
}

function disconnectSSH() {
  if (socketService?.isConnected) {
    socketService.emit(RemoteTopics.SSH.DISCONNECT, JSON.stringify({
      serverId: props.server?.serverId,
      timestamp: Date.now(),
    }));
  }
  closeNamedSocketService(socketName.value);
  socketService = null;
}

// ── Terminal ──
async function initTerminal() {
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: "#0d1117",
      foreground: "#c9d1d9",
      cursor: "#58a6ff",
      selectionBackground: "#264f78",
      black: "#484f58",
      red: "#ff7b72",
      green: "#3fb950",
      yellow: "#d29922",
      blue: "#58a6ff",
      magenta: "#bc8cff",
      cyan: "#39c5cf",
      white: "#b1bac4",
      brightBlack: "#6e7681",
      brightRed: "#ffa198",
      brightGreen: "#56d364",
      brightYellow: "#e3b341",
      brightBlue: "#79c0ff",
      brightMagenta: "#d2a8ff",
      brightCyan: "#56d4dd",
      brightWhite: "#f0f6fc",
    },
    convertEol: true,
    scrollback: 2000,
    allowTransparency: true,
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(new WebLinksAddon());

  if (terminalOutput.value) {
    terminal.value.open(terminalOutput.value);
    await nextTick();
    setTimeout(() => fitAddon?.fit(), 50);
  }

  terminal.onData((data: string) => {
    sendInput(data);
  });

  window.addEventListener("resize", handleResize);
}

function handleResize() {
  fitAddon?.fit();
}

// ── Connect / Disconnect ──
async function connect() {
  if (connecting.value || connectionStatus.value === "connected") return;
  try {
    connecting.value = true;
    connectionStatus.value = "connecting";
    if (!terminal) await initTerminal();
    createSocket();
  } catch (e: any) {
    connectionStatus.value = "error";
    connecting.value = false;
    message.error("连接失败: " + (e?.message || "未知错误"));
  }
}

function disconnect() {
  disconnectSSH();
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
  connectionStatus.value = "disconnected";
  connecting.value = false;
}

async function reconnect() {
  disconnect();
  isListenersInitialized = false;
  await nextTick();
  setTimeout(() => connect(), 300);
}

// ── Drag-and-drop file upload ──
function onDragOver() {
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

async function onDrop(e: DragEvent) {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  if (!props.server?.serverId) {
    message.warning("请先选择服务器");
    return;
  }

  for (const file of Array.from(files)) {
    await uploadFileWithProgress(file);
  }
}

async function uploadFileWithProgress(file: File) {
  const id = ++uploadIdCounter;
  const itemKey = `terminal-upload-${id}`;
  const startTime = Date.now();

  // Add overlay item
  const item: OverlayStackItem = {
    id: itemKey,
    title: `上传 ${file.name}`,
    description: "准备上传...",
    icon: "ri:upload-cloud-2-line",
    tone: "info",
    progress: 0,
  };
  uploadItems.value = [...uploadItems.value, item];

  try {
    const result = await uploadWithProgress(props.server!.serverId!, file, (pct) => {
      item.progress = pct;
      item.description = `上传中 ${pct}%`;
      uploadItems.value = [...uploadItems.value];
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    item.tone = "success";
    item.progress = 100;
    item.description = `上传完成 (${elapsed}s)`;
    uploadItems.value = [...uploadItems.value];

    // Print upload path in terminal
    const uploadPath = result?.path || `/tmp/${file.name}`;
    if (terminal) {
      terminal.write(`\r\n\x1b[32m✓ 文件已上传: ${uploadPath}\x1b[0m\r\n`);
    }

    // Auto-remove after delay
    setTimeout(() => {
      uploadItems.value = uploadItems.value.filter((i) => i.id !== itemKey);
    }, 4000);
  } catch (e: any) {
    item.tone = "error";
    item.progress = 0;
    item.description = `上传失败: ${e?.message || "未知错误"}`;
    uploadItems.value = [...uploadItems.value];
    if (terminal) {
      terminal.write(`\r\n\x1b[31m✗ 文件上传失败: ${file.name}\x1b[0m\r\n`);
    }
  }
}

function uploadWithProgress(
  serverId: number,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ path?: string }> {
  return new Promise((resolve, reject) => {
    const baseUrl = String(getConfig("ApiAddress") || getConfig("BaseUrl") || "");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/server/hosts/${serverId}/files/upload`);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText)?.data || {});
        } catch {
          resolve({});
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("网络错误")));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

function tryParse(str: string): any {
  try { return JSON.parse(str); } catch { return str; }
}

// ── Watch server changes ──
watch(
  () => props.server?.serverId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      disconnect();
      isListenersInitialized = false;
    }
  },
);

// ── Lifecycle ──
onMounted(() => {
  connect();
});

onUnmounted(() => {
  disconnect();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.server-terminal-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0d1117;
  border-radius: 20px;
  overflow: hidden;
  font-family: inherit;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ── Header ── */
.server-terminal-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  min-height: 36px;
}

.server-terminal-panel__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #c9d1d9;
}

.server-terminal-panel__header-actions {
  display: flex;
  gap: 2px;
}

/* ── Body ── */
.server-terminal-panel__body {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.server-terminal-panel__output {
  width: 100%;
  height: 100%;
  padding: 4px;
}

/* ── Disconnected prompt ── */
.server-terminal-panel__prompt {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8b949e;
}

.server-terminal-panel__prompt-icon {
  font-size: 32px;
  opacity: 0.5;
}

.server-terminal-panel__prompt p {
  margin: 0;
  font-size: 13px;
  color: inherit;
}

/* ── Drag-over overlay ── */
.server-terminal-panel__drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(13, 17, 23, 0.88);
  color: #58a6ff;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.server-terminal-panel__drop-icon {
  font-size: 36px;
}

.server-terminal-panel__drop-overlay span {
  font-size: 13px;
}

.server-terminal-panel__body.is-dragover {
  outline: 2px dashed #58a6ff;
  outline-offset: -2px;
}

/* ── Override xterm styles ── */
:deep(.xterm) {
  height: 100%;
  padding: 4px;
}

:deep(.xterm-viewport) {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

:deep(.xterm-viewport::-webkit-scrollbar) {
  width: 6px;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
</style>
