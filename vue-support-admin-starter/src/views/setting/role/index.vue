<template>
	<el-container>
		<el-header>
			<div class="left-panel">
				<el-button type="primary" icon="el-icon-plus" @click="add"></el-button>
				<el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button>
				<!-- <el-button type="primary" plain :disabled="selection.length!=1" @click="permission">权限设置</el-button> -->
			</div>
			<div class="right-panel">
				<div class="right-panel-search">
					<el-input v-model="search.keyword" placeholder="角色名称" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
			<scTable ref="table" :apiObj="apiObj" row-key="id"  @selection-change="selectionChange" stripe>
				<el-table-column type="selection" width="50"></el-table-column>
				<el-table-column label="#" type="index" width="50"></el-table-column>
				<el-table-column label="角色名称" prop="roleName" width="150">
					<template #default="scope">
						<span  v-if="new Date().getTime() - new Date(scope.row.createTime || 0 ).getTime() < 86400000">
							<el-badge is-dot>
								{{ scope.row.roleName }}
							</el-badge>
						</span>
						<span v-else >{{ scope.row.roleName }}</span>
						
					</template>
				</el-table-column>
				<el-table-column label="角色编码" prop="roleCode" width="200"></el-table-column>
				<el-table-column label="排序" prop="roleSort" width="80"></el-table-column>
				<el-table-column label="状态" prop="roleStatus" width="80" >
					<template #default="scope">
						<el-badge v-if="scope.row.roleSys === 1">
							<el-tag size="small" v-if="scope.row.roleStatus == 1" >启用</el-tag>
							<el-tag size="small"  v-else >禁用</el-tag>
						</el-badge>
						<el-switch  v-if="scope.row.roleSys === 0" v-model="scope.row.roleStatus" @change="changeSwitch($event, scope.row)"  :loading="scope.row.$switch_status" :active-value="1" :inactive-value="0"></el-switch>
					</template>
				</el-table-column>
				<el-table-column label="系统预留" prop="roleSys" width="100">
						<template #default="scope">
							<el-badge  v-if="scope.row.roleSys === 1">
								<el-tag type="danger" size="small"  >是</el-tag>
							</el-badge>
							<el-tag  size="small" v-if="scope.row.roleSys === 0">否</el-tag>
						</template>
					</el-table-column>
				<el-table-column label="创建时间" prop="createTime" width="180"></el-table-column>
				<el-table-column label="数据权限" prop="roleDataScope" width="140">
					<template #default="scope">
						<el-tag v-if="scope.row.roleDataScope == 1">全部可见</el-tag>
						<el-tag v-if="scope.row.roleDataScope == 2">本人可见</el-tag>
						<el-tag v-if="scope.row.roleDataScope == 3">所在部门可见</el-tag>
						<el-tag v-if="scope.row.roleDataScope == 4">所在部门及子级可见</el-tag>
						<el-tag v-if="scope.row.roleDataScope == 5">选择的部门可见</el-tag>
						<el-tag v-if="scope.row.roleDataScope == 6">自定义</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" align="right" width="170">
					<template #default="scope">
						<el-button-group>
							<el-button text type="primary" size="small" @click="permission(scope.row)">权限</el-button>
							<el-button text type="primary" size="small" @click="table_show(scope.row, scope.$index)">查看</el-button>
							<el-button v-if="scope.row.roleSys == 0"  text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
							<el-popconfirm v-if="scope.row.roleSys == 0"  title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
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

	<save-dialog v-if="dialog.save" ref="saveDialog" @success="handleSaveSuccess" @closed="dialog.save=false"></save-dialog>

	<permission-dialog v-if="dialog.permission" ref="permissionDialog" @closed="dialog.permission=false"></permission-dialog>

</template>

<script>
	import saveDialog from './save.vue'
	import permissionDialog from './permission.vue'

	export default {
		name: 'role',
		components: {
			saveDialog,
			permissionDialog
		},
		data() {
			return {
				dialog: {
					save: false,
					permission: false
				},
				apiObj: this.$API.system.role.page,
				selection: [],
				search: {
					keyword: null
				}
			}
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
			//权限设置
			permission(item){
				this.dialog.permission = true
				this.$nextTick(() => {
					this.$refs.permissionDialog.open(item.roleId)
				})
			},
			//删除
			async table_del(row){
				var reqData = {roleId: row.roleId}
				var res = await this.$API.system.role.delete.delete(reqData);
				if(res.code == '00000'){
					this.$refs.table.refresh()
				}else{
					this.$message.error(res.msg)
				}
			},
			//批量删除
			async batch_del(){
				this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？如果删除项中含有子集将会被一并删除`, '提示', {
					type: 'warning'
				}).then(() => {
					const loading = this.$loading();
					const ids = [];
					this.selection.forEach(item => {
						ids.push(item.roleId);
					})
					 this.$API.system.role.batchDelete.delete({roleId: ids.join(',')}).then(res => {
						if(res.code == '00000'){
							this.$refs.table.refresh()
							this.$refs.table.refresh()
						}else{
							this.$message.error(res.msg)
						}
					 }).finally(() => loading.close())
				}).catch(() => {

				})
			},
			//表格选择后回调事件
			selectionChange(selection){
				this.selection = selection;
			},
			//表格内开关
			changeSwitch(val, row){
				row.$switch_status = true;
				this.$API.system.role.update.put({
					roleId: row.roleId,
					roleStatus: val,
				}).then(res => {
					if(res.code === '00000') {
						row.roleStatus = val
					}else{
						this.$message.error(res.msg)
						row.roleStatus = val ? 0 : 1
					}
				}).finally(() => row.$switch_status = false)
			},
			//搜索
			upsearch(){
				this.$refs.table.reload(this.search)
			},
			//根据ID获取树结构
			filterTree(id){
				var target = null;
				function filter(tree){
					tree.forEach(item => {
						if(item.id == id){
							target = item
						}
						if(item.children){
							filter(item.children)
						}
					})
				}
				filter(this.$refs.table.tableData)
				return target
			},
			//本地更新数据
			handleSaveSuccess(data, mode){
				if(mode=='add'){
					this.$refs.table.refresh()
				}else if(mode=='edit'){
					this.$refs.table.refresh()
				}
			}
		}
	}
</script>

<style>
</style>
