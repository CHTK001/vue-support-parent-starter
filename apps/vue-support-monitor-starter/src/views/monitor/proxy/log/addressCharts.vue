<template>
  <div>
    <el-dialog v-model="detailVisiable" :close-on-click-modal="false" title="历史记录" draggable @close="doClose">
      <div style="height: 500px">
        <div class="absolute" style="top: 18px; right: 200px">
          <el-form :inline="true" class="demo-form-inline">
            <el-form-item>
              <el-date-picker v-model="value" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="afterPropertiesSet(form)" />
            </el-form-item>
          </el-form>
        </div>
        <el-empty v-if="detailData.length == 0" />
        <scEcharts v-else height="95%" width="100%" :option="chartOption1" />
      </div>
    </el-dialog>
  </div>
</template>
<script>
import scEcharts from "@repo/components/scEcharts/index.vue";
import { dateFormat } from "@repo/utils";
import { fetchProxyLogStatistic } from "@/api/monitor/proxy";

export default {
  components: {
    scEcharts
  },
  data() {
    return {
      form: {},
      value: [],
      show: false,
      detailVisiable: false,
      detailData: [],
      chartOption1: {
        update: false,
        title: [
          {
            left: "center",
            textStyle: {
              color: "#000000"
            }
          }
        ],
        visualMap: [
          {
            show: false,
            type: "continuous",
            seriesIndex: 0,
            min: 0,
            max: 100
          }
        ],
        tooltip: {
          trigger: "axis"
        },
        legend: {
          show: true,
          top: 5,
          data: ["系统", "JVM"],
          right: 15
        },
        grid: {
          left: "5%",
          right: "5%",
          bottom: "5%",
          top: "10%",
          containLabel: false
        },
        yAxis: {
          type: "value",
          minInterval: 1
        },
        xAxis: {
          data: []
        },
        dataZoom: [
          {
            // 开启水平滚动条
            type: "slider", // 使用 'slider' 类型的 dataZoom 组件
            start: 60, // 初始时间区间选择范围为 0% 到 100%
            end: 100
          }
        ],
        series: [
          {
            type: "line",
            barWidth: 15,
            name: "允许",
            label: {
              show: !1,
              position: "insideRight",
              textStyle: {
                color: "#000000"
              }
            },
            itemStyle: {
              borderRadius: 5
            },
            markPoint: {
              label: {
                formatter: function (param) {
                  if (param.value === "最大值") {
                    return "{a|" + param.value + "}";
                  } else if (param.value === "最小值") {
                    return "{b|" + param.value + "}";
                  }
                },
                rich: {
                  a: {
                    color: "red" // 最大值颜色
                  },
                  b: {
                    color: "green" // 最小值颜色
                  }
                }
              }
            },
            markLine: {
              data: [{ type: "average", name: "Avg" }]
            },
            areaStyle: {},
            smooth: !0,
            data: []
          },
          {
            type: "line",
            barWidth: 15,
            name: "拒绝",
            label: {
              show: !1,
              position: "insideRight",
              textStyle: {
                color: "#000000"
              }
            },
            itemStyle: {
              borderRadius: 5
            },
            markPoint: {
              label: {
                formatter: function (param) {
                  if (param.value === "最大值") {
                    return "{a|" + param.value + "}";
                  } else if (param.value === "最小值") {
                    return "{b|" + param.value + "}";
                  }
                },
                rich: {
                  a: {
                    color: "orange" // 最大值颜色
                  },
                  b: {
                    color: "blue" // 最小值颜色
                  }
                }
              }
            },
            markLine: {
              data: [{ type: "average", name: "Avg" }]
            },
            areaStyle: {},
            smooth: !0,
            data: []
          },
          {
            type: "line",
            barWidth: 15,
            name: "预警",
            label: {
              show: !1,
              position: "insideRight",
              textStyle: {
                color: "#000000"
              }
            },
            itemStyle: {
              borderRadius: 5
            },
            markPoint: {
              label: {
                formatter: function (param) {
                  if (param.value === "最大值") {
                    return "{a|" + param.value + "}";
                  } else if (param.value === "最小值") {
                    return "{b|" + param.value + "}";
                  }
                },
                rich: {
                  a: {
                    color: "orange" // 最大值颜色
                  },
                  b: {
                    color: "blue" // 最小值颜色
                  }
                }
              }
            },
            markLine: {
              data: [{ type: "average", name: "Avg" }]
            },
            areaStyle: {},
            smooth: !0,
            data: []
          }
        ],
        form: {}
      }
    };
  },
  watch: {
    data: {
      handler(val) {
        if (val?.timestamp) {
          const date = dateFormat(val.timestamp);
          if (this.chartOption.series) {
            this.show = false;
            if (this.chartOption.xAxis.data.length > 100) {
              this.chartOption.xAxis.data.shift();
              this.chartOption.series[0].data.shift();
            }
            this.chartOption.xAxis.data.push(date);
            this.chartOption.series[0].data.push(parseFloat(100 - (val?.idlePercent || 0)).toFixed(2));
          }
          this.chartOption.update = true;
        }
      },
      deep: true
    }
  },
  mounted() {
    this.value[1] = new Date();
    this.value[0] = new Date(new Date().getTime() - 86400 * 1000);
  },
  methods: {
    setData(address) {
      this.form.monitorProxyLogAddress = address;
      return this;
    },
    open() {
      this.afterPropertiesSet();
    },
    getTime(i) {
      try {
        return this.value[i].getTime();
      } catch (error) {
        return this.value[i].$d.getTime();
      }
    },
    doClose() {
      this.detailVisiable = false;
      this.detailData.length = 0;
      Object.assign(this.form, {});
      this.chartOption1.xAxis.data.length = 0;
      this.chartOption1.series[0].data.length = 0;
      this.chartOption1.series[1].data.length = 0;
      this.chartOption1.series[2].data.length = 0;
    },
    afterPropertiesSet(item) {
      this.detailVisiable = true;
      this.detailData.length = 0;
      fetchProxyLogStatistic({
        monitorProxyLogAddress: this.form.monitorProxyLogAddress,
        startDate: this.getTime(0),
        endDate: this.getTime(1)
      }).then(res => {
        if (res.code == "00000") {
          this.detailData = res.data.xAxis || [];
          this.chartOption1.xAxis.data = res.data.xAxis || [];
          this.chartOption1.series[0].data = res.data.allowAxis || [];
          this.chartOption1.series[1].data = res.data.denyAxis || [];
          this.chartOption1.series[2].data = res.data.warnAxis || [];
        }
      });
    }
  }
};
</script>
<style scoped lang="scss">
:deep(.el-dialog) {
  height: 500px;
  /* 设置具体的高度值 */
}
</style>
