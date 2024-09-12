<template>
    <el-container>
        <!-- <el-aside width="220px">
			<el-tree ref="category" class="menu" node-key="label" :data="category" :default-expanded-keys="['系统日志']"
				current-node-key="系统日志" :highlight-current="true" :expand-on-click-node="false">
			</el-tree>
		</el-aside> -->
        <el-container>
            <el-main class="nopadding">
                <el-container>
                    <el-header>
                        <div class="left-panel">
                            <el-date-picker v-model="date" value-format="YYYY-MM-DD HH:MM:ss" type="datetimerange"
                                range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
                        </div>
                        <div class="right-panel">
                            <div class="right-panel-search">
                                <el-select v-model="form.logStatus" filterable style="width: 100%;">
                                    <el-option :value="0" label="全部"></el-option>
                                    <el-option :value="1" label="成功"></el-option>
                                    <el-option :value="2" label="失败"></el-option>
                                    <el-option :value="3" label="进行中"></el-option>
                                </el-select>
                                <el-select v-model="form.jobGroup" filterable style="width: 100%;min-width: 200px;" @change="changeGroup">
                                    <el-option :value="0" label="全部"></el-option>
                                    <el-option v-for="item in executorData" :value="item.id" :label="item.appname">
                                        <span style="float: left">{{ item.appname }}</span>
                                        <span style="
                                            float: right;
                                            color: var(--el-text-color-secondary);
                                            font-size: 13px;
                                            ">{{ item.title }}</span>
                                    </el-option>
                                </el-select>
                                <el-select v-model="form.jobId" filterable style="width: 100%;min-width: 200px;">
                                    <el-option :value="0" label="全部"></el-option>
                                    <el-option v-for="item in jobData" :value="item.id" :label="item.jobDesc">
                                        <span style="float: left">{{ item.jobDesc }}</span>
                                        <span style="
                                            float: right;
                                            color: var(--el-text-color-secondary);
                                            font-size: 13px;
                                            ">{{ item.jobDesc }}</span>
                                    </el-option>
                                </el-select>
                                <el-input v-model="search.keyword" placeholder="关键词" clearable></el-input>
                                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                                <el-button type="danger" icon="el-icon-delete" @click="clear"></el-button>
                            </div>
                        </div>
                    </el-header>
                    <el-header style="height:150px;">
                        <scEcharts height="100%" :option="logsChartOption"></scEcharts>
                        <!-- <scEcharts height="100%" :option="logsChartOption2"></scEcharts> -->
                    </el-header>
                    <el-main class="nopadding">
                        <scTable ref="table" :loading="loading" :params="form" :apiObj="apiObj" stripe highlightCurrentRow
                            @row-click="rowClick">
                            <el-table-column label="级别" prop="level" width="60">
                                <template #default="scope">
                                    <sc-status-indicator pulse type="warning" v-if="scope.row.triggerCode == 500"
                                        title="結果失败"></sc-status-indicator>
                                    <el-icon v-else style="color: #068f3f;"><el-icon-info-filled /></el-icon>
                                </template>
                            </el-table-column>
                            <el-table-column label="任务ID" prop="id" width="150"></el-table-column>
                            <el-table-column label="调度时间" prop="triggerTime" width="150">
                                <template #default="scope">
                                    <span v-time="scope.row.triggerTime"></span>
                                </template>
                            </el-table-column>
                            <el-table-column label="调度结果" prop="logMapping" show-overflow-tooltip>
                                <template #default="scope">
                                    <el-tag type="danger" v-if="scope.row.triggerCode == 500">失败</el-tag>
                                    <el-tag type="success" v-else>成功</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="调度备注" prop="logAddress" width="150">
                                <template #default="scope">
                                    <el-button text type="primary" size="small">查看</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="执行时间" prop="handleTime">
                                <template #default="scope">
                                    <span v-time="scope.row.handleTime"></span>
                                </template>
                            </el-table-column>
                            <el-table-column label="执行结果" prop="handleCode">
                                <template #default="scope">
                                    <el-tag type="danger" v-if="scope.row.handleCode !== 200">失败</el-tag>
                                    <el-tag type="success" v-else>成功</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="执行备注" prop="handleMsg" width="150">
                                <template #default="scope">
                                    <span v-if="scope.row.handleMsg">{{ scope.row.handleMsg }}</span>
                                    <span v-else>无</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" prop="operator" :fixed="false">
                                <template #default="scope">
                                    <el-button text plain icon="el-icon-view" title="详情" style="z-index: 999999;"
                                        @click.stop="doDetail(scope.row)"></el-button>
                                </template>
                            </el-table-column>
                            <!-- <el-table-column label="操作" prop="logCost">
                                <template #default="scope">
                                    <el-badge v-if="scope.row.logCost > 1000">{{ scope.row.logCost }} ms</el-badge>
                                    <span v-else>{{ scope.row.logCost }} ms</span>
                                </template>
                            </el-table-column> -->
                        </scTable>
                    </el-main>
                </el-container>
            </el-main>
        </el-container>
    </el-container>

    <el-dialog title="日志清理" v-model="clearShow" @close="clearShow = !1">
        <el-form :model="form" label-width="120px">
            <el-form-item label="执行器">
                <el-input disabled readonly v-model="jobGroupName" />
            </el-form-item>
            <el-form-item label="任务">
                <el-input disabled readonly v-model="jobName" />
            </el-form-item>
            <el-form-item label="">
                <el-select v-model="clearType" style="width: 100%">
                    <el-option label="清理一个月之前的日志数据" :value="1" />
                    <el-option label="清理三个月之前的日志数据" :value="2" />
                    <el-option label="清理六个月之前的日志数据" :value="3" />
                    <el-option label="清理一年之前的日志数据" :value="4" />
                    <el-option label="清理一千条之前的日志数据" :value="5" />
                    <el-option label="清理一万条之前的日志数据" :value="6" />
                    <el-option label="清理三万条之前的日志数据" :value="7" />
                    <el-option label="清理十万条之前的日志数据" :value="8" />
                    <el-option label="清理所以日志数据" :value="9" />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="clearShow = false">取消</el-button>
                <el-button type="primary" @click="clearLog(0)">确定</el-button>
            </span>
        </template>
    </el-dialog>

    <el-drawer v-model="infoDrawer" title="日志详情" :size="800" destroy-on-close>
        <info ref="info"></info>
    </el-drawer>
    <cat v-if="catStatus" ref="catRef"></cat>
</template>

<script>
import scEcharts from '@/components/scEcharts/index.vue'
import info from './info.vue'
import cat from './cat.vue'
export default {
    name: 'log',
    components: {
        info,
        scEcharts,
        cat
    },
    data() {
        return {
            clearType: 1,
            catStatus: false,
            loading: !1,
            date: [],
            defaultValueDate: {},
            form: {
                jobGroup: 0,
                jobId: 0,
                logStatus: 0,
            },
            jobName: '全部',
            jobGroupName: '全部',
            data: {},
            executorData: [],
            jobData: [],
            jobGroup: this.$API.scheduler.jobGroup,
            jobInfo: this.$API.scheduler.getJobsByGroup,
            apiObj: this.$API.scheduler.joblog,
            clearShow: !1,
            infoDrawer: !1,
            logsChartOption2: {
                color: ['#00A65A', '#c23632', '#F39C12'],
                tooltip: {
                    trigger: 'item'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: []
                },
                yAxis: {
                    show: false,
                    type: 'value'
                },
                series: [{
                    radius: '55%',
                    center: ['50%', '50%'],
                    data: [],
                    type: 'pie',
                    stack: 'log',
                    barWidth: '15px',
                    roseType: 'radius',
                    label: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    },
                    labelLine: {
                        lineStyle: {
                            color: 'rgba(255, 255, 255, 0.3)'
                        },
                        smooth: 0.2,
                        length: 10,
                        length2: 20
                    },
                    itemStyle: {
                        color: '#c23531',
                        shadowBlur: 20,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    },
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDelay: function (idx) {
                        return Math.random() * 200;
                    }
                }]
            },
            logsChartOption: {
                color: ['#409eff', '#e6a23c', '#f56c6c'],
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
                    boundaryGap: false,
                    data: []
                },
                yAxis: {
                    show: false,
                    type: 'value'
                },
                series: [{
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
            category: [
            ],
        }
    },
    watch: {
    },
    mounted: function () {
        this.form.jobGroup = ~~this.$route.params.jobGroup;
        this.form.jobId = ~~this.$route.params.jobId;
        this.initial();
    },
    methods: {
        rowClick(row) {
            this.infoDrawer = true
            this.$nextTick(() => {
                this.$refs.info.setData(row)
            })
        },
        doDetail(row) {
            this.catStatus = true;
            this.$nextTick(() => {
                this.$refs.catRef.open().setData(row);
            })
            // this.$router.push({ path: '/scheduler/joblog/cat/' + row.id });
        },
        clear() {
            // this.jobName = '全部';
            this.clearShow = !0;
        },
        clearLog(v) {
            this.$API.scheduler.clearLog.get({
                jobId: v,
                jobGroup: this.form.jobGroup,
                type: this.clearType
            }).then(res => {
                if (res.code === '00000') {
                    this.$message.success('清除成功');
                    this.clearShow = !1;
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        changeGroup(value) {
            if (value) {
                this.form.jobId = 0;
                this.form.jobGroup = value;
                this.doSearchJob(value);
                const it = this.executorData.filter(item => item.id == value);
                this.jobGroupName = it ? it[0].title : '全部';
                return !1;
            }
            value == 0, this.jobGroupName = '全部';
        },
        async doSearchJob(jobGroupId) {
            const res1 = await this.jobInfo.get({
                jobGroup: jobGroupId
            });
            this.jobData = res1?.data.content;
            if (!this.form.jobId) {
                this.form.jobId = this.jobData && this.jobData.length == 1 ? this.jobData[0].id : 0;
                this.jobName = this.jobData && this.jobData.length == 1 ? this.jobData[0].jobDesc : undefined;
            }
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
                    this.logsChartOption2.xAxis.data.length = 0;
                    const le = this.logsChartOption.xAxis.data.length;
                    this.logsChartOption2.series[0].data.push({
                        value: res.data?.content.triggerDayCountFailList[le - 1],
                        name: '失败'
                    });
                    this.logsChartOption2.series[0].data.push({
                        value: res.data?.content.triggerDayCountRunningList[le - 1],
                        name: '进行中'
                    });
                    this.logsChartOption2.series[0].data.push({
                        value: res.data?.content.triggerDayCountSucList[le - 1],
                        name: '成功'
                    });
                }
            })
        },
        async initial() {
            this.intiCharts();
            const res = await this.jobGroup.get();
            this.executorData = res?.data.data;
            if (!this.form.jobGroup) {
                this.form.jobGroup = this.executorData && this.executorData.length == 1 ? this.executorData[0].id : 0;
                this.jobGroupName = this.executorData && this.executorData.length == 1 ? this.executorData[0].title : '';
            } else {
                const it = this.executorData && this.executorData.length > 0 ?
                    this.executorData.filter(it => it.id == this.form.jobGroup) : [];
                if (it.length > 0) {
                    this.jobGroupName = it[0].title
                }
                if(this.form.jobId) {
                    this.doSearchJob(this.form.jobGroup);
                }
            }
            this.search();
        },
        search() {
            // this.loading = !0;
            if (this.date) {
                this.form.filterTime = this.date.join(' - ');
            }
            if (!this.form.jobId) {
                this.form.jobId = 0;
            }
            this.$refs.table.reload(this.form)
            // this.apiObj.get(this.form).then(res => {
            //     if (res.code === '00000') {
            //         this.data = {
            //             data: res.data.data,
            //             total: res.data.recordsTotal,
            //         }
            //     }
            // }).finally(() => this.loading = !1)
        },
        rowClick(row) {
            this.infoDrawer = true
            this.$nextTick(() => {
                this.$refs.info.setData(row)
            })
        },

    }
}
</script>

<style></style>
