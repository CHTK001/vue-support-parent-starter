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
  position: relative;
  overflow: hidden;
  padding: 24rpx;
  background:
    radial-gradient(circle at top right, rgba(201, 108, 45, 0.16), transparent 24%),
    radial-gradient(circle at 15% 18%, rgba(22, 107, 90, 0.12), transparent 28%),
    radial-gradient(circle at 82% 72%, rgba(255, 214, 143, 0.18), transparent 26%),
    var(--uni-shell-bg);
  box-sizing: border-box;

  &.has-bottom-inset {
    padding-bottom: 224rpx;
  }

  &.is-condensed {
    padding-top: 12rpx;
  }
}

.uni-page-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1rpx, transparent 1rpx);
  background-size: 48rpx 48rpx;
  opacity: 0.24;
  pointer-events: none;
}

.uni-page-shell__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
