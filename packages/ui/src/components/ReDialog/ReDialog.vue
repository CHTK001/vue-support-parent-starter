<script setup lang="ts">
/**
 * ReDialog —— 弹窗组件
 *
 * 透传 el-dialog 全部能力，v-model 控制显隐。
 * 增强：
 *   - draggable：可拖拽头部移动弹窗
 *   - fullscreenable：右上角显示全屏切换
 *   - confirmLoading：确认按钮 loading 态（常用于提交场景）
 *   - cancelText / okText：确认/取消按钮文案
 *   - 默认带 footer 插槽 + 取消/确认按钮，无需每次写
 *   - headless：隐藏 header，右上角圆形关闭按钮替代（圆心定位）
 *   - responsive：基于 @vueuse/core 自动响应式（移动端默认全屏）
 *   - windows 布局已自带 8 方向缩放（边缘拖拽放大）与左右边缘半宽 */
import { computed, defineAsyncComponent, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { FullScreen, Crop } from "@element-plus/icons-vue";
import ReDialogCloseFab from "./CloseFab.vue";
import { useResponsiveDialog } from "./composables/useResponsiveDialog";
import "../shared/modern-vars.css";

const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));
const WindowsLayout = defineAsyncComponent(() => import("./layouts/WindowsLayout.vue"));

defineOptions({ name: "ReDialog", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-dialog）/ "modern"（现代化扁平弹窗）/ "windows"（类 Windows 窗口） */
    layout?: "el" | "modern" | "windows";
    /** 窗口唯一标识；传入后位置/尺寸/状态自动持久化到 localStorage */
    id?: string;
    title?: string;
    width?: string | number;
    top?: string;
    appendToBody?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    showClose?: boolean;
    beforeClose?: (done: () => void) => void;
    destroyOnClose?: boolean;
    modal?: boolean;
    /** 是否可拖拽 */
    draggable?: boolean;
    /** 是否可全屏 */
    fullscreenable?: boolean;
    /** 初始全屏 */
    fullscreen?: boolean;
    /** 确认按钮 loading 态 */
    confirmLoading?: boolean;
    /** 确认按钮文案 */
    okText?: string;
    /** 取消按钮文案 */
    cancelText?: string;
    /** 是否显示确认按钮（默认 true） */
    showOk?: boolean;
    /** 是否显示取消按钮（默认 true） */
    showCancel?: boolean;
    /** 是否显示默认 footer（确认/取消按钮） */
    showFooter?: boolean;
    /** 无头模式：隐藏 header，右上角圆形关闭 FAB 替代（圆心在右上角） */
    headless?: boolean;
    /** 启用响应式（移动端自动全屏）；默认 true */
    responsive?: boolean;
    /** 移动端断点（<= 视为移动端） */
    mobileBreakpoint?: number;
    /** 移动端自动全屏；默认 true */
    mobileFullscreen?: boolean;
    /** 紧凑模式：减小弹窗内边距 */
    compact?: boolean;
  }>(),
  {
    layout: "el",
    id: "",
    title: "",
    width: "65%",
    top: "15vh",
    appendToBody: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    beforeClose: undefined,
    destroyOnClose: false,
    modal: true,
    draggable: false,
    fullscreenable: false,
    fullscreen: false,
    confirmLoading: false,
    okText: "确定",
    cancelText: "取消",
    showOk: true,
    showCancel: true,
    showFooter: true,
    headless: false,
    responsive: true,
    mobileBreakpoint: 768,
    mobileFullscreen: true,
    compact: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  (e: "fullscreen-change", v: boolean): void;
}>();

/* ===== 全屏状态 ===== */
const isFullscreen = ref<boolean>(props.fullscreen);
watch(
  () => props.fullscreen,
  (v) => (isFullscreen.value = v),
);

/* ===== 响应式（@vueuse/core） ===== */
const responsive = useResponsiveDialog(
  { width: props.width, top: props.top, fullscreen: isFullscreen.value },
  {
    mobileBreakpoint: props.mobileBreakpoint,
    mobileFullscreen: props.mobileFullscreen,
  },
);

// 同步窗口尺寸变化到 composable，避免 ref 引起的耦合
const resolved = computed(() => {
  if (!props.responsive) {
    return {
      width: props.width,
      top: props.top,
      fullscreen: isFullscreen.value,
    };
  }
  return {
    width: responsive.width.value,
    top: responsive.top.value,
    // 显式全屏（按钮切换）与响应式自动全屏取并集
    fullscreen: isFullscreen.value || responsive.fullscreen.value,
  };
});

/* ===== 拖拽状态（el/modern 头部拖拽） ===== */
const dragState = ref<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
const dialogStyle = ref<Record<string, string>>({});

function onHeaderMouseDown(e: MouseEvent): void {
  if (!props.draggable || isFullscreen.value) return;
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  dragState.value = {
    x: e.clientX,
    y: e.clientY,
    offsetX: rect.left,
    offsetY: rect.top,
  };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e: MouseEvent): void {
  if (!dragState.value) return;
  const dx = e.clientX - dragState.value.x;
  const dy = e.clientY - dragState.value.y;
  const left = dragState.value.offsetX + dx;
  const top = dragState.value.offsetY + dy;
  dialogStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    marginLeft: "0",
    marginTop: "0",
  };
}

function onMouseUp(): void {
  dragState.value = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

/* ===== 操作 ===== */
function onOk(): void {
  if (props.confirmLoading) return;
  emit("ok");
}
function onCancel(): void {
  emit("cancel");
  visible.value = false;
}
function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
  if (!isFullscreen.value) dialogStyle.value = {};
  emit("fullscreen-change", isFullscreen.value);
}
function closeByFab(): void {
  if (props.beforeClose) {
    props.beforeClose(() => (visible.value = false));
  } else {
    visible.value = false;
  }
}

/* ===== 组合样式（拖拽 + 全屏 + 响应式） ===== */
const fullscreenStyle = computed<CSSProperties>(() => {
  if (isFullscreen.value || resolved.value.fullscreen) {
    return {
      left: "0",
      top: "0",
      width: "100vw",
      height: "100vh",
      maxWidth: "100vw",
      maxHeight: "100vh",
      marginTop: "0",
      marginLeft: "0",
      borderRadius: "0",
    };
  }
  // 拖拽偏移样式
  if (Object.keys(dialogStyle.value).length) return dialogStyle.value;
  // 响应式宽度样式
  if (props.responsive) return responsive.elStyle.value as CSSProperties;
  return { marginTop: props.top, marginLeft: "auto", marginRight: "auto" };
});

/* ===== headless 下显示隐藏关闭 FAB ===== */
const showCloseFab = computed(() => props.headless);
</script>

<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    v-model="visible"
    :title="title"
    :width="resolved.width"
    :top="resolved.top"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :draggable="draggable"
    :fullscreenable="fullscreenable"
    :fullscreen="fullscreen"
    :confirm-loading="confirmLoading"
    :ok-text="okText"
    :cancel-text="cancelText"
    :show-ok="showOk"
    :show-cancel="showCancel"
    :show-footer="showFooter"
    :headless="headless"
    :responsive="responsive"
    :mobile-breakpoint="mobileBreakpoint"
    :compact="compact"
    v-bind="$attrs"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @ok="onOk"
    @cancel="onCancel"
    @fullscreen-change="(v: boolean) => emit('fullscreen-change', v)"
    @close-fab="closeByFab"
  >
    <slot />
    <template v-if="$slots.footer" #footer="scope">
      <slot name="footer" v-bind="scope" />
    </template>
  </ModernLayout>

  <!-- Windows 式布局（异步加载） -->
  <WindowsLayout
    v-else-if="layout === 'windows'"
    v-model="visible"
    :id="id"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :draggable="draggable"
    :fullscreenable="fullscreenable"
    :fullscreen="fullscreen"
    :confirm-loading="confirmLoading"
    :ok-text="okText"
    :cancel-text="cancelText"
    :show-ok="showOk"
    :show-cancel="showCancel"
    :show-footer="showFooter"
    :headless="headless"
    :responsive="responsive"
    :mobile-breakpoint="mobileBreakpoint"
    :compact="compact"
    v-bind="$attrs"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @ok="onOk"
    @cancel="onCancel"
    @fullscreen-change="(v: boolean) => emit('fullscreen-change', v)"
    @close-fab="closeByFab"
  >
    <slot />
    <template v-if="$slots.footer" #footer="scope">
      <slot name="footer" v-bind="scope" />
    </template>
  </WindowsLayout>

  <!-- 默认 el-dialog 布局 -->
  <ElDialog
    v-else
    v-model="visible"
    v-bind="$attrs"
    :title="headless ? '' : title"
    :width="typeof resolved.width === 'number' ? resolved.width : String(resolved.width)"
    :top="typeof resolved.top === 'number' ? String(resolved.top) : resolved.top"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="headless ? false : showClose"
    :before-close="beforeClose"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :style="fullscreenStyle"
    class="re-dialog"
    :class="{
      're-dialog--draggable': draggable,
      're-dialog--fullscreen': isFullscreen,
      're-dialog--headless': headless,
      're-dialog--responsive': responsive,
      're-dialog--compact': compact,
    }"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <!-- 自定义 header 支持拖拽 + 全屏按钮（headless 下不渲染） -->
    <template v-if="(draggable || fullscreenable) && !headless" #header>
      <div
        class="re-dialog__header-inner"
        :style="{ cursor: draggable && !isFullscreen ? 'move' : 'default' }"
        @mousedown="onHeaderMouseDown"
      >
        <span class="re-dialog__title">{{ title }}</span>
        <div class="re-dialog__header-actions">
          <ElButton
            v-if="fullscreenable"
            link
            size="small"
            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <el-icon><Crop v-if="isFullscreen" /><FullScreen v-else /></el-icon>
          </ElButton>
        </div>
      </div>
    </template>

    <slot />

    <!-- 默认 footer -->
    <template v-if="showFooter" #footer>
      <slot name="footer" :ok="onOk" :cancel="onCancel">
        <ElButton v-if="showCancel" size="small" @click="onCancel">{{ cancelText }}</ElButton>
        <ElButton v-if="showOk" type="primary" size="small" :loading="confirmLoading" @click="onOk">{{ okText }}</ElButton>
      </slot>
    </template>

    <!-- headless 圆心右上角关闭按钮 -->
    <ReDialogCloseFab v-if="showCloseFab" @click="closeByFab" />
  </ElDialog>
</template>

<style scoped>
.re-dialog :deep(.el-dialog__header) {
  cursor: default;
  padding: 4px 20px 0 !important;
  margin-right: 0 !important;
}
.re-dialog__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 20px;
}
.re-dialog__title {
  font-weight: 600;
  font-size: 13px;
}
.re-dialog__header-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.re-dialog--fullscreen :deep(.el-dialog__body) {
  height: calc(100vh - 120px);
  overflow: auto;
}
/* headless 不显示原生 header，但留出 body 顶部留白，避免被 FAB 挡住 */
.re-dialog--headless :deep(.el-dialog__header) {
  display: none;
}
.re-dialog :deep(.el-dialog__body) {
  padding: 8px 20px 12px;
}
/* 非全屏弹窗：body 超过视口高度时出现滚动条，避免内容被裁切（footer 保持在滚动区外） */
.re-dialog:not(.re-dialog--fullscreen) :deep(.el-dialog__body) {
  max-height: calc(84vh - 96px);
  overflow-y: auto;
}
.re-dialog--headless :deep(.el-dialog__body) {
  padding-top: 24px;
}
/* compact 模式下 footer 按钮进一步缩小（使用共享令牌） */
.re-dialog--compact :deep(.el-dialog__footer .el-button) {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
}
</style>
