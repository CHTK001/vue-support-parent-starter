<template>
	<el-container>
		<el-header style="height: auto;">
			<sc-select-filter :data="filterData" :label-width="80" @on-change="filterChange"></sc-select-filter>
		</el-header>
		<el-header>
			<div class="left-panel">
				<el-button type="primary" icon="el-icon-plus"></el-button>
				<el-button type="danger" plain icon="el-icon-delete"></el-button>
			</div>
			<div class="right-panel">
				<div class="right-panel-search">
                    <el-select v-model="form.jobGroup" clearable filterable style="width: 100%;">
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
			<scTable :loading="loading" ref="table" :params="form" :data="data" row-key="id" stripe>
				<el-table-column type="index" width="50"></el-table-column>
				<el-table-column label="任务ID" prop="id" width="150"></el-table-column>
				<el-table-column label="任务描述" prop="jobDesc" width="150"></el-table-column>
				<el-table-column label="调度类型" prop="scheduleType" width="250">
                    <template #default="scope">
                        <el-tag> {{ scope.row.scheduleType }}  {{  scope.row.scheduleConf }}</el-tag>
                    </template>
                </el-table-column>
				<el-table-column label="运行模式" prop="num" width="250">
                    <template #default="scope">
                        <el-tag> {{ scope.row.glueType }}  {{  scope.row.executorHandler }}</el-tag>
                    </template>
                </el-table-column>
				<el-table-column label="运行策略" prop="executorRouteStrategy" width="150"></el-table-column>
				<el-table-column label="负责人" prop="author" width="150" sortable></el-table-column>
				<el-table-column label="状态" prop="datetime" width="150" sortable>
                    <template #default="scope">
                        <el-tag v-if="scope.row.triggerStatus == 0"> 停止</el-tag>
                    </template>
                </el-table-column>
				<el-table-column label="操作" fixed="right" align="left" width="330">
					<template #default="scope">
						<el-button-group>
							<el-button text type="primary" size="small" @click="trigger(scope.row)">执行一次</el-button>
							<el-button text type="primary" size="small" @click="doLogger(scope.row)">查询日志</el-button>
							<el-button text type="primary" size="small">注册节点</el-button>
							<el-button text type="primary" size="small">下次执行时间</el-button>
						</el-button-group>
						<el-button-group>
							<el-button text type="primary" size="small">启动</el-button>
							<el-button text type="primary" size="small">编辑</el-button>
							<el-button text type="primary" size="small">删除</el-button>
							<el-button text type="primary" size="small">复制</el-button>
						</el-button-group>
					</template>
				</el-table-column>
			</scTable>
		</el-main>
	</el-container>

    <el-dialog v-model="triggerShow" :title="triggerTitle">
        <el-form :model="form" label-width="120px">
            <el-form-item label="任务参数">
                <el-input type="textarea" :rows="12" v-model="executorParam" />
            </el-form-item>
            <el-form-item label="机器地址">
                <el-input type="textarea" :rows="12" v-model="addressList" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button :loading="triggerLoadding" @click="triggerShow = false">取消</el-button>
                <el-button :loading="triggerLoadding"  type="primary" @click="triggerExecute">确定</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>

export default {
    name: "Task",
    data() {
        return {
            triggerId: undefined,
            executorParam: '',
            addressList: '',
            triggerTitle: '',
            triggerShow: !1,
            triggerLoadding: !1,
            apiObj: this.$API.scheduler.pageList,
            jobGroup: this.$API.scheduler.jobGroup,
            form: {
                triggerStatus :-1,
                jobDesc: undefined,
                jobGroup: undefined,
            },
            data: [],
            loading: false,
            executorData: [],
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
                this.$message.success(res.msg);
            }).finally(() => this.triggerLoadding = !1)
        },
        trigger(row) {
            this.triggerTitle = row.jobDesc + '(执行一次)';
            this.triggerShow = !0;
            this.triggerId = row.id;
        },
        doLogger(row){
            this.$router.push({ path: '/scheduler/joblog/'+ row.jobGroup + '/' + row.id });
        },
        async initial() {
            const res = await this.jobGroup.get();
            this.executorData = res?.data.data;
            this.form.jobGroup = this.executorData && this.executorData.length > 0 ? this.executorData[0].id : undefined
            this.search();
        },
        search(){
            this.loading = !0;
            this.$API.scheduler.pageList.get(this.form).then(res => {
                this.data = res?.data;
            }).finally(() => this.loading = !1)
        },
        filterChange(row) {
            this.from.triggerStatus = row.triggerStatus;
        }
    }
}
</script>
