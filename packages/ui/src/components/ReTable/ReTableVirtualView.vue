<script setup lang="ts">
/**
 * ReTable 虚拟表格视图（包装 el-table-v2）
 *
 * 大量数据（>1000 行）场景下使用。固定行高，DOM 节点恒定。
 */
import type { PropType } from "vue";
import { computed } from "vue";
import { ElTableV2, ElAutoResizer, type Column } from "element-plus";
import type { ReTableColumn, ReVirtualLayoutProps } from "./types";

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
});

const emit = defineEmits<{
  (e: "row-click", row: Record<string, unknown>): void;
}>();

/** el-table-v2 列定义 */
const v2Columns = computed<Column<Record<string, unknown>>[]>(() =>
  props.columns
    .filter((c) => !c.hidden)
    .map((c) => ({
      key: c.prop,
      dataKey: c.prop,
      title: c.label,
      width: typeof c.width === "number" ? c.width : (c.width ? Number(c.width) : undefined),
      minWidth: typeof c.minWidth === "number" ? c.minWidth : (c.minWidth ? Number(c.minWidth) : 100),
      align: c.align ?? "left",
      sortable: Boolean(c.sortable),
      cellRenderer: ({ rowData, column }) => {
        const col = column as Column<Record<string, unknown>>;
        const value = rowData[col.dataKey as string];
        const fmtCol = props.columns.find((cc) => cc.prop === col.dataKey);
        if (fmtCol?.formatter) {
          return fmtCol.formatter(rowData, fmtCol, value);
        }
        if (value == null) return "-";
        return String(value);
      },
    })),
);

/** 行高 */
const rowHeight = computed<number>(() => props.layout.rowHeight ?? 50);

/** 表头高度 */
const headerHeight = computed<number>(() => props.layout.headerHeight ?? 50);

/** 估算行高 */
const estimatedRowHeight = computed<number>(() => props.layout.estimatedRowHeight ?? rowHeight.value);

/** 容器高度（用于 AutoResizer fallback） */
const fixedHeight = computed<string | number>(() =>
  props.layout.fixedHeader !== false ? (props.layout.visibleRows ? props.layout.visibleRows * rowHeight.value + headerHeight.value : 600) : 400,
);

function onRowClick({ rowData }: { rowData: Record<string, unknown> }): void {
  emit("row-click", rowData);
}
</script>

<template>
  <ElAutoResizer>
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
        @row-click="onRowClick"
      />
    </template>
  </ElAutoResizer>
</template>

<style scoped>
.re-table__virtual {
  width: 100%;
  height: 100%;
}
</style>