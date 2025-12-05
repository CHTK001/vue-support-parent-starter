<template>
  <div ref="panelRef" class="sc-panel" :class="panelClass" :style="panelStyle" @dblclick="handleDoubleClick">
    <!-- 头部 -->
    <div v-if="showHeader" class="sc-panel__header" :class="{ 'sc-panel__header--draggable': draggable }" @mousedown="startDrag">
      <!-- 折叠按钮 -->
      <div v-if="collapsible" class="sc-panel__collapse-btn" @click.stop="toggleCollapse">
        <IconifyIconOnline :icon="isCollapsed ? 'ep:arrow-right' : 'ep:arrow-down'" />
      </div>

      <!-- 标题 -->
      <div class="sc-panel__title">
        <IconifyIconOnline v-if="icon" :icon="icon" class="sc-panel__icon" />
        <span v-if="title">{{ title }}</span>
        <slot name="title" />
      </div>

      <!-- 操作区 -->
      <div class="sc-panel__actions">
        <slot name="actions" />
        <!-- 最大化按钮 -->
        <div v-if="maximizable" class="sc-panel__action-btn" @click.stop="toggleMaximize">
          <IconifyIconOnline :icon="isMaximized ? 'ep:copy-document' : 'ep:full-screen'" />
        </div>
        <!-- 关闭按钮 -->
        <div v-if="closable" class="sc-panel__action-btn" @click.stop="handleClose">
          <IconifyIconOnline icon="ep:close" />
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <el-collapse-transition>
      <div v-show="!isCollapsed" class="sc-panel__body" :style="bodyStyle">
        <slot />
      </div>
    </el-collapse-transition>

    <!-- 底部 -->
    <div v-if="$slots.footer && !isCollapsed" class="sc-panel__footer">
      <slot name="footer" />
    </div>

    <!-- 调整大小手柄 -->
    <template v-if="resizable && !isMaximized && !isCollapsed">
      <div class="sc-panel__resize-handle sc-panel__resize-handle--e" @mousedown="startResize($event, 'e')" />
      <div class="sc-panel__resize-handle sc-panel__resize-handle--s" @mousedown="startResize($event, 's')" />
      <div class="sc-panel__resize-handle sc-panel__resize-handle--se" @mousedown="startResize($event, 'se')" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * ScPanel 面板组件
 * 支持拖拽、折叠、最大化、可调整大小等功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-02
 * @since 2025-12-05 重构：更名为 ScPanel，添加拖拽、折叠、最大化功能
 */
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

defineOptions({
  name: "ScPanel"
});

const props = withDefaults(
  defineProps<{
    /** 面板标题 */
    title?: string;
    /** 面板图标 */
    icon?: string;
    /** 是否显示头部 */
    showHeader?: boolean;
    /** 是否可拖拽 */
    draggable?: boolean;
    /** 是否可调整大小 */
    resizable?: boolean;
    /** 是否可折叠 */
    collapsible?: boolean;
    /** 是否折叠（v-model） */
    collapsed?: boolean;
    /** 是否可最大化 */
    maximizable?: boolean;
    /** 是否最大化（v-model） */
    maximized?: boolean;
    /** 是否可关闭 */
    closable?: boolean;
    /** 宽度 */
    width?: string | number;
    /** 高度 */
    height?: string | number;
    /** 最小宽度 */
    minWidth?: number;
    /** 最小高度 */
    minHeight?: number;
    /** 最大宽度 */
    maxWidth?: number;
    /** 最大高度 */
    maxHeight?: number;
    /** 初始位置 X */
    x?: number;
    /** 初始位置 Y */
    y?: number;
    /** 是否有边框 */
    border?: boolean;
    /** 是否有阴影 */
    shadow?: boolean;
    /** 是否圆角 */
    rounded?: boolean;
    /** 内边距 */
    padding?: string | number;
    /** 主题类型 */
    type?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  }>(),
  {
    showHeader: true,
    draggable: false,
    resizable: false,
    collapsible: false,
    collapsed: false,
    maximizable: false,
    maximized: false,
    closable: false,
    width: "auto",
    height: "auto",
    minWidth: 200,
    minHeight: 100,
    border: true,
    shadow: true,
    rounded: true,
    padding: 16,
    type: "default"
  }
);

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
  "update:maximized": [value: boolean];
  resize: [width: number, height: number];
  drag: [x: number, y: number];
  close: [];
  collapse: [collapsed: boolean];
  maximize: [maximized: boolean];
}>();

// ==================== 状态 ====================
const panelRef = ref<HTMLElement | null>(null);
const isCollapsed = ref(props.collapsed);
const isMaximized = ref(props.maximized);
const currentWidth = ref<number>(0);
const currentHeight = ref<number>(0);
const currentX = ref<number>(props.x || 0);
const currentY = ref<number>(props.y || 0);

// 保存最大化前的状态
const preMaximizeState = ref<{ width: number; height: number; x: number; y: number } | null>(null);

// 拖拽状态
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPosX = 0;
let dragStartPosY = 0;

// 调整大小状态
let isResizing = false;
let resizeDirection = "";
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;

// ==================== 计算属性 ====================

/**
 * 面板样式类
 */
const panelClass = computed(() => ({
  "sc-panel--draggable": props.draggable,
  "sc-panel--collapsed": isCollapsed.value,
  "sc-panel--maximized": isMaximized.value,
  "sc-panel--border": props.border,
  "sc-panel--shadow": props.shadow,
  "sc-panel--rounded": props.rounded,
  [`sc-panel--${props.type}`]: props.type !== "default"
}));

/**
 * 面板样式
 */
const panelStyle = computed(() => {
  if (isMaximized.value) {
    return {
      position: "fixed" as const,
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      width: "100vw",
      height: "100vh",
      zIndex: 2000
    };
  }

  const style: Record<string, string> = {};

  // 宽度
  if (currentWidth.value) {
    style.width = `${currentWidth.value}px`;
  } else if (props.width !== "auto") {
    style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
  }

  // 高度
  if (currentHeight.value && !isCollapsed.value) {
    style.height = `${currentHeight.value}px`;
  } else if (props.height !== "auto" && !isCollapsed.value) {
    style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
  }

  // 位置（拖拽模式）
  if (props.draggable && (currentX.value || currentY.value)) {
    style.position = "absolute";
    style.left = `${currentX.value}px`;
    style.top = `${currentY.value}px`;
  }

  return style;
});

/**
 * 内容区样式
 */
const bodyStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.padding) {
    style.padding = typeof props.padding === "number" ? `${props.padding}px` : props.padding;
  }

  return style;
});

// ==================== 方法 ====================

/**
 * 切换折叠状态
 */
function toggleCollapse(): void {
  isCollapsed.value = !isCollapsed.value;
  emit("update:collapsed", isCollapsed.value);
  emit("collapse", isCollapsed.value);
}

/**
 * 切换最大化状态
 */
function toggleMaximize(): void {
  if (isMaximized.value) {
    // 还原
    if (preMaximizeState.value) {
      currentWidth.value = preMaximizeState.value.width;
      currentHeight.value = preMaximizeState.value.height;
      currentX.value = preMaximizeState.value.x;
      currentY.value = preMaximizeState.value.y;
    }
    isMaximized.value = false;
  } else {
    // 保存当前状态并最大化
    preMaximizeState.value = {
      width: currentWidth.value || panelRef.value?.offsetWidth || 0,
      height: currentHeight.value || panelRef.value?.offsetHeight || 0,
      x: currentX.value,
      y: currentY.value
    };
    isMaximized.value = true;
  }
  emit("update:maximized", isMaximized.value);
  emit("maximize", isMaximized.value);
}

/**
 * 双击处理（可拖拽时双击最大化）
 */
function handleDoubleClick(event: MouseEvent): void {
  // 只有在可拖拽且可最大化时，双击头部才触发最大化
  if (props.draggable && props.maximizable) {
    const target = event.target as HTMLElement;
    if (target.closest(".sc-panel__header")) {
      toggleMaximize();
    }
  }
}

/**
 * 关闭面板
 */
function handleClose(): void {
  emit("close");
}

/**
 * 开始拖拽
 */
function startDrag(event: MouseEvent): void {
  if (!props.draggable || isMaximized.value) return;

  // 排除按钮点击
  if ((event.target as HTMLElement).closest(".sc-panel__action-btn, .sc-panel__collapse-btn")) {
    return;
  }

  event.preventDefault();
  isDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragStartPosX = currentX.value;
  dragStartPosY = currentY.value;

  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
  document.body.style.cursor = "move";
  document.body.style.userSelect = "none";
}

/**
 * 处理拖拽
 */
function handleDrag(event: MouseEvent): void {
  if (!isDragging) return;

  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;

  currentX.value = dragStartPosX + deltaX;
  currentY.value = dragStartPosY + deltaY;

  emit("drag", currentX.value, currentY.value);
}

/**
 * 停止拖拽
 */
function stopDrag(): void {
  isDragging = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

/**
 * 开始调整大小
 */
function startResize(event: MouseEvent, direction: string): void {
  if (!props.resizable || isMaximized.value) return;

  event.preventDefault();
  event.stopPropagation();

  isResizing = true;
  resizeDirection = direction;
  resizeStartX = event.clientX;
  resizeStartY = event.clientY;
  resizeStartWidth = currentWidth.value || panelRef.value?.offsetWidth || 0;
  resizeStartHeight = currentHeight.value || panelRef.value?.offsetHeight || 0;

  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
  document.body.style.userSelect = "none";

  // 设置鼠标样式
  if (direction === "e") {
    document.body.style.cursor = "ew-resize";
  } else if (direction === "s") {
    document.body.style.cursor = "ns-resize";
  } else {
    document.body.style.cursor = "nwse-resize";
  }
}

/**
 * 处理调整大小
 */
function handleResize(event: MouseEvent): void {
  if (!isResizing) return;

  const deltaX = event.clientX - resizeStartX;
  const deltaY = event.clientY - resizeStartY;

  let newWidth = resizeStartWidth;
  let newHeight = resizeStartHeight;

  if (resizeDirection.includes("e")) {
    newWidth = resizeStartWidth + deltaX;
  }
  if (resizeDirection.includes("s")) {
    newHeight = resizeStartHeight + deltaY;
  }

  // 应用最小最大限制
  newWidth = Math.max(props.minWidth, newWidth);
  newHeight = Math.max(props.minHeight, newHeight);

  if (props.maxWidth) {
    newWidth = Math.min(props.maxWidth, newWidth);
  }
  if (props.maxHeight) {
    newHeight = Math.min(props.maxHeight, newHeight);
  }

  currentWidth.value = newWidth;
  currentHeight.value = newHeight;

  emit("resize", newWidth, newHeight);
}

/**
 * 停止调整大小
 */
function stopResize(): void {
  isResizing = false;
  resizeDirection = "";
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

/**
 * 设置位置
 */
function setPosition(x: number, y: number): void {
  currentX.value = x;
  currentY.value = y;
}

/**
 * 设置大小
 */
function setSize(width: number, height: number): void {
  currentWidth.value = width;
  currentHeight.value = height;
}

/**
 * 展开
 */
function expand(): void {
  isCollapsed.value = false;
  emit("update:collapsed", false);
  emit("collapse", false);
}

/**
 * 折叠
 */
function collapse(): void {
  isCollapsed.value = true;
  emit("update:collapsed", true);
  emit("collapse", true);
}

/**
 * 最大化
 */
function maximize(): void {
  if (!isMaximized.value) {
    toggleMaximize();
  }
}

/**
 * 还原
 */
function restore(): void {
  if (isMaximized.value) {
    toggleMaximize();
  }
}

// ==================== 监听 ====================

watch(
  () => props.collapsed,
  val => {
    isCollapsed.value = val;
  }
);

watch(
  () => props.maximized,
  val => {
    isMaximized.value = val;
  }
);

// ==================== 生命周期 ====================

onMounted(() => {
  // 初始化大小
  if (panelRef.value) {
    if (!currentWidth.value && props.width === "auto") {
      currentWidth.value = panelRef.value.offsetWidth;
    }
    if (!currentHeight.value && props.height === "auto") {
      currentHeight.value = panelRef.value.offsetHeight;
    }
  }
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
});

// 暴露方法
defineExpose({
  toggleCollapse,
  toggleMaximize,
  setPosition,
  setSize,
  expand,
  collapse,
  maximize,
  restore
});
</script>

<style lang="scss" scoped>
.sc-panel {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  overflow: hidden;

  &--border {
    border: 1px solid var(--el-border-color-lighter);
  }

  &--shadow {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  &--rounded {
    border-radius: 8px;
  }

  &--maximized {
    border-radius: 0 !important;
  }

  // 类型样式
  &--primary {
    .sc-panel__header {
      background: var(--el-color-primary-light-9);
      border-bottom-color: var(--el-color-primary-light-7);
    }
  }

  &--success {
    .sc-panel__header {
      background: var(--el-color-success-light-9);
      border-bottom-color: var(--el-color-success-light-7);
    }
  }

  &--warning {
    .sc-panel__header {
      background: var(--el-color-warning-light-9);
      border-bottom-color: var(--el-color-warning-light-7);
    }
  }

  &--danger {
    .sc-panel__header {
      background: var(--el-color-danger-light-9);
      border-bottom-color: var(--el-color-danger-light-7);
    }
  }

  &--info {
    .sc-panel__header {
      background: var(--el-color-info-light-9);
      border-bottom-color: var(--el-color-info-light-7);
    }
  }

  // 头部
  &__header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;

    &--draggable {
      cursor: move;
    }
  }

  &__collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: 8px;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    transition: all 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__icon {
    margin-right: 8px;
    font-size: 16px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
      color: var(--el-color-primary);
    }
  }

  // 内容区
  &__body {
    flex: 1;
    overflow: auto;
  }

  // 底部
  &__footer {
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
    flex-shrink: 0;
  }

  // 调整大小手柄
  &__resize-handle {
    position: absolute;
    z-index: 10;

    &--e {
      right: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      cursor: ew-resize;
    }

    &--s {
      left: 0;
      right: 0;
      bottom: 0;
      height: 6px;
      cursor: ns-resize;
    }

    &--se {
      right: 0;
      bottom: 0;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;

      &::after {
        content: "";
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 8px;
        height: 8px;
        border-right: 2px solid var(--el-border-color);
        border-bottom: 2px solid var(--el-border-color);
      }
    }
  }
}

// 深色模式
html.dark {
  .sc-panel {
    &--shadow {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
