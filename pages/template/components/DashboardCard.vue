<template>
  <div
    class="dashboard-card"
    :class="[`dashboard-card--${type}`, { 'is-hoverable': hoverable }]"
  >
    <div class="dashboard-card__header">
      <div class="dashboard-card__icon" :style="{ background: iconBg }">
        <IconifyIconOnline :icon="icon" />
      </div>
      <div class="dashboard-card__info">
        <div class="dashboard-card__label">{{ label }}</div>
        <div class="dashboard-card__value">{{ value }}</div>
      </div>
    </div>
    <div v-if="trend" class="dashboard-card__trend" :class="trendClass">
      <IconifyIconOnline :icon="trendIcon" />
      <span>{{ trend }}</span>
    </div>
    <div v-if="$slots.footer" class="dashboard-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  type?: "primary" | "success" | "warning" | "danger" | "info";
  icon?: string;
  iconBg?: string;
  label?: string;
  value?: string | number;
  trend?: string;
  trendType?: "up" | "down";
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "primary",
  icon: "ri:dashboard-line",
  label: "标签",
  value: "0",
  hoverable: true,
});

const trendIcon = computed(() => {
  return props.trendType === "up" ? "ri:arrow-up-line" : "ri:arrow-down-line";
});

const trendClass = computed(() => {
  return props.trendType === "up" ? "is-up" : "is-down";
});
</script>

<style lang="scss" scoped>
.dashboard-card {
  padding: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: var(--el-color-primary);
    transition: height 0.3s ease;
  }

  &.is-hoverable:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary);

    &::before {
      height: 6px;
    }
  }

  &--primary::before {
    background: var(--el-color-primary);
  }

  &--success::before {
    background: var(--el-color-success);
  }

  &--warning::before {
    background: var(--el-color-warning);
  }

  &--danger::before {
    background: var(--el-color-danger);
  }

  &--info::before {
    background: var(--el-color-info);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  &__icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary-light-9);
    border-radius: 14px;
    font-size: 28px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  &__value {
    font-size: 32px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 8px;
    width: fit-content;

    &.is-up {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }

    &.is-down {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }
  }

  &__footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
