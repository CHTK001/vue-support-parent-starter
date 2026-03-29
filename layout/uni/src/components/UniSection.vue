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
      <text class="uni-section__title">{{ title }}</text>
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

.uni-section__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.uni-section__subtitle {
  font-size: 24rpx;
  color: var(--uni-text-muted);
}

.uni-section__action {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid var(--uni-border-color);
  color: var(--uni-primary);
  font-size: 24rpx;
  transition: transform 160ms ease;

  &.is-hovered {
    transform: translateY(-2rpx);
  }
}
</style>
