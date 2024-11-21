<template>
  <div class="overflow-x-hidden p-2 bg-gray-200 h-dvh">
    <el-dialog v-model="visible" :title="title" width="95%" top="10px" :close-on-click-modal="false" :destroy-on-close="true" @close="close">
      <el-row :gutter="20" class="py-1">
        <el-col :span="12" class="!h-[300px] pt-2">
          <el-card class="h-full">
            <scEcharts key="mem" height="100%" width="100%" :option="memOptions" />
          </el-card>
        </el-col>
        <el-col :span="12" class="!h-[300px] pt-2">
          <el-card class="h-full">
            <scEcharts key="cpu" height="100%" width="100%" :option="cpuOptions" />
          </el-card>
        </el-col>
        <el-col :span="12" class="!h-[300px] pt-2">
          <el-card class="h-full">
            <scEcharts key="disk" height="100%" width="100%" :option="diskOptions" />
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>
<script>
import * as echarts from "echarts";
import { dateFormat } from "@/utils/date";
import { useConfigStore } from "@/store/modules/config";
import scEcharts from "@/components/ScEcharts/index.vue";
import { fetchIndicatorGet, fetchIndicatorQuery } from "@/api/monitor/service";

export default {
  components: { scEcharts },
  data() {
    return {
      form: {},
      dataList: [],
      socket: null,
      visible: false,
      eventNames: [],
      useConfig: {},

      condition: {
        fromTimestamp: new Date().getTime() - 86400000 * 7,
        toTimestamp: new Date().getTime(),
        count: 10,
        interval: 60
      },
      memOptions: {
        legend: {
          show: true,
          data: ["服务器内存"],
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
            name: "服务器内存",
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
      },
      cpuOptions: {
        legend: {
          show: true,
          data: ["服务器CPU"],
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
            name: "服务器CPU",
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
      },
      diskOptions: {
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
            symbol: this.base64Img,
            symbolSize: [50, 50],
            symbolOffset: [20, 0],
            z: 12,
            itemStyle: {
              color: "#fff"
            },
            data: []
          }
        ]
      }
    };
  },
  computed: {
    fillArr() {
      return [
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100
      ].fill(100);
    }
  },
  created() {
    // const route = this.$route;
    this.useConfig = useConfigStore();
    // this.useConfig.load();
    // const data = Base64.decode(route.query.data);
    // this.setData(JSON.parse(data)).open();
  },
  methods: {
    afterPropertiesSet() {
      this.eventNames.forEach(it => {
        setTimeout(() => {
          const q = {};
          Object.assign(q, this.condition);
          if (it.startsWith("MEM:")) {
            q.name = "mem:MEM:" + this.form.host + this.form.port;
            fetchIndicatorQuery(q).then(res => {
              res.data.forEach(it => {
                this.renderMem({ timestamp: it.timestamp, usedPercent: it.value });
              });
            });
            return;
          }

          if (it.startsWith("CPU:")) {
            q.name = "cpu:CPU:" + this.form.host + this.form.port;
            fetchIndicatorQuery(q).then(res => {
              res.data.forEach(it => {
                this.renderCpu({ timestamp: it.timestamp, free: it.value });
              });
            });
          }
          if (it.startsWith("DISK:")) {
            q.name = "disk:DISK:" + this.form.host + this.form.port;
            fetchIndicatorGet(q).then(res => {
              try {
                this.renderDisk(JSON.parse(res.data?.value || "{}"));
              } catch (error) {}
            });
          }
        }, 311);
      });
    },
    setData(form) {
      const suffix = form.host + form.port;
      this.eventNames = ["LOG:" + suffix, "JVM:" + suffix, "SYS:" + suffix, "CPU:" + suffix, "MEM:" + suffix, "DISK:" + suffix];
      this.title = form?.metadata?.applicationName + "系统信息";
      Object.assign(this.form, form);
      return this;
    },
    close() {
      this.form = {};
      this.closeSocket();
      this.visible = false;
    },
    closeSocket() {
      this.eventNames.forEach(it => {
        this.socket?.off(it);
      });
      this.socket = useConfigStore()?.socket;
    },
    openSocket() {
      this.eventNames.forEach(it => {
        this.socket?.on(it, data => {
          this.event(it, data);
        });
      });
    },
    open() {
      this.visible = true;
      this.afterPropertiesSet();
      this.closeSocket();
      this.openSocket();

      return this;
    },
    renderMem(data) {
      if (this.memOptions.series[0].data.length > 100) {
        this.memOptions.series[0].data.shift();
      }
      this.memOptions.series[0].data.push([dateFormat(data.timestamp), (data.usedPercent * 100).toFixed(2)]);
    },
    renderCpu(data) {
      if (this.cpuOptions.series[0].data.length > 100) {
        this.cpuOptions.series[0].data.shift();
      }
      this.cpuOptions.series[0].data.push([dateFormat(data.timestamp), (100 - data?.free).toFixed(2)]);
    },
    renderDisk(data) {
      this.diskOptions.yAxis.data = (data || []).map(element => element.typeName);
      this.diskOptions.series[0].data = (data || []).map(element => {
        return parseFloat((element.usedPercent * 100).toFixed(2));
      });
      this.diskOptions.series[1].data = this.fillArr;
      this.diskOptions.series[2].data = this.getSymbolData(data);
    },

    event(event, data) {
      data = JSON.parse(data?.data || "{}");
      if (event.startsWith("MEM:")) {
        this.renderMem(data);
        return 0;
      }
      if (event.startsWith("CPU:")) {
        this.renderCpu(data);
        return 0;
      }
      if (event.startsWith("DISK:")) {
        this.renderDisk(data);
        return 0;
      }
    }
  }
};
</script>
<style lang="scss" scoped>
:deep(.el-card__body) {
  height: 100%;
}
</style>
