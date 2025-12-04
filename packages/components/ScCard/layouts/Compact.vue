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
  position: relative;
  background: var(--el-bg-color-overlay, #fff);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  // 微妙的顶部装饰线
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.12);
      transform: translateY(-2px);

      &::before {
        opacity: 1;
      }

      .sc-card-compact__icon {
        transform: scale(1.05);
      }
    }
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.02) 0%, transparent 100%);

    &::before {
      opacity: 1;
    }
  }

  // 主题色定义
  @mixin theme-variant($color-name) {
    .sc-card-compact__icon {
      background: linear-gradient(145deg, var(--el-color-#{$color-name}) 0%, var(--el-color-#{$color-name}-light-3) 100%);
      box-shadow: 0 4px 12px rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.2);
    }
    &::before {
      background: linear-gradient(90deg, var(--el-color-#{$color-name}), var(--el-color-#{$color-name}-light-3));
    }
    &.is-active {
      border-color: var(--el-color-#{$color-name});
      background: linear-gradient(135deg, rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.03) 0%, transparent 100%);
    }
    &.is-hoverable:hover {
      border-color: var(--el-color-#{$color-name}-light-5);
      box-shadow: 0 8px 24px rgba(var(--el-color-#{$color-name}-rgb, 0, 0, 0), 0.15);
    }
  }

  &.theme--default {
    .sc-card-compact__icon {
      background: linear-gradient(145deg, var(--el-fill-color) 0%, var(--el-fill-color-light) 100%);
      color: var(--el-text-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    background: linear-gradient(145deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary, #1e293b);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  &__subtitle {
    font-size: 13px;
    color: var(--el-text-color-secondary, #64748b);
    line-height: 1.4;
  }

  &__status {
    flex-shrink: 0;
  }

  &__body {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-extra-light, #f1f5f9);

    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-icon {
        color: var(--el-text-color-placeholder, #94a3b8);
        font-size: 15px;
        flex-shrink: 0;
      }

      .info-text {
        font-size: 13px;
        color: var(--el-text-color-regular, #475569);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.muted {
          color: var(--el-text-color-placeholder, #94a3b8);
        }
      }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: var(--el-fill-color-lighter, #f8fafc);
    border-top: 1px solid var(--el-border-color-extra-light, #f1f5f9);
  }
}

// 暗色模式适配
:global(html.dark) {
  .sc-card-compact {
    border-color: var(--el-border-color-darker, #374151);

    &.is-hoverable:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    &__footer {
      background: var(--el-fill-color-dark, #1f2937);
    }
  }
}
</style>
