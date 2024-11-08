<template>
  <div style="height: 100%">
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table-v2
          :estimated-row-height="50"
          expand-column-key="name"
          :columns="[
            {
              key: 'name',
              dataKey: 'name',
              title: '类名',
              width: 550
            },
            {
              key: 'count',
              dataKey: 'count',
              title: '加载数量',
              width: 550
            }
          ]"
          :data="data.data"
          :width="width"
          :height="height"
          fixed
          @row-expand="onRowExpanded"
        >
          <template #row="props">
            <Row v-bind="props">1</Row>
          </template>
          <template #default>
            <div class="expend">11</div>
          </template>
        </el-table-v2>
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
  axios.get((window.agentPath || "/agent") + "/object_info").then(res => {
    data.title = "当前已加载类: " + res.data.length;
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
