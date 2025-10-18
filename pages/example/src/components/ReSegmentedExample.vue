<template>
  <div class="p-4">
    <ReSegmented v-model="idx" :options="options" size="default" />
    <p class="mt-2">当前选择索引：{{ idx }}</p>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ReSegmented from "@repo/components/ReSegmented/src/index.tsx";
import CodeDisplay from "./CodeDisplay.vue";

const idx = ref(0);
const options = [
  { label: "表格", icon: "ep:grid" },
  { label: "列表", icon: "ep:list" },
  { label: "卡片", icon: "ep:menu" }
];

const code = computed(() => `<ReSegmented v-model=\"index\" :options=\"${JSON.stringify(options)}\" />`);
</script>