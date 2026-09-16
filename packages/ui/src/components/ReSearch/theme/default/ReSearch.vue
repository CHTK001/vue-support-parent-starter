<script setup lang="ts">
/**
 * ReSearch default 主题 —— 横向搜索条（按截图重排版）
 *
 * 结构与 koi 主题一致，类名前缀改为 re-search（保持 default 主题的命名习惯）。
 * 同时移除了此前被错误编码（GBK 当作 UTF-8 显示）的注释乱码。
 */
import { ref, watch, computed, useSlots, defineAsyncComponent, type CSSProperties, nextTick } from "vue";
import { ElInput, ElSelect, ElOption, ElDatePicker, ElTreeSelect } from "element-plus";
import ReButton from "../ReButton/ReButton.vue";
import ReSearchToolbar from "../ReSearchToolbar.vue";
import "../shared/research-vars.css";

const ModernLayout = defineAsyncComponent(() => import("../../layouts/Modern.vue"));

defineOptions({ name: "ReSearch", inheritAttrs: true });

const slots = useSlots();
const hasDefaultSlot = computed(() => slots.default && slots.default().length > 0);

/** 过滤项配置类型 */
export interface SearchFilter {
  key: string;
  label?: string;
  type?: "input" | "select" | "date" | "daterange" | "treeselect";
  placeholder?: string;
  options?: Array<{ label: string; value: string | number; children?: any[] }>;
  attrs?: Record<string, unknown>;
}

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
    showSearch?: boolean;
    layout?: "default" | "modern";
    mode?: 1 | 2;
    filterMode?: "form" | "data";
    bordered?: boolean;
    showLabel?: boolean;
    tooltipText?: string;
    padding?: string;
    title?: string;
    filterVisible?: boolean;
    showToggle?: boolean;
    showSearchBtn?: boolean;
    searchText?: string;
    showResetBtn?: boolean;
    resetText?: string;
    showAddBtn?: boolean;
    addText?: string;
    showBatchDeleteBtn?: boolean;
    batchDeleteText?: string;
    batchDeleteDisabled?: boolean;
    showBatchSelectBtn?: boolean;
    batchSelectText?: string;
    batchSelectActive?: boolean;
    batchSelectTextActive?: string;
    loading?: boolean;
    max?: number;
    filters?: SearchFilter[];
    modelValue?: Record<string, unknown>;
  }>(),
  {
    isExpanded: false,
    showSearch: true,
    layout: "default",
    mode: 2,
    filterMode: "form",
    bordered: false,
    showLabel: false,
    tooltipText: "搜索",
    padding: "12px 18px",
    title: "搜索",
    filterVisible: true,
    showToggle: true,
    showSearchBtn: true,
    searchText: "搜索",
    showResetBtn: true,
    resetText: "重置",
    showAddBtn: false,
    addText: "新增",
    showBatchDeleteBtn: false,
    batchDeleteText: "批量删除",
    batchDeleteDisabled: false,
    showBatchSelectBtn: false,
    batchSelectText: "批量选择",
    batchSelectActive: false,
    batchSelectTextActive: "取消选择",
    loading: false,
    max: 0,
    filters: () => [],
    modelValue: () => ({}),
  },
);

const emit = defineEmits<{
  (e: "update:filterVisible", visible: boolean): void;
  (e: "toggle"): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "add"): void;
  (e: "batch-delete"): void;
  (e: "batch-select"): void;
  (e: "update:modelValue", value: Record<string, unknown>): void;
}>();

const filterValues = ref<Record<string, any>>({ ...props.modelValue });
watch(() => props.modelValue, (v) => { filterValues.value = { ...v }; }, { deep: true });
function onFilterInput(key: string, val: unknown): void {
  filterValues.value[key] = val;
  emit("update:modelValue", { ...filterValues.value });
}

const hasFilterContent = computed(() => hasDefaultSlot.value || (props.filters && props.filters.length > 0));

const localFilterVisible = ref(props.filterVisible);
watch(() => props.filterVisible, (v) => { localFilterVisible.value = v; });
function toggleFilter(): void {
  localFilterVisible.value = !localFilterVisible.value;
  emit("update:filterVisible", localFilterVisible.value);
  emit("toggle");
}

const localExpanded = ref(false);
const itemSlots = computed(() => slots.default?.() ?? []);
const itemCount = computed(() => itemSlots.value.length);
const hasOverflow = computed(() => props.max > 0 && itemCount.value > props.max);
const gridRows = computed(() => {
  if (!hasOverflow.value) return undefined;
  if (localExpanded.value) {
    return `repeat(${itemCount.value}, minmax(0, 1fr))`;
  }
  const hidden = itemCount.value - props.max;
  return `repeat(${props.max}, minmax(0, 1fr)) repeat(${hidden}, 0fr)`;
});
function toggleExpand(): void {
  localExpanded.value = !localExpanded.value;
}

const contentEl = ref<HTMLElement | null>(null);
function resetForm(): void {
  if (props.filters && props.filters.length > 0) {
    const cleared: Record<string, unknown> = {};
    props.filters.forEach((f) => { cleared[f.key] = undefined as unknown; });
    filterValues.value = cleared;
    emit("update:modelValue", { ...cleared });
  }
  nextTick(() => {
    const el = contentEl.value?.querySelector(".el-form");
    if (!el) return;
    const comp = (el as any).__vueParentComponent;
    comp?.exposed?.resetFields?.();
  });
  emit("reset");
}

const containerStyle = computed<CSSProperties>(() => ({ padding: props.padding }));
</script>

<template>
  <ModernLayout
    v-if="layout === 'modern'"
    :is-expanded="isExpanded"
    :show-search="showSearch"
    :bordered="bordered"
    :mode="mode"
    :show-label="showLabel"
    :tooltip-text="tooltipText"
    :padding="padding"
  >
    <slot />
    <template #footer><slot name="footer" /></template>
    <template #action><slot name="action" /></template>
  </ModernLayout>

  <div
    v-else
    class="re-search"
    :class="{ 're-search--bordered': bordered }"
    :style="containerStyle"
  >
    <div class="re-search__topbar">
      <div class="re-search__badge">
        <span class="re-search__badge-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        </span>
        <span>{{ title }}</span>
      </div>
      <button
        v-if="hasOverflow"
        type="button"
        class="re-search__expand"
        :class="{ 're-search__expand--expanded': localExpanded }"
        @click="toggleExpand"
      >
        <span>{{ localExpanded ? "收起" : "展开" }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <transition name="re-search-collapse">
      <div
        v-show="localFilterVisible && hasFilterContent"
        class="re-search__body"
      >
        <div
          ref="contentEl"
          class="re-search__fields"
          :class="{
            're-search__fields--data': filterMode === 'data',
            're-search__fields--overflow': hasOverflow,
          }"
          :style="{ gridTemplateRows: gridRows }"
        >
          <template v-if="filters && filters.length > 0">
            <div v-for="filter in filters" :key="filter.key" class="re-search__field">
              <span
                v-if="filterMode === 'form' && filter.label"
                class="re-search__field-label"
              >{{ filter.label }}</span>
              <ElInput
                v-if="!filter.type || filter.type === 'input'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请输入' : filter.label || '请输入')"
                clearable
                v-bind="filter.attrs || {}"
                @input="(val: string) => onFilterInput(filter.key, val)"
              />
              <ElSelect
                v-else-if="filter.type === 'select'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择' : filter.label || '请选择')"
                clearable
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              >
                <ElOption
                  v-for="opt in (filter.options || [])"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
              <ElDatePicker
                v-else-if="filter.type === 'date'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择日期' : filter.label || '请选择日期')"
                type="date"
                value-format="YYYY-MM-DD"
                clearable
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              />
              <ElDatePicker
                v-else-if="filter.type === 'daterange'"
                v-model="filterValues[filter.key]"
                :start-placeholder="filter.placeholder || '开始日期'"
                end-placeholder="结束日期"
                type="daterange"
                value-format="YYYY-MM-DD"
                clearable
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              />
              <ElTreeSelect
                v-else-if="filter.type === 'treeselect'"
                v-model="filterValues[filter.key]"
                :data="filter.options || []"
                :placeholder="filter.placeholder || (filterMode === 'form' ? '请选择' : filter.label || '请选择')"
                clearable
                check-strictly
                v-bind="filter.attrs || {}"
                @change="(val: any) => onFilterInput(filter.key, val)"
              />
            </div>
          </template>
          <slot />
        </div>

        <div class="re-search__actions">
          <ReButton
            v-if="showSearchBtn"
            type="primary"
            icon="Search"
            :loading="loading"
            @click="emit('search')"
          >{{ searchText }}</ReButton>
          <ReButton
            v-if="showResetBtn"
            type="danger"
            icon="RefreshLeft"
            @click="resetForm"
          >{{ resetText }}</ReButton>
          <ReSearchToolbar
            v-if="showAddBtn || showBatchDeleteBtn || showBatchSelectBtn || showToggle || !!slots.footer"
            :filter-visible="localFilterVisible"
            :show-toggle="showToggle"
            :show-search="false"
            :show-reset="false"
            :show-add="showAddBtn"
            :add-text="addText"
            :show-batch-delete="showBatchDeleteBtn"
            :batch-delete-text="batchDeleteText"
            :batch-delete-disabled="batchDeleteDisabled"
            :show-batch-select="showBatchSelectBtn"
            :batch-select-text="batchSelectText"
            :batch-select-active="batchSelectActive"
            :batch-select-text-active="batchSelectTextActive"
            @toggle="toggleFilter"
            @add="emit('add')"
            @batch-delete="emit('batch-delete')"
            @batch-select="emit('batch-select')"
          >
            <template #toolbar>
              <slot name="footer" />
            </template>
          </ReSearchToolbar>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.re-search {
  margin: 4px 4px 0;
  background: var(--rs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-md);
  color: var(--rs-text);
  box-sizing: border-box;
  transition: border-color var(--rs-transition), box-shadow var(--rs-transition);
}
.re-search--bordered {
  border-color: var(--rs-border);
  box-shadow: var(--rs-shadow-xs);
}

.re-search__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  min-height: 26px;
}
.re-search__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(57, 134, 255);
  background: rgb(235, 243, 255);
  border: 1px solid rgb(156, 195, 255);
  border-radius: 6px;
  user-select: none;
  line-height: 18px;
}
.re-search__badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.re-search__expand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color var(--rs-transition), background var(--rs-transition);
}
.re-search__expand:hover {
  color: var(--rs-text);
  background: var(--rs-bg-hover);
}
.re-search__expand svg {
  transition: transform 0.25s ease;
}
.re-search__expand--expanded svg {
  transform: rotate(180deg);
}

.re-search__body {
  display: flex;
  align-items: flex-end;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.re-search__fields {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 12px;
  min-width: 0;
}
.re-search__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.re-search__field-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  text-align: left;
}

.re-search__fields--data .re-search__field {
  display: block;
}

.re-search__fields--overflow {
  grid-auto-rows: minmax(0, auto);
  overflow: hidden;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.re-search__fields--overflow :deep(> *) {
  overflow: hidden;
  min-height: 0;
}

.re-search__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  align-self: flex-end;
}

.re-search-collapse-enter-from,
.re-search-collapse-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
.re-search-collapse-enter-active,
.re-search-collapse-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease;
}

@media (max-width: 768px) {
  .re-search__fields {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  .re-search__actions {
    width: 100%;
    justify-content: flex-end;
    margin-left: 0;
  }
}
</style>