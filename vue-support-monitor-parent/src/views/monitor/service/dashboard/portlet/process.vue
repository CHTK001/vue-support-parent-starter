<template>
  <div class="h-full w-full">
    <el-empty v-if="diskOptions.series.data.length == 0" />
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
const diskOptions = reactive({
  visualMap: {
    type: "continuous",
    left: 10,
    bottom: 40,
    inRange: {},
    textStyle: {
      color: $c.wh
    }
  },
  levels: [],
  series: {
    type: "sunburst",
    data: [],
    radius: [40, "100%"],
    itemStyle: {
      borderRadius: 7,
      borderWidth: 2,
      borderColor: $c.bll9
    },
    label: {
      show: true,
      fontSize: 12,
      color: $c.wh,
      rotate: "tangential", //文字旋转
      formatter: function (param) {
        return param.name;
      }
    },
    levels: [
      {},
      {
        r0: "15%",
        r: "35%",
        itemStyle: {
          borderWidth: 2
        },
        label: {
          rotate: "tangential"
        }
      },
      {
        r0: "35%",
        r: "70%",
        label: {
          align: "right"
        }
      },
      {
        r0: "70%",
        r: "72%",
        label: {
          position: "outside",
          padding: 3,
          silent: false
        },
        itemStyle: {
          borderWidth: 3
        }
      }
    ]
  }
});

onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "process:" + Md5.hashStr("PROCESS:" + props.form.host + props.form.port);
    fetchIndicatorGet(q).then(res => {
      try {
        update(JSON.parse(res.data?.value || "{}"));
      } catch (error) {}
    });
  }
});

const update = async data => {
  diskOptions.series.data = data;
  console.log(diskOptions);
};

defineExpose({
  update
});
</script>
