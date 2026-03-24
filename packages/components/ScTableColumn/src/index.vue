<template>
  <component
    :is="currentComponent || ElTableColumn"
    v-bind="$attrs"
    :type="type"
    :index="index"
    :column-key="columnKey"
    :label="label"
    :prop="prop"
    :width="width"
    :min-width="minWidth"
    :fixed="fixed"
    :render-header="renderHeader"
    :sortable="sortable"
    :sort-method="sortMethod"
    :sort-by="sortBy"
    :sort-orders="sortOrders"
    :resizable="resizable"
    :formatter="formatter"
    :show-overflow-tooltip="showOverflowTooltip"
    :align="align"
    :header-align="headerAlign"
    :class-name="className"
    :label-class-name="labelClassName"
    :selectable="selectable"
    :reserve-selection="reserveSelection"
    :filters="filters"
    :filter-placement="filterPlacement"
    :filter-multiple="filterMultiple"
    :filter-method="filterMethod"
    :filtered-value="filteredValue"
  >
    <template v-if="$slots.default" #default="scope">
      <slot v-bind="scope" />
    </template>
    <template v-if="$slots.header" #header="scope">
      <slot name="header" v-bind="scope" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScTableColumn 表格列组件
 * 封装 Element Plus TableColumn
 * 支持主题切换
 * @author CH
 * @version 1.0.0
 * @since 2026-02-27
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElTableColumn } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  type: {
    type: String as PropType<"selection" | "index" | "expand">,
    default: undefined
  },
  index: {
    type: [Number, Function] as PropType<number | ((index: number) => number)>,
    default: undefined
  },
  columnKey: {
    type: String,
    default: undefined
  },
  label: {
    type: String,
    default: ""
  },
  prop: {
    type: String,
    default: ""
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  minWidth: {
    type: [String, Number],
    default: undefined
  },
  fixed: {
    type: [Boolean, String] as PropType<boolean | "left" | "right">,
    default: undefined
  },
  renderHeader: {
    type: Function,
    default: undefined
  },
  sortable: {
    type: [Boolean, String] as PropType<boolean | "custom">,
    default: false
  },
  sortMethod: {
    type: Function,
    default: undefined
  },
  sortBy: {
    type: [String, Array, Function],
    default: undefined
  },
  sortOrders: {
    type: Array as PropType<Array<"ascending" | "descending" | null>>,
    default: () => ["ascending", "descending", null]
  },
  resizable: {
    type: Boolean,
    default: true
  },
  formatter: {
    type: Function,
    default: undefined
  },
  showOverflowTooltip: {
    type: [Boolean, Object],
    default: undefined
  },
  align: {
    type: String as PropType<"left" | "center" | "right">,
    default: "left"
  },
  headerAlign: {
    type: String as PropType<"left" | "center" | "right">,
    default: undefined
  },
  className: {
    type: String,
    default: ""
  },
  labelClassName: {
    type: String,
    default: ""
  },
  selectable: {
    type: Function,
    default: undefined
  },
  reserveSelection: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Array,
    default: undefined
  },
  filterPlacement: {
    type: String,
    default: undefined
  },
  filterMultiple: {
    type: Boolean,
    default: true
  },
  filterMethod: {
    type: Function,
    default: undefined
  },
  filteredValue: {
    type: Array,
    default: undefined
  }
});

/**
 * 使用主题组件系统
 */
const { currentComponent } = useThemeComponent("ElTableColumn");
</script>

<style scoped>
/* 由主题控制样式 */
</style>
