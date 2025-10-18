<template>
  <div class="p-4">
    <ScFormTable v-model="rows" :addTemplate="{ key: '', value: '' }" :dragSort="true" :height="280">
      <el-table-column prop="key" label="键">
        <template #default="{ row }">
          <el-input v-model="row.key" placeholder="键" />
        </template>
      </el-table-column>
      <el-table-column prop="value" label="值">
        <template #default="{ row }">
          <el-input v-model="row.value" placeholder="值" />
        </template>
      </el-table-column>
    </ScFormTable>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScFormTable from "@repo/components/ScFormTable/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const rows = ref([{ key: 'name', value: 'demo' }]);

const code = computed(() => `<ScFormTable v-model=\"rows\" :addTemplate=\"{ key: '', value: '' }\" :dragSort=\"true\">\n  <el-table-column prop=\"key\" label=\"键\">\n    <template #default=\"{ row }\"><el-input v-model=\"row.key\" /></template>\n  </el-table-column>\n  <el-table-column prop=\"value\" label=\"值\">\n    <template #default=\"{ row }\"><el-input v-model=\"row.value\" /></template>\n  </el-table-column>\n</ScFormTable>`);
</script>