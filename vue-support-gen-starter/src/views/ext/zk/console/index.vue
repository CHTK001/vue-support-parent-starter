<template>
	<el-container style="overflow: hidden;">
		<el-aside>
			<el-container>
				<el-main>
					<el-row style="margin-bottom: 12px;">
						<el-col :span="6">
							<el-select v-model="type">
								<el-option value="node" label="根节点"></el-option>
								<el-option value="leaf" label="子节点"></el-option>
							</el-select>
						</el-col>
						<el-col :span="12">
							<el-input v-model="keyword"></el-input>
						</el-col>
						<el-col :span="6">
							<el-button plain text :loading="isLoadDatabase" icon="el-icon-refresh"
								@click="doRefreshDatabase">刷新</el-button>
						</el-col>
					</el-row>

					<el-tree ref="table" :filter-node-method="filterNode" style="height: 75vh;" :data="data" :load="loadNode"
						:lazy="true" :expand-on-click-node="false" :props="defaultProps" :params="form" row-key="name"
						default-expanded-keys="table" border stripe @node-click="nodeClick">
						<template #default="{ node, data }">
							<span class="custom-tree-node show-hide" :title="data.desc" >
								<span class="custom-icon">
									<el-icon>
										<component v-if="data.type == 'DATABASE'" is="sc-icon-database" />
										<component v-else-if="data.type == 'NODE'" is="sc-icon-node" />
										<component v-else-if="data.type == 'LEAF'" is="sc-icon-leaf" />
										<component v-else-if="data.type == 'TABLE'" is="sc-icon-table" />
										<component v-else-if="data.type == 'VIEW'" is="sc-icon-view" />
										<component v-else is="el-icon-tickets" />
									</el-icon></span>
								<span class="custom-content">{{ node.label }}</span>
								<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks }}</span>
								<span  style="position: absolute;right:10px;z-index: 9999; display: none;">
									<el-button class="op" plain text :loading="isSave" icon="el-icon-plus" size="small" @click="doSave(data)"></el-button>
									<el-button class="op" plain text :loading="isSave" icon="el-icon-minus" size="small" @click="doDel(data)"></el-button>
								</span>
							</span>
						</template>
					</el-tree>
				</el-main>
			</el-container>
		</el-aside>
		<drag-layout id="vertical-drag-bar"></drag-layout>
		<el-main class="nopadding">
			<div class="code-toolbar">
				 <el-button plain text :loading="isSave" icon="el-icon-plus" @click="doSave({name: '/'})">新增</el-button>
				<!--<el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button> -->
				<el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
				<!-- <el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button> -->
				<!-- <el-button plain text  icon="el-icon-warning" @click="doLog">日志</el-button> -->
			</div>
			<div class="code-toolbar">
				<el-row>
					<el-col :span="3">
						<el-select v-model="dataType" @change="changeDataType">
							<el-option value="json"></el-option>
							<el-option value="text"></el-option>
						</el-select>
					</el-col>
					<el-col :span="18">
						<el-input v-model="clickData"></el-input>
					</el-col>
					<el-col :span="3">
						<el-input v-model="clickTtl">
							<template #append>s</template>
						</el-input>
					</el-col>
				</el-row>
			</div>
			<div>
				<el-input type="textarea" v-model="returnResult" :rows="30"></el-input>
			</div>
		</el-main>

	</el-container>

	<!-- <log-dialog v-if="opeLog" ref="logRef"></log-dialog> -->
	<!-- <monitor-dialog v-if="openMonitor" ref="monitorRef"></monitor-dialog> -->
	<save-dialog v-if="openSave" @success="handleSaveSuccess" ref="saveRef"></save-dialog>
</template>

<script>
import { ElNotification, ElMessageBox } from 'element-plus';

import DragLayout from "@/components/drag/DragLayout.vue";
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import { default as AnsiUp } from 'ansi_up';
// import monitorDialog from './monitor.vue'
import saveDialog from './save.vue'
// import logDialog from './log.vue'
const ansi_up = new AnsiUp();
export default {
	name: 'WebSql',
	components: {
		scCodeEditor, DragLayout, saveDialog/* , monitorDialog,logDialog */
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
			keyword: '',
			type: '',
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
				pageSize: 2000
			},
			data: [],
			resultData: {
				data: [{}]
			},
			clickData: null,
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
	mounted() {
		this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
		this.initialTables();
	},
	methods: {
		doRefreshDatabase() {
			this.isLoadDatabase = true;
			this.initialTables();
			this.isLoadDatabase = false;
		},
		async doRefresh() {
			this.isRefresh = true;
			this.$API.gen.session.execute.post(this.query).then(res => {
				if (res.code === '00000') {
					this.resultData = res.data;
					if (this.resultData.data && this.resultData.data.length > 0) {
						this.returnResult = this.resultData.data[0]['data'];
						this.clickTtl = this.resultData.data[0]['expire'];
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
		doDel(data) {
			ElMessageBox.confirm('确定要删除该'+ data?.name +'。', '删除节点', {
				type: 'error',
				closeOnClickModal: false,
			}).then(() => {
				this.isSave = true;
				this.$API.gen.session.delete.post({
					dataId: data?.name,
					name: data?.name,
					genId: this.form.genId,
				}).then(res => {
					if(res.code == '00000') {
						this.doRefreshDatabase();
						return;
					}
					this.$message.error(res.msg);
				}).finally(() => this.isSave = false);
			}).catch(() => {})
			
		},
		doSave(data) {
			this.openSave = true;
			this.$nextTick(() => {
				this.$refs.saveRef.open({dataId: data?.name, data: this.data, genId: this.form.genId });
			})
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
				this.$message.error('请选择索引');
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
					delete tpl.keyword;
					tpl.databaseId = node?.data?.name;
					if (this.type == 'leaf') {
						tpl.keyword = this.keyword;
					}
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
			delete this.form.keyword;
			if (this.type == 'node') {
				this.form.keyword = this.keyword;
			}
			const res = await this.$API.gen.session.keyword.get(this.form);
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

:deep(.el-tree) {
	width: 100%;
	overflow: scroll;
}

:deep(.el-tree>.el-tree-node) {
	display: inline-block;
	min-width: 100%;
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

.custom-tree-node {
	flex: 1;
	display: flex;
	font-size: 14px;
	line-height: 38px;
	height: 38px;
	width: 200px;
	align-items: center;
	justify-content: space-between;
	font-size: 14px;
	padding-right: 8px;
	position: relative;
}

.show-hide:hover :nth-child(4){
	display: inline-block !important;
}

.message {
	white-space: pre;
}
.op {
	width: 20px;
	height: 20px;
	margin: 0;
	padding: 0;
}
</style>
