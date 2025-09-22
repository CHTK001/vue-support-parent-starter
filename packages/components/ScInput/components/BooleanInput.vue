<template>
  <div class="boolean-input">
    <label class="toggle-switch">
      <input type="checkbox" :checked="currentValue" :disabled="disabled" class="toggle-input" @change="handleToggle" />
      <span class="toggle-slider">
        <span class="toggle-button" />
      </span>
      <span class="toggle-labels">
        <span class="label-off">{{ falseText }}</span>
        <span class="label-on">{{ trueText }}</span>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: boolean;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 输入框尺寸
   */
  size?: "large" | "default" | "small";
  /**
   * 真值文本
   */
  trueLabel?: string;
  /**
   * 假值文本
   */
  falseLabel?: string;
  /**
   * 是否占满父容器宽度
   */
  block?: boolean;
  /**
   * 激活状态颜色
   */
  activeColor?: string;
  /**
   * 未激活状态颜色
   */
  inactiveColor?: string;
  /**
   * 前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: "default",
  trueLabel: "",
  falseLabel: "",
  block: false,
  activeColor: "",
  inactiveColor: "",
  prefixIcon: "",
  showPrefix: true
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

// 获取真假值的显示文本
const trueText = computed(() => props.trueLabel || t("buttons.open"));
const falseText = computed(() => props.falseLabel || t("buttons.close"));

// 选项列表
const options = computed(() => [
  { label: trueText.value, value: true },
  { label: falseText.value, value: false }
]);

const currentValue = computed({
  get: () => {
    // 处理不同类型的boolean值
    const value = props.modelValue;

    // 如果是字符串类型
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }

    // 如果是数字类型
    if (typeof value === "number") {
      return value === 1;
    }

    // 默认返回boolean值
    return Boolean(value);
  },
  set: val => emit("update:modelValue", val)
});

/**
 * 处理切换事件
 */
const handleToggle = (event: Event) => {
  if (props.disabled) return;

  const target = event.target as HTMLInputElement;
  const boolValue = target.checked;

  emit("update:modelValue", boolValue);
  emit("change", boolValue);
};

/**
 * 对外暴露方法
 */
defineExpose({
  focus: () => emit("focus"),
  blur: () => emit("blur")
});
</script>

<style lang="scss" scoped>
.boolean-input {
  display: inline-block;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  height: 32px;
  vertical-align: middle;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  width: 36px;
  height: 18px;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  border-radius: 9px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1);
  margin-right: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 2px;
    transform: translateY(-50%);
    width: 3px;
    height: 3px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 2px;
    transform: translateY(-50%);
    width: 2px;
    height: 2px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transition: all 0.3s ease;
  }
}

.toggle-button {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, var(--el-bg-color), var(--el-bg-overlay));
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid var(--el-border-color);

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 5px;
    height: 5px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: linear-gradient(45deg, #64748b, #475569);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: all 0.3s ease;
  }
}

.toggle-labels {
  display: flex;
  flex-direction: column;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;

  .label-off,
  .label-on {
    transition: all 0.3s ease;
    opacity: 0.6;
  }

  .label-off {
    color: #64748b;
  }

  .label-on {
    color: #10b981;
    opacity: 0.3;
  }
}

// Checked state
.toggle-input:checked + .toggle-slider {
  background: linear-gradient(145deg, #10b981, #059669);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 2px 12px rgba(16, 185, 129, 0.3);

  &::before {
    transform: translateX(16px) translateY(-50%);
    background: linear-gradient(145deg, #ffffff, #f0fdf4);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .toggle-button {
    transform: translateX(16px);
    background: linear-gradient(135deg, #ffffff, #f0f9ff);
    box-shadow:
      0 2px 6px rgba(59, 130, 246, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);

    &::after {
      transform: translate(-50%, -50%) scale(1);
      background: linear-gradient(45deg, #10b981, #059669);
    }
  }
}

.toggle-input:checked ~ .toggle-labels {
  .label-off {
    opacity: 0.3;
  }

  .label-on {
    opacity: 1;
  }
}

// Hover effects
.toggle-switch:hover .toggle-slider {
  transform: translateY(-1px);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.15);
}

.toggle-switch:hover .toggle-input:checked + .toggle-slider {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 20px rgba(16, 185, 129, 0.4);
}

// Focus state
.toggle-input:focus + .toggle-slider {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

// Active state
.toggle-switch:active .toggle-slider {
  transform: translateY(0);
}

// Disabled state
.toggle-input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;

  &::before {
    background: #e2e8f0;
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .toggle-slider {
    background: linear-gradient(145deg, #374151, #4b5563);

    &::before {
      background: linear-gradient(145deg, #f9fafb, #e5e7eb);
    }
  }

  .toggle-input:checked + .toggle-slider {
    background: linear-gradient(145deg, #059669, #047857);
  }

  .toggle-labels {
    .label-off {
      color: #9ca3af;
    }
  }
}

.sc-boolean-input-item {
  flex: 1;
  padding: 12px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  user-select: none;
  position: relative;
  z-index: 1;

  &:not(:last-child) {
    border-right: 1px solid rgba(228, 231, 237, 0.6);
  }

  &:hover:not(.is-disabled):not(.is-active) {
    background: linear-gradient(135deg, #ecf5ff 0%, #e1f0ff 100%);
    color: #409eff;
    transform: scale(1.02);
  }

  &.is-active {
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
    color: #ffffff;
    font-weight: 600;
    box-shadow:
      0 4px 12px rgba(64, 158, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
    z-index: 2;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      border-radius: inherit;
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      transform: none;
    }
  }

  // 添加微妙的文字阴影
  &:not(.is-active) {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  &.is-active {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

// 尺寸变体
.sc-boolean-input {
  &.size-small {
    border-radius: 8px;

    .sc-boolean-input-item {
      padding: 8px 16px;
      font-size: 12px;
    }
  }

  &.size-large {
    border-radius: 16px;

    .sc-boolean-input-item {
      padding: 16px 24px;
      font-size: 16px;
    }
  }
}

// 自定义颜色支持
.sc-boolean-input[data-active-color] {
  .sc-boolean-input-item.is-active {
    background: linear-gradient(135deg, var(--active-color) 0%, color-mix(in srgb, var(--active-color) 80%, #000) 100%);
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--active-color) 30%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .sc-boolean-input-item:hover:not(.is-disabled):not(.is-active) {
    background: linear-gradient(135deg, color-mix(in srgb, var(--active-color) 10%, #fff) 0%, color-mix(in srgb, var(--active-color) 5%, #fff) 100%);
    color: var(--active-color);
  }

  &:hover {
    border-color: var(--active-color);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--active-color) 15%, transparent);
  }

  &:focus-within {
    border-color: var(--active-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--active-color) 10%, transparent);
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .sc-boolean-input {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: #334155;

    &:hover {
      border-color: #60a5fa;
      box-shadow: 0 4px 16px rgba(96, 165, 250, 0.15);
    }

    .sc-boolean-input-item {
      color: #cbd5e1;

      &:not(:last-child) {
        border-right-color: rgba(51, 65, 85, 0.6);
      }

      &:hover:not(.is-disabled):not(.is-active) {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: #93c5fd;
      }

      &.is-active {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: #ffffff;
      }
    }
  }
}

// 动画增强
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.sc-boolean-input-item.is-active {
  animation: pulse 2s infinite;
}
</style>
