<template>
  <div class="overflow-x-hidden p-2 bg-gray-200 h-dvh">
    <el-row :gutter="20" class="py-1">
      <el-col :span="8" class="!h-[300px] pt-2">
        <DvBorderBox13 class="h-full">
          <div dv-bg class="h-full">
            <component :is="DiskViewer" ref="diskViewerRef" class="h-full w-full" />
          </div>
        </DvBorderBox13>
      </el-col>

      <el-col :span="8" class="!h-[300px] pt-2">
        <el-card class="h-full">
          <scEcharts key="mem" height="100%" width="100%" :option="memOptions" />
        </el-card>
      </el-col>
      <el-col :span="8" class="!h-[300px] pt-2">
        <el-card class="h-full">
          <scEcharts key="cpu" height="100%" width="100%" :option="cpuOptions" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { Md5 } from "ts-md5";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { onMounted, reactive, ref, defineExpose, defineAsyncComponent } from "vue";
import * as echarts from "echarts";
import { dateFormat } from "@repo/utils";
import { useConfigStore } from "@repo/core";
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { fetchIndicatorGet, fetchIndicatorQuery } from "@/api/monitor/service";
import { BorderBox13 as DvBorderBox13, Decoration7 } from "@kjgl77/datav-vue3";

const DiskViewer = defineAsyncComponent({
  loader: () => import("./part/disk.vue"),
  loadingComponent: LoadingComponent
});

const props = defineProps({
  data: Object
});
const config = reactive({
  supportEvent: ["DISK", "CPU", "MEM"]
});

const diskViewerRef = ref();
const handleOpen = async => {
  handleInitializeDisk();
};

const handleInitializeDisk = async => {
  const q = {};
  q.name = "disk:" + Md5.hashStr("DISK:" + props.data.host + props.data.port);
  fetchIndicatorGet(q).then(res => {
    try {
      handleRenderDisk(JSON.parse(res.data?.value));
    } catch (error) {}
  });
};
const handleRenderDisk = async data => {
  diskViewerRef.value.handle(data);
};
const publish = async (event, data) => {
  if (!config.supportEvent.includes(event)) {
    return;
  }
  if ("DISK" == event) {
    handleRenderDisk(data);
  }
};

onMounted(async () => {
  handleOpen();
});

defineExpose({ publish });
</script>
<style lang="scss" scoped>
:deep(.el-card__body) {
  height: 100%;
}
:deep(.el-card) {
  background: transparent !important;
}
</style>
