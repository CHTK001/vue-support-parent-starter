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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

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
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    &.selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 16px var(--el-color-primary-light-7);
    }
  }
}

.option-text-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  margin: 2px 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid transparent;
  background: var(--el-bg-color);

  // 左侧装饰条
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 0 3px 3px 0;
    transition: height 0.25s ease;
  }

  &:hover {
    background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-light) 100%);
    border-color: var(--el-border-color-lighter);

    &::before {
      height: 50%;
    }

    .option-checkbox {
      border-color: var(--el-color-primary-light-5);
    }
  }

  .option-item.selected & {
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, rgba(var(--el-color-primary-rgb), 0.04) 100%);
    border-color: var(--el-color-primary-light-5);

    &::before {
      height: 70%;
    }

    .option-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  .option-checkbox {
    width: 20px;
    height: 20px;
    margin-left: auto;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--el-border-color-light);
    border-radius: 50%;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--el-bg-color);

    .checkbox-checked {
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
      border: none;
      box-shadow: 0 2px 8px var(--el-color-primary-light-5);
      animation: checkboxPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  }

  .option-info {
    flex: 1;
    min-width: 0;

    .option-label {
      font-size: 13px;
      color: var(--el-text-color-primary);
      line-height: 1.4;
      font-weight: 500;
      transition: all 0.25s ease;
    }

    .option-description {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
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
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  padding: 10px 14px;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-lighter);
    transform: translateX(4px);
  }

  .option-item.selected & {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .preview-image {
    width: 40px;
    height: 40px;
    object-fit: cover;
    display: block;
    border-radius: 10px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease;
  }

  &:hover .preview-image {
    transform: scale(1.05);
  }

  .option-overlay {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 10px;

    .option-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.25s ease;
    }

    .option-item.selected & .option-label {
      color: var(--el-color-primary);
      font-weight: 600;
    }

    .selected-indicator {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px var(--el-color-primary-light-5);
      animation: checkboxPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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

// 暗色模式适配
:global(html.dark) {
  .option-text-item {
    background: var(--el-fill-color-darker);

    &:hover {
      background: linear-gradient(135deg, var(--el-fill-color-dark) 0%, var(--el-fill-color-darker) 100%);
    }
  }

  .option-preview-card {
    background: linear-gradient(135deg, var(--el-fill-color-dark) 0%, var(--el-fill-color-darker) 100%);

    &:hover {
      background: linear-gradient(135deg, var(--el-fill-color) 0%, var(--el-fill-color-dark) 100%);
    }
  }
}
</style>
