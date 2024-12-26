<template>
  <div class="overflow-x-hidden p-2 bg-gray-200 h-dvh">
    <el-row :gutter="20" class="py-1">
      <el-col :span="8" :sm="12" :md="8" class="!h-[300px] pt-2">
        <aYinTechBorderA1
          class="h-full"
          :config="{
            title: '磁盘信息',
            titleWidth: 190,
            decorationAlt: true,
            rotate: 'y'
          }"
        >
          <div dv-bg class="h-full">
            <component :is="DiskViewer" ref="diskViewerRef" class="h-full w-full" @success="handleInitializeDisk" />
          </div>
        </aYinTechBorderA1>
      </el-col>

      <el-col :span="8" :sm="12" :md="8" class="!h-[300px] pt-2">
        <aYinTechBorderB1
          class="h-full"
          :config="{
            position: 'center'
          }"
        >
          <div dv-bg class="h-full">
            <component :is="CpuViewer" ref="cpuViewerRef" class="h-full w-full" @success="handleInitializeCpu" />
          </div>
        </aYinTechBorderB1>
      </el-col>

      <el-col :span="8" :sm="12" :md="8" class="!h-[300px] pt-2">
        <aYinTechBorderA1
          class="h-full"
          :config="{
            title: '内存信息',
            titleWidth: 190,
            decorationAlt: true
          }"
        >
          <div dv-bg class="h-full">
            <component :is="MemViewer" ref="memViewerRef" class="h-full w-full" @success="handleInitializeMem" />
          </div>
        </aYinTechBorderA1>
      </el-col>
      <el-col :span="8" :sm="12" :md="8" class="!h-[300px] pt-2">
        <aYinTechBorderA1
          class="h-full"
          :config="{
            title: '网络信息',
            titleWidth: 190,
            decorationAlt: true,
            rotate: 'y'
          }"
        >
          <div class="h-full">
            <component :is="IoNetViewer" ref="ioNetViewerRef" class="h-full w-full" @success="handleInitializeIoNet" />
          </div>
        </aYinTechBorderA1>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { Md5 } from "ts-md5";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { defineAsyncComponent, defineExpose, reactive, ref } from "vue";
import { fetchIndicatorGet, fetchIndicatorQuery } from "@/api/monitor/service";

const cpuViewerRef = ref(null);
const memViewerRef = ref(null);
const ioNetViewerRef = ref(null);
const diskViewerRef = ref(null);

const IoNetViewer = defineAsyncComponent({
  loader: () => import("./part/network.vue"),
  loadingComponent: LoadingComponent
});

const MemViewer = defineAsyncComponent({
  loader: () => import("./part/mem.vue"),
  loadingComponent: LoadingComponent
});

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
  supportEvent: ["DISK", "CPU", "MEM", "IO_NETWORK"]
});

const handleInitializeMem = async () => {
  handleInitialize(
    "mem",
    "MEM",
    it => {
      memViewerRef.value.handle(it);
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};

const handleInitializeIoNet = async () => {
  handleInitialize(
    "io-network:read",
    "IO_NETWORK",
    it => {
      ioNetViewerRef.value.handle(it, "read");
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
  handleInitialize(
    "io-network:write",
    "IO_NETWORK",
    it => {
      ioNetViewerRef.value.handle(it, "write");
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};
const handleInitializeCpu = async () => {
  handleInitialize(
    "cpu",
    "CPU",
    it => {
      cpuViewerRef.value.handle(it);
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};
const handleInitializeDisk = async () => {
  handleInitialize("disk", "DISK", it => {
    diskViewerRef.value.handle(it);
  });
};
const handleInitialize = async (name, type, fun, query = {}) => {
  const q = {};
  Object.assign(q, query);
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

  if ("MEM" === event) {
    handleRender(it => memViewerRef.value.handle(it), { timestamp: data.timestamp, free: data.free });
    return;
  }

  if ("IO_NETWORK" === event) {
    handleRender(it => ioNetViewerRef.value.handle(it), data);
  }
};

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
