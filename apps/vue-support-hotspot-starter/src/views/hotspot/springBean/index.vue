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
            <el-descriptions class="margin-top m-[20px]" title="扩展" :column="1" :size="size" border>
              <el-descriptions-item label="来源" :width="700">
                <span class="truncate text-ellipsis overflow-hidden whitespace-nowrap !w-[700px]" :title="row.source">
                  {{ row.source }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="工厂类">{{ row.factory }}</el-descriptions-item>
              <el-descriptions-item label="工厂方法">{{ row.factoryMethodName }}</el-descriptions-item>
              <el-descriptions-item label="初始化方法">{{ row.initMethodName }}</el-descriptions-item>
              <el-descriptions-item label="销毁化方法">{{ row.destroyMethodName }}</el-descriptions-item>
              <el-descriptions-item label="资源路径">{{ row.resource }}</el-descriptions-item>
              <el-descriptions-item label="依赖注入模式">{{ autowireMode(row.autowireMode) }}</el-descriptions-item>
              <el-descriptions-item label="依赖">{{ row.dependsOn }}</el-descriptions-item>
              <el-descriptions-item label="构造参数">{{ row.constructorArgumentCount }}</el-descriptions-item>
              <el-descriptions-item label="别名" prop="qualifiers" show-overflow-tooltip />
              <el-descriptions-item label="属性" prop="attributes" show-overflow-tooltip />
            </el-descriptions>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Bean" prop="bean" show-overflow-tooltip width="500" />
      <el-table-column label="主Bean" prop="primary">
        <template #default="{ row }">
          <el-tag v-if="row.primary" type="success">是</el-tag>
          <el-tag v-else type="default">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否单例" prop="singleton">
        <template #default="{ row }">
          <el-tag v-if="row.singleton" type="success">是</el-tag>
          <el-tag v-else type="default">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否原型" prop="prototype">
        <template #default="{ row }">
          <el-tag v-if="row.prototype" type="success">是</el-tag>
          <el-tag v-else type="default">否</el-tag>
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
<script setup>
import axios from "axios";
import { computed, onBeforeMount, reactive, ref, watch } from "vue";

const filterName = ref("");
const tableData = computed(() => {
  if (filterName.value) {
    return data.data.filter(it => {
      return it.bean.indexOf(filterName.value) > -1 || String(it?.source).indexOf(filterName.value) > -1;
    });
  }
  return data.data;
});
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
