<!--
  RustDeskViewer —— RustDesk 协议 Viewer（占位）
  后续 Phase E 接入 RustDesk hbbs/hbbr 实现 NAT 穿透的 P2P 远控。
-->
<template>
  <div class="rustdesk-viewer">
    <div class="placeholder">
      <el-icon :size="48"><Monitor /></el-icon>
      <h3>RustDesk Viewer</h3>
      <p>占位骨架，待 Phase E 接入 hbbs/hbbr</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor } from "@element-plus/icons-vue";

/**
 * Server 返回的 WebSocket URL（暂未使用）
 */
defineProps<{
  wsUrl: string;
}>();
</script>

<style scoped lang="scss">
.rustdesk-viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
  min-height: 480px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-secondary);

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 13px;
  }
}
</style>