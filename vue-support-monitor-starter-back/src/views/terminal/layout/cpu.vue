<template>
  <div class="relative h-full">
    <div class="absolute" style="    top: -45px;right: -36px;">
      <el-form :inline="true" class="demo-form-inline ">
        <el-form-item>
          <el-date-picker v-model="value" type="datetimerange" range-separator="-" start-placeholder="开始时间"
            end-placeholder="结束时间" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doSearch" icon="el-icon-search"></el-button>
        </el-form-item>
      </el-form>
    </div>
    <scEcharts height="100%" width="100%" class="absolute" :option="chartOption" v-if="data?.timestamp"></scEcharts>
    <el-empty v-else></el-empty>
  </div>

  <el-dialog v-model="detailVisiable" :close-on-click-modal="false" :title="$TOOL.dateFormat(this.value[0]) + '-' + $TOOL.dateFormat(this.value[1])" draggable>
     <div style="height: 500px">
      <el-empty v-if="detailData.length == 0"></el-empty>
      <scEcharts height="95%" width="100%"  :option="chartOption1" v-else></scEcharts>
    </div>
  </el-dialog>
</template>
<script>
import scEcharts from '@/components/scEcharts/index.vue';

export default {
  components: {
    scEcharts
  },
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      value: [],
      show: false,
      detailVisiable: false,
      detailData: [],
      chartOption: {
        update: false,
        title: [
          {
            left: 'center',
            textStyle: {
              color: '#000000'
            }
          },
        ],
        visualMap: [
          {
            show: false,
            type: 'continuous',
            seriesIndex: 0,
            min: 0,
            max: 100
          }
        ],
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          show: true,
          top: 5,
          right: 15,
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '5%',
          top: "10%",
          containLabel: false
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100
        },
        xAxis: {
          data: [],
        },
        dataZoom: [{ // 开启水平滚动条
            type: 'slider', // 使用 'slider' 类型的 dataZoom 组件
            start: 90, // 初始时间区间选择范围为 0% 到 100%
            end: 100
        }],
        series: [{
          type: 'line',
          barWidth: 15,
          label: {
            show: true,
            position: 'insideRight',
            textStyle: {
              color: "#000000",
            },
          },
          itemStyle: {
            borderRadius: 5,
          },
          markPoint: {
            data: [
              { type: 'max', name: 'Max' },
              { type: 'min', name: 'Min' }
            ],
            label: {
              formatter: function (param) {
                if (param.value === '最大值') {
                  return '{a|' + param.value + '}';
                } else if (param.value === '最小值') {
                  return '{b|' + param.value + '}';
                }
              },
              rich: {
                a: {
                  color: 'red' // 最大值颜色
                },
                b: {
                  color: 'green' // 最小值颜色
                }
              }
            }
          },
          markLine: {
            data: [{ type: 'average', name: 'Avg' }]
          },
          areaStyle: {},
          smooth: !0,
          data: [],
        }]
      },
      chartOption1: {
        update: false,
        title: [
          {
            left: 'center',
            textStyle: {
              color: '#000000'
            }
          },
        ],
        visualMap: [
          {
            show: false,
            type: 'continuous',
            seriesIndex: 0,
            min: 0,
            max: 100
          }
        ],
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          show: true,
          top: 5,
          right: 15,
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '5%',
          top: "10%",
          containLabel: false
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100
        },
        xAxis: {
          data: [],
        },
        dataZoom: [{ // 开启水平滚动条
            type: 'slider', // 使用 'slider' 类型的 dataZoom 组件
            start: 90, // 初始时间区间选择范围为 0% 到 100%
            end: 100
        }],
        series: [{
          type: 'line',
          barWidth: 15,
          label: {
            show: true,
            position: 'insideRight',
            textStyle: {
              color: "#000000",
            },
          },
          itemStyle: {
            borderRadius: 5,
          },
          markPoint: {
            data: [
              { type: 'max', name: 'Max' },
              { type: 'min', name: 'Min' }
            ],
            label: {
              formatter: function (param) {
                if (param.value === '最大值') {
                  return '{a|' + param.value + '}';
                } else if (param.value === '最小值') {
                  return '{b|' + param.value + '}';
                }
              },
              rich: {
                a: {
                  color: 'red' // 最大值颜色
                },
                b: {
                  color: 'green' // 最小值颜色
                }
              }
            }
          },
          markLine: {
            data: [{ type: 'average', name: 'Avg' }]
          },
          areaStyle: {},
          smooth: !0,
          data: []
        }]
      }
    }
  },
  mounted(){
    this.value[1] = new Date();
    this.value[0] = new Date(new Date().getTime() - 60 *60 * 1000);
    this.afterPropertiesSet();
  },
  watch: {
    data: {
      handler(val) {
        if (val?.timestamp) {
          const date = this.$TOOL.dateFormat(val.timestamp);
          if (this.chartOption.series) {
            this.show = false;
            if (this.chartOption.xAxis.data.length > 100) {
              this.chartOption.xAxis.data.shift();
              this.chartOption.series[0].data.shift();
            }
            this.chartOption.xAxis.data.push(date);
            this.chartOption.series[0].data.push((parseFloat((100 - (val?.idlePercent || 0))).toFixed(2)));
          }
          this.chartOption.update = true;
        }
      },
      deep: true
    }
  },
  methods: {
    getTime(i){
      try {
        return this.value[i].getTime();
      } catch (error) {
        return this.value[i].$d.getTime();
      }
    },
    async afterPropertiesSet(){
      this.$API.terminal.timeseries.get({
        id: this.form.terminalId,
        type: 'cpu-io',
        name: 'cpu-io',
        fromTimestamp: this.getTime(0),
        toTimestamp: this.getTime(1),
        count: 10,
      }).then(res => {
        if (res.code == '00000') {
            res.data.forEach(ele => {
              this.chartOption.xAxis.data.push(this.$TOOL.dateFormat(ele.timestamp));
              this.chartOption.series[0].data.push((parseFloat((100 - (ele?.value || 0))).toFixed(2)));
            });
        }
      })
    },
    doSearch() {
      if (!this.value.length || this.value.length != 2) {
        this.$message.error('请选择时间');
        return;
      }

      this.detailVisiable = true;
      this.detailData.length = 0;
      this.$API.terminal.timeseries.get({
        id: this.form.terminalId,
        type: 'cpu-io',
        name: 'cpu-io',
        fromTimestamp: this.getTime(0),
        toTimestamp: this.getTime(1),
        count: 100,
      }).then(res => {
        if (res.code == '00000') {
            this.detailData = res.data;
            this.detailData.forEach(ele => {
              this.chartOption1.xAxis.data.push(this.$TOOL.dateFormat(ele.timestamp));
              this.chartOption1.series[0].data.push((parseFloat((100 - (ele?.value || 0))).toFixed(2)));
            });
        }
      })
    }
  }


}

</script>
<style scoped lang="less">
:deep(.el-dialog) {
  height: 500px; /* 设置具体的高度值 */
}
</style>