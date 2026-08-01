<script setup lang="ts">
/**
 * ReIconSelect koi 主题 —— 图标选择器（KoiSelectIcon 移植）
 *
 * 与 default 主题保持相同 API（v-model / tabs / icons / pageSize），
 * 结构走 koi 视觉：输入框 + popover 面板，图标分「本地 svg」「element」两个 tab。
 * 本地 svg 通过 koi ReIcon 渲染（#icon-xxx symbol）。
 */
import { computed, ref, watch } from "vue";
import {
  ElInput, ElPopover, ElTabs, ElTabPane, ElPagination, ElButton, ElScrollbar, ElEmpty,
} from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import ReIcon from "../ReIcon/theme/koi/ReIcon.vue";

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
const activeTab = ref<"ele" | "local">("local");
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
      <ElInput
        v-model="inputValue"
        placeholder="请选择图标"
        :disabled="disabled"
        clearable
      >
        <template #append>
          <ReIcon v-if="modelValue" :name="modelValue" :size="18" />
          <span v-else></span>
        </template>
      </ElInput>
    </template>

    <div class="koi-select-icon-panel">
      <ElInput
        v-model="searchText"
        placeholder="搜索图标名称"
        clearable
        class="koi-select-icon-search"
      />

      <ElTabs v-model="activeTab" class="koi-select-icon-tabs">
        <ElTabPane label="本地图标" name="local" />
        <ElTabPane label="ele图标" name="ele" />
      </ElTabs>

      <ElScrollbar max-height="260px">
        <div v-if="paginatedIcons.length" class="koi-select-icon-grid">
          <div v-for="item in paginatedIcons" :key="activeTab + item" class="m-1">
            <ElButton @click="handleIconSelect(item)">
              <ReIcon :name="item" :size="18" />
            </ElButton>
          </div>
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
  min-height: 48px;
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
