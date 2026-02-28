<template>
  <div ref="dropdownRef" class="dropdown-selector" :class="{ open: isOpen, 'direction-horizontal': dropdownDirection === 'horizontal' }">
    <el-popover
      v-model:visible="isOpen"
      :placement="popoverPlacement"
      :width="popoverWidth"
      trigger="click"
      :popper-class="popoverClass"
      :show-arrow="false"
      :offset="8"
      :teleported="true"
      :z-index="41000"
      :popper-options="popoverOptions"
    >
      <template #reference>
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
      </template>

      <!-- 下拉面板内容 -->
      <div
        class="dropdown-panel-content !overflow-hidden"
        :class="{
          'panel-horizontal': dropdownDirection === 'horizontal',
          'panel-cols-2': dropdownCol === 2,
          'panel-cols-3': dropdownCol === 3,
          'panel-cols-4': dropdownCol === 4,
          'panel-cols-5': dropdownCol === 5,
          'panel-cols-6': dropdownCol === 6,
          'panel-large-mode': displayMode === 'large'
        }"
      >
        <div v-if="title" class="panel-title">{{ title }}</div>
        <!-- 面板顶部自定义内容插槽 -->
        <slot name="header" :item="currentSelectedData" :selectedValues="modelValue" />
        <!-- 当前选择数据展示插槽 -->
        <slot name="summary" :item="currentSelectedData" :selectedValues="modelValue" :selectedCount="currentSelectedData.length" />
        <div class="options-grid thin-scroller overflow-y-auto ss" :class="{ 'has-preview': hasPreviewOptions }" :style="getStyle">
          <template v-if="displayMode === 'large'">
            <LargeOptionDisplay
              v-for="option in options"
              :key="option.value"
              :option="option"
              :is-selected="isSelected(option.value)"
              :is-item-disabled="isItemDisabled(option.value)"
              @select="selectOption"
            >
              <template #content="{ option: slotOption, isSelected: slotIsSelected }">
                <slot name="content" :option="slotOption" :item="currentSelectedData" :selectedValues="modelValue" :isSelected="slotIsSelected" />
              </template>
            </LargeOptionDisplay>
          </template>
          <template v-else>
            <NormalOptionDisplay
              v-for="option in options"
              :key="option.value"
              :option="option"
              :is-selected="isSelected(option.value)"
              :is-item-disabled="isItemDisabled(option.value)"
              @select="selectOption"
            >
              <template #content="{ option: slotOption, isSelected: slotIsSelected }">
                <slot name="content" :option="slotOption" :item="currentSelectedData" :selectedValues="modelValue" :isSelected="slotIsSelected" />
              </template>
            </NormalOptionDisplay>
          </template>
        </div>
        <!-- 面板底部自定义内容插槽 -->
        <slot name="footer" :item="currentSelectedData" :selectedValues="modelValue" />
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import LargeOptionDisplay from "../display/LargeOptionDisplay.vue";
import NormalOptionDisplay from "../display/NormalOptionDisplay.vue";
import IconRenderer from "./IconRenderer.vue";

export interface DropdownOption {
  label?: string;
  name?: string;
  describe?: string;
  description?: string;
  value: string | number;
  icon?: string;
  image: ImageOption;
  preview?: string;
}

export interface ImageOption {
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
  width: {
    type: String,
    default: "120px"
  },
  height: {
    type: String,
    default: "600px"
  },
  // 是否让下拉面板宽度跟随触发器宽度，默认开启
  matchTriggerWidth: {
    type: Boolean,
    default: true
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
  },
  dropdownCol: {
    type: Number,
    default: 6,
    validator: (value: number) => {
      return value > 0 && value <= 6;
    }
  },
  displayMode: {
    type: String,
    default: "normal",
    validator: (value: string) => {
      return ["normal", "large"].includes(value);
    }
  }
});

const emit = defineEmits(["select"]);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

// 检测是否有预览选项
const hasPreviewOptions = computed(() => {
  return props.options.some(option => option.preview);
});

// el-popover 相关计算属性
// 说明：默认使用 bottom-start（向下展开），避免控件位于容器顶部时面板弹出到可视区域之外导致“看起来没有下拉”
const popoverPlacement = computed(() => {
  return "bottom";
});

const popoverOptions = computed(() => {
  return {
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 8
        }
      },
      {
        name: "flip",
        options: {
          padding: 8
        }
      }
    ]
  };
});

const popoverWidth = computed(() => {
  if (props.matchTriggerWidth && dropdownRef.value) {
    const triggerWidth = dropdownRef.value.offsetWidth;
    // 让下拉面板整体比触发器稍窄一些，视觉上更“收紧”
    const narrowedWidth = Math.round(triggerWidth * 0.86);
    return `${narrowedWidth}px`;
  }
  return props.width;
});

const getStyle = computed(() => {
  return {
    height: props.height
  };
});

const popoverClass = computed(() => {
  const classes = ["sc-select-popover"];
  if (props.dropdownDirection === "horizontal") {
    classes.push("popover-horizontal");
  }
  if (props.displayMode === "large") {
    classes.push("popover-large-mode");
  }
  return classes.join(" ");
});

// 计算当前选择的数据
const currentSelectedData = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    //@ts-ignore
    return props.options.filter(option => props.modelValue?.includes(option.value));
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
</script>

<style lang="scss" scoped>
.dropdown-selector {
  position: relative;
  display: inline-block;
  width: 100%;

  &.direction-horizontal {
    max-width: 600px;

    .dropdown-panel {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 0;
      right: auto;
      width: auto;
      min-width: 400px;
      max-width: 600px;
    }
  }
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: var(--el-bg-color);
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 44px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;

  // 底部装饰条
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary));
    border-radius: 2px 2px 0 0;
    transition: width 0.3s ease;
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);

    &::after {
      width: 40%;
    }

    .dropdown-icon {
      transform: scale(1.1);
    }
  }

  &:active {
    transform: translateY(0);
  }

  .dropdown-icon {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    color: var(--el-color-primary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .dropdown-text {
    flex: 1;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-arrow {
    width: 18px;
    height: 18px;
    color: var(--el-text-color-placeholder);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-left: 8px;

    &.rotated {
      transform: rotate(180deg);
      color: var(--el-color-primary);
    }
  }
}

.dropdown-panel-content {
  overflow-y: auto;
  padding: 8px 0 8px;
  animation: panelFadeIn 0.25s ease-out;

  .panel-title {
    padding: 14px 16px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-lighter));
    margin: -12px -12px 12px -12px;
    border-radius: 10px 10px 0 0;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      width: 4px;
      height: 16px;
      background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 2px;
    }
  }
  .ss {
    height: 260px;
  }
  .options-grid {
    display: grid;
    grid-template-columns: 1fr;
    align-content: start;
    gap: 6px;
    padding: 0 8px 8px;

    &.has-preview {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
    }
  }

  @keyframes panelFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 多列布局支持（仅在垂直方向时生效）
  &:not(.panel-horizontal) {
    &.panel-cols-2 .options-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    &.panel-cols-3 .options-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    &.panel-cols-4 .options-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    &.panel-cols-5 .options-grid {
      grid-template-columns: repeat(5, 1fr);
    }
    &.panel-cols-6 .options-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  // 水平方向布局
  &.panel-horizontal {
    left: 0;
    right: auto;
    width: auto;
    min-width: 400px;
    max-width: 800px;

    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      width: 100%;
      overflow-y: auto;

      &.has-preview {
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      }

      .option-item {
        min-width: 120px;
        white-space: nowrap;

        &.preview-item {
          min-width: 100px;
          width: 100px;
        }
      }
    }

    // 水平布局的多列支持
    &.panel-cols-2 .options-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    &.panel-cols-3 .options-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    &.panel-cols-4 .options-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    &.panel-cols-5 .options-grid {
      grid-template-columns: repeat(5, 1fr);
    }
    &.panel-cols-6 .options-grid {
      grid-template-columns: repeat(6, 1fr);
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

  // 选项样式现在由独立的展示组件处理

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
    box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
    background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);

    &::after {
      width: 60%;
    }

    .dropdown-icon {
      color: var(--el-color-primary);
    }
  }
}

// 动画关键帧
@keyframes dropdownSlideUp {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
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

// el-popover 全局样式
:global(.sc-select-popover) {
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 14px !important;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.06) !important;
  backdrop-filter: blur(12px);
  padding: 0 !important;
  overflow: hidden;

  &.popover-horizontal {
    min-width: 400px !important;
    max-width: 800px !important;
  }

  &.popover-large-mode {
    min-width: 300px !important;
  }
}

// 暗黑模式适配
:deep(.el-dark) {
  .dropdown-selector {
    .dropdown-trigger {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

      &:hover {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);
      }
    }

    .dropdown-panel-content {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color);
    }
  }
}

// 暗黑模式下的 el-popover 样式
:global(.el-dark .sc-select-popover) {
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color) !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2) !important;
}
</style>
