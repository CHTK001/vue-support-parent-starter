<template>
    <div style="position: relative;">
        <scEcharts height="220px" width="480px" :option="options"></scEcharts>
        <dv-decoration1 style="width:200px;height:50px;position: absolute; right: 0; top: 0;" />
    </div>
</template>
<script>
import scEcharts from '@/components/scEcharts/index.vue';

export default {
    components: { scEcharts },
    props: {
        data: {
            type: Array,
            default: () => {
                return []
            }
        },
        xdata: {
            type: Array,
            default: () => {
                return []
            }
        }
    },
    watch: {
        data(){
            this.options.series[0].data.push(this.data)
            this.options.xAxis.data.push(this.xdata)
        }
    },
    data(){
        return {
            cpuConfig: {
              data: this.data,
            },
            options:{
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                xAxis: {
                    type: 'category',
                    data: [],
                    axisLabel:{
                        textStyle: {
                            color: "#fff"
                        },
                    },
                },
                yAxis: {
                    nameTextStyle: {
                        color: "#fff"
                    },
                    boundaryGap: [0, '50%'],
                    type: 'value',
                    axisLabel: {
                        formatter: '{value}',
                        textStyle: {
                            color: "#fff"
                        },
                    },
                    name: "单位（%）",
                    splitLine: {
                        show: false,//是否显示网格线
                    },
                    max: 100
                },

                series: [{
                    data: this.data,
                    type: 'line',
                    itemStyle:{
                        normal:{
                            label : {
                                show: false, // 在折线拐点上显示数据
                                formatter: function(v) {
                                    return v.data + "°"
                                }
                            },
                            
                            lineStyle:{                 
                                width:3,  // 设置虚线宽度
                                type:'dotted'  // 虚线'dotted' 实线'solid'
                            }
                        }
                    }
                }]
            }
        }
    },
}
</script>