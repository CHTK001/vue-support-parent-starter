<template>
  <div
    class="sc-deco"
    :class="[
      `sc-deco--${type}`,
      `sc-deco--theme-${theme}`,
      {
        'is-animated': animated
      }
    ]"
    :style="decoStyle"
  >
    <!-- 边角装饰 -->
    <template v-if="type === 'corner'">
      <div class="sc-deco__corner sc-deco__corner--tl">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 0 L20 0 L20 2 L2 2 L2 20 L0 20 Z" fill="currentColor" />
        </svg>
      </div>
      <div class="sc-deco__corner sc-deco__corner--tr">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 0 L20 0 L20 20 L18 20 L18 2 L0 2 Z" fill="currentColor" />
        </svg>
      </div>
      <div class="sc-deco__corner sc-deco__corner--bl">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 0 L2 0 L2 18 L20 18 L20 20 L0 20 Z" fill="currentColor" />
        </svg>
      </div>
      <div class="sc-deco__corner sc-deco__corner--br">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 18 L18 18 L18 0 L20 0 L20 20 L0 20 Z" fill="currentColor" />
        </svg>
      </div>
    </template>

    <!-- 扫描线装饰 -->
    <template v-if="type === 'scan'">
      <div class="sc-deco__scan-line" />
    </template>

    <!-- 网格装饰 -->
    <template v-if="type === 'grid'">
      <div class="sc-deco__grid" :style="gridStyle" />
    </template>

    <!-- 发光边框装饰 -->
    <template v-if="type === 'glow-border'">
      <div class="sc-deco__glow-border sc-deco__glow-border--top" />
      <div class="sc-deco__glow-border sc-deco__glow-border--right" />
      <div class="sc-deco__glow-border sc-deco__glow-border--bottom" />
      <div class="sc-deco__glow-border sc-deco__glow-border--left" />
    </template>

    <!-- 数据流装饰 -->
    <template v-if="type === 'data-flow'">
      <div class="sc-deco__data-flow">
        <span v-for="i in dataFlowCount" :key="i" class="sc-deco__data-dot" :style="{ animationDelay: `${i * 0.2}s` }" />
      </div>
    </template>

    <!-- 粒子装饰 -->
    <template v-if="type === 'particle'">
      <div class="sc-deco__particles">
        <span v-for="i in particleCount" :key="i" class="sc-deco__particle" :style="getParticleStyle(i)" />
      </div>
    </template>

    <!-- 脉冲装饰 -->
    <template v-if="type === 'pulse'">
      <div class="sc-deco__pulse" />
    </template>

    <!-- 组合装饰 -->
    <template v-if="type === 'combo'">
      <!-- 边角 -->
      <div class="sc-deco__corner sc-deco__corner--tl">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 0 L20 0 L20 2 L2 2 L2 20 L0 20 Z" fill="currentColor" />
        </svg>
      </div>
      <div class="sc-deco__corner sc-deco__corner--tr">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 0 L20 0 L20 20 L18 20 L18 2 L0 2 Z" fill="currentColor" />
        </svg>
      </div>
      <div class="sc-deco__corner sc-deco__corner--bl">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 0 L2 0 L2 18 L20 18 L20 20 L0 20 Z" fill="currentColor" />
        </svg>
      </div>
      <div class="sc-deco__corner sc-deco__corner--br">
        <svg :width="size" :height="size" viewBox="0 0 20 20">
          <path d="M0 18 L18 18 L18 0 L20 0 L20 20 L0 20 Z" fill="currentColor" />
        </svg>
      </div>

      <!-- 发光边框 -->
      <div class="sc-deco__glow-border sc-deco__glow-border--top" />
      <div class="sc-deco__glow-border sc-deco__glow-border--right" />
      <div class="sc-deco__glow-border sc-deco__glow-border--bottom" />
      <div class="sc-deco__glow-border sc-deco__glow-border--left" />

      <!-- 扫描线 -->
      <div class="sc-deco__scan-line" />

      <!-- 网格 -->
      <div class="sc-deco__grid" :style="gridStyle" />
    </template>

    <!-- 内容插槽 -->
    <div v-if="$slots.default" class="sc-deco__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ScDeco 科技装饰组件
 * 提供各种科技风格的装饰效果
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { computed, PropType } from "vue";

interface Props {
  /** 装饰类型 */
  type?: "corner" | "scan" | "grid" | "glow-border" | "data-flow" | "particle" | "pulse" | "combo";
  /** 主题颜色 */
  theme?: "cyan" | "blue" | "green" | "purple" | "orange" | "red";
  /** 装饰大小 */
  size?: number;
  /** 是否启用动画 */
  animated?: boolean;
  /** 网格大小 */
  gridSize?: number;
  /** 数据流数量 */
  dataFlowCount?: number;
  /** 粒子数量 */
  particleCount?: number;
  /** 自定义颜色 */
  color?: string;
  /** 发光强度 */
  glowIntensity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: "corner",
  theme: "cyan",
  size: 20,
  animated: true,
  gridSize: 20,
  dataFlowCount: 5,
  particleCount: 20,
  color: "",
  glowIntensity: 0.5
});

const themeColors = computed(() => {
  const themes = {
    cyan: {
      primary: "#00f6ff",
      glow: "rgba(0, 246, 255, 0.5)"
    },
    blue: {
      primary: "#1890ff",
      glow: "rgba(24, 144, 255, 0.5)"
    },
    green: {
      primary: "#00ff88",
      glow: "rgba(0, 255, 136, 0.5)"
    },
    purple: {
      primary: "#b37feb",
      glow: "rgba(179, 127, 235, 0.5)"
    },
    orange: {
      primary: "#ff9500",
      glow: "rgba(255, 149, 0, 0.5)"
    },
    red: {
      primary: "#ff4d4f",
      glow: "rgba(255, 77, 79, 0.5)"
    }
  };
  return themes[props.theme];
});

const decoStyle = computed(() => ({
  "--deco-color": props.color || themeColors.value.primary,
  "--deco-glow": themeColors.value.glow,
  "--deco-glow-intensity": props.glowIntensity
}));

const gridStyle = computed(() => ({
  backgroundSize: `${props.gridSize}px ${props.gridSize}px`
}));

const getParticleStyle = (index: number) => {
  const angle = (index / props.particleCount) * 360;
  const distance = 50 + Math.random() * 50;
  const duration = 2 + Math.random() * 3;
  const delay = Math.random() * 2;

  return {
    left: "50%",
    top: "50%",
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    "--particle-angle": `${angle}deg`,
    "--particle-distance": `${distance}px`
  };
};
</script>

<style lang="scss" scoped>
.sc-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  &__content {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: auto;
  }

  &__corner {
    position: absolute;
    color: var(--deco-color);
    z-index: 3;
    transition: all 0.3s ease;

    svg {
      display: block;
      filter: drop-shadow(0 0 3px var(--deco-glow));
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

  &__scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--deco-color), transparent);
    opacity: 0.6;
    z-index: 1;
  }

  &.is-animated &__scan-line {
    animation: scan 3s linear infinite;
  }

  @keyframes scan {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(500px);
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(var(--deco-color) 1px, transparent 1px), linear-gradient(90deg, var(--deco-color) 1px, transparent 1px);
    opacity: 0.1;
    z-index: 0;
  }

  &__glow-border {
    position: absolute;
    background: var(--deco-color);
    opacity: calc(0.3 * var(--deco-glow-intensity));
    z-index: 2;
    transition: opacity 0.3s ease;

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

  &.is-animated &__glow-border {
    animation: borderGlow 2s ease-in-out infinite;
  }

  @keyframes borderGlow {
    0%,
    100% {
      opacity: calc(0.3 * var(--deco-glow-intensity));
      box-shadow: 0 0 5px var(--deco-glow);
    }
    50% {
      opacity: calc(0.8 * var(--deco-glow-intensity));
      box-shadow: 0 0 15px var(--deco-glow);
    }
  }

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
    background: var(--deco-color);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--deco-glow);
  }

  &.is-animated &__data-dot {
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

  &__particles {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  &__particle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: var(--deco-color);
    border-radius: 50%;
    opacity: 0;
  }

  &.is-animated &__particle {
    animation: particleFloat linear infinite;
  }

  @keyframes particleFloat {
    0% {
      transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(var(--particle-distance));
      opacity: 0;
    }
  }

  &__pulse {
    position: absolute;
    inset: -2px;
    border: 2px solid var(--deco-color);
    border-radius: inherit;
    opacity: 0;
    z-index: 1;
  }

  &.is-animated &__pulse {
    animation: pulse 2s ease-out infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.1);
      opacity: 0;
    }
  }

  // 主题变体
  &--theme-cyan {
    --deco-color: #00f6ff;
    --deco-glow: rgba(0, 246, 255, 0.5);
  }

  &--theme-blue {
    --deco-color: #1890ff;
    --deco-glow: rgba(24, 144, 255, 0.5);
  }

  &--theme-green {
    --deco-color: #00ff88;
    --deco-glow: rgba(0, 255, 136, 0.5);
  }

  &--theme-purple {
    --deco-color: #b37feb;
    --deco-glow: rgba(179, 127, 235, 0.5);
  }

  &--theme-orange {
    --deco-color: #ff9500;
    --deco-glow: rgba(255, 149, 0, 0.5);
  }

  &--theme-red {
    --deco-color: #ff4d4f;
    --deco-glow: rgba(255, 77, 79, 0.5);
  }
}
</style>
