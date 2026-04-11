<template>
  <div
    class="sc-card-stats"
    :class="[
      `theme--${theme}`,
      `size--${size}`,
      { 'is-hoverable': hoverable, 'is-active': active },
    ]"
  >
    <!-- 背景装饰 -->
    <div class="sc-card-stats__background">
      <div class="sc-card-stats__pattern"></div>
      <div class="sc-card-stats__glow"></div>
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
    <!-- 底部高亮边框 -->
    <div class="sc-card-stats__border-highlight"></div>
    <!-- 内层装饰边框 -->
    <div class="sc-card-stats__inner-border"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

/**
 * 统计卡片布局 - Element Plus变量适配+强化边框版
 * 用于展示统计数据，如总数、在线数、健康数等
 * @author CH
 * @version 2.3.0
 * @since 2025-12-01
 */
export default defineComponent({
  name: "StatsLayout",
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
    counting: {
      type: Boolean,
      default: false,
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
    active: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String as PropType<"small" | "normal" | "large">,
      default: "small",
    },
  },
});
</script>

<style lang="scss" scoped>
// 引入Element Plus变量（如果项目未全局引入，需手动引入）
// @use 'element-plus/theme-chalk/src/common/var.scss' as *;

.sc-card-stats {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 120px;
  // 核心：强化双层边框 + 高辨识度阴影
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  // 主边框：加粗+高对比度，确保辨识度
  border: 2px solid var(--el-border-color-lighter);
  backdrop-filter: blur(12px);
  transform: translateZ(0);
  will-change: transform, box-shadow;
  // 卡片间距
  margin: 0 4px;

  // 基础主题 - 完全适配Element Plus变量
  &.theme--default {
    // 使用Element Plus默认背景变量
    background: var(--el-bg-color-page);
    // 基础主题边框：用Element Plus边框变量，加粗+高对比度
    border-color: var(--el-border-color);
    // 基础主题阴影：适配Element Plus中性色
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.06),
      0 8px 20px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 var(--el-fill-color-light);

    .sc-card-stats__icon {
      background: var(--el-bg-color);
      color: var(--el-text-color-primary);
      border: 1px solid var(--el-border-color-lighter);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .sc-card-stats__value {
      color: var(--el-text-color-primary);
      text-shadow: none;
    }

    .sc-card-stats__label {
      color: var(--el-text-color-regular);
    }

    // 底部高亮条 - 适配Element Plus主色
    .sc-card-stats__border-highlight {
      background: var(--el-color-primary);
    }

    // 内层装饰边框
    .sc-card-stats__inner-border {
      border-color: var(--el-border-color-lighter);
    }

    &.is-hoverable:hover {
      border-color: var(--el-color-primary-light-7);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.1),
        0 12px 28px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 var(--el-fill-color);
      transform: translateY(-4px);

      .sc-card-stats__icon {
        transform: scale(1.08);
        border-color: var(--el-color-primary-light-8);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }
    }
  }

  // 彩色主题 - 完全基于Element Plus变量构建
  @mixin theme-variant($type) {
    // 渐变背景：使用Element Plus官方色值变量
    background: linear-gradient(
      135deg,
      var(--el-color-#{$type}) 0%,
      var(--el-color-#{$type}-light-3) 50%,
      var(--el-color-#{$type}-light-5) 100%
    );
    // 彩色主题边框：主题色+高透明度，确保边框明显
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow:
      0 4px 16px rgba(var(--el-color-#{$type}-rgb), 0.2),
      0 12px 32px rgba(var(--el-color-#{$type}-rgb), 0.1);

    // 底部高亮条 - 纯主题色，强化区分
    .sc-card-stats__border-highlight {
      background: var(--el-color-#{$type}-dark-2);
    }

    // 内层装饰边框
    .sc-card-stats__inner-border {
      border-color: rgba(255, 255, 255, 0.25);
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

  // 悬停效果 - 边框进一步强化
  &.is-hoverable:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.15),
      0 20px 48px rgba(0, 0, 0, 0.1);
    // 悬停时边框提亮+加粗（视觉上更明显）
    border-color: rgba(255, 255, 255, 0.6);
    border-width: 2.5px;

    .sc-card-stats__icon {
      transform: scale(1.15) rotate(6deg);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .sc-card-stats__pattern {
      animation-duration: 8s;
    }
    .sc-card-stats__glow {
      opacity: 0.6;
    }

    // 悬停时底部高亮条加宽
    .sc-card-stats__border-highlight {
      height: 8px;
      opacity: 1;
    }
  }

  // 激活状态 - 边框极致强化
  &.is-active {
    box-shadow:
      0 0 0 4px rgba(255, 255, 255, 0.5),
      0 8px 24px rgba(0, 0, 0, 0.18),
      0 20px 44px rgba(0, 0, 0, 0.15);
    // 激活状态边框：更粗+更高对比度
    border-color: rgba(255, 255, 255, 0.8);
    border-width: 3px;

    // 激活状态底部高亮条更醒目
    .sc-card-stats__border-highlight {
      height: 10px;
      opacity: 1;
    }
  }

  // 尺寸优化
  &.size--small {
    min-height: 90px;
    border-radius: 16px;

    .sc-card-stats__content {
      padding: 16px 18px;
      gap: 14px;
    }
    .sc-card-stats__icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      font-size: 20px;
    }
    .sc-card-stats__value {
      font-size: 24px;
      margin-bottom: 4px;
    }
    .sc-card-stats__label {
      font-size: 13px;
    }
    // 小尺寸底部高亮条适配
    .sc-card-stats__border-highlight {
      height: 6px;
      border-radius: 0 0 14px 14px;
    }
    // 小尺寸内层边框
    .sc-card-stats__inner-border {
      border-width: 1px;
    }
  }

  &.size--normal {
    min-height: 120px;
    .sc-card-stats__border-highlight {
      height: 7px;
      border-radius: 0 0 16px 16px;
    }
  }

  &.size--large {
    min-height: 160px;
    border-radius: 22px;

    .sc-card-stats__content {
      padding: 30px;
      gap: 22px;
    }
    .sc-card-stats__icon {
      width: 66px;
      height: 66px;
      border-radius: 18px;
      font-size: 32px;
    }
    .sc-card-stats__value {
      font-size: 40px;
      margin-bottom: 6px;
    }
    .sc-card-stats__label {
      font-size: 15px;
    }
    .sc-card-stats__border-highlight {
      height: 9px;
      border-radius: 0 0 20px 20px;
    }
  }

  // 背景层
  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    pointer-events: none;
  }

  // 动态纹理
  &__pattern {
    position: absolute;
    top: -30%;
    right: -30%;
    width: 80%;
    height: 160%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 60%
    );
    animation: patternFloat 14s ease-in-out infinite;
  }

  // 环境光效
  &__glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150%;
    height: 150%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    opacity: 0.3;
    transition: opacity 0.4s ease;
  }

  // 底部高亮边框（核心区分元素）
  &__border-highlight {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 7px;
    opacity: 0.9;
    transition: all 0.3s ease;
    z-index: 2;
  }

  // 新增：内层装饰边框（双层边框效果，辨识度拉满）
  &__inner-border {
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border: 1px solid transparent;
    border-radius: 16px;
    pointer-events: none;
    z-index: 1;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 22px;
    gap: 18px;
  }

  // 图标 - 强化边框质感
  &__icon {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    color: #fff;
    flex-shrink: 0;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    // 图标也加边框，保持风格统一
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.4) 0%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    &:hover::before {
      opacity: 1;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  // 数值 - 强化质感
  &__value {
    font-size: 30px;
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    letter-spacing: -0.5px;
    transition: all 0.3s ease;

    &.counting {
      animation: countPulse 0.4s ease;
    }
  }

  &__label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.95);
    font-weight: 600;
    margin-bottom: 6px;
    letter-spacing: 0.3px;
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 10px;
    border-radius: 20px;
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.15);

    .trend-icon {
      font-size: 12px;
    }
    .trend-text {
      font-weight: 600;
    }
  }
}

// 动画优化
@keyframes patternFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-12px, 12px) scale(1.08);
    opacity: 1;
  }
}

@keyframes countPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
</style>
