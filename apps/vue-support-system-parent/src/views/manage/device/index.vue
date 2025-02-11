<template>
  <div>
    <ScTable :url="fetchPageProjectForDevice" :params="form" :columns="env.columns"></ScTable>
  </div>
</template>
<script lang="tsx" setup>
import { fetchPageProjectForDevice } from "@/api/manage/device";
import { reactive } from "vue";

const env = reactive({
  columns: [
    {
      label: "设备名称",
      prop: "sysDeviceName",
    },
    {
      label: "设备名称",
      prop: "sysDeviceName",
    },
  ],
});
const form = reactive({});
</script>
