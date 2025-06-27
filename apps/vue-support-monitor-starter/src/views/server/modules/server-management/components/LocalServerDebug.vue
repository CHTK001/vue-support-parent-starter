<template>
  <div class="local-server-debug">
    <el-card header="本地服务器调试工具">
      <div class="debug-section">
        <h4>本地服务器列表</h4>
        <el-table :data="localServers" style="width: 100%" v-loading="loading">
          <el-table-column prop="monitorSysGenServerId" label="ID" width="80" />
          <el-table-column prop="monitorSysGenServerName" label="服务器名称" />
          <el-table-column prop="monitorSysGenServerHost" label="主机地址" />
          <el-table-column prop="monitorSysGenServerDataReportMethod" label="上报方式" />
          <el-table-column prop="monitorSysGenServerStatus" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.monitorSysGenServerStatus === 1 ? 'success' : 'danger'">
                {{ row.monitorSysGenServerStatus === 1 ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300">
            <template #default="{ row }">
              <el-button size="small" @click="collectData(row.monitorSysGenServerId)">
                手动收集数据
              </el-button>
              <el-button size="small" type="success" @click="startCollection(row.monitorSysGenServerId)">
                启动收集
              </el-button>
              <el-button size="small" type="warning" @click="stopCollection(row.monitorSysGenServerId)">
                停止收集
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="debug-section">
        <h4>最新收集的数据</h4>
        <el-card v-if="latestMetrics">
          <pre>{{ JSON.stringify(latestMetrics, null, 2) }}</pre>
        </el-card>
        <el-empty v-else description="暂无数据" />
      </div>

      <div class="debug-section">
        <h4>WebSocket消息日志</h4>
        <el-card>
          <div class="message-log">
            <div v-for="(msg, index) in wsMessages" :key="index" class="message-item">
              <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
              <span class="message-type">{{ msg.type }}</span>
              <pre class="message-data">{{ JSON.stringify(msg.data, null, 2) }}</pre>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { message } from '@repo/utils';
import { getServerPageList } from '@/api/server';
import { useServerWebSocket } from '@/composables/useServerWebSocket';

// 响应式数据
const loading = ref(false);
const localServers = ref([]);
const latestMetrics = ref(null);
const wsMessages = ref([]);

// WebSocket
const { connect, disconnect, onMessage, state } = useServerWebSocket();

// 加载本地服务器列表
const loadLocalServers = async () => {
  try {
    loading.value = true;
    const res = await getServerPageList({
      current: 1,
      size: 100,
      monitorSysGenServerIsLocal: 1,
      monitorSysGenServerDataReportMethod: 'LOCAL'
    });
    
    if (res.code === '00000') {
      localServers.value = res.data.records || [];
      message.success(`找到 ${localServers.value.length} 个本地服务器`);
    }
  } catch (error) {
    console.error('加载本地服务器失败:', error);
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
};

// 手动收集数据
const collectData = async (serverId: number) => {
  try {
    const response = await fetch(`/api/monitor/data-report/collect-local/${serverId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();

    if (result.code === '00000') {
      latestMetrics.value = result.data;
      message.success('数据收集成功');
    } else {
      message.error(result.msg || '收集失败');
    }
  } catch (error) {
    console.error('收集数据失败:', error);
    message.error('收集失败');
  }
};

// 启动数据收集
const startCollection = async (serverId: number) => {
  try {
    const response = await fetch(`/api/monitor/data-report/start/${serverId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();

    if (result.code === '00000') {
      message.success('数据收集已启动');
    } else {
      message.error(result.msg || '启动失败');
    }
  } catch (error) {
    console.error('启动收集失败:', error);
    message.error('启动失败');
  }
};

// 停止数据收集
const stopCollection = async (serverId: number) => {
  try {
    const response = await fetch(`/api/monitor/data-report/stop/${serverId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();

    if (result.code === '00000') {
      message.success('数据收集已停止');
    } else {
      message.error(result.msg || '停止失败');
    }
  } catch (error) {
    console.error('停止收集失败:', error);
    message.error('停止失败');
  }
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

// 监听WebSocket消息
onMounted(async () => {
  await loadLocalServers();
  
  // 连接WebSocket
  await connect();
  
  // 监听服务器指标消息
  onMessage('server_metrics', (message) => {
    console.log('收到服务器指标数据:', message);
    wsMessages.value.unshift({
      timestamp: Date.now(),
      type: 'server_metrics',
      data: message
    });
    
    // 保留最近50条消息
    if (wsMessages.value.length > 50) {
      wsMessages.value = wsMessages.value.slice(0, 50);
    }
    
    // 更新最新指标
    if (message.data && message.data.metrics) {
      latestMetrics.value = message.data.metrics;
    }
  });
  
  // 监听所有消息类型
  onMessage('*', (message) => {
    console.log('收到WebSocket消息:', message);
    wsMessages.value.unshift({
      timestamp: Date.now(),
      type: message.messageType || 'unknown',
      data: message
    });
    
    if (wsMessages.value.length > 50) {
      wsMessages.value = wsMessages.value.slice(0, 50);
    }
  });
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped>
.local-server-debug {
  padding: 20px;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.message-log {
  max-height: 400px;
  overflow-y: auto;
}

.message-item {
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 10px 0;
}

.timestamp {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-right: 10px;
}

.message-type {
  color: var(--el-color-primary);
  font-weight: bold;
  margin-right: 10px;
}

.message-data {
  background: var(--el-fill-color-extra-light);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 5px;
}
</style>
