<template>
  <!-- ElementPlus 原生模式 -->
  <component
    :is="currentDialogComponent"
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
        <ScButton v-if="showCancelButton" @click="handleCancel">
          {{ cancelText }}
        </ScButton>
        <ScButton v-if="showConfirmButton" type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </ScButton>
      </slot>
    </template>
  </component>

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
            theme ? `sc-dialog-dock-icon--theme-${theme}` : '',
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
                <ScButton v-if="showCancelButton" @click="handleCancel">
                  {{ cancelText }}
                </ScButton>
                <ScButton v-if="showConfirmButton" type="primary" :loading="loading" @click="handleConfirm">
                  {{ confirmText }}
                </ScButton>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type PropType, type CSSProperties } from "vue";
import { ElDialog } from "element-plus";
import { ScButton } from "../../ScButton";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import interact from "interactjs";
import { localStorageProxy } from "@repo/utils";
import { useTaskbar, type TaskbarItem } from "./useTaskbar";
import { useDialogInteract, useDialogMinimize, useDialogZIndex, type DockPosition } from "../composables";
import { IconifyIconOnline } from "@repo/components/ReIcon";

/** 对话框模式 */
type DialogMode = "element" | "custom";

/** 对话框类型 */
type DialogType = "default" | "info" | "success" | "warning" | "error";

/** 图标显示模式 */
type IconMode = "inline" | "float";

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
    theme?: string;
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
    confirmText: "确认",
    loading: false,
    icon: "",
    iconMode: "inline",
    iconSize: 20,
    iconColor: "",
    edgeDock: true,
    edgeThreshold: 20,
    minimizeIcon: "ep:minus",
    showMinimize: true,
    minimizeDraggable: true,
    dialogId: "",
    showMaximize: true,
    snapToDialogs: true,
    snapThreshold: 10,
    showAlignGuides: true,
    minimizeShowTitle: true,
    theme: "default",
    useTaskbar: false,
    group: "",
    dragOutside: false,
    memoryId: "",
    memoryEnabled: false
  }
);

const emit = defineEmits(["update:modelValue", "open", "opened", "close", "closed", "confirm", "cancel", "minimize", "maximize", "restore"]);

// 内部状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const internalDialogId = props.dialogId || `sc-dialog-${Date.now()}`;
const dialogRef = ref<HTMLElement | null>(null);
const minimizedIconRef = ref<HTMLElement | null>(null);
const alignGuidesRef = ref<HTMLElement | null>(null);

// Composables
const { currentZIndex, activateDialog, registerDialog, unregisterDialog, updateDialogRect } = useDialogZIndex({
  initialZIndex: 2000
});

const { isMinimized, isMaximized, dockPosition, minimizedIconPosition, minimizeTransitionName, minimizeToEdge, restoreFromMinimized, toggleMaximize } = useDialogMinimize({
  edgeThreshold: props.edgeThreshold,
  edgeDock: props.edgeDock,
  minimizeShowTitle: props.minimizeShowTitle
});

const { isDragging, isResizing, initInteract, destroyInteract, updatePosition } = useDialogInteract({
  draggable: props.draggable,
  resizable: props.resizable,
  dragHandle: ".sc-dialog__header",
  minSize: props.minSize,
  maxSize: props.maxSize,
  dragOutside: props.dragOutside,
  snapThreshold: props.snapThreshold,
  onDragStart: () => activateDialog(internalDialogId),
  onResizeStart: () => activateDialog(internalDialogId)
});

// 计算属性
const iconComponentName = computed(() => (props.icon ? IconifyIconOnline : ""));
const actualMinimizeIcon = computed(() => (props.icon ? props.icon : props.minimizeIcon));

// 使用 PixelUI 条件导入
const { currentComponent } = useThemeComponent("ElDialog");

// 当前实际渲染的组件（仅用于 element 模式）
const currentDialogComponent = computed(() => {
  return currentComponent;
});

const typeColor = computed(() => {
  switch (props.type) {
    case "info":
      return "var(--el-color-info)";
    case "success":
      return "var(--el-color-success)";
    case "warning":
      return "var(--el-color-warning)";
    case "error":
      return "var(--el-color-danger)";
    default:
      return "var(--el-color-primary)";
  }
});

const floatIconStyle = computed<CSSProperties>(() => ({
  background: typeColor.value,
  boxShadow: `0 4px 12px ${typeColor.value}66`
}));

const dialogStyle = computed<CSSProperties>(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  marginTop: props.top
}));

const minimizedIconStyle = computed<CSSProperties>(() => {
  if (!minimizedIconPosition.value) return {};
  return {
    left: `${minimizedIconPosition.value.x}px`,
    top: `${minimizedIconPosition.value.y}px`,
    zIndex: currentZIndex.value
  };
});

const alignGuides = ref({ vertical: [] as number[], horizontal: [] as number[] });
const isMinimizedDragging = ref(false);

// 方法
const handleClose = () => {
  if (props.beforeClose) {
    props.beforeClose(() => {
      dialogVisible.value = false;
      emit("close");
    });
  } else {
    dialogVisible.value = false;
    emit("close");
  }
};

const handleCancel = () => {
  emit("cancel");
  handleClose();
};

const handleConfirm = () => {
  emit("confirm");
};

const handleMinimize = () => {
  if (!dialogRef.value) return;

  if (props.useTaskbar) {
    // 任务栏最小化逻辑
    isMinimized.value = true;
  } else {
    // 边缘吸附最小化
    const pos = dockPosition.value || "bottom";
    minimizeToEdge(pos, dialogRef.value);
  }
  emit("minimize");
};

const handleToggleMaximize = () => {
  if (!dialogRef.value) return;
  toggleMaximize(dialogRef.value);
  emit(isMaximized.value ? "maximize" : "restore");
};

const handleMinimizedIconClick = () => {
  restoreFromMinimized(dialogRef.value);
  emit("restore");
};

const handleOverlayClick = () => {
  if (props.closeOnClickModal) {
    handleClose();
  }
};

const handleDialogMouseDown = () => {
  activateDialog(internalDialogId);
};

const onHeaderMouseDown = () => {
  activateDialog(internalDialogId);
};

const handleBeforeClose = (done: () => void) => {
  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
};

const handleAfterLeave = () => {
  emit("closed");
};

// 生命周期
onMounted(() => {
  if (props.mode === "custom" && dialogRef.value) {
    registerDialog(internalDialogId, dialogRef.value);
    initInteract(dialogRef.value);
    activateDialog(internalDialogId);
  }
});

onUnmounted(() => {
  unregisterDialog(internalDialogId);
  destroyInteract();
});

watch(
  () => props.modelValue,
  val => {
    if (val) {
      nextTick(() => {
        if (props.mode === "custom" && dialogRef.value) {
          registerDialog(internalDialogId, dialogRef.value);
          initInteract(dialogRef.value);
          activateDialog(internalDialogId);
        }
        emit("open");
      });
    } else {
      // 对话框关闭时注销
      if (props.mode === "custom") {
        unregisterDialog(internalDialogId);
      }
    }
  }
);
</script>

<style lang="scss">
@use "@/styles/mixins.scss" as *;

.sc-dialog {
  &.has-float-icon {
    margin-top: 40px !important;
    overflow: visible;

    .el-dialog__header {
      padding-top: 30px;
    }
  }
}

.sc-dialog__float-icon {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1;
}

.sc-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 20%) 0%, color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 60%) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--stitch-lay-border);
  border-radius: var(--stitch-lay-radius-lg) var(--stitch-lay-radius-lg) 0 0;
  cursor: move;
  transition: var(--stitch-lay-transition);
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
  color: var(--stitch-lay-text-main);
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
  background: var(--stitch-lay-bg-page);
  border: none;
  border-radius: var(--stitch-lay-radius-sm);
  cursor: pointer;
  color: var(--stitch-lay-text-secondary);
  transition: var(--stitch-lay-transition-fast);

  &:hover {
    background: var(--stitch-lay-border-hover);
    color: var(--stitch-lay-text-main);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.sc-dialog__minimize:hover {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  box-shadow: 0 2px 8px var(--el-color-warning-light-5);
}

.sc-dialog__maximize:hover {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  box-shadow: 0 2px 8px var(--el-color-success-light-5);
}

.sc-dialog__close:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  box-shadow: 0 2px 8px var(--el-color-danger-light-5);
}

// 最大化状态
.sc-dialog.is-maximized {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  max-height: 100vh !important;
  width: 100vw !important;
  height: 100vh !important;
  transform: none !important;

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
  background: color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 50%);
}

.sc-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 60%) 0%, color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 20%) 100%);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--stitch-lay-border);
  border-radius: 0 0 var(--stitch-lay-radius-lg) var(--stitch-lay-radius-lg);
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
@each $type in (primary, success, warning, danger, info) {
  .sc-dialog--#{$type} {
    .sc-dialog__header {
      border-top: 3px solid var(--el-color-#{$type});
      border-radius: 8px 8px 0 0;
    }
  }
}

// 主题样式 - 通用 mixin
@mixin dialog-theme-variant($type) {
  border: 1px solid var(--el-color-#{$type}-light-5);
  box-shadow: 0 0 20px var(--el-color-#{$type}-light-8);

  .sc-dialog__header {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-#{$type}), transparent 90%) 0%, color-mix(in srgb, var(--el-color-#{$type}), transparent 95%) 100%);
    border-bottom: 1px solid var(--el-color-#{$type}-light-7);
  }

  .sc-dialog__title {
    color: var(--el-color-#{$type});
    font-weight: bold;
  }

  .sc-dialog__footer {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-#{$type}), transparent 95%) 0%, color-mix(in srgb, var(--el-color-#{$type}), transparent 90%) 100%);
    border-top: 1px solid var(--el-color-#{$type}-light-7);
  }

  // 按钮适配
  .sc-dialog__btn:hover {
    background: var(--el-color-#{$type}-light-9);
    color: var(--el-color-#{$type});
  }
}

// Primary 主题样式
.sc-dialog--theme-primary {
  @include dialog-theme-variant(primary);
}

// Success 主题样式
.sc-dialog--theme-success {
  @include dialog-theme-variant(success);
}

// Warning 主题样式
.sc-dialog--theme-warning {
  @include dialog-theme-variant(warning);
}

// Danger 主题样式
.sc-dialog--theme-danger {
  @include dialog-theme-variant(danger);
}

// Info 主题样式
.sc-dialog--theme-info {
  @include dialog-theme-variant(info);
}

// Tech 主题样式
.sc-dialog--theme-tech {
  background: color-mix(in srgb, var(--el-color-primary-dark-2), transparent 5%);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 2px;
  box-shadow:
    0 0 20px var(--el-color-primary-light-5),
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
    background-image: linear-gradient(var(--el-color-primary-light-8) 1px, transparent 1px), linear-gradient(90deg, var(--el-color-primary-light-8) 1px, transparent 1px);
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
    border-image: linear-gradient(135deg, var(--el-color-primary), transparent 50%, var(--el-color-primary)) 1;
    pointer-events: none;
    z-index: 1;
  }

  .sc-dialog__header {
    background: color-mix(in srgb, var(--el-color-primary-dark-2), transparent 20%);
    border-bottom: 1px solid var(--el-color-primary-light-5);
    position: relative;
    z-index: 2;

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100px;
      height: 2px;
      background: var(--el-color-primary);
      box-shadow: 0 0 10px var(--el-color-primary);
    }
  }

  .sc-dialog__title {
    color: var(--el-color-white);
    text-shadow: 0 0 10px var(--el-color-primary);
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .sc-dialog__body {
    color: var(--el-text-color-primary);
    position: relative;
    z-index: 2;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-color-primary-light-5);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  .sc-dialog__footer {
    border-top: 1px solid var(--el-color-primary-light-7);
    background: color-mix(in srgb, var(--el-color-primary-dark-2), transparent 50%);
    position: relative;
    z-index: 2;
  }

  .sc-dialog__btn {
    color: var(--el-color-primary);
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      box-shadow: 0 0 10px var(--el-color-primary-light-5);
    }
  }

  .sc-dialog__close:hover {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    box-shadow: 0 0 10px var(--el-color-danger-light-5);
  }

  .sc-dialog__minimize:hover {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
    box-shadow: 0 0 10px var(--el-color-warning-light-5);
  }

  .sc-dialog__maximize:hover {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    box-shadow: 0 0 10px var(--el-color-success-light-5);
  }

  // 扩展手柄样式
  .sc-dialog__resize-handle {
    &::after {
      content: "";
      position: absolute;
      background: var(--el-color-primary-light-5);
    }

    &--se::after,
    &--sw::after {
      width: 10px;
      height: 10px;
      bottom: 2px;
    }

    &--se::after {
      right: 2px;
      border-right: 2px solid var(--el-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
    }

    &--sw::after {
      left: 2px;
      border-left: 2px solid var(--el-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
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
  position: fixed; // 确保固定定位

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
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;

  .sc-dialog--custom {
    opacity: 0;
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
    left: 0;
  }

  &--horizontal {
    height: 1px;
    left: 0;
    right: 0;
    top: 0;
  }
}

// 最小化图标主题样式
.sc-dialog-dock-icon {
  // Tech 主题
  &--theme-tech {
    background: color-mix(in srgb, var(--el-color-primary-dark-2), transparent 10%);
    border: 1px solid var(--el-color-primary-light-5);
    box-shadow:
      0 0 15px var(--el-color-primary-light-5),
      inset 0 0 10px rgba(0, 0, 0, 0.5);
    color: var(--el-color-primary-light-3);
    text-shadow: 0 0 5px var(--el-color-primary);

    &:hover {
      background: color-mix(in srgb, var(--el-color-primary-dark-2), transparent 5%);
      box-shadow:
        0 0 20px var(--el-color-primary-light-3),
        inset 0 0 15px rgba(0, 0, 0, 0.5);
      color: #fff;
      transform: translateY(-2px) scale(1.05);
    }
  }

  // Primary 主题
  &--theme-primary {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  }

  // Success 主题
  &--theme-success {
    background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
  }

  // Warning 主题
  &--theme-warning {
    background: linear-gradient(135deg, var(--el-color-warning) 0%, var(--el-color-warning-light-3) 100%);
  }

  // Danger 主题
  &--theme-danger {
    background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-light-3) 100%);
  }

  // Info 主题
  &--theme-info {
    background: linear-gradient(135deg, var(--el-color-info) 0%, var(--el-color-info-light-3) 100%);
  }
}

// 最小化动画 - 向左
.dialog-minimize-left-enter-active,
.dialog-minimize-left-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: left center;
  }
}

.dialog-minimize-left-leave-to,
.dialog-minimize-left-enter-from {
  .sc-dialog--custom {
    transform: translateX(-50vw) scale(0.1) perspective(800px) rotateY(15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 最小化动画 - 向右
.dialog-minimize-right-enter-active,
.dialog-minimize-right-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: right center;
  }
}

.dialog-minimize-right-leave-to,
.dialog-minimize-right-enter-from {
  .sc-dialog--custom {
    transform: translateX(50vw) scale(0.1) perspective(800px) rotateY(-15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 最小化动画 - 向上
.dialog-minimize-top-enter-active,
.dialog-minimize-top-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: center top;
  }
}

.dialog-minimize-top-leave-to,
.dialog-minimize-top-enter-from {
  .sc-dialog--custom {
    transform: translateY(-50vh) scale(0.1) perspective(800px) rotateX(-15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 最小化动画 - 向下
.dialog-minimize-bottom-enter-active,
.dialog-minimize-bottom-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: center bottom;
  }
}

.dialog-minimize-bottom-leave-to,
.dialog-minimize-bottom-enter-from {
  .sc-dialog--custom {
    transform: translateY(50vh) scale(0.1) perspective(800px) rotateX(15deg);
    opacity: 0;
    filter: blur(2px);
  }
}

// 任务栏最小化动画
.dialog-minimize-taskbar-enter-active,
.dialog-minimize-taskbar-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);

  .sc-dialog--custom {
    transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    transform-origin: center bottom;
  }
}

.dialog-minimize-taskbar-leave-to,
.dialog-minimize-taskbar-enter-from {
  .sc-dialog--custom {
    transform: translateY(calc(100vh - 60px)) scale(0.05);
    opacity: 0;
    filter: blur(3px);
  }
}
</style>
