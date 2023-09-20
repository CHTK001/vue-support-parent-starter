<template>
    <div id="terminal" style="width: 100%;height: 100%"></div>
</template>
<script>
import { Terminal } from 'xterm';
import { FitAddon } from "xterm-addon-fit";
import { AttachAddon } from "xterm-addon-attach";
import "xterm/css/xterm.css";
import {WSSHClient} from "./webssh";

export default {
    name: 'ssh',
    data() {
        return {
            client: null,
            term: null,
            rows: 32,
            cols: 40,
            SetOut: false,
            isKey: false,
        }
    },
    beforeDestroy() {
        this.client.close();
    },
    created() {
        //连接打开事件
        this.client = new WSSHClient(`ws://${location.host}/socket/channel/ssh/${this.$route.params.id}`);
        //                fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",

    },
    methods: {
        initTerm() {
            var term = new Terminal({
                cols: 97,
                rows: 37,
                cursorBlink: true, // 光标闪烁
                cursorStyle: "block", // 光标样式  null | 'block' | 'underline' | 'bar'
                scrollback: 800, //回滚
                tabStopWidth: 8, //制表宽度
                screenKeys: true
            });

            term.on('data', function (data) {
                //键盘输入时的回调函数
                client.sendClientData(data);
            });
            term.open(document.getElementById('terminal'));
            //在页面上显示连接中...
            term.write('Connecting...');
            //执行连接操作
            client.connect({
                onError: function (error) {
                    //连接失败回调
                    term.write('Error: ' + error + '\r\n');
                },
                onConnect: function () {
                    //连接成功回调
                    this.client.sendInitData(options);
                },
                onClose: function () {
                    //连接关闭回调
                    this.term.write("\rconnection closed");
                },
                onData: function (data) {
                    //收到数据时回调
                    this.term.write(data);
                }
            });
        },

    }
}
</script>
<style>
.xterm-screen {
    min-height: calc(100vh);
}
</style>