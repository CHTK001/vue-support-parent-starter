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
  background: var(--el-bg-color-overlay, #fff);
  border-radius: 12px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
  }

  &.is-active {
    border-color: var(--el-color-success);
  }

  // 主题色
  &.theme--default {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
      color: var(--el-text-color-primary);
    }
    &.is-active {
      border-color: var(--el-color-primary);
    }
  }
  &.theme--primary {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    }
    &.is-active {
      border-color: var(--el-color-primary);
    }
  }
  &.theme--success {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
    }
    &.is-active {
      border-color: var(--el-color-success);
    }
  }
  &.theme--warning {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-color-warning) 0%, var(--el-color-warning-light-3) 100%);
    }
    &.is-active {
      border-color: var(--el-color-warning);
    }
  }
  &.theme--danger {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-light-3) 100%);
    }
    &.is-active {
      border-color: var(--el-color-danger);
    }
  }
  &.theme--info {
    .sc-card-compact__icon {
      background: linear-gradient(135deg, var(--el-color-info) 0%, var(--el-color-info-light-3) 100%);
    }
    &.is-active {
      border-color: var(--el-color-info);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter, #f1f5f9);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #fff;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary, #1e293b);
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    font-size: 12px;
    color: var(--el-text-color-secondary, #64748b);
  }

  &__status {
    flex-shrink: 0;
  }

  &__body {
    padding: 12px 16px;

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-icon {
        color: var(--el-text-color-secondary, #94a3b8);
        font-size: 14px;
        flex-shrink: 0;
      }

      .info-text {
        font-size: 13px;
        color: var(--el-text-color-regular, #475569);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.muted {
          color: var(--el-text-color-secondary, #94a3b8);
        }
      }
    }
  }

  &__footer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: var(--el-fill-color-light, #f8fafc);
    border-top: 1px solid var(--el-border-color-lighter, #f1f5f9);
  }
}
</style>
