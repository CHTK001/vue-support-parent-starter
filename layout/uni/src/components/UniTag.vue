<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: "primary" | "accent" | "muted" | "danger" | "custom";
    customColor?: string;
    size?: "sm" | "md";
  }>(),
  {
    color: "primary",
    size: "md",
  },
);
</script>

<template>
  <view
    class="uni-tag"
    :class="[`color-${color}`, `size-${size}`]"
    :style="color === 'custom' && customColor ? `background:${customColor}22;color:${customColor}` : ''"
  >
    <slot />
  </view>
</template>

<style scoped lang="scss">
.uni-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999rpx;

  &.size-sm { padding: 4rpx 14rpx; font-size: 20rpx; }
  &.size-md { padding: 6rpx 18rpx; font-size: 22rpx; }

  &.color-primary {
    background: rgba(201, 108, 45, 0.12);
    color: var(--uni-primary);
  }
  &.color-accent {
    background: rgba(22, 107, 90, 0.12);
    color: var(--uni-accent);
  }
  &.color-muted {
    background: rgba(118, 104, 91, 0.1);
    color: var(--uni-text-muted);
  }
  &.color-danger {
    background: rgba(192, 57, 43, 0.1);
    color: #c0392b;
  }
}
</style>
