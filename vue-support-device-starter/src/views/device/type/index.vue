<template>
    <el-container>
		<el-header>
			<div class="left-panel">
				<el-button type="primary" icon="el-icon-plus" @click="doSave"></el-button>
				<!-- <el-button type="primary" plain :disabled="selection.length!=1" @click="permission">权限设置</el-button> -->
			</div>
			<div class="right-panel">
				<div class="right-panel-search">
					<el-input v-model="form.keyword" placeholder="关键词" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="doSearch"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
			<el-table ref="table" :data="[deviceType]"  lazy  row-key="id"  stripe :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
				<el-table-column type="extend" width="50"></el-table-column>
				<el-table-column label="类型名称" prop="label" width="150" fixed></el-table-column>
				<el-table-column label="类型编码" prop="deviceTypeCode" >
					<template #default="scope">
						<el-tag v-if="scope.row.ext?.deviceTypeCode " type="success" >{{ scope.row.ext?.deviceTypeCode }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="排序" prop="deviceTypeSort">
					<template #default="scope">
						<span v-if="scope.row.ext?.deviceTypeSort">{{ scope.row.ext?.deviceTypeSort }}</span>
					</template>
				</el-table-column>
				<el-table-column label="创建时间" prop="createTime" >
					<template #default="scope">
						<el-tag v-if="scope.row.ext?.createTime" v-time="scope.row.ext?.createTime"></el-tag>
					</template>
				</el-table-column>
				<el-table-column label="备注" prop="deviceTypeRemark" show-overflow-tooltip>
					<template #default="scope">
						<span v-if="scope.row.ext?.deviceTypeRemark"> {{ scope.row.ext?.deviceTypeRemark }}</span>
					</template>
				</el-table-column>
				<el-table-column label="更新时间" prop="updateTime" >
					<template #default="scope">
						<el-tag v-if="scope.row.ext?.updateTime" v-time="scope.row.ext.updateTime"></el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" align="right" width="170">
					<template #default="scope">
						<el-button-group>
							<el-button  text type="primary" size="small" @click="doEdit(scope.row?.ext, scope.$index)">编辑</el-button>
							<el-popconfirm title="确定删除吗？" @confirm="doDelete(scope.row?.ext, scope.$index)">
								<template #reference>
									<el-button text type="primary" size="small">删除</el-button>
								</template>
							</el-popconfirm>
						</el-button-group>
					</template>
				</el-table-column>
			</el-table>
		</el-main>
	</el-container>
	<save-dialog ref="saveDialogRef" v-if="saveDialogStatus" @success="successHandler"></save-dialog>
</template>
<script>
import saveDialog from './save.vue'
export default {
	components: {saveDialog},
	data() {
		return {
			saveDialogStatus: false,
			form: {
				page: 1,
			},
			returnData: [],
			deviceType: {},
			apiObj: this.$API.device.type.list,
		}
	},
	mounted(){
		this.registerDeviceType();
	},
	methods: {
		async registerDeviceType(){
			const res = await this.$API.device.type.tree.get();
			if (res.code == '00000') {
				this.deviceType = res.data;
			} else {
				this.$message.error(res.msg)
			}
		},
		doSave(){
			this.saveDialogStatus = true;
			this.$nextTick(()	=>{
				this.$refs.saveDialogRef.open('add').setData({}, this.deviceType);
			})
		},
		doEdit(item){
			this.saveDialogStatus = true;
			this.$nextTick(()	=>{
				this.$refs.saveDialogRef.open('edit').setData(item, this.deviceType);
			})
		},
		doDelete(item){
			this.$API.device.type.delete.delete({ id: item.deviceTypeId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
				this.successHandler();
            })
		},
		successHandler() {
			this.registerDeviceType();
		}
	}
}

</script>