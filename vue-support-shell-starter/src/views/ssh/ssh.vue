<template>
    <div>
        <div class="console" id="terminal" style="min-height: cala(100vh)"></div>
    </div>
</template>
<script>
import { Terminal } from 'xterm';
import { FitAddon } from "xterm-addon-fit";
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
            cols: 20,
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
        this.$nextTick(() => {
            this.initTerm();
        })

    },
    methods: {
        initTerm() {
            const term = new Terminal({
                rendererType: "canvas", //渲染类型
                rows: this.rows, //行数
                // cols: this.cols,// 设置之后会输入多行之后覆盖现象
                convertEol: true, //启用时，光标将设置为下一行的开头
                // scrollback: 10,//终端中的回滚量
                fontSize: 14, //字体大小
                disableStdin: false, //是否应禁用输入。
                cursorStyle: "block", //光标样式
                // cursorBlink: true, //光标闪烁
                scrollback: 30,
                tabStopWidth: 4,
                theme: {
                    foreground: "yellow", //字体
                    background: "#060101", //背景色
                    cursor: "help" //设置光标
                }
            });
           
            term.open(document.getElementById("terminal"));
            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);


            term.focus();
            let _this = this;
            //限制和后端交互，只有输入回车键才显示结果
            term.prompt = () => {
                term.write("\r\n$ ");
            };
            term.prompt();

            function runFakeTerminal(_this) {
                if (term._initialized) {
                    return;
                }
                // 初始化
                term._initialized = true;
                // / **
                //     *添加事件监听器，用于按下键时的事件。事件值包含
                //     *将在data事件以及DOM事件中发送的字符串
                //     *触发了它。
                //     * @返回一个IDisposable停止监听。
                //  * /
                //   / ** 更新：xterm 4.x（新增）
                //  *为数据事件触发时添加事件侦听器。发生这种情况
                //  *用户输入或粘贴到终端时的示例。事件值
                //  *是`string`结果的结果，在典型的设置中，应该通过
                //  *到支持pty。
                //  * @返回一个IDisposable停止监听。
                //  * /
                // 支持输入与粘贴方法
                term.onData(function (key) {
                    let order = {
                        Data: key,
                        Op: "stdin"
                    };
                    _this.websocket.send(key);
                });
                _this.term = term;
            }
            runFakeTerminal(_this);
        },
        openSocket() { },
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            //将返回的消息写入终端
            this.term.write(e.data);
            if (e.data === 'CONN CLOSE') {
                this.$Confirm.warning({
                    modalProps: {
                        confirmText: '确认',
                        showCancel: false,
                    },
                    content: `因为pod删除等原因，连接已关闭！`,
                    onOk() { },
                });
            }
        },
    }
}
</script>
<style>
.xterm-screen{
  min-height: calc(100vh);
}
</style>