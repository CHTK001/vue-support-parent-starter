<script setup lang="ts">
/**
 * ReSearch koi 主题 —— 搜索区折叠组件
 *
 * 特性：
 *   - 顶部标题栏：搜索图标 + 「搜索」标题
 *   - 过滤区域默认显示（表单模式），通过工具栏「显示/隐藏」按钮切换
 *   - 内置操作按钮组（ReSearchToolbar）：搜索 / 重置 / 新增 / 批量删除 / 批量勾选等，
 *     每个按钮均可通过 prop 配置显示与事件
 */
import { ref, watch, computed, useSlots, nextTick, defineAsyncComponent, type CSSProperties } from "vue";
import { ElDivider } from "element-plus";
import "../../shared/research-vars.css";
import ReSearchToolbar from "../../ReSearchToolbar.vue";

const ModernLayout = defineAsyncComponent(() => import("../../layouts/Modern.vue"));

defineOptions({ name: "ReSearch", inheritAttrs: true });

const slots = useSlots();
const hasDefaultSlot = computed(() => slots.default && slots.default().length > 0);

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
    /** 标题栏文案（默认"搜索"） */
    title?: string;
    /** 过滤区当前是否可见（v-model 双向绑定） */
    filterVisible?: boolean;
    /** 工具栏按钮模式：icon=图标+tooltip，text=图标+文字 */
    btnMode?: "icon" | "text";
    /** 工具栏：显示/隐藏过滤区 */
    showToggle?: boolean;
    /** 工具栏：搜索按钮 */
    showSearchBtn?: boolean;
    searchText?: string;
    /** 工具栏：重置按钮 */
    showResetBtn?: boolean;
    resetText?: string;
    /** 工具栏：新增按钮 */
    showAddBtn?: boolean;
    addText?: string;
    /** 工具栏：批量删除按钮 */
    showBatchDeleteBtn?: boolean;
    batchDeleteText?: string;
    batchDeleteDisabled?: boolean;
    /** 工具栏：批量勾选按钮 */
    showBatchSelectBtn?: boolean;
    batchSelectText?: string;
    batchSelectActive?: boolean;
    batchSelectTextActive?: string;
    /** 搜索按钮 loading */
    loading?: boolean;
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
    padding: "12px 20px 8px",
    title: "搜索",
    filterVisible: true,
    btnMode: "icon",
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
    batchSelectText: "批量勾选",
    batchSelectActive: false,
    batchSelectTextActive: "取消勾选",
    loading: false,
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
}>();

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

const containerStyle = computed<CSSProperties>(() => {
  const base: CSSProperties = { padding: props.padding };
  if (props.mode === 2) base["--label-width"] = "100px";
  return base;
});

/** 内容区域最大高度过渡 */
const contentMaxHeight = ref<number>(0);
const contentEl = ref<HTMLElement | null>(null);
const showOverflow = computed(() => !localFilterVisible.value);
const contentStyle = computed<CSSProperties>(() => ({
  maxHeight: localFilterVisible.value ? `${contentMaxHeight.value}px` : "0px",
  transition: "max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
}));

watch(localFilterVisible, async (v) => {
  if (v) {
    await nextTick();
    if (contentEl.value) {
      contentMaxHeight.value = contentEl.value.scrollHeight;
    }
  }
});

function onContentReady(el: HTMLElement | null): void {
  contentEl.value = el;
  if (el && localFilterVisible.value) {
    contentMaxHeight.value = el.scrollHeight;
  }
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

  <div v-if="hasDefaultSlot && layout !== 'modern'">
    <div
      v-show="showSearch"
      class="koi-search"
      :class="{
        'koi-search--bordered': bordered,
        'koi-search--form': filterMode === 'form',
      }"
      :style="containerStyle"
    >
      <!-- 顶部标题栏：始终可见，标题+切换按钮 -->
      <div class="koi-search__header" :class="{ 'is-toggleable': showToggle }" @click="showToggle ? toggleFilter() : undefined">
        <div class="koi-search__title">
          <span class="koi-search__title-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <span>{{ title }}</span>
        </div>
        <div v-if="showToggle" class="koi-search__toggle">
          <span>{{ localFilterVisible ? "收起" : "展开" }}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="14"
            height="14"
            class="koi-search__arrow"
            :class="{ 'is-expanded': localFilterVisible }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <!-- 过滤区域 -->
      <div
        class="koi-search__content"
        :class="{
          'is-expanded': localFilterVisible,
          'is-overflow': showOverflow,
        }"
        :style="contentStyle"
      >
        <div
        v-show="localFilterVisible"
        ref="onContentReady"
        class="koi-search__content-inner"
          :class="{
            'koi-search__content--form': filterMode === 'form',
            'koi-search__content--data': filterMode === 'data',
          }"
        >
          <slot />
        </div>
      </div>

      <!-- 底部操作按钮组 -->
      <div v-if="localFilterVisible" class="koi-search__footer">
        <ReSearchToolbar
          :filter-visible="localFilterVisible"
          :btn-mode="btnMode"
          :show-toggle="false"
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
          @search="emit('search')"
          @reset="emit('reset')"
          @add="emit('add')"
          @batch-delete="emit('batch-delete')"
          @batch-select="emit('batch-select')"
        />
      </div>
    </div>
  </div>

  </template>

<style scoped lang="scss">
.koi-search {
  position: relative;
  margin: 8px;
  overflow: hidden;
  color: var(--theme-color-text, var(--rs-text));
  background: var(--rs-bg-card);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px 18px 0;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.04);
}

.koi-search--bordered {
  border-color: var(--el-border-color-lighter);
}

/* 顶部标题栏 */
.koi-search__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  user-select: none;
}
.koi-search__header.is-toggleable {
  cursor: pointer;
}

.koi-search__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.koi-search__title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 6px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.koi-search__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  transition: color 0.3s;
}
.koi-search__toggle:hover {
  color: var(--el-color-primary);
}

.koi-search__arrow {
  transition: transform 0.3s;
}
.koi-search__arrow.is-expanded {
  transform: rotate(180deg);
}

/* 过滤区域 */
.koi-search__content {
  overflow: hidden;
  will-change: max-height;
}

.koi-search__content-inner {
  padding: 0 2px 10px;
}

.koi-search__content--form :deep(> *:not(.el-row)) {
  display: grid;
  grid-template-columns: var(--label-width, 100px) 1fr;
  align-items: center;
  gap: 12px;
  padding: 6px 4px;
}
.koi-search__content--data :deep(> *) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 6px 4px;
}

/* 底部操作按钮组 */
.koi-search__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 0 10px;
}
</style>
