<template>
  <div class="server-monitor">
    <!-- 头部信息 -->
    <div class="monitor-header">
      <div class="server-info">
        <h3 class="server-name">{{ server?.name || "未知服务�? }}</h3>
        <div class="server-details">
          <span class="server-address"
            >{{ server?.host }}:{{ server?.port }}</span
          >
          <el-tag
            :type="getOnlineStatusType(server?.onlineStatus)"
            size="small"
          >
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
    <div class="metrics-grid modern-scrollbar" v-loading="loading">
      <!-- CPU使用�?-->
      <div class="metric-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:cpu-line" class="metric-icon" />
          <span class="metric-title">CPU使用�?/span>
        </div>
        <div class="metric-content">
          <div
            class="metric-value"
            :class="{ animating: cpuAnimation.isAnimating.value }"
          >
            {{ cpuAnimation.formattedValue.value }}
          </div>
          <el-progress
            :percentage="cpuAnimation.displayValue.value"
            :color="getProgressColor(cpuAnimation.displayValue.value, 'cpu')"
            :show-text="false"
          />
          <div class="metric-details">
            <span>核心�? {{ metrics?.cpu?.cores || "N/A" }}</span>
            <span>负载: {{ (metrics?.cpu?.load1m || 0).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 内存使用�?-->
      <div class="metric-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:database-line" class="metric-icon" />
          <span class="metric-title">内存使用�?/span>
        </div>
        <div class="metric-content">
          <div
            class="metric-value"
            :class="{ animating: memoryAnimation.isAnimating.value }"
          >
            {{ memoryAnimation.formattedValue.value }}
          </div>
          <el-progress
            :percentage="memoryAnimation.displayValue.value"
            :color="
              getProgressColor(memoryAnimation.displayValue.value, 'memory')
            "
            :show-text="false"
          />
          <div class="metric-details">
            <span>已用: {{ formatBytes(metrics?.memory?.used) }}</span>
            <span>总计: {{ formatBytes(metrics?.memory?.total) }}</span>
          </div>
        </div>
      </div>

      <!-- 磁盘使用情况 -->
      <div class="metric-card disk-card">
        <div class="metric-header">
          <IconifyIconOnline icon="ri:hard-drive-line" class="metric-icon" />
          <span class="metric-title"
            >磁盘使用情况
            <span class="partitions-count"
              >{{ diskPartitions.length }} 个分�?/span
            ></span
          >
        </div>

        <!-- 磁盘分区列表 -->
        <div class="disk-partitions">
          <div class="partitions-list-container modern-scrollbar">
            <div class="partitions-list">
              <div
                v-for="(partition, index) in diskPartitions"
                :key="index"
                class="partition-item"
              >
                <div class="partition-header">
                  <div class="partition-info">
                    <IconifyIconOnline
                      icon="ri:folder-line"
                      class="partition-icon"
                    />
                    <span class="partition-name">{{
                      partition.name || partition.mount
                    }}</span>
                    <el-tag size="small" type="info" class="partition-type">
                      {{ partition.type }}
                    </el-tag>
                  </div>
                  <div
                    class="partition-usage"
                    :class="getPartitionUsageClass(partition.usagePercent || 0)"
                  >
                    {{ Math.round(partition.usagePercent || 0) }}%
                  </div>
                </div>
                <div class="partition-details">
                  <span>已用: {{ formatBytes(partition.usedSpace) }}</span>
                  <span>可用: {{ formatBytes(partition.freeSpace) }}</span>
                  <span>总计: {{ formatBytes(partition.totalSpace) }}</span>
                </div>
              </div>
            </div>
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
              <span class="network-value"
                >{{ formatBytes(metrics?.network?.in) }}/s</span
              >
            </div>
            <div class="network-item">
              <span class="network-label">出站:</span>
              <span class="network-value"
                >{{ formatBytes(metrics?.network?.out) }}/s</span
              >
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
        <div class="metric-content modern-scrollbar">
          <div class="info-item">
            <span class="info-label">操作系统:</span>
            <span class="info-value">{{ getOsName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">系统版本:</span>
            <span class="info-value">{{ getOsVersion }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">主机�?</span>
            <span class="info-value">{{ getHostname }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">系统架构:</span>
            <span class="info-value">{{ getSystemArch }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">运行时间:</span>
            <span class="info-value">{{ formatUptime(metrics?.uptime) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">负载平均:</span>
            <span class="info-value">{{ metrics?.loadAverage || "N/A" }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">进程�?</span>
            <span class="info-value">{{ metrics?.processCount || "N/A" }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">CPU核心�?</span>
            <span class="info-value">{{ metrics?.cpu?.cores || "N/A" }}</span>
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
            :percentage="
              Math.min(
                Math.round(((metrics?.temperature || 0) / 100) * 100),
                100
              )
            "
            :color="getProgressColor(metrics?.temperature || 0, 'temperature')"
            :show-text="false"
          />
        </div>
      </div>
    </div>

    <!-- 最后更新时�?-->
    <div class="update-time" v-if="metrics?.collectTime">
      <IconifyIconOnline icon="ri:time-line" class="mr-1" />
      最后更�? {{ formatTime(metrics.collectTime) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { message } from "@repo/utils";
import { type ServerDisplayData } from "@/api/server";
import {
  useMetricsThreshold,
  formatBytes,
  formatNetworkSpeed,
  formatNumber,
  formatUptime,
  formatTime,
  //@ts-ignore
} from "@/composables/useMetricsThreshold";
import {
  usePercentageAnimation,
  useBytesAnimation,
  useIntegerAnimation,
  useNetworkSpeedAnimation,
} from "@/composables/useNumberAnimation";

/**
 * 磁盘分区信息
 */
export interface DiskPartition {
  name: string;
  mount: string;
  type: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  usagePercent: number;
}

/**
 * 服务器指标数据类型（简化版本，与useServerMetricsSocket保持兼容�?
 */
export interface ServerMetricsData {
  serverId: number;
  collectTime: string;
  status: number;
  responseTime: number;
  cpu: {
    usage: number;
    cores: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
    partitions?: DiskPartition[];
  };
  network: {
    in: number;
    out: number;
    totalInBytes?: number;
    totalOutBytes?: number;
    inPacketRate?: number;
    outPacketRate?: number;
  };
  osInfo?: string;
  osName?: string;
  osVersion?: string;
  hostname?: string;
  uptime: number;
  processCount: number;
  loadAverage?: string;
  temperature?: number;
  networkInPackets?: number;
  networkOutPackets?: number;
  extraInfo?: string;
}

// Props
const props = defineProps<{
  server?: ServerDisplayData;
  /** 服务器指标数据，由父组件传入 */
  metricsData?: ServerMetricsData | null;
  /** 是否正在加载指标数据 */
  metricsLoading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  /** 请求刷新指标数据 */
  refreshMetrics: [serverId: string];
}>();

// 状�?
const loading = ref(false);
const updateTimer = ref<NodeJS.Timeout | null>(null);

// 动画实例
const cpuAnimation = usePercentageAnimation(0, { duration: 1000 });
const memoryAnimation = usePercentageAnimation(0, { duration: 1000 });
const diskAnimation = usePercentageAnimation(0, { duration: 1000 });
const networkInAnimation = useNetworkSpeedAnimation(0, { duration: 800 });
const networkOutAnimation = useNetworkSpeedAnimation(0, { duration: 800 });
const uptimeAnimation = useIntegerAnimation(0, { duration: 1200 });
const processCountAnimation = useIntegerAnimation(0, { duration: 800 });
const temperatureAnimation = useIntegerAnimation(0, { duration: 1000 });

// 指标数据（从props获取�?
const metrics = computed(() => props.metricsData);

// 计算属�?
const serverId = computed(() => props.server?.id);

// 磁盘分区数据
const diskPartitions = computed(() => {
  return props.metricsData?.disk?.partitions || [];
});

// 监听指标数据变化
watch(
  () => props.metricsData,
  (newMetrics, oldMetrics) => {
    if (newMetrics) {
      console.log("ServerMonitor接收到指标数�?", newMetrics);

      // 更新动画�?- 如果新值为空且旧值存在，则保持旧�?
      updateAnimationValueSafely(
        cpuAnimation,
        newMetrics.cpu?.usage,
        oldMetrics?.cpu?.usage
      );
      updateAnimationValueSafely(
        memoryAnimation,
        newMetrics.memory?.usage,
        oldMetrics?.memory?.usage
      );
      updateAnimationValueSafely(
        diskAnimation,
        newMetrics.disk?.usage,
        oldMetrics?.disk?.usage
      );
      updateAnimationValueSafely(
        networkInAnimation,
        newMetrics.network?.in,
        oldMetrics?.network?.in
      );
      updateAnimationValueSafely(
        networkOutAnimation,
        newMetrics.network?.out,
        oldMetrics?.network?.out
      );
      updateAnimationValueSafely(
        uptimeAnimation,
        newMetrics.uptime,
        oldMetrics?.uptime
      );
      updateAnimationValueSafely(
        processCountAnimation,
        newMetrics.processCount,
        oldMetrics?.processCount
      );

      // 温度数据特殊处理
      if (
        newMetrics.temperature !== undefined &&
        newMetrics.temperature !== null
      ) {
        temperatureAnimation.setValue(newMetrics.temperature);
      } else if (
        oldMetrics?.temperature !== undefined &&
        oldMetrics?.temperature !== null
      ) {
        // 如果新数据没有温度但旧数据有，保持旧�?
        temperatureAnimation.setValue(oldMetrics.temperature);
      }
    }
  },
  { deep: true }
);

// 方法
const getOnlineStatusType = (
  status: number
): "success" | "warning" | "info" | "primary" | "danger" => {
  const statusMap: Record<
    number,
    "success" | "warning" | "info" | "primary" | "danger"
  > = {
    1: "success",
    0: "danger",
    2: "warning",
  };
  return statusMap[status] || "info";
};

const getOnlineStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: "在线",
    0: "离线",
    2: "异常",
  };
  return statusMap[status] || "未知";
};

/**
 * 阈值配�?
 */
const thresholds = {
  cpu: { normal: 50, warning: 80, critical: 90 },
  memory: { normal: 60, warning: 80, critical: 90 },
  disk: { normal: 70, warning: 85, critical: 95 },
  temperature: { normal: 50, warning: 70, critical: 85 },
  network: { normal: 60, warning: 80, critical: 90 },
};

/**
 * 根据指标类型和值获取颜�?
 */
const getMetricColor = (metricType: string, value: number) => {
  const threshold = thresholds[metricType as keyof typeof thresholds];
  if (!threshold) return "#67c23a";

  if (value >= threshold.critical) return "#f56c6c"; // 红色
  if (value >= threshold.warning) return "#e6a23c"; // 黄色
  return "#67c23a"; // 绿色
};

/**
 * 获取进度条颜色（支持渐变�?
 */
const getProgressColor = (percentage: number, metricType: string = "cpu") => {
  const threshold = thresholds[metricType as keyof typeof thresholds];
  if (!threshold) return "#67c23a";

  // 返回渐变色配�?
  return [
    { color: "#67c23a", percentage: threshold.normal },
    { color: "#e6a23c", percentage: threshold.warning },
    { color: "#f56c6c", percentage: 100 },
  ];
};

/**
 * 获取温度颜色
 */
const getTempColor = (temp: number) => {
  return getMetricColor("temperature", temp);
};

/**
 * 安全更新动画�?- 如果新值为空且旧值存在，则保持旧�?
 */
const updateAnimationValueSafely = (
  animation: any,
  newValue: any,
  oldValue: any
) => {
  // 如果新值有效，使用新�?
  if (newValue !== undefined && newValue !== null && !isNaN(Number(newValue))) {
    animation.setValue(Number(newValue));
  }
  // 如果新值无效但旧值有效，保持旧�?
  else if (
    oldValue !== undefined &&
    oldValue !== null &&
    !isNaN(Number(oldValue))
  ) {
    animation.setValue(Number(oldValue));
  }
  // 如果都无效，设为0
  else {
    animation.setValue(0);
  }
};

const formatBytes = (bytes: number | undefined) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

const formatNumber = (num: number | undefined) => {
  if (!num) return "0";
  return num.toLocaleString();
};

/**
 * 智能获取操作系统名称
 */
const getOsName = computed(() => {
  // 优先使用 osName 字段
  if (metrics.value?.osName) {
    return metrics.value.osName;
  }

  // �?osInfo 中解�?
  if (metrics.value?.osInfo) {
    const osInfo = metrics.value.osInfo;
    // 匹配常见的操作系统名�?
    if (osInfo.includes("Ubuntu")) return "Ubuntu";
    if (osInfo.includes("CentOS")) return "CentOS";
    if (osInfo.includes("Red Hat")) return "Red Hat";
    if (osInfo.includes("Debian")) return "Debian";
    if (osInfo.includes("Windows")) return "Windows";
    if (osInfo.includes("macOS") || osInfo.includes("Darwin")) return "macOS";
    if (osInfo.includes("Linux")) return "Linux";

    // 如果包含 "OS:" 标记，提取其后的内容
    const osMatch = osInfo.match(/OS:\s*([^;]+)/);
    if (osMatch) {
      return osMatch[1].trim();
    }

    // 返回第一部分作为操作系统名称
    return osInfo.split(" ")[0] || osInfo;
  }

  return "N/A";
});

/**
 * 智能获取操作系统版本
 */
const getOsVersion = computed(() => {
  // 优先使用 osVersion 字段
  if (metrics.value?.osVersion) {
    return metrics.value.osVersion;
  }

  // �?osInfo 中解析版本信�?
  if (metrics.value?.osInfo) {
    const osInfo = metrics.value.osInfo;

    // 匹配版本号模�?
    const versionMatch = osInfo.match(/(\d+\.\d+(?:\.\d+)?)/);
    if (versionMatch) {
      return versionMatch[1];
    }

    // 匹配 Ubuntu 版本
    const ubuntuMatch = osInfo.match(/Ubuntu\s+(\d+\.\d+)/);
    if (ubuntuMatch) {
      return ubuntuMatch[1];
    }

    // 匹配 CentOS 版本
    const centosMatch = osInfo.match(/CentOS\s+(\d+)/);
    if (centosMatch) {
      return centosMatch[1];
    }
  }

  return "N/A";
});

/**
 * 智能获取主机�?
 */
const getHostname = computed(() => {
  // 优先使用 hostname 字段
  if (metrics.value?.hostname) {
    return metrics.value.hostname;
  }

  // �?extraInfo 中解�?
  if (metrics.value?.extraInfo) {
    const hostnameMatch = metrics.value.extraInfo.match(/hostname:([^,]+)/);
    if (hostnameMatch) {
      return hostnameMatch[1].trim();
    }
  }

  return "N/A";
});

/**
 * 智能获取系统架构
 */
const getSystemArch = computed(() => {
  if (metrics.value?.osInfo) {
    const osInfo = metrics.value.osInfo;

    // 匹配架构信息
    if (osInfo.includes("x86_64") || osInfo.includes("amd64")) return "x86_64";
    if (osInfo.includes("i386") || osInfo.includes("i686")) return "i386";
    if (osInfo.includes("aarch64") || osInfo.includes("arm64")) return "ARM64";
    if (osInfo.includes("armv7") || osInfo.includes("armhf")) return "ARM";

    // 匹配 "Arch:" 标记
    const archMatch = osInfo.match(/Arch:\s*([^;]+)/);
    if (archMatch) {
      return archMatch[1].trim();
    }
  }

  return "N/A";
});

/**
 * 获取磁盘分区使用率颜色类�?
 */
const getPartitionUsageClass = (percentage: number) => {
  if (percentage >= 90) return "usage-critical";
  if (percentage >= 75) return "usage-warning";
  return "usage-normal";
};

const formatUptime = (uptime: number | undefined) => {
  if (!uptime) return "N/A";
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${days}�?${hours}小时 ${minutes}分钟`;
};

const formatTime = (time: string | Date) => {
  return new Date(time).toLocaleString();
};

const refreshMetrics = async () => {
  if (!serverId.value) return;

  try {
    loading.value = true;

    // 通知父组件刷新指标数�?
    emit("refreshMetrics", serverId.value);

    message.success("指标数据刷新请求已发�?);
  } catch (error) {
    message.error("刷新失败");
    console.error("刷新指标数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  updateTimer.value = setInterval(() => {
    if (serverId.value) {
      // 通知父组件自动刷新指标数�?
      emit("refreshMetrics", serverId.value);
    }
  }, 30000); // 30秒自动刷�?
};

const stopAutoRefresh = () => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value);
    updateTimer.value = null;
  }
};

// 生命周期
onMounted(() => {
  // 启动自动刷新
  startAutoRefresh();

  // 如果有服务器ID，立即请求一次数�?
  if (serverId.value) {
    emit("refreshMetrics", serverId.value);
  }
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
  overflow: visible;
  background: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-extra-light) 100%
  );
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
  background: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  .server-info {
    .server-name {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px 0;
      background: linear-gradient(
        135deg,
        var(--el-text-color-primary) 0%,
        var(--el-color-primary) 100%
      );
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
        font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
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
          background: linear-gradient(
            135deg,
            var(--el-color-success-light-8) 0%,
            var(--el-color-success-light-9) 100%
          );
          color: var(--el-color-success);
        }

        &.el-tag--danger {
          background: linear-gradient(
            135deg,
            var(--el-color-danger-light-8) 0%,
            var(--el-color-danger-light-9) 100%
          );
          color: var(--el-color-danger);
        }

        &.el-tag--info {
          background: linear-gradient(
            135deg,
            var(--el-color-info-light-8) 0%,
            var(--el-color-info-light-9) 100%
          );
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
  min-height: 400px;

  /* 统一的细滚动条样�?*/
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(140, 140, 140, 0.3);
    border-radius: 2px;
    box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);

    &:hover {
      background: rgba(140, 140, 140, 0.5);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(140, 140, 140, 0);
    border-radius: 2px;
    box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
  }
}

.metric-card {
  background: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  padding: 20px;
  min-height: 200px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;

  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
  &:nth-child(4) {
    animation-delay: 0.4s;
  }
  &:nth-child(5) {
    animation-delay: 0.5s;
  }
  &:nth-child(6) {
    animation-delay: 0.6s;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
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

  .metric-content {
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(
        135deg,
        var(--el-text-color-primary) 0%,
        var(--el-color-primary) 100%
      );
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
        background: linear-gradient(
          90deg,
          var(--el-color-primary-light-3) 0%,
          var(--el-color-primary) 100%
        );
      }
    }
  }

  &.system-info {
    /* 覆盖父级的overflow: hidden，允许显示滚动条 */
    overflow: visible;

    .metric-content {
      height: 500px;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px;

      /* 统一的细滚动条样�?*/
      &::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        border-radius: 2px;
        background-color: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(140, 140, 140, 0.3);
        border-radius: 2px;
        box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);

        &:hover {
          background: rgba(140, 140, 140, 0.5);
        }
      }

      &::-webkit-scrollbar-track {
        background-color: rgba(140, 140, 140, 0);
        border-radius: 2px;
        box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
      }

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

.update-time {
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-extra-light) 0%,
    var(--el-fill-color-light) 100%
  );
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

/* 响应式设�?*/
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

/* 加载状态优�?*/
.metrics-grid[v-loading] {
  .metric-card {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
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

/* 焦点状态优�?*/
.metric-card:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* 数值动画效�?*/
.metric-value {
  transition: all 0.3s ease;

  &.animating {
    color: var(--el-color-primary);
    transform: scale(1.05);
  }
}

/* 进度条动�?*/
.el-progress {
  :deep(.el-progress-bar__outer) {
    transition: all 0.3s ease;
  }

  :deep(.el-progress-bar__inner) {
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* 磁盘卡片样式 */
.disk-card {
  /* 覆盖父级的overflow: hidden，允许显示滚动条 */
  overflow: visible;

  .metric-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .toggle-btn {
      padding: 4px;
      color: var(--el-text-color-regular);
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }
    }
  }
}

/* 磁盘分区样式 */
.disk-partitions {
  margin-top: 8px;

  .partitions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .partitions-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .partitions-count {
      font-size: 12px;
      color: var(--el-text-color-regular);
      background-color: var(--el-fill-color-light);
      padding: 2px 8px;
      border-radius: 10px;
    }
  }

  .partitions-list-container {
    height: 400px;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;

    /* 统一的细滚动条样�?*/
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(140, 140, 140, 0.3);
      border-radius: 2px;
      box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);

      &:hover {
        background: rgba(140, 140, 140, 0.5);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: rgba(140, 140, 140, 0);
      border-radius: 2px;
      box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
    }
  }

  .partitions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .partition-item {
    padding: 12px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-7);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .partition-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .partition-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .partition-icon {
          color: var(--el-color-primary);
          font-size: 14px;
        }

        .partition-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .partition-type {
          font-size: 11px;
        }
      }

      .partition-usage {
        font-size: 13px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;

        &.usage-normal {
          color: var(--el-color-success);
          background-color: var(--el-color-success-light-9);
        }

        &.usage-warning {
          color: var(--el-color-warning);
          background-color: var(--el-color-warning-light-9);
        }

        &.usage-critical {
          color: var(--el-color-danger);
          background-color: var(--el-color-danger-light-9);
        }
      }
    }

    .partition-details {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--el-text-color-regular);

      span {
        flex: 1;
        text-align: center;

        &:not(:last-child) {
          border-right: 1px solid var(--el-border-color-lighter);
        }
      }
    }
  }
}

/* 数值变化时的微妙高亮效�?*/
@keyframes valueChange {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(64, 158, 255, 0.1);
  }
  100% {
    background-color: transparent;
  }
}

.metric-value.animating {
  animation: valueChange 0.6s ease-in-out;
}
</style>
