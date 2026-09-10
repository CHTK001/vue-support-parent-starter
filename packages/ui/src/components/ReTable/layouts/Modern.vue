<script setup lang="ts">
// @ts-nocheck
/**
 * ReTable Modern 布局 —— 现代化扁平表格布局
 *
 * 设计特点：
 *   - 无边框行分隔（或极细线）
 *   - 干净的表头（浅色背景）
 *   - hover 行高亮（平滑过渡）
 *   - 现代卡片式行（可选）
 *   - 大圆角表格容器
 *   - checkbox 批量选择
 *   - 列排序
 *   - 单元格点击
 *   - 右键菜单
 */
import "../../shared/modern-vars.css";
import { computed, ref, watch } from "vue";
import { ElCheckbox } from "element-plus";
import type { ReTableColumn, ReTableContextMenuContext, ReTableCellClickPayload } from "../types";

defineOptions({ name: "ReTableModernView" });

const props = withDefaults(
  defineProps<{
    rows: Array<Record<string, unknown>>;
    columns: ReTableColumn[];
    loading?: boolean;
    emptyText?: string;
    rowKey?: string;
    cardStyle?: boolean;
    /** 是否显示 checkbox 列 */
    selectable?: boolean;
    /** 选中行的 key 集合（受控） */
    selectedKeys?: Set<string>;
    /** 分页 */
    pagination?: boolean;
    page?: number;
    pageSize?: number;
    total?: number;
    pageSizes?: number[];
  }>(),
  {
    rows: () => [],
    columns: () => [],
    loading: false,
    emptyText: "暂无数据",
    rowKey: "id",
    cardStyle: false,
    selectable: false,
    selectedKeys: undefined,
    pagination: false,
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizes: () => [10, 20, 50, 100],
  },
);

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "cell-click", payload: ReTableCellClickPayload): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "row-contextmenu", ctx: ReTableContextMenuContext): void;
  (e: "update:page", page: number): void;
  (e: "update:pageSize", size: number): void;
  (e: "sort-change", prop: string, order: "ascending" | "descending" | null): void;
}>();

/** 排序状态 */
const sortProp = ref<string>("");
const sortOrder = ref<"ascending" | "descending" | null>(null);

/** 本地选中行 key 集合 */
const localSelectedKeys = ref<Set<string>>(props.selectedKeys ?? new Set());

watch(() => props.selectedKeys, (v) => {
  if (v) localSelectedKeys.value = new Set(v);
}, { deep: true });

/** 排序后的行 */
const sortedRows = computed(() => {
  if (!sortProp.value || !sortOrder.value) return props.rows;
  const prop = sortProp.value;
  const dir = sortOrder.value === "ascending" ? 1 : -1;
  return [...props.rows].sort((a, b) => {
    const va = a[prop];
    const vb = b[prop];
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * dir;
    if (vb == null) return 1 * dir;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
});

/** 全选状态 */
const isAllSelected = computed(() => {
  if (props.rows.length === 0) return false;
  return props.rows.every((row) => localSelectedKeys.value.has(String(row[props.rowKey] ?? "")));
});

/** 半选状态 */
const isIndeterminate = computed(() => {
  if (props.rows.length === 0) return false;
  const selected = props.rows.filter((row) => localSelectedKeys.value.has(String(row[props.rowKey] ?? "")));
  return selected.length > 0 && selected.length < props.rows.length;
});

/** 切换全选 */
function onToggleAll(val: boolean): void {
  const keys = new Set(localSelectedKeys.value);
  if (val) {
    for (const row of props.rows) {
      keys.add(String(row[props.rowKey] ?? ""));
    }
  } else {
    for (const row of props.rows) {
      keys.delete(String(row[props.rowKey] ?? ""));
    }
  }
  localSelectedKeys.value = keys;
  emitSelectionChange();
}

/** 切换单行选中 */
function onToggleRow(row: Record<string, unknown>): void {
  const key = String(row[props.rowKey] ?? "");
  const keys = new Set(localSelectedKeys.value);
  if (keys.has(key)) {
    keys.delete(key);
  } else {
    keys.add(key);
  }
  localSelectedKeys.value = keys;
  emitSelectionChange();
}

/** 判断行是否选中 */
function isRowSelected(row: Record<string, unknown>): boolean {
  return localSelectedKeys.value.has(String(row[props.rowKey] ?? ""));
}

/** 发射选中变化 */
function emitSelectionChange(): void {
  const selectedRows = props.rows.filter((row) => localSelectedKeys.value.has(String(row[props.rowKey] ?? "")));
  emit("selection-change", selectedRows);
}

/** 获取单元格值 */
function getCellValue(row: Record<string, unknown>, col: ReTableColumn): string {
  const value = row[col.prop];
  if (col.formatter) return col.formatter(row, col, value);
  if (value == null) return "-";
  return String(value);
}

/** 列排序点击 */
function onSortClick(col: ReTableColumn): void {
  if (!col.sortable) return;
  if (sortProp.value !== col.prop) {
    sortProp.value = col.prop;
    sortOrder.value = "ascending";
  } else if (sortOrder.value === "ascending") {
    sortOrder.value = "descending";
  } else if (sortOrder.value === "descending") {
    sortOrder.value = null;
    sortProp.value = "";
  } else {
    sortOrder.value = "ascending";
  }
  emit("sort-change", sortProp.value, sortOrder.value);
}

/** 单元格点击 */
function onCellClick(row: Record<string, unknown>, col: ReTableColumn, rowIndex: number, event: MouseEvent): void {
  emit("cell-click", {
    row,
    rowIndex,
    columnProp: col.prop,
    columnLabel: col.label,
    cellValue: row[col.prop],
    event,
  });
}

/** 行右键 */
function onRowContextmenu(row: Record<string, unknown>, rowIndex: number, event: MouseEvent): void {
  event.preventDefault();
  emit("row-contextmenu", {
    row,
    rowIndex,
    event,
  });
}

/** 单元格右键 */
function onCellContextmenu(row: Record<string, unknown>, col: ReTableColumn, rowIndex: number, event: MouseEvent): void {
  event.preventDefault();
  emit("row-contextmenu", {
    row,
    rowIndex,
    columnProp: col.prop,
    columnLabel: col.label,
    event,
  });
}

/** 分页 */
function onCurrentChange(p: number): void {
  emit("update:page", p);
}
function onSizeChange(s: number): void {
  emit("update:pageSize", s);
  if (props.page !== 1) emit("update:page", 1);
}

/** 总页数 */
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

/** 分页页码列表 */
const pageList = computed(() => {
  const total = totalPages.value;
  const current = props.page;
  const pages: number[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push(-1); // -1 代表省略号
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-2); // -2 代表省略号
    pages.push(total);
  }
  return pages;
});
</script>

<template>
  <div
    :class="[
      'rm-table',
      {
        'rm-table--card': cardStyle,
        'rm-table--loading': loading,
        'rm-table--selectable': selectable,
      },
    ]"
  >
    <!-- Loading overlay -->
    <div v-if="loading" class="rm-table__loading">
      <svg class="rm-table__spinner" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round" />
      </svg>
    </div>

    <!-- Table header -->
    <div v-if="!cardStyle" class="rm-table__header">
      <!-- Checkbox 列 -->
      <div v-if="selectable" class="rm-table__th rm-table__th--check">
        <ElCheckbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="onToggleAll"
        />
      </div>
      <div
        v-for="col in columns"
        :key="col.prop"
        :class="['rm-table__th', { 'rm-table__th--sortable': col.sortable, 'rm-table__th--sorted': sortProp === col.prop }]"
        :style="{
          width: col.width ? (typeof col.width === 'number' ? col.width + 'px' : col.width) : undefined,
          minWidth: col.minWidth ? (typeof col.minWidth === 'number' ? col.minWidth + 'px' : col.minWidth) : undefined,
          textAlign: col.align || 'left',
        }"
        @click="col.sortable && onSortClick(col)"
      >
        <span class="rm-table__th-label">{{ col.label }}</span>
        <span v-if="col.sortable" class="rm-table__th-sort">
          <svg
            :class="['rm-table__sort-icon', { 'rm-table__sort-icon--asc': sortProp === col.prop && sortOrder === 'ascending', 'rm-table__sort-icon--desc': sortProp === col.prop && sortOrder === 'descending' }]"
            viewBox="0 0 24 24" fill="currentColor" width="14" height="14"
          >
            <path d="M12 5l7 7H5z" opacity="0.4" />
            <path d="M12 19l-7-7h14z" opacity="0.4" />
          </svg>
        </span>
      </div>
    </div>

    <!-- Table body -->
    <div v-if="sortedRows.length > 0" class="rm-table__body">
      <div
        v-for="(row, idx) in sortedRows"
        :key="String(row[rowKey] ?? idx)"
        :class="['rm-table__row', { 'rm-table__row--card': cardStyle, 'rm-table__row--selected': isRowSelected(row) }]"
        @click="emit('row-click', row)"
        @contextmenu="(e: MouseEvent) => onRowContextmenu(row, idx, e)"
      >
        <template v-if="!cardStyle">
          <!-- Checkbox 列 -->
          <div v-if="selectable" class="rm-table__td rm-table__td--check" @click.stop>
            <ElCheckbox
              :model-value="isRowSelected(row)"
              @change="onToggleRow(row)"
            />
          </div>
          <div
            v-for="col in columns"
            :key="col.prop"
            class="rm-table__td"
            :style="{
              width: col.width ? (typeof col.width === 'number' ? col.width + 'px' : col.width) : undefined,
              minWidth: col.minWidth ? (typeof col.minWidth === 'number' ? col.minWidth + 'px' : col.minWidth) : undefined,
              textAlign: col.align || 'left',
            }"
            @click="onCellClick(row, col, idx, $event)"
            @contextmenu.stop="(e: MouseEvent) => onCellContextmenu(row, col, idx, e)"
          >
            <slot :name="`modern-col-${col.prop}`" :row="row" :value="row[col.prop]">
              {{ getCellValue(row, col) }}
            </slot>
          </div>
        </template>
        <template v-else>
          <!-- Card style row -->
          <div class="rm-table__card" @click.stop>
            <div v-if="selectable" class="rm-table__card-check">
              <ElCheckbox
                :model-value="isRowSelected(row)"
                @change="onToggleRow(row)"
              />
            </div>
            <div
              v-for="col in columns"
              :key="col.prop"
              class="rm-table__card-field"
            >
              <span class="rm-table__card-label">{{ col.label }}</span>
              <span class="rm-table__card-value">{{ getCellValue(row, col) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!loading" class="rm-table__empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="rm-table__empty-icon">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="3" x2="9" y2="9"/>
      </svg>
      <span>{{ emptyText }}</span>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && total > 0" class="rm-table__pagination">
      <span class="rm-table__pagination-total">共 {{ total }} 条</span>
      <div class="rm-table__pagination-pages">
        <button
          class="rm-table__pagination-btn"
          :disabled="page <= 1"
          @click="onCurrentChange(page - 1)"
        >‹</button>
        <template v-for="p in pageList" :key="p">
          <span v-if="p < 0" class="rm-table__pagination-ellipsis">…</span>
          <button
            v-else
            :class="['rm-table__pagination-btn', { 'rm-table__pagination-btn--active': p === page }]"
            @click="onCurrentChange(p)"
          >{{ p }}</button>
        </template>
        <button
          class="rm-table__pagination-btn"
          :disabled="page >= totalPages"
          @click="onCurrentChange(page + 1)"
        >›</button>
      </div>
      <select
        class="rm-table__pagination-size"
        :value="pageSize"
        @change="onSizeChange(Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="s in pageSizes" :key="s" :value="s">{{ s }} 条/页</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.rm-table {
  position: relative;
  width: 100%;
  margin: 16px; /* 默认外边距 16px（组件级——使用处无需再设） */
  border-radius: var(--rm-radius-lg);
  background: var(--rm-bg);
  border: 1px solid var(--rm-border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column; /* 表格体弹性滚动——分页固定在底部可见（不溢出裁剪） */
}

/* Header */
.rm-table__header {
  display: flex;
  padding: 0 16px;
  background: var(--rm-bg-subtle);
  border-bottom: 1px solid var(--rm-border-light);
}
.rm-table__th {
  flex: 1;
  padding: 12px 8px;
  font-size: var(--rm-font-sm);
  font-weight: 600;
  color: var(--rm-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  user-select: none;
}
.rm-table__th--sortable {
  cursor: pointer;
  transition: color var(--rm-transition);
}
.rm-table__th--sortable:hover {
  color: var(--rm-primary);
}
.rm-table__th--sorted {
  color: var(--rm-primary);
}
.rm-table__th--check {
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}
.rm-table__th-label {
  vertical-align: middle;
}
.rm-table__th-sort {
  display: inline-flex;
  flex-direction: column;
  margin-left: 4px;
  vertical-align: middle;
  line-height: 1;
}
.rm-table__sort-icon {
  transition: opacity var(--rm-transition);
}
.rm-table__sort-icon--asc path:first-child { opacity: 1; }
.rm-table__sort-icon--asc path:last-child { opacity: 0.3; }
.rm-table__sort-icon--desc path:first-child { opacity: 0.3; }
.rm-table__sort-icon--desc path:last-child { opacity: 1; }

/* Body */
.rm-table__body {
  overflow-y: auto;
  flex: 1;
  min-height: 0; /* 表格体占剩余高度滚动——分页不被挤出容器 */
}

/* Row */
.rm-table__row {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid var(--rm-border-light);
  transition: background var(--rm-transition);
  cursor: pointer;
}
.rm-table__row:last-child { border-bottom: none; }
.rm-table__row:hover { background: var(--rm-bg-hover); }
.rm-table__row--selected { background: var(--rm-primary-light-9, #eef2ff); }
.rm-table__row--selected:hover { background: var(--rm-primary-light-8, #e0e7ff); }

.rm-table__td {
  flex: 1;
  padding: 14px 8px;
  font-size: var(--rm-font-md);
  color: var(--rm-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--rm-transition);
}
.rm-table__td:hover {
  color: var(--rm-primary);
}
.rm-table__td--check {
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  cursor: default;
}
.rm-table__td--check:hover {
  color: inherit;
}

/* Card style */
.rm-table__row--card {
  padding: 12px 16px;
}
.rm-table__card {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  width: 100%;
}
.rm-table__card-check {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}
.rm-table__card-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
}
.rm-table__card-label {
  font-size: var(--rm-font-xs);
  font-weight: 600;
  color: var(--rm-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.rm-table__card-value {
  font-size: var(--rm-font-md);
  color: var(--rm-text);
}

/* Empty */
.rm-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 16px;
  min-height: var(--re-table-min-height, 300px);
  color: var(--rm-text-secondary);
  font-size: var(--rm-font-md);
}
.rm-table__empty-icon {
  width: 48px;
  height: 48px;
  color: var(--rm-text-disabled);
}

/* Loading */
.rm-table__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rm-bg-glass);
  z-index: 10;
  border-radius: inherit;
}
.rm-table__spinner {
  width: 32px;
  height: 32px;
  color: var(--rm-primary);
  animation: rm-spin 0.8s linear infinite;
}
@keyframes rm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pagination */
.rm-table__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--rm-border-light);
  font-size: var(--rm-font-sm);
  color: var(--rm-text-secondary);
  gap: 12px;
  flex-wrap: wrap;
}
.rm-table__pagination-total {
  white-space: nowrap;
}
.rm-table__pagination-pages {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rm-table__pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--rm-border-light);
  border-radius: var(--rm-radius-sm);
  background: var(--rm-bg);
  color: var(--rm-text);
  font-size: var(--rm-font-sm);
  cursor: pointer;
  transition: all var(--rm-transition);
}
.rm-table__pagination-btn:hover:not(:disabled) {
  color: var(--rm-primary);
  border-color: var(--rm-primary);
}
.rm-table__pagination-btn--active {
  background: var(--rm-primary);
  color: var(--rm-text-white);
  border-color: var(--rm-primary);
}
.rm-table__pagination-btn--active:hover {
  background: var(--rm-primary-hover);
  color: var(--rm-text-white);
  border-color: var(--rm-primary-hover);
}
.rm-table__pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.rm-table__pagination-ellipsis {
  padding: 0 4px;
  color: var(--rm-text-disabled);
}
.rm-table__pagination-size {
  padding: 4px 8px;
  border: 1px solid var(--rm-border-light);
  border-radius: var(--rm-radius-sm);
  background: var(--rm-bg);
  color: var(--rm-text);
  font-size: var(--rm-font-sm);
  cursor: pointer;
  outline: none;
}
.rm-table__pagination-size:focus {
  border-color: var(--rm-primary);
}
</style>