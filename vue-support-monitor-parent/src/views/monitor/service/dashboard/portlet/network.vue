<template>
  <div class="h-full w-full">
    <el-empty v-if="networkOptions.series.length == 0" />
    <scEcharts v-else key="network" height="100%" width="100%" :option="networkOptions" />
  </div>
</template>
<script setup>
import scEcharts from "@/components/ScEcharts/index.vue";
import { computed, onBeforeMount, reactive } from "vue";
import { fetchIndicatorMulti } from "@/api/monitor/service";
import { dateFormat } from "@/utils/date";
import * as echarts from "echarts";

const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});
const networkOptions = reactive({
  legend: {
    data: [],
    floating: true,
    show: true,
    top: 5,
    right: 15
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    }
  },
  xAxis: {
    type: "category",
    boundaryGap: false
  },
  yAxis: {
    type: "value",
    boundaryGap: [0, "20%"]
  },
  type: "line",
  barWidth: 15,
  label: {
    show: false,
    position: "insideRight"
  },
  itemStyle: {
    color: $c.bll5,
    borderRadius: 5
  },
  smooth: false,
  series: []
});

onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "network:NETWORK:" + props.form.host + props.form.port;
    fetchIndicatorMulti(q).then(res => {
      const arr = res.data;
      const keys = Object.keys(arr);
      if (networkOptions.series.length == 0) {
        for (let i = 0; i < keys.length; i++) {
          const name = keys[i];
          const simpleName = name.indexOf(":READ:") > -1 ? name.substring(name.indexOf(":READ:") + 6) : name.substring(name.indexOf(":WRITE:") + 7);
          networkOptions.legend.data.push(simpleName);
          networkOptions.series[i] = {
            name: simpleName,
            type: "line",
            smooth: true,
            symbol: "none",
            data: []
          };
        }
      }

      update(arr);
    });
  }
});
const update = async data => {
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const items = data[keys[i]];
    updateItem(i, items);
  }
};

const updateItem = async (i, items) => {
  items.forEach(data => {
    if (networkOptions.series[i].data.length > 100) {
      networkOptions.series[i].data.shift();
    }
    networkOptions.series[i].data.push([dateFormat(data.timestamp), data.value]);
  });
};

defineExpose({
  update
});
</script>
