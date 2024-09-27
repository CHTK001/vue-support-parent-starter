<template>
	<el-drawer size="100%" v-model="editDialogStatus" title="控制面板" :close-on-click-modal="false" :destroy-on-close="true" top="10px" width="80%" draggable @close="close">
		<el-container style="overflow: hidden">
			<el-aside :class="!sideLeft ? 'show' : 'hidden'">
				<el-container>
					<el-main>
						<el-tree ref="table" @node-contextmenu="floderOption" style="height: 100%" :data="data" :load="loading" :props="{ label: 'label' }" :params="form" row-key="name" default-expanded-keys="table" border stripe @node-click="nodeClick">
							<template #default="{ node, data }">
								<span class="custom-tree-node" :title="data.desc">
									<span class="custom-icon">
										<el-icon>
											<component v-if="data.type == 'DATABASE'" is="sc-icon-database" />
											<component v-else-if="data.type == 'TABLE'" is="sc-icon-table" />
											<component v-else-if="data.type == 'VIEW'" is="sc-icon-view" />
											<component v-else is="el-icon-tickets" />
										</el-icon></span>
									<span class="custom-content">{{ data.label || data.name }}</span>
									<span class="el-form-item-msg" style="margin-left: 10px;">{{ data?.remarks || data.comment }}</span>
								</span>
							</template>
						</el-tree>
					</el-main>
				</el-container>
			</el-aside>
			<drag-layout id="vertical-drag-bar"></drag-layout>
			<el-main class="nopadding">
				<div class="code-toolbar">
					<el-button plain text :loading="isExecute" icon="el-icon-caret-right" @click="doExecute">运行</el-button>
					<el-button plain text :loading="isExplain" icon="el-icon-finished" style="margin-left: 0px;" @click="doExplain"> 解释</el-button>
					<el-button plain text icon="el-icon-magic-stick" style="margin-left: 0px;" @click="formatSql">美化</el-button>
					<el-button plain text icon="sc-icon-document" style="margin-left: 0px;" @click="doDoc">文档</el-button>
					<el-button plain text :loading="isExecute" icon="el-icon-refresh"  style="margin-left: 0px;" @click="initialTables">刷新</el-button>
					<el-button plain text icon="sc-icon-time">
						<el-icon class="animation" v-if="isExecute || isExplain" title="加载中">
							<component is="sc-icon-loading-v2" circle />
						</el-icon>
						耗时: <el-tag style="margin-top:1px">{{ cost }}ms</el-tag></el-button>
					<el-button plain text>
						<span style="margin-right: 10px;">分页</span>
						<el-radio-group v-model="form.searchType">
							<el-radio-button label="NONE">无</el-radio-button>
							<el-radio-button label="HIDE_PAGE">隐藏分页</el-radio-button>
							<el-radio-button label="SHOW_PAGE">显示分页</el-radio-button>
						</el-radio-group>
					</el-button>

					<el-button plain text>
						<span style="margin-right: 10px;">字段注释 </span>
						<el-radio-group v-model="remarkTitle">
							<el-radio-button label="NONE">无</el-radio-button>
							<el-radio-button label="INNER">嵌入</el-radio-button>
							<el-radio-button label="TITLE">浮动</el-radio-button>
						</el-radio-group>
					</el-button>

					<el-button plain text>
						<span style="margin-right: 10px;">内部注释 </span>
						<el-switch v-model="remarkBody" :active-value="true" :inactive-value="false">
						</el-switch>
					</el-button>

					<el-button plain text>
						<span style="margin-right: 10px;">隐藏导航 </span>
						<el-switch v-model="sideLeft" :active-value="true" :inactive-value="false">
						</el-switch>
					</el-button>
				</div>
				<div>
					<sc-code-editor :options="options" :onInput="onInput" :onCursorActivity="onCursorActivity" v-model="code" mode="sql"></sc-code-editor>
				</div>
				<div>
					<el-tabs type="border-card" v-model="card">
						<el-tab-pane label="消息" name="message" class="message" v-html="message"></el-tab-pane>
						<el-tab-pane label="结果" name="result" v-if="isExecuteTable">
							<scDymaicTable :remarkTitle="remarkTitle" :remarkBody="remarkBody" :column="column" :tableName="'jdbc' + currentDatabase + currentTable" @dataChange="dataChange" ref="tableRef" 
							:apiObj="apiObj" :hidePagination="form.searchType !== 'SHOW_PAGE'" :isPost="true" :initiSearch="false" row-key="id"
										   stripe height="340" border style="width: 100%">
								<el-table-column type="index" fixed />
								<el-table-column :prop="item" :label="item" width="180" show-overflow-tooltip v-for="item in resultData.fields" />
							</scDymaicTable>
						</el-tab-pane>
						<el-tab-pane label="结果" v-else name="result">
							<el-table :remarkBody="remarkBody" :column="column" :tableName="'jdbc' + currentDatabase + currentTable" :data="resultData.data" height="340" border style="width: 100%">
								<el-table-column type="index" fixed />
								<el-table-column :prop="item" :label="item" width="180" show-overflow-tooltip v-for="item in resultData.fields" />
							</el-table>
						</el-tab-pane>
					</el-tabs>
				</div>
			</el-main>
		</el-container>

		<!-- 树形控件右键组件 -->
		<div class="rightMenu" v-show="menuShow">
			<ul>
				<li @click="editTable"  v-if="form.genJdbcCustomType != 'FILE'">
					<el-icon>
						<component is="sc-icon-database-search" />
					</el-icon>
					<span  class="menu-left-4">编辑表</span>
				</li>
				<li @click="showTable">
					<el-icon>
						<component is="sc-icon-database-search" />
					</el-icon>
					<span class="menu-left-4">查看表</span>
				</li>
			</ul>
		</div>


		<el-dialog v-if="docStatus" v-model="docStatus" width="60%" style="height: 70%; min-height: 700px;" scrolling="no" draggable title="数据库文档" :destroy-on-close="true" :close-on-click-modal="false">
			<doc-dialog v-if="docStatus" ref="docRef" style="height: 100%"></doc-dialog>
		</el-dialog>
	</el-drawer>

	<edit-table-layout v-if="editTableLayoutVisiable" ref="editTableLayoutRef"></edit-table-layout>
</template>

<script>
import DragLayout from "@/components/drag/DragLayout.vue";
import { format } from 'sql-formatter'
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import { default as AnsiUp } from 'ansi_up';
import docDialog from '../doc/index.vue'
const ansi_up = new AnsiUp();
import EditTableLayout from './table.vue'
export default {
	name: 'WebSql',
	components: {
		scCodeEditor, DragLayout, docDialog, EditTableLayout
	},
	data() {
		return {
			card: 'result',
			column: [],
			rightMenu: '',
			editTableLayoutVisiable: false,
			menuShow: false,
			docStatus: false,
			isExplain: false,
			isExecute: false,
			loading: false,
			remarkBody: false,
			remarkTitle: 'INNER',
			sideLeft: false,
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
				searchType: 'HIDE_PAGE'
			},
			cost: 0,
			data: null,
			resultData: [],
			resultTotal: 0,
			editDialogStatus: false,
			currentDatabase: null,
			currentTable: null,
			apiObj: this.$API.gen.session.execute,

		}
	},
	mounted() {
		// this.form.genId = this.$route.params.genId;
		// if (!this.form.genId || this.form.genId === 'null') {
		// 	delete this.form.genId;
		// }
		// this.initialTables();
	},
	methods: {
		/**
		 * 编辑表
		 */
		editTable(){
			if(this.form.genJdbcCustomType == 'FILE') {
				return;
			}
			this.foo();
			this.editTableLayoutVisiable = true;
			this.$nextTick(() => {
				this.$refs.editTableLayoutRef.setData(this.form, this.currentTable).open('edit');
			})
		},
		/**
		 * 查看表
		 */
		showTable(){
			this.foo();
			this.editTableLayoutVisiable = true;
			this.$nextTick(() => {
				this.$refs.editTableLayoutRef.setData(this.form, this.currentTable).open('view');
			})
		},
		open(row) {
			Object.assign(this.form, row);
			if (this.form?.searchType) {
				this.form.searchType = 'HIDE_PAGE'
			}
			this.editDialogStatus = true;
			this.initialTables();
			return this;
		},
		close(){
			this.editDialogStatus = false;
			this.editTableLayoutVisiable= false;
			this.menuShow= false;
			this.docStatus= false;
			this.isExplain= false;
			this.isExecute= false;
			this.loading= false;
			this.remarkBody = false;
			this.remarkTitle= 'INNER';
			this.sideLeft = false;
			this.isExecuteTable = false;
			this.data.length = 0;
		},
		dataChange(item) {
			this.message = item?.data?.message;
			if (this.message) {
				this.message = ansi_up.ansi_to_html(this.message).replaceAll("\n", '<br />');
			}
			this.cost = item?.data?.cost;
			this.column.length = 0;
			(item?.data?.fields || []).forEach((it, index) => {
				this.column.push({
					label: it,
					prop: it
				})
			})

		},
		// 文件夹右键时触发的事件
		floderOption(e, data, n, t) {
			if (data?.type != 'TABLE') {
				return;
			}
			this.currentTable = data;
			this.menuShow = false // 先把模态框关死，目的是 第二次或者第n次右键鼠标的时候 它默认的是true
			this.menuShow = true
			e.preventDefault() //关闭浏览器右键默认事件
			let menu = document.querySelector('.rightMenu')
			menu.style.left = e.clientX + 'px'
			menu.style.top = e.clientY + 'px'

			document.addEventListener('click', (ev) => {
				// ev.stopImmediatePropagation()
				if (ev.target !== document.querySelector('.el-menu-item.is-active')) {
					this.foo()
				}
			})
		},
		foo() {
			// 取消鼠标监听事件 菜单栏
			this.menuShow = false
			document.removeEventListener('click', this.foo) // 关掉监听，
		},
		doDoc() {
			this.editTableLayoutVisiable = false;
			this.menuShow = false;
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
			this.editTableLayoutVisiable = false;
			this.menuShow = false;
			this.message = '';
			this.isExecuteTable = false;
			try {
				this.isExplain = true;
				const res = await this.$API.gen.session.explain.post({ content: this.code, genId: this.form.genId });
				if (res.code === '00000') {
					this.resultData = res.data;
					this.cost = res.data?.cost;
				} else {
					this.message = res.msg;
					this.resultData = {};
					this.resultTotal = 0;
				}
			} catch (e) {
				this.message = e;
				this.isExplain = false;
				return;
			}
			if (!this.message) {
				this.message = ansi_up.ansi_to_html(this.resultData.message).replaceAll("\n", '<br />');
			}
			this.isExplain = false;

		},
		/**执行 */
		async doExecute() {
			this.editTableLayoutVisiable = false;
			this.menuShow = false;
			this.message = '';
			this.isExecuteTable = true;
			try {
				this.isExecute = true;
				const request = {};
				Object.assign(request, this.form);
				request.content = this.code;
				request.genId = this.form.genId;
				request.currentDatabase = this.currentDatabase;
				request.currentTable = this.currentTable;
				this.$nextTick(() => {
					this.$refs.tableRef.reload(request);
				})
			} catch (e) {
				this.message = e;
				this.isExecute = false;
				return false;
			}

			this.isExecute = false;
			return false;

		},
		nodeClick(node) {
			this.foo();
			if (node?.type === 'TABLE') {
				this.currentDatabase = node.database;
				this.currentTable = node.tableName;
				this.code = 'SELECT * FROM ' + node.tableName;
			}
		},
		/* 代码格式化*/
		formatSql() {
			this.editTableLayoutVisiable = false;
			this.menuShow = false;
			this.code = format(this.code)
		},
		onInput(val, s) {
			this.editTableLayoutVisiable = false;
			this.menuShow = false;
			if (s.code.indexOf('Arrow') > -1) {
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
			this.loading = true;
			this.editTableLayoutVisiable = false;
			this.menuShow = false;
			const res = await this.$API.gen.session.keyword.get(this.form);
			this.loading = false;
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
				return;
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

:deep(.el-main) {
	border-top: solid 1px #dddddd !important;
}

:deep(.el-tree>.el-tree-node) {
	min-width: 100%;
}

.tree_rightmenu {
	position: fixed;
	height: 38px;
	padding: 20px;
	width: 120px;
	border: 1px solid rgba(0, 0, 0, 0.15);
	box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
	z-index: 1000;
}

//样式可以自己定义
.rightMenu {
	position: fixed;
	z-index: 99999999;
	cursor: pointer;
	border: 1px solid #eee;
	box-shadow: 0 0.5em 1em 2px rgba(0, 0, 0, 0.1);
	border-radius: 6px;
	color: #1a1a1a;
}

.rightMenu ul {
	list-style: none;
	margin: 0;
	padding: 0;
	border-radius: 6px;
}

.rightMenu ul li {
	padding: 6px 10px;
	background: #fff;
	height: 34px;
	border-bottom: 1px solid #ebe5e5;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-around;
}

.rightMenu ul li:last-child {
	border: none;
}

.rightMenu ul li:hover {
	transition: all 1s;
	background: #92c9f6;
}

.custom-tree-node {
	font-size: 14px;
	line-height: 48px;
	height: 48px;
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
.menu-left-4 {
	margin-left: 4px;
}
.message {
	white-space: pre;
}</style>
