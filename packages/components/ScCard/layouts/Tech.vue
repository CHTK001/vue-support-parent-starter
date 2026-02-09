<template>
  <div
    class="tech-card"
    :class="{
      'is-hoverable': hoverable,
      'is-active': active,
      [`tech-card--${theme}`]: true
    }"
    :style="techStyle"
  >
    <!-- 扫描线动画 -->
    <div class="tech-card__scan-line" />

    <!-- 网格背景 -->
    <div class="tech-card__grid" />

    <!-- 边角装饰 -->
    <div class="tech-card__corner tech-card__corner--tl">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M0 0 L20 0 L20 2 L2 2 L2 20 L0 20 Z" fill="currentColor" />
      </svg>
    </div>
    <div class="tech-card__corner tech-card__corner--tr">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M0 0 L20 0 L20 20 L18 20 L18 2 L0 2 Z" fill="currentColor" />
      </svg>
    </div>
    <div class="tech-card__corner tech-card__corner--bl">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M0 0 L2 0 L2 18 L20 18 L20 20 L0 20 Z" fill="currentColor" />
      </svg>
    </div>
    <div class="tech-card__corner tech-card__corner--br">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M0 18 L18 18 L18 0 L20 0 L20 20 L0 20 Z" fill="currentColor" />
      </svg>
    </div>

    <!-- 发光边框 -->
    <div class="tech-card__glow-border tech-card__glow-border--top" />
    <div class="tech-card__glow-border tech-card__glow-border--right" />
    <div class="tech-card__glow-border tech-card__glow-border--bottom" />
    <div class="tech-card__glow-border tech-card__glow-border--left" />

    <!-- 内容区域 -->
    <div class="tech-card__inner">
      <!-- 头部 -->
      <div v-if="showHeader" class="tech-card__header">
        <slot name="header">
          <div class="tech-card__title">
            <div v-if="icon" class="tech-card__icon">
              <IconifyIconOnline :icon="icon" />
            </div>
            <span class="tech-card__title-text">{{ title }}</span>
            <div class="tech-card__title-line" />
          </div>
          <div class="tech-card__actions">
            <slot name="actions" />
          </div>
        </slot>
      </div>

      <!-- 内容 -->
      <div class="tech-card__content">
        <slot />
      </div>

      <!-- 底部 -->
      <div v-if="$slots.footer" class="tech-card__footer">
        <slot name="footer" />
      </div>
    </div>

    <!-- 数据流动画 -->
    <div v-if="showDataFlow" class="tech-card__data-flow">
      <span v-for="i in 5" :key="i" class="tech-card__data-dot" :style="{ animationDelay: `${i * 0.2}s` }" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";

export default defineComponent({
  name: "TechLayout",
  props: {
    /**
     * 卡片标题
     */
    title: {
      type: String,
      default: ""
    },
    /**
     * 图标
     */
    icon: {
      type: String,
      default: ""
    },
    /**
     * 是否显示头部
     */
    showHeader: {
      type: Boolean,
      default: true
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
     * 边框加粗显示位置
     */
    borderPosition: {
      type: String,
      default: "top",
      validator: (val: string) => ["top", "right", "bottom", "left", "none"].includes(val)
    },
    /**
     * 主题色
     */
    theme: {
      type: String as PropType<"default" | "primary" | "cyan" | "blue" | "green" | "purple" | "orange" | "red">,
      default: "default",
      validator: (val: string) => ["default", "primary", "cyan", "blue", "green", "purple", "orange", "red"].includes(val)
    },
    /**
     * 是否显示数据流动画
     */
    showDataFlow: {
      type: Boolean,
      default: true
    },
    /**
     * 内边距
     */
    padding: {
      type: String,
      default: "20px"
    }
  },
  setup(props) {
    // 主题颜色配置
    const themeColors = computed(() => {
      const themes = {
        default: {
          primary: "var(--el-color-primary)",
          secondary: "var(--el-border-color)",
          glow: "rgba(var(--el-color-primary-rgb), 0.3)",
          bg: "var(--stitch-lay-bg-panel)",
          text: "var(--stitch-lay-text-main)",
          subText: "var(--stitch-lay-text-sub)"
        },
        primary: {
          primary: "var(--stitch-lay-border-hover)",
          secondary: "var(--stitch-lay-border)",
          glow: "var(--stitch-lay-shadow-sm)",
          bg: "var(--stitch-lay-bg-panel)",
          text: "var(--stitch-lay-text-main)",
          subText: "var(--stitch-lay-text-sub)"
        },
        cyan: {
          primary: "#00f6ff",
          secondary: "#00d4ff",
          glow: "rgba(0, 246, 255, 0.5)",
          bg: "rgba(0, 20, 40, 0.8)",
          text: "#fff",
          subText: "rgba(255, 255, 255, 0.9)"
        },
        blue: {
          primary: "#1890ff",
          secondary: "#40a9ff",
          glow: "rgba(24, 144, 255, 0.5)",
          bg: "rgba(4, 49, 128, 0.8)",
          text: "#fff",
          subText: "rgba(255, 255, 255, 0.9)"
        },
        green: {
          primary: "var(--stitch-lay-success)",
          secondary: "var(--stitch-lay-success-light)",
          glow: "var(--stitch-lay-success-light)",
          bg: "rgba(0, 40, 20, 0.8)",
          text: "#fff",
          subText: "rgba(255, 255, 255, 0.9)"
        },
        purple: {
          primary: "#b37feb",
          secondary: "#d3adf7",
          glow: "rgba(179, 127, 235, 0.5)",
          bg: "rgba(40, 0, 60, 0.8)",
          text: "#fff",
          subText: "rgba(255, 255, 255, 0.9)"
        },
        orange: {
          primary: "var(--stitch-lay-warning)",
          secondary: "var(--stitch-lay-warning-light)",
          glow: "var(--stitch-lay-warning-light)",
          bg: "rgba(60, 30, 0, 0.8)",
          text: "#fff",
          subText: "rgba(255, 255, 255, 0.9)"
        },
        red: {
          primary: "var(--stitch-lay-error)",
          secondary: "var(--stitch-lay-error-light)",
          glow: "var(--stitch-lay-error-light)",
          bg: "rgba(60, 0, 0, 0.8)",
          text: "#fff",
          subText: "rgba(255, 255, 255, 0.9)"
        }
      };
      return themes[props.theme] || themes.cyan;
    });

    // 计算样式
    const techStyle = computed(() => ({
      "--tech-primary-color": themeColors.value.primary,
      "--tech-secondary-color": themeColors.value.secondary,
      "--tech-glow-color": themeColors.value.glow,
      "--tech-bg-color": themeColors.value.bg,
      "--tech-text-color": themeColors.value.text,
      "--tech-sub-text-color": themeColors.value.subText,
      "--tech-padding": props.padding
    }));

    return {
      techStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.tech-card {
  position: relative;
  border-radius: 2px;
  background: var(--tech-bg-color);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 网格背景
  &__grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(var(--tech-primary-color) 1px, transparent 1px), linear-gradient(90deg, var(--tech-primary-color) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.05;
    z-index: 0;
  }

  // 扫描线动画
  &__scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--tech-primary-color), transparent);
    animation: scan 3s linear infinite;
    z-index: 1;
    opacity: 0.6;
  }

  @keyframes scan {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(500px);
    }
  }

  // 边角装饰
  &__corner {
    position: absolute;
    width: 20px;
    height: 20px;
    color: var(--tech-primary-color);
    z-index: 3;
    transition: all 0.3s ease;

    svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 3px var(--tech-glow-color));
    }

    &--tl {
      top: 0;
      left: 0;
    }

    &--tr {
      top: 0;
      right: 0;
    }

    &--bl {
      bottom: 0;
      left: 0;
    }

    &--br {
      bottom: 0;
      right: 0;
    }
  }

  // 发光边框
  &__glow-border {
    position: absolute;
    background: var(--tech-primary-color);
    z-index: 2;
    opacity: 0.3;
    transition: all 0.3s ease;

    &--top {
      top: 0;
      left: 20px;
      right: 20px;
      height: 1px;
    }

    &--right {
      top: 20px;
      right: 0;
      bottom: 20px;
      width: 1px;
    }

    &--bottom {
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 1px;
    }

    &--left {
      top: 20px;
      left: 0;
      bottom: 20px;
      width: 1px;
    }
  }

  // 内容区域
  &__inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--tech-padding);
    z-index: 2;
  }

  // 头部
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--tech-primary-color);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 50px;
      height: 2px;
      background: var(--tech-primary-color);
      box-shadow: 0 0 10px var(--tech-glow-color);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    flex: 1;
    position: relative;
  }

  &__icon {
    margin-right: 10px;
    font-size: 20px;
    color: var(--tech-primary-color);
    filter: drop-shadow(0 0 5px var(--tech-glow-color));
  }

  &__title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--tech-text-color);
    text-shadow: 0 0 10px var(--tech-glow-color);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  &__title-line {
    flex: 1;
    height: 1px;
    margin-left: 12px;
    background: linear-gradient(90deg, var(--tech-primary-color), transparent);
    opacity: 0.5;
  }

  &__actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  // 内容
  &__content {
    flex: 1;
    overflow: auto;
    color: var(--tech-sub-text-color);

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--tech-primary-color);
      border-radius: 3px;
      opacity: 0.5;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  // 底部
  &__footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--tech-primary-color);
  }

  // 数据流动画
  &__data-flow {
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    z-index: 2;
  }

  &__data-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--tech-primary-color);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--tech-glow-color);
    animation: dataFlow 2s linear infinite;
  }

  @keyframes dataFlow {
    0% {
      top: -10px;
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0;
    }
  }

  // 悬停效果
  &.is-hoverable:hover {
    transform: translateY(-2px);
    box-shadow:
      0 0 20px var(--tech-glow-color),
      inset 0 0 20px rgba(0, 0, 0, 0.2);

    .tech-card__corner {
      color: var(--tech-secondary-color);
      transform: scale(1.1);
    }

    .tech-card__glow-border {
      opacity: 0.8;
      box-shadow: 0 0 10px var(--tech-glow-color);
    }

    .tech-card__scan-line {
      opacity: 1;
    }
  }

  // 激活状态
  &.is-active {
    box-shadow:
      0 0 30px var(--tech-glow-color),
      inset 0 0 30px rgba(0, 0, 0, 0.3);

    .tech-card__corner {
      color: var(--tech-secondary-color);
      animation: cornerPulse 2s ease-in-out infinite;
    }

    .tech-card__glow-border {
      opacity: 1;
      animation: borderGlow 2s ease-in-out infinite;
    }

    .tech-card__scan-line {
      opacity: 1;
      animation: scan 2s linear infinite;
    }
  }

  @keyframes cornerPulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }

  @keyframes borderGlow {
    0%,
    100% {
      box-shadow: 0 0 5px var(--tech-glow-color);
    }
    50% {
      box-shadow: 0 0 15px var(--tech-glow-color);
    }
  }

  // 主题变体
  &--cyan {
    border: 1px solid rgba(0, 246, 255, 0.3);
  }

  &--blue {
    border: 1px solid rgba(24, 144, 255, 0.3);
  }

  &--green {
    border: 1px solid rgba(0, 255, 136, 0.3);
  }

  &--purple {
    border: 1px solid rgba(179, 127, 235, 0.3);
  }

  &--orange {
    border: 1px solid rgba(255, 149, 0, 0.3);
  }

  &--red {
    border: 1px solid rgba(255, 77, 79, 0.3);
  }
}
</style>
