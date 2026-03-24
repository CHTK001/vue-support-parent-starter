<template>
  <component
    :is="currentComponent || ElDatePicker"
    v-model="currentValue"
    :type="type"
    :readonly="readonly"
    :disabled="disabled"
    :editable="editable"
    :clearable="clearable"
    :size="size"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :format="format"
    :value-format="valueFormat"
    :popper-class="popperClass"
    :range-separator="rangeSeparator"
    :default-value="defaultValue"
    :default-time="defaultTime"
    :id="id"
    :name="name"
    :unlink-panels="unlinkPanels"
    :prefix-icon="prefixIcon"
    :clear-icon="clearIcon"
    :validate-event="validateEvent"
    :disabled-date="disabledDate"
    :shortcuts="shortcuts"
    :cell-class-name="cellClassName"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @calendar-change="handleCalendarChange"
    @panel-change="handlePanelChange"
    @visible-change="handleVisibleChange"
  />
</template>

<script setup lang="ts">
/**
 * ScDatePicker 日期选择器组件
 * 封装 Element Plus DatePicker 与 PixelUI PxDatePicker
 * 在 data-skin 为 8bit 时自动切换为像素风日期选择器
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElDatePicker } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type DateValue = Date | string | number;
type DateType = "year" | "years" | "month" | "months" | "date" | "dates" | "datetime" | "week" | "datetimerange" | "daterange" | "monthrange";

const props = defineProps({
  modelValue: {
    type: [Date, String, Number, Array] as PropType<DateValue | [DateValue, DateValue]>,
    default: ""
  },
  type: {
    type: String as PropType<DateType>,
    default: "date"
  },
  readonly: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  editable: {
    type: Boolean,
    default: true
  },
  clearable: {
    type: Boolean,
    default: true
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  placeholder: {
    type: String,
    default: ""
  },
  startPlaceholder: {
    type: String,
    default: ""
  },
  endPlaceholder: {
    type: String,
    default: ""
  },
  format: {
    type: String,
    default: ""
  },
  valueFormat: {
    type: String,
    default: ""
  },
  popperClass: {
    type: String,
    default: ""
  },
  rangeSeparator: {
    type: String,
    default: "-"
  },
  defaultValue: {
    type: [Date, Array] as PropType<Date | [Date, Date]>,
    default: undefined
  },
  defaultTime: {
    type: [Date, Array] as PropType<Date | [Date, Date]>,
    default: undefined
  },
  id: {
    type: [Array, String] as PropType<string | [string, string]>,
    default: undefined
  },
  name: {
    type: String,
    default: ""
  },
  unlinkPanels: {
    type: Boolean,
    default: false
  },
  prefixIcon: {
    type: [String, Object],
    default: ""
  },
  clearIcon: {
    type: [String, Object],
    default: ""
  },
  validateEvent: {
    type: Boolean,
    default: true
  },
  disabledDate: {
    type: Function as PropType<(date: Date) => boolean>,
    default: undefined
  },
  shortcuts: {
    type: Array as PropType<Array<{ text: string; value: Date | Function }>>,
    default: () => []
  },
  cellClassName: {
    type: Function as PropType<(date: Date) => string>,
    default: undefined
  }
});

const emit = defineEmits(["update:modelValue", "change", "blur", "focus", "calendar-change", "panel-change", "visible-change"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElDatePicker");



const handleChange = (val: DateValue | [DateValue, DateValue]) => {
  emit("change", val);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleCalendarChange = (val: [DateValue, DateValue]) => {
  emit("calendar-change", val);
};

const handlePanelChange = (date: DateValue, mode: string, view: string) => {
  emit("panel-change", date, mode, view);
};

const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);
};
</script>
