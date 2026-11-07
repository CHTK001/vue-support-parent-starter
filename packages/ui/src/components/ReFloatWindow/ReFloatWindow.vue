<template>
  <Teleport to="body" :disabled="!teleport">
    <!-- 对齐辅助线：拖拽时出现，松手消失 -->
    <div v-if="visible && guides.length" class="rfw-guides" aria-hidden="true">
      <i
        v-for="(g, i) in guides"
        :key="i"
        class="rfw-guides__line"
        :class="`is-${g.axis}`"
        :style="guideStyle(g)"
      />
    </div>

    <!-- 边缘停靠条：拖到边缘后只剩这条小条，hover 探出，点击还原 -->
    <div
      v-if="visible && mode === 'edge'"
      class="rfw-edge"
      :class="[`is-${edgeSide}`, { 'is-peek': edgePeek }]"
      :style="edgeTabStyle"
      role="button"
      :aria-label="restoreText"
      :title="title"
      @mouseenter="onEdgeEnter"
      @mouseleave="onEdgeLeave"
      @click="restoreFromEdge"
    >
      <slot name="edge-icon">
        <el-icon class="rfw-edge__icon" :size="14">
          <ArrowLeft v-if="edgeSide === 'right'" />
          <ArrowRight v-else-if="edgeSide === 'left'" />
          <ArrowUp v-else-if="edgeSide === 'bottom'" />
          <ArrowDown v-else />
        </el-icon>
      </slot>
    </div>

    <!-- 独占遮罩：点窗外抖动并把焦点拉回来 -->
    <div
      v-if="hasOccluder"
      class="rfw-occluder"
      :style="{ zIndex: String(Math.max(1, z - 1)) }"
      aria-hidden="true"
      @pointerdown.prevent="onOccluderShake"
    />

    <!-- 主窗体 -->
    <div
      v-if="visible && mode !== 'minimized'"
      ref="winRef"
      class="rfw"
      :class="[
        `rfw--${mode}`,
        `rfw--${dockPosition}`,
        { 'rfw--dragging': dragState.active, 'rfw--colored': !!color, 'rfw--active': active },
      ]"
      :style="windowStyle"
      @pointerdown.capture="bringToFront"
      @mouseenter="onWindowEnter"
      @mouseleave="onWindowLeave"
    >
      <div class="rfw__header" @pointerdown="onHeaderPointerDown">
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

      <!-- 兜底热区：整窗口按下即拖（抓在文字/空白处也能拖），位于内容之上、按钮之下 -->
      <div class="rfw__grab" @pointerdown="onGrabPointerDown" />
    </div>

    <!-- 最小化：只渲染一个小图标，不保留窗体 DOM -->
    <div
      v-if="visible && mode === 'minimized'"
      ref="dockRef"
      class="rfw-dock"
      :class="[`rfw-dock--${minimizeStyle}`, { 'rfw-dock--dragging': dockDrag.activeValue }]"
      :style="dockStyle"
      role="button"
      tabindex="0"
      :aria-label="restoreText"
      :title="title"
      @pointerdown.stop="onDockPointerDown"
      @keydown.enter.prevent="restoreFromDock"
      @keydown.space.prevent="restoreFromDock"
      @mouseenter="onDockHover(true)"
      @mouseleave="onDockHover(false)"
    >
      <!-- 折叠态：一条细条 -->
      <span v-if="minimizeStyle === 'bar'" class="rfw-dock__bar" />
      <!-- 图标态：只渲染图标本身的 DOM，hover 才补标题 -->
      <template v-else>
        <slot name="dock-icon">
          <el-icon class="rfw-dock__icon" :size="dockIconSize"><Memo /></el-icon>
        </slot>
        <span v-if="!dockIconOnly && dockHover" class="rfw-dock__title">{{ title }}</span>
      </template>
      <!-- 图标内的兜底抓取层：按在图标上拖，不靠“pointerdown 已 stop”的窗口链路 -->
      <i v-if="dockDraggable" class="rfw-dock__grab" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ReFloatWindow —— 可浮动的窗口（组件，不含业务）
 *
 * <p>与具体业务（便签、日志面板……）解耦：内容走 slot，行为走 props。
 * 几何计算（夹取 / 吸附 / 边缘判定）在 Web Worker 里做（`geometry.worker.ts`），
 * 主线程只负责写样式，拖拽不走 Vue 响应式，保证跟手。</p>
 *
 * <p>能力：拖拽、8 向缩放（只保留不可见热区）、最小化（图标 / 折叠条，可拖拽可缩放）、
 * 最大化、全屏、边缘收起（四条边可选）、对齐辅助线、多实例层级、独占模式、可选持久化。</p>
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import {
  ArrowDown,
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
import type {
  AlignLine,
  EdgeSide,
  GeometryWorkerRequest,
  GeometryWorkerResponse,
  Rect,
} from "./geometry.types";

type Mode = "normal" | "maximized" | "fullscreen" | "minimized" | "edge";
type MinimizeStyle = "icon" | "bar";
type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type WindowRect = { x: number; y: number; width: number; height: number };

const RESIZE_HANDLES: readonly ResizeHandle[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
const ALL_EDGES: readonly EdgeSide[] = ["left", "right", "top", "bottom"] as const;

const props = withDefaults(
  defineProps<{
    /** 持久化 / 多实例标识；不传则只在本次会话内有效 */
    winId?: string;
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
    /** 窗体底色，不传走主题背景 */
    color?: string;
    /** 是否可拖拽 / 缩放 */
    draggable?: boolean;
    resizable?: boolean;
    /** 是否显示最小化 / 最大化 / 全屏 / 关闭按钮 */
    minimizable?: boolean;
    maximizable?: boolean;
    fullscreenable?: boolean;
    closable?: boolean;
    /** 最小化形态：图标（小圆钮）或折叠（一条细条） */
    minimizeStyle?: MinimizeStyle;
    /** 最小化的图标是否可以拖到任意位置 */
    dockDraggable?: boolean;
    /** 最小化图标的缩放倍率（0.6 ~ 3），图标与折叠条一起缩放 */
    dockScale?: number;
    /** 拖到边缘是否自动收起 */
    edgeAutoHide?: boolean;
    /** 允许收起的边；'all' 为四边 */
    edgeSides?: EdgeSide | EdgeSide[] | "all";
    /** 触发收起的边缘距离（px） */
    edgeThreshold?: number;
    /** 最小化浮标停靠位置 */
    dockPosition?: "bottom-right" | "bottom-left";
    /** 浮标只显示图标（不显示标题） */
    dockIconOnly?: boolean;
    /** 关闭二次确认（默认开启）；提供 beforeClose 时以 beforeClose 为准 */
    confirmClose?: boolean;
    /** 关闭前的守卫：返回 false 则取消关闭 */
    beforeClose?: () => boolean | Promise<boolean>;
    confirmCloseMessage?: string;
    confirmCloseTitle?: string;
    confirmText?: string;
    cancelText?: string;
    /** 多个实例同时存在 */
    multiple?: boolean;
    /** 独占：点窗外任意地方窗口抖动并把焦点拉回来，强迫先收掉它 */
    exclusive?: boolean;
    /** 拖拽时显示对齐辅助线 */
    guides?: boolean;
    /** 对齐目标：-1 = 同类窗口，0 = 视口中线，>0 = 视口栅格（px） */
    guideGrid?: number;
    /** 位置尺寸实时持久化到 localStorage */
    persist?: boolean;
    /** 持久化键名，不复用时按 winId 生成 */
    persistKey?: string;
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
    winId: "",
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
    minimizeStyle: "icon",
    dockDraggable: true,
    dockScale: 1,
    edgeAutoHide: true,
    edgeSides: "all",
    edgeThreshold: 16,
    dockPosition: "bottom-right",
    dockIconOnly: true,
    confirmClose: true,
    confirmCloseMessage: "确定关闭吗？",
    confirmCloseTitle: "提示",
    confirmText: "确定",
    cancelText: "取消",
    multiple: true,
    exclusive: false,
    guides: true,
    guideGrid: -1,
    persist: false,
    persistKey: "",
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
  /** 拖拽 / 缩放过程中（高频，别在里面做重活） */
  change: [WindowRect];
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

/* ------------------------------ 视口 / 层级 ------------------------------ */

const viewport = reactive({ w: 0, h: 0 });

function readViewport() {
  viewport.w = window.innerWidth;
  viewport.h = window.innerHeight;
}

/** 层级区间：1001 起步，超过上限回到下限循环，永远给 Element Plus 弹层（2000+）留空间 */
const Z_MIN = 1001;
const Z_MAX = 1900;
let zSeq = Z_MIN - 1;

const active = ref(true);

/**
 * 层级序列：所有实例共用一个模块级计数器，保证“后激活的一定更大”。
 * 旧实现每个实例各自 bump + 固定起点 1000，导致后来创建的窗口激活后反而比先创建的小。
 */
function bumpZ(): number {
  zSeq += 1;
  if (zSeq > Z_MAX) zSeq = Z_MIN;
  return zSeq;
}

const z = ref(props.zIndex ?? bumpZ());

/** 激活到最前：层级永远比其它所有实例都大（同一模块共享计数器） */
function bringToFront() {
  if (mode.value !== "normal") return;
  active.value = true;
  // 计数器只增不减：任何一次激活（含按下即拖拽）都拿到比在场所有窗口更大的值
  z.value = bumpZ();
}

/* ------------------------------ 几何 ------------------------------ */

const rect = reactive<Rect>({ x: 0, y: 0, w: props.width, h: props.height });
/** 最小化 / 边缘收起 / 最大化前的位置，用于还原 */
const storedRect = reactive<Rect>({ x: 0, y: 0, w: props.width, h: props.height });
const normalRect = reactive<Rect>({ x: 0, y: 0, w: props.width, h: props.height });

const mode = ref<Mode>("normal");
const edgeSide = ref<EdgeSide | null>(null);
const edgePeek = ref(false);
/** 边缘条的锚点（左右边为 y，上下边为 x） */
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

/* ------------------------------ 持久化 ------------------------------ */

const persistKey = computed(
  () => props.persistKey || (props.winId ? `re-float-window:${props.winId}` : ""),
);

interface PersistState {
  /** 还原目标（普通态的位置尺寸） */
  rect: Rect;
  minimized: boolean;
  dock?: { x: number; y: number } | null;
}

function readPersisted(): PersistState | null {
  if (!props.persist || !persistKey.value) return null;
  try {
    const raw = localStorage.getItem(persistKey.value);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistState;
    const r = parsed?.rect;
    if (!r || !Number.isFinite(r.x) || !Number.isFinite(r.y) || !Number.isFinite(r.w) || !Number.isFinite(r.h)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** 写盘：拖拽过程中节流 250ms，松手立刻写 */
function savePersist(immediate = false): void {
  if (!props.persist || !persistKey.value) return;
  const write = () => {
    persistTimer = null;
    try {
      const state: PersistState = {
        rect: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
        minimized: mode.value === "minimized",
        dock: dockPos.value,
      };
      localStorage.setItem(persistKey.value, JSON.stringify(state));
    } catch {
      // 隐私模式 / 配额满：忽略，不影响交互
    }
  };
  if (immediate) {
    if (persistTimer) clearTimeout(persistTimer);
    write();
    return;
  }
  if (persistTimer) return;
  persistTimer = setTimeout(write, 250);
}

function initRect(): void {
  const saved = readPersisted();
  if (saved) {
    rect.w = saved.rect.w;
    rect.h = saved.rect.h;
    rect.x = saved.rect.x;
    rect.y = saved.rect.y;
    clampRect(rect);
    Object.assign(storedRect, rect);
    Object.assign(normalRect, rect);
    dockPos.value = saved.dock ?? null;
    return;
  }
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

/** 外部改了 x/y/width/height 时同步进来 */
watch(
  () => [props.x, props.y, props.width, props.height] as const,
  ([px, py, pw, ph]) => {
    if (dragState.activeValue) return;
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
    const TAB = 20;
    if (edgeSide.value === "top" || edgeSide.value === "bottom") {
      const left = clamp(edgeAnchor.value, 0, Math.max(0, viewport.w - w));
      const isTop = edgeSide.value === "top";
      return {
        ...base,
        left: `${left}px`,
        top: isTop ? (peek ? `${TAB}px` : "0px") : `${Math.max(0, viewport.h - h - (peek ? TAB : 0))}px`,
        width: `${w}px`,
        height: `${h}px`,
        transform: peek ? "translateY(0)" : `translateY(${isTop ? "-100%" : "100%"})`,
        opacity: peek ? "1" : "0",
        pointerEvents: peek ? "auto" : "none",
      };
    }
    const top = clamp(edgeAnchor.value, 0, Math.max(0, viewport.h - h));
    const isLeft = edgeSide.value === "left";
    return {
      ...base,
      left: isLeft ? (peek ? `${TAB}px` : "0px") : `${Math.max(0, viewport.w - w - (peek ? TAB : 0))}px`,
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

/* ------------------------------ 几何 Worker ------------------------------ */

const winRef = ref<HTMLElement | null>(null);

/**
 * 拖拽期间的视觉偏移：只在 wrapper 上写 transform，不触发 Vue 响应式，
 * 松手时一次性落回 left/top。Worker 回包只用于夹取与吸附校验。
 */
const dragState = reactive({
  get activeValue() {
    return dragActive;
  },
});
let dragActive = false;
let dragKind: "move" | "resize" = "move";
let dragHandle: ResizeHandle | "" = "";
let dragOx = 0;
let dragOy = 0;
let dragOw = 0;
let dragOh = 0;
let seq = 0;
/** 最近一次指针位置（client 坐标） */
let lastPx = 0;
let lastPy = 0;
/** 拖拽期间的累计位移（键盘/触摸与抓重点吸附都更稳，避免 client 坐标被 Snap 到元素边界） */
let moveDx = 0;
let moveDy = 0;
let rafId = 0;
/** 最近一次 Worker 回包的（已吸附）坐标，拖拽中的 visual/final 都基于它 */
let lastSnapX: number | null = null;
let lastSnapY: number | null = null;

const guides = ref<AlignLine[]>([]);

let worker: Worker | null = null;
let workerBroken = false;

function edgeList(): EdgeSide[] {
  const v = props.edgeSides;
  if (v === "all") return [...ALL_EDGES];
  return Array.isArray(v) ? v : [v as EdgeSide];
}

function snapConfig() {
  if (!props.guides) return { enabled: false, others: [] as Rect[], grid: props.guideGrid };
  const others =
    props.guideGrid === -1
      ? Array.from(document.querySelectorAll<HTMLElement>(".rfw--normal")).filter((el) => el !== winRef.value)
          .map((el) => ({
            x: el.offsetLeft,
            y: el.offsetTop,
            w: el.offsetWidth,
            h: el.offsetHeight,
          }))
      : [];
  console.debug("[rfw] snapConfig", JSON.stringify({ self: winRef.value?.className, others }));
  return { enabled: true, others, grid: props.guideGrid };
}

function sendWorker(msg: GeometryWorkerRequest) {
  if (!worker) return;
  try {
    worker.postMessage(msg);
  } catch {
    workerBroken = true;
    worker = null;
  }
}

/** Worker 回包：普通拖拽只看位置，缩放在这里直接写样式 */
function onWorkerMessage(e: MessageEvent<GeometryWorkerResponse>) {
  const msg = e.data;
  // 诊断：确认回包内容与当前 seq（去掉这行不影响行为）
  console.debug("[rfw] worker->main", msg.type, msg.seq, seq, dragActive, JSON.stringify(msg.lines ?? null));
  if (msg.type === "rect" && dragActive) {
    if (msg.seq !== seq) return; // 过期回包丢掉
    guides.value = msg.lines;
    if (dragKind === "resize" && winRef.value) {
      // 缩放在主线程也要即时反馈，这里直接用回包（每帧一次，开销可控）
      applyRectToDom(msg.rect);
      return;
    }
    // 吸附：把落点差异折进 transform，视觉上直接贴齐，而不是松手才跳
    lastSnapX = msg.rect.x;
    lastSnapY = msg.rect.y;
    applyMoveTransform();
    return;
  }
  if (msg.type === "commit") {
    onDragCommitted(msg.rect, msg.edge);
  }
}

/** 按“指针位移 + 吸附修正”写 transform（每帧一次，只碰合成层，不触发布局） */
function applyMoveTransform() {
  const el = winRef.value;
  if (!el || dragKind !== "move") return;
  const nx = lastSnapX ?? dragOx + lastPx - startX;
  const ny = lastSnapY ?? dragOy + lastPy - startY;
  el.style.transform = `translate3d(${nx - dragOx}px, ${ny - dragOy}px, 0)`;
  el.classList.add("rfw--moving");
}

function applyRectToDom(r: Rect) {
  const el = winRef.value;
  if (!el) return;
  el.style.left = `${r.x}px`;
  el.style.top = `${r.y}px`;
  el.style.width = `${r.w}px`;
  el.style.height = `${r.h}px`;
}

function startDrag(kind: "move" | "resize", handle: ResizeHandle | "", e: PointerEvent) {
  // 拖拽必须压在最上面：捕获阶段的 bringToFront 会被 .stop 的子元素拦下，这里再兜一次
  bringToFront();
  dragActive = true;
  dragKind = kind;
  dragHandle = handle;
  dragOx = rect.x;
  dragOy = rect.y;
  dragOw = rect.w;
  dragOh = rect.h;
  lastSnapX = null;
  lastSnapY = null;
  guides.value = [];
  winRef.value?.classList.add("rfw--dragging");

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

  // 指针捕获：拖到窗口外也继续跟手（含 iframe 之外）
  try {
    (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
  } catch {
    // 某些元素不支持捕获，忽略
  }
  sendWorker({ type: "configure", payload: { edgeThreshold: props.edgeThreshold, snap: snapConfig() } });
}

function onPointerMove(e: PointerEvent) {
  if (!dragActive) return;
  lastPx = e.clientX;
  lastPy = e.clientY;
  // 抓重点已对齐的窗口拖动时，PointerEvent.clientX 会 Snap 到元素边界（如左下角），
  // 直接用运动会瞬移；用 movementX/movementY 累加真实位移。
  // 少数环境 movement 为 0（部分合成事件），此时回落到直接用 client 坐标。
  if (e.movementX || e.movementY) {
    moveDx += e.movementX;
    moveDy += e.movementY;
    lastPx = startX + moveDx;
    lastPy = startY + moveDy;
  } else {
    moveDx = lastPx - startX;
    moveDy = lastPy - startY;
  }
  if (rafId) return;
  rafId = requestAnimationFrame(flushDrag);
}

/**
 * 每个动画帧只做一件事：写一次 transform + 发一次 Worker 计算。
 *
 * <p>不再用“上一帧的待处理指针位置”（pointermove 频率常低于 rAF，会滞后一帧），
 * 直接取最新指针位置；Worker 回包里的吸附坐标会覆盖视觉位置。</p>
 */
function flushDrag() {
  rafId = 0;
  console.debug("[rfw] flush", dragActive, dragKind, dragHandle, moveDx, moveDy);
  if (!dragActive) return;
  if (!lastPx && !lastPy) return;
  seq += 1;
  const dx = moveDx;
  const dy = moveDy;
  if (dragKind === "resize") {
    // 缩放也先按“起点尺寸 + 位移”自己算一版（Worker 回包到了再覆盖），保证跟手，
    // 避免 Worker 处理积压时尺寸滞后甚至卡住。
    applyResizePreview(dragOx, dragOy, dragOw, dragOh, dragHandle, dx, dy);
  } else {
    lastSnapX = null;
    lastSnapY = null;
    applyMoveTransform();
  }
  sendWorker({
    type: "move",
    payload: {
      seq,
      kind: dragKind,
      handle: dragHandle,
      ox: dragOx,
      oy: dragOy,
      ow: dragOw,
      oh: dragOh,
      dx,
      dy,
      viewport: { w: viewport.w, h: viewport.h },
      minWidth: props.minWidth,
      minHeight: props.minHeight,
    },
  });
}

/** 缩放预览：与 Worker 内 computeRect 同口径（只夹尺寸不夹位置，位置留到提交时统一夹） */
function applyResizePreview(
  ox: number,
  oy: number,
  ow: number,
  oh: number,
  handle: string,
  dx: number,
  dy: number,
): void {
  const el = winRef.value;
  if (!el) return;
  let x = ox;
  let y = oy;
  let w = ow;
  let h = oh;
  if (handle.includes("e")) w = ow + dx;
  if (handle.includes("s")) h = oh + dy;
  if (handle.includes("w")) {
    w = ow - dx;
    x = ox + dx;
  }
  if (handle.includes("n")) {
    h = oh - dy;
    y = oy + dy;
  }
  // 最小尺寸：反向拉过最小宽高时把对边钉住
  if (w < props.minWidth) {
    if (handle.includes("w")) x = ox + ow - props.minWidth;
    w = props.minWidth;
  }
  if (h < props.minHeight) {
    if (handle.includes("n")) y = oy + oh - props.minHeight;
    h = props.minHeight;
  }
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  el.style.width = `${Math.round(w)}px`;
  el.style.height = `${Math.round(h)}px`;
}

let startX = 0;
let startY = 0;

function beginStart(e: PointerEvent) {
  startX = e.clientX;
  startY = e.clientY;
  lastPx = e.clientX;
  lastPy = e.clientY;
  moveDx = 0;
  moveDy = 0;
}

function onPointerUp() {
  if (!dragActive) return;
  dragActive = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerUp);

  // 把视觉偏移折算成真实坐标（吸附修正已经体现在 lastSnapX/lastSnapY 里）
  const el = winRef.value;
  const dxEnd = lastPx - startX;
  const dyEnd = lastPy - startY;
  const finalRect: Rect =
    dragKind === "move"
      ? {
          x: lastSnapX ?? clamp(dragOx + dxEnd, 0, Math.max(0, viewport.w - rect.w)),
          y: lastSnapY ?? clamp(dragOy + dyEnd, 0, Math.max(0, viewport.h - rect.h)),
          w: rect.w,
          h: rect.h,
        }
      : {
          x: el ? parseFloat(el.style.left) || rect.x : rect.x,
          y: el ? parseFloat(el.style.top) || rect.y : rect.y,
          w: el ? parseFloat(el.style.width) || rect.w : rect.w,
          h: el ? parseFloat(el.style.height) || rect.h : rect.h,
        };
  if (el) {
    el.style.transform = "";
    el.classList.remove("rfw--moving");
  }
  guides.value = [];
  lastSnapX = null;
  lastSnapY = null;
  seq += 1;
  if (!worker) {
    // Worker 不可用时的兜底：主线程直接提交
    const snapped = props.guides ? snapRectMain(finalRect) : { rect: finalRect, lines: [] as AlignLine[] };
    onDragCommitted(snapped.rect, fallbackEdge(snapped.rect));
    return;
  }
  sendWorker({
    type: "end",
    payload: {
      seq,
      rect: finalRect,
      viewport: { w: viewport.w, h: viewport.h },
      minWidth: props.minWidth,
      minHeight: props.minHeight,
      edgeAutoHide: props.edgeAutoHide,
      edgeThreshold: props.edgeThreshold,
    },
  });
}

/** 主线程兜底吸附（只在 Worker 创建失败时用，逻辑与 Worker 内一致的精简版） */
function snapRectMain(r: Rect): { rect: Rect; lines: AlignLine[] } {
  const others = snapConfig().others as Rect[];
  if (!others.length) return { rect: r, lines: [] };
  const GAP = 8;
  const pick = (values: number[], targets: number[]): number => {
    let best = 0;
    let bestAbs = GAP + 1;
    for (const v of values) {
      for (const t of targets) {
        const d = t - v;
        if (Math.abs(d) < bestAbs) {
          bestAbs = Math.abs(d);
          best = d;
        }
      }
    }
    return best;
  };
  const tx = others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w]);
  const ty = others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h]);
  const dx = pick([r.x, r.x + r.w / 2, r.x + r.w], tx);
  const dy = pick([r.y, r.y + r.h / 2, r.y + r.h], ty);
  return { rect: { ...r, x: Math.round(r.x + dx), y: Math.round(r.y + dy) }, lines: [] };
}

function fallbackEdge(r: Rect): EdgeSide | null {
  if (!props.edgeAutoHide) return null;
  const t = props.edgeThreshold;
  const list = edgeList();
  if (list.includes("left") && r.x <= t) return "left";
  if (list.includes("right") && r.x + r.w >= viewport.w - t) return "right";
  if (list.includes("top") && r.y <= t) return "top";
  if (list.includes("bottom") && r.y + r.h >= viewport.h - t) return "bottom";
  return null;
}

function onDragCommitted(r: Rect, edge: EdgeSide | null) {
  const changed = r.x !== rect.x || r.y !== rect.y || r.w !== rect.w || r.h !== rect.h;
  Object.assign(rect, r);
  if (changed) applyRectToDom(r);

  emit("update:x", rect.x);
  emit("update:y", rect.y);
  emit("update:width", rect.w);
  emit("update:height", rect.h);
  emit("change", { x: rect.x, y: rect.y, width: rect.w, height: rect.h });

  if (dragKind === "move") emit("move", { x: rect.x, y: rect.y });
  else emit("resize", { width: rect.w, height: rect.h });

  if (edge && edgeList().includes(edge)) enterEdge(edge);
  savePersist(true);
}

/* ------------------------------ 拖拽入口 ------------------------------ */

function onHeaderPointerDown(e: PointerEvent) {
  if (!props.draggable || mode.value !== "normal") return;
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest("input") || target.closest("textarea")) return;
  beginStart(e);
  startDrag("move", "", e);
}

function onResizerPointerDown(e: PointerEvent, handle: ResizeHandle) {
  console.debug("[rfw] resizer down", handle, e.button, mode.value, props.resizable);
  if (!props.resizable || mode.value !== "normal") return;
  if (e.button !== 0) return;
  beginStart(e);
  startDrag("resize", handle, e);
}

/**
 * 兜底抓取：按在窗口主体（非按钮/输入框）上也能拖动。
 *
 * <p>真实的 pointer down 一定发生在按下的那一刻（coordinates 是准确的），
 * 这里用它做位移原点；之后靠 pointermove 的 movement 累加，不受抓重点对齐影响。</p>
 */
function onGrabPointerDown(e: PointerEvent) {
  if (!props.draggable || mode.value !== "normal") return;
  if (e.button !== 0) return;
  dragActive = true; dragKind = "move"; dragHandle = "";
  beginStart(e);
  startDrag("move", "", e);
}

/* ------------------------------ 边缘收起 ------------------------------ */

const edgeLeaveTimer = ref<ReturnType<typeof setTimeout> | null>(null);

function enterEdge(side: EdgeSide) {
  Object.assign(storedRect, rect);
  edgeAnchor.value = side === "top" || side === "bottom" ? rect.x : rect.y;
  edgeSide.value = side;
  edgePeek.value = false;
  mode.value = "edge";
  emit("edge", side);
  savePersist(true);
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
  bringToFront();
  emit("edge", null);
  emit("restore");
  syncRect();
  savePersist(true);
}

const edgeTabStyle = computed(() => {
  const anchor =
    edgeSide.value === "top" || edgeSide.value === "bottom"
      ? clamp(edgeAnchor.value, 8, Math.max(8, viewport.w - 56))
      : clamp(edgeAnchor.value, 8, Math.max(8, viewport.h - 56));
  const base: Record<string, string> = { zIndex: String(z.value + 1) };
  if (edgeSide.value === "left") return { ...base, left: "0px", top: `${anchor}px` };
  if (edgeSide.value === "right") return { ...base, right: "0px", top: `${anchor}px` };
  if (edgeSide.value === "bottom") return { ...base, bottom: "0px", left: `${anchor}px` };
  return { ...base, top: "0px", left: `${anchor}px` };
});

function guideStyle(g: AlignLine): Record<string, string> {
  return g.axis === "v"
    ? { left: `${g.pos}px`, top: `${g.start}px`, height: `${Math.max(0, g.end - g.start)}px` }
    : { top: `${g.pos}px`, left: `${g.start}px`, width: `${Math.max(0, g.end - g.start)}px` };
}

/* ------------------------------ 最小化 ------------------------------ */

/** 最小化的浮标缩放倍率（夹在 0.6 ~ 3 之间，避免大到盖住屏幕） */
const dockScale = computed(() => clamp(props.dockScale, 0.6, 3));
/** 图标像素尺寸 */
const dockIconSize = computed(() => Math.round(15 * dockScale.value));

const dockRef = ref<HTMLElement | null>(null);
const dockHover = ref(false);
const dockPos = ref<{ x: number; y: number } | null>(null);
const dockDrag = reactive({
  get activeValue() {
    return dockActive;
  },
});
let dockActive = false;
let dockMoved = false;
let dockStartX = 0;
let dockStartY = 0;
let dockOx = 0;
let dockOy = 0;

function onDockHover(v: boolean) {
  dockHover.value = v;
}

/** 图标是否“有东西可显示”（没给 header / dock-icon 时退化成纯图标） */
function dockBoxSize(): { w: number; h: number } {
  const el = dockRef.value;
  if (el) return { w: el.offsetWidth, h: el.offsetHeight };
  return props.minimizeStyle === "bar"
    ? { w: Math.round(56 * dockScale.value), h: Math.round(6 * dockScale.value) }
    : { w: Math.round(32 * dockScale.value), h: Math.round(32 * dockScale.value) };
}

function defaultDockPos(): { x: number; y: number } {
  const { w, h } = dockBoxSize();
  const gap = 16;
  return props.dockPosition === "bottom-left"
    ? { x: gap, y: viewport.h - h - gap }
    : { x: viewport.w - w - gap, y: viewport.h - h - gap };
}

function minimize() {
  if (!props.minimizable) return;
  Object.assign(storedRect, rect);
  mode.value = "minimized";
  emit("minimize");
  savePersist(true);
}

function restoreFromDock() {
  if (mode.value !== "minimized") return;
  // 还原到“被收起前”的位置，而不是浮标所在位置
  Object.assign(rect, storedRect);
  clampRect(rect);
  mode.value = "normal";
  bringToFront();
  syncRect();
  emit("restore");
  savePersist(true);
}

function onDockPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  // 最小化图标同样要被按下就提到最前（此时 mode 是 minimized，单独提层级）
  active.value = true;
  z.value = bumpZ();
  if (!props.dockDraggable && props.minimizeStyle === "icon") {
    // 不可拖拽：pointerup 交给 click 语义
    restoreFromDock();
    return;
  }
  const r = dockPos.value ?? defaultDockPos();
  dockActive = true;
  dockMoved = false;
  dockStartX = e.clientX;
  dockStartY = e.clientY;
  dockOx = r.x;
  dockOy = r.y;
  document.addEventListener("pointermove", onDockMove, { passive: true });
  document.addEventListener("pointerup", onDockUp);
  document.addEventListener("pointercancel", onDockUp);
}

function onDockMove(e: PointerEvent) {
  if (!dockActive) return;
  const dx = e.clientX - dockStartX;
  const dy = e.clientY - dockStartY;
  if (!dockMoved && Math.hypot(dx, dy) < 4) return;
  dockMoved = true;
  const { w, h } = dockBoxSize();
  dockPos.value = {
    x: clamp(dockOx + dx, 0, Math.max(0, viewport.w - w)),
    y: clamp(dockOy + dy, 0, Math.max(0, viewport.h - h)),
  };
}

function onDockUp() {
  if (!dockActive) return;
  dockActive = false;
  document.removeEventListener("pointermove", onDockMove);
  document.removeEventListener("pointerup", onDockUp);
  document.removeEventListener("pointercancel", onDockUp);
  if (dockMoved) savePersist(true);
  else restoreFromDock();
}

const dockStyle = computed(() => {
  const base: Record<string, string> = { zIndex: String(z.value + 1) };
  base["--rfw-dock-scale"] = String(dockScale.value);
  const pos = dockPos.value;
  if (pos) return { ...base, left: `${pos.x}px`, top: `${pos.y}px` };
  const { w, h } = dockBoxSize();
  const gap = 16;
  return props.dockPosition === "bottom-left"
    ? { ...base, left: `${gap}px`, bottom: `${gap}px` }
    : { ...base, right: `${gap}px`, bottom: `${gap}px`, width: undefined, height: undefined };
});

/* ------------------------------ 最大化 / 全屏 ------------------------------ */

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

/* ------------------------------ 独占模式 ------------------------------ */

/** 独占时给页面加遮罩：既挡住点击，也负责把焦点抖回来 */
const hasOccluder = computed(
  () => props.exclusive && visible.value && mode.value !== "minimized" && mode.value !== "edge",
);

function onOccluderShake() {
  const el = winRef.value;
  if (!el) return;
  el.classList.remove("rfw--shake");
  // 强制重排，让动画能重新播放
  void el.offsetWidth;
  el.classList.add("rfw--shake");
  bringToFront();
}

/* ------------------------------ 同步与生命周期 ------------------------------ */

function syncRect() {
  emit("update:x", rect.x);
  emit("update:y", rect.y);
  emit("update:width", rect.w);
  emit("update:height", rect.h);
  emit("change", { x: rect.x, y: rect.y, width: rect.w, height: rect.h });
}

function onViewportResize() {
  readViewport();
  if (mode.value === "normal") {
    clampRect(rect);
    syncRect();
  } else if (mode.value === "minimized") {
    clampRect(storedRect);
    if (dockPos.value) {
      const { w, h } = dockBoxSize();
      dockPos.value = {
        x: clamp(dockPos.value.x, 0, Math.max(0, viewport.w - w)),
        y: clamp(dockPos.value.y, 0, Math.max(0, viewport.h - h)),
      };
    }
  }
}

watch(visible, (v) => {
  if (v) {
    mode.value = "normal";
    edgeSide.value = null;
    edgePeek.value = false;
    z.value = bumpZ();
    clampRect(rect);
  } else {
    clearEdgeTimer();
  }
  savePersist(true);
});

watch(
  () => props.minimizeStyle,
  () => {
    if (dockPos.value) dockPos.value = null;
  },
);

onMounted(() => {
  readViewport();
  initRect();

  // 有持久化记录且上次是最小化态：直接恢复成最小化
  const saved = readPersisted();
  if (saved?.minimized) mode.value = "minimized";

  try {
    if (typeof Worker !== "undefined") {
      worker = new Worker(new URL("./geometry.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = onWorkerMessage;
      worker.onerror = () => {
        worker = null;
      };
      sendWorker({ type: "start", payload: { edgeThreshold: props.edgeThreshold, snap: snapConfig() } });
    }
  } catch {
    worker = null;
  }

  window.addEventListener("resize", onViewportResize);
});

onBeforeUnmount(() => {
  clearEdgeTimer();
  if (persistTimer) clearTimeout(persistTimer);
  if (rafId) cancelAnimationFrame(rafId);
  worker?.terminate();
  worker = null;
  window.removeEventListener("resize", onViewportResize);
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerUp);
  document.removeEventListener("pointermove", onDockMove);
  document.removeEventListener("pointerup", onDockUp);
  document.removeEventListener("pointercancel", onDockUp);
});

// 多实例：不允许并存时，窗口被最小化会挤压同页其他实例的可用空间（这里只做状态纠正）
watch(
  () => props.multiple,
  (v) => {
    if (!v && mode.value === "minimized") mode.value = "normal";
  },
);

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
  getMode: () => mode.value,
});
</script>

<style lang="scss" scoped>
/* 拖拽时只动 transform，绝不触发布局 */
.rfw--moving {
  transition: none !important;
  will-change: transform;
}

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
  transition: box-shadow 0.2s ease;

  &.rfw--normal:hover {
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.22);
  }

  &.rfw--maximized,
  &.rfw--fullscreen {
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
  }

  &.rfw--shake {
    animation: rfw-shake 0.36s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }
}

@keyframes rfw-shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

/* 对齐辅助线 */
.rfw-guides {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1899;
}

/* 独占遮罩：透明但吃掉点击 */
.rfw-occluder {
  position: fixed;
  inset: 0;
  background: transparent;
  cursor: not-allowed;
}

/* 对齐辅助线 */
.rfw-guides {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1899;
}

.rfw-guides__line {
  position: absolute;
  background: var(--el-color-primary);
  opacity: 0.85;

  &.is-v {
    width: 1px;
  }

  &.is-h {
    height: 1px;
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
  flex: 0 0 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
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
  flex: 0 1 auto;
  min-width: 0;
  margin-left: auto;
  overflow: hidden;
}

.rfw__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
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
    background 0.18s ease,
    opacity 0.18s ease;

  &.is-left {
    border-left: none;
    border-radius: 0 8px 8px 0;
  }

  &.is-right {
    border-right: none;
    border-radius: 8px 0 0 8px;
  }

  &.is-top,
  &.is-bottom {
    width: 48px;
    height: 20px;
  }

  &.is-top {
    border-top: none;
    border-radius: 0 0 8px 8px;
  }

  &.is-bottom {
    border-bottom: none;
    border-radius: 8px 8px 0 0;
  }

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

/* 最小化：图标 / 折叠条 */
.rfw-dock {
  position: fixed;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  min-width: calc(32px * var(--rfw-dock-scale, 1));
  min-height: calc(32px * var(--rfw-dock-scale, 1));
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

  &.rfw-dock--bar {
    min-width: calc(56px * var(--rfw-dock-scale, 1));
    min-height: calc(8px * var(--rfw-dock-scale, 1));
    padding: 0;
    background: var(--el-fill-color-darker);
    border-color: transparent;
    border-radius: 9999px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
  }

  &:hover {
    color: var(--el-color-primary);

    &.rfw-dock--icon {
      background: var(--el-color-primary-light-9);
    }

    box-shadow: 0 8px 26px rgba(0, 0, 0, 0.18);
  }
}

.rfw-dock__bar {
  display: block;
  width: 100%;
  height: 100%;
}

.rfw-dock__icon {
  flex: 0 0 auto;
}

.rfw-dock__title {
  overflow: hidden;
  max-width: 160px;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
