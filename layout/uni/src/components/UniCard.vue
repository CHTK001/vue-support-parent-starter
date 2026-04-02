<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: "none" | "sm" | "md" | "lg";
    radius?: "sm" | "md" | "lg" | "xl";
    shadow?: boolean;
    glass?: boolean;
  }>(),
  {
    padding: "md",
    radius: "lg",
    shadow: true,
    glass: false,
  },
);
</script>

<template>
  <view
    class="uni-card"
    :class="[
      `padding-${padding}`,
      `radius-${radius}`,
      { 'has-shadow': shadow, 'is-glass': glass },
    ]"
  >
    <slot />
  </view>
</template>

<style scoped lang="scss">
.uni-card {
  background: var(--uni-surface);
  border: 1rpx solid var(--uni-border-color);

  &.is-glass {
    background: rgba(255, 252, 247, 0.82);
    backdrop-filter: blur(16rpx);
  }

  &.has-shadow {
    box-shadow: var(--uni-shadow-soft);
  }

  &.padding-none { padding: 0; }
  &.padding-sm { padding: 16rpx; }
  &.padding-md { padding: 28rpx; }
  &.padding-lg { padding: 40rpx; }

  &.radius-sm { border-radius: 12rpx; }
  &.radius-md { border-radius: 20rpx; }
  &.radius-lg { border-radius: 28rpx; }
  &.radius-xl { border-radius: 40rpx; }
}
</style>
