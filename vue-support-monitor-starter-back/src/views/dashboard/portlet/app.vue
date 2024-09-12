<template>
    <div style="width:100%;height:100%; margin-top: 32px"  >
        <techButtonA1  :config="config"   @click="open('log')">系统日志</techButtonA1>
        <techButtonA1  :config="config"   @click="open('trace')">系统链路</techButtonA1>
        <techButtonA1  :config="config"   @click="open('terminal')">系统终端</techButtonA1>
        <techButtonA1  :config="config"   @click="open('ip')">最近访问地址</techButtonA1>
  </div>
    <LogLayout @success="showLog = false" v-if="showLog"></LogLayout>
    <TraceLayout @success="showTrace = false" v-if="showTrace"></TraceLayout>
    <TerminalLayout @success="showTerminal = false" v-if="showTerminal"></TerminalLayout>
    <IPLayout @success="showIp = false" v-if="showIp"></IPLayout>
</template>
<script>
import LogLayout from './log.vue';
import TraceLayout from './trace.vue';
import TerminalLayout from './terminal.vue';
import IPLayout from './ip.vue';

export default {
    components:{LogLayout, TraceLayout, TerminalLayout, IPLayout},
    props: {
        data: {
            type: Object,
            default: () => {
                return {}
            }
        },
        config:{
            scaleAction:false,
            decorationColorAlt:true,
            scaleAction:false,
            glow:false,
            scale:1.4
        }
    },
    data() {
        return {
            showLog: false,
            showTrace: false,
            showTerminal: false,
            showIp: false,
        }
    },
    methods:{
        open(type){
            this.$emit('success',type)
            if(type === 'log') {
                this.showLog = true;
                return;
            }
            if(type === 'trace') {
                this.showTrace = true;
                return;
            }
            if(type === 'terminal') {
                this.showTerminal = true;
                return;
            }
            if(type === 'ip') {
                this.showIp = true;
                return;
            }
        }
    }
}
</script>