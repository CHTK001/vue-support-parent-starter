<template>
  <div class="h-[260px] w-full">
    <el-row class="h-full">
      <el-col :span="12" class="h-full">
        <aYinTechBorderA1 class="h-[260px] !relative" :config="leftConfig">
          <scEcharts key="node" ref="echartsRef" class="!h-[260px]" height="100%" width="100%" :option="urlCountOptions" />
        </aYinTechBorderA1>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { fetchIndicatorHGet } from "@/api/monitor/service";
import { Md5 } from "ts-md5";
import { computed, defineExpose, defineProps, nextTick, onBeforeMount, onUnmounted, reactive, ref } from "vue";
import scEcharts from "@/components/ScEcharts/index.vue";

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
const echartsRef = ref();

const initialCounter = async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "url:" + Md5.hashStr("URL:" + props.form.host + props.form.port);
    fetchIndicatorHGet(q).then(res => {
      try {
        tempData.value = res.data;
        urlCountOptions.series[0].data = Object.keys(tempData.value).map(it => {
          return {
            value: res.data[it],
            name: it
          };
        });
      } catch (error) {}
    });
  }
};
onBeforeMount(async () => {
  initialCounter();
});

const update = async data => {};

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
