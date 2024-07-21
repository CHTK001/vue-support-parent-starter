<template>
	<div style="height: 90vh;">
		<el-tabs v-model="activeName" class="demo-tabs" tab-position="left">
			<el-tab-pane label="控制面板" name="board">
				<el-container style="overflow: hidden;">
					<el-aside>
						<el-container>
							<el-main>
								<el-row style="margin-bottom: 12px;">
									<el-col :span="18">
										<el-input v-model="form.keyword" placeholder="数据库过滤条件"></el-input>
									</el-col>
									<el-col :span="6">
										<el-button plain text :loading="isLoadDatabase" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
									</el-col>
								</el-row>
								<el-tree ref="table" :filter-node-method="filterNode" style="height: 83vh" :data="data" :load="loadNode" :lazy="true" :expand-on-click-node="false" :props="defaultProps" :params="form" row-key="name" default-expanded-keys="table" border stripe @node-click="nodeClick">
									<template #default="{ node, data }">
										<span class="custom-tree-node show-hide" :title="data.desc">
											<span class="custom-icon">
												<el-icon>
													<component v-if="data.type == 'DATABASE'" is="sc-icon-database" />
													<component v-else-if="data.type == 'TABLE'" is="sc-icon-table" />
													<component v-else-if="data.type == 'VIEW'" is="sc-icon-view" />
													<component v-else is="el-icon-tickets" />
												</el-icon></span>
											<span class="custom-content"><el-tag type="primary" v-if="data.type == 'COLUMN'" style="margin-right: 5px; width: 60px">{{ data.subType }}</el-tag>
												<el-tooltip class="box-item" effect="dark" :content="node.label || data.name">
													{{ node.label || data.name }}
												</el-tooltip>
											</span>
											<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks }}</span>
											<el-button class="op" plain text :loading="isSave" icon="el-icon-plus" size="small" @click.prevent="doSave(data)"></el-button>

											<span style="position: absolute;right:10px;z-index: 9999; display: none;">
												<el-button class="op" plain text :loading="isSave" icon="el-icon-plus" size="small" @click.prevent="doSave(data)"></el-button>
												<el-button class="op" v-if="data.type === 'TABLE'" plain text :loading="isSave" icon="el-icon-minus" size="small" @click.prevent="doDel(data)"></el-button>
											</span>
										</span>
									</template>
								</el-tree>
							</el-main>
						</el-container>
					</el-aside>
					<drag-layout id="vertical-drag-bar" height="calc(90vh)"></drag-layout>
					<el-main class="nopadding">
						<div class="code-toolbar">
							<el-button plain text :loading="isSave" icon="el-icon-plus" @click="doSave">新增</el-button>
							<el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button>
							<el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
							<el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button>
							<el-button plain text icon="el-icon-warning" @click="doLog">日志</el-button>
							<el-button plain text>
								<span>返回数量：</span>
								<el-select v-model="form.pageSize" placeholder="返回数量" clearable>
									<el-option :key="10" label="10条数据" :value="10" />
									<el-option :key="100" label="100条数据" :value="100" />
									<el-option :key="1000" label="1000条数据" :value="1000" />
								</el-select>
							</el-button>
							<el-button plain text v-if="clickDataType == 'STRING'">
								<el-select v-model="formatType" placeholder="返回数量">
									<el-option label="文本" value="TEXT" />
									<el-option label="JSON" value="JSON" />
								</el-select>
							</el-button>
						</div>
						<div class="code-toolbar">
							<el-row>
								<el-col :span="2">
									<el-tag style="font-size: 14px; padding: 10px; height: 100%; ">{{ clickDataType }}</el-tag>
								</el-col>
								<el-col :span="18">
									<el-input v-model="clickData"></el-input>
								</el-col>
								<el-col :span="4">
									<el-input v-model="clickTtl">
										<template #append>s</template>
									</el-input>
								</el-col>
							</el-row>
						</div>
						<div style="height: calc(90% - 80px); width: 100%">
							<div v-if="clickDataType == 'HASH'">
								<el-button icon="el-icon-plus" size="small" type="primary" style="margin: 10px" @click="() => mapVisiable = true"></el-button>
								<el-table :data="returnResult" border style="width: 100%">
									<el-table-column prop="name" label="字段" width="180"></el-table-column>
									<el-table-column prop="value" label="值"></el-table-column>
									<el-table-column label="操作">
										<template #default="scope">
											<el-button icon="el-icon-delete" size="small" type="danger" @click="doDelItem(node, scope.row.name)"></el-button>
										</template>
									</el-table-column>
								</el-table>
								<el-dialog v-model="mapVisiable" title="新增值" draggable width="400px">
									<el-form-item label="键">
										<el-input v-model="mapKey"></el-input>
									</el-form-item>

									<el-form-item label="值">
										<el-input v-model="mapValue"></el-input>
									</el-form-item>
									<template #footer>
										<el-button type="primary" @click="doAddItem(node, mapKey, mapValue)">确定</el-button>
									</template>
								</el-dialog>
							</div>

							<div v-else-if="clickDataType == 'LIST' || clickDataType == 'SET'">
								<el-button icon="el-icon-plus" size="small" type="primary" style="margin: 10px" @click="() => listVisiable = true"></el-button>
								<el-table :data="returnResult" border>
									<el-table-column prop="value" label="值"></el-table-column>
									<el-table-column label="操作">
										<template #default="scope">
											<el-button icon="el-icon-delete" size="small" type="danger" @click="doDelItem(node, scope.row.value)"></el-button>
										</template>
									</el-table-column>
								</el-table>
								<el-dialog v-model="listVisiable" title="新增值" draggable width="400px">
									<el-input v-model="listValue"></el-input>
									<template #footer>
										<el-button type="primary" @click="doAddItem(node, listValue)">确定</el-button>
									</template>
								</el-dialog>
							</div>

							<div v-else style="height: 100%; width: 100%">
								<json-viewer style="height: 100%; width: 100%; display: block; overflow: auto" :expand-depth=4 :value="formToJSON(returnResult)" copyable boxed sort v-if="formatType == 'JSON'" />
								<el-input type="textarea" v-model="returnResult" :rows="30" v-else></el-input>
							</div>
						</div>
					</el-main>

				</el-container>
			</el-tab-pane>
			<el-tab-pane label="执行面板" name="work">
				<el-container style="overflow: hidden;">
					<el-aside>
						<el-container>
							<el-main>
								<el-row style="margin-bottom: 12px;">
									当前数据库: {{ clickDatabase }} <span >本次查询耗时: {{ workResultCost }}ms</span>
								</el-row>
								<el-tree ref="table" :filter-node-method="filterNode" style="height: 83vh" :data="data" :lazy="false" :expand-on-click-node="false" :props="defaultProps" :params="form" row-key="name" default-expanded-keys="table" border stripe @node-click="nodeClick">
									<template #default="{ node, data }">
										<span class="custom-tree-node show-hide" :title="data.desc">
											<span class="custom-icon">
												<el-icon>
													<component v-if="data.type == 'DATABASE'" is="sc-icon-database" />
													<component v-else-if="data.type == 'TABLE'" is="sc-icon-table" />
													<component v-else-if="data.type == 'VIEW'" is="sc-icon-view" />
													<component v-else is="el-icon-tickets" />
												</el-icon></span>
											<span class="custom-content"><el-tag type="primary" v-if="data.type == 'COLUMN'" style="margin-right: 5px; width: 60px">{{ data.subType }}</el-tag>
												<el-tooltip class="box-item" effect="dark" :content="node.label || data.name">
													{{ node.label || data.name }}
												</el-tooltip>
											</span>
											<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks }}</span>
										</span>
									</template>
								</el-tree>
							</el-main>
						</el-container>
					</el-aside>
					<el-main class="nopadding">
						<div class="code-toolbar1">
							<el-row>
								<el-col :span="23">
									<el-input v-model="workText" type="textarea" :rows="6" resize="none"></el-input>
								</el-col>
								<el-col :span="1">
									<el-button size="large" style="margin-left: 2px; height: 100%" icon="el-icon-search" type="primary" @click="doWorkSearch"></el-button>
								</el-col>
							</el-row>
						</div>

						<div style="height: calc(90% - 80px); width: 100%">
							<div v-if="workResultType == 'HASH'">
								<div v-if="workResult && workResult instanceof Array">
									<el-table :data="workResult" border style="width: 100%">
										<el-table-column prop="name" label="字段" width="180"></el-table-column>
										<el-table-column prop="value" label="值"></el-table-column>
									</el-table>
								</div>
								<div v-else>{{ !workResult ? '' : workResult }}</div>
							</div>

							<div v-else-if="(workResultType == 'LIST' || workResultType == 'SET')">
								<div v-if="workResult && workResult instanceof Array">
									<el-table :data="workResult" border>
										<el-table-column prop="value" label="值"></el-table-column>
									</el-table>
								</div>
								<div v-else>{{ !workResult ? '': workResult }}</div>
							</div>

							<div v-else style="height: 100%; width: 100%">
								<json-viewer v-if="workResult && isJSON(workResult)" style="height: 100%; width: 100%; display: block; overflow: auto" :expand-depth=4 :value="formToJSON(workResult)" copyable boxed sort />
								<el-input type="textarea" v-else-if="workResult" v-model="workResult" :rows="30"></el-input>
							</div>
						</div>
					</el-main>

				</el-container>
			</el-tab-pane>
		</el-tabs>
		<log-dialog v-if="opeLog" ref="logRef"></log-dialog>
		<monitor-dialog v-if="openMonitor" ref="monitorRef"></monitor-dialog>
		<save-dialog v-if="openSave" @success="handleSaveSuccess" ref="saveRef"></save-dialog>
	</div>
</template>

<script>
import DragLayout from "@/components/drag/DragLayout.vue";
import { format } from 'sql-formatter'
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import { default as AnsiUp } from 'ansi_up';
import monitorDialog from './monitor.vue'
import saveDialog from './save.vue'
import logDialog from './log.vue'
const ansi_up = new AnsiUp();
export default {
	name: 'WebSql',
	components: {
		scCodeEditor, monitorDialog, saveDialog, logDialog, DragLayout
	},
	data() {
		return {
			listVisiable: false,
			listValue: null,
			mapVisiable: false,
			mapValue: null,
			mapKey: null,
			workText: null,
			workResult: null,
			workResultType: null,
			workResultCost: null,
			defaultProps: {
				children: 'children',
				label: 'label',
				isLeaf: (data, node) => {
					if (data.isLeaf == 'leaf' || data.nodeType == 'leaf') {
						return true
					}
				},
			},
			activeName: 'board',
			isOpen: false,
			isSaveBtn: false,
			isLoadDatabase: false,
			isRefresh: false,
			isSave: false,
			isExplain: false,
			isExecute: false,
			message: '',
			options: {
				hintOptions: { // 自定义提示选项
					completeSingle: false,
					tables: {
						users: ['name', 'score', 'birthDate'],
						countries: ['name', 'population', 'size'],
						score: ['zooao']
					}
				}
			},
			code: '',
			form: {
				pageSize: 10
			},
			data: [],
			resultData: {
				data: [{}]
			},
			clickData: null,
			clickDataType: null,
			clickDatabase: null,
			clickTtl: -1,
			dataType: 'text',
			returnResult: null,
			openMonitor: false,
			openSave: false,
			opeLog: false,
			query: {},
			formatType: 'TEXT',

		}
	},
	methods: {
		isJSON(str) {
			try {
				JSON.parse(str);
				return true;
			} catch (e) {
				return false;
			}
		},

		formToJSON(value) {
			return JSON.parse(value);
		},
		open() {
			return this;
		},
		setData(item) {
			this.form = item;
			this.doRefreshDatabase();
		},
		doRefreshDatabase() {
			this.isLoadDatabase = true;
			this.initialTables();
			this.isLoadDatabase = false;
		},
		async doRefresh() {
			if (!this.clickData) {
				return;
			}
			this.isRefresh = true;
			this.$API.gen.session.execute.post(this.query).then(res => {
				if (res.code === '00000') {
					this.resultData = res.data;
					if (this.resultData.data && this.resultData.data.length > 0) {
						this.returnResult = this.resultData.data[0]['data'];
						this.clickTtl = this.resultData.data[0]['expire'];
						this.clickDataType = this.resultData.data[0]['type']?.toUpperCase();
						this.changeDataType(null);
						if (-2 == this.clickTtl) {
							this.$message.error('索引不存在请刷新');
						}
					}
				}

			}).finally(() => this.isRefresh = false);

		},
		async doRefresh1() {
			if (!this.workText) {
				this.$message.error('请输入内容');
				return;
			}
			if (!this.clickDatabase) {
				this.$message.error('请选择数据库');
				return;
			}
			this.isRefresh = true;
			this.$API.gen.session.execute.post(this.query).then(res => {
				if (res.code === '00000') {
					this.workResultCost = res.data?.cost;
					this.workResult = res.data?.data.length > 0 ? res.data?.data[0] : null;
					this.workResultType = this.workResult ? this.workResult?.type?.toUpperCase() : null;
					this.workResult = this.workResult ? this.workResult.data : null;
				}

			}).finally(() => this.isRefresh = false);

		},
		doMonitor() {
			this.openMonitor = true;
			this.$nextTick(() => {
				this.$refs.monitorRef.open(this.form);
			})
		},
		doLog() {
			this.opeLog = true;
			this.$nextTick(() => {
				this.$refs.logRef.open(this.form);
			})
		},
		async doWorkSearch() {
			this.query = { content: this.clickDatabase + ' ' + this.workText, genId: this.form.genId };
			await this.doRefresh1();
		},
		async doDelItem(node, it) {
			this.query = { content: this.clickDatabase + ' DELETE ' + this.clickData + " " + it, genId: this.form.genId };
			await this.doRefresh();
			setTimeout(() => {
				this.query = { content: this.clickDatabase + ' GET ' + this.clickData + " ", genId: this.form.genId };
				this.doRefresh();
			}, 300)
		},
		async doAddItem(node, it, it2) {
			this.query = { content: this.clickDatabase + ' ADD ' + this.clickData + " " + it + " " + it2, genId: this.form.genId };
			await this.doRefresh();
			setTimeout(() => {
				this.query = { content: this.clickDatabase + ' GET ' + this.clickData, genId: this.form.genId };
				this.doRefresh();
				this.listVisiable = false;
				this.mapVisiable = false;
			}, 300)
		},
		doDel(it) {
			const query = {};
			query['genId'] = this.form.genId;
			query['database'] = it.database;
			query['tableName'] = it.database;
			query['data'] = {};
			query['data'][it.tableName] = '';
			this.$API.gen.session.delete.post(query).then(res => {
				if (res.code == '00000') {
					this.dialogStatus = false;
					this.$emit('success', this.form, this.mode)
					return;
				}
				this.$message.error(res.msg);
			}).finally(() => this.isSave = false);
		},
		doSave(it) {
			this.openSave = true;
			this.$nextTick(() => {
				this.$refs.saveRef.open({ data: this.data, genId: this.form.genId, selectData: it?.name });
			});

			return false;
		},
		doSaveBtn() {
			const query = {};
			query['genId'] = this.form.genId;
			query['name'] = this.clickDatabase;
			query['data'] = {
				key: this.clickData,
				value: this.returnResult,
				ttl: this.clickTtl
			};

			if (!this.clickData) {
				return;
			}
			this.$API.gen.session.update.post(query).then(res => {
				if (res.code == '00000') {
					this.$message.success('修改成功');
					this.dialogStatus = false;
					this.$emit('success', this.form, this.mode)
					return;
				}
				this.$message.error(res.msg);
			}).finally(() => this.isSave = false);
		},
		changeDataType(val) {
			if (val) {
				this.formatType = val;
			}
			if (!this.resultData.data || this.resultData.data.length == 0 || !this.resultData.data[0]['data']) {
				return;
			}

			if (this.formatType == 'JSON') {
				this.returnResult = JSON.stringify(JSON.parse(this.resultData.data[0]['data']), null, '\t');
				return;
			}
			this.returnResult = this.resultData.data[0]['data'];
		},
		filterNode(value, data) {
			if (!value) return true
			return data.label.includes(value)
		},
		async loadNode(node, resolve) {
			console.log({ node })
			if (node.level !== 0) {
				const _this = this;
				// 子节点，延迟加载
				setTimeout(async () => {
					const tpl = {};
					Object.assign(tpl, this.form);
					tpl.databaseId = node?.data?.name;
					tpl.fileType = 'DATABASE';
					const data = await this.$API.gen.session.children.get(tpl)
					resolve(data?.data)
				}, 100)
			}
		},
		async nodeClick(node) {
			try {
				this.isExecute = true;
				this.clickData = node?.tableName;
				this.clickDatabase = node.database || node.name;
				this.query = { content: (node.database || node.name) + ' GET ' + node.tableName, genId: this.form.genId };
				this.doRefresh();
			} catch (e) {
				this.message = e;
				this.isExecute = false;
				return;
			}
			this.isExecute = false;
		},
		async initialTables() {
			const tpl = {};
			Object.assign(tpl, this.form);
			const res = await this.$API.gen.session.keyword.get(tpl);
			if (res.code === '00000') {
				if (res.data && res.data.length > 0) {
					if (res.data[0].table) {
						for (const item of res.data[0].table) {
							const rs = [];
							this.options.hintOptions.tables[item?.tableName] = rs;
							for (const it of item?.column) {
								rs.push(it?.columnName);
							}
						}
					}

					this.data = res.data;
				}

				return res.data;
			}
		},
		//本地更新数据
		handleSaveSuccess(data, mode) {
			this.initialTables();
		}
	}
}
</script>

<style scoped lang="less">
.jv-container .jv-code.boxed {
	max-height: 700px
}

:deep(.el-tree-node) {
	border-top: 1px solid #f1eaea;
	;
	border-bottom: 1px solid #f1eaea;
	;
	box-shadow: 0px 2px 3px 0px #f1eaea;
}

:deep(.el-main) {
	border-top: solid 1px #dddddd !important;
}

:deep(.el-tree) {
	width: 100%;
	overflow: scroll;
}

:deep(.el-tree>.el-tree-node) {
	display: inline-block;
	min-width: 100%;
}

// values are default one from jv-light template
.my-awesome-json-theme {
	background: #fff;
	white-space: nowrap;
	color: #525252;
	font-size: 14px;
	font-family: Consolas, Menlo, Courier, monospace;

	.jv-ellipsis {
		color: #999;
		background-color: #eee;
		display: inline-block;
		line-height: 0.9;
		font-size: 0.9em;
		padding: 0px 4px 2px 4px;
		border-radius: 3px;
		vertical-align: 2px;
		cursor: pointer;
		user-select: none;
	}

	.jv-button {
		color: #49b3ff
	}

	.jv-key {
		color: #111111
	}

	.jv-item {
		&.jv-array {
			color: #111111
		}

		&.jv-boolean {
			color: #fc1e70
		}

		&.jv-function {
			color: #067bca
		}

		&.jv-number {
			color: #fc1e70
		}

		&.jv-number-float {
			color: #fc1e70
		}

		&.jv-number-integer {
			color: #fc1e70
		}

		&.jv-object {
			color: #111111
		}

		&.jv-undefined {
			color: #e08331
		}

		&.jv-string {
			color: #42b983;
			word-break: break-word;
			white-space: normal;
		}
	}

	.jv-code {
		.jv-toggle {
			&:before {
				padding: 0px 2px;
				border-radius: 2px;
			}

			&:hover {
				&:before {
					background: #eee;
				}
			}
		}
	}
}

.custom-tree-node {
	flex: 1;
	display: flex;
	font-size: 14px;
	line-height: 48px;
	height: 48px;
	width: 200px;
	align-items: center;
	justify-content: space-between;
	font-size: 14px;
	padding-right: 8px;
	position: relative;
}

.custom-icon {
	position: relative;
	top: 3px;
}

.custom-content {
	padding-left: 3px;
}

.code-toolbar {
	height: 38px;
	margin: 5px;
}

.code-toolbar1 {
	height: 148px;
	margin: 5px;
}

.show-hide:hover :nth-child(4) {
	display: inline-block !important;
}

.message {
	white-space: pre;
}

.demo-tabs>.el-tabs__content {
	height: 100%;
	color: #6b778c;
	font-size: 32px;
	font-weight: 600;
}

.el-tabs--right .el-tabs__content,
.el-tabs--left .el-tabs__content {
	height: 100%;
}

:deep(.el-tabs__content) {
	border-left: 1px solid #ccc;
}
</style>
