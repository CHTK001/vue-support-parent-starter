<template>
  <div
    class="sc-card-compact"
    :class="{
      'is-hoverable': hoverable,
      'is-active': active,
      [`theme--${theme}`]: true
    }"
  >
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title || icon" class="sc-card-compact__header">
      <slot name="header">
        <div v-if="icon" class="sc-card-compact__icon" :style="iconStyle">
          <slot name="icon">
            <IconifyIconOnline :icon="icon" />
          </slot>
        </div>
        <div class="sc-card-compact__info">
          <div v-if="title" class="sc-card-compact__title">{{ title }}</div>
          <div v-if="subtitle" class="sc-card-compact__subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </div>
        <div v-if="$slots.status" class="sc-card-compact__status">
          <slot name="status" />
        </div>
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div v-if="$slots.default" class="sc-card-compact__body">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="sc-card-compact__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";

/**
 * 紧凑型卡片布局
 * 参考仓库管理页面的卡片样式，适用于列表展示
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */
export default defineComponent({
  name: "CompactLayout",
  props: {
    /**
     * 卡片标题
     */
    title: {
      type: String,
      default: ""
    },
    /**
     * 卡片副标题
     */
    subtitle: {
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
     * 图标背景色
     */
    iconBgColor: {
      type: String,
      default: ""
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
     * 主题色
     */
    theme: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info">,
      default: "default"
    },
    /**
     * 阴影显示时机
     */
    shadow: {
      type: String,
      default: "hover",
      validator: (val: string) => ["always", "hover", "never"].includes(val)
    },
    /**
     * 边框位置（兼容默认布局）
     */
    borderPosition: {
      type: String,
      default: "none"
    }
  },
  setup(props) {
    const iconStyle = computed(() => {
      if (props.iconBgColor) {
        return { background: props.iconBgColor };
      }
      return {};
    });

    return {
      iconStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-card-compact {
  --compact-radius: 14px;
  --compact-icon-size: 46px;
  --compact-padding: 16px;
  --compact-transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  position: relative;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: var(--compact-radius);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: var(--compact-transition);
  overflow: hidden;

  // 顶部装饰渐变条
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary));
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  // 背景光晕效果
  &::after {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.03) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow:
        0 12px 32px rgba(99, 102, 241, 0.12),
        0 4px 12px rgba(0, 0, 0, 0.06);
      transform: translateY(-4px);

      &::before {
        opacity: 1;
        animation: shimmer 2s linear infinite;
      }

      &::after {
        opacity: 1;
      }

      .sc-card-compact__icon {
        transform: scale(1.1) rotate(-3deg);
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
      }

      .sc-card-compact__title {
        color: var(--el-color-primary);
      }
    }

    &:active {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.12);
    }
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.03) 0%, rgba(var(--el-color-primary-rgb), 0.01) 100%);

    &::before {
      opacity: 1;
    }

    .sc-card-compact__icon {
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }

  // 主题色变体 mixin
  @mixin theme-variant($color-name) {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-color-#{$color-name}) 0%, var(--el-color-#{$color-name}-light-3) 100%);
      box-shadow: 0 4px 14px rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.25);
    }

    &::before {
      background: linear-gradient(90deg, var(--el-color-#{$color-name}), var(--el-color-#{$color-name}-light-3), var(--el-color-#{$color-name}));
      background-size: 200% 100%;
    }

    &::after {
      background: radial-gradient(circle, rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.04) 0%, transparent 70%);
    }

    &.is-active {
      border-color: var(--el-color-#{$color-name});
      background: linear-gradient(135deg, rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.04) 0%, transparent 100%);
    }

    &.is-hoverable:hover {
      border-color: var(--el-color-#{$color-name}-light-5);
      box-shadow:
        0 12px 28px rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.15),
        0 4px 12px rgba(0, 0, 0, 0.04);

      .sc-card-compact__icon {
        box-shadow: 0 8px 20px rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.35);
      }

      .sc-card-compact__title {
        color: var(--el-color-#{$color-name});
      }
    }
  }

  &.theme--default {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-fill-color-dark) 0%, var(--el-fill-color) 100%);
      color: var(--el-text-color-primary);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    }

    &.is-hoverable:hover .sc-card-compact__icon {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }
  }

  &.theme--primary {
    @include theme-variant(primary);
  }

  &.theme--success {
    @include theme-variant(success);
  }

  &.theme--warning {
    @include theme-variant(warning);
  }

  &.theme--danger {
    @include theme-variant(danger);
  }

  &.theme--info {
    @include theme-variant(info);
  }

  // 头部区域
  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: var(--compact-padding) calc(var(--compact-padding) + 4px);
  }

  // 图标容器
  &__icon {
    width: var(--compact-icon-size);
    height: var(--compact-icon-size);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    flex-shrink: 0;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;

    // 图标内部光效
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  // 信息区域
  &__info {
    flex: 1;
    min-width: 0;
  }

  // 标题
  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
    transition: color 0.25s ease;
  }

  // 副标题
  &__subtitle {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  // 状态区域
  &__status {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  // 内容区域
  &__body {
    padding: var(--compact-padding) calc(var(--compact-padding) + 4px);
    border-top: 1px solid var(--el-border-color-extra-light);
    background: linear-gradient(180deg, var(--el-fill-color-lighter) 0%, transparent 100%);

    // 信息行样式
    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;

      &:first-child {
        padding-top: 0;
      }

      &:last-child {
        padding-bottom: 0;
      }

      .info-icon {
        color: var(--el-text-color-placeholder);
        font-size: 15px;
        flex-shrink: 0;
        opacity: 0.8;
      }

      .info-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        min-width: 60px;
      }

      .info-text {
        flex: 1;
        font-size: 13px;
        color: var(--el-text-color-regular);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.muted {
          color: var(--el-text-color-placeholder);
        }

        &.highlight {
          color: var(--el-color-primary);
          font-weight: 500;
        }
      }
    }
  }

  // 底部区域
  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px calc(var(--compact-padding) + 4px);
    background: var(--el-fill-color-lighter);
    border-top: 1px solid var(--el-border-color-extra-light);

    :deep(.el-button) {
      --el-button-size: 28px;
      font-size: 12px;
    }
  }
}

// 顶部装饰条动画
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 暗色模式适配
:global(html.dark) {
  .sc-card-compact {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color-darker);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &::after {
      background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.06) 0%, transparent 70%);
    }

    &.is-hoverable:hover {
      box-shadow:
        0 12px 28px rgba(0, 0, 0, 0.35),
        0 0 0 1px rgba(var(--el-color-primary-rgb), 0.1);
    }

    &__body {
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, transparent 100%);
    }

    &__footer {
      background: rgba(0, 0, 0, 0.15);
      border-color: var(--el-border-color-darker);
    }

    &__icon::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
    }
  }
}
</style>
