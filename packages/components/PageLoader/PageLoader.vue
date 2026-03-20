<template>
  <transition name="fade">
    <div v-if="loading" class="page-loader" :class="{ 'page-loader--fullscreen': fullscreen }">
      <div class="page-loader__content">
        <!-- 加载动画 -->
        <div v-if="type === 'spinner'" class="page-loader__spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>

        <!-- 骨架屏 -->
        <div v-else-if="type === 'skeleton'" class="page-loader__skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>

        <!-- 进度条 -->
        <div v-else-if="type === 'progress'" class="page-loader__progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-text">{{ progress }}%</div>
        </div>

        <!-- 脉冲动画 -->
        <div v-else-if="type === 'pulse'" class="page-loader__pulse">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
        </div>

        <!-- 加载文本 -->
        <div v-if="text" class="page-loader__text">{{ text }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  loading?: boolean;
  type?: "spinner" | "skeleton" | "progress" | "pulse";
  fullscreen?: boolean;
  text?: string;
  progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  type: "spinner",
  fullscreen: true,
  text: "",
  progress: 0
});
</script>

<style lang="scss" scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;

  &--fullscreen {
    position: fixed;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    animation: pulse 1.5s ease-in-out infinite;
  }

  // Spinner 样式
  &__spinner {
    position: relative;
    width: 60px;
    height: 60px;

    .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-top-color: var(--primary-color, #409eff);
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

      &:nth-child(1) {
        animation-delay: -0.45s;
      }

      &:nth-child(2) {
        animation-delay: -0.3s;
        opacity: 0.7;
      }

      &:nth-child(3) {
        animation-delay: -0.15s;
        opacity: 0.4;
      }
    }
  }

  // 骨架屏样式
  &__skeleton {
    width: 300px;
    padding: var(--spacing-md);

    .skeleton-header {
      height: 40px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: var(--spacing-md);
    }

    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;

      &.short {
        width: 60%;
      }
    }
  }

  // 进度条样式
  &__progress {
    width: 300px;

    .progress-bar {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: var(--spacing-sm);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color, #409eff), var(--primary-color-light, #66b1ff));
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
  }

  // 脉冲动画样式
  &__pulse {
    display: flex;
    gap: var(--spacing-sm);

    .pulse-dot {
      width: 12px;
      height: 12px;
      background: var(--primary-color, #409eff);
      border-radius: 50%;
      animation: pulse-scale 1.4s ease-in-out infinite;

      &:nth-child(1) {
        animation-delay: 0s;
      }

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

// 暗黑模式
[data-theme="dark"] {
  .page-loader {
    background: rgba(26, 26, 26, 0.9);

    &__skeleton {
      .skeleton-header,
      .skeleton-line {
        background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        background-size: 200% 100%;
      }
    }

    &__progress {
      .progress-bar {
        background: #2a2a2a;
      }
    }
  }
}

// 动画
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes pulse-scale {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
