<template>
    <el-dialog draggable v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
        <el-form :model="row" :rules="rule" :disabled="model == 'show'" ref="dialogForm" label-width="100px" label-position="left">
            <el-form-item v-show="false" label="索引" prop="configName">
                <el-input v-model="row.configId" clearable></el-input>
            </el-form-item>
            <el-form-item label="环境" prop="configProfile">
                <el-select allow-create filterable v-model="row.configProfile">
                    <el-option v-for="it in profiles" :label="it.label" :value="it.value"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="应用名称" prop="configAppname">
                <el-select allow-create filterable v-model="row.configAppname">
                    <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="配置名称" prop="configName">
                <el-input  v-model="row.configName" clearable></el-input>
            </el-form-item>
            <el-form-item label="配置值" prop="configValue">
                <el-input v-model="row.configValue" clearable></el-input>
            </el-form-item>
            <el-form-item label="描述" prop="configDesc">
                <el-input v-model="row.configDesc" clearable></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="model != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(row)">保 存</el-button>
        </template>
    </el-dialog>
</template>
<script>
export default {
    data(){
        return {
            rule: {
                configName: [
                    { required: true, message: '请输入配置名称', trigger: 'change' },
                    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                ],
                configProfile: [
                    { required: true, message: '请选择环境', trigger: 'change' }],
                configAppname: [
                    { required: true, message: '请选择应用名称', trigger: 'change' }],
                configValue: [
                    { required: true, message: '请输入配置值', trigger: 'change' }],
            },
            list: {
                apiObj: this.$API.monitor.config.page,
                apiObjUpdate: this.$API.monitor.config.update,
                apiObjSave: this.$API.monitor.config.save,
                apiObjUpload: this.$API.monitor.config.upload,
                apiObjDelete: this.$API.monitor.config.delete,
            },
            row: {},
            visible: false,
            isSaveing: false,
            apps:[],
            profiles: [],
            model: '',
        }
    },

    methods: {
        open(model ='add') {
            this.visible = true;
            this.isSaveing = false;
            this.model = model;
            return this;
        },
        setData(row, apps, profiles){
            this.row = row;
            this.apps = apps;
            this.profiles = profiles;
        },
        submitFormInfo(row){
            this.isSaveing = true;
            if(!row.configId) {
                this.list.apiObjSave.post(row || this.row).then(res => {
                    if (res.code === '00000') {
                        this.$emit('success');
                        this.visible = !1;
                        return 0;
                    }
                    this.$message.error(res.msg);
                }).finally(() => this.isSaveing = false);
                return false;
            }
            this.list.apiObjUpdate.put(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.$emit('success');
                    this.visible = !1;
                    return 0;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isSaveing = false);
        },
        submitFormUpdate(row) {
            if( !this.$refs.dialogForm) {
                return !1;
            }
            this.$refs.dialogForm.validate(valid => {
                if(valid) {
                    this.submitFormInfo(row);
                }
            })
        },
    }
}

</script>