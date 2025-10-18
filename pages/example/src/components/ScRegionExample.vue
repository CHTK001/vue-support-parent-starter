<template>
  <div class="p-4">
    <ScRegion v-model="region" />
    <p class="mt-2">选择结果：{{ region }}</p>

    <el-divider />
    <CodeDisplay :code="codeStr" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScRegion from "@repo/components/ScRegion/src/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const region = ref("");
const codeStr = computed(() => `<ScRegion v-model=\"region\" />`);
</script>