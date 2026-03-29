<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  actionText?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <view class="uni-empty-state">
    <view class="uni-empty-state__badge">
      <text>00</text>
    </view>
    <text class="uni-empty-state__title">{{ title }}</text>
    <text v-if="description" class="uni-empty-state__description">
      {{ description }}
    </text>
    <view
      v-if="actionText"
      class="uni-empty-state__action"
      hover-class="is-hovered"
      @tap="emit('action')"
    >
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.uni-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  padding: 72rpx 40rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid var(--uni-border-color);
  text-align: center;
}

.uni-empty-state__badge {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--uni-accent), #3f9d86);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.uni-empty-state__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.uni-empty-state__description {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--uni-text-muted);
}

.uni-empty-state__action {
  margin-top: 6rpx;
  padding: 16rpx 30rpx;
  border-radius: 999rpx;
  background: var(--uni-primary);
  color: #fff9f3;
  font-size: 24rpx;
}
</style>
