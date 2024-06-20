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
                color: '#ffffff' 
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
          top: "20%",
          containLabel: false
        },
        yAxis: {
          type: 'value',
          interval: 0,
          axisLabel: { align: 'right' },
          max: 100
        },
        xAxis: {
          data: [],
        },
        series: [{
          type: 'line',
          barWidth:15,
          label: {
            show: true,
            position: 'insideRight',
            textStyle: {
              color: "#ffffff",
            },
          },
          itemStyle:{
            borderRadius: 5,
           
          },
          smooth: false,
          data: []
        }]
      }
    }
  },
  watch: {
    data: {
      handler(val) {
        if(val?.timestamp) {
          const date = this.$TOOL.dateFormat(val.timestamp);
          if(this.chartOption.series) {
            this.show = false;
            if(this.chartOption.xAxis.data.length > 20) {
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