<script setup>
import scEcharts from '@/components/scEcharts/index.vue';
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import Base64 from "@/utils/base64";
import api from '@/api'
import tool from '@/utils/tool'

const store=useStore();

const system = (val) => {
    return parseFloat(((val?.system || 0) ).toFixed(2));
};
const jvm = (val) => {
    return parseFloat(((val?.process || 0)  ).toFixed(2));
};


const state=reactive({
  chartData:{
    title:"任务完成情况",
    legend:['系统内存(已使用)','JVM内存(已使用)'],
    colors:[$c.aql4, $c.cyl4],
    colorsD:[$c.aql8,$c.cyl8],
    data:[system() , jvm()],
    radius:["70%","70%"],
    position:[
      ['20%', '55%'],
      ['70%', '55%'],
    ],
  },
  chartOption:{}
})



const processData=()=>{
  const {legend,colors,colorsD,data,radius,position}=state.chartData;
  let processedData=[],
      type="bar",
      yAxisIndex=0;
  legend.forEach((item,i)=>{
    processedData.push({
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      center: position[i],
      radius: radius[i],
      pointer: { show: false },
      title: { fontSize: 14 },
      itemStyle: {
        color: colors[i],
        shadowColor: colors[i],
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {}
      },
      detail: {
        width: 100,
        height: 14,
        borderColor: 'inherit',
        borderRadius: 20,
        borderWidth: 0,
        formatter: function (value) {
          return '{value|' + value.toFixed(2) + '}{unit|%}';
        },
        rich: {
          value: { fontSize: 24, color:colors[i], fontWeight: 'bolder'},// color: '#999',
          unit: { fontSize: 12, color:$c.darken(colors[i],1),}
        }
      },
      axisLine: {
        lineStyle: {color: [[1, $c.darken(colors[i],4)]], width:10 }
      },
      splitLine: { show: false, distance: 0, length: 10 },
      axisTick: { show: false },
      axisLabel: { show: false, distance: 50 },
      data:[
        {
          value: data[i],
          name: legend[i],
          title: { color:$c.lighten(colors[i],1), offsetCenter: ['0%', '30%'] },
          detail: { valueAnimation: true, offsetCenter: ['0', '-30%'] }
        }
      ],
    })
    
  })
  state.chartOption.series=processedData;
}

const processOption=()=>{
  state.chartOption={
    update:false,
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
          type: 'MEMORY:SYSTEM',
          appName: item.appName,
          serverHost: item.serverHost,
          serverPort: item.serverPort,
          fromTimestamp: new Date(new Date().getTime() - 5 *60 * 1000).getTime(),
          toTimestamp: new Date().getTime(),
          count: 1,
        }).then(res => {
          if (res.code == '00000') {
            if(state.chartOption.series[0].data[0].value) {
              return;
            }
            res.data.forEach(ele => {
              state.chartOption.series[0].data[0].value = system({'system': parseFloat((ele?.value || 0).toFixed(2))});
            });

            api.monitor.timeseries.get({
              id: 1,
              type: 'MEMORY:PROCESS',
              appName: item.appName,
              serverHost: item.serverHost,
              serverPort: item.serverPort,
              fromTimestamp: new Date(new Date().getTime() - 5 *60 * 1000).getTime(),
              toTimestamp: new Date().getTime(),
              count: 1,
            }).then(res => {
              if (res.code == '00000') {
                if(state.chartOption.series[1].data[0].value) {
                  return;
                }
                res.data.forEach(ele => {
                  state.chartOption.series[1].data[0].value = jvm({'process': parseFloat((ele?.value || 0).toFixed(2))});
                });
              }
            })
          }
        })
        
    }catch(e){}
  
}
onMounted(() => {
  processOption();
  afterPropertiesSet()
})

watch( ()=>store.state.mem, (val,preVal)=>{
        //val为修改后的值,preVal为修改前的值
        if(state.chartOption.series) {
            state.chartOption.series[0].data[0].value= system(val);
            state.chartOption.series[1].data[0].value= jvm(val);
        }
        state.chartOption.update = true;
      },{
        immediate: true,
        deep: true
    }
)
</script>
<template>
  <!-- <echartsInit :chartOption="state.chartOption"></echartsInit> -->
  <scEcharts height="100%" width="100%" :option="state.chartOption"></scEcharts>

</template>
<style lang="less">

</style>
