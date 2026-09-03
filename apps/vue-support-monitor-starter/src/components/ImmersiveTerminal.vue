<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import Guacamole from "guacamole-common-js";
import { buildTerminalWsUrl } from "@pages/server/src/api";
import { createScGuacTunnel } from "@pages/server/src/components/ScGuacTunnel";

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId?: number | null;
    targetPort?: number | null;
  } | null;
}>();

const statusText = ref("未连接");
const hasError = ref(false);
const displayRef = ref<HTMLElement | null>(null);

let client: InstanceType<typeof Guacamole.Client> | null = null;
let keyboard: InstanceType<typeof Guacamole.Keyboard> | null = null;
let mouse: InstanceType<typeof Guacamole.Mouse> | null = null;
let resizeObserver: ResizeObserver | null = null;

watch(
  () => props.connection,
  conn => {
    teardown();
    if (conn) {
      nextTick(() => connect(conn));
    }
  },
);

function connect(conn: NonNullable<typeof props.connection>): void {
  hasError.value = false;
  statusText.value = "正在连接…";
  if (!displayRef.value) return;

  const tunnel = createScGuacTunnel(
    buildTerminalWsUrl(conn.hostId, conn.protocol, conn.identityId ?? null, conn.targetPort ?? null),
  );
  client = new Guacamole.Client(tunnel);

  tunnel.onstatechange = (state: number) => {
    if (state === Guacamole.Tunnel.State.OPEN) statusText.value = "已连接";
    else if (state === Guacamole.Tunnel.State.CLOSED) statusText.value = "已断开";
  };
  tunnel.onerror = (status: { message?: string }) => {
    hasError.value = true;
    statusText.value = `连接失败: ${status.message ?? "未知错误"}`;
  };

  const el = client.getDisplay().getElement();
  if (!el || !displayRef.value) {
    hasError.value = true;
    statusText.value = "渲染层未就绪";
    return;
  }
  el.style.width = "100%";
  el.style.height = "100%";
  displayRef.value.innerHTML = "";
  displayRef.value.appendChild(el);

  resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        client?.sendSize(Math.round(width), Math.round(height));
      }
    }
  });
  resizeObserver.observe(displayRef.value);

  keyboard = new Guacamole.Keyboard(document as unknown as HTMLElement);
  keyboard.onkeydown = keysym => { client?.sendKeyEvent(true, keysym.keysym); };
  keyboard.onkeyup = keysym => { client?.sendKeyEvent(false, keysym.keysym); };

  mouse = new Guacamole.Mouse(el);
  mouse.onmousedown = state => client?.sendMouseState(state);
  mouse.onmouseup = state => client?.sendMouseState(state);
  mouse.onmousemove = state => client?.sendMouseState(state);

  client.connect();
}

function teardown(): void {
  try { keyboard?.reset(); client?.disconnect(); } catch { /* ignore */ }
  resizeObserver?.disconnect();
  resizeObserver = null;
  keyboard = null;
  mouse = null;
  client = null;
  if (displayRef.value) displayRef.value.innerHTML = "";
  statusText.value = "未连接";
  hasError.value = false;
}

onBeforeUnmount(teardown);
</script>

<template>
  <div class="it-shell">
    <div class="it-toolbar">
      <div class="it-title">
        <el-icon><Monitor /></el-icon>
        <span>{{ connection?.hostName ?? "远程控制台" }}</span>
        <el-tag
          v-if="connection"
          :type="hasError ? 'danger' : statusText === '已连接' ? 'success' : 'info'"
          size="small"
        >
          {{ statusText }}
        </el-tag>
      </div>
      <div class="it-actions">
        <el-text v-if="connection" type="info" size="small">
          {{ connection.protocol.toUpperCase() }}
        </el-text>
      </div>
    </div>
    <div class="it-body">
      <div v-if="!connection" class="it-empty">
        <el-icon :size="48" color="#c0c4cc"><Monitor /></el-icon>
        <div class="it-empty-title">选择左侧主机开始连接</div>
        <div class="it-empty-desc">沉浸式控制台 · guacd 隧道 · 支持 SSH/RDP/VNC</div>
      </div>
      <div v-show="connection" ref="displayRef" class="it-display" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.it-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color-page);
}
.it-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.it-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.it-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.it-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}
.it-display {
  width: 100%;
  height: 100%;
  background: #0d1117;
  border-radius: 8px;
  overflow: auto;
  :deep(canvas) {
    margin: 0 auto;
    display: block;
  }
}
.it-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  gap: 12px;
}
.it-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.it-empty-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
