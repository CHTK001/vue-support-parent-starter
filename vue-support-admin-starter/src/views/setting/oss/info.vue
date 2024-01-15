<template>
	<el-main style="padding:0 20px;">
		<scTable ref="table" :initiSearch="false" :params="data" :apiObj="apiObj" stripe highlightCurrentRow >
			<el-table-column label="级别" prop="level" width="60">
			<template #default="scope">
				<sc-status-indicator pulse type="warning" v-if="scope.row.logCost > 1000" title="耗时超过1s"></sc-status-indicator>
				<el-icon v-else style="color: #409EFF;"><el-icon-info-filled /></el-icon>
			</template>
		</el-table-column> 
		<el-table-column label="ID" prop="logCode" width="180" show-overflow-tooltip></el-table-column>
		<el-table-column label="日志名" prop="logName" width="250">
			<template #default="scope">
				<sc-status-indicator pulse type="success" v-if="scope.row.logStatus == 1"></sc-status-indicator>
				<sc-status-indicator pulse type="danger" v-if="scope.row.logStatus == 0"></sc-status-indicator>
				{{ scope.row.logName }}
			</template>
		</el-table-column>
		<el-table-column label="状态" prop="logName" width="250">
			<template #default="scope">
					<el-tag v-if="scope.row.logStatus == 1" type="success">成功</el-tag>
					<el-tag v-else type="danger">失败</el-tag>
			</template>
		</el-table-column>
		<el-table-column label="动作" prop="logAction" width="150">	</el-table-column>
		<el-table-column label="请求接口" prop="logMapping"  show-overflow-tooltip></el-table-column>
		<el-table-column label="客户端IP" prop="clientIp" width="150"></el-table-column>
		<el-table-column label="访问位置" prop="clientIpPosition">
			<template #default="scope">
				<el-icon><component is="el-ci"></component></el-icon>
				<el-tag>{{ scope.row.clientIpPosition}}</el-tag>
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
</template>

<script>
export default {
	data() {
		return {
			data: {},
			activeNames: ['1', '2'],
			typeMap: {
				'info': "info",
				'warn': "warning",
				'error': "error"
			},
			logWatch: undefined,
			logParam: undefined,
			apiObj: this.$API.system.oss.list
		}
	},
	methods: {
		setData(data) {
			this.data = data;
			this.logParam = data.logParam;
			this.$refs.table.reload({fsBucket: data.fsBucket});
		}
	}
}
</script>

<style scoped>
.code {
	background: #848484;
	padding: 15px;
	color: #fff;
	font-size: 12px;
	border-radius: 4px;
}
.comment{
    white-space:pre-wrap;
}
</style>
