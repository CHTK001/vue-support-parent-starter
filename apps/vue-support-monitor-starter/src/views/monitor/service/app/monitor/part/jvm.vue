<template>
  <div class="screenB-counterGrid flex flex-auto w-full justify-between">
    <div v-for="(item, index) in state.arry" :key="index" class="content-wrap">
      <div class="flex justify-center items-center">
        <decoFrameA2 :config="decoFrameConfig">
          <component :is="useRenderIcon(item.icon)" class="text-lg" style="font-size: 34px" />
        </decoFrameA2>
      </div>
      <div class="flex justify-center items-center" style="font-size: 20px">
        <DigitalTransform v-if="item.type !== 'Time'" style="font-size: 20px" :value="item.total" :useGrouping="true" :interval="3000" class="text-lg numbers items-center" />
        <span v-else class="text-lg numbers" style="font-size: 20px">
          <DigitalTransform style="font-size: 20px" :value="item.total.day" :useGrouping="true" :interval="3000" class="text-lg numbers items-center" />
          天
          <DigitalTransform style="font-size: 20px" :value="item.total.hour" :useGrouping="true" :interval="3000" class="text-lg numbers items-center" />
          时
          <DigitalTransform style="font-size: 20px" :value="item.total.minute" :useGrouping="true" :interval="3000" class="text-lg numbers items-center" />
          分
          <DigitalTransform style="font-size: 20px" :value="item.total.second" :useGrouping="true" :interval="3000" class="text-lg numbers items-center" />
          秒
        </span>
      </div>
      <div v-if="item.type !== 'Time'" class="flex justify-center items-center">
        <div class="block-title">
          {{ item.title }}
          <span v-if="item.unit" class="unit">({{ item.unit }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { defineEmits, defineExpose, onMounted, reactive } from "vue";
import { formatDuration, formatSize, formatDurationObject } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const emit = defineEmits([]);
/**
 *
 */
const state = reactive({
  arry: [
    { title: "最大内存", icon: "ri:medium-line", unit: "G", total: "0" },
    { title: "已使用内存", icon: "simple-icons:codeship", unit: "G", total: "0" },
    {
      title: "运行时间",
      icon: "ri:24-hours-fill",
      total: "0",
      type: "Time"
    },
    { title: "已加载线程数", icon: "fa:500px", unit: "个", total: "0" },
    { title: "已加载类数", icon: "fa:align-center", unit: "个", total: "0" }
    // { title: "日志", icon: "simple-icons:logitechg", unit: "", total: "0" }
  ]
});

const decoFrameConfig = {
  directionAlt: false,
  scale: 0.9
};
const handle = async data => {
  state.arry[0].total = formatSize(data.maxMemory, true, false);
  state.arry[1].total = formatSize(data.maxMemory - data.freeMemory, true, false);
  state.arry[2].total = formatDurationObject(parseInt(data.elapsedTime));
  state.arry[3].total = parseInt(data.threadCount);
  state.arry[4].total = parseInt(data.classLoadedCount);
};

onMounted(() => {
  emit("success");
});
defineExpose({
  handle
});
</script>
