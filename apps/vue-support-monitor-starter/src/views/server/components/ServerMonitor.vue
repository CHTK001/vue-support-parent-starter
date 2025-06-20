<template>
  <div class="server-monitor">
    <!-- 头部信息 -->
    <div class="monitor-header">
      <div class="server-info">
        <h3 class="server-name">{{ server?.name || '未知服务器' }}</h3>
        <div class="server-details">
          <span class="server-address">{{ server?.host }}:{{ server?.port }}</span>
          <el-tag :type="getOnlineStatusType(server?.onlineStatus)" size="small">
            {{ getOnlineStatusText(server?.onlineStatus) }}
          </el-tag>
          <el-tag type="info" size="small">{{ server?.protocol }}</el-tag>
        </div>
      </div>
      <div class="monitor-actions">
        <el-button size="small" @click="refreshMetrics">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button size="small" @click="$emit('close')">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          关闭
        </el-button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div class="metrics-grid" v-loading="loading">
      <!-- CPU使用率 -->
      <div class="metric-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:cpu-line" class="metric-icon" />
          <span class="metric-title">CPU使用率</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ Math.round(metrics?.cpuUsage || 0) }}%
          </div>
          <el-progress 
            :percentage="Math.round(metrics?.cpuUsage || 0)"
            :color="getProgressColor(metrics?.cpuUsage || 0)"
            :show-text="false"
          />
          <div class="metric-details">
            <span>核心数: {{ metrics?.cpuCores || 'N/A' }}</span>
            <span>频率: {{ formatFrequency(metrics?.cpuFrequency) }}</span>
          </div>
        </div>
      </div>

      <!-- 内存使用率 -->
      <div class="metric-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:database-line" class="metric-icon" />
          <span class="metric-title">内存使用率</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ Math.round(metrics?.memoryUsage || 0) }}%
          </div>
          <el-progress 
            :percentage="Math.round(metrics?.memoryUsage || 0)"
            :color="getProgressColor(metrics?.memoryUsage || 0)"
            :show-text="false"
          />
          <div class="metric-details">
            <span>已用: {{ formatBytes(metrics?.usedMemory) }}</span>
            <span>总计: {{ formatBytes(metrics?.totalMemory) }}</span>
          </div>
        </div>
      </div>

      <!-- 磁盘使用率 -->
      <div class="metric-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:hard-drive-line" class="metric-icon" />
          <span class="metric-title">磁盘使用率</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ Math.round(metrics?.diskUsage || 0) }}%
          </div>
          <el-progress 
            :percentage="Math.round(metrics?.diskUsage || 0)"
            :color="getProgressColor(metrics?.diskUsage || 0)"
            :show-text="false"
          />
          <div class="metric-details">
            <span>已用: {{ formatBytes(metrics?.usedDisk) }}</span>
            <span>总计: {{ formatBytes(metrics?.totalDisk) }}</span>
          </div>
        </div>
      </div>

      <!-- 网络流量 -->
      <div class="metric-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:wifi-line" class="metric-icon" />
          <span class="metric-title">网络流量</span>
        </div>
        <div class="metric-content">
          <div class="network-stats">
            <div class="network-item">
              <span class="network-label">入站:</span>
              <span class="network-value">{{ formatBytes(metrics?.networkInBytes) }}/s</span>
            </div>
            <div class="network-item">
              <span class="network-label">出站:</span>
              <span class="network-value">{{ formatBytes(metrics?.networkOutBytes) }}/s</span>
            </div>
          </div>
          <div class="metric-details">
            <span>入包: {{ formatNumber(metrics?.networkInPackets) }}</span>
            <span>出包: {{ formatNumber(metrics?.networkOutPackets) }}</span>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="metric-card system-info">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:information-line" class="metric-icon" />
          <span class="metric-title">系统信息</span>
        </div>
        <div class="metric-content">
          <div class="info-item">
            <span class="info-label">操作系统:</span>
            <span class="info-value">{{ metrics?.osName || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">系统版本:</span>
            <span class="info-value">{{ metrics?.osVersion || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">主机名:</span>
            <span class="info-value">{{ metrics?.hostname || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">运行时间:</span>
            <span class="info-value">{{ formatUptime(metrics?.uptime) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">负载平均:</span>
            <span class="info-value">{{ metrics?.loadAverage || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">进程数:</span>
            <span class="info-value">{{ metrics?.processCount || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- 温度信息 -->
      <div class="metric-card" v-if="metrics?.temperature">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:temp-hot-line" class="metric-icon" />
          <span class="metric-title">温度</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ Math.round(metrics?.temperature || 0) }}°C
          </div>
          <el-progress 
            :percentage="Math.min(Math.round((metrics?.temperature || 0) / 100 * 100), 100)"
            :color="getTempColor(metrics?.temperature || 0)"
            :show-text="false"
          />
        </div>
      </div>
    </div>

    <!-- 最后更新时间 -->
    <div class="update-time" v-if="metrics?.collectTime">
      <IconifyIconOnline icon="ri:time-line" class="mr-1" />
      最后更新: {{ formatTime(metrics.collectTime) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";

// Props
const props = defineProps<{
  server: any;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 状态
const loading = ref(false);
const metrics = ref<any>(null);
const updateTimer = ref<NodeJS.Timeout | null>(null);

// 计算属性
const serverId = computed(() => props.server?.id);

// 方法
const getOnlineStatusType = (status: number) => {
  const statusMap: Record<number, string> = {
    1: "success",
    0: "danger",
    2: "warning"
  };
  return statusMap[status] || "info";
};

const getOnlineStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: "在线",
    0: "离线", 
    2: "异常"
  };
  return statusMap[status] || "未知";
};

const getProgressColor = (percentage: number) => {
  if (percentage < 50) return "#67c23a";
  if (percentage < 80) return "#e6a23c";
  return "#f56c6c";
};

const getTempColor = (temp: number) => {
  if (temp < 50) return "#67c23a";
  if (temp < 70) return "#e6a23c";
  return "#f56c6c";
};

const formatBytes = (bytes: number | undefined) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
};

const formatNumber = (num: number | undefined) => {
  if (!num) return "0";
  return num.toLocaleString();
};

const formatFrequency = (freq: number | undefined) => {
  if (!freq) return "N/A";
  return (freq / 1000000).toFixed(2) + " GHz";
};

const formatUptime = (uptime: number | undefined) => {
  if (!uptime) return "N/A";
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
};

const formatTime = (time: string | Date) => {
  return new Date(time).toLocaleString();
};

const refreshMetrics = async () => {
  if (!serverId.value) return;
  
  try {
    loading.value = true;
    // TODO: 调用API获取最新指标数据
    // const res = await getServerMetrics(serverId.value);
    // metrics.value = res.data;
    message.success("指标数据已刷新");
  } catch (error) {
    message.error("刷新失败");
    console.error("刷新指标数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  updateTimer.value = setInterval(() => {
    refreshMetrics();
  }, 30000); // 30秒自动刷新
};

const stopAutoRefresh = () => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value);
    updateTimer.value = null;
  }
};

// 生命周期
onMounted(() => {
  refreshMetrics();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.server-monitor {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .server-info {
    .server-name {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }

    .server-details {
      display: flex;
      align-items: center;
      gap: 12px;

      .server-address {
        font-family: monospace;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .monitor-actions {
    display: flex;
    gap: 8px;
  }
}

.metrics-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  overflow-y: auto;
}

.metric-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
  }

  .metric-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .metric-icon {
      font-size: 18px;
      color: var(--el-color-primary);
      margin-right: 8px;
    }

    .metric-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .metric-content {
    .metric-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    .metric-details {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .network-stats {
      margin-bottom: 8px;

      .network-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;

        .network-label {
          color: var(--el-text-color-secondary);
        }

        .network-value {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  &.system-info {
    .metric-content {
      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          color: var(--el-text-color-secondary);
        }

        .info-value {
          font-weight: 500;
          color: var(--el-text-color-primary);
          text-align: right;
          max-width: 60%;
          word-break: break-all;
        }
      }
    }
  }
}

.update-time {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .monitor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .monitor-actions {
      justify-content: flex-end;
    }
  }
}
</style>
