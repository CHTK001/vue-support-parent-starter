<script setup lang="ts">
/**
 * iframe 加载遮罩层组件。
 *
 * 在 iframe 加载期间显示 indeterminate 进度条和加载文字，
 * 用于 PDF、Office、Font 等 iframe 预览类型。
 *
 * @author Buffy
 * @since 2026/09/10
 */
defineProps<{ loading: boolean }>();
</script>

<template>
  <div v-if="loading" class="iframe-overlay">
    <el-progress
      :percentage="70"
      :indeterminate="true"
      :stroke-width="3"
      :show-text="false"
      class="iframe-overlay__progress"
    />
    <div class="iframe-overlay__text">加载中…</div>
  </div>
</template>

<style scoped>
.iframe-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  background: var(--el-bg-color-page);
  border-radius: var(--el-radius-md, 8px);
}

.iframe-overlay__progress {
  width: 60%;
  max-width: 320px;
}

.iframe-overlay__text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
