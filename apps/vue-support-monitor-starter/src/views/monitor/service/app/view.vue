<template>
  <div class="app-view-container">
    <div class="chart-header">
      <h2 class="chart-title">
        <IconifyIconOnline icon="ep:data-board" class="mr-2" />
        应用监控面板
      </h2>
    </div>
    
    <div class="chart-content">
      <el-row :gutter="20">
        <el-col :span="8" class="chart-col">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">
                <IconifyIconOnline icon="ep:cpu" class="mr-2" />
                CPU使用率
              </h3>
            </div>
            <div class="chart-card-body">
              <scEcharts key="cpu" height="280px" width="100%" :option="cpuOptions" />
            </div>
          </div>
      </el-col>
        <el-col :span="8" class="chart-col">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">
                <IconifyIconOnline icon="ep:histogram" class="mr-2" />
                内存使用率
              </h3>
            </div>
            <div class="chart-card-body">
              <scEcharts key="mem" height="280px" width="100%" :option="memOptions" />
            </div>
          </div>
      </el-col>
        <el-col :span="8" class="chart-col">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">
                <IconifyIconOnline icon="ep:folder" class="mr-2" />
                磁盘使用率
              </h3>
            </div>
            <div class="chart-card-body">
              <scEcharts key="disk" height="280px" width="100%" :option="diskOptions" />
            </div>
          </div>
      </el-col>
    </el-row>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { dateFormat } from "@repo/utils";
import { useConfigStore } from "@repo/core";
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { fetchIndicatorGet, fetchIndicatorQuery } from "@/api/monitor/service";
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Base64 } from "js-base64";

export default {
  components: { scEcharts },
  setup() {
    const color = "#409EFF";
    const form = reactive({});
    const dataList = ref([]);
    const socket = ref(null);
    const visible = ref(false);
    const eventNames = ref([]);
    const useConfig = ref({});

    const condition = reactive({
        fromTimestamp: new Date().getTime() - 86400000 * 7,
        toTimestamp: new Date().getTime(),
        count: 10,
        interval: 60
    });

    // 内存图表配置
    const memOptions = reactive({
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
        color: color,
          borderRadius: 5
        },
      smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(
            0,
            0,
            0,
            1,
            [
              {
                offset: 0,
              color: color
              },
              {
                offset: 0.8,
              color: "rgba(64, 158, 255, 0.1)"
              }
            ],
            false
          ),
        shadowcolor: color,
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
    });

    // CPU图表配置
    const cpuOptions = reactive({
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
        color: "#67C23A",
          borderRadius: 5
        },
      smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(
            0,
            0,
            0,
            1,
            [
              {
                offset: 0,
              color: "#67C23A"
              },
              {
                offset: 0.8,
              color: "rgba(103, 194, 58, 0.1)"
              }
            ],
            false
          ),
        shadowcolor: "#67C23A",
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
    });

    // 磁盘图表配置
    const diskOptions = reactive({
        update: false,
        title: {
          show: false,
          textStyle: {
          color: color,
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
                { offset: 0, color: "#E6A23C" },
                { offset: 1, color: "#F56C6C" }
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
        }
      ]
    });

    // 辅助数据
    const fillArr = computed(() => {
      return new Array(40).fill(100);
    });

    // 初始化
    onMounted(() => {
      useConfig.value = useConfigStore();
      const router = useRouter();
      const route = router.currentRoute.value;
      if (route.query.data) {
        const data = Base64.decode(route.query.data);
        setData(JSON.parse(data));
      }
      afterPropertiesSet();
    });

    // 设置数据
    const setData = (formData) => {
      const suffix = formData.host + formData.port;
      eventNames.value = ["LOG:" + suffix, "JVM:" + suffix, "SYS:" + suffix, "CPU:" + suffix, "MEM:" + suffix, "DISK:" + suffix];
      Object.assign(form, formData);
    };

    // 初始化数据
    const afterPropertiesSet = () => {
      eventNames.value.forEach(it => {
        setTimeout(() => {
          const q = {};
          Object.assign(q, condition);
          if (it.startsWith("MEM:")) {
            q.name = "mem:MEM:" + form.host + form.port;
            fetchIndicatorQuery(q).then(res => {
              res.data.forEach(it => {
                renderMem({ timestamp: it.timestamp, usedPercent: it.value });
              });
            });
            return;
          }

          if (it.startsWith("CPU:")) {
            q.name = "cpu:CPU:" + form.host + form.port;
            fetchIndicatorQuery(q).then(res => {
              res.data.forEach(it => {
                renderCpu({ timestamp: it.timestamp, free: it.value });
              });
            });
          }
          if (it.startsWith("DISK:")) {
            q.name = "disk:DISK:" + form.host + form.port;
            fetchIndicatorGet(q).then(res => {
              try {
                renderDisk(JSON.parse(res.data?.value || "{}"));
              } catch (error) {}
            });
          }
        }, 311);
      });
    };

    // 渲染内存数据
    const renderMem = (data) => {
      if (memOptions.series[0].data.length > 100) {
        memOptions.series[0].data.shift();
      }
      memOptions.series[0].data.push([dateFormat(data.timestamp), (data.usedPercent * 100).toFixed(2)]);
    };

    // 渲染CPU数据
    const renderCpu = (data) => {
      if (cpuOptions.series[0].data.length > 100) {
        cpuOptions.series[0].data.shift();
      }
      cpuOptions.series[0].data.push([dateFormat(data.timestamp), (100 - data?.free).toFixed(2)]);
    };

    // 渲染磁盘数据
    const renderDisk = (data) => {
      diskOptions.yAxis.data = (data || []).map(element => element.typeName);
      diskOptions.series[0].data = (data || []).map(element => {
        return parseFloat((element.usedPercent * 100).toFixed(2));
      });
      diskOptions.series[1].data = fillArr.value;
    };

    // 处理事件
    const event = (event, data) => {
      data = JSON.parse(data?.data || "{}");
      if (event.startsWith("MEM:")) {
        renderMem(data);
        return 0;
      }
      if (event.startsWith("CPU:")) {
        renderCpu(data);
        return 0;
      }
      if (event.startsWith("DISK:")) {
        renderDisk(data);
        return 0;
      }
    };

    // 关闭socket
    const closeSocket = () => {
      eventNames.value.forEach(it => {
        socket.value?.off(it);
      });
      socket.value = useConfigStore()?.socket;
    };

    // 打开socket
    const openSocket = () => {
      eventNames.value.forEach(it => {
        socket.value?.on(it, data => {
          event(it, data);
        });
      });
    };

    return {
      color,
      form,
      dataList,
      socket,
      visible,
      eventNames,
      useConfig,
      condition,
      memOptions,
      cpuOptions,
      diskOptions,
      fillArr,
      afterPropertiesSet,
      setData,
      closeSocket,
      openSocket
    };
  }
};
</script>

<style lang="scss" scoped>
.app-view-container {
  padding: 20px;
  height: 100%;
  background-color: var(--el-bg-color);
}

.chart-header {
  margin-bottom: 20px;
  
  .chart-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 20px;
      background-color: var(--el-color-primary);
      margin-right: 12px;
      border-radius: 2px;
    }
  }
}

.chart-content {
  height: calc(100% - 60px);
}

.chart-col {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);
  }
  
  .chart-card-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    
    .chart-card-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      display: flex;
      align-items: center;
    }
  }
  
  .chart-card-body {
    padding: 16px;
    height: calc(100% - 60px);
  }
}

:deep(.el-card__body) {
  height: 100%;
  padding: 0;
}
</style>
