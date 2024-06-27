<template>
    <el-dialog :title="title" v-model="visible" draggable :destroy-on-close="true" :close-on-click-modal="false">
        <el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="140px"
            label-position="left">
            <el-form-item label="项目名称" prop="terminalProjectName">
                <el-input v-model="form.terminalProjectName" clearable placeholder="请输入项目名称"></el-input>
            </el-form-item>

            <el-form-item label="项目地址" prop="terminalProjectPath">
                <el-input v-model="form.terminalProjectPath" clearable placeholder="请输入项目地址"></el-input>
            </el-form-item>

            <el-form-item label="项目启动脚本" prop="terminalProjectStartScript">
                <el-input v-model="form.terminalProjectStartScript" clearable placeholder="请输入项目启动脚本"></el-input>
            </el-form-item>

            <el-form-item label="项目停止脚本" prop="terminalProjectEndScript">
                <el-input v-model="form.terminalProjectEndScript" clearable placeholder="请输入项目停止脚本"></el-input>
            </el-form-item>

            <el-form-item label="日志文件地址" prop="terminalProjectLog">
                <el-input v-model="form.terminalProjectLog" clearable placeholder="请输入日志文件地址"></el-input>
            </el-form-item>

            <el-form-item label="项目描述" prop="terminalProjectDesc">
                <el-input v-model="form.terminalProjectDesc" clearable placeholder="请输入项目描述"></el-input>
            </el-form-item>

        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="doSave()">保 存</el-button>
        </template>
    </el-dialog>
</template>
<script>

export default {

    data() {
        return {
            form: {},
            rules: {
                terminalProjectName: [
                    { required: true, message: '请输入项目名称', trigger: 'blur' }
                ],
                terminalProjectPath: [
                    { required: true, message: '请输入项目地址', trigger: 'blur' }
                ],
                terminalProjectStartScript: [
                    { required: true, message: '请输入项目启动脚本', trigger: 'blur' }
                ],
                terminalProjectEndScript: [
                    { required: true, message: '请输入项目停止脚本', trigger: 'blur' }
                ],
            },
            visible: false,
            title: '',
            mode: ''
        }
    },
    unmounted() {
        this.visible = false;
    },
    methods: {
        open(mode = 'add') {
            this.visible = true;
            this.mode = mode;
            return this;
        },
        setData(item) {
            Object.assign(this.form, item);
            if (this.mode === 'edit') {
                this.title = '编辑项目';
            } else {
                this.title = '添加项目';
            }
        },
        doSave(){
            var promiseAll = null;
            if(this.mode == 'add') {
                promiseAll = this.$API.project.save.post(this.form);
            } else if(this.mode == 'edit'){
                promiseAll = this.$API.project.update.put(this.form);
            }

            promiseAll.then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.$emit('success', res, this.mode)
                this.visible = false;
            })
        }
    }

}

</script>