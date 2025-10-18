<template>
  <div class="p-4">
    <ScSearch v-model="kw" placeholder="搜索关键字" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScSearch from "@repo/components/ScSearch/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const kw = ref("");
const code = computed(() => `<ScSearch v-model=\"kw\" placeholder=\"搜索关键字\" />`);
</script>