<template>
  <div class="p-4">
    <ScPanel title="面板标题">
      <template #default>
        面板内容区
      </template>
    </ScPanel>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ScPanel from "@repo/components/ScPanel/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const code = computed(() => `<ScPanel title=\"面板标题\">面板内容区</ScPanel>`);
</script>