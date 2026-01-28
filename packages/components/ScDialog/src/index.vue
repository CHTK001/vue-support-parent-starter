<template>
  <!-- ElementPlus 原生模式 -->
  <el-dialog
    v-if="mode === 'element'"
    v-model="dialogVisible"
    :title="iconMode === 'inline' && icon ? undefined : title"
    :width="width"
    :top="top"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :draggable="draggable"
    :center="center"
    :destroy-on-close="destroyOnClose"
    :class="['sc-dialog', `sc-dialog--${type}`, { 'has-float-icon': icon && iconMode === 'float' }]"
    @open="$emit('open')"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <!-- 浮动图标（float 模式） -->
    <template #header>
      <div v-if="icon && iconMode === 'float'" class="sc-dialog__float-icon" :style="floatIconStyle">
        <component :is="iconComponentName" :icon="icon" :style="{ fontSize: `${iconSize}px`, color: '#fff' }" />
      </div>
      <slot v-if="$slots.header" name="header" />
      <template v-else>
        <!-- 内联图标模式 -->
        <div v-if="icon && iconMode === 'inline'" class="sc-dialog__header-content">
          <component :is="iconComponentName" :icon="icon" class="sc-dialog__inline-icon" :style="{ fontSize: `${iconSize}px`, color: iconColor || typeColor }" />
          <span class="sc-dialog__title">{{ title }}</span>
        </div>
        <!-- 无图标时显示默认标题 -->
        <span v-else class="el-dialog__title">{{ title }}</span>
      </template>
    </template>

    <slot />

    <template v-if="showFooter" #footer>
      <slot name="footer">
        <el-button v-if="showCancelButton" @click="handleCancel">
          {{ cancelText }}
        </el-button>
        <el-button v-if="showConfirmButton" type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>

  <!-- 自定义模式（使用 interact.js） -->
  <template v-else>
    <Teleport to="body">
      <!-- 最小化图标 -->
      <Transition name="dock-fade">
        <div
          v-if="dialogVisible && isMinimized"
          ref="minimizedIconRef"
          class="sc-dialog-dock-icon"
          :class="[
            `sc-dialog-dock-icon--${dockPosition || 'bottom'}`,
            `sc-dialog-dock-icon--${type}`,
            { 'is-dragging': isMinimizedDragging, 'show-title': minimizeShowTitle && dockPosition === 'bottom' }
          ]"
          :style="minimizedIconStyle"
          :title="title"
          @click="handleMinimizedIconClick"
        >
          <IconifyIconOnline :icon="actualMinimizeIcon" />
          <span v-if="minimizeShowTitle && dockPosition === 'bottom'" class="sc-dialog-dock-icon__title">{{ title }}</span>
        </div>
      </Transition>

      <!-- 对齐辅助线 -->
      <div v-if="showAlignGuides && (isDragging || isResizing)" ref="alignGuidesRef" class="sc-dialog-align-guides">
        <div v-for="(x, i) in alignGuides.vertical" :key="'v-' + i" class="sc-dialog-align-guide sc-dialog-align-guide--vertical" :style="{ left: x + 'px' }" />
        <div v-for="(y, i) in alignGuides.horizontal" :key="'h-' + i" class="sc-dialog-align-guide sc-dialog-align-guide--horizontal" :style="{ top: y + 'px' }" />
      </div>

      <!-- 对话框主体 -->
      <Transition :name="minimizeTransitionName" @after-leave="handleAfterLeave">
        <div
          v-if="dialogVisible && !isMinimized"
          class="sc-dialog-overlay"
          :class="{ 'has-modal': modal && !useTaskbar, 'is-taskbar-mode': useTaskbar }"
          :style="{ zIndex: currentZIndex }"
          @click.self="handleOverlayClick"
        >
          <div
            ref="dialogRef"
            :id="internalDialogId"
            class="sc-dialog sc-dialog--custom"
            :class="[
              `sc-dialog--${type}`,
              theme ? `sc-dialog--theme-${theme}` : '',
              {
                'is-dragging': isDragging,
                'is-resizing': isResizing,
                'is-maximized': isMaximized,
                'has-float-icon': icon && iconMode === 'float'
              }
            ]"
            :style="dialogStyle"
            @mousedown.capture="handleDialogMouseDown"
          >
            <!-- 浮动图标（float 模式） -->
            <div v-if="icon && iconMode === 'float'" class="sc-dialog__float-icon" :style="floatIconStyle">
              <component :is="iconComponentName" :icon="icon" :style="{ fontSize: `${iconSize}px`, color: '#fff' }" />
            </div>

            <!-- 头部 -->
            <div class="sc-dialog__header" @mousedown="onHeaderMouseDown">
              <slot name="header">
                <div class="sc-dialog__header-content">
                  <!-- 内联图标（inline 模式） -->
                  <component
                    v-if="icon && iconMode === 'inline'"
                    :is="iconComponentName"
                    :icon="icon"
                    class="sc-dialog__inline-icon"
                    :style="{ fontSize: `${iconSize}px`, color: iconColor || typeColor }"
                  />
                  <span class="sc-dialog__title">{{ title }}</span>
                </div>
              </slot>
              <div class="sc-dialog__header-actions">
                <!-- 最小化按钮 -->
                <button v-if="showMinimize" class="sc-dialog__btn sc-dialog__minimize" @click.stop="handleMinimize" title="最小化">
                  <IconifyIconOnline icon="ep:minus" />
                </button>
                <!-- 最大化/还原按钮 -->
                <button v-if="showMaximize" class="sc-dialog__btn sc-dialog__maximize" @click.stop="handleToggleMaximize" :title="isMaximized ? '还原' : '最大化'">
                  <IconifyIconOnline :icon="isMaximized ? 'ep:copy-document' : 'ep:full-screen'" />
                </button>
                <!-- 关闭按钮 -->
                <button v-if="showClose" class="sc-dialog__btn sc-dialog__close" @click="handleClose">
                  <IconifyIconOnline icon="ep:close" />
                </button>
              </div>
            </div>

            <!-- 内容 -->
            <div class="sc-dialog__body">
              <slot />
            </div>

            <!-- 底部 -->
            <div v-if="showFooter" class="sc-dialog__footer">
              <slot name="footer">
                <el-button v-if="showCancelButton" @click="handleCancel">
                  {{ cancelText }}
                </el-button>
                <el-button v-if="showConfirmButton" type="primary" :loading="loading" @click="handleConfirm">
                  {{ confirmText }}
                </el-button>
              </slot>
            </div>

            <!-- 缩放手柄 -->
            <template v-if="resizable">
              <div class="sc-dialog__resize-handle sc-dialog__resize-handle--w"></div>
              <div class="sc-dialog__resize-handle sc-dialog__resize-handle--e"></div>
              <div class="sc-dialog__resize-handle sc-dialog__resize-handle--s"></div>
              <div class="sc-dialog__resize-handle sc-dialog__resize-handle--sw"></div>
              <div class="sc-dialog__resize-handle sc-dialog__resize-handle--se"></div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
/**
 * ScDialog 对话框组件
 * 支持两种模式：
 * - element: 使用 ElementPlus 原生对话框
 * - custom: 使用 interact.js 实现拖拽和缩放
 * @author CH
 * @version 4.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 简化架构，删除布局系统
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type PropType } from "vue";
import { ElDialog, ElButton } from "element-plus";
import interact from "interactjs";
import { localStorageProxy } from "@repo/utils";
import { useTaskbar, type TaskbarItem } from "./useTaskbar";

/** 对话框模式 */
type DialogMode = "element" | "custom";

/** 对话框类型 */
type DialogType = "default" | "info" | "success" | "warning" | "error";

/** 图标显示模式 */
type IconMode = "inline" | "float";

/** 吸附位置类型 */
type DockPosition = "left" | "right" | "top" | "bottom" | null;

// ==================== 全局对话框管理器 ====================
interface DialogInstance {
  id: string;
  zIndex: number;
  rect: DOMRect | null;
  element: HTMLElement | null;
  isMinimized: boolean;
}

// 全局对话框注册表
const dialogRegistry = new Map<string, DialogInstance>();
let globalZIndex = 2050;
let dialogIdCounter = 0;

/** 生成唯一对话框 ID */
function generateDialogId(): string {
  return `sc-dialog-${++dialogIdCounter}-${Date.now()}`;
}

/** 获取下一个 z-index */
function getNextZIndex(): number {
  return ++globalZIndex;
}

/** 激活对话框（置于顶层） */
function activateDialog(id: string): number {
  const newZIndex = getNextZIndex();
  const instance = dialogRegistry.get(id);
  if (instance) {
    instance.zIndex = newZIndex;
  }
  return newZIndex;
}

/** 注册对话框 */
function registerDialog(id: string, element: HTMLElement | null): void {
  dialogRegistry.set(id, {
    id,
    zIndex: getNextZIndex(),
    rect: element?.getBoundingClientRect() || null,
    element,
    isMinimized: false
  });
}

/** 注销对话框 */
function unregisterDialog(id: string): void {
  dialogRegistry.delete(id);
}

/** 更新对话框位置信息 */
function updateDialogRect(id: string, element: HTMLElement | null): void {
  const instance = dialogRegistry.get(id);
  if (instance && element) {
    instance.rect = element.getBoundingClientRect();
    instance.element = element;
  }
}

/** 获取所有其他对话框的位置信息（用于对齐辅助线） */
function getOtherDialogsRects(excludeId: string): DOMRect[] {
  const rects: DOMRect[] = [];
  dialogRegistry.forEach((instance, id) => {
    if (id !== excludeId && instance.rect && !instance.isMinimized) {
      rects.push(instance.rect);
    }
  });
  return rects;
}

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue?: boolean;
    /** 模式：element(原生) 或 custom(自定义) */
    mode?: DialogMode;
    /** 标题 */
    title?: string;
    /** 类型 */
    type?: DialogType;
    /** 宽度 */
    width?: string | number;
    /** 距离顶部 */
    top?: string;
    /** 是否显示遮罩 */
    modal?: boolean;
    /** 是否添加到 body */
    appendToBody?: boolean;
    /** 是否锁定滚动 */
    lockScroll?: boolean;
    /** 点击遮罩关闭 */
    closeOnClickModal?: boolean;
    /** ESC 关闭 */
    closeOnPressEscape?: boolean;
    /** 显示关闭按钮 */
    showClose?: boolean;
    /** 关闭前回调 */
    beforeClose?: (done: () => void) => void;
    /** 是否可拖拽 */
    draggable?: boolean;
    /** 是否居中 */
    center?: boolean;
    /** 关闭时销毁 */
    destroyOnClose?: boolean;
    /** 是否可缩放 */
    resizable?: boolean;
    /** 最小尺寸 */
    minSize?: { width: number; height: number };
    /** 最大尺寸 */
    maxSize?: { width: number; height: number };
    /** 显示底部 */
    showFooter?: boolean;
    /** 显示取消按钮 */
    showCancelButton?: boolean;
    /** 显示确认按钮 */
    showConfirmButton?: boolean;
    /** 取消文本 */
    cancelText?: string;
    /** 确认文本 */
    confirmText?: string;
    /** 加载状态 */
    loading?: boolean;
    /** 图标 */
    icon?: string;
    /** 图标模式：inline(标题左侧) 或 float(顶部浮动圆形) */
    iconMode?: IconMode;
    /** 图标大小 */
    iconSize?: number;
    /** 图标颜色 */
    iconColor?: string;
    /** 是否启用边缘吸附 */
    edgeDock?: boolean;
    /** 边缘吸附阈值（像素） */
    edgeThreshold?: number;
    /** 最小化图标 */
    minimizeIcon?: string;
    /** 是否显示最小化按钮 */
    showMinimize?: boolean;
    /** 最小化后是否可拖拽 */
    minimizeDraggable?: boolean;
    /** 对话框唯一标识 */
    dialogId?: string;
    /** 是否显示最大化按钮 */
    showMaximize?: boolean;
    /** 是否启用多对话框互相吸附 */
    snapToDialogs?: boolean;
    /** 对话框吸附阈值（像素） */
    snapThreshold?: number;
    /** 是否显示对齐辅助线 */
    showAlignGuides?: boolean;
    /** 最小化时是否显示标题（仅底部位置生效） */
    minimizeShowTitle?: boolean;
    /** 主题风格 */
    theme?: "tech" | "default";
    /** 是否使用任务栏（开启后最小化会收缩到任务栏） */
    useTaskbar?: boolean;
    /** 分组标识（用于任务栏分组合并） */
    group?: string;
    /** 是否允许拖出视口边界，默认 false（限制在视口内） */
    dragOutside?: boolean;
    /**
     * 记忆功能ID
     * 0 或空字符串：所有 ScDialog 共享配置
     * 其他值：按 ID 独立存储配置
     * 用于记录上次是否打开，刷新后恢复状态
     */
    memoryId?: string | number;
    /** 是否启用记忆功能 */
    memoryEnabled?: boolean;
  }>(),
  {
    modelValue: false,
    mode: "element",
    title: "",
    type: "default",
    width: "50%",
    top: "15vh",
    modal: true,
    appendToBody: true,
    lockScroll: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    showClose: true,
    draggable: true,
    center: false,
    destroyOnClose: false,
    resizable: false,
    minSize: () => ({ width: 300, height: 200 }),
    maxSize: () => ({ width: Infinity, height: Infinity }),
    showFooter: true,
    showCancelButton: true,
    showConfirmButton: true,
    cancelText: "取消",
    confirmText: "确定",
    loading: false,
    icon: "ep:edit-pen",
    iconMode: "float",
    iconSize: 24,
    iconColor: "",
    edgeDock: true,
    edgeThreshold: 50,
    minimizeIcon: "",
    showMinimize: true,
    minimizeDraggable: true,
    dialogId: "",
    showMaximize: true,
    snapToDialogs: true,
    snapThreshold: 10,
    minimizeShowTitle: true,
    showAlignGuides: true,
    theme: "default",
    useTaskbar: false,
    group: "",
    dragOutside: false,
    memoryId: 0,
    memoryEnabled: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
  cancel: [];
  confirm: [];
  resize: [size: { width: number; height: number }];
}>();

// 对话框 ID（使用传入的或自动生成）
const internalDialogId = ref(props.dialogId || generateDialogId());

// 状态
const dialogVisible = ref(props.modelValue);
const dialogRef = ref<HTMLElement | null>(null);
const minimizedIconRef = ref<HTMLElement | null>(null);
const alignGuidesRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const isMinimizedDragging = ref(false);
const currentZIndex = ref(2050);
const currentWidth = ref<string | null>(null);
const currentHeight = ref<string | null>(null);
const isMinimized = ref(false);
const isMaximized = ref(false);
const dockPosition = ref<DockPosition>(null);
const lastDialogState = ref<{ x: number; y: number; width: string; height: string } | null>(null);
// 保存对话框的原始位置（中间位置），用于从任务栏还原
const originalDialogState = ref<{ x: number; y: number; width: string; height: string } | null>(null);
const preMaximizeState = ref<{ x: number; y: number; width: string; height: string } | null>(null);
const minimizedIconPosition = ref<{ x: number; y: number } | null>(null);
const alignGuides = ref<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });

// interact.js 实例
let interactInstance: ReturnType<typeof interact> | null = null;
let minimizedInteractInstance: ReturnType<typeof interact> | null = null;

// 任务栏管理器
const taskbar = useTaskbar();

// 记忆存储 key
const memoryStorageKey = computed(() => {
  const id = props.memoryId;
  // 如果 memoryId 为 0 或空字符串，使用共享 key
  if (id === 0 || id === "0" || id === "") {
    return "sc_dialog_memory_shared";
  }
  return `sc_dialog_memory_${id}`;
});

/** 对话框记忆数据接口 */
interface DialogMemory {
  isOpen?: boolean;
  timestamp?: number;
}

/**
 * 从 localStorage 加载记忆状态
 */
function loadMemory(): void {
  if (!props.memoryEnabled) return;

  try {
    const memory = localStorageProxy().getItem<DialogMemory>(memoryStorageKey.value);
    if (memory && typeof memory.isOpen === "boolean") {
      dialogVisible.value = memory.isOpen;
      emit("update:modelValue", memory.isOpen);
    }
  } catch (error) {
    console.error("加载对话框记忆失败:", error);
  }
}

/**
 * 保存记忆状态到 localStorage
 */
function saveMemory(): void {
  if (!props.memoryEnabled) return;

  try {
    const memory = localStorageProxy().getItem<DialogMemory>(memoryStorageKey.value) || {};
    memory.isOpen = dialogVisible.value;
    memory.timestamp = Date.now();
    localStorageProxy().setItem(memoryStorageKey.value, memory);
  } catch (error) {
    console.error("保存对话框记忆失败:", error);
  }
}

// 对话框样式
const dialogStyle = computed(() => {
  // 最大化状态
  if (isMaximized.value) {
    return {
      width: "100vw",
      height: "100vh",
      maxHeight: "100vh",
      transform: "translate(0, 0)",
      touchAction: "none",
      borderRadius: "0"
    };
  }

  const w = currentWidth.value || (typeof props.width === "number" ? `${props.width}px` : props.width);
  const h = currentHeight.value || "auto";
  return {
    width: w,
    height: h,
    minWidth: `${props.minSize.width}px`,
    minHeight: `${props.minSize.height}px`,
    touchAction: "none"
  };
});

// 图标组件名（根据图标格式自动选择）
const iconComponentName = computed(() => {
  if (!props.icon) return null;
  // 包含 : 的是在线图标，否则是本地图标
  return props.icon.includes(":") ? "IconifyIconOnline" : "IconifyIconOffline";
});

// 类型对应的颜色
const typeColor = computed(() => {
  const colors: Record<string, string> = {
    default: "var(--el-color-primary)",
    info: "var(--el-color-info)",
    success: "var(--el-color-success)",
    warning: "var(--el-color-warning)",
    error: "var(--el-color-danger)"
  };
  return colors[props.type] || colors.default;
});

// 浮动图标样式
const floatIconStyle = computed(() => {
  const size = (props.iconSize || 24) * 2 + 16;
  return {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: props.iconColor || typeColor.value
  };
});

// 最小化过渡动画名称（根据吸附位置）
const minimizeTransitionName = computed(() => {
  if (!dockPosition.value) return "dialog-fade";
  return `dialog-minimize-${dockPosition.value}`;
});

// 实际使用的最小化图标（提供默认值）
const actualMinimizeIcon = computed(() => {
  // 优先级：minimizeIcon > icon > 类型默认图标
  if (props.minimizeIcon) return props.minimizeIcon;
  if (props.icon) return props.icon;
  // 根据类型提供默认图标
  const typeIcons: Record<string, string> = {
    default: "ep:chat-dot-round",
    info: "ep:info-filled",
    success: "ep:success-filled",
    warning: "ep:warning-filled",
    error: "ep:circle-close-filled"
  };
  return typeIcons[props.type] || typeIcons.default;
});

/**
 * 点击对话框激活（置于顶层）
 * 多任务栏模式下需要更新 z-index
 */
function handleDialogMouseDown(): void {
  if (!props.useTaskbar) return;

  const newZIndex = activateDialog(internalDialogId.value);
  currentZIndex.value = newZIndex;
  // 直接更新 DOM，确保立即生效
  if (dialogRef.value?.parentElement) {
    dialogRef.value.parentElement.style.zIndex = String(newZIndex);
  }
}

/**
 * 切换最大化状态
 */
function handleToggleMaximize(): void {
  if (isMaximized.value) {
    restoreFromMaximize();
  } else {
    maximize();
  }
}

/**
 * 最大化
 */
function maximize(): void {
  if (!dialogRef.value || isMaximized.value) return;

  const target = dialogRef.value;
  // 保存当前状态
  preMaximizeState.value = {
    x: parseFloat(target.getAttribute("data-x") || "0") || 0,
    y: parseFloat(target.getAttribute("data-y") || "0") || 0,
    width: target.style.width || "",
    height: target.style.height || ""
  };

  isMaximized.value = true;
  // 销毁拖拽和缩放
  destroyInteract();
}

/**
 * 从最大化还原
 */
function restoreFromMaximize(): void {
  isMaximized.value = false;

  nextTick(() => {
    if (dialogRef.value && preMaximizeState.value) {
      const target = dialogRef.value;
      target.style.transform = `translate(${preMaximizeState.value.x}px, ${preMaximizeState.value.y}px)`;
      target.setAttribute("data-x", String(preMaximizeState.value.x));
      target.setAttribute("data-y", String(preMaximizeState.value.y));
      if (preMaximizeState.value.width) {
        target.style.width = preMaximizeState.value.width;
        currentWidth.value = preMaximizeState.value.width;
      }
      if (preMaximizeState.value.height) {
        target.style.height = preMaximizeState.value.height;
        currentHeight.value = preMaximizeState.value.height;
      }
    }
    // 重新初始化拖拽和缩放
    initInteract();
  });
}

/**
 * 计算对齐辅助线
 */
function calculateAlignGuides(currentRect: DOMRect): void {
  if (!props.showAlignGuides) return;

  const guides: { vertical: number[]; horizontal: number[] } = { vertical: [], horizontal: [] };
  const threshold = props.snapThreshold;
  const otherRects = getOtherDialogsRects(internalDialogId.value);

  otherRects.forEach(rect => {
    // 垂直对齐线（左对左、右对右、左对右、右对左、中对中）
    if (Math.abs(currentRect.left - rect.left) < threshold) {
      guides.vertical.push(rect.left);
    }
    if (Math.abs(currentRect.right - rect.right) < threshold) {
      guides.vertical.push(rect.right);
    }
    if (Math.abs(currentRect.left - rect.right) < threshold) {
      guides.vertical.push(rect.right);
    }
    if (Math.abs(currentRect.right - rect.left) < threshold) {
      guides.vertical.push(rect.left);
    }
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const rectCenterX = rect.left + rect.width / 2;
    if (Math.abs(currentCenterX - rectCenterX) < threshold) {
      guides.vertical.push(rectCenterX);
    }

    // 水平对齐线（上对上、下对下、上对下、下对上、中对中）
    if (Math.abs(currentRect.top - rect.top) < threshold) {
      guides.horizontal.push(rect.top);
    }
    if (Math.abs(currentRect.bottom - rect.bottom) < threshold) {
      guides.horizontal.push(rect.bottom);
    }
    if (Math.abs(currentRect.top - rect.bottom) < threshold) {
      guides.horizontal.push(rect.bottom);
    }
    if (Math.abs(currentRect.bottom - rect.top) < threshold) {
      guides.horizontal.push(rect.top);
    }
    const currentCenterY = currentRect.top + currentRect.height / 2;
    const rectCenterY = rect.top + rect.height / 2;
    if (Math.abs(currentCenterY - rectCenterY) < threshold) {
      guides.horizontal.push(rectCenterY);
    }
  });

  alignGuides.value = guides;
}

/**
 * 计算吸附到其他对话框的位置
 */
function snapToOtherDialogs(x: number, y: number, width: number, height: number): { x: number; y: number; snapped: boolean } {
  if (!props.snapToDialogs) return { x, y, snapped: false };

  const threshold = props.snapThreshold;
  const otherRects = getOtherDialogsRects(internalDialogId.value);
  let snappedX = x;
  let snappedY = y;
  let snapped = false;

  const currentRight = x + width;
  const currentBottom = y + height;
  const currentCenterX = x + width / 2;
  const currentCenterY = y + height / 2;

  otherRects.forEach(rect => {
    // 左边缘吸附
    if (Math.abs(x - rect.left) < threshold) {
      snappedX = rect.left;
      snapped = true;
    } else if (Math.abs(x - rect.right) < threshold) {
      snappedX = rect.right;
      snapped = true;
    } else if (Math.abs(currentRight - rect.left) < threshold) {
      snappedX = rect.left - width;
      snapped = true;
    } else if (Math.abs(currentRight - rect.right) < threshold) {
      snappedX = rect.right - width;
      snapped = true;
    }

    // 上边缘吸附
    if (Math.abs(y - rect.top) < threshold) {
      snappedY = rect.top;
      snapped = true;
    } else if (Math.abs(y - rect.bottom) < threshold) {
      snappedY = rect.bottom;
      snapped = true;
    } else if (Math.abs(currentBottom - rect.top) < threshold) {
      snappedY = rect.top - height;
      snapped = true;
    } else if (Math.abs(currentBottom - rect.bottom) < threshold) {
      snappedY = rect.bottom - height;
      snapped = true;
    }
  });

  return { x: snappedX, y: snappedY, snapped };
}

// 同步 modelValue
watch(
  () => props.modelValue,
  val => {
    // 如果当前是最小化状态且要显示，则调用还原方法
    if (val && isMinimized.value) {
      restoreFromMinimized();
      return;
    }
    dialogVisible.value = val;
  }
);
watch(dialogVisible, val => {
  emit("update:modelValue", val);
  // 保存记忆状态
  saveMemory();
});

// 对话框显示时初始化并触发事件
watch(dialogVisible, val => {
  if (val && props.mode === "custom") {
    // 同步重置所有状态
    currentZIndex.value = getNextZIndex();
    currentWidth.value = null;
    currentHeight.value = null;
    isMinimized.value = false;
    isMaximized.value = false;
    dockPosition.value = null;
    lastDialogState.value = null;
    originalDialogState.value = null;
    preMaximizeState.value = null;
    emit("open");
    // 使用 requestAnimationFrame 替代 nextTick，更快执行
    requestAnimationFrame(() => {
      registerDialog(internalDialogId.value, dialogRef.value);
      // 初始化 interact.js（拖拽或缩放）
      if (props.draggable || props.resizable) {
        initInteract();
      }
      emit("opened");
    });
  } else if (!val && props.mode === "custom") {
    // 注销对话框
    unregisterDialog(internalDialogId.value);
    destroyInteract();
    emit("close");
  }
});

/**
 * 初始化 interact.js
 */
function initInteract(): void {
  if (!dialogRef.value || props.mode !== "custom") return;

  destroyInteract();

  interactInstance = interact(dialogRef.value);

  // 配置拖拽 - 简化版，避免 start 时的开销
  if (props.draggable) {
    interactInstance.draggable({
      allowFrom: ".sc-dialog__header",
      inertia: false,
      listeners: {
        start: () => {
          // 拖拽开始时激活对话框（置于顶层）
          handleDialogMouseDown();
        },
        move: event => {
          const target = event.target as HTMLElement;
          let x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
          let y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;

          // 边界限制（dragOutside 为 false 时限制在视窗内）
          if (!props.dragOutside) {
            const rect = target.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 计算移动后的实际位置
            const newLeft = rect.left + event.dx;
            const newTop = rect.top + event.dy;
            const newRight = newLeft + rect.width;
            const newBottom = newTop + rect.height;

            // 边界检查：保证对话框在视窗内
            if (newTop < 0) {
              y -= newTop; // 修正 y，使顶部不超出
            }
            if (newLeft < 0) {
              x -= newLeft; // 修正 x，使左侧不超出
            }
            if (newRight > viewportWidth) {
              x -= newRight - viewportWidth; // 修正 x，使右侧不超出
            }
            if (newBottom > viewportHeight) {
              y -= newBottom - viewportHeight; // 修正 y，使底部不超出
            }
          }

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));
        },
        end: event => {
          // 边缘吸附检测（mouseup 时判断，提高性能）
          if (props.edgeDock) {
            checkEdgeDock(event);
          }
        }
      }
    });
  }

  // 配置缩放
  if (props.resizable) {
    interactInstance.resizable({
      edges: { left: true, right: true, bottom: true, top: false },
      modifiers: [
        interact.modifiers.restrictSize({
          min: props.minSize,
          max: props.maxSize
        })
      ],
      listeners: {
        start: event => {
          // 缩放开始时激活对话框（置于顶层）
          handleDialogMouseDown();
          isResizing.value = true;
          document.body.style.userSelect = "none";
          // 禁用过渡，避免缩放卡顿
          const target = event.target as HTMLElement;
          if (target) {
            target.style.transition = "none";
          }
        },
        move: event => {
          const target = event.target as HTMLElement;
          const { width, height } = event.rect;
          const { left, top } = event.deltaRect;

          // 更新宽度和高度状态，防止被 computed 覆盖
          currentWidth.value = `${width}px`;
          currentHeight.value = `${height}px`;
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;

          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + left;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + top;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));

          emit("resize", { width, height });
        },
        end: event => {
          isResizing.value = false;
          document.body.style.userSelect = "";
          // 恢复过渡
          const target = event.target as HTMLElement;
          if (target) {
            target.style.transition = "";
          }
        }
      }
    });
  }
}

/**
 * 销毁 interact.js
 */
function destroyInteract(): void {
  if (interactInstance) {
    interactInstance.unset();
    interactInstance = null;
  }
}

// 事件处理
function handleBeforeClose(done: () => void): void {
  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
}

function handleOverlayClick(): void {
  if (props.closeOnClickModal) {
    handleClose();
  }
}

function handleClose(): void {
  if (props.beforeClose) {
    props.beforeClose(() => {
      dialogVisible.value = false;
    });
  } else {
    dialogVisible.value = false;
  }
  emit("close");
}

function handleCancel(): void {
  emit("cancel");
  dialogVisible.value = false;
}

function handleConfirm(): void {
  emit("confirm");
}

// 原生拖拽状态
let nativeDragState: {
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  target: HTMLElement | null;
} | null = null;

function onHeaderMouseDown(e: MouseEvent): void {
  // 点击 header 时激活对话框（置于顶层）
  handleDialogMouseDown();
}

function onDocumentMouseMove(e: MouseEvent): void {
  if (!nativeDragState || !nativeDragState.target) return;

  const dx = e.clientX - nativeDragState.startX;
  const dy = e.clientY - nativeDragState.startY;
  const x = nativeDragState.initialX + dx;
  const y = nativeDragState.initialY + dy;

  const target = nativeDragState.target;

  // 直接更新位置，最简单的实现
  target.style.transform = `translate(${x}px, ${y}px)`;
  target.setAttribute("data-x", String(x));
  target.setAttribute("data-y", String(y));
}

function onDocumentMouseUp(): void {
  document.removeEventListener("mousemove", onDocumentMouseMove);
  document.removeEventListener("mouseup", onDocumentMouseUp);
  nativeDragState = null;
}

function handleAfterLeave(): void {
  emit("closed");
}

/**
 * 检测边缘吸附
 */
function checkEdgeDock(event: { target: EventTarget | null; client: { x: number; y: number } }): void {
  const target = event.target as HTMLElement;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const threshold = props.edgeThreshold;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let position: DockPosition = null;

  // 检测左边缘
  if (rect.left <= threshold) {
    position = "left";
  }
  // 检测右边缘
  else if (rect.right >= viewportWidth - threshold) {
    position = "right";
  }
  // 检测顶部边缘
  else if (rect.top <= threshold) {
    position = "top";
  }
  // 检测底部边缘
  else if (rect.bottom >= viewportHeight - threshold) {
    position = "bottom";
  }

  if (position) {
    minimizeToEdge(position, target);
  }
}

/**
 * 最小化到边缘（拖拽到边缘时调用）
 */
function minimizeToEdge(position: DockPosition, target: HTMLElement): void {
  // 获取对话框的实际位置
  const rect = target.getBoundingClientRect();

  // 拖拽到边缘时，保存当前拖拽后的位置
  lastDialogState.value = {
    x: parseFloat(target.getAttribute("data-x") || "0") || 0,
    y: parseFloat(target.getAttribute("data-y") || "0") || 0,
    width: target.style.width || "",
    height: target.style.height || ""
  };

  dockPosition.value = position;
  isMinimized.value = true;

  // 根据吸附边缘设置最小化图标位置
  const iconSize = 48; // 图标尺寸
  switch (position) {
    case "left":
      // 左侧吸附：使用左上角
      minimizedIconPosition.value = { x: 0, y: rect.top };
      break;
    case "right":
      // 右侧吸附：使用右上角
      minimizedIconPosition.value = { x: window.innerWidth - iconSize, y: rect.top };
      break;
    case "top":
      // 顶部吸附：使用对话框水平中间
      minimizedIconPosition.value = { x: rect.left + rect.width / 2 - iconSize / 2, y: 0 };
      break;
    case "bottom":
      // 底部吸附：使用对话框水平中间
      minimizedIconPosition.value = { x: rect.left + rect.width / 2 - iconSize / 2, y: window.innerHeight - iconSize };
      break;
    default:
      minimizedIconPosition.value = null;
  }

  // 初始化最小化图标的拖拽
  nextTick(() => {
    if (props.minimizeDraggable) {
      initMinimizedIconInteract();
    }
  });
}

/**
 * 点击最小化按钮
 */
function handleMinimize(): void {
  if (dialogRef.value) {
    // 保存当前对话框状态
    const target = dialogRef.value;
    lastDialogState.value = {
      x: parseFloat(target.getAttribute("data-x") || "0") || 0,
      y: parseFloat(target.getAttribute("data-y") || "0") || 0,
      width: target.style.width || "",
      height: target.style.height || ""
    };

    // 如果启用了任务栏，添加到任务栏
    if (props.useTaskbar) {
      minimizeToTaskbar();
    } else {
      // 默认最小化行为
      dockPosition.value = "bottom";
      isMinimized.value = true;
      minimizedIconPosition.value = null;

      // 初始化最小化图标的拖拽
      nextTick(() => {
        if (props.minimizeDraggable) {
          initMinimizedIconInteract();
        }
      });
    }
  }
}

/**
 * 最小化到任务栏
 */
function minimizeToTaskbar(): void {
  // 创建任务栏项
  const taskbarItem: TaskbarItem = {
    id: internalDialogId.value,
    title: props.title,
    icon: props.icon || actualMinimizeIcon.value,
    type: props.type,
    group: props.group || undefined,
    active: false,
    timestamp: Date.now(),
    restore: () => {
      restoreFromTaskbar();
    },
    close: () => {
      dialogVisible.value = false;
    }
  };

  // 添加到任务栏
  taskbar.addItem(taskbarItem);

  // 隐藏对话框（但不关闭）
  isMinimized.value = true;
  dockPosition.value = null;
}

/**
 * 从任务栏恢复
 */
function restoreFromTaskbar(): void {
  // 从任务栏移除
  taskbar.removeItem(internalDialogId.value);

  // 恢复对话框
  isMinimized.value = false;

  // 使用原始位置（中间位置）而不是边缘吸附后的位置
  const stateToUse = originalDialogState.value || lastDialogState.value;

  // 恢复对话框状态并重新初始化拖拽
  nextTick(() => {
    if (dialogRef.value && stateToUse) {
      const target = dialogRef.value;
      target.style.transform = `translate(${stateToUse.x}px, ${stateToUse.y}px)`;
      target.setAttribute("data-x", String(stateToUse.x));
      target.setAttribute("data-y", String(stateToUse.y));
      if (stateToUse.width) {
        target.style.width = stateToUse.width;
      }
      if (stateToUse.height) {
        target.style.height = stateToUse.height;
      }
    }
    // 重新初始化 interact.js，恢复拖拽和缩放功能
    initInteract();
  });
}

/**
 * 点击最小化图标
 */
function handleMinimizedIconClick(): void {
  // 如果正在拖拽，不触发点击
  if (isMinimizedDragging.value) return;
  restoreFromMinimized();
}

/**
 * 从最小化状态恢复
 * @param restorePosition 可选的恢复位置（data-x, data-y 偏移量）
 * @param absolutePosition 可选的绝对位置（图标的屏幕位置），用于计算偏移量
 */
function restoreFromMinimized(restorePosition?: { x: number; y: number }, absolutePosition?: { left: number; top: number }): void {
  destroyMinimizedIconInteract();
  isMinimized.value = false;
  dockPosition.value = null;
  minimizedIconPosition.value = null;

  // 使用原始位置（中间位置）而不是边缘吸附后的位置
  const stateToUse = originalDialogState.value || lastDialogState.value;

  // 恢复对话框状态并重新初始化拖拽
  nextTick(() => {
    if (dialogRef.value && stateToUse) {
      const target = dialogRef.value;
      let x: number;
      let y: number;

      // 如果提供了绝对位置，根据对话框的居中位置计算偏移量
      if (absolutePosition) {
        // 获取对话框当前的尺寸
        const dialogWidth = target.offsetWidth;
        const dialogHeight = target.offsetHeight;
        // 计算对话框居中时的位置
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const centerX = (viewportWidth - dialogWidth) / 2;
        const centerY = viewportHeight * 0.15;
        // 计算偏移量，使对话框中心对齐到图标位置
        x = absolutePosition.left - centerX - dialogWidth / 2;
        y = absolutePosition.top - centerY - dialogHeight / 2;
      } else {
        // 如果有指定恢复位置，使用该位置；否则使用原始位置（中间位置）
        x = restorePosition?.x ?? stateToUse.x;
        y = restorePosition?.y ?? stateToUse.y;
      }

      target.style.transform = `translate(${x}px, ${y}px)`;
      target.setAttribute("data-x", String(x));
      target.setAttribute("data-y", String(y));
      if (stateToUse.width) {
        target.style.width = stateToUse.width;
      }
      if (stateToUse.height) {
        target.style.height = stateToUse.height;
      }
    }
    // 重新初始化 interact.js，恢复拖拽和缩放功能
    initInteract();
  });
}

/**
 * 从边缘恢复（兼容旧方法）
 */
function restoreFromEdge(): void {
  restoreFromMinimized();
}

/**
 * 初始化最小化图标的拖拽
 */
function initMinimizedIconInteract(): void {
  if (!minimizedIconRef.value || !props.minimizeDraggable) return;

  destroyMinimizedIconInteract();

  minimizedInteractInstance = interact(minimizedIconRef.value);

  // 记录拖拽开始时的初始位置
  let dragStartRect: DOMRect | null = null;

  minimizedInteractInstance.draggable({
    inertia: false, // 禁用惯性，确保位置准确
    modifiers: [
      interact.modifiers.restrict({
        restriction: "body",
        endOnly: false
      })
    ],
    listeners: {
      start: event => {
        isMinimizedDragging.value = true;
        document.body.style.userSelect = "none";
        const target = event.target as HTMLElement;
        dragStartRect = target.getBoundingClientRect();
        // 使用当前的 minimizedIconPosition 作为初始值，而不是重置为 0
        const initX = minimizedIconPosition.value?.x ?? 0;
        const initY = minimizedIconPosition.value?.y ?? 0;
        target.setAttribute("data-x", String(initX));
        target.setAttribute("data-y", String(initY));
      },
      move: event => {
        const target = event.target as HTMLElement;
        const currentX = parseFloat(target.getAttribute("data-x") || "0") || 0;
        const currentY = parseFloat(target.getAttribute("data-y") || "0") || 0;
        const x = currentX + event.dx;
        const y = currentY + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute("data-x", String(x));
        target.setAttribute("data-y", String(y));
        // 同步更新 minimizedIconPosition
        minimizedIconPosition.value = { x, y };
      },
      end: event => {
        document.body.style.userSelect = "";
        // 延迟重置拖拽状态，避免触发点击事件
        setTimeout(() => {
          isMinimizedDragging.value = false;
        }, 100);

        // 检测是否在边缘
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        const threshold = props.edgeThreshold;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newPosition: DockPosition = null;

        // 检测边缘
        if (rect.left <= threshold) {
          newPosition = "left";
        } else if (rect.right >= viewportWidth - threshold) {
          newPosition = "right";
        } else if (rect.top <= threshold) {
          newPosition = "top";
        } else if (rect.bottom >= viewportHeight - threshold) {
          newPosition = "bottom";
        }

        if (newPosition) {
          // 拖到边缘，保持最小化状态并更新位置
          dockPosition.value = newPosition;
          minimizedIconPosition.value = null;
          // 重置 transform
          target.style.transform = "";
          target.removeAttribute("data-x");
          target.removeAttribute("data-y");
        } else {
          // 拖到非边缘区域，恢复对话框到图标当前拖拽到的位置
          // 传入图标的绝对位置，让对话框恢复到该位置
          restoreFromMinimized(undefined, { left: rect.left, top: rect.top });
        }

        dragStartRect = null;
      }
    }
  });
}

/**
 * 销毁最小化图标的 interact.js
 */
function destroyMinimizedIconInteract(): void {
  if (minimizedInteractInstance) {
    minimizedInteractInstance.unset();
    minimizedInteractInstance = null;
  }
}

/**
 * 获取最小化图标位置样式
 */
const minimizedIconStyle = computed(() => {
  const base: Record<string, string> = {
    position: "fixed",
    zIndex: String(currentZIndex.value + 1)
  };

  // 如果有自定义位置（拖拽中），使用自定义位置
  if (minimizedIconPosition.value) {
    return {
      ...base,
      left: "0",
      top: "0",
      transform: `translate(${minimizedIconPosition.value.x}px, ${minimizedIconPosition.value.y}px)`
    };
  }

  // 根据吸附位置设置样式
  switch (dockPosition.value) {
    case "left":
      return { ...base, left: "0", top: "50%", transform: "translateY(-50%)" };
    case "right":
      return { ...base, right: "0", top: "50%", transform: "translateY(-50%)" };
    case "top":
      return { ...base, top: "0", left: "50%", transform: "translateX(-50%)" };
    case "bottom":
    default:
      return { ...base, bottom: "0", left: "50%", transform: "translateX(-50%)" };
  }
});

// 生命周期
onMounted(() => {
  // 加载记忆状态
  loadMemory();

  if (dialogVisible.value && props.mode === "custom") {
    nextTick(() => initInteract());
  }
});

onUnmounted(() => {
  destroyInteract();
  destroyMinimizedIconInteract();
  // 清理原生拖拽事件
  document.removeEventListener("mousemove", onDocumentMouseMove);
  document.removeEventListener("mouseup", onDocumentMouseUp);
  nativeDragState = null;
});

// 暴露方法
defineExpose({
  /** 对话框 ID */
  dialogId: internalDialogId,
  /** 打开对话框 */
  open: () => {
    dialogVisible.value = true;
  },
  /** 关闭对话框 */
  close: () => {
    dialogVisible.value = false;
  },
  /** 最小化对话框 */
  minimize: (position: DockPosition = "bottom") => {
    if (props.useTaskbar) {
      minimizeToTaskbar();
    } else if (dialogRef.value) {
      minimizeToEdge(position, dialogRef.value);
    }
  },
  /** 最小化到任务栏 */
  minimizeToTaskbar,
  /** 从任务栏恢复 */
  restoreFromTaskbar,
  /** 还原对话框 */
  restore: restoreFromEdge,
  /** 最大化对话框 */
  maximize,
  /** 从最大化还原 */
  restoreFromMaximize,
  /** 切换最大化状态 */
  toggleMaximize: handleToggleMaximize,
  /** 激活对话框（置于顶层） */
  activate: () => {
    currentZIndex.value = activateDialog(internalDialogId.value);
  },
  /** 是否最小化 */
  isMinimized: () => isMinimized.value,
  /** 是否最大化 */
  isMaximized: () => isMaximized.value
});
</script>

<style lang="scss">
// ElementPlus 对话框样式增强
.sc-dialog {
  border-radius: 8px;

  &--info .el-dialog__header {
    border-top: 3px solid var(--el-color-info);
  }
  &--success .el-dialog__header {
    border-top: 3px solid var(--el-color-success);
  }
  &--warning .el-dialog__header {
    border-top: 3px solid var(--el-color-warning);
  }
  &--error .el-dialog__header {
    border-top: 3px solid var(--el-color-danger);
  }

  // 浮动图标模式（element 模式）
  &.has-float-icon {
    .el-dialog {
      overflow: visible;
      margin-top: 32px;
    }

    .el-dialog__header {
      padding-top: 24px;
    }

    .sc-dialog__float-icon {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1;
    }
  }

  // 内联图标模式（element 模式）
  .sc-dialog__header-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-dialog__inline-icon {
    flex-shrink: 0;
  }

  .sc-dialog__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// 自定义对话框样式
.sc-dialog-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;

  &.has-modal {
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
  }

  // 任务栏模式：允许点击穿透到下层对话框
  &.is-taskbar-mode {
    pointer-events: none;
  }
}

.sc-dialog--custom {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  // 对话框本身可以点击
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  max-height: 80vh;

  &.is-dragging,
  &.is-resizing {
    user-select: none;
    // 拖拽和缩放时禁用过渡动画，避免卡顿
    transition: none !important;
    // 提升层级确保流畅
    z-index: 1;

    * {
      transition: none !important;
    }
  }

  // 浮动图标模式时增加顶部间距
  &.has-float-icon {
    margin-top: 32px;

    .sc-dialog__header {
      padding-top: 24px;
    }
  }

  // 浮动图标
  .sc-dialog__float-icon {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }

  .sc-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px 16px 0 0;
    cursor: move;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sc-dialog__header-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-dialog__inline-icon {
    flex-shrink: 0;
  }

  .sc-dialog__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .sc-dialog__header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sc-dialog__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: rgba(0, 0, 0, 0.03);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: rgba(0, 0, 0, 0.08);
      color: var(--el-text-color-primary);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .sc-dialog__minimize:hover {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 193, 7, 0.25));
    color: var(--el-color-warning);
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
  }

  .sc-dialog__maximize:hover {
    background: linear-gradient(135deg, rgba(67, 160, 71, 0.15), rgba(67, 160, 71, 0.25));
    color: var(--el-color-success);
    box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);
  }

  .sc-dialog__close:hover {
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(244, 67, 54, 0.25));
    color: var(--el-color-danger);
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  }

  // 最大化状态
  &.is-maximized {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    max-height: 100vh !important;

    .sc-dialog__header {
      cursor: default;
      border-radius: 0;
    }

    .sc-dialog__body {
      max-height: calc(100vh - 120px);
    }
  }

  .sc-dialog__body {
    flex: 1;
    padding: 24px;
    overflow: auto;
    background: rgba(255, 255, 255, 0.5);
  }

  .sc-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.8) 100%);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 0 0 16px 16px;
  }

  // 缩放手柄
  .sc-dialog__resize-handle {
    position: absolute;

    &--w {
      top: 0;
      left: 0;
      width: 8px;
      height: 100%;
      cursor: w-resize;
    }

    &--e {
      top: 0;
      right: 0;
      width: 8px;
      height: 100%;
      cursor: e-resize;
    }

    &--s {
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: s-resize;
    }

    &--sw {
      bottom: 0;
      left: 0;
      width: 16px;
      height: 16px;
      cursor: sw-resize;
    }

    &--se {
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
    }
  }

  // 类型样式
  &.sc-dialog--info .sc-dialog__header {
    border-top: 3px solid var(--el-color-info);
    border-radius: 8px 8px 0 0;
  }
  &.sc-dialog--success .sc-dialog__header {
    border-top: 3px solid var(--el-color-success);
    border-radius: 8px 8px 0 0;
  }
  &.sc-dialog--warning .sc-dialog__header {
    border-top: 3px solid var(--el-color-warning);
    border-radius: 8px 8px 0 0;
  }
  &.sc-dialog--error .sc-dialog__header {
    border-top: 3px solid var(--el-color-danger);
    border-radius: 8px 8px 0 0;
  }

  // Tech 主题样式
  &.sc-dialog--theme-tech {
    background: rgba(0, 20, 40, 0.95);
    border: 1px solid rgba(0, 246, 255, 0.3);
    border-radius: 2px;
    box-shadow:
      0 0 20px rgba(0, 246, 255, 0.3),
      inset 0 0 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);

    // 网格背景
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(rgba(0, 246, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 246, 255, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.3;
      pointer-events: none;
      z-index: 0;
    }

    // 边角装饰
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px solid transparent;
      border-image: linear-gradient(135deg, rgba(0, 246, 255, 0.5), transparent 50%, rgba(0, 246, 255, 0.5)) 1;
      pointer-events: none;
      z-index: 1;
    }

    .sc-dialog__header {
      background: rgba(0, 30, 60, 0.8);
      border-bottom: 1px solid rgba(0, 246, 255, 0.5);
      position: relative;
      z-index: 2;

      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100px;
        height: 2px;
        background: #00f6ff;
        box-shadow: 0 0 10px rgba(0, 246, 255, 0.8);
      }
    }

    .sc-dialog__title {
      color: #fff;
      text-shadow: 0 0 10px rgba(0, 246, 255, 0.8);
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .sc-dialog__body {
      color: rgba(255, 255, 255, 0.9);
      position: relative;
      z-index: 2;

      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(0, 246, 255, 0.5);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }
    }

    .sc-dialog__footer {
      border-top: 1px solid rgba(0, 246, 255, 0.3);
      background: rgba(0, 30, 60, 0.5);
      position: relative;
      z-index: 2;
    }

    .sc-dialog__btn {
      color: #00f6ff;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 246, 255, 0.2);
        color: #00f6ff;
        box-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
      }
    }

    .sc-dialog__close:hover {
      background: rgba(255, 77, 79, 0.2);
      color: #ff4d4f;
      box-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
    }

    .sc-dialog__minimize:hover {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
      box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
    }

    .sc-dialog__maximize:hover {
      background: rgba(0, 255, 136, 0.2);
      color: #00ff88;
      box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    }

    // 扩展手柄样式
    .sc-dialog__resize-handle {
      &::after {
        content: "";
        position: absolute;
        background: rgba(0, 246, 255, 0.5);
      }

      &--se::after,
      &--sw::after {
        width: 10px;
        height: 10px;
        bottom: 2px;
      }

      &--se::after {
        right: 2px;
        border-right: 2px solid #00f6ff;
        border-bottom: 2px solid #00f6ff;
      }

      &--sw::after {
        left: 2px;
        border-left: 2px solid #00f6ff;
        border-bottom: 2px solid #00f6ff;
      }
    }

    // 科技风输入框样式
    .el-input__wrapper {
      background: rgba(0, 20, 40, 0.8);
      border: 1px solid rgba(0, 246, 255, 0.3);
      border-radius: 2px;
      box-shadow:
        0 0 10px rgba(0, 246, 255, 0.1),
        inset 0 0 10px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(0, 246, 255, 0.5);
        box-shadow:
          0 0 15px rgba(0, 246, 255, 0.2),
          inset 0 0 10px rgba(0, 0, 0, 0.3);
      }

      &.is-focus {
        border-color: #00f6ff;
        box-shadow:
          0 0 20px rgba(0, 246, 255, 0.4),
          inset 0 0 10px rgba(0, 0, 0, 0.3);
      }
    }

    .el-input__inner {
      color: rgba(255, 255, 255, 0.9);
      caret-color: #00f6ff;

      &::placeholder {
        color: rgba(0, 246, 255, 0.4);
      }
    }

    .el-textarea__inner {
      background: rgba(0, 20, 40, 0.8);
      border: 1px solid rgba(0, 246, 255, 0.3);
      border-radius: 2px;
      color: rgba(255, 255, 255, 0.9);
      caret-color: #00f6ff;
      box-shadow:
        0 0 10px rgba(0, 246, 255, 0.1),
        inset 0 0 10px rgba(0, 0, 0, 0.3);

      &::placeholder {
        color: rgba(0, 246, 255, 0.4);
      }

      &:hover {
        border-color: rgba(0, 246, 255, 0.5);
      }

      &:focus {
        border-color: #00f6ff;
        box-shadow:
          0 0 20px rgba(0, 246, 255, 0.4),
          inset 0 0 10px rgba(0, 0, 0, 0.3);
      }
    }

    // 清除和密码按钮
    .el-input__clear,
    .el-input__password {
      color: rgba(0, 246, 255, 0.6);

      &:hover {
        color: #00f6ff;
      }
    }

    // 按钮科技风
    .el-button {
      background: rgba(0, 30, 60, 0.8);
      border: 1px solid rgba(0, 246, 255, 0.3);
      color: rgba(0, 246, 255, 0.9);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 246, 255, 0.1);
        border-color: rgba(0, 246, 255, 0.6);
        color: #00f6ff;
        box-shadow: 0 0 10px rgba(0, 246, 255, 0.3);
      }

      &--primary {
        background: rgba(0, 246, 255, 0.2);
        border-color: #00f6ff;
        color: #00f6ff;

        &:hover {
          background: rgba(0, 246, 255, 0.3);
          box-shadow: 0 0 15px rgba(0, 246, 255, 0.5);
        }
      }
    }
  }
}

// 最小化图标
.sc-dialog-dock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition:
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: none;
  user-select: none;
  border-radius: 12px;
  backdrop-filter: blur(10px);

  &:hover {
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;
    transform: translateY(-2px) scale(1.05);
  }

  &.is-dragging {
    cursor: grabbing;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    transition: none; // 拖拽时禁用过渡
  }

  &__title {
    font-size: 13px;
    font-weight: 500;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 位置样式 - 左侧（仅图标）
  &--left {
    border-radius: 0 8px 8px 0;
    padding: 12px;
  }

  // 位置样式 - 右侧（仅图标）
  &--right {
    border-radius: 8px 0 0 8px;
    padding: 12px;
  }

  // 位置样式 - 顶部（仅图标）
  &--top {
    border-radius: 0 0 8px 8px;
    padding: 12px;
  }

  // 位置样式 - 底部（可显示标题）
  &--bottom {
    border-radius: 8px 8px 0 0;
    padding: 10px 12px;
  }

  // 有标题时的样式
  &.show-title {
    padding: 10px 16px;
    min-width: 120px;
  }

  // 类型样式
  &--info {
    background: var(--el-color-info);
  }
  &--success {
    background: var(--el-color-success);
  }
  &--warning {
    background: var(--el-color-warning);
  }
  &--error {
    background: var(--el-color-danger);
  }
}

// 对话框过渡动画
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;

  .sc-dialog--custom {
    transition: opacity 0.2s ease;
    // 不对 transform 添加过渡，避免影响拖拽性能
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;

  .sc-dialog--custom {
    opacity: 0;
    // 移除 transform 动画，只用透明度淡入淡出
  }
}

// 边缘图标过渡动画
.dock-fade-enter-active,
.dock-fade-leave-active {
  transition: all 0.3s ease;
}

.dock-fade-enter-from,
.dock-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

// 对齐辅助线
.sc-dialog-align-guides {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.sc-dialog-align-guide {
  position: absolute;
  background: var(--el-color-primary);
  opacity: 0.6;

  &--vertical {
    width: 1px;
    top: 0;
    bottom: 0;
  }

  &--horizontal {
    height: 1px;
    left: 0;
    right: 0;
  }
}

// 最小化动画 - 向左（macOS Genie 效果）
.dialog-minimize-left-enter-active,
.dialog-minimize-left-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: left center;
  }
}

.dialog-minimize-left-leave-to {
  .sc-dialog--custom {
    transform: translateX(-50vw) scale(0.1) perspective(800px) rotateY(15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

.dialog-minimize-left-enter-from {
  .sc-dialog--custom {
    transform: translateX(-50vw) scale(0.1) perspective(800px) rotateY(15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 最小化动画 - 向右（macOS Genie 效果）
.dialog-minimize-right-enter-active,
.dialog-minimize-right-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: right center;
  }
}

.dialog-minimize-right-leave-to {
  .sc-dialog--custom {
    transform: translateX(50vw) scale(0.1) perspective(800px) rotateY(-15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

.dialog-minimize-right-enter-from {
  .sc-dialog--custom {
    transform: translateX(50vw) scale(0.1) perspective(800px) rotateY(-15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 最小化动画 - 向上（macOS Genie 效果）
.dialog-minimize-top-enter-active,
.dialog-minimize-top-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: center top;
  }
}

.dialog-minimize-top-leave-to {
  .sc-dialog--custom {
    transform: translateY(-50vh) scale(0.1) perspective(800px) rotateX(-15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

.dialog-minimize-top-enter-from {
  .sc-dialog--custom {
    transform: translateY(-50vh) scale(0.1) perspective(800px) rotateX(-15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 最小化动画 - 向下（macOS Genie 效果）
.dialog-minimize-bottom-enter-active,
.dialog-minimize-bottom-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: center bottom;
  }
}

.dialog-minimize-bottom-leave-to {
  .sc-dialog--custom {
    transform: translateY(50vh) scale(0.1) perspective(800px) rotateX(15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

.dialog-minimize-bottom-enter-from {
  .sc-dialog--custom {
    transform: translateY(50vh) scale(0.1) perspective(800px) rotateX(15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 任务栏最小化动画（通用 - macOS 风格）
.dialog-minimize-taskbar-enter-active,
.dialog-minimize-taskbar-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: center bottom;
  }
}

.dialog-minimize-taskbar-leave-to {
  .sc-dialog--custom {
    transform: translateY(calc(100vh - 60px)) scale(0.05);
    opacity: 0;
    filter: blur(3px);
  }
}

.dialog-minimize-taskbar-enter-from {
  .sc-dialog--custom {
    transform: translateY(calc(100vh - 60px)) scale(0.05);
    opacity: 0;
    filter: blur(3px);
  }
}
</style>
