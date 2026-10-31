<template>
  <span class="re-tag" :class="`re-tag--${type}`">
    <ReTagBase
      :type="type"
      :size="size || undefined"
      :effect="effect"
      :round="round"
      :closable="closable"
      disable-transitions
      @close="$emit('close', $event)"
    >
      <slot />
    </ReTagBase>
  </span>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'
import ReTagBase from '@repo/ui/re-tag'

defineProps({
  type: {
    type: String as PropType<
      'primary' | 'success' | 'info' | 'warning' | 'danger'
    >,
    default: 'info',
  },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  effect: {
    type: String as PropType<'light' | 'dark' | 'plain'>,
    default: 'light',
  },
  round: { type: Boolean, default: true },
  closable: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>

<style scoped>
.re-tag :deep(.el-tag) {
  border-radius: var(--el-radius-sm, 6px);
  font-weight: 500;
  letter-spacing: 0.01em;
  border: none;
  padding: 0 10px;
  height: 24px;
  line-height: 22px;
}

/* 各语义色的浅底：原来是「同色两个色相各 15% 透明度的渐变」，
   两端透明度一样、视觉上就是一个纯 15% 淡色，渐变纯属噪音；
   这里收敛成单层 color-mix，同时让配色跟主题走。 */
.re-tag--primary :deep(.el-tag) {
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  color: var(--el-color-primary);
}

.re-tag--success :deep(.el-tag) {
  background: color-mix(in srgb, var(--el-color-success) 15%, transparent);
  color: var(--el-color-success);
}

.re-tag--warning :deep(.el-tag) {
  background: color-mix(in srgb, var(--el-color-warning) 15%, transparent);
  color: var(--el-color-warning);
}

.re-tag--danger :deep(.el-tag) {
  background: color-mix(in srgb, var(--el-color-danger) 15%, transparent);
  color: var(--el-color-danger);
}

.re-tag--info :deep(.el-tag) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

/* 尊重系统「减少动态效果」偏好。
   模板上已用 :disable-transitions="true" 关掉 Element Plus 自带过渡，
   这里再兜一层，防止消费方给 .re-tag 挂 class 时把动画带回来。 */
@media (prefers-reduced-motion: reduce) {
  .re-tag :deep(.el-tag) {
    transition: none;
  }
}
</style>