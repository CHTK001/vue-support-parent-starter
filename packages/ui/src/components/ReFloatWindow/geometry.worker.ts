/**
 * ReFloatWindow 几何 Worker
 *
 * <p>职责：把拖拽 / 缩放的夹取、多窗口吸附对齐、边缘判定从主线程挪走。
 * 主线程每帧只做两件事：把最新指针位移 postMessage 进来、把结果写回 DOM 样式；
 * 候选点匹配、区间重叠这些纯计算都在这里跑，拖拽时主线程不被计算占住。</p>
 *
 * <p>设计要点：</p>
 * - 不按量级去重候选点（几十个窗口时候选点会撞车，去重反而把合法吸附丢掉）；
 * - 尺寸从“起点 + 位移”算起，而不是每帧吃主线程的 rect（主线程 rect 滞后一拍）；
 * - 对齐偏移在松手时由 Worker 回传，主线程据此落位，保证“看到的 = 落下的”。</p>
 */
import type {
  AlignLine,
  EdgeSide,
  GeometryEndPayload,
  GeometryMovePayload,
  GeometrySnapConfig,
  GeometryStartPayload,
  GeometryWorkerRequest,
  GeometryWorkerResponse,
  Rect,
} from "./geometry.types";

/** 吸附判定距离（px）：靠近就贴上去 */
const SNAP_GAP = 8;
/** 边缘自动收起的触发距离（px），由主线程 configure 时下发 */
let edgeThreshold = 16;

/** 把矩形夹在视口内，并保证不小于最小宽高 */
function clampRect(r: Rect, w: number, h: number, minW: number, minH: number): Rect {
  const width = Math.min(Math.max(r.w, minW), Math.max(minW, w));
  const height = Math.min(Math.max(r.h, minH), Math.max(minH, h));
  return {
    x: Math.min(Math.max(r.x, 0), Math.max(0, w - width)),
    y: Math.min(Math.max(r.y, 0), Math.max(0, h - height)),
    w: width,
    h: height,
  };
}

/** 单轴吸附：在候选值里找最近的、距离不超过 gap 的目标，返回需要的位移 */
function snapAxis(values: number[], targets: number[], gap: number): number | null {
  let best: number | null = null;
  for (const v of values) {
    for (const target of targets) {
      const d = target - v;
      if (Math.abs(d) <= gap && (best === null || Math.abs(d) < Math.abs(best))) best = d;
    }
  }
  return best;
}

/** 视口侧的候选值：中线 + （可选）栅格线 */
function viewportTargets(size: number, grid: number): number[] {
  const out = [Math.round(size / 2)];
  if (grid > 0) for (let v = grid; v < size; v += grid) out.push(v);
  return out;
}

/**
 * 吸附：x 方向看左边 / 中心 / 右边，y 方向看顶边 / 中心 / 底边。
 *
 * <p>grid = -1 时只和同类窗口对齐（多实例互相对齐）；grid >= 0 时对齐视口中线并按 grid 栅格对齐。
 * 返回吸附后的坐标与需要画的辅助线。</p>
 */
function applySnap(
  r: Rect,
  others: Rect[],
  grid: number,
  w: number,
  h: number,
): { x: number; y: number; lines: AlignLine[] } {
  const useOthers = grid === -1 && others.length > 0;
  const lines: AlignLine[] = [];

  const targetX = useOthers ? others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w]) : viewportTargets(w, grid);
  const targetY = useOthers ? others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h]) : viewportTargets(h, grid);

  const dx = snapAxis([r.x, r.x + r.w / 2, r.x + r.w], targetX, SNAP_GAP);
  const dy = snapAxis([r.y, r.y + r.h / 2, r.y + r.h], targetY, SNAP_GAP);
  const x = Math.round(r.x + (dx ?? 0));
  const y = Math.round(r.y + (dy ?? 0));

  // 用吸附后的位置反查是哪条候选线对上了（容差 1px，坐标一律取整到像素）
  const sx = [x, x + r.w / 2, x + r.w];
  const sy = [y, y + r.h / 2, y + r.h];

  const hitX = sx.find((v) => targetX.some((t) => Math.abs(t - v) <= 1));
  const hitY = sy.find((v) => targetY.some((t) => Math.abs(t - v) <= 1));

  if (hitX !== undefined) {
    const [a, b] = useOthers ? partnerSpan(others, "v", hitX, x, y, r.w, r.h) : [0, h];
    lines.push({ axis: "v", pos: hitX, start: Math.min(a, y), end: Math.max(b, y + r.h) });
  }
  if (hitY !== undefined) {
    const [a, b] = useOthers ? partnerSpan(others, "h", hitY, x, y, r.w, r.h) : [0, w];
    lines.push({ axis: "h", pos: hitY, start: Math.min(a, x), end: Math.max(b, x + r.w) });
  }

  return { x, y, lines };
}

/** 与被对上的那个窗口取重叠段，画一条“连在一起”的辅助线 */
function partnerSpan(
  others: Rect[],
  axis: "v" | "h",
  pos: number,
  x: number,
  y: number,
  w: number,
  h: number,
): [number, number] {
  const edgeOf = (o: Rect) => (axis === "v" ? [o.x, o.x + o.w / 2, o.x + o.w] : [o.y, o.y + o.h / 2, o.y + o.h]);
  const partner = others.find((o) => edgeOf(o).some((t) => Math.abs(t - pos) <= 1));
  // 找不到配对（例如吸附到的是视口中线）时，从自己的边画到视口边
  if (!partner) return axis === "v" ? [0, y + h] : [0, x + w];
  const a = axis === "v" ? partner.y : partner.x;
  const b = axis === "v" ? partner.y + partner.h : partner.x + partner.w;
  return [a, b];
}

let snap: GeometrySnapConfig = { enabled: false, others: [], grid: -1 };

/**
 * 拖拽中每帧的矩形：从起点 + 指针位移算起（不用主线程 rect，避免滞后一拍），
 * 缩放时把指针位移按手柄方向加到对应边上。
 */
function computeRect(p: GeometryMovePayload): Rect {
  if (p.kind === "move") {
    return { x: p.ox + p.dx, y: p.oy + p.dy, w: p.ow, h: p.oh };
  }
  let x = p.ox;
  let y = p.oy;
  let w = p.ow;
  let h = p.oh;
  const handle = p.handle;
  if (handle.includes("e")) w = p.ow + p.dx;
  if (handle.includes("s")) h = p.oh + p.dy;
  if (handle.includes("w")) {
    w = p.ow - p.dx;
    x = p.ox + p.dx;
  }
  if (handle.includes("n")) {
    h = p.oh - p.dy;
    y = p.oy + p.dy;
  }
  return { x, y, w, h };
}

function snapOf(r: Rect, viewport: { w: number; h: number }): { x: number; y: number; lines: AlignLine[] } {
  return snap.enabled ? applySnap(r, snap.others, snap.grid, viewport.w, viewport.h) : { x: r.x, y: r.y, lines: [] };
}

self.onmessage = (event: MessageEvent<GeometryWorkerRequest>) => {
  const msg = event.data;
  if (msg.type === "start") {
    const p: GeometryStartPayload = msg.payload;
    edgeThreshold = p.edgeThreshold ?? 16;
    snap = p.snap ?? { enabled: false, others: [], grid: -1 };
    const reply: GeometryWorkerResponse = { type: "started" };
    self.postMessage(reply);
    return;
  }

  if (msg.type === "configure") {
    const p: GeometryStartPayload = msg.payload;
    if (typeof p.edgeThreshold === "number") edgeThreshold = p.edgeThreshold;
    if (p.snap) snap = p.snap;
    return;
  }

  if (msg.type === "move") {
    const p = msg.payload;
    const clamped = clampRect(computeRect(p), p.viewport.w, p.viewport.h, p.minWidth, p.minHeight);
    const snapped = snapOf(clamped, p.viewport);
    const reply: GeometryWorkerResponse = {
      type: "rect",
      seq: p.seq,
      rect: { ...clamped, x: snapped.x, y: snapped.y },
      lines: snapped.lines,
    };
    self.postMessage(reply);
    return;
  }

  if (msg.type === "end") {
    const p: GeometryEndPayload = msg.payload;
    // 收尾时再吸附一次，保证落点就是看到的位置
    const clamped = clampRect(p.rect, p.viewport.w, p.viewport.h, p.minWidth, p.minHeight);
    const snapped = snapOf(clamped, p.viewport);
    const finalRect: Rect = { ...clamped, x: snapped.x, y: snapped.y };
    let edge: EdgeSide | null = null;
    if (p.edgeAutoHide) {
      const t = typeof p.edgeThreshold === "number" ? p.edgeThreshold : edgeThreshold;
      if (finalRect.x <= t) edge = "left";
      else if (finalRect.x + finalRect.w >= p.viewport.w - t) edge = "right";
      else if (finalRect.y <= t) edge = "top";
      else if (finalRect.y + finalRect.h >= p.viewport.h - t) edge = "bottom";
    }
    const reply: GeometryWorkerResponse = { type: "commit", seq: p.seq, rect: finalRect, edge };
    self.postMessage(reply);
  }
};
