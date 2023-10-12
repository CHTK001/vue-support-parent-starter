<template>
    <el-dialog title="新增" v-model="dialogStatus" :close-on-click-modal="false" width="380px"  destroy-on-close @closed="$emit('closed')" draggable>
       <el-form :model="data" label-width="80px" status-icon :rules="rules">
           <el-form-item label="名称" prop="httpConfigName">
               <el-input v-model="data.httpConfigName" />
           </el-form-item>
       </el-form>
       <el-form :model="data" label-width="80px" status-icon>
           <el-form-item label="值" prop="httpConfigValue">
               <el-input v-model="data.httpConfigValue" />
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
                httpConfigStatus: 1
           },
           mode: 'add',
           rules: {
            httpConfigName: [{message: '名称不能为空', required: true, trigger: 'blur'}],
            httpConfigValue: [{message: '值不能为空', required: true, trigger: 'blur'}],
           }
       }
   },
   methods: {
       open(data, mode) {
           this.dialogStatus = true;
           this.mode = mode || 'add';
           Object.assign(this.data, data)
       },
       onsubmit() {
           this.isSave = true;
           if(!this.data.genId) {
                this.$message.success('权限不足');
                return;
           }
           if(this.mode === 'add') {
                this.$API.gen.nginx.config.save.post(this.data).then(res => {
                    if(res.code == '00000') {
                        this.dialogStatus = false;
                        this.$emit('success', res.data, this.mode)
                        return;
                    }
                    this.$message.error(res.msg);
                }).finally(() => this.isSave = false);
                return;
            }

            this.$API.gen.nginx.config.update.put(this.data).then(res => {
                if(res.code == '00000') {
                    this.dialogStatus = false;
                    this.$emit('success', this.data, this.mode)
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isSave = false);
        }
   }

}
</script>