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

        <!-- 趋势/描述 -->
        <div v-if="$slots.trend || trendIcon || trendText" class="sc-card-stats__trend">
          <slot name="trend">
            <IconifyIconOnline v-if="trendIcon" :icon="trendIcon" class="trend-icon" />
            <span v-if="trendText" class="trend-text">{{ trendText }}</span>
          </slot>
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
      default: ""
    },
    /**
     * 标签
     */
    label: {
      type: String,
      default: ""
    },
    /**
     * 趋势图标
     */
    trendIcon: {
      type: String,
      default: ""
    },
    /**
     * 趋势文本
     */
    trendText: {
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
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 140px;

  // 主题色定义
  &.theme--default {
    background: linear-gradient(135deg, var(--el-bg-color-overlay, #fff) 0%, var(--el-fill-color-light, #f5f7fa) 100%);
    border: 1px solid var(--el-border-color-light, #e4e7ed);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

    .sc-card-stats__icon {
      background: linear-gradient(135deg, var(--el-color-primary-light-7, #d9ecff) 0%, var(--el-color-primary-light-5, #a0cfff) 100%);
      color: var(--el-color-primary, #409eff);
    }

    .sc-card-stats__value {
      color: var(--el-text-color-primary, #303133);
      text-shadow: none;
    }

    .sc-card-stats__label {
      color: var(--el-text-color-secondary, #909399);
    }

    .sc-card-stats__trend {
      color: var(--el-text-color-regular, #606266);
    }

    &.is-hoverable:hover {
      border-color: var(--el-color-primary-light-5, #a0cfff);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      transform: translateY(-6px) scale(1.01);
    }
  }

  &.theme--blue {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  }
  &.theme--green {
    background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
  }
  &.theme--purple {
    background: linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%);
  }
  &.theme--orange {
    background: linear-gradient(135deg, #c2410c 0%, #f97316 100%);
  }
  &.theme--primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  &.theme--success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
  &.theme--warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  &.theme--danger {
    background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
  }
  &.theme--info {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.is-hoverable:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  &.is-active {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
  }

  // 尺寸定义
  &.size--small {
    min-height: 100px;
    border-radius: 16px;

    .sc-card-stats__content {
      padding: 16px;
      gap: 14px;
    }

    .sc-card-stats__icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      font-size: 22px;
    }

    .sc-card-stats__value {
      font-size: 24px;
      margin-bottom: 2px;
    }

    .sc-card-stats__label {
      font-size: 12px;
      margin-bottom: 4px;
    }

    .sc-card-stats__trend {
      font-size: 11px;

      .trend-icon {
        font-size: 12px;
      }
    }
  }

  &.size--normal {
    min-height: 140px;
  }

  &.size--large {
    min-height: 180px;
    border-radius: 24px;

    .sc-card-stats__content {
      padding: 32px;
      gap: 24px;
    }

    .sc-card-stats__icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      font-size: 36px;
    }

    .sc-card-stats__value {
      font-size: 42px;
      margin-bottom: 6px;
    }

    .sc-card-stats__label {
      font-size: 16px;
      margin-bottom: 10px;
    }

    .sc-card-stats__trend {
      font-size: 14px;

      .trend-icon {
        font-size: 16px;
      }
    }
  }

  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  &__pattern {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: patternRotate 20s linear infinite;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 24px;
    gap: 20px;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #fff;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .sc-card-stats:hover & {
      transform: scale(1.1) rotate(5deg);
      background: rgba(255, 255, 255, 0.3);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &.counting {
      animation: countPulse 0.3s ease;
    }
  }

  &__label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
    margin-bottom: 8px;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.75);

    .trend-icon {
      font-size: 14px;
    }

    .trend-text {
      font-weight: 500;
    }
  }
}

@keyframes patternRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
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
