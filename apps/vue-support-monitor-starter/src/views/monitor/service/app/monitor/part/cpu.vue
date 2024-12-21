<template>
  <div class="h-full w-full">
    <ScEcharts key="cpu" height="100%" width="100%" :option="cpuOptions" />
  </div>
</template>
<script setup>
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { ref, defineExpose, reactive, computed } from "vue";

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
    color: this.color,
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
          color: this.color
        },
        {
          offset: 0.8,
          color: this.color
        }
      ],
      false
    ),
    shadowcolor: this.color,
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
        data: [{ type: "average", name: "Avg" }]
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
  cpuOptions.yAxis.data = (data || []).map(element => element.typeName);
  cpuOptions.series[0].data = (data || []).map(element => {
    return parseFloat((element.usedPercent * 100).toFixed(2));
  });
  cpuOptions.series[1].data = fillArr;
  cpuOptions.series[2].data = getSymbolData(data);
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
