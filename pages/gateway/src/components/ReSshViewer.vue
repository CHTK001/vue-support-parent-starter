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
let keyboardHelper: Guacamole.Keyboard | null = null;
let mouse: Guacamole.Mouse | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let keyupHandler: ((e: KeyboardEvent) => void) | null = null;

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

    // 键盘辅助对象：仅用于 keysym 转换
    keyboardHelper = new Guacamole.Keyboard(document.createElement('div'));

    // 全局键盘事件监听
    keydownHandler = (e: KeyboardEvent) => {
      const keysym = keyboardHelper?.getKeysym?.(e);
      if (keysym) client?.sendKeyEvent(true, keysym);
      e.preventDefault();
    };
    keyupHandler = (e: KeyboardEvent) => {
      const keysym = keyboardHelper?.getKeysym?.(e);
      if (keysym) client?.sendKeyEvent(false, keysym);
      e.preventDefault();
    };
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

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
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  if (keyupHandler) {
    document.removeEventListener('keyup', keyupHandler);
    keyupHandler = null;
  }
  if (keyboardHelper) {
    keyboardHelper = null;
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
