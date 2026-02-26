<template>
  <component
    :is="currentComponent || ElCheckboxGroup"
    v-model="currentValue"
    :size="size"
    :disabled="disabled"
    :min="min"
    :max="max"
    :label="label"
    :fill="fill"
    :text-color="textColor"
    :tag="tag"
    :validate-event="validateEvent"
    @change="handleChange"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScCheckboxGroup 复选框组组件
 * 封装 Element Plus CheckboxGroup 与 PixelUI PxCheckboxGroup
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElCheckboxGroup } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  size: String as PropType<"" | "large" | "default" | "small">,
  disabled: Boolean,
  min: Number,
  max: Number,
  label: String,
  fill: String,
  textColor: String,
  tag: {
    type: String,
    default: "div"
  },
  validateEvent: {
    type: Boolean,
    default: true
  }
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

const { currentComponent } = useThemeComponent("ElCheckboxGroup");

const handleChange = (val: any) => {
  emit("change", val);
};
</script>
