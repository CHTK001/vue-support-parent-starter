<script setup lang="ts">
/**
 * ReIconSelect koi 主题 —— 图标选择器
 *
 * 结构：左侧禁用输入框(展示当前图标名) + 右侧按钮，点击按钮弹出 popover 面板。
 * 面板默认展示 element-plus 系统图标(支持搜索/分页/选中高亮)，
 * 另含「本地图标」tab(koi- 前缀 svg symbol，可外部注入)。
 */
import { computed, ref, watch } from "vue";
import {
  ElInput, ElPopover, ElTabs, ElTabPane, ElPagination, ElButton, ElScrollbar, ElEmpty,
} from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import ReIcon from "../../../ReIcon/theme/koi/ReIcon.vue";

defineOptions({ name: "ReIconSelect", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    /** 每页图标数量 */
    pageSize?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** popover 宽度 */
    widthPopover?: string;
  }>(),
  {
    modelValue: "",
    pageSize: 48,
    disabled: false,
    widthPopover: "420",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

/** element-plus 图标名（本地不需要 glob 也能静态拿到） */
const ELE_ICON_NAMES = Object.keys(ElementPlusIconsVue).sort();

/** 本地 svg symbol 图标名（koi- 前缀），业务可通过 inject/provide 注册 */
const LOCAL_ICON_NAMES: string[] = [];

const inputValue = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    if (!value) emit("update:modelValue", value);
  },
});

const visible = ref(false);
const searchText = ref("");
const activeTab = ref<"ele" | "local">("ele");
const currentPage = ref(1);

const sourceIcons = computed(() =>
  activeTab.value === "ele" ? ELE_ICON_NAMES : LOCAL_ICON_NAMES,
);

const filteredIcons = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return sourceIcons.value;
  return sourceIcons.value.filter((name) => name.toLowerCase().includes(q));
});

const filteredTotal = computed(() => filteredIcons.value.length);

const paginatedIcons = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return filteredIcons.value.slice(start, start + props.pageSize);
});

/** 当前选中图标是否在本页（用于高亮） */
function isSelected(name: string): boolean {
  return props.modelValue === name;
}

watch([activeTab, searchText], () => {
  currentPage.value = 1;
});

watch(visible, (v) => {
  if (!v) {
    searchText.value = "";
    currentPage.value = 1;
  }
});

watch(filteredTotal, (total) => {
  const maxPage = Math.max(1, Math.ceil(total / props.pageSize) || 1);
  if (currentPage.value > maxPage) currentPage.value = maxPage;
});

function handleIconSelect(name: string) {
  visible.value = false;
  emit("update:modelValue", name);
}
</script>

<template>
  <ElPopover
    placement="bottom-start"
    v-model:visible="visible"
    :disabled="disabled"
    :width="widthPopover"
    trigger="click"
  >
    <template #reference>
      <div class="koi-icon-select">
        <ElInput
          v-model="inputValue"
          placeholder="请选择图标"
          disabled
          readonly
          clearable
          @clear="emit('update:modelValue', '')"
        >
          <template #prefix>
            <ReIcon v-if="modelValue" :name="modelValue" :size="18" />
          </template>
        </ElInput>
        <button
          type="button"
          class="koi-icon-select__btn"
          :disabled="disabled"
          aria-label="选择图标"
        >
          <el-icon :size="14"><ArrowDown /></el-icon>
        </button>
      </div>
    </template>

    <div class="koi-select-icon-panel">
      <ElInput
        v-model="searchText"
        placeholder="搜索图标名称"
        clearable
        class="koi-select-icon-search"
      />

      <ElTabs v-model="activeTab" class="koi-select-icon-tabs">
        <ElTabPane label="系统图标" name="ele" />
        <ElTabPane label="本地图标" name="local" />
      </ElTabs>

      <ElScrollbar max-height="260px">
        <div v-if="paginatedIcons.length" class="koi-select-icon-grid">
          <button
            v-for="item in paginatedIcons"
            :key="activeTab + item"
            type="button"
            class="koi-select-icon-item"
            :class="{ 'koi-select-icon-item--active': isSelected(item) }"
            :title="item"
            @click="handleIconSelect(item)"
          >
            <ReIcon :name="item" :size="18" />
          </button>
        </div>
        <ElEmpty v-else description="无匹配图标" :image-size="64" />
      </ElScrollbar>

      <ElPagination
        v-if="filteredTotal > 0"
        class="koi-select-icon-pagination"
        layout="total, prev, pager, next"
        :total="filteredTotal"
        :page-size="pageSize"
        :current-page="currentPage"
        size="small"
        background
        @current-change="(p: number) => (currentPage = p)"
      />
    </div>
  </ElPopover>
</template>

<style scoped lang="scss">
.koi-icon-select {
  position: relative;
  width: 100%;

  :deep(.el-input) {
    padding-right: 36px;
  }

  :deep(.el-input__wrapper) {
    padding-right: 0;
  }
}

.koi-icon-select__btn {
  position: absolute;
  top: 1px;
  right: 1px;
  bottom: 1px;
  width: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 0 8px 8px 0;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.koi-select-icon-panel {
  min-width: 0;
}

.koi-select-icon-search {
  margin-bottom: 8px;
}

.koi-select-icon-tabs {
  margin-bottom: 8px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__content) {
    display: none;
  }
}

.koi-select-icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 48px;
}

.koi-select-icon-item {
  width: 34px;
  height: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    transform: scale(1.06);
  }
}

.koi-select-icon-item--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.koi-select-icon-pagination {
  margin-top: 10px;
  justify-content: flex-end;

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
