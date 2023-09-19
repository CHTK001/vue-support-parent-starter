<template>
    <terminal title="终端" context="$ " :command-store="searchHandler" ref="myTerminal" :init-log="welcome"  style="height: 100%;width: 100%; top: 0; left: 0" name="my-terminal" @exec-cmd="onExecCmd">
    </terminal>
    1
</template>
<script>
import Terminal from 'vue-web-terminal'
import ReconnectingWebSocket from 'reconnecting-websocket';
export default {
    name: 'shell',
    components: { Terminal, ReconnectingWebSocket },
    data() {
        return {
            websocket: null,
            flash: null,
            welcome: [],
            searchHandler: [],
            successFunction: undefined
        }
    },
    created() {
        this.websocket = new ReconnectingWebSocket(`ws://${location.host}/socket/channel/shell`);
        //连接打开事件
        this.websocket.onclose = this.closeSocket;
        this.websocket.onopen = this.openSocket;
        this.websocket.onmessage = this.openMessage;
    },
    methods: {
        openSocket() {
            console.log("Socket 已打开");
        },
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            let data = msg.data;
            if (data.startsWith("@welcome")) {
                this.welcome = [data.replace('@welcome', '')]
                this.$refs.myTerminal.pushMessage(this.welcome[0])
                return
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


            if (data.startsWith("@help")) {
                this.searchHandler = window['commandStore'] = JSON.parse(data.substring(5));
                if(this.$refs.myTerminal.$data.allCommandStore.length > 3) {
                    return ;
                }
                this.$refs.myTerminal.$data.allCommandStore =  this.$refs.myTerminal.$data.allCommandStore.concat( this.searchHandler)
                return ;
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

            if (!data || (Object.prototype.toString.call(data) == '[object String]' && data.startsWith("usage"))) {
                type = 'html';
                data = data.replaceAll('\r\n', '<br /><span style="margin-left: 4px"></span>')
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
            this.websocket.send(command);
        }
    }
}
</script>