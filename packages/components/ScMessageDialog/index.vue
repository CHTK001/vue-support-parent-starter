<template>
  <div
    v-if="isVisible"
    ref="dialogRef"
    class="sc-message-dialog"
    :class="{
      expanded: isExpanded,
      minimized: isMinimized,
      'edge-docked': isEdgeDocked,
      'edge-left': dockedEdge === 'left',
      'edge-right': dockedEdge === 'right',
      'edge-top': dockedEdge === 'top',
      'edge-bottom': dockedEdge === 'bottom',
      'in-boundary': !!boundaryElement,
      'grid-snap': enableGridSnap
    }"
    :style="computedStyle"
    @mousedown="onDialogMouseDown"
  >
    <!-- 靠边吸附状态显示 -->
    <div v-if="isEdgeDocked" class="edge-dock-icon" @click="toggleEdgeDock" :title="'点击展开'">
      <IconifyIconOnline :icon="icon" width="24" />
      <el-badge :value="activeCount" :hidden="activeCount === 0" type="primary" class="dock-badge" />
    </div>

    <!-- 折叠状态显示（只显示图标） -->
    <div v-else-if="isMinimized" class="monitor-badge" :style="badgeStyle" @click="toggleExpand" :title="title">
      <el-badge :value="activeCount" :hidden="activeCount === 0" type="primary">
        <div class="badge-icon">
          <slot name="icon">
            <IconifyIconOnline :icon="icon" />
          </slot>
        </div>
      </el-badge>
    </div>

    <!-- 展开状态 -->
    <div v-else class="monitor-panel" :style="panelStyle">
      <div class="panel-header" :style="headerStyle" @mousedown="onDragStart">
        <div class="header-title">
          <slot name="icon">
            <IconifyIconOnline :icon="icon" class="mr-2" />
          </slot>
          {{ title }}
          <el-badge :value="activeCount" :hidden="activeCount === 0" type="primary" class="ml-2" />
        </div>
        <div class="header-actions">
          <el-button v-if="enableEdgeDock" size="small" circle @click.stop="toggleEdgeDock" :title="isEdgeDocked ? '展开' : '靠边吸附'">
            <IconifyIconOnline :icon="isEdgeDocked ? 'ri:side-bar-fill' : 'ri:side-bar-line'" />
          </el-button>
          <el-button size="small" circle @click.stop="handleClear" :disabled="completedCount === 0" title="清除已完成">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </el-button>
          <el-button size="small" circle @click.stop="toggleMinimize" title="最小化">
            <IconifyIconOnline icon="ri:subtract-line" />
          </el-button>
          <el-button size="small" circle @click.stop="handleClose" title="关闭">
            <IconifyIconOnline icon="ri:close-line" />
          </el-button>
        </div>
      </div>

      <div class="panel-content">
        <!-- 自定义内容插槽 -->
        <slot name="content">
          <div v-if="operations.length === 0" class="empty-state">
            <!-- 空状态插槽 -->
            <slot name="empty">
              <IconifyIconOnline icon="ri:inbox-line" class="empty-icon" />
              <p>{{ emptyText }}</p>
            </slot>
          </div>

          <div v-else class="operation-list">
            <div v-for="op in operations" :key="op.id" class="operation-item" :class="[op.status, { 'has-error': op.error }]">
              <!-- 操作项插槽 -->
              <slot name="item" :operation="op">
                <div class="operation-icon">
                  <slot name="item-icon" :operation="op">
                    <IconifyIconOnline :icon="getOperationIcon(op.type)" />
                  </slot>
                </div>
                <div class="operation-info">
                  <div class="operation-title">{{ op.title }}</div>
                  <div class="operation-desc">{{ op.description }}</div>
                  <div v-if="op.status === 'running'" class="operation-progress">
                    <el-progress :percentage="op.progress || 0" :stroke-width="4" :show-text="false" status="primary" />
                    <span class="progress-text">{{ op.progress || 0 }}%</span>
                  </div>
                  <div v-if="op.error" class="operation-error">{{ op.error }}</div>
                </div>
                <div class="operation-status">
                  <slot name="item-status" :operation="op">
                    <el-tag :type="getStatusType(op.status)" size="small">
                      {{ getStatusText(op.status) }}
                    </el-tag>
                  </slot>
                </div>
              </slot>
            </div>
          </div>
        </slot>
      </div>

      <!-- 底部操作区插槽 -->
      <div v-if="$slots.footer" class="panel-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, CSSProperties, PropType } from "vue";

/**
 * 消息对话框组件
 * 支持四角定位、自定义偏移量、主题色配置
 * 用于显示操作进度、消息通知等
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

// 操作状态类型
export type OperationStatus = "pending" | "running" | "completed" | "failed";

// 位置类型
export type PositionType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// 操作记录接口
export interface Operation {
  /** 唯一标识 */
  id: string;
  /** 操作类型 */
  type: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 状态 */
  status: OperationStatus;
  /** 进度(0-100) */
  progress?: number;
  /** 错误信息 */
  error?: string;
  /** 创建时间 */
  createdAt?: number;
  /** 更新时间 */
  updatedAt?: number;
}

// 组件属性
interface Props {
  /** 标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** 位置：四个角 */
  position?: PositionType;
  /** 水平偏移量(px) */
  offsetX?: number;
  /** 垂直偏移量(px) */
  offsetY?: number;
  /** 主题色 */
  themeColor?: string;
  /** 操作列表 */
  operations?: Operation[];
  /** 空状态文本 */
  emptyText?: string;
  /** 图标映射 */
  iconMap?: Record<string, string>;
  /** 状态文本映射 */
  statusTextMap?: Record<string, string>;
  /** 是否启用靠边吸附最小化 */
  enableEdgeDock?: boolean;
  /** 吸附边缘的阈值（距离边缘多少像素时自动吸附） */
  edgeDockThreshold?: number;
  /** 父元素选择器（限制在父元素内移动） */
  boundaryElement?: string | HTMLElement | null;
  /** 是否启用 grid 方式移动 */
  enableGridSnap?: boolean;
  /** grid 单元格大小 */
  gridSize?: number;
  /** 吸附图标大小 */
  dockIconSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "操作监控",
  icon: "ri:terminal-box-line",
  position: "bottom-right",
  offsetX: 20,
  offsetY: 20,
  themeColor: "#3b82f6",
  operations: () => [],
  emptyText: "暂无操作",
  iconMap: () => ({}),
  statusTextMap: () => ({
    pending: "等待中",
    running: "进行中",
    completed: "已完成",
    failed: "失败"
  }),
  enableEdgeDock: false,
  edgeDockThreshold: 50,
  boundaryElement: null,
  enableGridSnap: false,
  gridSize: 20,
  dockIconSize: 48
});

// 事件
const emit = defineEmits<{
  (e: "clear"): void;
  (e: "expand", expanded: boolean): void;
  (e: "edgeDock", docked: boolean, edge: string): void;
  (e: "close"): void;
}>();

// 是否显示组件
const isVisible = ref(true);

const dialogRef = ref<HTMLElement>();
const isExpanded = ref(false);
const isMinimized = ref(true);

// 拖拽相关
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dialogX = ref(0);
const dialogY = ref(0);

// 靠边吸附相关
const isEdgeDocked = ref(false);
const dockedEdge = ref<"left" | "right" | "top" | "bottom" | "">("");
const preDockedPosition = ref({ x: 0, y: 0 });

// 计算属性：活跃操作数量
const activeCount = computed(() => props.operations.filter(op => op.status === "pending" || op.status === "running").length);

// 计算属性：已完成操作数量
const completedCount = computed(() => props.operations.filter(op => op.status === "completed" || op.status === "failed").length);

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

// 计算位置样式
const computedStyle = computed<CSSProperties>(() => {
  // 靠边吸附模式
  if (isEdgeDocked.value) {
    const style: CSSProperties = {
      position: props.boundaryElement ? "absolute" : "fixed",
      zIndex: 2000,
      width: `${props.dockIconSize}px`,
      height: `${props.dockIconSize}px`,
      borderRadius: "50%"
    };

    // 吸附到实际边缘位置
    const boundary = getBoundaryRect();
    const viewWidth = boundary ? boundary.width : window.innerWidth;
    const viewHeight = boundary ? boundary.height : window.innerHeight;
    const halfIconSize = props.dockIconSize / 2;

    switch (dockedEdge.value) {
      case "left":
        style.left = "0px";
        style.top = `${Math.min(Math.max(dialogY.value, 0), viewHeight - props.dockIconSize)}px`;
        style.borderRadius = "0 50% 50% 0";
        break;
      case "right":
        style.right = "0px";
        style.top = `${Math.min(Math.max(dialogY.value, 0), viewHeight - props.dockIconSize)}px`;
        style.borderRadius = "50% 0 0 50%";
        break;
      case "top":
        style.top = "0px";
        style.left = `${Math.min(Math.max(dialogX.value, 0), viewWidth - props.dockIconSize)}px`;
        style.borderRadius = "0 0 50% 50%";
        break;
      case "bottom":
        style.bottom = "0px";
        style.left = `${Math.min(Math.max(dialogX.value, 0), viewWidth - props.dockIconSize)}px`;
        style.borderRadius = "50% 50% 0 0";
        break;
    }

    return style;
  }

  const style: CSSProperties = {
    position: props.boundaryElement ? "absolute" : "fixed",
    zIndex: 2000
  };

  // 如果有拖拽偏移，使用绝对定位
  if (dialogX.value !== 0 || dialogY.value !== 0) {
    let x = dialogX.value;
    let y = dialogY.value;

    // Grid 吸附
    if (props.enableGridSnap) {
      x = Math.round(x / props.gridSize) * props.gridSize;
      y = Math.round(y / props.gridSize) * props.gridSize;
    }

    style.left = `${x}px`;
    style.top = `${y}px`;
    return style;
  }

  // 默认位置
  switch (props.position) {
    case "top-left":
      style.top = `${props.offsetY}px`;
      style.left = `${props.offsetX}px`;
      break;
    case "top-right":
      style.top = `${props.offsetY}px`;
      style.right = `${props.offsetX}px`;
      break;
    case "bottom-left":
      style.bottom = `${props.offsetY}px`;
      style.left = `${props.offsetX}px`;
      break;
    case "bottom-right":
    default:
      style.bottom = `${props.offsetY}px`;
      style.right = `${props.offsetX}px`;
      break;
  }

  return style;
});

// 徽章样式
const badgeStyle = computed<CSSProperties>(() => ({
  background: `linear-gradient(135deg, ${props.themeColor} 0%, ${adjustColor(props.themeColor, -20)} 100%)`,
  boxShadow: `0 4px 12px ${hexToRgba(props.themeColor, 0.3)}`
}));

// 面板样式
const panelStyle = computed<CSSProperties>(() => ({}));

// 头部样式
const headerStyle = computed<CSSProperties>(() => ({
  background: `linear-gradient(135deg, ${props.themeColor} 0%, ${adjustColor(props.themeColor, -20)} 100%)`
}));

/**
 * 切换展开/折叠
 */
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  isMinimized.value = !isExpanded.value;
  emit("expand", isExpanded.value);
};

/**
 * 关闭（销毁）
 */
const handleClose = () => {
  isVisible.value = false;
  isExpanded.value = false;
  isMinimized.value = true;
  emit("close");
};

/**
 * 显示组件
 */
const show = () => {
  isVisible.value = true;
  isExpanded.value = true;
  isMinimized.value = false;
};

/**
 * 切换最小化
 */
const toggleMinimize = () => {
  isMinimized.value = true;
  isExpanded.value = false;
  emit("expand", false);
};

// 拖拽相关函数
function onDragStart(e: MouseEvent) {
  if (isMinimized.value || isEdgeDocked.value) return;

  isDragging.value = true;

  // 计算初始位置
  const rect = dialogRef.value?.getBoundingClientRect();
  if (rect) {
    if (dialogX.value === 0 && dialogY.value === 0) {
      dialogX.value = rect.left;
      dialogY.value = rect.top;
    }
  }

  dragStartX.value = e.clientX - dialogX.value;
  dragStartY.value = e.clientY - dialogY.value;

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return;

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
    const panelWidth = 380;
    const panelHeight = 480;

    newX = Math.max(boundary.left, Math.min(newX, boundary.right - panelWidth));
    newY = Math.max(boundary.top, Math.min(newY, boundary.bottom - panelHeight));
  }

  dialogX.value = newX;
  dialogY.value = newY;
}

function onDragEnd() {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);

  // 检查是否需要靠边吸附
  if (props.enableEdgeDock) {
    checkEdgeDock();
  }
}

function onDialogMouseDown(e: MouseEvent) {
  // 防止点击对话框内容时触发拖拽
}

// 检查是否靠近边缘
function checkEdgeDock() {
  if (!props.enableEdgeDock) return;

  const threshold = props.edgeDockThreshold;
  const boundary = getBoundaryRect();

  const viewWidth = boundary ? boundary.width : window.innerWidth;
  const viewHeight = boundary ? boundary.height : window.innerHeight;
  const offsetX = boundary ? boundary.left : 0;
  const offsetY = boundary ? boundary.top : 0;

  // 检查各个边缘
  if (dialogX.value - offsetX < threshold) {
    dockToEdge("left");
  } else if (dialogX.value + 380 > offsetX + viewWidth - threshold) {
    dockToEdge("right");
  } else if (dialogY.value - offsetY < threshold) {
    dockToEdge("top");
  } else if (dialogY.value + 480 > offsetY + viewHeight - threshold) {
    dockToEdge("bottom");
  }
}

// 吸附到指定边缘
function dockToEdge(edge: "left" | "right" | "top" | "bottom") {
  preDockedPosition.value = { x: dialogX.value, y: dialogY.value };

  isEdgeDocked.value = true;
  dockedEdge.value = edge;

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
    isMinimized.value = false;
    isExpanded.value = true;
    emit("edgeDock", false, "");
  } else {
    // 手动吸附到最近的边缘
    const boundary = getBoundaryRect();
    const viewWidth = boundary ? boundary.width : window.innerWidth;
    const viewHeight = boundary ? boundary.height : window.innerHeight;
    const offsetX = boundary ? boundary.left : 0;
    const offsetY = boundary ? boundary.top : 0;

    const distLeft = dialogX.value - offsetX;
    const distRight = offsetX + viewWidth - dialogX.value - 380;
    const distTop = dialogY.value - offsetY;
    const distBottom = offsetY + viewHeight - dialogY.value - 480;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    if (minDist === distLeft) dockToEdge("left");
    else if (minDist === distRight) dockToEdge("right");
    else if (minDist === distTop) dockToEdge("top");
    else dockToEdge("bottom");
  }
}

/**
 * 清除已完成
 */
const handleClear = () => {
  emit("clear");
};

/**
 * 获取操作图标
 * @param type 操作类型
 * @returns 图标名称
 */
const getOperationIcon = (type: string): string => {
  const defaultIcons: Record<string, string> = {
    upload: "ri:upload-cloud-line",
    download: "ri:download-cloud-line",
    pull: "ri:download-cloud-line",
    push: "ri:upload-cloud-line",
    build: "ri:hammer-line",
    create: "ri:add-circle-line",
    start: "ri:play-circle-line",
    stop: "ri:stop-circle-line",
    restart: "ri:restart-line",
    remove: "ri:delete-bin-line",
    export: "ri:export-line",
    import: "ri:import-line"
  };
  return props.iconMap[type] || defaultIcons[type] || "ri:terminal-box-line";
};

/**
 * 获取状态类型
 * @param status 状态
 * @returns Element Plus Tag类型
 */
const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: "info",
    running: "primary",
    completed: "success",
    failed: "danger"
  };
  return typeMap[status] || "info";
};

/**
 * 获取状态文本
 * @param status 状态
 * @returns 状态文本
 */
const getStatusText = (status: string): string => {
  return props.statusTextMap[status] || status;
};

/**
 * 颜色调整工具函数
 * @param hex 十六进制颜色
 * @param amount 调整量
 * @returns 调整后的颜色
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * 十六进制转RGBA
 * @param hex 十六进制颜色
 * @param alpha 透明度
 * @returns RGBA颜色字符串
 */
function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 暴露方法
defineExpose({
  toggleExpand,
  toggleMinimize,
  handleClear,
  handleClose,
  show,
  toggleEdgeDock,
  dockToEdge,
  isEdgeDocked,
  dockedEdge,
  isVisible
});
</script>

<style scoped lang="scss">
.sc-message-dialog {
  // 位置样式通过计算属性动态设置

  // 靠边吸附状态
  &.edge-docked {
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.in-boundary {
    position: absolute;
  }

  &.grid-snap {
    transition:
      left 0.1s ease,
      top 0.1s ease;
  }
}

.edge-dock-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;

  .dock-badge {
    position: absolute;
    top: -4px;
    right: -4px;
  }
}

.monitor-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .badge-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
  }
}

.monitor-panel {
  width: 380px;
  max-height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    color: white;

    .header-title {
      display: flex;
      align-items: center;
      font-size: 15px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 4px;

      .el-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .panel-footer {
    padding: 12px 16px;
    background: #fafafa;
    border-top: 1px solid #ebeef5;
    display: flex;
    gap: 8px;
    justify-content: center;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
  }
}

.operation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.operation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 3px solid #e2e8f0;
  transition: all 0.3s ease;

  &.running {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  &.completed {
    border-left-color: #10b981;
    background: #ecfdf5;
  }

  &.failed {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  .operation-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #64748b;
    flex-shrink: 0;
  }

  .operation-info {
    flex: 1;
    min-width: 0;

    .operation-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .operation-desc {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .operation-progress {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-progress {
        flex: 1;
      }

      .progress-text {
        font-size: 11px;
        color: #64748b;
        min-width: 36px;
      }
    }

    .operation-error {
      font-size: 11px;
      color: #ef4444;
      margin-top: 4px;
    }
  }

  .operation-status {
    flex-shrink: 0;
  }
}
</style>
