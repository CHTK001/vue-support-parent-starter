<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: "primary" | "accent" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    block?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: "primary",
    size: "md",
    block: false,
    loading: false,
    disabled: false,
  },
);

const emit = defineEmits<{ tap: [] }>();

const handleTap = () => {
  if (props.loading || props.disabled) return;
  emit("tap");
};
</script>

<template>
  <view
    class="uni-button"
    :class="[
      `type-${props.type}`,
      `size-${props.size}`,
      { 'is-block': props.block, 'is-loading': props.loading, 'is-disabled': props.disabled },
    ]"
    hover-class="is-hovered"
    @tap="handleTap"
  >
    <text v-if="props.loading" class="uni-button__spinner">○</text>
    <slot />
  </view>
</template>

<style scoped lang="scss">
.uni-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 999rpx;
  font-weight: 600;
  transition: transform 160ms ease;

  &.is-hovered:not(.is-disabled):not(.is-loading) {
    transform: translateY(-2rpx);
  }

  &.is-block {
    display: flex;
    width: 100%;
  }

  &.is-disabled {
    opacity: 0.45;
  }

  // sizes
  &.size-sm { padding: 10rpx 24rpx; font-size: 24rpx; }
  &.size-md { padding: 18rpx 40rpx; font-size: 28rpx; }
  &.size-lg { padding: 26rpx 56rpx; font-size: 32rpx; }

  // types
  &.type-primary {
    background: var(--uni-primary);
    color: #fff9f3;
  }
  &.type-accent {
    background: var(--uni-accent);
    color: #f0faf8;
  }
  &.type-ghost {
    background: rgba(255, 255, 255, 0.72);
    border: 1rpx solid var(--uni-border-color);
    color: var(--uni-primary);
  }
  &.type-danger {
    background: #c0392b;
    color: #fff;
  }
}

.uni-button__spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
