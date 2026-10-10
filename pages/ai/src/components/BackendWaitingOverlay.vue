<template>
  <div class="flex flex-col h-full">
    <CustomTitlebar />
    <div class="backend-waiting-overlay">
      <div v-if="!error" class="waiting-content">
        <div class="logo-container">
          <svg class="logo-spin" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"
              stroke-dasharray="283" stroke-dashoffset="200" class="spinner-ring" />
            <text x="50" y="62" text-anchor="middle" font-size="32" fill="currentColor"
              class="logo-text">⚡</text>
          </svg>
        </div>
        <h2 class="loading-title">{{ t('ui.backend.starting') }}</h2>
        <p class="loading-desc">{{ t('ui.backend.startingDesc') }}</p>
      </div>

      <div v-else class="error-content">
        <div class="error-icon">⚠</div>
        <h2 class="error-title">{{ t('ui.backend.startFailed') }}</h2>
        <p class="error-text">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CustomTitlebar from './CustomTitlebar.vue'

const { t } = useI18n()

defineProps<{
  error: string | null;
}>();
</script>

<style scoped>
/* 令牌口径：颜色一律走 --el-*。原 var(--color-text-secondary, #909399) /
   var(--color-danger, #f56c6c) 这两个 --color-* 在 refactor.css 里并不存在，
   一直靠写死的 hex 兜底在渲染，换肤后完全对不上。 */
.backend-waiting-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 原值 var(--color-bg) → 页面底色令牌（明暗自动切换） */
  background: var(--el-bg-color-page);
}

.waiting-content,
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 360px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-spin {
  /* 原值 var(--color-primary, #409eff) → 主色令牌 */
  color: var(--el-color-primary);
}

.spinner-ring {
  transform-origin: center;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.logo-text {
  user-select: none;
}

.loading-title {
  font-size: 20px;
  font-weight: 600;
  /* 原值 var(--color-text, #303133) → 主文字色令牌 */
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
}

.loading-desc {
  font-size: 14px;
  /* 原值 var(--color-text-secondary, #909399) → 次级文字色令牌 */
  color: var(--el-text-color-secondary);
  margin: 0;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  /* 原值 var(--color-danger, #f56c6c)：--color-danger 未定义，实际是写死的红 → 危险色令牌 */
  color: var(--el-color-danger);
  margin: 0 0 8px;
}

.error-text {
  font-size: 14px;
  /* 原值 var(--color-text-secondary, #909399) → 次级文字色令牌 */
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.6;
}

/* 尊重系统「减少动态效果」偏好。
   关闭旋转后状态不会丢失：SVG 上 stroke-dasharray="283" / stroke-dashoffset="200"
   本来就画出一段约 2/3 的静态圆弧，静止时依然是明确的「正在启动」指示。 */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation: none;
  }
}
</style>
