<template>
  <!-- 最小化状态显示 -->
  <div v-if="isMinimized" class="sc-dialog-minimized" :style="minimizedStyle" @click="handleRestore">
    <div class="sc-dialog-minimized__icon">
      <IconifyIconOnline :icon="minimizedIcon || icon" />
    </div>
    <el-tooltip :content="title" placement="top">
      <span class="sc-dialog-minimized__title">{{ title }}</span>
    </el-tooltip>
  </div>

  <!-- 正常对话框 -->
  <el-dialog
    v-else
    ref="dialogRef"
    v-model="dialogVisible"
    :title="title"
    :width="currentWidth"
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
    :style="dialogStyle"
    :class="dialogClasses"
    @open="handleOpen"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="handleClosed"
    @mousedown="handleDialogClick"
  >
    <!-- 自定义标题栏 -->
    <template #header>
      <div class="sc-dialog__header">
        <div class="sc-dialog__header-left">
          <div v-if="showIcon" class="sc-dialog__header-icon">
            <IconifyIconOnline :icon="icon" />
          </div>
          <slot name="header">
            <span class="sc-dialog__title">{{ title }}</span>
          </slot>
        </div>
        <div class="sc-dialog__header-actions">
          <!-- 最小化按钮 -->
          <el-button v-if="showMinimizeButton && enableMinimize" class="sc-dialog__action-btn" :icon="useRenderIcon(minimizeIcon)" circle size="small" @click.stop="handleMinimize" />
        </div>
      </div>
    </template>

    <!-- 内容区域 -->
    <div class="sc-dialog__body" :class="{ 'sc-dialog__body--with-form': isForm }">
      <slot />
    </div>

    <!-- 底部按钮区域 -->
    <template v-if="$slots.footer || showFooter" #footer>
      <div class="sc-dialog__footer">
        <slot name="footer">
          <el-button v-if="showCancelButton" @click="onCancel">
            <IconifyIconOnline v-if="cancelIcon" :icon="cancelIcon" />
            {{ cancelText }}
          </el-button>
          <el-button v-if="showConfirmButton" :type="confirmButtonType" :loading="loading" @click="onConfirm">
            <IconifyIconOnline v-if="confirmIcon && !loading" :icon="confirmIcon" />
            {{ confirmText }}
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * ScDialog 默认布局组件
 * 支持多弹框、边缘吸附、最小化等功能
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 */
import { ref, watch, onUnmounted, nextTick, computed, PropType } from "vue";
import { ElDialog, ElButton, ElTooltip } from "element-plus";
import interact from "interactjs";
import { useDialogFeatures } from "../useDialogFeatures";
import { dialogManager } from "../dialogManager";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import type { MinimizePosition, EdgeDockPosition } from "../types";

const props = defineProps({
  // 基础属性
  modelValue: {
    type: Boolean,
    default: false
  },
  dialogId: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    default: ""
  },
  width: {
    type: String,
    default: "500px"
  },
  top: {
    type: String,
    default: "15vh"
  },
  modal: {
    type: Boolean,
    default: true
  },
  appendToBody: {
    type: Boolean,
    default: false
  },
  lockScroll: {
    type: Boolean,
    default: true
  },
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  beforeClose: {
    type: Function
  },
  draggable: {
    type: Boolean,
    default: true
  },
  center: {
    type: Boolean,
    default: false
  },
  destroyOnClose: {
    type: Boolean,
    default: false
  },

  // 扩展属性
  type: {
    type: String,
    default: "default"
  },
  icon: {
    type: String,
    default: "ep:info-filled"
  },
  showIcon: {
    type: Boolean,
    default: false
  },
  isForm: {
    type: Boolean,
    default: false
  },

  // 底部按钮属性
  showFooter: {
    type: Boolean,
    default: true
  },
  showCancelButton: {
    type: Boolean,
    default: true
  },
  showConfirmButton: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: "取消"
  },
  confirmText: {
    type: String,
    default: "确定"
  },
  cancelIcon: {
    type: String,
    default: "ep:close"
  },
  confirmIcon: {
    type: String,
    default: "ep:check"
  },
  confirmButtonType: {
    type: String as PropType<"primary" | "success" | "warning" | "danger" | "info">,
    default: "primary"
  },
  loading: {
    type: Boolean,
    default: false
  },

  // 缩放属性
  resizable: {
    type: Boolean,
    default: false
  },
  resizeEdges: {
    type: Object as PropType<{ left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }>,
    default: () => ({ left: true, right: true, bottom: true, top: false })
  },
  minSize: {
    type: Object as PropType<{ width: number; height: number }>,
    default: () => ({ width: 300, height: 200 })
  },
  maxSize: {
    type: Object as PropType<{ width: number; height: number }>,
    default: () => ({ width: Infinity, height: Infinity })
  },
  preserveAspectRatio: {
    type: Boolean,
    default: false
  },

  // 边缘吸附属性
  enableEdgeDock: {
    type: Boolean,
    default: false
  },
  edgeDockThreshold: {
    type: Number,
    default: 50
  },

  // 最小化属性
  enableMinimize: {
    type: Boolean,
    default: false
  },
  showMinimizeButton: {
    type: Boolean,
    default: false
  },
  minimizeIcon: {
    type: String,
    default: "ri:subtract-line"
  },
  minimizedIcon: {
    type: String,
    default: "ri:window-line"
  },
  defaultMinimizePosition: {
    type: String as PropType<MinimizePosition>,
    default: "bottom-right"
  }
});

const emit = defineEmits(["update:modelValue", "open", "opened", "close", "closed", "cancel", "confirm", "resize", "minimize", "restore", "edgeDock", "edgeUndock"]);

// 对话框引用
const dialogRef = ref<InstanceType<typeof ElDialog> | null>(null);
const dialogElRef = ref<HTMLElement | null>(null);

// interact 实例
let interactInstance: ReturnType<typeof interact> | null = null;

// 当前尺寸
const currentSize = ref({ width: 0, height: 0 });

// 生成对话框ID
const internalDialogId = computed(() => {
  return props.dialogId || dialogManager.generateId();
});

// 使用对话框功能
const dialogVisible = ref(props.modelValue);

const {
  isMinimized,
  isEdgeDocked,
  dockedEdge,
  minimizePosition,
  position,
  size,
  zIndex,
  minimizedStyle,
  minimize,
  restore,
  dockToEdge,
  undockFromEdge,
  activateDialog,
  handleDragEnd,
  getState,
  getNearestEdge
} = useDialogFeatures({
  dialogId: internalDialogId.value,
  title: props.title,
  icon: props.icon,
  enableEdgeDock: props.enableEdgeDock,
  edgeDockThreshold: props.edgeDockThreshold,
  enableMinimize: props.enableMinimize,
  defaultMinimizePosition: props.defaultMinimizePosition,
  visible: dialogVisible,
  dialogRef: dialogElRef
});

// 计算当前宽度
const currentWidth = computed(() => {
  if (isEdgeDocked.value) {
    return `${size.value.width}px`;
  }
  if (currentSize.value.width > 0) {
    return `${currentSize.value.width}px`;
  }
  return props.width;
});

// 计算对话框样式
const dialogStyle = computed(() => {
  const style: Record<string, string> = {};

  if (isEdgeDocked.value) {
    style.position = "fixed";
    style.top = `${position.value.y}px`;
    style.left = `${position.value.x}px`;
    style.margin = "0";
    style.height = `${size.value.height}px`;
  }

  style.zIndex = String(zIndex.value);

  return style;
});

// 计算对话框类名
const dialogClasses = computed(() => {
  return [
    "sc-dialog",
    "sc-dialog--default",
    `sc-dialog--${props.type}`,
    {
      "sc-dialog--with-icon": props.showIcon,
      "sc-dialog--resizable": props.resizable,
      "sc-dialog--edge-docked": isEdgeDocked.value,
      [`sc-dialog--docked-${dockedEdge.value}`]: isEdgeDocked.value && dockedEdge.value
    }
  ];
});

/**
 * 监听modelValue变化，同步到dialogVisible
 */
watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
  }
);

/**
 * 监听dialogVisible变化，同步到modelValue
 */
watch(
  () => dialogVisible.value,
  val => {
    emit("update:modelValue", val);
  }
);

/**
 * 处理对话框关闭前的回调
 * @param {Function} done - 关闭对话框的函数
 */
const handleBeforeClose = (done: () => void) => {
  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
};

/**
 * 处理取消按钮点击事件
 */
const onCancel = () => {
  emit("cancel");
};

/**
 * 处理确认按钮点击事件
 */
const onConfirm = () => {
  emit("confirm");
};

/**
 * 初始化 interact 缩放
 */
const initResize = () => {
  if (!props.resizable) return;

  nextTick(() => {
    // 获取对话框元素
    const dialogEl = document.querySelector(".sc-dialog--resizable .el-dialog") as HTMLElement;
    if (!dialogEl) return;

    // 销毁旧实例
    if (interactInstance) {
      interactInstance.unset();
    }

    // 创建新实例
    interactInstance = interact(dialogEl).resizable({
      edges: props.resizeEdges,
      listeners: {
        move(event) {
          const target = event.target;

          // 更新尺寸
          currentSize.value.width = event.rect.width;
          currentSize.value.height = event.rect.height;

          // 应用样式
          target.style.width = `${event.rect.width}px`;
          target.style.height = `${event.rect.height}px`;

          // 处理从左边或上边缩放时的位置调整
          const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.deltaRect.left;
          const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.deltaRect.top;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));

          emit("resize", { width: event.rect.width, height: event.rect.height });
        }
      },
      modifiers: [
        interact.modifiers.restrictSize({
          min: props.minSize,
          max: props.maxSize
        })
      ],
      inertia: false
    });

    // 添加宽高比保持
    if (props.preserveAspectRatio) {
      interactInstance.resizable({
        modifiers: [
          interact.modifiers.aspectRatio({
            ratio: "preserve"
          }),
          interact.modifiers.restrictSize({
            min: props.minSize,
            max: props.maxSize
          })
        ]
      });
    }
  });
};

/**
 * 销毁 interact 实例
 */
const destroyResize = () => {
  if (interactInstance) {
    interactInstance.unset();
    interactInstance = null;
  }
  // 重置尺寸
  currentSize.value = { width: 0, height: 0 };
};

/**
 * 处理对话框打开事件
 */
const handleOpen = () => {
  emit("open");
  if (props.resizable) {
    initResize();
  }
};

/**
 * 处理对话框关闭动画结束事件
 */
const handleClosed = () => {
  emit("closed");
  destroyResize();
};

/**
 * 处理最小化
 */
const handleMinimize = () => {
  const pos = getNearestMinimizePosition();
  minimize(pos);
  emit("minimize", pos);
};

/**
 * 处理恢复
 */
const handleRestore = () => {
  restore();
  emit("restore");
};

/**
 * 获取最近的最小化位置
 * @returns 最小化位置
 */
const getNearestMinimizePosition = (): MinimizePosition => {
  // 获取对话框当前位置
  const dialogEl = document.querySelector(".sc-dialog--default .el-dialog") as HTMLElement;
  if (!dialogEl) return props.defaultMinimizePosition;

  const rect = dialogEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const isLeft = centerX < windowWidth / 2;
  const isTop = centerY < windowHeight / 2;

  if (isTop && isLeft) return "top-left";
  if (isTop && !isLeft) return "top-right";
  if (!isTop && isLeft) return "bottom-left";
  return "bottom-right";
};

/**
 * 处理对话框点击（激活）
 */
const handleDialogClick = () => {
  activateDialog();
};

/**
 * 暴露方法给父组件
 */
defineExpose({
  minimize: handleMinimize,
  restore: handleRestore,
  dockToEdge,
  undockFromEdge,
  getState
});

onUnmounted(() => {
  destroyResize();
});
</script>

<style lang="scss">
.sc-dialog--default {
  border-top: 4px solid var(--el-color-primary);
  border-radius: 16px;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  .el-dialog__header {
    padding: 20px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-light);

    .el-dialog__title {
      font-weight: 600;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .el-dialog__body {
    padding: 30px 20px 20px;
    max-height: 70vh;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 2px;
      height: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(50, 50, 50, 0.2);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: rgba(50, 50, 50, 0.4);
    }

    &::-webkit-scrollbar-track {
      background-color: rgba(50, 50, 50, 0.05);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-track:hover {
      background-color: rgba(50, 50, 50, 0.1);
    }
  }

  .el-dialog__footer {
    padding: 15px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }

  // 对话框类型样式
  &.sc-dialog--primary {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary-light-8) 100%);
    }
  }

  &.sc-dialog--success {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-success-light-7) 0%, var(--el-color-success-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-success);
    }
  }

  &.sc-dialog--warning {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-warning-light-7) 0%, var(--el-color-warning-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-warning);
    }
  }

  &.sc-dialog--danger {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-danger-light-7) 0%, var(--el-color-danger-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-danger);
    }
  }

  &.sc-dialog--info {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-info-light-7) 0%, var(--el-color-info-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-info);
    }
  }

  // 带图标的对话框样式
  &.sc-dialog--with-icon {
    .el-dialog__body {
      padding-top: 40px;
    }
  }

  // 对话框图标
  .sc-dialog__icon {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
    animation: sc-dialog-bounce 1s ease-out;

    svg {
      font-size: 24px;
      color: var(--el-text-color-primary);
    }
  }

  // 对话框内容区域
  .sc-dialog__body {
    &--with-form {
      .el-form-item {
        margin-bottom: 25px;
        transition: all 0.3s;
        animation: sc-dialog-slide-in 0.4s ease-out both;

        &:nth-child(1) {
          animation-delay: 0.1s;
        }
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0.3s;
        }
        &:nth-child(4) {
          animation-delay: 0.4s;
        }
        &:nth-child(5) {
          animation-delay: 0.5s;
        }
        &:nth-child(6) {
          animation-delay: 0.6s;
        }

        &:hover {
          transform: translateY(-2px);
        }
      }
    }
  }

  // 对话框底部
  .sc-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    .el-button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

/* 动画效果 */
@keyframes sc-dialog-bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  40% {
    transform: translateX(-50%) translateY(-20px);
  }
  60% {
    transform: translateX(-50%) translateY(-10px);
  }
}

@keyframes sc-dialog-slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sc-dialog-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 可缩放对话框样式 */
.sc-dialog--resizable {
  .el-dialog {
    touch-action: none;
    user-select: none;

    // 缩放手柄样式
    &::before,
    &::after {
      content: "";
      position: absolute;
      background: transparent;
    }

    // 右边缘
    &::after {
      right: 0;
      top: 0;
      width: 8px;
      height: 100%;
      cursor: ew-resize;
    }

    // 底边缘
    &::before {
      bottom: 0;
      left: 0;
      width: 100%;
      height: 8px;
      cursor: ns-resize;
    }
  }

  // 右下角缩放手柄
  .el-dialog__body::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    background: linear-gradient(
      135deg,
      transparent 50%,
      var(--el-border-color) 50%,
      var(--el-border-color) 60%,
      transparent 60%,
      transparent 70%,
      var(--el-border-color) 70%,
      var(--el-border-color) 80%,
      transparent 80%
    );
    opacity: 0.5;
    transition: opacity 0.2s;
    border-radius: 0 0 12px 0;
  }

  .el-dialog:hover .el-dialog__body::after {
    opacity: 1;
  }
}

/* 自定义标题栏样式 */
.sc-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sc-dialog__header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sc-dialog__header-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--el-color-primary-light-8);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.sc-dialog__title {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.sc-dialog__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 30px;
}

.sc-dialog__action-btn {
  width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;

  &:hover {
    background: var(--el-fill-color-light) !important;
  }
}

/* 最小化状态样式 */
.sc-dialog-minimized {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  animation: sc-dialog-minimize-in 0.3s ease-out;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--el-color-primary-light-8);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  &__title {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    max-width: 48px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: none;
  }
}

@keyframes sc-dialog-minimize-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 边缘吸附样式 */
.sc-dialog--edge-docked {
  .el-dialog {
    margin: 0 !important;
    border-radius: 0 !important;
    max-height: 100vh !important;

    .el-dialog__body {
      max-height: calc(100vh - 120px) !important;
    }
  }

  &.sc-dialog--docked-left .el-dialog {
    border-left: none !important;
    border-top-right-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
  }

  &.sc-dialog--docked-right .el-dialog {
    border-right: none !important;
    border-top-left-radius: 8px !important;
    border-bottom-left-radius: 8px !important;
  }

  &.sc-dialog--docked-top .el-dialog {
    border-top: none !important;
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
  }

  &.sc-dialog--docked-bottom .el-dialog {
    border-bottom: none !important;
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
  }
}
</style>
