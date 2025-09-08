<template>
  <div class="dropdown-selector" :class="{ open: isOpen, 'direction-horizontal': dropdownDirection === 'horizontal' }" @click="toggleDropdown">
    <!-- 触发按钮 -->
    <div class="dropdown-trigger">
      <div class="dropdown-icon">
        <IconRenderer :icon="icon || 'ri:settings-3-line'" />
      </div>
      <span class="dropdown-text">{{ currentDisplayText }}</span>
      <div class="dropdown-arrow" :class="{ rotated: isOpen }">
        <IconRenderer icon="ri:arrow-down-s-line" />
      </div>
    </div>

    <!-- 下拉面板 -->
    <div v-if="isOpen" class="dropdown-panel thin-scroller" :class="{ 'panel-horizontal': dropdownDirection === 'horizontal' }">
      <div v-if="title" class="panel-title">{{ title }}</div>
      <!-- 面板顶部自定义内容插槽 -->
      <slot name="header" :item="currentSelectedData" :selectedValues="modelValue" />
      <!-- 当前选择数据展示插槽 -->
      <slot name="summary" :item="currentSelectedData" :selectedValues="modelValue" :selectedCount="currentSelectedData.length" />
      <div class="options-grid" :class="{ 'has-preview': hasPreviewOptions }">
        <div
          v-for="option in options"
          :key="option.value"
          class="option-item"
          :class="{ selected: isSelected(option.value), disabled: isItemDisabled(option.value), 'preview-item': option.preview }"
          @click.stop="selectOption(option.value)"
        >
          <div v-if="option.preview || option.icon" class="option-preview-card flex flex-row gap-1">
            <!-- 自定义内容插槽 -->
            <slot name="content" :option="option" :item="currentSelectedData" :selectedValues="modelValue" :isSelected="isSelected(option.value)">
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
                <el-tooltip :content="option.label || option.describe || option.name">
                  {{ option.label || option.describe || option.name }}
                </el-tooltip>
              </div>
              <div v-if="isSelected(option.value)" class="selected-indicator">
                <IconRenderer icon="ri:check-line" />
              </div>
            </div>
          </div>
          <div v-else class="option-text-item">
            <div class="option-checkbox">
              <div v-if="isSelected(option.value)" class="checkbox-checked">
                <IconRenderer icon="ri:check-line" />
              </div>
            </div>
            <div class="option-info">
              <!-- 文本选项自定义内容插槽 -->
              <slot name="content" :option="option" :item="currentSelectedData" :selectedValues="modelValue" :isSelected="isSelected(option.value)">
                <div class="option-label">{{ option.label || option.describe || option.name }}</div>
                <div v-if="option.description" class="option-description">{{ option.description }}</div>
              </slot>
            </div>
          </div>
        </div>
      </div>
      <!-- 面板底部自定义内容插槽 -->
      <slot name="footer" :item="currentSelectedData" :selectedValues="modelValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, onMounted, onUnmounted, ref } from "vue";
import IconRenderer from "./IconRenderer.vue";

interface DropdownOption {
  label?: string;
  name?: string;
  describe?: string;
  description?: string;
  value: string | number;
  icon?: string;
  image: ImageOption;
  preview?: string;
}

interface ImageOption {
  width: string;
  height: string;
}

const props = defineProps({
  options: {
    type: Array as () => DropdownOption[],
    required: true
  },
  modelValue: {
    type: [String, Number, Array],
    default: ""
  },
  multiple: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: "ri:settings-3-line"
  },
  title: {
    type: String,
    default: ""
  },
  placeholder: {
    type: String,
    default: "请选择"
  },
  isSelected: {
    type: Function,
    required: true
  },
  isItemDisabled: {
    type: Function,
    required: true
  },
  dropdownDirection: {
    type: String,
    default: "vertical",
    validator: (value: string) => {
      return ["vertical", "horizontal"].includes(value);
    }
  }
});

const emit = defineEmits(["select"]);

const isOpen = ref(false);

// 检测是否有预览选项
const hasPreviewOptions = computed(() => {
  return props.options.some(option => option.preview);
});

// 计算当前选择的数据
const currentSelectedData = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.options.filter(option => props.modelValue.includes(option.value));
  } else {
    const selectedOption = props.options.find(option => option.value === props.modelValue);
    return selectedOption ? [selectedOption] : [];
  }
});

// 计算当前显示文本
const currentDisplayText = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    if (props.modelValue.length === 0) {
      return props.placeholder;
    }
    if (props.modelValue.length === 1) {
      const selectedOption = props.options.find(option => option.value === props.modelValue[0]);
      return selectedOption?.label || selectedOption?.describe || selectedOption?.name || props.placeholder;
    }
    return `已选择 ${props.modelValue.length} 项`;
  } else {
    const selectedOption = props.options.find(option => option.value === props.modelValue);
    return selectedOption?.label || selectedOption?.describe || selectedOption?.name || props.placeholder;
  }
});

// 切换下拉框
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// 选择选项
const selectOption = (value: string | number) => {
  emit("select", value);
  if (!props.multiple) {
    isOpen.value = false;
  }
};

// 点击外部关闭下拉框
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".dropdown-selector")) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.dropdown-selector {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 300px;

  &.direction-horizontal {
    max-width: 600px;
  }
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .dropdown-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    color: var(--el-text-color-regular);
  }

  .dropdown-text {
    flex: 1;
    color: var(--el-text-color-primary);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-arrow {
    width: 16px;
    height: 16px;
    color: var(--el-text-color-placeholder);
    transition: transform 0.2s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.dropdown-panel {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;

  .panel-title {
    padding: 12px 16px 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .options-grid {
    padding: 8px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;

    &.has-preview {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }
  }

  // 水平方向布局
  &.panel-horizontal {
    .options-grid {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 8px 12px;
      gap: 8px;
      max-width: 600px;

      &.has-preview {
        gap: 12px;
      }

      .option-item {
        flex-shrink: 0;
        min-width: 120px;

        &.preview-item {
          min-width: 100px;
          width: 100px;
        }
      }
    }

    /* 水平滚动条样式 */
    .options-grid::-webkit-scrollbar {
      height: 6px;
      width: auto;
    }

    .options-grid::-webkit-scrollbar-track {
      background: var(--el-fill-color-lighter);
      border-radius: 3px;
    }

    .options-grid::-webkit-scrollbar-thumb {
      background: var(--el-fill-color-dark);
      border-radius: 3px;

      &:hover {
        background: var(--el-fill-color-darker);
      }
    }
  }

  .option-item {
    cursor: pointer;
    transition: all 0.2s ease;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
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
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    .option-item.selected & {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    .option-checkbox {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      .checkbox-checked {
        width: 16px;
        height: 16px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
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

    .option-preview-card {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: row;
      aspect-ratio: 4/3;
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
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: white;
        padding: 8px;
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        align-items: flex-end;

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
          color: white;
          font-size: 12px;
        }
      }
    }

    .option-preview {
      margin-left: 8px;

      .preview-image {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        border: 2px solid var(--el-border-color-light);
        box-shadow: var(--el-box-shadow-light);
      }
    }
  }

  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-fill-color-dark);
    border-radius: 3px;

    &:hover {
      background: var(--el-fill-color-darker);
    }
  }
}

.open {
  .dropdown-trigger {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }
}

// 暗黑模式适配
:deep(.el-dark) {
  .dropdown-selector {
    .dropdown-trigger {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color);
    }

    .dropdown-panel {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color);
    }

    .option-item {
      &:hover {
        background-color: var(--el-bg-color-overlay);
      }

      &.selected {
        background-color: var(--el-color-primary-dark-2);
        color: var(--el-color-primary-light-3);
      }
    }
  }
}
</style>
