<template>
  <div class="p-4">
    <ScCompare :leftImage="left" :rightImage="right" leftImageLabel="原图" rightImageLabel="处理后" />

    <el-divider />
    <CodeDisplay :code="codeStr" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ScCompare from "@repo/components/ScCompare/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const left = "https://via.placeholder.com/600x300?text=Left";
const right = "https://via.placeholder.com/600x300?text=Right";

const codeStr = computed(() => `<ScCompare :leftImage=\"'${left}'\" :rightImage=\"'${right}'\" />`);
</script>