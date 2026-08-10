<!--
  ReRdpViewer —— RDP / VNC / SSH 多协议 Viewer（经 Guacamole HTTP tunnel）
  浏览器侧使用 @guacamole/client 嵌入式 GuacamoleClient。
  props.wsUrl 是 server 返回的 WebSocket 路径（绝对 ws:// URL）。
  设计风格：低饱和度 · 暗色容器 · 极简边框
-->
<template>
  <div class="rdp-viewer flex w-full flex-col gap-2">
    <div ref="displayContainerRef" class="rdp-display"></div>
    <div v-if="status" class="rdp-viewer__status text-[12px]" style="color: var(--el-text-color-secondary)">
      {{ status }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
// @ts-expect-error - guacamole-client-js 没有官方类型
import Guacamole from "guacamole-common-js";

/**
 * Server 返回的 WebSocket URL
 */
const props = defineProps<{
  wsUrl: string;
}>();

/**
 * 状态文本
 */
const status = ref<string>("");

/**
 * 容器引用
 */
const displayContainerRef = ref<HTMLDivElement | null>(null);

/**
 * Guacamole client 实例
 */
let client: Guacamole.Client | null = null;

/**
 * 组件挂载：创建 Guacamole client 并连接
 */
onMounted(() => {
  const container = displayContainerRef.value;
  if (!container) {
    status.value = "容器未挂载";
    return;
  }
  try {
    // 把 wsUrl 转换成 Guacamole tunnel URL（去掉 ws:// 前缀）
    const url = props.wsUrl.replace(/^wss?:\/\//, "https://");
    const tunnel = new Guacamole.WebSocketTunnel(url);
    client = new Guacamole.Client(tunnel);
    const display = client.getDisplay();
    container.appendChild(display.getElement());
    client.onstatechange = (state: number) => {
      const states = ["idle", "connecting", "waiting", "connected", "disconnected", "error"];
      status.value = `Guacamole: ${states[state] ?? state}`;
    };
    client.onerror = (error: { message?: string }) => {
      status.value = `错误: ${error?.message ?? "未知"}`;
    };
  } catch (e) {
    status.value = `初始化失败: ${e instanceof Error ? e.message : String(e)}`;
  }
});

/**
 * 组件卸载：断开 Guacamole
 */
onUnmounted(() => {
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
