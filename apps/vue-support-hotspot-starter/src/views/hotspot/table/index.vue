<template>
  <div style="height: 100%">
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-input v-model="filterName" placeholder="搜索" class="!w-[300px] m-[10px]" />

    <ScTable :data="tableData" fixed height="90%">
      <el-table-column type="index" />
      <el-table-column label="表名" prop="table" />
      <el-table-column prop="qps">
        <template #default="{ row }">
          <div class="flex flex-1 mr-4 px-4">
            <el-statistic
              title="visited"
              :value="
                useTransition(row.count, {
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
  axios.get((window.agentPath || "/agent") + "/table_info").then(res => {
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
