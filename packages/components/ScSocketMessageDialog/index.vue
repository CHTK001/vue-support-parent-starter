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
 * 支持拖拽、缩放、吸附功能
 * 使用 interact.js 实现拖拽和缩放
 * @author CH
 * @version 2.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 集成 interact.js
 */
import { ref, computed, inject, onMounted, onUnmounted, watch, nextTick, type PropType } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useSocket } from "@repo/core";
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
const dialogRef = ref<HTMLElement | null>(null);

// interact.js 实例
let interactInstance: ReturnType<typeof interact> | null = null;

// 拖拽和缩放状态
const isDragging = ref(false);
const isResizing = ref(false);
const dialogX = ref(0);
const dialogY = ref(0);
const dialogWidth = ref(props.width);
const dialogHeight = ref(props.dialogHeight);

// 最小化拖拽相关
const isMinimizedDragging = ref(false);
const minimizedDragMoved = ref(false);

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

// 对话框样式（位置由 interact.js 的 transform 控制）
const dialogStyle = computed(() => ({
  width: `${dialogWidth.value}px`,
  height: isMinimized.value ? "auto" : `${dialogHeight.value}px`,
  touchAction: "none"
}));

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

/**
 * 初始化 interact.js 拖拽和缩放
 */
function initInteract(): void {
  if (!dialogRef.value || props.mode !== "dialog") return;

  // 销毁旧实例
  destroyInteract();

  // 设置初始位置
  const el = dialogRef.value;
  const margin = 20;
  let initX = 0;
  let initY = 0;

  switch (props.position) {
    case "top-left":
      initX = margin;
      initY = margin;
      break;
    case "top-right":
      initX = window.innerWidth - dialogWidth.value - margin;
      initY = margin;
      break;
    case "bottom-left":
      initX = margin;
      initY = window.innerHeight - dialogHeight.value - margin;
      break;
    case "bottom-right":
    default:
      initX = window.innerWidth - dialogWidth.value - margin;
      initY = window.innerHeight - dialogHeight.value - margin;
      break;
  }

  el.style.transform = `translate(${initX}px, ${initY}px)`;
  el.setAttribute("data-x", String(initX));
  el.setAttribute("data-y", String(initY));
  dialogX.value = initX;
  dialogY.value = initY;

  // 配置拖拽修改器
  const modifiers: unknown[] = [];

  // 网格吸附
  if (props.enableGridSnap) {
    modifiers.push(
      interact.modifiers.snap({
        targets: [interact.snappers.grid({ x: props.gridSize, y: props.gridSize })],
        range: Infinity,
        relativePoints: [{ x: 0, y: 0 }]
      })
    );
  }

  // 边界限制
  const boundary = props.boundaryElement || "body";
  modifiers.push(
    interact.modifiers.restrict({
      restriction: boundary,
      endOnly: false,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    })
  );

  // 创建实例
  interactInstance = interact(dialogRef.value)
    // 配置拖拽
    .draggable({
      allowFrom: ".dialog-header",
      inertia: {
        resistance: 15,
        minSpeed: 200,
        endSpeed: 10
      },
      modifiers,
      autoScroll: true,
      listeners: {
        start: () => {
          isDragging.value = true;
          minimizedDragMoved.value = false;
          // 阻止文字选择
          document.body.style.userSelect = "none";
        },
        move: event => {
          const target = event.target as HTMLElement;
          // 使用 data 属性存储位置
          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;

          // 更新元素位置
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));

          // 同步到响应式变量
          dialogX.value = x;
          dialogY.value = y;

          if (isMinimized.value) {
            minimizedDragMoved.value = true;
          }
        },
        end: () => {
          isDragging.value = false;
          isMinimizedDragging.value = false;
          // 恢复文字选择
          document.body.style.userSelect = "";

          // 检查边缘吸附
          if (props.enableEdgeDock && !isMinimized.value) {
            checkEdgeDock();
          }

          // 保存位置
          savePositionToStorage();
        }
      }
    })
    // 配置缩放
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      inertia: false,
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 280, height: 200 },
          max: { width: 800, height: 600 }
        })
      ],
      listeners: {
        start: () => {
          isResizing.value = true;
          document.body.style.userSelect = "none";
        },
        move: event => {
          const target = event.target as HTMLElement;
          const { width, height } = event.rect;
          const { left, top } = event.deltaRect;

          // 更新尺寸
          dialogWidth.value = width;
          dialogHeight.value = height;
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;

          // 更新位置（处理从左侧或顶部缩放）
          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + left;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + top;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));

          dialogX.value = x;
          dialogY.value = y;
        },
        end: () => {
          isResizing.value = false;
          document.body.style.userSelect = "";
          savePositionToStorage();
        }
      }
    });
}

/**
 * 销毁 interact.js 实例
 */
function destroyInteract(): void {
  if (interactInstance) {
    interactInstance.unset();
    interactInstance = null;
  }
}

/**
 * 拖拽开始（兼容原有接口）
 */
function onDragStart(e: MouseEvent): void {
  if (isMinimized.value) return;
  // interact.js 自动处理
}

/**
 * 最小化拖拽开始（兼容原有接口）
 */
function onMinimizedDragStart(e: MouseEvent): void {
  isMinimizedDragging.value = true;
  minimizedDragMoved.value = false;
  // interact.js 自动处理
}

/**
 * 最小化状态点击（只有没有拖拽时才展开）
 */
function onMinimizedClick(): void {
  if (isMinimized.value && !minimizedDragMoved.value) {
    toggleMinimize();
  }
}

/**
 * 对话框鼠标按下
 */
function onDialogMouseDown(e: MouseEvent): void {
  // interact.js 自动处理
}

/**
 * 缩放开始（兼容原有接口，实际由 interact.js 处理）
 */
function onResizeStart(e: MouseEvent, direction: string): void {
  // interact.js 自动处理缩放
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

  // 初始化 interact.js
  nextTick(() => {
    initInteract();
  });
});

// 组件卸载
onUnmounted(() => {
  removeSocketListener();
  destroyInteract();
});

// 监听属性变化
watch([() => props.eventId, () => props.dataType, () => props.eventName], () => {
  removeSocketListener();
  setupSocketListener();
});

// 监听模式变化，重新初始化 interact
watch(
  () => props.mode,
  () => {
    nextTick(() => {
      initInteract();
    });
  }
);

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
  border: 1px solid var(--el-border-color-lighter);
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
  color: var(--el-text-color-regular);
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
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
  padding: 8px;
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  padding: 3px 0;
  line-height: 1.5;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
  white-space: pre-wrap;
  word-break: break-all;
}

.log-time {
  color: var(--el-text-color-primary);
  margin-right: 8px;
}

.log-message {
  color: var(--el-text-color-regular);
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
  color: var(--el-color-danger);
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
