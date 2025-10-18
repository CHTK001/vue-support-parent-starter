<template>
  <div class="p-4">
    <ScEditor v-model="content" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScEditor from "@repo/components/ScEditor/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const content = ref("<p>编辑器内容</p>");
const code = computed(() => `<ScEditor v-model=\"content\" />`);
</script>