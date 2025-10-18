<template>
  <div class="p-4">
    <ScQuery v-model="q" :placeholder="'请输入关键词'" />
    <p class="mt-2">当前查询：{{ q }}</p>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScQuery from "@repo/components/ScQuery/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const q = ref("");
const code = computed(() => `<ScQuery v-model=\"q\" placeholder=\"请输入关键词\" />`);
</script>