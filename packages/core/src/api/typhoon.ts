/**
 * 台风 API 封装（@repo/core）
 *
 * 数据源：浙江省水利厅台风网开放接口 https://typhoon.slt.zj.gov.cn/Api
 * 该接口为外部政府 API，浏览器直连可能存在跨域；后端暂未代理，
 * 这里使用原生 fetch（不走项目 http 拦截器/签名/加密），超时 10s。
 *
 * 数据解析逻辑由 ReTyphoon.vue 抽取而来，保持与原实现完全一致。
 */

/** 台风列表项 */
export interface TyphoonItem {
  id: string;
  name?: string;
  strong?: string;
  lat?: number;
  lng?: number;
  time?: string;
  speed?: number | string;
  pressure?: number | string;
}

/** 台风路径单点 */
export interface TrackPoint {
  time: string;
  lng: number;
  lat: number;
  strong?: string;
  speed?: number;
  pressure?: number | string;
  /** 不对称风圈半径（公里），四方位：[东北, 东南, 西南, 西北] */
  r7?: [number, number, number, number];
  r10?: [number, number, number, number];
  [key: string]: unknown;
}

/** 单条预报通道 */
export interface TyphoonForecastTrack {
  points: TrackPoint[];
}

/** 单个台风详情（历史路径 + 预报路径） */
export interface TyphoonDetail {
  id: string;
  name?: string;
  strong?: string;
  path: TrackPoint[];
  forecast: TyphoonForecastTrack[];
}

/** 台风 API 基础地址 */
const API_BASE = "https://typhoon.slt.zj.gov.cn/Api";
/** 请求超时（ms） */
const TYPOON_TIMEOUT = 10000;

/**
 * 从浙水利台风点数据中提取某级风圈的四方位半径数组 [NE, SE, SW, NW]。
 *
 * 兼容多种字段形态：
 *  - `radius7: "250|150|250|150"`（管道分隔 4 段 = 东北|东南|西南|西北）
 *  - `radius7: [NE,SE,SW,NW]`（数组）
 *  - `radius7: 80`（单一数值，四方向同半径）
 *  - `r7NE / r7SE / r7SW / r7NW`（四方向分开字段）
 *
 * @param p      原始点对象
 * @param level  风圈等级："7" 或 "10"
 * @returns 四方位半径数组 [NE, SE, SW, NW]；全部缺失返回 undefined
 */
function pickRadii(
  p: Record<string, unknown>,
  level: "7" | "10",
): [number, number, number, number] | undefined {
  // 兼容 radius7 / r7 两种字段名（实测浙水利为 radius7/radius10）
  const raw = p?.[`radius${level}`] ?? p?.[`r${level}`];

  // 数组形态：[NE, SE, SW, NW]
  if (Array.isArray(raw)) {
    if (!raw.length) return undefined;
    const nums = raw.map((v) => Number(v) || 0);
    const [ne = 0, se = 0, sw = 0, nw = 0] = nums;
    if (!(ne || se || sw || nw)) return undefined;
    return [ne, se, sw, nw];
  }
  // 管道分隔字符串："NE|SE|SW|NW"
  if (typeof raw === "string" && raw.includes("|")) {
    const parts = raw.split("|").map((v) => Number(v.trim()));
    const ne = parts[0] ?? 0;
    const se = parts[1] ?? 0;
    const sw = parts[2] ?? 0;
    const nw = parts[3] ?? 0;
    if (!(ne || se || sw || nw)) return undefined;
    return [ne, se, sw, nw];
  }
  // 单一数值或数字字符串：四方向同半径
  if (typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "")) {
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return undefined;
    return [v, v, v, v];
  }
  // 四方向分开字段：r7NE/r7SE/r7SW/r7NW（部分 API 也叫 radius7NE 等）
  const ne = Number(p?.[`r${level}NE`] ?? p?.[`radius${level}NE`] ?? 0);
  const se = Number(p?.[`r${level}SE`] ?? p?.[`radius${level}SE`] ?? 0);
  const sw = Number(p?.[`r${level}SW`] ?? p?.[`radius${level}SW`] ?? 0);
  const nw = Number(p?.[`r${level}NW`] ?? p?.[`radius${level}NW`] ?? 0);
  if (!(ne || se || sw || nw)) return undefined;
  return [ne, se, sw, nw];
}

/** 浙水利活跃台风列表原始项 */
interface RawTyphoonItem {
  tfid?: string;
  id?: string;
  name?: string;
  typhoonName?: string;
  strong?: string;
  level?: string;
  lat?: number | string;
  latitude?: number | string;
  latNorth?: number | string;
  lng?: number | string;
  longitude?: number | string;
  lon?: number | string;
  time?: string;
  uptime?: string;
  updateTime?: string;
  datetime?: string;
  speed?: number | string;
  pressure?: number | string;
  [key: string]: unknown;
}

/** 安全转数字，非有限值返回 undefined */
function numOr(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 获取当前活跃台风列表。
 *
 * 失败（网络错误 / 非 2xx / 非数组）时返回空数组，与原组件行为一致。
 */
export async function getActiveTyphoonList(): Promise<TyphoonItem[]> {
  try {
    const res = await fetch(`${API_BASE}/TyhoonActivity`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TYPOON_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as RawTyphoonItem[];
    if (!Array.isArray(data)) return [];
    return data
      .map((t) => ({
        id: t.tfid ?? t.id ?? "",
        name: t.name ?? t.typhoonName ?? "",
        strong: t.strong ?? t.level ?? "",
        lat: numOr(t.lat ?? t.latitude ?? t.latNorth),
        lng: numOr(t.lng ?? t.longitude ?? t.lon),
        time: t.time ?? t.uptime ?? t.updateTime ?? t.datetime ?? "",
        speed: t.speed,
        pressure: t.pressure,
      }))
      .filter((t) => Boolean(t.id));
  } catch {
    return [];
  }
}

/** 浙水利单台风详情原始结构 */
interface RawForecastSource {
  tm?: string;
  forecastpoints?: RawTrackPoint[];
  [key: string]: unknown;
}

interface RawTrackPoint {
  time?: string;
  lng?: number | string;
  longitude?: number | string;
  lat?: number | string;
  latitude?: number | string;
  strong?: string;
  speed?: number | string;
  pressure?: number | string;
  forecast?: RawForecastSource[];
  [key: string]: unknown;
}

interface RawTyphoonDetail {
  tfid?: string;
  id?: string;
  name?: string;
  typhoonName?: string;
  points?: RawTrackPoint[];
  [key: string]: unknown;
}

/**
 * 获取单个台风详情（历史路径 + 预报路径）。
 *
 * 解析规则与原 ReTyphoon.vue 完全一致：
 *  - points → 历史路径，逐点提取 r7/r10 四方位风圈；
 *  - 末点 forecast 数组中优先取 tm 含"中国"的通道，否则取第一条；
 *  - forecastpoints → 预报点。
 *
 * 网络错误 / 非 2xx 时抛错，由调用方决定如何处理。
 */
export async function getTyphoonDetail(id: string): Promise<TyphoonDetail> {
  const res = await fetch(`${API_BASE}/TyphoonInfo/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TYPOON_TIMEOUT),
  });
  if (!res.ok) {
    throw new Error(`[typhoon] http ${res.status}`);
  }
  const data = (await res.json()) as RawTyphoonDetail;

  const points = Array.isArray(data.points) ? data.points : [];
  const path: TrackPoint[] = points.map((p) => ({
    time: p.time ?? "",
    lng: Number(p.lng ?? p.longitude ?? 0),
    lat: Number(p.lat ?? p.latitude ?? 0),
    strong: p.strong ?? "",
    speed: p.speed != null ? Number(p.speed) : undefined,
    pressure: p.pressure,
    r7: pickRadii(p as Record<string, unknown>, "7"),
    r10: pickRadii(p as Record<string, unknown>, "10"),
  }));

  // 预报路径：从末点的 forecast 通道里取
  let forecast: TyphoonForecastTrack[] = [];
  if (points.length > 0) {
    const last = points[points.length - 1];
    const sources = Array.isArray(last.forecast) ? last.forecast : [];
    const src =
      sources.find((f) => String(f?.tm ?? "").includes("中国")) ?? sources[0];
    if (src && Array.isArray(src.forecastpoints)) {
      forecast = [
        {
          points: src.forecastpoints.map((fp) => ({
            time: fp.time ?? "",
            lng: Number(fp.lng ?? 0),
            lat: Number(fp.lat ?? 0),
            strong: fp.strong ?? "",
            speed: fp.speed != null ? Number(fp.speed) : undefined,
            pressure: fp.pressure,
          })),
        },
      ];
    }
  }

  return {
    id: data.tfid ?? data.id ?? id,
    name: data.name ?? data.typhoonName ?? "",
    strong: points[0]?.strong ?? "",
    path,
    forecast,
  };
}
