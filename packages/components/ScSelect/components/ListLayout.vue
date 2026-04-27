<template>
  <div class="sc-select-list">
    <ScPopover
      v-model:visible="isOpen"
      placement="top"
      trigger="click"
      popper-class="sc-select-list-popper"
      :offset="8"
      :teleported="true"
      :show-arrow="true"
      :width="panelWidth"
    >
      <template #reference>
        <div class="sc-select-list__trigger" :class="{ 'is-button-mode': selectButton }" role="button" tabindex="0">
          <template v-if="selectButton">
            <ScButton circle class="sc-select-list__trigger-btn">
              <IconRenderer :icon="currentTriggerIcon" />
            </ScButton>
            <span v-if="selectShowValue" class="sc-select-list__trigger-value">{{ currentDisplayText }}</span>
          </template>
          <template v-else>
            <span class="sc-select-list__trigger-text">{{ currentDisplayText }}</span>
            <IconRenderer icon="ri:arrow-down-s-line" class="sc-select-list__trigger-arrow" :class="{ 'is-open': isOpen }" />
          </template>
        </div>
      </template>

      <div class="sc-select-list__dropdown">
        <div v-if="$slots.top" class="sc-select-list__top">
          <slot name="top" :options="filteredOptions" />
        </div>
        <div v-if="showSearch" class="sc-select-list__toolbar">
          <ScInput
            v-model="searchQuery"
            size="small"
            clearable
            :placeholder="placeholder"
            class="sc-select-list__search"
          >
            <template #prefix>
              <IconRenderer icon="ri:search-line" />
            </template>
          </ScInput>
        </div>

        <div v-if="multiple && showBatchActions" class="sc-select-list__actions">
          <ScButton size="small" text @click="emit('selectAll')">全选</ScButton>
          <ScButton size="small" text @click="emit('invertSelection')">反选</ScButton>
          <ScButton size="small" text @click="emit('clearSelection')">清空</ScButton>
        </div>

        <div class="sc-select-list__panel thin-scroller overflow-y-auto ss" :style="{ maxHeight: height }">
          <button
            v-for="option in filteredOptions"
            :key="option.value"
            type="button"
            class="sc-select-list__item"
            :class="{
              'is-selected': isSelected(option.value),
              'is-disabled': isItemDisabled(option.value),
              'is-no-borde': !borde
            }"
            :disabled="isItemDisabled(option.value)"
            @mousedown.stop.prevent
            @click.stop.prevent="handleSelect(option.value)"
          >
            <div class="sc-select-list__body">
              <div v-if="$slots.icon || option.icon" class="sc-select-list__icon">
                <slot name="icon" :option="option" :isSelected="isSelected(option.value)">
                  <IconRenderer :icon="option.icon" />
                </slot>
              </div>
              <div class="sc-select-list__copy">
                <slot name="content" :option="option" :isSelected="isSelected(option.value)">
                  <div class="sc-select-list__title">
                    {{ option.label || option.name || option.describe || option.value }}
                  </div>
                  <div v-if="resolveDescription(option)" class="sc-select-list__description">
                    {{ resolveDescription(option) }}
                  </div>
                </slot>
              </div>
            </div>
            <div class="sc-select-list__indicator" :class="{ 'is-visible': isSelected(option.value) }" aria-hidden="true">
              <IconRenderer icon="ri:check-line" />
            </div>
          </button>

          <div v-if="filteredOptions.length === 0" class="sc-select-list__empty">
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

interface ListOption {
  label?: string;
  name?: string;
  describe?: string;
  description?: string;
  value: string | number;
  icon?: string;
  preview?: string;
}

const props = defineProps({
  options: {
    type: Array as () => ListOption[],
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

const resolveDescription = (option: ListOption) => {
  if (option.description) return option.description;
  if (option.describe && option.describe !== option.label) return option.describe;
  if (option.name && option.name !== option.label) return option.name;
  return "";
};

const filteredOptions = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) {
    return props.options;
  }

  return props.options.filter(option => {
    const haystacks = [option.label, option.name, option.describe, option.description, option.value]
      .filter(Boolean)
      .map(item => String(item).toLowerCase());

    return haystacks.some(item => item.includes(keyword));
  });
});

const currentDisplayText = computed(() => {
  if (props.multiple) {
    const selectedCount = props.options.filter(option => props.isSelected(option.value)).length;
    return selectedCount > 0 ? `已选择 ${selectedCount} 项` : props.placeholder;
  }
  const selected = props.options.find(option => props.isSelected(option.value));
  return selected?.label || selected?.name || selected?.describe || String(selected?.value ?? "") || props.placeholder;
});

const currentTriggerIcon = computed(() => {
  const selected = props.options.find(option => props.isSelected(option.value));
  return selected?.icon || selected?.preview || props.selectIcon || "ri:list-check-2";
});

const panelWidth = computed(() => 240);

const handleSelect = (value: string | number) => {
  emit("select", value);
  if (!props.multiple) {
    isOpen.value = false;
  }
};
</script>

<style lang="scss" scoped>
.sc-select-list {
  width: 100%;
}

.sc-select-list__trigger {
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

.sc-select-list__trigger-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

:deep(.sc-select-list__trigger-btn.el-button) {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
}

.sc-select-list__trigger-value {
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

.sc-select-list__trigger-text {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-select-list__trigger-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: transform 0.18s ease;
}

.sc-select-list__trigger-arrow.is-open {
  transform: rotate(180deg);
}

.sc-select-list__dropdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sc-select-list__top {
  width: 100%;
}

.sc-select-list__toolbar {
  width: 100%;
}

.sc-select-list__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.sc-select-list__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  padding: 0;
}

.sc-select-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 53px;
  padding: 8px 10px;
  margin: 0;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  &:hover:not(.is-disabled) {
    background: rgba(255, 255, 255, 0.06);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    background: rgba(var(--el-color-primary-rgb), 0.14);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
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

.sc-select-list__body {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.sc-select-list__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 14px;
}

.sc-select-list__copy {
  min-width: 0;
  width: 100%;
  display: grid;
  gap: 2px;
}

.sc-select-list__title {
  font-size: 12px;
  line-height: 1.25;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-select-list__description {
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-select-list__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 999px;
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

.sc-select-list__empty {
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

@media (max-width: 768px) {
  .sc-select-list__item {
    padding: 8px 10px;
    gap: 10px;
  }

  .sc-select-list__title {
    font-size: 12px;
  }

  .sc-select-list__description {
    font-size: 11px;
  }
}
</style>
