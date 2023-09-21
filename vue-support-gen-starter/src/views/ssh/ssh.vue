<template>
    <div id="terminal" style="width: 100%;height: 100%"></div>
</template>
<script>
import {Terminal, Ask as TerminalAsk} from 'vue-web-terminal'
import ReconnectingWebSocket from 'reconnecting-websocket';

export default {
    name: 'ssh',
    components: { Terminal, ReconnectingWebSocket },
    data() {
        return {
            websocket: null,
            successFunction: null,
        }
    },
    beforeDestroy() {
        this.websocket.close();
    },
    created() {
        this.websocket = new ReconnectingWebSocket(`ws://${location.host}/socket/channel/shell`);
        //连接打开事件
        this.websocket.onclose = this.closeSocket;
        this.websocket.onopen = this.openSocket;
        this.websocket.onmessage = this.openMessage;

        //                fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",

    },
    methods: {
        openSocket() {
            console.log("Socket 已打开");
        },
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            debugger
        },
        onExecCmd(key, command, success, failed) {
            this.successFunction = success;
            this.websocket.send(command);
        }
    }
}
</script>
<style>
.xterm-screen {
    min-height: calc(100vh);
}
</style>