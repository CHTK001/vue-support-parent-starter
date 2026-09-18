<script setup lang="ts">
/**
 * ReDialog Modern 布局 —— 现代化扁平弹窗
 *
 * 设计特点：
 *   - 大圆角容器（16px）
 *   - 扁平 header（无分割线，间距区分）
 *   - 扁平 footer 按钮
 *   - 柔和遮罩层
 */
import { computed, defineAsyncComponent, ref, watch } from "vue";
import "../../shared/modern-vars.css";

const ReDialogCloseFab = defineAsyncComponent(() => import("../CloseFab.vue"));

defineOptions({ name: "ReDialogModern", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    width?: string | number;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    showClose?: boolean;
    destroyOnClose?: boolean;
    modal?: boolean;
    draggable?: boolean;
    fullscreenable?: boolean;
    fullscreen?: boolean;
    confirmLoading?: boolean;
    okText?: string;
    cancelText?: string;
    /** 兼容旧写法 confirm-text / cancel-text */
    confirmText?: string;
    cancelButtonText?: string;
    showOk?: boolean;
    showCancel?: boolean;
    showFooter?: boolean;
    /** 无头模式：隐藏 header，右上角圆形关闭 FAB */
    headless?: boolean;
    /** 启用响应式 */
    responsive?: boolean;
    /** 移动端断点 */
    mobileBreakpoint?: number;
    /** 紧凑模式：减小 body/header/footer 内边距 */
    compact?: boolean;
    /** 弹窗距顶部偏移 */
    top?: string;
  }>(),
  {
    title: "",
    width: "50%",
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    destroyOnClose: false,
    modal: true,
    draggable: false,
    fullscreenable: false,
    fullscreen: false,
    confirmLoading: false,
    okText: "确定",
    cancelText: "取消",
    confirmText: undefined,
    cancelButtonText: undefined,
    showOk: true,
    showCancel: true,
    showFooter: true,
    headless: false,
    responsive: false,
    mobileBreakpoint: 768,
    compact: false,
    top: "15vh",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  (e: "fullscreen-change", v: boolean): void;
  (e: "close-fab"): void;
}>();

const isFullscreen = ref<boolean>(props.fullscreen);
watch(() => props.fullscreen, (v) => (isFullscreen.value = v));

// 兼容 confirm-text / cancel-text 旧写法
const resolvedOkText = computed(() => props.confirmText ?? props.okText);
const resolvedCancelText = computed(() => props.cancelButtonText ?? props.cancelText);

const dialogStyle = ref<Record<string, string>>({});
const dragState = ref<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

function onHeaderMouseDown(e: MouseEvent): void {
  if (!props.draggable || isFullscreen.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  dragState.value = { x: e.clientX, y: e.clientY, offsetX: rect.left, offsetY: rect.top };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}
function onMouseMove(e: MouseEvent): void {
  if (!dragState.value) return;
  dialogStyle.value = {
    left: `${dragState.value.offsetX + e.clientX - dragState.value.x}px`,
    top: `${dragState.value.offsetY + e.clientY - dragState.value.y}px`,
    marginLeft: "0", marginTop: "0",
  };
}
function onMouseUp(): void {
  dragState.value = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

function onOk(): void { if (props.confirmLoading) return; emit("ok"); }
function onCancel(): void { emit("cancel"); visible.value = false; }
function closeByFab(): void {
  visible.value = false;
  emit("update:modelValue", false);
  emit("close-fab");
}
function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
  if (!isFullscreen.value) dialogStyle.value = {};
  emit("fullscreen-change", isFullscreen.value);
}

const mergedStyle = computed<Record<string, string>>(() => {
  if (isFullscreen.value) {
    return { left: "0", top: "0", width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh", marginTop: "0", marginLeft: "0" }
  }
  if (Object.keys(dialogStyle.value).length) return dialogStyle.value
  return { ...dialogStyle.value, top: props.top }
})

const widthStyle = computed(() => {
  const w = props.width;
  return typeof w === "number" ? `${w}px` : w;
});

function onMaskClick(): void {
  if (props.closeOnClickModal) { visible.value = false; emit("update:modelValue", false); }
}

// ESC close
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && visible.value && props.closeOnPressEscape) {
      visible.value = false;
      emit("update:modelValue", false);
    }
  });
}
</script>

<template>
  <Teleport to="body">
    <Transition name="rm-dialog-fade">
      <div v-if="visible" class="rm-dialog-overlay" @click.self="onMaskClick">
        <div
          :class="['rm-dialog', { 'rm-dialog--fullscreen': isFullscreen, 'rm-dialog--compact': compact }]"
          :style="{ ...mergedStyle, width: isFullscreen ? undefined : widthStyle }"
          v-bind="$attrs"
        >
          <!-- Header（headless 隐藏） -->
          <div
            v-if="!headless"
            class="rm-dialog__header"
            :style="{ cursor: draggable && !isFullscreen ? 'move' : 'default' }"
            @mousedown="onHeaderMouseDown"
          >
            <span class="rm-dialog__title">{{ title }}</span>
            <div class="rm-dialog__header-actions">
              <button v-if="fullscreenable" class="rm-dialog__header-btn" type="button" @click="toggleFullscreen">
                {{ isFullscreen ? '⤢' : '⤡' }}
              </button>
              <button v-if="showClose" class="rm-dialog__close" type="button" @click="onCancel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="rm-dialog__body" :class="{ 'rm-dialog__body--headless': headless }">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="showFooter" class="rm-dialog__footer">
            <slot name="footer" :ok="onOk" :cancel="onCancel">
              <button v-if="showCancel" class="rm-dialog__btn rm-dialog__btn--cancel" type="button" @click="onCancel">{{ resolvedCancelText }}</button>
              <button
                v-if="showOk"
                :class="['rm-dialog__btn', 'rm-dialog__btn--ok', { 'is-loading': confirmLoading }]"
                type="button"
                :disabled="confirmLoading"
                @click="onOk"
              >
                <span v-if="confirmLoading" class="rm-dialog__spinner">
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round"/></svg>
                </span>
                {{ resolvedOkText }}
              </button>
            </slot>
          </div>

          <!-- headless：圆心右上角关闭 FAB -->
          <ReDialogCloseFab v-if="headless" @click="closeByFab" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rm-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rm-overlay);
}
.rm-dialog {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  background: var(--rm-bg);
  border-radius: var(--rm-radius-xl);
  box-shadow: var(--rm-shadow-lg);
  overflow: hidden;
}
.rm-dialog--fullscreen {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

/* Header */
.rm-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 0;
  user-select: none;
}
.rm-dialog--compact .rm-dialog__header {
  padding: var(--rm-compact-header-padding);
}
.rm-dialog__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--rm-text);
}
.rm-dialog__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rm-dialog__header-btn,
.rm-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--rm-radius-sm);
  color: var(--rm-text-secondary);
  cursor: pointer;
  transition: background var(--rm-transition), color var(--rm-transition);
  font-size: 16px;
}
.rm-dialog__header-btn:hover,
.rm-dialog__close:hover {
  background: var(--rm-bg-hover);
  color: var(--rm-text);
}
.rm-dialog__close svg { width: 16px; height: 16px; }

/* Body */
.rm-dialog__body {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  color: var(--rm-text-regular);
  font-size: var(--rm-font-md);
  line-height: 1.6;
}
.rm-dialog--compact .rm-dialog__body {
  padding: var(--rm-compact-body-padding);
}
.rm-dialog__body--headless {
  padding-top: 36px;
}
.rm-dialog--compact .rm-dialog__body--headless {
  padding-top: var(--rm-compact-body-headless-padding-top);
}

/* Footer */
.rm-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 16px;
}
.rm-dialog--compact .rm-dialog__footer {
  padding: var(--rm-compact-footer-padding);
}
.rm-dialog--compact .rm-dialog__btn {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
  border-radius: var(--rm-compact-btn-radius);
}
.rm-dialog__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--rm-height);
  padding: var(--rm-padding);
  border-radius: var(--rm-radius);
  font-size: var(--rm-font-md);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--rm-transition), color var(--rm-transition), border-color var(--rm-transition);
  border: 1px solid var(--rm-border);
  background: var(--rm-bg);
  color: var(--rm-text-regular);
  font-family: inherit;
}
.rm-dialog__btn--cancel:hover { border-color: var(--rm-border-hover); }
.rm-dialog__btn--ok {
  background: var(--rm-primary);
  border-color: var(--rm-primary);
  color: var(--rm-text-white);
}
.rm-dialog__btn--ok:hover { background: var(--rm-primary-hover); border-color: var(--rm-primary-hover); }
.rm-dialog__btn--ok.is-loading { opacity: 0.8; cursor: wait; }
.rm-dialog__spinner { display: inline-flex; animation: rm-spin 0.8s linear infinite; }
.rm-dialog__spinner svg { width: 14px; height: 14px; }
@keyframes rm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Transition */
.rm-dialog-fade-enter-active,
.rm-dialog-fade-leave-active { transition: opacity 200ms ease; }
.rm-dialog-fade-enter-from,
.rm-dialog-fade-leave-to { opacity: 0; }
</style>
