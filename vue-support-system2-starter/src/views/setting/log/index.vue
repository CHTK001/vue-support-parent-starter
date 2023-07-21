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
							<el-date-picker v-model="date" type="datetimerange" range-separator="至" start-placeholder="开始日期"
								end-placeholder="结束日期"></el-date-picker>
						</div>
						<div class="right-panel">
							<div class="right-panel-search">
								<el-select v-model="search.logStatus" clearable>
									<el-option :value="1" label="成功"></el-option>
									<el-option :value="0" label="失败"></el-option>
								</el-select>
								<el-input v-model="search.keyword" placeholder="关键词" clearable></el-input>
								<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
							</div>
						</div>
					</el-header>
					<el-header style="height:150px;">
						<scEcharts height="100%" :option="logsChartOption"></scEcharts>
					</el-header>
					<el-main class="nopadding">
						<scTable ref="table" :apiObj="apiObj" stripe highlightCurrentRow @row-click="rowClick">
							 <el-table-column label="级别" prop="level" width="60">
								<template #default="scope">
									<sc-status-indicator pulse type="warning" v-if="scope.row.logCost > 1000" title="耗时超过1s"></sc-status-indicator>
									<el-icon v-else
										style="color: #409EFF;"><el-icon-info-filled /></el-icon>
								</template>
							</el-table-column> 
							<el-table-column label="ID" prop="logCode" width="180" show-overflow-tooltip></el-table-column>
							<el-table-column label="日志名" prop="logName" width="150"></el-table-column>
							<el-table-column label="动作" prop="logAction" width="150">	</el-table-column>
							<el-table-column label="请求接口" prop="logMapping"  show-overflow-tooltip></el-table-column>
							<el-table-column label="客户端IP" prop="logAddress" width="150"></el-table-column>
							<el-table-column label="访问位置" prop="logAddressPosition">
								<template #default="scope">
									<el-tag>{{ scope.row.logAddressPosition}}</el-tag>
								</template>
							</el-table-column>
							<el-table-column label="访问人" prop="createName" width="150"></el-table-column>
							<el-table-column label="日志时间" prop="createTime" width="170"></el-table-column>
							<el-table-column label="耗时" prop="logCost">
								<template #default="scope">
									<el-badge v-if="scope.row.logCost > 1000">{{ scope.row.logCost}} ms</el-badge>
									<span v-else>{{ scope.row.logCost}} ms</span>
								</template>
							</el-table-column>
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
import info from './info.vue'
import scEcharts from '@/components/scEcharts/index.vue'

export default {
	name: 'log',
	components: {
		info,
		scEcharts
	},
	data() {
		return {
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
				// {
				// 	label: '系统日志',
				// 	children: [
				// 		{ label: 'debug' },
				// 		{ label: 'info' },
				// 		{ label: 'warn' },
				// 		{ label: 'error' },
				// 		{ label: 'fatal' }
				// 	]
				// },
				// {
				// 	label: '应用日志',
				// 	children: [
				// 		{ label: 'selfHelp' },
				// 		{ label: 'WechatApp' }
				// 	]
				// }
			],
			date: [],
			apiObj: this.$API.system.log.page,
			search: {
				keyword: ""
			}
		}
	},
	mounted: function () {
		const pastWeek = this.$TOOL.date.getDateRang('pastWeek');
		this.logsChartOption.xAxis.data.length = 0;
		this.logsChartOption.xAxis.data = [];
		for(let i = 0; i < 7; i ++) {
			const date = new Date(pastWeek[0]);
			date.setDate(date.getDate() + i);
			this.logsChartOption.xAxis.data.push(this.$TOOL.dateFormat(date, 'yyyy-MM-dd'));
		}
		this.$API.system.log.near.get().then(res => {
			if(res.code === '00000') {
				this.logsChartOption.series[0].data = res.data.success;
				this.logsChartOption.series[1].data = res.data.failure;
			}
		})
	},
	methods: {
		upsearch() {
			if(this.date.length) {
				this.search.startTime = this.date[0];
				this.search.endTime = this.date[1];
			}
			this.$refs.table.reload(this.search)
		},
		rowClick(row) {
			this.infoDrawer = true
			this.$nextTick(() => {
				this.$refs.info.setData(row)
			})
		}
	}
}
</script>

<style></style>
