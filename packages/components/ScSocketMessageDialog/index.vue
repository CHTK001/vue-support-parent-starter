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
  <Teleport :to="boundaryElement || 'body'" v-else-if="mode === 'dialog'" :disabled="!!boundaryElement">
    <div
      v-if="visible"
      ref="dialogRef"
      class="sc-socket-event-dialog"
      :class="[
        `position-${position}`,
        {
          minimized: isMinimized,
          'edge-docked': isEdgeDocked,
          'edge-left': dockedEdge === 'left',
          'edge-right': dockedEdge === 'right',
          'edge-top': dockedEdge === 'top',
          'edge-bottom': dockedEdge === 'bottom',
          'in-boundary': !!props.boundaryElement,
          'grid-snap': props.enableGridSnap
        }
      ]"
      :style="dialogStyle"
      @mousedown="onDialogMouseDown"
    >
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
      <div class="dialog-header" @mousedown="isMinimized ? onMinimizedDragStart($event) : onDragStart($event)" v-show="!isEdgeDocked" @click="onMinimizedClick">
        <!-- 最小化状态只显示图标 -->
        <template v-if="isMinimized">
          <div class="minimized-icon" :title="title">
            <IconifyIconOnline :icon="icon || 'ri:progress-3-line'" width="24" />
          </div>
        </template>
        <!-- 正常状态显示完整头部 -->
        <template v-else>
          <slot name="header" :data="progressData">
            <div class="header-title">
              <IconifyIconOnline v-if="icon" :icon="icon" class="title-icon" />
              <span class="title-text">{{ title }}</span>
            </div>
          </slot>
          <div class="header-controls">
            <el-button v-if="enableEdgeDock" type="text" size="small" class="control-btn" @click.stop="toggleEdgeDock" :title="isEdgeDocked ? '展开' : '靠边吸附'">
              <IconifyIconOnline :icon="isEdgeDocked ? 'ri:side-bar-fill' : 'ri:side-bar-line'" width="16" />
            </el-button>
            <el-button type="text" size="small" class="control-btn" @click.stop="toggleMinimize" :title="isMinimized ? '还原' : '最小化'">
              <IconifyIconOnline icon="ri:subtract-line" width="16" />
            </el-button>
            <el-button v-if="closeable" type="text" size="small" class="control-btn close-btn" @click.stop="handleClose">
              <IconifyIconOnline icon="ri:close-line" width="16" />
            </el-button>
          </div>
        </template>
      </div>

      <!-- 靠边吸附模式的图标按钮 -->
      <div v-if="isEdgeDocked" class="edge-dock-icon" @click="toggleEdgeDock" :title="'点击展开'">
        <IconifyIconOnline :icon="icon || 'ri:progress-3-line'" width="24" />
        <div v-if="percentage > 0 && percentage < 100" class="dock-progress-ring">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--el-border-color-light)" stroke-width="3" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--el-color-primary)"
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="`${percentage}, 100`"
              transform="rotate(-90 18 18)"
            />
          </svg>
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
  },
  // 是否启用靠边吸附最小化
  enableEdgeDock: {
    type: Boolean,
    default: false
  },
  // 吸附边缘的阈值（距离边缘多少像素时自动吸附）
  edgeDockThreshold: {
    type: Number,
    default: 50
  },
  // 父元素选择器（限制在父元素内移动）
  boundaryElement: {
    type: [String, Object] as PropType<string | HTMLElement | null>,
    default: null
  },
  // 是否启用 grid 方式移动
  enableGridSnap: {
    type: Boolean,
    default: false
  },
  // grid 单元格大小
  gridSize: {
    type: Number,
    default: 20
  },
  // 吸附图标大小
  dockIconSize: {
    type: Number,
    default: 48
  }
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  data: [data: ProgressData];
  minimize: [minimized: boolean];
  edgeDock: [docked: boolean, edge: string];
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

// 最小化拖拽相关
const isMinimizedDragging = ref(false);
const minimizedDragMoved = ref(false);
let animationFrameId: number | null = null;

// 靠边吸附相关
const isEdgeDocked = ref(false);
const dockedEdge = ref<"left" | "right" | "top" | "bottom" | "">("");
const preDockedPosition = ref({ x: 0, y: 0, width: 0, height: 0 });

// 父元素边界
const boundaryRect = ref<DOMRect | null>(null);

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
  // 靠边吸附模式
  if (isEdgeDocked.value) {
    const boundary = getBoundaryRect();
    const viewWidth = boundary ? boundary.width : window.innerWidth;
    const viewHeight = boundary ? boundary.height : window.innerHeight;

    const style: any = {
      width: `${props.dockIconSize}px`,
      height: `${props.dockIconSize}px`
    };

    // 吸附到实际边缘位置
    switch (dockedEdge.value) {
      case "left":
        style.left = "0px";
        style.top = `${Math.min(Math.max(dialogY.value, 0), viewHeight - props.dockIconSize)}px`;
        style.right = "auto";
        style.bottom = "auto";
        style.borderRadius = "0 50% 50% 0";
        break;
      case "right":
        style.right = "0px";
        style.top = `${Math.min(Math.max(dialogY.value, 0), viewHeight - props.dockIconSize)}px`;
        style.left = "auto";
        style.bottom = "auto";
        style.borderRadius = "50% 0 0 50%";
        break;
      case "top":
        style.top = "0px";
        style.left = `${Math.min(Math.max(dialogX.value, 0), viewWidth - props.dockIconSize)}px`;
        style.right = "auto";
        style.bottom = "auto";
        style.borderRadius = "0 0 50% 50%";
        break;
      case "bottom":
        style.bottom = "0px";
        style.left = `${Math.min(Math.max(dialogX.value, 0), viewWidth - props.dockIconSize)}px`;
        style.right = "auto";
        style.top = "auto";
        style.borderRadius = "50% 50% 0 0";
        break;
    }

    return style;
  }

  const style: any = {
    width: `${dialogWidth.value}px`,
    height: isMinimized.value ? "auto" : `${dialogHeight.value}px`
  };

  if (isDragging.value || dialogX.value !== 0 || dialogY.value !== 0) {
    // 自定义位置（拖拽后）
    const basePosition = getBasePosition();
    let x = basePosition.x + dialogX.value;
    let y = basePosition.y + dialogY.value;

    // Grid 吸附
    if (props.enableGridSnap) {
      x = Math.round(x / props.gridSize) * props.gridSize;
      y = Math.round(y / props.gridSize) * props.gridSize;
    }

    style.left = `${x}px`;
    style.top = `${y}px`;
    style.right = "auto";
    style.bottom = "auto";
  }

  return style;
});

// 获取父元素边界
function getBoundaryRect(): DOMRect | null {
  if (!props.boundaryElement) return null;

  let element: HTMLElement | null = null;
  if (typeof props.boundaryElement === "string") {
    element = document.querySelector(props.boundaryElement);
  } else {
    element = props.boundaryElement;
  }

  return element?.getBoundingClientRect() || null;
}

// 获取基础位置
function getBasePosition() {
  const margin = 20;
  const boundary = getBoundaryRect();

  // 如果有父元素边界，基于父元素计算
  if (boundary) {
    switch (props.position) {
      case "top-left":
        return { x: boundary.left + margin, y: boundary.top + margin };
      case "top-right":
        return { x: boundary.right - dialogWidth.value - margin, y: boundary.top + margin };
      case "bottom-left":
        return { x: boundary.left + margin, y: boundary.bottom - dialogHeight.value - margin };
      case "bottom-right":
        return { x: boundary.right - dialogWidth.value - margin, y: boundary.bottom - dialogHeight.value - margin };
      default:
        return { x: boundary.left + margin, y: boundary.top + margin };
    }
  }

  // 默认基于窗口计算
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

// 拖拽相关函数（使用 requestAnimationFrame 优化性能）
function onDragStart(e: MouseEvent) {
  if (isMinimized.value) return;
  e.preventDefault();

  isDragging.value = true;
  dragStartX.value = e.clientX - dialogX.value;
  dragStartY.value = e.clientY - dialogY.value;

  document.addEventListener("mousemove", onDragMove, { passive: true });
  document.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return;

  // 使用 requestAnimationFrame 优化性能
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    let newX = e.clientX - dragStartX.value;
    let newY = e.clientY - dragStartY.value;

    // Grid 吸附
    if (props.enableGridSnap) {
      newX = Math.round(newX / props.gridSize) * props.gridSize;
      newY = Math.round(newY / props.gridSize) * props.gridSize;
    }

    // 父元素边界限制
    const boundary = getBoundaryRect();
    if (boundary) {
      const basePos = getBasePosition();
      const actualX = basePos.x + newX;
      const actualY = basePos.y + newY;

      const minX = boundary.left;
      const maxX = boundary.right - dialogWidth.value;
      const minY = boundary.top;
      const maxY = boundary.bottom - dialogHeight.value;

      if (actualX < minX) newX = minX - basePos.x;
      if (actualX > maxX) newX = maxX - basePos.x;
      if (actualY < minY) newY = minY - basePos.y;
      if (actualY > maxY) newY = maxY - basePos.y;
    } else {
      // 限制在窗口内
      const basePos = getBasePosition();
      const actualX = basePos.x + newX;
      const actualY = basePos.y + newY;

      if (actualX < 0) newX = -basePos.x;
      if (actualX > window.innerWidth - dialogWidth.value) newX = window.innerWidth - dialogWidth.value - basePos.x;
      if (actualY < 0) newY = -basePos.y;
      if (actualY > window.innerHeight - dialogHeight.value) newY = window.innerHeight - dialogHeight.value - basePos.y;
    }

    dialogX.value = newX;
    dialogY.value = newY;
  });
}

function onDragEnd() {
  isDragging.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);

  // 检查是否需要靠边吸附
  if (props.enableEdgeDock) {
    checkEdgeDock();
  }

  // 保存位置到localStorage
  savePositionToStorage();
}

// 最小化状态下的拖拽
function onMinimizedDragStart(e: MouseEvent) {
  e.preventDefault();
  isMinimizedDragging.value = true;
  minimizedDragMoved.value = false;

  // 计算当前位置
  const rect = dialogRef.value?.getBoundingClientRect();
  if (rect) {
    dialogX.value = rect.left - getBasePosition().x;
    dialogY.value = rect.top - getBasePosition().y;
  }

  dragStartX.value = e.clientX - dialogX.value;
  dragStartY.value = e.clientY - dialogY.value;

  document.addEventListener("mousemove", onMinimizedDragMove, { passive: true });
  document.addEventListener("mouseup", onMinimizedDragEnd);
}

function onMinimizedDragMove(e: MouseEvent) {
  if (!isMinimizedDragging.value) return;
  minimizedDragMoved.value = true;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    let newX = e.clientX - dragStartX.value;
    let newY = e.clientY - dragStartY.value;

    const basePos = getBasePosition();
    const actualX = basePos.x + newX;
    const actualY = basePos.y + newY;

    // 限制在窗口内
    if (actualX < 0) newX = -basePos.x;
    if (actualX > window.innerWidth - 48) newX = window.innerWidth - 48 - basePos.x;
    if (actualY < 0) newY = -basePos.y;
    if (actualY > window.innerHeight - 48) newY = window.innerHeight - 48 - basePos.y;

    dialogX.value = newX;
    dialogY.value = newY;
  });
}

function onMinimizedDragEnd() {
  isMinimizedDragging.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  document.removeEventListener("mousemove", onMinimizedDragMove);
  document.removeEventListener("mouseup", onMinimizedDragEnd);

  savePositionToStorage();
}

// 最小化状态点击（只有没有拖拽时才展开）
function onMinimizedClick() {
  if (isMinimized.value && !minimizedDragMoved.value) {
    toggleMinimize();
  }
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

// 最小化/还原，根据当前位置决定最小化到哪个角落
function toggleMinimize() {
  if (!isMinimized.value) {
    // 计算当前位置应该最小化到哪个角落
    const rect = dialogRef.value?.getBoundingClientRect();
    if (rect) {
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const isLeft = centerX < viewWidth / 2;
      const isTop = centerY < viewHeight / 2;

      const margin = 20;
      const basePos = getBasePosition();

      if (isLeft && isTop) {
        dialogX.value = margin - basePos.x;
        dialogY.value = margin - basePos.y;
      } else if (!isLeft && isTop) {
        dialogX.value = viewWidth - 48 - margin - basePos.x;
        dialogY.value = margin - basePos.y;
      } else if (isLeft && !isTop) {
        dialogX.value = margin - basePos.x;
        dialogY.value = viewHeight - 48 - margin - basePos.y;
      } else {
        dialogX.value = viewWidth - 48 - margin - basePos.x;
        dialogY.value = viewHeight - 48 - margin - basePos.y;
      }
    }
  }

  isMinimized.value = !isMinimized.value;
  emit("minimize", isMinimized.value);
}

// 检查是否靠近边缘
function checkEdgeDock() {
  if (!props.enableEdgeDock) return;

  const basePos = getBasePosition();
  const actualX = basePos.x + dialogX.value;
  const actualY = basePos.y + dialogY.value;
  const boundary = getBoundaryRect();
  const threshold = props.edgeDockThreshold;

  const viewWidth = boundary ? boundary.width : window.innerWidth;
  const viewHeight = boundary ? boundary.height : window.innerHeight;
  const offsetX = boundary ? boundary.left : 0;
  const offsetY = boundary ? boundary.top : 0;

  // 检查各个边缘
  if (actualX - offsetX < threshold) {
    // 左边吸附
    dockToEdge("left");
  } else if (actualX + dialogWidth.value > offsetX + viewWidth - threshold) {
    // 右边吸附
    dockToEdge("right");
  } else if (actualY - offsetY < threshold) {
    // 上边吸附
    dockToEdge("top");
  } else if (actualY + dialogHeight.value > offsetY + viewHeight - threshold) {
    // 下边吸附
    dockToEdge("bottom");
  }
}

// 吸附到指定边缘
function dockToEdge(edge: "left" | "right" | "top" | "bottom") {
  // 保存吸附前的位置
  preDockedPosition.value = {
    x: dialogX.value,
    y: dialogY.value,
    width: dialogWidth.value,
    height: dialogHeight.value
  };

  isEdgeDocked.value = true;
  dockedEdge.value = edge;

  // 计算吸附位置（保持在当前轴上的位置）
  const basePos = getBasePosition();
  if (edge === "left" || edge === "right") {
    dialogY.value = basePos.y + dialogY.value;
  } else {
    dialogX.value = basePos.x + dialogX.value;
  }

  emit("edgeDock", true, edge);
}

// 切换靠边吸附状态
function toggleEdgeDock() {
  if (isEdgeDocked.value) {
    // 还原
    isEdgeDocked.value = false;
    dockedEdge.value = "";
    dialogX.value = preDockedPosition.value.x;
    dialogY.value = preDockedPosition.value.y;
    dialogWidth.value = preDockedPosition.value.width || props.width;
    dialogHeight.value = preDockedPosition.value.height || props.dialogHeight;
    emit("edgeDock", false, "");
  } else {
    // 手动吸附到最近的边缘
    const basePos = getBasePosition();
    const actualX = basePos.x + dialogX.value;
    const actualY = basePos.y + dialogY.value;
    const boundary = getBoundaryRect();

    const viewWidth = boundary ? boundary.width : window.innerWidth;
    const viewHeight = boundary ? boundary.height : window.innerHeight;
    const offsetX = boundary ? boundary.left : 0;
    const offsetY = boundary ? boundary.top : 0;

    // 计算到各边的距离
    const distLeft = actualX - offsetX;
    const distRight = offsetX + viewWidth - actualX - dialogWidth.value;
    const distTop = actualY - offsetY;
    const distBottom = offsetY + viewHeight - actualY - dialogHeight.value;

    // 找到最近的边
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    if (minDist === distLeft) dockToEdge("left");
    else if (minDist === distRight) dockToEdge("right");
    else if (minDist === distTop) dockToEdge("top");
    else dockToEdge("bottom");
  }
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
  },
  // 靠边吸附
  dockToEdge,
  // 切换靠边吸附
  toggleEdgeDock,
  // 是否已吸附
  isEdgeDocked,
  // 吸附的边缘
  dockedEdge
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

/* 最小化状态 - 只显示图标 */
.minimized {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  padding: 0 !important;
  overflow: hidden;
}

.minimized .dialog-content {
  display: none !important;
}

.minimized .dialog-header {
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  cursor: pointer;
}

.minimized .dialog-header {
  cursor: grab;
  user-select: none;
  will-change: transform;
}

.minimized .dialog-header:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

.minimized .dialog-header:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.minimized-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  pointer-events: none;
}

.minimized .resize-handle {
  display: none !important;
}

/* 靠边吸附状态 */
.edge-docked {
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.edge-docked:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.edge-docked .dialog-content,
.edge-docked .resize-handle {
  display: none !important;
}

/* 靠边吸附图标 */
.edge-dock-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  position: relative;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(14, 165, 233, 0.1));
}

.dock-progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.dock-progress-ring svg {
  width: 100%;
  height: 100%;
}

/* 边缘吸附样式已在 dialogStyle 中动态设置 */

/* 父元素内模式 */
.in-boundary {
  position: absolute;
}

/* Grid 吸附模式 */
.grid-snap {
  transition:
    left 0.1s ease,
    top 0.1s ease;
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
