<script setup lang="ts">
/**
 * ReSearch default 主题 —— 简洁搜索组件
 *
 * 特性：
 *   - 顶部标题栏：搜索图标 + 「搜索」标题
 *   - 过滤区域默认显示（表单模式），通过工具栏「显示/隐藏」按钮切换
 *   - 内置操作按钮组（ReSearchToolbar）：搜索 / 重置 / 新增 / 批量删除 / 批量勾选等，
 *     每个按钮均可通过 prop 配置显示与事件
 */
import { ref, watch, computed, useSlots, defineAsyncComponent, type CSSProperties, nextTick } from "vue";
import { ElDivider, ElInput, ElSelect, ElOption, ElDatePicker, ElTreeSelect } from "element-plus";
import "../../shared/research-vars.css";
import ReSearchToolbar from "../../ReSearchToolbar.vue";

const ModernLayout = defineAsyncComponent(() => import("../../layouts/Modern.vue"));

defineOptions({ name: "ReSearch", inheritAttrs: true });

const slots = useSlots();
const hasDefaultSlot = computed(() => slots.default && slots.default().length > 0);

/** 过滤项配置类型 */
export interface SearchFilter {
  /** 字段 key（v-model 绑定键名） */
  key: string;
  /** 标签文案（form 模式下显示） */
  label?: string;
  /** 组件类型：input / select / date / daterange / treeselect（默认 input） */
  type?: "input" | "select" | "date" | "daterange" | "treeselect";
  /** 占位文案 */
  placeholder?: string;
  /** select / treeselect 选项数据 */
  options?: Array<{ label: string; value: string | number; children?: any[] }>;
  /** 其他透传给子组件的属性 */
  attrs?: Record<string, unknown>;
}

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
    showSearch?: boolean;
    layout?: "default" | "modern";
    mode?: 1 | 2;
    /** 过滤模式：form=标签+组件，data=仅组件 */
    filterMode?: "form" | "data";
    bordered?: boolean;
    showLabel?: boolean;
    tooltipText?: string;
    padding?: string;
    /** 标题栏文案（默认“搜索”） */
    title?: string;
    /** 过滤区当前是否可见（v-model 双向绑定） */
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
    /** 默认展开的最大表单项数（0=不限） */
    max?: number;
    /** 过滤项配置（prop 驱动模式，与 default slot 二选一） */
    filters?: SearchFilter[];
    /** 过滤值对象（v-model 双向绑定，与 filters 配合使用） */
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
    padding: "12px 18px 8px",
    title: "搜索",
    filterVisible: true,
    showToggle: true,
    showSearchBtn: true,
    searchText: "搜索",
    showResetBtn: true,
    resetText: "重置",
    showAddBtn: true,
    addText: "新增",
    showBatchDeleteBtn: false,
    batchDeleteText: "批量删除",
    batchDeleteDisabled: false,
    showBatchSelectBtn: false,
    batchSelectText: "批量勾选",
    batchSelectActive: false,
    batchSelectTextActive: "取消勾选",
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

/** 内部过滤值（支持 v-model 双向绑定，未受控时内部维护） */
const filterValues = ref<Record<string, any>>({ ...props.modelValue });
watch(
  () => props.modelValue,
  (v) => { filterValues.value = { ...v }; },
  { deep: true },
);
function onFilterInput(key: string, val: unknown): void {
  filterValues.value[key] = val;
  emit("update:modelValue", { ...filterValues.value });
}

/** 是否有过滤内容（filters prop 或 default slot） */
const hasFilterContent = computed(() => hasDefaultSlot.value || (props.filters && props.filters.length > 0));

/** 过滤区可见状态（支持 v-model:filterVisible，未受控时内部维护） */

const localFilterVisible = ref(props.filterVisible);
watch(
  () => props.filterVisible,
  (v) => {
    localFilterVisible.value = v;
  },
);
function toggleFilter(): void {
  localFilterVisible.value = !localFilterVisible.value;
  emit("update:filterVisible", localFilterVisible.value);
  emit("toggle");
}

const localExpanded = ref(false);
const itemSlots = computed(() => slots.default?.() ?? []);
const itemCount = computed(() => itemSlots.value.length);
const hasOverflow = computed(
  () => props.max > 0 && itemCount.value > props.max,
);
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

const containerStyle = computed<CSSProperties>(() => {
  const base: CSSProperties = { padding: props.padding };
  if (props.mode === 2) base["--label-width"] = "100px";
  return base;
});

const contentEl = ref<HTMLElement | null>(null);
function resetForm(): void {
  // 清空 filters prop 驱动的值
  if (props.filters && props.filters.length > 0) {
    const cleared: Record<string, unknown> = {};
    props.filters.forEach((f) => { cleared[f.key] = undefined as unknown; });
    filterValues.value = cleared;
    emit("update:modelValue", { ...cleared });
  }
  // 清空 slot 中的 el-form
  nextTick(() => {
    const el = contentEl.value?.querySelector(".el-form");
    if (!el) return;
    const comp = (el as any).__vueParentComponent;
    comp?.exposed?.resetFields?.();
  });
  emit("reset");
}
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
    <template #footer>
      <slot name="footer" />
    </template>
    <template #action>
      <slot name="action" />
    </template>
  </ModernLayout>

  <transition v-else name="re-search-collapse">
    <div
      v-show="showSearch"
      class="re-search"
      :class="{
        're-search--bordered': bordered,
        're-search--form': filterMode === 'form',
      }"
      :style="containerStyle"
    >
      <!-- 顶部标题栏 -->
      <div class="re-search__header">
        <div class="re-search__header-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="re-search__header-icon">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <span>{{ title }}</span>
        </div>
        <button
          v-if="hasOverflow"
          type="button"
          class="re-search__expand-btn"
          :class="{ 're-search__expand-btn--expanded': localExpanded }"
          @click="toggleExpand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <!-- 过滤区域（默认显示，可折叠） -->
      <div
        v-show="localFilterVisible && hasFilterContent"
        ref="contentEl"
        class="re-search__content"
        :class="{
          're-search__content--form': filterMode === 'form',
          're-search__content--data': filterMode === 'data',
          're-search__content--overflow': hasOverflow,
        }"
        :style="{ gridTemplateRows: gridRows }"
      >
        <!-- filters prop 驱动的过滤项 -->
        <template v-if="filters && filters.length > 0">
          <template v-for="filter in filters" :key="filter.key">
            <!-- form 模式：标签 + 组件 -->
            <template v-if="filterMode === 'form' && filter.label">
              <span class="re-search__filter-label">{{ filter.label }}</span>
            </template>
            <ElInput
              v-if="(!filter.type || filter.type === 'input') && filterMode === 'data'"
              v-model="filterValues[filter.key]"
              :placeholder="filter.placeholder || filter.label || '请输入'"
              clearable
              v-bind="filter.attrs || {}"
              @input="(val: string) => onFilterInput(filter.key, val)"
            />
            <ElInput
              v-else-if="(!filter.type || filter.type === 'input') && filterMode === 'form'"
              v-model="filterValues[filter.key]"
              :placeholder="filter.placeholder || '请输入'"
              clearable
              v-bind="filter.attrs || {}"
              @input="(val: string) => onFilterInput(filter.key, val)"
            />
            <ElSelect
              v-else-if="filter.type === 'select'"
              v-model="filterValues[filter.key]"
              :placeholder="filter.placeholder || filter.label || '请选择'"
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
              :placeholder="filter.placeholder || filter.label || '请选择日期'"
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
              :placeholder="filter.placeholder || filter.label || '请选择'"
              clearable
              check-strictly
              v-bind="filter.attrs || {}"
              @change="(val: any) => onFilterInput(filter.key, val)"
            />
          </template>
        </template>
        <!-- slot 自定义过滤项 -->
        <slot />
      </div>

      <!-- 底部操作按钮组 -->
      <div class="re-search__footer">
        <ReSearchToolbar
          :filter-visible="localFilterVisible"
          :show-toggle="showToggle"
          :show-search="showSearchBtn"
          :search-text="searchText"
          :show-reset="showResetBtn"
          :reset-text="resetText"
          :show-add="showAddBtn"
          :add-text="addText"
          :show-batch-delete="showBatchDeleteBtn"
          :batch-delete-text="batchDeleteText"
          :batch-delete-disabled="batchDeleteDisabled"
          :show-batch-select="showBatchSelectBtn"
          :batch-select-text="batchSelectText"
          :batch-select-active="batchSelectActive"
          :batch-select-text-active="batchSelectTextActive"
          :loading="loading"
          @toggle="toggleFilter"
          @search="emit('search')"
          @reset="resetForm"
          @add="emit('add')"
          @batch-delete="emit('batch-delete')"
          @batch-select="emit('batch-select')"
        >
          <template #toolbar>
            <slot name="toolbar" />
          </template>
        </ReSearchToolbar>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.re-search {
  position: relative;
  margin: 4px 4px 0;
  overflow: hidden;
  color: var(--rs-text);
  background: var(--rs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-md);
  transition: border-color var(--rs-transition), box-shadow var(--rs-transition);
}

.re-search--bordered {
  border: 1px solid var(--rs-border);
  box-shadow: var(--rs-shadow-xs);
}

.re-search__filter-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  text-align: right;
}

.re-search--form {
  .re-search__content--form :deep(> *:not(.el-row)) {
    display: grid;
    grid-template-columns: var(--label-width) 1fr;
    align-items: center;
    gap: 12px;
    padding: 6px 4px;
  }
}
.re-search__content--data :deep(> *) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 6px 4px;
}

@media (max-width: 768px) {
  .re-search {
    padding: 10px 12px 6px;
  }
  .re-search__content--form :deep(> *:not(.el-row)) {
    grid-template-columns: minmax(60px, auto) 1fr;
    gap: 8px;
  }
  .re-search__content--data :deep(> *) {
    flex: 1 1 100%;
  }
}

@media (max-width: 480px) {
  .re-search__content--form :deep(> *:not(.el-row)) {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.re-search__content--overflow {
  display: grid;
  grid-auto-rows: minmax(0, auto);
  grid-template-rows: repeat(1, minmax(0, 1fr));
  overflow: hidden;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.re-search__content--overflow :deep(> *) {
  overflow: hidden;
  min-height: 0;
}

.re-search__expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--rs-text-secondary, var(--el-text-color-secondary));
  cursor: pointer;
  padding: 0;
  transition: color 0.2s, background 0.2s, transform 0.35s;
}

.re-search__expand-btn:hover {
  background: var(--rs-bg-hover, var(--el-fill-color));
  color: var(--rs-text, var(--el-text-color-primary));
}

.re-search__expand-btn--expanded svg {
  transform: rotate(180deg);
}

/* 顶部标题栏 */
.re-search__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.re-search__header-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--rs-font-md);
  font-weight: 600;
  color: var(--rs-text);
}
.re-search__header-icon {
  width: 16px;
  height: 16px;
  color: var(--rs-primary);
}

.re-search__content {
  padding: 0 2px 10px;
}

.re-search__footer {
  display: flex;
  align-items: center;
  padding: 6px 0 2px;
}

:deep(.re-search-collapse-enter-active),
:deep(.re-search-collapse-leave-active) {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
             opacity 0.2s ease;
}

.re-search-collapse-enter-from {
  transform: translateY(-6px);
  opacity: 0;
}

.re-search-collapse-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
