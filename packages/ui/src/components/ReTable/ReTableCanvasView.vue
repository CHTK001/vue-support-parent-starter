<script setup lang="ts">
/**
 * ReTable Canvas 表格视图（基于 AG Grid Community）
 *
 * 适用于超大数据量（万级~百万级行）场景，Canvas 渲染，极致性能。
 * 支持：cell-click、右键菜单、checkbox 选择、列排序、列筛选、分页、空数据提示、加载状态
 *
 * 用法：
 *   <ReTable layout="canvas" :layout-canvas="{ theme: 'alpine', rowSelection: 'multiple' }" />
 */
import { computed, type PropType } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import type { ColDef, GridReadyEvent, SelectionChangedEvent, SortChangedEvent, CellClickedEvent, RowClickedEvent, GridApi } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ElEmpty, ElPagination } from "element-plus";
import type { ReTableColumn, ReCanvasLayoutProps, ReTableContextMenuItem, ReTableContextMenuContext, ReTableCellClickPayload } from "./types";

// 注册 AG Grid Community 模块（仅注册一次）
ModuleRegistry.registerModules([AllCommunityModule]);

defineOptions({ name: "ReTableCanvasView" });

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
    type: Object as PropType<ReCanvasLayoutProps>,
    default: () => ({}),
  },
  rowKey: {
    type: String,
    default: "id",
  },
  /** 是否显示 checkbox 列（受 ReTable toolbarConfig.batchSelect 控制） */
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

/** AG Grid API 引用 */
let gridApi: GridApi | null = null;

/** 空数据状态 */
const isEmpty = computed<boolean>(() => !props.rows || props.rows.length === 0);

/** 行选择模式 */
const rowSelection = computed<"single" | "multiple" | undefined>(() => {
  if (!props.selectable) return undefined;
  // layout.rowSelection 优先，否则根据 selectable 推断
  if (props.layout.rowSelection && props.layout.rowSelection !== "none") {
    return props.layout.rowSelection;
  }
  return "multiple";
});

/** AG Grid 列定义：从 ReTableColumn 转换 */
const agColumns = computed<ColDef[]>(() => {
  const cols: ColDef[] = [];

  // checkbox 列
  if (props.selectable) {
    cols.push({
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: props.layout.fixedColumns ? "left" : undefined,
      suppressMovable: true,
      headerName: "",
    });
  }

  // 数据列
  for (const c of props.columns) {
    if (c.hidden) continue;
    const colDef: ColDef = {
      field: c.prop,
      headerName: c.label,
      width: typeof c.width === "number" ? c.width : (c.width ? Number(c.width) : undefined),
      minWidth: typeof c.minWidth === "number" ? c.minWidth : (c.minWidth ? Number(c.minWidth) : 100),
      sortable: c.sortable !== undefined ? Boolean(c.sortable) : (props.layout.sortable ?? true),
      resizable: c.resizable !== undefined ? c.resizable : (props.layout.resizable ?? true),
      filter: props.layout.filterable ?? false,
      pinned: c.fixed === true ? "left" : (c.fixed === "right" ? "right" : undefined),
      suppressMovable: true,
    };

    // formatter 支持
    if (c.formatter) {
      colDef.valueFormatter = (params: { data: Record<string, unknown>; value: unknown }) => {
        if (!params.data) return "";
        return c.formatter!(params.data, c, params.value);
      };
    }

    cols.push(colDef);
  }

  return cols;
});

/** AG Grid 行数据 */
const rowData = computed<Record<string, unknown>[]>(() => {
  if (!props.rows) return [];
  return props.rows.map((row) => ({ ...row }));
});

/** 获取行 ID */
function getRowId(params: { data: Record<string, unknown> }): string {
  return String(params.data[props.rowKey] ?? "");
}

/** AG Grid 主题类名 */
const themeClass = computed<string>(() => {
  const theme = props.layout.theme ?? "alpine";
  return `ag-theme-${theme}`;
});

/** 容器高度 */
const containerHeight = computed<string>(() => {
  const h = props.layout.height;
  if (h === undefined || h === "auto") return "600px";
  return typeof h === "number" ? `${h}px` : h;
});

/** Grid Ready 事件 */
function onGridReady(event: GridReadyEvent): void {
  gridApi = event.api;
}

/** 选中变化 */
function onSelectionChanged(event: SelectionChangedEvent): void {
  if (!gridApi) return;
  const selectedRows = gridApi.getSelectedRows();
  emit("selection-change", selectedRows);
}

/** 排序变化 */
function onSortChanged(): void {
  if (!gridApi) return;
  const sortModel = gridApi.getColumnState().filter((c) => c.sort != null);
  if (sortModel.length > 0) {
    const first = sortModel[0];
    emit("sort-change", {
      prop: first.colId ?? "",
      order: (first.sort as "ascending" | "descending") ?? null,
    });
  } else {
    emit("sort-change", { prop: "", order: null });
  }
}

/** 行点击 */
function onRowClicked(event: RowClickedEvent): void {
  if (event.data) {
    emit("row-click", event.data as Record<string, unknown>);
  }
}

/** 单元格点击 */
function onCellClicked(event: CellClickedEvent): void {
  const col = props.columns.find((c) => c.prop === event.colDef.field);
  emit("cell-click", {
    row: event.data as Record<string, unknown>,
    rowIndex: event.rowIndex ?? -1,
    columnProp: event.colDef.field ?? "",
    columnLabel: col?.label ?? "",
    cellValue: event.value,
    event: event.event as MouseEvent,
  });
}

/** 行右键 */
function onRowContextMenu(event: { event?: MouseEvent; node?: { data?: Record<string, unknown>; rowIndex?: number } }): void {
  if (!props.contextMenu || props.contextMenu.length === 0) return;
  const evt = event.event;
  if (!evt) return;
  evt.preventDefault();
  emit("context-menu", {
    row: event.node?.data ?? {},
    rowIndex: event.node?.rowIndex ?? -1,
    event: evt,
  });
}

/** 暴露 API */
defineExpose({
  /** 获取 AG Grid API（高级用法） */
  getGridApi: () => gridApi,
});
</script>

<template>
  <div class="re-table__canvas" :class="{ 're-table__canvas--empty': isEmpty, 're-table__canvas--loading': loading }">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="re-table__canvas-loading">
      <div class="re-table__canvas-loading-spinner" />
    </div>

    <!-- 空数据提示 -->
    <div v-if="isEmpty && !loading" class="re-table__canvas-empty">
      <ElEmpty :description="emptyText" :image-size="80" />
    </div>

    <!-- AG Grid Canvas 表格 -->
    <div
      v-if="!isEmpty || loading"
      :class="themeClass"
      :style="{ height: containerHeight, width: '100%' }"
    >
      <AgGridVue
        :column-defs="agColumns"
        :row-data="rowData"
        :row-selection="rowSelection"
        :get-row-id="getRowId"
        :row-height="layout.rowHeight ?? 40"
        :header-height="layout.headerHeight ?? 48"
        :pinned-top-row-data="undefined"
        :pinned-bottom-row-data="undefined"
        :suppress-row-click-selection="true"
        :suppress-cell-focus="false"
        :animate-rows="false"
        :row-model-type="'clientSide'"
        class="re-table__canvas-grid"
        @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged"
        @sort-changed="onSortChanged"
        @row-clicked="onRowClicked"
        @cell-clicked="onCellClicked"
        @row-context-menu="onRowContextMenu as any"
      />
    </div>

    <!-- 分页 -->
    <div v-if="pagination && total > 0" class="re-table__canvas-pagination">
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
.re-table__canvas {
  width: 100%;
  position: relative;
}
.re-table__canvas--empty {
  min-height: var(--re-table-min-height, 300px);
  display: flex;
  flex-direction: column;
}
.re-table__canvas-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 200px;
  padding: 40px 0;
}
.re-table__canvas-loading {
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
.re-table__canvas-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: re-table-canvas-spin 0.8s linear infinite;
}
@keyframes re-table-canvas-spin {
  to { transform: rotate(360deg); }
}
.re-table__canvas-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
.re-table__canvas-grid {
  width: 100%;
}
</style>

<style>
/**
 * AG Grid 主题与 Element Plus 视觉对齐
 * 使用 ag-theme-alpine / balham / material 基础主题
 * 微调边框/字体以融入 Element Plus 风格
 */
.re-table__canvas .ag-theme-alpine,
.re-table__canvas .ag-theme-balham,
.re-table__canvas .ag-theme-material {
  --ag-font-family: inherit;
  --ag-font-size: 14px;
  --ag-border-color: var(--el-border-color-lighter);
  --ag-header-background-color: var(--el-fill-color-light);
  --ag-row-hover-color: var(--el-fill-color-light);
  --ag-row-odd-color: var(--el-fill-color-lighter);
  --ag-selected-row-background-color: var(--el-color-primary-light-9);
  --ag-range-selection-border-color: var(--el-color-primary);
  --ag-header-foreground-color: var(--el-text-color-primary);
  --ag-foreground-color: var(--el-text-color-regular);
  --ag-row-border-color: var(--el-border-color-lighter);
}
</style>