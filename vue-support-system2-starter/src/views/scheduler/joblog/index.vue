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
                                <el-select v-model="form.logStatus" clearable filterable style="width: 100%;">
                                    <el-option :value="0" label="全部"></el-option>
                                    <el-option :value="1" label="成功"></el-option>
                                    <el-option :value="2" label="失败"></el-option>
                                    <el-option :value="3" label="进行中"></el-option>
                                </el-select>
                                <el-select v-model="form.jobGroup" clearable filterable style="width: 100%;"
                                    @change="changeGroup">
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
                                <el-select v-model="form.jobId" clearable filterable style="width: 100%;"
                                    @change="changeJob">
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
                    <el-main class="nopadding">
                        <scTable ref="table" :loading="loading" :data="data" stripe highlightCurrentRow  @row-click="rowClick">
                            <el-table-column label="级别" prop="level" width="60">
                                <template #default="scope">
                                    <sc-status-indicator pulse type="warning" v-if="scope.row.triggerCode == 500"
                                        title="結果失败"></sc-status-indicator>
                                    <el-icon v-else style="color: #409EFF;"><el-icon-info-filled /></el-icon>
                                </template>
                            </el-table-column>
                            <el-table-column label="任务ID" prop="id" width="150"></el-table-column>
                            <el-table-column label="调度时间" prop="triggerTime"  width="150">
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
                                    <el-button text type="primary" size="small" >查看</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="执行时间" prop="logAddressPosition"></el-table-column>
                            <el-table-column label="执行时间" prop="logAddressPosition"></el-table-column>
                            <el-table-column label="执行结果" prop="createName" width="150"></el-table-column>
                            <el-table-column label="执行备注" prop="createName" width="150"></el-table-column>
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
</template>

<script>
import info from './info.vue'
export default {
    name: 'log',
    components: {
		info,
	},
    data() {
        return {
            clearType: 1,
            loading: !1,
            date: [],
            form: {
                jobGroup: 0,
                jobId: 0,
                logStatus: 0,
            },
            jobName: '全部',
            jobGroupName: '全部',
            data: [],
            executorData: [],
            jobData: [],
            jobGroup: this.$API.scheduler.jobGroup,
            jobInfo: this.$API.scheduler.getJobsByGroup,
            apiObj: this.$API.scheduler.joblog,
            clearShow: !1,
            infoDrawer: !1,
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
        changeGroup(row) {
            if (row) {
                this.form.jobGroup = row;
                const it = this.executorData.filter(item => item.id == row);
                this.jobGroupName = it ? it[0].title : '全部';
                return !1;
            }
            row == 0, this.jobGroupName = '全部';
        },
        changeJob(row) {
            if (row) {
                this.form.jobId = row;
                const it = this.jobData.filter(item => item.id == row);
                this.jobName = it ? it[0].jobDesc : '全部';
                return !1;
            }
            row == 0, this.jobName = '全部';
        },
        async initial() {
            const res = await this.jobGroup.get();
            this.executorData = res?.data.data;
            if (!this.form.jobGroup) {
                this.form.jobGroup = this.executorData && this.executorData.length > 0 ? this.executorData[0].id : undefined;
                this.jobGroupName = this.executorData && this.executorData.length > 0 ? this.executorData[0].title : undefined;
            } else {
                const it = this.executorData && this.executorData.length > 0 ?
                    this.executorData.filter(it => it.id == this.form.jobGroup) : [];
                if (it.length > 0) {
                    this.jobGroupName = it[0].title
                }
            }
            if (this.form.jobGroup) {
                const res1 = await this.jobInfo.get({
                    jobGroup: this.form.jobGroup
                });
                this.jobData = res1?.data.content;
                if (!this.form.jobId) {
                    this.form.jobId = this.jobData && this.jobData.length > 0 ? this.jobData[0].id : undefined;
                    this.jobName = this.jobData && this.jobData.length > 0 ? this.jobData[0].jobDesc : undefined;
                } else {
                    const it = this.jobData && this.jobData.length > 0 ?
                        this.jobData.filter(it => it.id == this.form.jobId) : [];
                    if (it.length > 0) {
                        this.jobName = it[0].title
                    }
                }
            }
            this.search();
        },
        search() {
            this.loading = !0;
            if (this.date) {
                this.form.filterTime = this.date.join(' - ');
            }
            this.apiObj.get(this.form).then(res => {
                if (res.code === '00000') {
                    this.data = res.data.data;
                }
            }).finally(() => this.loading = !1)
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
