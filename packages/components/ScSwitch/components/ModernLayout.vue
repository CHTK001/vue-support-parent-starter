<template>
  <div
    class="sc-switch-modern"
    :class="[`sc-switch-modern--${size}`, { 'is-checked': isChecked }, { 'is-disabled': disabled }, { 'is-loading': loading }]"
    :style="{
      '--active-color': activeColor || '#10b981',
      '--active-color-light': activeColor ? `color-mix(in srgb, ${activeColor} 85%, white 15%)` : '#34d399',
      '--inactive-color': inactiveColor || '#e2e8f0',
      '--inactive-color-light': inactiveColor ? `color-mix(in srgb, ${inactiveColor} 95%, white 5%)` : '#f1f5f9'
    }"
    @click="toggleSwitch"
  >
    <div class="sc-switch-modern__container">
      <div class="sc-switch-modern__track">
        <div class="sc-switch-modern__button">
          <div class="sc-switch-modern__button-inner">
            <el-icon v-if="loading" class="sc-switch-modern__loading">
              <Loading />
            </el-icon>
            <el-icon v-else-if="currentIcon" class="sc-switch-modern__icon">
              <component :is="currentIcon" />
            </el-icon>
            <div v-else class="sc-switch-modern__dot" />
          </div>
        </div>
        <div class="sc-switch-modern__track-bg" />
      </div>

      <div v-if="activeText || inactiveText" class="sc-switch-modern__labels">
        <span class="sc-switch-modern__label sc-switch-modern__label--inactive">{{ inactiveText }}</span>
        <span class="sc-switch-modern__label sc-switch-modern__label--active">{{ activeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: "default",
    validator: (val: string) => ["small", "default", "large"].includes(val)
  },
  activeText: {
    type: String,
    default: ""
  },
  inactiveText: {
    type: String,
    default: ""
  },
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  activeColor: {
    type: String,
    default: "#409eff"
  },
  inactiveColor: {
    type: String,
    default: "#dcdfe6"
  },
  activeIcon: {
    type: String,
    default: ""
  },
  inactiveIcon: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 计算当前是否为选中状态
const isChecked = computed(() => props.modelValue === props.activeValue);

// 计算当前显示的图标
const currentIcon = computed(() => (isChecked.value ? props.activeIcon : props.inactiveIcon));

// 计算滑块位置样式
const thumbStyle = computed(() => {
  return {
    transform: isChecked.value ? "translateX(calc(100% - 4px))" : "translateX(4px)"
  };
});

// 切换开关状态
const toggleSwitch = () => {
  if (props.disabled || props.loading) return;

  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>

<style lang="scss" scoped>
.sc-switch-modern {
  --active-color: #10b981;
  --active-color-light: #34d399;
  --inactive-color: #e2e8f0;
  --inactive-color-light: #f1f5f9;

  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  vertical-align: middle;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      transform: none;
    }
  }

  &.is-loading {
    cursor: wait;
  }

  // 尺寸变体
  &--small {
    .sc-switch-modern__track {
      width: 36px;
      height: 18px;
    }

    .sc-switch-modern__button {
      width: 14px;
      height: 14px;
    }

    .sc-switch-modern__labels {
      font-size: 10px;
    }
  }

  &--default {
    .sc-switch-modern__track {
      width: 44px;
      height: 22px;
    }

    .sc-switch-modern__button {
      width: 18px;
      height: 18px;
    }

    .sc-switch-modern__labels {
      font-size: 12px;
    }
  }

  &--large {
    .sc-switch-modern__track {
      width: 52px;
      height: 26px;
    }

    .sc-switch-modern__button {
      width: 22px;
      height: 22px;
    }

    .sc-switch-modern__labels {
      font-size: 14px;
    }
  }
}

.sc-switch-modern__container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-switch-modern__track {
  position: relative;
  border-radius: 11px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.sc-switch-modern__track-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--inactive-color) 0%, var(--inactive-color-light) 100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

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

.sc-switch-modern__button {
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 2;
}

.sc-switch-modern__button-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  position: relative;
}

.sc-switch-modern__dot {
  width: 5px;
  height: 5px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.sc-switch-modern__icon {
  font-size: 10px;
  color: #64748b;
  transition: all 0.3s ease;
}

.sc-switch-modern__loading {
  font-size: 8px;
  color: #64748b;
  animation: spin 1s linear infinite;
}

.sc-switch-modern__labels {
  display: flex;
  flex-direction: column;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.sc-switch-modern__label {
  transition: all 0.3s ease;
  opacity: 0.6;

  &--inactive {
    color: #64748b;
  }

  &--active {
    color: #10b981;
    opacity: 0.3;
  }
}

// 选中状态
.sc-switch-modern.is-checked {
  .sc-switch-modern__track-bg {
    background: linear-gradient(145deg, var(--active-color) 0%, var(--active-color-light) 100%);
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 2px 12px color-mix(in srgb, var(--active-color) 30%, transparent);

    &::before {
      transform: translateX(calc(100% + 16px)) translateY(-50%);
      background: linear-gradient(145deg, #ffffff, #f0fdf4);
      box-shadow:
        0 2px 6px rgba(0, 0, 0, 0.2),
        0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }

  .sc-switch-modern__button {
    transform: translateX(calc(100% + 4px));
    background: linear-gradient(135deg, #ffffff, #f0f9ff);
    box-shadow:
      0 2px 6px color-mix(in srgb, var(--active-color) 30%, transparent),
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);

    .sc-switch-modern__dot {
      background: linear-gradient(45deg, var(--active-color), color-mix(in srgb, var(--active-color) 80%, #000));
    }
  }

  .sc-switch-modern__icon {
    color: var(--active-color);
  }

  .sc-switch-modern__label--inactive {
    opacity: 0.3;
  }

  .sc-switch-modern__label--active {
    opacity: 1;
  }
}

// 悬停效果
.sc-switch-modern:hover:not(.is-disabled) {
  .sc-switch-modern__track {
    transform: translateY(-1px);
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &.is-checked .sc-switch-modern__track-bg {
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 4px 20px color-mix(in srgb, var(--active-color) 40%, transparent);
  }
}

// 激活状态
.sc-switch-modern:active:not(.is-disabled) {
  .sc-switch-modern__track {
    transform: translateY(0);
  }
}

// 禁用状态
.sc-switch-modern.is-disabled {
  .sc-switch-modern__track-bg {
    background: #e2e8f0;

    &::before {
      background: #e2e8f0;
    }
  }

  .sc-switch-modern__button {
    background: #f1f5f9;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .sc-switch-modern {
    .sc-switch-modern__track-bg {
      background: linear-gradient(145deg, #374151, #4b5563);

      &::before {
        background: linear-gradient(145deg, #f9fafb, #e5e7eb);
      }
    }

    &.is-checked .sc-switch-modern__track-bg {
      background: linear-gradient(145deg, #059669, #047857);
    }

    .sc-switch-modern__label--inactive {
      color: #9ca3af;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
