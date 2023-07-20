<template>
	<el-main style="padding:0 20px;">
		<el-descriptions :column="1" border size="small">
			<el-descriptions-item label="请求接口">{{ data.logMapping }} ( {{ data.logCost }} ms)</el-descriptions-item>
			<el-descriptions-item label="请求地址">{{ data.logAddress }}</el-descriptions-item>
			<el-descriptions-item label="请求位置">{{ data.logAddressPosition }}</el-descriptions-item>
			<el-descriptions-item label="状态代码">{{ data.logCode }}</el-descriptions-item>
			<el-descriptions-item label="日志名">{{ data.logName }}({{ data.logAction }})</el-descriptions-item>
			<el-descriptions-item label="日志时间">{{ data.createTime }}</el-descriptions-item>
		</el-descriptions>
		<el-collapse v-model="activeNames" style="margin-top: 20px;">
			<el-collapse-item title="常规" name="1">
				<el-alert :title="data.logContent" :type="typeMap[data.level]" :closable="false"></el-alert>
			</el-collapse-item>
			<el-collapse-item title="详细" name="2">
				<div class="code" ref="code" v-html="data.logWatch">
				</div>
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
			activeNames: ['1'],
			typeMap: {
				'info': "info",
				'warn': "warning",
				'error': "error"
			}
		}
	},
	methods: {
		setData(data) {
			this.data = data;
			var ansi_up = new AnsiUp();
			this.data.logWatch =  `<div>` +ansi_up.ansi_to_html(data.logWatch).replace(/\n/g, '</div><div>')
							.replace(/\s/g, '<span style="margin-left: 4px">')
							+ `</div>` 
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
}</style>
