<template>
  <el-table-column
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
    :show-overflow-tooltip="false"
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
    <template v-if="tooltipEnabled || slots.default" #default="scope">
      <ElTooltip
        v-if="tooltipEnabled"
        v-bind="tooltipProps"
        :content="resolveTooltipContent(scope)"
        :disabled="!resolveTooltipContent(scope)"
      >
        <div
          class="sc-table-column__tooltip-trigger"
          :class="{ 'sc-table-column__tooltip-trigger--text': !slots.default }"
        >
          <slot v-if="slots.default" v-bind="scope" />
          <span v-else class="sc-table-column__tooltip-text">
            {{ resolveCellValue(scope) }}
          </span>
        </div>
      </ElTooltip>
      <slot v-else v-bind="scope" />
    </template>
    <template v-if="slots.header" #header="scope">
      <slot name="header" v-bind="scope" />
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import { ElTooltip } from "element-plus";
import type { PropType } from "vue";

const props = defineProps({
  type: {
    type: String as PropType<"selection" | "index" | "expand">,
    default: undefined,
  },
  index: {
    type: [Number, Function] as PropType<number | ((index: number) => number)>,
    default: undefined,
  },
  columnKey: { type: String, default: undefined },
  label: { type: String, default: "" },
  prop: { type: String, default: "" },
  width: { type: [String, Number], default: undefined },
  minWidth: { type: [String, Number], default: undefined },
  fixed: {
    type: [Boolean, String] as PropType<boolean | "left" | "right">,
    default: undefined,
  },
  renderHeader: { type: Function as PropType<any>, default: undefined },
  sortable: {
    type: [Boolean, String] as PropType<boolean | "custom">,
    default: false,
  },
  sortMethod: { type: Function as PropType<any>, default: undefined },
  sortBy: { type: [String, Array, Function] as PropType<any>, default: undefined },
  sortOrders: {
    type: Array as PropType<Array<"ascending" | "descending" | null>>,
    default: () => ["ascending", "descending", null],
  },
  resizable: { type: Boolean, default: true },
  formatter: { type: Function as PropType<any>, default: undefined },
  showOverflowTooltip: { type: [Boolean, Object], default: undefined },
  align: {
    type: String as PropType<"left" | "center" | "right">,
    default: "left",
  },
  headerAlign: {
    type: String as PropType<"left" | "center" | "right">,
    default: undefined,
  },
  className: { type: String, default: "" },
  labelClassName: { type: String, default: "" },
  selectable: { type: Function as PropType<any>, default: undefined },
  reserveSelection: { type: Boolean, default: false },
  filters: { type: Array as PropType<any[]>, default: undefined },
  filterPlacement: { type: String as PropType<any>, default: undefined },
  filterMultiple: { type: Boolean, default: true },
  filterMethod: { type: Function as PropType<any>, default: undefined },
  filteredValue: { type: Array as PropType<string[]>, default: undefined },
});

const slots = useSlots();

const tooltipEnabled = computed(() => {
  return (
    props.showOverflowTooltip !== undefined &&
    props.showOverflowTooltip !== false
  );
});

const tooltipProps = computed(() => {
  const extraProps =
    typeof props.showOverflowTooltip === "object"
      ? props.showOverflowTooltip
      : {};
  return {
    placement: "top",
    effect: "dark",
    offset: 8,
    showAfter: 80,
    popperClass: "sc-table-column__tooltip-popper",
    ...extraProps,
  } as any;
});

const normalizeTooltipText = (value: unknown) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTooltipText(item))
      .filter(Boolean)
      .join(" / ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return "";
    }
  }

  return String(value).trim();
};

const resolveCellValue = (scope: Record<string, any>) => {
  const rawValue = props.prop ? scope?.row?.[props.prop] : scope?.row;
  if (typeof props.formatter === "function") {
    return normalizeTooltipText(
      props.formatter(scope?.row, scope?.column, rawValue, scope?.$index),
    );
  }
  return normalizeTooltipText(rawValue);
};

const resolveTooltipContent = (scope: Record<string, any>) => {
  const tooltipContent =
    typeof props.showOverflowTooltip === "object"
      ? props.showOverflowTooltip?.content
      : "";

  if (typeof tooltipContent === "function") {
    return normalizeTooltipText(tooltipContent(scope));
  }

  if (tooltipContent) {
    return normalizeTooltipText(tooltipContent);
  }

  return resolveCellValue(scope);
};
</script>

<style scoped lang="scss">
.sc-table-column__tooltip-trigger {
  display: block;
  width: 100%;
  min-width: 0;
}

.sc-table-column__tooltip-trigger--text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-table-column__tooltip-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
