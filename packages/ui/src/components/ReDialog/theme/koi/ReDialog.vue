<script setup lang="ts">
/**
 * ReDialog koi 主题 —— 弹窗组件（KoiDialog 移植）
 *
 * 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
 * 使用方式与 default 主题对齐（v-model 控制显隐），
 * 额外支持 koi 专属能力：showWindowShell / fullscreen / footerHidden。
 */
import { ref, toRefs, computed, watch, onMounted, onUnmounted, onBeforeUnmount, type Component, type CSSProperties } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { Aim } from "@element-plus/icons-vue";
import { useKoiWindowShell } from "./useKoiWindowShell";
import KoiShellHeaderActions from "./KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "./KoiShellMinimizedDock.vue";
import ReDialogCloseFab from "../../CloseFab.vue";

defineOptions({ name: "ReDialog", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 标题下方副标题（可选；不传则与历史渲染完全一致） */
    subtitle?: string;
    /** 标题栏图标（Element Plus 图标组件） */
    icon?: Component;
    width?: number | string;
    /** 距视口顶部的偏移，对应 el-dialog 的 top（如 6vh） */
    top?: string;
    /** 标题与页脚内容是否居中排列 */
    center?: boolean;
    /** 弹窗是否在视口中水平、垂直居中 */
    alignCenter?: boolean;
    /**
     * 是否可拖拽（默认 true：未传即可按住标题栏拖动）。
     *
     * <p>历史沿革：koi 版早期把 draggable 钉死为 true（所有弹窗头部都可拖，
     * 含不应拖的对话框），后改为受控 prop 默认 false；2026-10-28 依用户决策
     * 恢复为<b>默认 true</b>，与 default 主题一致 —— 需显式不可拖的弹窗
     * 传 {@code :draggable="false"}。element-plus 以 transform 位移，与
     * align-center 的 flex 居中兼容，两者可同时开启。</p>
     */
    draggable?: boolean;
    /**
     * 是否允许拖拽越出视口（透传 el-dialog 的 `overflow`）。
     *
     * <p><b>为什么需要它</b>：el-dialog 的 `useDraggable` 只在 `overflow` 为假时 clamp，
     * 位移上限 {@code maxTop = clientHeight - targetTop - (targetHeight < clientHeight ? targetHeight : 0)}，
     * 弹窗**略矮于视口**时这个上限约等于 0，表现就是 <b>拖不动</b>
     * （element-plus 2.14 的 `use-draggable/index.mjs`）。koi 弹窗多为近满高的配置面板，
     * 正好落在拖不动的区间。</p>
     *
     * <p>未传值时就等于 `overflow="false"`：弹窗只在拖到视口边后停止，不会拖出视口、也不会回弹；
     * 业务真要自由空间就显式传 <code>overflow="true"</code>（放开钳制，接受弹窗被拖出视口）。</p>
     */
    overflow?: boolean;
    height?: number;
    closeOnClickModal?: boolean;
    /**
     * 是否按 Esc 关闭（对齐 el-dialog，默认 true）。
     *
     * <p>本变体 inheritAttrs 为 false，props 又没声明它，调用方传的
     * close-on-press-escape 会被静默丢弃，内层 el-dialog 永远用自己的默认 true ——
     * 全屏设计器（FlowDesignDialog）就是这样被一次 Esc 整个卸载的。基类 ReDialog
     * 早就声明并透传了该 prop，这里补齐。</p>
     */
    closeOnPressEscape?: boolean;
    confirmText?: string;
    cancelText?: string;
    destroyOnClose?: boolean;
    /** 打开时是否全屏（可用右上角按钮切换） */
    fullscreen?: boolean;
    loading?: boolean;
    /**
     * 底部区域（自带「确定/取消」按钮）控制，三态：
     *   - undefined（未传，新默认）：底部只在业务提供 #footer 插槽时渲染插槽内容，
     *     自带按钮默认不渲染；业务要自带按钮需显式传 footer-hidden="false"，
     *     或自己写 footer 插槽。
     *   - false：渲染自带「确定/取消」按钮（提供 #footer 插槽时插槽内容优先）—— 显式开启。
     *   - true：整个底部区域不渲染（即使有 #footer 插槽，与历史语义一致）。
     */
    footerHidden?: boolean;
    /**
     * 是否显示右上角关闭按钮（默认 true）。
     *
     * <p>与基类 ReDialog 对齐：业务传了自定义 #header 时，窗口壳不会被渲染，
     * 原生关闭按钮必须补上，否则弹窗只能靠底部「关闭」按钮兜底。</p>
     */
    showClose?: boolean;
    /** 是否显示右上角窗口壳操作区（收起 / 全屏 / 关闭） */
    showWindowShell?: boolean;
    /** 最小化按钮是否显示（默认仅关闭可见） */
    showMinimize?: boolean;
    /** 全屏按钮是否显示（默认仅关闭可见） */
    showFullscreen?: boolean;
    /** headless：隐藏标题栏，右上角圆形悬浮关闭按钮替代 */
    headless?: boolean;
    /** 紧凑模式：减小弹窗内边距 */
    compact?: boolean;
    /**
     * 浮层层级（透传给 el-dialog 的 z-index）；不传则由 Element Plus 自动分配。
     *
     * <p>自动分配是按 <b>浮层被创建</b>的顺序递增（PopupManager.nextZIndex，2000 起），
     * 而不是按「谁在谁里面」——所以一个<b>从弹窗内部打开的子弹窗</b>完全可能拿到
     * 比它父弹窗更低的层级，被父弹窗整片盖住、点击全被吃掉。
     * 2026-10-02 在采集器产物（dist）实测：全屏设计器壳拿到 2011，而从它内部打开的
     * 「抽取字段」对话框只拿到 2005，于是字段表整片点不动（占位弹层打不开）。
     * 把<b>作为容器</b>的那层钉在基线（如 2000，恰好低于自动分配的首个值 2001），
     * 壳内的弹窗与浮层再按正常顺序往上叠，两种构建形态就一致了。</p>
     */
    zIndex?: number;
    /**
     * 是否允许从四条边 / 四个角缩放（默认 false）。
     *
     * <p>开启后弹窗第一次被缩放时会从 overlay 的居中流转成 `position: fixed` 自由定位，
     * 之后可按八个方向「对边固定」拉伸；关闭弹窗后恢复默认尺寸（要跨开合记忆尺寸就传
     * {@link resizeStorageKey}）。全屏状态下热区不渲染。</p>
     */
    resizable?: boolean;
    /** 缩放下限宽度（px，低于 320 按 320 算） */
    minWidth?: number;
    /** 缩放下限高度（px，低于 200 按 200 算） */
    minHeight?: number;
    /** 缩放上限宽度（px，0/未传按视口宽度） */
    maxWidth?: number;
    /** 缩放上限高度（px，0/未传按视口高度） */
    maxHeight?: number;
    /**
     * 尺寸记忆 key：传了才把缩放后的宽高写进 localStorage（`koi-dialog-size:<key>`），
     * 下次打开按记忆尺寸居中显示。不传即每次打开回到默认尺寸。
     */
    resizeStorageKey?: string;
  }>(),
  {
    title: "ReDialog",
    subtitle: "",
    icon: Aim,
    height: 0,
    width: 650,
    top: "",
    center: true,
    alignCenter: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    confirmText: "",
    cancelText: "",
    // 关闭即销毁浮层：项目里弹窗实例多，常驻 DOM 会让每次关闭后都留下一个
    // <div class="el-overlay">。需要保留内部状态的使用方显式传 :destroy-on-close="false"。
    destroyOnClose: true,
    fullscreen: false,
    loading: false,
    draggable: true,
    // overflow：跟 draggable 无关——直接透传 props.overflow（el-dialog 自己按 globalConfig 决定 clamp），
    // 与 footerHidden 同理，必须给 default: undefined —— Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false，三态里的「未传」将永远不可达。
    overflow: undefined,
    // footerHidden 必须显式给 default: undefined —— Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false（runtime-core resolvePropValue: isAbsent && !hasDefault → false），
    // 三态里的「未传」将永远不可达；default: undefined 使 hasOwn(default) 成立、跳过强转。
    footerHidden: undefined,
    showClose: true,
    showWindowShell: true,
    showMinimize: false,
    showFullscreen: false,
    headless: false,
    compact: false,
    // 默认不传：交给 Element Plus 自动分配，等同于修复前的行为
    zIndex: undefined,
    // 缩放能力 opt-in：默认关闭，避免影响既有弹窗的居中/尺寸行为
    resizable: false,
    minWidth: 320,
    minHeight: 200,
    maxWidth: 0,
    maxHeight: 0,
    resizeStorageKey: "",
  },
);

/** v-model 控制显隐（与 default 主题 API 对齐） */
const visible = defineModel<boolean>({ default: false });

/**
 * 本地可见性镜像：关闭时本地立即生效，不依赖父组件是否响应 update:modelValue
 * （防止 v-model 绑定只读 props 等错误用法——父不响应时弹窗也能关闭；父重新打开时再同步）
 */
const localOpen = ref(false);
watch(visible, (v) => { localOpen.value = v; }, { immediate: true });

const { loading, width, height } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex,
} = useKoiWindowShell(visible, () => props.fullscreen);

/**
 * localOpen 与 visible 双向闭环：
 * el-dialog 内部关闭（ESC / 遮罩 / v-model）只更新 localOpen，
 * 这里把状态回传父级 v-model。
 *
 * <p>注意：最小化（minimize()）走的是同一条链（visible=false → localOpen=false），
 * 但此时浮标是必须留存的目标：清理最小化停靠由 koiClose() / koiCancel() /
 * koiQuickClose() 显式负责，这里一旦 clearMinimized() 就会把刚渲染的浮标
 * 清盘（v-if 求出到 v-if 求入，只经过一个 tick）。</p>
 */
watch(localOpen, (v) => {
  visible.value = v;
});

/**
 * ElDialog 挂载标记：koi 壳默认 destroy-on-close，而 Element Plus 关闭后只销毁
 * 弹窗内容，遮罩（.el-overlay）用 v-show 控制、会一直留在 body —— 项目里弹窗
 * 实例多，开一轮下来每只弹窗都在 DOM 里攒一个空遮罩。这里在关闭动画结束后
 * 把整个 ElDialog 卸载，遮罩随实例一起销毁；需要保留内部状态的使用方显式传
 * :destroy-on-close="false"，此时不走卸载、维持原行为。
 */
const elMounted = ref(false);
watch(localOpen, (v) => { if (v) elMounted.value = true; }, { immediate: true });

const dialogFullscreen = computed(() => windowFullscreen.value);



/**
 * 拖拽结束后至少留在视口内的像素数（保证头部仍可见、可再次抓取）。
 *
 * @see onDocumentMouseUp
 */
const DRAG_KEEP_VISIBLE = 56;

/**
 * 传给 el-dialog 的 `overflow`：显式配置优先，不传时默认 `false`。
 *
 * <p>el-dialog 的 `useDraggable` 只会在 `overflow` 为假时对位移做视口钳制（拖到视口边就
 * 停、不越出视口）；ReDialog 也只在近满高弹窗的低效钳制区，才需要业务显式传
 * <code>overflow="true"</code> 放开钳制。此前「未传则跟随 {@link draggable}」等同于
 * 默认放开钳制，也即弹窗会随鼠标跑到视口外 — 这就是 ReDialog（el-dialog 壳）能拖出
 * 可视区域的原因。</p>
 *
 * <p>放开钳制后的兜底（{@link onDocumentMouseUp} 的
 * {@code DRAG_KEEP_VISIBLE} + {@code resetPosition}）是为显式传 `overflow` 的业务留的；
 * 默认钳制状态下弹窗到视口边就停，用不到它。</p>
 */
const effectiveOverflow = computed<boolean>(() => props.overflow ?? false);

/** el-dialog 实例句柄（取弹窗 DOM / 调 resetPosition） */
const dialogInstance = ref<DialogExposed | null>(null);

/**
 * ElDialog 通过 `defineExpose` 暴露的成员（这里只声明用到的两个）。
 *
 * <p>element-plus 的 `dialog.vue` 里 {@code __expose({ visible, dialogContentRef, resetPosition, handleClose })}，
 * 且 `expose` 经 `proxyRefs` 包装，故 {@code dialogContentRef} 取到的是已解包的 dialog-content
 * 组件实例（其 `$el` 即 `.el-dialog` 元素），不是 Ref。</p>
 */
interface DialogExposed {
  /** 内部 dialog-content 组件实例；其 $el 即 .el-dialog 元素 */
  dialogContentRef?: { $el?: HTMLElement } | null;
  /** 把拖拽位移归零（同时清掉 useDraggable 内部的 offset 记账） */
  resetPosition?: () => void;
}

/**
 * 拖拽结束兜底：被拖到视口外的弹窗拉回原价，保证永远抓得到。
 *
 * <p>在业务 <b>显式放开 {@link effectiveOverflow}</b> 的前提下，弹窗才被允许被拖到任意位置，以致
 * 拖出视口而无法再抓到。这里在每次 mouseup 后检查四个方向：只要有任一边界越出「保留区」，
 * 就用官方 {@code resetPosition} 归零。</p>
 *
 * <p>为什么用官方 {@code resetPosition} 而不是自己改写 {@code transform}：
 * `useDraggable` 内部维护了自己的 offset 记账，外部直接改样式会与它分叉，
 * 下一次拖拽弹窗会先跳一下。</p>
 */
function onDocumentMouseUp(): void {
  if (!props.draggable || !effectiveOverflow.value) return;
  const el = dialogInstance.value?.dialogContentRef?.$el ?? null;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const lost =
    rect.right < DRAG_KEEP_VISIBLE ||
    rect.left > vw - DRAG_KEEP_VISIBLE ||
    rect.bottom < DRAG_KEEP_VISIBLE ||
    rect.top > vh - DRAG_KEEP_VISIBLE;
  if (!lost) return;
  dialogInstance.value?.resetPosition?.();
}

/** 弹窗打开期间才监听 document 上的 mouseup（关闭即摘，避免常驻全局监听） */
watch(visible, (open) => {
  if (typeof document === "undefined") return;
  if (open) {
    document.addEventListener("mouseup", onDocumentMouseUp);
    // 记忆尺寸：只有显式传 resizeStorageKey 才恢复，且按视口重新居中
    const stored = props.resizable ? readSize() : null;
    if (stored) {
      const { minW, minH, maxW, maxH } = resizeBounds();
      freeRect.value = centerRect(
        clampValue(stored.width, minW, maxW),
        clampValue(stored.height, minH, maxH),
      );
    }
  } else {
    document.removeEventListener("mouseup", onDocumentMouseUp);
  }
});

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.removeEventListener("mouseup", onDocumentMouseUp);
    document.removeEventListener("pointermove", onResizeMove);
    document.removeEventListener("pointerup", onResizeEnd);
    document.removeEventListener("pointercancel", onResizeEnd);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }
});

const windowWidth = ref(window.innerWidth);

const dialogWidth = computed(() => {
  if (dialogFullscreen.value) return "100%";
  // 缩放后的尺寸是精确 px（已按视口钳制过），不再走响应式百分比兜底
  if (freeRect.value) return `${freeRect.value.width}px`;
  if (windowWidth.value < 600) return "90%";
  const numericWidth = typeof width.value === "number" ? width.value : Number.parseFloat(String(width.value));
  // CSS 函数（min() / clamp() / calc()）没有可解析的数值，交给浏览器自己算。
  // 旧写法 parseFloat 得 NaN 后回落 windowWidth，会让 min(500px, 92vw) 这类声明
  // 被误判成「比视口还宽」而整条变成 95%，弹窗在桌面端铺满一屏。
  if (Number.isNaN(numericWidth)) return width.value;
  if (numericWidth > windowWidth.value) return "90%";
  if (numericWidth > windowWidth.value * 0.95) return "95%";
  return width.value;
});

/* ==================== 边缘 / 四角缩放 ==================== */

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** 八个热区：四条边 + 四个角（模板 v-for 渲染） */
const RESIZE_DIRS: ResizeDir[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

/** 缩放时给 body 的光标（拖出弹窗范围也保持手感一致） */
const RESIZE_CURSOR: Record<ResizeDir, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

/**
 * 自由尺寸：非空时弹窗脱离 overlay 的居中流，按 left/top/width/height 定位。
 *
 * <p>为什么必须脱离居中流：`align-center` 把 `.el-dialog` 放在 `display:flex` 的容器里当
 * flex item，此时 `left/top` 完全不生效，只有右下角能对准指针；西/北边一拖就是反方向漂。
 * 转成 `position: fixed` 后八个方向才能做到「对边固定、被拖边跟手」。</p>
 */
const freeRect = ref<{ left: number; top: number; width: number; height: number } | null>(null);

const isResizing = ref(false);

/**
 * 缩放下限兜底：再小弹窗头部（标题 + 壳操作）和 footer 按钮会挤成一团。
 * 业务传的 minWidth / minHeight 只可能把下限抬高，不会被压得更低。
 */
const RESIZE_FLOOR = { width: 320, height: 200 };

function clampValue(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), Math.max(min, max));
}

/** 弹窗根元素（.el-dialog） */
function dialogEl(): HTMLElement | null {
  return (dialogInstance.value?.dialogContentRef?.$el as HTMLElement | undefined) ?? null;
}

function viewportSize(): { width: number; height: number } {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}

/** 尺寸持久化 key（传了 resizeStorageKey 才记忆） */
const resizeStoreKey = computed(() => (props.resizeStorageKey ? `koi-dialog-size:${props.resizeStorageKey}` : ""));

function saveSize(size: { width: number; height: number }): void {
  if (!resizeStoreKey.value) return;
  try {
    localStorage.setItem(resizeStoreKey.value, JSON.stringify(size));
  } catch {
    /* 隐私模式 / 配额满：留不下就按默认尺寸打开 */
  }
}

function readSize(): { width: number; height: number } | null {
  if (!resizeStoreKey.value) return null;
  try {
    const raw = localStorage.getItem(resizeStoreKey.value);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
    if (typeof parsed?.width === "number" && typeof parsed?.height === "number") {
      return { width: parsed.width, height: parsed.height };
    }
  } catch {
    /* 脏数据当没存过 */
  }
  return null;
}

/** 按尺寸在视口居中摆放（记忆尺寸恢复时用） */
function centerRect(width: number, height: number): { left: number; top: number; width: number; height: number } {
  const vp = viewportSize();
  return {
    left: Math.max(0, Math.round((vp.width - width) / 2)),
    top: Math.max(0, Math.round((vp.height - height) / 2)),
    width,
    height,
  };
}

/** 当前尺寸的合法区间（视口 + 业务上下限；视口比下限还小时让视口赢，避免弹窗比屏幕还宽） */
function resizeBounds(): { minW: number; minH: number; maxW: number; maxH: number } {
  const vp = viewportSize();
  const maxW = Math.min(props.maxWidth || vp.width, vp.width);
  const maxH = Math.min(props.maxHeight || vp.height, vp.height);
  return {
    minW: Math.min(Math.max(RESIZE_FLOOR.width, props.minWidth || 0), maxW),
    minH: Math.min(Math.max(RESIZE_FLOOR.height, props.minHeight || 0), maxH),
    maxW,
    maxH,
  };
}

let resizeDir: ResizeDir = "e";
let resizeStart = { x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 };

function onResizeStart(e: PointerEvent, dir: ResizeDir): void {
  if (!props.resizable || dialogFullscreen.value || e.button !== 0) return;
  const el = dialogEl();
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();

  const rect = el.getBoundingClientRect();
  // 先归零 el-dialog 的拖拽位移：进入自由定位后 left/top 是唯一坐标来源，
  // 留着 useDraggable 的 transform 会和 left/top 叠加，缩放时整块弹窗反向漂
  dialogInstance.value?.resetPosition?.();
  freeRect.value = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  resizeDir = dir;
  resizeStart = { x: e.clientX, y: e.clientY, ...freeRect.value };
  isResizing.value = true;
  document.body.style.userSelect = "none";
  document.body.style.cursor = RESIZE_CURSOR[dir];
  document.addEventListener("pointermove", onResizeMove);
  document.addEventListener("pointerup", onResizeEnd);
  document.addEventListener("pointercancel", onResizeEnd);
}

function onResizeMove(e: PointerEvent): void {
  if (!isResizing.value) return;
  const vp = viewportSize();
  const { minW, minH, maxW, maxH } = resizeBounds();
  const dx = e.clientX - resizeStart.x;
  const dy = e.clientY - resizeStart.y;
  // 拖动前弹窗的对边（西/北边缩放时它固定不动）；先按视口收一次，
  // 弹窗此前被拖出视口时也能把对边拉回可见区
  const right = Math.min(resizeStart.left + resizeStart.width, vp.width);
  const bottom = Math.min(resizeStart.top + resizeStart.height, vp.height);

  let { left, top, width, height } = resizeStart;

  // 东/南边：左上角固定，宽高跟手，且不越出视口
  if (resizeDir.includes("e")) {
    width = clampValue(resizeStart.width + dx, minW, Math.min(maxW, vp.width - left));
  }
  if (resizeDir.includes("s")) {
    height = clampValue(resizeStart.height + dy, minH, Math.min(maxH, vp.height - top));
  }
  // 西/北边：对边固定，先按位移算宽高，再反推 left/top
  if (resizeDir.includes("w")) {
    width = clampValue(resizeStart.width - dx, minW, Math.min(maxW, right));
    left = right - width;
  }
  if (resizeDir.includes("n")) {
    height = clampValue(resizeStart.height - dy, minH, Math.min(maxH, bottom));
    top = bottom - height;
  }

  freeRect.value = { left, top, width, height };
  emit("resize", { width, height });
}

function onResizeEnd(): void {
  if (!isResizing.value) return;
  isResizing.value = false;
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  document.removeEventListener("pointermove", onResizeMove);
  document.removeEventListener("pointerup", onResizeEnd);
  document.removeEventListener("pointercancel", onResizeEnd);
  if (freeRect.value) {
    saveSize({ width: freeRect.value.width, height: freeRect.value.height });
    emit("resize-end", { width: freeRect.value.width, height: freeRect.value.height });
  }
}

/** 弹窗根元素的自由定位样式（非缩放态返回 undefined，交回 ElDialog 自己管） */
const shellStyle = computed<CSSProperties | undefined>(() => {
  const rect = freeRect.value;
  if (!rect || dialogFullscreen.value) return undefined;
  return {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    // 内联覆盖 element 的 --el-dialog-margin-top 与 koi 壳的 94vh 上限
    margin: "0",
    maxHeight: "none",
  };
});

/** 内容区：自由尺寸下放开 height 上限，让中间剩余空间自己撑开并内部滚动 */
const contentWrapperStyle = computed<CSSProperties>(() => {
  if (freeRect.value && !dialogFullscreen.value) return { maxHeight: "none" };
  return dialogFullscreen.value || !height ? { height: "auto" } : { maxHeight: height + "px" };
});

function handleResize() {
  windowWidth.value = window.innerWidth;
  // 视口变小后把自由尺寸的弹窗拉回可见区（否则会整块落在视口外，再也抓不到）
  const rect = freeRect.value;
  if (!rect) return;
  const vp = viewportSize();
  const nextWidth = Math.min(rect.width, vp.width);
  const nextHeight = Math.min(rect.height, vp.height);
  freeRect.value = {
    width: nextWidth,
    height: nextHeight,
    left: clampValue(rect.left, 0, vp.width - nextWidth),
    top: clampValue(rect.top, 0, vp.height - nextHeight),
  };
}

onMounted(() => window.addEventListener("resize", handleResize));
onUnmounted(() => window.removeEventListener("resize", handleResize));

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  /**
   * 生命周期事件：显式声明并从内部 ElDialog 转发。
   *
   * <p>不声明时这些监听器留在 `$attrs` 里、靠 `<ElDialog v-bind="$attrs">` 透传，
   * 能工作但属隐式依赖；声明后由本组件负责转发，语义与 LDialog 的
   * open/close/closed 一致，从 LDialog 迁过来的页面不必改监听器。</p>
   *
   * <p><b>注意</b>：声明会把这些监听器从 `$attrs` 摘走，所以下面必须在 ElDialog
   * 上显式 emit，否则等于把事件丢掉。</p>
   */
  (e: "open"): void;
  (e: "close"): void;
  (e: "closed"): void;
  /** 缩放过程中持续触发（自由尺寸，px） */
  (e: "resize", payload: { width: number; height: number }): void;
  /** 缩放结束（松手）时触发，可用于业务侧持久化 */
  (e: "resize-end", payload: { width: number; height: number }): void;
}>();

function koiClose() {
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

function koiConfirm() {
  // 通用版 ReDialog 发 ok，koi 版历史只发 confirm：两个都发，页面两种写法才能都生效
  emit("ok");
  emit("confirm");
}

function koiCancel() {
  emit("cancel");
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

/** 编程式打开 */
function koiOpen() {
  visible.value = true;
}

/** 编程式快速关闭（跳过二次确认） */
function koiQuickClose() {
  clearMinimized();
  localOpen.value = false;
  visible.value = false;
}

/** ElDialog 关闭动画结束：卸载整个弹窗（含遮罩），并把 closed 转发给业务 */
function handleDialogClosed() {
  if (props.destroyOnClose) elMounted.value = false;
  // 关掉即回到默认尺寸（要跨开合记忆尺寸请传 resizeStorageKey）
  freeRect.value = null;
  emit("closed");
}

defineExpose({ koiOpen, koiClose, koiQuickClose });
</script>

<template>
  <ElDialog
    ref="dialogInstance"
    v-if="elMounted || !destroyOnClose"
    v-bind="$attrs"
    class="koi-dialog-shell"
    :class="{
      'is-headless': headless,
      'koi-dialog-compact': compact,
      'is-resizing': isResizing,
      'koi-dialog-free': !!freeRect,
    }"
    :style="shellStyle"
    v-model="localOpen"
    :title="title"
    :width="dialogWidth"
    :top="top"
    :center="center"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    append-to-body
    modal-class="koi-dialog-modal"
    :draggable="draggable"
    :overflow="effectiveOverflow"
    :destroy-on-close="destroyOnClose"
    :fullscreen="dialogFullscreen"
    :z-index="props.zIndex"
    :loading="loading"
    :show-close="!headless && showClose && (!!$slots.header || !showWindowShell)"
    @open="emit('open')"
    @close="emit('close')"
    @closed="handleDialogClosed"
  >
    <!-- 业务自定义 header 优先：直接放进 ElDialog 的 #header，避免 ElDialog
         再按 title 渲染一层默认标题，造成双 header。 -->
    <template v-if="$slots.header && !headless" #header>
      <slot name="header" />
    </template>
    <!-- 无业务 header 时，showWindowShell/headless 使用窗口壳（默认标题 + 壳操作） -->
    <template v-else-if="showWindowShell || headless" #header>
      <div class="koi-dialog-custom-header" :class="{ 'is-empty': headless }">
        <template v-if="!headless">
          <span class="koi-dialog-header-left">
            <span v-if="icon" class="koi-dialog-header-icon-wrap">
              <el-icon class="koi-dialog-header-icon"><component :is="icon" /></el-icon>
            </span>
            <span v-if="subtitle" class="koi-dialog-header-titles">
              <span class="el-dialog__title">{{ title }}</span>
              <small class="koi-dialog-subtitle">{{ subtitle }}</small>
            </span>
            <span v-else class="el-dialog__title">{{ title }}</span>
          </span>
          <KoiShellHeaderActions
            :is-fullscreen="dialogFullscreen"
            :enabled="visible"
            :show-minimize="showMinimize"
            :show-fullscreen="showFullscreen"
            @minimize="minimize"
            @toggle-fullscreen="toggleFullscreen"
            @close="koiClose"
          />
        </template>
        <!-- headless：隐藏标题栏内容，仅保留一条极窄拖拽条 + 右上角关闭按钮 -->
        <template v-else>
          <span class="koi-dialog-header-drag" />
        </template>
      </div>
    </template>
    <ReDialogCloseFab
      v-if="headless"
      :size="28"
      @click="koiClose"
    />
    <div
      class="dialog-content-wrapper"
      :style="contentWrapperStyle"
    >
      <slot name="content">
        <slot></slot>
      </slot>
    </div>
    <!-- 边缘 / 四角缩放热区：resizable 开启且非全屏时才渲染（全屏没有缩放语义） -->
    <template v-if="resizable && !dialogFullscreen">
      <div
        v-for="dir in RESIZE_DIRS"
        :key="dir"
        class="koi-dialog-resize"
        :class="`koi-dialog-resize--${dir}`"
        role="separator"
        :aria-label="`缩放弹窗（${dir}）`"
        @pointerdown="onResizeStart($event, dir)"
      />
    </template>
    <!-- 底部区域三态：未传=仅业务 #footer 插槽时渲染；false=渲染自带按钮；true=整个不渲染 -->
    <template
      v-if="footerHidden === false || (footerHidden !== true && !!$slots.footer)"
      #footer
    >
      <slot name="footer" v-bind="{ confirm: koiConfirm, cancel: koiCancel, loading: confirmLoading }">
        <span v-if="footerHidden === false" class="dialog-footer">
          <el-button class="koi-btn-borderless" type="primary" :loading="confirmLoading" @click="koiConfirm">
            {{ confirmText || "确定" }}
          </el-button>
          <el-button class="koi-btn-borderless" type="danger" @click="koiCancel">
            {{ cancelText || "取消" }}
          </el-button>
        </span>
      </slot>
    </template>
  </ElDialog>
  <KoiShellMinimizedDock
    :visible="minimized"
    :title="title"
    tooltip="恢复窗口"
    :stack-index="dockStackIndex"
    @restore="restoreFromDock"
  />
</template>

<style lang="scss" scoped>
.koi-dialog-custom-header {
  position: relative;
  /* 不再上移 4px：header 上下已压到 2px，再 -4px 会让标题中心比 header 中线高 4~5px，
     表现为「左侧名称偏上/偏中」。与右侧关闭按钮同用 header 中线对齐。 */
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding-right: 0;
  padding-bottom: 0;

  .koi-dialog-header-left {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .koi-dialog-header-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-radius-md, 6px);
    background: var(--el-bg-color);
  }

  .koi-dialog-header-icon {
    font-size: 11px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  /* 标题 + 副标题纵向排布（subtitle 未传时不渲染，历史弹窗零影响） */
  .koi-dialog-header-titles {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    gap: 2px;
  }

  .koi-dialog-subtitle {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.3;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .el-dialog__title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dialog-content-wrapper {
  box-sizing: border-box;
  padding-right: 4px;
  overflow: hidden auto;
  /* 由弹窗 flex 布局约束高度：占满中间剩余空间并在内部滚动 */
  flex: 1 1 auto;
  min-height: 0;

  & > * {
    padding-right: 4px;
  }

  &--headless {
    padding-top: 16px;
  }
}

.koi-btn-borderless {
  border: none;
  box-shadow: none;
}

/* compact 模式（使用共享令牌） */
.koi-dialog-compact .koi-dialog-custom-header {
  padding-bottom: var(--rm-compact-koi-header-padding-bottom);
}
.koi-dialog-compact .koi-dialog-header-icon-wrap {
  width: var(--rm-compact-koi-icon-size);
  height: var(--rm-compact-koi-icon-size);
}
.koi-dialog-compact .koi-dialog-header-icon {
  font-size: var(--rm-compact-koi-icon-font-size);
}
.koi-dialog-compact .el-dialog__title {
  font-size: var(--rm-compact-title-font-size);
}
.koi-dialog-compact .dialog-footer .koi-btn-borderless {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
/**
 * 顶部 / 底部留白：koi 主题全局给 .el-dialog 四周 16px 内边距，其中顶部由
 * element.scss 的 --el-dialog-header-padding-top 固定成 16px，是 header 高度的
 * 第一段来源。弹窗壳（且只有弹窗壳）把上下各压到 4px：普通 el-dialog 保持
 * 主题口径不变。选择器 2 类 + !important，高于主题的 .el-dialog，能稳定生效。
 */
.el-dialog.koi-dialog-shell {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.koi-dialog-shell .el-dialog__header {
  margin-right: 0;
  /* header 留白：上下 8px、左右 14px（左右内缩让标题/关闭钮不顶到弹框两端，
     与正文内容保持同一水平缩进） */
  padding: 8px 14px !important;
  /* 去除头部底色，并与下方内容留出一点间距（4px，原 8px） */
  background: transparent !important;
  margin-bottom: 4px;
}

/**
 * 关闭按钮垂直居中（自定义 header 场景）。
 *
 * <p>Element 把 headerbtn 放在 header 里，但 top 取
 * --el-dialog-header-padding-top（16px），而弹窗壳的 header 是上下 8px，
 * 按钮因此比标题栏中心低约 8px。</p>
 *
 * <p>header 原本是 static，按钮实际以 .el-dialog 为包含块；设为 relative 后
 * 按 header 中线对齐，横向仍贴 header 右缘（right:0 = 原来的 dialog 内容右缘）。</p>
 */
.koi-dialog-shell .el-dialog__header {
  position: relative;
}

.koi-dialog-shell .el-dialog__headerbtn {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}

/* body 内边距：上下 6px（原 8px）。注意 koi 主题把 body 统一置 0
   （element.scss 的 .el-dialog.koi-dialog-shell .el-dialog__body，
   权重 3 类 + !important），所以这条只在没有主题 CSS 的宿主里生效；
   有主题时留白由弹窗内容自己控制，这里保留是为了组件自洽。 */
.koi-dialog-shell .el-dialog__body {
  padding: 6px 8px !important;
}

/* 全屏时内容区放开最大高度，允许铺满整个屏幕 */
.koi-dialog-shell.is-fullscreen .dialog-content-wrapper {
  max-height: none;
}

/* 整个弹窗：flex 纵向布局，整体不超过视口高度（头尾固定、中间 body 滚动）
   max-height 由 92vh 提到 94vh：头尾压薄省下的高度之外，再多留 2vh 给内容 */
.koi-dialog-shell {
  display: flex;
  flex-direction: column;
  max-height: 94vh;
}
.koi-dialog-shell .el-dialog__header {
  flex: 0 0 auto;
}
.koi-dialog-shell .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.koi-dialog-shell .el-dialog__footer {
  flex: 0 0 auto;
}
/* 全屏时铺满，不受 94vh 限制 */
.koi-dialog-shell.is-fullscreen {
  max-height: 100vh;
}

/* 紧凑 footer：上下 2px / 4px（原 4px / 6px），左右 12px（原 20px）；
   footer 高度从约 36px 压到约 32px，按钮行本身不再被空白撑高 */
.koi-dialog-shell .el-dialog__footer {
  padding: 2px 12px 4px !important;
}

/* footer 内按钮统一高度与字重（业务侧传入的 ReButton 默认偏大，弹窗内收窄）。
   min-width/圆角/字重为 Vue 体系弹窗 footer 按钮标准（源自 eduai /edu/students
   弹窗的既有观感：96px 最小宽、12px 圆角、600 字重），统一在此收敛，
   各应用不要在页面里各自覆盖。 */
.koi-dialog-shell .el-dialog__footer .el-button {
  height: 26px;
  min-height: 26px;
  min-width: 96px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--el-radius-lg, 12px);
}

/* compact 模式：进一步缩小 body 内边距 */
.koi-dialog-shell.koi-dialog-compact .el-dialog__body {
  padding: var(--rm-compact-body-padding);
}

.koi-dialog-shell--headless .el-dialog__header {
  display: none;
}

/* 弹窗遮罩：纯色扁平遮罩 */
.koi-dialog-modal {
  background-color: rgba(0, 0, 0, 0.45);
}

/* headless：隐藏标题内容，仅保留一条悬浮于顶部的拖拽热区条（不占内容高度，可拖动），CloseFab 浮于右上角 */
.koi-dialog-shell.is-headless {
  position: relative;
}

/* 拖拽热区：44px 透明条覆盖在 body 顶部，扩大可拖拽范围 */
.koi-dialog-shell.is-headless .el-dialog__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  height: 44px;
  overflow: hidden;
  z-index: 6;
}

.koi-dialog-shell.is-headless .koi-dialog-custom-header.is-empty {
  height: 44px;
  padding: 0;
}

.koi-dialog-shell.is-headless .koi-dialog-header-drag {
  display: block;
  width: 100%;
  height: 44px;
}

.koi-dialog-shell.is-headless .el-dialog__body {
  padding-top: 0;
}

/* 弹窗本体：加大圆角（保持不透明白色背景） */
.koi-dialog-shell {
  --el-dialog-border-radius: var(--el-radius-xl);
  border-radius: var(--el-radius-xl);
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}

/**
 * 自由定位时抹掉 el-dialog 的上外边距。
 *
 * <p>居中态 el-dialog 靠 `margin: <top> auto` 定位（Element 的
 * `--el-dialog-margin-top`，宿主应用常改写为 `margin-top: 7vh !important`，
 * 例如 monitor 的 telemetry.css）。八向缩放进入自由定位后坐标只由 left/top 决定，
 * 这条 `!important` 的 margin 会把整块弹窗再往下推 7vh —— 表现为"一按缩放边，
 * 弹窗就跳下一截"，同时可能把南边热区推出视口、再也抓不到。</p>
 *
 * <p>内联 `margin: 0` 压不住 `!important`，所以用更高的特异度在全局样式里覆盖：
 * 3 类选择器 > 宿主的 `.el-dialog`，两边都是 important 时由特异度决胜。</p>
 */
.el-dialog.koi-dialog-shell.koi-dialog-free {
  margin: 0 !important;
}

/**
 * 边缘 / 四角缩放热区。
 *
 * <p>热区贴在弹窗<b>内缘</b>（不向外偏移）：`.koi-dialog-shell` 是 `overflow: hidden`，
 * 向外扩的部分会被直接裁掉，等于没有热区。四条边各 5px、四个角 12px，
 * 尺寸与 WindowsLayout 的口径一致（那里是死代码，算法已迁到这里）。</p>
 *
 * <p>z-index 20 高于 headless 的 44px 拖拽条（6）与 CloseFab：顶部 5px 归"缩放"，
 * 往下仍是"拖动"，两个手势不打架。</p>
 */
.koi-dialog-resize {
  position: absolute;
  z-index: 20;
  touch-action: none;

  &--n {
    top: 0;
    right: 12px;
    left: 12px;
    height: 5px;
    cursor: ns-resize;
  }

  &--s {
    right: 12px;
    bottom: 0;
    left: 12px;
    height: 5px;
    cursor: ns-resize;
  }

  &--e {
    top: 12px;
    right: 0;
    bottom: 12px;
    width: 5px;
    cursor: ew-resize;
  }

  &--w {
    top: 12px;
    bottom: 12px;
    left: 0;
    width: 5px;
    cursor: ew-resize;
  }

  &--ne {
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
    cursor: nesw-resize;
  }

  &--nw {
    top: 0;
    left: 0;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
  }

  &--se {
    right: 0;
    bottom: 0;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
  }

  &--sw {
    bottom: 0;
    left: 0;
    width: 12px;
    height: 12px;
    cursor: nesw-resize;
  }
}

/* 缩放中：关掉弹窗自身的过渡，避免尺寸变化比指针慢半拍 */
.koi-dialog-shell.is-resizing {
  transition: none !important;
}
</style>
