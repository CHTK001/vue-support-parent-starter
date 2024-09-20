<template>
  <div class="h-full w-full">
    <el-empty v-if="diskOptions.series[0].data.length == 0" />
    <scEcharts v-else key="disk" height="100%" width="100%" :option="diskOptions" />
  </div>
</template>
<script setup>
import scEcharts from "@/components/ScEcharts/index.vue";
import { computed, onBeforeMount, reactive } from "vue";
import { fetchIndicatorGet } from "@/api/monitor/service";
import { Md5 } from "ts-md5";

const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});
const base64Img =
  "image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAMAAADWZboaAAAAZlBMVEUAAABe3uVe3+Vf3uVf3+Zf3uVg3+Zg3+Zf3+Vi4OZh4OZg3+Z86/Bh3+Zi4Odj4Odi4OZ86/B76/B86/Bj4ed56+9x5+xn4umB7/N87PB36e+A7/N+7fF/7vJ/7vJ+7fGA7/OB7/PReX+lAAAAIXRSTlMABQkVDREmIhk3MR10LEFFPHh7cUprXE35h2XnqMLAp+mHAG9cAAAB5ElEQVRIx83WjU7CMBQFYIoiKMqU/XUboHv/l/Tce7t2XamDNSacETEmX86tlK2rx4py150o+MstMBLwWRfHKo6JCVxLnvmFGBjFQ58oF1//sUZhGy/ClSTWObgnL4O+bkeN4nY2okfNMbkRt9/vtxz8InoTsWplJSCzFxPmO8+GpSIByX3YQAuGDWtRKhKjCnxDXhF6Z4yxnZ20Wgko7BMRDmxtSGVaI4kdTIgb+zTYoJQlIMlDlmUFgrcDWWC201qSayqlTkiCddWWeV62VU0YlnpRi9VOKaSUsiyq/N0krwq2Ugt7lVpZl5BfHNiytjagMi+XYp0kCR45hMlivVQrE/uU5pXSrCB5bM6d1t2lOZItMqmliT3q5uVxqxzyW/ccfYLNKx7ZTeykMvNyac2yt2Fbc61MHLSC0rwoxbiNdlQ3GBm1NLHQsHUrtEXppR/ljNpW6DbSCoqlFiVoN6YdaFlgsSFVPs1BdT8OaB5QyQzVcaqWDows/zepxR8ObLglTrdtCRVuRNj4Rrxh+//0ke2f8KVL+Kon3GCSbmsJN9OUW3j6g0Ns+LgCij2u0h+Sghc8mlMPBMgdx5DFh59VmOVHrvmDnoNxCz3J7MFWsMuaLyR089xz/xhlfijvwutR8gv3zk6BLUUeCgAAAABJRU5ErkJggg==";
const diskOptions = reactive({
  update: false,
  title: {
    show: false,
    textStyle: {
      color: $c.cbl5,
      fontSize: 16,
      fontWeight: "normal"
    }
  },
  grid: {
    top: "10%",
    left: "8%",
    right: "12%",
    bottom: "5%"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    },
    formatter: params => {
      return "剩余: " + (100 - params[0].data).toFixed(2) + "%";
    }
  },
  xAxis: {
    type: "value",
    min: 0,
    max: 100,
    axisLine: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    axisTick: { show: false }
  },
  dataZoom: {
    yAxisIndex: 0,
    show: false,
    type: "slider",
    startValue: 0,
    endValue: 5
  },
  yAxis: {
    //show: false,
    type: "category",
    inverse: true,
    splitLine: { show: false },
    axisLine: { show: false },
    axisLabel: {
      show: true,
      interval: 0,
      margin: 10,
      fontSize: 12,
      width: 50,
      lineHeight: 14,
      overflow: "breakAll",
      fontWeight: "normal"
    },
    axisTick: { show: false },
    data: []
  },
  series: [
    {
      type: "bar",
      barWidth: "40%",
      animationDuration: 2000,
      itemStyle: {
        borderWidth: 0,
        borderRadius: 10,
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: $c.cyl8 },
            { offset: 1, color: $c.cyl4 }
          ]
        }
      },
      label: { show: false },
      data: [],
      z: 0
    },
    {
      type: "bar",
      barWidth: "40%",
      barGap: "-100%",
      animation: false,
      itemStyle: {
        borderWidth: 0,
        borderRadius: 5,
        color: "rgba(0,202,255,0.2)"
      },
      label: {
        show: true,
        position: ["101%", "20%"],
        fontSize: 14,
        fontWeight: "normal"
      },
      data: [],
      z: 0
    },
    {
      type: "pictorialBar",
      animation: true,
      // animationThreshold: 3000 ,
      animationDuration: 3000,
      // animationDurationUpdate:500,
      symbol: base64Img,
      symbolSize: [50, 50],
      symbolOffset: [20, 0],
      z: 12,
      itemStyle: {
        color: "#fff"
      },
      data: []
    }
  ]
});
const fillArr = computed(() => {
  return [
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100
  ].fill(100);
});

onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "disk:" + Md5.hashStr("DISK:" + props.form.host + props.form.port);
    fetchIndicatorGet(q).then(res => {
      try {
        update(JSON.parse(res.data?.value || "{}"));
      } catch (error) {}
    });
  }
});
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
const update = async data => {
  data = data || [];
  diskOptions.yAxis.data = (data || []).map(element => element.typeName);
  diskOptions.series[0].data = (data || []).map(element => {
    return parseFloat((element.usedPercent * 100).toFixed(2));
  });
  diskOptions.series[1].data = fillArr;
  diskOptions.series[2].data = getSymbolData(data);
};

defineExpose({
  update
});
</script>
