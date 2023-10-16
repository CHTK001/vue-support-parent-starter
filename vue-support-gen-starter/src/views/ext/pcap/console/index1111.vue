<template>
    <div id="terminal" class="console">
    </div>
</template>

<script>
import ReconnectingWebSocket from 'reconnecting-websocket';
export default {
    name: 'Pcap',
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
        },
        closeSocket() {
            console.log("Socket 已关闭");
        },
        openMessage(msg) {
            
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