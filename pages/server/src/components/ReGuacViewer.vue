<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import Guacamole from 'guacamole-common-js';
import { buildTerminalWsUrl } from '../api';

/**
 * guacd 远控渲染组件
 * 基于 guacamole-common-js：WebSocket 隧道 -> 后端桥接 -> guacd。
 * 支持 SSH(图形终端)/VNC/RDP 三种协议的自适应缩放与键鼠输入。
 */

const props = defineProps<{
  /** 连接参数 */
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId: number | null;
    targetPort: number | null;
  } | null;
}>();

/** 组件关闭事件 */
const emit = defineEmits<{ (e: 'close'): void }>();

/** 全屏抽屉可见性（随 props.connection 存在与否驱动） */
const visible = ref(false);

/** 连接状态文案 */
const statusText = ref('正在连接…');

/** 是否出错 */
const hasError = ref(false);

/** 显示容器 */
const displayRef = ref<HTMLElement | null>(null);

/** 运行时对象（非响应式，勿放 ref 深层） */
let client: InstanceType<typeof Guacamole.Client> | null = null;
let keyboard: InstanceType<typeof Guacamole.Keyboard> | null = null;
let mouse: InstanceType<typeof Guacamole.Mouse> | null = null;

// 连接参数变化即重建会话
watch(
  () => props.connection,
  conn => {
    teardown();
    if (conn) {
      visible.value = true;
      connect(conn);
    } else {
      visible.value = false;
    }
  },
);

/**
 * 建立远控连接并装配输入输出
 *
 * @param conn 连接参数
 */
function connect(conn: NonNullable<typeof props.connection>): void {
  hasError.value = false;
  statusText.value = '正在连接…';
  const wsUrl = buildTerminalWsUrl(conn.hostId, conn.protocol, conn.identityId, conn.targetPort);
  const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
  client = new Guacamole.Client(tunnel);

  tunnel.onstatechange = (state: number) => {
    if (state === Guacamole.Client.STATE_CONNECTED) {
      statusText.value = '已连接';
    } else if (state === Guacamole.Client.STATE_DISCONNECTED) {
      statusText.value = '已断开';
    }
  };
  tunnel.onerror = (status: { message?: string }) => {
    hasError.value = true;
    statusText.value = `连接失败: ${status.message ?? '未知错误'}`;
  };

  if (!displayRef.value) return;
  // 挂载渲染层
  const el = client.getDisplay().getElement();
  el.style.width = '100%';
  el.style.height = '100%';
  displayRef.value.innerHTML = '';
  displayRef.value.appendChild(el);

  // 键盘事件（全局捕获，保证焦点在页面任意处均可输入）
  keyboard = new Guacamole.Keyboard(document as unknown as HTMLElement);
  keyboard.onkeydown = keysym => {
    client?.sendKeyEvent(true, keysym.keysym);
  };
  keyboard.onkeyup = keysym => {
    client?.sendKeyEvent(false, keysym.keysym);
  };

  // 鼠标事件
  mouse = new Guacamole.Mouse(el);
  mouse.onmousedown = state => client?.sendMouseState(state);
  mouse.onmouseup = state => client?.sendMouseState(state);
  mouse.onmousemove = state => client?.sendMouseState(state);

  client.connect();
}

/**
 * 断开并清理全部运行时对象
 */
function teardown(): void {
  try {
    keyboard?.reset();
    client?.disconnect();
  } catch {
    // 断开异常忽略，对象随后整体释放
  }
  keyboard = null;
  mouse = null;
  client = null;
  if (displayRef.value) {
    displayRef.value.innerHTML = '';
  }
}

/**
 * 手动断开并通知父组件
 */
function onClose(): void {
  teardown();
  emit('close');
}

onBeforeUnmount(teardown);
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`远程控制 - ${connection?.hostName ?? ''}`"
    direction="btt"
    size="92%"
    destroy-on-close
    :close-on-click-modal="false"
    @close="onClose"
  >
    <div class="guac-wrap">
      <div class="guac-status">
        <el-tag :type="hasError ? 'danger' : statusText === '已连接' ? 'success' : 'info'" size="small">
          {{ statusText }}
        </el-tag>
        <el-text size="small" type="info">{{ connection?.protocol.toUpperCase() }}</el-text>
      </div>
      <!-- 渲染容器 -->
      <div ref="displayRef" class="guac-display" />
    </div>
  </el-drawer>
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

  :deep(canvas) {
    margin: 0 auto;
  }
}
</style>
