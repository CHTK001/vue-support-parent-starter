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
  gap: 10px;
  padding: 20px 16px;
  background: var(--el-bg-color);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--el-border-color-lighter);
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
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: var(--el-color-primary-light-5);

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
    background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
    box-shadow: 
      0 4px 16px var(--el-color-primary-light-7),
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

// ===== TechUI 主题 =====
.card-selector-item.theme-techui {
  background: linear-gradient(135deg, rgba(10, 20, 40, 0.95) 0%, rgba(20, 40, 80, 0.9) 100%);
  border: 1px solid rgba(0, 200, 255, 0.3);
  box-shadow:
    0 0 20px rgba(0, 200, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  // 选中标记
  .card-check-mark {
    background: linear-gradient(135deg, #00c8ff, #00a0d0);
    box-shadow: 0 0 12px rgba(0, 200, 255, 0.5);
  }

  // 底部装饰条
  .card-bottom-bar {
    background: linear-gradient(90deg, rgba(0, 200, 255, 0.3), #00c8ff, rgba(0, 200, 255, 0.3));
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

    .card-bottom-bar {
      width: 50%;
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(0, 80, 120, 0.95) 0%, rgba(0, 50, 80, 0.9) 100%);
    border-color: #00c8ff;
    box-shadow:
      0 0 40px rgba(0, 200, 255, 0.3),
      inset 0 0 30px rgba(0, 200, 255, 0.1);

    .card-bottom-bar {
      width: 70%;
    }

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

  // 选中标记
  .card-check-mark {
    background: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(5px);
  }

  // 底部装饰条
  .card-bottom-bar {
    background: linear-gradient(90deg, 
      rgba(var(--el-color-primary-rgb), 0.3), 
      var(--el-color-primary), 
      rgba(var(--el-color-primary-rgb), 0.3)
    );
  }

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
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);

    .card-bottom-bar {
      width: 50%;
    }
  }

  &.active {
    background: rgba(var(--el-color-primary-rgb), 0.2);
    border-color: var(--el-color-primary);

    .card-bottom-bar {
      width: 70%;
    }

    .card-icon {
      background: var(--el-color-primary);
      color: #fff;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}
</style>
