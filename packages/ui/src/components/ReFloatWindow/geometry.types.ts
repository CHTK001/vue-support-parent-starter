/**
 * ReFloatWindow 几何 Worker 的消息类型
 *
 * <p>主线程与 `geometry.worker.ts` 共用；只放类型，编译后是空模块，不会被运行时引入。</p>
 */

/** 矩形：左上角坐标 + 宽高（px，相对视口） */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 可收起的四条边 */
export type EdgeSide = "left" | "right" | "top" | "bottom";

/** 一条对齐辅助线：垂直（v，pos 是 x）或水平（h，pos 是 y） */
export interface AlignLine {
  axis: "v" | "h";
  pos: number;
  /** 线段的起止（另一个轴上的像素） */
  start: number;
  end: number;
}

/** 吸附配置：-1 = 对齐同类窗口，>0 = 视口栅格，0 = 只对齐视口中线 */
export interface GeometrySnapConfig {
  enabled: boolean;
  /** 其他窗口的矩形（多实例对齐用） */
  others: Rect[];
  grid: number;
}

export interface GeometryStartPayload {
  edgeThreshold?: number;
  snap?: GeometrySnapConfig;
}

export interface GeometryMovePayload {
  /** 递增序号，主线程用它丢弃过期的回包 */
  seq: number;
  kind: "move" | "resize";
  handle: string;
  ox: number;
  oy: number;
  ow: number;
  oh: number;
  dx: number;
  dy: number;
  viewport: { w: number; h: number };
  minWidth: number;
  minHeight: number;
}

export interface GeometryEndPayload {
  seq: number;
  rect: Rect;
  viewport: { w: number; h: number };
  minWidth: number;
  minHeight: number;
  edgeAutoHide: boolean;
  edgeThreshold?: number;
}

export type GeometryWorkerRequest =
  | { type: "start"; payload: GeometryStartPayload }
  | { type: "configure"; payload: GeometryStartPayload }
  | { type: "move"; payload: GeometryMovePayload }
  | { type: "end"; payload: GeometryEndPayload };

export type GeometryWorkerResponse =
  | { type: "started" }
  | { type: "rect"; seq: number; rect: Rect; lines: AlignLine[] }
  | { type: "commit"; seq: number; rect: Rect; edge: EdgeSide | null };
