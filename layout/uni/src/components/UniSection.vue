<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  actionText?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <view class="uni-section">
    <view class="uni-section__main">
      <view class="uni-section__title-row">
        <view class="uni-section__mark" />
        <text class="uni-section__title">{{ title }}</text>
      </view>
      <text v-if="subtitle" class="uni-section__subtitle">{{ subtitle }}</text>
    </view>
    <view
      v-if="actionText"
      class="uni-section__action"
      hover-class="is-hovered"
      @tap="emit('action')"
    >
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.uni-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
}

.uni-section__main {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.uni-section__title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.uni-section__mark {
  width: 12rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, var(--uni-primary), var(--uni-accent));
}

.uni-section__title {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.uni-section__subtitle {
  font-size: 24rpx;
  color: var(--uni-text-muted);
}

.uni-section__action {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.74);
  border: 1rpx solid var(--uni-border-color);
  color: var(--uni-primary);
  font-size: 24rpx;
  font-weight: 700;
  transition: transform 160ms ease;

  &.is-hovered {
    transform: translateY(-2rpx);
  }
}
</style>
