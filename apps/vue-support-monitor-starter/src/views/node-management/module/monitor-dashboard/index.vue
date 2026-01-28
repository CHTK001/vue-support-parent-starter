<template>
  <div class="monitor-dashboard system-container modern-bg">
    <!-- 顶部信息栏 -->
    <div class="dashboard-header">
      <div class="node-info">
        <IconifyIconOnline icon="ri:server-line" class="node-icon" />
        <div class="info-text">
          <h2>{{ nodeInfo?.applicationName || "未知节点" }}</h2>
          <span class="node-address">
            {{ nodeInfo?.ipAddress }}:{{ nodeInfo?.port }}
          </span>
        </div>
        <el-tag :type="isConnected ? 'success' : 'danger'" effect="dark">
          {{ isConnected ? "已连接" : "断开连接" }}
        </el-tag>
      </div>
      <div class="header-actions">
        <span class="last-update">
          <IconifyIconOnline icon="ri:time-line" />
          更新时间: {{ formatTime(lastUpdateTime) }}
        </span>
        <el-button @click="refreshData" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-cards">
      <div class="metric-card cpu">
        <div class="card-header">
          <IconifyIconOnline icon="ri:cpu-line" />
          <span>CPU</span>
        </div>
        <div class="card-content">
          <div class="progress-ring">
            <el-progress
              type="circle"
              :percentage="metrics.cpu?.usage || 0"
              :stroke-width="12"
              :color="getProgressColor(metrics.cpu?.usage || 0)"
            >
              <template #default>
                <span class="percentage-text">
                  {{ (metrics.cpu?.usage || 0).toFixed(1) }}%
                </span>
              </template>
            </el-progress>
          </div>
          <div class="card-details">
            <div class="detail-item">
              <span class="label">核心数</span>
              <span class="value">{{ metrics.cpu?.cores || "-" }}</span>
            </div>
            <div class="detail-item">
              <span class="label">系统负载</span>
              <span class="value">
                {{ metrics.cpu?.loadAverage?.toFixed(2) || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="metric-card memory">
        <div class="card-header">
          <IconifyIconOnline icon="ri:ram-line" />
          <span>内存</span>
        </div>
        <div class="card-content">
          <div class="progress-ring">
            <el-progress
              type="circle"
              :percentage="metrics.memory?.usage || 0"
              :stroke-width="12"
              :color="getProgressColor(metrics.memory?.usage || 0)"
            >
              <template #default>
                <span class="percentage-text">
                  {{ (metrics.memory?.usage || 0).toFixed(1) }}%
                </span>
              </template>
            </el-progress>
          </div>
          <div class="card-details">
            <div class="detail-item">
              <span class="label">已用</span>
              <span class="value">{{ formatBytes(metrics.memory?.used) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">总量</span>
              <span class="value">{{
                formatBytes(metrics.memory?.total)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="metric-card disk">
        <div class="card-header">
          <IconifyIconOnline icon="ri:hard-drive-2-line" />
          <span>磁盘</span>
        </div>
        <div class="card-content">
          <div class="progress-ring">
            <el-progress
              type="circle"
              :percentage="metrics.disk?.usage || 0"
              :stroke-width="12"
              :color="getProgressColor(metrics.disk?.usage || 0)"
            >
              <template #default>
                <span class="percentage-text">
                  {{ (metrics.disk?.usage || 0).toFixed(1) }}%
                </span>
              </template>
            </el-progress>
          </div>
          <div class="card-details">
            <div class="detail-item">
              <span class="label">已用</span>
              <span class="value">{{ formatBytes(metrics.disk?.used) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">总量</span>
              <span class="value">{{ formatBytes(metrics.disk?.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="metric-card network">
        <div class="card-header">
          <IconifyIconOnline icon="ri:wifi-line" />
          <span>网络</span>
        </div>
        <div class="card-content">
          <div class="network-stats">
            <div class="stat-item upload">
              <IconifyIconOnline icon="ri:upload-2-line" />
              <span class="stat-value">
                {{ formatBytesPerSec(metrics.network?.sendRate) }}
              </span>
              <span class="stat-label">上传</span>
            </div>
            <div class="stat-item download">
              <IconifyIconOnline icon="ri:download-2-line" />
              <span class="stat-value">
                {{ formatBytesPerSec(metrics.network?.receiveRate) }}
              </span>
              <span class="stat-label">下载</span>
            </div>
          </div>
          <div class="card-details">
            <div class="detail-item">
              <span class="label">TCP连接</span>
              <span class="value">{{
                metrics.network?.tcpConnections || 0
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- JVM指标 -->
    <div class="jvm-section">
      <h3 class="section-title">
        <IconifyIconOnline icon="ri:code-box-line" />
        JVM 信息
      </h3>
      <div class="jvm-cards">
        <el-card shadow="never" class="jvm-card">
          <template #header>堆内存</template>
          <div class="memory-bar">
            <el-progress
              :percentage="jvmHeapUsage"
              :stroke-width="20"
              :color="getProgressColor(jvmHeapUsage)"
            />
            <div class="memory-info">
              <span>{{ formatBytes(metrics.jvm?.heapUsed) }}</span>
              <span>/</span>
              <span>{{ formatBytes(metrics.jvm?.heapMax) }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="jvm-card">
          <template #header>非堆内存</template>
          <div class="memory-bar">
            <el-progress
              :percentage="jvmNonHeapUsage"
              :stroke-width="20"
              :color="getProgressColor(jvmNonHeapUsage)"
            />
            <div class="memory-info">
              <span>{{ formatBytes(metrics.jvm?.nonHeapUsed) }}</span>
              <span>/</span>
              <span>{{ formatBytes(metrics.jvm?.nonHeapMax) }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="jvm-card">
          <template #header>运行信息</template>
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="JVM版本">
              {{ metrics.jvm?.version || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">
              {{ formatUptime(metrics.jvm?.uptime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </div>

    <!-- 线程和GC信息 -->
    <div class="thread-gc-section">
      <div class="thread-section">
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:stack-line" />
          线程信息
        </h3>
        <el-card shadow="never">
          <div class="thread-stats">
            <div class="thread-stat">
              <span class="stat-value">{{ metrics.thread?.live || 0 }}</span>
              <span class="stat-label">活动线程</span>
            </div>
            <div class="thread-stat">
              <span class="stat-value">{{ metrics.thread?.daemon || 0 }}</span>
              <span class="stat-label">守护线程</span>
            </div>
            <div class="thread-stat">
              <span class="stat-value">{{ metrics.thread?.peak || 0 }}</span>
              <span class="stat-label">峰值线程</span>
            </div>
          </div>
        </el-card>
      </div>

      <div class="gc-section">
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:delete-bin-6-line" />
          GC 信息
        </h3>
        <el-card shadow="never">
          <div class="gc-stats">
            <div class="gc-stat">
              <span class="stat-value">{{ metrics.gc?.count || 0 }}</span>
              <span class="stat-label">GC次数</span>
            </div>
            <div class="gc-stat">
              <span class="stat-value">{{
                formatMillis(metrics.gc?.time)
              }}</span>
              <span class="stat-label">GC耗时</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/utils";
import {
  getNodeMetricsForNodeControl,
  type NodeMetricsDTO,
} from "@/api/server/node-control";
import { io, Socket } from "socket.io-client";

// 路由参数
const route = useRoute();

// 节点信息
const nodeInfo = ref<{
  applicationName: string;
  ipAddress: string;
  port: number;
} | null>(null);

// 指标数据
const metrics = ref<Partial<NodeMetricsDTO>>({});
const loading = ref(false);
const isConnected = ref(false);
const lastUpdateTime = ref<number>(0);

// Socket.IO连接
let socket: Socket | null = null;

/**
 * JVM堆内存使用率
 */
const jvmHeapUsage = computed(() => {
  const used = metrics.value.jvm?.heapUsed || 0;
  const max = metrics.value.jvm?.heapMax || 1;
  return Math.min((used / max) * 100, 100);
});

/**
 * JVM非堆内存使用率
 */
const jvmNonHeapUsage = computed(() => {
  const used = metrics.value.jvm?.nonHeapUsed || 0;
  const max = metrics.value.jvm?.nonHeapMax || 1;
  if (max <= 0) return 0;
  return Math.min((used / max) * 100, 100);
});

/**
 * 初始化节点信息
 */
const initNodeInfo = () => {
  const { nodeId } = route.params;
  const { nodeName, nodeAddress } = route.query;

  if (nodeAddress && typeof nodeAddress === "string") {
    const [ip, port] = nodeAddress.split(":");
    nodeInfo.value = {
      applicationName: (nodeName as string) || "未知节点",
      ipAddress: ip,
      port: parseInt(port, 10),
    };
  }
};

/**
 * 连接Socket.IO
 */
const connectSocket = () => {
  if (!nodeInfo.value) return;

  const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:19380";

  socket = io(wsUrl, {
    transports: ["websocket"],
    query: {
      nodeId: `${nodeInfo.value.ipAddress}:${nodeInfo.value.port}`,
    },
  });

  socket.on("connect", () => {
    isConnected.value = true;
    console.log("Socket.IO 已连接");
  });

  socket.on("disconnect", () => {
    isConnected.value = false;
    console.log("Socket.IO 已断开");
  });

  socket.on("metrics", (data: NodeMetricsDTO) => {
    metrics.value = data;
    lastUpdateTime.value = Date.now();
  });

  socket.on("error", (error: Error) => {
    console.error("Socket.IO 错误:", error);
  });
};

/**
 * 断开Socket.IO
 */
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * 刷新数据
 */
const refreshData = async () => {
  if (!nodeInfo.value) return;

  loading.value = true;
  try {
    const response = await getNodeMetricsForNodeControl(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port
    );
    if (response.success && response.data) {
      metrics.value = response.data;
      lastUpdateTime.value = Date.now();
    } else {
      message.warning(response.msg || "暂无监控数据");
    }
  } catch (error) {
    console.error("刷新数据失败:", error);
    message.error("刷新数据失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 获取进度条颜色
 */
const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return "#f56c6c";
  if (percentage >= 70) return "#e6a23c";
  return "#67c23a";
};

/**
 * 格式化字节
 */
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化字节/秒
 */
const formatBytesPerSec = (bytes?: number): string => {
  return formatBytes(bytes) + "/s";
};

/**
 * 格式化毫秒
 */
const formatMillis = (ms?: number): string => {
  if (!ms) return "0ms";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

/**
 * 格式化运行时长
 */
const formatUptime = (ms?: number): string => {
  if (!ms) return "-";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
  return `${seconds}秒`;
};

/**
 * 格式化时间
 */
const formatTime = (timestamp?: number): string => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString();
};

onMounted(() => {
  initNodeInfo();
  refreshData();
  connectSocket();
});

onUnmounted(() => {
  disconnectSocket();
});
</script>

<style lang="scss" scoped>

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.monitor-dashboard {
  padding: 24px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .node-info {
      display: flex;
      align-items: center;
      gap: 16px;

      .node-icon {
        font-size: 40px;
        color: var(--el-color-primary);
      }

      .info-text {
        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .node-address {
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;

      .last-update {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }

  .metrics-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 24px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .metric-card {
      background: var(--el-bg-color);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;

        .progress-ring {
          margin-bottom: 16px;

          .percentage-text {
            font-size: 18px;
            font-weight: 600;
          }
        }

        .card-details {
          width: 100%;

          .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-top: 1px solid var(--el-border-color-lighter);

            .label {
              color: var(--el-text-color-secondary);
            }

            .value {
              font-weight: 500;
            }
          }
        }

        .network-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;

            &.upload .iconify {
              color: var(--el-color-success);
            }

            &.download .iconify {
              color: var(--el-color-primary);
            }

            .stat-value {
              font-size: 16px;
              font-weight: 600;
            }

            .stat-label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }
        }
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .jvm-section {
    margin-bottom: 24px;

    .jvm-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }

      .jvm-card {
        .memory-bar {
          .memory-info {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 8px;
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .thread-gc-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .thread-stats,
    .gc-stats {
      display: flex;
      justify-content: space-around;
      padding: 20px 0;

      .thread-stat,
      .gc-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--el-color-primary);
        }

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}
</style>
