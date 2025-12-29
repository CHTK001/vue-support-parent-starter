<template>
  <!-- Scifi 主题模式 (TechUI Scifi 风格) -->
  <button
    v-if="theme === 'scifi'"
    class="sc-button sc-button--scifi-mode"
    :class="[
      `sc-button--${type}`,
      `sc-button--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle,
        'is-text': text,
        'is-link': link,
        'no-animation': disableAnimation
      }
    ]"
    :disabled="disabled || loading"
    :type="nativeType"
    :autofocus="autofocus"
    @click="handleClick"
  >
    <!-- SVG 边框 -->
    <svg class="sc-button__scifi-border" preserveAspectRatio="none">
      <defs>
        <linearGradient id="scifi-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00f6ff;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#0080ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00f6ff;stop-opacity:1" />
        </linearGradient>
        <filter id="scifi-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect class="scifi-rect" x="1" y="1" rx="2" ry="2" fill="none" stroke="url(#scifi-gradient)" stroke-width="1.5" filter="url(#scifi-glow)" />
      <!-- 角标装饰 -->
      <path class="scifi-corner scifi-corner--tl" d="M1,12 L1,1 L12,1" fill="none" stroke="#00f6ff" stroke-width="2" />
      <path class="scifi-corner scifi-corner--tr" fill="none" stroke="#00f6ff" stroke-width="2" />
      <path class="scifi-corner scifi-corner--bl" fill="none" stroke="#00f6ff" stroke-width="2" />
      <path class="scifi-corner scifi-corner--br" fill="none" stroke="#00f6ff" stroke-width="2" />
    </svg>
    
    <!-- 扫描线效果 -->
    <span class="sc-button__scifi-scanline" />
    
    <!-- 加载图标 -->
    <IconifyIconOnline v-if="loading" icon="eos-icons:loading" class="sc-button__loading-icon" />

    <!-- 前置图标 -->
    <IconifyIconOnline v-if="icon && !loading" :icon="icon" class="sc-button__icon" />

    <!-- 按钮内容 -->
    <span v-if="$slots.default" class="sc-button__text">
      <slot />
    </span>

    <!-- 后置图标 -->
    <IconifyIconOnline v-if="suffixIcon && !loading" :icon="suffixIcon" class="sc-button__suffix-icon" />

    <!-- 发光层 -->
    <span class="sc-button__scifi-glow" />
  </button>

  <!-- Tech 主题模式 -->
  <button
    v-else-if="theme === 'tech'"
    class="sc-button sc-button--tech-mode"
    :class="[
      `sc-button--${type}`,
      `sc-button--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle,
        'is-text': text,
        'is-link': link,
        'no-animation': disableAnimation
      }
    ]"
    :disabled="disabled || loading"
    :type="nativeType"
    :autofocus="autofocus"
    @click="handleClick"
  >
    <!-- 加载图标 -->
    <IconifyIconOnline v-if="loading" icon="eos-icons:loading" class="sc-button__loading-icon" />

    <!-- 前置图标 -->
    <IconifyIconOnline v-if="icon && !loading" :icon="icon" class="sc-button__icon" />

    <!-- 按钮内容 -->
    <span v-if="$slots.default" class="sc-button__text">
      <slot />
    </span>

    <!-- 后置图标 -->
    <IconifyIconOnline v-if="suffixIcon && !loading" :icon="suffixIcon" class="sc-button__suffix-icon" />

    <!-- Tech 主题装饰效果 -->
    <span class="sc-button__tech-corner sc-button__tech-corner--tl" />
    <span class="sc-button__tech-corner sc-button__tech-corner--tr" />
    <span class="sc-button__tech-corner sc-button__tech-corner--bl" />
    <span class="sc-button__tech-corner sc-button__tech-corner--br" />
    <span class="sc-button__tech-glow" />
  </button>

  <!-- Element Plus 原生模式 -->
  <el-button
    v-else
    :size="size"
    :type="type"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :round="round"
    :circle="circle"
    :loading="loading"
    :loading-icon="loadingIcon"
    :disabled="disabled"
    :icon="icon"
    :autofocus="autofocus"
    :native-type="nativeType"
    :auto-insert-space="autoInsertSpace"
    :color="color"
    :dark="dark"
    :tag="tag"
    @click="handleClick"
  >
    <slot />
  </el-button>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ElButton } from "element-plus";

export default defineComponent({
  name: "ScButton",
  components: {
    ElButton
  },
  props: {
    /**
     * 按钮类型
     */
    type: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info">,
      default: "default"
    },
    /**
     * 按钮尺寸
     */
    size: {
      type: String as PropType<"large" | "default" | "small">,
      default: "default"
    },
    /**
     * 主题风格
     * - default: Element Plus 原生风格
     * - tech: 科技风格
     * - scifi: 科幻风格 (TechUI Scifi 风格)
     */
    theme: {
      type: String as PropType<"default" | "tech" | "scifi">,
      default: "default"
    },
    /**
     * 是否禁用
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * 是否加载中
     */
    loading: {
      type: Boolean,
      default: false
    },
    /**
     * 是否朴素按钮
     */
    plain: {
      type: Boolean,
      default: false
    },
    /**
     * 是否圆角按钮
     */
    round: {
      type: Boolean,
      default: false
    },
    /**
     * 是否圆形按钮
     */
    circle: {
      type: Boolean,
      default: false
    },
    /**
     * 是否文字按钮
     */
    text: {
      type: Boolean,
      default: false
    },
    /**
     * 是否链接按钮
     */
    link: {
      type: Boolean,
      default: false
    },
    /**
     * 图标
     */
    icon: {
      type: String,
      default: ""
    },
    /**
     * 后置图标
     */
    suffixIcon: {
      type: String,
      default: ""
    },
    /**
     * 原生 type 属性
     */
    nativeType: {
      type: String as PropType<"button" | "submit" | "reset">,
      default: "button"
    },
    /**
     * 自动聚焦
     */
    autofocus: {
      type: Boolean,
      default: false
    },
    /**
     * 自定义按钮颜色
     */
    color: {
      type: String,
      default: ""
    },
    /**
     * 暗黑模式
     */
    dark: {
      type: Boolean,
      default: false
    },
    /**
     * 自动在中文字符间插入空格
     */
    autoInsertSpace: {
      type: Boolean,
      default: undefined
    },
    /**
     * 自定义元素标签
     */
    tag: {
      type: String as PropType<keyof HTMLElementTagNameMap>,
      default: "button"
    },
    /**
     * 加载图标
     */
    loadingIcon: {
      type: String,
      default: ""
    },
    /**
     * 是否显示背景色
     */
    bg: {
      type: Boolean,
      default: false
    },
    /**
     * 是否禁用动画效果（提升性能）
     * 适用于大量按钮场景或低端设备
     */
    disableAnimation: {
      type: Boolean,
      default: false
    }
  },
  emits: ["click"],
  setup(props, { emit }) {
    const handleClick = (event: MouseEvent) => {
      if (!props.disabled && !props.loading) {
        emit("click", event);
      }
    };

    return {
      handleClick
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: var(--el-button-bg-color, var(--el-fill-color-blank));
  border: 1px solid var(--el-button-border-color, var(--el-border-color));
  border-radius: 4px;
  color: var(--el-button-text-color, var(--el-text-color-regular));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;

  &:hover {
    color: var(--el-button-hover-text-color, var(--el-color-primary));
    border-color: var(--el-button-hover-border-color, var(--el-color-primary-light-7));
    background-color: var(--el-button-hover-bg-color, var(--el-color-primary-light-9));
  }

  &:active {
    color: var(--el-button-active-text-color, var(--el-color-primary-dark-2));
    border-color: var(--el-button-active-border-color, var(--el-color-primary-dark-2));
    background-color: var(--el-button-active-bg-color, var(--el-color-primary-light-8));
  }

  &__loading-icon {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  &__icon,
  &__suffix-icon {
    font-size: 16px;
  }

  &__text {
    display: inline-block;
  }

  // 尺寸
  &--large {
    padding: 12px 19px;
    font-size: 16px;

    .sc-button__icon,
    .sc-button__suffix-icon {
      font-size: 18px;
    }
  }

  &--small {
    padding: 5px 11px;
    font-size: 12px;

    .sc-button__icon,
    .sc-button__suffix-icon {
      font-size: 14px;
    }
  }

  // 类型
  &--primary {
    --el-button-text-color: #fff;
    --el-button-bg-color: var(--el-color-primary);
    --el-button-border-color: var(--el-color-primary);
    --el-button-hover-text-color: #fff;
    --el-button-hover-bg-color: var(--el-color-primary-light-3);
    --el-button-hover-border-color: var(--el-color-primary-light-3);
    --el-button-active-text-color: #fff;
    --el-button-active-bg-color: var(--el-color-primary-dark-2);
    --el-button-active-border-color: var(--el-color-primary-dark-2);
  }

  &--success {
    --el-button-text-color: #fff;
    --el-button-bg-color: var(--el-color-success);
    --el-button-border-color: var(--el-color-success);
    --el-button-hover-text-color: #fff;
    --el-button-hover-bg-color: var(--el-color-success-light-3);
    --el-button-hover-border-color: var(--el-color-success-light-3);
    --el-button-active-text-color: #fff;
    --el-button-active-bg-color: var(--el-color-success-dark-2);
    --el-button-active-border-color: var(--el-color-success-dark-2);
  }

  &--warning {
    --el-button-text-color: #fff;
    --el-button-bg-color: var(--el-color-warning);
    --el-button-border-color: var(--el-color-warning);
    --el-button-hover-text-color: #fff;
    --el-button-hover-bg-color: var(--el-color-warning-light-3);
    --el-button-hover-border-color: var(--el-color-warning-light-3);
    --el-button-active-text-color: #fff;
    --el-button-active-bg-color: var(--el-color-warning-dark-2);
    --el-button-active-border-color: var(--el-color-warning-dark-2);
  }

  &--danger {
    --el-button-text-color: #fff;
    --el-button-bg-color: var(--el-color-danger);
    --el-button-border-color: var(--el-color-danger);
    --el-button-hover-text-color: #fff;
    --el-button-hover-bg-color: var(--el-color-danger-light-3);
    --el-button-hover-border-color: var(--el-color-danger-light-3);
    --el-button-active-text-color: #fff;
    --el-button-active-bg-color: var(--el-color-danger-dark-2);
    --el-button-active-border-color: var(--el-color-danger-dark-2);
  }

  &--info {
    --el-button-text-color: #fff;
    --el-button-bg-color: var(--el-color-info);
    --el-button-border-color: var(--el-color-info);
    --el-button-hover-text-color: #fff;
    --el-button-hover-bg-color: var(--el-color-info-light-3);
    --el-button-hover-border-color: var(--el-color-info-light-3);
    --el-button-active-text-color: #fff;
    --el-button-active-bg-color: var(--el-color-info-dark-2);
    --el-button-active-border-color: var(--el-color-info-dark-2);
  }

  // 朴素按钮
  &.is-plain {
    --el-button-text-color: var(--el-button-bg-color);
    --el-button-bg-color: var(--el-fill-color-blank);
    --el-button-border-color: var(--el-button-text-color);
  }

  // 圆角
  &.is-round {
    border-radius: 20px;
  }

  // 圆形
  &.is-circle {
    border-radius: 50%;
    padding: 8px;
    width: 32px;
    height: 32px;

    &.sc-button--large {
      width: 40px;
      height: 40px;
      padding: 12px;
    }

    &.sc-button--small {
      width: 24px;
      height: 24px;
      padding: 5px;
    }
  }

  // 文字按钮
  &.is-text {
    border-color: transparent;
    background: transparent;
    padding: 0;

    &:hover {
      background: transparent;
    }
  }

  // 链接按钮
  &.is-link {
    border-color: transparent;
    background: transparent;
    padding: 0;
    text-decoration: underline;

    &:hover {
      background: transparent;
    }
  }

  // 禁用状态
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover,
    &:active {
      color: var(--el-button-text-color);
      border-color: var(--el-button-border-color);
      background-color: var(--el-button-bg-color);
    }
  }

  // 加载状态
  &.is-loading {
    cursor: wait;
    pointer-events: none;
  }

  // Tech 主题模式的样式
  &--tech-mode {
    background: rgba(0, 20, 40, 0.8);
    border: 1px solid rgba(0, 246, 255, 0.5);
    color: #00f6ff;
    border-radius: 2px;
    position: relative;
    overflow: visible;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;

    // 边角装饰
    .sc-button__tech-corner {
      position: absolute;
      width: 8px;
      height: 8px;
      border: 1px solid #00f6ff;
      transition: all 0.3s ease;

      &--tl {
        top: -1px;
        left: -1px;
        border-right: none;
        border-bottom: none;
      }

      &--tr {
        top: -1px;
        right: -1px;
        border-left: none;
        border-bottom: none;
      }

      &--bl {
        bottom: -1px;
        left: -1px;
        border-right: none;
        border-top: none;
      }

      &--br {
        bottom: -1px;
        right: -1px;
        border-left: none;
        border-top: none;
      }
    }

    // 发光效果
    .sc-button__tech-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 246, 255, 0.1);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    &:hover {
      background: rgba(0, 30, 60, 0.9);
      border-color: #00f6ff;
      color: #fff;
      box-shadow:
        0 0 15px rgba(0, 246, 255, 0.5),
        inset 0 0 15px rgba(0, 246, 255, 0.1);
      transform: translateY(-2px);

      .sc-button__tech-corner {
        width: 12px;
        height: 12px;
        box-shadow: 0 0 5px rgba(0, 246, 255, 0.8);
      }

      .sc-button__tech-glow {
        opacity: 1;
      }
    }

    &:active {
      background: rgba(0, 40, 80, 0.95);
      border-color: #00d4ff;
      color: #00d4ff;
      transform: translateY(0);
    }

    // Tech 主题下的类型变体
    &.sc-button--primary {
      background: rgba(0, 100, 200, 0.8);
      border-color: #1890ff;
      color: #fff;

      &:hover {
        background: rgba(0, 120, 240, 0.9);
        border-color: #40a9ff;
        box-shadow:
          0 0 15px rgba(24, 144, 255, 0.5),
          inset 0 0 15px rgba(24, 144, 255, 0.1);
      }
    }

    &.sc-button--success {
      background: rgba(0, 100, 50, 0.8);
      border-color: #00ff88;
      color: #00ff88;

      &:hover {
        background: rgba(0, 120, 60, 0.9);
        border-color: #00ffaa;
        box-shadow:
          0 0 15px rgba(0, 255, 136, 0.5),
          inset 0 0 15px rgba(0, 255, 136, 0.1);
      }
    }

    &.sc-button--warning {
      background: rgba(100, 60, 0, 0.8);
      border-color: #ff9500;
      color: #ff9500;

      &:hover {
        background: rgba(120, 70, 0, 0.9);
        border-color: #ffb340;
        box-shadow:
          0 0 15px rgba(255, 149, 0, 0.5),
          inset 0 0 15px rgba(255, 149, 0, 0.1);
      }
    }

    &.sc-button--danger {
      background: rgba(100, 0, 0, 0.8);
      border-color: #ff4d4f;
      color: #ff4d4f;

      &:hover {
        background: rgba(120, 0, 0, 0.9);
        border-color: #ff7875;
        box-shadow:
          0 0 15px rgba(255, 77, 79, 0.5),
          inset 0 0 15px rgba(255, 77, 79, 0.1);
      }
    }

    // Tech 主题禁用状态
    &.is-disabled {
      background: rgba(0, 20, 40, 0.4);
      border-color: rgba(0, 246, 255, 0.2);
      color: rgba(0, 246, 255, 0.3);
      box-shadow: none;

      .sc-button__tech-corner {
        opacity: 0.3;
      }

      &:hover {
        background: rgba(0, 20, 40, 0.4);
        border-color: rgba(0, 246, 255, 0.2);
        color: rgba(0, 246, 255, 0.3);
        box-shadow: none;
        transform: none;
      }
    }

    // Tech 主题加载状态
    &.is-loading {
      .sc-button__loading-icon {
        color: #00f6ff;
        filter: drop-shadow(0 0 5px rgba(0, 246, 255, 0.8));
      }
    }

    // 禁用动画模式（性能优化）
    &.no-animation {
      transition: none !important;

      &:hover {
        transform: none;
      }

      .sc-button__tech-corner,
      .sc-button__tech-glow {
        transition: none !important;
      }
    }
  }

  // Scifi 主题模式的样式
  &--scifi-mode {
    background: rgba(0, 10, 30, 0.9);
    border: none;
    color: #00f6ff;
    border-radius: 2px;
    position: relative;
    overflow: visible;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 600;
    text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);

    // SVG 边框
    .sc-button__scifi-border {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;

      .scifi-rect {
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        transition: all 0.3s ease;
      }

      .scifi-corner {
        transition: all 0.3s ease;

        &--tr {
          d: path('M calc(100% - 1) 12 L calc(100% - 1) 1 L calc(100% - 12) 1');
        }

        &--bl {
          d: path('M 1 calc(100% - 12) L 1 calc(100% - 1) L 12 calc(100% - 1)');
        }

        &--br {
          d: path('M calc(100% - 12) calc(100% - 1) L calc(100% - 1) calc(100% - 1) L calc(100% - 1) calc(100% - 12)');
        }
      }
    }

    // 扫描线效果
    .sc-button__scifi-scanline {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0, 246, 255, 0.1) 50%,
        transparent 100%
      );
      background-size: 100% 4px;
      animation: scifi-scan 4s linear infinite;
      pointer-events: none;
      z-index: 1;
    }

    // 发光层
    .sc-button__scifi-glow {
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: transparent;
      box-shadow: 
        0 0 20px rgba(0, 246, 255, 0.3),
        inset 0 0 20px rgba(0, 246, 255, 0.1);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 0;
    }

    .sc-button__text,
    .sc-button__icon,
    .sc-button__suffix-icon {
      position: relative;
      z-index: 2;
    }

    &:hover {
      color: #fff;
      text-shadow: 0 0 15px rgba(0, 246, 255, 0.8);

      .sc-button__scifi-glow {
        opacity: 1;
      }

      .scifi-corner {
        stroke-width: 3;
      }
    }

    &:active {
      color: #00d4ff;
    }

    // 禁用动画模式
    &.no-animation {
      .sc-button__scifi-scanline {
        animation: none;
      }

      .sc-button__scifi-glow,
      .scifi-rect,
      .scifi-corner {
        transition: none !important;
      }
    }

    // Scifi 主题禁用状态
    &.is-disabled {
      opacity: 0.4;
      color: rgba(0, 246, 255, 0.4);

      .sc-button__scifi-scanline {
        animation: none;
      }
    }
  }

  @keyframes scifi-scan {
    0% {
      background-position: 0 -100%;
    }
    100% {
      background-position: 0 100%;
    }
  }
}
</style>
