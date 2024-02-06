<template>
    <terminal v-if="show" title="终端" context="$ " :search-handler="searchHandlerFunc" :command-store="searchHandler" 
    ref="myTerminal" :init-log="welcome"  style="height: 100%;width: 100%; top: 0; left: 0" name="my-terminal" @exec-cmd="onExecCmd" @init-before="before">
    </terminal>
</template>
<script>
import {Terminal, Ask as TerminalAsk} from 'vue-web-terminal'
import  { inject } from "vue"
import Base64 from "@/utils/base64";
import 'vue-web-terminal/lib/theme/dark.css'

export default {
    name: 'shell',
    components: { Terminal },
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
            this.form.appValue = this.$route.query.appName;
            const item = JSON.parse(Base64.decode(this.$route.query.data));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
        }catch(e){}
        this.afterPrepertiesSet();
    },
    mounted(){
    },
    methods: {
        before() {
        },
        searchHandlerFunc(commandStore, key, callback) {
            commandStore = commandStore.concat(this.searchHandler);
            for(let i = 0; i < commandStore.length; i++) {
                callback(commandStore[i])
            }
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
            this.searchHandler = window['commandStore'] = JSON.parse(data);
            this.show = true;
        },
        onWelcome(data){
            this.welcome = [data.replace('@welcome', '')]
            this.$refs.myTerminal.pushMessage(this.welcome[0])
            return
        },
        openMessage(msg) {
            let data = msg;
            if(!data) {
                return;
            }
            data = JSON.parse(data);
            const command = data.command;
            if(command == 'help') {
                this.onHelp(data.data);
                return;
            }
            if(command == 'welcome') {
                this.onWelcome(data.data);
                return;
            }

            if (data.startsWith("@auth")) {
                if(this.successFunction) {
                    this.successFunction({
                        type: 'text',
                        tag: '成功',
                        content: data.replace('@auth', '')
                    });
                    return ;
                }

                alert(data.replace('@auth', ''))
               
                return
            }


            if (data.startsWith("@flushStart")) {
                if (!!this.flash) {
                    this.flash.finish();
                    this.flash = null;
                }
                this.flash = new window['vue-web-terminal'].Flash();
                this.successFunction(this.flash);
                return
            }

            if (data.startsWith("@flushEnd")) {
                if (!!this.flash) {
                    try {
                        this.flash.finish();
                        this.endFlush();
                    } catch (e) {
                    }
                }
                this.flash = null;
                return
            }

            if (data.startsWith("@flush")) {
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
            }


            let type = "ansi";
            if (data.startsWith("@")) {
                data = data.substring(1);
                type = this.createType(data);
                data = this.createData(type, data);
            }

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
                    type: type,
                    tag: '',
                    content: data
                });
            }
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
<style >
.t-code {
    position: relative;
    max-height: 700px !important;
    overflow: auto;
}
* {
    font-size: 12px;
}
</style>