<template>
  <div class="h-full w-full">
    <ScEcharts key="cpu" height="100%" width="100%" :option="networkOptions" />
  </div>
</template>
<script setup>
import * as echarts from "echarts";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { onMounted, defineExpose, reactive, defineEmits } from "vue";
import { dateFormat } from "@repo/utils";
import { timestamp } from "@vueuse/core";
const emit = defineEmits([]);
onMounted(() => {
  emit("success");
});
const networkOptions = reactive({
  legend: {
    show: true,
    data: ["服务器上行", "服务器下行"],
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
    boundaryGap: [0, "30%"]
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
      name: "服务器上行",
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
    },
    {
      name: "服务器下行",
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
const handle = async (data, type) => {
  if (type === "read") {
    if (networkOptions.series[0].data.length > 100) {
      networkOptions.series[0].data.shift();
    }
    networkOptions.series[0].data.push([dateFormat(data.timestamp), data?.free]);
    return;
  }
  if (type === "write") {
    if (networkOptions.series[1].data.length > 100) {
      networkOptions.series[1].data.shift();
    }
    networkOptions.series[1].data.push([dateFormat(data.timestamp), data?.free]);
    return;
  }
  handle({ timestamp: data.timestamp, free: data?.receiveBytes }, "read");
  handle({ timestamp: data.timestamp, free: data?.transmitBytes }, "write");
};
defineExpose({
  handle
});
</script>
