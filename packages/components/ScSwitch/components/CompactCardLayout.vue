<template>
  <div
    class="sc-switch-compact"
    :class="[
      `sc-switch-compact--${size}`,
      {
        'is-checked': isChecked,
        'is-disabled': disabled,
        'is-loading': loading
      }
    ]"
    :style="{
      '--active-color': activeColor || '#6366f1',
      '--inactive-color': inactiveColor || '#e5e7eb',
      '--active-bg': activeBgColor,
      '--inactive-bg': inactiveBgColor
    }"
    @click="toggleSwitch"
  >
    <!-- 左侧图标+标签 -->
    <div class="sc-switch-compact__info">
      <div v-if="currentIcon || loading" class="sc-switch-compact__icon-wrapper">
        <div class="sc-switch-compact__icon">
          <IconifyIconOnline v-if="loading" icon="ep:loading" class="is-loading" />
          <IconifyIconOnline v-else :icon="currentIcon" />
        </div>
      </div>
      <span v-if="label" class="sc-switch-compact__label">{{ label }}</span>
    </div>

    <!-- 右侧开关 -->
    <el-switch
      :model-value="isChecked"
      :disabled="disabled"
      :loading="loading"
      size="small"
      :active-color="activeColor || '#6366f1'"
      :inactive-color="inactiveColor || '#dcdfe6'"
      @click.stop
      @change="handleSwitchChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 紧凑卡片布局组件
 * 图标 + 标签 + 开关的水平布局，适用于功能开关列表
 * @author CH
 * @date 2025-12-08
 * @version 1.0.0
 */
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

interface Props {
  /**
   * 绑定值
   */
  modelValue: boolean | string | number;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 是否加载中
   */
  loading?: boolean;
  /**
   * 尺寸
   */
  size?: "small" | "default" | "large";
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 激活时的值
   */
  activeValue?: boolean | string | number;
  /**
   * 非激活时的值
   */
  inactiveValue?: boolean | string | number;
  /**
   * 激活时的颜色
   */
  activeColor?: string;
  /**
   * 非激活时的颜色
   */
  inactiveColor?: string;
  /**
   * 激活时的图标
   */
  activeIcon?: string;
  /**
   * 非激活时的图标
   */
  inactiveIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  size: "default",
  label: "",
  activeValue: true,
  inactiveValue: false,
  activeColor: "#6366f1",
  inactiveColor: "#dcdfe6",
  activeIcon: "",
  inactiveIcon: ""
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean | string | number];
  change: [value: boolean | string | number];
}>();

/**
 * 计算当前是否为选中状态
 */
const isChecked = computed(() => props.modelValue === props.activeValue);

/**
 * 计算当前显示的图标
 */
const currentIcon = computed(() => (isChecked.value ? props.activeIcon : props.inactiveIcon || props.activeIcon));

/**
 * 激活时的背景色（浅色）
 */
const activeBgColor = computed(() => {
  const color = props.activeColor || "#6366f1";
  // 返回淡紫色渐变背景
  return `linear-gradient(135deg, ${hexToRgba(color, 0.08)} 0%, ${hexToRgba(color, 0.15)} 100%)`;
});

/**
 * 非激活时的背景色
 */
const inactiveBgColor = computed(() => "#ffffff");

/**
 * 将十六进制颜色转换为rgba
 * @param hex 十六进制颜色
 * @param alpha 透明度
 * @returns rgba字符串
 */
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/**
 * 切换开关状态
 */
const toggleSwitch = () => {
  if (props.disabled || props.loading) {
    return;
  }
  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};

/**
 * 处理开关变化
 * @param val 变化后的值
 */
const handleSwitchChange = (val: boolean) => {
  const newValue = val ? props.activeValue : props.inactiveValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>

<style lang="scss" scoped>
.sc-switch-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 2px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;

  // 左侧装饰条
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: var(--active-color);
    border-radius: 0 3px 3px 0;
    transition: height 0.3s ease;
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateX(2px);

    &::before {
      height: 40%;
    }

    .sc-switch-compact__icon-wrapper {
      transform: scale(1.05);
    }
  }

  &.is-checked {
    border-color: var(--active-color);
    background: var(--active-bg);

    &::before {
      height: 60%;
    }

    .sc-switch-compact__icon-wrapper {
      background: var(--active-color);
      color: #fff;
      box-shadow: 0 3px 10px rgba(99, 102, 241, 0.3);
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      border-color: var(--el-border-color-lighter);
      box-shadow: none;
      transform: none;

      &::before {
        height: 0;
      }
    }
  }

  &.is-loading {
    cursor: wait;
  }

  // 尺寸变体
  &--small {
    padding: 10px 12px;
    border-radius: 10px;

    .sc-switch-compact__icon-wrapper {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      font-size: 14px;
    }

    .sc-switch-compact__label {
      font-size: 12px;
    }
  }

  &--default {
    padding: 12px 14px;

    .sc-switch-compact__icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      font-size: 16px;
    }

    .sc-switch-compact__label {
      font-size: 13px;
    }
  }

  &--large {
    padding: 14px 16px;

    .sc-switch-compact__icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      font-size: 18px;
    }

    .sc-switch-compact__label {
      font-size: 14px;
    }
  }

  // 子元素样式
  &__info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--active-color);
    transition: all 0.3s ease;

    .is-loading {
      animation: rotating 1.5s linear infinite;
    }
  }

  // 图标包装器
  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--el-fill-color-light);
    color: var(--active-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__label {
    font-weight: 500;
    color: var(--el-text-color-primary);
    transition: color 0.25s ease;
  }

  &.is-checked {
    .sc-switch-compact__label {
      color: var(--el-text-color-primary);
      font-weight: 600;
    }
  }

  // 开关样式优化
  :deep(.el-switch) {
    --el-switch-on-color: var(--active-color);

    .el-switch__core {
      border-radius: 20px;
    }
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
