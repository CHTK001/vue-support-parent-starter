<template>
  <div class="h-full">
    <el-empty v-if="result.length == 0" />
    <el-table v-else :data="result" border>
      <el-table-column prop="data" label="数据" />
      <el-table-column prop="expire" label="过期时间" />
    </el-table>
  </div>
</template>
<script setup>
import { fetchGenSessionExecute } from "@/api/monitor/gen/session";
import { defineExpose, defineProps, reactive, ref } from "vue";

const codeRef = ref();

const props = defineProps({
  data: Object
});

const result = reactive([]);

const filterData = reactive({
  tableData: {},
  tableNode: {}
});
const form = reactive({});

const visible = reactive({
  documentVisible: false,
  searchVisible: false,
  isExecuteTable: false
});

const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  filterData.tableNode = node;
  form.content = tableData.nodeId;
  form.genId = props.data.genId;
  handleExecuteSql();
};

const upgradeHits = async hits => {
  codeRef.value.upgradeHits(hits);
};

const handleExecuteSql = async () => {
  fetchGenSessionExecute(form).then(res => {
    result = res?.data?.data || [];
  });
};

defineExpose({ upgrade, upgradeHits });
</script>
<stype scoped>
  
</stype>
