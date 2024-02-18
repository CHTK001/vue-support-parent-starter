<template>
    <el-dialog v-model="dialogStatus" width="500" draggable title="添加数据" :destroy-on-close="true">
        <el-form :model="form" :rules="rules" label-width="80px" status-icon>
            <el-form-item label="数据库" prop="name">
                <el-select v-model="form.name">
                    <el-option :value="item.name" v-for="item in data"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="索引" prop="key">
               <el-input placeholder="请输入索引" v-model="form.key"></el-input>
            </el-form-item>

            <el-form-item label="值" prop="value">
               <el-input placeholder="请输入value" v-model="form.value" type="textarea"></el-input>
            </el-form-item>
            <el-form-item label="ttl" prop="ttl">
               <el-input placeholder="请输入ttl" v-model="form.ttl" type="number"></el-input>
               <span class="el-form-item-msg" style="margin-left: 10px;">秒</span>
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
            form: {
                name: '0'
            },
            rules: {
                name: [{ required: true, message: '请选择数据库', trigger: 'change'}],
                key: [{ required: true, message: '请输入索引', trigger: 'blur'}],
                value: [{ required: true, message: '请输入value', trigger: 'blur'}],
            }
        }
    },
    methods: {
        open(data) {
            this.isSave = false;
            this.data = data?.data || [];
            if(data.selectData) {
                this.form.name = data.selectData;
            }
            this.form.genId = data?.genId;
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