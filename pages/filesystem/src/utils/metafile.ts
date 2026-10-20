/**
 * Windows 图元文件（{@code .wmf} / {@code .emf}）→ SVG 解析。
 *
 * <p>为什么自研：浏览器不解码 WMF/EMF（只有已淘汰的 IE 认），file-viewer 的
 * image/cad registry 也都不登记这两个扩展名；本机 pnpm 仓里的 {@code wmf} 包只有
 * 元数据没有代码，EMF 更是没有任何可用 JS 实现。而这两个格式在 Windows 办公文档、
 * 老图纸、Word/Excel 内嵌图里出现频率很高，回退成「不支持预览」体验太差。</p>
 *
 * <p><b>格式要点</b>：两者都是**记录流**（record stream），每条记录
 * {@code 大小 + 功能号 + 参数}，最终由 GDI 回放到设备上。WMF 记录头是
 * {@code DWORD 字数 + WORD 功能号}（16 位坐标），EMF 是 {@code DWORD 类型 +
 * DWORD 字节数}（32 位坐标、每类记录自带 bounds）。</p>
 *
 * <p><b>坐标系</b>：两者默认映射模式都是 MM_TEXT（原点左上、Y 轴向下、1 单位 1 像素），
 * 与 SVG 一致，所以**不做翻转**；viewBox 由实际图元包围盒给出。</p>
 *
 * <p><b>实现范围</b>：线条、折线、多边形、矩形、圆角矩形、椭圆、文本、画笔/画刷与
 * 颜色；世界变换（EMR_SETWORLDTRANSFORM）、裁剪区、位图记录（EMR_STRETCHDIBITS 等）
 * 不参与几何。未知记录按「有长度就跳过」处理，不抛错——图元文件里厂商私有记录很常见。</p>
 */

/** 解析结果 */
export interface MetafileResult {
  /** 识别出的容器类型 */
  kind: "wmf" | "emf";
  /** 可直接挂 DOM 的 SVG 源码 */
  svg: string;
  /** 记录条数（含不参与几何的） */
  recordCount: number;
  /** 实际画出的图元数 */
  shapeCount: number;
  /** 图元包围盒（源坐标） */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/** COLORREF（0x00BBGGRR）→ #rrggbb */
function colorrefToHex(v: number): string {
  const r = v & 0xff;
  const g = (v >> 8) & 0xff;
  const b = (v >> 16) & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

/** XML 文本转义 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 绘制状态（画笔/画刷/文字色 + 累计图元） */
interface PaintState {
  parts: string[];
  shapes: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
  textColor: string;
  curX: number;
  curY: number;
}

function newState(): PaintState {
  return {
    parts: [],
    shapes: 0,
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    stroke: "#000000",
    fill: "none",
    strokeWidth: 1,
    textColor: "#000000",
    curX: 0,
    curY: 0,
  };
}

function track(st: PaintState, x: number, y: number): void {
  if (x < st.minX) st.minX = x;
  if (y < st.minY) st.minY = y;
  if (x > st.maxX) st.maxX = x;
  if (y > st.maxY) st.maxY = y;
}

function trackPoints(st: PaintState, pts: Array<[number, number]>): void {
  for (const [x, y] of pts) track(st, x, y);
}

/** 折线/多边形 */
function addPoly(st: PaintState, pts: Array<[number, number]>, closed: boolean): void {
  if (pts.length < 2) return;
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ") + (closed ? " Z" : "");
  st.parts.push(
    `<path d="${d}" fill="${closed ? st.fill : "none"}" stroke="${st.stroke}"` +
      ` stroke-width="${st.strokeWidth}"/>`,
  );
  st.shapes++;
  trackPoints(st, pts);
}

/** 矩形 */
function addRect(st: PaintState, x: number, y: number, w: number, h: number): void {
  st.parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${st.fill}"` +
      ` stroke="${st.stroke}" stroke-width="${st.strokeWidth}"/>`,
  );
  st.shapes++;
  track(st, x, y);
  track(st, x + w, y + h);
}

/** 椭圆（用外接矩形） */
function addEllipse(st: PaintState, x: number, y: number, w: number, h: number): void {
  st.parts.push(
    `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${Math.abs(w) / 2}" ry="${Math.abs(h) / 2}"` +
      ` fill="${st.fill}" stroke="${st.stroke}" stroke-width="${st.strokeWidth}"/>`,
  );
  st.shapes++;
  track(st, x, y);
  track(st, x + w, y + h);
}

/** 文本（基线按字号下移，默认 16px） */
function addText(st: PaintState, x: number, y: number, text: string, size = 16): void {
  if (!text) return;
  st.parts.push(
    `<text x="${x}" y="${y + size * 0.82}" fill="${st.textColor}"` +
      ` font-size="${size}" font-family="Arial, Helvetica, sans-serif">${esc(text)}</text>`,
  );
  st.shapes++;
  track(st, x, y);
  track(st, x + text.length * size * 0.55, y + size);
}

/** 用 de Casteljau 的等价参数式把三次贝塞尔展平成折线（每段 12 步） */
function flattenBezier(pts: Array<[number, number]>, steps = 12): Array<[number, number]> {
  if (pts.length < 4) return pts;
  const out: Array<[number, number]> = [pts[0]];
  for (let i = 1; i + 2 < pts.length; i += 3) {
    const p0 = out[out.length - 1];
    const c1 = pts[i];
    const c2 = pts[i + 1];
    const p3 = pts[i + 2];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      out.push([
        mt * mt * mt * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * p3[0],
        mt * mt * mt * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * p3[1],
      ]);
    }
  }
  return out;
}

/** 由绘制状态生成 SVG */
function finish(st: PaintState, kind: "wmf" | "emf", recordCount: number): MetafileResult {
  const empty = st.shapeCount === 0;
  const bounds = empty
    ? { minX: 0, minY: 0, maxX: 100, maxY: 100 }
    : { minX: st.minX, minY: st.minY, maxX: st.maxX, maxY: st.maxY };
  const pad = Math.max(4, (bounds.maxX - bounds.minX) * 0.02);
  const vx = bounds.minX - pad;
  const vy = bounds.minY - pad;
  const vw = Math.max(1, bounds.maxX - bounds.minX + pad * 2);
  const vh = Math.max(1, bounds.maxY - bounds.minY + pad * 2);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}"` +
    ` preserveAspectRatio="xMidYMid meet" width="100%" height="100%">` +
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#ffffff"/>` +
    st.parts.join("") +
    `</svg>`;
  return { kind, svg, recordCount, shapeCount: st.shapes, bounds };
}

/* ==================== WMF ==================== */

/**
 * 解析 WMF。
 *
 * @param dv    数据视图
 * @param base  标准文件头起点（无 placeable 头时为 0，有时为 22）
 */
function parseWmf(dv: DataView, base: number): MetafileResult {
  const st = newState();
  const headerWords = dv.getUint16(base + 2, true);
  let off = base + headerWords * 2;
  let records = 0;
  const end = dv.byteLength;

  /** WMF 对象表：CREATEPENINDIRECT / CREATEBRUSHINDIRECT 建立的画笔与画刷 */
  const objects: Array<{ stroke?: string; width?: number; fill?: string }> = [];

  while (off + 6 <= end) {
    const sizeWords = dv.getUint32(off, true);
    if (!sizeWords) break;
    const recBytes = sizeWords * 2;
    if (recBytes < 6 || off + recBytes > end) break;
    const fn = dv.getUint16(off + 4, true);
    const p = off + 6;
    records++;

    switch (fn) {
      case 0x0000: // META_EOF
        off = end;
        break;
      case 0x0214: // META_MOVETO: y, x
        st.curY = dv.getInt16(p, true);
        st.curX = dv.getInt16(p + 2, true);
        break;
      case 0x0213: {
        // META_LINETO: y, x
        const y = dv.getInt16(p, true);
        const x = dv.getInt16(p + 2, true);
        addPoly(st, [
          [st.curX, st.curY],
          [x, y],
        ], false);
        st.curX = x;
        st.curY = y;
        break;
      }
      case 0x0325: // META_POLYLINE
      case 0x0324: {
        // META_POLYGON
        const n = dv.getUint16(p, true);
        const pts: Array<[number, number]> = [];
        for (let i = 0; i < n && p + 2 + i * 4 + 4 <= off + recBytes; i++) {
          const x = dv.getInt16(p + 2 + i * 4, true);
          const y = dv.getInt16(p + 2 + i * 4 + 2, true);
          pts.push([x, y]);
        }
        addPoly(st, pts, fn === 0x0324);
        break;
      }
      case 0x041b: {
        // META_RECTANGLE: bottom, right, top, left
        const bottom = dv.getInt16(p, true);
        const right = dv.getInt16(p + 2, true);
        const top = dv.getInt16(p + 4, true);
        const left = dv.getInt16(p + 6, true);
        addRect(st, left, top, right - left, bottom - top);
        break;
      }
      case 0x0418: {
        // META_ELLIPSE: bottom, right, top, left
        const bottom = dv.getInt16(p, true);
        const right = dv.getInt16(p + 2, true);
        const top = dv.getInt16(p + 4, true);
        const left = dv.getInt16(p + 6, true);
        addEllipse(st, left, top, right - left, bottom - top);
        break;
      }
      case 0x061c: {
        // META_ROUNDRECT: height, width, bottom, right, top, left
        const bottom = dv.getInt16(p + 4, true);
        const right = dv.getInt16(p + 6, true);
        const top = dv.getInt16(p + 8, true);
        const left = dv.getInt16(p + 10, true);
        addRect(st, left, top, right - left, bottom - top);
        break;
      }
      case 0x02fa: {
        // META_CREATEPENINDIRECT: style, width, color
        const width = dv.getUint16(p + 2, true);
        const color = dv.getUint32(p + 4, true);
        objects.push({ stroke: colorrefToHex(color), width: Math.max(1, width) });
        break;
      }
      case 0x02fc: {
        // META_CREATEBRUSHINDIRECT: style, color, hatch
        const color = dv.getUint32(p + 2, true);
        objects.push({ fill: colorrefToHex(color) });
        break;
      }
      case 0x012d: {
        // META_SELECTOBJECT
        const idx = dv.getUint16(p, true);
        const o = idx < objects.length ? objects[idx] : undefined;
        if (o?.stroke) st.stroke = o.stroke;
        if (o?.width) st.strokeWidth = o.width;
        if (o?.fill) st.fill = o.fill;
        break;
      }
      case 0x0209: // META_SETTEXTCOLOR
        st.textColor = colorrefToHex(dv.getUint32(p, true));
        break;
      case 0x0521: {
        // META_TEXTOUT: count, string(padded), y, x
        const count = dv.getUint16(p, true);
        let s = "";
        for (let i = 0; i < count && p + 2 + i < off + recBytes; i++) {
          s += String.fromCharCode(dv.getUint8(p + 2 + i));
        }
        const pad = count + (count & 1);
        const yOff = p + 2 + pad;
        if (yOff + 4 <= off + recBytes) {
          const y = dv.getInt16(yOff, true);
          const x = dv.getInt16(yOff + 2, true);
          addText(st, x, y, s);
        }
        break;
      }
      default:
        // 其余记录（映射模式、背景、窗口原点/范围等）不参与几何
        break;
    }

    if (off >= end) break;
    off += recBytes;
  }

  return finish(st, "wmf", records);
}

/* ==================== EMF ==================== */

/** 解析 EMF */
function parseEmf(dv: DataView): MetafileResult {
  const st = newState();
  let off = 0;
  let records = 0;
  const end = dv.byteLength;
  const objects: Array<{ stroke?: string; width?: number; fill?: string }> = [];

  while (off + 8 <= end) {
    const type = dv.getUint32(off, true);
    const size = dv.getUint32(off + 4, true);
    if (size < 8 || off + size > end) break;
    records++;

    switch (type) {
      case 14: // EMR_EOF
        off = end;
        break;
      case 27: {
        // EMR_MOVETOEX
        st.curX = dv.getInt32(off + 8, true);
        st.curY = dv.getInt32(off + 12, true);
        break;
      }
      case 54: {
        // EMR_LINETO
        const x = dv.getInt32(off + 8, true);
        const y = dv.getInt32(off + 12, true);
        addPoly(st, [
          [st.curX, st.curY],
          [x, y],
        ], false);
        st.curX = x;
        st.curY = y;
        break;
      }
      case 2: // EMR_POLYBEZIER
      case 3: // EMR_POLYGON
      case 4: // EMR_POLYLINE
      case 5: {
        // EMR_POLYLINETO
        const count = dv.getUint32(off + 24, true);
        let pts: Array<[number, number]> = [];
        for (let i = 0; i < count && off + 28 + i * 8 + 8 <= off + size; i++) {
          pts.push([dv.getInt32(off + 28 + i * 8, true), dv.getInt32(off + 32 + i * 8, true)]);
        }
        if (type === 2 || type === 5) pts = flattenBezier(pts);
        addPoly(st, pts, type === 3);
        break;
      }
      case 85: // EMR_POLYBEZIER16
      case 86: // EMR_POLYGON16
      case 87: // EMR_POLYLINE16
      case 88: // EMR_POLYBEZIERTO16
      case 89: {
        // EMR_POLYLINETO16
        const count = dv.getUint32(off + 24, true);
        let pts: Array<[number, number]> = [];
        for (let i = 0; i < count && off + 28 + i * 4 + 4 <= off + size; i++) {
          pts.push([dv.getInt16(off + 28 + i * 4, true), dv.getInt16(off + 30 + i * 4, true)]);
        }
        if (type === 85 || type === 88) pts = flattenBezier(pts);
        addPoly(st, pts, type === 86);
        break;
      }
      case 42: {
        // EMR_ELLIPSE
        const l = dv.getInt32(off + 8, true);
        const t = dv.getInt32(off + 12, true);
        const r = dv.getInt32(off + 16, true);
        const b = dv.getInt32(off + 20, true);
        addEllipse(st, l, t, r - l, b - t);
        break;
      }
      case 43: {
        // EMR_RECTANGLE
        const l = dv.getInt32(off + 8, true);
        const t = dv.getInt32(off + 12, true);
        const r = dv.getInt32(off + 16, true);
        const b = dv.getInt32(off + 20, true);
        addRect(st, l, t, r - l, b - t);
        break;
      }
      case 44: {
        // EMR_ROUNDRECT
        const l = dv.getInt32(off + 8, true);
        const t = dv.getInt32(off + 12, true);
        const r = dv.getInt32(off + 16, true);
        const b = dv.getInt32(off + 20, true);
        addRect(st, l, t, r - l, b - t);
        break;
      }
      case 38: {
        // EMR_CREATEPEN: ihPen, LOGPEN(style, width POINTL, color)
        const color = dv.getUint32(off + 24, true);
        const width = dv.getInt32(off + 16, true);
        objects.push({ stroke: colorrefToHex(color), width: Math.max(1, Math.abs(width)) });
        break;
      }
      case 39: {
        // EMR_CREATEBRUSHINDIRECT: ihBrush, style, color, hatch
        objects.push({ fill: colorrefToHex(dv.getUint32(off + 16, true)) });
        break;
      }
      case 95: {
        // EMR_EXTCREATEPEN: bounds(16) + ihPen/offBmi/cbBmi/offBits/cbBits(20) + EXTLOGPEN
        // EXTLOGPEN: elpPenStyle(+44) elpWidth(+48) elpBrushStyle(+52) elpColor(+56)
        const width = dv.getInt32(off + 48, true);
        const color = dv.getUint32(off + 56, true);
        objects.push({ stroke: colorrefToHex(color), width: Math.max(1, Math.abs(width)) });
        break;
      }
      case 37: {
        // EMR_SELECTOBJECT
        const idx = dv.getUint32(off + 8, true);
        const o = idx < objects.length ? objects[idx] : undefined;
        if (o?.stroke) st.stroke = o.stroke;
        if (o?.width) st.strokeWidth = o.width;
        if (o?.fill) st.fill = o.fill;
        break;
      }
      case 24: // EMR_SETTEXTCOLOR
        st.textColor = colorrefToHex(dv.getUint32(off + 8, true));
        break;
      case 84: {
        // EMR_EXTTEXTOUTW: EMRTEXT 在 off+36；nChars 在 off+44，offString 在 off+48
        const nChars = dv.getUint32(off + 44, true);
        const offString = dv.getUint32(off + 48, true);
        let str = "";
        for (let i = 0; i < nChars && off + offString + i * 2 + 2 <= off + size; i++) {
          str += String.fromCharCode(dv.getUint16(off + offString + i * 2, true));
        }
        const x = dv.getInt32(off + 36, true);
        const y = dv.getInt32(off + 40, true);
        addText(st, x, y, str);
        break;
      }
      default:
        break;
    }

    if (off >= end) break;
    off += size;
  }

  return finish(st, "emf", records);
}

/**
 * 解析 .wmf / .emf 字节。
 *
 * @param buf 文件字节
 * @returns 解析结果（含 SVG）
 * @throws 当既不是 WMF 也不是 EMF 时
 */
export function parseMetafile(buf: ArrayBuffer): MetafileResult {
  const dv = new DataView(buf);
  if (dv.byteLength < 18) throw new Error("文件过小，不是有效的图元文件");

  // Placeable WMF：magic 0x9AC6CDD7，随后是 22 字节头，标准头从 22 开始
  if (dv.getUint32(0, true) === 0x9ac6cdd7) {
    if (dv.byteLength < 40) throw new Error("Placeable WMF 头部不完整");
    return parseWmf(dv, 22);
  }

  // 标准 WMF：WORD 类型(1/2) + WORD 头长度(以字计，通常 9)
  if ((dv.getUint16(0, true) === 1 || dv.getUint16(0, true) === 2) && dv.getUint16(2, true) >= 9) {
    return parseWmf(dv, 0);
  }

  // EMF：DWORD 类型 == 1（EMR_HEADER）
  if (dv.getUint32(0, true) === 1) {
    return parseEmf(dv);
  }

  throw new Error("不是有效的 WMF/EMF（文件头不匹配）");
}
