<template>
  <div class="datav">
    <scDrag ref="dragRef" v-model="visible" :mini="true" height="80vh" width="80vw" :tech="datav" @close="onClose">
      <div class="h-full z-[10]">
        <el-form :inline="true">
          <el-form-item>
            <el-date-picker v-model="time" class="!w-[500px]" type="datetimerange" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon('ep:search')" @click="doQuery" />
          </el-form-item>
        </el-form>
        <scEcharts key="network" height="calc(100% - 60px)" width="100%" :option="networkOptions" />
      </div>
    </scDrag>
  </div>
</template>
<script setup>
import scDrag from "@/components/ScDrag/index.vue";

import { fetchIndicatorMulti } from "@/api/monitor/service";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import scEcharts from "@/components/ScEcharts/index.vue";
import { dateFormat } from "@/utils/date";
import { defineExpose, onMounted, reactive, ref } from "vue";

import { formatSize } from "@/utils/objects";
import { Md5 } from "ts-md5";

const visible = ref(false);
const datav = ref(true);
const time = ref([]);

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
onMounted(() => {
  time.value[1] = new Date().getTime();
  time.value[0] = new Date().getTime() - 86400000;
  doQuery();
});
const keyIndex = reactive({});
const doQuery = async () => {
  const q = {};
  Object.assign(q, props.condition);
  q.name = "network:" + Md5.hashStr("NETWORK:" + props.form.host + props.form.port);
  q.fromTimestamp = time.value[0];
  q.count = 100;
  q.toTimestamp = time.value[1];
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
};
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

const onClose = () => {
  visible.value = false;
};
const open = () => {
  visible.value = true;
};
defineExpose({
  update,
  open
});
</script>
