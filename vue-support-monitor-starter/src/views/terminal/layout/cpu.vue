<template>
  <scEcharts height="100%" width="100%" :option="chartOption" v-if="data?.timestamp"></scEcharts>
  <el-empty v-else></el-empty>
</template>
<script>
import scEcharts from '@/components/scEcharts/index.vue';

export default {
  components: {
    scEcharts
  },
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      show: false,
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
  watch: {
    data: {
      handler(val) {
        if (val?.timestamp) {
          const date = this.$TOOL.dateFormat(val.timestamp);
          if (this.chartOption.series) {
            this.show = false;
            if (this.chartOption.xAxis.data.length > 10) {
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


}

</script>