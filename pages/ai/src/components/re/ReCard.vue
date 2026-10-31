<template>
  <div class="re-card" :class="{ 're-card--hoverable': hoverable }">
    <ReCardBase
      v-bind="$attrs"
      :header="title || subtitle || undefined"
      :is-flex="false"
    >
      <template v-if="title || subtitle || $slots.header || $slots.extra" #header>
        <div class="re-card-header">
          <slot name="header">
            <span v-if="title" class="re-card-title">{{ title }}</span>
            <span v-if="subtitle" class="re-card-subtitle">{{ subtitle }}</span>
          </slot>
          <div v-if="$slots.extra" class="re-card-extra">
            <slot name="extra" />
          </div>
        </div>
      </template>

      <slot />

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </ReCardBase>
  </div>
</template>

<script setup lang="ts">
import ReCardBase from '@repo/ui/re-card'

defineOptions({ inheritAttrs: false })

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hoverable: { type: Boolean, default: false },
})
</script>

<style scoped>
/* ============ 卡片：koi 规约「卡片无投影」，层级靠边框 + 底色表达 ============ */
.re-card {
  /* 视觉全部落在内部基础组件根上（.koi-card），这里只做布局裁剪：
     若 wrapper 也画边框/底色，会和内部卡片叠出双边框 */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

/* 适配层内部包一层基础组件，koi 主题根节点自带 padding/margin；
   这里用 wrapper + :deep 的更高特异性（0,3,0 > 0,2,0）把基础主题默认值压回原布局。 */
.re-card :deep(.koi-card) {
  margin: 0;
  padding: 0;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
}

/* hoverable 才浮起：这是 koi 允许的第二类阴影（悬浮反馈），静止态仍然零投影 */
.re-card--hoverable:hover {
  box-shadow: 0 10px 24px -6px color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
  transform: translateY(-2px);
  border-color: var(--el-border-color);
}

.re-card :deep(.koi-card__header) {
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.re-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--el-text-color-primary);
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

.re-card :deep(.koi-card__body) {
  padding: 18px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.re-card :deep(.koi-card__footer) {
  padding: 12px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-card {
    transition: none;
  }

  .re-card--hoverable:hover {
    transform: none;
  }
}
</style>