<template>
  <div class="terminal-view" ref="containerRef">
    <!-- Toolbar -->
    <div class="terminal-toolbar">
      <div class="toolbar-left">
        <span class="session-label">{{ sessionId ? `Session: ${sessionId.slice(0, 8)}…` : 'No session' }}</span>
        <span :class="['status-dot', sessionState]" />
        <span class="status-text">{{ statusLabel }}</span>
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="clearBuffer" text>Clear</el-button>
        <el-button size="small" @click="copyBuffer" text>Copy</el-button>
      </div>
    </div>

    <!-- Terminal output -->
    <div class="terminal-body" ref="termBody" @click="focusInput">
      <pre class="terminal-output"><code>{{ outputBuffer }}</code></pre>
      <div class="terminal-input-row">
        <span class="prompt">$</span>
        <input
          ref="inputRef"
          v-model="inputLine"
          class="terminal-input"
          :disabled="sessionState !== 'connected'"
          @keydown.enter="sendInput"
          @keydown.up.prevent="historyUp"
          @keydown.down.prevent="historyDown"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { remoteWs } from "@/api/remote";
import { ElMessage } from "element-plus";

const props = defineProps<{
  sessionId: string;
  sessionState: "connecting" | "connected" | "disconnected" | "error";
  error?: string;
}>();

const termBody = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const inputLine = ref("");
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);

// Terminal output from store (passed via prop or store)
const localBuffer = ref("");
const outputBuffer = computed(() => localBuffer.value);

const statusLabel = computed(() => {
  if (props.sessionState === "connected") return "Connected";
  if (props.sessionState === "connecting") return "Connecting…";
  if (props.sessionState === "error") return props.error || "Error";
  return "Disconnected";
});

// ─── Auto-scroll ────────────────────────────────────────────

function scrollToBottom() {
  nextTick(() => {
    if (termBody.value) {
      termBody.value.scrollTop = termBody.value.scrollHeight;
    }
  });
}

watch(outputBuffer, () => scrollToBottom());

// ─── WS message handler for terminal output ────────────────

let msgHandlerRegistered = false;

onMounted(() => {
  if (!msgHandlerRegistered) {
    remoteWs.onMessage((msg) => {
      const type = msg.type as string;
      // Terminal output comes as text relay from Agent
      if (type === "output" || type === "data") {
        const data = msg.data as string;
        if (data && props.sessionId && (msg.sessionId as string) === props.sessionId) {
          localBuffer.value += data;
          // Trim buffer
          if (localBuffer.value.length > 200_000) {
            localBuffer.value = localBuffer.value.slice(-100_000);
          }
        }
      }
    });
    msgHandlerRegistered = true;
  }
});

// ─── Input handling ────────────────────────────────────────

function sendInput() {
  const cmd = inputLine.value;
  if (!cmd || !props.sessionId || props.sessionState !== "connected") return;

  // Echo the command locally
  localBuffer.value += `\n$ ${cmd}\n`;

  // Send to Agent via WS
  remoteWs.sendInput(props.sessionId, cmd + "\n");

  // History
  commandHistory.value.push(cmd);
  if (commandHistory.value.length > 100) commandHistory.value.shift();
  historyIndex.value = -1;

  inputLine.value = "";
  scrollToBottom();
}

function historyUp() {
  if (commandHistory.value.length === 0) return;
  if (historyIndex.value < commandHistory.value.length - 1) {
    historyIndex.value++;
    inputLine.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value];
  }
}

function historyDown() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    inputLine.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value];
  } else {
    historyIndex.value = -1;
    inputLine.value = "";
  }
}

function focusInput() {
  inputRef.value?.focus();
}

function clearBuffer() {
  localBuffer.value = "";
}

function copyBuffer() {
  navigator.clipboard.writeText(localBuffer.value).then(() => {
    ElMessage.success("Copied to clipboard");
  }).catch(() => {
    ElMessage.error("Copy failed");
  });
}
</script>

<style scoped>
.terminal-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--nexus-code-bg, #1c1917);
  border-radius: var(--card-radius, 10px);
  overflow: hidden;
}

.terminal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  min-height: 36px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.session-label {
  font-family: var(--nexus-data-font, monospace);
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.connected { background: #22c55e; }
.status-dot.connecting { background: #f59e0b; animation: blink 1s infinite; }
.status-dot.disconnected { background: #6b7280; }
.status-dot.error { background: #ef4444; }

@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.status-text {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: var(--nexus-data-font, "JetBrains Mono", "Fira Code", monospace);
  font-size: 13px;
  line-height: 1.6;
  color: var(--nexus-code-text, #d6d3d1);
  cursor: text;
}

.terminal-output {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.terminal-output code {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

.terminal-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.prompt {
  color: var(--nexus-accent, #0d9488);
  font-weight: 600;
  user-select: none;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--nexus-code-text, #d6d3d1);
  font-family: inherit;
  font-size: inherit;
  caret-color: var(--nexus-accent, #0d9488);
}

.terminal-input:disabled {
  opacity: 0.4;
}
</style>