<template>
  <div class="p-4">
    <ScSelectFilter v-model="value" :options="options" />
    <p class="mt-2">选择结果：{{ value }}</p>

    <el-divider />
    <CodeDisplay :code="codeStr" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScSelectFilter from "@repo/components/ScSelectFilter/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const value = ref([]);
const options = [
  { label: '北京', value: 'bj' },
  { label: '上海', value: 'sh' },
  { label: '广州', value: 'gz' }
];

const codeStr = computed(() => `<ScSelectFilter v-model=\"value\" :options=\"${JSON.stringify(options)}\" />`);
</script>