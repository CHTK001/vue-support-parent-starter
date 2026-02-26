<template>
  <component
    :is="currentComponent || ElTimePicker"
    v-model="currentValue"
    :readonly="readonly"
    :disabled="disabled"
    :editable="editable"
    :clearable="clearable"
    :size="size"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :is-range="isRange"
    :arrow-control="arrowControl"
    :popper-class="popperClass"
    :range-separator="rangeSeparator"
    :format="format"
    :value-format="valueFormat"
    :id="id"
    :name="name"
    :prefix-icon="prefixIcon"
    :clear-icon="clearIcon"
    :disabled-hours="disabledHours"
    :disabled-minutes="disabledMinutes"
    :disabled-seconds="disabledSeconds"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @visible-change="handleVisibleChange"
  />
</template>

<script setup lang="ts">
/**
 * ScTimePicker 时间选择器组件
 * 封装 Element Plus TimePicker 与 PixelUI PxTimePicker
 * 在 data-skin 为 8bit 时自动切换为像素风时间选择器
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElTimePicker } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type TimeValue = Date | string | number;

const props = defineProps({
  modelValue: {
    type: [Date, String, Number, Array] as PropType<TimeValue | [TimeValue, TimeValue]>,
    default: ""
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
  isRange: {
    type: Boolean,
    default: false
  },
  arrowControl: {
    type: Boolean,
    default: false
  },
  popperClass: {
    type: String,
    default: ""
  },
  rangeSeparator: {
    type: String,
    default: "-"
  },
  format: {
    type: String,
    default: "HH:mm:ss"
  },
  valueFormat: {
    type: String,
    default: ""
  },
  id: {
    type: [Array, String] as PropType<string | [string, string]>,
    default: undefined
  },
  name: {
    type: String,
    default: ""
  },
  prefixIcon: {
    type: [String, Object],
    default: ""
  },
  clearIcon: {
    type: [String, Object],
    default: ""
  },
  disabledHours: {
    type: Function as PropType<() => number[]>,
    default: undefined
  },
  disabledMinutes: {
    type: Function as PropType<(hour: number) => number[]>,
    default: undefined
  },
  disabledSeconds: {
    type: Function as PropType<(hour: number, minute: number) => number[]>,
    default: undefined
  }
});

const emit = defineEmits(["update:modelValue", "change", "blur", "focus", "visible-change"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElTimePicker");



const handleChange = (val: TimeValue | [TimeValue, TimeValue]) => {
  emit("change", val);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);
};
</script>
