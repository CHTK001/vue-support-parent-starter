<template>
  <div style="height: 100%">
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table :data="data.data" :width="width" :height="height" fixed>
          <el-table-column type="expand" label="">
            <template #default="{ row }">
              <div>
                <el-descriptions class="margin-top m-[20px]" title="扩展" :column="1" :size="size" border>
                  <el-descriptions-item label="来源" :width="700">
                    <span class="truncate text-ellipsis overflow-hidden whitespace-nowrap !w-[700px]" :title="row.source">
                      {{ row.source }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="资源路径">{{ row.resource }}</el-descriptions-item>
                  <el-descriptions-item label="依赖注入模式">{{ autowireMode(row.autowireMode) }}</el-descriptions-item>
                  <el-descriptions-item label="注解元数据">{{ row.annotationMetadata }}</el-descriptions-item>
                  <el-descriptions-item label="注解类型">{{ row.annotationMetadata_annotationTypes }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Bean" prop="bean" show-overflow-tooltip />
          <el-table-column label="主Bean" prop="primary" />
          <el-table-column label="别名" prop="qualifiers" show-overflow-tooltip />
          <el-table-column label="属性" prop="attributes" show-overflow-tooltip />
        </el-table>
      </template>
    </el-auto-resizer>
  </div>
</template>
<script setup>
import axios from "axios";
import { onBeforeMount, reactive, ref } from "vue";

const data = reactive({
  data: [],
  title: "",
  expanded: null
});

const autowireMode = it => {
  if (it == 0) {
    return "AUTOWIRE_NO";
  }
  if (it == 1) {
    return "AUTOWIRE_BY_NAME(名称注入)";
  }
  if (it == 2) {
    return "AUTOWIRE_BY_TYPE(类型注入)";
  }
  if (it == 3) {
    return "AUTOWIRE_CONSTRUCTOR(构造注入)";
  }
  if (it == 4) {
    return "AUTOWIRE_AUTODETECT(自动)";
  }
};
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
  axios.get((window.agentPath || "/agent") + "/spring-bean-data").then(res => {
    data.title = "当前对象: " + res.data.length;
    data.data = res.data;
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
  color: #3f3f3f;
  font-size: 1.2em;
  right: 50%;
  top: 10px;
  width: 24px;
  height: 24px;
  text-align: center;
  vertical-align: middle;
  border-radius: 50%;
  background-color: #ccc;
  display: inline-block;
}
</style>
