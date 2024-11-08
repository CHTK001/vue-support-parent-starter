<template>
  <div>
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-table :data="data.data" :row-class-name="getRowClass" row-key="threadId" border :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" class="counter">
      <el-table-column prop="date" label="线程">
        <template #default="{ row }">
          <span v-if="!row.isChildrenItem" class="item">
            <span class="ml-[30px]">
              {{ row.threadId + "".repeat(4) }}
              <span class="pl-[20px]">
                <el-tag v-if="row.threadState == 'WAITING'" class="!text-gray-400 !w-[160px]">{{ row.threadState }}</el-tag>
                <el-tag v-else-if="row.threadState == 'TIMED_WAITING'" class="!text-gray-700 !w-[160px]">{{ row.threadState }}</el-tag>
                <el-tag v-else-if="row.threadState == 'RUNNABLE'" class="!text-green-700 !w-[160px]">{{ row.threadState }}</el-tag>
                <el-tag v-else class="!w-[160px]">{{ row.threadState }}</el-tag>
              </span>
              <span class="text-red-400 pl-[20px]">{{ row.threadName }}</span>
              <span class="text-gray-400 pl-[20px] text-[12px]">{{ row.daemon ? "守护线程" : "" }}</span>
            </span>
          </span>
          <span v-else class="pl-10">
            <span>{{ row.methodName }}</span>
            <span>:{{ row.lineNumber }}</span>
            <span class="pl-2">, {{ row.fileName }}</span>
            <span class="pl-2">
              <strong>
                <em>({{ row.className }})</em>
              </strong>
            </span>
            <span class="pl-2">({{ row.moduleVersion }})</span>
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import axios from "axios";
import { onBeforeMount, reactive } from "vue";

const data = reactive({
  data: [],
  title: ""
});
const getRowClass = (row, rowIndex) => {
  let data = row.row;
  let res = [];
  if (data.children && data.children.length > 0) {
    res.push("row-expand-has");
    return res;
  } else {
    res.push("row-expand-unhas");
    return res;
  }
};
onBeforeMount(async () => {
  axios.get((window.agentPath || "/agent") + "/object_info").then(res => {
    data.title = "当前线程数: " + res.data.length;
    data.data = res.data.map(it => {
      return {
        ...it,
        children: it.stackTrace.map(it2 => {
          return {
            ...it2,
            children: [],
            isChildrenItem: true,
            threadId: it.threadId,
            threadName: it.threadName,
            threadState: it.threadState
          };
        })
      };
    });
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
