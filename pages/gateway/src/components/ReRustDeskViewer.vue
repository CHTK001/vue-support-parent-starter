<!--
  ReRustDeskViewer —— RustDesk 协议 Viewer（占位）
  后续 Phase E 接入 RustDesk hbbs/hbbr 实现 NAT 穿透的 P2P 远控。
  设计风格：低饱和度 · 极简单色 · Vercel/Linear 空状态
-->
<template>
  <div
    class="rustdesk-viewer flex w-full items-center justify-center bg-el-bg-page"
    role="status"
  >
    <ReEmptyState
      :title="'RustDesk Viewer'"
      :description="'占位骨架，待 Phase E 接入 hbbs/hbbr'"
      :icon="Monitor"
      size="large"
    />
  </div>
</template>

<script setup lang="ts">
import { Monitor } from "@element-plus/icons-vue";
import ReEmptyState from "@repo/ui/re-empty-state";

defineProps<{
  wsUrl: string;
}>();
</script>

<style scoped>
.rustdesk-viewer {
  height: 70vh;
  min-height: 480px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
}
</style>
