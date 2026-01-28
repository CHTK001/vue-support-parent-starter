<template>
  <div class="scifi-dashboard system-container modern-bg">
    <!-- 科幻风格头部 -->
    <TechHeader 
      variant="A1" 
      :title="headerTitle"
      :sub-title="headerSubTitle"
      :glow-opacity="0.8"
    >
      <template #left>
        <div class="header-left">
          <div class="status-indicator" :class="{ online: isConnected }">
            <span class="pulse"></span>
          </div>
          <span class="status-text">{{ isConnected ? '已连接' : '断开' }}</span>
        </div>
      </template>
      <template #right>
        <div class="header-right">
          <span class="update-time">
            <IconifyIconOnline icon="ri:time-line" />
            {{ formatTime(lastUpdateTime) }}
          </span>
          <TechButton variant="A1" appearance="A" size="small" @click="refreshData">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </TechButton>
          <TechButton variant="A1" appearance="B" size="small" @click="toggleFullscreen">
            <IconifyIconOnline :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
          </TechButton>
        </div>
      </template>
    </TechHeader>

    <!-- 主体内容区域 -->
    <div class="dashboard-body">
      <!-- 左侧面板 -->
      <div class="left-section">
        <!-- CPU 面板 -->
        <TechPanel variant="A1" title="CPU 监控" :height="280" class="metric-panel">
          <div class="metric-content">
            <div class="gauge-wrapper">
              <TechGeometry variant="Hexagon" :width="120" :height="120" :glow-opacity="0.6" />
              <div class="gauge-value">
                <span class="value">{{ (metrics.cpu?.usage || 0).toFixed(1) }}</span>
                <span class="unit">%</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-row">
                <span class="label">核心数</span>
                <span class="value">{{ metrics.cpu?.cores || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">系统负载</span>
                <span class="value">{{ metrics.cpu?.loadAverage?.toFixed(2) || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">进程占用</span>
                <span class="value">{{ (metrics.cpu?.processUsage || 0).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <TechDeco variant="A1" :width="'100%'" :height="20" />
        </TechPanel>

        <!-- 内存面板 -->
        <TechPanel variant="A2" title="内存监控" :height="280" class="metric-panel">
          <div class="metric-content">
            <div class="gauge-wrapper">
              <TechGeometry variant="Hexagon" :width="120" :height="120" :glow-opacity="0.6" decoration-color-alt />
              <div class="gauge-value alt">
                <span class="value">{{ (metrics.memory?.usage || 0).toFixed(1) }}</span>
                <span class="unit">%</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-row">
                <span class="label">已用</span>
                <span class="value">{{ formatBytes(metrics.memory?.used) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">可用</span>
                <span class="value">{{ formatBytes(metrics.memory?.free) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">总量</span>
                <span class="value">{{ formatBytes(metrics.memory?.total) }}</span>
              </div>
            </div>
          </div>
          <TechDeco variant="B1" :width="'100%'" :height="20" />
        </TechPanel>
      </div>

      <!-- 中央面板 -->
      <div class="center-section">
        <!-- 节点状态 -->
        <TechPanel variant="B1" title="节点状态" :height="200" class="status-panel">
          <div class="node-status-content">
            <TechGeometry 
              variant="Hexagon" 
              :width="100" 
              :height="100" 
              :glow-opacity="isConnected ? 1 : 0.3"
              :decoration-color-alt="!isConnected"
            />
            <div class="status-info">
              <div class="status-row">
                <IconifyIconOnline icon="ri:server-line" />
                <span>{{ nodeInfo?.applicationName || '未知节点' }}</span>
              </div>
              <div class="status-row address">
                <IconifyIconOnline icon="ri:global-line" />
                <span>{{ nodeInfo?.ipAddress }}:{{ nodeInfo?.port }}</span>
              </div>
              <div class="status-row">
                <IconifyIconOnline icon="ri:time-line" />
                <span>运行时长: {{ formatUptime(metrics.jvm?.uptime) }}</span>
              </div>
            </div>
          </div>
        </TechPanel>

        <!-- JVM 面板 -->
        <TechPanel variant="B2" title="JVM 监控" :height="360" class="jvm-panel">
          <div class="jvm-content">
            <TechPanelTitle variant="A1" title="堆内存" />
            <div class="memory-bar-wrapper">
              <div class="memory-bar">
                <div class="memory-used" :style="{ width: `${jvmHeapUsage}%` }"></div>
              </div>
              <div class="memory-info">
                <span>{{ formatBytes(metrics.jvm?.heapUsed) }}</span>
                <span>/</span>
                <span>{{ formatBytes(metrics.jvm?.heapMax) }}</span>
              </div>
            </div>

            <TechPanelTitle variant="A2" title="非堆内存" />
            <div class="memory-bar-wrapper">
              <div class="memory-bar alt">
                <div class="memory-used" :style="{ width: `${jvmNonHeapUsage}%` }"></div>
              </div>
              <div class="memory-info">
                <span>{{ formatBytes(metrics.jvm?.nonHeapUsed) }}</span>
                <span>/</span>
                <span>{{ formatBytes(metrics.jvm?.nonHeapMax) }}</span>
              </div>
            </div>

            <div class="jvm-info-grid">
              <div class="info-item">
                <span class="label">JVM 版本</span>
                <span class="value">{{ metrics.jvm?.version || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">启动时间</span>
                <span class="value">{{ formatStartTime(metrics.jvm?.startTime) }}</span>
              </div>
            </div>
          </div>
        </TechPanel>
      </div>

      <!-- 右侧面板 -->
      <div class="right-section">
        <!-- 磁盘面板 -->
        <TechPanel variant="A3" title="磁盘监控" :height="280" class="metric-panel">
          <div class="metric-content">
            <div class="gauge-wrapper">
              <TechGeometry variant="Hexagon" :width="120" :height="120" :glow-opacity="0.6" />
              <div class="gauge-value">
                <span class="value">{{ (metrics.disk?.usage || 0).toFixed(1) }}</span>
                <span class="unit">%</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-row">
                <span class="label">已用</span>
                <span class="value">{{ formatBytes(metrics.disk?.used) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">可用</span>
                <span class="value">{{ formatBytes(metrics.disk?.free) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">总量</span>
                <span class="value">{{ formatBytes(metrics.disk?.total) }}</span>
              </div>
            </div>
          </div>
          <TechDeco variant="B2" :width="'100%'" :height="20" />
        </TechPanel>

        <!-- 网络面板 -->
        <TechPanel variant="B3" title="网络监控" :height="280" class="metric-panel">
          <div class="network-content">
            <div class="network-stats">
              <div class="stat-item upload">
                <IconifyIconOnline icon="ri:upload-cloud-2-line" class="stat-icon" />
                <span class="stat-value">{{ formatBytesPerSec(metrics.network?.sendRate) }}</span>
                <span class="stat-label">上传速率</span>
              </div>
              <div class="stat-item download">
                <IconifyIconOnline icon="ri:download-cloud-2-line" class="stat-icon" />
                <span class="stat-value">{{ formatBytesPerSec(metrics.network?.receiveRate) }}</span>
                <span class="stat-label">下载速率</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-row">
                <span class="label">发送总量</span>
                <span class="value">{{ formatBytes(metrics.network?.bytesSent) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">接收总量</span>
                <span class="value">{{ formatBytes(metrics.network?.bytesReceived) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">TCP 连接</span>
                <span class="value">{{ metrics.network?.tcpConnections || 0 }}</span>
              </div>
            </div>
          </div>
          <TechDeco variant="B3" :width="'100%'" :height="20" />
        </TechPanel>
      </div>
    </div>

    <!-- 底部面板 -->
    <div class="dashboard-footer">
      <!-- 线程信息 -->
      <TechPanel variant="B4" title="线程信息" class="footer-panel">
        <div class="thread-stats">
          <div class="stat-block">
            <span class="stat-number">{{ metrics.thread?.live || 0 }}</span>
            <span class="stat-name">活动线程</span>
          </div>
          <div class="stat-block">
            <span class="stat-number">{{ metrics.thread?.daemon || 0 }}</span>
            <span class="stat-name">守护线程</span>
          </div>
          <div class="stat-block">
            <span class="stat-number">{{ metrics.thread?.peak || 0 }}</span>
            <span class="stat-name">峰值线程</span>
          </div>
          <div class="stat-block">
            <span class="stat-number">{{ metrics.thread?.totalStarted || 0 }}</span>
            <span class="stat-name">总启动数</span>
          </div>
        </div>
      </TechPanel>

      <!-- GC 信息 -->
      <TechPanel variant="B4" title="GC 信息" class="footer-panel" decoration-color-alt>
        <div class="gc-stats">
          <div class="stat-block">
            <span class="stat-number">{{ metrics.gc?.count || 0 }}</span>
            <span class="stat-name">GC 次数</span>
          </div>
          <div class="stat-block">
            <span class="stat-number">{{ formatMillis(metrics.gc?.time) }}</span>
            <span class="stat-name">GC 耗时</span>
          </div>
        </div>
      </TechPanel>

      <!-- 快捷操作 -->
      <TechPanel variant="B4" title="快捷操作" class="footer-panel">
        <div class="action-buttons">
          <TechButton variant="A2" size="small" @click="handleViewLogs">
            <IconifyIconOnline icon="ri:file-text-line" />
            查看日志
          </TechButton>
          <TechButton variant="A2" size="small" @click="handleViewConfig">
            <IconifyIconOnline icon="ri:settings-3-line" />
            配置查看
          </TechButton>
          <TechButton variant="A2" size="small" appearance="B" @click="handleRestart">
            <IconifyIconOnline icon="ri:restart-line" />
            重启节点
          </TechButton>
        </div>
      </TechPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 节点监控科幻大屏
 * 使用 TechUI 科幻风格组件
 * @author CH
 * @since 2025-12-08
 * @version 1.0.0
 */
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import {
  TechButton,
  TechPanel,
  TechHeader,
  TechDeco,
  TechGeometry,
  TechPanelTitle,
} from "@repo/components/TechUI";
import {
  getNodeMetricsForNodeControl,
  type NodeMetricsDTO,
} from "@/api/server/node-control";
import { io, Socket } from "socket.io-client";

// 路由
const route = useRoute();
const router = useRouter();

// Props（组件方式使用）
const props = defineProps<{
  nodeInfo?: {
    applicationName: string;
    ipAddress: string;
    port: number;
  };
}>();

// 节点信息（支持 props 和路由两种方式）
const nodeInfo = computed(() => {
  // 优先使用 props
  if (props.nodeInfo) {
    return props.nodeInfo;
  }
  // 从路由参数获取
  const { nodeAddress, nodeName } = route.query;
  if (nodeAddress && typeof nodeAddress === "string") {
    const [ip, port] = nodeAddress.split(":");
    return {
      applicationName: (nodeName as string) || "未知节点",
      ipAddress: ip,
      port: parseInt(port, 10),
    };
  }
  return null;
});

// Emits
const emit = defineEmits<{
  (e: "view-logs"): void;
  (e: "view-config"): void;
  (e: "restart"): void;
  (e: "close"): void;
}>();

// 状态
const metrics = ref<Partial<NodeMetricsDTO>>({});
const loading = ref(false);
const isConnected = ref(false);
const lastUpdateTime = ref<number>(Date.now());
const isFullscreen = ref(false);

// Socket.IO
let socket: Socket | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 头部标题
 */
const headerTitle = computed(() => {
  return nodeInfo.value?.applicationName || "节点监控大屏";
});

/**
 * 头部副标题
 */
const headerSubTitle = computed(() => {
  if (nodeInfo.value) {
    return `${nodeInfo.value.ipAddress}:${nodeInfo.value.port}`;
  }
  return "SCIFI MONITOR DASHBOARD";
});

/**
 * JVM 堆内存使用率
 */
const jvmHeapUsage = computed(() => {
  const used = metrics.value.jvm?.heapUsed || 0;
  const max = metrics.value.jvm?.heapMax || 1;
  return Math.min((used / max) * 100, 100);
});

/**
 * JVM 非堆内存使用率
 */
const jvmNonHeapUsage = computed(() => {
  const used = metrics.value.jvm?.nonHeapUsed || 0;
  const max = metrics.value.jvm?.nonHeapMax || 1;
  if (max <= 0) return 0;
  return Math.min((used / max) * 100, 100);
});

/**
 * 连接 Socket.IO
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
    console.log("[ScifiDashboard] Socket.IO 已连接");
  });

  socket.on("disconnect", () => {
    isConnected.value = false;
    console.log("[ScifiDashboard] Socket.IO 已断开");
  });

  socket.on("metrics", (data: NodeMetricsDTO) => {
    metrics.value = data;
    lastUpdateTime.value = Date.now();
  });

  socket.on("error", (error: Error) => {
    console.error("[ScifiDashboard] Socket.IO 错误:", error);
  });
};

/**
 * 断开 Socket.IO
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
      isConnected.value = true;
    } else {
      message.warning(response.msg || "暂无监控数据");
    }
  } catch (error) {
    console.error("[ScifiDashboard] 刷新数据失败:", error);
    isConnected.value = false;
  } finally {
    loading.value = false;
  }
};

/**
 * 切换全屏
 */
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
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
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
};

/**
 * 格式化时间
 */
const formatTime = (timestamp?: number): string => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString();
};

/**
 * 格式化启动时间
 */
const formatStartTime = (timestamp?: number): string => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
};

/**
 * 处理查看日志
 */
const handleViewLogs = () => {
  emit("view-logs");
};

/**
 * 处理查看配置
 */
const handleViewConfig = () => {
  emit("view-config");
};

/**
 * 处理重启
 */
const handleRestart = () => {
  emit("restart");
};

// 监听节点信息变化
watch(
  nodeInfo,
  (newInfo) => {
    if (newInfo) {
      disconnectSocket();
      refreshData();
      connectSocket();
    }
  },
  { immediate: true }
);

onMounted(() => {
  // 定时刷新
  refreshTimer = setInterval(() => {
    if (nodeInfo.value && !socket) {
      refreshData();
    }
  }, 10000);

  // 监听全屏变化
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(() => {
  disconnectSocket();
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
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


.scifi-dashboard {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  // 头部区域
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .status-indicator {
      position: relative;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ff4444;

      &.online {
        background: #00ff88;

        .pulse {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 255, 136, 0.3);
          animation: pulse 2s infinite;
        }
      }
    }

    .status-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .update-time {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  // 主体内容
  .dashboard-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 16px;
    padding: 16px;
    overflow: hidden;
  }

  .left-section,
  .right-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .center-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  // 面板通用样式
  .metric-panel,
  .status-panel,
  .jvm-panel {
    :deep(.panel-content) {
      padding: 12px;
    }
  }

  // 指标内容
  .metric-content {
    display: flex;
    gap: 20px;
    align-items: center;
    padding: 10px;

    .gauge-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      .gauge-value {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;

        .value {
          font-size: 28px;
          font-weight: 700;
          color: #00f6ff;
          text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
        }

        .unit {
          font-size: 14px;
          color: rgba(0, 246, 255, 0.7);
        }

        &.alt .value {
          color: #ff6b6b;
          text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }
      }
    }

    .metric-details {
      flex: 1;

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(0, 246, 255, 0.1);

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .value {
          color: #00f6ff;
          font-weight: 500;
          font-size: 13px;
          font-family: "JetBrains Mono", monospace;
        }
      }
    }
  }

  // 节点状态面板
  .node-status-content {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px;

    .status-info {
      flex: 1;

      .status-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;

        .iconify {
          color: #00f6ff;
        }

        &.address {
          font-family: "JetBrains Mono", monospace;
          color: #00f6ff;
        }
      }
    }
  }

  // JVM 面板
  .jvm-content {
    padding: 12px;

    .memory-bar-wrapper {
      margin: 12px 0 20px;

      .memory-bar {
        height: 24px;
        background: rgba(0, 100, 200, 0.2);
        border: 1px solid rgba(0, 246, 255, 0.3);
        border-radius: 4px;
        overflow: hidden;

        .memory-used {
          height: 100%;
          background: linear-gradient(90deg, #00f6ff, #0080ff);
          transition: width 0.5s ease;
        }

        &.alt .memory-used {
          background: linear-gradient(90deg, #ff6b6b, #ff4444);
        }
      }

      .memory-info {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 8px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        font-family: "JetBrains Mono", monospace;
      }
    }

    .jvm-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px;
        background: rgba(0, 100, 200, 0.1);
        border: 1px solid rgba(0, 246, 255, 0.2);
        border-radius: 6px;

        .label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .value {
          font-size: 13px;
          color: #00f6ff;
          font-family: "JetBrains Mono", monospace;
        }
      }
    }
  }

  // 网络面板
  .network-content {
    padding: 10px;

    .network-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;

        .stat-icon {
          font-size: 28px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          font-family: "JetBrains Mono", monospace;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        &.upload {
          .stat-icon,
          .stat-value {
            color: #00ff88;
          }
        }

        &.download {
          .stat-icon,
          .stat-value {
            color: #00f6ff;
          }
        }
      }
    }
  }

  // 底部面板
  .dashboard-footer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 0 16px 16px;

    .footer-panel {
      :deep(.panel-content) {
        padding: 12px;
      }
    }

    .thread-stats,
    .gc-stats {
      display: flex;
      justify-content: space-around;

      .stat-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #00f6ff;
          font-family: "JetBrains Mono", monospace;
          text-shadow: 0 0 10px rgba(0, 246, 255, 0.3);
        }

        .stat-name {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
