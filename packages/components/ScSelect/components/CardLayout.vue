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
    <!-- 选中标记 -->
    <div v-if="isSelected" class="card-check-mark">
      <IconRenderer icon="ri:check-line" />
    </div>

    <div class="card-icon">
      <IconRenderer :icon="icon || 'ri:settings-3-line'" />
    </div>
    <div class="card-label">{{ label }}</div>

    <!-- 底部装饰条 -->
    <div class="card-bottom-bar"></div>
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
    default: "default",
    validator: (value: string) => {
      return ["default", "primary", "success", "warning", "danger", "info"].includes(value);
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
  gap: 10px;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  height: auto;
  min-height: 110px;
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  justify-content: center;

  // 选中标记
  .card-check-mark {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--el-color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    z-index: 10;
    box-shadow: 0 2px 6px var(--el-color-primary-light-5);
    animation: checkMarkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  @keyframes checkMarkPop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  // 底部装饰条
  .card-bottom-bar {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary));
    border-radius: 3px 3px 0 0;
    transition: width 0.3s ease;
  }

  // 悬停效果
  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(255, 255, 255, 0.6) inset;
    border-color: var(--el-color-primary-light-5);
    background: rgba(255, 255, 255, 0.95);

    .card-bottom-bar {
      width: 50%;
    }

    .card-icon {
      transform: scale(1.08);
    }
  }

  // 激活状态
  &.active {
    border-color: var(--el-color-primary);
    background: linear-gradient(180deg, rgba(64, 158, 255, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
    backdrop-filter: blur(20px);
    box-shadow:
      0 8px 24px rgba(64, 158, 255, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.7) inset,
      inset 0 1px 0 rgba(255, 255, 255, 0.8);

    .card-bottom-bar {
      width: 70%;
    }

    .card-icon {
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: #fff;
      box-shadow: 0 4px 12px var(--el-color-primary-light-5);
    }

    .card-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  // 禁用状态
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background-color: var(--el-fill-color-light);
    border-color: var(--el-border-color-lighter);

    .card-icon {
      filter: grayscale(100%);
    }
  }

  // 图标样式
  .card-icon {
    color: var(--el-color-primary);
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 24px;
    z-index: 1;
  }

  // 标签样式
  .card-label {
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    line-height: 1.3;
    word-break: break-word;
    max-width: 100%;
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;
  }

  // 形状样式
  &.shape-circle {
    border-radius: 50%;
    aspect-ratio: 1;
    width: 110px !important;
    height: 110px !important;
    min-height: 110px;
    padding: 16px;

    .card-icon {
      border-radius: 50%;
    }

    .card-bottom-bar {
      display: none;
    }

    // 圆形选中标记位置调整
    .card-check-mark {
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      font-size: 12px;
    }
  }

  &.shape-rectangle {
    border-radius: 4px;

    .card-icon {
      border-radius: 8px;
    }
  }

  &.shape-rounded {
    border-radius: 14px;
  }

  // 图标在顶部模式
  &.icon-position-top {
    padding-top: 35px;
    margin-top: 28px;

    .card-icon {
      position: absolute;
      top: -28px;
      width: 56px;
      height: 56px;
      font-size: 26px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 3px solid var(--el-bg-color);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card-check-mark {
      top: 4px;
      right: 4px;
    }

    &:hover .card-icon {
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    &.active .card-icon {
      transform: scale(1.05);
      box-shadow: 0 6px 16px var(--el-color-primary-light-5);
    }

    // 圆形形状的特殊处理
    &.shape-circle {
      .card-icon {
        top: -22px;
        width: 44px;
        height: 44px;
        font-size: 20px;
        border-width: 2px;
      }
    }
  }
}

// 暗黑模式适配
:deep(.dark) {
  .card-selector-item {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color-light);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      background: var(--el-bg-color);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    &.active {
      background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.15) 0%, var(--el-bg-color-overlay) 100%);
      border-color: var(--el-color-primary);

      .card-label {
        color: var(--el-color-primary-light-3);
      }
    }

    .card-icon {
      background: rgba(var(--el-color-primary-rgb), 0.15);
      color: var(--el-color-primary-light-3);
    }

    &.active .card-icon {
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: #fff;
    }

    .card-check-mark {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }
  }
}

// ===== Theme Styles =====
.card-selector-item.theme-default {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  .card-icon {
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    color: var(--el-color-primary);
  }

  .card-label {
    color: var(--el-text-color-primary);
  }
}

.card-selector-item.theme-primary {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow:
    0 4px 16px rgba(64, 158, 255, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  .card-icon {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.1));
    color: var(--el-color-primary);
    border: 1px solid rgba(64, 158, 255, 0.3);
  }

  .card-label {
    color: var(--el-color-primary);
  }

  &.active {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 100%);
    border-color: var(--el-color-primary);

    .card-icon {
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: #fff;
    }
  }
}

.card-selector-item.theme-success {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(103, 194, 58, 0.2);
  box-shadow:
    0 4px 16px rgba(103, 194, 58, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  .card-icon {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.1));
    color: var(--el-color-success);
    border: 1px solid rgba(103, 194, 58, 0.3);
  }

  .card-label {
    color: var(--el-color-success);
  }

  &.active {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.2) 0%, rgba(103, 194, 58, 0.1) 100%);
    border-color: var(--el-color-success);

    .card-icon {
      background: linear-gradient(135deg, var(--el-color-success), var(--el-color-success-dark-2));
      color: #fff;
    }
  }
}

.card-selector-item.theme-warning {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(230, 162, 60, 0.05) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(230, 162, 60, 0.2);
  box-shadow:
    0 4px 16px rgba(230, 162, 60, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  .card-icon {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.1));
    color: var(--el-color-warning);
    border: 1px solid rgba(230, 162, 60, 0.3);
  }

  .card-label {
    color: var(--el-color-warning);
  }

  &.active {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.2) 0%, rgba(230, 162, 60, 0.1) 100%);
    border-color: var(--el-color-warning);

    .card-icon {
      background: linear-gradient(135deg, var(--el-color-warning), var(--el-color-warning-dark-2));
      color: #fff;
    }
  }
}

.card-selector-item.theme-danger {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.05) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(245, 108, 108, 0.2);
  box-shadow:
    0 4px 16px rgba(245, 108, 108, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  .card-icon {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.2), rgba(245, 108, 108, 0.1));
    color: var(--el-color-danger);
    border: 1px solid rgba(245, 108, 108, 0.3);
  }

  .card-label {
    color: var(--el-color-danger);
  }

  &.active {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.2) 0%, rgba(245, 108, 108, 0.1) 100%);
    border-color: var(--el-color-danger);

    .card-icon {
      background: linear-gradient(135deg, var(--el-color-danger), var(--el-color-danger-dark-2));
      color: #fff;
    }
  }
}

.card-selector-item.theme-info {
  background: linear-gradient(135deg, rgba(144, 147, 168, 0.1) 0%, rgba(144, 147, 168, 0.05) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(144, 147, 168, 0.2);
  box-shadow:
    0 4px 16px rgba(144, 147, 168, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  .card-icon {
    background: linear-gradient(135deg, rgba(144, 147, 168, 0.2), rgba(144, 147, 168, 0.1));
    color: var(--el-color-info);
    border: 1px solid rgba(144, 147, 168, 0.3);
  }

  .card-label {
    color: var(--el-color-info);
  }

  &.active {
    background: linear-gradient(135deg, rgba(144, 147, 168, 0.2) 0%, rgba(144, 147, 168, 0.1) 100%);
    border-color: var(--el-color-info);

    .card-icon {
      background: linear-gradient(135deg, var(--el-color-info), var(--el-color-info-dark-2));
      color: #fff;
    }
  }
}
</style>
