<script setup lang="ts">
/**
 * ReSearch koi 主题 —— 横向搜索条（按截图重排版）
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ [🔍 搜索]                          展开 ∨                   │   ← topbar
 *   ├────────────────────────────────────────────────────────────┤
 *   │ 登录账号 [____]   用户名称 [____]   手机号 [____]   [搜索][重置] │   ← body
 *   └────────────────────────────────────────────────────────────┘
 *
 * 设计要点：
 *   - 顶部条：徽标（搜索图标 + 标题）在左，折叠切换在右上
 *   - 内容行：字段左对齐（label 叠在 input 上方）、按钮右对齐
 *   - 右上折叠按钮：仅当 hasOverflow（max>0 && item>max）时显示，
 *     控制 localExpanded（点击显示被 max 隐藏的多余字段）
 *   - filterVisible 切换仍走 ReSearchToolbar 里的"显示/隐藏"按钮（保持原 API）
 */
import { ref, watch, computed, useSlots, defineAsyncComponent, type CSSProperties, nextTick } from "vue";
import { ElInput, ElSelect, ElOption, ElDatePicker, ElTreeSelect } from "element-plus";
import ReButton from "../../../ReButton/ReButton.vue";
import ReSearchToolbar from "../../ReSearchToolbar.vue";
import "../../shared/research-vars.css";

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
    /** 顶部徽标文案（默认"搜索"） */
    title?: string;
    /** 过滤区当前是否可见（v-model 双向绑定） */
    filterVisible?: boolean;
    /** 工具栏按钮模式：icon=图标+tooltip，text=图标+文字 */
    btnMode?: "icon" | "text";
    /** ReSearchToolbar：显示/隐藏过滤区按钮 */
    showToggle?: boolean;
    /** ReSearchToolbar：搜索按钮 */
    showSearchBtn?: boolean;
    searchText?: string;
    /** ReSearchToolbar：重置按钮 */
    showResetBtn?: boolean;
    resetText?: string;
    /** ReSearchToolbar：刷新按钮 */
    showRefreshBtn?: boolean;
    /** ReSearchToolbar：新增按钮 */
    showAddBtn?: boolean;
    addText?: string;
    /** ReSearchToolbar：批量删除按钮 */
    showBatchDeleteBtn?: boolean;
    batchDeleteText?: string;
    batchDeleteDisabled?: boolean;
    /** ReSearchToolbar：批量勾选按钮 */
    showBatchSelectBtn?: boolean;
    batchSelectText?: string;
    batchSelectActive?: boolean;
    batchSelectTextActive?: string;
    /** 搜索按钮 loading */
    loading?: boolean;
    /** 默认展开的最大表项数（0=不限，配合右上角"展开/收起"按钮使用） */
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
    padding: "12px 16px",
    title: "搜索",
    filterVisible: true,
    btnMode: "icon",
    showToggle: true,
    showSearchBtn: true,
    searchText: "搜索",
    showResetBtn: true,
    resetText: "重置",
    showRefreshBtn: true,
    showAddBtn: false,
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
  (v) => { localFilterVisible.value = v; },
);
function toggleFilter(): void {
  localFilterVisible.value = !localFilterVisible.value;
  emit("update:filterVisible", localFilterVisible.value);
  emit("toggle");
}

/** 右上角"展开/收起"折叠（仅作用于被 max 隐藏的多余字段） */
const localExpanded = ref(false);
const itemSlots = computed(() => slots.default?.() ?? []);
/** 项数：优先取 filters prop 的长度，否则数 default slot 的子节点 */
const itemCount = computed(() => {
  const filterCount = props.filters?.length ?? 0;
  return filterCount > 0 ? filterCount : itemSlots.value.length;
});
const hasOverflow = computed(
  () => props.max > 0 && itemCount.value > props.max,
);
/** 折叠态下只渲染前 max 个 filters（slot 子节点仍走 grid-template-rows 折叠） */
const visibleFilters = computed(() => {
  if (!hasOverflow.value || localExpanded.value) return props.filters;
  return props.filters.slice(0, props.max);
});
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

const containerStyle = computed<CSSProperties>(() => ({ padding: props.padding }));
</script>

<template>
  <!-- Modern 布局（原样保留） -->
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

  <!-- Default 布局：横向搜索条 -->
  <div
    v-else
    class="koi-search"
    :class="{ 'koi-search--bordered': bordered }"
    :style="containerStyle"
  >
    <!-- 顶部条：徽标（左）+ 折叠切换（右上角） -->
    <div class="koi-search__topbar">
      <div class="koi-search__badge">
        <span class="koi-search__badge-icon">
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
        class="koi-search__expand"
        :class="{ 'koi-search__expand--expanded': localExpanded }"
        @click="toggleExpand"
      >
        <span>{{ localExpanded ? "收起" : "展开" }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- 内容行：字段（左）+ 操作按钮（右） -->
    <transition name="re-search-collapse">
      <div
        v-show="localFilterVisible && hasFilterContent"
        class="koi-search__body"
      >
        <div
          ref="contentEl"
          class="koi-search__fields"
          :class="{
            'koi-search__fields--data': filterMode === 'data',
            'koi-search__fields--overflow': hasOverflow,
          }"
          :style="{ gridTemplateRows: gridRows }"
        >
          <!-- filters prop 驱动的过滤项 -->
          <template v-if="visibleFilters && visibleFilters.length > 0">
            <div v-for="filter in visibleFilters" :key="filter.key" class="koi-search__field">
              <span
                v-if="filterMode === 'form' && filter.label"
                class="koi-search__field-label"
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
          <!-- slot 自定义过滤项 -->
          <slot />
        </div>

        <!-- 操作按钮（与字段同行右对齐） -->
        <div class="koi-search__actions">
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
          <!-- 额外按钮（新增 / 批量 / 刷新 / 显示隐藏）走 ReSearchToolbar -->
          <ReSearchToolbar
            v-if="showAddBtn || showBatchDeleteBtn || showBatchSelectBtn || showRefreshBtn || showToggle || !!slots.footer"
            :filter-visible="localFilterVisible"
            :btn-mode="btnMode"
            :show-toggle="showToggle"
            :show-search="false"
            :show-reset="false"
            :show-refresh="showRefreshBtn"
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
            @refresh="emit('refresh')"
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
.koi-search {
  margin: 4px 4px 0;
  background: var(--rs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-md);
  color: var(--rs-text);
  box-sizing: border-box;
  transition: border-color var(--rs-transition), box-shadow var(--rs-transition);
}
.koi-search--bordered {
  border-color: var(--rs-border);
  box-shadow: var(--rs-shadow-xs);
}

/* 顶部条：徽标（左）+ 折叠切换（右上角） */
.koi-search__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  min-height: 26px;
}
.koi-search__badge {
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
.koi-search__badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.koi-search__expand {
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
.koi-search__expand:hover {
  color: var(--rs-text);
  background: var(--rs-bg-hover);
}
.koi-search__expand svg {
  transition: transform 0.25s ease;
}
.koi-search__expand--expanded svg {
  transform: rotate(180deg);
}

/* 内容行：字段（左）+ 操作按钮（右），同一行 */
.koi-search__body {
  display: flex;
  align-items: flex-end;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.koi-search__fields {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 12px;
  min-width: 0;
}

.koi-search__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.koi-search__field-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  text-align: left;
}

/* data 模式：标签隐藏，仅组件 */
.koi-search__fields--data .koi-search__field {
  display: block;
}

/* overflow 模式（max>0）：用 grid-template-rows 折叠 */
.koi-search__fields--overflow {
  grid-auto-rows: minmax(0, auto);
  overflow: hidden;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.koi-search__fields--overflow :deep(> *) {
  overflow: hidden;
  min-height: 0;
}

/* 操作按钮：与字段同行右对齐 */
.koi-search__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  align-self: flex-end;
}

/* 折叠动画（filterVisible 切换时整行淡入淡出） */
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
  .koi-search__fields {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  .koi-search__actions {
    width: 100%;
    justify-content: flex-end;
    margin-left: 0;
  }
}
</style>