<template>
  <div class="h-full w-full">
    <ScEcharts key="mem" height="100%" width="100%" :option="memOptions" />
  </div>
</template>
<script setup>
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { dateFormat } from "@repo/utils";
import * as echarts from "echarts";
import { defineEmits, defineExpose, onMounted, reactive } from "vue";
const emit = defineEmits([]);
onMounted(() => {
  emit("success");
});
const memOptions = reactive({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    },
    fomatter: params => {
      return params[0].value + "%";
    }
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
    color: "rgb(15,78,142)",
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
          color: "rgba(102, 204, 204, .9)"
        },
        {
          offset: 0.8,
          color: "rgba(102, 204, 204,.1)"
        }
      ],
      false
    ),
    shadowcolor: "rgba(102, 204, 204,.3)",
    shadowBlur: 10
  },
  series: [
    {
      name: "服务器内存",
      type: "line",
      smooth: true,
      symbol: "none",
      markPoint: {
        data: [
          { type: "max", name: "Max" },
          { type: "min", name: "Min" }
        ],
        rich: {
          a: {
            color: "red" // 最大值颜色
          },
          b: {
            color: "rgb(44,198,210)" // 最小值颜色
          }
        }
      },
      areaStyle: {},
      data: []
    }
  ]
});
const handle = async data => {
  if (memOptions.series[0].data.length > 100) {
    memOptions.series[0].data.shift();
  }
  memOptions.series[0].data.push([dateFormat(data.timestamp), (100 * data?.free).toFixed(2)]);
};
defineExpose({
  handle
});
</script>
