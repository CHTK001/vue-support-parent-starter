<template>
	<el-container style="overflow: hidden;">
		<el-aside>
			<el-container>
				<el-main>
					<el-row>
						<el-button plain text size="small" :loading="isLoadDatabase" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
					</el-row>
					<el-tree ref="table" style="height: 80vh" :data="data"  :props="defaultProps"
					:lazy="true" :expand-on-click-node="false"  :load="loadNode"
						:params="form" row-key="name" default-expanded-keys="table"  border stripe  @node-click="nodeClick">
						<template #default="{ node, data }">
							<span class="custom-tree-node show-hide" :title="data.desc">
								<span class="custom-icon">
									<el-icon>
										<component v-if="data.type=='DATABASE'" is="sc-icon-database" />
										<component v-else-if="data.type=='TABLE'" is="sc-icon-table" />
										<component v-else-if="data.type=='VIEW'" is="sc-icon-view" />
										<component v-else is="el-icon-tickets" />
									</el-icon></span>
								<span class="custom-content">{{ data.label }}<span v-if="data.typeName">({{ data.typeName }})</span></span>
								<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks }}</span>
								<span v-if="data.type == 'COLUMN'" style="position: absolute;right:10px;z-index: 9999; display: none;" >
									<el-button class="op" plain text :loading="isSave" icon="el-icon-plus" size="small" @click.prevent="doSave(data)"></el-button>
								</span>
							</span>
						</template>
					</el-tree>
				</el-main>
			</el-container>
		</el-aside>
		<drag-layout id="vertical-drag-bar"></drag-layout>
		<el-main class="nopadding" >
			<div class="code-toolbar">
				<el-button plain text :loading="isExecute" icon="el-icon-caret-right" @click="doExecute">运行</el-button>
				<el-button plain text :loading="isExplain" icon="el-icon-finished" style="margin-left: 0px;" @click="doExplain"> 解释</el-button>
				<el-button plain text icon="el-icon-magic-stick" style="margin-left: 0px;" @click="formatSql">美化</el-button>
				<el-button plain text icon="sc-icon-time">
					<el-icon class="animation" v-if="isExecute || isExplain" title="加载中">
						<component is="sc-icon-loading-v2" circle />
					</el-icon>
					耗时: <el-tag style="margin-top:1px">{{ cost }}ms</el-tag></el-button>
				<el-button plain text >
					<el-select v-model="form.searchType">
						<el-option value="NONE" label="无"></el-option>
						<el-option value="HIDE_PAGE" label="隐藏分页"></el-option>
						<el-option value="SHOW_PAGE" label="显示分页"></el-option>
					</el-select>
				</el-button>
			</div>
			<div>
				<sc-code-editor :options="options" :onInput="onInput" :onCursorActivity="onCursorActivity" v-model="code" mode="sql"></sc-code-editor>
			</div>
			<div>
				<el-tabs type="border-card">
					<el-tab-pane label="消息" class="message" v-html="message"></el-tab-pane>
					<el-tab-pane label="结果" v-if="isExecuteTable">
						<scDymaicTable  @dataChange="dataChange" ref="tableRef" :apiObj="apiObj" :hidePagination="form.searchType !== 'SHOW_PAGE'" :isPost="true" :initiSearch="false" row-key="id" stripe  height="340" border   style="width: 100%">
							<el-table-column type="index" fixed />
							<el-table-column :prop="item" :label="item" width="180" show-overflow-tooltip v-for="item in resultData.fields"/>
						</scDymaicTable>
					</el-tab-pane>
					<el-tab-pane label="结果" v-else>
						<el-table :data="resultData.data" height="340" border   style="width: 100%">
							<el-table-column type="index" fixed />
							<el-table-column :prop="item" :label="item" width="180" show-overflow-tooltip v-for="item in resultData.fields"/>
						</el-table>
					</el-tab-pane>
				</el-tabs>
			</div>
		</el-main>
	
	</el-container>
	<save-dialog ref="saveDialog" v-if="saveDialogStatus"></save-dialog>
</template>

<script>
import DragLayout from "@/components/drag/DragLayout.vue";
import { format } from 'sql-formatter'
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
import saveDialog from './save.vue'
export default {
	name: 'WebSql',
	components: {
		scCodeEditor, DragLayout, saveDialog
	},
	data() {
		return {
			saveDialogStatus: false,
			isLoadDatabase: false,
			defaultProps: {
				children: 'children',
				label: 'label',
				isLeaf: (data, node) => {
					if (data.isLeaf == 'leaf') {
						return true
					}
					return false;
				},
			},
			isExecuteTable: false,
			docStatus: false,
			isExplain: false,
			isExecute: false,
			isExecuteTable: false,
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
				searchType: 'HIDE_PAGE',
			},
			cost: 0,
			data: [],
			resultData:[],
			resultTotal:0,
			apiObj: this.$API.gen.session.execute,
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
		doRefreshDatabase(){
			this.isLoadDatabase = true;
			try{this.initialTables()}catch(e){};
			this.isLoadDatabase = false;
		},
		doSave(data) {
			this.saveDialogStatus = true;
			this.$nextTick(() => {
				this.$refs.saveDialog.open(data, this.form.genId);
			})
		},
		dataChange(item){
			this.message = item?.data?.message;
			if(this.message) {
				this.message = ansi_up.ansi_to_html(this.message).replaceAll("\n", '<br />');
			}
			this.cost = item?.data?.cost;
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
					tpl.fileType = node?.data?.type;
					tpl.database = node?.data?.database;
					const data = await this.$API.gen.session.children.get(tpl)
					resolve(data?.data)
				}, 100)
			}
		},
		doDoc() {
			this.docStatus = true;
			this.$nextTick(() => {
				const tpl = {};
				Object.assign(tpl, this.form);
				tpl['dialog'] = true
				this.$refs.docRef.open(tpl);
			})
		},
		/**解释 */
		async doExplain() {
			this.message = '';
			this.isExecuteTable = false;
			try {
				this.isExplain = true;
				const res = await this.$API.gen.session.explain.post({content: this.code, genId: this.form.genId});
				if (res.code === '00000') {
					this.resultData = res.data;
					this.cost = res.data?.cost;
				}  else {
					this.message = res.msg;
					this.resultData = {};
					this.resultTotal = 0;
				}
			}catch (e) {
				this.message = e;
				this.isExplain = false;
				return;
			}
			if(!this.message) {
				this.message = ansi_up.ansi_to_html(this.resultData.message).replaceAll("\n", '<br />');
			}
			this.isExplain = false;

		},
		/**执行 */
		async doExecute() {
			this.message = '';
			this.isExecuteTable = true;
			try {
				this.isExecute = true;
				const request = {};
				Object.assign(request, this.form);
				request.content = this.code;
				request.genId = this.form.genId;
				this.$nextTick(() => {
					this.$refs.tableRef.reload(request);
				})
			}catch (e) {
				this.message = e;
				this.isExecute = false;
				return false;
			}
			
			this.isExecute = false;
			return false;

		},
		nodeClick(node) {
			if(node?.type === 'TABLE') {
				this.code = 'SELECT * FROM ' + node.tableName;
			}
		},
		/* 代码格式化*/
		formatSql() {
			this.code = format(this.code)
		},
		onInput(val, s) {
			if(s.code.indexOf('Arrow') > -1) {
				return false;
			}
			val.showHint()
		},
		onCursorActivity(cm, s) {
			if (!cm.getSelection()) {
				console.log(cm.getSelection()); // 获取到选中部分内容，用来实现执行部分内容
				}
		},
		async initialTables() {
			const res = await this.$API.gen.session.keyword.get(this.form);
			if (res.code === '00000') {
				if(res.data && res.data.length > 0) {
					if(res.data[0].table) {
						for(const item of res.data[0].table) {
							const rs = [];
							this.options.hintOptions.tables[item?.tableName] = rs;
							for(const it of item?.column) {
								rs.push(it?.columnName);
							}
						}
					}
	
					this.data = res.data;
				}
				
			}
		}
	}
}
</script>

<style scoped lang="less">
:deep(.el-tree-node) {
	border-top: 1px solid #f1eaea;
	border-bottom: 1px solid #f1eaea;
}
:deep(.el-tree) {
  width: 100%;
  overflow: scroll;
}

:deep(.el-tree>.el-tree-node) {
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
.show-hide:hover :nth-child(4){
	display: inline-block !important;
}
.message{
	white-space: pre;
}
</style>
