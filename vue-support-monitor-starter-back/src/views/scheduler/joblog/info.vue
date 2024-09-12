<template>
	<el-main style="padding:0 20px;">
		<el-descriptions :column="1" border size="small">
			<el-descriptions-item label="请求接口"><span style="color:lightblue" >(<span v-time="data.triggerTime"></span>) </span>{{ data.executorHandler }} </el-descriptions-item>
			<el-descriptions-item label="状态代码">{{ data.triggerCode }}</el-descriptions-item>
			<el-descriptions-item label="日志时间"><span v-time="data.triggerTime"></span></el-descriptions-item>
		</el-descriptions>
		<el-collapse v-model="activeNames" style="margin-top: 20px;">
			<el-collapse-item title="常规" name="1">
				<el-alert :type="typeMap['info']" :closable="false">
					<div v-html="data.triggerMsg"></div>
				</el-alert>
			</el-collapse-item>
			<el-collapse-item title="部分参数" name="2">
				<el-alert :title="data.executorParam" type="info" :closable="false" class="comment"></el-alert>
			</el-collapse-item>
		</el-collapse>
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
			logParam: undefined
		}
	},
	methods: {
		setData(data) {
			this.data = data;
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
