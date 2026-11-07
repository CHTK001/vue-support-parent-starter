/**
 * ReFloatWindow 几何 Worker
 *
 * <p>职责：把拖拽 / 缩放的夹取、边缘判定从主线程挪走。
 * 主线程每帧只做两件事：把最新指针位移 postMessage 进来、把结果写回 DOM 样式；
 * 边界夹取这些纯计算都在这里跑，拖拽时主线程不被计算占住。</p>
 *
 * <p>设计要点：</p>
 * - 位置完全由指针位移决定，回包里的 rect 只用于缩放与边界夹取；
 * - 尺寸从“起点 + 位移”算起，而不是每帧吃主线程的 rect（主线程 rect 滞后一拍）。</p>
 */
import type {
  EdgeSide,
  GeometryEndPayload,
  GeometryMovePayload,
  GeometryStartPayload,
  GeometryWorkerRequest,
  GeometryWorkerResponse,
  Rect,
} from "./geometry.types";

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

self.onmessage = (event: MessageEvent<GeometryWorkerRequest>) => {
  const msg = event.data;
  if (msg.type === "start") {
    const p: GeometryStartPayload = msg.payload;
    edgeThreshold = p.edgeThreshold ?? 16;
    const reply: GeometryWorkerResponse = { type: "started" };
    self.postMessage(reply);
    return;
  }

  if (msg.type === "configure") {
    const p: GeometryStartPayload = msg.payload;
    if (typeof p.edgeThreshold === "number") edgeThreshold = p.edgeThreshold;
    return;
  }

  if (msg.type === "move") {
    const p = msg.payload;
    const clamped = clampRect(computeRect(p), p.viewport.w, p.viewport.h, p.minWidth, p.minHeight);
    const reply: GeometryWorkerResponse = { type: "rect", seq: p.seq, rect: clamped };
    self.postMessage(reply);
    return;
  }

  if (msg.type === "end") {
    const p: GeometryEndPayload = msg.payload;
    // 落点就是看到的位置：只做边界夹取
    const finalRect = clampRect(p.rect, p.viewport.w, p.viewport.h, p.minWidth, p.minHeight);
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
