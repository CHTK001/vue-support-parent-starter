
<template>
  <terminal :command-store="commandStore" title="终端" ref='myTerminal' name="my-terminal" :init-log="[]" @exec-cmd="onExecCmd"
    context="shell"></terminal>
</template>

<script>
import request from '@/utils/request'
import Terminal from "vue3-web-terminal"
import URL from "@/config/terminal-url"
import 'vue3-web-terminal/lib/style.css'
import VueSocketIO from 'vue-socket.io'
import io from 'socket.io-client'
const log = new Logger('terminal');
console.log();
export default {
  name: 'Terminal-editor',
  components: { Terminal },
  data() {
    return {
      success: undefined,
      commandStore: [],
      createSocketIO: null,
      createSocketEmitter: null
    }
  },
  beforeDestroy() {
    if (this.createSocketIO) {
      this.createSocketEmitter.removeListener('onAuthority', this)
      this.createSocketIO.close()
    }
  },
  computed: {
    commandStore() {
      try {
        this.initial();
      }catch(e){}
      return this.commandStore;
    }
  },
  methods: {
    onExecCmd(key, command, success, failed) {
      this.success = success;
      this.socketSend({
        action: 'EXEC',
        args: command
      });
    },

    connect() {
      const createSocketItem = new VueSocketIO({
        debugger: true,
        connection: 'http://localhost:31256',
        options: {
          autoConnect: false,
          query: 'type=terminal&appKey=rest',
          transports: ['websocket']
        }
      });
      const { io, emitter } = createSocketItem
      this.createSocketIO = io
      this.createSocketEmitter = emitter
      io.open()
      io.on('connecting', () => { log.info('正在连接') })
      io.on('connect', () => { log.info('连接成功') })
      io.on('disconnect', () => { log.info('断开连接') })
      io.on('connect_failed', () => { log.info('连接失败') })
      io.on('error', () => { log.info('错误发生，并且无法被其他事件类型所处理') })
      io.on('reconnect_attempt', () => { log.info('触发尝试重新连接', 888) })
      io.on('reconnecting', () => { log.info('正在重连') })
      io.on('reconnect_failed', () => { log.info('重连失败') })
      io.on('reconnect', () => { log.info('重连成功') })
      emitter.addListener('onEvent', this.onEvent, this);
      emitter.addListener('onAuthority', (data) => {
        log.info(data)
      }, this)

    },
    onEvent: function (data) {
      const data1 = JSON.parse(data);
      this.$refs.myTerminal.$options.$api.pushMessage('my-terminal', {
        class: (data1.mode == 'ERROR'? "warning": ''),
        content: (data1.mode !== 'TABLE'? data1.result.replaceAll('\r\n', '<br />') :JSON.parse(data1.result)),
        type: data1.mode.toLowerCase()
      });
      this.success({})

    },
    socketOpen() {
      this.createSocketIO.open()
    },
    socketSend(msg) { // 发送消息
      this.createSocketIO.emit('doExecute', JSON.stringify(msg));
    },
    lockResult() {
      log.info('链接状态', this.createSocketIO.connected)
    },
    closeSocket() {
      this.createSocketIO.close()
    },
    submsgContent(flag) {
      if (flag) {
        this.createSocketEmitter.addListener('doExecute', (data) => {
          log.info('data', data)
        }, this)
      } else {
        this.createSocketEmitter.removeListener('doExecute', this)
      }
    },
    initial() {
      let xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
          clearTimeout(timeout);
      }
      }
      var timeout = setTimeout( function () {
        xmlhttp.abort(); 
          clearTimeout(timeout);
      }, 60*1000 );
      xmlhttp.open("GET", URL.HELP, false);
      
      xmlhttp.send(null);
      const command = JSON.parse(JSON.parse( xmlhttp.responseText).data);
      this.commandStore.length = 0;
      command.forEach(item => {
        this.commandStore.push(item);
      })
    }
  },
  mounted() {
    this.connect();
    document.title = '终端管理'
  }
}
</script>

<style></style>