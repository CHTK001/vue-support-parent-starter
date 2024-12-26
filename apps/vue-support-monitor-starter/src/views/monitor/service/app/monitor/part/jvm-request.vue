<template>
  <div class="h-full w-full">
    <ScEcharts key="url" height="100%" width="100%" :option="urlOptions" />
  </div>
</template>
<script setup>
import * as echarts from "echarts";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { onMounted, defineExpose, reactive, defineEmits } from "vue";
const emit = defineEmits([]);
onMounted(() => {
  emit("success");
});
const urlOptions = reactive({
  legend: {
    show: true,
    data: ["请求次数"],
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
      name: "请求次数",
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
  if (urlOptions.series[0].data.length > 100) {
    urlOptions.series[0].data.shift();
  }
  data.forEach(element => {
    urlOptions.series[0].data.push([element.timeOfMinute, element.number]);
  });
};
defineExpose({
  handle
});
</script>
