<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    margin?: "sm" | "md" | "lg";
  }>(),
  {
    margin: "md",
  },
);
</script>

<template>
  <view class="uni-divider" :class="`margin-${margin}`">
    <view class="uni-divider__line" />
    <text v-if="label" class="uni-divider__label">{{ label }}</text>
    <view v-if="label" class="uni-divider__line" />
  </view>
</template>

<style scoped lang="scss">
.uni-divider {
  display: flex;
  align-items: center;
  gap: 16rpx;

  &.margin-sm { margin: 12rpx 0; }
  &.margin-md { margin: 24rpx 0; }
  &.margin-lg { margin: 40rpx 0; }
}

.uni-divider__line {
  flex: 1;
  height: 1rpx;
  background: var(--uni-border-color);
}

.uni-divider__label {
  font-size: 22rpx;
  color: var(--uni-text-muted);
  white-space: nowrap;
}
</style>
