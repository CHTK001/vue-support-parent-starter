<template>
  <div class="option-item" :class="{ selected: isSelected, disabled: isItemDisabled, 'preview-item': option.preview }" @click.stop="$emit('select', option.value)">
    <div v-if="option.preview || option.icon" class="option-preview-card flex flex-row gap-1 p-4 m-3">
      <!-- 自定义内容插槽 -->
      <slot name="content" :option="option" :isSelected="isSelected">
        <img
          :src="option.preview || option.icon"
          :alt="option.label"
          class="preview-image"
          :style="{
            width: option?.image?.width || '20px',
            height: option?.image?.height || '20px'
          }"
        />
      </slot>
      <div class="option-overlay flex flex-row">
        <div class="option-label truncate">
          <el-tooltip :content="option.description || option.name">
            {{ option.label || option.name }}
          </el-tooltip>
        </div>
        <div v-if="isSelected" class="selected-indicator">
          <IconRenderer icon="ri:check-line" />
        </div>
      </div>
    </div>
    <div v-else class="option-text-item">
      <div class="option-info">
        <!-- 文本选项自定义内容插槽 -->
        <slot name="content" :option="option" :isSelected="isSelected">
          <div class="option-label">{{ option.label || option.describe || option.name }}</div>
          <div v-if="option.description" class="option-description truncate !max-w-[100px]">{{ option.description }}</div>
        </slot>
      </div>
      <div class="option-checkbox">
        <div v-if="isSelected" class="checkbox-checked">
          <IconRenderer icon="ri:check-line" />
        </div>
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
.option-item {
  cursor: pointer;
  transition: all 0.2s ease;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;

    .option-text-item {
      background: var(--el-fill-color-lighter);

      .option-label {
        color: var(--el-text-color-disabled);
        text-decoration: line-through;
      }
    }
  }

  &.preview-item {
    border-radius: 8px;
    overflow: hidden;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.selected {
      box-shadow: 0 0 0 2px var(--el-color-primary);
    }
  }
}

.option-text-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 2px 4px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background-color: var(--el-fill-color-light);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &::before {
      left: 100%;
    }
  }

  .option-item.selected & {
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    color: var(--el-color-primary);
    border-left: 3px solid var(--el-color-primary);
    font-weight: 500;
  }

  .option-checkbox {
    width: 22px;
    height: 22px;
    margin-left: auto;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid transparent;
    border-radius: 50%;
    transition: all 0.2s ease;

    .checkbox-checked {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      border: none;
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.4);
      animation: checkboxPop 0.2s ease;
    }
  }

  .option-info {
    flex: 1;

    .option-label {
      font-size: 14px;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .option-description {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 2px;
      line-height: 1.3;
    }
  }
}

.option-preview-card {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: row;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .option-overlay {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    gap: 10px;

    .option-label {
      font-size: 12px;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    .selected-indicator {
      width: 20px;
      height: 20px;
      background-color: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-primary);
      font-size: 12px;
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
