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
    <div v-if="visible" ref="dialogRef" class="sc-socket-event-dialog" :style="dialogStyle">
      <!-- 头部（拖拽区域） -->
      <div class="dialog-header">
        <div class="header-title">
          <IconifyIconOnline v-if="icon" :icon="icon" class="title-icon" />
          <span class="title-text">{{ title }}</span>
          <el-tag :type="statusType" size="small" class="ml-2">{{ statusText }}</el-tag>
        </div>
        <div class="header-controls">
          <el-button v-if="closeable" type="text" size="small" class="control-btn close-btn" @click.stop="handleClose">
            <IconifyIconOnline icon="ri:close-line" width="16" />
          </el-button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="dialog-content">
        <slot v-if="layout === 'custom'" :data="progressData" :logs="logs" :percentage="percentage" :status="status"></slot>

        <!-- Process 布局 -->
        <template v-else-if="layout === 'process'">
          <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="10" :format="percentageFormat" />
          <div class="process-message" v-if="message">
            <IconifyIconOnline :icon="messageIcon" class="message-icon" />
            <span>{{ message }}</span>
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
/**
 * Socket 消息对话框组件
 * 使用 interact.js 实现拖拽和缩放
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 简化架构，完全由 interact.js 控制
 */
import { ref, computed, inject, onMounted, onUnmounted, watch, nextTick, type PropType } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useSocketService } from "@repo/core";
import interact from "interactjs";

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
  [key: string]: unknown;
}

type PositionType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type ProtocolType = "socketio" | "rsocket";

const props = defineProps({
  eventId: { type: [String, Number], required: true },
  title: { type: String, default: "同步进度" },
  icon: { type: String, default: "ri:progress-3-line" },
  eventName: { type: [String, Array] as PropType<string | string[]>, default: "progress-event" },
  // Socket 实例标识，未配置则使用全局
  socketKey: { type: String, default: undefined },
  // 通信协议类型
  protocol: { type: String as PropType<ProtocolType>, default: "socketio" },
  mode: { type: String, default: "embed" },
  position: { type: String as PropType<PositionType>, default: "bottom-right" },
  visible: { type: Boolean, default: false },
  closeable: { type: Boolean, default: true },
  dataType: { type: String, default: "socket" },
  layout: { type: String, default: "process" },
  height: { type: Number, default: 200 },
  width: { type: Number, default: 400 },
  dialogHeight: { type: Number, default: 300 }
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  data: [data: ProgressData];
}>();

// Socket 服务接口（统一接口）
interface SocketService {
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string) => void;
  emit?: (event: string, data?: unknown) => void;
  isConnected?: boolean;
}

// Socket 实例
const socketService = ref<SocketService | null>(null);

// 进度状态
const percentage = ref(0);
const status = ref("waiting");
const message = ref("");
const currentStep = ref("");
const showProgress = ref(false);
const logs = ref<LogItem[]>([]);
const progressData = ref<ProgressData>({});

// 对话框
const dialogRef = ref<HTMLElement | null>(null);
let interactInstance: ReturnType<typeof interact> | null = null;

// 计算属性
const progressStatus = computed(() => {
  if (status.value === "success") return "success";
  if (status.value === "error") return "exception";
  return "";
});

const statusType = computed(() => {
  const map: Record<string, string> = { waiting: "info", processing: "warning", success: "success", error: "danger" };
  return map[status.value] || "info";
});

const statusText = computed(() => {
  const map: Record<string, string> = { waiting: "等待中", processing: "处理中", success: "已完成", error: "失败" };
  return map[status.value] || "等待中";
});

const messageIcon = computed(() => {
  if (status.value === "error") return "ri:error-warning-line";
  if (status.value === "success") return "ri:check-line";
  return "ri:information-line";
});

const dialogStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.dialogHeight}px`,
  touchAction: "none"
}));

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

/**
 * 获取 Socket 服务
 * 使用统一的 socketService，自动适配 Socket.IO 和 RSocket
 */
const getSocketInstance = (): SocketService | null => {
  // 使用统一的 socketService
  const service = useSocketService();
  if (service) {
    return service as unknown as SocketService;
  }
  return null;
};

/**
 * 设置 Socket 监听器
 * 统一接口，自动适配 Socket.IO 和 RSocket
 */
const setupSocketListener = () => {
  if (props.dataType !== "socket") return;

  socketService.value = getSocketInstance();

  if (!socketService.value) {
    console.warn("[ScSocketMessageDialog] Socket 服务不可用");
    return;
  }

  const eventNames = Array.isArray(props.eventName) ? props.eventName : [props.eventName];

  eventNames.forEach(eventName => {
    socketService.value?.on(eventName, (data: unknown) => {
      handleProgressData(data as ProgressData);
    });
  });
};

/**
 * 移除 Socket 监听
 */
const removeSocketListener = () => {
  if (props.dataType !== "socket" || !socketService.value) return;

  const eventNames = Array.isArray(props.eventName) ? props.eventName : [props.eventName];

  eventNames.forEach(eventName => {
    socketService.value?.off(eventName);
  });
};

/**
 * 初始化 interact.js
 */
function initInteract(): void {
  if (!dialogRef.value || props.mode !== "dialog") return;

  destroyInteract();

  const el = dialogRef.value;
  const margin = 20;
  let initX = margin;
  let initY = margin;

  switch (props.position) {
    case "top-left":
      initX = margin;
      initY = margin;
      break;
    case "top-right":
      initX = window.innerWidth - props.width - margin;
      initY = margin;
      break;
    case "bottom-left":
      initX = margin;
      initY = window.innerHeight - props.dialogHeight - margin;
      break;
    case "bottom-right":
    default:
      initX = window.innerWidth - props.width - margin;
      initY = window.innerHeight - props.dialogHeight - margin;
      break;
  }

  el.style.transform = `translate(${initX}px, ${initY}px)`;
  el.setAttribute("data-x", String(initX));
  el.setAttribute("data-y", String(initY));

  interactInstance = interact(el)
    .draggable({
      allowFrom: ".dialog-header",
      modifiers: [interact.modifiers.restrict({ restriction: "body", endOnly: false })],
      inertia: { resistance: 15, minSpeed: 200, endSpeed: 10 },
      listeners: {
        start: () => {
          document.body.style.userSelect = "none";
        },
        move: event => {
          const target = event.target as HTMLElement;
          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));
        },
        end: () => {
          document.body.style.userSelect = "";
        }
      }
    })
    .resizable({
      edges: { right: true, bottom: true },
      modifiers: [interact.modifiers.restrictSize({ min: { width: 280, height: 200 }, max: { width: 800, height: 600 } })],
      listeners: {
        start: () => {
          document.body.style.userSelect = "none";
        },
        move: event => {
          const target = event.target as HTMLElement;
          const { width, height } = event.rect;
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;
        },
        end: () => {
          document.body.style.userSelect = "";
        }
      }
    });
}

function destroyInteract(): void {
  if (interactInstance) {
    interactInstance.unset();
    interactInstance = null;
  }
}

function handleClose(): void {
  emit("update:visible", false);
  emit("close");
}

// 生命周期
onMounted(() => {
  setupSocketListener();
  nextTick(() => initInteract());
});

onUnmounted(() => {
  removeSocketListener();
  destroyInteract();
});

watch([() => props.eventId, () => props.dataType, () => props.eventName], () => {
  removeSocketListener();
  setupSocketListener();
});

// 暴露方法
defineExpose({
  updateProgress(data: ProgressData) {
    if (props.dataType === "default") {
      handleProgressData({ ...data, eventId: props.eventId });
    }
  },
  resetProgress() {
    percentage.value = 0;
    status.value = "waiting";
    message.value = "";
    logs.value = [];
    showProgress.value = false;
    progressData.value = {};
  },
  show() {
    showProgress.value = true;
  },
  hide() {
    showProgress.value = false;
  },
  addLog(msg: string, indent = 0) {
    if (props.layout === "log") {
      logs.value.push({ time: new Date(), message: msg, indent });
      scrollToBottom();
    }
  },
  clearLogs() {
    logs.value = [];
  }
});
</script>

<style scoped>
/* 内嵌模式 */
.sc-socket-event-process {
  margin: 12px 0;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
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
}

.process-message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
}

.message-icon {
  margin-right: 5px;
}

/* 日志布局 */
.log-container {
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
  padding: 8px;
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  padding: 3px 0;
  line-height: 1.5;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
}

.log-time {
  margin-right: 8px;
}

.log-message {
  color: var(--el-text-color-regular);
}

.log-progress {
  margin-top: 10px;
}

/* 弹框模式 */
.sc-socket-event-dialog {
  position: fixed;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
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
  font-size: 18px;
  color: var(--el-color-primary);
}

.title-text {
  font-weight: 600;
  font-size: 14px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  padding: 4px;
  color: var(--el-text-color-regular);
}

.control-btn:hover {
  color: var(--el-color-primary);
}

.close-btn:hover {
  color: var(--el-color-danger);
}

.dialog-content {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100% - 50px);
}

/* 滚动条 */
.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 3px;
}
</style>
