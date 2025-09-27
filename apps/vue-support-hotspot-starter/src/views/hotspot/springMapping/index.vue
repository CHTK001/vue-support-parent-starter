<template>
  <div>
    <el-card class="mt-2">
      <el-alert show-icon :closable="false" type="info" title="SpringMapping 信息" />
      <el-table :data="data" border style="width: 100%" row-key="id">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="className" label="类名" />
        <el-table-column prop="resource" label="资源" />
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
  http.get((window.agentPath || "/agent") + "/spring-mapping-data").then(res => {
    data.value = res.data.data || [];
  });
});
</script>
<style lang="scss" scoped>
// 导入自定义颜色系统
@import '../../../../../../packages/assets/style/colors/index.scss';

.counter {
  counter-reset: counter;
}

:deep(.row-expand-unhas .el-table__expand-icon--expanded) {
  display: none !important;
}

.item::before {
  counter-increment: counter;
  content: counter(counter);
  color: var(--app-text-secondary);
  font-size: 1.2em;
  right: 50%;
  top: 10px;
  width: 24px;
  height: 24px;
  text-align: center;
  vertical-align: middle;
  border-radius: 50%;
  background-color: var(--app-info-lighter);
  display: inline-block;
}

// HTTP方法颜色样式
.http-method-get {
  color: var(--app-success) !important;
}

.http-method-head {
  color: var(--app-success) !important;
}

.http-method-post {
  color: var(--app-warning) !important;
}

.http-method-put {
  color: var(--app-info) !important;
}

.http-method-delete {
  color: var(--app-danger) !important;
}

.http-method-path {
  color: var(--app-purple-500) !important;
}

.http-method-options {
  color: var(--app-purple-300) !important;
}
</style>
