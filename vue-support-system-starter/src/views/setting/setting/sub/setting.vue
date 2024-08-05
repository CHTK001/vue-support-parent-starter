<template>
	<el-card shadow="never" header="系统参数">
		<el-form ref="form" label-width="120px" style="margin-top:20px;">
			<el-form-item label="Socket.IO">
				<el-checkbox v-model="item.settingValue" v-for="item in [data[0]]">{{ item.settingDesc }}</el-checkbox>
			</el-form-item>

			<el-form-item label="调试">
				<el-checkbox v-model="item.settingValue" v-for="item in [data[1]]">{{ item.settingDesc }}</el-checkbox>
			</el-form-item>
		</el-form>
		<el-form-item>
			<el-button type="primary" @click="save">保存</el-button>
		</el-form-item>
	</el-card>
</template>

<script>
	export default {
		data() {
			return {
				data: [{
					settingName: 'initial_socket',
					settingDesc: '开启',
					settingValue: !1
				}, {
					settingName: 'initial_debug',
					settingDesc: '开启',
					settingValue: !1
				}],
				loading: true
			}
		},
		watch:{
			
		},
		mounted(){
			this.$API.system.setting.list.get({keyword: 'initial_socket,initial_debug'}).then(res => {
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
