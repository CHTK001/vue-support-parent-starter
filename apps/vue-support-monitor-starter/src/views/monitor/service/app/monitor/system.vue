<template>
  <div class="overflow-x-hidden p-2 bg-gray-200 h-dvh">
    <el-row :gutter="20" class="py-1">
      <el-col :span="8" :sm="12" :md="12" class="!h-[300px] pt-2">
        <DvBorderBox13 class="h-full">
          <div dv-bg class="h-full">
            <component :is="DiskViewer" ref="diskViewerRef" class="h-full w-full" />
          </div>
        </DvBorderBox13>
      </el-col>

      <el-col :span="8" :sm="12" :md="12" class="!h-[300px] pt-2">
        <DvBorderBox12 class="h-full">
          <div dv-bg class="h-full">
            <component :is="CpuViewer" ref="cpuViewerRef" class="h-full w-full" />
          </div>
        </DvBorderBox12>
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
import { onMounted, reactive, ref, defineExpose, defineAsyncComponent, nextTick } from "vue";
import * as echarts from "echarts";
import { dateFormat } from "@repo/utils";
import { useConfigStore } from "@repo/core";
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { fetchIndicatorGet, fetchIndicatorQuery } from "@/api/monitor/service";
import { BorderBox13 as DvBorderBox13, BorderBox12 as DvBorderBox12, Decoration7 } from "@kjgl77/datav-vue3";

const cpuViewerRef = ref();
const diskViewerRef = ref();

const CpuViewer = defineAsyncComponent({
  loader: () => import("./part/cpu.vue"),
  loadingComponent: LoadingComponent
});
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

const handleOpen = async () => {
  handleInitialize("disk", "DISK", it => {
    diskViewerRef.value.handle(it);
  });
  handleInitialize("cpu", "CPU", it => {
    cpuViewerRef.value.handle(it);
  });
};

const handleInitialize = async (name, type, fun) => {
  const q = {};
  q.name = name + ":" + Md5.hashStr(type + ":" + props.data.host + props.data.port);
  if (type === "DISK") {
    fetchIndicatorGet(q).then(res => {
      handleRender(fun, JSON.parse(res.data?.value));
    });
    return;
  }
  fetchIndicatorQuery(q).then(res => {
    res.data.forEach(it => {
      handleRender(fun, { timestamp: it.timestamp, free: it.value });
    });
  });
};
const handleRender = async (fun, data) => {
  fun(data);
};

const publish = async (event, data) => {
  if (!config.supportEvent.includes(event)) {
    return;
  }
  if ("DISK" === event) {
    handleRender(it => diskViewerRef.value.handle(it), data);
    return;
  }

  if ("CPU" === event) {
    handleRender(it => cpuViewerRef.value.handle(it), { timestamp: data.timestamp, free: data.free });
    return;
  }
};

onMounted(async () => {
  nextTick(() => {
    handleOpen();
  });
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
