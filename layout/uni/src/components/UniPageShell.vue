<script setup lang="ts">
withDefaults(
  defineProps<{
    withBottomInset?: boolean;
    condensed?: boolean;
  }>(),
  {
    withBottomInset: false,
    condensed: false,
  },
);
</script>

<template>
  <view
    class="uni-page-shell"
    :class="{
      'has-bottom-inset': withBottomInset,
      'is-condensed': condensed,
    }"
  >
    <slot name="hero" />
    <view class="uni-page-shell__content">
      <slot />
    </view>
    <slot name="footer" />
  </view>
</template>

<style scoped lang="scss">
.uni-page-shell {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top right, rgba(201, 108, 45, 0.14), transparent 26%),
    radial-gradient(circle at top left, rgba(22, 107, 90, 0.1), transparent 30%),
    var(--uni-shell-bg);
  box-sizing: border-box;

  &.has-bottom-inset {
    padding-bottom: 216rpx;
  }

  &.is-condensed {
    padding-top: 12rpx;
  }
}

.uni-page-shell__content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
