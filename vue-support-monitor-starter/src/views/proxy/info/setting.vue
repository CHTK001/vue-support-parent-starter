<template>
	<el-drawer direction="rtl" size="40%" :destroy-on-close="true" :close-on-click-modal="true" title="详情" v-model="visible"
		width="600" class="bg-blue-gray-50/50" style="background-color: #f6f8f9;" destroy-on-close
		@closed="$emit('closed')">

		<div style="padding: 12px">
			<div style="font-size: 13px; color: #999; margin-left: 1%;">基本参数</div>
			<el-divider></el-divider>
			<el-form :model="config">
				<div v-for="row in baseConfig" v-if="baseConfig.length > 0">
					<el-form-item :label="row?.description || row.name" :prop="row.name">
						<el-row style="width: 100%">
							<el-col :span="12">
								<el-switch v-model="databaseConfig[row.name]" active-value="true" inactive-value="false"
									v-if="databaseConfig[row.name] === 'false' || databaseConfig[row.name] === 'true'" />
								<el-input v-model="databaseConfig[row.name]"
									v-else-if="row.name != 'balance' && row.name != 'serviceDiscovery'" />
								<el-select v-model="databaseConfig[row.name]" v-else-if="row.name == 'balance'">
									<el-option :label="item.describe || item.name" :value="item.name"
										v-for="item in robinList"></el-option>
								</el-select>
								<el-select v-model="databaseConfig[row.name]" v-else-if="row.name == 'serviceDiscovery'">
									<el-option :label="item.describe || item.name" :value="item.name"
										v-for="item in serviceDiscoveryList"></el-option>
								</el-select>
							</el-col>
							<el-col :span="12">
								<el-button title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px"
									@click="saveConfig(row.name, databaseConfig[row.name], row?.description)"></el-button>
							</el-col>
						</el-row>
					</el-form-item>
				</div>
			</el-form>
			<el-divider></el-divider>
			<div>
				<el-row style="width: 100%; max-height: 400px; overflow-y: auto;">
					<el-col :span="12" style="width: 100%;">
						<div>支持的过滤器</div>
						<div v-for="item in filters" style="width: 100%;">
							<el-row>
								<el-col :span="20">
									<el-button style="width: 100%;">{{ item.describe || item.name }}</el-button>
								</el-col>
								<el-col :span="4">
									<el-icon style="    font-size: 16px; top: 8px; left: 6px;" @click="doAddFilter(item)">
										<component is="el-icon-plus"></component>
									</el-icon>
								</el-col>
							</el-row>
						</div>
					</el-col>
					<el-col :span="12" style="width: 100%;" id="sorted">
						<div>已选择<el-button icon="el-icon-upload" size="small" @click="saveUpload"></el-button></div>
						<div ref="node">
							<div v-for="(item, index) in saveFilter" style="width: 100%;">
								<el-row>
									<el-col :span="20">
										<el-button style="width: 100%;" @click="showDetail(form, item, index)">{{ item.describe || item.name }}</el-button>
									</el-col>
									<el-col :span="4">
										<el-icon style="font-size: 16px; top: 8px; left: 6px;"
											@click="doDeleteFilter(index)">
											<component is="el-icon-close"></component>
										</el-icon>
									</el-col>
								</el-row>
							</div>
						</div>
					</el-col>
				</el-row>
			</div>
		</div>
	</el-drawer>

	<SettingDialog ref="settingDialog" v-if="settingDialogStatus"></SettingDialog>
</template>

<script>
import Base64 from "@/utils/base64";
import SettingDialog from "./plugin_setting.vue";
import Sortable from "sortablejs"; //引入下载的插件

export default {
	emits: ['success', 'closed'],
	components:{SettingDialog},
	data() {
		return {
			title: '详情',
			mode: '',
			visible: false,
			settingDialogStatus: false,
			appName: '',
			form: {},
			baseConfig: [],
			databaseConfig: {},
			filters: [],
			config: [],
			serviceDiscoveryList: [],
			robinList: [],
			saveFilter: [],
			saveFilterCopy: []
		}
	},
	methods: {
		//表格拖动排序方法
		pullSort() {
			// 通过ref获取Dom节点
			const _this = this;
			this.$nextTick(() => {
				const el = _this.$refs.node;
				this.sortable = Sortable.create(el, {
					animation: 600, //拖拽动画(毫秒)
					setData: function (dataTransfer) {
						dataTransfer.setData("Text", "");
					},
					// 结束拖拽
					onEnd: (e) => {
						this.swapElements(e.oldIndex, e.newIndex);
						return false;
					},
				});
			});
		},
		showDetail(form, item, index) {
			this.settingDialogStatus = true;
			this.$nextTick(() => {
				this.$refs.settingDialog.open().setData(form, item, index);
			})
		},
		swapElements(indexA, indexB) {
			const temp = this.saveFilterCopy[indexA];
			this.saveFilterCopy[indexA] = this.saveFilterCopy[indexB];
			this.saveFilterCopy[indexB] = temp;
			return false;
		},
		saveUpload() {
			const req = [];
			this.saveFilterCopy.forEach((item, index) => {
				req.push({
					proxyId: this.form.proxyId,
					pluginName: item.name,
					pluginDesc: item.describe,
					pluginSort: index
				})
			})
			this.$API.proxy_config.filter.save.post(JSON.stringify(req)).then(res => {
				if (res.code == '00000') {
					this.$message.success("操作成功");
					return;
				}
				this.$message.error(res.msg)
			});
		},
		doAddFilter(item) {
			this.saveFilter.push(item);
			this.saveFilterCopy.push(item);
		},
		doDeleteFilter(index) {
			this.saveFilter.splice(index, 1);
			this.saveFilterCopy.splice(index, 1);
		},
		afterPropertiesSet() {

			this.$API.proxy_config.list.get(this.form).then(res => {
				if (res.code == '00000') {
					var _this = this;
					res.data.forEach((item, index) => {
						_this.databaseConfig[item.configName] = item.configValue;
					})
					this.$API.common.option.get.get({ type: 'Y29tLmNodWEuY29tbW9uLnN1cHBvcnQucHJvdG9jb2wuU2VydmVy', name: this.form.proxyProtocol }).then(res => {
						if (res.code == '00000') {
							this.baseConfig = res.data[0]?.describeOptional || [];
							this.baseConfig.push({
								name: 'open-log',
								description: '系统日志',
								defaultValue: 'false'
							})
							this.baseConfig.push({
								name: 'open-limit',
								description: '防火墙',
								defaultValue: 'false'
							})
							this.$API.common.option.objects.get({ type: 'Y29tLmNodWEuY29tbW9uLnN1cHBvcnQuZGlzY292ZXJ5LlNlcnZpY2VEaXNjb3Zlcnk=' }).then(res => {
								if (res.code == '00000') {
									this.serviceDiscoveryList = res.data;
									this.baseConfig.push({
										name: 'serviceDiscovery',
										description: '发现服务',
										defaultValue: this.serviceDiscoveryList.length == 1 ? this.serviceDiscoveryList[0].name : ''
									})
									_this.databaseConfig['serviceDiscovery'] = this.serviceDiscoveryList.length == 1 ? this.serviceDiscoveryList[0].name : ''
									return;
								}
							});
							this.baseConfig.forEach((item, index) => {
								if (!!_this.databaseConfig[item.name] || !item.defaultValue) {
									return;
								}
								_this.databaseConfig[item.name] = item.defaultValue;
							})
							return;
						}
					});


					this.$API.common.option.get.get({ type: 'Y29tLmNodWEuY29tbW9uLnN1cHBvcnQuY2hhaW4uZmlsdGVyLkNoYWluRmlsdGVy', name: this.form.proxyProtocol }).then(res => {
						if (res.code == '00000') {
							this.filters = res.data;
							this.pullSort();
							return;
						}
					});
					return;
				}
			});


			this.$API.common.option.get.get({ type: 'Y29tLmNodWEuY29tbW9uLnN1cHBvcnQubGFuZy5yb2Jpbi5Sb2Jpbg==' }).then(res => {
				if (res.code == '00000') {
					this.robinList = res.data;
					return;
				}
			});
			this.$API.proxy_config.filter.list.get(this.form).then(res => {
				if (res.code == '00000') {
					this.saveFilter.length = 0;
					this.saveFilterCopy.length = 0;
					 res.data.forEach(item => {
						this.saveFilter.push({name: item.pluginName, describe: item.pluginDesc })
						this.saveFilterCopy.push({name: item.pluginName, describe: item.pluginDesc })
					 });
					return;
				}
			});

		},
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.visible = true;
			return this
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			this.afterPropertiesSet();
		},
		saveConfig(key, value, desc) {
			if (!value) {
				return;
			}

			this.$API.proxy_config.save.post({
				proxyId: this.form.proxyId,
				configName: key,
				configValue: value,
				configDesc: desc
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
}</style>
