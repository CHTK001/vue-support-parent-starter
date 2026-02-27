<template>
  <div class="feature-card" :class="{ 'is-active': active }">
    <div class="feature-card__glow"></div>
    <div class="feature-card__icon-wrapper">
      <div class="feature-card__icon" :style="iconStyle">
        <IconifyIconOnline :icon="icon" />
      </div>
    </div>
    <div class="feature-card__content">
      <h3 class="feature-card__title">{{ title }}</h3>
      <p class="feature-card__description">{{ description }}</p>
    </div>
    <div v-if="$slots.footer || showAction" class="feature-card__footer">
      <slot name="footer">
        <ScButton type="primary" text>
          <IconifyIconOnline icon="ri:arrow-right-line" />
          了解更多
        </ScButton>
      </slot>
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
  active?: boolean;
  showAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "ri:star-line",
  title: "功能标题",
  description: "功能描述信息",
  active: false,
  showAction: true,
});

const iconStyle = computed(() => ({
  color: props.iconColor || "var(--el-color-primary)",
  background: props.iconBg || "var(--el-color-primary-light-9)",
}));
</script>

<style lang="scss" scoped>
.feature-card {
  position: relative;
  padding: 32px;
  background: var(--el-bg-color-overlay);
  border-radius: 20px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary);

    .feature-card__glow {
      opacity: 1;
    }

    .feature-card__icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.2);

    .feature-card__glow {
      opacity: 0.8;
    }
  }

  &__glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(var(--el-color-primary-rgb), 0.15) 0%,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &__icon-wrapper {
    margin-bottom: 24px;
  }

  &__icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    font-size: 36px;
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
  }

  &__content {
    margin-bottom: 20px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 12px 0;
  }

  &__description {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
    margin: 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-start;
  }
}
</style>
