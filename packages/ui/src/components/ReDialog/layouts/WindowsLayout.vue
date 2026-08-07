<template>
  <!-- 最小化浮标 -->
  <Teleport to="body">
    <div
      v-if="isMinimized"
      class="re-dialog-win__dock"
      :style="dockStyle"
      @click="restoreFromMinimize"
      :title="title"
    >
      <div class="re-dialog-win__dock-icon">
        <slot name="logo">
          <span class="re-dialog-win__dock-letter">{{ title?.charAt(0) || 'W' }}</span>
        </slot>
      </div>
    </div>
  </Teleport>

  <!-- 主窗口 -->
  <Teleport to="body">
    <Transition name="re-dialog-win-fade">
      <div
        v-if="isVisible && !isMinimized"
        :class="[
          're-dialog-win',
          { 're-dialog-win--maximized': isMaximized, 're-dialog-win--dragging': isDragging },
        ]"
        :style="windowStyle"
      >
        <!-- 标题栏 -->
        <div
          class="re-dialog-win__titlebar"
          @mousedown="onTitlebarMouseDown"
          @dblclick="toggleMaximize"
        >
          <div class="re-dialog-win__titlebar-left">
            <div class="re-dialog-win__logo">
              <slot name="logo">
                <span class="re-dialog-win__logo-letter">{{ title?.charAt(0) || 'W' }}</span>
              </slot>
            </div>
            <span class="re-dialog-win__title">{{ title }}</span>
          </div>
          <div class="re-dialog-win__titlebar-actions">
            <button class="re-dialog-win__btn re-dialog-win__btn--minimize" @click="minimize" title="最小化">
              <svg width="10" height="10" viewBox="0 0 10 10"><rect y="8" width="10" height="1" fill="currentColor"/></svg>
            </button>
            <button class="re-dialog-win__btn re-dialog-win__btn--maximize" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'">
              <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>
              <svg v-else width="10" height="10" viewBox="0 0 10 10"><rect x="2.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/><rect x="0.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/></svg>
            </button>
            <button class="re-dialog-win__btn re-dialog-win__btn--close" @click="close" title="关闭">
              <svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2"/></svg>
            </button>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="re-dialog-win__body">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="showFooter" class="re-dialog-win__footer">
          <slot name="footer" :ok="onOk" :cancel="onCancel">
            <button class="re-dialog-win__footer-btn re-dialog-win__footer-btn--cancel" @click="onCancel">
              {{ cancelText }}
            </button>
            <button class="re-dialog-win__footer-btn re-dialog-win__footer-btn--ok" @click="onOk">
              {{ okText }}
            </button>
          </slot>
        </div>

        <!-- 边缘拖拽缩放手柄（最大化时禁用） -->
        <template v-if="!isMaximized">
          <div class="re-dialog-win__resize re-dialog-win__resize--e" @mousedown.stop="onResizeMouseDown($event, 'e')" />
          <div class="re-dialog-win__resize re-dialog-win__resize--s" @mousedown.stop="onResizeMouseDown($event, 's')" />
          <div class="re-dialog-win__resize re-dialog-win__resize--w" @mousedown.stop="onResizeMouseDown($event, 'w')" />
          <div class="re-dialog-win__resize re-dialog-win__resize--se" @mousedown.stop="onResizeMouseDown($event, 'se')" />
          <div class="re-dialog-win__resize re-dialog-win__resize--sw" @mousedown.stop="onResizeMouseDown($event, 'sw')" />
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * WindowsLayout —— 类 Windows 窗口布局
 *
 * 特性：
 *   - 标题栏拖拽移动
 *   - 最小化 → 左下角浮标，点击恢复
 *   - 最大化 / 还原
 *   - 边缘拖拽缩放
 *   - 拖拽到屏幕边缘自动最小化
 *   - id 记忆：位置、尺寸、最小化/最大化状态持久化到 localStorage
 */
import { computed, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { getStorageKey } from "@repo/config";

defineOptions({ name: "WindowsLayout", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    id?: string;
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
    showFooter?: boolean;
    /** 最小化宽度阈值（px），低于此值自动最小化 */
    minWidth?: number;
    /** 默认窗口宽度 */
    defaultWidth?: number;
    /** 默认窗口高度 */
    defaultHeight?: number;
  }>(),
  {
    id: "",
    title: "",
    width: 600,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    destroyOnClose: false,
    modal: true,
    draggable: true,
    fullscreenable: true,
    fullscreen: false,
    confirmLoading: false,
    okText: "确定",
    cancelText: "取消",
    showFooter: true,
    minWidth: 320,
    defaultWidth: 600,
    defaultHeight: 400,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  (e: "fullscreen-change", v: boolean): void;
  (e: "minimize"): void;
  (e: "restore"): void;
}>();

const isVisible = defineModel<boolean>({ default: false });

/* ===== 窗口状态 ===== */
const isMinimized = ref(false);
const isMaximized = ref(props.fullscreen);
const isDragging = ref(false);

/** 窗口位置与尺寸 */
const winX = ref(0);
const winY = ref(0);
const winW = ref(props.defaultWidth);
const winH = ref(props.defaultHeight);

/** 存储 key 子后缀（app 前缀由 getStorageKey 加） */
const DIALOG_SUFFIX = "dialog-win";
function storageKey() {
  return props.id ? getStorageKey(`${DIALOG_SUFFIX}:${props.id}`) : "";
}

/* ===== 持久化 ===== */
function saveState() {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({
      x: winX.value, y: winY.value, w: winW.value, h: winH.value,
      minimized: isMinimized.value, maximized: isMaximized.value,
      visible: isVisible.value,
    }));
  } catch { /* ignore */ }
}

function restoreState() {
  const key = storageKey();
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.x === "number") winX.value = s.x;
    if (typeof s.y === "number") winY.value = s.y;
    if (typeof s.w === "number") winW.value = s.w;
    if (typeof s.h === "number") winH.value = s.h;
    if (typeof s.minimized === "boolean") isMinimized.value = s.minimized;
    if (typeof s.maximized === "boolean") isMaximized.value = s.maximized;
    if (typeof s.visible === "boolean") isVisible.value = s.visible;
  } catch { /* ignore */ }
}

// 监听变化自动保存
watch([isVisible, isMinimized, isMaximized, winX, winY, winW, winH], () => saveState());
onMounted(() => {
  // 居中默认位置
  winX.value = Math.max(0, (window.innerWidth - winW.value) / 2);
  winY.value = Math.max(0, (window.innerHeight - winH.value) / 2);
  // 恢复持久化状态
  restoreState();
});

/* ===== 窗口样式 ===== */
const windowStyle = computed<CSSProperties>(() => {
  if (isMaximized.value) {
    return { left: "0px", top: "0px", width: "100vw", height: "100vh", borderRadius: "0" };
  }
  return {
    left: `${winX.value}px`,
    top: `${winY.value}px`,
    width: `${winW.value}px`,
    height: `${winH.value}px`,
  };
});

const dockStyle = computed<CSSProperties>(() => ({
  position: "fixed",
  left: "16px",
  bottom: "16px",
  zIndex: "99999",
}));

/* ===== 拖拽移动 ===== */
let dragStartX = 0, dragStartY = 0, dragStartWinX = 0, dragStartWinY = 0;

function onTitlebarMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  if (isMaximized.value) return;
  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartWinX = winX.value;
  dragStartWinY = winY.value;
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  e.preventDefault();
}

function onDragMove(e: MouseEvent) {
  winX.value = dragStartWinX + (e.clientX - dragStartX);
  winY.value = dragStartWinY + (e.clientY - dragStartY);
}

function onDragEnd(e: MouseEvent) {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);

  // 拖到顶部边缘 → 最大化
  if (e.clientY <= 2) {
    isMaximized.value = true;
    emit("fullscreen-change", true);
    return;
  }
  // 拖到底部边缘 → 最小化
  if (e.clientY >= window.innerHeight - 4) {
    minimize();
    return;
  }
}

/* ===== 边缘缩放 ===== */
let resizeDir = "";
let resizeStartX = 0, resizeStartY = 0;
let resizeStartW = 0, resizeStartH = 0, resizeStartWinX = 0, resizeStartWinY = 0;

function onResizeMouseDown(e: MouseEvent, dir: string) {
  if (e.button !== 0) return;
  resizeDir = dir;
  resizeStartX = e.clientX;
  resizeStartY = e.clientY;
  resizeStartW = winW.value;
  resizeStartH = winH.value;
  resizeStartWinX = winX.value;
  resizeStartWinY = winY.value;
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
  e.preventDefault();
}

function onResizeMove(e: MouseEvent) {
  const dx = e.clientX - resizeStartX;
  const dy = e.clientY - resizeStartY;

  if (resizeDir.includes("e")) winW.value = Math.max(props.minWidth, resizeStartW + dx);
  if (resizeDir.includes("s")) winH.value = Math.max(200, resizeStartH + dy);
  if (resizeDir.includes("w")) {
    const newW = Math.max(props.minWidth, resizeStartW - dx);
    winX.value = resizeStartWinX + (resizeStartW - newW);
    winW.value = newW;
  }
}

function onResizeEnd() {
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
}

/* ===== 操作 ===== */
function minimize() {
  isMinimized.value = true;
  emit("minimize");
}

function restoreFromMinimize() {
  isMinimized.value = false;
  emit("restore");
}

function toggleMaximize() {
  isMaximized.value = !isMaximized.value;
  emit("fullscreen-change", isMaximized.value);
}

function close() {
  isVisible.value = false;
  isMinimized.value = false;
  emit("update:modelValue", false);
}

function onOk() {
  emit("ok");
}

function onCancel() {
  emit("cancel");
  close();
}

// ESC 关闭
watch(isVisible, (v) => {
  if (v && props.closeOnPressEscape) {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    // cleanup on close
    watch(isVisible, (nv) => {
      if (!nv) document.removeEventListener("keydown", handler);
    }, { once: true });
  }
});
</script>

<style scoped>
.re-dialog-win {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 2000;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}
.re-dialog-win--dragging {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  transition: none;
}
.re-dialog-win--maximized {
  border-radius: 0;
  border: none;
}

/* 标题栏 */
.re-dialog-win__titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 4px 0 12px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border-bottom: 1px solid var(--el-border-color-lighter, #e4e7ed);
  user-select: none;
  cursor: default;
  flex-shrink: 0;
}
.re-dialog-win__titlebar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.re-dialog-win__logo {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--el-color-primary, #409eff);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.re-dialog-win__logo :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 2px;
}
.re-dialog-win__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 标题栏按钮 */
.re-dialog-win__titlebar-actions {
  display: flex;
  align-items: center;
  height: 100%;
}
.re-dialog-win__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular, #606266);
  cursor: pointer;
  transition: background 0.15s ease;
  outline: none;
}
.re-dialog-win__btn:hover {
  background: var(--el-fill-color, #f0f2f5);
}
.re-dialog-win__btn--close:hover {
  background: var(--el-color-danger, #f56c6c);
  color: #fff;
}

/* 内容区 */
.re-dialog-win__body {
  flex: 1;
  overflow: auto;
  padding: 16px;
  min-height: 0;
}

/* Footer */
.re-dialog-win__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter, #e4e7ed);
  flex-shrink: 0;
}
.re-dialog-win__footer-btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}
.re-dialog-win__footer-btn--cancel {
  background: #fff;
  color: var(--el-text-color-regular, #606266);
}
.re-dialog-win__footer-btn--cancel:hover {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.re-dialog-win__footer-btn--ok {
  background: var(--el-color-primary, #409eff);
  color: #fff;
  border-color: var(--el-color-primary, #409eff);
}
.re-dialog-win__footer-btn--ok:hover {
  opacity: 0.9;
}

/* 缩放手柄 */
.re-dialog-win__resize {
  position: absolute;
  z-index: 10;
}
.re-dialog-win__resize--e { top: 0; right: -3px; width: 6px; height: 100%; cursor: ew-resize; }
.re-dialog-win__resize--s { bottom: -3px; left: 0; height: 6px; width: 100%; cursor: ns-resize; }
.re-dialog-win__resize--w { top: 0; left: -3px; width: 6px; height: 100%; cursor: ew-resize; }
.re-dialog-win__resize--se { bottom: -3px; right: -3px; width: 12px; height: 12px; cursor: nwse-resize; }
.re-dialog-win__resize--sw { bottom: -3px; left: -3px; width: 12px; height: 12px; cursor: nesw-resize; }

/* 最小化浮标 */
.re-dialog-win__dock {
  cursor: pointer;
  animation: dock-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.re-dialog-win__dock-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--el-color-primary, #409eff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.re-dialog-win__dock-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}
.re-dialog-win__dock-letter {
  font-size: 18px;
  font-weight: 700;
}

/* 动画 */
.re-dialog-win-fade-enter-active { animation: win-in 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
.re-dialog-win-fade-leave-active { animation: win-out 0.2s ease; }
@keyframes win-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes win-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}
@keyframes dock-in {
  from { opacity: 0; transform: translateY(20px) scale(0.8); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
