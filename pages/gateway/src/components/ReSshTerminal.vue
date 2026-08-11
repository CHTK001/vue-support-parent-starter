<!--
  ReSshTerminal —— SSH 终端（简化版）
  使用 <pre> + 等宽字体实现，避免引入 xterm 依赖。
  保留 Terminal 接口（write / onData / focus / resize），可后续替换为 xterm 实现。
  设计风格：低饱和度 · 暗色终端 · 简洁浮动操作按钮
  样式约定：UnoCSS 主题别名 → Element Plus CSS 变量
-->
<template>
  <div class="ssh-terminal">
    <div
      v-if="connectionState !== 'connected'"
      class="terminal-placeholder flex h-full flex-col items-center justify-center gap-3 px-10 py-10 text-el-text-secondary"
      role="status"
    >
      <el-icon :size="48" :class="{ 'is-loading': connectionState === 'connecting' }">
        <component :is="connectionState === 'connecting' ? Loading : Monitor" />
      </el-icon>
      <p class="m-0 text-[14px] text-el-text-primary">{{ placeholderText }}</p>
      <span class="text-[12px] text-el-text-placeholder">{{ placeholderHint }}</span>
    </div>

    <div v-show="connectionState === 'connected'" class="terminal-frame">
      <div
        ref="terminalContainer"
        class="terminal-container"
        tabindex="0"
        @click="focusTerminal"
      >
        <pre ref="outputRef" class="terminal-output m-0">{{ output }}</pre>
      </div>

      <div class="ssh-overlay ssh-overlay--top-right">
        <el-button class="ssh-btn" circle size="small" title="复制全部" @click="copyAll">
          <el-icon><DocumentCopy /></el-icon>
        </el-button>
        <el-button class="ssh-btn" circle size="small" title="清屏" @click="clear">
          <el-icon><Delete /></el-icon>
        </el-button>
        <el-button class="ssh-btn ssh-btn--danger" circle size="small" title="断开" @click="emitDisconnect">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { Monitor, Loading, SwitchButton, DocumentCopy, Delete } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import type { ConnectionState, RemoteControlInstance } from "../composables/useRemoteControl";

const props = defineProps<{
  remote: RemoteControlInstance;
  sessionId?: string;
}>();

const emit = defineEmits<{
  (e: "disconnect"): void;
  (e: "input", data: string): void;
  (e: "resize", cols: number, rows: number): void;
}>();

const connectionState = computed<ConnectionState>(() => props.remote.connectionState.value);
const activeSessionId = computed(() => props.remote.activeSessionId.value);

const terminalContainer = ref<HTMLDivElement | null>(null);
const outputRef = ref<HTMLPreElement | null>(null);
const output = ref("");
const cols = ref(80);
const rows = ref(24);

const placeholderText = computed(() => (connectionState.value === "connecting" ? "正在连接终端..." : "SSH 终端未连接"));
const placeholderHint = computed(() =>
  connectionState.value === "connecting" ? "请稍候，正在建立 SSH 会话" : "请在左侧面板填写连接信息并点击「连接」",
);

function write(data: string) {
  output.value += data;
  nextTick(() => {
    if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight;
  });
}

function clear() {
  output.value = "";
}

function focusTerminal() {
  terminalContainer.value?.focus();
}

function onKeydown(ev: KeyboardEvent) {
  if (!activeSessionId.value) return;
  ev.preventDefault();
  let data = "";
  if (ev.key === "Enter") data = "\r";
  else if (ev.key === "Backspace") data = "\x7f";
  else if (ev.key === "Tab") data = "\t";
  else if (ev.ctrlKey && ev.key.toLowerCase() === "c") data = "\x03";
  else if (ev.ctrlKey && ev.key.toLowerCase() === "d") data = "\x04";
  else if (ev.ctrlKey && ev.key.toLowerCase() === "l") {
    clear();
    return;
  } else if (ev.key.length === 1) data = ev.key;
  else return;

  if (data) {
    props.remote.sendInput(activeSessionId.value, data);
    emit("input", data);
  }
}

function onResize() {
  if (!terminalContainer.value) return;
  const charWidth = 8;
  const lineHeight = 18;
  const newCols = Math.max(20, Math.floor(terminalContainer.value.clientWidth / charWidth));
  const newRows = Math.max(10, Math.floor(terminalContainer.value.clientHeight / lineHeight));
  if (newCols !== cols.value || newRows !== rows.value) {
    cols.value = newCols;
    rows.value = newRows;
    if (activeSessionId.value) {
      props.remote.sendResize(activeSessionId.value, newCols, newRows);
      emit("resize", newCols, newRows);
    }
  }
}

let resizeObserver: ResizeObserver | null = null;

function copyAll() {
  navigator.clipboard?.writeText(output.value);
  message.success("已复制全部终端输出");
}

function emitDisconnect() {
  if (activeSessionId.value) {
    props.remote.disconnectSession(activeSessionId.value);
    emit("disconnect");
  }
}

watch(activeSessionId, (sid) => {
  if (sid) {
    nextTick(() => {
      focusTerminal();
      onResize();
    });
  }
});

onMounted(() => {
  if (terminalContainer.value) {
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(terminalContainer.value);
    terminalContainer.value.addEventListener("keydown", onKeydown);
  }
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (terminalContainer.value) terminalContainer.value.removeEventListener("keydown", onKeydown);
});

defineExpose({ write, clear, focus: focusTerminal });
</script>

<style scoped>
.ssh-terminal {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.terminal-frame {
  position: relative;
  width: 100%;
  height: 100%;
}

.terminal-container {
  width: 100%;
  height: 100%;
  background: #0e0e10;
  padding: 12px 16px;
  outline: none;
  overflow: hidden;
}

.terminal-output {
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px;
  line-height: 18px;
  color: #e4e4e7;
  white-space: pre;
  height: 100%;
  overflow: auto;
}

.ssh-overlay {
  position: absolute;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.ssh-overlay--top-right {
  top: 12px;
  right: 12px;
}

.ssh-btn {
  background: rgba(0, 0, 0, 0.6);
  border-color: transparent;
  color: #fff;
}

.ssh-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
}

.ssh-btn--danger:hover {
  background: var(--el-color-danger);
}
</style>
