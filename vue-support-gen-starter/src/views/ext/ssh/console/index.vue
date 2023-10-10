<template>
    <div id="terminal" class="console">
    </div>
</template>

<script>
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import ReconnectingWebSocket from 'reconnecting-websocket';
export default {
    name: 'terminal',
    data() {
        return {
            msg: 'Welcome to Your Vue.js App',
            term: null,
            socket: null,
            rows: 528,
            cols: 520,
            SetOut: false,
            isKey: false,
            form: {
                databaseId: null
            },
        }
    },
    mounted() {
        this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
        this.initSocket();
    },
    beforeUnmount() {
        if(this.socket) {
            this.socket.close();
        }
    },
    methods: {
        initSocket() {
            this.socket = new ReconnectingWebSocket(this.$API.gen.session.ssh.url + "/" + this.form.genId);
             //连接打开事件
            this.socket.onclose = this.closeSocket;
            this.socket.onopen = this.openSocket;
            this.socket.onmessage = this.openMessage;
        },
        openSocket() {
            console.log("Socket 已打开");
            this.initTerm();
        },
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            this.term.write(msg.data );
        },
        //Xterm主题
        initTerm() {
            const term = new Terminal({
                rendererType: "canvas", //渲染类型
                rows: this.rows, //行数
                // cols: this.cols,// 设置之后会输入多行之后覆盖现象
                convertEol: false, //启用时，光标将设置为下一行的开头
                // scrollback: 10,//终端中的回滚量
                fontSize: 14, //字体大小
                fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
                disableStdin: false, //是否应禁用输入。
                cursorStyle: "block", //光标样式
                cursorBlink: true, //光标闪烁
                scrollback: 30,
                tabStopWidth: 4,
                theme: {
                    foreground: "yellow", //字体
                    background: "#060101", //背景色
                    cursor: "help" //设置光标
                }
            });
            this.term = term;
            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(document.getElementById("terminal"));
            fitAddon.fit();
            term.focus();
            term.write("欢迎使用\r\n");
            let _this = this;
            term.onData(function (key) {
                _this.socket.send( key);
            });
        },
        //删除左右两端的空格
        trim (str) {
            return str.replace(/(^\s*)|(\s*$)/g, "");
        } 
    }

}
</script>
<style>
.console {
    height: 100%;
}
</style>