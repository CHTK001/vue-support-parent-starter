<template>
  <div class="h-full w-full">
    <ScEcharts key="cpu" height="100%" width="100%" :option="cpuOptions" />
  </div>
</template>
<script setup>
import * as echarts from "echarts";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { ref, defineExpose, reactive, computed } from "vue";
import {dateFormat} from "@repo/utils";
const fillArr = computed(() => {
  return [
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100
  ].fill(100);
});
const cpuOptions = reactive({
  legend: {
    show: true,
    data: ["服务器CPU"],
    top: 5,
    right: 15
  },
  xAxis: {
    type: "category",
    boundaryGap: false
  },
  yAxis: {
    type: "value",
    boundaryGap: [0, "30%"],
    max: 100
  },
  type: "line",
  barWidth: 15,
  label: {
    show: false,
    position: "insideRight"
  },
  itemStyle: {
    color: "#fff",
    borderRadius: 5
  },
  smooth: false,
  areaStyle: {
    color: new echarts.graphic.LinearGradient(
      0,
      0,
      0,
      1,
      [
        {
          offset: 0,
          color: "#397bf8"
        },
        {
          offset: 0.8,
          color: "#39b5f8"
        }
      ],
      false
    ),
    shadowcolor: "#397bf8",
    shadowBlur: 10
  },
  series: [
    {
      name: "服务器CPU",
      type: "line",
      smooth: true,
      symbol: "none",
      markPoint: {
        data: [
          { type: "max", name: "Max" },
          { type: "min", name: "Min" }
        ]
      },
      markLine: {
        symbol: ["none", "none"],
        label: { show: false },
        data: [{ xAxis: 1 }, { xAxis: 3 }, { xAxis: 5 }, { xAxis: 7 }]
      },
      areaStyle: {},
      data: []
    }
  ]
});
const handle = async data => {
  if (cpuOptions.series[0].data.length > 100) {
    cpuOptions.series[0].data.shift();
  }
  cpuOptions.series[0].data.push([dateFormat(data.timestamp), (100 - data?.free).toFixed(2)]);
};
const getSymbolData = data => {
  let arr = [];
  for (var i = 0; i < data.length; i++) {
    arr.push({
      value: data[i],
      symbolPosition: "end"
    });
  }
  return arr;
};
defineExpose({
  handle
});
</script>
