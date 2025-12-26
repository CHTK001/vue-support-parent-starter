<template>
  <div class="sc-card-stats-simple" :class="[`theme--${theme}`, { 'is-hoverable': hoverable }]">
    <!-- 图标区域 -->
    <div class="sc-card-stats-simple__icon">
      <slot name="icon">
        <IconifyIconOnline v-if="icon" :icon="icon" />
      </slot>
    </div>

    <!-- 信息区域 -->
    <div class="sc-card-stats-simple__info">
      <!-- 数值 -->
      <div class="sc-card-stats-simple__value">
        <slot name="value">{{ value }}</slot>
      </div>

      <!-- 标签 -->
      <div class="sc-card-stats-simple__label">
        <slot name="label">{{ label }}</slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

/**
 * 简洁统计卡片布局
 * 用于展示统计数据，简洁风格带渐变图标
 * @author CH
 * @version 1.0.0
 * @since 2025-12-23
 */
export default defineComponent({
  name: "StatsSimpleLayout",
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
     * 主题色
     */
    theme: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info" | "blue" | "green" | "purple" | "orange" | "pink" | "cyan">,
      default: "primary"
    },
    /**
     * 是否可悬停
     */
    hoverable: {
      type: Boolean,
      default: true
    }
  }
});
</script>

<style lang="scss" scoped>
.sc-card-stats-simple {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;

  &.is-hoverable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #fff;
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: 26px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  // 主题色定义
  &.theme--default .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  }

  &.theme--primary .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.theme--blue .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  }

  &.theme--success .sc-card-stats-simple__icon,
  &.theme--green .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  }

  &.theme--warning .sc-card-stats-simple__icon,
  &.theme--orange .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  }

  &.theme--danger .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  }

  &.theme--info .sc-card-stats-simple__icon,
  &.theme--cyan .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  }

  &.theme--purple .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  }

  &.theme--pink .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
  }
}
</style>
