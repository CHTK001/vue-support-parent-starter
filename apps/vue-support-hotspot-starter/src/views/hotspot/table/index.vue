<template>
  <div>
    <el-card class="mt-2">
      <el-alert show-icon :closable="false" type="info" title="数据库表信息" />
      <el-table :data="data" border style="width: 100%" row-key="name">
        <el-table-column prop="name" label="表名" width="180" />
        <el-table-column prop="comment" label="注释" />
        <el-table-column prop="engine" label="引擎" width="100" />
        <el-table-column prop="rows" label="行数" width="100" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleInfo(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="infoVisible" title="详情" width="60%" destroy-on-close>
      <pre><code>{{ info }}</code></pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { onBeforeMount, ref } from "vue";

const data = ref([]);
const infoVisible = ref(false);
const info = ref("");

const handleInfo = (row) => {
  info.value = JSON.stringify(row, null, 2);
  infoVisible.value = true;
};

onBeforeMount(async () => {
  http.get((window.agentPath || "/agent") + "/table_info").then(res => {
    data.value = res.data.data || [];
  });
});
</script>
<style lang="scss" scoped>
.counter {
  counter-reset: counter;
}
:deep(.row-expand-unhas .el-table__expand-icon--expanded) {
  display: none !important;
}
.item::before {
  counter-increment: counter;
  content: counter(counter);
  color: var(--el-text-color-regular);
  font-size: 1.2em;
  right: 50%;
  top: 10px;
  width: 24px;
  height: 24px;
  text-align: center;
  vertical-align: middle;
  border-radius: 50%;
  background-color: var(--el-color-info-light-7);
  display: inline-block;
}
</style>
