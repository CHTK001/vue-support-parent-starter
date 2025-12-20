<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="execution-monitor">
      <!-- 执行状态头部 -->
      <div class="status-header">
        <div class="status-info">
          <el-tag :type="statusTagType" size="large" effect="dark">
            <el-icon v-if="executing" class="is-loading"><Loading /></el-icon>
            {{ statusText }}
          </el-tag>
          <span class="duration">
            <el-icon><Timer /></el-icon>
            执行时长: {{ formatDuration(executionDuration) }}
          </span>
        </div>
        <div class="status-actions">
          <el-button
            v-if="canStart"
            type="primary"
            :loading="starting"
            @click="handleStart"
          >
            <el-icon><VideoPlay /></el-icon>
            开始执行
          </el-button>
          <el-button
            v-if="canStop"
            type="danger"
            :loading="stopping"
            @click="handleStop"
          >
            <el-icon><VideoPause /></el-icon>
            停止执行
          </el-button>
          <el-button @click="handleRefresh" :loading="refreshing">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 执行进度 -->
      <el-card shadow="never" class="progress-card">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>执行进度</span>
          </div>
        </template>

        <div class="progress-content">
          <div class="progress-bar">
            <el-progress
              :percentage="progress"
              :status="progressStatus"
              :stroke-width="20"
              :text-inside="true"
            />
          </div>

          <el-row :gutter="24" class="progress-stats">
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">总记录数</span>
                <span class="stat-value">{{ formatNumber(stats.totalRecords) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item success">
                <span class="stat-label">成功处理</span>
                <span class="stat-value">{{ formatNumber(stats.successRecords) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item error">
                <span class="stat-label">处理失败</span>
                <span class="stat-value">{{ formatNumber(stats.failedRecords) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">处理速度</span>
                <span class="stat-value">{{ formatNumber(stats.recordsPerSecond) }} /s</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 数据流动可视化 -->
      <el-card shadow="never" class="flow-card">
        <template #header>
          <div class="card-header">
            <el-icon><Connection /></el-icon>
            <span>数据流动</span>
          </div>
        </template>

        <div class="flow-visualization">
          <div class="flow-nodes">
            <div
              v-for="(node, index) in flowNodes"
              :key="node.key"
              class="flow-node"
              :class="[node.type.toLowerCase(), { active: node.active, error: node.error }]"
            >
              <div class="node-icon">
                <el-icon v-if="node.type === 'INPUT'"><Download /></el-icon>
                <el-icon v-else-if="node.type === 'OUTPUT'"><Upload /></el-icon>
                <el-icon v-else-if="node.type === 'FILTER'"><Filter /></el-icon>
                <el-icon v-else><Connection /></el-icon>
              </div>
              <div class="node-info">
                <span class="node-name">{{ node.name }}</span>
                <span class="node-stats">
                  {{ formatNumber(node.processedCount) }} 条
                </span>
              </div>
              <div v-if="node.active" class="node-pulse"></div>
            </div>

            <!-- 连接线 -->
            <svg
              v-if="flowNodes.length > 1"
              class="flow-connections"
              :width="flowSvgWidth"
              :height="60"
            >
              <g v-for="(conn, index) in flowConnections" :key="index">
                <path
                  :d="conn.path"
                  class="flow-path"
                  :class="{ active: conn.active }"
                />
                <!-- 数据流动动画 -->
                <circle
                  v-if="conn.active && executing"
                  r="4"
                  fill="#409eff"
                  class="flow-particle"
                >
                  <animateMotion
                    :dur="conn.duration || '1s'"
                    repeatCount="indefinite"
                    :path="conn.path"
                  />
                </circle>
              </g>
            </svg>
          </div>
        </div>
      </el-card>

      <!-- 执行日志 -->
      <el-card shadow="never" class="logs-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>执行日志</span>
            <el-tag size="small" type="info">{{ logs.length }} 条</el-tag>
            <div class="log-actions">
              <el-checkbox v-model="autoScroll" label="自动滚动" />
              <el-button size="small" text @click="clearLogs">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>
          </div>
        </template>

        <div ref="logsContainerRef" class="logs-container">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-item"
            :class="log.level.toLowerCase()"
          >
            <span class="log-time">{{ log.time }}</span>
            <el-tag :type="getLogLevelType(log.level)" size="small">
              {{ log.level }}
            </el-tag>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <el-empty v-if="logs.length === 0" description="暂无日志" :image-size="60" />
        </div>
      </el-card>

      <!-- 性能指标 -->
      <el-card shadow="never" class="metrics-card">
        <template #header>
          <div class="card-header">
            <el-icon><Odometer /></el-icon>
            <span>性能指标</span>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-icon cpu">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="metric-content">
                <span class="metric-label">CPU 使用</span>
                <el-progress
                  :percentage="metrics.cpuUsage"
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="metric-value">{{ metrics.cpuUsage }}%</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-icon memory">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="metric-content">
                <span class="metric-label">内存使用</span>
                <el-progress
                  :percentage="metrics.memoryUsage"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getMemoryColor(metrics.memoryUsage)"
                />
                <span class="metric-value">{{ formatBytes(metrics.memoryUsed) }} / {{ formatBytes(metrics.memoryTotal) }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-icon io">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="metric-content">
                <span class="metric-label">I/O 吞吐</span>
                <span class="metric-value large">{{ formatBytes(metrics.ioThroughput) }}/s</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-icon latency">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="metric-content">
                <span class="metric-label">平均延迟</span>
                <span class="metric-value large">{{ metrics.avgLatency }} ms</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  Loading,
  Timer,
  VideoPlay,
  VideoPause,
  Refresh,
  TrendCharts,
  Connection,
  Download,
  Upload,
  Filter,
  Document,
  Delete,
  Odometer,
  Cpu,
  Coin,
  DataLine,
} from "@element-plus/icons-vue";
import {
  startSyncTask,
  stopSyncTask,
  getSyncTaskLogs,
  type SyncTask,
  type SyncTaskLog,
} from "@/api/sync";

interface Props {
  modelValue: boolean;
  task: SyncTask | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "statusChange", status: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const dialogTitle = computed(() => {
  return props.task ? `任务执行监控 - ${props.task.syncTaskName}` : "任务执行监控";
});

// 执行状态
const executing = ref(false);
const starting = ref(false);
const stopping = ref(false);
const refreshing = ref(false);
const executionStatus = ref<string>("STOPPED");
const executionDuration = ref(0);
const startTime = ref<number | null>(null);
const durationTimer = ref<number | null>(null);

// 进度
const progress = ref(0);
const stats = reactive({
  totalRecords: 0,
  successRecords: 0,
  failedRecords: 0,
  recordsPerSecond: 0,
});

// 数据流动节点
interface FlowNode {
  key: string;
  name: string;
  type: string;
  active: boolean;
  error: boolean;
  processedCount: number;
}

const flowNodes = ref<FlowNode[]>([]);
const flowSvgWidth = computed(() => Math.max((flowNodes.value.length - 1) * 200, 0));

interface FlowConnection {
  path: string;
  active: boolean;
  duration: string;
}

const flowConnections = computed<FlowConnection[]>(() => {
  const conns: FlowConnection[] = [];
  for (let i = 0; i < flowNodes.value.length - 1; i++) {
    const x1 = i * 200 + 140;
    const x2 = (i + 1) * 200 + 20;
    const y = 30;
    conns.push({
      path: `M ${x1} ${y} C ${x1 + 40} ${y}, ${x2 - 40} ${y}, ${x2} ${y}`,
      active: flowNodes.value[i].active && flowNodes.value[i + 1].active,
      duration: `${0.5 + Math.random() * 0.5}s`,
    });
  }
  return conns;
});

// 日志
interface LogEntry {
  time: string;
  level: string;
  message: string;
}

const logs = ref<LogEntry[]>([]);
const autoScroll = ref(true);
const logsContainerRef = ref<HTMLElement | null>(null);

// 性能指标
const metrics = reactive({
  cpuUsage: 0,
  memoryUsage: 0,
  memoryUsed: 0,
  memoryTotal: 0,
  ioThroughput: 0,
  avgLatency: 0,
});

// 状态计算
const statusText = computed(() => {
  const map: Record<string, string> = {
    STOPPED: "已停止",
    RUNNING: "运行中",
    ERROR: "执行出错",
    COMPLETED: "已完成",
  };
  return map[executionStatus.value] || executionStatus.value;
});

const statusTagType = computed(() => {
  const map: Record<string, string> = {
    STOPPED: "info",
    RUNNING: "primary",
    ERROR: "danger",
    COMPLETED: "success",
  };
  return map[executionStatus.value] || "info";
});

const progressStatus = computed(() => {
  if (executionStatus.value === "ERROR") return "exception";
  if (executionStatus.value === "COMPLETED") return "success";
  return undefined;
});

const canStart = computed(() => executionStatus.value === "STOPPED" || executionStatus.value === "COMPLETED");
const canStop = computed(() => executionStatus.value === "RUNNING");

// 刷新定时器
let refreshTimer: number | null = null;

// 开始执行
const handleStart = async () => {
  if (!props.task?.syncTaskId) return;

  starting.value = true;
  try {
    const res = await startSyncTask(props.task.syncTaskId);
    if (res.data?.success) {
      ElMessage.success("任务已启动");
      executionStatus.value = "RUNNING";
      executing.value = true;
      startTime.value = Date.now();
      startDurationTimer();
      startRefreshTimer();
      emit("statusChange", "RUNNING");
    } else {
      ElMessage.error(res.data?.msg || "启动失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("启动失败");
  } finally {
    starting.value = false;
  }
};

// 停止执行
const handleStop = async () => {
  if (!props.task?.syncTaskId) return;

  stopping.value = true;
  try {
    const res = await stopSyncTask(props.task.syncTaskId);
    if (res.data?.success) {
      ElMessage.success("任务已停止");
      executionStatus.value = "STOPPED";
      executing.value = false;
      stopDurationTimer();
      stopRefreshTimer();
      emit("statusChange", "STOPPED");
    } else {
      ElMessage.error(res.data?.msg || "停止失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("停止失败");
  } finally {
    stopping.value = false;
  }
};

// 刷新数据
const handleRefresh = async () => {
  if (!props.task?.syncTaskId) return;

  refreshing.value = true;
  try {
    await loadExecutionData();
  } finally {
    refreshing.value = false;
  }
};

// 加载执行数据
const loadExecutionData = async () => {
  if (!props.task?.syncTaskId) return;

  try {
    // 加载日志
    const logsRes = await getSyncTaskLogs(props.task.syncTaskId, 1, 100);
    if (logsRes.data?.success && logsRes.data.data) {
      const taskLogs = logsRes.data.data.records || [];
      logs.value = taskLogs.map((log: SyncTaskLog) => ({
        time: log.syncLogStartTime || new Date().toLocaleTimeString(),
        level: log.syncLogStatus === 'FAIL' ? 'ERROR' : (log.syncLogStatus === 'RUNNING' ? 'INFO' : 'INFO'),
        message: log.syncLogMessage || `执行${log.syncLogStatus === 'SUCCESS' ? '成功' : log.syncLogStatus === 'FAIL' ? '失败' : '中'}: 读取${log.syncLogReadCount || 0}条, 写入${log.syncLogWriteCount || 0}条`,
      }));
      scrollToBottom();
    }

    // 模拟获取其他数据（实际应从API获取）
    simulateMetrics();
  } catch (e) {
    console.error(e);
  }
};

// 模拟性能指标（实际应从API获取）
const simulateMetrics = () => {
  if (executing.value) {
    metrics.cpuUsage = Math.min(100, Math.max(0, metrics.cpuUsage + (Math.random() - 0.5) * 10));
    metrics.memoryUsage = Math.min(100, Math.max(20, metrics.memoryUsage + (Math.random() - 0.5) * 5));
    metrics.memoryUsed = Math.round((metrics.memoryUsage / 100) * 8 * 1024 * 1024 * 1024);
    metrics.memoryTotal = 8 * 1024 * 1024 * 1024;
    metrics.ioThroughput = Math.round(1024 * 1024 * (1 + Math.random() * 2));
    metrics.avgLatency = Math.round(10 + Math.random() * 20);

    // 更新进度
    if (stats.totalRecords > 0) {
      progress.value = Math.min(100, Math.round((stats.successRecords + stats.failedRecords) / stats.totalRecords * 100));
    } else {
      progress.value = Math.min(progress.value + Math.random() * 5, 95);
    }

    // 更新统计
    stats.successRecords += Math.round(Math.random() * 100);
    stats.recordsPerSecond = Math.round(stats.successRecords / Math.max(1, executionDuration.value));
  }
};

// 初始化数据流节点（从任务设计获取）
const initFlowNodes = () => {
  // 模拟数据，实际应从任务设计中获取
  flowNodes.value = [
    { key: "input-1", name: "MySQL输入", type: "INPUT", active: executing.value, error: false, processedCount: stats.successRecords },
    { key: "filter-1", name: "数据过滤", type: "FILTER", active: executing.value, error: false, processedCount: Math.round(stats.successRecords * 0.9) },
    { key: "datacenter-1", name: "数据中心", type: "DATA_CENTER", active: executing.value, error: false, processedCount: Math.round(stats.successRecords * 0.85) },
    { key: "output-1", name: "ES输出", type: "OUTPUT", active: executing.value, error: false, processedCount: Math.round(stats.successRecords * 0.8) },
  ];
};

// 时长计时器
const startDurationTimer = () => {
  stopDurationTimer();
  durationTimer.value = window.setInterval(() => {
    if (startTime.value) {
      executionDuration.value = Math.round((Date.now() - startTime.value) / 1000);
    }
  }, 1000);
};

const stopDurationTimer = () => {
  if (durationTimer.value) {
    clearInterval(durationTimer.value);
    durationTimer.value = null;
  }
};

// 刷新定时器
const startRefreshTimer = () => {
  stopRefreshTimer();
  refreshTimer = window.setInterval(() => {
    loadExecutionData();
    initFlowNodes();
  }, 2000);
};

const stopRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (autoScroll.value && logsContainerRef.value) {
    nextTick(() => {
      logsContainerRef.value!.scrollTop = logsContainerRef.value!.scrollHeight;
    });
  }
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 格式化函数
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}时${m}分${s}秒`;
  } else if (m > 0) {
    return `${m}分${s}秒`;
  }
  return `${s}秒`;
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getLogLevelType = (level: string) => {
  const map: Record<string, string> = {
    INFO: "info",
    WARN: "warning",
    ERROR: "danger",
    DEBUG: "",
  };
  return map[level] || "";
};

const getMemoryColor = (percentage: number) => {
  if (percentage > 90) return "#f56c6c";
  if (percentage > 70) return "#e6a23c";
  return "#409eff";
};

// 关闭对话框
const handleClosed = () => {
  stopDurationTimer();
  stopRefreshTimer();
  executing.value = false;
  progress.value = 0;
  logs.value = [];
  flowNodes.value = [];
  Object.assign(stats, { totalRecords: 0, successRecords: 0, failedRecords: 0, recordsPerSecond: 0 });
  Object.assign(metrics, { cpuUsage: 0, memoryUsage: 0, memoryUsed: 0, memoryTotal: 0, ioThroughput: 0, avgLatency: 0 });
};

// 监听任务变化
watch(
  () => props.task,
  (newTask) => {
    if (newTask && props.modelValue) {
      executionStatus.value = newTask.syncTaskStatus || "STOPPED";
      executing.value = executionStatus.value === "RUNNING";
      stats.totalRecords = newTask.syncTaskTotalRecords || 10000;
      if (executing.value) {
        startTime.value = Date.now();
        startDurationTimer();
        startRefreshTimer();
      }
      initFlowNodes();
      loadExecutionData();
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (show) => {
    if (show && props.task) {
      initFlowNodes();
      loadExecutionData();
    }
  }
);

onUnmounted(() => {
  stopDurationTimer();
  stopRefreshTimer();
});
</script>

<style scoped lang="scss">
.execution-monitor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;

  .status-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .duration {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #606266;
    }
  }

  .status-actions {
    display: flex;
    gap: 8px;
  }
}

.progress-card,
.flow-card,
.logs-card,
.metrics-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;

    .el-tag {
      margin-left: auto;
    }
  }
}

.progress-content {
  .progress-bar {
    margin-bottom: 24px;
  }

  .progress-stats {
    .stat-item {
      text-align: center;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;

      .stat-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      &.success .stat-value {
        color: #67c23a;
      }

      &.error .stat-value {
        color: #f56c6c;
      }
    }
  }
}

.flow-visualization {
  overflow-x: auto;
  padding: 20px 0;

  .flow-nodes {
    display: flex;
    align-items: center;
    position: relative;
    min-width: fit-content;
    gap: 60px;
  }

  .flow-node {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fff;
    border: 2px solid #dcdfe6;
    border-radius: 8px;
    min-width: 140px;
    transition: all 0.3s;

    &.input {
      border-color: #52c41a;
      .node-icon { color: #52c41a; }
    }
    &.output {
      border-color: #1890ff;
      .node-icon { color: #1890ff; }
    }
    &.filter {
      border-color: #faad14;
      .node-icon { color: #faad14; }
    }
    &.data_center {
      border-color: #722ed1;
      .node-icon { color: #722ed1; }
    }

    &.active {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
    }

    &.error {
      border-color: #f56c6c;
      box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.2);
    }

    .node-icon {
      font-size: 24px;
    }

    .node-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .node-name {
        font-size: 14px;
        font-weight: 500;
      }

      .node-stats {
        font-size: 12px;
        color: #909399;
      }
    }

    .node-pulse {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      background: #67c23a;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
  }

  .flow-connections {
    position: absolute;
    top: 50%;
    left: 140px;
    transform: translateY(-50%);
    pointer-events: none;

    .flow-path {
      fill: none;
      stroke: #dcdfe6;
      stroke-width: 2;

      &.active {
        stroke: #409eff;
      }
    }

    .flow-particle {
      fill: #409eff;
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(103, 194, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}

.logs-card {
  .card-header {
    .log-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }
  }
}

.logs-container {
  height: 200px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  background: #1e1e1e;
  border-radius: 4px;
  padding: 8px;

  .log-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 4px 0;
    color: #d4d4d4;

    .log-time {
      color: #808080;
      flex-shrink: 0;
    }

    .log-message {
      word-break: break-all;
    }

    &.error {
      color: #f56c6c;
    }

    &.warn {
      color: #e6a23c;
    }
  }
}

.metrics-card {
  .metric-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;

    .metric-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 20px;

      &.cpu {
        background: #e6f7e6;
        color: #52c41a;
      }
      &.memory {
        background: #e6f3ff;
        color: #1890ff;
      }
      &.io {
        background: #f5e6ff;
        color: #722ed1;
      }
      &.latency {
        background: #fff7e6;
        color: #faad14;
      }
    }

    .metric-content {
      flex: 1;

      .metric-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 12px;
        color: #606266;

        &.large {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }

      .el-progress {
        margin-bottom: 4px;
      }
    }
  }
}
</style>
