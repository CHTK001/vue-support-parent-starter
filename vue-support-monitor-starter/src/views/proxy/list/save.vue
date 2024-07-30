<template>
    <el-dialog draggable v-model="visible" title="配置" width="50%" destroy-on-close @closed="close" >
        <el-form :status-icon="true" :model="form" :rules="rules1" :disabled="mode == 'show'" ref="dialogForm" label-width="160px" label-position="left">
        <!-- 
            <el-form-item label="限流方式">
                <el-switch :active-value=1 :inactive-value=0 active-text="IP地址限流" inactive-text="请求地址限流" inline-prompt v-model="form.limitBlack"></el-switch>
            </el-form-item> -->

            <div v-if="form.listType == 0">
                <el-form-item label="限流地址" prop="limitUrl">
                    <el-input v-model="form.listUrl" clearable placeholder="请输入限流地址"></el-input>
                </el-form-item>
            </div>
            <div v-else>
                <el-form-item label="限流地址" prop="listIp">
                    <ip-input v-model="form.listIp" ></ip-input>
                </el-form-item>
            </div>
            <el-form-item label="是否开启" prop="limitStatus">
                <el-switch v-model="form.listStatus" clearable :active-value=1 :inactive-value=0></el-switch>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(form)">保 存</el-button>
        </template>
    </el-dialog>
</template>
<script>

export default {

    data() {
        return {
            form: {},
            limitType: null,
            mode: 'add',
            visible: !1,
            rules1: {
            }
        }
    },
    methods: {
        setData(row, listType) {
            Object.assign(this.form, row);
            this.listType = listType;
            this.form.listType = listType;
            if(listType == 0) {
                this.rules1.listUrl = [
                    { required: true, message: '请输入限流地址', trigger: 'blur' },
                ]
            }
            if(listType == 1) {
                this.rules1.listIp =  [
                    { required: true, message: '请输入限流地址', trigger: 'blur' },
                ]
            }
            this.form.listStatus = 1;
            return this;
        },
        open(mode = 'add') {
            this.mode = mode;
            this.visible = !0;
            if('add' == mode){
                this.form.listStatus = 1;
            }  
        },
        close() {
            this.visible = !1;
            this.form = {};
            this.listType = 'add';
            this.mode = 'add';
            this.$emit('closed')
        },
        submitFormUpdate(row) {
            this.$refs.dialogForm.validate((valid) => {
                if (valid) {
                    if (!row.listId) {
                        this.$API.proxy_list.save.post(row ).then(res => {
                            if (res.code === '00000') {
                                this.visible = !1;
                                this.$emit('success')
                                return 0;
                            }
                            this.$message.error(res.msg);
                        }).finally(() => {
                        })
                        return false;
                    }
                    this.$API.proxy_list.update.put(row).then(res => {
                        if (res.code === '00000') {
                            this.visible = !1;
                            this.$emit('success')
                            return 0;
                        }
                        this.$message.error(res.msg);
                    }).finally(() => {
                    })
                }
            })
            return;

        },
    }

}
</script>