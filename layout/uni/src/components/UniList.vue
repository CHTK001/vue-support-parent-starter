<script setup lang="ts">
withDefaults(
  defineProps<{
    divided?: boolean;
    card?: boolean;
  }>(),
  {
    divided: true,
    card: true,
  },
);
</script>

<template>
  <view class="uni-list" :class="{ 'is-divided': divided, 'is-card': card }">
    <slot />
  </view>
</template>

<style scoped lang="scss">
.uni-list {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-card {
    background: var(--uni-surface);
    border: 1rpx solid var(--uni-border-color);
    border-radius: 28rpx;
    box-shadow: var(--uni-shadow-soft);
  }

  &.is-divided :slotted(.uni-list-item + .uni-list-item) {
    border-top: 1rpx solid var(--uni-border-color);
  }
}
</style>
