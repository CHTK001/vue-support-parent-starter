<template>

    <el-dialog draggable v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')" :title="title">
		<el-form :rules="rule" :model="form" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="环境" prop="unifiedConfigProfile">
                <el-select allow-create	filterable v-model="row.unifiedConfigProfile">
                    <el-option v-for="it in profiles" :label="it.unifiedProfileDesc" :value="it.unifiedProfileName"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item label="应用名称" prop="unifiedAppname">
                <el-select allow-create	filterable v-model="row.unifiedAppname">
                    <el-option v-for="it in applications" :label="it.unifiedExecuterName" :value="it.unifiedAppname"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item  label="配置名称" prop="unifiedConfigName">
				<el-input  v-model="row.unifiedConfigName" clearable></el-input>
			</el-form-item>
            <el-form-item label="配置值" prop="unifiedConfigValue">
				<el-input v-model="row.unifiedConfigValue" clearable></el-input>
			</el-form-item>
            <el-form-item label="描述" prop="unifiedConfigDesc">
				<el-input v-model="row.unifiedConfigValue" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(0)">保 存</el-button>
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
            profiles: [],
            row: {},
            applications: [],
            list: {
                apiObj: this.$API.unified.config.page,
                apiObjUpdate: this.$API.unified.config.update,
                apiObjSave: this.$API.unified.config.save,
                apiObjDelete: this.$API.unified.config.delete,
            },
            rule: {
                unifiedConfigProfile: [{ required: true, message: '请选择配置所属环境', trigger: 'blur' }],
                unifiedAppname: [{ required: true, message: '请选择应用', trigger: 'blur' }],
                unifiedConfigName: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
                unifiedConfigValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],

            },
        }
    },
    methods: {
        open(mode = 'add') {
            this.mode = mode;
            this.visible = 1;
            return this;
        },
        setData(applications, profiles, row) {
            if(this.mode == 'edit') {
                this.title = '编辑[ ' + row.unifiedConfigName + ' ]';
            }else {
                this.title= '新增配置项';
            }
            this.profiles = profiles;
            this.applications = applications;
            this.row = row || {};
        },
        submitFormUpdate(isRefresh) {
            this.$refs.dialogForm.validate(it => {
                if(it) {
                    this.list.apiObjSave.post(this.row ).then(res => {
                        if(res.code === '00000') {
                            if(isRefresh !== 0) {
                                this.search();
                            }
                            this.visible = !1;
                            return 0;
                        } 
                        this.$message.error(res.msg);
                    })
                }
            })
            
        },
    }
}

</script>