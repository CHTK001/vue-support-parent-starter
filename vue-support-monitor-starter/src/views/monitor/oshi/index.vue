<template>
    <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
        <div class="h-full mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3 overflow-auto">
            <el-card v-for="(val, key, i) in data"
                class=" overflow-auto  flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm overflow-auto">
                <div class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-white text-gray-700">
                    <div v-if="val.type === 'echarts' || val.type === 'echarts-nolimit'">
                        <scEcharts height="250px" width="500px" :option="val"></scEcharts>
                    </div>
                    <div v-else-if="val.type === 'disk'">
                        <p>{{ val.title.text }}</p>
                        <el-progress :width="45" :height="45" style="background-color: white;"
                            :title="item.used + '/' + item.total" v-for="item in val.series[0].data" :stroke-width="20"
                            :color="colors" :percentage="(item?.usage?.toFixed(2))">
                            <el-button text>{{ item?.typeName }} {{ item?.total }}</el-button>
                            <span class="relative" style="left: -160%">{{ item?.free }}</span>
                        </el-progress>
                    </div>
                    <div v-else-if="val.type === 'table'">
                        <p>{{ val.title.text }}</p>

                        <div class="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-2" >
                            <div v-if="!Array.isArray(val?.series[0]?.data?.data)" v-for="(val, key, i)  in val?.series[0]?.data || []" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                                <div v-if="key != 'timestamp' && val" 
                                    class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                        aria-hidden="true" class="w-6 h-6 text-white">
                                        <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path>
                                        <path fill-rule="evenodd"
                                            d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                                            clip-rule="evenodd"></path>
                                        <path
                                            d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z">
                                        </path>
                                    </svg>
                                </div>
                                <div class="p-4 text-right">
                                    <p
                                        class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
                                        <span v-if="key == 'total'">
                                            总量
                                        </span>
                                        <span v-if="key == 'max'">
                                            物理总量
                                        </span>
                                        <span v-else-if="key == 'free'">
                                            剩余
                                        </span>
                                        <span v-else-if="key == 'used'">
                                            已使用
                                        </span>
                                        <span v-else-if="key == 'timestamp'">
                                            上报时间
                                        </span>
                                        <span v-else-if="key == 'version'">
                                            版本
                                        </span>
                                        <span v-else-if="key == 'home'">
                                            路径
                                        </span>
                                        <span v-else>{{ key }}</span>
                                    </p>
                                        
                                    <h4 v-if="key == 'timestamp'"
                                        class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                                        <span v-time.tip="val" /></h4>

                                    <h4 v-else-if="typeof val === 'number'"
                                        class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                                        {{ this.$TOOL.sizeFormat(val || 0) }}</h4>
                                    <h4 v-else
                                        class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                                        {{ val  }}</h4>
                                </div>
                            </div>
                            <div v-else v-for="(val, key, i)  in val?.series[0]?.data?.data || []" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                                <div
                                    class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                        aria-hidden="true" class="w-6 h-6 text-white">
                                        <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path>
                                        <path fill-rule="evenodd"
                                            d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                                            clip-rule="evenodd"></path>
                                        <path
                                            d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z">
                                        </path>
                                    </svg>
                                </div>
                                <div class="p-4 text-right">
                                    <p
                                        class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
                                        <span><b>{{ val?.name }}</b></span>
                                    </p>
                                        
                                    <h4
                                        class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                                        <span>{{ calculateDuration(val?.upTime) }}</span></h4>

                                    <h4 
                                        class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                                        {{ this.$TOOL.sizeFormat(val?.residentSetSize || 0) }}</h4>
                                    <h4
                                        class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                                        {{ val?.status  }}</h4>
                                </div>
                                <div class="border-t border-blue-gray-50 p-4">
                                    <p class="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600">
                                        <!-- <strong class="text-green-500">命令</strong>{{ val?.command }} -->
                                    </p>
                                    <p class="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600">
                                        <strong class="text-green-500">进程ID</strong>{{ val?.processId }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="val.type === 'percentage'">
                        <p>{{ val.title.text }}</p>
                        <el-progress :stroke-width="15" :width="230" :height="200" type="dashboard"
                            :percentage="((val.series[0].data?.used || 0) / (val.series[0].data?.total || 1) * 100).toFixed(2)"
                            :color="colors">
                            <template #default="{ percentage }">
                                <span class="percentage-value">{{ percentage }}%</span>
                                <span class="percentage-label">已使用</span>
                            </template>
                        </el-progress>
                    </div>
                </div>
                <div class="p-6 border-t border-blue-gray-50 px-6 py-5">
                    <p
                        class="antialiased font-sans text-sm leading-normal flex items-center font-normal text-blue-gray-600">
                        <span v-time.tip="val.timestamp"></span>
                    </p>
                </div>
            </el-card>
        </div>
    </div>

    <el-button type="danger" icon="el-icon-delete"
        style="position: fixed; right: 0; top: 55%; width: 40px; height: 40px;"></el-button>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
import sysConfig from '@/config'
import io from 'socket.io-client';
import Base64 from "@/utils/base64";
import { inject } from "vue"
import scEcharts from '@/components/scEcharts/index.vue';


const ansi_up = new AnsiUp();
export default {
    name: 'log',
    components: { scSelectFilter, scEcharts },
    data() {
        return {
            input: '',
            showFile: 0,
            apps: [],
            appsModel: {},
            form: {
                appValue: '',
                appModelValue: ''
            },
            data: {

            },
            colors: [
                { color: '#67C23A', percentage: 40 },
                { color: '#E6A23C', percentage: 60 },
                { color: '#F56C6C', percentage: 80 },
            ],
            socket: inject('socket'),
            plugins: [{
                name: 'mem',
                label: '内存',
                type: 'percentage',
                isColl: false
            }, {
                name: "jvm",
                label: '虚拟机',
                type: 'table',
                isColl: false
            }, {
                name: "process",
                label: '进程(top 10)',
                type: 'table',
                isColl: false
            }, {
                name: "network",
                label: '网络',
                type: 'echarts-nolimit',
                isColl: true
            }, {
                name: 'disk',
                label: '磁盘',
                type: 'disk',
                isColl: false
            }, {
                name: 'cpu',
                type: 'echarts',
                isColl: true
            }]
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
        try {
            this.form.appValue = this.$route.query.appName;
            const item = JSON.parse(Base64.decode(this.$route.query.data));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
        } catch (e) { }
        this.afterPrepertiesSet();
    },
    beforeUnmount() {
        this.closeSocket();
    },
    created() {
        this.openSocket();
    },
    methods: {
        calculateDuration(durationInMillis) {
            // 计算相差的天数
            var days = Math.floor(durationInMillis / (1000 * 60 * 60 * 24));
            
            // 计算相差的小时数（不包括天）
            var hours = Math.floor((durationInMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            // 计算相差的分钟数（不包括小时）
            var minutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60));
            
            return "持续：" + days + "天 " + hours + "小时 " + minutes + "分钟";
        },
        async afterPrepertiesSet() {
            this.plugins.forEach(item => {
                if (item.type == 'echarts') {
                    this.data[item.name] = {
                        type: item.type,
                        tooltip: {
                            trigger: 'axis'
                        },
                        xAxis: {
                            type: 'category',
                            data: []
                        },
                        yAxis: {
                            boundaryGap: [0, '50%'],
                            type: 'value',
                            axisLabel: {
                                formatter: '{value}'
                            },
                            name: item.label || item.name + "单位（%）",
                            splitLine: {
                                show: true,//是否显示网格线
                            },
                            max: 100
                        },

                        series: [{
                            data: [],
                            type: item.charts || 'line'
                        }
                        ]
                    }
                    return;
                } else  if (item.type == 'echarts-nolimit') {
                    this.data[item.name] = {
                        type: item.type,
                        tooltip: {
                            trigger: 'axis'
                        },
                        xAxis: {
                            type: 'category',
                            data: []
                        },
                        yAxis: {
                            type: 'value',
                            axisLabel: {
                                formatter: '{value}'
                            },
                            name: item.label || item.name  + '字节',
                            splitLine: {
                                show: true,//是否显示网格线
                            },
                        },

                        series: [{
                            data: [],
                            type: item.charts || 'line'
                        }
                        ]
                    }
                    return;
                } else if (item.type === 'disk') {
                    this.data[item.name] = {
                        type: item.type,
                        title: {
                            text: item.label || item.name
                        },
                        xAxis: {
                            type: 'category',
                            data: []
                        },
                        series: [{
                            data: [],
                            type: item.charts || 'line'
                        }]
                    }
                } else if (item.type === 'table') {
                    this.data[item.name] = {
                        type: item.type,
                        title: {
                            text: item.label || item.name
                        },
                        xAxis: {
                            type: 'category',
                            data: []
                        },
                        series: [{
                            data: [],
                        }]
                    }
                } else if (item.type === 'percentage') {
                    this.data[item.name] = {
                        type: item.type,
                        title: {
                            text: item.label || item.name
                        },
                        xAxis: {
                            type: 'category',
                            data: []
                        },
                        series: [{
                            data: [],
                        }]
                    }
                }
            });
        },
        isMathch(item) {
            const appValue = this.form.appValue;
            const appModelValue = this.form.appModelValue;
            if (!appModelValue && !appValue) {
                return true;
            }

            if (appModelValue && !appValue) {
                return appModelValue == item.serverHost + ':' + item.serverPort;
            }

            if (!appModelValue && appValue) {
                return item.appName == appValue;
            }
            return (appModelValue == item.serverHost + ':' + item.serverPort) && (item.appName == appValue);
        },
        openSocket() {
            const _this = this;
            this.plugins.forEach(item => {
                this.socket.on(item.name, (it) => {
                    const value = it;
                    if (!this.isMathch(value)) {
                        return false;
                    }
                    const values = value?.data;
                    if (this.data[item.name]['xAxis']['data'].length > 100) {
                        this.data[item.name]['xAxis']['data'].shift();
                        this.data[item.name]['series'][0]['data'].shift();
                    }
                    if (Array.isArray(values)) {
                        this.data[item.name]['xAxis']['data'].push(this.$TOOL.date.dateFormat(values[0]?.timestamp));
                    } else {
                        this.data[item.name]['xAxis']['data'].push(this.$TOOL.date.dateFormat(values?.timestamp))
                    }
                    if (item.isColl) {
                        var dataItem = '';
                        if (item.name == 'cpu') {
                            dataItem = values?.sys;
                            this.data[item.name]['series'][0]['data'].push(dataItem);
                            return false;
                        }
                        if (item.name == 'network') {
                            values.forEach((el, index) => {
                                var arr = this.data[item.name]['series'][index];
                                if (!arr) {
                                    this.data[item.name]['series'][index] = {
                                        data: [],
                                        type: 'line'
                                    };
                                    arr = this.data[item.name]['series'][index];
                                }
                                arr.data.push(el?.transmitBytes)
                            })
                        }
                    } else {
                        this.data[item.name]['series'][0]['data'] = values;
                    }
                })
            })
        },
        closeSocket() {
            this.plugins.forEach(item => {
                this.socket.off(item);
            })
        },
    }
}
</script>
<style scoped>* {
    font-size: 12px;
}
:deep(.el-card__body) {
    overflow-y: auto;
}
:deep(.el-progress-circle path) {
    fill: #fff
}</style>