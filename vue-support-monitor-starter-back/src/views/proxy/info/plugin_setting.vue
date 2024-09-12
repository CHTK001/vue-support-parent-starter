<template>
	<el-dialog :title="title" v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')" draggable>
		<div style="padding: 12px">
			<el-form :model="config">
				<div v-for="row in baseConfig" v-if="baseConfig.length > 0">
					<el-form-item :label="row.description || row.name" :prop="row.name">
						<el-row style="width: 100%">
							<el-col :span="12">
								<el-switch v-model="databaseConfig[row.name]" active-value="true" inactive-value="false" v-if="row.type == 'BOOLEAN'" />
								<el-input v-model="databaseConfig[row.name]" v-else-if="row.type == 'STRING'" />
								<el-input v-model="databaseConfig[row.name]" type="number" v-else-if="row.type == 'NUMBER'" />
								<el-input v-model="databaseConfig[row.name]" type="textarea" v-else-if="row.type == 'JSON'" />
							</el-col>
							<el-col :span="12">
								<el-button title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px"
									@click="saveConfig(row.name, databaseConfig[row.name], row.description, row.type)"></el-button>
							</el-col>
						</el-row>
					</el-form-item>
				</div>
			</el-form>
		</div>
	</el-dialog>
</template>

<script>

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			title: '设置',
			visible: false,
			form: {},
			form1: {},
			databaseConfig: {},
			baseConfig: {}
		}
	},
	methods: {
		afterPropertiesSet() {
			const _this = this;
			this.$API.common.option.get.get({ type: 'Y29tLmNodWEuY29tbW9uLnN1cHBvcnQuY2hhaW4uZmlsdGVyLkNoYWluRmlsdGVy', name: this.form.name }).then(res => {
				if (res.code == '00000' && res.data.length > 0) {
					this.baseConfig = res.data[0]?.describeOptional;
					this.baseConfig.forEach((item, index) => {
						if (!!_this.databaseConfig[item.name] || !item.defaultValue) {
							return;
						}
						_this.databaseConfig[item.name] = item.defaultValue;
					})
					return;
				}
			});
			this.$API.proxy_config.setting.list.get({ proxyId: this.form1.proxyId, pluginName: this.form.name, pluginSort: this.index }).then(res => {
				if (res.code == '00000') {
					res.data.forEach((item, index) => {
						_this.databaseConfig[item.pluginConfigName] = item.pluginConfigValue;
					})
					return;
				}
			});
		},
		//显示
		open(mode = 'add') {
			this.visible = true;
			this.databaseConfig = {};
			return this
		},
		//表单注入数据
		setData(form1, data, index) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			this.form1 = form1;
			this.index = index;
			Object.assign(this.form, data);
			this.title =  data.describe + ' - 设置';
			this.afterPropertiesSet();
		},
		saveConfig(key, value, desc, type) {
			if (!value) {
				return;
			}

			this.$API.proxy_config.setting.save.post({
				proxyId: this.form1.proxyId,
				pluginName: this.form.name,
				pluginSort: this.index,
				pluginConfigName: key,
				pluginConfigValue: value,
				pluginConfigType: type
			}).then(res => {
				if (res.code === '00000') {
					this.$message.success("保存成功");
					return;
				}
				this.$message.error(res.msg);
			})
		}
	}
}
</script>

<style lang="less">
.filter {
	width: 100%;
	height: 40px;
	line-height: 40px;
	margin-top: 8px;
	background-color: white;
	box-shadow: 1px 4px 5px 2px #999;
	text-align: center;
}

::deep(.redis path) {
	fill: red
}
</style>
