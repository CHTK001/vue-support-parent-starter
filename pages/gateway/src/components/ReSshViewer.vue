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
    const tunnel = new Guacamole.WebSocketTunnel(props.wsUrl);
    client = new Guacamole.Client(tunnel);
    const display = client.getDisplay();
    const displayEl = display.getElement();
    container.appendChild(displayEl);

    // 键盘：Guacamole.Keyboard 绑定到整个 document（全局监听任意按键），
    // 其内部把 DOM keydown/keyup 转换为 keysym 并回调 onkeydown/onkeyup，
    // 应用层回调 client.sendKeyEvent 发指令给 guacd。
    keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number): boolean => {
      client?.sendKeyEvent(true, keysym);
      return false;
    };
    keyboard.onkeyup = (keysym: number): boolean => {
      client?.sendKeyEvent(false, keysym);
      return false;
    };

    // 鼠标事件：点击 canvas 时 focus（非必需）
    mouse = new Guacamole.Mouse(displayEl);
    mouse.onmousedown = () => {
      displayEl.focus();
    };

    client.onstatechange = (state: number) => {
      const states = ["idle", "connecting", "waiting", "connected", "disconnected", "error"];
      status.value = `SSH Guacamole: ${states[state] ?? state}`;
    };
    client.onerror = (error: { message?: string }) => {
      status.value = `错误: ${error?.message ?? "未知"}`;
    };
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
