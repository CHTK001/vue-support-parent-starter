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
        <scEcharts key="cpu" height="calc(100% - 60px)" width="100%" :option="options" />
      </div>
    </scDrag>
  </div>
</template>
<script>
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { computed, defineComponent, nextTick, onBeforeMount, onMounted, reactive, ref } from "vue";
import { fetchIndicatorQuery } from "@/api/monitor/service";
import { dateFormat } from "@repo/utils";
import * as echarts from "echarts";
import { Md5 } from "ts-md5";
import scDrag from "@repo/components/ScDrag/index.vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
export default {
  components: { scDrag, scEcharts },
  props: {
    form: Object,
    datav: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      options: {
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
        visualMap: [
          {
            show: false,
            type: "continuous",
            seriesIndex: 0,
            min: 0,
            max: 100
          }
        ],
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
                color: "rgba(235, 236, 116, .9)"
              },
              {
                offset: 0.8,
                color: "rgb(235, 236, 116,.1)"
              }
            ],
            false
          ),
          shadowcolor: "rgba(235, 236, 116,.3)",
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
                  color: "rgb(235, 236, 116)" // 最大值颜色
                },
                b: {
                  color: "rgb(44,198,210)" // 最小值颜色
                }
              }
            },
            label: {
              show: false,
              position: "insideRight"
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
      },
      time: [],
      visible: false,
      confirmLoading: false
    };
  },
  mounted() {
    this.time[1] = new Date().getTime();
    this.time[0] = new Date().getTime() - 86400000;
    this.doQuery();
  },
  methods: {
    useRenderIcon,
    doQuery() {
      const q = {};
      Object.assign(q, this.form.condition);
      q.name = "mem:" + Md5.hashStr("MEM:" + this.form.host + this.form.port);
      q.fromTimestamp = this.time[0];
      q.count = 100;
      q.toTimestamp = this.time[1];
      fetchIndicatorQuery(q).then(res => {
        res.data.forEach(data => {
          try {
            this.options.series[0].data.push([dateFormat(data.timestamp), (100 - data?.value).toFixed(2)]);
          } catch (error) {}
        });
      });
    },
    onClose() {
      this.visible = false;
      this.confirmLoading = false;
      this.$emit("close");
    },
    open() {
      this.visible = true;
    }
  }
};
</script>
<style lang="scss" scoped>
.datav {
  position: relative;
  top: 10px;
}
:deep(.el-picker__popper) {
  z-index: 10;
}
</style>
