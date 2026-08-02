<!--
  RemoteControl —— 远程控制页面（占位）
  完整功能：WebRTC 桌面流、终端、文件传输等，建议另起页面实现。
  此处仅保留最简入口，避免网关主页缺页。
-->
<template>
  <div class="remote-control">
    <ReCard class="placeholder-card">
      <div class="placeholder-inner">
        <el-icon :size="48"><Monitor /></el-icon>
        <h3 class="placeholder-title">远程控制</h3>
        <p class="placeholder-desc">选择一个被控端点的 Target 后，将建立远程会话</p>
        <p class="placeholder-tip">完整的桌面流/终端/文件传输请前往专门页面</p>
      </div>
    </ReCard>
  </div>
</template>

<script setup lang="ts">
import { Monitor } from "@element-plus/icons-vue";
</script>

<style scoped lang="scss">
.remote-control {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.placeholder-card {
  padding: 16px;
}

.placeholder-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
}

.placeholder-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.placeholder-desc {
  font-size: 14px;
  margin: 0;
}

.placeholder-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin: 0;
}
</style>