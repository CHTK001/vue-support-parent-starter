<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number;
    avatar?: boolean;
    animated?: boolean;
  }>(),
  {
    rows: 3,
    avatar: false,
    animated: true,
  },
);
</script>

<template>
  <view class="uni-skeleton" :class="{ 'is-animated': animated }">
    <view v-if="avatar" class="uni-skeleton__avatar" />
    <view class="uni-skeleton__body">
      <view
        v-for="i in rows"
        :key="i"
        class="uni-skeleton__row"
        :style="i === rows && rows > 1 ? 'width:60%' : ''"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
.uni-skeleton {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;

  &.is-animated .uni-skeleton__avatar,
  &.is-animated .uni-skeleton__row {
    background: linear-gradient(
      90deg,
      rgba(200, 190, 180, 0.2) 25%,
      rgba(200, 190, 180, 0.4) 50%,
      rgba(200, 190, 180, 0.2) 75%
    );
    background-size: 200% 100%;
    animation: uni-shimmer 1.4s ease infinite;
  }
}

.uni-skeleton__avatar {
  flex-shrink: 0;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(200, 190, 180, 0.3);
}

.uni-skeleton__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  justify-content: center;
}

.uni-skeleton__row {
  height: 28rpx;
  border-radius: 8rpx;
  background: rgba(200, 190, 180, 0.3);
  width: 100%;
}

@keyframes uni-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
