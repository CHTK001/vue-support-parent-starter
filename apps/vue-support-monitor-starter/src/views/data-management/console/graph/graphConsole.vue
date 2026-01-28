<template>
  <div class="console system-container modern-bg">
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
<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


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


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
