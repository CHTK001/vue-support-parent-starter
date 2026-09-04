<script setup lang="ts">
/**
 * ReEmpty Modern 布局 —— 现代化扁平空状态
 *
 * 设计要点：
 *   - 主色渐变光晕背景
 *   - 极简线条图标 + 浮动微动画
 *   - 多层排版节奏感
 *   - bottom slot 行动按钮容器
 */
import "../../shared/modern-vars.css";

defineOptions({ name: "ReEmptyModern", inheritAttrs: true });

withDefaults(
  defineProps<{
    description?: string;
    image?: string;
    imageSize?: number;
  }>(),
  {
    description: "暂无数据",
    image: "",
    imageSize: 120,
  },
);
</script>

<template>
  <div class="rm-empty" v-bind="$attrs">
    <div class="rm-empty__halo" />
    <div class="rm-empty__image" :style="{ width: imageSize + 'px', height: imageSize + 'px' }">
      <slot name="image">
        <img v-if="image" :src="image" :width="imageSize" :height="imageSize" alt="empty" class="rm-empty__img" />
        <svg v-else viewBox="0 0 120 120" fill="none" class="rm-empty__svg">
          <rect x="20" y="30" width="80" height="60" rx="10" stroke="var(--rm-primary)" stroke-width="2" fill="none"/>
          <path d="M20 50h80" stroke="var(--rm-primary)" stroke-width="1.5" opacity="0.6"/>
          <circle cx="40" cy="40" r="3" fill="var(--rm-primary)" opacity="0.45"/>
          <circle cx="52" cy="40" r="3" fill="var(--rm-primary)" opacity="0.45"/>
          <circle cx="64" cy="40" r="3" fill="var(--rm-primary)" opacity="0.45"/>
          <rect x="35" y="60" width="50" height="4" rx="2" fill="var(--rm-primary)" opacity="0.2"/>
          <rect x="42" y="70" width="36" height="4" rx="2" fill="var(--rm-primary)" opacity="0.14"/>
        </svg>
      </slot>
    </div>
    <div class="rm-empty__description">
      <slot name="description">
        {{ description }}
      </slot>
    </div>
    <div v-if="$slots.default" class="rm-empty__bottom">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.rm-empty {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 16px;
  overflow: hidden;
}

.rm-empty__halo {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, 0);
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--rm-primary) 6%, transparent);
  pointer-events: none;
}

.rm-empty__image {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rm-text-disabled);
  z-index: 1;
  animation: rm-empty-float 4s var(--rm-ease) infinite;
}
.rm-empty__img {
  border-radius: 12px;
}
.rm-empty__svg {
  width: 100%;
  height: 100%;
}

.rm-empty__description {
  position: relative;
  z-index: 1;
  font-size: var(--rm-font-md);
  color: var(--rm-text-secondary);
  text-align: center;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.rm-empty__bottom {
  position: relative;
  z-index: 1;
  margin-top: 4px;
}

@keyframes rm-empty-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .rm-empty__image {
    animation: none;
  }
}
</style>