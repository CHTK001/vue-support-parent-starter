<template>
    <el-dialog draggable v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')">
        <el-form :model="row" :rules="rules" :disabled="model == 'show'" ref="dialogForm" label-width="100px" label-position="left">
            <el-form-item v-show="false" label="索引" prop="monitorMybatisName">
                <el-input v-model="row.monitorMybatisId" clearable></el-input>
            </el-form-item>
            <el-form-item label="环境" prop="monitorMybatisProfile">
                <el-select allow-create filterable v-model="row.monitorMybatisProfile">
                    <el-option v-for="it in profiles" :label="it.label" :value="it.value"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item  label="应用名称" prop="monitorAppname">
                <el-select allow-create filterable v-model="row.monitorAppname">
                    <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="方法名称" prop="monitorMybatisName">
                <el-input  v-model="row.monitorMybatisName" clearable placeholder="请输入方法名称"></el-input>
            </el-form-item>

            <el-form-item label="Mapper" prop="monitorMybatisMapperType">
                <el-input  v-model="row.monitorMybatisMapperType" clearable placeholder="请输入Mapper名称" ></el-input>
            </el-form-item>

            <el-form-item label="Model" prop="monitorMybatisModelType">
                <el-input  v-model="row.monitorMybatisModelType" clearable placeholder="请输入Model名称" ></el-input>
            </el-form-item>

            <el-form-item label="配置类型" prop="monitorMybatisSqlType">
                <el-select  v-model="row.monitorMybatisSqlType" clearable placeholder="请输入配置类型">
                    <el-option label="SQL" value="sql"></el-option>
                    <el-option label="XML" value="xml"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="sql" prop="monitorMybatisSql" v-if="row.monitorMybatisSqlType">
                <template-icon :formValue="row.monitorMybatisSql" :mode="row.monitorMybatisSqlType" @success="handleEvent" ></template-icon>
            </el-form-item>

            <el-form-item label="描述" prop="monitorMybatisDesc">
                <el-input type="textarea" v-model="row.monitorMybatisDesc" clearable placeholder="请输入描述"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="model != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(row)">保 存</el-button>
        </template>
    </el-dialog>
</template>
<script>
import TemplateIcon from './template.vue';
export default {
    components: {TemplateIcon},
    data(){
        return {
            rules: {
                    monitorMybatisProfile: [
                        { required: true, message: '请选择环境', trigger: 'change' }
                    ],
                    monitorAppname: [
                        { required: true, message: '请选择应用名称', trigger: 'change' }
                    ],
                    monitorMybatisName: [
                        { required: true, message: '请输入方法名称', trigger: 'change' },
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],
                    monitorMybatisSqlType: [
                        { required: true, message: '请选择配置类型', trigger: 'change' }
                    ],
                    monitorMybatisMapperType: [
                        { required: true, message: '请输入Mapper名称', trigger: 'change' },
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],
                    monitorMybatisModelType: [
                        { required: true, message: '请输入Model名称', trigger: 'change' },
                    ],
                    monitorMybatisSql: [
                        { required: true, message: '请输入sql', trigger: 'change' }
                    ],
                    monitorMybatisDesc: [
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],

            },
            list: {
                apiObj: this.$API.monitor.mybatis.page,
                apiObjUpdate: this.$API.monitor.mybatis.update,
                apiObjSave: this.$API.monitor.mybatis.save,
                apiObjUpload: this.$API.monitor.mybatis.upload,
                apiObjDelete: this.$API.monitor.mybatis.delete,
            },
            row: {},
            visible: false,
            isSaveing: false,
            apps: [],
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
        handleEvent(data){
            this.row.monitorMybatisSql = data;
        },
        submitFormInfo(row){
            this.isSaveing = true;
            if(!row.monitorMybatisId) {
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