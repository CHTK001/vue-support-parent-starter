<!--
  ReSshViewer —— SSH 远控 Viewer（统一走 guacamole-common-js + guacd ssh 协议）
  与 RDP/VNC 共用 ReRdpViewer 的底层 @guacamole/client 实现，
  后端 GuacamoleBridge.writeSelectInstruction() 会根据 connection.protocol() 发 select ssh ...
-->
<template>
  <div class="ssh-viewer flex w-full flex-col gap-2">
    <div ref="displayContainerRef" class="ssh-display"></div>
    <div v-if="status" class="ssh-viewer__status text-[12px] text-el-text-secondary">
      {{ status }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
// @ts-expect-error - guacamole-client-js 没有官方类型
import Guacamole from "guacamole-common-js";

const props = defineProps<{
  wsUrl: string;
}>();

const status = ref<string>("");
const displayContainerRef = ref<HTMLDivElement | null>(null);

let client: Guacamole.Client | null = null;
let keyboard: Guacamole.Keyboard | null = null;
let mouse: Guacamole.Mouse | null = null;

onMounted(() => {
  const container = displayContainerRef.value;
  if (!container) {
    status.value = "容器未挂载";
    return;
  }
  try {
    // WebSocketTunnel 期望相对路径（内部拼到当前 origin），由 vite proxy 转发到 gateway。
    const tunnel = new Guacamole.WebSocketTunnel(props.wsUrl);
    client = new Guacamole.Client(tunnel);
    const display = client.getDisplay();
    const displayEl = display.getElement();
    container.appendChild(displayEl);
    // 键盘：guacamole-common-js 的 Client 不自建键盘，需应用层创建 Guacamole.Keyboard
    // 并回调 sendKeyEvent 把按键指令发给 guacd。
    keyboard = new Guacamole.Keyboard(displayEl);
    keyboard.onkeydown = (keysym: number): boolean => {
      console.log(`[guac-key] keydown ${keysym}`);
      client?.sendKeyEvent(true, keysym);
      return false;
    };
    keyboard.onkeyup = (keysym: number): boolean => {
      client?.sendKeyEvent(false, keysym);
      return false;
    };
    // 鼠标：滚轮/滚动作通过 sendMouseState 发给 guacd，点击后聚焦终端输入
    mouse = new Guacamole.Mouse(displayEl);
    mouse.onmousedown = () => {
      keyboard?.focus?.();
    };
    client.onstatechange = (state: number) => {
      const states = ["idle", "connecting", "waiting", "connected", "disconnected", "error"];
      status.value = `SSH Guacamole: ${states[state] ?? state}`;
    };
    client.onerror = (error: { message?: string }) => {
      status.value = `错误: ${error?.message ?? "未知"}`;
    };
    // 必须显式 connect()：guacamole-common-js 只有调用 connect() 才会
    // 发送 select/size/connect 握手指令，guacd 才会返回 args 并建立 SSH 会话。
    client.connect();
  } catch (e) {
    status.value = `初始化失败: ${e instanceof Error ? e.message : String(e)}`;
  }
});

onUnmounted(() => {
  if (keyboard) {
    keyboard = null;
  }
  if (mouse) {
    mouse = null;
  }
  if (client) {
    client.disconnect();
    client = null;
  }
});
</script>

<style scoped>
.ssh-display {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: #000;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}
.ssh-display :deep(> *),
.ssh-display :deep(.ssh-display-content),
.ssh-display :deep(.guac-content) {
  width: 100%;
  height: 100%;
}
.ssh-display :deep(> div),
.ssh-display :deep(> div > div),
.ssh-display :deep(> div > div > div) {
  width: 100%;
  height: 100%;
}
.ssh-display :deep(input) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: cell;
  z-index: 2;
}
</style>
