<template>
  <div class="test-metrics-container">
    <h2>ServerMetrics重构测试页面</h2>
    
    <div class="test-info">
      <el-card>
        <template #header>
          <span>测试信息</span>
        </template>
        <p>WebSocket连接状态: {{ wsConnected ? '已连接' : '未连接' }}</p>
        <p>Store中的服务器数量: {{ metricsStore.getAllServerMetrics.length }}</p>
        <p>最后更新时间: {{ lastUpdateTime ? new Date(lastUpdateTime).toLocaleString() : '无' }}</p>
      </el-card>
    </div>

    <div class="test-controls">
      <el-card>
        <template #header>
          <span>测试控制</span>
        </template>
        <el-button @click="simulateMetricsData" type="primary">模拟指标数据</el-button>
        <el-button @click="clearStore" type="danger">清空Store</el-button>
        <el-button @click="refreshData" type="success">刷新数据</el-button>
      </el-card>
    </div>

    <div class="metrics-display">
      <el-card>
        <template #header>
          <span>指标数据显示</span>
        </template>
        <div v-if="metricsStore.getAllServerMetrics.length === 0" class="empty-state">
          <el-empty description="暂无指标数据" />
        </div>
        <div v-else class="metrics-grid">
          <div 
            v-for="metrics in metricsStore.getAllServerMetrics" 
            :key="metrics.serverId"
            class="metrics-card"
          >
            <el-card>
              <template #header>
                <span>服务器 {{ metrics.serverId }}</span>
                <el-tag 
                  :type="metrics.status === 'online' ? 'success' : 'danger'"
                  size="small"
                  class="ml-2"
                >
                  {{ metrics.status }}
                </el-tag>
              </template>
              <div class="metrics-content">
                <div class="metric-item">
                  <span class="label">CPU使用率:</span>
                  <el-progress 
                    :percentage="metrics.cpuUsage" 
                    :color="getProgressColor(metrics.cpuUsage)"
                    class="progress"
                  />
                  <span class="value">{{ metrics.cpuUsage }}%</span>
                </div>
                <div class="metric-item">
                  <span class="label">内存使用率:</span>
                  <el-progress 
                    :percentage="metrics.memoryUsage" 
                    :color="getProgressColor(metrics.memoryUsage)"
                    class="progress"
                  />
                  <span class="value">{{ metrics.memoryUsage }}%</span>
                </div>
                <div class="metric-item">
                  <span class="label">磁盘使用率:</span>
                  <el-progress 
                    :percentage="metrics.diskUsage" 
                    :color="getProgressColor(metrics.diskUsage)"
                    class="progress"
                  />
                  <span class="value">{{ metrics.diskUsage }}%</span>
                </div>
                <div class="metric-item">
                  <span class="label">网络流量:</span>
                  <span class="value">↑{{ formatBytes(metrics.networkOut) }}/s ↓{{ formatBytes(metrics.networkIn) }}/s</span>
                </div>
                <div v-if="metrics.loadAverage" class="metric-item">
                  <span class="label">系统负载:</span>
                  <span class="value">{{ metrics.loadAverage }}</span>
                </div>
                <div v-if="metrics.uptime" class="metric-item">
                  <span class="label">运行时间:</span>
                  <span class="value">{{ formatUptime(metrics.uptime) }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-card>
    </div>

    <div class="dashboard-test">
      <el-card>
        <template #header>
          <span>ServerMetricsDashboard组件测试</span>
        </template>
        <div v-if="selectedServerId">
          <p>选择的服务器ID: {{ selectedServerId }}</p>
          <ServerMetricsDashboard 
            :server-id="selectedServerId"
            :metrics="getSelectedServerMetrics()"
          />
        </div>
        <div v-else>
          <p>请先模拟数据，然后选择一个服务器进行测试</p>
          <el-select v-model="selectedServerId" placeholder="选择服务器" clearable>
            <el-option 
              v-for="metrics in metricsStore.getAllServerMetrics"
              :key="metrics.serverId"
              :label="`服务器 ${metrics.serverId}`"
              :value="metrics.serverId"
            />
          </el-select>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useServerMetricsStore } from '@/stores/serverMetrics';
import { useServerWebSocket } from '@/composables/useServerWebSocket';
import ServerMetricsDashboard from '@/components/dashboard/ServerMetricsDashboard.vue';

// Store和WebSocket
const metricsStore = useServerMetricsStore();
const { state: wsState } = useServerWebSocket();
const wsConnected = computed(() => wsState.value.connected);

// 测试状态
const selectedServerId = ref<number | null>(null);

// 计算属性
const lastUpdateTime = computed(() => metricsStore.getLastUpdateTime);

/**
 * 模拟指标数据
 */
const simulateMetricsData = () => {
  // 模拟3个服务器的数据
  for (let i = 1; i <= 3; i++) {
    const mockData = {
      serverId: i,
      serverName: `测试服务器${i}`,
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      networkIn: Math.floor(Math.random() * 1000000),
      networkOut: Math.floor(Math.random() * 1000000),
      loadAverage: `${(Math.random() * 4).toFixed(2)}`,
      uptime: Math.floor(Math.random() * 86400 * 30), // 30天内的随机秒数
      processCount: Math.floor(Math.random() * 200) + 50,
      temperature: Math.floor(Math.random() * 40) + 30,
      status: Math.random() > 0.2 ? 'online' : 'offline',
      collectTime: new Date().toISOString(),
    };
    
    metricsStore.updateServerMetrics(i, mockData);
  }
  
  // 自动选择第一个服务器
  if (!selectedServerId.value) {
    selectedServerId.value = 1;
  }
};

/**
 * 清空Store
 */
const clearStore = () => {
  metricsStore.clearCache();
  selectedServerId.value = null;
};

/**
 * 刷新数据
 */
const refreshData = () => {
  simulateMetricsData();
};

/**
 * 获取选中服务器的指标数据
 */
const getSelectedServerMetrics = () => {
  if (!selectedServerId.value) return null;
  return metricsStore.getServerMetrics(selectedServerId.value);
};

/**
 * 获取进度条颜色
 */
const getProgressColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a';
  if (percentage < 80) return '#e6a23c';
  return '#f56c6c';
};

/**
 * 格式化字节
 */
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * 格式化运行时间
 */
const formatUptime = (seconds: number) => {
  if (!seconds) return '-';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};
</script>

<style scoped lang="scss">
.test-metrics-container {
  padding: 20px;
  
  h2 {
    margin-bottom: 20px;
    color: #303133;
  }
  
  .test-info,
  .test-controls,
  .metrics-display,
  .dashboard-test {
    margin-bottom: 20px;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  
  .metrics-card {
    .metrics-content {
      .metric-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        
        .label {
          width: 80px;
          font-size: 14px;
          color: #606266;
        }
        
        .progress {
          flex: 1;
          margin: 0 12px;
        }
        
        .value {
          width: 80px;
          text-align: right;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
  }
}
</style>
