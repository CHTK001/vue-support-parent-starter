# Vue前端WebSocket/SocketIO实时功能集成方案

## 1. 技术选型和架构

### 1.1 技术选择
- **后端**: Socket.IO Server (Spring Boot集成)
- **前端**: Socket.IO Client (Vue.js集成)
- **消息格式**: JSON
- **连接方式**: WebSocket + HTTP轮询降级

### 1.2 整体架构
```
前端Vue应用 <-- Socket.IO Client --> Socket.IO Server <-- Spring Boot应用
                                           |
                                    Docker操作进度推送
                                    系统状态更新
                                    实时日志推送
```

## 2. 后端Socket.IO配置

### 2.1 依赖配置 (已实现)
```xml
<dependency>
    <groupId>com.corundumstudio.socketio</groupId>
    <artifactId>netty-socketio</artifactId>
    <version>2.0.3</version>
</dependency>
```

### 2.2 Socket.IO服务配置
```java
@Configuration
public class SocketIOConfig {
    
    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = 
            new com.corundumstudio.socketio.Configuration();
        config.setHostname("localhost");
        config.setPort(9092);
        config.setOrigin("*");  // 生产环境需要配置具体域名
        
        return new SocketIOServer(config);
    }
}
```

### 2.3 事件处理器
```java
@Component
public class DockerSocketIOHandler {
    
    // Docker操作进度推送
    public void pushDockerProgress(String operationId, DockerProgress progress) {
        server.getRoomOperations("docker_operations")
              .sendEvent("docker_progress", progress);
    }
    
    // 容器状态变化推送
    public void pushContainerStatus(String containerId, ContainerStatus status) {
        server.getRoomOperations("container_monitor")
              .sendEvent("container_status", status);
    }
    
    // 系统资源监控推送
    public void pushSystemMonitor(SystemMonitorData data) {
        server.getBroadcastOperations()
              .sendEvent("system_monitor", data);
    }
}
```

## 3. 前端Socket.IO集成

### 3.1 安装依赖
```bash
npm install socket.io-client
npm install vuex
```

### 3.2 Socket.IO客户端配置
```javascript
// src/utils/socket.js
import io from 'socket.io-client'
import store from '@/store'

class SocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  // 连接Socket.IO服务器
  connect() {
    this.socket = io('http://localhost:9092', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    })

    this.socket.on('connect', () => {
      console.log('Socket.IO连接成功')
      store.dispatch('websocket/setConnectionStatus', true)
      this.reconnectAttempts = 0
      this.joinRooms()
    })

    this.socket.on('disconnect', () => {
      console.log('Socket.IO连接断开')
      store.dispatch('websocket/setConnectionStatus', false)
      this.handleReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO连接错误:', error)
      store.dispatch('websocket/setConnectionError', error.message)
    })

    this.setupEventListeners()
  }

  // 加入房间
  joinRooms() {
    this.socket.emit('join', 'docker_operations')
    this.socket.emit('join', 'container_monitor')
    this.socket.emit('join', 'system_monitor')
  }

  // 设置事件监听器
  setupEventListeners() {
    // Docker操作进度
    this.socket.on('docker_progress', (data) => {
      store.dispatch('docker/updateOperationProgress', data)
    })

    // 容器状态变化
    this.socket.on('container_status', (data) => {
      store.dispatch('container/updateContainerStatus', data)
    })

    // 系统监控数据
    this.socket.on('system_monitor', (data) => {
      store.dispatch('docker/updateSystemMonitor', data)
    })

    // 实时日志
    this.socket.on('container_logs', (data) => {
      store.dispatch('container/appendLogs', data)
    })

    // 镜像拉取进度
    this.socket.on('image_pull_progress', (data) => {
      store.dispatch('image/updatePullProgress', data)
    })

    // 软件同步进度
    this.socket.on('software_sync_progress', (data) => {
      store.dispatch('software/updateSyncProgress', data)
    })
  }

  // 重连机制
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`尝试重连 Socket.IO (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
        this.reconnectAttempts++
        this.connect()
      }, 2000 * Math.pow(2, this.reconnectAttempts)) // 指数退避
    } else {
      console.error('Socket.IO重连失败，已达到最大重试次数')
      store.dispatch('websocket/setConnectionError', '连接失败，请刷新页面重试')
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // 发送消息
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket.IO未连接，无法发送消息')
    }
  }
}

export default new SocketService()
```

## 4. Vuex状态管理集成

### 4.1 WebSocket模块
```javascript
// src/store/modules/websocket.js
const state = {
  isConnected: false,
  connectionError: null,
  lastConnectTime: null,
  reconnectCount: 0
}

const mutations = {
  SET_CONNECTION_STATUS(state, status) {
    state.isConnected = status
    if (status) {
      state.lastConnectTime = new Date()
      state.connectionError = null
    }
  },
  
  SET_CONNECTION_ERROR(state, error) {
    state.connectionError = error
  },
  
  INCREMENT_RECONNECT_COUNT(state) {
    state.reconnectCount++
  }
}

const actions = {
  setConnectionStatus({ commit }, status) {
    commit('SET_CONNECTION_STATUS', status)
  },
  
  setConnectionError({ commit }, error) {
    commit('SET_CONNECTION_ERROR', error)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
```

### 4.2 Docker模块实时更新
```javascript
// src/store/modules/docker.js
const mutations = {
  UPDATE_OPERATION_PROGRESS(state, { operationId, progress }) {
    Vue.set(state.operationProgress, operationId, progress)
  },
  
  UPDATE_SYSTEM_MONITOR(state, data) {
    state.systemMonitor = { ...state.systemMonitor, ...data }
  },
  
  ADD_NOTIFICATION(state, notification) {
    state.notifications.unshift({
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    })
    
    // 保持最新50条通知
    if (state.notifications.length > 50) {
      state.notifications = state.notifications.slice(0, 50)
    }
  }
}

const actions = {
  updateOperationProgress({ commit }, data) {
    commit('UPDATE_OPERATION_PROGRESS', data)
    
    // 如果操作完成，显示通知
    if (data.progress.status === 'completed' || data.progress.status === 'failed') {
      commit('ADD_NOTIFICATION', {
        type: data.progress.status === 'completed' ? 'success' : 'error',
        title: '操作完成',
        message: data.progress.message,
        operationId: data.operationId
      })
    }
  }
}
```

## 5. 组件中的实时功能集成

### 5.1 进度显示组件
```vue
<!-- components/ProgressDialog.vue -->
<template>
  <el-dialog
    title="操作进度"
    :visible.sync="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="600px"
  >
    <div class="progress-container">
      <div class="progress-header">
        <h4>{{ currentOperation.title }}</h4>
        <el-tag 
          :type="getStatusType(currentOperation.status)"
          size="small"
        >
          {{ getStatusText(currentOperation.status) }}
        </el-tag>
      </div>
      
      <el-progress
        :percentage="currentOperation.percentage"
        :status="getProgressStatus(currentOperation.status)"
        :stroke-width="20"
        text-inside
      />
      
      <div class="progress-details">
        <p>{{ currentOperation.currentStep }}</p>
        <p v-if="currentOperation.message" class="message">
          {{ currentOperation.message }}
        </p>
      </div>
      
      <div class="progress-logs" v-if="currentOperation.logs">
        <h5>详细日志</h5>
        <div class="logs-content">
          <div
            v-for="(log, index) in currentOperation.logs"
            :key="index"
            :class="['log-line', log.level]"
          >
            [{{ formatTime(log.timestamp) }}] {{ log.message }}
          </div>
        </div>
      </div>
    </div>
    
    <div slot="footer" class="dialog-footer">
      <el-button
        v-if="isCompleted"
        type="primary"
        @click="handleClose"
      >
        确定
      </el-button>
      <el-button
        v-else
        @click="handleCancel"
      >
        取消操作
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ProgressDialog',
  
  props: {
    operationId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      visible: false
    }
  },
  
  computed: {
    ...mapState('docker', ['operationProgress']),
    
    currentOperation() {
      return this.operationProgress[this.operationId] || {}
    },
    
    isCompleted() {
      return ['completed', 'failed', 'cancelled'].includes(this.currentOperation.status)
    }
  },
  
  watch: {
    currentOperation: {
      deep: true,
      handler(newVal) {
        if (newVal && newVal.status === 'started') {
          this.visible = true
        } else if (newVal && this.isCompleted) {
          // 操作完成后3秒自动关闭
          setTimeout(() => {
            if (this.visible) {
              this.visible = false
            }
          }, 3000)
        }
      }
    }
  },
  
  methods: {
    getStatusType(status) {
      const types = {
        'pending': 'info',
        'started': 'warning',
        'completed': 'success',
        'failed': 'danger',
        'cancelled': 'info'
      }
      return types[status] || 'info'
    },
    
    getStatusText(status) {
      const texts = {
        'pending': '等待中',
        'started': '进行中',
        'completed': '已完成',
        'failed': '失败',
        'cancelled': '已取消'
      }
      return texts[status] || '未知'
    },
    
    getProgressStatus(status) {
      if (status === 'completed') return 'success'
      if (status === 'failed') return 'exception'
      return null
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
    
    handleClose() {
      this.visible = false
      this.$emit('close')
    },
    
    handleCancel() {
      this.$emit('cancel', this.operationId)
      this.visible = false
    }
  }
}
</script>
```

### 5.2 实时状态监控组件
```vue
<!-- components/RealTimeStatus.vue -->
<template>
  <div class="realtime-status">
    <div class="connection-status">
      <el-badge
        :value="isConnected ? '在线' : '离线'"
        :type="isConnected ? 'success' : 'danger'"
        class="status-badge"
      >
        <i :class="connectionIcon"></i>
      </el-badge>
    </div>
    
    <div class="system-monitor" v-if="systemMonitor">
      <div class="monitor-item">
        <span class="label">CPU:</span>
        <el-progress
          :percentage="systemMonitor.cpuUsage"
          :stroke-width="8"
          :show-text="false"
        />
        <span class="value">{{ systemMonitor.cpuUsage }}%</span>
      </div>
      
      <div class="monitor-item">
        <span class="label">内存:</span>
        <el-progress
          :percentage="systemMonitor.memoryUsage"
          :stroke-width="8"
          :show-text="false"
        />
        <span class="value">{{ systemMonitor.memoryUsage }}%</span>
      </div>
    </div>
    
    <div class="active-operations" v-if="hasActiveOperations">
      <el-tooltip content="有正在进行的操作" placement="top">
        <el-badge
          :value="activeOperationCount"
          :max="99"
          class="operation-badge"
        >
          <i class="el-icon-loading"></i>
        </el-badge>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'RealTimeStatus',
  
  computed: {
    ...mapState('websocket', ['isConnected']),
    ...mapState('docker', ['operationProgress', 'systemMonitor']),
    
    connectionIcon() {
      return this.isConnected ? 'el-icon-link' : 'el-icon-remove-outline'
    },
    
    hasActiveOperations() {
      return Object.values(this.operationProgress).some(
        op => op.status === 'started' || op.status === 'pending'
      )
    },
    
    activeOperationCount() {
      return Object.values(this.operationProgress).filter(
        op => op.status === 'started' || op.status === 'pending'
      ).length
    }
  }
}
</script>
```

## 6. 应用初始化集成

### 6.1 在main.js中初始化Socket.IO
```javascript
// src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import socketService from '@/utils/socket'

// 创建Vue实例
const app = new Vue({
  router,
  store,
  render: h => h(App)
})

// 在应用挂载后连接Socket.IO
app.$mount('#app')

// 连接Socket.IO
socketService.connect()

// 在应用销毁前断开连接
window.addEventListener('beforeunload', () => {
  socketService.disconnect()
})
```

### 6.2 在App.vue中添加全局通知
```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view />
    
    <!-- 全局通知 -->
    <NotificationCenter />
    
    <!-- 连接状态提示 -->
    <ConnectionAlert />
  </div>
</template>

<script>
import NotificationCenter from '@/components/NotificationCenter.vue'
import ConnectionAlert from '@/components/ConnectionAlert.vue'

export default {
  name: 'App',
  components: {
    NotificationCenter,
    ConnectionAlert
  }
}
</script>
```

## 7. 错误处理和重连机制

### 7.1 连接错误处理
```javascript
// 处理各种连接错误
const errorHandlers = {
  'connect_error': (error) => {
    console.error('连接错误:', error)
    store.dispatch('websocket/setConnectionError', '无法连接到服务器')
  },
  
  'connect_timeout': () => {
    console.error('连接超时')
    store.dispatch('websocket/setConnectionError', '连接超时，请检查网络')
  },
  
  'disconnect': (reason) => {
    console.log('连接断开:', reason)
    if (reason === 'io server disconnect') {
      // 服务器主动断开，需要重新连接
      socketService.connect()
    }
  }
}
```

### 7.2 心跳检测
```javascript
class SocketService {
  constructor() {
    this.heartbeatInterval = null
    this.heartbeatTimeout = 30000 // 30秒
  }
  
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping')
      }
    }, this.heartbeatTimeout)
    
    this.socket.on('pong', () => {
      // 收到心跳响应，连接正常
    })
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}
```

## 8. 性能优化

### 8.1 消息限流
```javascript
// 对高频消息进行限流处理
const messageThrottle = {
  'system_monitor': 1000, // 系统监控数据每秒最多更新一次
  'container_logs': 100,  // 日志消息每100ms最多处理一次
}

// 使用lodash的throttle函数
import { throttle } from 'lodash'

const throttledHandlers = {}
Object.keys(messageThrottle).forEach(event => {
  const delay = messageThrottle[event]
  throttledHandlers[event] = throttle((data) => {
    // 处理消息
    handleMessage(event, data)
  }, delay)
})
```

### 8.2 内存管理
```javascript
// 限制状态中保存的数据量
const MAX_LOGS = 1000
const MAX_NOTIFICATIONS = 50
const MAX_PROGRESS_RECORDS = 20

// 定期清理过期数据
setInterval(() => {
  store.dispatch('docker/cleanupExpiredData')
}, 60000) // 每分钟清理一次
```

这个方案提供了完整的WebSocket/SocketIO实时功能集成，包括连接管理、状态同步、错误处理和性能优化。