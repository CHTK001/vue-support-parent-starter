<template>
  <!-- ElementPlus 原生模式 -->
  <el-dialog
    v-if="mode === 'element'"
    v-model="dialogVisible"
    :title="title"
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
    :class="['sc-dialog', `sc-dialog--${type}`]"
    @open="$emit('open')"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
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
  <Teleport v-else to="body">
    <div v-if="dialogVisible" class="sc-dialog-overlay" :class="{ 'has-modal': modal }" @click.self="handleOverlayClick">
      <div ref="dialogRef" class="sc-dialog sc-dialog--custom" :class="[`sc-dialog--${type}`, { 'is-dragging': isDragging, 'is-resizing': isResizing }]" :style="dialogStyle">
        <!-- 头部 -->
        <div class="sc-dialog__header" @mousedown="onHeaderMouseDown">
          <slot name="header">
            <span class="sc-dialog__title">{{ title }}</span>
          </slot>
          <button v-if="showClose" class="sc-dialog__close" @click="handleClose">
            <IconifyIconOnline icon="ep:close" />
          </button>
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
          <div class="sc-dialog__resize-handle sc-dialog__resize-handle--e"></div>
          <div class="sc-dialog__resize-handle sc-dialog__resize-handle--s"></div>
          <div class="sc-dialog__resize-handle sc-dialog__resize-handle--se"></div>
        </template>
      </div>
    </div>
  </Teleport>
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
import { IconifyIconOnline } from "@repo/components/ReIcon";
import interact from "interactjs";

/** 对话框模式 */
type DialogMode = "element" | "custom";

/** 对话框类型 */
type DialogType = "default" | "info" | "success" | "warning" | "error";

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
  }>(),
  {
    modelValue: false,
    mode: "element",
    title: "",
    type: "default",
    width: "500px",
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
    loading: false
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

// 状态
const dialogVisible = ref(props.modelValue);
const dialogRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);

// interact.js 实例
let interactInstance: ReturnType<typeof interact> | null = null;

// 对话框样式
const dialogStyle = computed(() => {
  const w = typeof props.width === "number" ? `${props.width}px` : props.width;
  return {
    width: w,
    minWidth: `${props.minSize.width}px`,
    minHeight: `${props.minSize.height}px`,
    touchAction: "none"
  };
});

// 同步 modelValue
watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
  }
);
watch(dialogVisible, val => {
  emit("update:modelValue", val);
});

// 对话框显示时初始化 interact.js
watch(dialogVisible, val => {
  if (val && props.mode === "custom") {
    nextTick(() => initInteract());
  } else {
    destroyInteract();
  }
});

/**
 * 初始化 interact.js
 */
function initInteract(): void {
  if (!dialogRef.value || props.mode !== "custom") return;

  destroyInteract();

  interactInstance = interact(dialogRef.value);

  // 配置拖拽
  if (props.draggable) {
    interactInstance.draggable({
      allowFrom: ".sc-dialog__header",
      modifiers: [
        interact.modifiers.restrict({
          restriction: "body",
          endOnly: false
        })
      ],
      inertia: { resistance: 15, minSpeed: 200, endSpeed: 10 },
      listeners: {
        start: () => {
          isDragging.value = true;
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
          isDragging.value = false;
          document.body.style.userSelect = "";
        }
      }
    });
  }

  // 配置缩放
  if (props.resizable) {
    interactInstance.resizable({
      edges: { left: false, right: true, bottom: true, top: false },
      modifiers: [
        interact.modifiers.restrictSize({
          min: props.minSize,
          max: props.maxSize
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

          target.style.width = `${width}px`;
          target.style.height = `${height}px`;

          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + left;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + top;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));

          emit("resize", { width, height });
        },
        end: () => {
          isResizing.value = false;
          document.body.style.userSelect = "";
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

function onHeaderMouseDown(): void {
  // interact.js 自动处理
}

// 生命周期
onMounted(() => {
  if (dialogVisible.value && props.mode === "custom") {
    nextTick(() => initInteract());
  }
});

onUnmounted(() => {
  destroyInteract();
});

// 暴露方法
defineExpose({
  open: () => {
    dialogVisible.value = true;
  },
  close: () => {
    dialogVisible.value = false;
  }
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
}

// 自定义对话框样式
.sc-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;

  &.has-modal {
    background: rgba(0, 0, 0, 0.5);
  }
}

.sc-dialog--custom {
  position: relative;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  max-height: 80vh;

  &.is-dragging,
  &.is-resizing {
    user-select: none;
  }

  .sc-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: move;
  }

  .sc-dialog__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .sc-dialog__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }
  }

  .sc-dialog__body {
    flex: 1;
    padding: 20px;
    overflow: auto;
  }

  .sc-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  // 缩放手柄
  .sc-dialog__resize-handle {
    position: absolute;

    &--e {
      top: 0;
      right: 0;
      width: 8px;
      height: 100%;
      cursor: e-resize;
    }

    &--s {
      bottom: 0;
      left: 0;
      width: 100%;
      height: 8px;
      cursor: s-resize;
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
}
</style>
