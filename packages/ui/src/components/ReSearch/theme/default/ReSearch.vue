<script setup lang="ts">
/**
 * ReSearch default 主题 —— 横向搜索条（按截图重排版）
 *
 * 结构与 koi 主题一致，类名前缀改为 re-search（保持 default 主题的命名习惯）。
 * 同时移除了此前被错误编码（GBK 当作 UTF-8 显示）的注释乱码。
 */
import { ref, watch, computed, useSlots, defineAsyncComponent, onMounted, onBeforeUnmount, type CSSProperties, nextTick } from "vue";
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
    showRefreshBtn?: boolean;
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
    showRefreshBtn: false,
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
  (e: "refresh"): void;
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
const itemCount = computed(() => {
  const filterCount = props.filters?.length ?? 0;
  return filterCount > 0 ? filterCount : itemSlots.value.length;
});
/** 是否有字段被收纳（max 超限 或 容器宽度不足以一行放下全部字段） */
const hasOverflow = computed(
  () => (props.max > 0 && itemCount.value > props.max) || (fitCount.value > 0 && itemCount.value > fitCount.value),
);
/** 折叠态显示的字段数：受 max 与容器实际可容纳数（fitCount）双重限制 */
const collapsedLimit = computed(() => {
  if (!hasOverflow.value) return itemCount.value;
  const byMax = props.max > 0 ? props.max : itemCount.value;
  const byFit = fitCount.value > 0 ? fitCount.value : byMax;
  return Math.max(1, Math.min(byMax, byFit));
});
/** 折叠态下第 index 个字段是否被隐藏（测量期间全部可见） */
function isFieldHidden(index: number): boolean {
  if (measuring.value || !hasOverflow.value || localExpanded.value) return false;
  return index >= collapsedLimit.value;
}
function toggleExpand(): void {
  localExpanded.value = !localExpanded.value;
  // 展开/收起会改变字段区高度（可能连带影响滚动条与可用宽度），
  // 强制按当前宽度重测一次，保证「收起后只留首行」始终按现状成立
  lastWidth = -1;
  nextTick(() => measureFit());
}

const contentEl = ref<HTMLElement | null>(null);

/** ========== 响应式收纳：测量首行可容纳的字段数 ========== */
/** 测量看门狗超时（ms）：超时强制复位 measuring，避免字段被永久隐藏 */
const MEASURE_WATCHDOG_MS = 300;
const fitCount = ref(0);
const measuring = ref(false);
let resizeObserver: ResizeObserver | null = null;
let measureWatchdog: ReturnType<typeof setTimeout> | undefined;
let lastWidth = -1;

function measureFit(): void {
  const el = contentEl.value;
  if (!el || !localFilterVisible.value || measuring.value) return;
  const w = el.clientWidth;
  // 只在宽度变化时重测：显隐切换引起的高度变化会再次触发 RO，若不忽略会造成测量死循环
  // fitCount 仍为 0 时不能跳过：否则首次测量失败会把「从未测量」状态锁死
  if (w === lastWidth && fitCount.value > 0) return;
  // 先置 measuring=true：isFieldHidden 会让整行字段全部参与布局，
  // 且该状态引发的重渲染（含 slot 模式的 applySlotCollapse）会排在下面
  // nextTick 回调之前，所以测量时拿到的一定是「全部字段都排开」的真实布局
  measuring.value = true;
  // 看门狗兜底（防御性冗余）：nextTick 是微任务不会丢，finally 也已保证复位，
  // 这里再兜一层——万一后续改动引入异常，也不会让展开/收纳永久失效。
  if (measureWatchdog) clearTimeout(measureWatchdog);
  measureWatchdog = setTimeout(() => {
    measureWatchdog = undefined;
    measuring.value = false;
  }, MEASURE_WATCHDOG_MS);
  // 用 nextTick 而非 requestAnimationFrame：rAF 在隐藏/后台文档（后台标签页、
  // 不可见 iframe、keep-alive 缓存页）中不会触发，测量会被推迟甚至丢弃。
  // nextTick 是微任务不会丢帧，且同样在浏览器绘制前完成测量，不会闪一下全部字段。
  // 复位放在 finally：测量中途抛异常也必须复位 measuring，否则 measureFit
  // 入口会永久早退，展开/收纳彻底失效。
  void nextTick(() => {
    try {
      const items = Array.from(el.children) as HTMLElement[];
      // 空容器（filters 尚未加载、slot 子节点被 v-if 隐藏）：items[0] 不存在，
      // 直接读 offsetTop 会抛异常并中断本次测量，所以必须提前返回
      if (items.length === 0) {
        fitCount.value = 0;
        return;
      }
      const top0 = items[0].offsetTop;
      let count = 0;
      for (const it of items) {
        if (it.offsetParent !== null && it.offsetTop <= top0 + 1) count += 1;
        else break;
      }
      fitCount.value = count;
      lastWidth = w;
    } finally {
      if (measureWatchdog) {
        clearTimeout(measureWatchdog);
        measureWatchdog = undefined;
      }
      measuring.value = false;
    }
  });
}

/** slot 模式：无法用 class 绑定，直接操作子节点显隐 */
function applySlotCollapse(): void {
  if (props.filters && props.filters.length > 0) return;
  const el = contentEl.value;
  if (!el) return;
  Array.from(el.children).forEach((child, i) => {
    const hidden = isFieldHidden(i);
    (child as HTMLElement).style.display = hidden ? "none" : "";
  });
}
watch([collapsedLimit, hasOverflow, localExpanded, measuring, itemCount], applySlotCollapse, { flush: "post" });
watch([itemCount, () => props.max], () => {
  // 字段数量变化时即使宽度未变也需强制重测
  lastWidth = -1;
  nextTick(() => measureFit());
});
watch(localFilterVisible, () => {
  nextTick(() => measureFit());
});
onMounted(() => {
  if (typeof ResizeObserver === "undefined") return;
  resizeObserver = new ResizeObserver(() => measureFit());
  if (contentEl.value) resizeObserver.observe(contentEl.value);
  nextTick(() => measureFit());
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (measureWatchdog) {
    clearTimeout(measureWatchdog);
    measureWatchdog = undefined;
  }
  measuring.value = false;
});
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
          }"
        >
          <template v-if="filters && filters.length > 0">
            <div
              v-for="(filter, index) in filters"
              :key="filter.key"
              class="re-search__field"
              :class="{ 're-search__field--hidden': isFieldHidden(index) }"
            >
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
            show-text
            :loading="loading"
            @click="emit('search')"
          >{{ searchText }}</ReButton>
          <ReButton
            v-if="showResetBtn"
            type="danger"
            icon="RefreshLeft"
            show-text
            @click="resetForm"
          >{{ resetText }}</ReButton>
          <ReSearchToolbar
            v-if="showAddBtn || showBatchDeleteBtn || showBatchSelectBtn || showRefreshBtn || showToggle || !!slots.footer"
            :filter-visible="localFilterVisible"
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
  /* flex-basis 必须是 0：若取内容宽度（auto），字段区会被 grid 的内在宽度撑开，
     把操作按钮挤到下一行；且测量出的可用宽度就不再等于「去掉按钮后」的宽度 */
  flex: 1 1 0;
  display: grid;
  /* min(220px, 100%) 保证容器过窄时列宽跟着缩，而不是溢出到按钮下面 */
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
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

/* 响应式收纳：折叠态隐藏放不下的字段 */
.re-search__field--hidden {
  display: none;
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
    grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  }
  .re-search__actions {
    width: 100%;
    justify-content: flex-end;
    margin-left: 0;
  }
}
</style>