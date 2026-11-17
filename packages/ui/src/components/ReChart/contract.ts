/**
 * ReChart 视图数据契约 —— 形状校验、归一与几何布局的公共实现。
 *
 * 单独成模块的原因：`ReChart.vue` 与各内置面板（TopologyChart / ContextWindowChart）
 * 都要用同一套判定与配色，且 `<script setup>` 内不能 `export`，宿主若要复用这些
 * 校验函数也必须从独立模块导入。
 *
 * 契约口径（硬性）：
 *  - 视图数据形状必须符合 {@link isTopologyData} / {@link isContextWindowData}；
 *  - 不符时**只有** 显式 `transform` 一条路，渲染层绝不猜字段名、绝不隐式转换。
 */
import type {
  ContextSlice,
  ContextSliceKind,
  ReChartAtlasData,
  ReChartContextData,
  ReChartMatrixData,
  ReChartOrbitData,
  ReChartRaceData,
  ReChartTopologyData,
} from "./types";

/**
 * 链路拓扑形状判定。
 *
 * 只认 `nodes` + `edges` 两个数组：字段改名（如 `list` / `links` / `vertices`）
 * 一律视为形状不符，必须由调用方 `transform` 归一。
 */
export function isTopologyData(raw: unknown): raw is ReChartTopologyData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as ReChartTopologyData;
  return Array.isArray(d.nodes) && Array.isArray(d.edges);
}

/**
 * 上下文窗口形状判定。
 *
 * 要求 `used` / `total` 为有限数字且 `slices` 为数组；`total` 必须为正，
 * 否则百分比与格数无从计算。
 */
export function isContextWindowData(raw: unknown): raw is ReChartContextData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as ReChartContextData;
  return (
    Number.isFinite(d.used) &&
    Number.isFinite(d.total) &&
    d.total > 0 &&
    Array.isArray(d.slices)
  );
}

/* ==================== 星图 / 轨道 / 矩阵 ==================== */

/**
 * 关系星图形状判定。
 *
 * 只认 `nodes` 数组（`edges` / `groups` 可选）：字段改名一律视为形状不符。
 */
export function isAtlasData(raw: unknown): raw is ReChartAtlasData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as ReChartAtlasData;
  return Array.isArray(d.nodes);
}

/**
 * 权限轨道形状判定。
 *
 * 要求 `center` 为对象且 `rings` 为数组；`rings` 可以为空（渲染空态环），
 * 但整个字段缺失说明上游给的不是这个形状。
 */
export function isOrbitData(raw: unknown): raw is ReChartOrbitData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as ReChartOrbitData;
  return !!d.center && typeof d.center === "object" && Array.isArray(d.rings);
}

/**
 * 热力矩阵形状判定。
 *
 * 三个数组缺一不可；`values` 的行列数是否对齐由面板自行裁剪，
 * 这里只认「有这三个数组」这一层形状。
 */
export function isMatrixData(raw: unknown): raw is ReChartMatrixData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as ReChartMatrixData;
  return Array.isArray(d.rows) && Array.isArray(d.columns) && Array.isArray(d.values);
}

/**
 * 动态竞速条形形状判定。
 *
 * 要求 `items` 非空数组 + `frames` 为数组，且每帧都要有 `values` 对象；
 * 帧内数值是否覆盖全部条目由面板按 0 补齐，这里只认「有多帧快照」这一层形状。
 */
export function isRaceData(raw: unknown): raw is ReChartRaceData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as ReChartRaceData;
  return (
    Array.isArray(d.items) &&
    d.items.length > 0 &&
    Array.isArray(d.frames) &&
    d.frames.every((frame) => !!frame && typeof frame === "object" && !!frame.values && typeof frame.values === "object")
  );
}

/* ==================== 配色 ==================== */

/**
 * 切片类别色跟随主题（2026-11 需求）：不再写死 hex，而是以当前主色
 * （`--el-color-primary`）为锚点，按固定色相偏移旋转出各类别颜色，
 * 饱和度/明度沿用主色。主题换卡其，切片整体转暖棕大地色系；主题换蓝，
 * 回到冷色系。偏移量按原写死色板在默认蓝（#3986FF）下的相对色相标定，
 * 默认主题下观感与写死时基本一致。
 *
 * <p>`free` / `other` 是"空闲 / 未分类"的中性语义，保持灰调、不随主题转色相；
 * 浅色底、深色描边仍由面板自行处理。</p>
 */
const KIND_HUE_OFFSET: Record<ContextSliceKind, number | null> = {
  file: 0,
  image: -30,
  tool: 170,
  turn: -70,
  prompt: 55,
  free: null,
  other: null,
};

/** free / other 的中性色（不随主题色相旋转） */
const NEUTRAL_KIND_COLOR: Partial<Record<ContextSliceKind, string>> = {
  free: "#94a3b8",
  other: "#64748b",
};

/** 未识别 kind 时的兜底序列色相偏移（均匀布满色轮，任意主色下类别都可分） */
const FALLBACK_HUE_OFFSETS = [0, 60, 120, 180, 240, 300];

/** 主色读取失败时的锚点色（与 ThemeConfig 首选色一致）；jsdom / SSR 下走这里 */
const ANCHOR_PRIMARY = "#3986FF";

function hexToRgb6(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * 读当前主题主色：优先行内样式（applyPrimaryColorVars 写在 <html> 上），
 * 取不到再退计算样式；两者都没有（jsdom / SSR）时回锚点色。
 */
function currentPrimaryColor(): string {
  if (typeof document === "undefined") return ANCHOR_PRIMARY;
  const el = document.documentElement;
  let raw = el.style.getPropertyValue("--el-color-primary").trim();
  if (!raw && typeof getComputedStyle === "function") {
    raw = getComputedStyle(el).getPropertyValue("--el-color-primary").trim();
  }
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : ANCHOR_PRIMARY;
}

/** hex → hsl（h: 0-360，s/l: 0-1） */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return [h, s, l];
}

/** hsl → hex（h 越界自动回绕） */
function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round((v + m) * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** 主色按 offset 度旋转色相（s/l 不变）；非法输入原样返回 */
function rotateHue(hex: string, offset: number): string {
  const rgb = hexToRgb6(hex);
  if (!rgb) return hex;
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return hslToHex(h + offset, s, l);
}

/**
 * 取切片颜色：优先宿主显式 color，其次 kind 色表（由当前主色派生），
 * 最后按 key 稳定哈希兜底（同一次渲染内稳定，不随重排换色）。
 */
export function sliceColor(slice: ContextSlice): string {
  if (slice.color) return slice.color;
  const primary = currentPrimaryColor();
  if (slice.kind) {
    const neutral = NEUTRAL_KIND_COLOR[slice.kind];
    if (neutral) return neutral;
    const offset = KIND_HUE_OFFSET[slice.kind];
    if (offset != null) return rotateHue(primary, offset);
  }
  let hash = 0;
  for (const ch of slice.key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return rotateHue(primary, FALLBACK_HUE_OFFSETS[hash % FALLBACK_HUE_OFFSETS.length]);
}

/** 类别中文文案（图例用） */
export function sliceKindLabel(kind?: ContextSliceKind): string {
  if (!kind || kind === "other") return "其他";
  const map: Record<Exclude<ContextSliceKind, "other">, string> = {
    file: "文件",
    image: "图片",
    tool: "工具调用",
    turn: "历史轮次",
    prompt: "提示词",
    free: "剩余空间",
  };
  return map[kind];
}

/* ==================== 归一 ==================== */

/**
 * 补齐「剩余空间」切片：`total - used` 为正且明细里没有 `kind === "free"` 时自动追加，
 * 使面积图 / 点阵图的总和恒等于窗口总量（两种画法才能对得上）。
 */
export function normalizeContextWindow(data: ReChartContextData): ReChartContextData {
  const free = data.total - data.used;
  const hasFree = data.slices.some((s) => s.kind === "free");
  if (free <= 0 || hasFree) return data;
  return {
    ...data,
    slices: [
      ...data.slices,
      { key: "__free__", label: "剩余空间", tokens: free, kind: "free" },
    ],
  };
}

/** token 数可读化：12800 → 12.8K，1000000 → 1M */
export function formatTokens(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trimZero(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${trimZero(n / 1_000)}K`;
  return String(Math.round(n));
}

function trimZero(v: number): string {
  return v.toFixed(1).replace(/\.0$/, "");
}

/* ==================== 面积图（treemap）布局 ==================== */

/** treemap 单元格：坐标单位为 px */
export interface TreemapRect {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  slice: ContextSlice;
}

/**
 * 交替方向的 slice & dice treemap。
 *
 * 自实现而非引 d3-hierarchy：本图只有「一层平铺 + 按占比切矩形」一个需求，
 * 引依赖反而要为几十行布局买单。做法是每次把当前矩形按累计占比对半分，
 * 宽矩形竖切、高矩形横切，递归到只剩一个切片时落位。
 *
 * 调用前须先把 slices 按 tokens 降序排好，视觉上大块的才会在左上角。
 */
export function layoutTreemap(
  slices: ContextSlice[],
  width: number,
  height: number,
): TreemapRect[] {
  const out: TreemapRect[] = [];
  const usable = slices.filter((s) => s.tokens > 0);
  if (!usable.length || width <= 0 || height <= 0) return out;
  place(usable, 0, 0, width, height, width >= height, out);
  return out;
}

function place(
  items: ContextSlice[],
  x: number,
  y: number,
  w: number,
  h: number,
  splitVertical: boolean,
  out: TreemapRect[],
): void {
  if (!items.length) return;
  if (items.length === 1 || w <= 0 || h <= 0) {
    const it = items[0];
    if (it) out.push({ key: it.key, x, y, w, h, slice: it });
    return;
  }

  const total = items.reduce((acc, s) => acc + s.tokens, 0);
  if (total <= 0) return;

  // 取最小 k 使前 k 项累计占比 >= 1/2（至少 1 项，且给后半留至少 1 项）
  const half = total / 2;
  let acc = 0;
  let k = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].tokens;
    k = i + 1;
    if (acc >= half) break;
  }
  const firstShare = acc / total;
  const head = items.slice(0, k);
  const tail = items.slice(k);

  if (splitVertical) {
    const cut = w * firstShare;
    place(head, x, y, cut, h, !splitVertical, out);
    place(tail, x + cut, y, w - cut, h, !splitVertical, out);
  } else {
    const cut = h * firstShare;
    place(head, x, y, w, cut, !splitVertical, out);
    place(tail, x, y + cut, w, h - cut, !splitVertical, out);
  }
}

/* ==================== 点阵图分配 ==================== */

/**
 * 把 `count` 个格子按占比分给各切片（返回长度 count 的切片下标数组）。
 *
 * 用「格子中心落在哪个累计区间」判定，而不是逐个四舍五入，
 * 这样格子总数固定、且不会出现某切片被舍成 0 格。
 */
export function assignDots(slices: ContextSlice[], total: number, count: number): number[] {
  const cumulative: number[] = [];
  let acc = 0;
  slices.forEach((s) => {
    acc += Math.max(0, s.tokens);
    cumulative.push(acc);
  });
  const step = total / count;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const pos = (i + 0.5) * step;
    let idx = cumulative.findIndex((c) => pos <= c);
    if (idx === -1) idx = cumulative.length - 1;
    out.push(idx);
  }
  return out;
}
