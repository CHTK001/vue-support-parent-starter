<template>
  <div
    class="card-selector-item"
    :class="[
      {
        active: isSelected,
        disabled: isDisabled,
        'icon-position-top': iconPosition === 'top',
        'shape-circle': shape === 'circle',
        'shape-rectangle': shape === 'rectangle',
        'shape-rounded': shape === 'rounded'
      },
      theme ? `theme-${theme}` : ''
    ]"
    :style="{ width }"
    @click="handleSelect"
  >
    <div class="card-icon">
      <IconRenderer :icon="icon || 'ri:settings-3-line'" />
    </div>
    <div class="card-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import IconRenderer from "./IconRenderer.vue";

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: "ri:settings-3-line"
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isDisabled: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: "100px"
  },
  iconPosition: {
    type: String,
    default: "center",
    validator: (value: string) => {
      return ["center", "top"].includes(value);
    }
  },
  shape: {
    type: String,
    default: "rounded",
    validator: (value: string) => {
      return ["circle", "rectangle", "rounded"].includes(value);
    }
  },
  theme: {
    type: String,
    default: "",
    validator: (value: string) => {
      return ["", "techui", "glass"].includes(value);
    }
  }
});

const emit = defineEmits(["select"]);

const handleSelect = () => {
  if (!props.isDisabled) {
    emit("select", props.value);
  }
};
</script>

<style lang="scss" scoped>
.card-selector-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 25px 20px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: visible;
  cursor: pointer;
  height: auto;
  min-height: 120px;
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  justify-content: center;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-color-primary));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--el-box-shadow);
    border-color: var(--el-border-color);

    &::after {
      transform: scaleX(1);
    }
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    &::after {
      transform: scaleX(1);
    }

    .card-icon {
      background-color: var(--el-color-primary);
      color: #fff;
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background-color: var(--el-disabled-bg-color);
    border-color: var(--el-border-color-lighter);
  }

  .card-icon {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    padding: 10px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
    font-size: 22px;
    margin-bottom: 5px;
    z-index: 1;

    &:hover {
      transform: rotate(10deg);
    }
  }

  .card-label {
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    line-height: 1.4;
    word-break: break-word;
    max-width: 100%;
    color: var(--el-text-color-primary);
  }

  // 形状样式
  &.shape-circle {
    border-radius: 50%;
    aspect-ratio: 1;
    width: 120px !important;
    height: 120px !important;
    min-height: 120px;
  }

  &.shape-rectangle {
    border-radius: 0;
  }

  &.shape-rounded {
    border-radius: 12px;
  }

  &.icon-position-top {
    padding-top: 45px;
    margin-top: 25px;

    .card-icon {
      position: absolute;
      top: -25px;
      width: 52px;
      height: 52px;
      padding: 12px;
      box-shadow: var(--el-box-shadow-light);
      transition:
        all 0.3s ease,
        transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &:hover {
        transform: scale(1.5);
      }
    }

    &.active .card-icon {
      transform: scale(1.2);
      box-shadow: 0 6px 12px rgba(var(--el-color-primary-rgb), 0.2);
    }

    // 圆形形状的特殊处理
    &.shape-circle {
      .card-icon {
        top: -20px;
        width: 40px;
        height: 40px;
        padding: 8px;
      }
    }
  }
}

:deep(.dark) {
  .card-selector-item {
    background-color: var(--el-bg-color-overlay);

    &:hover {
      background-color: var(--el-bg-color);
    }

    &.active {
      background-color: var(--el-color-primary-dark-2);
      border-color: var(--el-color-primary);

      .card-label {
        color: var(--el-color-white);
      }
    }

    .card-icon {
      background-color: var(--el-bg-color-overlay);
      color: var(--el-color-primary);
    }

    &.active .card-icon {
      background-color: var(--el-color-primary-light-5);
      color: var(--el-color-white);
    }
  }
}

// ===== TechUI 主题 =====
.card-selector-item.theme-techui {
  background: linear-gradient(135deg, rgba(10, 20, 40, 0.95) 0%, rgba(20, 40, 80, 0.9) 100%);
  border: 1px solid rgba(0, 200, 255, 0.3);
  box-shadow:
    0 0 20px rgba(0, 200, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.5), transparent);
  }

  &::after {
    background: linear-gradient(90deg, rgba(0, 200, 255, 0.3), rgba(0, 255, 200, 0.6), rgba(0, 200, 255, 0.3));
    height: 2px;
  }

  .card-icon {
    background: linear-gradient(135deg, rgba(0, 200, 255, 0.2) 0%, rgba(0, 150, 200, 0.3) 100%);
    color: #00c8ff;
    border: 1px solid rgba(0, 200, 255, 0.3);
    box-shadow: 0 0 15px rgba(0, 200, 255, 0.2);
  }

  .card-label {
    color: rgba(200, 230, 255, 0.9);
    text-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
  }

  &:hover {
    border-color: rgba(0, 200, 255, 0.6);
    box-shadow:
      0 0 30px rgba(0, 200, 255, 0.2),
      0 8px 20px rgba(0, 0, 0, 0.3);

    .card-icon {
      box-shadow: 0 0 25px rgba(0, 200, 255, 0.4);
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(0, 80, 120, 0.95) 0%, rgba(0, 50, 80, 0.9) 100%);
    border-color: #00c8ff;
    box-shadow:
      0 0 40px rgba(0, 200, 255, 0.3),
      inset 0 0 30px rgba(0, 200, 255, 0.1);

    .card-icon {
      background: linear-gradient(135deg, #00c8ff 0%, #0090c0 100%);
      color: #fff;
      box-shadow: 0 0 30px rgba(0, 200, 255, 0.5);
    }

    .card-label {
      color: #fff;
      text-shadow: 0 0 15px rgba(0, 200, 255, 0.5);
    }
  }
}

// ===== Glass 玻璃主题 =====
.card-selector-item.theme-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .card-icon {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
  }

  .card-label {
    color: var(--el-text-color-primary);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: rgba(var(--el-color-primary-rgb), 0.2);
    border-color: var(--el-color-primary);

    .card-icon {
      background: var(--el-color-primary);
      color: #fff;
    }
  }
}
</style>
