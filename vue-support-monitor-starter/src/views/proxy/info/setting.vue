<template>
	<el-drawer direction="rtl" size="40%" :destroy-on-close="true" :close-on-click-modal="true" title="详情" v-model="visible" width="600" class="bg-blue-gray-50/50" style="background-color: #f6f8f9;" destroy-on-close @closed="$emit('closed')">

		<el-skeleton :loading="loadding" animated :count="6"></el-skeleton>
		<div style="padding: 12px" v-if="!loadding">
			<div style="font-size: 13px; color: #999; margin-left: 1%;">基本参数</div>
			<el-divider></el-divider>
			<el-form :model="config">
				<el-form-item label="发现服务">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-select v-if="form.proxyStatus == 0" v-model="databaseConfig.serviceDiscovery" placeholder="请选择发现服务" style="width: 100%;">
								<el-option :label="item.describe || item.name" :value="item.name" v-for="item in serviceDiscoveryList"></el-option>
							</el-select>
							<el-input v-else v-model="databaseConfig.serviceDiscovery" readonly disabled></el-input>
						</el-col>
						<el-col :span="12">
							<el-button v-if="form.proxyStatus == 0" title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfigItem(databaseConfig.serviceDiscovery, 'serviceDiscovery')"></el-button>
						</el-col>
					</el-row>
				</el-form-item>

				<el-form-item label="负载均衡">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-select v-model="databaseConfig.balance" placeholder="请选择负载均衡" style="width: 100%;">
								<el-option :label="item.describe || item.name" :value="item.name" v-for="item in robinList"></el-option>
							</el-select>
						</el-col>
						<el-col :span="12">
							<el-button title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfigItem(databaseConfig.balance, 'balance')"></el-button>
						</el-col>
					</el-row>
				</el-form-item>
				<div style="font-size: 13px; color: #999; margin-left: 1%;">功能参数</div>
				<el-divider></el-divider>
				<el-form-item label="开启日志">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-switch :disabled="form.proxyStatus == 0" :readonly="form.proxyStatus == 0" v-model="databaseConfig['open-log']" active-value="true" inactive-value="false"></el-switch>
						</el-col>
						<el-col :span="12">
							<el-button v-if="form.proxyStatus == 0" title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfig('open-log', databaseConfig['open-log'], '开启日志')"></el-button>
						</el-col>
					</el-row>
				</el-form-item>

				<el-form-item label="黑名单限流">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-switch :disabled="form.proxyStatus == 0" :readonly="form.proxyStatus == 0" v-model="databaseConfig['open-black']" active-value="true" inactive-value="false"></el-switch>
						</el-col>
						<el-col :span="12">
							<el-button v-if="form.proxyStatus == 0" title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfig('open-black', databaseConfig['open-black'], '开启黑名单')"></el-button>
							<el-button v-if="databaseConfig['open-black'] == 'true'" title="配置" type="default" icon="el-icon-setting" style="margin-left:10px" @click="openSetting('list', 1)"></el-button>
						</el-col>
					</el-row>
				</el-form-item>

				<el-form-item label="白名单限流">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-switch :disabled="form.proxyStatus == 0" :readonly="form.proxyStatus == 0" v-model="databaseConfig['open-white']" active-value="true" inactive-value="false"></el-switch>
						</el-col>
						<el-col :span="12">
							<el-button v-if="form.proxyStatus == 0" title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfig('open-white', databaseConfig['open-white'], '开启白名单')"></el-button>
							<el-button v-if="databaseConfig['open-white'] == 'true'" title="配置" type="default" icon="el-icon-setting" style="margin-left:10px" @click="openSetting('list', 0)"></el-button>
						</el-col>
					</el-row>
				</el-form-item>

				<el-form-item label="IP地址限流">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-switch :disabled="form.proxyStatus == 0" :readonly="form.proxyStatus == 0" v-model="databaseConfig['open-ip-limit']" active-value="true" inactive-value="false"></el-switch>
						</el-col>
						<el-col :span="12">
							<el-button v-if="form.proxyStatus == 0" title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfig('open-ip-limit', databaseConfig['open-ip-limit'], '开启IP限流')"></el-button>
							<el-button v-if="databaseConfig['open-ip-limit'] == 'true'" title="配置" type="default" icon="el-icon-setting" style="margin-left:10px" @click="openSetting('limit', 1)"></el-button>

						</el-col>
					</el-row>
				</el-form-item>

				<el-form-item label="请求地址限流">
					<el-row style="width: 100%">
						<el-col :span="12">
							<el-switch :disabled="form.proxyStatus == 0" :readonly="form.proxyStatus == 0" v-model="databaseConfig['open-url-limit']" active-value="true" inactive-value="false"></el-switch>
						</el-col>
						<el-col :span="12">
							<el-button v-if="form.proxyStatus == 0" title="保存" type="primary" icon="el-icon-lock" style="margin-left:10px" @click="saveConfig('open-url-limit', databaseConfig['open-url-limit'], '开启地址限流')"></el-button>
							<el-button v-if="databaseConfig['open-url-limit'] == 'true'" title="配置" type="default" icon="el-icon-setting" style="margin-left:10px" @click="openSetting('limit', 0)"></el-button>
						</el-col>
					</el-row>
				</el-form-item>

			</el-form>
			<el-divider></el-divider>
			<div>
				<el-row style="width: 100%; max-height: 400px; overflow-y: auto;">
					<el-col :span="12" style="width: 100%;">
						<div>支持的过滤器</div>
						<div v-for="item in filters" style="width: 100%;">
							<el-row v-if="item.name !== 'SERVICEDISCOVERY'">
								<el-col :span="20">
									<el-button style="width: 100%;">{{ item.describe || item.name }}</el-button>
								</el-col>
								<el-col :span="4">
									<el-icon v-if="form.proxyStatus == 0" style="font-size: 16px; top: 8px; left: 6px;" @click="doAddFilter(item)">
										<component is="el-icon-plus"></component>
									</el-icon>
								</el-col>
							</el-row>
						</div>
					</el-col>
					<el-col :span="12" style="width: 100%;" id="sorted">
						<div>已选择<el-button v-if="form.proxyStatus == 0" class="pull-right" title="保存" type="primary" icon="el-icon-lock" @click="saveUpload"></el-button></div>
						<div ref="node">
							<div v-for="(item, index) in saveFilter" style="width: 100%;">
								<el-row>
									<el-col :span="20">
										<el-button style="width: 100%;" @click="showDetail(form, item, index)">{{ item.describe || item.name }}</el-button>
									</el-col>
									<el-col :span="4" v-if="form.proxyStatus == 0">
										<el-icon style="font-size: 16px; top: 8px; left: 6px;" @click="doDeleteFilter(index)">
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
	<limit-layout v-if="limitLayoutVisiable" ref="limitLayoutRef"></limit-layout>
	<list-layout v-if="listLayoutVisiable" ref="listLayoutRef"></list-layout>
</template>

<script>
import Base64 from "@/utils/base64";
import SettingDialog from "./plugin_setting.vue";
import Sortable from "sortablejs"; //引入下载的插件
import { defineAsyncComponent } from "vue";

import LimitLayout from "../limit/index.vue";
import ListLayout  from "../list/index.vue";

export default {
	emits: ['success', 'closed'],
	components: { SettingDialog, LimitLayout, ListLayout},
	data() {
		return {
			loadding: true,
			limitLayoutVisiable: false,
			listLayoutVisiable: false,
			title: '详情',
			mode: '',
			visible: false,
			settingDialogStatus: false,
			appName: '',
			form: {},
			baseConfig: [],
			databaseConfig: {},
			filters: [],
			allFilters: [],
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
			const val = this.saveFilter.push(item);
			this.saveFilterCopy.push(item);
			this.filters = this.filters.filter(it => it.name != item.name);
		},
		doDeleteFilter(index) {
			const val = this.saveFilter.splice(index, 1);
			this.saveFilterCopy.splice(index, 1);
			this.filters.push(val[0])
		},
		async afterPropertiesSet() {
			var _this = this;
			this.baseConfig.length = 0;
			this.serviceDiscoveryList = (await this.$API.spi.objects.get({ type: 'serviceDiscovery' }))?.data || [];
			this.allFilters = (await this.$API.spi.get.get({ type: 'filter' }))?.data || [];
			this.pullSort();
			this.robinList = (await this.$API.spi.get.get({ type: 'robin' }))?.data || [];

			const config = (await this.$API.proxy_config.list.get(this.form))?.data || [];
			config.forEach((item, index) => {
				_this.databaseConfig[item.configName] = item.configValue;
			})

			this.$API.proxy_config.filter.list.get(this.form).then(res => {
				if (res.code == '00000') {
					this.saveFilter.length = 0;
					this.saveFilterCopy.length = 0;
					res.data.forEach(item => {
						this.saveFilter.push({ name: item.pluginName, describe: item.pluginDesc })
						this.saveFilterCopy.push({ name: item.pluginName, describe: item.pluginDesc });
						this.filters = this.allFilters.filter(it => it.name != item.pluginName);
					});
					return;
				}
			}).finally(() => this.loadding = false);

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
			try {
				this.loadding = true;
				this.afterPropertiesSet();
			} catch (error) {
				this.loadding = false;
			}
		},
		saveConfigItem(value, type) {
			if (!value) {
				return;
			}

			if (type == 'serviceDiscovery') {
				const item = this.serviceDiscoveryList.filter(it => it.name == value)?.[0]
				this.saveConfig(type, item?.name, item?.describe);
				return;
			}

			if (type == 'balance') {
				const item = this.robinList.filter(it => it.name == value)?.[0]
				this.saveConfig(type, item?.name, item?.describe);
				return;
			}
		},
		openSetting(type, value) {
			if(type == 'limit') {
				this.limitLayoutVisiable = true;
				this.$nextTick(() => {
					this.$refs.limitLayoutRef.setData(this.form, value).open();
				})
				return false;
			}
			if(type == 'list') {
				this.listLayoutVisiable = true;
				this.$nextTick(() => {
					this.$refs.listLayoutRef.setData(this.form, value).open();
				})
				return false;
			}
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
}
</style>
