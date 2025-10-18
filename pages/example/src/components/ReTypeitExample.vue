<template>
  <div class="p-4">
    <ReTypeit :options="{ strings: ['Hello', '你好'], speed: 100, loop: true }">
      <span class="type-it"></span>
    </ReTypeit>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ReTypeit from "@repo/components/ReTypeit/src/index.tsx";
import CodeDisplay from "./CodeDisplay.vue";

const code = computed(() => `<ReTypeit :options=\"{ strings: ['Hello', '你好'], speed: 100, loop: true }\">\n  <span class=\"type-it\"></span>\n</ReTypeit>`);
</script>