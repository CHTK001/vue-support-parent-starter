<template>
  <Teleport to="body" :disabled="!teleport">
    <!-- 边缘停靠条：拖到边缘后只剩这条小竖条，hover 探出，点击还原 -->
    <div
      v-if="visible && mode === 'edge'"
      class="rfw-edge"
      :class="`is-${edgeSide}`"
      :style="edgeTabStyle"
      role="button"
      :aria-label="restoreText"
      :title="title"
      @mouseenter="onEdgeEnter"
      @mouseleave="onEdgeLeave"
      @click="restoreFromEdge"
    >
      <el-icon class="rfw-edge__icon" :size="14">
        <ArrowLeft v-if="edgeSide === 'right'" />
        <ArrowRight v-else-if="edgeSide === 'left'" />
        <ArrowUp v-else />
      </el-icon>
    </div>

    <!-- 主窗体 -->
    <div
      v-if="visible && mode !== 'minimized'"
      ref="winRef"
      class="rfw"
      :class="[
        `rfw--${mode}`,
        `rfw--${dockPosition}`,
        { 'rfw--dragging': dragState.active, 'rfw--colored': !!color },
      ]"
      :style="windowStyle"
      @pointerdown.capture="bringToFront"
      @mouseenter="onWindowEnter"
      @mouseleave="onWindowLeave"
    >
      <div class="rfw__header" @pointerdown.stop="onHeaderPointerDown">
        <div class="rfw__title">
          <slot name="header">
            <slot name="icon">
              <el-icon class="rfw__title-icon" :size="15"><Memo /></el-icon>
            </slot>
            <span class="rfw__title-text">{{ title }}</span>
          </slot>
        </div>

        <div class="rfw__extra">
          <slot name="header-extra" />
        </div>

        <div class="rfw__actions">
          <slot name="actions" />
          <slot name="minimize">
            <button
              v-if="minimizable"
              type="button"
              class="rfw__btn"
              :aria-label="minimizeText"
              :title="minimizeText"
              @click.stop="minimize"
            >
              <el-icon :size="13"><Minus /></el-icon>
            </button>
          </slot>
          <slot name="maximize">
            <button
              v-if="maximizable"
              type="button"
              class="rfw__btn"
              :aria-label="isMaximized ? unmaximizeText : maximizeText"
              :title="isMaximized ? unmaximizeText : maximizeText"
              @click.stop="toggleMaximize"
            >
              <el-icon :size="13">
                <ScaleToOriginal v-if="isMaximized" />
                <FullScreen v-else />
              </el-icon>
            </button>
          </slot>
          <slot name="fullscreen">
            <button
              v-if="fullscreenable"
              type="button"
              class="rfw__btn"
              :aria-label="isFullscreen ? exitFullscreenText : fullscreenText"
              :title="isFullscreen ? exitFullscreenText : fullscreenText"
              @click.stop="toggleFullscreen"
            >
              <el-icon :size="13">
                <Fold v-if="isFullscreen" />
                <Expand v-else />
              </el-icon>
            </button>
          </slot>
          <slot name="close">
            <button
              v-if="closable"
              type="button"
              class="rfw__btn rfw__btn--close"
              :aria-label="closeText"
              :title="closeText"
              @click.stop="requestClose"
            >
              <el-icon :size="13"><Close /></el-icon>
            </button>
          </slot>
        </div>
      </div>

      <div class="rfw__body">
        <slot />
      </div>

      <div v-if="$slots.footer" class="rfw__footer">
        <slot name="footer" />
      </div>

      <!-- 缩放手柄：只保留不可见热区 -->
      <div
        v-for="h in RESIZE_HANDLES"
        v-show="resizable && mode === 'normal'"
        :key="h"
        class="rfw__resizer"
        :class="`is-${h}`"
        :data-handle="h"
        @pointerdown.stop="onResizerPointerDown($event, h)"
      />
    </div>

    <!-- 最小化浮标 -->
    <button
      v-if="visible && mode === 'minimized'"
      ref="dockRef"
      type="button"
      class="rfw-dock"
      :class="{ 'rfw-dock--dragging': dockDrag.active }"
      :style="dockStyle"
      :title="title"
      :aria-label="restoreText"
      @pointerdown.stop="onDockPointerDown"
    >
      <slot name="dock-icon">
        <el-icon class="rfw-dock__icon" :size="15"><Memo /></el-icon>
      </slot>
      <span v-if="!dockIconOnly" class="rfw-dock__title">{{ title }}</span>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ReFloatWindow —— 可浮动的窗口（非模态）
 *
 * <p>能力：拖拽、8 向缩放（只保留不可见热区）、最小化到底部浮标（浮标可拖拽）、
 * 最大化、全屏、拖到边缘自动收起（鼠标探出、点击还原）、关闭二次确认（可关）。
 * 位置与尺寸始终限制在可视范围内，行为与 el-dialog 一致。</p>
 *
 * <p>用法：`<ReFloatWindow v-model="open" title="标题" :x="x" :y="y" :width="w" :height="h">正文</ReFloatWindow>`；
 * 内容优先走 slot（default / header / header-extra / footer / icon / dock-icon / actions），
 * 能配置的行为尽量做成 props。</p>
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Close,
  Expand,
  Fold,
  FullScreen,
  Memo,
  Minus,
  ScaleToOriginal,
} from "@element-plus/icons-vue";

type Mode = "normal" | "maximized" | "fullscreen" | "minimized" | "edge";
type EdgeSide = "left" | "right" | "top";
type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

const RESIZE_HANDLES: readonly ResizeHandle[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

const props = withDefaults(
  defineProps<{
    /** 标题 */
    title?: string;
    /** 初始宽高（px） */
    width?: number;
    height?: number;
    /** 初始位置（px）；不传则贴右下角 */
    x?: number;
    y?: number;
    /** 最小宽高（px） */
    minWidth?: number;
    minHeight?: number;
    /** 窗体底色（便签用），不传走主题背景 */
    color?: string;
    /** 是否可拖拽 / 缩放 */
    draggable?: boolean;
    resizable?: boolean;
    /** 是否显示最小化 / 最大化 / 全屏 / 关闭按钮 */
    minimizable?: boolean;
    maximizable?: boolean;
    fullscreenable?: boolean;
    closable?: boolean;
    /** 拖到边缘自动收起 */
    edgeAutoHide?: boolean;
    /** 触发收起的边缘距离（px） */
    edgeThreshold?: number;
    /** 最小化浮标停靠位置 */
    dockPosition?: "bottom-right" | "bottom-left";
    /** 浮标只显示图标 */
    dockIconOnly?: boolean;
    /** 关闭二次确认（默认开启）；提供 beforeClose 时以 beforeClose 为准 */
    confirmClose?: boolean;
    /** 关闭前的守卫：返回 false 则取消关闭（可接 messageBox） */
    beforeClose?: () => boolean | Promise<boolean>;
    confirmCloseMessage?: string;
    confirmCloseTitle?: string;
    confirmText?: string;
    cancelText?: string;
    /** 是否 Teleport 到 body */
    teleport?: boolean;
    /** 基础层级（浮标与边缘条会 +1） */
    zIndex?: number;
    /** 按钮文案（便于调用方本地化） */
    minimizeText?: string;
    maximizeText?: string;
    unmaximizeText?: string;
    fullscreenText?: string;
    exitFullscreenText?: string;
    closeText?: string;
    restoreText?: string;
  }>(),
  {
    title: "",
    width: 360,
    height: 280,
    x: undefined,
    y: undefined,
    minWidth: 200,
    minHeight: 140,
    color: "",
    draggable: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: true,
    closable: true,
    edgeAutoHide: true,
    edgeThreshold: 16,
    dockPosition: "bottom-right",
    dockIconOnly: false,
    confirmClose: true,
    confirmCloseMessage: "确定关闭吗？",
    confirmCloseTitle: "提示",
    confirmText: "确定",
    cancelText: "取消",
    teleport: true,
    zIndex: 1000,
    minimizeText: "最小化",
    maximizeText: "最大化",
    unmaximizeText: "还原",
    fullscreenText: "全屏",
    exitFullscreenText: "退出全屏",
    closeText: "关闭",
    restoreText: "还原",
  },
);

const emit = defineEmits<{
  "update:modelValue": [boolean];
  "update:x": [number];
  "update:y": [number];
  "update:width": [number];
  "update:height": [number];
  /** 拖拽结束 */
  move: [{ x: number; y: number }];
  /** 缩放结束 */
  resize: [{ width: number; height: number }];
  close: [];
  closed: [];
  minimize: [];
  restore: [];
  maximize: [];
  unmaximize: [];
  "fullscreen-change": [boolean];
  edge: [EdgeSide | null];
}>();

/** 可见性（v-model） */
const visible = defineModel<boolean>({ default: false });

/* ------------------------------ 视口 ------------------------------ */

const viewport = reactive({ w: 0, h: 0 });

function readViewport() {
  viewport.w = window.innerWidth;
  viewport.h = window.innerHeight;
}

/* ------------------------------ 层级 ------------------------------ */

/** 模块级层级计数：交互时置顶，但不超过 1900（给 Element Plus 弹层留出上方空间） */
let zSeq = 1000;
function nextZ(): number {
  zSeq = zSeq >= 1900 ? props.zIndex : zSeq + 1;
  return zSeq;
}
const z = ref(Math.max(props.zIndex, 1000));

function bringToFront() {
  if (mode.value === "minimized") return;
  z.value = nextZ();
}

/* ------------------------------ 几何 ------------------------------ */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const rect = reactive<Rect>({ x: 0, y: 0, w: props.width, h: props.height });
/** 最小化 / 边缘收起前的位置，用于还原 */
const storedRect = reactive<Rect>({ x: 0, y: 0, w: props.width, h: props.height });
/** 最大化 / 全屏前的位置 */
const normalRect = reactive<Rect>({ x: 0, y: 0, w: props.width, h: props.height });

const mode = ref<Mode>("normal");
const edgeSide = ref<EdgeSide | null>(null);
const edgePeek = ref(false);
/** 边缘条在边上的锚点（左右边为 y，上边为 x） */
const edgeAnchor = ref(0);

const isMaximized = computed(() => mode.value === "maximized");
const isFullscreen = computed(() => mode.value === "fullscreen");

function clamp(v: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(v, min), max);
}

function clampRect(r: Rect): void {
  r.w = clamp(r.w, props.minWidth, Math.max(props.minWidth, viewport.w));
  r.h = clamp(r.h, props.minHeight, Math.max(props.minHeight, viewport.h));
  r.x = clamp(r.x, 0, Math.max(0, viewport.w - r.w));
  r.y = clamp(r.y, 0, Math.max(0, viewport.h - r.h));
}

function initRect(): void {
  const w = clamp(props.width, props.minWidth, Math.max(props.minWidth, viewport.w - 16));
  const h = clamp(props.height, props.minHeight, Math.max(props.minHeight, viewport.h - 16));
  rect.w = w;
  rect.h = h;
  rect.x = props.x ?? viewport.w - w - 16;
  rect.y = props.y ?? viewport.h - h - 16;
  clampRect(rect);
  Object.assign(storedRect, rect);
  Object.assign(normalRect, rect);
}

/** 外部（例如从 IndexedDB 恢复）改了 x/y/width/height 时同步进来 */
watch(
  () => [props.x, props.y, props.width, props.height] as const,
  ([px, py, pw, ph]) => {
    if (dragState.active) return;
    if (typeof pw === "number") rect.w = pw;
    if (typeof ph === "number") rect.h = ph;
    if (typeof px === "number") rect.x = px;
    if (typeof py === "number") rect.y = py;
    clampRect(rect);
  },
);

const windowStyle = computed(() => {
  const base: Record<string, string> = { zIndex: String(z.value) };
  if (props.color) base.background = props.color;

  if (mode.value === "maximized") {
    return {
      ...base,
      left: "16px",
      top: "16px",
      width: `${Math.max(0, viewport.w - 32)}px`,
      height: `${Math.max(0, viewport.h - 32)}px`,
      borderRadius: "12px",
    };
  }
  if (mode.value === "fullscreen") {
    return {
      ...base,
      left: "0px",
      top: "0px",
      width: `${viewport.w}px`,
      height: `${viewport.h}px`,
      borderRadius: "0px",
    };
  }
  if (mode.value === "edge") {
    const w = Math.min(rect.w, viewport.w);
    const h = Math.min(rect.h, viewport.h);
    const peek = edgePeek.value;
    if (edgeSide.value === "top") {
      const left = clamp(edgeAnchor.value, 0, Math.max(0, viewport.w - w));
      return {
        ...base,
        left: `${left}px`,
        top: "0px",
        width: `${w}px`,
        height: `${h}px`,
        transform: peek ? "translateY(0)" : "translateY(-100%)",
        opacity: peek ? "1" : "0",
        pointerEvents: peek ? "auto" : "none",
      };
    }
    const top = clamp(edgeAnchor.value, 0, Math.max(0, viewport.h - h));
    const isLeft = edgeSide.value === "left";
    return {
      ...base,
      left: isLeft ? "0px" : `${Math.max(0, viewport.w - w)}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${h}px`,
      transform: peek ? "translateX(0)" : `translateX(${isLeft ? "-100%" : "100%"})`,
      opacity: peek ? "1" : "0",
      pointerEvents: peek ? "auto" : "none",
    };
  }
  return {
    ...base,
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    borderRadius: "12px",
  };
});

/* ------------------------------ 拖拽 / 缩放 ------------------------------ */

const dragState = reactive({
  active: false,
  kind: "move" as "move" | "resize",
  handle: "" as ResizeHandle | "",
  pointerId: -1,
  startX: 0,
  startY: 0,
  ox: 0,
  oy: 0,
  ow: 0,
  oh: 0,
});

function onHeaderPointerDown(e: PointerEvent) {
  if (!props.draggable || mode.value !== "normal") return;
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest("input") || target.closest("textarea")) return;
  startInteraction("move", "", e);
}

function onResizerPointerDown(e: PointerEvent, handle: ResizeHandle) {
  if (!props.resizable || mode.value !== "normal") return;
  if (e.button !== 0) return;
  startInteraction("resize", handle, e);
}

function startInteraction(kind: "move" | "resize", handle: ResizeHandle | "", e: PointerEvent) {
  dragState.active = true;
  dragState.kind = kind;
  dragState.handle = handle;
  dragState.pointerId = e.pointerId;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.ox = rect.x;
  dragState.oy = rect.y;
  dragState.ow = rect.w;
  dragState.oh = rect.h;
  document.addEventListener("pointermove", onDocumentPointerMove);
  document.addEventListener("pointerup", onDocumentPointerUp);
  document.addEventListener("pointercancel", onDocumentPointerUp);
}

function onDocumentPointerMove(e: PointerEvent) {
  if (!dragState.active) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  if (dragState.kind === "move") {
    rect.x = clamp(dragState.ox + dx, 0, Math.max(0, viewport.w - rect.w));
    rect.y = clamp(dragState.oy + dy, 0, Math.max(0, viewport.h - rect.h));
    return;
  }

  const h = dragState.handle;
  let x = dragState.ox;
  let y = dragState.oy;
  let w = dragState.ow;
  let ht = dragState.oh;

  if (h.includes("e")) w = dragState.ow + dx;
  if (h.includes("s")) ht = dragState.oh + dy;
  if (h.includes("w")) {
    w = dragState.ow - dx;
    x = dragState.ox + dx;
  }
  if (h.includes("n")) {
    ht = dragState.oh - dy;
    y = dragState.oy + dy;
  }

  // 不超过视口，且不小于最小值
  w = clamp(w, props.minWidth, Math.max(props.minWidth, viewport.w - x));
  ht = clamp(ht, props.minHeight, Math.max(props.minHeight, viewport.h - y));
  x = clamp(x, 0, Math.max(0, viewport.w - w));
  y = clamp(y, 0, Math.max(0, viewport.h - ht));

  rect.x = x;
  rect.y = y;
  rect.w = w;
  rect.h = ht;
}

function onDocumentPointerUp() {
  if (!dragState.active) return;
  dragState.active = false;
  document.removeEventListener("pointermove", onDocumentPointerMove);
  document.removeEventListener("pointerup", onDocumentPointerUp);
  document.removeEventListener("pointercancel", onDocumentPointerUp);

  emit("update:x", rect.x);
  emit("update:y", rect.y);
  emit("update:width", rect.w);
  emit("update:height", rect.h);

  if (dragState.kind === "move") {
    emit("move", { x: rect.x, y: rect.y });
    if (props.edgeAutoHide) maybeDockToEdge();
  } else {
    emit("resize", { width: rect.w, height: rect.h });
  }
}

/* ------------------------------ 边缘自动收起 ------------------------------ */

const edgeLeaveTimer = ref<ReturnType<typeof setTimeout> | null>(null);

function maybeDockToEdge() {
  if (!props.edgeAutoHide) return;
  const t = props.edgeThreshold;
  if (rect.x <= t) enterEdge("left");
  else if (rect.x + rect.w >= viewport.w - t) enterEdge("right");
  else if (rect.y <= t) enterEdge("top");
}

function enterEdge(side: EdgeSide) {
  Object.assign(storedRect, rect);
  edgeAnchor.value = side === "top" ? rect.x : rect.y;
  edgeSide.value = side;
  edgePeek.value = false;
  mode.value = "edge";
  emit("edge", side);
}

function onEdgeEnter() {
  clearEdgeTimer();
  edgePeek.value = true;
}

function onEdgeLeave() {
  scheduleCollapse();
}

function onWindowEnter() {
  clearEdgeTimer();
}

function onWindowLeave() {
  if (mode.value === "edge") scheduleCollapse();
}

function scheduleCollapse() {
  clearEdgeTimer();
  edgeLeaveTimer.value = setTimeout(() => {
    edgePeek.value = false;
  }, 160);
}

function clearEdgeTimer() {
  if (edgeLeaveTimer.value) {
    clearTimeout(edgeLeaveTimer.value);
    edgeLeaveTimer.value = null;
  }
}

/** 点击边缘条：还原到收起前的位置 */
function restoreFromEdge() {
  Object.assign(rect, storedRect);
  clampRect(rect);
  edgeSide.value = null;
  edgePeek.value = false;
  mode.value = "normal";
  emit("edge", null);
  emit("restore");
  syncRect();
}

const edgeTabStyle = computed(() => {
  const anchor =
    edgeSide.value === "top"
      ? clamp(edgeAnchor.value, 8, Math.max(8, viewport.w - 56))
      : clamp(edgeAnchor.value, 8, Math.max(8, viewport.h - 56));
  const base: Record<string, string> = { zIndex: String(z.value + 1) };
  if (edgeSide.value === "left") return { ...base, left: "0px", top: `${anchor}px` };
  if (edgeSide.value === "right") return { ...base, right: "0px", top: `${anchor}px` };
  return { ...base, top: "0px", left: `${anchor}px` };
});

/* ------------------------------ 最小化 / 最大化 / 全屏 ------------------------------ */

let instanceSeq = 0;
const instanceId = ++instanceSeq;
/** 模块级浮标栈：多个窗口最小化时自下而上排列 */
const dockStack = ref<number[]>([]);

const dockIndex = computed(() => Math.max(0, dockStack.value.indexOf(instanceId)));
/** 浮标被拖拽后的绝对位置 */
const dockPos = ref<{ x: number; y: number } | null>(null);

function minimize() {
  if (!props.minimizable) return;
  Object.assign(storedRect, rect);
  mode.value = "minimized";
  if (!dockStack.value.includes(instanceId)) dockStack.value = [...dockStack.value, instanceId];
  emit("minimize");
}

function restoreFromDock() {
  if (mode.value !== "minimized") return;
  dockStack.value = dockStack.value.filter((x) => x !== instanceId);
  Object.assign(rect, storedRect);
  clampRect(rect);
  mode.value = "normal";
  syncRect();
  emit("restore");
}

function toggleMaximize() {
  if (mode.value === "maximized") {
    Object.assign(rect, normalRect);
    mode.value = "normal";
    emit("unmaximize");
  } else {
    Object.assign(normalRect, rect);
    mode.value = "maximized";
    emit("maximize");
  }
  syncRect();
}

function toggleFullscreen() {
  if (mode.value === "fullscreen") {
    Object.assign(rect, normalRect);
    mode.value = "normal";
    emit("fullscreen-change", false);
  } else {
    Object.assign(normalRect, rect);
    mode.value = "fullscreen";
    emit("fullscreen-change", true);
  }
  syncRect();
}

/* ------------------------------ 关闭（二次确认） ------------------------------ */

async function requestClose() {
  if (props.beforeClose) {
    const ok = await Promise.resolve(props.beforeClose());
    if (!ok) return;
  } else if (props.confirmClose) {
    try {
      await ElMessageBox.confirm(props.confirmCloseMessage, props.confirmCloseTitle, {
        confirmButtonText: props.confirmText,
        cancelButtonText: props.cancelText,
        type: "warning",
        draggable: true,
      });
    } catch {
      return;
    }
  }
  visible.value = false;
  emit("close");
  emit("closed");
}

/* ------------------------------ 浮标拖拽 ------------------------------ */

const dockRef = ref<HTMLElement | null>(null);
const dockDrag = reactive({
  active: false,
  moved: false,
  startX: 0,
  startY: 0,
  ox: 0,
  oy: 0,
});

function dockRect(): { x: number; y: number } {
  if (dockPos.value) return dockPos.value;
  const el = dockRef.value;
  const w = el?.offsetWidth ?? 32;
  const h = el?.offsetHeight ?? 32;
  const bottom = 16 + dockIndex.value * 40;
  return props.dockPosition === "bottom-left"
    ? { x: 16, y: viewport.h - h - bottom }
    : { x: viewport.w - w - 16, y: viewport.h - h - bottom };
}

function onDockPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  const r = dockRect();
  dockDrag.active = true;
  dockDrag.moved = false;
  dockDrag.startX = e.clientX;
  dockDrag.startY = e.clientY;
  dockDrag.ox = r.x;
  dockDrag.oy = r.y;
  document.addEventListener("pointermove", onDockPointerMove);
  document.addEventListener("pointerup", onDockPointerUp);
  document.addEventListener("pointercancel", onDockPointerUp);
}

function onDockPointerMove(e: PointerEvent) {
  if (!dockDrag.active) return;
  const dx = e.clientX - dockDrag.startX;
  const dy = e.clientY - dockDrag.startY;
  if (!dockDrag.moved && Math.hypot(dx, dy) < 4) return;
  dockDrag.moved = true;
  const el = dockRef.value;
  const w = el?.offsetWidth ?? 32;
  const h = el?.offsetHeight ?? 32;
  dockPos.value = {
    x: clamp(dockDrag.ox + dx, 0, Math.max(0, viewport.w - w)),
    y: clamp(dockDrag.oy + dy, 0, Math.max(0, viewport.h - h)),
  };
}

function onDockPointerUp() {
  if (!dockDrag.active) return;
  dockDrag.active = false;
  document.removeEventListener("pointermove", onDockPointerMove);
  document.removeEventListener("pointerup", onDockPointerUp);
  document.removeEventListener("pointercancel", onDockPointerUp);
  // 没拖动 = 点击还原
  if (!dockDrag.moved) restoreFromDock();
}

const dockStyle = computed(() => {
  const base: Record<string, string> = { zIndex: String(z.value + 1) };
  if (dockPos.value) return { ...base, left: `${dockPos.value.x}px`, top: `${dockPos.value.y}px` };
  const bottom = 16 + dockIndex.value * 40;
  return props.dockPosition === "bottom-left"
    ? { ...base, left: "16px", bottom: `${bottom}px` }
    : { ...base, right: "16px", bottom: `${bottom}px` };
});

/* ------------------------------ 同步与生命周期 ------------------------------ */

function syncRect() {
  emit("update:x", rect.x);
  emit("update:y", rect.y);
  emit("update:width", rect.w);
  emit("update:height", rect.h);
}

function onViewportResize() {
  readViewport();
  if (mode.value === "normal") {
    clampRect(rect);
    syncRect();
  } else if (mode.value === "minimized") {
    clampRect(storedRect);
    if (dockPos.value) {
      dockPos.value = {
        x: clamp(dockPos.value.x, 0, Math.max(0, viewport.w - 40)),
        y: clamp(dockPos.value.y, 0, Math.max(0, viewport.h - 32)),
      };
    }
  }
}

watch(visible, (v) => {
  if (v) {
    mode.value = "normal";
    edgeSide.value = null;
    edgePeek.value = false;
    z.value = Math.max(z.value, props.zIndex);
    clampRect(rect);
  } else {
    dockStack.value = dockStack.value.filter((x) => x !== instanceId);
    clearEdgeTimer();
  }
});

onMounted(() => {
  readViewport();
  initRect();
  window.addEventListener("resize", onViewportResize);
});

onBeforeUnmount(() => {
  dockStack.value = dockStack.value.filter((x) => x !== instanceId);
  clearEdgeTimer();
  window.removeEventListener("resize", onViewportResize);
  document.removeEventListener("pointermove", onDocumentPointerMove);
  document.removeEventListener("pointerup", onDocumentPointerUp);
  document.removeEventListener("pointercancel", onDocumentPointerUp);
  document.removeEventListener("pointermove", onDockPointerMove);
  document.removeEventListener("pointerup", onDockPointerUp);
  document.removeEventListener("pointercancel", onDockPointerUp);
});

defineExpose({
  open: () => {
    visible.value = true;
  },
  close: () => requestClose(),
  minimize,
  restore: restoreFromDock,
  maximize: toggleMaximize,
  fullscreen: toggleFullscreen,
  getRect: () => ({ x: rect.x, y: rect.y, width: rect.w, height: rect.h }),
});
</script>

<style lang="scss" scoped>
.rfw {
  position: fixed;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  transition:
    left 0.16s ease,
    top 0.16s ease,
    width 0.16s ease,
    height 0.16s ease,
    border-radius 0.16s ease,
    box-shadow 0.2s ease;

  &.rfw--dragging {
    transition: none;
    user-select: none;
  }

  &.rfw--normal:hover {
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.22);
  }

  &.rfw--maximized,
  &.rfw--fullscreen {
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
  }
}

.rfw__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.28);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: grab;
  user-select: none;

  .rfw--dragging & {
    cursor: grabbing;
  }

  .rfw--maximized &,
  .rfw--fullscreen & {
    cursor: default;
  }
}

.rfw__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.rfw__title-icon {
  flex: 0 0 auto;
}

.rfw__title-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rfw__extra {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.rfw__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.rfw__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 6px;
  transition:
    color 0.18s ease,
    background 0.18s ease;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &.rfw__btn--close:hover {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  }
}

.rfw__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.rfw__footer {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 缩放手柄：不可见热区 */
.rfw__resizer {
  position: absolute;
  z-index: 2;
  background: transparent;
}

.is-e {
  top: 25%;
  right: 0;
  width: 8px;
  height: 50%;
  cursor: e-resize;
}

.is-s {
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 8px;
  cursor: s-resize;
}

.is-w {
  top: 25%;
  left: 0;
  width: 8px;
  height: 50%;
  cursor: w-resize;
}

.is-n {
  top: 0;
  left: 25%;
  width: 50%;
  height: 8px;
  cursor: n-resize;
}

.is-ne,
.is-nw,
.is-sw,
.is-se {
  width: 12px;
  height: 12px;
}

.is-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
}

.is-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
}

.is-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
}

.is-se {
  right: 0;
  bottom: 0;
  cursor: se-resize;
}

/* 边缘停靠条 */
.rfw-edge {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 48px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition:
    color 0.18s ease,
    background 0.18s ease;

  &.is-left {
    border-left: none;
    border-radius: 0 8px 8px 0;
  }

  &.is-right {
    border-right: none;
    border-radius: 8px 0 0 8px;
  }

  &.is-top {
    width: 48px;
    height: 20px;
    border-top: none;
    border-radius: 0 0 8px 8px;
  }

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

/* 最小化浮标 */
.rfw-dock {
  position: fixed;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  height: 32px;
  padding: 0 10px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
  transition:
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &.rfw-dock--dragging {
    cursor: grabbing;
    transition: none;
  }

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 8px 26px rgba(0, 0, 0, 0.18);
  }
}

.rfw-dock__title {
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
