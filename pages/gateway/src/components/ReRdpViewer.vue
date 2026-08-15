<!--
  ReRdpViewer —— RDP / VNC / SSH 多协议 Viewer（经 Guacamole HTTP tunnel）
  浏览器侧使用 @guacamole/client 嵌入式 GuacamoleClient。
  props.wsUrl 是 server 返回的 WebSocket 路径（绝对 ws:// URL）。
  设计风格：低饱和度 · 暗色容器 · 极简边框
-->
<template>
  <div class="rdp-viewer flex w-full flex-col gap-2">
    <div ref="displayContainerRef" class="rdp-display"></div>
    <div v-if="status" class="rdp-viewer__status text-[12px] text-el-text-secondary">
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
    // 并回调 sendKeyEvent 把按键指令发给 guacd。绑定 document 可捕获全局按键。
    keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number): boolean => {
      client?.sendKeyEvent(true, keysym);
      return false;
    };
    keyboard.onkeyup = (keysym: number): boolean => {
      client?.sendKeyEvent(false, keysym);
      return false;
    };
    // 鼠标：点击 display 区域时聚焦显示层
    mouse = new Guacamole.Mouse(displayEl);
    mouse.onmousedown = () => {
      displayEl.focus();
    };
    client.onstatechange = (state: number) => {
      const states = ["idle", "connecting", "waiting", "connected", "disconnected", "error"];
      status.value = `Guacamole: ${states[state] ?? state}`;
    };
    client.onerror = (error: { message?: string }) => {
      status.value = `错误: ${error?.message ?? "未知"}`;
    };
    // 必须显式 connect()：guacamole-common-js 只有调用 connect() 才会
    // 发送 select/size/connect 握手指令，guacd 才会返回 args 并建立会话。
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
.rdp-display {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: #000;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.rdp-display :deep(> div) {
  width: 100%;
  height: 100%;
}
</style>
