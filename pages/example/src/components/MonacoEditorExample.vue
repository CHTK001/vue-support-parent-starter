<template>
  <div class="p-4">
    <MonacoEditor v-model="code" language="javascript" theme="vs-dark" :height="300" />

    <el-divider />
    <CodeDisplay :code="example" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import MonacoEditor from "@repo/components/MonacoEditor/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const code = ref("console.log('Hello, Monaco!')\n");

const example = computed(() => `<MonacoEditor v-model=\"code\" language=\"javascript\" theme=\"vs-dark\" :height=\"300\" />`);
</script>