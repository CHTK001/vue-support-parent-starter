<template>
    <el-dialog v-model="dialogStatus" width="500" draggable title="添加数据" :destroy-on-close="true">
        <el-form :model="form" :rules="rules" label-width="80px" status-icon>
            <el-form-item label="数据库" prop="dataId">
                <el-col :span="18">
                    <el-input placeholder="请输入节点" readonly disabled v-model="form.dataId"></el-input>
                </el-col>
                <el-col :span="6">
                    <el-button text plain @click="form.dataId = '/'">设置根目录</el-button>
                </el-col>
            </el-form-item>
            <el-form-item label="名称" prop="name">
               <el-input placeholder="请输入索引" v-model="form.name"></el-input>
            </el-form-item>

            <el-form-item label="值" prop="value">
               <el-input placeholder="请输入value" v-model="form.value" type="textarea"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogStatus = false">取消</el-button>
                <el-button type="primary" :loading="isSave" @click="onsubmit">
                提交
                </el-button>
            </span>
        </template>
    </el-dialog>    
</template>
<script>
export default {
    name: 'Monitor',
    data() {
        return {
            isSave: false,
            dialogStatus: false,
            data: [],
            root: '',
            form: {
                name: ''
            },
            rules: {
                name: [{ required: true, message: '请选择数据库', trigger: 'change'}],
                key: [{ required: true, message: '请输入索引', trigger: 'blur'}],
            }
        }
    },
    methods: {
        open(data) {
            this.isSave = false;
            this.data = data?.data || [];
            this.form.genId = data?.genId;
            this.form.dataId = data?.dataId || data?.name;
            this.root = data?.dataId || data?.name;
            delete this.form.key;
            delete this.form.value;
            delete this.form.ttl;
            this.dialogStatus = true;
        },
        onsubmit() {
            this.isSave = true;
            const query = {};
            query['genId'] = this.form.genId;
            query['name'] = this.form.name;
            query['dataId'] = this.form.dataId;
            query['data'] = this.form;
            this.$API.gen.session.save.post(query).then(res => {
                if(res.code == '00000') {
                    this.$message.success('保存成功');
                    this.dialogStatus = false;
                    this.$emit('success', this.form, this.mode)
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isSave = false);
        }
    }
}
</script>