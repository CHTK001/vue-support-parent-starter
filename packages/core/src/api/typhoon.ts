/**
 * 台风 API 封装（@repo/core）
 *
 * 与天气同构：本系统自有契约（TyphoonItem / TrackPoint / TyphoonDetail），
 * UI 只认这套字段，不再关心数据来源。
 *
 *   ① 后台接口：HEAD 探测 /v2/typhoon/active、/v2/typhoon/detail，命中则走后台
 *      —— 三方调用、缓存、字段口径由后台收口；
 *   ② 后台未实现时：浏览器直连浙江省水利厅台风网（typhoon.slt.zj.gov.cn/Api），
 *      在本文件里归一化成同一套契约，由 source 标明来源。
 *
 * 三方是外部政府接口，不走项目 http 拦截器（无需签名/加密），用原生 fetch + 超时。
 * dev 期若应用配了 /typhoon-api 代理前缀会优先走代理（免跨域），否则直连。
 */
import { log } from "@repo/utils";
import { http } from "./index";
import { probeBackend } from "./backendProbe";
import { TYPHOON_ACTIVE_PATH, TYPHOON_DETAIL_PATH } from "./capability";
import type { ApiResult } from "./index";

/** 台风列表项（本系统契约） */
export interface TyphoonItem {
  /** 台风编号 */
  id: string;
  name?: string;
  /** 英文名（如 SURIGAE） */
  enname?: string;
  /** 强度等级中文名（如"台风""强台风"） */
  strong?: string;
  lat?: number;
  lng?: number;
  /** 观测时间 */
  time?: string;
  /** 报文时间文本（如 "9月24日8时"） */
  timeformate?: string;
  /** 中心风速 */
  speed?: number;
  /** 中心气压（hPa） */
  pressure?: number;
  /** 中心风力等级（如 8） */
  power?: number;
  /** 预警级别（蓝色/黄色/橙色/红色；数据源未发布预警时缺省） */
  warnlevel?: string;
  /** 移动方向（如"西北偏西"） */
  movedirection?: string;
  /** 移动速度（km/h） */
  movespeed?: number;
  /** 预计影响时段（如"今明两天"；数据源未提供时 UI 回退展示移动信息） */
  impact?: string;
  /** 数据来源：backend / zhejiang-slt-direct */
  source?: string;
}

/** 台风路径单点（本系统契约） */
export interface TrackPoint {
  time: string;
  lng: number;
  lat: number;
  strong?: string;
  speed?: number;
  pressure?: number;
  /** 不对称风圈半径（公里），四方位：[东北, 东南, 西南, 西北] */
  r7?: [number, number, number, number];
  r10?: [number, number, number, number];
  /** 十二级风圈半径（公里），四方位；源未发布该级别时缺省 */
  r12?: [number, number, number, number];
}

/** 单条预报通道（本系统契约） */
export interface TyphoonForecastTrack {
  /** 预报机构名（如"中央气象台"） */
  name?: string;
  points: TrackPoint[];
}

/** 单个台风详情：历史路径 + 预报路径（本系统契约） */
export interface TyphoonDetail {
  id: string;
  name?: string;
  strong?: string;
  /** 预警级别（white/blue/yellow/orange/red 或中文；未发布预警时缺省） */
  warnlevel?: string;
  path: TrackPoint[];
  forecast: TyphoonForecastTrack[];
  source?: string;
}

/** 三方请求超时（ms） */
const TYPHOON_TIMEOUT = 10000;

/** 浙水利台风接口（代理前缀优先，其次直连） */
const TYPHOON_CANDIDATES = ["/typhoon-api", "https://typhoon.slt.zj.gov.cn/Api"];

/** 安全转数字，非有限值返回 undefined */
function numOr(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** 数组兜底：非数组返回空数组 */
function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * 依次尝试多个基地址，返回第一个成功响应的 JSON。
 * 先试 vite 代理前缀（配了就走，免跨域），失败再试直连域名。
 */
async function fetchJson(candidates: string[], path: string): Promise<unknown> {
  let lastError: unknown = null;
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(TYPHOON_TIMEOUT),
      });
      if (!res.ok) {
        lastError = new Error(`http ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("[typhoon] 三方数据源全部不可用");
}

/**
 * 从台风点数据中提取某级风圈的四方位半径数组 [NE, SE, SW, NW]。
 *
 * 兼容多种字段形态（后台若已归一化成数组也会走同一分支）：
 *  - `radius7: "250|150|250|150"`（管道分隔 4 段 = 东北|东南|西南|西北）
 *  - `radius7: [NE,SE,SW,NW]`（数组）
 *  - `radius7: 80`（单一数值，四方向同半径）
 *  - `r7NE / r7SE / r7SW / r7NW`（四方向分开字段）
 *
 * @param p     原始点对象
 * @param level 风圈等级："7" 或 "10"
 * @returns 四方位半径数组；全部缺失返回 undefined
 */
export function pickRadii(
  p: Record<string, unknown>,
  level: "7" | "10" | "12",
): [number, number, number, number] | undefined {
  const raw = p?.[`radius${level}`] ?? p?.[`r${level}`];

  if (Array.isArray(raw)) {
    if (!raw.length) return undefined;
    const nums = raw.map((v) => Number(v) || 0);
    const [ne = 0, se = 0, sw = 0, nw = 0] = nums;
    if (!(ne || se || sw || nw)) return undefined;
    return [ne, se, sw, nw];
  }
  if (typeof raw === "string" && raw.includes("|")) {
    const parts = raw.split("|").map((v) => Number(v.trim()));
    const ne = parts[0] ?? 0;
    const se = parts[1] ?? 0;
    const sw = parts[2] ?? 0;
    const nw = parts[3] ?? 0;
    if (!(ne || se || sw || nw)) return undefined;
    return [ne, se, sw, nw];
  }
  if (typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "")) {
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return undefined;
    return [v, v, v, v];
  }
  const ne = Number(p?.[`r${level}NE`] ?? p?.[`radius${level}NE`] ?? 0);
  const se = Number(p?.[`r${level}SE`] ?? p?.[`radius${level}SE`] ?? 0);
  const sw = Number(p?.[`r${level}SW`] ?? p?.[`radius${level}SW`] ?? 0);
  const nw = Number(p?.[`r${level}NW`] ?? p?.[`radius${level}NW`] ?? 0);
  if (!(ne || se || sw || nw)) return undefined;
  return [ne, se, sw, nw];
}

/** 三方时间报文（纯日期 / 空格或 T 分隔 / 可选秒 / 可选 Z 或 ±hh:mm 偏移） */
const RAW_TIME =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2})?)?(Z|[+-]\d{2}:?\d{2})?$/;

/** 偏移文本 → 分钟数（`+08:00` → 480，`Z` → 0） */
function offsetMinutes(offset: string): number {
  if (offset === "Z") return 0;
  const digits = offset.replace(/\D/g, "");
  const sign = offset.startsWith("-") ? -1 : 1;
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2, 4) || "0");
  return sign * (hours * 60 + minutes);
}

/**
 * 三方时间报文 → 本系统口径 `yyyy-MM-ddTHH:mm`（与后台 `/v2/typhoon/**` 一致）。
 *
 * 同一数据源内部并不统一：活跃列表回带偏移的 UTC 串
 * （`2026-09-21T00:00:00.000+00:00`），路径点回本地无偏移串
 * （`2026-09-21 08:00:00`）。带偏移的折算到本地时区，不带的视为本地时间；
 * 形态不认识时原样返回，不丢数据。
 */
export function canonTime(value: unknown): string {
  const text = String(value ?? "").trim();
  const matched = RAW_TIME.exec(text);
  if (!matched) return text;
  const [, y = "", mo = "", d = "", hh = "00", mm = "00", offset = ""] = matched;
  if (!offset) return `${y}-${mo}-${d}T${hh}:${mm}`;
  const local = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm) - offsetMinutes(offset) * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

/** 三方活跃台风原始项（字段命名各家不一，逐个兼容） */
type RawTyphoonItem = Record<string, unknown> & {
  tfid?: string;
  id?: string;
  name?: string;
  typhoonName?: string;
  enname?: string;
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
  timeformate?: string;
  speed?: number | string;
  pressure?: number | string;
  power?: number | string;
  warnlevel?: string | null;
  movedirection?: string;
  movespeed?: number | string;
  impact?: string;
};

/** 三方单台风详情原始结构 */
interface RawTyphoonDetail {
  tfid?: string;
  id?: string;
  name?: string;
  typhoonName?: string;
  /** 预警级别（浙水利详情顶层返回，如 white） */
  warnlevel?: string;
  points?: Record<string, unknown>[];
  [key: string]: unknown;
}

/** 三方预报通道 */
interface RawForecastSource {
  tm?: string;
  forecastpoints?: Record<string, unknown>[];
  [key: string]: unknown;
}

/** 原始路径点 → 契约 TrackPoint */
function toTrackPoint(p: Record<string, unknown>): TrackPoint {
  return {
    time: canonTime(p.time),
    lng: Number(p.lng ?? p.longitude ?? 0),
    lat: Number(p.lat ?? p.latitude ?? 0),
    strong: (p.strong as string) ?? "",
    speed: numOr(p.speed),
    pressure: numOr(p.pressure),
    r7: pickRadii(p, "7"),
    r10: pickRadii(p, "10"),
    r12: pickRadii(p, "12"),
  };
}

/**
 * 三方详情 → 契约 TyphoonDetail。
 *
 * 预报通道：历史路径末点的 forecast 数组里优先取机构名含"中国"的通道，否则取第一条。
 */
function toTyphoonDetail(raw: RawTyphoonDetail, fallbackId: string): TyphoonDetail {
  const points = arr(raw.points) as Record<string, unknown>[];
  const path = points.map(toTrackPoint);

  let forecast: TyphoonForecastTrack[] = [];
  const last = points[points.length - 1] as Record<string, unknown> | undefined;
  const sources = arr(last?.forecast) as RawForecastSource[];
  if (sources.length) {
    const src = sources.find((f) => String(f?.tm ?? "").includes("中国")) ?? sources[0];
    const pts = arr(src?.forecastpoints) as Record<string, unknown>[];
    if (pts.length) {
      forecast = [
        {
          name: String(src.tm ?? ""),
          points: pts.map((fp) => ({
            time: canonTime(fp.time),
            lng: Number(fp.lng ?? 0),
            lat: Number(fp.lat ?? 0),
            strong: (fp.strong as string) ?? "",
            speed: numOr(fp.speed),
            pressure: numOr(fp.pressure),
          })),
        },
      ];
    }
  }

  return {
    id: String(raw.tfid ?? raw.id ?? fallbackId),
    name: raw.name ?? raw.typhoonName ?? "",
    strong: (points[0]?.strong as string) ?? "",
    warnlevel: String(raw.warnlevel ?? "").trim() || undefined,
    path,
    forecast,
    source: "zhejiang-slt-direct",
  };
}

/**
 * 获取当前活跃台风列表。
 *
 * 后台已实现（HEAD 探测命中）→ GET /v2/typhoon/active；否则直连三方归一化。
 * 与历史行为一致：任何链路都失败时返回空数组，顶栏据此不显示台风入口。
 */
export async function getActiveTyphoonList(): Promise<TyphoonItem[]> {
  if (await probeBackend(TYPHOON_ACTIVE_PATH)) {
    try {
      const res = await http()
        .get(TYPHOON_ACTIVE_PATH)
        .then<ApiResult<TyphoonItem[]>>((r) => r.data);
      const data = res?.data;
      // 空数组是后端的权威结论（当前无活跃台风），不再回落三方
      if (Array.isArray(data)) {
        return data
          .filter((t) => Boolean(t?.id))
          .map((t) => ({ ...t, source: t.source || "backend" }));
      }
      log.warn("typhoon", "后台台风列表结构异常，回落三方");
    } catch (error) {
      log.warn("typhoon", "后台台风列表接口失败，回落三方", error);
    }
  }

  try {
    const data = (await fetchJson(TYPHOON_CANDIDATES, "/TyhoonActivity")) as RawTyphoonItem[];
    return arr(data)
      .map((item) => {
        const t = item as RawTyphoonItem;
        return {
          id: String(t.tfid ?? t.id ?? ""),
          name: t.name ?? t.typhoonName ?? "",
          enname: t.enname || undefined,
          strong: t.strong ?? t.level ?? "",
          lat: numOr(t.lat ?? t.latitude ?? t.latNorth),
          lng: numOr(t.lng ?? t.longitude ?? t.lon),
          time: canonTime(t.time ?? t.uptime ?? t.updateTime ?? t.datetime ?? ""),
          timeformate: t.timeformate || undefined,
          speed: numOr(t.speed),
          pressure: numOr(t.pressure),
          power: numOr(t.power),
          warnlevel: typeof t.warnlevel === "string" && t.warnlevel ? t.warnlevel : undefined,
          movedirection: t.movedirection || undefined,
          movespeed: numOr(t.movespeed),
          impact: t.impact || undefined,
          source: "zhejiang-slt-direct",
        };
      })
      .filter((t) => Boolean(t.id));
  } catch (error) {
    log.warn("typhoon", "三方台风列表不可用", error);
    return [];
  }
}

/**
 * 获取单个台风详情（历史路径 + 预报路径）。
 *
 * 后台能力以 /v2/typhoon/active 的探测结果为准（两者同属一个后台控制器；
 * 缺 id 的 HEAD 判定不稳定，不复用独立探测）；命中则 GET /v2/typhoon/detail?id=，
 * 否则直连三方归一化。两条链路都失败时抛错，由调用方决定空态展示。
 */
export async function getTyphoonDetail(id: string): Promise<TyphoonDetail> {
  if (!id) {
    throw new Error("[typhoon] 缺少台风编号");
  }

  if (await probeBackend(TYPHOON_ACTIVE_PATH)) {
    try {
      const res = await http()
        .get(TYPHOON_DETAIL_PATH)
        .query({ id })
        .then<ApiResult<TyphoonDetail>>((r) => r.data);
      const data = res?.data;
      if (data && (arr(data.path).length || arr(data.forecast).length)) {
        return {
          ...data,
          path: arr(data.path) as TrackPoint[],
          forecast: arr(data.forecast) as TyphoonForecastTrack[],
          source: data.source || "backend",
        };
      }
      log.warn("typhoon", `后台未返回台风 ${id} 的路径，回落三方`);
    } catch (error) {
      log.warn("typhoon", "后台台风详情接口失败，回落三方", error);
    }
  }

  const raw = (await fetchJson(TYPHOON_CANDIDATES, `/TyphoonInfo/${encodeURIComponent(id)}`)) as RawTyphoonDetail;
  return toTyphoonDetail(raw, id);
}
