<template>
    <el-container>
        <el-header>
            <div class="right-panel">
                <el-select v-model="refreshTime" placeholder="刷新频率">
                    <el-option :value="10000" label="10s">10s</el-option>
                    <el-option :value="20000" label="20s">20s</el-option>
                    <el-option :value="30000" label="30s">30s</el-option>
                    <el-option :value="40000" label="40s">40s</el-option>
                    <el-option :value="50000" label="50s">50s</el-option>
                    <el-option :value="60000" label="60s">60s</el-option>
                </el-select>
            </div>
        </el-header>
        <el-main>
            <el-row :gutter="15">
                <el-col :lg="16">
                    <el-card shadow="never">
                        <scEcharts height="300px" :option="cpuOption"></scEcharts>
                    </el-card>
                </el-col>
                <el-col :lg="8">
                    <el-card shadow="never">
                        <scEcharts height="300px" :option="memOption"></scEcharts>
                    </el-card>
                </el-col>
                <el-col :lg="8">
                    <el-card shadow="never">
                        <el-card class="box-card">
                            <template #header>
                            <div class="card-header">
                                <span>虚拟机</span>
                            </div>
                            </template>
                            <el-row :gutter="20" >
                                <el-col :span="12">PID</el-col>
                                <el-col :span="12">{{ pid }}</el-col>
                            </el-row>
                            <el-row :gutter="20" v-for="(v, item) in jvm">
                                <el-col :span="12">{{ item }}</el-col>
                                <el-col :span="12">{{ v }}</el-col>
                            </el-row>
                        </el-card>
                    </el-card>
                </el-col>
                <el-col :lg="8">
                    <el-card shadow="never">
                        <el-card class="box-card">
                            <template #header>
                            <div class="card-header">
                                <span>系统信息</span>
                            </div>
                            </template>
                            <el-row :gutter="20" v-for="(v, item) in sys">
                                <el-col :span="12">{{ item }}</el-col>
                                <el-col :span="12">{{ v }}</el-col>
                            </el-row>
                        </el-card>
                    </el-card>
                </el-col>
            </el-row>
        </el-main>
    </el-container>
</template>

<script>
import scEcharts from '@/components/scEcharts/index.vue';
export default {
    name: "oshi",
    components: {
        scEcharts
    },
    mounted() {
        this.id = this.$route.params.id;
        this.doRefresh();
        setTimeout(() => {
            this.doRefreshValue()
        }, 0);
    },
    // 轮询-
    destroyed() {
        //离开页面是销毁
        clearInterval(this.timer);
        this.timer = null;
    },
    watch: {
        refreshTime: {
            deep: !0,
            immediate: !0,
            handler() {
                //离开页面是销毁
                clearInterval(this.timer);
                this.timer = null;
                this.doRefresh();
            }
        }
    },
    data() {
        return {
            refreshTime: 10000,
            timer: null,
            jvm: {},
            sys: {},
            pid: null,
            id: null,
            apiCommand: this.$API.config.actuator.command,
            memOption: {
                animationDuration: 5000,
                title: {
                    text: '内存'
                },
                series: [
                    {
                        itemStyle: { normal: { label: { show: true } } },
                        name: 'Nightingale Chart',
                        type: 'pie',
                        roseType: 'area',
                        itemStyle: {
                            borderRadius: 8
                        },
                        data: [
                            { value: (0), name: '剩余内存('+ (0)+'G)' },
                            { value: (0), name: '可用内存('+ (0)+'G)' }
                        ]
                    }
                ]
            },
            cpuOption: {
                animationDuration: 5000,
                title: {
                    text: 'CPU'
                },
                xAxis: {
                    type: 'category',
                    data: [],
                    show: true
                },
                yAxis: {
                    type: 'value',
                    boundaryGap: [0, '100%'],
                    splitLine: {
                        show: false
                    },
                    max: 100,
                    min: 0
                },
                series: [
                    {
                        itemStyle: { normal: { label: { show: true } } },
                        name: 'Fake Data',
                        type: 'line',
                        showSymbol: true,
                        smooth: true,
                        data: []
                    }
                ]
            }
        }
    },
    methods: {
        doRefresh() {
            if (this.timer != null) {
                return;
            }
            // 实现轮询
            this.timer = window.setInterval(() => {
                setTimeout(() => {
                    this.doRefreshValue()
                }, 0);
            }, this.refreshTime);
        },
        doRefreshValue() {
            this.apiCommand.get({ dataId: this.id, command: 'oshi', method: 'GET', isOtherServer: !0 }).then(res => {
                if (res.code === '00000') {
                    this.jvm = res?.data?.jvm;
                    this.sys = res?.data?.sys;
                    this.pid = res?.data?.pid;
                    setTimeout(() => {
                        this.doAnalysisCpu(res?.data?.cpu, res?.data?.time);
                    }, 0);
                    setTimeout(() => {
                        this.doAnalysisMem(res?.data?.mem, res?.data?.time);
                    }, 0);
                }
            });
        },
        doAnalysisCpu(data, time) {
            if (null == data) {
                data = {};
            }
            this.cpuOption.title.text = data?.cpuModel?.split('\n')[0];
            let data1 = this.cpuOption.series[0].data;
            data1.push(data?.sys || 0);
            let xData1 = this.cpuOption.xAxis.data;
            xData1.push(this.$TOOL.date.dateFormat(time * 1000, 'hh:mm:ss'));
            if(data1.length > 100) {
                data1.split(0, 1);
                xData1.split(0, 1);
            }
        },
        doAnalysisMem(data, time) {
            if (null == data) {
                data = {};
            }
            let data1 = this.memOption.series[0].data;
            data1.length = 0;
            this.memOption.title.text = '内存(' + data?.total + 'G)';
            data1[0].value = (data?.free || 0);
            data1[0].name = '剩余内存('+ (data?.free || 0)+'G)';
            data1[1].value = (data?.used || 0);
            data1[1].name = '可用内存('+ (data?.used || 0)+'G)';
        },
    }

}
</script>