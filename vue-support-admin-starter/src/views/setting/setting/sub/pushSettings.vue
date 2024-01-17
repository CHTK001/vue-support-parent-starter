<template>
	<el-card shadow="never" header="事务待办">
		<el-skeleton :loading="loading"></el-skeleton>
		<el-form ref="form" label-width="180px" label-position="left" style="margin-top:20px;">
			<el-form-item label="有新的待办">
				<el-checkbox v-model="form.task_dx">短信推送</el-checkbox>
				<el-checkbox v-model="form.task_wx">微信推送</el-checkbox>
				<el-checkbox v-model="form.task_zn">站内推送</el-checkbox>
				<el-checkbox v-model="form.task_yj">邮件推送</el-checkbox>
			</el-form-item>
			<el-form-item>
				<el-button type="primary" @click="save">保存</el-button>
			</el-form-item>
		</el-form>
	</el-card>
</template>

<script>
	export default {
		data() {
			return {
				loading: true,
				form: {
					task_dx: false,
					task_wx: false,
					task_zn: false,
					task_yj: false,
				}
			}
		},
		mounted(){
			this.$API.system.setting.list.get({keyword: 'task_*'}).then(res => {
				if(res.code === '00000') {
					res.data.forEach(element => {
						this.form[element['settingName']] = element['settingValue'] == '1'
					});
				}
			}).finally(() => this.loading = false);
		},
		methods: {
			save() {
				const req = [];
				req.push({settingName: 'task_dx', settingValue: this.form.task_dx ? '1' : '0'});
				req.push({settingName: 'task_wx', settingValue: this.form.task_wx ? '1': '0'});
				req.push({settingName: 'task_zn', settingValue: this.form.task_zn ? '1': '0'});
				req.push({settingName: 'task_yj', settingValue: this.form.task_yj ? '1': '0'});

				this.$API.system.setting.batch.post(req).then(res => {
					if(res.code === '00000') {
						this.$message.success('保存成功');
						return;
					}
					this.$message.error(res.msg);
				})
			}
		}
	}
</script>

<style>
</style>
