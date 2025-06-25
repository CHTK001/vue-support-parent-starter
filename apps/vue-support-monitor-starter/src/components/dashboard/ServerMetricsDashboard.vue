<template>
  <div class="server-metrics-dashboard">
    <!-- 实时指标卡片 -->
    <div class="metrics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="metric-card cpu">
            <div class="metric-content">
              <div class="metric-icon">
                <IconifyIconOnline icon="ri:cpu-line" />
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ currentMetrics.cpuUsage }}%</div>
                <div class="metric-label">CPU使用率</div>
                <div class="metric-trend" :class="getTrendClass('cpu')">
                  <IconifyIconOnline :icon="getTrendIcon('cpu')" />
                  {{ getTrendText('cpu') }}
                </div>
              </div>
            </div>
            <div class="metric-progress">
              <el-progress
                :percentage="currentMetrics.cpuUsage"
                :color="getProgressColor(currentMetrics.cpuUsage)"
                :show-text="false"
                :stroke-width="4"
              />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="metric-card memory">
            <div class="metric-content">
              <div class="metric-icon">
                <IconifyIconOnline icon="ri:database-line" />
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ currentMetrics.memoryUsage }}%</div>
                <div class="metric-label">内存使用率</div>
                <div class="metric-trend" :class="getTrendClass('memory')">
                  <IconifyIconOnline :icon="getTrendIcon('memory')" />
                  {{ getTrendText('memory') }}
                </div>
              </div>
            </div>
            <div class="metric-progress">
              <el-progress
                :percentage="currentMetrics.memoryUsage"
                :color="getProgressColor(currentMetrics.memoryUsage)"
                :show-text="false"
                :stroke-width="4"
              />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="metric-card disk">
            <div class="metric-content">
              <div class="metric-icon">
                <IconifyIconOnline icon="ri:hard-drive-line" />
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ currentMetrics.diskUsage }}%</div>
                <div class="metric-label">磁盘使用率</div>
                <div class="metric-trend" :class="getTrendClass('disk')">
                  <IconifyIconOnline :icon="getTrendIcon('disk')" />
                  {{ getTrendText('disk') }}
                </div>
              </div>
            </div>
            <div class="metric-progress">
              <el-progress
                :percentage="currentMetrics.diskUsage"
                :color="getProgressColor(currentMetrics.diskUsage)"
                :show-text="false"
                :stroke-width="4"
              />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="metric-card network">
            <div class="metric-content">
              <div class="metric-icon">
                <IconifyIconOnline icon="ri:wifi-line" />
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ formatBytes(currentMetrics.networkTotal) }}/s</div>
                <div class="metric-label">网络流量</div>
                <div class="metric-detail">
                  ↑{{ formatBytes(currentMetrics.networkOut) }}/s
                  ↓{{ formatBytes(currentMetrics.networkIn) }}/s
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>CPU & 内存使用率</span>
                <el-button-group size="small">
                  <el-button :type="timeRange === '1h' ? 'primary' : ''" @click="setTimeRange('1h')">1小时</el-button>
                  <el-button :type="timeRange === '6h' ? 'primary' : ''" @click="setTimeRange('6h')">6小时</el-button>
                  <el-button :type="timeRange === '24h' ? 'primary' : ''" @click="setTimeRange('24h')">24小时</el-button>
                </el-button-group>
              </div>
            </template>
            <MetricsChart
              ref="cpuMemoryChartRef"
              :data="cpuMemoryData"
              type="line"
              :height="300"
              :color="['#409eff', '#67c23a']"
              :loading="loading"
              :real-time="realTime"
              :smooth="true"
            />
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>磁盘使用情况</span>
            </template>
            <MetricsChart
              ref="diskChartRef"
              :data="diskData"
              type="pie"
              :height="300"
              :loading="loading"
            />
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>网络流量</span>
                <div class="chart-controls">
                  <el-switch
                    v-model="realTime"
                    active-text="实时"
                    inactive-text="历史"
                    @change="handleRealTimeToggle"
                  />
                </div>
              </div>
            </template>
            <MetricsChart
              ref="networkChartRef"
              :data="networkData"
              type="line"
              :height="250"
              :color="['#e6a23c', '#f56c6c']"
              :loading="loading"
              :real-time="realTime"
              :area="true"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 系统信息 -->
    <div class="system-info">
      <el-card>
        <template #header>
          <span>系统信息</span>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="系统负载">
            {{ currentMetrics.loadAverage || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="运行时间">
            {{ formatUptime(currentMetrics.uptime) }}
          </el-descriptions-item>
          <el-descriptions-item label="进程数">
            {{ currentMetrics.processCount || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="CPU温度">
            {{ currentMetrics.temperature ? currentMetrics.temperature + '°C' : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { MonitorWebSocket } from "@/utils/websocket";
import MetricsChart from "@/components/charts/MetricsChart.vue";
import type { ServerMetrics } from "@/api/server";

// 定义属性
interface Props {
  serverId: string | number;
  autoStart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
});

// 响应式状态
const loading = ref(false);
const realTime = ref(true);
const timeRange = ref('1h');

// 当前指标
const currentMetrics = reactive({
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  networkIn: 0,
  networkOut: 0,
  networkTotal: 0,
  loadAverage: '',
  uptime: 0,
  processCount: 0,
  temperature: 0,
});

// 历史指标
const metricsHistory = ref<ServerMetrics[]>([]);
const previousMetrics = ref<ServerMetrics | null>(null);

// WebSocket连接
let monitorWebSocket: MonitorWebSocket | null = null;

// 图表引用
const cpuMemoryChartRef = ref();
const diskChartRef = ref();
const networkChartRef = ref();

// 计算属性
const cpuMemoryData = computed(() => {
  return metricsHistory.value.map(item => ({
    time: new Date(item.collectTime).toLocaleTimeString(),
    cpu: item.cpuUsage,
    memory: item.memoryUsage,
  }));
});

const diskData = computed(() => {
  const used = currentMetrics.diskUsage;
  const free = 100 - used;
  return [
    { name: '已使用', value: used },
    { name: '可用', value: free },
  ];
});

const networkData = computed(() => {
  return metricsHistory.value.map(item => ({
    time: new Date(item.collectTime).toLocaleTimeString(),
    in: item.networkIn,
    out: item.networkOut,
  }));
});

/**
 * 连接监控WebSocket
 */
const connectMonitor = () => {
  monitorWebSocket = new MonitorWebSocket(props.serverId, {
    onOpen: () => {
      console.log('监控连接已建立');
      // 订阅所有指标
      monitorWebSocket?.subscribeMetrics(['cpu', 'memory', 'disk', 'network', 'system']);
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'metrics') {
          updateMetrics(data.metrics);
        }
      } catch (error) {
        console.error('解析监控数据失败:', error);
      }
    },
    onClose: () => {
      console.log('监控连接已断开');
    },
    onError: (error) => {
      console.error('监控连接错误:', error);
    },
  });
  
  monitorWebSocket.connect();
};

/**
 * 断开监控连接
 */
const disconnectMonitor = () => {
  if (monitorWebSocket) {
    monitorWebSocket.disconnect();
    monitorWebSocket = null;
  }
};

/**
 * 更新指标数据
 */
const updateMetrics = (metrics: ServerMetrics) => {
  // 保存上一次的指标用于趋势计算
  if (currentMetrics.cpuUsage > 0) {
    previousMetrics.value = { ...currentMetrics } as ServerMetrics;
  }
  
  // 更新当前指标
  Object.assign(currentMetrics, {
    cpuUsage: metrics.cpuUsage,
    memoryUsage: metrics.memoryUsage,
    diskUsage: metrics.diskUsage,
    networkIn: metrics.networkIn,
    networkOut: metrics.networkOut,
    networkTotal: metrics.networkIn + metrics.networkOut,
    loadAverage: metrics.loadAverage,
    uptime: metrics.uptime,
    processCount: metrics.processCount,
    temperature: metrics.temperature,
  });
  
  // 添加到历史记录
  metricsHistory.value.push(metrics);
  
  // 限制历史记录数量
  const maxPoints = getMaxDataPoints();
  if (metricsHistory.value.length > maxPoints) {
    metricsHistory.value.shift();
  }
  
  // 实时模式下更新图表
  if (realTime.value) {
    updateCharts();
  }
};

/**
 * 获取最大数据点数量
 */
const getMaxDataPoints = () => {
  switch (timeRange.value) {
    case '1h': return 60;   // 1分钟一个点
    case '6h': return 72;   // 5分钟一个点
    case '24h': return 144; // 10分钟一个点
    default: return 60;
  }
};

/**
 * 更新图表
 */
const updateCharts = () => {
  // 这里可以添加图表更新逻辑
};

/**
 * 设置时间范围
 */
const setTimeRange = (range: string) => {
  timeRange.value = range;
  // 重新加载历史数据
  loadHistoryData();
};

/**
 * 处理实时模式切换
 */
const handleRealTimeToggle = (enabled: boolean) => {
  if (enabled) {
    connectMonitor();
  } else {
    disconnectMonitor();
    loadHistoryData();
  }
};

/**
 * 加载历史数据
 */
const loadHistoryData = async () => {
  if (realTime.value) return;
  
  try {
    loading.value = true;
    // 这里应该调用API加载历史数据
    // const res = await getServerMetricsHistory(props.serverId, timeRange.value);
    // metricsHistory.value = res.data;
  } catch (error) {
    console.error('加载历史数据失败:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 获取趋势类名
 */
const getTrendClass = (metric: string) => {
  if (!previousMetrics.value) return '';
  
  const current = currentMetrics[metric as keyof typeof currentMetrics] as number;
  const previous = previousMetrics.value[metric as keyof ServerMetrics] as number;
  
  if (current > previous) return 'trend-up';
  if (current < previous) return 'trend-down';
  return 'trend-stable';
};

/**
 * 获取趋势图标
 */
const getTrendIcon = (metric: string) => {
  const trendClass = getTrendClass(metric);
  switch (trendClass) {
    case 'trend-up': return 'ri:arrow-up-line';
    case 'trend-down': return 'ri:arrow-down-line';
    default: return 'ri:subtract-line';
  }
};

/**
 * 获取趋势文本
 */
const getTrendText = (metric: string) => {
  if (!previousMetrics.value) return '';
  
  const current = currentMetrics[metric as keyof typeof currentMetrics] as number;
  const previous = previousMetrics.value[metric as keyof ServerMetrics] as number;
  const diff = Math.abs(current - previous);
  
  if (diff < 1) return '';
  
  const direction = current > previous ? '+' : '-';
  return `${direction}${diff.toFixed(1)}%`;
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

// 生命周期
onMounted(() => {
  if (props.autoStart) {
    if (realTime.value) {
      connectMonitor();
    } else {
      loadHistoryData();
    }
  }
});

onUnmounted(() => {
  disconnectMonitor();
});
</script>

<style scoped lang="scss">
.server-metrics-dashboard {
  .metrics-cards {
    margin-bottom: 20px;

    .metric-card {
      .metric-content {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
          color: white;
        }

        .metric-info {
          flex: 1;

          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
          }

          .metric-label {
            font-size: 12px;
            color: #909399;
            margin: 4px 0;
          }

          .metric-trend {
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 2px;

            &.trend-up {
              color: #f56c6c;
            }

            &.trend-down {
              color: #67c23a;
            }

            &.trend-stable {
              color: #909399;
            }
          }

          .metric-detail {
            font-size: 11px;
            color: #909399;
            margin-top: 2px;
          }
        }
      }

      &.cpu .metric-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.memory .metric-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.disk .metric-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.network .metric-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
  }

  .charts-section {
    margin-bottom: 20px;

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .system-info {
    :deep(.el-descriptions__label) {
      font-weight: 500;
    }
  }
}
</style>
