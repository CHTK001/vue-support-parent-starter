<script setup lang="ts">
/**
 * ReSkeleton Modern 布局 —— 现代化扁平骨架屏
 *
 * 设计要点：
 *   - 极简圆角块
 *   - 平滑 shimmer 闪烁（主色微透渐变）
 *   - 卡片化容器（玻璃质感）
 */
import "../../shared/modern-vars.css";

defineOptions({ name: "ReSkeletonModern", inheritAttrs: true });

withDefaults(
  defineProps<{
    animated?: boolean;
    count?: number;
    loading?: boolean;
    rows?: number;
    throttle?: number;
  }>(),
  {
    animated: true,
    count: 1,
    loading: false,
    rows: 3,
    throttle: 0,
  },
);
</script>

<template>
  <template v-if="loading">
    <div
      v-for="i in count"
      :key="i"
      :class="['rm-skeleton', { 'rm-skeleton--animated': animated }]"
      v-bind="$attrs"
    >
      <div class="rm-skeleton__avatar" />
      <div class="rm-skeleton__body">
        <div
          v-for="r in rows"
          :key="r"
          class="rm-skeleton__row"
          :style="{ width: r === rows ? '60%' : r === 1 ? '40%' : '100%' }"
        />
      </div>
    </div>
  </template>
  <slot v-else />
</template>

<style scoped>
.rm-skeleton {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-lg);
  background: var(--rm-bg);
  box-shadow: none;
}
.rm-skeleton + .rm-skeleton { margin-top: 12px; }

.rm-skeleton__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--rm-bg-subtle);
  flex-shrink: 0;
}

.rm-skeleton__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}

.rm-skeleton__row {
  height: 12px;
  border-radius: var(--rm-radius-xs);
  background: var(--rm-bg-subtle);
}

/* 扁平脉冲动画 */
.rm-skeleton--animated .rm-skeleton__avatar,
.rm-skeleton--animated .rm-skeleton__row {
  animation: rm-skeleton-pulse 1.6s var(--rm-ease) infinite;
}

@keyframes rm-skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

@media (prefers-reduced-motion: reduce) {
  .rm-skeleton--animated .rm-skeleton__avatar,
  .rm-skeleton--animated .rm-skeleton__row {
    animation: none;
  }
}
</style>