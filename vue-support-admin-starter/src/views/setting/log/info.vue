<template>
	<el-main style="padding:0 20px;">
		<el-descriptions :column="1" border size="small">
			<el-descriptions-item label="请求接口"><span style="color:lightblue">({{ data.logCost }} ms) </span>{{ data.logMapping }} </el-descriptions-item>
			<el-descriptions-item label="客户端地址">{{ data.clientIp }}</el-descriptions-item>
			<el-descriptions-item v-if=" data.clientIpPosition" label="客户端地址位置"><el-tag>{{ data.clientIpPosition }}</el-tag></el-descriptions-item>
			<el-descriptions-item label="状态代码">
				<sc-status-indicator pulse type="success" v-if="data.logStatus == 1"></sc-status-indicator>
				<sc-status-indicator pulse type="error" v-if="data.logStatus == 0"></sc-status-indicator>
				{{ data.logStatus == 1 ? '成功' : '失败' }}</el-descriptions-item>
			<el-descriptions-item label="日志名">{{ data.logName }}<span v-if="data.logAction">({{ data.logAction }})</span></el-descriptions-item>
			<el-descriptions-item label="日志时间">{{ data.createTime }}</el-descriptions-item>
		</el-descriptions>
		<el-collapse v-model="activeNames" style="margin-top: 20px;">
			<el-collapse-item title="常规" name="1">
				<el-alert :title="data.logContent" :type="typeMap[data.level]" :closable="false"></el-alert>
			</el-collapse-item>
			<el-collapse-item title="部分参数" name="2">
				<el-alert :title="data.logParam" type="info" :closable="false" class="comment"></el-alert>
			</el-collapse-item>
			<el-collapse-item title="详细" name="3" v-if="logWatch && logWatch != 'undefined'">
				<div class="code" ref="code" v-html="logWatch" ></div>
			</el-collapse-item>
		</el-collapse>
	</el-main>
</template>

<script>
import { default as AnsiUp } from 'ansi_up';

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
			var ansi_up = new AnsiUp();
			this.logWatch =  `<div>` +ansi_up.ansi_to_html(data.logWatch).replace(/\n/g, '</div><div>')
							.replace(/\t/g, '<span style="margin-left: 4px">')
							.replace(/&lt;/g, '<')
							.replace(/&gt;/g, '>')
							.replace(/&quot;/g, '\"')
							.replace(/&quot;/g, '\"')
							+ `</div>` ;
			this.logParam = data.logParam;
			// this.$nextTick(() => {
			// 		var newElement = document.createElement("div")
			// 		newElement.innerHTML = 
			// 			`<div>` +data.logWatch
			// 				.replace(/\\n/g, '</div><br/><div>')
			// 				.replace(/\\s/g, '<span style="margin-left: 4px">')
			// 				+ `</div>`;
			// 				debugger
			// 		this.$refs.code.append(newElement)
			// })
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
