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
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
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
    /**
     * 底部区域三态（由基类 ReDialog 透传 footerMode）：
     * true=渲染自带按钮；false=整个底部不渲染；undefined=只渲染业务 #footer 插槽。
     */
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
    // showFooter 显式 default: undefined：Boolean prop「未传且无默认值」会被 Vue 强转成 false，
    // 破坏「未传 = 只渲染业务 #footer 插槽」的三态语义
    showFooter: undefined,
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
const dragState = ref<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

/**
 * modern 弹窗拖拽：用 transform: translate() 位移，而不是 left/top。
 *
 * <p>为什么：.rm-dialog 是 overlay（flex 居中容器）的直接子元素，自身没有 position
 * 定位（居中靠 overlay 的 align-items/justify-content）。left/top 写入 style 对
 * 非定位元素不生效 —— 与 2026-10-23 修的 el 布局手写位移缺陷（.el-dialog 也是普通
 * 块级元素，left/top 无效）同款，表现为拖拽完全无反应。transform 对 flex 子元素
 * 生效且不破坏居中布局，与 el-dialog 原生 useDraggable 的位移方式一致。</p>
 */
function onHeaderMouseDown(e: MouseEvent): void {
  if (!props.draggable || isFullscreen.value) return;
  const el = (e.currentTarget as HTMLElement).closest<HTMLElement>(".rm-dialog");
  const tx = el ? Number(/translate\(([-\d.]+)px/.exec(el.style.transform ?? "")?.[1] ?? 0) : 0;
  const ty = el ? Number(/translate\([-\d.]+px,\s*([-\d.]+)px/.exec(el.style.transform ?? "")?.[1] ?? 0) : 0;
  dragState.value = { startX: e.clientX, startY: e.clientY, tx, ty };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}
function onMouseMove(e: MouseEvent): void {
  if (!dragState.value) return;
  const s = dragState.value;
  const dx = s.tx + (e.clientX - s.startX);
  const dy = s.ty + (e.clientY - s.startY);
  dialogStyle.value = { transform: `translate(${dx}px, ${dy}px)` };
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

/**
 * Esc 关闭。
 *
 * <p><b>原实现的问题（HANDOVER §5.3 D2「已定位未修」）</b>：在 setup 顶层用了
 * <i>匿名</i>处理函数 `window.addEventListener("keydown", ...)` 且**从不注销** ——
 * 匿名函数也没法注销。于是每次挂载都往 `window` 上留一个监听器，
 * 组件卸载后依然存在，反复开关弹窗会持续累积。</p>
 *
 * <p><b>为什么改成这个最小版本</b>：本文件是<b>共用组件</b>，且当前环境无法完成
 * 运行时回归（system 应用的 modern 弹窗进不去 —— 它的 login 接口需要该应用自己的
 * 代理配置）。所以这里**刻意不改动挂载时机与判定条件**（仍然在 setup 时挂、
 * 仍然只在 `visible && closeOnPressEscape` 时响应），
 * 只补上原来缺的那一步：**卸载时注销**。
 * 这样 Esc 的既有行为逐字不变，而被修的正是真正会累积的那部分 —— 卸载后的残留。
 * 若将来能完成运行时回归，再考虑进一步「仅在 visible 期间挂载」。</p>
 */
function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape" && visible.value && props.closeOnPressEscape) {
    visible.value = false;
    emit("update:modelValue", false);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => {
    document.removeEventListener("keydown", onKeydown);
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

          <!-- Footer：显式 false=不渲染；true=渲染自带按钮；未传=只渲染业务插槽 -->
          <div v-if="showFooter === true || (showFooter !== false && !!$slots.footer)" class="rm-dialog__footer">
            <slot name="footer" :ok="onOk" :cancel="onCancel">
              <template v-if="showFooter === true">
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
              </template>
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
  /* 头尾压薄后，整体上限由 85vh 提到 90vh，内容区再多一些 */
  max-height: 90vh;
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
  padding: 10px 14px 0;
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
  padding: 12px 16px;
  overflow-y: auto;
  color: var(--rm-text-regular);
  font-size: var(--rm-font-md);
  line-height: 1.6;
}
.rm-dialog--compact .rm-dialog__body {
  padding: var(--rm-compact-body-padding);
}
.rm-dialog__body--headless {
  padding-top: 32px;
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
  padding: 0 16px 12px;
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
