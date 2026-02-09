<!--
  视觉效果卡片布局开关组件
  用于系统设置等场景，提供更丰富的视觉展示效果
  @author CH
  @date 2025-12-02
-->
<template>
  <div
    class="sc-switch-visual-card"
    :class="[
      `sc-switch-visual-card--${size}`,
      {
        'is-active': isChecked,
        'is-disabled': disabled,
        'is-loading': loading,
        'is-wide': wide
      }
    ]"
    :style="customStyle"
    @click="toggleSwitch"
  >
    <!-- 角标 -->
    <ScRibbon v-if="isChecked && showRibbon" :text="ribbonText" :color="ribbonColor" variant="tag" position="rt" size="sm" />

    <!-- 图标区域 -->
    <div v-if="hasIcon" class="sc-switch-visual-card__icon">
      <slot name="icon">
        <IconifyIconOnline v-if="currentIcon" :icon="currentIcon" />
      </slot>
    </div>

    <!-- 内容区域 -->
    <div class="sc-switch-visual-card__content">
      <slot>
        <span v-if="label" class="sc-switch-visual-card__label">{{ label }}</span>
        <span v-if="description" class="sc-switch-visual-card__desc">{{ description }}</span>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="sc-switch-visual-card__loading">
      <IconifyIconOnline icon="ep:loading" class="is-loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 视觉效果卡片布局开关组件
 * @author CH
 * @date 2025-12-02
 * @version 1.0.0
 */
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import { computed, useSlots } from "vue";

const props = defineProps({
  /**
   * 绑定值
   */
  modelValue: {
    type: [Boolean, String, Number],
    required: true
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
   * 尺寸
   */
  size: {
    type: String,
    default: "default",
    validator: (val: string) => ["small", "default", "large"].includes(val)
  },
  /**
   * 激活时的值
   */
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  /**
   * 非激活时的值
   */
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  /**
   * 激活时的图标
   */
  activeIcon: {
    type: String,
    default: ""
  },
  /**
   * 非激活时的图标
   */
  inactiveIcon: {
    type: String,
    default: ""
  },
  /**
   * 标签文本
   */
  label: {
    type: String,
    default: ""
  },
  /**
   * 描述文本
   */
  description: {
    type: String,
    default: ""
  },
  /**
   * 是否显示角标
   */
  showRibbon: {
    type: Boolean,
    default: true
  },
  /**
   * 角标文本
   */
  ribbonText: {
    type: String,
    default: "开启"
  },
  /**
   * 角标颜色
   */
  ribbonColor: {
    type: String,
    default: "var(--el-color-primary)"
  },
  /**
   * 激活时的背景色
   */
  activeColor: {
    type: String,
    default: ""
  },
  /**
   * 非激活时的背景色
   */
  inactiveColor: {
    type: String,
    default: ""
  },
  /**
   * 激活时的边框色
   */
  activeBorderColor: {
    type: String,
    default: ""
  },
  /**
   * 是否横向撑满（宽模式）
   */
  wide: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "change"]);
const slots = useSlots();

// 计算当前是否为选中状态
const isChecked = computed(() => props.modelValue === props.activeValue);

// 计算当前显示的图标
const currentIcon = computed(() => (isChecked.value ? props.activeIcon : props.inactiveIcon) || props.activeIcon);

// 是否有图标插槽或图标属性
const hasIcon = computed(() => !!slots.icon || !!props.activeIcon || !!props.inactiveIcon);

// 计算自定义样式
const customStyle = computed(() => ({
  "--active-color": props.activeColor || "rgba(var(--el-color-primary-rgb), 0.08)",
  "--inactive-color": props.inactiveColor || "var(--el-fill-color-light)",
  "--active-border-color": props.activeBorderColor || "var(--el-color-primary)"
}));

// 切换开关状态
const toggleSwitch = () => {
  if (props.disabled || props.loading) return;

  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>

<style lang="scss" scoped>
.sc-switch-visual-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  height: 100%;
  background: var(--inactive-color);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  overflow: hidden;

  &:hover:not(.is-disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-active {
    background: var(--active-color);
    border-color: var(--active-border-color);
    box-shadow: 0 8px 20px -4px rgba(var(--el-color-primary-rgb), 0.2), 0 4px 8px -2px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-2px);

    .sc-switch-visual-card__icon {
      color: var(--el-color-primary);
      background: rgba(var(--el-color-primary-rgb), 0.15);
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .sc-switch-visual-card__label {
      color: var(--el-color-primary);
      font-weight: 600;
      text-shadow: 0 0 1px rgba(var(--el-color-primary-rgb), 0.1);
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.is-loading {
    cursor: wait;
  }

  // 宽模式 - 横向布局撑满
  &.is-wide {
    flex-direction: row;
    justify-content: flex-start;
    padding: 16px 20px;
    width: 100%;
    min-width: unset;

    .sc-switch-visual-card__icon {
      margin-bottom: 0;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .sc-switch-visual-card__content {
      align-items: flex-start;
      text-align: left;
      flex: 1;
    }
  }

  // 尺寸变体
  &--small {
    padding: 12px 10px;
    min-width: 80px;

    .sc-switch-visual-card__icon {
      width: 32px;
      height: 32px;
      font-size: 18px;
      margin-bottom: 6px;
    }

    .sc-switch-visual-card__label {
      font-size: 12px;
    }

    .sc-switch-visual-card__desc {
      font-size: 10px;
    }
  }

  &--default {
    min-width: 100px;

    .sc-switch-visual-card__icon {
      width: 40px;
      height: 40px;
      font-size: 22px;
      margin-bottom: 8px;
    }

    .sc-switch-visual-card__label {
      font-size: 13px;
    }

    .sc-switch-visual-card__desc {
      font-size: 11px;
    }
  }

  &--large {
    padding: 20px 16px;
    min-width: 120px;

    .sc-switch-visual-card__icon {
      width: 48px;
      height: 48px;
      font-size: 26px;
      margin-bottom: 10px;
    }

    .sc-switch-visual-card__label {
      font-size: 14px;
    }

    .sc-switch-visual-card__desc {
      font-size: 12px;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    transition: all 0.3s;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2px;
  }

  &__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
    transition: color 0.3s;
  }

  &__desc {
    color: var(--el-text-color-secondary);
    line-height: 1.3;
  }

  &__loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    padding: 8px;

    .is-loading {
      animation: rotate 1.5s linear infinite;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 深色主题适配
:global(html.dark) {
  .sc-switch-visual-card {
    &:hover:not(.is-disabled) {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    &__loading {
      background: rgba(30, 30, 30, 0.8);
    }
  }
}
</style>
