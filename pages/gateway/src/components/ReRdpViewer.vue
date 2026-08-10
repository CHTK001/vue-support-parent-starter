<!--
  RdpViewer —— RDP / VNC / SSH 多协议 Viewer（经 Guacamole HTTP tunnel）
  浏览器侧使用 @guacamole/client 嵌入式 GuacamoleClient。
  props.wsUrl 是 server 返回的 WebSocket 路径（绝对 ws:// URL）。
-->
<template>
  <div class="rdp-viewer">
    <div ref="displayContainerRef" class="rdp-display"></div>
    <div v-if="status" class="status">{{ status }}</div>
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

<style scoped lang="scss">
.rdp-viewer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rdp-display {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: #000;
  border-radius: 6px;
  overflow: hidden;

  :deep(> div) {
    width: 100%;
    height: 100%;
  }
}

.status {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>