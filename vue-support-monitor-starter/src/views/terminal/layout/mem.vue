<template>
  <scEcharts height="100%" width="100%" :option="chartOption"></scEcharts>
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
          top: "20%",
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
          name: '系统内存',
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
            ]
          },
          markLine: {
            data: [{ type: 'average', name: 'Avg' }]
          },
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
            this.chartOption.title[0].text = "系统内存(" + (parseFloat(((val?.freeBytes || 0) * 100 / (val?.totalBytes || 1)).toFixed(2)) || 0) + "%/ " + this.$TOOL.sizeFormat(val.totalBytes) + ")"
            this.chartOption.series[0].data.push((parseFloat((100 - (val?.freeBytes || 0) * 100 / (val?.totalBytes || 1)).toFixed(2)) || 0));
          }
          this.chartOption.update = true;
        }
      },
      deep: true
    }
  },


}

</script>