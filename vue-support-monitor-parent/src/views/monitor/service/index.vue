<template>
  <div>
    <ScCard :data="data.tableData" :params="params">
      <div>1</div>
    </ScCard>
  </div>
</template>
<script setup>
import { fetchServiceList } from "@/api/monitor/service";
import ScTable from "@/components/scTable/index.vue";
import ScCard from "@/components/scCard/index.vue";
import { markRaw, reactive } from "vue";

const params = reactive({
  page: 1,
  pageSize: 10,
  uriSpec: "monitor"
});

const data = reactive({
  tableData: markRaw([])
});
const getData = () => {
  data.tableData.length = 0;
  fetchServiceList(params).then(res => {
    data.tableData = res.data;
  });
};
</script>
