<template>
  <div class="h-full w-full">
    <scEcharts key="disk" height="100%" width="100%" :option="memOptions" />
  </div>
</template>
<script setup>
import scEcharts from "@/components/ScEcharts/index.vue";
import { computed, onBeforeMount, reactive } from "vue";
import { fetchIndicatorQuery } from "@/api/monitor/service";
import { dateFormat } from "@/utils/date";
import * as echarts from "echarts";

const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});
const memOptions = reactive({
  legend: {
    show: true,
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
  // dataZoom: [
  //   {
  //     // 开启水平滚动条
  //     type: "slider", // 使用 'slider' 类型的 dataZoom 组件
  //     start: 70, // 初始时间区间选择范围为 0% 到 100%
  //     end: 100
  //   }
  // ],
  grid: {
    left: "5%",
    right: "5%",
    bottom: "5%",
    top: "20%",
    containLabel: true
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
  areaStyle: {
    color: new echarts.graphic.LinearGradient(
      0,
      0,
      0,
      1,
      [
        {
          offset: 0,
          color: $c.fade($c.bll5, 0.9)
        },
        {
          offset: 0.8,
          color: $c.fade($c.bll5, 0.1)
        }
      ],
      false
    ),
    shadowcolor: $c.fade($c.bll5, 0.3),
    shadowBlur: 10
  },
  series: [
    {
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

onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "mem:MEM:" + props.form.host + props.form.port;
    fetchIndicatorQuery(q).then(res => {
      res.data.forEach(it => {
        try {
          update({ timestamp: it.timestamp, usedPercent: it.value });
        } catch (error) {}
      });
    });
  }
});
const update = async data => {
  if (memOptions.series[0].data.length > 100) {
    memOptions.series[0].data.shift();
  }
  memOptions.series[0].data.push([dateFormat(data.timestamp), (data.usedPercent * 100).toFixed(2)]);
};

defineExpose({
  update
});
</script>
