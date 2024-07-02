<template>
    <el-dialog title="title" width="600px" v-model="visible" :close-on-click-modal="false" :destroy-on-close="true">
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="handleCancel">取 消</el-button>
        <el-button size="small" type="primary" @click="handleOk" :loading="confirmLoading">确 定</el-button>
      </span>
    </el-dialog> 

</template>

<script>

export default {

    data() {
        return {
            visiable: false,
            form: {},
            event: 'terminal-project-' + new Date().getTime()
        }
    },
    unmounted() {
        this.distroy();

    },
    methods: {
        open() {
            this.visiable = true;
            return this;
        },
        setData(item) {
            Object.assign(this.form, item);
            this.afterPropertiesSet();
        },
        distroy() {
            if(!this.form.terminalProjectLog) {
                return;
            }
            this.visiable = false;
            this.form = {};
            this.$API.project.logstop.get({id: this.form.terminalProjectId, event: this.event}).then(res => {
                if(res.code != '00000') {
                    this.$message.error(res.msg);
                }
            })
        },
        afterPropertiesSet() {
            if(!this.form.terminalProjectLog) {
                return;
            }
            this.$API.project.logstart.get({id: this.form.terminalProjectId, event: this.event}).then(res => {
                if(res.code != '00000') {
                    this.$message.error(res.msg);
                }
            })
        }
    }

}
</script>