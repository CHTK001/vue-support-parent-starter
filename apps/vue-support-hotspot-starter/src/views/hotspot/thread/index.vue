<template>
  <div>
    <el-card class="mt-2">
      <el-alert show-icon :closable="false" type="info" title="线程信息" />
      <el-table :data="data" border style="width: 100%" row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="state" label="状态" width="120" />
        <el-table-column prop="cpu" label="CPU%" width="80" />
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
  http.get((window.agentPath || "/agent") + "/thread_info").then(res => {
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
