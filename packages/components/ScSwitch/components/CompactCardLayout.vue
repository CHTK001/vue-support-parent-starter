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
      <div v-if="currentIcon || loading" class="sc-switch-compact__icon">
        <el-icon v-if="loading" class="is-loading">
          <Loading />
        </el-icon>
        <IconifyIconOnline v-else :icon="currentIcon" />
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
import { Loading } from "@element-plus/icons-vue";
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
  padding: 10px 12px;
  background: var(--inactive-bg);
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }

  &.is-checked {
    border-color: var(--active-color);
    background: var(--active-bg);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      border-color: #e5e7eb;
      box-shadow: none;
    }
  }

  &.is-loading {
    cursor: wait;
  }

  // 尺寸变体
  &--small {
    padding: 8px 10px;

    .sc-switch-compact__icon {
      font-size: 14px;
    }

    .sc-switch-compact__label {
      font-size: 12px;
    }
  }

  &--default {
    padding: 10px 12px;

    .sc-switch-compact__icon {
      font-size: 16px;
    }

    .sc-switch-compact__label {
      font-size: 13px;
    }
  }

  &--large {
    padding: 12px 14px;

    .sc-switch-compact__icon {
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
    gap: 8px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--active-color);
    transition: color 0.25s ease;

    .is-loading {
      animation: rotating 1.5s linear infinite;
    }
  }

  &__label {
    font-weight: 500;
    color: #475569;
    transition: color 0.25s ease;
  }

  &.is-checked {
    .sc-switch-compact__label {
      color: #1e293b;
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
