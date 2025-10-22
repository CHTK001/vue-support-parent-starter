<template>
  <!-- 内嵌模式 -->
  <div v-if="mode === 'embed'" class="sc-socket-event-process" v-show="showProgress">
    <slot name="header" :data="progressData">
      <div class="process-header">
        <span class="process-title">{{ title }}</span>
        <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
      </div>
    </slot>

    <!-- 自定义布局slot -->
    <slot v-if="layout === 'custom'" :data="progressData" :logs="logs" :percentage="percentage" :status="status"></slot>

    <!-- Process 布局 -->
    <template v-else-if="layout === 'process'">
      <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="10" :format="percentageFormat" />

      <div class="process-message" v-if="message">
        <IconifyIconOnline :icon="messageIcon" class="message-icon" />
        <span>{{ message }}</span>
        <span v-if="currentStep" class="process-step">{{ currentStep }}</span>
      </div>
    </template>

    <!-- Log 布局 -->
    <template v-else-if="layout === 'log'">
      <div class="log-container thin-scrollbar" :style="{ height: `${height}px` }">
        <div v-for="(log, index) in logs" :key="index" class="log-item" :style="{ paddingLeft: `${log.indent * 20}px` }">
          <span class="log-time">{{ formatTime(log.time) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>

      <div class="log-progress">
        <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="8" :format="percentageFormat" />
      </div>
    </template>
  </div>

  <!-- 弹框模式 -->
  <Teleport to="body" v-else-if="mode === 'dialog'">
    <div v-if="visible" ref="dialogRef" class="sc-socket-event-dialog" :class="[`position-${position}`, { minimized: isMinimized }]" :style="dialogStyle" @mousedown="onDialogMouseDown">
      <!-- 调整大小的八个手柄 -->
      <div v-if="!isMinimized" class="resize-handle resize-top" @mousedown.stop="onResizeStart($event, 'top')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-right" @mousedown.stop="onResizeStart($event, 'right')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-bottom" @mousedown.stop="onResizeStart($event, 'bottom')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-left" @mousedown.stop="onResizeStart($event, 'left')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-top-left" @mousedown.stop="onResizeStart($event, 'top-left')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-top-right" @mousedown.stop="onResizeStart($event, 'top-right')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-bottom-left" @mousedown.stop="onResizeStart($event, 'bottom-left')"></div>
      <div v-if="!isMinimized" class="resize-handle resize-bottom-right" @mousedown.stop="onResizeStart($event, 'bottom-right')"></div>

      <!-- 头部 -->
      <div class="dialog-header" @mousedown="onDragStart">
        <slot name="header" :data="progressData">
          <div class="header-title">
            <IconifyIconOnline v-if="icon" :icon="icon" class="title-icon" />
            <span class="title-text">{{ title }}</span>
          </div>
        </slot>
        <div class="header-controls">
          <el-button type="text" size="small" class="control-btn" @click.stop="toggleMinimize" :title="isMinimized ? '还原' : '最小化'">
            <IconifyIconOnline :icon="isMinimized ? 'ri:arrow-up-s-line' : 'ri:subtract-line'" width="16" />
          </el-button>
          <el-button v-if="closeable" type="text" size="small" class="control-btn close-btn" @click.stop="handleClose">
            <IconifyIconOnline icon="ri:close-line" width="16" />
          </el-button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div v-show="!isMinimized" class="dialog-content">
        <!-- 自定义布局slot -->
        <slot v-if="layout === 'custom'" :data="progressData" :logs="logs" :percentage="percentage" :status="status"></slot>

        <!-- Process 布局 -->
        <template v-else-if="layout === 'process'">
          <div class="process-status">
            <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
          </div>
          <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="10" :format="percentageFormat" />

          <div class="process-message" v-if="message">
            <IconifyIconOnline :icon="messageIcon" class="message-icon" />
            <span>{{ message }}</span>
            <span v-if="currentStep" class="process-step">{{ currentStep }}</span>
          </div>
        </template>

        <!-- Log 布局 -->
        <template v-else-if="layout === 'log'">
          <div class="log-container thin-scrollbar" :style="{ height: `${height}px` }">
            <div v-for="(log, index) in logs" :key="index" class="log-item" :style="{ paddingLeft: `${log.indent * 20}px` }">
              <span class="log-time">{{ formatTime(log.time) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>

          <div class="log-progress">
            <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="8" :format="percentageFormat" />
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch, nextTick, type PropType } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useSocket } from "@repo/core";

interface LogItem {
  time: Date;
  message: string;
  indent: number;
}

interface ProgressData {
  name?: string;
  eventId?: string | number;
  message?: string;
  step?: number;
  total?: number;
  status?: string;
  percentage?: number;
  [key: string]: any;
}

type PositionType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const props = defineProps({
  // 基础属性
  eventId: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    default: "同步进度"
  },
  icon: {
    type: String,
    default: "ri:progress-3-line"
  },
  // 事件名称支持数组
  eventName: {
    type: [String, Array] as PropType<string | string[]>,
    default: "progress-event"
  },
  // socketKey用于自定义socketio
  socketKey: {
    type: String,
    default: undefined
  },
  // 模式：embed（内嵌）或 dialog（弹框）
  mode: {
    type: String,
    default: "embed",
    validator: (value: string) => ["embed", "dialog"].includes(value)
  },
  // 弹框位置（四个角落）
  position: {
    type: String as PropType<PositionType>,
    default: "bottom-right",
    validator: (value: string) => ["top-left", "top-right", "bottom-left", "bottom-right"].includes(value)
  },
  // 是否显示（弹框模式下使用）
  visible: {
    type: Boolean,
    default: false
  },
  // 是否可关闭
  closeable: {
    type: Boolean,
    default: true
  },
  // 数据类型
  dataType: {
    type: String,
    default: "socket",
    validator: (value: string) => ["socket", "default"].includes(value)
  },
  // 布局类型：process、log、custom（自定义）
  layout: {
    type: String,
    default: "process",
    validator: (value: string) => ["process", "log", "custom"].includes(value)
  },
  // 日志容器高度
  height: {
    type: Number,
    default: 200
  },
  // 弹框宽度
  width: {
    type: Number,
    default: 400
  },
  // 弹框高度（dialog模式）
  dialogHeight: {
    type: Number,
    default: 300
  },
  // localStorage存储前缀
  storagePrefix: {
    type: String,
    default: "sc-socket-event"
  }
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  data: [data: ProgressData];
  minimize: [minimized: boolean];
}>();

// Socket实例
const socketService = ref<any>(null);

// 进度状态
const percentage = ref(0);
const status = ref("waiting");
const message = ref("");
const currentStep = ref("");
const showProgress = ref(false);
const logs = ref<LogItem[]>([]);
const progressData = ref<ProgressData>({});

// 弹框状态
const isMinimized = ref(false);
const dialogRef = ref<HTMLElement>();

// 拖拽和缩放相关
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref("");
const dragStartX = ref(0);
const dragStartY = ref(0);
const dialogX = ref(0);
const dialogY = ref(0);
const dialogWidth = ref(props.width);
const dialogHeight = ref(props.dialogHeight);

// 计算属性
const progressStatus = computed(() => {
  if (status.value === "success") return "success";
  if (status.value === "error") return "exception";
  return "";
});

const statusType = computed(() => {
  switch (status.value) {
    case "waiting":
      return "info";
    case "processing":
      return "warning";
    case "success":
      return "success";
    case "error":
      return "danger";
    default:
      return "info";
  }
});

const statusText = computed(() => {
  switch (status.value) {
    case "waiting":
      return "等待中";
    case "processing":
      return "处理中";
    case "success":
      return "已完成";
    case "error":
      return "失败";
    default:
      return "等待中";
  }
});

const messageIcon = computed(() => {
  if (status.value === "error") return "ri:error-warning-line";
  if (status.value === "success") return "ri:check-line";
  return "ri:information-line";
});

const dialogStyle = computed(() => {
  const style: any = {
    width: `${dialogWidth.value}px`,
    height: isMinimized.value ? "auto" : `${dialogHeight.value}px`
  };

  if (isDragging.value || dialogX.value !== 0 || dialogY.value !== 0) {
    // 自定义位置（拖拽后）
    const basePosition = getBasePosition();
    style.left = `${basePosition.x + dialogX.value}px`;
    style.top = `${basePosition.y + dialogY.value}px`;
    style.right = "auto";
    style.bottom = "auto";
  }

  return style;
});

// 获取基础位置
function getBasePosition() {
  const margin = 20;
  switch (props.position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: window.innerWidth - dialogWidth.value - margin, y: margin };
    case "bottom-left":
      return { x: margin, y: window.innerHeight - dialogHeight.value - margin };
    case "bottom-right":
      return { x: window.innerWidth - dialogWidth.value - margin, y: window.innerHeight - dialogHeight.value - margin };
    default:
      return { x: margin, y: margin };
  }
}

// 格式化百分比显示
const percentageFormat = (percentage: number) => {
  return percentage === 100 && status.value === "success" ? "完成" : `${percentage}%`;
};

// 格式化时间
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// 处理接收到的数据
const handleProgressData = (data: ProgressData) => {
  if (!data || data.eventId !== props.eventId) return;

  showProgress.value = true;
  progressData.value = data;

  // 触发数据回调
  emit("data", data);

  // 处理消息
  if (data.message) {
    message.value = data.message;

    // 如果是日志布局，添加到日志列表
    if (props.layout === "log") {
      const indent = data.step && data.step <= 0 ? Math.abs(data.step) : 0;
      logs.value.push({
        time: new Date(),
        message: data.message,
        indent
      });

      // 限制日志数量
      if (logs.value.length > 100) {
        logs.value = logs.value.slice(-100);
      }

      scrollToBottom();
    }
  }

  // 处理进度
  if (data.total && data.total > 0) {
    percentage.value = Math.min(100, Math.round(((data.step || 0) / data.total) * 100));
  } else if (data.percentage !== undefined) {
    percentage.value = Math.min(100, Math.round(data.percentage));
  }

  // 处理步骤
  if (data.step !== undefined) {
    if (data.step > 0 && data.total) {
      currentStep.value = `${data.step}/${data.total}`;
    } else if (data.step <= 0) {
      currentStep.value = data.message || "";
    }
  }

  // 处理状态
  if (data.status) {
    status.value = data.status;

    // 如果完成或失败，5秒后自动隐藏
    if (data.status === "success" || data.status === "error") {
      setTimeout(() => {
        if (status.value === data.status) {
          showProgress.value = false;
        }
      }, 5000);
    }
  } else {
    if (percentage.value > 0 && percentage.value < 100) {
      status.value = "processing";
    } else if (percentage.value >= 100) {
      status.value = "success";
    }
  }
};

// 滚动日志到底部
const scrollToBottom = () => {
  nextTick(() => {
    const logContainer = document.querySelector(".log-container");
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
};

// 监听socket事件
const setupSocketListener = () => {
  if (props.dataType !== "socket") return;

  // 获取socket实例
  if (props.socketKey) {
    socketService.value = useSocket(props.socketKey);
  } else {
    // 尝试从inject获取默认socket
    const injectedSocket = inject("socket", null);
    socketService.value = injectedSocket ? { socket: injectedSocket } : useSocket();
  }

  if (!socketService.value || !socketService.value.socket) {
    console.warn("Socket service not available");
    return;
  }

  // 支持多个事件名称
  const eventNames = Array.isArray(props.eventName) ? props.eventName : [props.eventName];

  eventNames.forEach(eventName => {
    socketService.value.socket.on(eventName, (data: ProgressData) => {
      handleProgressData(data);
    });
  });
};

// 移除socket监听
const removeSocketListener = () => {
  if (props.dataType !== "socket" || !socketService.value || !socketService.value.socket) return;

  const eventNames = Array.isArray(props.eventName) ? props.eventName : [props.eventName];

  eventNames.forEach(eventName => {
    socketService.value.socket.off(eventName);
  });
};

// 拖拽相关函数
function onDragStart(e: MouseEvent) {
  if (isMinimized.value) return;

  isDragging.value = true;
  dragStartX.value = e.clientX - dialogX.value;
  dragStartY.value = e.clientY - dialogY.value;

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return;

  dialogX.value = e.clientX - dragStartX.value;
  dialogY.value = e.clientY - dragStartY.value;
}

function onDragEnd() {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);

  // 保存位置到localStorage
  savePositionToStorage();
}

function onDialogMouseDown(e: MouseEvent) {
  // 防止点击对话框内容时触发拖拽
  if ((e.target as HTMLElement).classList.contains("dialog-header") || (e.target as HTMLElement).closest(".dialog-header")) {
    return;
  }
}

// 缩放相关函数
function onResizeStart(e: MouseEvent, direction: string) {
  isResizing.value = true;
  resizeDirection.value = direction;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;

  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
}

function onResizeMove(e: MouseEvent) {
  if (!isResizing.value) return;

  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;

  const direction = resizeDirection.value;

  // 根据方向调整大小和位置
  if (direction.includes("right")) {
    dialogWidth.value = Math.max(300, dialogWidth.value + deltaX);
  }
  if (direction.includes("left")) {
    const newWidth = Math.max(300, dialogWidth.value - deltaX);
    if (newWidth > 300) {
      dialogX.value += deltaX;
      dialogWidth.value = newWidth;
    }
  }
  if (direction.includes("bottom")) {
    dialogHeight.value = Math.max(200, dialogHeight.value + deltaY);
  }
  if (direction.includes("top")) {
    const newHeight = Math.max(200, dialogHeight.value - deltaY);
    if (newHeight > 200) {
      dialogY.value += deltaY;
      dialogHeight.value = newHeight;
    }
  }

  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
}

function onResizeEnd() {
  isResizing.value = false;
  resizeDirection.value = "";
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);

  // 保存尺寸到localStorage
  savePositionToStorage();
}

// 最小化/还原
function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
  emit("minimize", isMinimized.value);
}

// 关闭
function handleClose() {
  emit("update:visible", false);
  emit("close");
}

// localStorage相关
function getStorageKey() {
  return `${props.storagePrefix}-${props.eventId}`;
}

function savePositionToStorage() {
  if (props.mode !== "dialog") return;

  const data = {
    x: dialogX.value,
    y: dialogY.value,
    width: dialogWidth.value,
    height: dialogHeight.value
  };

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save position to localStorage:", e);
  }
}

function loadPositionFromStorage() {
  if (props.mode !== "dialog") return;

  try {
    const data = localStorage.getItem(getStorageKey());
    if (data) {
      const parsed = JSON.parse(data);
      dialogX.value = parsed.x || 0;
      dialogY.value = parsed.y || 0;
      dialogWidth.value = parsed.width || props.width;
      dialogHeight.value = parsed.height || props.dialogHeight;
    }
  } catch (e) {
    console.error("Failed to load position from localStorage:", e);
  }
}

// 组件挂载
onMounted(() => {
  setupSocketListener();
  loadPositionFromStorage();
});

// 组件卸载
onUnmounted(() => {
  removeSocketListener();
});

// 监听属性变化
watch([() => props.eventId, () => props.dataType, () => props.eventName], () => {
  removeSocketListener();
  setupSocketListener();
});

// 暴露方法
defineExpose({
  // 手动更新进度
  updateProgress(data: ProgressData) {
    if (props.dataType === "default") {
      handleProgressData({
        ...data,
        eventId: props.eventId
      });
    }
  },
  // 重置进度
  resetProgress() {
    percentage.value = 0;
    status.value = "waiting";
    message.value = "";
    currentStep.value = "";
    logs.value = [];
    showProgress.value = false;
    progressData.value = {};
  },
  // 显示进度条
  show() {
    showProgress.value = true;
  },
  // 隐藏进度条
  hide() {
    showProgress.value = false;
  },
  // 添加日志
  addLog(message: string, indent: number = 0) {
    if (props.layout === "log") {
      logs.value.push({
        time: new Date(),
        message,
        indent
      });
      scrollToBottom();
    }
  },
  // 清空日志
  clearLogs() {
    logs.value = [];
  }
});
</script>

<style scoped>
/* 内嵌模式样式 */
.sc-socket-event-process {
  margin: 12px 0;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.process-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.process-message {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
}

.message-icon {
  margin-right: 5px;
  font-size: 14px;
}

.process-step {
  margin-left: 8px;
  color: var(--el-text-color-primary);
  font-size: 12px;
}

/* 日志布局样式 */
.log-container {
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
  padding: 8px;
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  padding: 3px 0;
  line-height: 1.5;
  border-bottom: 1px dashed #f0f0f0;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-time {
  color: var(--el-text-color-primary);
  margin-right: 8px;
}

.log-message {
  color: #606266;
}

.log-progress {
  margin-top: 10px;
}

/* 弹框模式样式 */
.sc-socket-event-dialog {
  position: fixed;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 位置样式 */
.position-top-left {
  top: 20px;
  left: 20px;
}

.position-top-right {
  top: 20px;
  right: 20px;
}

.position-bottom-left {
  bottom: 20px;
  left: 20px;
}

.position-bottom-right {
  bottom: 20px;
  right: 20px;
}

/* 最小化状态 */
.minimized {
  height: auto !important;
}

.minimized .dialog-content {
  display: none;
}

/* 头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(14, 165, 233, 0.05));
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: move;
  user-select: none;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.title-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.title-text {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  padding: 4px;
  color: var(--el-text-color-regular);
  transition: all 0.2s;
}

.control-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.close-btn:hover {
  color: #f56c6c;
}

/* 内容区域 */
.dialog-content {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100% - 50px);
}

.process-status {
  margin-bottom: 12px;
  text-align: right;
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-top,
.resize-bottom {
  width: 100%;
  height: 5px;
  cursor: ns-resize;
}

.resize-left,
.resize-right {
  width: 5px;
  height: 100%;
  cursor: ew-resize;
}

.resize-top {
  top: 0;
  left: 0;
}

.resize-right {
  top: 0;
  right: 0;
}

.resize-bottom {
  bottom: 0;
  left: 0;
}

.resize-left {
  top: 0;
  left: 0;
}

.resize-top-left,
.resize-top-right,
.resize-bottom-left,
.resize-bottom-right {
  width: 10px;
  height: 10px;
}

.resize-top-left {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.resize-top-right {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.resize-bottom-left {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

.resize-bottom-right {
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

/* 滚动条样式 */
.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 3px;
}

.thin-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color);
}

:deep(.el-progress-bar__inner) {
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.el-progress-bar__outer) {
  background-color: #e9ecef;
}

:deep(.el-progress--success .el-progress-bar__inner) {
  background-color: #67c23a;
}

:deep(.el-progress--exception .el-progress-bar__inner) {
  background-color: #f56c6c;
}

/* 响应式 */
@media (max-width: 768px) {
  .sc-socket-event-dialog {
    width: calc(100vw - 40px) !important;
    max-width: 400px;
  }
}
</style>
