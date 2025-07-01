<template>
  <div class="simple-rdp-test">
    <el-card header="SimpleRDPDesktop 测试页面">
      <div class="test-controls">
        <el-form :model="testConfig" label-width="120px" size="small">
          <el-form-item label="服务器ID">
            <el-input-number v-model="testConfig.serverId" :min="1" />
          </el-form-item>
          <el-form-item label="服务器名称">
            <el-input v-model="testConfig.serverName" />
          </el-form-item>
          <el-form-item label="主机地址">
            <el-input v-model="testConfig.host" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="testConfig.port" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="testConfig.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="testConfig.password" type="password" show-password />
          </el-form-item>
        </el-form>
        
        <div class="test-actions">
          <el-button type="primary" @click="startTest">开始测试</el-button>
          <el-button @click="clearLogs">清空日志</el-button>
        </div>
      </div>
      
      <div class="test-result">
        <div class="rdp-container">
          <SimpleRDPDesktop 
            v-if="testServer"
            :server="testServer"
            @connection-change="handleConnectionChange"
          />
        </div>
        
        <div class="test-logs">
          <h4>测试日志</h4>
          <div class="log-content">
            <div 
              v-for="(log, index) in testLogs" 
              :key="index"
              :class="['log-item', `log-${log.level}`]"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import SimpleRDPDesktop from '../server/modules/server-management/components/remote/SimpleRDPDesktop.vue';

// 测试配置
const testConfig = reactive({
  serverId: 1,
  serverName: 'Test RDP Server',
  host: '192.168.1.100',
  port: 3389,
  username: 'administrator',
  password: ''
});

// 测试服务器对象
const testServer = ref<any>(null);

// 测试日志
const testLogs = ref<Array<{ time: string; level: string; message: string }>>([]);

// 添加日志
const addLog = (level: string, message: string) => {
  const now = new Date();
  const time = now.toLocaleTimeString();
  testLogs.value.push({ time, level, message });
  
  // 限制日志数量
  if (testLogs.value.length > 100) {
    testLogs.value.shift();
  }
};

// 开始测试
const startTest = async () => {
  addLog('info', '开始 SimpleRDPDesktop 测试');

  // 验证配置
  if (!testConfig.host || !testConfig.port) {
    ElMessage.error('请填写完整的服务器配置');
    addLog('error', '配置验证失败：缺少主机地址或端口');
    return;
  }

  // 先测试WebSocket连接
  addLog('info', '步骤1: 测试WebSocket连接');
  const wsTestResult = await testWebSocketConnection();

  if (!wsTestResult) {
    addLog('error', 'WebSocket连接测试失败，无法继续');
    return;
  }

  // 创建测试服务器对象
  testServer.value = {
    monitorSysGenServerId: testConfig.serverId,
    monitorSysGenServerName: testConfig.serverName,
    monitorSysGenServerHost: testConfig.host,
    monitorSysGenServerPort: testConfig.port,
    monitorSysGenServerUsername: testConfig.username,
    monitorSysGenServerPassword: testConfig.password
  };

  addLog('success', `步骤2: 创建测试服务器对象: ${testConfig.serverName} (${testConfig.host}:${testConfig.port})`);
  ElMessage.success('测试服务器配置已创建');
};

// 测试WebSocket连接
const testWebSocketConnection = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || '/monitor/api';
    const path = baseUrl + `/websocket/rdp`;
    const params = new URLSearchParams({
      serverId: testConfig.serverId.toString()
    });
    const wsUrl = `${protocol}//${host}${path}?${params.toString()}`;

    addLog('info', `WebSocket URL: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        ws.close();
      }
    };

    ws.onopen = () => {
      addLog('success', 'WebSocket连接成功建立');
      cleanup();
      resolve(true);
    };

    ws.onerror = (error) => {
      addLog('error', `WebSocket连接错误: ${error}`);
      cleanup();
      resolve(false);
    };

    ws.onclose = (event) => {
      if (!resolved) {
        addLog('warning', `WebSocket连接关闭: code=${event.code}, reason=${event.reason}`);
        resolve(false);
      }
    };

    // 5秒超时
    setTimeout(() => {
      if (!resolved) {
        addLog('error', 'WebSocket连接超时');
        cleanup();
        resolve(false);
      }
    }, 5000);
  });
};

// 处理连接状态变化
const handleConnectionChange = (state: any) => {
  addLog('info', `RDP 连接状态变化: ${JSON.stringify(state)}`);
};

// 清空日志
const clearLogs = () => {
  testLogs.value = [];
  addLog('info', '日志已清空');
};

// 初始化
addLog('info', 'SimpleRDPDesktop 测试页面已加载');
</script>

<style scoped lang="scss">
.simple-rdp-test {
  padding: 20px;
  
  .test-controls {
    margin-bottom: 20px;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
    
    .test-actions {
      margin-top: 20px;
      text-align: center;
      
      .el-button {
        margin: 0 10px;
      }
    }
  }
  
  .test-result {
    display: flex;
    gap: 20px;
    
    .rdp-container {
      flex: 1;
      min-height: 600px;
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .test-logs {
      width: 400px;
      
      h4 {
        margin: 0 0 10px 0;
        color: #303133;
      }
      
      .log-content {
        height: 600px;
        overflow-y: auto;
        background: #000;
        color: #fff;
        padding: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        
        .log-item {
          margin-bottom: 5px;
          
          .log-time {
            color: #909399;
            margin-right: 10px;
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
}
</style>
