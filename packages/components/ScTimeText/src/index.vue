<template>
  <div>
    <span>{{ getTimeAgo(modelValue) }}</span>
    <br />
    <span class="text-gray-400 text-sm">{{ modelValue }}</span>
  </div>
</template>

<script setup lang="ts">
// 引入计算时间差的工具函数
import { getTimeAgo } from "@repo/utils";

defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});
</script>
