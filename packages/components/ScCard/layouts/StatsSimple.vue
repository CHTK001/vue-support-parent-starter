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
      <!-- 数值：数字自动动画，非数字直接显示 -->
      <div class="sc-card-stats-simple__value">
        <slot name="value">
          <span v-if="isNumberValue">{{ displayValue }}</span>
          <span v-else>{{ value }}</span>
        </slot>
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
import { defineComponent, PropType, ref, watch, onMounted, computed } from "vue";

/**
 * 现代极简统计卡片 - 2025全新设计版
 * 玻璃拟物+轻量扁平化，适配Element Plus生态
 * @author CH
 * @version 2.1.0
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
    active: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    // 数字动画相关
    const displayValue = ref(0);
    const ANIMATION_DURATION = 800;

    // 判断是否为有效数字
    const isNumberValue = computed(() => {
      const val = props.value;
      return val !== "" && !isNaN(Number(val));
    });

    // 数字滚动动画
    const startNumberAnimation = () => {
      if (!isNumberValue.value) return;

      const target = Number(props.value);
      const start = 0;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        displayValue.value = Math.floor(start + (target - start) * easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    // 挂载 & 值变化时执行动画
    onMounted(() => {
      startNumberAnimation();
    });

    watch(
      () => props.value,
      () => {
        startNumberAnimation();
      }
    );

    return {
      displayValue,
      isNumberValue,
    };
  },
});
</script>

<style lang="scss" scoped>
// 全局样式变量（统一控制）
$card-radius: 18px;
$card-padding: 22px 24px;
$icon-size: 46px;
$transition-base: all 0.32s cubic-bezier(0.25, 0.8, 0.25, 1);

.sc-card-stats-simple {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: $card-padding;
  border-radius: $card-radius;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(235, 238, 245, 0.7);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: $transition-base;
  margin: 0 8px;
  flex: 1;
  min-width: 190px;

  // 激活状态（选中）
  &.is-active {
    border-color: rgba(var(--el-color-primary-rgb), 0.25);
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.08);
    transform: translateY(-2px);
  }

  // 悬停效果
  &.is-hoverable:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
    border-color: rgba(var(--el-color-primary-rgb), 0.18);
  }

  // 背景渐变装饰
  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(145deg, #ffffff, #f9fafb);
    z-index: 0;
    opacity: 0.8;
  }

  // 图标区域
  &__icon {
    width: $icon-size;
    height: $icon-size;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    transition: $transition-base;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    &:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    // 图标高光点
    &-dot {
      position: absolute;
      top: 9px;
      right: 9px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.7);
      z-index: 1;
    }

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

  // 数值样式
  &__value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    color: #1d2129;
    transition: color 0.3s ease;
  }

  // 标签样式
  &__label {
    font-size: 13px;
    color: #6e7685;
    font-weight: 400;
    margin-top: 4px;
    opacity: 0.95;
  }

  // 右侧装饰线
  &__decorator {
    width: 2px;
    height: 40px;
    border-radius: 1px;
    opacity: 0.15;
    transition: opacity 0.3s ease;
    background: currentColor;
  }

  // 主题混合
  @mixin theme-variant($type) {
    .sc-card-stats-simple__icon {
      background: linear-gradient(135deg, var(--el-color-#{$type}), var(--el-color-#{$type}-light-5));
      color: #fff;
    }
    .sc-card-stats-simple__value {
      color: var(--el-color-#{$type}-dark-2);
    }
    .sc-card-stats-simple__decorator {
      color: var(--el-color-#{$type});
    }
    &:hover .sc-card-stats-simple__decorator {
      opacity: 0.28;
    }
  }

  &.theme--default {
    @include theme-variant("primary");
    .sc-card-stats-simple__value {
      color: #1d2129;
    }
  }
  &.theme--primary { @include theme-variant("primary"); }
  &.theme--success { @include theme-variant("success"); }
  &.theme--warning { @include theme-variant("warning"); }
  &.theme--danger { @include theme-variant("danger"); }
  &.theme--info { @include theme-variant("info"); }

  // 深色模式
  html.dark &,
  html[data-theme="dark"] & {
    background: rgba(18, 24, 36, 0.88);
    border-color: rgba(148, 163, 184, 0.16);
    box-shadow: 0 8px 24px rgba(2, 6, 23, 0.25);

    .sc-card-stats-simple__bg {
      background: linear-gradient(145deg, #121824, #1e293b);
      opacity: 1;
    }
    .sc-card-stats-simple__value {
      color: var(--el-text-color-primary);
    }
    .sc-card-stats-simple__label {
      color: var(--el-text-color-secondary);
      opacity: 1;
    }
    .sc-card-stats-simple__decorator {
      opacity: 0.22;
    }
  }

  // 响应式
  @media (max-width: 768px) {
    padding: 18px 20px;
    gap: 14px;
    min-width: 150px;
    margin: 0 4px;

    .sc-card-stats-simple__icon {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }
    .sc-card-stats-simple__value {
      font-size: 24px;
    }
  }
}
</style>