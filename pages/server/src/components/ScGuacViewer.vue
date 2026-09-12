<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Guacamole from 'guacamole-common-js';
import { buildTerminalTokenWsUrl, fetchIssueRemoteToken } from '../api';
import { createScGuacTunnel } from './ScGuacTunnel';

/**
 * guacd 远控渲染组件
 * 基于 guacamole-common-js：WebSocket 隧道 -> 后端桥接 -> guacd。
 * 支持 SSH / VNC / RDP 三种协议。
 *
 * 时序要点：el-drawer destroy-on-close 下，
 * visible=true 后组件需 nextTick 才挂载 displayRef，
 * 因此 connect() 必须在 opened 回调中触发。
 */

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId: number | null;
    targetPort: number | null;
  } | null;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const visible = ref(false);
const statusText = ref('正在连接…');
const hasError = ref(false);
const displayRef = ref<HTMLElement | null>(null);

let client: InstanceType<typeof Guacamole.Client> | null = null;
let keyboard: InstanceType<typeof Guacamole.Keyboard> | null = null;
let mouse: InstanceType<typeof Guacamole.Mouse> | null = null;

// 随连接参数变化重置状态
watch(
  () => props.connection,
  conn => {
    teardown();
    visible.value = !!conn;
  },
);

// ReDrawer 打开后 nextTick 建立连接（此时 displayRef 已就绪）
watch(
  visible,
  show => {
    if (show && props.connection) {
      const conn = props.connection;
      nextTick(() => connect(conn));
    } else if (!show) {
      teardown();
      emit('close');
    }
  },
);

async function connect(conn: NonNullable<typeof props.connection>): Promise<void> {
  hasError.value = false;
  statusText.value = '正在连接…';
  if (!displayRef.value) return; // 防御性断言

  // 先向后端签发短令牌（服务器信息不出后端），再用 token 直连 WS 隧道
  let wsUrl: string;
  try {
    const issued = await fetchIssueRemoteToken(conn.hostId, conn.protocol, conn.identityId, conn.targetPort);
    wsUrl = buildTerminalTokenWsUrl(issued.token);
  } catch (e: any) {
    hasError.value = true;
    statusText.value = `令牌签发失败: ${e?.message ?? '未知错误'}`;
    return;
  }

  const tunnel = createScGuacTunnel(wsUrl);
  client = new Guacamole.Client(tunnel);

  tunnel.onstatechange = (state: number) => {
    if (state === Guacamole.Tunnel.State.OPEN) statusText.value = '已连接';
    else if (state === Guacamole.Tunnel.State.CLOSED) statusText.value = '已断开';
  };
  tunnel.onerror = (status: { message?: string }) => {
    hasError.value = true;
    statusText.value = `连接失败: ${status.message ?? '未知错误'}`;
  };

  // 挂载渲染层
  const el = client.getDisplay().getElement();
  if (!el || !displayRef.value) {
    hasError.value = true;
    statusText.value = '渲染层未就绪';
    return;
  }
  el.style.width = '100%';
  el.style.height = '100%';
  displayRef.value.innerHTML = '';
  displayRef.value.appendChild(el);

  // 远端分辨率自适应：容器尺寸变化时通知 guacd 更新终端窗口
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        client?.sendSize(Math.round(width), Math.round(height));
      }
    }
  });
  resizeObserver.observe(displayRef.value);

  // 键盘（全局捕获，页面任意位置均可输入）
  keyboard = new Guacamole.Keyboard(document as unknown as HTMLElement);
  keyboard.onkeydown = keysym => { client?.sendKeyEvent(true, keysym.keysym); };
  keyboard.onkeyup = keysym => { client?.sendKeyEvent(false, keysym.keysym); };

  // 鼠标
  mouse = new Guacamole.Mouse(el);
  mouse.onmousedown = state => client?.sendMouseState(state);
  mouse.onmouseup = state => client?.sendMouseState(state);
  mouse.onmousemove = state => client?.sendMouseState(state);

  client.connect();
}

function teardown(): void {
  try { keyboard?.reset(); client?.disconnect(); } catch { /* ignore */ }
  keyboard = null;
  mouse = null;
  client = null;
  if (displayRef.value) displayRef.value.innerHTML = '';
}

onBeforeUnmount(teardown);
</script>

<template>
  <ReDrawer
    v-model="visible"
    :title="`远程控制 - ${connection?.hostName ?? ''}`"
    direction="btt"
    :size="'92%'"
    :footer-hidden="true"
    close-only
  >
    <template #content>
      <div class="guac-wrap">
        <div class="guac-status">
          <ReTag :type="hasError ? 'danger' : statusText === '已连接' ? 'success' : 'info'" size="small">
            {{ statusText }}
          </ReTag>
          <ReText size="small" type="info">{{ connection?.protocol.toUpperCase() }}</ReText>
        </div>
        <div ref="displayRef" class="guac-display" />
      </div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
.guac-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}
.guac-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.guac-display {
  flex: 1;
  background: #000;
  border-radius: 8px;
  overflow: auto;
  :deep(canvas) { margin: 0 auto; }
}
</style>
