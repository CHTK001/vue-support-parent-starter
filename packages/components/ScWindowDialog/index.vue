<template>
  <teleport v-if="dialogVisible" to="body">
    <!-- 遮罩层（可选） -->
    <div v-if="modal" class="sc-window-dialog__overlay" :style="{ zIndex: currentZIndex - 1 }" @click="handleOverlayClick" />

    <!-- 对话框容器 -->
    <DraggableResizableVue
      v-model:x="dialogPosition.x"
      v-model:y="dialogPosition.y"
      v-model:w="dialogSize.width"
      v-model:h="dialogSize.height"
      v-model:active="isActive"
      :init-x="dialogPosition.x"
      :init-y="dialogPosition.y"
      :init-w="dialogSize.width"
      :init-h="dialogSize.height"
      :class="['sc-window-dialog', `sc-window-dialog--${theme}`, customClass, { 'sc-window-dialog--shrunk': isShrunk }]"
      :style="{
        zIndex: currentZIndex,
        display: dialogVisible ? 'block' : 'none'
      }"
      :data-dialog-id="dialogId"
      :draggable="draggable"
      :resizable="resizable"
      :min-width="minWidth"
      :min-height="minHeight"
      :max-width="maxWidth"
      :max-height="maxHeight"
      :parent="true"
      :drag-handle="'.sc-window-dialog__header'"
      @click="handleDialogClick"
      @activated="handleActivated"
      @deactivated="handleDeactivated"
      @drag-start="handleDragStart"
      @dragging="handleDragging"
      @drag-stop="handleDragStop"
      @resize-start="handleResizeStart"
      @resizing="handleResizing"
      @resize-stop="handleResizeStop"
    >
      <!-- 对话框内容 -->
      <div class="sc-window-dialog__wrapper">
        <!-- 标题栏 -->
        <div v-if="$slots.header || icon || title || showClose" class="sc-window-dialog__header">
          <div class="sc-window-dialog__title">
            <IconifyIconOnline v-if="icon" :icon="icon" class="sc-window-dialog__icon" />
            <span v-if="title" class="sc-window-dialog__title-text">{{ title }}</span>
            <slot name="header" />
          </div>
          <div class="sc-window-dialog__header-actions">
            <slot name="header-extra" />
            <button v-if="showClose" class="sc-window-dialog__close" type="button" aria-label="关闭对话框" @click="handleClose">
              <IconifyIconOnline icon="ep:close" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="sc-window-dialog__body" :class="bodyClass">
          <slot />
        </div>

        <!-- 底部区域 -->
        <div v-if="$slots.footer" class="sc-window-dialog__footer" :class="footerClass">
          <slot name="footer" />
        </div>
      </div>
    </DraggableResizableVue>
  </teleport>
</template>

<script setup lang="ts">
import DraggableResizableVue from "draggable-resizable-vue3";
import { nextTick, onMounted, onUnmounted, ref, watch, withDefaults } from "vue";
import { useAutoShrink } from "./composables/useAutoShrink";
import { dialogManager } from "./manager";
import type { ScWindowDialogEmits, ScWindowDialogProps } from "./types";

/**
 * ScWindowDialog 组件
 * @author CH
 * @version 2.0.0
 * @description 基于 draggable-resizable-vue3 的增强对话框组件，支持拖拽、调整大小、主题、图标等功能
 */
defineOptions({
  name: "ScWindowDialog"
});

// Props 定义
const props = withDefaults(defineProps<ScWindowDialogProps>(), {
  modelValue: false,
  theme: "default",
  width: 500,
  height: 400,
  top: 100,
  left: 100,
  modal: false,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  draggable: true,
  resizable: true,
  minWidth: 200,
  minHeight: 150,
  maxWidth: 9999,
  maxHeight: 9999,
  fullscreen: false,
  autoShrink: true,
  shrinkSize: 64
});

// Emits 定义
const emit = defineEmits<ScWindowDialogEmits>();

// 生成或使用提供的ID
const dialogId = props.id || dialogManager.generateId();

// 内部状态
const dialogVisible = ref(props.modelValue);
const currentZIndex = ref(props.zIndex || 2000);
const isActive = ref(false);
const isDragging = ref(false);
const isResizing = ref(false);

// 对话框位置和尺寸
const dialogPosition = ref({
  x: props.left || 0,
  y: props.top || 0
});

const dialogSize = ref({
  width: props.width || 500,
  height: props.height || 400
});

// 注册对话框实例
const dialogInstance = dialogManager.register(dialogId, props.modelValue);

// 自动收缩功能
const { initAutoShrink, destroyAutoShrink, isShrunk, restoreDialog } = useAutoShrink(dialogId, {
  enabled: props.autoShrink,
  shrinkSize: props.shrinkSize,
  edgeThreshold: 20
});

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  newVal => {
    dialogVisible.value = newVal;
    dialogManager.updateVisible(dialogId, newVal);
    if (newVal) {
      // 对话框打开时激活并初始化自动收缩
      nextTick(() => {
        dialogManager.activate(dialogId);
        currentZIndex.value = dialogInstance.zIndex;
        initAutoShrink();
        emit("open");
        nextTick(() => {
          emit("opened");
        });
      });
    } else {
      // 对话框关闭时清理
      destroyAutoShrink();
      emit("close");
      nextTick(() => {
        emit("closed");
      });
    }
  }
);

// 监听内部状态变化，同步到父组件
watch(dialogVisible, newVal => {
  emit("update:modelValue", newVal);
  dialogManager.updateVisible(dialogId, newVal);
});

// 监听props位置和尺寸变化
watch(
  () => [props.left, props.top, props.width, props.height],
  ([newLeft, newTop, newWidth, newHeight]) => {
    dialogPosition.value.x = newLeft || 0;
    dialogPosition.value.y = newTop || 0;
    dialogSize.value.width = newWidth || 500;
    dialogSize.value.height = newHeight || 400;
  },
  { deep: true }
);

// 事件处理函数
const handleOverlayClick = () => {
  if (props.closeOnClickModal) {
    handleClose();
  }
};

const handleDialogClick = (event: Event) => {
  if (dialogVisible.value) {
    // 阻止事件冒泡，防止点击穿透到下层弹框
    event.stopPropagation();
    dialogManager.activate(dialogId);
    currentZIndex.value = dialogInstance.zIndex;
  }
};

const handleClose = () => {
  if (props.beforeClose) {
    props.beforeClose(() => {
      dialogVisible.value = false;
    });
  } else {
    dialogVisible.value = false;
  }
};

const handleActivated = () => {
  isActive.value = true;
  dialogManager.activate(dialogId);
  currentZIndex.value = dialogInstance.zIndex;
};

const handleDeactivated = () => {
  isActive.value = false;
};

const handleDragStart = () => {
  isDragging.value = true;
  emit("dragStart");
};

const handleDragging = (x: number, y: number) => {
  dialogPosition.value.x = x;
  dialogPosition.value.y = y;
  emit("dragging", { x, y });
};

const handleDragStop = () => {
  isDragging.value = false;
  emit("dragStop");
};

const handleResizeStart = () => {
  isResizing.value = true;
  emit("resizeStart");
};

const handleResizing = (x: number, y: number, width: number, height: number) => {
  dialogPosition.value.x = x;
  dialogPosition.value.y = y;
  dialogSize.value.width = width;
  dialogSize.value.height = height;
  emit("resizing", { x, y, width, height });
};

const handleResizeStop = () => {
  isResizing.value = false;
  emit("resizeStop");
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.closeOnPressEscape && dialogVisible.value) {
    handleClose();
  }
};

// 生命周期管理
onMounted(() => {
  // 添加键盘事件监听
  document.addEventListener("keydown", handleKeydown);

  // 如果初始状态为可见，则激活
  if (props.modelValue) {
    nextTick(() => {
      dialogManager.activate(dialogId);
      currentZIndex.value = dialogInstance.zIndex;
      initAutoShrink();
    });
  }
});

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener("keydown", handleKeydown);

  // 组件销毁时清理
  destroyAutoShrink();
  dialogManager.unregister(dialogId);
});

// 暴露方法给父组件
defineExpose({
  /** 打开对话框 */
  open: () => {
    dialogVisible.value = true;
  },
  /** 关闭对话框 */
  close: () => {
    dialogVisible.value = false;
  },
  /** 激活对话框 */
  activate: () => {
    dialogManager.activate(dialogId);
    currentZIndex.value = dialogInstance.zIndex;
  },
  /** 恢复收缩的对话框 */
  restore: restoreDialog,
  /** 获取对话框ID */
  getId: () => dialogId,
  /** 获取对话框实例信息 */
  getInstance: () => dialogInstance,
  /** 设置位置 */
  setPosition: (x: number, y: number) => {
    dialogPosition.value = { x, y };
  },
  /** 设置尺寸 */
  setSize: (width: number, height: number) => {
    dialogSize.value = { width, height };
  }
});
</script>

<style lang="scss" scoped>
.sc-window-dialog__overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}

.sc-window-dialog {
  position: fixed;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow);
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &__wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-page);
    cursor: move;
    user-select: none;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  &__title-text {
    line-height: 1.5;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
      color: var(--el-text-color-primary);
    }

    &:active {
      background: var(--el-fill-color-dark);
    }
  }

  &__body {
    flex: 1;
    padding: 20px;
    overflow: auto;
    color: var(--el-text-color-primary);
  }

  &__footer {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-page);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  // 主题样式
  &--primary {
    .sc-window-dialog__header {
      background: var(--el-color-primary);
      color: white;
      border-bottom-color: var(--el-color-primary-light-3);

      &:hover {
        background: var(--el-color-primary-light-3);
      }
    }

    .sc-window-dialog__title {
      color: white;
    }

    .sc-window-dialog__close {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
  }

  &--success {
    .sc-window-dialog__header {
      background: var(--el-color-success);
      color: white;
      border-bottom-color: var(--el-color-success-light-3);

      &:hover {
        background: var(--el-color-success-light-3);
      }
    }

    .sc-window-dialog__title {
      color: white;
    }

    .sc-window-dialog__close {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
  }

  &--warning {
    .sc-window-dialog__header {
      background: var(--el-color-warning);
      color: white;
      border-bottom-color: var(--el-color-warning-light-3);

      &:hover {
        background: var(--el-color-warning-light-3);
      }
    }

    .sc-window-dialog__title {
      color: white;
    }

    .sc-window-dialog__close {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
  }

  &--danger {
    .sc-window-dialog__header {
      background: var(--el-color-danger);
      color: white;
      border-bottom-color: var(--el-color-danger-light-3);

      &:hover {
        background: var(--el-color-danger-light-3);
      }
    }

    .sc-window-dialog__title {
      color: white;
    }

    .sc-window-dialog__close {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
  }

  &--info {
    .sc-window-dialog__header {
      background: var(--el-color-info);
      color: white;
      border-bottom-color: var(--el-color-info-light-3);

      &:hover {
        background: var(--el-color-info-light-3);
      }
    }

    .sc-window-dialog__title {
      color: white;
    }

    .sc-window-dialog__close {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
  }

  // 收缩状态
  &--shrunk {
    .sc-window-dialog__header {
      padding: 8px;
      cursor: pointer;
    }

    .sc-window-dialog__title-text {
      display: none;
    }

    .sc-window-dialog__body,
    .sc-window-dialog__footer {
      display: none;
    }
  }
}

// 拖拽调整大小的样式覆盖
:deep(.vdr) {
  border: none !important;
}

:deep(.vdr.active) {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7) !important;
}

:deep(.vdr-handle) {
  background: var(--el-color-primary) !important;
  border: 1px solid var(--el-color-primary-dark-2) !important;
}

:deep(.vdr-handle-tl),
:deep(.vdr-handle-tr),
:deep(.vdr-handle-bl),
:deep(.vdr-handle-br) {
  width: 8px !important;
  height: 8px !important;
}

:deep(.vdr-handle-tm),
:deep(.vdr-handle-bm) {
  width: 20px !important;
  height: 6px !important;
}

:deep(.vdr-handle-ml),
:deep(.vdr-handle-mr) {
  width: 6px !important;
  height: 20px !important;
}
</style>
