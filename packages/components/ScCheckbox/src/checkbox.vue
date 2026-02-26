<template>
  <component
    :is="currentComponent || ElCheckbox"
    v-model="currentValue"
    :label="label"
    :true-label="trueLabel"
    :false-label="falseLabel"
    :disabled="disabled"
    :border="border"
    :size="size"
    :checked="checked"
    :indeterminate="indeterminate"
    :validate-event="validateEvent"
    :tabindex="tabindex"
    :id="id"
    :controls="controls"
    @change="handleChange"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScCheckbox 复选框组件
 * 封装 Element Plus Checkbox 与 PixelUI PxCheckbox
 * 在 data-skin 为 8bit 时自动切换为像素风复选框
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElCheckbox } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: undefined
  },
  label: {
    type: [String, Number, Boolean, Object],
    default: undefined
  },
  trueLabel: {
    type: [String, Number],
    default: undefined
  },
  falseLabel: {
    type: [String, Number],
    default: undefined
  },
  disabled: Boolean,
  border: Boolean,
  size: String as PropType<"" | "large" | "default" | "small">,
  checked: Boolean,
  indeterminate: Boolean,
  validateEvent: {
    type: Boolean,
    default: true
  },
  tabindex: [String, Number],
  id: String,
  controls: String
});

const emit = defineEmits(["update:modelValue", "change"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElCheckbox");



const handleChange = (val: any) => {
  emit("change", val);
};
</script>
