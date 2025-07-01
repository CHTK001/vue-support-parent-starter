<template>
  <div class="websocket-test">
    <el-card header="WebSocket 连接测试">
      <div class="test-section">
        <h3>基础 WebSocket 测试</h3>
        <el-space>
          <el-button @click="testBasicWebSocket" :loading="basicTesting">
            测试基础 WebSocket
          </el-button>
          <el-tag :type="basicStatus === 'connected' ? 'success' : basicStatus === 'error' ? 'danger' : 'info'">
            {{ basicStatusText }}
          </el-tag>
        </el-space>
        <div v-if="basicError" class="error-message">
          错误信息: {{ basicError }}
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>Guacamole WebSocket 测试</h3>
        <el-space>
          <el-button @click="testGuacamoleWebSocket" :loading="guacamoleTesting">
            测试 Guacamole WebSocket
          </el-button>
          <el-tag :type="guacamoleStatus === 'connected' ? 'success' : guacamoleStatus === 'error' ? 'danger' : 'info'">
            {{ guacamoleStatusText }}
          </el-tag>
        </el-space>
        <div v-if="guacamoleError" class="error-message">
          错误信息: {{ guacamoleError }}
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>连接日志</h3>
        <el-scrollbar height="200px">
          <div class="log-container">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span :class="['log-level', `log-${log.level}`]">{{ log.level.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </el-scrollbar>
        <el-button @click="clearLogs" size="small" style="margin-top: 10px;">
          清空日志
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

// 状态
const basicTesting = ref(false);
const basicStatus = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
const basicError = ref<string>('');

const guacamoleTesting = ref(false);
const guacamoleStatus = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
const guacamoleError = ref<string>('');

// 日志
interface LogItem {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

const logs = ref<LogItem[]>([]);

// 计算属性
const basicStatusText = computed(() => {
  switch (basicStatus.value) {
    case 'idle': return '未连接';
    case 'connecting': return '连接中...';
    case 'connected': return '已连接';
    case 'error': return '连接失败';
    default: return '未知状态';
  }
});

const guacamoleStatusText = computed(() => {
  switch (guacamoleStatus.value) {
    case 'idle': return '未连接';
    case 'connecting': return '连接中...';
    case 'connected': return '已连接';
    case 'error': return '连接失败';
    default: return '未知状态';
  }
});

// 方法
const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    level,
    message
  });
  
  // 保持最多100条日志
  if (logs.value.length > 100) {
    logs.value.shift();
  }
};

const clearLogs = () => {
  logs.value = [];
};

// 测试基础 WebSocket
const testBasicWebSocket = () => {
  basicTesting.value = true;
  basicStatus.value = 'connecting';
  basicError.value = '';

  addLog('info', '开始测试基础 WebSocket 连接...');

  try {
    // 直接连接到后端服务器，绕过 Vite 代理
    const wsUrl = `ws://localhost:19170/monitor/api/websocket/test`;

    addLog('info', `连接 URL: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      addLog('info', '基础 WebSocket 连接成功');
      basicStatus.value = 'connected';
      basicTesting.value = false;
      ElMessage.success('基础 WebSocket 连接成功');
      
      // 发送测试消息
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      
      // 5秒后关闭连接
      setTimeout(() => {
        ws.close();
      }, 5000);
    };
    
    ws.onmessage = (event) => {
      addLog('info', `收到消息: ${event.data}`);
    };
    
    ws.onerror = (error) => {
      addLog('error', `WebSocket 错误: ${error}`);
      basicStatus.value = 'error';
      basicError.value = error.toString();
      basicTesting.value = false;
      ElMessage.error('基础 WebSocket 连接失败');
    };
    
    ws.onclose = (event) => {
      addLog('info', `WebSocket 连接关闭: code=${event.code}, reason=${event.reason}`);
      if (basicStatus.value === 'connected') {
        basicStatus.value = 'idle';
      }
    };
    
    // 10秒超时
    setTimeout(() => {
      if (basicStatus.value === 'connecting') {
        ws.close();
        basicStatus.value = 'error';
        basicError.value = '连接超时';
        basicTesting.value = false;
        addLog('error', '基础 WebSocket 连接超时');
        ElMessage.error('基础 WebSocket 连接超时');
      }
    }, 10000);
    
  } catch (error) {
    addLog('error', `创建 WebSocket 失败: ${error}`);
    basicStatus.value = 'error';
    basicError.value = error instanceof Error ? error.message : String(error);
    basicTesting.value = false;
    ElMessage.error('创建 WebSocket 失败');
  }
};

// 测试 Guacamole WebSocket
const testGuacamoleWebSocket = () => {
  guacamoleTesting.value = true;
  guacamoleStatus.value = 'connecting';
  guacamoleError.value = '';

  addLog('info', '开始测试 Guacamole WebSocket 连接...');

  try {
    // 直接连接到后端服务器，绕过 Vite 代理
    // 使用一个不存在的服务器ID进行测试，这样可以测试连接但不会实际连接到服务器
    const wsUrl = `ws://localhost:19170/monitor/api/websocket/rdp?serverId=999`;

    addLog('info', `连接 URL: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      addLog('info', 'Guacamole WebSocket 连接成功');
      guacamoleStatus.value = 'connected';
      guacamoleTesting.value = false;
      ElMessage.success('Guacamole WebSocket 连接成功');

      // 不发送任何消息，只测试连接

      // 3秒后关闭连接
      setTimeout(() => {
        ws.close();
      }, 3000);
    };
    
    ws.onmessage = (event) => {
      addLog('info', `收到 Guacamole 消息: ${event.data}`);
    };
    
    ws.onerror = (error) => {
      addLog('error', `Guacamole WebSocket 错误: ${error}`);
      guacamoleStatus.value = 'error';
      guacamoleError.value = error.toString();
      guacamoleTesting.value = false;
      ElMessage.error('Guacamole WebSocket 连接失败');
    };
    
    ws.onclose = (event) => {
      addLog('info', `Guacamole WebSocket 连接关闭: code=${event.code}, reason=${event.reason}`);
      if (guacamoleStatus.value === 'connected') {
        guacamoleStatus.value = 'idle';
      }
    };
    
    // 10秒超时
    setTimeout(() => {
      if (guacamoleStatus.value === 'connecting') {
        ws.close();
        guacamoleStatus.value = 'error';
        guacamoleError.value = '连接超时';
        guacamoleTesting.value = false;
        addLog('error', 'Guacamole WebSocket 连接超时');
        ElMessage.error('Guacamole WebSocket 连接超时');
      }
    }, 10000);
    
  } catch (error) {
    addLog('error', `创建 Guacamole WebSocket 失败: ${error}`);
    guacamoleStatus.value = 'error';
    guacamoleError.value = error instanceof Error ? error.message : String(error);
    guacamoleTesting.value = false;
    ElMessage.error('创建 Guacamole WebSocket 失败');
  }
};
</script>

<style scoped>
.websocket-test {
  padding: 20px;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h3 {
  margin-bottom: 10px;
  color: #303133;
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 14px;
}

.log-container {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  display: flex;
  margin-bottom: 5px;
  line-height: 1.4;
}

.log-time {
  color: #909399;
  margin-right: 10px;
  min-width: 80px;
}

.log-level {
  margin-right: 10px;
  min-width: 50px;
  font-weight: bold;
}

.log-info {
  color: #409eff;
}

.log-warn {
  color: #e6a23c;
}

.log-error {
  color: #f56c6c;
}

.log-message {
  flex: 1;
  word-break: break-all;
}
</style>
