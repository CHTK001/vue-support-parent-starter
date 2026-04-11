<template>
  <div
    class="sc-card-stats-simple"
    :class="[
      `theme--${theme}`,
      { 'is-hoverable': hoverable, 'is-active': active },
    ]"
  >
    <!-- 背景装饰层 -->
    <div class="sc-card-stats-simple__bg"></div>

    <!-- 图标区域 -->
    <div class="sc-card-stats-simple__icon">
      <slot name="icon">
        <IconifyIconOnline v-if="icon" :icon="icon" />
      </slot>
      <!-- 图标光效点 -->
      <div class="sc-card-stats-simple__icon-dot"></div>
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

    <!-- 右侧装饰线 -->
    <div class="sc-card-stats-simple__decorator"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

/**
 * 现代极简统计卡片 - 2025全新设计版
 * 玻璃拟物+轻量扁平化，适配Element Plus生态
 * @author CH
 * @version 2.0.0
 * @since 2025-12-23
 */
export default defineComponent({
  name: "StatsSimpleLayout",
  props: {
    icon: {
      type: String,
      default: "",
    },
    value: {
      type: [String, Number],
      default: 0,
    },
    label: {
      type: String,
      default: "",
    },
    theme: {
      type: String as PropType<
        "default" | "primary" | "success" | "warning" | "danger" | "info"
      >,
      default: "primary",
    },
    hoverable: {
      type: Boolean,
      default: true,
    },
    // 新增：激活状态（选中高亮）
    active: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
// 引入Element Plus变量（全局引入可注释）
// @use 'element-plus/theme-chalk/src/common/var.scss' as *;

// 全局样式变量（统一控制）
$card-radius: 20px;
$card-padding: 20px 24px;
$icon-size: 44px;
$transition-base: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

.sc-card-stats-simple {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: $card-padding;
  border-radius: $card-radius;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  // 核心：现代玻璃拟物效果
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  // 极简边框（低饱和度）
  border: 1px solid rgba(230, 230, 230, 0.6);
  // 轻量阴影（分层感）
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.02),
    0 8px 16px rgba(0, 0, 0, 0.03);
  transition: $transition-base;
  // 卡片间距
  margin: 0 6px;
  flex: 1; // 自适应宽度（多卡片均分）
  min-width: 180px; // 最小宽度限制

  // 激活状态（选中）
  &.is-active {
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow:
      0 4px 12px rgba(var(--el-color-primary-rgb), 0.08),
      0 8px 24px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  // 悬停效果
  &.is-hoverable:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.06),
      0 10px 30px rgba(0, 0, 0, 0.04);
    border-color: rgba(var(--el-color-primary-rgb), 0.2);
  }

  // 背景渐变装饰（低饱和度）
  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(248, 249, 250, 0.8) 100%
    );
    z-index: 0;
    opacity: 0.7;
  }

  // 图标区域（核心视觉）
  &__icon {
    width: $icon-size;
    height: $icon-size;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    transition: $transition-base;
    // 图标轻量阴影
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    &:hover {
      transform: scale(1.08) rotate(1deg);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    // 图标高光点（增加精致感）
    &-dot {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.7);
      z-index: 1;
    }

    // 确保图标层级
    :deep(*) {
      position: relative;
      z-index: 2;
    }
  }

  // 信息区域
  &__info {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  // 数值样式（极简醒目）
  &__value {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.4px;
    color: #1a1a1a;
    // 数值呼吸效果（可选）
    transition: color 0.3s ease;
  }

  // 标签样式（轻量）
  &__label {
    font-size: 13px;
    color: #666;
    font-weight: 400;
    letter-spacing: 0.1px;
    margin-top: 3px;
    opacity: 0.9;
  }

  // 右侧装饰线（增加层次感）
  &__decorator {
    width: 2px;
    height: 40px;
    border-radius: 1px;
    opacity: 0.15;
    transition: opacity 0.3s ease;
    background: currentColor;
  }

  // 主题变体（现代渐变+低饱和度）
  @mixin theme-variant($type) {
    .sc-card-stats-simple__icon {
      background: linear-gradient(
        135deg,
        var(--el-color-#{$type}) 0%,
        var(--el-color-#{$type}-light-5) 100%
      );
      color: #fff;
    }
    .sc-card-stats-simple__value {
      color: var(--el-color-#{$type}-dark-2);
    }
    .sc-card-stats-simple__decorator {
      color: var(--el-color-#{$type});
    }
    &:hover .sc-card-stats-simple__decorator {
      opacity: 0.3;
    }
  }

  // 主题色定义
  &.theme--default {
    @include theme-variant("primary");
    .sc-card-stats-simple__value {
      color: #1a1a1a;
    }
  }
  &.theme--primary {
    @include theme-variant("primary");
  }
  &.theme--success {
    @include theme-variant("success");
  }
  &.theme--warning {
    @include theme-variant("warning");
  }
  &.theme--danger {
    @include theme-variant("danger");
  }
  &.theme--info {
    @include theme-variant("info");
  }

  // 响应式适配
  @media (max-width: 768px) {
    padding: 16px 20px;
    gap: 12px;
    min-width: 140px;

    .sc-card-stats-simple__icon {
      width: 38px;
      height: 38px;
      font-size: 20px;
    }

    .sc-card-stats-simple__value {
      font-size: 22px;
    }
  }
}
</style>
