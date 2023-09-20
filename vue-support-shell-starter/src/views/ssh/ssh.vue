<template>
       <div id="xterm" class="xterm" style="height: 100vh; width: 100%;"/>
</template>
<script>
import { Terminal } from 'xterm';
import { FitAddon } from "xterm-addon-fit";
import { AttachAddon  } from "xterm-addon-attach";
import { WebLinksAddon  } from "xterm-addon-web-links";
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
                cursorBlink: true, // 光标闪耀
                allowProposedApi: true,
                disableStdin: false, //是否应禁用输入
                cursorStyle: "underline", //光标款式
                windowsMode: true,// 根据窗口换行
                theme: { // 设置主题
                    foreground: "yellow", //字体
                    background: "#060101", //背景色
                    cursor: "help", //设置光标
                },
            });
           
            const fitAddon = new FitAddon();
            const webLinksAddon = new WebLinksAddon();
            const attachAddon  = new AttachAddon(this.websocket);
            this.term.loadAddon(fitAddon);
            this.term.loadAddon(webLinksAddon);
            this.term.loadAddon(attachAddon);
            fitAddon.fit()
            this.term.open(document.getElementById("xterm"));
            this.term.focus();
        },
        openSocket() { this.initTerm();},
        closeSocket() {
            console.log("Socket 已关闭");
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