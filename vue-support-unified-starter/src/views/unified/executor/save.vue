<template>
     <el-dialog :title="title" draggable v-model="visible" width="56%" destroy-on-close @closed="$emit('closed')">
		<el-form :model="row" :rules="rules" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item  label="应用名称" prop="unifiedAppname">
				<el-input :disabled="mode == 'view'" v-model="row.unifiedAppname" clearable></el-input>
			</el-form-item>
            <el-form-item label="执行器名称" prop="unifiedExecuterName">
				<el-input :disabled="mode == 'view'" v-model="row.unifiedExecuterName" clearable></el-input>
			</el-form-item>
            <el-form-item label="执行器类型" prop="unifiedExecuterType">
				<el-radio-group :disabled="mode == 'view'" v-model="row.unifiedExecuterType">
					<el-radio :disabled="mode == 'view'" label="0">自动注册</el-radio>
					<el-radio :disabled="mode == 'view'"  label="1">手动录入</el-radio>
				</el-radio-group>
			</el-form-item>


            <el-form ref="ruleForm" v-if="row.unifiedExecuterType == 1" :model="formItem" label-width="100px">
				<el-form-item label="表格" prop="list">
					<sc-form-table ref="table" v-model="formItem" :addTemplate="addTemplate" drag-sort placeholder="暂无数据">
						<el-table-column prop="unifiedExecuterItemHost" label="地址" >
							<template #default="scope">
								<el-input v-model="scope.row.unifiedExecuterItemHost" placeholder="请输入地址"></el-input>
							</template>
						</el-table-column>

						<el-table-column prop="unifiedExecuterItemPort" label="端口" >
							<template #default="scope">
								<el-input v-model="scope.row.unifiedExecuterItemPort" placeholder="请输入端口" type="number"></el-input>
							</template>
						</el-table-column>

						<el-table-column prop="unifiedExecuterItemProfile" label="环境"  align="center">
							<template #default="scope">
								<el-input v-model="scope.row.unifiedExecuterItemProfile" placeholder="请输入环境"></el-input>
							</template>
						</el-table-column>
					</sc-form-table>
				</el-form-item>
			</el-form>

			<el-form v-else>
				<el-table :data="formItem" border stripe>
					<el-table-column prop="unifiedExecuterItemHost" label="地址" />
					<el-table-column prop="unifiedExecuterItemPort" label="端口" />
					<el-table-column prop="unifiedExecuterItemProfile" label="环境" />
					<el-table-column prop="unifiedExecuterItemSubscribe" label="参数" />
				</el-table>
				
			</el-form>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate()">保 存</el-button>
		</template>
	</el-dialog>
</template>
<script>

export default {
    data() {
        return {
            visible: 0,
            mode: '',
			title: '',
			rules: {
				unifiedAppname: [{ required: true, message: '请输入应用名称', trigger: 'blur'}],
				unifiedExecuterName: [{ required: true, message: '请输入执行器名称', trigger: 'blur'}],
				unifiedExecuterType: [{ required: true, message: '请选择执行器类型', trigger: 'change'}],
			},
			formItem: [],
            title: '',
            profiles: [],
            row: {},
			isSaveing: false,
			addTemplate: {
				unifiedExecuterItemHost: '',
				unifiedExecuterItemPort: '',
				unifiedExecuterItemProfile: '',
			},
            applications: [],
            list: {
                apiObj: this.$API.unified.config.page,
                apiObjUpdate: this.$API.unified.config.update,
                apiObjSave: this.$API.unified.config.save,
                apiObjDelete: this.$API.unified.config.delete,
            },
        }
    },
    methods: {
		resetForm(){
			this.$refs.ruleForm.resetFields();
		},
        open(mode = 'add') {
            this.mode = mode;
            this.visible = 1;
            return this;
        },
        setData(applications, profiles, row) {
			if(this.mode == 'edit') {
                this.title = '编辑[ ' + row.unifiedExecuterName + ' ]';
            }else {
                this.title= '新增执行器';
            }
            this.profiles = profiles;
            this.applications = applications;
            this.row = row;
			this.formItem = row?.item || [];
        },
		submitFormUpdate() {
			debugger
		},
    }
}

</script>