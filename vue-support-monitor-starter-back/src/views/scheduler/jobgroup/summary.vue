<template>
    <div>
        <el-row>
            <el-space wrap class="box-parent">
                <el-card class="box-card" style="height: 140px;">
                    <template #header>
                        <div class="card-header">
                            <el-row class="box-flex">
                                <el-col :span="6">
                                    <el-icon style="font-size: 60px;">
                                        <component is="el-icon-menu"></component>
                                    </el-icon>
                                </el-col>
                                <el-col :span="18">
                                    <div class="button" text>任务数量 <el-tag>{{ infoData?.jobInfoCount }}</el-tag></div>
                                    <el-divider></el-divider>
                                    <div>调度中心运行的任务数量</div>
                                </el-col>
                            </el-row>
                        </div>
                    </template>
                </el-card>

                <el-card class="box-card" style="height: 140px;">
                    <template #header>
                        <div class="card-header">
                            <el-row class="box-flex">
                                <el-col :span="6">
                                    <el-icon style="font-size: 60px;">
                                        <component is="el-icon-alarm-clock"></component>
                                    </el-icon>
                                </el-col>
                                <el-col :span="18">
                                    <div class="button" text>调度次数 <el-tag>{{ infoData?.jobLogCount }}</el-tag></div>
                                    <el-divider></el-divider>
                                    <div>调度中心触发的调度次数</div>
                                </el-col>
                            </el-row>
                        </div>
                    </template>
                </el-card>
                <el-card class="box-card" style="height: 140px;">
                    <template #header>
                        <div class="card-header">
                            <el-row class="box-flex">
                                <el-col :span="6">
                                    <el-icon style="font-size: 60px;">
                                        <component is="el-icon-takeaway-box"></component>
                                    </el-icon>
                                </el-col>
                                <el-col :span="18">
                                    <div class="button" text>执行器数量 <el-tag>{{ infoData?.executorCount }}</el-tag></div>
                                    <el-divider></el-divider>
                                    <div>调度中心在线的执行器机器数量</div>
                                </el-col>
                            </el-row>
                        </div>
                    </template>
                </el-card>
            </el-space>
        </el-row>
        <el-divider></el-divider>
        <el-row>
            <el-col :span="12" style="height: 400px">
                <scEcharts height="100%" :option="logsChartOption"></scEcharts>
            </el-col>
            <el-col :span="12" style="height: 400px">
                <scEcharts height="100%" :option="logsChartOption2"></scEcharts>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import scEcharts from '@/components/scEcharts/index.vue'
export default {
    components: { scEcharts },
    data() {
        return {
            logsChartOption2: {
                legend: {
                    top: '5%',
                    left: 'center'
                },
                series: [{
                    label:{
                        show: true
                    },
                    data: [],
                    type: 'pie',
                    radius: [20, 140],
                    center: ['50%', '50%'],
                    itemStyle: {
                        borderRadius: 5
                    },
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDelay: function (idx) {
                        return Math.random() * 200;
                    }
                }]
            },
            logsChartOption: {
                legend: {
                    top: '5%',
                    left: 'center'
                },
                color: ['#660022', 'orange', '#00a65a'],
                grid: {
                    top: '0px',
                    left: '10px',
                    right: '10px',
                    bottom: '0px'
                },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: true,
                    data: []
                },
                yAxis: {
                    show: true,
                    type: 'value'
                },
                series: [{
                    label:{
                        show: true
                    },
                    data: [],
                    type: 'line',
                    name: '失败',
                    stack: 'Total',
                    label: {
                        normal: {
                            show: true,
                            position: 'top'
                        }
                    },
                    areaStyle: { normal: {} },
                    barWidth: '15px'
                }, {
                    data: [],
                    type: 'line',
                    name: '进行中',
                    stack: 'Total',
                    areaStyle: { normal: {} },
                    barWidth: '15px'
                }, {
                    data: [],
                    name: '成功',
                    type: 'line',
                    stack: 'Total',
                    areaStyle: { normal: {} },
                    barWidth: '15px'
                }]
            },
            infoData: {}
        }
    },
    mounted() {
        this.intiInfo();
        this.intiCharts();
    },
    methods: {
        async intiInfo() {
            this.$API.scheduler.info.get().then(res => {
                this.infoData = res?.data?.content;
            });
        },
        async intiCharts() {
            const data = {};
            const date = this.$TOOL.date.getDateRang('pastWeek');
            data.startDate = date[0];
            data.endDate = date[1];
            this.$API.scheduler.joblogChart.get(data).then(res => {
                if (res.code === '00000') {
                    this.logsChartOption.xAxis.data.length = 0;
                    this.logsChartOption.xAxis.data = res.data?.content.triggerDayList;
                    this.logsChartOption.series[0].data = res.data?.content.triggerDayCountFailList;
                    this.logsChartOption.series[1].data = res.data?.content.triggerDayCountRunningList;
                    this.logsChartOption.series[2].data = res.data?.content.triggerDayCountSucList;
                    this.logsChartOption2.series[0].data.push({
                        value: res.data?.content.triggerDayCountFailList.reduce(function (total, value) {
                            return total + value;
                        }, 0),
                        itemStyle: {color: '#660022'},
                        name: '失败: ' + res.data?.content.triggerDayCountFailList.reduce(function (total, value) {
                            return total + value;
                        }, 0)
                    });
                    this.logsChartOption2.series[0].data.push({
                        value: res.data?.content.triggerDayCountRunningList.reduce(function (total, value) {
                            return total + value;
                        }, 0),
                        itemStyle: {color: 'orange'},
                        name: '进行中: ' + res.data?.content.triggerDayCountRunningList.reduce(function (total, value) {
                            return total + value;
                        }, 0)
                    });
                    this.logsChartOption2.series[0].data.push({
                        value: res.data?.content.triggerDayCountSucList.reduce(function (total, value) {
                            return total + value;
                        }, 0),
                        itemStyle: {color: '#00a65a'},
                        name: '成功: ' + res.data?.content.triggerDayCountSucList.reduce(function (total, value) {
                            return total + value;
                        }, 0)
                    });
                }
            })
        },
    }
}
</script>
<style scoped lang="less">
.box-flex {
    align-items: center;
}

.box-parent {
    display: flex;
    align-items: center;
    justify-content: space-around !important;
    align-content: flex-start;
}

.box-card {
    width: 450px;
    flex: 1;
}</style>