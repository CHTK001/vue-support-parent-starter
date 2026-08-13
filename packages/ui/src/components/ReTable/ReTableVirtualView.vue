<script setup lang="ts">
/**
 * ReTable 虚拟表格视图（包装 el-table-v2）
 *
 * 大量数据（>1000 行）场景下使用。支持固定行高和动态行高两种模式。
 * 支持：cell-click、右键菜单、checkbox 选择、列排序、空数据提示、加载状态、分页
 *
 * 动态行高模式：设置 layout.estimatedRowHeight 且不设置 layout.rowHeight，
 * 则行高按内容自适应（适合多行文本场景）。
 */
import { computed, h, ref, type PropType } from "vue";
import { ElTableV2, ElAutoResizer, ElCheckbox, ElEmpty, ElPagination, type Column } from "element-plus";
import type { ReTableColumn, ReVirtualLayoutProps, ReTableContextMenuItem, ReTableContextMenuContext, ReTableCellClickPayload } from "./types";

defineOptions({ name: "ReTableVirtualView" });

const props = defineProps({
  rows: {
    type: Array as PropType<Array<Record<string, unknown>>>,
    default: () => [],
  },
  columns: {
    type: Array as PropType<ReTableColumn[]>,
    default: () => [],
  },
  layout: {
    type: Object as PropType<ReVirtualLayoutProps>,
    default: () => ({}),
  },
  rowKey: {
    type: String,
    default: "id",
  },
  /** 是否显示 checkbox 列 */
  selectable: {
    type: Boolean,
    default: false,
  },
  /** 右键菜单项 */
  contextMenu: {
    type: Array as PropType<ReTableContextMenuItem[]>,
    default: () => [],
  },
  /** 空数据提示文字 */
  emptyText: {
    type: String,
    default: "暂无数据",
  },
  /** 加载状态 */
  loading: {
    type: Boolean,
    default: false,
  },
  /** 是否显示分页 */
  pagination: {
    type: Boolean,
    default: false,
  },
  /** 当前页码 */
  page: {
    type: Number,
    default: 1,
  },
  /** 每页条数 */
  pageSize: {
    type: Number,
    default: 10,
  },
  /** 总条数 */
  total: {
    type: Number,
    default: 0,
  },
  /** 每页条数选项 */
  pageSizes: {
    type: Array as PropType<number[]>,
    default: () => [10, 20, 50, 100],
  },
});

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
  (e: "cell-click", payload: ReTableCellClickPayload): void;
  (e: "selection-change", rows: Record<string, unknown>[]): void;
  (e: "context-menu", ctx: ReTableContextMenuContext): void;
  (e: "sort-change", payload: { prop: string; order: "ascending" | "descending" | null }): void;
  (e: "update:page", page: number): void;
  (e: "update:page-size", size: number): void;
}>();

/** 选中行 key 集合 */
const selectedKeys = ref<Set<string>>(new Set());

/** 全选状态 */
const isAllSelected = computed(() => {
  if (props.rows.length === 0) return false;
  return props.rows.every((row) => selectedKeys.value.has(String(row[props.rowKey] ?? "")));
});

/** 半选状态 */
const isIndeterminate = computed(() => {
  if (props.rows.length === 0) return false;
  const count = props.rows.filter((row) => selectedKeys.value.has(String(row[props.rowKey] ?? ""))).length;
  return count > 0 && count < props.rows.length;
});

/** 切换全选 */
function onToggleAll(val: boolean): void {
  if (val) {
    for (const row of props.rows) {
      selectedKeys.value.add(String(row[props.rowKey] ?? ""));
    }
  } else {
    selectedKeys.value.clear();
  }
  emitSelectionChange();
}

/** 切换单行选中 */
function onToggleRow(row: Record<string, unknown>): void {
  const key = String(row[props.rowKey] ?? "");
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key);
  } else {
    selectedKeys.value.add(key);
  }
  emitSelectionChange();
}

/** 发射选中变化 */
function emitSelectionChange(): void {
  const selectedRows = props.rows.filter((row) => selectedKeys.value.has(String(row[props.rowKey] ?? "")));
  emit("selection-change", selectedRows);
}

/** el-table-v2 列定义 */
const v2Columns = computed(() => {
  const cols: Array<Column<Record<string, unknown>>> = [];

  // checkbox 列
  if (props.selectable) {
    cols.push({
      key: "__selection__",
      dataKey: "__selection__",
      title: "",
      width: 50,
      align: "center",
      cellRenderer: ({ rowData, rowIndex }: { rowData: Record<string, unknown>; rowIndex: number }) => {
        const key = String(rowData[props.rowKey] ?? "");
        const checked = selectedKeys.value.has(key);
        return h(ElCheckbox, {
          modelValue: checked,
          onChange: () => onToggleRow(rowData),
        });
      },
      headerCellRenderer: () => {
        return h(ElCheckbox, {
          modelValue: isAllSelected.value,
          indeterminate: isIndeterminate.value,
          onChange: (v: any) => onToggleAll(v as boolean),
        });
      },
    } as unknown as Column<Record<string, unknown>>);
  }

  // 数据列
  for (const c of props.columns) {
    if (c.hidden) continue;
    cols.push({
      key: c.prop,
      dataKey: c.prop,
      title: c.label,
      width: typeof c.width === "number" ? c.width : (c.width ? Number(c.width) : undefined),
      minWidth: typeof c.minWidth === "number" ? c.minWidth : (c.minWidth ? Number(c.minWidth) : 100),
      align: c.align ?? "left",
      sortable: c.sortable === true ? true : (c.sortable === "custom" ? "custom" : false),
      cellRenderer: ({ rowData, column, rowIndex }: { rowData: Record<string, unknown>; column: any; rowIndex: number }) => {
        const col = column as Column<Record<string, unknown>>;
        const value = rowData[col.dataKey as string];
        const fmtCol = props.columns.find((cc) => cc.prop === col.dataKey);
        if (fmtCol?.formatter) {
          return fmtCol.formatter(rowData, fmtCol, value);
        }
        if (value == null) return "-";
        return String(value);
      },
    } as unknown as Column<Record<string, unknown>>);
  }

  return cols;
});

/** 是否使用动态行高模式（不设置 rowHeight 时启用） */
const isDynamicRowHeight = computed<boolean>(() => !props.layout.rowHeight && Boolean(props.layout.estimatedRowHeight));

/** 行高：固定模式用数字，动态模式不传 */
const rowHeight = computed<number | undefined>(() => {
  if (isDynamicRowHeight.value) return undefined;
  return props.layout.rowHeight ?? 50;
});

/** 表头高度 */
const headerHeight = computed<number>(() => props.layout.headerHeight ?? 50);

/** 估算行高（动态行高模式必须） */
const estimatedRowHeight = computed<number | undefined>(() => {
  if (isDynamicRowHeight.value) {
    return props.layout.estimatedRowHeight ?? 50;
  }
  return undefined;
});

/** 容器高度 */
const fixedHeight = computed<string | number>(() =>
  props.layout.fixedHeader !== false ? (props.layout.visibleRows ? (props.layout.visibleRows * (props.layout.rowHeight ?? 50)) + headerHeight.value : 600) : 400,
);

/** 空数据状态 */
const isEmpty = computed<boolean>(() => !props.rows || props.rows.length === 0);

/** 排序变化 */
function onSortChange(payload: { column?: any; key: string; order: "ascending" | "descending" | null }): void {
  emit("sort-change", { prop: payload.key, order: payload.order });
}

function onRowClick({ rowData, rowIndex, event }: { rowData: Record<string, unknown>; rowIndex: number; event: MouseEvent }): void {
  emit("row-click", rowData);
}

/** 行右键 */
function onRowContextMenu({ rowData, rowIndex, event, columns }: { rowData: Record<string, unknown>; rowIndex: number; event: MouseEvent; columns?: any }): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  event.preventDefault();
  emit("context-menu", {
    row: rowData,
    rowIndex,
    event,
  });
}

/** 单元格点击 */
function onCellClick({ rowData, column, rowIndex, event }: { rowData: Record<string, unknown>; column: any; rowIndex: number; event: MouseEvent }): void {
  const prop = column?.dataKey || column?.key || "";
  const col = props.columns.find((c) => c.prop === prop);
  emit("cell-click", {
    row: rowData,
    rowIndex,
    columnProp: prop,
    columnLabel: col?.label || "",
    cellValue: rowData[prop],
    event,
  });
}
</script>

<template>
  <div class="re-table__virtual" :class="{ 're-table__virtual--empty': isEmpty, 're-table__virtual--loading': loading }">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="re-table__virtual-loading">
      <div class="re-table__virtual-loading-spinner" />
    </div>

    <!-- 空数据提示 -->
    <div v-if="isEmpty && !loading" class="re-table__virtual-empty">
      <ElEmpty :description="emptyText" :image-size="80" />
    </div>

    <!-- 虚拟表格 -->
    <ElAutoResizer v-if="!isEmpty || loading">
      <template #default="{ height, width }">
        <ElTableV2
          :columns="v2Columns"
          :data="rows"
          :width="width"
          :height="height || fixedHeight"
          :row-height="rowHeight"
          :header-height="headerHeight"
          :estimated-row-height="estimatedRowHeight"
          :fixed="layout.fixedHeader !== false"
          :row-key="rowKey"
          @row-click="onRowClick"
          @row-contextmenu="onRowContextMenu"
          @cell-click="onCellClick"
          @column-sort="(payload: any) => onSortChange(payload)"
        />
      </template>
    </ElAutoResizer>

    <!-- 分页 -->
    <div v-if="pagination && total > 0" class="re-table__virtual-pagination">
      <ElPagination
        background
        layout="total, sizes, prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        @current-change="(p: number) => emit('update:page', p)"
        @size-change="(s: number) => emit('update:page-size', s)"
      />
    </div>
  </div>
</template>

<style scoped>
.re-table__virtual {
  width: 100%;
  height: 100%;
  position: relative;
}
.re-table__virtual--empty {
  min-height: var(--re-table-min-height, 300px);
  display: flex;
  flex-direction: column;
}
.re-table__virtual-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 200px;
  padding: 40px 0;
}
.re-table__virtual-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--el-overlay-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.re-table__virtual-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: re-table-virtual-spin 0.8s linear infinite;
}
@keyframes re-table-virtual-spin {
  to { transform: rotate(360deg); }
}
.re-table__virtual-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
</style>