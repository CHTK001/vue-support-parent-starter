/**
 * HP-GL / HP-GL(2) 绘图文件（.plt）解析器 —— 转成 SVG 供前端直接渲染。
 *
 * <p>为什么自己写：浏览器没有 PLT/HPGL 解码器，file-viewer 的 cad registry
 * 只登记 dwg/dxf/dwf/dwfx/xps，`@flyfish-dev/cad-viewer` 也只支持这几种。
 * PLT 是工程出图最常见的交换格式之一（AutoCAD「打印到文件」默认就是 HP-GL），
 * 与既有 {@link ./tga} 一样，用纯 TS 解出来画到 SVG 上，比回退成「不支持预览」诚实。</p>
 *
 * <p><b>实现范围</b>：覆盖工程图纸最常用的一组指令 ——
 * {@code IN SP PU PD PA PR CI AA AR EA ER RA RR LT PG}；
 * 未知/厂商扩展指令按「读到分号为止、忽略」处理，不抛错（绘图仪文件常带扩展）。</p>
 *
 * <p><b>坐标系</b>：HP-GL 原点在左下、Y 轴向上，单位是绘图仪单位（plotter unit，
 * 通常 1/40 mm 或 1/1016 in）。SVG 原点在左上、Y 轴向下，故整体做一次
 * {@code scale(1,-1)} 翻转，viewBox 由实际图元包围盒给出，避免图纸跑出画布。</p>
 *
 * <p><b>已知限制</b>：不做圆弧/文字的字体渲染（AA/AR 用折线逼近；LB 标签只推进坐标不描字），
 * 不解析 HP-GL/2 的填充多边形（FP/EP 按边线处理）。这些在工程看图上不影响判断。</p>
 */

/** 解析结果：可直接拼成 SVG 的图元集合（坐标为绘图仪单位，未翻转） */
export interface HpglGeometry {
  /** 折线路径的 `d` 片段（多段用 M 起始） */
  polylines: string[];
  /** 圆 */
  circles: Array<{ cx: number; cy: number; r: number }>;
  /** 矩形 */
  rects: Array<{ x: number; y: number; w: number; h: number }>;
  /** 包围盒（绘图仪单位） */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** 解析到的指令条数（供面板显示「已解析 N 条」） */
  commandCount: number;
}

/** 数值：HP-GL 整数可带前导 + / - */
function num(t: string): number {
  const n = Number(t.trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * 解析 HP-GL 字节流。
 *
 * @param bytes 文件原始字节（HP-GL 是 ASCII；按 latin1 逐字节解码，避免 UTF-8 误判）
 * @returns 图元集合
 */
export function parseHpgl(bytes: ArrayBuffer): HpglGeometry {
  const u8 = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);

  let x = 0;
  let y = 0;
  let absMode = true;
  let penDown = false;
  let cur = "";
  let commandCount = 0;

  const polylines: string[] = [];
  const circles: Array<{ cx: number; cy: number; r: number }> = [];
  const rects: Array<{ x: number; y: number; w: number; h: number }> = [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const track = (px: number, py: number): void => {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  };
  const flush = (): void => {
    if (cur) {
      polylines.push(cur);
      cur = "";
    }
  };

  /** 依据 PA/PR 模式落点，返回落点坐标并写包围盒 */
  const moveTo = (nx: number, ny: number): void => {
    if (absMode) {
      x = nx;
      y = ny;
    } else {
      x += nx;
      y += ny;
    }
    track(x, y);
  };
  /** 落笔到某点（先落点再写 L / 或先 M） */
  const drawTo = (nx: number, ny: number, move: boolean): void => {
    moveTo(nx, ny);
    cur += `${move ? "M" : "L"}${x} ${y} `;
  };

  const i = { p: 0 };
  while (i.p < s.length) {
    const ch = s[i.p];
    if (ch < "A" || (ch > "Z" && ch < "a") || ch > "z") {
      i.p++;
      continue;
    }
    const cmd = (ch + (s[i.p + 1] ?? "")).toUpperCase();
    i.p += 2;
    let raw = "";
    if (cmd === "LB") {
      // 标签：读到分号或 ETX(0x03)；不描字，仅按文本宽度粗略推进 X 以便后续图元不错位
      while (i.p < s.length && s[i.p] !== ";" && s.charCodeAt(i.p) !== 3) {
        raw += s[i.p];
        i.p++;
      }
      if (i.p < s.length) i.p++;
      commandCount++;
      x += raw.length * 40;
      track(x, y);
      continue;
    }
    while (i.p < s.length && s[i.p] !== ";") {
      raw += s[i.p];
      i.p++;
    }
    if (i.p < s.length) i.p++;
    commandCount++;

    const nums = raw.split(",").map(num);

    switch (cmd) {
      case "IN":
      case "DF":
        flush();
        x = 0;
        y = 0;
        absMode = true;
        penDown = false;
        break;
      case "SP":
      case "LT":
      case "VS":
      case "FS":
      case "TL":
      case "PM":
      case "PG":
        // 选笔 / 线型 / 速度 / 字高 / 多边形模式 / 换页：不影响几何
        break;
      case "PA":
        absMode = true;
        for (let k = 0; k + 1 < nums.length; k += 2) {
          if (penDown) drawTo(nums[k], nums[k + 1], false);
          else {
            moveTo(nums[k], nums[k + 1]);
            drawTo(nums[k], nums[k + 1], true);
          }
        }
        break;
      case "PR":
        absMode = false;
        for (let k = 0; k + 1 < nums.length; k += 2) {
          if (penDown) drawTo(nums[k], nums[k + 1], false);
          else {
            moveTo(nums[k], nums[k + 1]);
            drawTo(nums[k], nums[k + 1], true);
          }
        }
        break;
      case "PU":
        flush();
        penDown = false;
        for (let k = 0; k + 1 < nums.length; k += 2) moveTo(nums[k], nums[k + 1]);
        break;
      case "PD":
        penDown = true;
        for (let k = 0; k + 1 < nums.length; k += 2) drawTo(nums[k], nums[k + 1], false);
        break;
      case "CI": {
        const r = Math.abs(nums[0] ?? 0);
        circles.push({ cx: x, cy: y, r });
        track(x - r, y - r);
        track(x + r, y + r);
        break;
      }
      case "AA":
      case "AR": {
        // 以 (nums0,nums1) 为圆心、从当前点起扫 nums2 度；用 24 段折线逼近
        const relArc = cmd === "AR";
        const cx = relArc ? x + (nums[0] ?? 0) : nums[0] ?? 0;
        const cy = relArc ? y + (nums[1] ?? 0) : nums[1] ?? 0;
        const sweep = ((nums[2] ?? 0) * Math.PI) / 180;
        const r = Math.hypot(x - cx, y - cy) || 1;
        let a0 = Math.atan2(y - cy, x - cx);
        const steps = Math.max(4, Math.min(180, Math.ceil(Math.abs(sweep) / (Math.PI / 12))));
        flush();
        cur += `M${x} ${y} `;
        for (let k = 1; k <= steps; k++) {
          a0 += sweep / steps;
          const px = cx + r * Math.cos(a0);
          const py = cy + r * Math.sin(a0);
          cur += `L${px} ${py} `;
          track(px, py);
        }
        x = cx + r * Math.cos(a0);
        y = cy + r * Math.sin(a0);
        break;
      }
      case "EA":
      case "ER":
      case "RA":
      case "RR": {
        const rel = cmd === "ER" || cmd === "RR";
        const px = rel ? x + (nums[0] ?? 0) : nums[0] ?? 0;
        const py = rel ? y + (nums[1] ?? 0) : nums[1] ?? 0;
        const rx = Math.min(x, px);
        const ry = Math.min(y, py);
        const w = Math.abs(px - x);
        const h = Math.abs(py - y);
        rects.push({ x: rx, y: ry, w, h });
        track(rx, ry);
        track(rx + w, ry + h);
        x = px;
        y = py;
        break;
      }
      default:
        // 未知指令：参数已读到分号，直接忽略（厂商扩展不影响主图元）
        break;
    }
  }
  flush();

  const empty = polylines.length === 0 && circles.length === 0 && rects.length === 0;
  const bounds = empty
    ? { minX: 0, minY: 0, maxX: 100, maxY: 100 }
    : { minX, minY, maxX, maxY };
  return { polylines, circles, rects, bounds, commandCount };
}

/**
 * 生成可直接挂到 DOM 的 SVG 字符串。
 *
 * @param g {@link parseHpgl} 的结果
 * @param opts 可选的描边颜色/线宽
 * @returns SVG 源码
 */
export function hpglToSvg(
  g: HpglGeometry,
  opts: { stroke?: string; width?: number } = {},
): string {
  const stroke = opts.stroke ?? "#111827";
  const width = opts.width ?? Math.max(1, (g.bounds.maxX - g.bounds.minX) / 1200);
  const pad = Math.max(width * 4, (g.bounds.maxX - g.bounds.minX) * 0.02);
  const vx = g.bounds.minX - pad;
  const vy = g.bounds.minY - pad;
  const vw = g.bounds.maxX - g.bounds.minX + pad * 2;
  const vh = g.bounds.maxY - g.bounds.minY + pad * 2;

  const parts: string[] = [];
  for (const d of g.polylines) {
    parts.push(`<path d="${d}" fill="none"/>`);
  }
  for (const c of g.circles) {
    parts.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="none"/>`);
  }
  for (const r of g.rects) {
    parts.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none"/>`);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}"`,
    ` preserveAspectRatio="xMidYMid meet" width="100%" height="100%">`,
    // HP-GL 的 Y 轴向上：整体翻转，让图纸正立
    `<g transform="scale(1,-1)" stroke="${stroke}" stroke-width="${width}"`,
    ` stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">`,
    parts.join(""),
    `</g></svg>`,
  ].join("");
}
