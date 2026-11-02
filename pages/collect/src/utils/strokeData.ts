/**
 * 汉字笔画数据
 *
 * 本应用不给 @pages/collect 增加第三方依赖的包体积，所以在浏览器运行期从 jsdelivr 直接加载：
 *
 *   - 笔画几何（path）: hanzi-writer-data@2.0.1，每字一个 JSON（1024 x 1024 网格，含样条参数），
 *     URL 形如 `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/永.json`。
 *   - 笔顺标注（label）: cnchar 3.2.6（core） + cnchar-order 3.2.6（stroke name），
 *     调用 `CnChar.stroke(字, 'order', 'name')` 返回该字的笔画名。
 *
 * 坐标系：对话框 ViewBox 是 "0 0 100 100"，而 HanziWriter 的数据在 1024 x 1024 网格上、
 * y 值区间 0~900（在网格中向上为正），所以每一对坐标换算为：
 *
 *   svg_x = x / 1024 * 100
 *   svg_y = (900 - y) / 1024 * 100
 *
 * 返回值与 HanziStrokeDialog.vue 的 `loadStrokeData` 契约对齐：
 *   { char, strokes: [{ label, path }] }，path 为 100x100 坐标、仍可被 SVG `d` 直接使用的字符串。
 *   无法获得笔画数据时返回 null（由对话框显示占位/说明）。
 */

/** 2.0.1 的 JSON 里 `strokes` 的结构：`[ 'M 440 788 Q ...', ... ]` */
interface HanziWriterStrokeData {
  strokes?: string[];
}

/** 对话框需要的线段级数据 */
export interface HanziStrokeMeta {
  /** 笔画名称：“横”、“竖”、“横折钩”……（cnchar-order） */
  label: string;
  /** 100x100 ViewBox 内的 SVG path */
  path: string;
}

/** 单字笔画数据 */
export interface HanziStrokeData {
  char: string;
  strokes: HanziStrokeMeta[];
}

/** 笔画几何拿来即用的转换：1024 网格 → 100x100 viewBox */
const GRID_SIZE = 1024;
const GRID_Y_MAX = 900;
const VIEWBOX_SIZE = 100;

const CNCHAR_CORE_URL = 'https://cdn.jsdelivr.net/npm/cnchar@3.2.6/cnchar.min.js';
const CNCHAR_ORDER_URL = 'https://cdn.jsdelivr.net/npm/cnchar-order@3.2.6/cnchar.order.min.js';
const HANZI_WRITER_DATA_URL = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';

/** 每字一个 JSON 的加载结果（已解析），避免重复取数 */
const geometryCache = new Map<string, string[] | null>();
/** 笔画名，避免重复翻译 */
const nameCache = new Map<string, string[]>();

/** runtime 环境：cnchar 脚本只加载一次，core 先于 order（后者的 UMD 会直接调 window.CnChar.use） */
let cncharReady: Promise<void> | null = null;

function inBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function toViewBoxNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * 把 HanziWriter 坐标串每个数对转成 100x100 坐标。
 *
 * 路径参数序列一定是坐标对（M/L/Q/C 之后成对出现），所以奇偶位置
 * 偶数位是 x、奇数位是 y，y 要按 (900−y) 反方向再缩放。
 */
export function convertPath(path: string): string {
  const NUM = /-?\d+(?:\.\d+)?/g;
  const out: string[] = [];
  let last = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = NUM.exec(path)) !== null) {
    out.push(path.slice(last, match.index));
    const value = parseFloat(match[0]);
    const converted = index % 2 === 0
      ? value / GRID_SIZE * VIEWBOX_SIZE
      : (GRID_Y_MAX - value) / GRID_SIZE * VIEWBOX_SIZE;
    out.push(toViewBoxNumber(converted));
    last = match.index + match[0].length;
    index += 1;
  }
  out.push(path.slice(last));

  return out.join('');
}

/** 取数前等 cnchar（如果已经在别的脚本里加载好，本错误主要是脚本重复挂好的问题） */
async function ensureCnchar(): Promise<void> {
  if (!inBrowser()) {
    throw new Error('笔画标注数据只能在浏览器端运行');
  }
  const win = window as unknown as { CnChar?: unknown };
  if (win.CnChar) return;
  if (!cncharReady) {
    cncharReady = (async () => {
      await createScript(CNCHAR_CORE_URL);
      await createScript(CNCHAR_ORDER_URL);
      if (!win.CnChar) {
        throw new Error('cnchar 运行库未提供 CnChar');
      }
    })();
  }
  return cncharReady;
}

function createScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`笔画脚本加载失败: ${url}`));
    document.head.appendChild(script);
  });
}

/** 《笔画名 → 候选表》：`CnChar.stroke(字, 'order', 'name')` 返回 [[ '点','横折钩' ]] */
function normalizeNames(result: unknown): string[] | null {
  if (!Array.isArray(result) || result.length === 0) return null;
  const list = result[0];
  if (!Array.isArray(list)) return null;
  return list;
}

async function ensureStrokeData(char: string): Promise<HanziWriterStrokeData | null> {
  const strokes = (geometryCache.get(char) ?? (await fetchGeometry(char))) ?? null;
  let names = nameCache.get(char);
  if (!names) {
    try {
      const win = window as unknown as { CnChar: { stroke: (char: string, ...args: string[]) => unknown } };
      names = normalizeNames(win.CnChar.stroke(char, 'order', 'name'));
    } catch {
      names = null;
    }
    if (names) nameCache.set(char, names);
  }

  if (!strokes) return null;

  return { char, strokes: strokes.map((path, i) => ({ label: names?.[i] ?? `第${i + 1}笔`, path: convertPath(path) })) };
}

/** 取汉字的 hanzi-writer-data JSON；没有数据或取数失败时返回 null */
async function fetchGeometry(char: string): Promise<string[] | null> {
  try {
    const response = await fetch(`${HANZI_WRITER_DATA_URL}${char}.json`);
    if (!response.ok) return null;
    const data = (await response.json()) as HanziWriterStrokeData;
    const result = Array.isArray(data?.strokes) && data.strokes.length > 0 ? data.strokes : null;
    geometryCache.set(char, result);
    return result;
  } catch {
    return null;
  }
}

/** 给对话框的 loadStrokeData hook：入口 */
export async function loadStrokeData(char: string): Promise<HanziStrokeData | null> {
  const base = char.trim().charAt(0);
  if (!base) return null;
  return ensureStrokeData(base);
}
