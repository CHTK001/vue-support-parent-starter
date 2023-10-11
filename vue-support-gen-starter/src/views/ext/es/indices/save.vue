<template>
     <el-dialog title="新增" v-model="dialogStatus" :close-on-click-modal="false" width="380px"  destroy-on-close @closed="$emit('closed')" draggable>
        <el-form :model="data" label-width="80px" status-icon>
            <el-form-item label="索引名称" prop="name">
                <el-input v-model="data.name" />
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
    name: 'SaveIndices',
    data() {
        return {
            dialogStatus: false,
            data : {
                dataId: 'CREATE_INDEX'
            }
        }
    },
    methods: {
        open(data) {
            this.dialogStatus = true;
            Object.assign(this.data, data)
        },
        onsubmit() {
            this.isSave = true;
            this.$API.gen.session.save.post(this.data).then(res => {
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