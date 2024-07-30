<template>
    <el-dialog draggable v-model="visible" title="配置" width="50%" destroy-on-close @closed="close" >
        <el-form :status-icon="true" :model="form" :rules="rules1" :disabled="mode == 'show'" ref="dialogForm" label-width="160px" label-position="left">
        <!-- 
            <el-form-item label="限流方式">
                <el-switch :active-value=1 :inactive-value=0 active-text="IP地址限流" inactive-text="请求地址限流" inline-prompt v-model="form.limitBlack"></el-switch>
            </el-form-item> -->

            <el-form-item label="名称" prop="proxyStatisticName">
                <el-input v-model="form.proxyStatisticName" clearable placeholder="请输入名称"></el-input>
            </el-form-item>

            <el-form-item label="对外映射地址" prop="proxyStatisticUrl">
                <el-input v-model="form.proxyStatisticUrl" clearable placeholder="请输入对外映射地址"></el-input>
            </el-form-item>

            <el-form-item label="协议" prop="proxyStatisticProtocol">
                <!-- <el-input v-model="form.proxyStatisticProtocol" clearable placeholder="请输入协议"></el-input> -->
                <el-select v-model="form.proxyStatisticProtocol"  clearable filterable style="width: 100%;">
                    <el-option key="http" label="HTTP" value="http"></el-option>
                    <el-option key="https" label="HTTPS" value="https"></el-option>
                    <el-option key="ws" label="WS" value="ws"></el-option>
                </el-select>
                
            </el-form-item>

            <el-form-item label="实际地址" prop="proxyStatisticHostname">
                <el-input v-model="form.proxyStatisticHostname" clearable placeholder="请输入实际地址"></el-input>
            </el-form-item>

            <el-form-item label="权重" prop="proxyStatisticWeight">
                <el-input v-model="form.proxyStatisticWeight" clearable placeholder="请输入限流地址" type="number"></el-input>
            </el-form-item>

            <el-form-item label="是否开启" prop="proxyStatisticStatus">
                <el-switch v-model="form.proxyStatisticStatus" clearable :active-value=1 :inactive-value=0></el-switch>
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
            mode: 'add',
            visible: !1,
            rules1: {
                proxyStatisticName: [
                    { required: true, message: '请输入名称', trigger: 'blur' }
                ],
                proxyStatisticUrl: [
                    { required: true, message: '请输入对外映射地址', trigger: 'blur' }
                ],
                proxyStatisticProtocol: [
                    { required: true, message: '请输入协议', trigger: 'blur'}
                ],
                proxyStatisticHostname: [
                    { required: true, message: '请输入实际地址', trigger: 'blur' }
                ]
            }
        }
    },
    methods: {
        setData(row) {
            Object.assign(this.form, row);
            return this;
        },
        open(mode = 'add') {
            this.mode = mode;
            this.visible = !0;
            if('add' == mode){
                this.form.proxyStatisticWeight = 1;
                this.form.proxyStatisticStatus = 1;
            }   
         },
        close() {
            this.visible = !1;
            this.form = {};
            this.mode = 'add';
            this.$emit('closed')
        },
        submitFormUpdate(row) {
            this.$refs.dialogForm.validate((valid) => {
                if (valid) {
                    if (!row.proxyStatisticId) {
                        this.$API.proxy_statistic.save.post(row ).then(res => {
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
                    this.$API.proxy_statistic.update.put(row).then(res => {
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