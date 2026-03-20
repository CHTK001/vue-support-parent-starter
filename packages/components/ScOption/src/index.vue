<template>
  <el-option :value="value" :label="label" :disabled="disabled">
    <slot />
  </el-option>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  value: {
    type: [String, Number, Boolean, Object] as PropType<string | number | boolean | Record<string, any>>,
    required: true
  },
  label: {
    type: [String, Number],
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  }
});
</script>
