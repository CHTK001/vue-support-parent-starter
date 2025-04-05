<template>
  <div class="task-monitor">
    <div class="task-status">
      <div class="status-header">
        <div class="status-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-1" />
          <span>任务状态</span>
        </div>
        <div class="status-actions">
          <el-button type="primary" link :disabled="!canReconnect" @click="reconnectSocket">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            重新连接
          </el-button>
        </div>
      </div>

      <div class="status-body">
        <div class="status-overview">
          <div class="status-item">
            <div class="status-label">任务ID：</div>
            <div class="status-value">{{ taskInfo.taskId || "-" }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">任务类型：</div>
            <div class="status-value">{{ getTaskTypeText(taskInfo.taskType) }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">开始时间：</div>
            <div class="status-value">{{ taskInfo.createTime || "-" }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">主机数量：</div>
            <div class="status-value">{{ hostStats.total }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">执行进度：</div>
            <div class="status-value">
              <el-progress :percentage="progressPercentage" :status="getProgressStatus()" :stroke-width="15" />
            </div>
          </div>
        </div>
        <div class="status-detail">
          <div class="host-stats">
            <div class="stat-item success">
              <IconifyIconOnline icon="ri:checkbox-circle-line" />
              <span>成功：{{ hostStats.success }}</span>
            </div>
            <div class="stat-item running">
              <IconifyIconOnline icon="ri:loader-4-line" />
              <span>进行中：{{ hostStats.running }}</span>
            </div>
            <div class="stat-item pending">
              <IconifyIconOnline icon="ri:time-line" />
              <span>等待中：{{ hostStats.pending }}</span>
            </div>
            <div class="stat-item failed">
              <IconifyIconOnline icon="ri:close-circle-line" />
              <span>失败：{{ hostStats.failed }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="host-logs">
      <div class="logs-header">
        <div class="logs-title">
          <IconifyIconOnline icon="ri:terminal-box-line" class="mr-1" />
          <span>执行日志</span>
        </div>
        <div class="logs-actions">
          <el-checkbox v-model="autoScroll" label="自动滚动" />
          <el-button type="primary" link @click="clearLogs">
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            清空日志
          </el-button>
        </div>
      </div>

      <div class="logs-filter">
        <el-radio-group v-model="logFilter" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="running">进行中</el-radio-button>
          <el-radio-button label="success">成功</el-radio-button>
          <el-radio-button label="failed">失败</el-radio-button>
        </el-radio-group>
        <el-input v-model="searchKeyword" placeholder="搜索主机地址/内容" prefix-icon="Search" clearable style="width: 220px" />
      </div>

      <div class="logs-body" ref="logsContainerRef">
        <template v-if="filteredHostLogs.length > 0">
          <div v-for="(hostLog, hostIndex) in filteredHostLogs" :key="hostLog.hostId" class="host-log-item" :class="{ expanded: expandedHosts.includes(hostLog.hostId) }">
            <div class="host-header" :class="getHostStatusClass(hostLog.status)" @click="toggleHostExpand(hostLog.hostId)">
              <div class="host-info">
                <IconifyIconOnline :icon="getHostStatusIcon(hostLog.status)" class="host-status-icon" />
                <span class="host-address">{{ hostLog.hostAddress }}</span>
                <el-tag size="small" :type="getHostStatusTagType(hostLog.status)">
                  {{ getHostStatusText(hostLog.status) }}
                </el-tag>
              </div>
              <div class="host-actions">
                <IconifyIconOnline :icon="expandedHosts.includes(hostLog.hostId) ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="expand-icon" />
              </div>
            </div>
            <div class="host-log-content" v-if="expandedHosts.includes(hostLog.hostId)">
              <div v-if="hostLog.logs && hostLog.logs.length > 0" class="log-lines">
                <div v-for="(log, logIndex) in hostLog.logs" :key="`${hostIndex}-${logIndex}`" class="log-line" :class="getLogLevelClass(log.level)">
                  <span class="log-time">{{ formatLogTime(log.time) }}</span>
                  <span class="log-content">{{ log.content }}</span>
                </div>
              </div>
              <div v-else class="no-logs">暂无日志信息</div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="no-host-logs">
            <el-empty description="暂无主机日志" :image-size="200" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { message } from "@repo/utils";
import io from "socket.io-client";

// 定义props
const props = defineProps({
  taskId: {
    type: [Number, String],
    required: true
  }
});

// SocketIO连接相关
const socket = ref(null);
const socketConnected = ref(false);
const canReconnect = ref(false);

// 任务信息
const taskInfo = ref({
  taskId: props.taskId,
  taskType: null,
  status: "PENDING",
  createTime: null,
  finishTime: null
});

// 主机日志
const hostLogs = ref([]);
const expandedHosts = ref([]);
const autoScroll = ref(true);
const logsContainerRef = ref(null);
const logFilter = ref("all");
const searchKeyword = ref("");

// 主机统计信息
const hostStats = reactive({
  total: 0,
  pending: 0,
  running: 0,
  success: 0,
  failed: 0
});

// 根据筛选条件过滤主机日志
const filteredHostLogs = computed(() => {
  let filtered = [...hostLogs.value];

  // 根据状态筛选
  if (logFilter.value !== "all") {
    filtered = filtered.filter(host => {
      switch (logFilter.value) {
        case "running":
          return host.status === "RUNNING";
        case "success":
          return host.status === "SUCCESS";
        case "failed":
          return host.status === "FAILED";
        default:
          return true;
      }
    });
  }

  // 根据关键字搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(host => {
      // 搜索主机地址
      if (host.hostAddress && host.hostAddress.toLowerCase().includes(keyword)) {
        return true;
      }

      // 搜索日志内容
      if (host.logs && host.logs.length > 0) {
        return host.logs.some(log => log.content && log.content.toLowerCase().includes(keyword));
      }

      return false;
    });
  }

  return filtered;
});

// 计算总进度百分比
const progressPercentage = computed(() => {
  if (hostStats.total === 0) return 0;

  // 计算已完成的主机比例
  return Math.floor(((hostStats.success + hostStats.failed) / hostStats.total) * 100);
});

// 初始化Socket连接
const initSocket = () => {
  // 关闭之前的连接
  closeSocket();

  const socketUrl = import.meta.env.VITE_API_BASE_URL || "";

  // 创建Socket连接
  socket.value = io(`${socketUrl}/maintenance-task`, {
    path: "/socket.io",
    transports: ["websocket"],
    query: {
      taskId: props.taskId
    }
  });

  // 监听连接事件
  socket.value.on("connect", () => {
    socketConnected.value = true;
    canReconnect.value = false;
    console.log("Socket connected", socket.value.id);

    // 连接后发送加入房间请求
    socket.value.emit("join", props.taskId);
  });

  // 监听断开连接事件
  socket.value.on("disconnect", () => {
    socketConnected.value = false;
    canReconnect.value = true;
    console.log("Socket disconnected");
  });

  // 监听连接错误事件
  socket.value.on("connect_error", error => {
    socketConnected.value = false;
    canReconnect.value = true;
    console.error("Socket connection error:", error);
    message("连接服务器失败，请检查网络连接", { type: "error" });
  });

  // 监听任务信息更新
  socket.value.on("task_info", data => {
    console.log("Received task info:", data);
    taskInfo.value = { ...data };

    // 如果是第一次收到任务信息，自动展开所有主机
    if (hostLogs.value.length === 0 && data.hosts && data.hosts.length > 0) {
      data.hosts.forEach(host => {
        expandedHosts.value.push(host.hostId);
      });
    }

    // 更新主机日志
    if (data.hosts && data.hosts.length > 0) {
      updateHostLogs(data.hosts);
    }

    // 更新主机统计信息
    updateHostStats();
  });

  // 监听主机日志更新
  socket.value.on("host_log", data => {
    console.log("Received host log:", data);

    // 查找主机日志
    const hostIndex = hostLogs.value.findIndex(h => h.hostId === data.hostId);

    if (hostIndex >= 0) {
      // 更新主机状态
      hostLogs.value[hostIndex].status = data.status || hostLogs.value[hostIndex].status;

      // 添加日志
      if (data.log) {
        if (!hostLogs.value[hostIndex].logs) {
          hostLogs.value[hostIndex].logs = [];
        }

        hostLogs.value[hostIndex].logs.push({
          time: data.log.time || new Date().toISOString(),
          level: data.log.level || "INFO",
          content: data.log.content || ""
        });

        // 如果是第一条日志，自动展开该主机
        if (hostLogs.value[hostIndex].logs.length === 1 && !expandedHosts.value.includes(data.hostId)) {
          expandedHosts.value.push(data.hostId);
        }
      }

      // 更新统计信息
      updateHostStats();

      // 自动滚动到底部
      if (autoScroll.value) {
        scrollToBottom();
      }
    }
  });

  // 监听任务完成事件
  socket.value.on("task_completed", data => {
    console.log("Task completed:", data);
    taskInfo.value.status = "COMPLETED";
    taskInfo.value.finishTime = data.finishTime || new Date().toISOString();

    // 更新主机统计信息
    updateHostStats();

    message("任务执行完成", { type: "success" });
  });
};

// 关闭Socket连接
const closeSocket = () => {
  if (socket.value && socket.value.connected) {
    socket.value.disconnect();
  }
  socket.value = null;
  socketConnected.value = false;
};

// 重新连接Socket
const reconnectSocket = () => {
  initSocket();
};

// 更新主机日志
const updateHostLogs = hosts => {
  hosts.forEach(host => {
    const existingHostIndex = hostLogs.value.findIndex(h => h.hostId === host.hostId);

    if (existingHostIndex >= 0) {
      // 更新已存在的主机信息
      hostLogs.value[existingHostIndex] = {
        ...hostLogs.value[existingHostIndex],
        ...host,
        logs: [...(hostLogs.value[existingHostIndex].logs || [])]
      };
    } else {
      // 添加新主机
      hostLogs.value.push({
        ...host,
        logs: []
      });
    }
  });
};

// 更新主机统计信息
const updateHostStats = () => {
  hostStats.total = hostLogs.value.length;
  hostStats.pending = hostLogs.value.filter(h => h.status === "PENDING").length;
  hostStats.running = hostLogs.value.filter(h => h.status === "RUNNING").length;
  hostStats.success = hostLogs.value.filter(h => h.status === "SUCCESS").length;
  hostStats.failed = hostLogs.value.filter(h => h.status === "FAILED").length;
};

// 切换主机展开状态
const toggleHostExpand = hostId => {
  const index = expandedHosts.value.indexOf(hostId);
  if (index >= 0) {
    expandedHosts.value.splice(index, 1);
  } else {
    expandedHosts.value.push(hostId);
  }
};

// 清空日志
const clearLogs = () => {
  hostLogs.value.forEach(host => {
    host.logs = [];
  });
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logsContainerRef.value) {
      logsContainerRef.value.scrollTop = logsContainerRef.value.scrollHeight;
    }
  });
};

// 获取主机状态图标
const getHostStatusIcon = status => {
  switch (status) {
    case "SUCCESS":
      return "ri:checkbox-circle-line";
    case "FAILED":
      return "ri:close-circle-line";
    case "RUNNING":
      return "ri:loader-4-line";
    case "PENDING":
    default:
      return "ri:time-line";
  }
};

// 获取主机状态文本
const getHostStatusText = status => {
  switch (status) {
    case "SUCCESS":
      return "成功";
    case "FAILED":
      return "失败";
    case "RUNNING":
      return "执行中";
    case "PENDING":
    default:
      return "等待中";
  }
};

// 获取主机状态标签类型
const getHostStatusTagType = status => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "danger";
    case "RUNNING":
      return "primary";
    case "PENDING":
    default:
      return "info";
  }
};

// 获取主机状态CSS类名
const getHostStatusClass = status => {
  return `status-${status ? status.toLowerCase() : "pending"}`;
};

// 获取日志级别CSS类名
const getLogLevelClass = level => {
  return `level-${level ? level.toLowerCase() : "info"}`;
};

// 获取进度条状态
const getProgressStatus = () => {
  if (taskInfo.value.status === "COMPLETED") {
    // 任务结束，根据是否有失败主机决定状态
    return hostStats.failed > 0 ? "exception" : "success";
  }

  // 任务进行中
  return "";
};

// 格式化日志时间
const formatLogTime = timeStr => {
  if (!timeStr) return "";

  try {
    const date = new Date(timeStr);

    // 格式化为 HH:MM:SS
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (e) {
    return timeStr;
  }
};

// 获取任务类型文本
const getTaskTypeText = type => {
  switch (type) {
    case "SCRIPT_EXECUTE":
      return "脚本执行";
    case "FILE_UPLOAD":
      return "文件上传";
    case "FILE_DEPLOY":
      return "文件部署";
    default:
      return type || "未知";
  }
};

// 开始监控任务
const startMonitor = taskId => {
  // 清空之前的数据
  hostLogs.value = [];
  expandedHosts.value = [];

  // 更新任务ID
  taskInfo.value.taskId = taskId || props.taskId;

  // 初始化socket连接
  initSocket();
};

// 监听taskId变化
watch(
  () => props.taskId,
  newVal => {
    if (newVal && newVal !== taskInfo.value.taskId) {
      startMonitor(newVal);
    }
  }
);

// 组件挂载时初始化
onMounted(() => {
  if (props.taskId) {
    startMonitor();
  }
});

// 组件卸载前关闭Socket连接
onBeforeUnmount(() => {
  closeSocket();
});

// 监听autoScroll变化
watch(autoScroll, newVal => {
  if (newVal) {
    scrollToBottom();
  }
});

// 导出公开方法
defineExpose({
  startMonitor,
  reconnectSocket,
  clearLogs
});
</script>

<style lang="scss" scoped>
.task-monitor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .task-status {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--el-fill-color-light);
      border-bottom: 1px solid var(--el-border-color);

      .status-title {
        display: flex;
        align-items: center;
        font-weight: 500;
        font-size: 16px;
      }

      .status-actions {
        display: flex;
        gap: 8px;
      }
    }

    .status-body {
      padding: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .status-overview {
        flex: 1;
        min-width: 300px;

        .status-item {
          margin-bottom: 12px;
          display: flex;
          align-items: center;

          &:last-child {
            margin-bottom: 0;
          }

          .status-label {
            width: 80px;
            color: var(--el-text-color-secondary);
            font-weight: 500;
          }

          .status-value {
            flex: 1;
          }
        }
      }

      .status-detail {
        flex: 1;
        min-width: 300px;

        .host-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 500;

            &.success {
              background-color: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }

            &.running {
              background-color: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
            }

            &.pending {
              background-color: var(--el-color-info-light-9);
              color: var(--el-color-info);
            }

            &.failed {
              background-color: var(--el-color-danger-light-9);
              color: var(--el-color-danger);
            }
          }
        }
      }
    }
  }

  .host-logs {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;

    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--el-fill-color-light);
      border-bottom: 1px solid var(--el-border-color);

      .logs-title {
        display: flex;
        align-items: center;
        font-weight: 500;
        font-size: 16px;
      }

      .logs-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }
    }

    .logs-filter {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color);
    }

    .logs-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;

      .host-log-item {
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .host-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.status-success {
            background-color: var(--el-color-success-light-9);
          }

          &.status-failed {
            background-color: var(--el-color-danger-light-9);
          }

          &.status-running {
            background-color: var(--el-color-primary-light-9);
          }

          .host-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .host-status-icon {
              font-size: 18px;
            }

            .host-address {
              font-weight: 500;
              margin-right: 8px;
            }
          }

          .host-actions {
            display: flex;
            align-items: center;

            .expand-icon {
              font-size: 20px;
              transition: transform 0.2s;
            }
          }
        }

        &.expanded .host-log-content {
          max-height: 500px;
        }

        .host-log-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s;
          background-color: #1e1e1e;
          color: #d4d4d4;

          .log-lines {
            padding: 8px 16px;
            font-family: monospace;
            font-size: 14px;

            .log-line {
              padding: 3px 0;
              display: flex;

              .log-time {
                color: #6a9955;
                margin-right: 16px;
                flex-shrink: 0;
              }

              .log-content {
                word-break: break-all;
                white-space: pre-wrap;
              }

              &.level-error {
                color: #f48771;
              }

              &.level-warn {
                color: #dcdcaa;
              }

              &.level-info {
                color: #d4d4d4;
              }

              &.level-debug {
                color: #9cdcfe;
              }
            }
          }

          .no-logs {
            padding: 16px;
            text-align: center;
            color: #6a9955;
          }
        }
      }

      .no-host-logs {
        padding: 32px 16px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
