<script setup lang="ts">
/**
 * RePagination Modern 布局 —— 现代化扁平分页
 *
 * 设计特点：
 *   - 扁平页码按钮（无背景）
 *   - 当前页高亮（主色背景）
 *   - 左右箭头使用 chevron 图标
 *   - 平滑过渡动画
 */
import { computed, ref } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "RePaginationModern" });

const props = withDefaults(
  defineProps<{
    total: number;
    currentPage?: number;
    pageSize?: number;
    pageSizes?: number[];
    disabled?: boolean;
    small?: boolean;
  }>(),
  {
    currentPage: 1,
    pageSize: 10,
    pageSizes: () => [10, 20, 50, 100],
    disabled: false,
    small: false,
  },
);

const emit = defineEmits<{
  "update:currentPage": [val: number];
  "update:pageSize": [val: number];
  "current-change": [val: number];
  "size-change": [val: number];
  "prev-click": [val: number];
  "next-click": [val: number];
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

/** 生成页码数组（含省略号占位 -1） */
const pages = computed<number[]>(() => {
  const total = totalPages.value;
  const cur = props.currentPage;
  const items: number[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) items.push(i);
    return items;
  }
  items.push(1);
  if (cur > 3) items.push(-1);
  const start = Math.max(2, cur - 1);
  const end = Math.min(total - 1, cur + 1);
  for (let i = start; i <= end; i++) items.push(i);
  if (cur < total - 2) items.push(-1);
  items.push(total);
  return items;
});

function goPage(p: number): void {
  if (p < 1 || p > totalPages.value || p === props.currentPage || props.disabled) return;
  emit("update:currentPage", p);
  emit("current-change", p);
}

function prev(): void {
  if (props.currentPage <= 1 || props.disabled) return;
  const p = props.currentPage - 1;
  emit("update:currentPage", p);
  emit("current-change", p);
  emit("prev-click", p);
}

function next(): void {
  if (props.currentPage >= totalPages.value || props.disabled) return;
  const p = props.currentPage + 1;
  emit("update:currentPage", p);
  emit("current-change", p);
  emit("next-click", p);
}

const showSizeSelect = ref(false);
function onSizeChange(size: number): void {
  emit("update:pageSize", size);
  emit("size-change", size);
  if (props.currentPage !== 1) {
    emit("update:currentPage", 1);
    emit("current-change", 1);
  }
  showSizeSelect.value = false;
}
</script>

<template>
  <nav
    :class="['rm-pager', { 'rm-pager--small': small, 'rm-pager--disabled': disabled }]"
    v-bind="$attrs"
  >
    <!-- Total -->
    <span class="rm-pager__total">共 {{ total }} 条</span>

    <!-- Size select -->
    <div v-if="pageSizes.length > 0" class="rm-pager__sizes">
      <button class="rm-pager__size-btn" type="button" @click="showSizeSelect = !showSizeSelect">
        {{ pageSize }} 条/页
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div v-if="showSizeSelect" class="rm-pager__size-dropdown">
        <button
          v-for="s in pageSizes"
          :key="s"
          :class="['rm-pager__size-option', { 'rm-pager__size-option--active': pageSize === s }]"
          type="button"
          @click="onSizeChange(s)"
        >{{ s }} 条/页</button>
      </div>
    </div>

    <!-- Prev -->
    <button
      class="rm-pager__btn rm-pager__btn--prev"
      type="button"
      :disabled="currentPage <= 1 || disabled"
      @click="prev"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>

    <!-- Pages -->
    <button
      v-for="(p, idx) in pages"
      :key="idx"
      :class="[
        'rm-pager__btn',
        {
          'rm-pager__btn--active': p === currentPage,
          'rm-pager__btn--ellipsis': p === -1,
        },
      ]"
      :disabled="p === -1 || disabled"
      type="button"
      @click="p !== -1 ? goPage(p) : undefined"
    >
      <span v-if="p === -1">...</span>
      <span v-else>{{ p }}</span>
    </button>

    <!-- Next -->
    <button
      class="rm-pager__btn rm-pager__btn--next"
      type="button"
      :disabled="currentPage >= totalPages || disabled"
      @click="next"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </nav>
</template>

<style scoped>
.rm-pager {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--rm-font-md);
  color: var(--rm-text-regular);
  user-select: none;
}
.rm-pager--small { font-size: var(--rm-font-sm); }
.rm-pager--disabled { opacity: 0.5; pointer-events: none; }

.rm-pager__total {
  font-size: var(--rm-font-sm);
  color: var(--rm-text-secondary);
  margin-right: 8px;
  white-space: nowrap;
}

/* Sizes */
.rm-pager__sizes {
  position: relative;
  margin-right: 4px;
}
.rm-pager__size-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: var(--rm-height-sm);
  padding: 0 10px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-sm);
  background: var(--rm-bg);
  color: var(--rm-text-regular);
  font-size: var(--rm-font-sm);
  cursor: pointer;
  transition: border-color var(--rm-transition);
  font-family: inherit;
}
.rm-pager__size-btn:hover { border-color: var(--rm-border-hover); }
.rm-pager__size-btn svg { width: 14px; height: 14px; color: var(--rm-text-secondary); }

.rm-pager__size-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 10;
  min-width: 100%;
  padding: 4px;
  margin-bottom: 4px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-sm);
  background: var(--rm-bg);
  box-shadow: var(--rm-shadow-md);
}
.rm-pager__size-option {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: var(--rm-radius-xs);
  background: transparent;
  color: var(--rm-text);
  font-size: var(--rm-font-sm);
  text-align: left;
  cursor: pointer;
  transition: background var(--rm-transition);
  white-space: nowrap;
  font-family: inherit;
}
.rm-pager__size-option:hover { background: var(--rm-bg-hover); }
.rm-pager__size-option--active { color: var(--rm-primary); font-weight: 500; }

/* Page buttons */
.rm-pager__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: none;
  border-radius: var(--rm-radius-sm);
  background: transparent;
  color: var(--rm-text-regular);
  font-size: var(--rm-font-md);
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--rm-transition),
    color var(--rm-transition);
  font-family: inherit;
}
.rm-pager--small .rm-pager__btn { min-width: 28px; height: 28px; font-size: var(--rm-font-sm); }

.rm-pager__btn:hover:not(:disabled):not(.rm-pager__btn--active):not(.rm-pager__btn--ellipsis) {
  background: var(--rm-bg-hover);
}
.rm-pager__btn--active {
  background: var(--rm-primary);
  color: var(--rm-text-white);
}
.rm-pager__btn:disabled {
  color: var(--rm-text-disabled);
  cursor: not-allowed;
}
.rm-pager__btn--ellipsis {
  cursor: default;
  letter-spacing: 2px;
}
.rm-pager__btn--prev svg,
.rm-pager__btn--next svg {
  width: 16px;
  height: 16px;
}
</style>
