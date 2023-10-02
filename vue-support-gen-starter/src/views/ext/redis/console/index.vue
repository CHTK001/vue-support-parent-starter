<template>
	<el-container style="overflow: hidden;">
		<el-aside>
			<el-container>
				<el-main>
					<el-tree ref="table" :filter-node-method="filterNode" style="height: 80vh" :data="data" :load="loadNode"
						:lazy="true" :expand-on-click-node="false" :props="defaultProps" :params="form" row-key="name" default-expanded-keys="table"
						border stripe @node-click="nodeClick">
						<template #default="{ node, data }">
							<span class="custom-tree-node" :title="data.desc">
								<span class="custom-icon">
									<el-icon>
										<component v-if="data.type == 'DATABASE'" is="sc-icon-database" />
										<component v-else-if="data.type == 'TABLE'" is="sc-icon-table" />
										<component v-else-if="data.type == 'VIEW'" is="sc-icon-view" />
										<component v-else is="el-icon-tickets" />
									</el-icon></span>
								<span class="custom-content">{{ node.label }}</span>
								<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks }}</span>
							</span>
						</template>
					</el-tree>
				</el-main>
			</el-container>
		</el-aside>
		<drag-layout id="vertical-drag-bar"></drag-layout>
		<el-main class="nopadding">
			<div class="code-toolbar">
				<el-button plain text :loading="isSave" icon="el-icon-plus" @click="doSave">新增</el-button>
				<el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button>
				<el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
			</div>
			<div class="code-toolbar">
				<el-row>
					<el-col :span="3">
						<el-select v-model="dataType" @change="changeDataType">
							<el-option value="json" ></el-option>
							<el-option value="text"></el-option>
						</el-select>
					</el-col>
					<el-col :span="18">
						<el-input v-model="clickData"></el-input>
					</el-col>
					<el-col :span="3">
						<el-input v-model="resultData.data[0]['expire']">
							<template #append>ms</template>
						</el-input>
					</el-col>
				</el-row>
			</div>
			<div>
				<el-input type="textarea" v-model="returnResult" :rows="30"></el-input>
			</div>
		</el-main>

	</el-container>

	<monitor-dialog v-if="openMonitor" ref="monitorRef"></monitor-dialog>
	<save-dialog v-if="openSave" @success="handleSaveSuccess" ref="saveRef"></save-dialog>
</template>

<script>
import DragLayout from "@/components/drag/DragLayout.vue";
import { format } from 'sql-formatter'
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import { default as AnsiUp } from 'ansi_up';
import monitorDialog from './monitor.vue'
import saveDialog from './save.vue'
const ansi_up = new AnsiUp();
export default {
	name: 'WebSql',
	components: {
		scCodeEditor, DragLayout, monitorDialog, saveDialog
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
			isOpen: false,
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
			dataType: 'text',
			returnResult: null,
			openMonitor: false,
			openSave: false,
			query: {},
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
		async doRefresh() {
			this.isRefresh = true;
			this.$API.gen.session.execute.post(this.query).then(res => {
				if (res.code === '00000') {
					this.resultData = res.data;
					this.returnResult = this.resultData.data[0]['data'];
				}
			}).finally(() => this.isRefresh = false);
				
		},
		doMonitor() {
			this.openMonitor = true;
			this.$nextTick(() => {
				this.$refs.monitorRef.open(this.form);
			})
		},
		doSave() {
			this.openSave = true;
			this.$nextTick(() => {
				this.$refs.saveRef.open({data: this.data, genId : this.form.genId});
			})
		},
		changeDataType(val) {
			if(val == 'json' ) {
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
					const data = await this.$API.gen.session.children.get(tpl)
					resolve(data?.data)
				}, 100)
			}
		},
		async nodeClick(node) {
			try {
				this.isExecute = true;
				this.clickData = node?.tableName;
				this.query = { sql: node.database + ' GET ' + node.tableName, genId: this.form.genId };
				const res = await this.$API.gen.session.execute.post(this.query);
				if (res.code === '00000') {
					this.resultData = res.data;
					this.returnResult = this.resultData.data[0]['data'];
				}
			} catch (e) {
				this.message = e;
				this.isExecute = false;
				return;
			}
			this.message = ansi_up.ansi_to_html(this.resultData.message).replaceAll("\n", '<br />');
			this.isExecute = false;
		},
		async initialTables() {
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
		handleSaveSuccess(data, mode){
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

.custom-tree-node {
	font-size: 14px;
	line-height: 38px;
	height: 38px;
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

.message {
	white-space: pre;
}</style>
