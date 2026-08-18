<template>
  <div class="ai-view ai-creative-view">
    <header class="ai-page-header">
      <div>
        <h2 class="ai-page-header__title">
          <span class="ai-page-header__icon"><el-icon><Picture /></el-icon></span>
          AI 文生图
        </h2>
        <p class="ai-page-header__subtitle">基于多模态扩散模型，输入 prompt 一键生成高质量图像</p>
      </div>
      <div class="ai-creative-stats">
        <div class="ai-stat-pill">
          <span class="ai-stat-pill__dot" style="background:#22c55e"></span>
          <span>服务运行中</span>
        </div>
      </div>
    </header>
    <ReImageGen base-url="/v2/generate" />
  </div>
</template>

<script setup lang="ts">
/**
 * ImageGen —— 文生图页面（美化版）
 *
 * 通过 ReImageGen 组件承载创作画布（左侧历史 + 中部画布 + 右侧参数输入）。
 * 外层包了 ai-page-header 风格化（页面标题 + 服务状态指示）。
 */
import { Picture } from '@element-plus/icons-vue';
import ReImageGen from '@repo/ui/re-image-gen';
</script>

<style scoped>
.ai-creative-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--ai-spacing-md);
  box-sizing: border-box;
  gap: var(--ai-spacing-md);
  overflow: hidden;
  animation: ai-fade-in 0.35s ease-out;
}

.ai-creative-stats {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-sm);
}

.ai-stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--ai-radius-pill);
  background: var(--ai-bg-overlay);
  font-size: var(--ai-text-xs);
  color: var(--ai-text-secondary);
  font-weight: 500;
}
.ai-stat-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  animation: ai-pulse 2s ease-in-out infinite;
}
</style>
