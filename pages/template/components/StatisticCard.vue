<template>
  <div class="statistic-card" :class="`statistic-card--${theme}`">
    <div class="statistic-card__bg"></div>
    <div class="statistic-card__content">
      <div class="statistic-card__icon-wrapper">
        <div class="statistic-card__icon">
          <IconifyIconOnline :icon="icon" />
        </div>
        <div class="statistic-card__icon-ring"></div>
      </div>
      <div class="statistic-card__data">
        <div class="statistic-card__value">{{ formattedValue }}</div>
        <div class="statistic-card__label">{{ label }}</div>
      </div>
    </div>
    <div
      v-if="showTrend && trend"
      class="statistic-card__trend"
      :class="trendClass"
    >
      <IconifyIconOnline :icon="trendIcon" />
      <span>{{ trend }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  icon?: string;
  label?: string;
  value?: string | number;
  theme?:
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple"
    | "orange";
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  showTrend?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "ri:bar-chart-line",
  label: "统计数据",
  value: 0,
  theme: "primary",
  showTrend: true,
  trendType: "neutral",
  decimals: 0,
});

const formattedValue = computed(() => {
  let val = props.value;
  if (typeof val === "number" && props.decimals > 0) {
    val = val.toFixed(props.decimals);
  }
  return `${props.prefix || ""}${val}${props.suffix || ""}`;
});

const trendIcon = computed(() => {
  if (props.trendType === "up") return "ri:arrow-up-line";
  if (props.trendType === "down") return "ri:arrow-down-line";
  return "ri:subtract-line";
});

const trendClass = computed(() => {
  return `is-${props.trendType}`;
});
</script>

<style lang="scss" scoped>
.statistic-card {
  position: relative;
  padding: 28px;
  background: var(--el-bg-color-overlay);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);

    .statistic-card__icon {
      transform: scale(1.1) rotate(5deg);
    }

    .statistic-card__icon-ring {
      transform: scale(1.3);
      opacity: 0.6;
    }
  }

  &__bg {
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      transparent 70%
    );
    border-radius: 50%;
    transform: translate(30%, -30%);
    pointer-events: none;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 16px;
  }

  &__icon-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  &__icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9),
      var(--el-color-primary-light-8)
    );
    border-radius: 16px;
    font-size: 32px;
    color: var(--el-color-primary);
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
  }

  &__icon-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    border: 2px dashed var(--el-color-primary);
    border-radius: 20px;
    opacity: 0;
    transition: all 0.4s ease;
  }

  &__data {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: 36px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    position: relative;
    z-index: 1;

    &.is-up {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }

    &.is-down {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }

    &.is-neutral {
      color: var(--el-color-info);
      background: var(--el-color-info-light-9);
    }
  }

  // 主题变体
  &--success {
    .statistic-card__bg {
      background: radial-gradient(
        circle,
        rgba(var(--el-color-success-rgb), 0.1) 0%,
        transparent 70%
      );
    }
    .statistic-card__icon {
      background: linear-gradient(
        135deg,
        var(--el-color-success-light-9),
        var(--el-color-success-light-8)
      );
      color: var(--el-color-success);
    }
    .statistic-card__icon-ring {
      border-color: var(--el-color-success);
    }
  }

  &--warning {
    .statistic-card__bg {
      background: radial-gradient(
        circle,
        rgba(var(--el-color-warning-rgb), 0.1) 0%,
        transparent 70%
      );
    }
    .statistic-card__icon {
      background: linear-gradient(
        135deg,
        var(--el-color-warning-light-9),
        var(--el-color-warning-light-8)
      );
      color: var(--el-color-warning);
    }
    .statistic-card__icon-ring {
      border-color: var(--el-color-warning);
    }
  }

  &--danger {
    .statistic-card__bg {
      background: radial-gradient(
        circle,
        rgba(var(--el-color-danger-rgb), 0.1) 0%,
        transparent 70%
      );
    }
    .statistic-card__icon {
      background: linear-gradient(
        135deg,
        var(--el-color-danger-light-9),
        var(--el-color-danger-light-8)
      );
      color: var(--el-color-danger);
    }
    .statistic-card__icon-ring {
      border-color: var(--el-color-danger);
    }
  }

  &--info {
    .statistic-card__bg {
      background: radial-gradient(
        circle,
        rgba(var(--el-color-info-rgb), 0.1) 0%,
        transparent 70%
      );
    }
    .statistic-card__icon {
      background: linear-gradient(
        135deg,
        var(--el-color-info-light-9),
        var(--el-color-info-light-8)
      );
      color: var(--el-color-info);
    }
    .statistic-card__icon-ring {
      border-color: var(--el-color-info);
    }
  }
}
</style>
