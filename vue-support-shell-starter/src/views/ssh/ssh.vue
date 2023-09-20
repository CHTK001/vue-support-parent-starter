<template>
       <div id="xterm" class="xterm" />
</template>
<script>
import { Terminal } from 'xterm';
import { FitAddon } from "xterm-addon-fit";
import { AttachAddon  } from "xterm-addon-attach";
import "xterm/css/xterm.css";
import ReconnectingWebSocket from 'reconnecting-websocket';

export default {
    name: 'ssh',
    components: { ReconnectingWebSocket },
    data() {
        return {
            websocket: null,
            term: null,
            rows: 32,
            cols: 40,
            SetOut: false,
            isKey: false,
        }
    },
    beforeDestroy() {
        this.closeSocket();
    },
    created() {
        this.websocket = new ReconnectingWebSocket(`ws://${location.host}/socket/channel/ssh/${this.$route.params.id}`);
        //连接打开事件
        this.websocket.onclose = this.closeSocket;
        this.websocket.onopen = this.openSocket;
        this.websocket.onmessage = this.openMessage;
    },
    methods: {
        initTerm() {
            this.term = new Terminal({
                lineHeight: 1.2,
                fontSize: 12,
                fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
                theme: {
                    background: '#181d28',
                },
                // 光标闪烁
                cursorBlink: true,
                cursorStyle: 'underline',
                scrollback: 100,
                tabStopWidth: 4,
            });
           
            const fitAddon = new FitAddon();
            const attachAddon  = new AttachAddon(this.websocket);
            this.term.loadAddon(fitAddon);
            this.term.loadAddon(attachAddon);
            fitAddon.fit()
            this.term.open(document.getElementById("xterm"));
            this.term.focus();
        },
        openSocket() { this.initTerm();},
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            //将返回的消息写入终端
            this.term.write(msg);
        },
    }
}
</script>
<style>
.xterm-screen{
  min-height: calc(100vh);
}
</style>