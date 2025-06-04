<template>
  <div class="file-read-container">
    <log-view1 :ref="`logView`" height="calc(100vh - 140px)" class="file-content-viewer">
      <template #before>
        <div class="file-read-header">
          <div class="file-path-info">
            <FileTextOutlined class="file-icon" />
            <span class="file-path">{{ readFilePath || $t('i18n_5e4ca21783') }}</span>
          </div>
          <a-button type="primary" size="small" class="file-button" @click="goFile">
            <template #icon><FolderOutlined /></template>
            {{ $t('i18n_8780e6b3d1') }}
          </a-button>
        </div>
      </template>
    </log-view1>
  </div>
</template>
<script>
// import { getProjectData, getProjectLogSize, downloadProjectLogFile, getLogBackList, downloadProjectLogBackFile, deleteProjectLogBackFile } from "@/api/node-project";
import { getWebSocketUrl } from '@/api/config'
import { mapState } from 'pinia'

import LogView1 from '@/components/logView/index2.vue'
import { FileTextOutlined, FolderOutlined } from '@ant-design/icons-vue'

export default {
  components: {
    LogView1,
    FileTextOutlined,
    FolderOutlined
  },
  props: {
    nodeId: {
      type: String,
      default: ''
    },
    projectId: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: ''
    },
    readFilePath: {
      type: String,
      default: ''
    }
  },
  emits: ['goFile'],
  data() {
    return {
      project: {},
      optButtonLoading: true,
      loading: false,
      socket: null,
      heart: null
    }
  },

  computed: {
    socketUrl() {
      return getWebSocketUrl(
        '/socket/console',
        `id=${this.id}&nodeId=${
          this.nodeId
        }&type=console`
      )
    }
  },
  mounted() {
    // this.loadProject();
    this.initWebSocket()
    // 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = () => {
      this.close()
    }
  },
  beforeUnmount() {
    this.close()
  },
  methods: {
    close() {
      this.socket?.close()

      clearInterval(this.heart)
    },
    // 初始化
    initWebSocket() {
      //this.logContext = "";
      if (
        !this.socket ||
        this.socket.readyState !== this.socket.OPEN ||
        this.socket.readyState !== this.socket.CONNECTING
      ) {
        this.socket = new WebSocket(this.socketUrl)
      }
      // 连接成功后
      this.socket.onopen = () => {
        this.sendMsg('showlog')
      }
      this.socket.onerror = (err) => {
        console.error(err)
        $notification.error({
          message: `web socket ${this.$t('i18n_7030ff6470')},${this.$t('i18n_226a6f9cdd')}`
        })
        clearInterval(this.heart)
      }
      this.socket.onclose = (err) => {
        //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
        console.error(err)
        clearInterval(this.heart)
        $message.warning(this.$t('i18n_9255f9c68f'))
      }
      this.socket.onmessage = (msg) => {
        this.$refs.logView?.appendLine(msg.data)

        clearInterval(this.heart)
        // 创建心跳，防止掉线
        this.heart = setInterval(() => {
          this.sendMsg('heart')
          // this.loadFileSize();
        }, 5000)
      }
    },

    // 发送消息
    sendMsg(op) {
      const data = {
        op: op,
        projectId: this.projectId,
        fileName: this.readFilePath
      }
      this.socket.send(JSON.stringify(data))
    },

    goFile() {
      this.$emit('goFile')
    }
  }
}
</script>
<style lang="less" scoped>
.file-read-container {
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  height: calc(100vh - 80px);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.file-content-viewer {
  background-color: #f0f7ff;
  border-radius: 4px;
  overflow: hidden;
}

.file-read-header {
  padding: 12px 16px;
  background-color: #f0f5ff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.file-path-info {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
  
  .file-icon {
    font-size: 16px;
    color: #1677ff;
    margin-right: 8px;
  }
  
  .file-path {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: monospace;
    padding: 4px 8px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
  }
}

.file-button {
  border-radius: 4px;
  padding: 0 12px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-read-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-button {
    align-self: flex-end;
  }
}
</style>
