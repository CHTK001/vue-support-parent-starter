<script setup>
import scEcharts from '@/components/scEcharts/index.vue';
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import Base64 from "@/utils/base64";
import api from '@/api'
import tool from '@/utils/tool'

const store = useStore();
const state = reactive({
  chartData: {
    legend: ['系统', 'JVM'],
    xAxis: [],
    colors: [$c.aql4, $c.bll5, $c.ipl3, $c.cbl3,],
    data: [
      [],
      [],
    ],
  },
  chartOption: {}
})

const processData = () => {
  let legend = state.chartData.legend,
    colors = state.chartData.colors,
    xAxis = state.chartData.xAxis,
    data = state.chartData.data,
    processedData = []
  legend.forEach((item, i) => {
    processedData.push({
      name: legend[i],
      type: 'line',
      barWidth: 15,
      label: {
        show: false,
        position: 'insideRight'
      },
      itemStyle: {
        color: colors[i],
        borderRadius: 5
      },
      smooth: false,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: $c.fade(colors[i], .9)
        }, {
          offset: 0.8,
          color: $c.fade(colors[i], .1)
        }], false),
        shadowcolor: $c.fade(colors[i], .3),
        shadowBlur: 10
      },
      data: data[i]
    })
  })
  state.chartOption.series = processedData;
  state.chartOption.xAxis.data = xAxis;
  state.chartOption.legend.data = legend;
}

const processOption = () => {
  state.chartOption = {
    update: false,
    // title:{ text:"barA", left:200, top:0, textStyle:{ color:$c.gyl3, fontSize:16, fontWeight:"normal" }, },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      show: true,
      data: [],
      top: 5,
      right: 15,
    },
    dataZoom: [{ // 开启水平滚动条
      type: 'slider', // 使用 'slider' 类型的 dataZoom 组件
      start: 70, // 初始时间区间选择范围为 0% 到 100%
      end: 100
    }],
    grid: {
      left: '5%',
      right: '5%',
      bottom: '5%',
      top: "20%",
      containLabel: true
    },
    yAxis: {
      type: 'value',
      axisLabel: { align: 'right' },
      max: 100
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
    },
    series: []
  }
  processData()
}

const afterPropertiesSet = async function () {
  try{
        const appValue = getQueryString("appName");
        const item = JSON.parse(Base64.decode(getQueryString("data")));
        api.monitor.timeseries.get({
          id: 1,
          type: 'CPU:SYSTEM',
          appName: item.appName,
          serverHost: item.serverHost,
          serverPort: item.serverPort,
          fromTimestamp: new Date(new Date().getTime() - 5 *60 * 1000).getTime(),
          toTimestamp: new Date().getTime(),
          count: 10,
        }).then(res => {
          if (res.code == '00000') {
            if(state.chartOption.series[0].data.length > 0) {
              return;
            }
            res.data.forEach(ele => {
              state.chartOption.xAxis.data.push(tool.dateFormat(ele.timestamp));
              state.chartOption.series[0].data.push(parseFloat((ele?.value || 0).toFixed(2)));
            });

            api.monitor.timeseries.get({
              id: 1,
              type: 'CPU:PROCESS',
              appName: item.appName,
              serverHost: item.serverHost,
              serverPort: item.serverPort,
              fromTimestamp: new Date(new Date().getTime() - 5 *60 * 1000).getTime(),
              toTimestamp: new Date().getTime(),
              count: 10,
            }).then(res => {
              if (res.code == '00000') {
                if(state.chartOption.series[1].data.length > 0) {
                  return;
                }
                res.data.forEach(ele => {
                  state.chartOption.series[1].data.push(parseFloat((ele?.value || 0).toFixed(2)));
                });
              }
            })
          }
        })
        
    }catch(e){}
  
}

onMounted(() => {
  processOption();
  afterPropertiesSet();
})

watch(() => store.state.cpu, (val, preVal) => {
  //val为修改后的值,preVal为修改前的值
  if (state.chartOption.series) {
    loading.show = false;
    if (state.chartOption.xAxis.data.length > 1000) {
      state.chartOption.xAxis.data.shift();
      state.chartOption.series[0].data.shift();
      state.chartOption.series[1].data.shift();
    }
    state.chartOption.xAxis.data.push(format(val?.data?.timestamp));
    state.chartOption.series[0].data.push(parseFloat(((val?.data?.system || 0)).toFixed(2)));
    state.chartOption.series[1].data.push(parseFloat(((val?.data?.process || 0)).toFixed(2)));
  }
  state.chartOption.update = true;
}, {
  immediate: true,
  deep: true
}
)
const format = (date, fmt = "hh:mm:ss") => {
  date = new Date(date);
  var o = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1
          ? o[k]
          : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
};
const loading = reactive({ show: true });
const config = {
  textColor: $c.cyl5,
}
</script>
<template>
  <!-- <echartsInit :chartOption="state.chartOption"></echartsInit> -->
  <scEcharts v-if="!loading.show" height="100%" width="100%" :option="state.chartOption"></scEcharts>
  <div style="position: relative;left: 44%; top: 50%" v-else :config="config">暂无数据</div>
</template>
<style lang="less"></style>
