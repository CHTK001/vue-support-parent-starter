<template>
  <div class="re-empty">
    <ReEmptyBase
      v-bind="$attrs"
      :description="text"
    >
      <template v-if="$slots.icon" #image>
        <slot name="icon" />
      </template>
      <slot />
    </ReEmptyBase>
  </div>
</template>

<script setup lang="ts">
import ReEmptyBase from '@repo/ui/re-empty'

defineOptions({ inheritAttrs: false })

defineProps({
  text: { type: String, default: '暂无数据' },
})
</script>

<style scoped>
.re-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  /* 空态是「弱信息」，占位文字色（placeholder）是唯一语义正确的令牌：
     用 regular 会让空态看起来像有内容的正文 */
  color: var(--el-text-color-placeholder);
}

.re-empty :deep(.el-empty) {
  padding: 0;
  color: var(--el-text-color-placeholder);
}

.re-empty :deep(.el-empty__image) {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.re-empty :deep(.el-empty__image svg) {
  width: 100%;
  height: 100%;
}

.re-empty :deep(.el-empty__description p) {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  margin: 0 0 16px 0;
}

.re-empty :deep(.el-empty__bottom) {
  display: flex;
  gap: 12px;
}

/* 尊重系统「减少动态效果」偏好。
   本组件自身没有过渡与动画，这里列出选择器作为兜底：
   消费方常通过 class 往 .re-empty 上挂自定义动画，需要一并被压制。 */
@media (prefers-reduced-motion: reduce) {
  .re-empty,
  .re-empty :deep(.el-empty),
  .re-empty :deep(.el-empty__image),
  .re-empty :deep(.el-empty__description p),
  .re-empty :deep(.el-empty__bottom) {
    transition: none;
    animation: none;
  }
}
</style>