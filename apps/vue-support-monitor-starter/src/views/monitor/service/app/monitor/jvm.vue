<template>
  <div class="overflow-x-hidden p-2 bg-gray-200 h-dvh">
    <el-row :gutter="20" class="py-1">
      <el-col :span="6" class="!h-[300px] pt-2" />
      <el-col :span="12" class="!h-[300px] pt-2">
        <div dv-bg class="h-full">
          <component :is="JvmViewer" ref="jvmViewerRef" class="h-full w-full" @success="handleInitializeJvm" />
        </div>
      </el-col>
      <el-col :span="6" class="!h-[300px] pt-2" />
      <el-col :span="6" class="!h-[300px] pt-2">1</el-col>
    </el-row>
  </div>
</template>
<script setup>
import { fetchIndicatorGet, fetchIndicatorQuery } from "@/api/monitor/service";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { Md5 } from "ts-md5";
import { defineAsyncComponent, defineExpose, reactive, ref } from "vue";

const jvmViewerRef = ref(null);

const JvmViewer = defineAsyncComponent({
  loader: () => import("./part/jvm.vue"),
  loadingComponent: LoadingComponent
});

const props = defineProps({
  data: Object
});
const config = reactive({
  supportEvent: ["JVM", "URL"]
});

const handleInitializeJvm = async () => {
  handleInitialize(
    "jvm",
    "JVM",
    it => {
      jvmViewerRef.value.handle(it);
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};
const handleInitialize = async (name, type, fun, query = {}) => {
  const q = {};
  Object.assign(q, query);
  q.name = name + ":" + Md5.hashStr(type + ":" + props.data.host + props.data.port);
  if (type === "JVM") {
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
  if ("JVM" === event) {
    handleRender(it => jvmViewerRef.value.handle(it), data);
    return;
  }
  debugger;
  if ("URL" === event) {
    handleRender(it => jvmViewerRef.value.handle(it), data);
    return;
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
