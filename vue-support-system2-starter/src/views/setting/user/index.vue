<template>
	<el-container>
		<el-aside width="200px" v-loading="showGrouploading">
			<el-container>
				<el-header>
					<el-input placeholder="输入关键字进行过滤" v-model="groupFilterText" clearable></el-input>
				</el-header>
				<el-main class="nopadding">
					<el-tree ref="group" :props="treeProps" class="menu" node-key="deptName" :data="group" :current-node-key="''" :highlight-current="true" :expand-on-click-node="false" :filter-node-method="groupFilterNode" @node-click="groupClick"></el-tree>
				</el-main>
			</el-container>
		</el-aside>
		<el-container>
				<el-header>
					<div class="left-panel">
						<el-button type="primary" icon="el-icon-plus" @click="add"></el-button>
						<!-- <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button> -->
						<!-- <el-button type="primary" plain :disabled="selection.length==0">分配角色</el-button> -->
						<!-- <el-button type="primary" plain :disabled="selection.length==0">密码重置</el-button> -->
					</div>
					<div class="right-panel">
						<div class="right-panel-search">
							<el-input v-model="search.name" placeholder="登录账号 / 姓名" clearable></el-input>
							<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
						</div>
					</div>
				</el-header>
				<el-main class="nopadding">
					<scTable ref="table" :apiObj="apiObj" @selection-change="selectionChange" stripe remoteSort remoteFilter>
						<!-- <el-table-column type="selection" width="50"></el-table-column> -->
						<el-table-column label="编号" prop="userCode" width="160" ></el-table-column>
						<el-table-column label="头像" width="80" >
							<template #default="scope">
								<el-avatar :src="scope.row.userAvatar" size="small"></el-avatar>
							</template>
						</el-table-column>
						<el-table-column label="登录账号" prop="username" width="150"  ></el-table-column>
						<el-table-column label="姓名" prop="userRealName" width="150"  show-overflow-tooltip>
							<template #default="scope">
								<el-tag v-if="scope.row.userRealName" size="small">{{ scope.row.userRealName }}</el-tag>
								<el-tag v-else size="small">-</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="所属部门" prop="deptName" width="200"  show-overflow-tooltip>
							<template #default="scope">
								<el-tag v-if="scope.row.deptName" size="small">{{ scope.row.deptName }}</el-tag>
								<el-tag v-else size="small">-</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="所属角色" prop="roleNames" width="200"  show-overflow-tooltip>
							<template #default="scope">
								<el-tag v-if="scope.row.roleNames" size="small">{{ scope.row.roleNames }}</el-tag>
								<el-tag v-else size="small">-</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="性别" prop="userGender" width="100" >
							<template #default="scope">
								<el-tag v-if="scope.row.userGender === 1" size="small">男</el-tag>
								<el-tag v-else-if="scope.row.userGender ==0 " size="small">女</el-tag>
								<el-tag v-else size="small">保密</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="加入时间" prop="createTime" width="170" ></el-table-column>
						<el-table-column label="操作" fixed="right" align="right" width="160">
							<template #default="scope">
								<el-button-group>
									<el-button text type="primary" size="small" @click="table_show(scope.row, scope.$index)">查看</el-button>
									<el-button text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
									<el-popconfirm v-if="scope.row.userSys === 0" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
										<template #reference>
											<el-button text type="primary" size="small">删除</el-button>
										</template>
									</el-popconfirm>
								</el-button-group>
							</template>
						</el-table-column>

					</scTable>
				</el-main>
		</el-container>
	</el-container>

	<save-dialog v-if="dialog.save" ref="saveDialog" :close-on-click-modal="false" @success="handleSuccess" @closed="dialog.save=false"></save-dialog>

</template>

<script>
	import saveDialog from './save.vue'

	export default {
		name: 'user',
		components: {
			saveDialog
		},
		data() {
			return {
				dialog: {
					save: false
				},
				showGrouploading: false,
				groupFilterText: '',
				group: [],
				apiObj: this.$API.system.user.list,
				selection: [],
				search: {
					name: null
				},
				treeProps:{
					label: 'deptName',
				}
			}
		},
		watch: {
			groupFilterText(val) {
				this.$refs.group.filter(val);
			}
		},
		mounted() {
			this.getGroup()
		},
		methods: {
			//添加
			add(){
				this.dialog.save = true
				this.$nextTick(() => {
					this.$refs.saveDialog.open()
				})
			},
			//编辑
			table_edit(row){
				this.dialog.save = true
				this.$nextTick(() => {
					this.$refs.saveDialog.open('edit').setData(row)
				})
			},
			//查看
			table_show(row){
				this.dialog.save = true
				this.$nextTick(() => {
					this.$refs.saveDialog.open('show').setData(row)
				})
			},
			//删除
			async table_del(row, index){
				var reqData = {userId: row.userId}
				 this.$API.system.user.delete.delete(reqData).then(res => {
					if(res.code == '00000'){
					//这里选择刷新整个表格 OR 插入/编辑现有表格数据
						this.$refs.table.tableData.splice(index, 1);
						this.$notify.success({title: '提示', message: '操作成功'})
					} else {
						this.$notify.error({title: '提示', message: res.msg})
					}
				 })
				
			},
			//批量删除
			async batch_del(){
				this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？`, '提示', {
					type: 'warning'
				}).then(() => {
					const loading = this.$loading();
					this.selection.forEach(item => {
						this.$refs.table.tableData.forEach((itemI, indexI) => {
							if (item.id === itemI.id) {
								this.$refs.table.tableData.splice(indexI, 1)
							}
						})
					})
					loading.close();
					this.$message.success("操作成功")
				}).catch(() => {

				})
			},
			//表格选择后回调事件
			selectionChange(selection){
				this.selection = selection;
			},
			//加载树数据
			async getGroup(){
				this.showGrouploading = true;
				var res = await this.$API.system.dept.tree.get();
				this.showGrouploading = false;
				var allNode ={deptId: '', deptName: '所有'}
				res.data.unshift(allNode);
				this.group = res.data;
			},
			//树过滤
			groupFilterNode(value, data){
				if (!value) return true;
				return data.label.indexOf(value) !== -1;
			},
			//树点击事件
			groupClick(data){
				var params = {
					deptId: data.deptId
				}
				this.$refs.table.reload(params)
			},
			//搜索
			upsearch(){
				this.$refs.table.upData(this.search)
			},
			//本地更新数据
			handleSuccess(data, mode){
				if(mode=='add'){
					data.id = new Date().getTime()
					this.$refs.table.tableData.unshift(data)
				}else if(mode=='edit'){
					this.$refs.table.tableData.filter(item => item.id===data.id ).forEach(item => {
						Object.assign(item, data)
					})
				}
			}
		}
	}
</script>

<style>
</style>
