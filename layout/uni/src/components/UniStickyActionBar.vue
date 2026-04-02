<template>
  <view class="uni-sticky-action-bar">
    <slot />
  </view>
</template>

<style scoped lang="scss">
.uni-sticky-action-bar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 28rpx;
  z-index: 42;
  padding: 16rpx;
  border-radius: 34rpx;
  background: rgba(255, 252, 247, 0.9);
  border: 1rpx solid rgba(73, 58, 45, 0.1);
  box-shadow: 0 18rpx 48rpx rgba(51, 40, 28, 0.16);
  backdrop-filter: blur(22rpx);
}
</style>
