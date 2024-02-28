<template>
	<el-container>
		<el-header style="height: auto;">
			<sc-select-filter :data="filterData" :label-width="80" @on-change="filterChange"></sc-select-filter>
		</el-header>
		<el-header>
			<div class="left-panel">
			</div>
			<div class="right-panel">
				<div class="right-panel-search">
                    <el-select v-model="form.jobGroup" filterable style="width: 100%;">
                        <el-option :value="0" label="全部"></el-option>
                        <el-option v-for="item in executorData" :value="item.id" :label="item.appname">
                            <span style="float: left">{{ item.appname }}</span>
                            <span
                                style="
                                float: right;
                                color: var(--el-text-color-secondary);
                                font-size: 13px;
                                "
                                >{{ item.title }}</span
                            >
                        </el-option>
                    </el-select>
					<el-input v-model="form.jobDesc" placeholder="任务描述" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="search"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
            <el-skeleton :loading="loading" animated>
                <el-container>
                    <el-main>
                        <el-row :gutter="15">
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in data" :key="item.id"
                                class="demo-progress">
                                <el-card class="task task-item" shadow="always">
                                    <h2>
                                        {{ item.jobDesc }}
                                        <el-tag v-if="item.triggerStatus == 0" size="small" type="info">暂停</el-tag>
                                        <el-tag v-if="item.triggerStatus == 1" size="small" type="success">正在运行</el-tag>
                                    </h2>
                                    <el-row>
                                        <el-col :span="24">
                                            <ul>
                                                <li>
                                                    <h4>运行模式</h4>
                                                    <p>{{ item.glueType }} {{  item.executorHandler }}</p>
                                                </li>
                                                <li>
                                                    <h4>任务类型
                                                    </h4>
                                                    <p><el-tag effect="light">{{ item.scheduleType }}  {{  item.scheduleConf }}</el-tag></p>
                                                </li>
                                            </ul>
                                        </el-col>
                                    </el-row>
                                    <div class="bottom" >
                                        <div class="state">
                                            <el-col :span="24">
                                                <span>创建人: {{ item.author }}</span>
                                                <span style="margin-left: 10px"></span>
                                                <el-button size="small" circle  @click="edit(item)" icon="el-icon-edit"></el-button>
                                            </el-col>
                                        </div>
                                        <div class="handler">
                                            <el-dropdown trigger="click">
                                                <el-button type="primary" icon="el-icon-more" circle plain></el-button>
                                                <template #dropdown>
                                                    <el-dropdown-menu>
                                                        <el-dropdown-item @click="trigger(item)">执行一次</el-dropdown-item>
                                                        <el-dropdown-item @click="logger(item)">查询日志</el-dropdown-item>
                                                        <el-dropdown-item @click="jobgroupById(item)" >注册节点</el-dropdown-item>
                                                        <el-dropdown-item @click="nextTriggerTime(item)" >下次执行时间</el-dropdown-item>
                                                        <el-dropdown-item v-if="item.triggerStatus == 0"  @click="start(item)" divided>启动</el-dropdown-item>
                                                        <el-dropdown-item v-if="item.triggerStatus == 1"  @click="stop(item)" divided>停止</el-dropdown-item>
                                                        <el-dropdown-item @click="edit(item)" >编辑</el-dropdown-item>
                                                        <el-dropdown-item @click="del(item)" >删除</el-dropdown-item>
                                                        <el-dropdown-item @click="copy(item)" >复制</el-dropdown-item>
                                                    </el-dropdown-menu>
                                                </template>
                                            </el-dropdown>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                                <el-card class="task task-add" shadow="never" @click="add">
                                    <el-icon><el-icon-plus /></el-icon>
                                    <p>添加计划任务</p>
                                </el-card>
                            </el-col>
                        </el-row>

                    </el-main>
                    <el-footer style="height: 51px; line-height: 50px; padding:0">
                        <scPagintion :pageSize="form.size" :total="total"  @dataChange="search"></scPagintion>
                    </el-footer>
                </el-container>
            </el-skeleton>
		</el-main>
	</el-container>

    <el-dialog draggable v-model="triggerShow" :title="triggerTitle">
        <el-form :model="form" label-width="120px">
            <el-form-item label="任务参数">
                <el-input type="textarea" :rows="6" v-model="executorParam" />
            </el-form-item>
            <el-form-item label="机器地址">
                <el-input type="textarea" :rows="6" v-model="addressList" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button :loading="triggerLoadding" @click="triggerShow = false">取消</el-button>
                <el-button :loading="triggerLoadding"  type="primary" @click="triggerExecute">确定</el-button>
            </span>
        </template>
    </el-dialog>

    <el-dialog draggable v-model="jobinfoNextTriggerTimeShow" title="下一次执行时间" width="20%">
        <p style="padding: 5px;" v-for="item in jobinfoNextTriggerTimeData">{{ item }}</p>
    </el-dialog>

    <el-dialog draggable v-model="jobgroupByIdShow" title="注册地址" width="20%">
        <p style="padding: 5px;" >{{ jobgroupByIdData.appname }}</p>
    </el-dialog>

    <save v-if="saveShow"  @success="handlerSuccess" ref="saveRef" @close="saveShow = false"></save>
</template>
<script>
import save from './save.vue'
export default {
    name: "Task",
    components: {save},
    data() {
        return {
            triggerId: undefined,
            executorParam: '',
            addressList: '',
            triggerTitle: '',
            triggerShow: !1,
            saveShow: !1,
            jobinfoNextTriggerTimeShow: !1,
            jobgroupByIdShow: !1,
            triggerLoadding: !1,
            apiObj: this.$API.scheduler.pageList,
            jobGroup: this.$API.scheduler.jobGroup,
            form: {
                triggerStatus :-1,
                jobDesc: undefined,
                jobGroup: 0,
                size: 10,

            },
            data: [],
            loading: false,
            executorData: [],
            jobinfoNextTriggerTimeData: [],
            jobgroupByIdData: {},
            total: 0,
            filterData: [{
                title: "所属行业",
                key: "triggerStatus",
                multiple: true,
                options: [
                    {
                        label: "全部",
                        value: -1
                    },
                    {
                        label: "停止",
                        value: 0
                    },
                    {
                        label: "启动",
                        value: 1
                    }]
            }]
        }
    },
    mounted(){
        this.initial();
    },
    methods:{
        handlerSuccess() {
            this.search();
        },
        edit(row) {
            this.saveShow = !0;
            this.$nextTick(() => {
                this.$refs.saveRef.open('edit', row);
            })
        },
        copy(row) {
            this.saveShow = !0;
            this.$nextTick(() => {
                this.$refs.saveRef.open('copy', row);
            })
        },
        del(row) {
            this.$API.scheduler.jobinfoRemove.get({
                id: row.id
        }).then(res => {
                if(res.code === '00000') {
                    this.data = this.data.filter(it => it.id != row.id);
                    this.$message.success("操作成功");
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        start(row) {
            this.$API.scheduler.jobinfoStart.get({
                id: row.id
        }).then(res => {
                if(res.code === '00000') {
                    const item = this.data.filter(it => it.id == row.id);
                    if(item && item.length > 0) {
                        item[0].triggerStatus = 1;
                    }
                    this.$message.success("操作成功");
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        stop(row) {
            this.$API.scheduler.jobinfoStop.get({
                id: row.id
        }).then(res => {
                if(res.code === '00000') {
                    const item = this.data.filter(it => it.id == row.id);
                    if(item && item.length > 0) {
                        item[0].triggerStatus = 0;
                    }
                    this.$message.success("操作成功");
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        add() {
            this.saveShow = !0;
            this.$nextTick(() => {
                this.$refs.saveRef.open('add', {});
            })
        },
        triggerExecute(){
            this.$API.scheduler.jobinfoTrigger.get({
                id: this.triggerId,
                executorParam: this.executorParam,
                addressList: this.addressList
            }).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.triggerShow = false;
                    return !1;
                }
                this.$message.error(res.msg);
            }).finally(() => this.triggerLoadding = !1)
        },
        /**执行一次 */
        trigger(row) {
            this.triggerTitle = row.jobDesc + '(执行一次)';
            this.triggerShow = !0;
            this.triggerId = row.id;
        },
        /**注册节点 */
        jobgroupById(row){
            this.$API.scheduler.jobgroupById.get({
                "id" : row.jobGroup,
            }).then(res => {
                if(res.code === '00000') {
                    this.jobgroupByIdData = res.data.content;
                    this.jobgroupByIdShow = true
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        /**日志 */
        logger(row){
            this.$router.push({ path: '/scheduler/joblog/'+ row.jobGroup + '/' + row.id });
        },
        /**下一次计划时间 */
        nextTriggerTime(row) {
            this.$API.scheduler.jobinfoNextTriggerTime.get({
                "scheduleType" : row.scheduleType,
				"scheduleConf" : row.scheduleConf
            }).then(res => {
                if(res.code === '00000') {
                    this.jobinfoNextTriggerTimeData = res.data.content;
                    this.jobinfoNextTriggerTimeShow = true
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        async initial() {
            const res = await this.jobGroup.get();
            this.executorData = res?.data.data;
            this.form.jobGroup = this.executorData && this.executorData.length == 1 ? this.executorData[0].id : 0
            this.search();
        },
        search(param){
            if(param) {
                Object.assign(this.form, param);
            }
            this.$API.scheduler.pageList.get(this.form).then(res => {
                this.data = res?.data.data;
                this.total = res?.data.recordsTotal
            })
        },
        filterChange(row) {
            this.from.triggerStatus = row.triggerStatus;
        }
    }
}
</script>

<style scoped>
.task {
	height: 210px;
}

.task-item h2 {
	font-size: 15px;
	color: #3c4a54;
	padding-bottom: 15px;
}

.task-item li {
	list-style-type: none;
	margin-bottom: 10px;
}

.task-item li h4 {
	font-size: 12px;
	font-weight: normal;
	color: #999;
}

.task-item li p {
	margin-top: 5px;
}

.task-item .bottom {
	border-top: 1px solid #EBEEF5;
	text-align: right;
	padding-top: 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.task-add {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	cursor: pointer;
	color: #999;
}

.task-add:hover {
	color: #409EFF;
}

.task-add i {
	font-size: 30px;
}

.task-add p {
	font-size: 12px;
	margin-top: 20px;
}

.dark .task-item .bottom {
	border-color: var(--el-border-color-light);
}

.progress {
	margin-top: -45px
}

.percentage-value {
	display: block;
	margin-top: 10px;
	font-size: 18px;
}

.percentage-label {
	display: block;
	margin-top: 10px;
	font-size: 12px;
}

.demo-progress .el-progress--line {
	margin-bottom: 15px;
	width: 350px;
}

.demo-progress .el-progress--circle {
	margin-right: 15px;
}</style>
