<template>
  <el-dialog
    v-model="visible"
    :title="`服务器监�?- ${serverInfo?.monitorSysGenServerName || '未知服务�?}`"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    class="monitor-dialog"
    top="5vh"
  >
    <div class="monitor-container">
      <!-- 服务器基本信�?-->
      <div class="server-info-card">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>服务器信�?/span>
              <el-tag
                :type="getConnectionStatusType(serverInfo?.monitorSysGenServerConnectionStatus)"
                size="small"
                effect="light"
              >
                {{ getConnectionStatusText(serverInfo?.monitorSysGenServerConnectionStatus) }}
              </el-tag>
            </div>
          </template>
          
          <el-descriptions v-if="serverInfo" :column="3" border>
            <el-descriptions-item label="服务器名�?>
              {{ serverInfo.monitorSysGenServerName }}
            </el-descriptions-item>
            <el-descriptions-item label="地址">
              {{ serverInfo.monitorSysGenServerHost }}:{{ serverInfo.monitorSysGenServerPort }}
            </el-descriptions-item>
            <el-descriptions-item label="协议">
              {{ serverInfo.monitorSysGenServerProtocol }}
            </el-descriptions-item>
            <el-descriptions-item label="监控状�?>
              <el-switch
                v-model="serverInfo.monitorSysGenServerMonitorEnabled"
                :active-value="1"
                :inactive-value="0"
                @change="handleMonitorToggle"
              />
            </el-descriptions-item>
            <el-descriptions-item label="最后连接时�?>
              {{ formatDateTime(serverInfo.monitorSysGenServerLastConnectTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述">
              {{ serverInfo.monitorSysGenServerDesc || '�? }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <!-- 实时指标 -->
      <div class="metrics-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-content">
                <div class="metric-icon cpu">
                  <IconifyIconOnline icon="ri:cpu-line" />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ currentMetrics.cpuUsage }}%</div>
                  <div class="metric-label">CPU使用�?/div>
                </div>
              </div>
              <ScProgress
                type="line"
                :percentage="currentMetrics.cpuUsage"
                :stages="getProgressStages('cpu')"
                :show-text="false"
                :stroke-width="6"
              />
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-content">
                <div class="metric-icon memory">
                  <IconifyIconOnline icon="ri:database-line" />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ currentMetrics.memoryUsage }}%</div>
                  <div class="metric-label">内存使用�?/div>
                </div>
              </div>
              <ScProgress
                type="line"
                :percentage="currentMetrics.memoryUsage"
                :stages="getProgressStages('memory')"
                :show-text="false"
                :stroke-width="6"
              />
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-content">
                <div class="metric-icon disk">
                  <IconifyIconOnline icon="ri:hard-drive-line" />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ currentMetrics.diskUsage }}%</div>
                  <div class="metric-label">磁盘使用�?/div>
                </div>
              </div>
              <ScProgress
                type="line"
                :percentage="currentMetrics.diskUsage"
                :stages="getProgressStages('disk')"
                :show-text="false"
                :stroke-width="6"
              />
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-content">
                <div class="metric-icon load">
                  <IconifyIconOnline icon="ri:speed-line" />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ currentMetrics.loadAverage.toFixed(2) }}</div>
                  <div class="metric-label">负载平均�?/div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 监控图表 -->
      <div class="charts-section">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="CPU监控" name="cpu">
            <div class="chart-container">
              <div class="chart-placeholder">
                <p>CPU使用率趋势图</p>
                <p>数据点数�? {{ metricsHistory.length }}</p>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="内存监控" name="memory">
            <div class="chart-container">
              <div class="chart-placeholder">
                <p>内存使用率趋势图</p>
                <p>数据点数�? {{ metricsHistory.length }}</p>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="磁盘监控" name="disk">
            <div class="chart-container">
              <div class="chart-placeholder">
                <p>磁盘使用率趋势图</p>
                <p>数据点数�? {{ metricsHistory.length }}</p>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="网络监控" name="network">
            <div class="chart-container">
              <div class="chart-placeholder">
                <p>网络流量趋势�?/p>
                <p>入站: {{ formatBytes(currentMetrics.networkIn) }}/s</p>
                <p>出站: {{ formatBytes(currentMetrics.networkOut) }}/s</p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <el-button
          type="primary"
          @click="handleCollectMetrics"
          :loading="collecting"
        >
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          手动收集
        </el-button>
        
        <el-button @click="handleExportData">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          导出数据
        </el-button>
        
        <el-button @click="handleViewHistory">
          <IconifyIconOnline icon="ri:history-line" class="mr-1" />
          历史记录
        </el-button>
        
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text="手动刷新"
          @change="handleAutoRefreshToggle"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ScProgress } from '@repo/components'
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { collectServerMetrics, enableServerMonitoring, disableServerMonitoring } from "@/api/server";
import { getConnectionStatusColor, getConnectionStatusText } from "@/api/server/connection-status";
import type { ServerInfo } from "@/api/server";

// 响应式状�?
const visible = ref(false);
const serverInfo = ref<ServerInfo | null>(null);
const collecting = ref(false);
const autoRefresh = ref(false);
const activeTab = ref("cpu");

// 当前指标
const currentMetrics = reactive({
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  networkIn: 0,
  networkOut: 0,
  loadAverage: 0,
  uptime: 0,
});

// 历史数据
const metricsHistory = ref<any[]>([]);

// 定时�?
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * 获取连接状态类�?
 */
const getConnectionStatusType = (status?: number) => {
  return getConnectionStatusColor(status || 0);
};

/**
 * 获取连接状态文�?
 */
const getConnectionStatusText = (status?: number) => {
  return getConnectionStatusText(status || 0);
};

/**
 * 获取进度条颜色（支持渐变和不同指标类型）
 */
const getProgressColor = (percentage: number, metricType: string = 'cpu') => {
  // 定义不同指标的阈�?
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 90 },
    memory: { normal: 60, warning: 80, critical: 90 },
    disk: { normal: 70, warning: 85, critical: 95 },
    network: { normal: 60, warning: 80, critical: 90 }
  };

  const threshold = thresholds[metricType as keyof typeof thresholds] || thresholds.cpu;

  // 返回渐变色配�?
  return [
    { color: '#67c23a', percentage: threshold.normal },
    { color: '#e6a23c', percentage: threshold.warning },
    { color: '#f56c6c', percentage: 100 }
  ]
}

/**
 * ScProgress 阶段颜色
 */
const getProgressStages = (metricType: string) => {
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 100 },
    memory: { normal: 60, warning: 85, critical: 100 },
    disk: { normal: 70, warning: 85, critical: 100 },
    network: { normal: 60, warning: 80, critical: 100 },
  } as const
  const t = (thresholds as any)[metricType] || thresholds.cpu
  return [
    { threshold: t.normal, color: '#67c23a' },
    { threshold: t.warning, color: '#e6a23c' },
    { threshold: t.critical, color: '#f56c6c' }
  ]
}

/**
 * 格式化字�?
 */
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化日期时�?
 */
const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return "从未连接";
  return new Date(dateTime).toLocaleString();
};

/**
 * 打开对话�?
 */
const open = (server: ServerInfo) => {
  serverInfo.value = server;
  visible.value = true;
  
  // 加载初始数据
  loadMetrics();
  
  // 如果启用了自动刷新，开始定时器
  if (autoRefresh.value) {
    startAutoRefresh();
  }
};

/**
 * 加载指标数据
 */
const loadMetrics = async () => {
  if (!serverInfo.value) return;
  
  try {
    // 这里应该调用获取服务器指标的API
    // 暂时使用模拟数据
    Object.assign(currentMetrics, {
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      networkIn: Math.floor(Math.random() * 1000000),
      networkOut: Math.floor(Math.random() * 1000000),
      loadAverage: Math.random() * 4,
      uptime: Math.floor(Math.random() * 86400),
    });
    
    // 添加到历史记�?
    metricsHistory.value.push({
      timestamp: new Date(),
      ...currentMetrics,
    });
    
    // 保持最�?00条记�?
    if (metricsHistory.value.length > 100) {
      metricsHistory.value.shift();
    }
  } catch (error) {
    console.error("加载指标数据失败:", error);
  }
};

/**
 * 处理监控开�?
 */
const handleMonitorToggle = async (enabled: number) => {
  if (!serverInfo.value) return;
  
  try {
    if (enabled === 1) {
      await enableServerMonitoring(serverInfo.value.monitorSysGenServerId.toString());
      message.success("监控已启�?);
    } else {
      await disableServerMonitoring(serverInfo.value.monitorSysGenServerId.toString());
      message.success("监控已禁�?);
    }
  } catch (error) {
    console.error("切换监控状态失�?", error);
    message.error("操作失败");
    // 回滚状�?
    serverInfo.value.monitorSysGenServerMonitorEnabled = enabled === 1 ? 0 : 1;
  }
};

/**
 * 处理手动收集指标
 */
const handleCollectMetrics = async () => {
  if (!serverInfo.value) return;
  
  try {
    collecting.value = true;
    await collectServerMetrics(serverInfo.value.monitorSysGenServerId.toString());
    await loadMetrics();
    message.success("指标收集成功");
  } catch (error) {
    console.error("收集指标失败:", error);
    message.error("收集指标失败");
  } finally {
    collecting.value = false;
  }
};

/**
 * 处理导出数据
 */
const handleExportData = () => {
  if (metricsHistory.value.length === 0) {
    message.warning("暂无数据可导�?);
    return;
  }
  
  try {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `server-metrics-${serverInfo.value?.monitorSysGenServerName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success("数据导出成功");
  } catch (error) {
    console.error("导出数据失败:", error);
    message.error("导出数据失败");
  }
};

/**
 * 生成CSV内容
 */
const generateCSV = () => {
  const headers = ["时间", "CPU使用�?, "内存使用�?, "磁盘使用�?, "网络入站", "网络出站", "负载平均�?];
  const rows = metricsHistory.value.map(item => [
    item.timestamp.toISOString(),
    item.cpuUsage,
    item.memoryUsage,
    item.diskUsage,
    item.networkIn,
    item.networkOut,
    item.loadAverage,
  ]);
  
  return [headers, ...rows].map(row => row.join(",")).join("\n");
};

/**
 * 处理查看历史记录
 */
const handleViewHistory = () => {
  // 这里可以打开历史记录对话框或跳转到历史页�?
  message.info("历史记录功能开发中");
};

/**
 * 处理自动刷新切换
 */
const handleAutoRefreshToggle = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

/**
 * 开始自动刷�?
 */
const startAutoRefresh = () => {
  if (refreshTimer) return;
  
  refreshTimer = setInterval(() => {
    loadMetrics();
  }, 5000); // �?秒刷新一�?
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// 暴露方法
defineExpose({
  open,
});

// 生命周期
onMounted(() => {
  // 从本地存储加载自动刷新设�?
  const saved = localStorage.getItem("monitor-auto-refresh");
  if (saved) {
    autoRefresh.value = JSON.parse(saved);
  }
});

onUnmounted(() => {
  stopAutoRefresh();
  // 保存自动刷新设置
  localStorage.setItem("monitor-auto-refresh", JSON.stringify(autoRefresh.value));
});
</script>

<style scoped lang="scss">
.monitor-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.monitor-container {
  .server-info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .metrics-section {
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
          color: var(--el-text-color-primary);

          &.cpu {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.memory {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.disk {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.load {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .metric-info {
          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1;
          }

          .metric-label {
            font-size: 12px;
             color: var(--el-text-color-primary);
            margin-top: 4px;
          }
        }
      }
    }
  }

  .charts-section {
    margin-bottom: 20px;

    .chart-container {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;

      .chart-placeholder {
        text-align: center;
         color: var(--el-text-color-primary);
        background: var(--el-bg-color-overlay);
        border-radius: 8px;
        padding: 40px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        p {
          margin: 8px 0;
        }
      }
    }
  }

  .actions-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
  }
}
</style>
