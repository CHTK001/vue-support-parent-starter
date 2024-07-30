<template>
    <el-dialog draggable v-model="visible" title="配置" width="50%" destroy-on-close @closed="close" >
        <el-form :status-icon="true" :model="form" :rules="rules1" :disabled="mode == 'show'" ref="dialogForm" label-width="160px" label-position="left">
        <!-- 
            <el-form-item label="限流方式">
                <el-switch :active-value=1 :inactive-value=0 active-text="IP地址限流" inactive-text="请求地址限流" inline-prompt v-model="form.limitBlack"></el-switch>
            </el-form-item> -->

            <div v-if="form.limitType == 0">
                <el-form-item label="限流地址" prop="limitUrl">
                    <el-input v-model="form.limitUrl" clearable placeholder="请输入限流地址"></el-input>
                </el-form-item>
            </div>
            <div v-else>
                <el-form-item label="限流地址" prop="limitAddress">
                    <ip-input v-model="form.limitAddress" ></ip-input>
                </el-form-item>
            </div>
            <el-form-item label="每秒访问次数" prop="limitPermitsPerSecond">
                <el-input type="number" v-model="form.limitPermitsPerSecond" clearable placeholder="请输入限流次数"></el-input>
            </el-form-item>
            <el-form-item label="是否开启" prop="limitDisable">
                <el-switch v-model="form.limitDisable" clearable :active-value=1 :inactive-value=0></el-switch>
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
                limitPermitsPerSecond: [
                    { required: true, message: '请输入限流次数', trigger: 'blur' },
                ] 
            }
        }
    },
    methods: {
        setData(row, limitType) {
            Object.assign(this.form, row);
            this.limitType = limitType;
            this.form.limitType = limitType;
            if(limitType == 0) {
                this.rules1.limitUrl = [
                    { required: true, message: '请输入限流地址', trigger: 'blur' },
                ]
            }
            if(limitType == 1) {
                this.rules1.limitAddress =  [
                    { required: true, message: '请输入限流地址', trigger: 'blur' },
                ]
            }
            this.form.limitDisable = 1;
            return this;
        },
        open(mode = 'add') {
            this.mode = mode;
            this.visible = !0;
            this.rules1 = {
                limitPermitsPerSecond: [
                    { required: true, message: '请输入限流次数', trigger: 'blur' },
                ] 
            }
        },
        close() {
            this.visible = !1;
            this.form = {};
            this.limitType = 'add';
            this.mode = 'add';
            this.$emit('closed')
        },
        submitFormUpdate(row) {
            this.$refs.dialogForm.validate((valid) => {
                if (valid) {
                    if (!row.limitId) {
                        this.$API.proxy_limit.save.post(row ).then(res => {
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
                    this.$API.proxy_limit.update.put(row).then(res => {
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