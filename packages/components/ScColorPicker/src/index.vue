<template>
  <component
    :is="currentComponent || ElColorPicker"
    v-model="currentValue"
    :disabled="disabled"
    :size="size"
    :show-alpha="showAlpha"
    :color-format="colorFormat"
    :popper-class="popperClass"
    :predefine="predefine"
    :validate-event="validateEvent"
    :tabindex="tabindex"
    :id="id"
    :label="label"
    :title="title"
    @change="handleChange"
    @active-change="handleActiveChange"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
/**
 * ScColorPicker 颜色选择器组件
 * 封装 Element Plus ColorPicker 与 PixelUI PxColorPicker
 * 在 data-skin 为 8bit 时自动切换为像素风颜色选择器
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElColorPicker } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  showAlpha: {
    type: Boolean,
    default: false
  },
  colorFormat: {
    type: String,
    default: ""
  },
  popperClass: {
    type: String,
    default: ""
  },
  predefine: {
    type: Array as PropType<string[]>,
    default: undefined
  },
  validateEvent: {
    type: Boolean,
    default: true
  },
  tabindex: {
    type: [String, Number],
    default: undefined
  },
  id: {
    type: String,
    default: undefined
  },
  label: {
    type: String,
    default: undefined
  },
  title: {
    type: String,
    default: undefined
  }
});

const emit = defineEmits(["update:modelValue", "change", "active-change", "focus", "blur"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElColorPicker");



const handleChange = (val: string | null) => {
  emit("change", val);
};

const handleActiveChange = (val: string | null) => {
  emit("active-change", val);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};
</script>
