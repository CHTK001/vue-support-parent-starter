<template>
  <div class="p-4">
    <ScVideo src="https://www.w3schools.com/html/mov_bbb.mp4" controls />

    <el-divider />
    <CodeDisplay :code="codeStr" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ScVideo from "@repo/components/ScVideo/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const codeStr = computed(() => `<ScVideo src=\"https://www.w3schools.com/html/mov_bbb.mp4\" controls />`);
</script>