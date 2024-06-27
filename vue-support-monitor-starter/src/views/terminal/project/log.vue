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
            form: {}
        }
    },
    unmounted() {
        this.visiable = false;
        this.form = {};
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
        afterPropertiesSet() {
            this.$API.project.logstart.get({id: item.terminalProjectId, event: 'terminal-project-' + new Date().getTime()}).then(res => {
                if(res.code == '00000') {
                    this.$message.success('启动成功');
                } else {
                    this.$message.error(res.msg);
                }
            })
        }
    }

}
</script>