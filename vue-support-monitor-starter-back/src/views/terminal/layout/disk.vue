<template>
    <scEcharts height="100%" width="100%" :option="chartOption" v-if="chartOption.series && chartOption.series.length > 0 && chartOption.series[0].data?.length > 0"></scEcharts>
    <el-empty v-else></el-empty>
</template>
<script>
import scEcharts from '@/components/scEcharts/index.vue';
const base64Img = "image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAMAAADWZboaAAAAZlBMVEUAAABe3uVe3+Vf3uVf3+Zf3uVg3+Zg3+Zf3+Vi4OZh4OZg3+Z86/Bh3+Zi4Odj4Odi4OZ86/B76/B86/Bj4ed56+9x5+xn4umB7/N87PB36e+A7/N+7fF/7vJ/7vJ+7fGA7/OB7/PReX+lAAAAIXRSTlMABQkVDREmIhk3MR10LEFFPHh7cUprXE35h2XnqMLAp+mHAG9cAAAB5ElEQVRIx83WjU7CMBQFYIoiKMqU/XUboHv/l/Tce7t2XamDNSacETEmX86tlK2rx4py150o+MstMBLwWRfHKo6JCVxLnvmFGBjFQ58oF1//sUZhGy/ClSTWObgnL4O+bkeN4nY2okfNMbkRt9/vtxz8InoTsWplJSCzFxPmO8+GpSIByX3YQAuGDWtRKhKjCnxDXhF6Z4yxnZ20Wgko7BMRDmxtSGVaI4kdTIgb+zTYoJQlIMlDlmUFgrcDWWC201qSayqlTkiCddWWeV62VU0YlnpRi9VOKaSUsiyq/N0krwq2Ugt7lVpZl5BfHNiytjagMi+XYp0kCR45hMlivVQrE/uU5pXSrCB5bM6d1t2lOZItMqmliT3q5uVxqxzyW/ccfYLNKx7ZTeykMvNyac2yt2Fbc61MHLSC0rwoxbiNdlQ3GBm1NLHQsHUrtEXppR/ljNpW6DbSCoqlFiVoN6YdaFlgsSFVPs1BdT8OaB5QyQzVcaqWDows/zepxR8ObLglTrdtCRVuRNj4Rrxh+//0ke2f8KVL+Kon3GCSbmsJN9OUW3j6g0Ns+LgCij2u0h+Sghc8mlMPBMgdx5DFh59VmOVHrvmDnoNxCz3J7MFWsMuaLyR089xz/xhlfijvwutR8gv3zk6BLUUeCgAAAABJRU5ErkJggg=="
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();

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
    computed: {
        fillArr() {
            return (new Array(this.chartData.data.length)).fill(100)
        },
    },
    mounted() {
        this.processOption();
    },
    data() {
        return {
            chartData: {
                yAxis: [],
                color: ['#000000', '#000000', '#000000'],
                data: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
            },
            show: false,
            chartOption: {}
        }
    },
    watch: {
        data: {
            handler(val) {
                if (val && val?.timestamp) {
                
                    const date = this.$TOOL.dateFormat(val.timestamp);
                    const data = val.data;
                    const length = data.length;
                    this.show = true;
                    this.chartOption.dataZoom.endValue = length - 1;
                    this.chartOption.yAxis.data = data.map(element => this.removeHTMLTags(ansi_up.ansi_to_html(element.name)));
                    this.chartOption.series[0].data = data.map(element => parseFloat((element.usedBytes / element.totalBytes * 100).toFixed(2)));
                }
            },
            deep: true
        }
    },
    methods: {
        removeHTMLTags(str) {
            return str.replace(/<[^>]*>/g, '');
        },
        processData() {
            let legend = this.chartData.colors,
                yAxis = this.chartData.yAxis,
                data = this.chartData.data,
                processedData = [];
            this.chartOption.yAxis.data = this.chartData.yAxis;
            this.chartOption.series[0].data = this.chartData.data;
            this.chartOption.series[1].data = this.fillArr;
            // this.chartOption.series[2].data = this.getSymbolData(this.chartData.data);
        },
        processOption() {
            this.chartOption = {
                update: false,
                title: {
                    show: false,
                    // text: '实时流速图2',
                    textStyle: {
                        color: '#000000',
                        fontSize: 16,
                        fontWeight: "normal"
                    },
                },
                grid: {
                    top: '10%',
                    left: '0%',
                    right: '10%',
                    bottom: '5%'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    formatter: (params) => {
                        return '剩余: ' + ((100 - params[0].data).toFixed(2)) + "%"
                    }
                },
                xAxis: {
                    type: 'value',
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
                    endValue: 22,
                },
                yAxis: {
                    //show: false,
                    type: 'category',
                    inverse: true,
                    splitLine: { show: false, },
                    axisLine: { show: false },
                    axisLabel: {
                        show: true,
                        interval: 0,
                        margin: 10,
                        fontSize: 12,
                        width: 150,
                        lineHeight: 14,
                        overflow: "breakAll",
                        fontWeight: 'normal',
                    },
                    axisTick: { show: false },
                    data: []
                },
                series: [
                    {
                        type: 'bar',
                        barWidth: '40%',
                        animationDuration: 2000,
                        itemStyle: {
                            borderWidth: 0,
                            borderRadius: 10,
                            normal: {
                                color: function (params) {
                                    if(params.value > 80) {
                                        return '#fe4365';
                                    }
                                    return '#25daba'
                                }
                            }, 
                        },
                        label: { show: false, },
                        data: [],
                        z: 0
                    },
                    {
                        type: 'bar',
                        barWidth: '40%',
                        barGap: '-100%',
                        animation: false,
                        itemStyle: {
                            borderWidth: 0,
                            borderRadius: 5,
                            color: 'rgba(0,202,255,0.2)'
                        },

                        label: {
                            show: true,
                            position: ['101%', '20%'],
                            fontSize: 14,
                            fontWeight: 'normal',
                            formatter: (params) => {
                                return (this.chartOption.series[0].data[params.dataIndex]) + '%';
                            }
                        },
                        data: [],
                        z: 0
                    },
                    // {
                    //     type: 'pictorialBar',
                    //     animation: true,
                    //     // animationThreshold: 3000 ,
                    //     animationDuration: 3000,
                    //     // animationDurationUpdate:500,
                    //     symbol: base64Img,
                    //     symbolSize: [50, 50],
                    //     symbolOffset: [20, 0],
                    //     z: 12,
                    //     itemStyle: {
                    //         color: '#000000'
                    //     },
                    //     data: []
                    // },
                ]
            }
            this.processData();
        },
        getSymbolData(data) {
            let arr = [];
            for (var i = 0; i < data.length; i++) {
                arr.push({
                    value: data[i],
                    symbolPosition: 'end'
                })
            }
            return arr;
        },
    }


}

</script>