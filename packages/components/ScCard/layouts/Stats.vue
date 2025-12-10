<template>
  <div class="sc-card-stats" :class="[`theme--${theme}`, `size--${size}`, { 'is-hoverable': hoverable, 'is-active': active }]">
    <!-- 背景装饰 -->
    <div class="sc-card-stats__background">
      <div class="sc-card-stats__pattern"></div>
    </div>

    <!-- 卡片内容 -->
    <div class="sc-card-stats__content">
      <!-- 图标区域 -->
      <div class="sc-card-stats__icon">
        <slot name="icon">
          <IconifyIconOnline v-if="icon" :icon="icon" />
        </slot>
      </div>

      <!-- 信息区域 -->
      <div class="sc-card-stats__info">
        <!-- 数值 -->
        <div class="sc-card-stats__value" :class="{ counting: counting }">
          <slot name="value">{{ value }}</slot>
        </div>

        <!-- 标签 -->
        <div class="sc-card-stats__label">
          <slot name="label">{{ label }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

/**
 * 统计卡片布局
 * 用于展示统计数据，如总数、在线数、健康数等
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */
export default defineComponent({
  name: "StatsLayout",
  props: {
    /**
     * 图标
     */
    icon: {
      type: String,
      default: ""
    },
    /**
     * 数值
     */
    value: {
      type: [String, Number],
      default: 0
    },
    /**
     * 标签
     */
    label: {
      type: String,
      default: ""
    },
    /**
     * 是否正在计数动画
     */
    counting: {
      type: Boolean,
      default: false
    },
    /**
     * 主题色
     */
    theme: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info" | "blue" | "green" | "purple" | "orange">,
      default: "primary"
    },
    /**
     * 是否可悬停
     */
    hoverable: {
      type: Boolean,
      default: true
    },
    /**
     * 是否激活状态
     */
    active: {
      type: Boolean,
      default: false
    },
    /**
     * 卡片尺寸
     */
    size: {
      type: String as PropType<"small" | "normal" | "large">,
      default: "small"
    }
  }
});
</script>

<style lang="scss" scoped>
.sc-card-stats {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 120px;

  // 主题色定义
  &.theme--default {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .sc-card-stats__icon {
      background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-7) 100%);
      color: var(--el-color-primary);
      box-shadow: 0 4px 12px var(--el-color-primary-light-7);
    }

    .sc-card-stats__value {
      color: var(--el-text-color-primary);
      text-shadow: none;
    }

    .sc-card-stats__label {
      color: var(--el-text-color-secondary);
    }

    &.is-hoverable:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      transform: translateY(-4px);

      .sc-card-stats__icon {
        transform: scale(1.08);
        box-shadow: 0 6px 16px var(--el-color-primary-light-5);
      }
    }
  }

  &.theme--blue {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.25);
  }
  &.theme--green {
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
    box-shadow: 0 4px 20px rgba(5, 150, 105, 0.25);
  }
  &.theme--purple {
    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
  }
  &.theme--orange {
    background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%);
    box-shadow: 0 4px 20px rgba(234, 88, 12, 0.25);
  }
  &.theme--primary {
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
  }
  &.theme--success {
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
  }
  &.theme--warning {
    background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
    box-shadow: 0 4px 20px rgba(217, 119, 6, 0.25);
  }
  &.theme--danger {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.25);
  }
  &.theme--info {
    background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%);
    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.25);
  }

  &.is-hoverable:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);

    .sc-card-stats__icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  &.is-active {
    box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.4),
      0 16px 40px rgba(0, 0, 0, 0.2);
  }

  // 尺寸定义
  &.size--small {
    min-height: 90px;
    border-radius: 14px;

    .sc-card-stats__content {
      padding: 14px 16px;
      gap: 12px;
    }

    .sc-card-stats__icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      font-size: 20px;
    }

    .sc-card-stats__value {
      font-size: 22px;
      margin-bottom: 2px;
    }

    .sc-card-stats__label {
      font-size: 12px;
    }
  }

  &.size--normal {
    min-height: 120px;
  }

  &.size--large {
    min-height: 160px;
    border-radius: 20px;

    .sc-card-stats__content {
      padding: 28px;
      gap: 20px;
    }

    .sc-card-stats__icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      font-size: 32px;
    }

    .sc-card-stats__value {
      font-size: 38px;
      margin-bottom: 4px;
    }

    .sc-card-stats__label {
      font-size: 15px;
    }
  }

  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__pattern {
    position: absolute;
    top: -30%;
    right: -30%;
    width: 80%;
    height: 160%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 60%);
    animation: patternFloat 15s ease-in-out infinite;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 20px;
    gap: 16px;
  }

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    color: #fff;
    flex-shrink: 0;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    margin-bottom: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.5px;

    &.counting {
      animation: countPulse 0.3s ease;
    }
  }

  &__label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    margin-bottom: 6px;
    letter-spacing: 0.2px;
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.15);
    padding: 3px 8px;
    border-radius: 20px;
    backdrop-filter: blur(4px);

    .trend-icon {
      font-size: 12px;
    }

    .trend-text {
      font-weight: 600;
    }
  }
}

@keyframes patternFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-10px, 10px) scale(1.05);
    opacity: 1;
  }
}

@keyframes countPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>
