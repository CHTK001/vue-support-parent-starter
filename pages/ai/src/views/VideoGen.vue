<template>
  <div class="ai-view ai-creative-view">
    <header class="ai-page-header">
      <div>
        <h2 class="ai-page-header__title">
          <span class="ai-page-header__icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)"><el-icon><VideoCamera /></el-icon></span>
          AI 文生视频
        </h2>
        <p class="ai-page-header__subtitle">基于时序扩散模型，从文本描述生成连贯短视频片段</p>
      </div>
      <div class="ai-creative-stats">
        <div class="ai-stat-pill">
          <span class="ai-stat-pill__dot" style="background:#f59e0b"></span>
          <span>服务运行中</span>
        </div>
      </div>
    </header>
    <ReVideoGen base-url="/v2/generate" />
  </div>
</template>

<script setup lang="ts">
/**
 * VideoGen —— 文生视频页面（美化版）
 *
 * 通过 ReVideoGen 组件承载创作画布（左侧历史 + 中部播放器 + 右侧参数输入）。
 * 顶部带橙色图标以区别于文生图。
 */
import { VideoCamera } from '@element-plus/icons-vue';
import ReVideoGen from '@repo/ui/re-video-gen';
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
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  animation: ai-pulse 2s ease-in-out infinite;
}
</style>
