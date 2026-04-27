<template>
  <div class="sc-select-list-item">
    <ScPopover
      v-model:visible="isOpen"
      placement="top"
      trigger="click"
      popper-class="sc-select-list-item-popper"
      :offset="8"
      :teleported="true"
      :show-arrow="true"
      :width="panelWidth"
    >
      <template #reference>
        <div class="sc-select-list-item__trigger" :class="{ 'is-button-mode': selectButton }" role="button" tabindex="0">
          <template v-if="selectButton">
            <ScButton circle class="sc-select-list-item__trigger-btn">
              <IconRenderer :icon="currentTriggerIcon" />
            </ScButton>
            <span v-if="selectShowValue" class="sc-select-list-item__trigger-value">{{ currentDisplayText }}</span>
          </template>
          <template v-else>
            <span class="sc-select-list-item__trigger-text">{{ currentDisplayText }}</span>
            <IconRenderer icon="ri:arrow-down-s-line" class="sc-select-list-item__trigger-arrow" :class="{ 'is-open': isOpen }" />
          </template>
        </div>
      </template>

      <div class="sc-select-list-item__dropdown">
        <div v-if="$slots.top" class="sc-select-list-item__top">
          <slot name="top" :options="filteredOptions" />
        </div>
        <div v-if="showSearch" class="sc-select-list-item__toolbar">
          <ScInput
            v-model="searchQuery"
            size="small"
            clearable
            :placeholder="placeholder"
            class="sc-select-list-item__search"
          >
            <template #prefix>
              <IconRenderer icon="ri:search-line" />
            </template>
          </ScInput>
        </div>

        <div v-if="multiple && showBatchActions" class="sc-select-list-item__actions">
          <ScButton size="small" text @click="emit('selectAll')">全选</ScButton>
          <ScButton size="small" text @click="emit('invertSelection')">反选</ScButton>
          <ScButton size="small" text @click="emit('clearSelection')">清空</ScButton>
        </div>

        <div
          class="sc-select-list-item__panel thin-scroller overflow-y-auto ss"
          :style="{
            maxHeight: height,
            '--sc-list-item-columns': String(columnCount)
          }"
        >
          <button
            v-for="option in filteredOptions"
            :key="option.value"
            type="button"
            class="sc-select-list-item__item"
            :class="{
              'is-selected': isSelected(option.value),
              'is-disabled': isItemDisabled(option.value),
              'is-no-borde': !borde
            }"
            :disabled="isItemDisabled(option.value)"
            @mousedown.stop.prevent
            @click.stop.prevent="handleSelect(option.value)"
          >
            <div class="sc-select-list-item__check" :class="{ 'is-visible': isSelected(option.value) }" aria-hidden="true">
              <IconRenderer icon="ri:check-line" />
            </div>
            <slot name="content" :option="option" :isSelected="isSelected(option.value)">
              <div class="sc-select-list-item__icon">
                <slot name="icon" :option="option" :isSelected="isSelected(option.value)">
                  <IconRenderer :icon="option.icon || 'ri:cpu-line'" />
                </slot>
              </div>
              <div class="sc-select-list-item__title">
                {{ option.label || option.name || option.describe || option.value }}
              </div>
            </slot>
          </button>

          <div v-if="filteredOptions.length === 0" class="sc-select-list-item__empty">
            {{ emptyText }}
          </div>
        </div>
      </div>
    </ScPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ScButton } from "../../ScButton";
import { ScInput } from "../../ScInput";
import { ScPopover } from "../../ScPopover";
import IconRenderer from "./IconRenderer.vue";

interface ListItemOption {
  label?: string;
  name?: string;
  describe?: string;
  value: string | number;
  icon?: string;
  preview?: string;
}

const props = defineProps({
  options: {
    type: Array as () => ListItemOption[],
    required: true
  },
  height: {
    type: String,
    default: "420px"
  },
  placeholder: {
    type: String,
    default: "搜索选项"
  },
  emptyText: {
    type: String,
    default: "暂无可选项"
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: false
  },
  showBatchActions: {
    type: Boolean,
    default: false
  },
  borde: {
    type: Boolean,
    default: true
  },
  selectButton: {
    type: Boolean,
    default: false
  },
  selectIcon: {
    type: String,
    default: "ri:list-check-2"
  },
  selectShowValue: {
    type: Boolean,
    default: true
  },
  rowNum: {
    type: Number,
    default: 6
  },
  isSelected: {
    type: Function,
    required: true
  },
  isItemDisabled: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(["select", "selectAll", "invertSelection", "clearSelection"]);

const searchQuery = ref("");
const isOpen = ref(false);

const filteredOptions = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return props.options;
  return props.options.filter((option) => {
    const haystacks = [option.label, option.name, option.describe, option.value]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());
    return haystacks.some((item) => item.includes(keyword));
  });
});

const currentDisplayText = computed(() => {
  if (props.multiple) {
    const selectedCount = props.options.filter((option) => props.isSelected(option.value)).length;
    return selectedCount > 0 ? `已选择 ${selectedCount} 项` : props.placeholder;
  }
  const selected = props.options.find((option) => props.isSelected(option.value));
  return selected?.label || selected?.name || selected?.describe || String(selected?.value ?? "") || props.placeholder;
});

const currentTriggerIcon = computed(() => {
  const selected = props.options.find((option) => props.isSelected(option.value));
  return selected?.icon || selected?.preview || props.selectIcon || "ri:list-check-2";
});

const resolvedRowNum = computed(() => {
  const raw = Number(props.rowNum);
  if (!Number.isFinite(raw)) return 6;
  return Math.max(1, Math.floor(raw));
});

const columnCount = computed(() => {
  const visibleCount = Math.max(1, filteredOptions.value.length);
  return Math.min(resolvedRowNum.value, visibleCount);
});

const panelWidth = computed(() => {
  const itemWidth = 72;
  const gap = 10;
  // ScPopover 内容容器左右存在内边距，需计入总宽度避免被挤压
  const popoverHorizontalPadding = 24;
  return columnCount.value * itemWidth + (columnCount.value - 1) * gap + popoverHorizontalPadding;
});

const handleSelect = (value: string | number) => {
  emit("select", value);
  if (!props.multiple) {
    isOpen.value = false;
  }
};
</script>

<style lang="scss" scoped>
.sc-select-list-item {
  width: 100%;
}

.sc-select-list-item__trigger {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  cursor: pointer;

  &.is-button-mode {
    border: none;
    background: transparent;
    padding: 0;
    gap: 4px;
  }
}

.sc-select-list-item__trigger-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

:deep(.sc-select-list-item__trigger-btn.el-button) {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
}

.sc-select-list-item__trigger-value {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-self: center;
}

.sc-select-list-item__trigger-text {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-select-list-item__trigger-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: transform 0.18s ease;
}

.sc-select-list-item__trigger-arrow.is-open {
  transform: rotate(180deg);
}

.sc-select-list-item__dropdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sc-select-list-item__top,
.sc-select-list-item__toolbar {
  width: 100%;
}

.sc-select-list-item__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.sc-select-list-item__panel {
  display: grid;
  grid-template-columns: repeat(var(--sc-list-item-columns, 6), minmax(72px, 1fr));
  gap: 10px;
  min-height: 120px;
  padding: 0;
}

.sc-select-list-item__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  aspect-ratio: 1 / 1.08;
  min-height: 0;
  padding: 10px 8px 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;

  &:hover:not(.is-disabled) {
    background: rgba(255, 255, 255, 0.08);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    background: rgba(var(--el-color-primary-rgb), 0.14);
    box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2) inset;
  }

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  &.is-no-borde {
    border: none;
  }
}

.sc-select-list-item__check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--el-color-primary-rgb), 0.2);
  color: var(--el-color-primary);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.18s ease;

  &.is-visible {
    opacity: 1;
    transform: scale(1);
  }
}

.sc-select-list-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.38);
  background: rgba(255, 255, 255, 0.05);
  color: var(--el-color-primary);
  font-size: 18px;
  flex-shrink: 0;
}

.sc-select-list-item__title {
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.sc-select-list-item__empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border-radius: 16px;
  border: 1px dashed var(--el-border-color);
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
</style>
