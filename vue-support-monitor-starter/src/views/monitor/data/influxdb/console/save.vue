<template>
    <el-dialog v-model="dialogStatus" width="500" draggable title="添加字段描述" :destroy-on-close="true">
        <el-form :model="form" :rules="rules" label-width="80px" status-icon>
            <el-form-item label="数据库" prop="remarkDababase">
               <el-input readonly disabled placeholder="请输入数据库" v-model="form.remarkDababase"></el-input>
            </el-form-item>

            <el-form-item label="数据表" prop="remarkTable">
               <el-input readonly disabled placeholder="请输入数据表" v-model="form.remarkTable"></el-input>
            </el-form-item>

            
            <el-form-item label="字段" prop="remarkColumn">
               <el-input readonly disabled placeholder="请输入字段" v-model="form.remarkColumn"></el-input>
            </el-form-item>


            <el-form-item label="字段描述" prop="remarkName">
                <el-input  placeholder="请输入字段描述" v-model="form.remarkName"></el-input>
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
            },
            rules: {
            }
        }
    },
    methods: {
        open(data, genId) {
            this.isSave = false;
            this.data = data;
            this.form.genId = genId;
            this.dialogStatus = true;
            this.form.remarkColumn = data.name;
            this.form.remarkDatabase = data.databaseName;
            this.form.remarkName =  data.name;
            this.form.remarkTable = data.tableName;
        },
        onsubmit() {
            this.isSave = true;
            this.$API.gen.remark.save.post(this.form).then(res => {
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