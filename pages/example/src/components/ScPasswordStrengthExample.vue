<template>
  <div class="p-4">
    <ScPasswordStrength v-model="pwd" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScPasswordStrength from "@repo/components/ScPasswordStrength/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const pwd = ref("");
const code = computed(() => `<ScPasswordStrength v-model=\"pwd\" />`);
</script>