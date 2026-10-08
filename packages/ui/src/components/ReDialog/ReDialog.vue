<script setup lang="ts">
/**
 * ReDialog —— 弹窗组件
 *
 * 透传 el-dialog 全部能力，v-model 控制显隐。
 * 增强：
 *   - layout："el"（默认 el-dialog）/ "modern"（现代化扁平弹窗，异步加载）
 *   - draggable：可拖拽头部移动弹窗
 *   - fullscreenable：右上角显示全屏切换
 *   - confirmLoading：确认按钮 loading 态（常用于提交场景）
 *   - cancelText / okText：确认/取消按钮文案
 *   - footer 三态：未传时只渲染业务自定义 #footer 插槽、不渲染自带按钮；
 *     show-footer / footer-hidden 显式开启才出自带「取消/确认」按钮
 *   - headless：隐藏 header，右上角圆形关闭按钮替代（圆心定位）
 *   - responsive：基于 @vueuse/core 自动响应式（移动端默认全屏）
 *
 * 说明：原 `layout="windows"` 变体（layouts/WindowsLayout.vue）经跨行审计确认
 * 全仓无人使用，已移除；需要时从 backups/ui-unused-layouts-retire-20260926/ 取回。
 */
import { computed, defineAsyncComponent, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { FullScreen, Crop } from "@element-plus/icons-vue";
import ReDialogCloseFab from "./CloseFab.vue";
import { useResponsiveDialog } from "./composables/useResponsiveDialog";
import "../shared/modern-vars.css";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReDialog", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-dialog）/ "modern"（现代化扁平弹窗） */
    layout?: "el" | "modern";
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
    /**
     * 底部区域（自带确认/取消按钮）三态：
     *   - undefined（未传，新默认）：只在业务提供 #footer 插槽时渲染插槽内容，
     *     自带按钮默认不渲染；要自带按钮需显式传 show-footer（或 footer-hidden=false）。
     *   - true：渲染自带按钮（提供 #footer 插槽时插槽内容优先）。
     *   - false：整个底部区域不渲染（即使有 #footer 插槽，与历史显式传 false 语义一致）。
     */
    showFooter?: boolean;
    /** showFooter 的反义别名（koi 主题惯用写法），两者同时传时以 showFooter 为准 */
    footerHidden?: boolean;
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
    // showFooter / footerHidden 必须显式 default: undefined：Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false（resolvePropValue: isAbsent && !hasDefault → false），
    // footerMode 的「未传」分支将永远不可达，业务自定义 #footer 插槽也会被误吞。
    showFooter: undefined,
    footerHidden: undefined,
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

/**
 * footer 三态归一：true=渲染自带按钮 / false=整个底部不渲染 / undefined=未传
 * （只渲染业务 #footer 插槽，不渲染自带按钮）。
 */
const footerMode = computed<boolean | undefined>(() => {
  if (props.showFooter !== undefined) return props.showFooter;
  if (props.footerHidden !== undefined) return !props.footerHidden;
  return undefined;
});

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
    :fullscreen="resolved.fullscreen"
    :confirm-loading="confirmLoading"
    :ok-text="okText"
    :cancel-text="cancelText"
    :show-ok="showOk"
    :show-cancel="showCancel"
    :show-footer="footerMode"
    :headless="headless"
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
    <!-- 业务自定义 header 优先透传（el-dialog → ReDialog 迁移时头部插槽不丢）；
         draggable 时外包一层拖拽容器，保证自定义头也能拖动 -->
    <template v-if="$slots.header && !headless" #header>
      <div
        v-if="draggable"
        class="re-dialog__header-inner"
        :style="{ cursor: draggable && !isFullscreen ? 'move' : 'default' }"
        @mousedown="onHeaderMouseDown"
      >
        <slot name="header" />
      </div>
      <slot v-else name="header" />
    </template>

    <!-- 无业务 header 时，draggable / fullscreenable 使用自带 header（拖拽 + 全屏按钮） -->
    <template v-else-if="(draggable || fullscreenable) && !headless" #header>
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

            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <el-icon><Crop v-if="isFullscreen" /><FullScreen v-else /></el-icon>
          </ElButton>
        </div>
      </div>
    </template>

    <slot />

    <!-- footer 三态：显式 false=不渲染；true=渲染自带按钮；未传=只渲染业务 #footer 插槽 -->
    <template v-if="footerMode !== false && (footerMode === true || !!$slots.footer)" #footer>
      <slot name="footer" :ok="onOk" :cancel="onCancel">
        <template v-if="footerMode === true">
          <ElButton v-if="showCancel" @click="onCancel">{{ cancelText }}</ElButton>
          <ElButton v-if="showOk" type="primary" :loading="confirmLoading" @click="onOk">{{ okText }}</ElButton>
        </template>
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
