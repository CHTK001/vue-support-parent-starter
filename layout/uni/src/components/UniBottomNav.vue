<script setup lang="ts">
import { ref, watch } from "vue";
import type { UniBottomNavItem } from "../types";

const props = defineProps<{
  items: UniBottomNavItem[];
  currentKey: string;
  pulseKey?: number;
}>();

const pulseActive = ref(false);

watch(
  () => props.pulseKey,
  (value) => {
    if (!value) return;
    pulseActive.value = false;
    requestAnimationFrame(() => {
      pulseActive.value = true;
      window.setTimeout(() => {
        pulseActive.value = false;
      }, 520);
    });
  },
);

const navigate = (item: UniBottomNavItem) => {
  if (!item.path || item.key === props.currentKey) return;
  if (item.mode === "switchTab") { uni.switchTab({ url: item.path }); return; }
  if (item.mode === "redirectTo") { uni.redirectTo({ url: item.path }); return; }
  uni.reLaunch({ url: item.path });
};
</script>

<template>
  <view class="uni-nav">
    <view
      v-for="item in items"
      :key="item.key"
      class="uni-nav__item"
      :class="{
        'is-active': item.key === currentKey,
        'is-pulse': item.key === 'cart' && pulseActive,
      }"
      :data-nav-key="item.key"
      hover-class="uni-nav__item--tap"
      @tap="navigate(item)"
    >
      <view class="uni-nav__pill">
        <text class="uni-nav__short">{{ item.shortLabel }}</text>
        <view
          v-if="item.badge"
          class="uni-nav__badge"
          :data-cart-badge="item.key === 'cart' ? 'true' : undefined"
        >
          <text>{{ item.badge }}</text>
        </view>
      </view>
      <text class="uni-nav__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.uni-nav {
  position: fixed;
  left: 18rpx;
  right: 18rpx;
  bottom: 24rpx;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8rpx;
  padding: 14rpx;
  background: rgba(255, 251, 245, 0.88);
  border: 1rpx solid rgba(73, 52, 33, 0.1);
  border-radius: 38rpx;
  box-shadow: 0 20rpx 54rpx rgba(41, 27, 17, 0.2);
  backdrop-filter: blur(28rpx);
  -webkit-backdrop-filter: blur(28rpx);
}

.uni-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 4rpx;
  transition: transform 160ms ease;

  &--tap { transform: scale(0.93); }

  &.is-active .uni-nav__pill {
    background: linear-gradient(135deg, var(--uni-primary), var(--uni-primary-light));
    box-shadow: 0 12rpx 24rpx rgba(201, 108, 45, 0.28);
  }

  &.is-active .uni-nav__short { color: #fff9f0; }
  &.is-active .uni-nav__label { color: var(--uni-primary); font-weight: 700; }
  &.is-pulse .uni-nav__pill {
    animation: uni-nav-pulse 520ms ease;
  }
  &.is-pulse .uni-nav__badge {
    animation: uni-badge-pulse 520ms ease;
  }
}

.uni-nav__pill {
  position: relative;
  min-width: 72rpx;
  height: 60rpx;
  padding: 0 16rpx;
  border-radius: var(--uni-radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(68, 49, 33, 0.06);
  transition: all 200ms ease;
}

.uni-nav__short {
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  color: var(--uni-text-muted);
}

.uni-nav__badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border-radius: var(--uni-radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--uni-primary);
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  border: 2rpx solid rgba(255, 253, 249, 0.9);
}

.uni-nav__label {
  font-size: 20rpx;
  color: var(--uni-text-muted);
  line-height: 1;
}

@keyframes uni-nav-pulse {
  0% { transform: scale(1); }
  35% { transform: scale(1.16); }
  100% { transform: scale(1); }
}

@keyframes uni-badge-pulse {
  0% { transform: scale(1); }
  35% { transform: scale(1.22); }
  100% { transform: scale(1); }
}
</style>
