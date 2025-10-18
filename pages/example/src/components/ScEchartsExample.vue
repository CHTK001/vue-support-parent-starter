<template>
  <div class="p-4">
    <ScEcharts :option="option" height="360px" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const option = {
  xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  yAxis: { type: 'value' },
  series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: 'line' }]
};

const code = computed(() => `<ScEcharts :option=\"${JSON.stringify(option)}\" height=\"360px\" />`);
</script>