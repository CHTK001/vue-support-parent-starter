<template>
  <div class="p-4">
    <ScPromQL v-model="expr" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScPromQL from "@repo/components/ScPromQL/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const expr = ref("up{job='node'}");
const code = computed(() => `<ScPromQL v-model=\"expr\" />`);
</script>