<template>
  <component :is="currentComponent || ElRadioGroup" v-model="currentValue" :size="size" :disabled="disabled" :text-color="textColor" :fill="fill" @change="handleChange">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScRadioGroup 单选框组组件
 * 封装 Element Plus RadioGroup
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElRadioGroup } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ""
  },
  size: String as PropType<"" | "large" | "default" | "small">,
  disabled: Boolean,
  textColor: String,
  fill: String
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

const { currentComponent } = useThemeComponent("ElRadioGroup");

const handleChange = (val: any) => {
  emit("change", val);
};
</script>
