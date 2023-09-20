<template>
<div id="terminal" style="width: 100%;height: 100%"></div>
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
        window.addEventListener('resize', this.onTerminalResize);
        this.websocket.onmessage = this.openMessage;
    },
    methods: {
        initTerm() {
            this.term = new Terminal({
                fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
                cols: 97,
                rows: 37,
                cursorBlink: true, // 光标闪烁
                cursorStyle: "block", // 光标样式  null | 'block' | 'underline' | 'bar'
                scrollback: 800, //回滚
                tabStopWidth: 8, //制表宽度
                screenKeys: true
            });
           
            const fitAddon = new FitAddon();
            const attachAddon  = new AttachAddon(this.websocket);
            this.term.loadAddon(fitAddon);
            this.term.open(document.getElementById("terminal"));
            this.term.focus();
            this.term.on('data', function (data) {
                this.websocket.send(data);
            })
        },
        openSocket() { this.initTerm();},
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            this.term.write(msg.data);
        },
        
        onTerminalResize(){
            const terminalContainer = this.terminalContainerRef.current;
            const width = terminalContainer.parentElement.clientWidth;
            const height = terminalContainer.parentElement.clientHeight;
            const { xterm } = this;
            // 计算cols，rows
            const cols = (width - xterm._core.viewport.scrollBarWidth - 15) / xterm._core._renderService._renderer.dimensions.actualCellWidth;
            const rows = height / xterm._core._renderService._renderer.dimensions.actualCellHeight - 1;
            this.xterm.resize(
                parseInt(cols.toString(), 10),
                parseInt(rows.toString(), 10)
            );
        }
    }
}
</script>
<style>
.xterm-screen{
  min-height: calc(100vh);
}
</style>