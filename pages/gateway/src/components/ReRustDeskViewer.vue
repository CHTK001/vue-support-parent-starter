<!--
  ReRustDeskViewer —— RustDesk 协议 Viewer（占位）
  后续 Phase E 接入 RustDesk hbbs/hbbr 实现 NAT 穿透的 P2P 远控。
  设计风格：低饱和度 · 极简单色 · Vercel/Linear 空状态
-->
<template>
  <div
    class="rustdesk-viewer flex w-full flex-col items-center justify-center"
    style="background: var(--el-bg-color-page)"
  >
    <div class="rustdesk-viewer__placeholder flex flex-col items-center gap-3 px-10 py-16 text-center">
      <div style="color: var(--el-text-color-placeholder)">
        <el-icon :size="48"><Monitor /></el-icon>
      </div>
      <h3 class="text-[18px] font-semibold" style="color: var(--el-text-color-primary)">RustDesk Viewer</h3>
      <p class="max-w-[360px] text-[13px]" style="color: var(--el-text-color-secondary)">
        占位骨架，待 Phase E 接入 hbbs/hbbr
      </p>
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

<style scoped>
.rustdesk-viewer {
  height: 70vh;
  min-height: 480px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
}
</style>
