<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    showBack?: boolean;
    transparent?: boolean;
  }>(),
  {
    title: "",
    showBack: false,
    transparent: false,
  },
);

const emit = defineEmits<{ back: [] }>();

const handleBack = () => {
  emit("back");
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 });
  } else {
    uni.reLaunch({ url: "/pages/home/index" });
  }
};
</script>

<template>
  <view class="uni-header" :class="{ 'is-transparent': transparent }">
    <view v-if="showBack" class="uni-header__back" hover-class="is-hovered" @tap="handleBack">
      <text class="uni-header__back-icon">‹</text>
    </view>
    <text v-if="title" class="uni-header__title">{{ title }}</text>
    <view class="uni-header__right">
      <slot name="right" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.uni-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  gap: 16rpx;
  background: var(--uni-surface-strong);
  border-bottom: 1rpx solid var(--uni-border-color);

  &.is-transparent {
    background: transparent;
    border-bottom: none;
  }
}

.uni-header__back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  border: 1rpx solid var(--uni-border-color);
  transition: transform 160ms ease;

  &.is-hovered {
    transform: scale(0.92);
  }
}

.uni-header__back-icon {
  font-size: 48rpx;
  color: var(--uni-text-strong);
  line-height: 1;
  margin-top: -4rpx;
}

.uni-header__title {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uni-header__right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-left: auto;
}
</style>
