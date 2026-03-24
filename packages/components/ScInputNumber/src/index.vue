<template>
  <component
    :is="currentComponent || ElInputNumber"
    v-model="currentValue"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :disabled="disabled"
    :size="size"
    :controls="controls"
    :controls-position="controlsPosition"
    :name="name"
    :label="label"
    :placeholder="placeholder"
    :value-on-clear="valueOnClear"
    :validate-event="validateEvent"
    :readonly="readonly"
    :id="id"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
  />
</template>

<script setup lang="ts">
/**
 * ScInputNumber 计数器组件
 * 封装 Element Plus InputNumber 与 PixelUI PxInputNumber
 * 在 data-skin 为 8bit 时自动切换为像素风计数器
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElInputNumber } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: Number,
    default: undefined
  },
  min: {
    type: Number,
    default: -Infinity
  },
  max: {
    type: Number,
    default: Infinity
  },
  step: {
    type: Number,
    default: 1
  },
  stepStrictly: {
    type: Boolean,
    default: false
  },
  precision: {
    type: Number,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: "default"
  },
  controls: {
    type: Boolean,
    default: true
  },
  controlsPosition: {
    type: String,
    default: ""
  },
  name: {
    type: String,
    default: undefined
  },
  label: {
    type: String,
    default: undefined
  },
  placeholder: {
    type: String,
    default: undefined
  },
  valueOnClear: {
    type: [String, Number, null],
    default: null,
    validator: (val: any) => val === null || typeof val === "number" || val === "min" || val === "max"
  },
  validateEvent: {
    type: Boolean,
    default: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: undefined
  }
});

const emit = defineEmits(["update:modelValue", "change", "blur", "focus"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElInputNumber");



const handleChange = (val: number | undefined, oldVal: number | undefined) => {
  emit("change", val, oldVal);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};
</script>
