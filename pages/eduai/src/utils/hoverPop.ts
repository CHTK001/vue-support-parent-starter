/**
 * 表格行悬停浮层的定位（fixed，跟随锚点单元格）。
 *
 * 优先显示在锚点正下方；下方空间不足且上方足够时翻转到上方，
 * 左右始终收进视口内侧。浮层本身渲染在 body（Teleport），
 * 不受表格 overflow 容器裁剪。
 */
export interface HoverPopStyle {
  top: string;
  left: string;
  width: string;
}

/** 浮层与锚点的间隙（px） */
const GAP = 8;
/** 视口四边最小留白（px） */
const MARGIN = 8;

export function computePopStyle(
  anchor: HTMLElement,
  width: number,
  approxHeight: number,
): HoverPopStyle {
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const actualWidth = Math.min(width, vw - MARGIN * 2);
  let top = rect.bottom + GAP;
  if (top + approxHeight > vh - MARGIN && rect.top - GAP - approxHeight > MARGIN) {
    top = rect.top - GAP - approxHeight;
  } else if (top + approxHeight > vh - MARGIN) {
    top = Math.max(MARGIN, vh - MARGIN - approxHeight);
  }
  const left = Math.min(
    Math.max(MARGIN, rect.left),
    Math.max(MARGIN, vw - actualWidth - MARGIN),
  );
  return { top: `${top}px`, left: `${left}px`, width: `${actualWidth}px` };
}