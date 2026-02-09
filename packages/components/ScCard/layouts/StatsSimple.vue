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
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info">,
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
  background: var(--stitch-lay-bg-panel);
  backdrop-filter: blur(10px);
  border-radius: var(--stitch-lay-radius-lg);
  border: 1px solid var(--stitch-lay-border);
  transition: var(--stitch-lay-transition);
  box-shadow: var(--stitch-lay-shadow-sm);

  &.is-hoverable:hover {
    transform: translateY(-2px);
    box-shadow: var(--stitch-lay-shadow-md);
    border-color: var(--stitch-lay-border-hover);
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
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: inherit;
      opacity: 0.9;
      transition: opacity 0.3s ease;
    }

    &:hover::before {
      opacity: 1;
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: 26px;
    font-weight: 700;
    color: var(--stitch-lay-text-main);
    line-height: 1.2;
  }

  &__label {
    font-size: 13px;
    color: var(--stitch-lay-text-sub);
    margin-top: 4px;
  }

  // 主题变体混合宏
  @mixin theme-variant($type) {
    .sc-card-stats-simple__icon {
      background: linear-gradient(135deg, var(--el-color-#{$type}) 0%, var(--el-color-#{$type}-light-3) 100%);
    }
    .sc-card-stats-simple__value {
      background: linear-gradient(135deg, var(--el-color-#{$type}) 0%, var(--el-color-#{$type}-light-3) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  // 主题色定义
  &.theme--default .sc-card-stats-simple__icon {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  }

  &.theme--primary { @include theme-variant('primary'); }
  &.theme--success { @include theme-variant('success'); }
  &.theme--warning { @include theme-variant('warning'); }
  &.theme--danger { @include theme-variant('danger'); }
  &.theme--info { @include theme-variant('info'); }
}
</style>
