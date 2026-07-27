<template>
  <!-- 任务中心布局（右侧全高面板） -->
  <template v-if="variant === 'task-center'">
    <Teleport to="body">
      <Transition name="task-center-slide">
        <div
          v-if="dialogVisible"
          class="task-center-overlay"
          @click.self="handleOverlayClick"
        >
          <aside
            ref="dialogRef"
            class="sc-dialog sc-dialog--variant-task-center"
            :style="{ zIndex: currentZIndex }"
          >
            <slot />
          </aside>
        </div>
      </Transition>
    </Teleport>
  </template>

  <!-- ElementPlus 原生模式 -->
  <component
    :is="currentDialogComponent"
    v-else-if="mode === 'element'"
    v-model="dialogVisible"
    :title="
      hideHeader ? undefined : iconMode === 'inline' && icon ? undefined : title
    "
    :width="width"
    :top="top"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="!hideHeader && showClose && closeButtonType === 'default'"
    :before-close="handleBeforeClose"
    :draggable="draggable"
    :center="center"
    :destroy-on-close="destroyOnClose"
    :style="dialogRadiusStyle"
    :class="[
      'sc-dialog',
      `sc-dialog--${type}`,
      resolvedSkin ? `skin--${resolvedSkin}` : '',
      {
        'has-float-icon': icon && iconMode === 'float',
        'sc-dialog--headerless': (hideHeader && !showHeader) || (layout === 'simple' && closeButtonType !== 'default'),
        'sc-dialog--pseudo-header': showHeader,
        'sc-dialog--close-in-header': closeButtonType === 'default',
        'sc-dialog--close-external': closeButtonType === 'external',
      }
    ]"
    :data-skin="resolvedSkin || undefined"
    @open="$emit('open')"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <!-- 浮动图标（float 模式） -->
    <template v-if="!hideHeader && !showHeader" #header>
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

    <button
      v-if="showClose && closeButtonType === 'external' && !showHeader"
      type="button"
      class="sc-dialog__btn sc-dialog__external-close"
      @click="handleClose"
    >
      <IconifyIconOnline icon="ep:close" />
    </button>

    <!-- 精简伪 header：showHeader 模式 -->
    <div
      v-if="showHeader"
      class="sc-dialog__pseudo-header"
    >
      <slot v-if="$slots['pseudo-header']" name="pseudo-header" />
      <template v-else>
        <span v-if="title" class="sc-dialog__pseudo-title">{{ title }}</span>
        <button
          v-if="showClose"
          type="button"
          class="sc-dialog__btn sc-dialog__pseudo-close"
          @click="handleClose"
        >
          <IconifyIconOnline icon="ep:close" />
        </button>
      </template>
    </div>

    <div
      class="sc-dialog__body-shell"
      :class="{ 'has-body-close': hideHeader && showClose && closeButtonType === 'default' && !showHeader }"
    >
      <button
        v-if="hideHeader && showClose && closeButtonType === 'default' && !showHeader"
        type="button"
        class="sc-dialog__btn sc-dialog__body-close"
        @click="handleClose"
      >
        <IconifyIconOnline icon="ep:close" />
      </button>
      <slot />
    </div>

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
            resolvedSkin ? `sc-dialog-dock-icon--skin-${resolvedSkin}` : '',
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
              resolvedSkin ? `skin--${resolvedSkin}` : '',
              {
                'is-dragging': isDragging,
                'is-resizing': isResizing,
                'is-maximized': isMaximized,
                'has-float-icon': icon && iconMode === 'float'
              }
            ]"
            :data-skin="resolvedSkin || undefined"
            :style="[dialogStyle, dialogRadiusStyle]"
            @mousedown.capture="handleDialogMouseDown"
          >
            <!-- 浮动图标（float 模式） -->
            <div v-if="icon && iconMode === 'float'" class="sc-dialog__float-icon" :style="floatIconStyle">
              <component :is="iconComponentName" :icon="icon" :style="{ fontSize: `${iconSize}px`, color: '#fff' }" />
            </div>

            <!-- 头部 -->
            <div
              v-if="!hideHeader && !showHeader"
              class="sc-dialog__header"
              @mousedown="onHeaderMouseDown"
            >
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
                <button
                  v-if="showClose && closeButtonType === 'default'"
                  class="sc-dialog__btn sc-dialog__close"
                  @click="handleClose"
                >
                  <IconifyIconOnline icon="ep:close" />
                </button>
              </div>
            </div>

            <!-- 精简伪 header：showHeader 模式 -->
            <div
              v-if="showHeader"
              class="sc-dialog__pseudo-header"
            >
              <slot v-if="$slots['pseudo-header']" name="pseudo-header" />
              <template v-else>
                <span v-if="title" class="sc-dialog__pseudo-title">{{ title }}</span>
                <button
                  v-if="showClose"
                  type="button"
                  class="sc-dialog__btn sc-dialog__pseudo-close"
                  @click="handleClose"
                >
                  <IconifyIconOnline icon="ep:close" />
                </button>
              </template>
            </div>

            <button
              v-if="showClose && closeButtonType === 'external' && !showHeader"
              type="button"
              class="sc-dialog__btn sc-dialog__external-close"
              @click="handleClose"
            >
              <IconifyIconOnline icon="ep:close" />
            </button>

            <!-- 内容 -->
            <div
              class="sc-dialog__body"
              :class="{ 'sc-dialog__body--with-close': hideHeader && showClose && closeButtonType === 'default' && !showHeader }"
            >
              <button
                v-if="hideHeader && showClose && closeButtonType === 'default' && !showHeader"
                type="button"
                class="sc-dialog__btn sc-dialog__body-close"
                @click="handleClose"
              >
                <IconifyIconOnline icon="ep:close" />
              </button>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick, useAttrs, type PropType, type CSSProperties } from "vue";
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

/** 布局变体 */
type DialogVariant = "default" | "task-center";

/** 关闭按钮类型 */
type DialogCloseButtonType = "default" | "external";

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue?: boolean;
    /** 模式：element(原生) 或 custom(自定义) */
    mode?: DialogMode;
    /** 布局变体：default(标准) 或 task-center(右侧任务面板) */
    variant?: DialogVariant;
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
    /** 是否隐藏 header，隐藏时关闭按钮保留在 body */
    hideHeader?: boolean;
    /** 是否显示精简伪 header（仅含关闭按钮的窄条，hideHeader 此时忽略） */
    showHeader?: boolean;
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
    /** 边框圆角 */
    borderRadius?: string | number;
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
    /** 皮肤：auto 自动读取 data-skin */
    skin?: string;
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
    /** 关闭按钮类型：default(头部内) / external(右上角外置) */
    closeButtonType?: DialogCloseButtonType;
    /** 布局模式：default(标准) 或 simple(精简) */
    layout?: "default" | "simple";
  }>(),
  {
    modelValue: false,
    mode: "element",
    variant: "default",
    title: "",
    type: "default",
    width: "50%",
    top: "2vh",
    modal: true,
    appendToBody: true,
    lockScroll: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    showClose: true,
    hideHeader: false,
    showHeader: false,
    draggable: true,
    center: false,
    destroyOnClose: false,
    resizable: false,
    minSize: () => ({ width: 300, height: 200 }),
    maxSize: () => ({ width: Infinity, height: Infinity }),
    borderRadius: "",
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
    skin: "auto",
    useTaskbar: false,
    group: "",
    dragOutside: false,
    memoryId: "",
    memoryEnabled: false,
    closeButtonType: "default",
    layout: "default"
  }
);

const emit = defineEmits(["update:modelValue", "open", "opened", "close", "closed", "confirm", "cancel", "minimize", "maximize", "restore"]);
const attrs = useAttrs();

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

// 使用主题组件条件导入
const { currentComponent } = useThemeComponent("ElDialog");

// 当前实际渲染的组件（仅用于 element 模式）
// 如果主题组件加载失败，回退到 Element Plus 原生组件
const currentDialogComponent = computed(() => {
  const component = currentComponent.value;
  // 如果组件为 null，回退到 ElDialog
  return component || ElDialog;
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

const normalizeSkin = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const resolvedSkin = computed(() => {
  const propSkin = normalizeSkin(props.skin);
  if (propSkin && propSkin !== "auto") {
    return propSkin;
  }

  const attrSkin = normalizeSkin(attrs["data-skin"]);
  if (attrSkin && attrSkin !== "auto") {
    return attrSkin;
  }

  if (typeof document !== "undefined") {
    const htmlSkin = normalizeSkin(
      document.documentElement?.getAttribute("data-skin"),
    );
    if (htmlSkin && htmlSkin !== "auto") {
      return htmlSkin;
    }

    const bodySkin = normalizeSkin(document.body?.getAttribute("data-skin"));
    if (bodySkin && bodySkin !== "auto") {
      return bodySkin;
    }
  }

  return "";
});

const floatIconStyle = computed<CSSProperties>(() => ({
  background: typeColor.value,
  boxShadow: `0 4px 12px ${typeColor.value}66`
}));

const dialogStyle = computed<CSSProperties>(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  marginTop: props.top
}));

const dialogRadiusStyle = computed<CSSProperties>(() => {
  if (props.borderRadius === "" || props.borderRadius === undefined || props.borderRadius === null) {
    return {};
  }
  return {
    "--sc-dialog-radius":
      typeof props.borderRadius === "number"
        ? `${props.borderRadius}px`
        : props.borderRadius,
  } as CSSProperties;
});

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
// @use "@/styles/mixins.scss" as *;

.sc-dialog {
  position: relative;
  border-radius: var(--sc-dialog-radius, var(--stitch-lay-radius-lg));

  &.has-float-icon {
    margin-top: 40px !important;
    overflow: visible;

    .el-dialog__header {
      padding-top: 30px;
    }
  }
}

.sc-dialog:not(.sc-dialog--custom) {
  overflow: hidden;
}

.sc-dialog:not(.sc-dialog--custom) :deep(.el-dialog__header) {
  border-radius: var(--sc-dialog-radius, var(--stitch-lay-radius-lg))
    var(--sc-dialog-radius, var(--stitch-lay-radius-lg)) 0 0;
}

.sc-dialog.sc-dialog--headerless:not(.sc-dialog--custom) :deep(.el-dialog__header) {
  display: none;
}

.sc-dialog.sc-dialog--headerless:not(.sc-dialog--custom) :deep(.el-dialog__body) {
  position: relative;
  padding-top: 20px;
}

// Pseudo-header 模式：隐藏原生 header，显示自定义精简化 header
.sc-dialog.sc-dialog--pseudo-header:not(.sc-dialog--custom) :deep(.el-dialog__header) {
  display: none;
}

.sc-dialog.sc-dialog--pseudo-header:not(.sc-dialog--custom) :deep(.el-dialog__body) {
  position: relative;
  padding-top: 0;
}

.sc-dialog__pseudo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  min-height: 32px;
  padding: 0 12px;
  background: color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 40%);
  border-bottom: 1px solid var(--stitch-lay-border);
  border-radius: var(--sc-dialog-radius, var(--stitch-lay-radius-lg))
    var(--sc-dialog-radius, var(--stitch-lay-radius-lg)) 0 0;
  position: relative;
  z-index: 10;
}

.sc-dialog__pseudo-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--stitch-lay-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
  line-height: 32px;
  user-select: none;
}

.sc-dialog__pseudo-close {
  width: 24px;
  height: 24px;
  font-size: 14px;
  flex-shrink: 0;
  border-radius: 4px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}

// 关闭按钮在 header 内：紧凑 header
.sc-dialog.sc-dialog--close-in-header:not(.sc-dialog--custom)
  :deep(.el-dialog__header) {
  padding: 14px 18px 12px;
}

.sc-dialog.sc-dialog--close-in-header:not(.sc-dialog--custom)
  :deep(.el-dialog__body) {
  padding-top: 20px;
}

// 关闭按钮外置 + headerless：隐藏原生 header
.sc-dialog.sc-dialog--close-external.sc-dialog--headerless:not(.sc-dialog--custom)
  :deep(.el-dialog__header) {
  display: none;
}

.sc-dialog.sc-dialog--close-external.sc-dialog--headerless:not(.sc-dialog--custom)
  :deep(.el-dialog__body) {
  position: relative;
  padding-top: 24px;
}

// 关闭按钮外置 + pseudo-header：隐藏原生 header
.sc-dialog.sc-dialog--close-external.sc-dialog--pseudo-header:not(.sc-dialog--custom)
  :deep(.el-dialog__header) {
  display: none;
}

.sc-dialog.sc-dialog--close-external.sc-dialog--pseudo-header:not(.sc-dialog--custom)
  :deep(.el-dialog__body) {
  position: relative;
  padding-top: 0;
}

.sc-dialog:not(.sc-dialog--custom) :deep(.el-dialog__footer) {
  border-radius: 0 0 var(--sc-dialog-radius, var(--stitch-lay-radius-lg))
    var(--sc-dialog-radius, var(--stitch-lay-radius-lg));
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
  border-radius: var(--sc-dialog-radius, var(--stitch-lay-radius-lg))
    var(--sc-dialog-radius, var(--stitch-lay-radius-lg)) 0 0;
  cursor: move;
  transition: var(--stitch-lay-transition);
}

.sc-dialog__header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-dialog__body-shell {
  position: relative;
  min-height: 0;
}

.sc-dialog__body-shell.has-body-close {
  padding-right: 40px;
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

.sc-dialog__body-close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
}

.sc-dialog__external-close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 20;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--stitch-lay-border), transparent 20%);
  background: color-mix(in srgb, var(--stitch-lay-bg-panel), white 28%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
  transform: translate(42%, -42%);

  &:hover {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    box-shadow: 0 12px 26px rgba(239, 68, 68, 0.16);
  }
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
  position: relative;
}

.sc-dialog__body.sc-dialog__body--with-close {
  padding-top: 56px;
}

.sc-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 60%) 0%, color-mix(in srgb, var(--stitch-lay-bg-panel), transparent 20%) 100%);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--stitch-lay-border);
  border-radius: 0 0 var(--sc-dialog-radius, var(--stitch-lay-radius-lg))
    var(--sc-dialog-radius, var(--stitch-lay-radius-lg));
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
      border-radius: var(--sc-dialog-radius, 8px) var(--sc-dialog-radius, 8px) 0 0;
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

// ==================== 任务中心布局 (variant="task-center") ====================

// 遮罩
.task-center-overlay {
  position: fixed;
  inset: 0;
  z-index: 4980;
  background: rgba(8, 15, 26, 0.18);
  backdrop-filter: blur(0px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

// 右侧面板
.sc-dialog--variant-task-center {
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: min(440px, calc(100vw - 24px));
  z-index: 5000;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--task-center-panel-border, rgba(148, 163, 184, 0.16));
  border-radius: 28px;
  background: var(--task-center-panel-bg, rgba(248, 250, 252, 0.96));
  box-shadow: var(--task-center-panel-shadow, 0 28px 60px rgba(15, 23, 42, 0.24));
  backdrop-filter: blur(var(--task-center-panel-blur, 8px));
  contain: layout paint style;
  will-change: transform;

  // 暗色模式
  @at-root html.dark & {
    --task-center-panel-bg: rgba(15, 23, 42, 0.9);
    --task-center-panel-border: rgba(148, 163, 184, 0.18);
    --task-center-panel-shadow: 0 24px 48px rgba(2, 8, 23, 0.42);
  }

  // Future-tech 皮肤
  @at-root html[data-skin="tech"] & {
    --task-center-panel-bg: linear-gradient(165deg, rgba(4, 10, 28, 0.97), rgba(7, 19, 43, 0.94));
    --task-center-panel-border: rgba(102, 248, 255, 0.24);
    --task-center-panel-shadow: 0 26px 56px rgba(0, 187, 255, 0.12);
  }

  // 移动端适配
  @media (max-width: 768px) {
    top: 6px;
    right: 6px;
    bottom: 6px;
    width: calc(100vw - 12px);
  }
}

// Slide 过渡动画
.task-center-slide-enter-active,
.task-center-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease;

  .sc-dialog--variant-task-center {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease;
  }
}

.task-center-slide-enter-from,
.task-center-slide-leave-to {
  opacity: 0;

  .sc-dialog--variant-task-center {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
