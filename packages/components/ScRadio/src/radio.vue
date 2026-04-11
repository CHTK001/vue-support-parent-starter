<template>
  <component :is="currentComponent || ElRadio" v-model="currentValue" :label="label" :disabled="disabled" :border="border" :size="size" :name="name" @change="handleChange">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScRadio 单选框组件
 * 封装 Element Plus Radio
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElRadio } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ""
  },
  label: {
    type: [String, Number, Boolean],
    default: ""
  },
  disabled: Boolean,
  border: Boolean,
  size: String as PropType<"" | "large" | "default" | "small">,
  name: String
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

const { currentComponent } = useThemeComponent("ElRadio");

const handleChange = (val: any) => {
  emit("change", val);
};
</script>
