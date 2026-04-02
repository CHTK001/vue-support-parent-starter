<script setup lang="ts">
withDefaults(
  defineProps<{
    show?: boolean;
    text?: string;
    overlay?: boolean;
  }>(),
  {
    show: true,
    text: "加载中",
    overlay: false,
  },
);
</script>

<template>
  <view v-if="show" class="uni-loading" :class="{ 'is-overlay': overlay }">
    <view class="uni-loading__spinner" />
    <text v-if="text" class="uni-loading__text">{{ text }}</text>
  </view>
</template>

<style scoped lang="scss">
.uni-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 40rpx;

  &.is-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(245, 239, 230, 0.85);
    backdrop-filter: blur(8rpx);
    justify-content: center;
  }
}

.uni-loading__spinner {
  width: 56rpx;
  height: 56rpx;
  border: 4rpx solid var(--uni-border-color);
  border-top-color: var(--uni-primary);
  border-radius: 50%;
  animation: uni-spin 0.8s linear infinite;
}

.uni-loading__text {
  font-size: 26rpx;
  color: var(--uni-text-muted);
}

@keyframes uni-spin {
  to { transform: rotate(360deg); }
}
</style>
