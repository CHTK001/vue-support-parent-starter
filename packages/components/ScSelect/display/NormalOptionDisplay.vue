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
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    &.selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.15);
    }
  }
}

.option-text-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 10px;
  margin: 3px 4px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  background: var(--el-bg-color);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.08), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color-lighter) 100%);
    border-color: var(--el-border-color-lighter);
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &::before {
      left: 100%;
    }

    .option-checkbox {
      border-color: var(--el-color-primary-light-5);
    }
  }

  .option-item.selected & {
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.08) 0%, rgba(var(--el-color-primary-rgb), 0.04) 100%);
    border-color: var(--el-color-primary-light-5);
    border-left: 3px solid var(--el-color-primary);

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
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.35);
      animation: checkboxPop 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .option-info {
    flex: 1;
    min-width: 0;

    .option-label {
      font-size: 14px;
      color: var(--el-text-color-primary);
      line-height: 1.4;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .option-description {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      margin-top: 3px;
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
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-light) 100%);
  padding: 10px 12px;
  gap: 10px;
  transition: all 0.25s ease;

  &:hover {
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
  }

  .preview-image {
    width: 36px;
    height: 36px;
    object-fit: cover;
    display: block;
    border-radius: 8px;
    flex-shrink: 0;
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
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .selected-indicator {
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

@keyframes checkboxPop {
  0% {
    transform: scale(0.6);
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
