<template>
  <div class="re-empty">
    <div class="re-empty-icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </slot>
    </div>
    <p class="re-empty-text">{{ text }}</p>
    <div v-if="$slots.default" class="re-empty-action">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  text: { type: String, default: '暂无数据' },
})
</script>

<style scoped>
.re-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  /* 空态是「弱信息」，占位文字色（placeholder）是唯一语义正确的令牌：
     用 regular 会让空态看起来像有内容的正文 */
  color: var(--el-text-color-placeholder);
}

.re-empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 模板里的 svg 用 stroke="currentColor"，颜色随上面的 color 走，改主题即自动跟随 */
.re-empty-icon svg {
  width: 100%;
  height: 100%;
}

.re-empty-text {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  margin: 0 0 16px 0;
}

.re-empty-action {
  display: flex;
  gap: 12px;
}

/* 尊重系统「减少动态效果」偏好。
   本组件自身没有过渡与动画，这里列出选择器作为兜底：
   消费方常通过 class 往 .re-empty 上挂自定义动画，需要一并被压制。 */
@media (prefers-reduced-motion: reduce) {
  .re-empty,
  .re-empty-icon,
  .re-empty-text,
  .re-empty-action {
    transition: none;
    animation: none;
  }
}
</style>
