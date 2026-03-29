<script setup lang="ts">
import type { UniBottomNavItem } from "../types";

const props = defineProps<{
  items: UniBottomNavItem[];
  currentKey: string;
}>();

const navigate = (item: UniBottomNavItem) => {
  if (!item.path || item.key === props.currentKey) {
    return;
  }

  if (item.mode === "switchTab") {
    uni.switchTab({ url: item.path });
    return;
  }

  if (item.mode === "redirectTo") {
    uni.redirectTo({ url: item.path });
    return;
  }

  uni.reLaunch({ url: item.path });
};
</script>

<template>
  <view class="uni-bottom-nav">
    <view
      v-for="item in items"
      :key="item.key"
      class="uni-bottom-nav__item"
      :class="{ 'is-active': item.key === currentKey }"
      hover-class="is-hovered"
      @tap="navigate(item)"
    >
      <view class="uni-bottom-nav__dot">
        <text>{{ item.shortLabel }}</text>
        <view v-if="item.badge" class="uni-bottom-nav__badge">
          <text>{{ item.badge }}</text>
        </view>
      </view>
      <text class="uni-bottom-nav__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.uni-bottom-nav {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 28rpx;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 14rpx;
  background: rgba(255, 252, 247, 0.92);
  border: 1rpx solid rgba(73, 58, 45, 0.08);
  border-radius: 32rpx;
  box-shadow: 0 18rpx 48rpx rgba(51, 40, 28, 0.16);
  backdrop-filter: blur(18rpx);
}

.uni-bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 6rpx;
  color: var(--uni-text-muted);
  transition: transform 160ms ease;

  &.is-hovered {
    transform: translateY(-2rpx);
  }

  &.is-active {
    color: var(--uni-text-strong);
  }
}

.uni-bottom-nav__dot {
  position: relative;
  min-width: 64rpx;
  height: 64rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(22, 107, 90, 0.08);
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.is-active .uni-bottom-nav__dot {
  background: linear-gradient(135deg, var(--uni-primary), #d18d57);
  color: #fffaf3;
}

.uni-bottom-nav__badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #166b5a;
  color: #ffffff;
  font-size: 18rpx;
  line-height: 1;
}

.uni-bottom-nav__label {
  font-size: 22rpx;
  line-height: 1.2;
}
</style>
