<template>
  <div class="re-card" :class="{ 're-card--hoverable': hoverable }">
    <div v-if="title || $slots.header" class="re-card-header">
      <slot name="header">
        <span class="re-card-title">{{ title }}</span>
        <span v-if="subtitle" class="re-card-subtitle">{{ subtitle }}</span>
      </slot>
      <div v-if="$slots.extra" class="re-card-extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="re-card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="re-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hoverable: { type: Boolean, default: false },
})
</script>

<style scoped>
/* ============ 卡片：koi 规约「卡片无投影」，层级靠边框 + 底色表达 ============ */
.re-card {
  background: var(--el-bg-color);
  /* 原 var(--mp-radius, 12px) 里的 --mp-radius 不是 koi 令牌（永远取不到），统一到 --el-radius-lg */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

/* hoverable 才浮起：这是 koi 允许的第二类阴影（悬浮反馈），静止态仍然零投影 */
.re-card--hoverable:hover {
  box-shadow: 0 10px 24px -6px color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
  transform: translateY(-2px);
  border-color: var(--el-border-color);
}

.re-card-header {
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background: var(--el-fill-color-light);
}

.re-card-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.01em;
}

.re-card-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.re-card-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-card-body {
  padding: 18px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.re-card-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-card {
    transition: none;
  }
}
</style>
