<template>
	<el-card shadow="never" header="系统参数">
		<el-form ref="form" label-width="120px" style="margin-top:20px;">
			<el-form-item label="Socket.IO">
				<el-checkbox v-model="data.settingValue" v-for="item in [data[0]]">{{ item.settingDesc }}</el-checkbox>
			</el-form-item>

			<el-form-item label="调试">
				<el-checkbox v-model="data.settingValue" v-for="item in [data[1]]">{{ item.settingDesc }}</el-checkbox>
			</el-form-item>
		</el-form>
	</el-card>
	<el-card shadow="never" header="个人设置" style="margin-top:20px;">
		<el-form ref="form" label-width="120px" style="margin-top:20px;">
		</el-form>
	</el-card>
</template>

<script>
	import colorTool from '@/utils/color'

	export default {
		data() {
			return {
				data: [{
					settingName: 'initial_socket',
					settingDesc: '开启'
				}, {
					settingName: 'initial_debug',
					settingDesc: '开启'
				}, {
					settingName: 'task_zn',
					settingDesc: '站内推送'
				}, {
					settingName: 'task_yj',
					settingDesc: '邮件推送'
				}]
			}
		},
		watch:{
			
		},
	}
</script>

<style>
</style>
