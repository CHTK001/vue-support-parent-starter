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
      <div class="option-checkbox">
        <div v-if="isSelected" class="checkbox-checked">
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .option-preview-card {
    position: relative;
    padding: 0;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--el-bg-color-overlay);
    display: flex;
    flex-direction: column;
    overflow: visible;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border-color: var(--el-color-primary-light-5);
    }

    .preview-image {
      width: 100% !important;
      height: 185px !important;
      border-radius: 12px;
      object-fit: cover;
      position: relative;
    }

    .option-overlay {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--el-bg-color-overlay);
      border-radius: 12px 12px 12px 12px;

      .option-label {
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        flex: 1;
        position: absolute;
        bottom: 0;
        width: 100%;
        color: var(--el-text-color-primary);
        background: linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%);
      }
    }

    .selected-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: var(--el-color-primary);
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-primary);
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 10;
    }
  }

  &.selected .option-preview-card {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.3);

    .option-overlay {
      background: var(--el-color-primary-light-9);

      .option-label {
        color: var(--el-color-primary);
      }
    }
  }

  .option-text-item.large-text {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-radius: 12px;
    margin: 4px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
    border: 2px solid transparent;

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary-light-5);
    }

    .option-checkbox {
      width: 22px;
      height: 22px;
      margin-right: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--el-border-color);
      border-radius: 6px;
      transition: all 0.2s ease;

      .checkbox-checked {
        width: 22px;
        height: 22px;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-primary);
        font-size: 14px;
        border: none;
        box-shadow: 0 2px 4px rgba(var(--el-color-primary-rgb), 0.3);
        animation: checkboxPop 0.2s ease;
      }
    }

    .option-info {
      flex: 1;

      .option-label {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        line-height: 1.4;
      }

      .option-description {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
        line-height: 1.3;
      }
    }
  }

  &.selected .option-text-item.large-text {
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.3);

    .option-info .option-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

@keyframes checkboxPop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
