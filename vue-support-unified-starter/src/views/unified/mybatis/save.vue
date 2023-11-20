<template>

    <el-dialog draggable v-model="visible" width="50%" destroy-on-close @closed="$emit('closed')" :title="title">
		<el-form :model="form" :disabled="mode=='show'" :rules="rule" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="环境" prop="unifiedMybatisProfile">
                <el-select allow-create	filterable v-model="row.unifiedMybatisProfile">
                    <el-option v-for="it in profiles" :label="it.unifiedProfileDesc" :value="it.unifiedProfileName"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item label="应用名称" prop="unifiedAppname">
                <el-select allow-create	filterable v-model="row.unifiedAppname">
                    <el-option v-for="it in applications" :label="it.unifiedExecuterName" :value="it.unifiedAppname"></el-option>
                </el-select>
			</el-form-item>
			
            <el-form-item  label="方法名称" prop="unifiedMybatisName">
				<el-input  v-model="row.unifiedMybatisName" clearable></el-input>
			</el-form-item>

            <el-form-item  label="实体类名称" prop="unifiedMybaticModelType">
				<el-input  v-model="row.unifiedMybaticModelType" clearable placeholder="实体类名称"></el-input>
                <span class="el-form-item-msg" style="margin-left: 10px;">com.chua.starter.unified.server.support.entity.UnifiedMybatis</span>
			</el-form-item>

            <el-form-item  label="Mapper类型名称" prop="unifiedMybaticMapperType">
				<el-input  v-model="row.unifiedMybaticMapperType" clearable placeholder="Mapper类型名称"></el-input>
                <span class="el-form-item-msg" style="margin-left: 10px;">com.chua.starter.unified.server.support.mapper.UnifiedMybatisMapper</span>
			</el-form-item>

            <el-form-item label="Sql" prop="unifiedConfigSql" class="relative">
                <el-radio-group :disabled="mode == 'view'" v-model="row.unifiedMybatisSqlType">
					<el-radio :disabled="mode == 'view'" label="sql">SQL</el-radio>
					<el-radio :disabled="mode == 'view'"  label="xml">XML</el-radio>
				</el-radio-group>
                <el-icon class="cursor-pointer pl-10" @click="openEditor"><component is="el-icon-setting" /></el-icon>
			</el-form-item>
            	
            <el-form-item  label="描述" prop="unifiedMybatisDesc">
				<el-input  v-model="row.unifiedMybatisDesc" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(0)">保 存</el-button>
		</template>
	</el-dialog>

    <el-dialog :title="editTitle" v-model="dialogStatus" :close-on-click-modal="false" width="60%" :destroy-on-close="true" @closed="$emit('closed')" draggable>
        <el-form :model="row" ref="formRef" label-width="80px" status-icon :rules="rules">
            <el-form-item label="模板" prop="templateContent">
                <sc-code-editor style="width:100%" v-model="row.unifiedMybatisSql" :options="options"  :mode="row.unifiedMybatisSqlType"></sc-code-editor>
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogStatus = false">取消</el-button>
                <el-button type="primary"  @click="dialogStatus = false">
                    保存
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
    components: {
        scCodeEditor
    },
    data() {
        return {
            options: {
                col: 300,
                height: 1000,
                hintOptions: { // 自定义提示选项
                    completeSingle: false,
                }
            },
            dialogStatus: false,
            visible: 0,
            mode: '',
            editTitle: '',
            title: '',
            profiles: [],
            row: {},
            rule: {
                unifiedMybatisName: [{ required: true, message: '请输入方法名称', trigger: 'blur' }],
                unifiedAppname: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
                unifiedMybatisProfile: [{ required: true, message: '请选择profile', trigger: 'change' }],
                unifiedProfileName: [{ required: true, message: '请输入名称', trigger: 'blur' }],
                unifiedMybaticMapperType: [{ required: true, message: '请输入Mapper类型', trigger: 'change' }],
                unifiedMybaticModelType: [{ required: true, message: '请输入Entity类型', trigger: 'change' }],
                unifiedMybatisSqlType: [{ required: true, message: '请选择类型', trigger: 'change' }],
                unifiedMybatisSql: [{ required: true, message: '请输入sql', trigger: 'blur' }],
            },
            applications: [],
            list: {
                apiObj: this.$API.unified.mybatis.page,
                apiObjUpdate: this.$API.unified.mybatis.update,
                apiObjSave: this.$API.unified.mybatis.save,
                apiObjDelete: this.$API.unified.mybatis.delete,
            },
        }
    },
    methods: {
        open(mode = 'add') {
            this.mode = mode;
            this.visible = 1;
            return this;
        },
        openEditor() {
            this.dialogStatus = true;
            this.editTitle =  '编辑配置项(模式: '+ this.row.unifiedMybatisSqlType +')';
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
            });
            
        },
    }
}

</script>
<style>
.cursor-pointer {
    cursor: pointer;
}
.pl-10 {
    margin-left: 10px;
}
</style>