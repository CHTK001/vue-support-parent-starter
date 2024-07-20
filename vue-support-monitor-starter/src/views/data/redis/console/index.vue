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
											<span class="custom-content">{{ node.label || data.name }}</span>
											<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks }}</span>
	
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
					<drag-layout id="vertical-drag-bar" height="calc(90vh)" ></drag-layout>
					<el-main class="nopadding">
						<div class="code-toolbar">
							<el-button plain text :loading="isSave" icon="el-icon-plus" @click="doSave">新增</el-button>
							<el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button>
							<el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
							<el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button>
							<el-button plain text icon="el-icon-warning" @click="doLog">日志</el-button>
							<el-button plain text>
								<span>返回数量：</span>
								<el-select v-model="form.pageSize" placeholder="返回数量">
									<el-option :key="10" label="10条数据" :value="10" />
									<el-option :key="100" label="100条数据" :value="100" />
									<el-option :key="1000" label="1000条数据" :value="1000" />
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
						<div>
							<el-table :data="returnResult" border style="width: 100%" v-if="clickDataType == 'HASH'">
								<el-table-column prop="name" label="字段" width="180" ></el-table-column>
								<el-table-column prop="value" label="值" ></el-table-column>
							</el-table>
							<el-table :data="returnResult" border v-else-if="clickDataType == 'LIST' || clickDataType == 'SET'">
								<el-table-column prop="value" label="值" ></el-table-column>
							</el-table>
							<el-input type="textarea" v-model="returnResult" :rows="30" v-else></el-input>
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
			defaultProps: {
				children: 'children',
				label: 'label',
				isLeaf: (data, node) => {
					if (data.isLeaf == 'leaf') {
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
			formatType: 'text',

		}
	},
	methods: {
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

			if (this.formatType == 'json') {
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
				this.clickDatabase = node.database;
				this.query = { content: node.database + ' GET ' + node.tableName, genId: this.form.genId };
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

.show-hide:hover :nth-child(4) {
	display: inline-block !important;
}

.message {
	white-space: pre;
}

.demo-tabs > .el-tabs__content {
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
