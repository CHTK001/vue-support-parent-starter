<template>
  <div class="h-full w-full">
    <el-empty v-if="networkOptions.series.length == 0" />
    <scEcharts v-else key="network" height="100%" width="100%" :option="networkOptions" />
    <div class="absolute top-[-3px] cursor-pointer">
      <el-icon>
        <component :is="useRenderIcon('ep:search')" @click="onDetail" />
      </el-icon>
    </div>
    <detail v-if="detailVisible" ref="detailRef" :form="form" />
  </div>
</template>
<script setup>
import { fetchIndicatorMulti } from "@/api/monitor/service";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { dateFormat } from "@/utils/date";
import { formatSize } from "@repo/utils/objects";
import { Md5 } from "ts-md5";
import { nextTick, onBeforeMount, reactive, ref } from "vue";
import detail from "./networkdetail.vue";
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
const networkOptions = reactive({
  legend: {
    data: [],
    floating: true,
    show: true,
    top: 5,
    left: 15
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    },
    formatter: params => {
      let rs = {};
      rs["时间:" + params[0].axisValue + "<br/>"] = "";
      params.forEach(item => {
        rs[`${item.seriesName}：${formatSize(item.data[1])}<br/>`] = "";
      });

      return Object.keys(rs).join("");
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

const keyIndex = reactive({});
onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "network:" + Md5.hashStr("NETWORK:" + props.form.host + props.form.port);
    fetchIndicatorMulti(q).then(res => {
      const arr = res.data;
      const keys = Object.keys(arr);
      if (networkOptions.series.length == 0) {
        for (let i = 0; i < keys.length; i++) {
          const name = keys[i];
          const simpleName = name.indexOf(":READ:") > -1 ? name.substring(name.indexOf(":READ:") + 1) : name.substring(name.indexOf(":WRITE:") + 1);
          keyIndex[simpleName] = i;
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
  if (!(items instanceof Array)) {
    const index = keyIndex["READ:" + items.name];
    if (networkOptions.series[index].data.length > 100) {
      networkOptions.series[index].data.shift();
    }
    networkOptions.series[index].data.push([dateFormat(items.timestamp), items.readBytes]);
    const index1 = keyIndex["WRITE:" + items.name];
    if (networkOptions.series[index1].data.length > 100) {
      networkOptions.series[index1].data.shift();
    }
    networkOptions.series[index1].data.push([dateFormat(items.timestamp), items.writeBytes]);
    return;
  }
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
