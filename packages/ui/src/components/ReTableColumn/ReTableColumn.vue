<script setup lang="ts">
/**
 * ReTableColumn —— 表格列（el-table-column 薄封装）
 *
 * 透传 el-table-column 全部能力，与 ReTable 插槽模式搭配使用。
 */
import { ElTableColumn } from "element-plus";

defineOptions({ name: "ReTableColumn", inheritAttrs: true });

withDefaults(
  defineProps<{
    type?: "default" | "selection" | "index" | "expand";
    prop?: string;
    label?: string;
    width?: string | number;
    minWidth?: string | number;
    fixed?: boolean | "left" | "right";
    align?: "left" | "center" | "right";
    headerAlign?: "left" | "center" | "right";
    sortable?: boolean | "custom";
    showOverflowTooltip?: boolean;
    formatter?: (row: any, column: any, cellValue: any, index: number) => any;
  }>(),
  {
    type: "default",
    prop: "",
    label: "",
    width: undefined,
    minWidth: undefined,
    fixed: undefined,
    align: undefined,
    headerAlign: undefined,
    sortable: false,
    showOverflowTooltip: false,
    formatter: undefined,
  },
);
</script>

<template>
  <ElTableColumn
    v-bind="$attrs"
    :type="type"
    :prop="prop"
    :label="label"
    :width="width"
    :min-width="minWidth"
    :fixed="fixed"
    :align="align"
    :header-align="headerAlign"
    :sortable="sortable"
    :show-overflow-tooltip="showOverflowTooltip"
    :formatter="formatter"
  >
    <template #default="scope">
      <slot v-bind="scope" :row="scope.row" :$index="scope.$index" :column="scope.column" />
    </template>
    <template v-if="$slots.header" #header="scope">
      <slot name="header" v-bind="scope" />
    </template>
  </ElTableColumn>
</template>