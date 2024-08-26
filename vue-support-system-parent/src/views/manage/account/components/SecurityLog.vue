<script setup>
import dayjs from "dayjs";
import { getMineLogs } from "@/api/user";
import { reactive, ref, onMounted } from "vue";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "SecurityLog"
});

const loading = ref(true);
const columns = [
  {
    label: "IP 地址",
    prop: "sysLogIp",
    minWidth: 100
  },
  {
    label: "地点",
    prop: "sysLogAddress",
    minWidth: 140
  },
  {
    label: "操作系统",
    prop: "sysLogSystem",
    minWidth: 100
  },
  {
    label: "浏览器类型",
    prop: "sysLogBrowser",
    minWidth: 100
  },
  {
    label: "时间",
    prop: "createTime",
    minWidth: 180
  }
];
</script>

<template>
  <div
    :class="[
      'min-w-[180px] h-full',
      deviceDetection() ? 'max-w-[100%]' : 'max-w-[90%]'
    ]"
  >
    <h3 class="my-8">安全日志</h3>
    <ScTable :url="getMineLogs" border :columns="columns" />
  </div>
</template>
