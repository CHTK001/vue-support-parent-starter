<template>
  <div class="p-4">
    <ScTableSelect v-model="selected" :columns="columns" :data="rows" />
    <p class="mt-2">当前选择：{{ selected }}</p>

    <el-divider />
    <CodeDisplay :code="codeStr" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScTableSelect from "@repo/components/ScTableSelect/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const selected = ref([]);
const rows = ref([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 25 }
]);
const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '姓名' },
  { prop: 'age', label: '年龄', width: 100 }
];

const codeStr = computed(() => `<ScTableSelect v-model=\"selected\" :columns=\"${JSON.stringify(columns)}\" :data=\"rows\" />`);
</script>