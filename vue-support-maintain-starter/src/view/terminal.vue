
<template>
  <terminal title="终端" name="my-terminal" @exec-cmd="onExecCmd" init-log="null" context="shell"></terminal>
</template>

<script>
import request from '@/utils/request'
import Terminal from "vue3-web-terminal"
import URL from "@/config/terminal-url"
import 'vue3-web-terminal/lib/style.css'


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
      this.vueWebsocket = new WebSocket(this.url);
      this.vueWebsocket.onopen = () => {
        console.log('Websocket connection opened.');
      };
      this.vueWebsocket.onmessage = (event) => {
        console.log('Websocket message received.', event.data);
      };
      this.vueWebsocket.onerror = (error) => {
        console.error('Websocket error occurred.', error);
      };
      this.vueWebsocket.onclose = () => {
        console.log('Websocket connection closed.');
      }
    },
    send(data) {
      if (this.vueWebsocket.readyState === WebSocket.OPEN) {
        this.vueWebsocket.send(data);
      } else {
        console.error('Websocket connection not open.');
      }
    },

    close() {
      this.vueWebsocket.close();
    }
  },
  mounted() {
    this.connect();
  }
}
</script>

<style></style>