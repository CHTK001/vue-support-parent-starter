<template>
  <div>
    <ScCard :url="fetchServiceList" :params="params">
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
</script>
