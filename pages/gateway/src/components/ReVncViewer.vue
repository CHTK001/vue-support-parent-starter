<!--
  VncViewer —— VNC 远控 Viewer（纯 Java WS↔TCP 透明转发，前端用 noVNC 客户端）
  props.wsUrl 是 server 返回的 WebSocket 路径（绝对 ws:// URL）
  推荐自托管 noVNC 静态文件（生产）；dev 模式可走公共 CDN。
-->
<template>
  <div class="vnc-viewer">
    <iframe
      ref="iframeRef"
      class="vnc-iframe"
      :src="iframeSrc"
      title="VNC Remote"
      allow="fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms"
    ></iframe>
    <div v-if="error" class="error">VNC Viewer 错误: {{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

/**
 * Server 返回的 WebSocket URL
 */
const props = defineProps<{
  wsUrl: string;
}>();

/**
 * iframe 引用
 */
const iframeRef = ref<HTMLIFrameElement | null>(null);

/**
 * 错误信息
 */
const error = ref<string>("");

/**
 * noVNC 嵌入式 iframe URL
 *
 * 生产部署应替换为自托管 novnc 静态文件。
 * 这里使用项目内置的 novnc 路径（通过 vite 静态资源加载）。
 */
const iframeSrc = computed<string>(() => {
  // 把 server 返回的 wsUrl 作为 path 拼到 noVNC
  const encPath = encodeURIComponent(props.wsUrl);
  return `/novnc/vnc.html?autoconnect=true&resize=scale&path=${encPath}&repeaterID=&show_dot=true&cursor=true&logging=warn`;
});

/**
 * 组件挂载：监听 iframe 加载失败
 */
onMounted(() => {
  const frame = iframeRef.value;
  if (!frame) {
    return;
  }
  frame.addEventListener("error", () => {
    error.value = "iframe 加载失败，请检查 noVNC 静态资源";
  });
});

/**
 * 组件卸载：清理
 */
onUnmounted(() => {
  // noVNC iframe 卸载时自动断 WS
});
</script>

<style scoped lang="scss">
.vnc-viewer {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
}

.vnc-iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.error {
  padding: 12px;
  color: var(--el-color-danger);
  font-size: 13px;
}
</style>