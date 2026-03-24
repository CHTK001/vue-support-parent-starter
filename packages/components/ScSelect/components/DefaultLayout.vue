<template>
  <el-select v-model="modelValue" :placeholder="placeholder" :disabled="disabled" :size="size" :clearable="clearable" @change="handleChange">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="item.disabled" />
  </el-select>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface OptionItem {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

const props = defineProps<{
  modelValue: string | number | boolean;
  options: OptionItem[];
  placeholder?: string;
  disabled?: boolean;
  size?: "large" | "default" | "small";
  clearable?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

const modelValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const handleChange = (val: any) => {
  emit("change", val);
};
</script>
