<template>
  <!-- Tech 主题模式 -->
  <header
    v-if="theme === 'tech'"
    class="sc-header sc-header--tech"
    :class="[
      `sc-header--theme-${techTheme}`,
      {
        'is-fixed': fixed,
        'is-transparent': transparent
      }
    ]"
    :style="headerStyle"
  >
    <!-- 背景装饰 -->
    <div class="sc-header__bg">
      <div class="sc-header__grid" />
      <div class="sc-header__scan-line" />
    </div>

    <!-- 内容区域 -->
    <div class="sc-header__content">
      <!-- 左侧内容 -->
      <div class="sc-header__left">
        <slot name="left">
          <!-- Logo -->
          <div v-if="logo || $slots.logo" class="sc-header__logo">
            <slot name="logo">
              <img v-if="logo" :src="logo" :alt="title" class="sc-header__logo-img" />
            </slot>
          </div>

          <!-- 标题 -->
          <div v-if="title" class="sc-header__title">
            <IconifyIconOnline v-if="icon" :icon="icon" class="sc-header__icon" />
            <span class="sc-header__title-text">{{ title }}</span>
          </div>
        </slot>
      </div>

      <!-- 中间内容 -->
      <div v-if="$slots.center" class="sc-header__center">
        <slot name="center" />
      </div>

      <!-- 右侧内容 -->
      <div class="sc-header__right">
        <slot name="right" />
      </div>

      <!-- 默认内容 -->
      <div v-if="$slots.default" class="sc-header__main">
        <slot />
      </div>
    </div>

    <!-- Tech 装饰元素 -->
    <span class="sc-header__tech-corner sc-header__tech-corner--tl" />
    <span class="sc-header__tech-corner sc-header__tech-corner--tr" />
    <span class="sc-header__tech-line sc-header__tech-line--bottom" />

    <!-- 数据流装饰 -->
    <div v-if="showDataFlow" class="sc-header__data-flow">
      <span v-for="i in 3" :key="i" class="sc-header__data-dot" :style="{ animationDelay: `${i * 0.3}s` }" />
    </div>
  </header>

  <!-- Element Plus 原生模式 -->
  <el-header v-else :height="height">
    <slot />
  </el-header>
</template>

<script setup lang="ts">
/**
 * ScHeader 头部组件
 * 封装 el-header 并支持 tech 主题
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { computed } from "vue";
import { ElHeader } from "element-plus";

interface Props {
  /** 头部高度 */
  height?: string;
  /** 主题风格 */
  theme?: "default" | "tech";
  /** Tech 主题颜色 */
  techTheme?: "cyan" | "blue" | "green" | "purple" | "orange" | "red";
  /** Logo 图片地址 */
  logo?: string;
  /** 标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** 是否固定 */
  fixed?: boolean;
  /** 是否透明 */
  transparent?: boolean;
  /** 是否显示数据流 */
  showDataFlow?: boolean;
  /** 背景模糊 */
  blur?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "60px",
  theme: "default",
  techTheme: "cyan",
  logo: "",
  title: "",
  icon: "",
  fixed: false,
  transparent: false,
  showDataFlow: true,
  blur: true
});

const themeColors = computed(() => {
  const themes = {
    cyan: {
      primary: "#00f6ff",
      secondary: "#00d4ff",
      glow: "rgba(0, 246, 255, 0.5)",
      bg: "rgba(0, 20, 40, 0.9)"
    },
    blue: {
      primary: "#1890ff",
      secondary: "#40a9ff",
      glow: "rgba(24, 144, 255, 0.5)",
      bg: "rgba(4, 49, 128, 0.9)"
    },
    green: {
      primary: "#00ff88",
      secondary: "#00cc6a",
      glow: "rgba(0, 255, 136, 0.5)",
      bg: "rgba(0, 40, 20, 0.9)"
    },
    purple: {
      primary: "#b37feb",
      secondary: "#d3adf7",
      glow: "rgba(179, 127, 235, 0.5)",
      bg: "rgba(40, 0, 60, 0.9)"
    },
    orange: {
      primary: "#ff9500",
      secondary: "#ffb340",
      glow: "rgba(255, 149, 0, 0.5)",
      bg: "rgba(60, 30, 0, 0.9)"
    },
    red: {
      primary: "#ff4d4f",
      secondary: "#ff7875",
      glow: "rgba(255, 77, 79, 0.5)",
      bg: "rgba(60, 0, 0, 0.9)"
    }
  };
  return themes[props.techTheme];
});

const headerStyle = computed(() => ({
  height: props.height,
  "--header-primary-color": themeColors.value.primary,
  "--header-secondary-color": themeColors.value.secondary,
  "--header-glow-color": themeColors.value.glow,
  "--header-bg-color": props.transparent ? "transparent" : themeColors.value.bg
}));
</script>

<style lang="scss" scoped>
.sc-header {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  transition: all 0.3s ease;

  &--tech {
    background: var(--header-bg-color);
    border-bottom: 1px solid var(--header-primary-color);
    box-shadow: 0 2px 20px var(--header-glow-color);
    overflow: hidden;

    &.is-fixed {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    &.is-transparent {
      background: transparent;
      backdrop-filter: blur(10px);
    }
  }

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(var(--header-primary-color) 1px, transparent 1px), linear-gradient(90deg, var(--header-primary-color) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.05;
  }

  &__scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--header-primary-color), transparent);
    animation: headerScan 4s linear infinite;
    opacity: 0.6;
  }

  @keyframes headerScan {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  &__content {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 24px;
    z-index: 1;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__main {
    flex: 1;
  }

  &__logo {
    display: flex;
    align-items: center;
  }

  &__logo-img {
    height: 40px;
    width: auto;
    filter: drop-shadow(0 0 10px var(--header-glow-color));
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__icon {
    font-size: 24px;
    color: var(--header-primary-color);
    filter: drop-shadow(0 0 5px var(--header-glow-color));
  }

  &__title-text {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 0 15px var(--header-glow-color);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  &__tech-corner {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid var(--header-primary-color);
    z-index: 2;
    transition: all 0.3s ease;

    &--tl {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    &--tr {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }
  }

  &__tech-line {
    position: absolute;
    background: linear-gradient(90deg, transparent, var(--header-primary-color), transparent);
    opacity: 0.5;
    z-index: 2;

    &--bottom {
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 2px;
      animation: linePulse 2s ease-in-out infinite;
    }
  }

  @keyframes linePulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.8;
    }
  }

  &__data-flow {
    position: absolute;
    top: 0;
    right: 20px;
    width: 2px;
    height: 100%;
    z-index: 2;
  }

  &__data-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--header-primary-color);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--header-glow-color);
    animation: headerDataFlow 3s linear infinite;
  }

  @keyframes headerDataFlow {
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

  // 主题变体
  &--theme-cyan {
    --header-primary-color: #00f6ff;
    --header-secondary-color: #00d4ff;
    --header-glow-color: rgba(0, 246, 255, 0.5);
    --header-bg-color: rgba(0, 20, 40, 0.9);
  }

  &--theme-blue {
    --header-primary-color: #1890ff;
    --header-secondary-color: #40a9ff;
    --header-glow-color: rgba(24, 144, 255, 0.5);
    --header-bg-color: rgba(4, 49, 128, 0.9);
  }

  &--theme-green {
    --header-primary-color: #00ff88;
    --header-secondary-color: #00cc6a;
    --header-glow-color: rgba(0, 255, 136, 0.5);
    --header-bg-color: rgba(0, 40, 20, 0.9);
  }

  &--theme-purple {
    --header-primary-color: #b37feb;
    --header-secondary-color: #d3adf7;
    --header-glow-color: rgba(179, 127, 235, 0.5);
    --header-bg-color: rgba(40, 0, 60, 0.9);
  }

  &--theme-orange {
    --header-primary-color: #ff9500;
    --header-secondary-color: #ffb340;
    --header-glow-color: rgba(255, 149, 0, 0.5);
    --header-bg-color: rgba(60, 30, 0, 0.9);
  }

  &--theme-red {
    --header-primary-color: #ff4d4f;
    --header-secondary-color: #ff7875;
    --header-glow-color: rgba(255, 77, 79, 0.5);
    --header-bg-color: rgba(60, 0, 0, 0.9);
  }
}
</style>
