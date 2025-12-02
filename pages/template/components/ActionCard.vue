<template>
  <div class="action-card" :class="{ 'is-disabled': disabled }">
    <div class="action-card__icon-wrapper">
      <div class="action-card__icon" :style="iconStyle">
        <IconifyIconOnline :icon="icon" />
      </div>
      <div class="action-card__pulse"></div>
    </div>
    <div class="action-card__content">
      <h4 class="action-card__title">{{ title }}</h4>
      <p class="action-card__description">{{ description }}</p>
    </div>
    <div class="action-card__arrow">
      <IconifyIconOnline icon="ri:arrow-right-line" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "ri:flashlight-line",
  title: "快速操作",
  description: "点击执行操作",
  disabled: false,
});

const iconStyle = computed(() => ({
  color: props.iconColor || "var(--el-color-primary)",
  background: props.iconBg || "var(--el-color-primary-light-9)",
}));
</script>

<style lang="scss" scoped>
.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--el-color-primary);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }

  &:hover:not(.is-disabled) {
    transform: translateX(8px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);

    &::before {
      transform: scaleY(1);
    }

    .action-card__icon {
      transform: scale(1.1) rotate(5deg);
    }

    .action-card__pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }

    .action-card__arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 24px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
  }

  &__pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--el-color-primary);
    opacity: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 4px 0;
  }

  &__description {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  &__arrow {
    font-size: 20px;
    color: var(--el-color-primary);
    opacity: 0;
    transform: translateX(0);
    transition: all 0.3s ease;
  }
}

@keyframes pulse {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
