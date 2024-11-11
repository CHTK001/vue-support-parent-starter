<template>
  <div style="height: 100%">
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-input v-model="filterName" placeholder="搜索" class="!w-[300px] m-[10px]" />

    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table :data="tableData" :width="width" :height="height" fixed>
          <el-table-column label="方法类型" prop="methods" show-overflow-tooltip />
          <el-table-column label="地址" prop="url" show-overflow-tooltip />
          <el-table-column label="所属Bean" prop="bean" show-overflow-tooltip />
          <el-table-column label="返回值类型" prop="produces" />
          <el-table-column label="提交内容类型" prop="consumes" show-overflow-tooltip />
          <el-table-column label="方法名" prop="methodName" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.beanType }}:{{ row.methodName }}({{ row.parameterNumber }})</span>
            </template>
          </el-table-column>
          <el-table-column label="参数检测" prop="shouldValidateArguments" />
          <el-table-column label="返回值检测" prop="shouldValidateReturnValue" />
        </el-table>
      </template>
    </el-auto-resizer>
  </div>
</template>
<script setup>
import axios from "axios";
import { onBeforeMount, reactive, ref, computed } from "vue";
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
