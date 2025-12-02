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
  <template v-else>
    <Teleport to="body">
      <Transition name="dialog-fade" @after-leave="handleAfterLeave">
        <div v-if="dialogVisible" class="sc-dialog-overlay" :class="{ 'has-modal': modal }" :style="{ zIndex: currentZIndex }" @click.self="handleOverlayClick">
          <div
            ref="dialogRef"
            class="sc-dialog sc-dialog--custom"
            :class="[`sc-dialog--${type}`, { 'is-dragging': isDragging, 'is-resizing': isResizing, 'has-float-icon': icon && iconMode === 'float' }]"
            :style="dialogStyle"
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
    loading: false,
    icon: "",
    iconMode: "inline",
    iconSize: 24,
    iconColor: ""
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

// 全局 z-index 管理
let globalZIndex = 2050;
function getNextZIndex(): number {
  return globalZIndex++;
}

// 状态
const dialogVisible = ref(props.modelValue);
const dialogRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const currentZIndex = ref(2050);
const currentWidth = ref<string | null>(null);

// interact.js 实例
let interactInstance: ReturnType<typeof interact> | null = null;

// 对话框样式
const dialogStyle = computed(() => {
  const w = currentWidth.value || (typeof props.width === "number" ? `${props.width}px` : props.width);
  return {
    width: w,
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

// 对话框显示时初始化 interact.js 并触发事件
watch(dialogVisible, val => {
  if (val && props.mode === "custom") {
    currentZIndex.value = getNextZIndex();
    currentWidth.value = null; // 重置宽度
    emit("open");
    nextTick(() => {
      initInteract();
      emit("opened");
    });
  } else if (!val && props.mode === "custom") {
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

  // 配置缩放（支持左右两侧和底部）
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
        start: () => {
          isResizing.value = true;
          document.body.style.userSelect = "none";
        },
        move: event => {
          const target = event.target as HTMLElement;
          const { width, height } = event.rect;
          const { left, top } = event.deltaRect;

          // 更新宽度状态，防止被 computed 覆盖
          currentWidth.value = `${width}px`;
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

function handleAfterLeave(): void {
  emit("closed");
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
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: move;
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
}

// 对话框过渡动画
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;

  .sc-dialog--custom {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;

  .sc-dialog--custom {
    transform: translateY(-20px);
    opacity: 0;
  }
}
</style>
