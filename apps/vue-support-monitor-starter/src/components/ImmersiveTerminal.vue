<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { FullScreen, Monitor, RefreshRight, SwitchButton } from "@element-plus/icons-vue";
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
const shellRef = ref<HTMLElement | null>(null);

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

/** ReButton「重试」：原样重连当前会话 */
function reconnect(): void {
  if (!props.connection) return;
  teardown();
  nextTick(() => props.connection && connect(props.connection));
}

/** ReButton「断开」：主动断开隧道并回到就绪态 */
function disconnect(): void {
  teardown();
  statusText.value = "已手动断开";
}

function fullscreen(): void {
  const el = shellRef.value;
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen?.();
  }
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
  <div ref="shellRef" class="it-shell">
    <div class="it-toolbar">
      <div class="it-title">
        <el-icon><Monitor /></el-icon>
        <span>{{ connection?.hostName ?? "远程控制台" }}</span>
        <span
          v-if="connection"
          :class="['it-proto-badge', `p-${connection.protocol}`]"
        >{{ connection.protocol.toUpperCase() }}</span>
        <el-tag
          v-if="connection"
          :type="hasError ? 'danger' : statusText === '已连接' ? 'success' : 'info'"
          size="small"
        >
          {{ statusText }}
        </el-tag>
      </div>
      <div v-if="connection" class="it-actions">
        <!-- ReButton：方角 + 图标（design.md §2 / §4.8） -->
        <button class="reb" title="重新连接" @click="reconnect">
          <el-icon :size="14"><RefreshRight /></el-icon><span>重连</span>
        </button>
        <button class="reb" title="全屏" @click="fullscreen">
          <el-icon :size="14"><FullScreen /></el-icon><span>全屏</span>
        </button>
        <button class="reb reb-danger" title="断开连接" @click="disconnect">
          <el-icon :size="14"><SwitchButton /></el-icon><span>断开</span>
        </button>
      </div>
    </div>
    <div class="it-body">
      <div v-if="!connection" class="it-empty">
        <el-icon :size="48" color="#c0c4cc"><Monitor /></el-icon>
        <div class="it-empty-title">从左侧选择一台资产开始控制</div>
        <div class="it-empty-desc">沉浸式控制台 · guacd 隧道 · 支持 SSH / RDP / VNC</div>
      </div>
      <div v-show="connection && !hasError" ref="displayRef" class="it-display" />
      <div v-if="connection && hasError" class="it-error">
        <el-icon :size="40" color="#f56c6c"><Monitor /></el-icon>
        <div class="it-error-title">连接失败</div>
        <div class="it-error-desc">{{ statusText }}</div>
        <div class="it-error-actions">
          <button class="reb reb-primary" @click="reconnect">
            <el-icon :size="14"><RefreshRight /></el-icon><span>重试</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ReButton：方角(≤2px) + 恒带图标 —— 监控/控制台默认按钮 */
.reb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  &:active {
    transform: translateY(1px);
  }
  &.reb-primary {
    color: #fff;
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    &:hover {
      color: #fff;
      background: var(--el-color-primary-light-3);
      border-color: var(--el-color-primary-light-3);
    }
  }
  &.reb-danger {
    color: var(--el-color-danger);
    border-color: var(--el-color-danger-light-5);
    background: var(--el-color-danger-light-9);
    &:hover {
      color: #fff;
      background: var(--el-color-danger);
      border-color: var(--el-color-danger);
    }
  }
}

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
.it-proto-badge {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  border-radius: 2px;
  letter-spacing: 0.5px;
  &.p-ssh {
    color: #409eff;
    background: rgba(64, 158, 255, 0.12);
  }
  &.p-rdp {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.14);
  }
  &.p-vnc {
    color: #9254de;
    background: rgba(146, 84, 222, 0.12);
  }
}
.it-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.it-body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}
.it-display {
  width: 100%;
  height: 100%;
  background: #0d1117;
  border-radius: 4px;
  overflow: auto;
  :deep(canvas) {
    margin: 0 auto;
    display: block;
  }
}
.it-empty,
.it-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  gap: 12px;
}
.it-error-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.it-error-desc {
  font-size: 13px;
  max-width: 60%;
  text-align: center;
  word-break: break-all;
}
.it-error-actions {
  margin-top: 6px;
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
