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
							<sc-select-filter :data="data"  :label-width="80" @on-change="change"></sc-select-filter>
						</div>
						<div class="right-panel">
							<div class="right-panel-search">
								<el-date-picker v-model="date" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
								<el-select v-model="search.jobLogTriggerCode" clearable>
									<el-option value="1" label="成功"></el-option>
									<el-option value="0" label="失败"></el-option>
								</el-select>
								<el-select allow-create filterable v-model="search.jobLogApp">
									<el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
								</el-select>
								<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
							</div>
						</div>
					</el-header>
					<el-header style="height:150px;">
						<scEcharts height="100%" :option="logsChartOption"></scEcharts>
					</el-header>
					<el-main class="nopadding">
						<scTable ref="table" :params="search" :apiObj="apiObj" stripe highlightCurrentRow >
							 <el-table-column label="级别" prop="level" width="60">
								<template #default="scope">
									<sc-status-indicator pulse type="warning" v-if="scope.row.logCost > 1000" title="耗时超过1s"></sc-status-indicator>
									<el-icon v-else style="color: #409EFF;"><el-icon-info-filled /></el-icon>
								</template>
							</el-table-column> 
							<el-table-column label="触发时间" prop="jobLogTriggerTime"  show-overflow-tooltip>
								<template #default="scope">
									<span v-time="scope.row.jobLogTriggerTime" />
								</template>
							</el-table-column>
							<el-table-column label="触发应用" prop="jobLogApp" show-overflow-tooltip></el-table-column>
							<el-table-column label="环境" prop="jobLogProfile" show-overflow-tooltip></el-table-column>
							<el-table-column label="执行对应的标识" prop="jobLogTriggerBean" show-overflow-tooltip></el-table-column>
							<el-table-column label="触发地址" prop="jobLogTriggerAddress" show-overflow-tooltip></el-table-column>
							<el-table-column label="触发类型" prop="jobLogTriggerType" show-overflow-tooltip></el-table-column>
							<el-table-column label="状态" prop="jobLogTriggerCode">
								<template #default="scope">
									 <el-tag v-if="scope.row.jobLogTriggerCode == '00000'" type="success">成功</el-tag>
									 <el-tag v-else type="danger">失败</el-tag>
									</template>
							</el-table-column>
							<el-table-column label="客户端执行任务的结果" prop="jobLogExecuteCode" ></el-table-column>
							<el-table-column label="触发消息" prop="jobLogTriggerMsg" show-overflow-tooltip></el-table-column>
							<el-table-column label="日志时间" prop="createTime"></el-table-column>
						</scTable>
					</el-main>
				</el-container>
			</el-main>
		</el-container>
	</el-container>

	<el-drawer v-model="infoDrawer" title="日志详情" :size="800" destroy-on-close>
		<info ref="info"></info>
	</el-drawer>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import info from './info.vue'
import scEcharts from '@/components/scEcharts/index.vue'

export default {
	name: 'log',
	components: {
		info,
		scEcharts,
		scSelectFilter
	},
	data() {
		return {
			profiles: [{
                label: "全部",
                value: ""
            },
            {
                label: "生产",
                value: "prod"
            },
            {
                label: "开发",
                value: "dev"
            },
            {
                label: "测试",
                value: "test"
            },],
			clickEye: {},
			clickEyeLoading: {},
			clickEyeValue: {},
			infoDrawer: false,
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
					type: 'bar',
					stack: 'log',
					barWidth: '15px'
				},{
					data: [],
					type: 'bar',
					stack: 'log',
					barWidth: '15px'
				}]
			},
			category: [
			],
			date: [],
			apiObj: this.$API.monitor.job.log.page,
			search: {
				keyword: ""
			},
			pastWeek: [],
			data: [
                {
                    title: "环境",
                    key: "jobLogProfile",
                    multiple: !1,
                    options: [

                    ]
                },

            ],
			apps: []
		}
	},
	watch: {
		date(v) {
			if(v.length) {
				this.search.startDate = v[0];
				this.search.endDate = v[1];
			}
		}
	},
	created(){
		this.data[0].options = this.profiles;
		this.pastWeek = this.$TOOL.date.getDateRang('pastWeekHour');
		this.date = this.pastWeek;
	},
	mounted: function () {
		this.logsChartOption.xAxis.data.length = 0;
		this.logsChartOption.xAxis.data = [];
		for(let i = 0; i < 7; i ++) {
			const date = new Date(this.pastWeek[0]);
			date.setDate(date.getDate() + i);
			this.logsChartOption.xAxis.data.push(this.$TOOL.dateFormat(date, 'yyyy-MM-dd'));
		}
		this.$API.monitor.job.log.time.get(this.search).then(res => {
			if(res.code === '00000') {
				this.logsChartOption.series[0].data = res.data.successCount;
				this.logsChartOption.series[1].data = res.data.failureCount;
			}
		});
		this.afterPrepertiesSet();
	},
	methods: {
		async afterPrepertiesSet(){
            this.$API.monitor.app.list.get().then(res => {
                if(res.code === '00000') {
                    this.apps = res.data;
                }
            });
        },
		upsearch() {
			this.$refs.table.reload(this.search)
		},
		rowClick(row) {
			this.infoDrawer = true
			this.$nextTick(() => {
				this.$refs.info.setData(row)
			})
		},
		change(selected) {
            this.search.jobLogProfile = selected.jobLogProfile;
            this.upsearch();
        }
	}
}
</script>

<style></style>
