<template>
  <div class="script-execution-log">
    <div class="execution-status">
      <div class="status-header">
        <div class="status-title">
          <IconifyIconOnline icon="ri:code-box-line" class="mr-1" />
          <span>脚本执行状态</span>
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
            <div class="status-label">脚本名称：</div>
            <div class="status-value">{{ taskInfo.scriptName || "-" }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">开始时间：</div>
            <div class="status-value">{{ taskInfo.startTime || "-" }}</div>
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
          <span>执行输出</span>
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

      <div ref="logsContainerRef" class="logs-body">
        <template v-if="filteredHostResults.length > 0">
          <div v-for="host in filteredHostResults" :key="host.hostId" class="host-log-item" :class="{ expanded: expandedHosts.includes(host.hostId) }">
            <div class="host-header" :class="getHostStatusClass(host.status)" @click="toggleHostExpand(host.hostId)">
              <div class="host-info">
                <IconifyIconOnline :icon="getHostStatusIcon(host.status)" class="host-status-icon" />
                <span class="host-address">{{ host.hostAddress }}</span>
                <el-tag size="small" :type="getHostStatusTagType(host.status)">
                  {{ getHostStatusText(host.status) }}
                </el-tag>
              </div>
              <div class="host-actions">
                <IconifyIconOnline :icon="expandedHosts.includes(host.hostId) ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="expand-icon" />
              </div>
            </div>
            <div v-if="expandedHosts.includes(host.hostId)" class="host-log-content">
              <div v-if="host.output" class="output-content">
                <pre class="output-text">{{ host.output }}</pre>
              </div>
              <div v-else class="no-output">暂无输出内容</div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="no-host-logs">
            <el-empty description="暂无执行输出" :image-size="200" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { message } from "@repo/utils";

// 定义props
const props = defineProps({
  taskId: {
    type: [Number, String],
    required: true
  }
});

// Socket连接相关
const socket = ref(null);
const socketConnected = ref(false);
const canReconnect = ref(false);

// 任务信息
const taskInfo = ref({
  taskId: props.taskId,
  scriptName: null,
  scriptId: null,
  status: "PENDING",
  startTime: null,
  endTime: null
});

// 主机执行结果
const hostResults = ref([]);
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

// 根据筛选条件过滤主机结果
const filteredHostResults = computed(() => {
  let filtered = [...hostResults.value];

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

      // 搜索输出内容
      if (host.output && host.output.toLowerCase().includes(keyword)) {
        return true;
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

// 获取进度状态
const getProgressStatus = () => {
  if (taskInfo.value.status === "FAILED") return "exception";
  if (taskInfo.value.status === "SUCCESS") return "success";
  if (progressPercentage.value === 100) return "success";
  return "";
};

// 初始化Socket连接
const initSocket = () => {
  // 关闭之前的连接
  closeSocket();

  // 获取Socket实例
  socket.value = inject("socket");
  socketConnected.value = true;
  canReconnect.value = false;

  if (!socket.value) {
    console.error("Socket实例不存在");
    message("无法连接到Socket服务", { type: "error" });
    canReconnect.value = true;
    return;
  }

  // 监听任务状态更新
  socket.value.on(`${props.taskId}`, handleSocketMessage);

  // 手动请求当前状态
  // ...这部分可以根据实际后端接口添加
};

// 处理Socket消息
const handleSocketMessage = data => {
  try {
    console.log("收到Socket消息:", data);

    // 数据是字符串时解析JSON
    let messageData = typeof data === "string" ? JSON.parse(data) : data;

    // 处理可能嵌套的data字段
    if (messageData.data && typeof messageData.data === "string") {
      try {
        messageData = JSON.parse(messageData.data);
      } catch (e) {
        messageData = messageData.data;
      }
    }

    // 全局任务状态更新
    if (messageData.status) {
      taskInfo.value.status = messageData.status;

      // 更新其他任务信息
      if (messageData.scriptName) {
        taskInfo.value.scriptName = messageData.scriptName;
      }

      if (messageData.startTime) {
        taskInfo.value.startTime = messageData.startTime;
      }

      if (messageData.message) {
        message(messageData.message, { type: getMessageType(messageData.status) });
      }

      if (messageData.progress !== undefined) {
        // 进度更新
      }

      if (messageData.results) {
        // 全部结果
        for (const [hostAddress, output] of Object.entries(messageData.results)) {
          updateHostResult(null, hostAddress, "SUCCESS", output);
        }
      }
    }

    // 单个主机状态更新
    if (messageData.hostId) {
      updateHostResult(messageData.hostId, messageData.hostAddress, messageData.status, messageData.message || messageData.output);
    }

    // 更新统计信息
    updateHostStats();

    // 自动滚动
    if (autoScroll.value) {
      scrollToBottom();
    }
  } catch (error) {
    console.error("处理Socket消息错误:", error);
  }
};

// 更新主机结果
const updateHostResult = (hostId, hostAddress, status, output) => {
  if (!hostId && !hostAddress) return;

  // 先按地址查找
  let hostIndex = -1;
  if (hostAddress) {
    hostIndex = hostResults.value.findIndex(h => h.hostAddress === hostAddress);
  }

  // 再按ID查找
  if (hostIndex === -1 && hostId) {
    hostIndex = hostResults.value.findIndex(h => h.hostId === hostId);
  }

  if (hostIndex >= 0) {
    // 更新现有记录
    if (status) {
      hostResults.value[hostIndex].status = status;
    }

    if (output) {
      hostResults.value[hostIndex].output = output;
    }
  } else {
    // 添加新记录
    hostResults.value.push({
      hostId: hostId || `host-${hostResults.value.length + 1}`,
      hostAddress: hostAddress || "未知主机",
      status: status || "RUNNING",
      output: output || ""
    });

    // 自动展开新主机
    expandedHosts.value.push(hostId || `host-${hostResults.value.length}`);
  }
};

// 更新主机统计信息
const updateHostStats = () => {
  hostStats.total = hostResults.value.length;
  hostStats.running = hostResults.value.filter(h => h.status === "RUNNING").length;
  hostStats.success = hostResults.value.filter(h => h.status === "SUCCESS").length;
  hostStats.failed = hostResults.value.filter(h => h.status === "FAILED").length;
  hostStats.pending = hostStats.total - hostStats.running - hostStats.success - hostStats.failed;
};

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logsContainerRef.value) {
      logsContainerRef.value.scrollTop = logsContainerRef.value.scrollHeight;
    }
  });
};

// 展开/折叠主机详情
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
  hostResults.value = [];
  updateHostStats();
};

// 重新连接Socket
const reconnectSocket = () => {
  message("正在重新连接...", { type: "info" });
  initSocket();
};

// 关闭Socket连接
const closeSocket = () => {
  if (socket.value) {
    socket.value.off(props.taskId, handleSocketMessage);
  }
  socketConnected.value = false;
};

// 获取主机状态类名
const getHostStatusClass = status => {
  switch (status) {
    case "SUCCESS":
      return "status-success";
    case "FAILED":
      return "status-failed";
    case "RUNNING":
      return "status-running";
    default:
      return "status-pending";
  }
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
    default:
      return "ri:time-line";
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
      return "warning";
    default:
      return "info";
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
    default:
      return "等待中";
  }
};

// 获取消息类型
const getMessageType = status => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "RUNNING":
      return "info";
    case "COMPLETED_WITH_ERRORS":
      return "warning";
    default:
      return "info";
  }
};

// 开始监控任务
const startMonitor = taskId => {
  if (taskId) {
    // 使用本地变量而不是修改props
    const newTaskId = taskId;
    taskInfo.value.taskId = newTaskId;
  }

  // 重置状态
  hostResults.value = [];
  expandedHosts.value = [];
  updateHostStats();

  // 初始化Socket连接
  initSocket();
};

// 组件挂载时初始化
onMounted(() => {
  if (props.taskId) {
    startMonitor();
  }
});

// 组件卸载前清理
onBeforeUnmount(() => {
  closeSocket();
});

// 监听taskId变化
watch(
  () => props.taskId,
  newVal => {
    if (newVal) {
      startMonitor(newVal);
    }
  }
);

defineExpose({
  startMonitor
});
</script>

<style lang="scss" scoped>
.script-execution-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .execution-status {
    background-color: var(--el-fill-color-lighter);
    border-radius: 12px;
    margin-bottom: 16px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3), transparent);
      z-index: 1;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .status-title {
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        position: relative;
        padding-left: 10px;

        &::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 16px;
          background: var(--el-color-primary);
          border-radius: 3px;
        }
      }
    }

    .status-body {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .status-overview {
        flex: 1;
        min-width: 300px;
        background-color: var(--el-fill-color-blank);
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

        .status-item {
          display: flex;
          margin-bottom: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          transition: all 0.3s;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          .status-label {
            width: 100px;
            color: var(--el-text-color-secondary);
            font-weight: 500;
          }

          .status-value {
            flex: 1;
            font-weight: 500;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .status-detail {
        min-width: 300px;

        .host-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 8px;
            background-color: var(--el-fill-color-blank);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: all 0.3s;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            &.success {
              color: var(--el-color-success);
              border-left: 3px solid var(--el-color-success);
            }

            &.running {
              color: var(--el-color-warning);
              border-left: 3px solid var(--el-color-warning);

              .iconify-icon {
                animation: spin 1.5s linear infinite;
              }
            }

            &.pending {
              color: var(--el-color-info);
              border-left: 3px solid var(--el-color-info);
            }

            &.failed {
              color: var(--el-color-danger);
              border-left: 3px solid var(--el-color-danger);
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
    overflow: hidden;
    background-color: var(--el-fill-color-lighter);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary), transparent);
      z-index: 1;
    }

    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background-color: rgba(var(--el-bg-color-rgb), 0.6);

      .logs-title {
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        position: relative;
        padding-left: 10px;

        &::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 16px;
          background: var(--el-color-primary);
          border-radius: 3px;
        }
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
      border-bottom: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-blank);
    }

    .logs-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background-color: var(--el-bg-color);

      /* 美化滚动条 */
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(var(--el-color-primary-rgb), 0.2);
        border-radius: 4px;

        &:hover {
          background-color: rgba(var(--el-color-primary-rgb), 0.3);
        }
      }

      &::-webkit-scrollbar-track {
        background-color: var(--el-fill-color-lighter);
        border-radius: 4px;
      }

      .host-log-item {
        margin-bottom: 12px;
        background-color: var(--el-bg-color);
        border-radius: 8px;
        border: 1px solid var(--el-border-color-lighter);
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        transition: all 0.3s ease;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        &.expanded {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        .host-header {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.3s;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.status-success {
            border-left: 4px solid var(--el-color-success);
            background-color: rgba(var(--el-color-success-rgb), 0.05);
          }

          &.status-failed {
            border-left: 4px solid var(--el-color-danger);
            background-color: rgba(var(--el-color-danger-rgb), 0.05);
          }

          &.status-running {
            border-left: 4px solid var(--el-color-warning);
            background-color: rgba(var(--el-color-warning-rgb), 0.05);
          }

          &.status-pending {
            border-left: 4px solid var(--el-color-info);
            background-color: rgba(var(--el-color-info-rgb), 0.05);
          }

          .host-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .host-status-icon {
              font-size: 18px;
            }

            .host-address {
              font-weight: 500;
            }
          }

          .host-actions {
            .expand-icon {
              transition: transform 0.3s;
            }
          }
        }

        .host-log-content {
          padding: 16px;
          border-top: 1px solid var(--el-border-color-lighter);
          background-color: var(--el-fill-color-blank);
          animation: fadeIn 0.3s ease-out;

          .output-content {
            max-height: 300px;
            overflow-y: auto;

            /* 美化滚动条 */
            &::-webkit-scrollbar {
              width: 6px;
            }

            &::-webkit-scrollbar-thumb {
              background-color: rgba(var(--el-color-primary-rgb), 0.2);
              border-radius: 3px;

              &:hover {
                background-color: rgba(var(--el-color-primary-rgb), 0.3);
              }
            }

            &::-webkit-scrollbar-track {
              background-color: var(--el-fill-color-lighter);
              border-radius: 3px;
            }

            .output-text {
              margin: 0;
              font-family: "Consolas", "Monaco", "Courier New", monospace;
              font-size: 14px;
              line-height: 1.5;
              white-space: pre-wrap;
              word-break: break-all;
              padding: 10px;
              border-radius: 6px;
              background-color: var(--el-bg-color);
              color: var(--el-text-color-regular);
              border: 1px solid var(--el-border-color-lighter);
            }
          }

          .no-output {
            color: var(--el-text-color-secondary);
            text-align: center;
            padding: 32px;
            font-style: italic;
          }
        }
      }

      .no-host-logs {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 200px;

        :deep(.el-empty) {
          padding: 40px 0;
        }
      }
    }
  }
}

// 自旋动画
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 淡入动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mr-1 {
  margin-right: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .execution-status .status-body {
    flex-direction: column;

    .status-overview,
    .status-detail {
      width: 100%;
    }
  }

  .host-logs .logs-filter {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;

    .el-radio-group {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }

    .el-input {
      width: 100% !important;
    }
  }
}
</style>
