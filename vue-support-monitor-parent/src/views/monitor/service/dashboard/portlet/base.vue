<script setup>
import { fetchIndicatorGet } from "@/api/monitor/service";
import { defineExpose, onBeforeMount, reactive, defineProps } from "vue";
import { formatDuration, formatSize } from "@/utils/objects";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});

onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "jvm:JVM:" + props.form.host + props.form.port;
    fetchIndicatorGet(q).then(res => {
      try {
        update(JSON.parse(res.data?.value || "{}"));
      } catch (error) {}
    });
  }
});
const decoFrameConfig = {
  directionAlt: false,
  scale: 0.8
};
const state = reactive({
  arry: [
    { title: "最大内存", icon: "ri:medium-line", unit: "G", total: "0" },
    { title: "已使用内存", icon: "simple-icons:codeship", unit: "G", total: "0" },
    { title: "运行时间", icon: "ri:24-hours-fill", unit: "秒", total: "0" },
    { title: "已加载线程数", icon: "fa:500px", unit: "个", total: "0" },
    { title: "已加载类数", icon: "fa:align-center", unit: "个", total: "0" }
  ]
});
const update = async data => {
  state.arry[0].total = formatSize(data.maxMemory, true, false);
  state.arry[1].total = formatSize(data.maxMemory - data.freeMemory, true, false);
  state.arry[2].total = parseInt(data.elapsedTime / 1000);
  state.arry[3].total = data.threadCount;
  state.arry[4].total = data.classLoadedCount;
};

defineExpose({
  update
});
</script>
<template>
  <div class="screenB-counterGrid flex flex-auto w-full justify-between">
    <div v-for="(item, index) in state.arry" :key="index" class="content-wrap">
      <div class="flex justify-center items-center">
        <decoFrameA2 :config="decoFrameConfig">
          <component :is="useRenderIcon(item.icon)" class="text-lg" style="font-size: 34px" />
        </decoFrameA2>
      </div>
      <div class="flex justify-center items-center">
        <DigitalTransform :value="item.total" :useGrouping="true" :interval="3000" class="text-lg numbers" />
      </div>
      <div class="flex justify-center items-center">
        <div class="block-title">
          {{ item.title }}
          <span v-if="item.unit" class="unit">({{ item.unit }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.block-title {
  font-size: 18px;
}
:deep(.dt-scroll-digital) {
  font-size: 26px;
}
</style>
