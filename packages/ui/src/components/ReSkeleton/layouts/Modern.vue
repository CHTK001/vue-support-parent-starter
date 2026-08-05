<script setup lang="ts">
/**
 * ReSkeleton Modern 布局 —— 现代化扁平骨架屏
 *
 * 设计特点：
 *   - 圆角骨架
 *   - 平滑闪烁动画
 *   - 柔和渐变
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
      <div class="rm-skeleton__header">
        <div class="rm-skeleton__avatar" />
      </div>
      <div class="rm-skeleton__body">
        <div v-for="r in rows" :key="r" class="rm-skeleton__row" :style="{ width: r === rows ? '60%' : '100%' }" />
      </div>
    </div>
  </template>
  <slot v-else />
</template>

<style scoped>
.rm-skeleton {
  display: flex;
  gap: 16px;
  padding: 12px 0;
}
.rm-skeleton + .rm-skeleton { margin-top: 8px; }

.rm-skeleton__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--rm-radius);
  background: var(--rm-bg-subtle);
  flex-shrink: 0;
}

.rm-skeleton__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rm-skeleton__row {
  height: 14px;
  border-radius: var(--rm-radius-xs);
  background: var(--rm-bg-subtle);
}

/* Animation */
.rm-skeleton--animated .rm-skeleton__avatar,
.rm-skeleton--animated .rm-skeleton__row {
  background: linear-gradient(
    90deg,
    var(--rm-bg-subtle) 25%,
    var(--rm-bg-hover) 50%,
    var(--rm-bg-subtle) 75%
  );
  background-size: 200% 100%;
  animation: rm-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes rm-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
