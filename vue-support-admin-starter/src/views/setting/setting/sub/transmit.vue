<template>
	<el-card shadow="never" header="传输设置">
		<el-skeleton :loading="loading"></el-skeleton>
		<el-form ref="form" label-width="180px" label-position="left" style="margin-top:20px;" v-if="!loading">
			<el-form-item label="返回加密">
				<el-checkbox v-model="item.settingValue" v-for="item in data">{{ item.settingDesc }}</el-checkbox>
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
				data: [{
					settingName: 'codec_open',
					settingDesc: '返回加密'
				}]
			}
		},
		mounted(){
			this.$API.system.setting.list.get({keyword: 'codec_open'}).then(res => {
				if(res.code === '00000') {
					const tpl = {};
					res.data.forEach(e => {
						tpl[e.settingName] = e;
					})
					this.data.forEach(element => {
						element['settingDesc'] = tpl[element.settingName]['settingDesc'];
						element['settingValue'] = tpl[element.settingName]['settingValue'] == 'true' ;
					});
					
				}
			}).finally(() => this.loading = false);
		},
		methods: {
			save() {
				this.$API.system.setting.batch.post(this.data).then(res => {
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
