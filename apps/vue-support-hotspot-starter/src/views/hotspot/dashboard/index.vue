<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { http } from "@repo/utils";
import { useRouter } from "vue-router";
import { wsService } from "@/utils/websocket";

const router = useRouter();
const loading = ref(false);
const systemInfo = ref<any>({});
const jvmInfo = ref<any>({});
const recentTraces = ref<any[]>([]);
const recentExceptions = ref<any[]>([]);
let unsubscribeTrace: (() => void) | null = null;
let unsubscribeException: (() => void) | null = null;
let unsubscribeJvm: (() => void) | null = null;
let unsubscribeSystem: (() => void) | null = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 获取系统信息
const fetchSystemInfo = async () => {
  try {
    const res = await http.get((window.agentPath || "/agent") + "/api/system");
    systemInfo.value = res || {};
  } catch (error) {
    console.error("获取系统信息失败:", error);
  }
};

// 获取JVM信息
const fetchJvmInfo = async () => {
  try {
    const res = await http.get((window.agentPath || "/agent") + "/api/jvm");
    jvmInfo.value = res || {};
  } catch (error) {
    console.error("获取JVM信息失败:", error);
  }
};

// 格式化字节
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
};

// 计算堆内存使用百分比
const memoryPercent = computed(() => {
  const used = jvmInfo.value?.heapMemoryUsed || 0;
  const max = jvmInfo.value?.heapMemoryMax || 1;
  return Math.round((used / max) * 100);
});

// CPU 使用率
const cpuPercent = computed(() => {
  return systemInfo.value?.processCpuLoad || 0;
});

// 物理内存使用百分比
const physicalMemoryPercent = computed(() => {
  const total = systemInfo.value?.totalPhysicalMemory || 1;
  const used = systemInfo.value?.usedPhysicalMemory || 0;
  return Math.round((used / total) * 100);
});

// 格式化运行时长
const formatUptime = (ms: number) => {
  if (!ms) return "-";
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分`;
  return `${minutes}分钟`;
};

// 处理链路追踪消息
const handleTraceMessage = (message: any) => {
  if (message.event === "AGENT_TRACE") {
    try {
      const traceData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      recentTraces.value.unshift(traceData);
      while (recentTraces.value.length > 5) {
        recentTraces.value.pop();
      }
    } catch (error) {
      console.error("解析链路数据失败:", error);
    }
  }
};

// 处理异常消息
const handleExceptionMessage = (message: any) => {
  if (message.event === "EXCEPTION_UPDATE") {
    try {
      const exData = message.data;
      recentExceptions.value.unshift(exData);
      while (recentExceptions.value.length > 5) {
        recentExceptions.value.pop();
      }
    } catch (error) {
      console.error("解析异常数据失败:", error);
    }
  }
};

// 处理 JVM 信息消息
const handleJvmMessage = (message: any) => {
  if (message.event === "JVM_INFO") {
    try {
      const data = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      jvmInfo.value = data;
    } catch (error) {
      console.error("解析JVM数据失败:", error);
    }
  }
};

// 处理系统信息消息
const handleSystemMessage = (message: any) => {
  if (message.event === "SYSTEM_INFO") {
    try {
      const data = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      systemInfo.value = data;
    } catch (error) {
      console.error("解析系统数据失败:", error);
    }
  }
};

// 快速导航配置
const quickLinks = [
  { title: "链路追踪", icon: "ri:route-line", path: "/hotspot/trace", color: "#409EFF" },
  { title: "日志监控", icon: "ri:file-text-line", path: "/hotspot/log", color: "#67C23A" },
  { title: "SQL监控", icon: "ri:database-2-line", path: "/hotspot/sql", color: "#E6A23C" },
  { title: "线程监控", icon: "ri:cpu-line", path: "/hotspot/thread", color: "#F56C6C" },
  { title: "异常监控", icon: "ri:bug-line", path: "/hotspot/exceptions", color: "#909399" },
  { title: "JVM监控", icon: "ri:stack-line", path: "/hotspot/jvm", color: "#67C23A" },
  { title: "Spring映射", icon: "ri:git-branch-line", path: "/hotspot/springMapping", color: "#409EFF" },
  { title: "热重载", icon: "ri:refresh-line", path: "/hotspot/hotswap", color: "#E6A23C" },
];

// 跳转页面
const navigateTo = (path: string) => {
  router.push(path);
};

// 刷新所有数据
const refreshAll = () => {
  fetchSystemInfo();
  fetchJvmInfo();
};

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("zh-CN");
};

onMounted(() => {
  refreshAll();
  // 连接 WebSocket
  wsService.connect();
  // 订阅消息
  unsubscribeTrace = wsService.subscribe("TRACE", "AGENT_TRACE", handleTraceMessage);
  unsubscribeException = wsService.subscribe("EXCEPTION", "EXCEPTION_UPDATE", handleExceptionMessage);
  unsubscribeJvm = wsService.subscribe("JVM", "JVM_INFO", handleJvmMessage);
  unsubscribeSystem = wsService.subscribe("PERFORMANCE", "SYSTEM_INFO", handleSystemMessage);
});

onUnmounted(() => {
  if (unsubscribeTrace) {
    unsubscribeTrace();
  }
  if (unsubscribeException) {
    unsubscribeException();
  }
  if (unsubscribeJvm) {
    unsubscribeJvm();
  }
  if (unsubscribeSystem) {
    unsubscribeSystem();
  }
});
</script>

<template>
  <div class="page-container">
    <!-- 关键指标卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:stack-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ memoryPercent }}%</div>
              <div class="stat-label">堆内存使用</div>
              <div class="stat-detail">{{ formatBytes(jvmInfo.heapMemoryUsed) }} / {{ formatBytes(jvmInfo.heapMemoryMax) }}</div>
            </div>
          </div>
          <el-progress :percentage="memoryPercent" :stroke-width="6" :show-text="false" 
            :color="memoryPercent > 80 ? '#F56C6C' : memoryPercent > 60 ? '#E6A23C' : '#67C23A'" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper success">
              <IconifyIconOnline icon="ri:cpu-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ cpuPercent }}%</div>
              <div class="stat-label">CPU 使用率</div>
              <div class="stat-detail">核心: {{ systemInfo.availableProcessors || 0 }}</div>
            </div>
          </div>
          <el-progress :percentage="cpuPercent" :stroke-width="6" :show-text="false" 
            :color="cpuPercent > 80 ? '#F56C6C' : cpuPercent > 60 ? '#E6A23C' : '#67C23A'" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:hard-drive-2-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ physicalMemoryPercent }}%</div>
              <div class="stat-label">物理内存</div>
              <div class="stat-detail">{{ formatBytes(systemInfo.usedPhysicalMemory) }} / {{ formatBytes(systemInfo.totalPhysicalMemory) }}</div>
            </div>
          </div>
          <el-progress :percentage="physicalMemoryPercent" :stroke-width="6" :show-text="false" 
            :color="physicalMemoryPercent > 80 ? '#F56C6C' : physicalMemoryPercent > 60 ? '#E6A23C' : '#409EFF'" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper danger">
              <IconifyIconOnline icon="ri:time-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatUptime(systemInfo.uptime) }}</div>
              <div class="stat-label">运行时长</div>
              <div class="stat-detail">PID: {{ systemInfo.pid || '-' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- JVM 指标卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper info">
              <IconifyIconOnline icon="ri:stack-overflow-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ jvmInfo.threadCount || 0 }}</div>
              <div class="stat-label">活跃线程</div>
              <div class="stat-detail">峰值: {{ jvmInfo.peakThreadCount || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper success">
              <IconifyIconOnline icon="ri:code-box-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ jvmInfo.loadedClassCount || 0 }}</div>
              <div class="stat-label">已加载类</div>
              <div class="stat-detail">卸载: {{ jvmInfo.unloadedClassCount || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:recycle-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ (jvmInfo.youngGcCount || 0) + (jvmInfo.fullGcCount || 0) }}</div>
              <div class="stat-label">GC 次数</div>
              <div class="stat-detail">Full GC: {{ jvmInfo.fullGcCount || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:server-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value text-sm">{{ systemInfo.hostname || '-' }}</div>
              <div class="stat-label">主机名</div>
              <div class="stat-detail">{{ systemInfo.hostAddress || '-' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速导航 -->
    <el-card class="modern-card quick-nav-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:apps-line" class="card-icon" />
            快速导航
          </span>
        </div>
      </template>
      <div class="quick-links">
        <div 
          v-for="link in quickLinks" 
          :key="link.path" 
          class="quick-link-item"
          @click="navigateTo(link.path)"
        >
          <div class="link-icon" :style="{ backgroundColor: link.color + '15', color: link.color }">
            <IconifyIconOnline :icon="link.icon" />
          </div>
          <span class="link-title">{{ link.title }}</span>
        </div>
      </div>
    </el-card>

    <!-- 实时数据 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:route-line" class="card-icon" />
                最新链路
              </span>
              <el-button link type="primary" @click="navigateTo('/hotspot/trace')">
                查看更多 <IconifyIconOnline icon="ri:arrow-right-s-line" />
              </el-button>
            </div>
          </template>
          <div class="recent-list">
            <div v-for="(trace, index) in recentTraces" :key="index" class="recent-item">
              <div class="item-main">
                <IconifyIconOnline icon="ri:checkbox-circle-line" class="item-icon success" />
                <span class="item-title">{{ trace.description || trace.name || '-' }}</span>
              </div>
              <span class="item-time">{{ trace.costTime || 0 }}ms</span>
            </div>
            <el-empty v-if="recentTraces.length === 0" description="暂无链路数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:bug-line" class="card-icon danger" />
                最新异常
              </span>
              <el-button link type="primary" @click="navigateTo('/hotspot/exceptions')">
                查看更多 <IconifyIconOnline icon="ri:arrow-right-s-line" />
              </el-button>
            </div>
          </template>
          <div class="recent-list">
            <div v-for="(ex, index) in recentExceptions" :key="index" class="recent-item">
              <div class="item-main">
                <IconifyIconOnline icon="ri:error-warning-line" class="item-icon danger" />
                <span class="item-title error">{{ ex.exceptionType?.split('.').pop() || '-' }}</span>
              </div>
              <span class="item-time">{{ formatTime(ex.timestamp) }}</span>
            </div>
            <el-empty v-if="recentExceptions.length === 0" description="暂无异常数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      .stat-icon { color: var(--el-color-primary); }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon { color: var(--el-color-success); }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon { color: var(--el-color-warning); }
    }
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon { color: var(--el-color-danger); }
    }
    &.info {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      .stat-icon { color: var(--el-color-info); }
    }

    .stat-icon {
      font-size: 24px;
    }
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);

      &.text-sm {
        font-size: 16px;
      }
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .stat-detail {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-top: 2px;
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);

        &.danger {
          color: var(--el-color-danger);
        }
      }
    }
  }
}

.quick-nav-card {
  .quick-links {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 16px;
  }

  .quick-link-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateY(-2px);
    }

    .link-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .link-title {
      font-size: 13px;
      color: var(--el-text-color-primary);
    }
  }
}

.recent-list {
  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;

      .item-icon {
        font-size: 16px;
        flex-shrink: 0;

        &.success {
          color: var(--el-color-success);
        }
        &.danger {
          color: var(--el-color-danger);
        }
      }

      .item-title {
        font-size: 13px;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.error {
          color: var(--el-color-danger);
        }
      }
    }

    .item-time {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
      margin-left: 12px;
    }
  }
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .page-header {
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .stat-card, .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
