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
 */
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { ElDialog, ElButton } from "element-plus";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));
/** Windows 式布局组件（按需异步加载） */
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
    /** 是否显示默认 footer（确认/取消按钮） */
    showFooter?: boolean;
  }>(),
  {
    layout: "el",
    id: "",
    title: "",
    width: "50%",
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
    showFooter: true,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  (e: "fullscreen-change", v: boolean): void;
}>();

const isFullscreen = ref<boolean>(props.fullscreen);
watch(
  () => props.fullscreen,
  (v) => (isFullscreen.value = v),
);

/** 拖拽状态 */
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

function onOk(): void {
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

const fullscreenStyle = computed<Record<string, string>>(() =>
  isFullscreen.value
    ? {
        left: "0",
        top: "0",
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        marginTop: "0",
        marginLeft: "0",
      }
    : dialogStyle.value,
);
</script>

<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    v-model="visible"
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
    :show-footer="showFooter"
    v-bind="$attrs"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @ok="onOk"
    @cancel="onCancel"
    @fullscreen-change="(v: boolean) => emit('fullscreen-change', v)"
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
    :show-footer="showFooter"
    v-bind="$attrs"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @ok="onOk"
    @cancel="onCancel"
    @fullscreen-change="(v: boolean) => emit('fullscreen-change', v)"
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
    :title="title"
    :width="width"
    :top="top"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="beforeClose"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :style="fullscreenStyle"
    class="re-dialog"
    :class="{ 're-dialog--draggable': draggable, 're-dialog--fullscreen': isFullscreen }"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <!-- 自定义 header 支持拖拽 + 全屏按钮 -->
    <template v-if="draggable || fullscreenable" #header>
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
            <span>{{ isFullscreen ? '⤢' : '⤡' }}</span>
          </ElButton>
        </div>
      </div>
    </template>

    <slot />

    <!-- 默认 footer -->
    <template v-if="showFooter" #footer>
      <slot name="footer" :ok="onOk" :cancel="onCancel">
        <ElButton @click="onCancel">{{ cancelText }}</ElButton>
        <ElButton type="primary" :loading="confirmLoading" @click="onOk">{{ okText }}</ElButton>
      </slot>
    </template>
  </ElDialog>
</template>

<style scoped>
.re-dialog :deep(.el-dialog__header) {
  cursor: default;
}
.re-dialog__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 24px;
}
.re-dialog__title {
  font-weight: 600;
  font-size: 15px;
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
</style>