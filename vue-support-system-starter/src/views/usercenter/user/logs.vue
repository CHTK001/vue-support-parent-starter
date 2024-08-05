<template>
	<el-card shadow="never" header="近7天操作记录">
		<scTable ref="table"  :apiObj="apiObj" height="auto" paginationLayout="total, prev, pager, next" hideDo>
			<el-table-column label="级别" prop="level" width="60">
			<template #default="scope">
				<sc-status-indicator pulse type="warning" v-if="scope.row.logCost > 1000" title="耗时超过1s"></sc-status-indicator>
				<el-icon v-else
					style="color: #409EFF;"><el-icon-info-filled /></el-icon>
			</template>
			</el-table-column> 
			<el-table-column label="ID" prop="logCode" width="180" show-overflow-tooltip></el-table-column>
			<el-table-column label="日志名" prop="logName" width="150"></el-table-column>
			<el-table-column label="请求接口" prop="logMapping"  show-overflow-tooltip></el-table-column>
			<el-table-column label="客户端IP" prop="clientIp" width="150"></el-table-column>
			<el-table-column label="访问人" prop="createName" width="150"></el-table-column>
			<el-table-column label="日志时间" prop="createTime" width="170"></el-table-column>
			<el-table-column label="耗时" prop="logCost">
				<template #default="scope">
					<el-badge v-if="scope.row.logCost > 1000">{{ scope.row.logCost}} ms</el-badge>
					<span v-else>{{ scope.row.logCost}} ms</span>
				</template>
			</el-table-column>

		</scTable>
	</el-card>
</template>

<script>
	export default {
		data() {
			return {
				apiObj: this.$API.system.log.mylog,
			}
		}
	}
</script>

<style>
</style>
