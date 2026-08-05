<script setup lang="ts">
/**
 * ReEmpty Modern 布局 —— 现代化扁平空状态
 *
 * 设计特点：
 *   - 简洁线条图标
 *   - 柔和文字颜色
 *   - 现代间距
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
    <div class="rm-empty__image" :style="{ width: imageSize + 'px', height: imageSize + 'px' }">
      <slot name="image">
        <img v-if="image" :src="image" :width="imageSize" :height="imageSize" alt="empty" />
        <svg v-else viewBox="0 0 120 120" fill="none" class="rm-empty__svg">
          <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M20 50h80" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
          <circle cx="40" cy="40" r="3" fill="currentColor" opacity="0.3"/>
          <circle cx="52" cy="40" r="3" fill="currentColor" opacity="0.3"/>
          <circle cx="64" cy="40" r="3" fill="currentColor" opacity="0.3"/>
          <rect x="35" y="60" width="50" height="4" rx="2" fill="currentColor" opacity="0.15"/>
          <rect x="42" y="70" width="36" height="4" rx="2" fill="currentColor" opacity="0.1"/>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 16px;
}

.rm-empty__image {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rm-text-disabled);
}
.rm-empty__svg {
  width: 100%;
  height: 100%;
}

.rm-empty__description {
  font-size: var(--rm-font-md);
  color: var(--rm-text-secondary);
  text-align: center;
  line-height: 1.5;
}

.rm-empty__bottom {
  margin-top: 8px;
}
</style>
