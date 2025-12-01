<template>
  <!-- 内嵌模式 -->
  <div v-if="mode === 'embed'" v-show="showProgress" class="sc-socket-event-process">
    <slot name="header" :data="progressData">
      <div class="process-header">
        <span class="process-title">{{ title }}</span>
        <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
      </div>
    </slot>

    <!-- 自定义布局slot -->
    <slot v-if="layout === 'custom'" :data="progressData" :logs="logs" :percentage="percentage" :status="status" />

    <!-- Process 布局 -->
    <ProcessLayout v-else-if="layout === 'process'" :percentage="percentage" :status="status" :message="message" :current-step="currentStep" />

    <!-- Log 布局 -->
    <LogLayout v-else-if="layout === 'log'" :logs="logs" :percentage="percentage" :status="status" :height="height" />
  </div>

  <!-- 弹框模式 -->
  <Teleport v-else-if="mode === 'dialog'" to="body">
    <div v-if="visible" ref="dialogRef" class="sc-socket-event-dialog" :class="[`position-${position}`, { minimized: isMinimized }]" :style="dialogStyle" @mousedown="onDialogMouseDown">
      <!-- 缩放手柄 -->
      <ResizeHandles :minimized="isMinimized" @resize-start="onResizeStart" />

      <!-- 头部 -->
      <div class="dialog-header" @mousedown="onDragStart">
        <slot name="header" :data="progressData">
          <div class="header-title">
            <IconifyIconOnline v-if="icon" :icon="icon" class="title-icon" />
            <span class="title-text">{{ title }}</span>
          </div>
        </slot>
        <div class="header-controls">
          <el-button type="text" size="small" class="control-btn" :title="isMinimized ? '还原' : '最小化'" @click.stop="toggleMinimize">
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
        <slot v-if="layout === 'custom'" :data="progressData" :logs="logs" :percentage="percentage" :status="status" />

        <!-- Process 布局 -->
        <template v-else-if="layout === 'process'">
          <div class="process-status">
            <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
          </div>
          <ProcessLayout :percentage="percentage" :status="status" :message="message" :current-step="currentStep" />
        </template>

        <!-- Log 布局 -->
        <LogLayout v-else-if="layout === 'log'" :logs="logs" :percentage="percentage" :status="status" :height="height" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type PropType } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ProcessLayout from "./components/ProcessLayout.vue";
import LogLayout from "./components/LogLayout.vue";
import ResizeHandles from "./components/ResizeHandles.vue";
import { useSocketProgress } from "./composables/useSocketProgress";
import { useDialogDrag } from "./composables/useDialogDrag";
import { useDialogResize } from "./composables/useDialogResize";
import { useLocalStorage } from "./composables/useLocalStorage";

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
  // 是否显示
  visible: {
    type: Boolean,
    default: true
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
  data: [data: any];
  minimize: [minimized: boolean];
}>();

// 使用组合式函数
const { percentage, status, message, currentStep, showProgress, logs, progressData, updateProgress, resetProgress, show, hide, addLog, clearLogs } = useSocketProgress({
  eventId: props.eventId,
  eventName: props.eventName,
  dataType: props.dataType,
  socketKey: props.socketKey,
  layout: props.layout,
  onData: data => emit("data", data)
});

// 弹框相关状态
const isMinimized = ref(false);
const dialogRef = ref<HTMLElement>();

// localStorage
const storage = useLocalStorage({
  storagePrefix: props.storagePrefix,
  eventId: props.eventId,
  enabled: props.mode === "dialog"
});

// 拖拽功能
const {
  isDragging,
  dialogX: dragX,
  dialogY: dragY,
  onDragStart
} = useDialogDrag({
  onDragEnd: savePositionToStorage
});

// 缩放功能
const {
  dialogWidth,
  dialogHeight,
  dialogX: resizeX,
  dialogY: resizeY,
  onResizeStart
} = useDialogResize({
  initialWidth: props.width,
  initialHeight: props.dialogHeight,
  onResizeEnd: savePositionToStorage
});

// 合并拖拽和缩放的位置
const dialogX = computed(() => dragX.value + resizeX.value);
const dialogY = computed(() => dragY.value + resizeY.value);

// 计算属性
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

const dialogStyle = computed(() => {
  const style: any = {
    width: `${dialogWidth.value}px`,
    height: isMinimized.value ? "auto" : `${dialogHeight.value}px`
  };

  if (isDragging.value || dialogX.value !== 0 || dialogY.value !== 0) {
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

// 防止点击对话框内容时触发拖拽
function onDialogMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains("dialog-header") || (e.target as HTMLElement).closest(".dialog-header")) {
    return;
  }
}

// 保存位置到localStorage
function savePositionToStorage() {
  storage.savePosition({
    x: dialogX.value,
    y: dialogY.value,
    width: dialogWidth.value,
    height: dialogHeight.value
  });
}

// 从localStorage加载位置
function loadPositionFromStorage() {
  const position = storage.loadPosition();
  if (position) {
    dragX.value = position.x;
    dragY.value = position.y;
    dialogWidth.value = position.width;
    dialogHeight.value = position.height;
  }
}

// 组件挂载时加载位置
onMounted(() => {
  if (props.mode === "dialog") {
    loadPositionFromStorage();
  }
});

// 暴露方法
defineExpose({
  updateProgress,
  resetProgress,
  show,
  hide,
  addLog,
  clearLogs
});
</script>

<style scoped src="./styles/index.css"></style>
