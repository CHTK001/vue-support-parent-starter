
<template>
  <terminal title="终端" name="my-terminal" @exec-cmd="onExecCmd" init-log="null" context="shell"></terminal>
</template>

<script>
import request from '@/utils/request'
import Terminal from "vue3-web-terminal"
import URL from "@/config/terminal-url"
import 'vue3-web-terminal/lib/style.css'
import VueSocketIO from 'vue-socket.io'
import io from 'socket.io-client'


export default {
  name: 'Terminal-editor',
  components: { Terminal },
  data() {
    return {
      url: URL.WS,
      vueWebsocket: undefined
    }
  },
  methods: {
    onExecCmd(key, command, success, failed) {
      if (key === 'fail') {
        failed('Something wrong!!!')
      } else {
        let allClass = ['success', 'error', 'system', 'info', 'warning'];

        let clazz = allClass[Math.floor(Math.random() * allClass.length)];
        success({
          type: 'normal',
          class: clazz,
          tag: '成功',
          content: command
        })
      }
    },
    connect() {
      this.vueWebsocket = new VueSocketIO({
          debug: true,// 生产环境关闭，打开可在控制台查看socket连接和事件监听的信息
          options: {
            autoConnect: false //创建时是否自动连接，默认关闭，使用时用open开启链接
          },
          connection: io(URL.WS) //链接地址
        });

    },
    connection: function(args) {
      debugger
    },
    send(data) {
      if (this.vueWebsocket.readyState === WebSocket.OPEN) {
        this.vueWebsocket.send(data);
      } else {
        console.error('Websocket connection not open.');
      }
    },

    close() {
      this.vueWebsocket.disconnect();
    }
  },
  mounted() {
    this.connect();
  }
}
</script>

<style></style>