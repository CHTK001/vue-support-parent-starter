<script setup>
import dayjs from "dayjs";
import { getMineLogs } from "@/api/user";
import { reactive, ref, onMounted } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";

defineOptions({
  name: "SecurityLog"
});

const { t } = useI18n();
const loading = ref(true);
const columns = [
  {
    label: t("field.ipAddress") || "IP 地址",
    prop: "sysLogIp",
    minWidth: 100
  },
  {
    label: t("field.address") || "地点",
    prop: "sysLogAddress",
    minWidth: 140
  },
  {
    label: t("field.system") || "操作系统",
    prop: "sysLogSystem",
    minWidth: 100
  },
  {
    label: t("field.browser") || "浏览器类型",
    prop: "sysLogBrowser",
    minWidth: 100
  },
  {
    label: t("field.time") || "时间",
    prop: "createTime",
    minWidth: 180
  }
];
</script>

<template>
  <div :class="['min-w-[180px] h-full', deviceDetection() ? 'max-w-[100%]' : 'max-w-[90%]']">
    <h3 class="my-8">{{ $t("button.securityLog") }}</h3>
    <ScTable :url="getMineLogs" border :columns="columns" />
  </div>
</template>
