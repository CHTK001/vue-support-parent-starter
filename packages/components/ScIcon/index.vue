<script setup>
import { defineProps } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "ep:warning" },
  color: { type: String, default: "" },
  size: { type: Number, default: 20 }
});
</script>
<template>
  <span>
    <el-icon :color="props.color" :size="props.size">
      <component :is="useRenderIcon(props.modelValue)" />
    </el-icon>
  </span>
</template>
