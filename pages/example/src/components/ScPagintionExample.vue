<template>
  <div class="p-4">
    <ScPagintion :layout="'prev, pager, next, ->, total'" :total="123" v-model:currentPage="page" v-model:pageSize="size" />
    <p class="mt-2">当前页：{{ page }}，每页：{{ size }}</p>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScPagintion from "@repo/components/ScPagintion/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const page = ref(1);
const size = ref(10);
const code = computed(() => `<ScPagintion :total=\"123\" v-model:currentPage=\"page\" v-model:pageSize=\"size\" />`);
</script>