<template>
  <div class="websocket-test">
    <el-card header="WebSocket 连接测试">
      <div class="test-controls">
        <el-form :model="testConfig" label-width="120px" size="small">
          <el-form-item label="协议类型">
            <el-select v-model="testConfig.protocol">
              <el-option label="RDP" value="rdp" />
              <el-option label="VNC" value="vnc" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务器ID">
            <el-input-number v-model="testConfig.serverId" :min="1" />
          </el-form-item>
          <el-form-item label="WebSocket URL">
            <el-input v-model="wsUrl" readonly />
          </el-form-item>
        </el-form>
        
        <div class="test-actions">
          <el-button type="primary" @click="testConnection" :loading="connecting">
            {{ connecting ? '连接中...' : '测试连接' }}
          </el-button>
          <el-button @click="disconnect" :disabled="!connected">断开连接</el-button>
          <el-button @click="clearLogs">清空日志</el-button>
        </div>
        
        <div class="connection-status">
          <el-tag :type="statusType" size="large">
            {{ statusText }}
          </el-tag>
        </div>
      </div>
      
      <div class="test-logs">
        <h4>连接日志</h4>
        <div class="log-content">
          <div 
            v-for="(log, index) in logs" 
            :key="index"
            :class="['log-item', `log-${log.level}`]"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';

// 测试配置
const testConfig = reactive({
  protocol: 'rdp' as 'rdp' | 'vnc',
  serverId: 1
});

// 连接状态
const connecting = ref(false);
const connected = ref(false);
const ws = ref<WebSocket | null>(null);

// 日志
const logs = ref<Array<{ time: string; level: string; message: string }>>([]);

// WebSocket URL
const wsUrl = computed(() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || '/monitor/api';
  const path = baseUrl + `/websocket/${testConfig.protocol}`;
  const params = new URLSearchParams({
    serverId: testConfig.serverId.toString()
  });
  return `${protocol}//${host}${path}?${params.toString()}`;
});

// 状态显示
const statusType = computed(() => {
  if (connected.value) return 'success';
  if (connecting.value) return 'warning';
  return 'info';
});

const statusText = computed(() => {
  if (connected.value) return '已连接';
  if (connecting.value) return '连接中';
  return '未连接';
});

// 添加日志
const addLog = (level: string, message: string) => {
  const now = new Date();
  const time = now.toLocaleTimeString();
  logs.value.push({ time, level, message });
  
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value.shift();
  }
};

// 测试连接
const testConnection = async () => {
  if (connecting.value || connected.value) {
    return;
  }
  
  try {
    connecting.value = true;
    addLog('info', `开始测试 ${testConfig.protocol.toUpperCase()} WebSocket 连接`);
    addLog('info', `连接地址: ${wsUrl.value}`);
    
    // 创建 WebSocket 连接
    ws.value = new WebSocket(wsUrl.value);
    
    // 设置事件监听器
    ws.value.onopen = (event) => {
      connected.value = true;
      connecting.value = false;
      addLog('success', 'WebSocket 连接成功建立');
      addLog('info', `连接协议: ${event.target?.protocol || 'N/A'}`);
      ElMessage.success('WebSocket 连接成功');
    };
    
    ws.value.onmessage = (event) => {
      addLog('info', `收到消息: ${event.data}`);
    };
    
    ws.value.onerror = (event) => {
      addLog('error', `WebSocket 连接错误: ${event}`);
      ElMessage.error('WebSocket 连接失败');
      connecting.value = false;
      connected.value = false;
    };
    
    ws.value.onclose = (event) => {
      addLog('warning', `WebSocket 连接关闭: code=${event.code}, reason=${event.reason}`);
      connected.value = false;
      connecting.value = false;
      
      if (event.code !== 1000) {
        ElMessage.warning('WebSocket 连接异常关闭');
      }
    };
    
    // 设置连接超时
    setTimeout(() => {
      if (connecting.value && !connected.value) {
        addLog('error', 'WebSocket 连接超时');
        disconnect();
        ElMessage.error('连接超时');
      }
    }, 10000);
    
  } catch (error) {
    addLog('error', `连接异常: ${error}`);
    connecting.value = false;
    connected.value = false;
    ElMessage.error(`连接异常: ${error}`);
  }
};

// 断开连接
const disconnect = () => {
  if (ws.value) {
    addLog('info', '主动断开 WebSocket 连接');
    ws.value.close(1000, '用户主动断开');
    ws.value = null;
  }
  connected.value = false;
  connecting.value = false;
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
  addLog('info', '日志已清空');
};

// 监听配置变化
watch([() => testConfig.protocol, () => testConfig.serverId], () => {
  if (connected.value) {
    addLog('warning', '配置已变更，请重新连接');
  }
});

// 初始化
addLog('info', 'WebSocket 连接测试工具已加载');
</script>

<style scoped lang="scss">
.websocket-test {
  padding: 20px;
  
  .test-controls {
    margin-bottom: 20px;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
    
    .test-actions {
      margin: 20px 0;
      text-align: center;
      
      .el-button {
        margin: 0 10px;
      }
    }
    
    .connection-status {
      text-align: center;
      margin-top: 15px;
    }
  }
  
  .test-logs {
    h4 {
      margin: 0 0 10px 0;
      color: #303133;
    }
    
    .log-content {
      height: 400px;
      overflow-y: auto;
      background: #000;
      color: #fff;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      
      .log-item {
        margin-bottom: 8px;
        line-height: 1.4;
        
        .log-time {
          color: #909399;
          margin-right: 10px;
          font-weight: bold;
        }
        
        &.log-info .log-message {
          color: #409eff;
        }
        
        &.log-success .log-message {
          color: #67c23a;
        }
        
        &.log-warning .log-message {
          color: #e6a23c;
        }
        
        &.log-error .log-message {
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
