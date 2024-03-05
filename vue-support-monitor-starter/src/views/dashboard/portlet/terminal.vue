<template>
    
    <el-dialog @close="onClose" :destroy-on-close="true" :show-close="false" style="background: transparent; display: flex; flex-direction: column;" title="日志" 
        top="20px"
        append-to-body="body" :model-value="true" width="70%" >
        <aYinTechBorderA1 style="height: 80vh;">
            <terminal v-if="show" title="终端" context="$ " :command-store="searchHandler" 
            ref="myTerminal" @on-click="onClick" :init-log="welcome"  style="height: 100%;width: 100%; top: 0; left: 0" name="my-terminal" @exec-cmd="onExecCmd" @init-before="before">
            </terminal>
        </aYinTechBorderA1>
    </el-dialog>
</template>
<script>
import {Terminal, Ask as TerminalAsk} from 'vue-web-terminal'
import  { inject } from "vue"
import Base64 from "@/utils/base64";
import 'vue-web-terminal/lib/theme/dark.css'
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';

export default {
    name: 'shell',
    components: { Terminal },
    props: {
        value: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data() {
        return {
            show: false,
            flash: null,
            welcome: [],
            searchHandler: [],
            ask: null,
            successFunction: undefined,
            socket: inject('socket'),
            form: {
                appValue: '',
                appModelValue: ''
            },
        }
    },
    beforeUnmount() {
        this.closeSocket();
    },
    created() {
        this.openSocket();
        try{
            this.form.appValue = getQueryString("appName");
            this.form.appName = this.form.appValue;
            const item = JSON.parse(Base64.decode(getQueryString("data")));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
            document.title = this.form.appValue + '详情 - 监控管理';
            useTabs.setTitle(this.form.appValue + '详情');
            this.viliable = true;
    }catch(e){}
        this.afterPrepertiesSet();
    },
    mounted(){
    },
    methods: {
        onClick(key, name){
            if(key == 'close') {
                this.$emit('success', this);
                this.$emit("status", false, 'terminal')
            }
        },
        before() {
        },
        afterPrepertiesSet(){
            this.socket.emit("terminal-request", JSON.stringify({'command': "help", appName: this.form.appValue, appModel: this.form.appModelValue}));
        },
        openSocket() {
            const _this = this;
            this.socket.on('terminal', (data) => {
                this.openMessage(data);
            })
        },
        closeSocket(){
            this.socket.off('terminal')
        },
        onHelp(data) {
            this.searchHandler = window['commandStore'] = typeof data  === 'object' ? data : JSON.parse(data);
            this.show = true;
        },
        onWelcome(data){
            this.welcome = [data.replace('@welcome', '')]
            this.$refs.myTerminal.pushMessage(this.welcome[0])
            return
        },
        onflushStart(data) {
            if (!!this.flash) {
                this.flash.finish();
                this.flash = null;
            }
            this.flash = new window['vue-web-terminal'].Flash();
            this.successFunction(this.flash);
            return
        },
        onflushEnd(data){
            if (!!this.flash) {
                try {
                    this.flash.finish();
                    this.endFlush();
                } catch (e) {
                }
            }
            this.flash = null;
            return
        },
        onflush(data){
            if (!!this.flash) {
                let type = "ansi";
                data = data.substring(6).trim();
                if (data.startsWith("@")) {
                    data = data.substring(1);
                    type = this.createType(data);
                    data = this.createData(type, data);
                }
                this.flash.flush(data);
                _type = type;
                _data = data;
            }
            return
        },
        onEvent(data){
            let type = data?.mode || 'normal';
            data = data?.result || '不支持该命令';

            if (type == 'other' || (!data || (Object.prototype.toString.call(data) == '[object String]' && data.startsWith("usage")))) {
                type = 'html';
                data = data
                .replaceAll('\n', '<br /><span style="padding-left: 16px"></span>')
                .replaceAll('\t', '<br /><span style="padding-left: 32px"></span>')
            }

            if (!data || (Object.prototype.toString.call(data) == '[object String]' && data.startsWith("$"))) {
                if (!!this.successFunction) {
                    this.successFunction({
                        type: type,
                        tag: '',
                        content: ''
                    });
                }
                return;
            }
            if (!!this.successFunction) {

                this.successFunction({
                    'type': type.toLowerCase(),
                    tag: '',
                    content: type.toLowerCase() === 'table' ? JSON.parse(data) :data
                });
            }
        },
        openMessage(msg) {
            let data = msg;
            if(!data) {
                return;
            }
            const command = data.command;
            if(command == 'help') {
                this.onHelp(data.data || data);
                return;
            }
            if(command == 'welcome') {
                this.onWelcome(data.data || data);
                return;
            }
            if(command == 'flushStart') {
                this.onflushStart(data.data || data);
                return;
            }
            if(command == 'flushEnd') {
                this.onflushEnd(data.data || data);
                return;
            }
            if(command == 'flush') {
                this.onflush(data.data || data);
                return;
            }

            this.onEvent(JSON.parse(data.data || data));
        },
        createType(data) {
            let substring = data.substring(0, data.indexOf(" "));
            if (!!substring) {
                return substring;
            }
            substring = data.substring(0, data.indexOf("{"));
            if (!!substring) {
                return substring;
            }
            return "ansi";
        },
        createData(type, data) {
            data = data.substring(type.length);
            if (type == 'table' || type == 'json') {
                return JSON.parse(data);
            }
            return data.trim();
        },

        onExecCmd(key, command, success, failed) {
            this.successFunction = success;
            this.socket.emit("terminal-request", JSON.stringify({'command': command, appName: this.form.appValue, appModel: this.form.appModelValue}));
        }
    }
}
</script>
<style lang="less" scoped>
.t-code {
    position: relative;
    max-height: 700px !important;
    overflow: auto;
}
* {
    font-size: 12px;
}
</style>