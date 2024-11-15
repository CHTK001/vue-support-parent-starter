<template>
  <div class="h-full w-full">
    <el-empty v-if="memOptions.series[0].data.length == 0" />
    <scEcharts v-else key="mem" height="100%" width="100%" :option="memOptions" />
    <div class="absolute top-[-3px] cursor-pointer">
      <el-icon>
        <component :is="useRenderIcon('ep:search')" @click="onDetail" />
      </el-icon>
    </div>
    <detail v-if="detailVisible" ref="detailRef" :form="form" />
  </div>
</template>
<script setup>
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { fetchIndicatorQuery } from "@/api/monitor/service";
import { dateFormat } from "@/utils/date";
import * as echarts from "echarts";
import { Md5 } from "ts-md5";
import { computed, onBeforeMount, reactive, ref, nextTick } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import detail from "./memdetail.vue";

const detailVisible = ref(false);
const detailRef = ref();
const onDetail = async () => {
  detailVisible.value = true;
  await nextTick();
  detailRef.value?.open();
};
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
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    },
    formatter: params => {
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
  visualMap: [
    {
      show: false,
      type: "continuous",
      seriesIndex: 0,
      min: 0,
      max: 100
    }
  ],
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
          color: "rgba(102, 204, 204,1)"
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
            color: "green" // 最小值颜色
          }
        }
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
    q.name = "mem:" + Md5.hashStr("MEM:" + props.form.host + props.form.port);
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
