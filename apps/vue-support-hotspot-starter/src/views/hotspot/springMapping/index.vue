<template>
  <div style="height: 100%">
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-input v-model="filterName" placeholder="搜索" class="!w-[300px] m-[10px]" />

    <ScTable :data="tableData" fixed height="90%">
      <el-table-column type="expand" label="">
        <template #default="{ row }">
          <div>
            <el-descriptions class="margin-top m-[20px]" title="扩展" :column="1" border>
              <el-descriptions-item label="类型">{{ row.beanType || "无" }}</el-descriptions-item>
              <el-descriptions-item label="方法名">{{ row.methodName || "无" }}</el-descriptions-item>
              <el-descriptions-item label="参数">{{ row.parameterNumber || "无" }}</el-descriptions-item>
              <el-descriptions-item label="返回值类型">{{ row.produces || "无" }}</el-descriptions-item>
              <el-descriptions-item label="提交内容类型">{{ row.consumes || "无" }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="methods" show-overflow-tooltip width="100">
        <template #default="{ row }">
          <b v-if="row.methods[0] == 'GET'" class="http-method-get">GET</b>
          <b v-else-if="row.methods[0] == 'HEAD'" class="http-method-head">HEAD</b>
          <b v-else-if="row.methods[0] == 'POST'" class="http-method-post">POST</b>
          <b v-else-if="row.methods[0] == 'PUT'" class="http-method-put">PUT</b>
          <b v-else-if="row.methods[0] == 'DELETE'">
            <span class="http-method-delete">DELETE</span>
          </b>
          <b v-else-if="row.methods[0] == 'PATH'" class="http-method-path">PATH</b>
          <b v-else-if="row.methods[0] == 'OPTIONS'" class="http-method-options">OPTIONS</b>
          <b v-else class="http-method-get">GET</b>
        </template>
      </el-table-column>
      <el-table-column label="地址" prop="url" show-overflow-tooltip width="300px" />
      <el-table-column label="所属Bean" prop="bean" show-overflow-tooltip width="200px" />
      <el-table-column label="方法名" prop="methodName" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.beanType }}:{{ row.methodName }}({{ row.parameterNumber }})</span>
        </template>
      </el-table-column>
      <el-table-column prop="qps">
        <template #default="{ row }">
          <div class="flex flex-1 mr-4 px-4">
            <el-statistic title="qps" :value="(row.qps || 0).toFixed(6)" />
            <el-divider direction="vertical" />
            <el-statistic
              title="visited"
              :value="
                useTransition(row.visited, {
                  duration: 1500
                })
              "
            />
          </div>
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
<script setup>
import { useTransition } from "@vueuse/core";
import axios from "axios";
import { computed, onBeforeMount, reactive, ref } from "vue";
const filterName = ref("");
const tableData = computed(() => {
  if (filterName.value) {
    return data.data.filter(it => it.bean.indexOf(filterName.value) > -1 || it.url.indexOf(filterName.value) > -1 || it.beanType.indexOf(filterName.value) > -1);
  }
  return data.data;
});
const data = reactive({
  data: [],
  title: "",
  expanded: null
});

const Row = ({ cells, rowData }) => {
  if (rowData.children && rowData.children.length == 0) {
    return "111";
  }
  return cells;
};
Row.inheritAttrs = false;

const onRowExpanded = expanded => {
  data.expanded = expanded;
};
onBeforeMount(async () => {
  axios.get((window.agentPath || "/agent") + "/spring-mapping-data").then(res => {
    data.title = "当前地址: " + res.data.length;
    data.data = res.data;
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
