<script setup>
import scEcharts from '@/components/scEcharts/index.vue';

const store=useStore();

const used = (val) => {
    return parseFloat(((val?.used || 0) * 100 / (val?.total || 1)).toFixed(2));
};
const free = (val) => {
    return parseFloat(((val?.free || 0) * 100 / (val?.total || 1)).toFixed(2));
};


const state=reactive({
  chartData:{
    title:"任务完成情况",
    legend:['系统内存(已使用)','系统内存(剩余)'],
    colors:[$c.aql4, $c.cyl4],
    colorsD:[$c.aql8,$c.cyl8],
    data:[used() , free()],
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

onMounted(() => {
  processOption();
})

watch( ()=>store.state.mem, (val,preVal)=>{
        //val为修改后的值,preVal为修改前的值
        if(state.chartOption.series) {
            state.chartOption.series[0].data[0].value= used(val);
            state.chartOption.series[1].data[0].value= free(val);
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
