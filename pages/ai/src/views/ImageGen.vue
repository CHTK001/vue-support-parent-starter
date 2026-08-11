<template>
  <div class="ai-view">
    <ReImageGen base-url="/v2/generate" />
  </div>
</template>

<script setup lang="ts">
/**
 * ImageGen —— 文生图页面（万相风格）
 *
 * 通过 ReImageGen 组件承载：左侧创作历史 + 中部画布 + 右侧参数输入。
 * 后端采用异步任务模型（提交返回 taskId → 轮询查询 → 展示结果）。
 */
import ReImageGen from '@repo/ui/re-image-gen';
</script>

<style scoped>
.ai-view {
  height: 100%;
  padding: var(--ai-spacing-md);
  box-sizing: border-box;
  overflow: hidden;
}
</style>
