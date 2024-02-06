<template>
    <el-tabs tab-position="left" v-model="activeName" type="border-card" class="demo-tabs h-full" >
        <el-tab-pane ref="tabRef" label="系统日志" name="0">
            <log-dialog />
        </el-tab-pane>
        <el-tab-pane label="链路追踪" name="1">
            <trace-dialog />
        </el-tab-pane>
        <el-tab-pane label="访问链路" name="2">
            <link-dialog />
        </el-tab-pane>
        <el-tab-pane label="系统监控" name="3">
            <oshi-dialog />
        </el-tab-pane>
        <el-tab-pane label="系统终端" name="4">
            <terminal-dialog />
        </el-tab-pane>
    </el-tabs>
</template>
<script>
import Base64 from "@/utils/base64";
import useTabs from '@/utils/useTabs'
import LogDialog from '@/views/monitor/log/index.vue';
import TraceDialog from '@/views/monitor/trace/index.vue';
import LinkDialog from '@/views/monitor/link/index.vue';
import OshiDialog from '@/views/monitor/oshi/index.vue';
import TerminalDialog from '@/views/monitor/terminal/index.vue';
export default {
    components: {LogDialog, TraceDialog, LinkDialog, OshiDialog, TerminalDialog},
    data(){
        return {
            activeName: '0',
            form: {
                appValue: '',
                appModelValue: ''
            }
        }
    },

    mounted() {
        try{
            this.form.appValue = this.$route.query.appName;
            const item = JSON.parse(Base64.decode(this.$route.query.data));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
            document.title = this.form.appValue + '详情 - 监控管理';
            useTabs.setTitle(this.form.appValue + '详情')
        }catch(e){}
    },
}
</script>
<style>
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
.el-tabs .is-active::before {
    background-color: #0064c8;
    box-sizing: initial;
    height: 3px;
    margin: 0 -1px;
    padding: 0 1px;
    top: -1px;
    z-index: 1;
}
.demo-tabs > .el-tabs__content {
    padding: 10px !important;
}
.el-tab-pane {
    height: 100%;
}
.el-tabs__content {
    height: 90%;
}
</style>