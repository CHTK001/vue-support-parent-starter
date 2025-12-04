<template>
  <div class="console">
    <div class="toolbar">
      <el-select v-model="lang" style="width: 140px">
        <el-option label="Cypher" value="cypher" />
        <el-option label="Gremlin" value="gremlin" />
      </el-select>
      <el-button type="primary" @click="execute">执行</el-button>
    </div>
    <CodeEditor v-model:content="text" :options="{ mode: lang === 'cypher' ? 'cypher' : 'javascript' }" :height="'220px'" :showTool="false" />
    <el-table :data="rows" size="small" border height="60vh">
      <el-table-column v-for="c in columns" :key="c" :prop="c" :label="c" :min-width="120" />
    </el-table>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import CodeEditor from "@/components/codeEditor/index.vue";
import { executeConsole } from "@/api/data-management/system-data";
const props = defineProps<{ id: number }>();
const lang = ref<"cypher" | "gremlin">("cypher");
const text = ref("MATCH (n) RETURN n LIMIT 25");
const columns = ref<string[]>([]);
const rows = ref<any[]>([]);
async function execute() {
  const res = await executeConsole(props.id, text.value, "graph", { lang: lang.value });
  const data = res?.data?.data || {};
  columns.value = data?.columns || [];
  rows.value = data?.rows || [];
}
</script>
<style scoped>
.console {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
