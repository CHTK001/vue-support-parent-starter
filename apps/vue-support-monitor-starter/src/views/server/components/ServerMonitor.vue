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
  padding: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  .server-info {
    .server-name {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px 0;
      background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--el-color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .server-details {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .server-address {
        font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        padding: 6px 12px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
      }

      .el-tag {
        border-radius: 12px;
        font-weight: 500;
        border: none;

        &.el-tag--success {
          background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
          color: var(--el-color-success);
        }

        &.el-tag--danger {
          background: linear-gradient(135deg, var(--el-color-danger-light-8) 0%, var(--el-color-danger-light-9) 100%);
          color: var(--el-color-danger);
        }

        &.el-tag--info {
          background: linear-gradient(135deg, var(--el-color-info-light-8) 0%, var(--el-color-info-light-9) 100%);
          color: var(--el-color-info);
        }
      }
    }
  }

  .monitor-actions {
    display: flex;
    gap: 12px;

    .el-button {
      border-radius: 10px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.metrics-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding: 4px;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-extra-light);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-dark);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-primary-light-5);
    }
  }
}

.metric-card {
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }
  &:nth-child(6) { animation-delay: 0.6s; }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-4px);

    &::before {
      opacity: 1;
    }
  }

  .metric-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .metric-icon {
      font-size: 22px;
      color: var(--el-color-primary);
      margin-right: 12px;
      padding: 8px;
      background: var(--el-color-primary-light-9);
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .metric-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  &:hover .metric-header .metric-icon {
    background: var(--el-color-primary-light-8);
    transform: scale(1.1);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

  .metric-content {
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--el-color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .metric-details {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
      font-size: 13px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }

    .network-stats {
      margin-bottom: 12px;

      .network-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px 12px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          background: var(--el-fill-color-light);
        }

        .network-label {
          color: var(--el-text-color-secondary);
          font-weight: 500;
          font-size: 13px;
        }

        .network-value {
          font-weight: 600;
          color: var(--el-text-color-primary);
          font-size: 13px;
        }
      }
    }

    .el-progress {
      margin: 12px 0;

      :deep(.el-progress-bar__outer) {
        border-radius: 8px;
        background-color: var(--el-fill-color-light);
        height: 8px;
      }

      :deep(.el-progress-bar__inner) {
        border-radius: 8px;
        background: linear-gradient(90deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
      }
    }
  }

  &.system-info {
    .metric-content {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 10px 12px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;

        &:hover {
          background: var(--el-fill-color-light);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }

        .info-value {
          font-weight: 600;
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
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--el-fill-color-extra-light) 0%, var(--el-fill-color-light) 100%);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;

  .iconify {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .metric-card {
    padding: 16px;

    .metric-header {
      margin-bottom: 12px;

      .metric-icon {
        font-size: 20px;
        padding: 6px;
      }

      .metric-title {
        font-size: 15px;
      }
    }

    .metric-content .metric-value {
      font-size: 24px;
    }
  }
}

@media (max-width: 992px) {
  .server-monitor {
    padding: 20px;
  }

  .monitor-header {
    padding: 16px;
    margin-bottom: 20px;

    .server-info .server-name {
      font-size: 20px;
    }
  }
}

@media (max-width: 768px) {
  .server-monitor {
    padding: 16px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .monitor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;

    .server-info {
      .server-name {
        font-size: 18px;
        margin-bottom: 8px;
      }

      .server-details {
        gap: 12px;

        .server-address {
          font-size: 13px;
          padding: 4px 8px;
        }
      }
    }

    .monitor-actions {
      justify-content: flex-end;
      gap: 8px;

      .el-button {
        padding: 8px 16px;
        font-size: 13px;
      }
    }
  }

  .metric-card {
    padding: 16px;
    border-radius: 12px;

    .metric-header {
      .metric-icon {
        font-size: 18px;
        padding: 6px;
      }

      .metric-title {
        font-size: 14px;
      }
    }

    .metric-content {
      .metric-value {
        font-size: 22px;
      }

      .network-stats .network-item,
      &.system-info .info-item {
        padding: 8px 10px;
        font-size: 13px;
      }
    }
  }
}

@media (max-width: 480px) {
  .server-monitor {
    padding: 12px;
  }

  .monitor-header {
    padding: 12px;
    border-radius: 12px;

    .server-info .server-name {
      font-size: 16px;
    }

    .monitor-actions {
      .el-button {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
  }

  .metric-card {
    padding: 12px;

    .metric-content .metric-value {
      font-size: 20px;
    }
  }

  .update-time {
    padding: 12px 16px;
    font-size: 12px;
  }
}

/* 加载状态优化 */
.metrics-grid[v-loading] {
  .metric-card {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 滚动优化 */
.metrics-grid {
  scroll-behavior: smooth;
}

/* 焦点状态优化 */
.metric-card:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
</style>
