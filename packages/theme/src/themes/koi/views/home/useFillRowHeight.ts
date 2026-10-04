/**
 * 让网格吃满可用高度
 *
 * <p><b>问题</b>：grid-layout-plus 会给容器写死内联高度
 * {@code mergedStyle.height = bottom(layout) * (rowHeight + margin) + margin}，
 * 而各 widget 又按 {@code rowHeight} 换算成像素后用 {@code transform} 绝对定位。
 * 于是浏览态下 {@code .home-grid__layout} 虽然被 {@code flex: 1} 拉满，
 * widget 却只占顶部固定的几百像素，<b>下方留一片空白</b> —— 这就是「home 页高度没吃满」。</p>
 *
 * <p><b>做法</b>：{@code rowHeight} 是被 watch 的响应式 prop，按容器可用高度反解它：</p>
 * <pre>{@code
 * bottom * (rowHeight + margin) + margin === available
 *   =>  rowHeight = (available - margin) / bottom - margin
 * }</pre>
 * <p>因此 widget 的像素高度与纵向位置同时被拉伸，正好铺满。</p>
 *
 * <p><b>为什么不改存档</b>：布局存的是 {@code x/y/w/h} 的<b>网格单位</b>，与 {@code rowHeight} 无关，
 * 换行高不会让任何已保存的位置失效。</p>
 *
 * <p><b>编辑态（{@code HomePreview}）也用</b>：此前预览写死 {@code :row-height="80"}，
 * 于是「浏览态吃满、点进自定义布局又没吃满」——同一个页面两种高度。
 * 当时不做的理由是「行高在拖拽中变化会让组件跳」，这个顾虑是对的，但不该用
 * 「整个编辑态都不做」来解决：改为通过 {@link FillRowHeightOptions.freeze} 在
 * 拖拽 / 缩放期间冻结行高、松手后补算，静止时依然吃满，交互时也不会跳。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, type ComputedRef, type Ref } from "vue";

/** 网格行间距（须与 GridLayout 的 :margin 第二项一致） */
export const GRID_MARGIN = 12;

/** 行高下限：低于此值 widget 内部什么都放不下，宁可溢出滚动也不能继续压 */
export const MIN_ROW_HEIGHT = 56;

/**
 * widget 总高度上限（px）。
 *
 * <p><b>为什么约束「总高」而不是「单行行高」</b>：单行行高上限与布局形状耦合 ——
 * 4 行的布局在 1000px 容器里只能取到 220 行高（否则单组件近 1000px 高），
 * 于是白白留 90px；改成约束总高后，同样的布局能算到 239 行高、总高 1016px，基本吃满。
 * 同时它天然兜住了「一行只放一个组件」时的极端拉伸。</p>
 */
export const MAX_TOTAL_HEIGHT = 1000;

/** 首帧与容器尚未测量时的兜底值（等于改造前写死的 80，避免首帧跳动） */
export const DEFAULT_ROW_HEIGHT = 80;

/** {@link useFillRowHeight} 的可选参数 */
export interface FillRowHeightOptions {
  /**
   * 为 true 时**暂停重算**，用于拖拽 / 缩放过程。
   *
   * <p>行高是 grid-layout-plus 做「像素↔网格」换算的基准，交互过程中改动会让
   * 正在拖的组件突然改变高度，表现为「跳」。所以交互期间冻结，结束后再补算一次。</p>
   */
  freeze?: Ref<boolean>;
}

/**
 * 按容器可用高度反解行高。
 *
 * @param bottom 布局占用的总行数（通常取 {@code max(y + h)}）
 * @param options 可选项，见 {@link FillRowHeightOptions}
 * @returns 需要绑到 ResizeObserver 宿主上的 ref，以及算出的 {@code rowHeight}
 */
export function useFillRowHeight(
  bottom: ComputedRef<number> | Ref<number>,
  options: FillRowHeightOptions = {},
) {
  /** 宿主元素：取「外层 flex 容器」而不是 GridLayout —— 后者高度由 rowHeight 决定，会自激 */
  const hostRef = ref<HTMLElement | null>(null);
  /** 宿主可用高度（px），0 表示尚未测量 */
  const available = ref(0);
  const rowHeight = ref(DEFAULT_ROW_HEIGHT);
  const freeze = options.freeze;

  /** 是否已成功测量过：未测量前保持 DEFAULT，避免首帧先矮后高地跳一下 */
  const measured = ref(false);

  function recompute(): void {
    if (!measured.value) return;
    // 拖拽/缩放中冻结：此时改行高会让组件跳
    if (freeze?.value) return;
    const rows = Math.max(1, Math.floor(bottom.value));
    const h = available.value;
    if (h <= 0) return;
    const raw = (h - GRID_MARGIN) / rows - GRID_MARGIN;
    /**
     * 总高上限换算成行高上限：{@code rows * (rh + margin) + margin <= MAX_TOTAL_HEIGHT}。
     * 两处都必须向下取整 —— 行高是整数，直接拿浮点 cap 去 {@code Math.min}
     * 会让 rowHeight 变成 185.6 这类小数，再被 grid-layout-plus 乘进像素位置。
     */
    const cap = Math.floor((MAX_TOTAL_HEIGHT - GRID_MARGIN) / rows - GRID_MARGIN);
    /**
     * 同样向下取整而不是四舍五入：round 会把误差放大 {@code rows} 倍
     * （rows=5 时 125.6 → 126，总高 702px，比可用高度多出 2px，
     * 于是容器被撑出滚动条 —— 恰恰与「吃满」相反）。
     * floor 只会偏小，缺口小于 rows 像素，肉眼不可见。
     */
    const next = Math.min(cap, Math.max(MIN_ROW_HEIGHT, Math.floor(raw)));
    if (next !== rowHeight.value) rowHeight.value = next;
  }

  let ro: ResizeObserver | undefined;
  const onResize = (): void => {
    const el = hostRef.value;
    if (!el) return;
    /**
     * {@code clientHeight} 含自身 padding，而网格实际可用的是内容盒。
     * 编辑态预览（{@code HomePreview}）的滚动容器带 12px padding，
     * 不扣掉就会算出比实际多 24px 的可用高度 → 网格被撑高 24px → 平白多一条滚动条。
     * 浏览态宿主无 padding，这里是 0，行为不变。
     */
    const cs = getComputedStyle(el);
    const padTop = parseFloat(cs.paddingTop);
    const padBottom = parseFloat(cs.paddingBottom);
    const inset = (Number.isFinite(padTop) ? padTop : 0) + (Number.isFinite(padBottom) ? padBottom : 0);
    const h = el.clientHeight - inset;
    if (h === available.value) return;
    available.value = h;
    measured.value = h > 0;
    recompute();
  };

  onMounted(() => {
    // 老浏览器 / SSR 下没有 ResizeObserver，退回一次性的 window.resize 监听
    if (typeof ResizeObserver === "undefined") {
      onResize();
      window.addEventListener("resize", onResize);
      return;
    }
    ro = new ResizeObserver(onResize);
    if (hostRef.value) ro.observe(hostRef.value);
    onResize();
  });

  onBeforeUnmount(() => {
    ro?.disconnect();
    window.removeEventListener("resize", onResize);
  });

  // 增删 widget 改了总行数，行高要跟着重算
  watch(bottom, recompute);

  // 冻结期间发生的 bottom 变化被 recompute 跳过了，解除冻结时必须补算一次
  if (freeze) watch(freeze, (frozen) => { if (!frozen) recompute(); });

  return { hostRef, rowHeight, measured };
}

/**
 * 由布局条目算出占用的总行数。
 *
 * @param items 布局条目
 * @returns {@code max(y + h)}；空布局返回 0
 */
export function bottomOf(items: ReadonlyArray<{ y: number; h: number }>): number {
  return items.reduce((max, it) => Math.max(max, it.y + it.h), 0);
}

/** 供组件里少写一层的便捷计算（内部再包一层 computed） */
export function useBottomRows(
  items: () => ReadonlyArray<{ y: number; h: number }>,
): ComputedRef<number> {
  return computed(() => bottomOf(items()));
}