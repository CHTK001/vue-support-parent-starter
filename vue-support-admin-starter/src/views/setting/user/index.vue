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
						<el-button size="small" type="primary" icon="el-icon-plus" @click="add"></el-button>
						<!-- <sc-export size="small" :total="total"  :apiObj="apiObj"  :param="search"  des="导出用户数据" :header="header"></sc-export> -->
						<!-- <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button> -->
						<!-- <el-button type="primary" plain :disabled="selection.length==0">分配角色</el-button> -->
						<!-- <el-button type="primary" plain :disabled="selection.length==0">密码重置</el-button> -->
					</div>
					<div class="right-panel">
						<div class="right-panel-search">
							<el-input v-model="search.keywords" placeholder="登录账号 / 手机号" clearable></el-input>
							<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
						</div>
					</div>
				</el-header>
				<el-main class="nopadding">
					<scTable ref="table" :apiObj="apiObj" @selection-change="selectionChange" @dataChange="returnChange" stripe remoteSort remoteFilter>
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
						<el-table-column label="联系方式" prop="userMobile" width="150"   show-overflow-tooltip></el-table-column>
						<el-table-column label="状态" prop="userStatus" width="80">
							<template #default="scope">
								<el-badge v-if="scope.row.userSys === 1">
									<el-tag size="small" v-if="scope.row.userStatus == 1" >启用</el-tag>
									<el-tag size="small"  v-else >禁用</el-tag>
								</el-badge>
								<el-switch  v-if="scope.row.userSys === 0" v-model="scope.row.userStatus" @change="changeSwitch($event, scope.row)"  :loading="scope.row.$switch_status" :active-value="1" :inactive-value="0"></el-switch>
							</template>
						</el-table-column>
						<el-table-column label="邮箱" prop="userEmail" width="150"   show-overflow-tooltip></el-table-column>
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
						<el-table-column label="操作" fixed="right" align="right" width="260">
							<template #default="scope">
								<el-button-group>
									<el-button text type="primary" size="small" @click="table_show(scope.row, scope.$index)">查看</el-button>
									<el-button v-auth="'sys:user:edit'" text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
									<el-button  v-auth="'sys:user:reset'" text type="primary" size="small" @click="resetPassword(scope.row, scope.$index)">密码重置</el-button>
									<el-popconfirm   v-if="scope.row.userSys === 0" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
										<template #reference>
											<el-button  v-auth="'sys:user:del'" text type="primary" size="small">删除</el-button>
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
				header: [
					{name: 'userCode', label: '编号'},
					{name: 'username', label: '登录账号'},
					{name: 'userRealName', label: '姓名'},
					{name: 'userMobile', label: '联系方式'},
					{name: 'deptName', label: '所属部门'},
				],
				total: 0,
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
			//重置密码
			resetPassword(row){
				this.$API.system.user.reset.reset({userId: row.userId}).then(res => {
					if(res.code == '00000'){
						this.$notify.success({title: '提示', message: '操作成功'})
					} else {
						this.$notify.error({title: '提示', message: res.msg})
					}
				 })
			},
			//编辑
			table_edit(row){
				this.dialog.save = true
				this.$nextTick(() => {
					this.$refs.saveDialog.open('edit').setData(row)
				})
			},
			//表格内开关
			changeSwitch(val, row){
				row.$switch_status = true;
				this.$API.system.user.update.put({
					userId: row.userId,
					userStatus: val,
				}).then(res => {
					if(res.code === '00000') {
						this.$notify.success({title: '提示', message : "操作成功"})
						row.userStatus = val
					}else{
						this.$notify.error({title: '提示', message : res.msg})
						row.userStatus = val ? 0 : 1
					}
				}).finally(() => row.$switch_status = false)
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
			returnChange(res, d, total) {
				this.total = total;

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
					this.$refs.table.tableData.filter(item => item.userId===data.userId ).forEach(item => {
						Object.assign(item, data)
					})
				}
			}
		}
	}
</script>

<style>
</style>
