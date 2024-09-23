<template>
  <div class="h-[260px] w-full">
    <el-row class="h-full">
      <el-col :span="12" class="h-full">
        <aYinTechBorderA1 class="h-[260px] !relative" :config="leftConfig">
          <scEcharts key="node" ref="echartsRef" class="!h-[260px]" height="100%" width="100%" :option="urlCountOptions" />
        </aYinTechBorderA1>
      </el-col>
      <el-col :span="12" class="h-full">
        <aYinTechBorderA1 class="h-[260px]" :config="rightConfig">
          <scEcharts key="node" ref="echartsRef" class="!h-[260px]" height="100%" width="100%" :option="processOptions" />
        </aYinTechBorderA1>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { fetchIndicatorHGet, fetchSearchQuery } from "@/api/monitor/service";
import scEcharts from "@/components/ScEcharts/index.vue";
import { Md5 } from "ts-md5";
import { defineExpose, defineProps, onBeforeMount, onMounted, reactive, ref } from "vue";

const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});

const leftConfig = reactive({
  backgroundColor: $c.bll9,
  decorationColor: [$c.bll3, $c.cyl5],
  borderColor: $c.bll7,
  opacity: 0.5,
  title: "请求情况"
});
const rightConfig = reactive({
  backgroundColor: $c.bll9,
  decorationColor: [$c.bll3, $c.cyl5],
  borderColor: $c.bll7,
  opacity: 0.5,
  rotate: "y",
  title: "系统状态情况"
});

const tempData = ref([]);
const urlCountOptions = reactive({
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)"
  },
  legend: {
    type: "scroll",
    orient: "vertical",
    position: "right",
    right: 5,
    top: 25,
    bottom: 20,
    tooltip: {
      show: true
    },
    textStyle: {
      rich: {
        a: {
          fontSize: 14,
          color: $c.bll5,
          padding: 10
        },
        b: {
          fontSize: 16,
          color: $c.cyl5
        }
      }
    },
    formatter: function (name) {
      return "{a|" + (name.length > 20 ? name.substring(0, 20) + "..." : name) + "}" + " " + "{b|" + tempData.value[name] + "}";
    }
  },
  series: [
    {
      radius: ["50%", "70%"],
      center: ["30%", "50%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderWidth: 2
      },
      padAngle: 5,
      label: {
        show: false,
        position: "left"
      },
      itemStyle: {
        borderRadius: 10,
        borderColor: $c.bll9,
        borderWidth: 5
      },
      emphasis: {
        label: {
          show: false,
          fontSize: "20",
          color: $c.gyd5
        }
      },
      type: "pie",
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)"
        }
      }
    }
  ]
});

const processOptions = reactive({
  series: []
});
const total = ref();
const echartsRef = ref();
const config = reactive({
  legend: ["qps", "访问量", "-"],
  colors: [$c.aql4, $c.cyl4, $c.cbl3],
  colorsD: [$c.aql8, $c.cyl8, $c.bll8],
  data: [0, 0, 0],
  radius: ["50%", "65%", "50%"],
  position: [
    ["17%", "55%"],
    ["50%", "55%"],
    ["83%", "55%"]
  ]
});
const initialEcharts = () => {
  for (let i = 0; i < config.data.length; i++) {
    processOptions.series.push({
      type: "gauge",
      startAngle: 90,
      endAngle: -270,
      center: config.position[i],
      radius: config.radius[i],
      pointer: { show: false },
      title: { fontSize: 14 },
      itemStyle: {
        color: config.colors[i],
        shadowColor: config.colors[i]
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {}
      },
      detail: {
        width: 50,
        height: 14,
        borderColor: "inherit",
        borderRadius: 20,
        borderWidth: 0,
        formatter: function (value) {
          return "{value|" + value.toFixed(i == 0 ? 2 : 0) + "}{unit|}";
        },
        rich: {
          value: { fontSize: 24, color: config.colors[i], fontWeight: "bolder" }, // color: '#999',
          unit: { fontSize: 12, color: $c.darken(config.colors[i], 1) }
        }
      },
      axisLine: {
        lineStyle: { color: [[1, $c.darken(config.colors[i], 4)]], width: 10 }
      },
      splitLine: { show: false, distance: 0, length: 10 },
      axisTick: { show: false },
      axisLabel: { show: false, distance: 50 },
      data: [
        {
          value: config.data[i],
          name: config.legend[i],
          title: { color: $c.lighten(config.colors[i], 1), offsetCenter: ["0%", "30%"] },
          detail: { valueAnimation: true, offsetCenter: ["0", "-30%"] }
        }
      ]
    });
  }
};
const initialCounter = async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "url:" + Md5.hashStr("URL:" + props.form.host + props.form.port);
    fetchIndicatorHGet(q).then(res => {
      try {
        tempData.value = res.data;
        urlCountOptions.series[0].data = Object.keys(res.data)
          .map(it => {
            return {
              value: parseInt(res.data[it]),
              name: it
            };
          })
          .sort(compare("value"));
      } catch (error) {}
    });
    q.pageSize = 1;
    q.fromTimestamp = new Date(new Date(new Date().toLocaleDateString()).getTime()).getTime();
    q.toTimestamp = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1).getTime();
    fetchSearchQuery(q).then(res => {
      processOptions.series[0].data[0].value = ((res.data?.total || 0 * 0.8) / (86400 * 0.2)) * 100;
      processOptions.series[1].data[0].value = res.data?.total || 0;
    });
  }
};
onMounted(async () => {
  initialEcharts();
  initialCounter();
});

const compare = property => {
  return function (a, b) {
    var value1 = a[property];
    var value2 = b[property];
    return value2 - value1;
  };
};
const update = async (data, type) => {
  if (type.startsWith("URL:")) {
    tempData.value = data;
    const newForm = {};
    const oldData = urlCountOptions.series[0].data;
    oldData.forEach(item => {
      newForm[item.name] = item.value;
    });
    if (!newForm[data.url]) {
      newForm[data.url] = 1;
    } else {
      newForm[data.url] += 1;
    }
    tempData.value = newForm;
    urlCountOptions.series[0].data = Object.keys(newForm)
      .map(it => {
        let index = 0;
        if (data.url == it.name) {
          index = 1;
        }
        return {
          value: newForm[it] + index,
          name: it
        };
      })
      .sort(compare("value"));
  }
};

defineExpose({
  update
});
</script>

<style lang="scss" scoped>
.tooltip-number {
  font-size: 14px;
  font-bold: 500;
}
</style>
