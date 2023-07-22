<template>
	<el-card shadow="never" header="近7天操作记录">
		<scTable ref="table"  :apiObj="apiObj" height="auto" paginationLayout="total, prev, pager, next" hideDo>
			<sc-table-column label="序号" type="index"></sc-table-column>
			<sc-table-column label="业务名称" prop="title" min-width="240"></sc-table-column>
			<sc-table-column label="IP" prop="ip" width="150"></sc-table-column>
			<sc-table-column label="结果" prop="code" width="150">
				<el-tag type="success">成功</el-tag>
			</sc-table-column>
			<sc-table-column label="操作时间" prop="time" width="150"></sc-table-column>

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
