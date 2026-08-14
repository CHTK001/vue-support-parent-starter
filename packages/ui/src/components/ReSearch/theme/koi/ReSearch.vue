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
import { ref, watch, computed, useSlots, defineAsyncComponent, type CSSProperties } from "vue";
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
    <transition name="re-search-collapse">
      <div
        v-show="showSearch"
        class="koi-search"
        :class="{
          'koi-search--bordered': bordered,
          'koi-search--form': filterMode === 'form',
        }"
        :style="containerStyle"
      >
        <!-- 顶部标题栏 -->
        <div v-if="localFilterVisible" class="koi-search__header">
          <div class="koi-search__header-title">
            <span class="koi-search__title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
            </span>
            <span>{{ title }}</span>
          </div>
        </div>

        <!-- 过滤区域 -->
        <el-collapse-transition>
          <div
            v-if="localFilterVisible"
            class="koi-search__content"
            :class="{
              'koi-search__content--form': filterMode === 'form',
              'koi-search__content--data': filterMode === 'data',
            }"
          >
            <slot />
          </div>
        </el-collapse-transition>

        <!-- 分割线 -->
        <el-divider v-if="localFilterVisible" />

        <!-- 底部操作按钮组（始终可见） -->
        <div class="koi-search__footer">
          <ReSearchToolbar
            :filter-visible="localFilterVisible"
            :btn-mode="btnMode"
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
            @search="emit('search')"
            @reset="emit('reset')"
            @add="emit('add')"
            @batch-delete="emit('batch-delete')"
            @batch-select="emit('batch-select')"
          />
        </div>
      </div>
    </transition>
  </div>

  </template>

<style scoped lang="scss">
.koi-search {
  position: relative;
  margin: 4px 4px 0;
  overflow: hidden;
  color: var(--theme-color-text, var(--rs-text));
  background: var(--rs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-md);
  box-shadow: none;
  transition: border-color var(--rs-transition), box-shadow var(--rs-transition);
}

.koi-search--bordered {
  border: 1px solid var(--rs-border);
  box-shadow: var(--rs-shadow-xs);
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

/* 顶部标题栏 */
.koi-search__header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.koi-search__header-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--rs-font-md);
  font-weight: 600;
  color: var(--rs-text);
}
.koi-search__title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgb(156, 195, 255);
  border-radius: 6px;
  background-color: rgb(235, 243, 255);
  color: rgb(57, 134, 255);
  flex-shrink: 0;
}
.koi-search__header-icon {
  width: 16px;
  height: 16px;
  color: var(--el-color-primary-light-2);
}

.koi-search__content {
  padding: 0 2px 10px;
}

.koi-search__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 2px 0;
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
