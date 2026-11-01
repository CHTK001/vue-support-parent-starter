<script setup lang="ts">
/**
 * Cloudflare Tunnel 页面（@pages/tunnel）
 *
 * 仅提供一个工作台组件并嵌入 Provider 参数。
 *
 * @author CH
 * @since 4.0.0.52
 */
import TunnelWorkbench from "./TunnelWorkbench.vue";
</script>

<template>
  <div class="tunnel-page">
    <TunnelWorkbench provider="cloudflared" />
  </div>
</template>

<style scoped>
.tunnel-page {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color);
}
</style>
