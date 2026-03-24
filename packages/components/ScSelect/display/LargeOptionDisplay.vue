<template>
  <div class="option-item large-mode" :class="{ selected: isSelected, disabled: isItemDisabled }" @click.stop="$emit('select', option.value)">
    <div v-if="option.preview || option.icon" class="option-preview-card">
      <!-- 选中指示器 -->
      <div v-if="isSelected" class="selected-indicator">
        <IconRenderer icon="ri:check-line" />
      </div>
      <!-- 自定义内容插槽 -->
      <slot name="content" :option="option" :isSelected="isSelected">
        <img :src="option.preview || option.icon" :alt="option.label" class="preview-image" />
      </slot>
      <div class="option-overlay">
        <div class="option-label">
          <el-tooltip :content="option.label || option.describe || option.name">
            {{ option.label || option.describe || option.name }}
          </el-tooltip>
        </div>
      </div>
    </div>
    <div v-else class="option-text-item large-text">
      <div v-if="isSelected" class="option-checkbox">
        <div class="checkbox-checked">
          <IconRenderer icon="ri:check-line" />
        </div>
      </div>
      <div class="option-info">
        <!-- 文本选项自定义内容插槽 -->
        <slot name="content" :option="option" :isSelected="isSelected">
          <div class="option-label">{{ option.label || option.describe || option.name }}</div>
          <div v-if="option.description" class="option-description">{{ option.description }}</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconRenderer from "../components/IconRenderer.vue";

export interface DropdownOption {
  label?: string;
  name?: string;
  describe?: string;
  description?: string;
  value: string | number;
  icon?: string;
  image?: {
    width: string;
    height: string;
  };
  preview?: string;
}

defineProps<{
  option: DropdownOption;
  isSelected: boolean;
  isItemDisabled: boolean;
}>();

defineEmits<{
  select: [value: string | number];
}>();
</script>

<style lang="scss" scoped>
.option-item.large-mode {
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .option-preview-card {
    position: relative;
    padding: 0;
    border-radius: 14px;
    border: 2px solid var(--el-border-color-lighter);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--el-bg-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-primary-light-5);

      .preview-image {
        transform: scale(1.03);
      }
    }

    .preview-image {
      width: 100% !important;
      height: 180px !important;
      border-radius: 12px 12px 0 0;
      object-fit: cover;
      position: relative;
      transition: transform 0.4s ease;
    }

    .option-overlay {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 14px;
      background: var(--el-bg-color);

      .option-label {
        font-size: 13px;
        font-weight: 500;
        text-align: center;
        color: var(--el-text-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: all 0.25s ease;
      }
    }

    .selected-indicator {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 26px;
      height: 26px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
      box-shadow: 0 4px 12px var(--el-color-primary-light-5);
      z-index: 10;
      animation: indicatorPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  }

  &.selected .option-preview-card {
    border-color: var(--el-color-primary);
    box-shadow: 0 6px 20px var(--el-color-primary-light-7);

    .option-overlay {
      background: linear-gradient(180deg, var(--el-color-primary-light-9), var(--el-bg-color));

      .option-label {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }

  .option-text-item.large-text {
    display: flex;
    align-items: center;
    padding: 16px 18px;
    border-radius: 12px;
    margin: 4px 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color-lighter);

    // 左侧装饰条
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 0;
      background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 0 4px 4px 0;
      transition: height 0.3s ease;
    }

    &:hover {
      background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-light) 100%);
      border-color: var(--el-color-primary-light-5);

      &::before {
        height: 50%;
      }

      .option-checkbox {
        border-color: var(--el-color-primary-light-5);
      }
    }

    .option-checkbox {
      width: 24px;
      height: 24px;
      margin-right: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--el-border-color-light);
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--el-bg-color);

      .checkbox-checked {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 14px;
        border: none;
        box-shadow: 0 3px 10px var(--el-color-primary-light-5);
        animation: checkboxPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
    }

    .option-info {
      flex: 1;

      .option-label {
        font-size: 15px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        line-height: 1.4;
        transition: all 0.25s ease;
      }

      .option-description {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
        line-height: 1.3;
      }
    }
  }

  &.selected .option-text-item.large-text {
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 16px var(--el-color-primary-light-7);

    &::before {
      height: 70%;
    }

    .option-info .option-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

@keyframes checkboxPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes indicatorPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
