/**
 * 汇率数据源（@repo/core）
 *
 * 数据来源两条链路，产出同一套结构（本系统的契约，UI 只认这套字段）：
 *   ① 后台接口：启动期 HEAD 探测 /v2/exchange-rate/overview，命中则走后台
 *      —— 三方调用、缓存、字段口径都由后台统一收口；
 *   ② 后台未实现时：浏览器直连 frankfurter.app（免费、无需 Key），
 *      在本文件里归一化成同一套 ExchangeRateOverview，由 source 标明来源。
 *
 * 数据口径：
 *   - 每条汇率点 = 最新价 + 较周期起点的涨跌（额/率） + 周期内的最高/最低；
 *   - frankfurter 的历史接口只支持 `/YYYY-MM-DD?from=BASE&to=Q1,Q2`，
 *     日期范围语法 `/YYYY-MM-DD&YYYY-MM-DD` 返回 404，所以必须逐日查询；
 *     且旧域名已 301 到 `api.frankfurter.dev/v1`（跨域 301 不携带 CORS 头），
 *     直连时统一用 `https://api.frankfurter.dev/v1`， fetch 会把 `from=`/`to=` 接在路径后。
 *   - `from` 不支持逗号分隔多个 base，`to` 支持多目标币种。先按 base 分组再请求；
 *   - 非交易日（周末 / 法定假日）不吐数据，按"无数据日"处理。
 *
 * 三方请求不走项目 http 拦截器（跨域公开接口，无需签名/加密），用原生 fetch + 超时。
 * dev 期若应用配了 /exchange-api、/fx-api 等代理前缀，会优先用代理（免跨域、可走内网），
 * 代理不存在时自动退回直连：直连时**必须**使用新域名 `https://api.frankfurter.dev/v1`，
 * 旧域名 301 到 `/v1/` 时不返回 CORS 头，浏览器直接卡死。
 */
import { getConfig, isCapabilityEnabled } from "@repo/config";
import { log } from "@repo/utils";
import { http } from "./index";
import { probeBackend } from "./backendProbe";
import { EXCHANGE_RATE_OVERVIEW_PATH } from "./capability";
import type { ApiResult } from "./index";

/** 支持的查询周期 */
export type ExchangeRatePeriod = "1m" | "3m" | "6m" | "12m";

/** 各周期对应的查询天数 */
const PERIOD_DAYS: Record<ExchangeRatePeriod, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "12m": 365,
};

/** 默认周期 */
const DEFAULT_PERIOD = "1m";

/**
 * frankfurter 已迁至 `https://api.frankfurter.dev/v1`（旧域名 `api.frankfurter.app` 现在 301
 * 到 `/v1/`，该跨域重定向**不携带 `Access-Control-Allow-Origin`**，浏览器端整条请求链被
 * 卡在"CORS 缺少响应头"上，所有历史日查询都会 403）
 */
const FRANKFURTER_CANDIDATES = ["/exchange-api", "https://api.frankfurter.dev/v1"];

/** 三方 HTTP 请求超时（ms） */
const THIRD_PARTY_TIMEOUT = 8000;

/** 历史日逐日查询的并发量（天不是本地的，并发太大会被网关打流） */
const HISTORY_CONCURRENCY = 10;

/**
 * 单条汇率点（本系统契约）
 *
 * change/changePercent 以周期起点（window 最早有效日）为基价比较，
 * high/low 为周期内的绝对极值。
 */
export interface ExchangeRatePoint {
  /** 币种对，如 EUR/USD、USD/CNY（统一成 base/quote 格式） */
  symbol: string;
  /** 最新价（1 unit base = rate quote） */
  rate: number;
  /** 较周期起点的涨跌额 */
  change: number;
  /** 较周期起点的涨跌幅（%） */
  changePercent: number;
  /** 周期内最高价 */
  high: number;
  /** 周期内最低价 */
  low: number;
}

/** 汇率概览：币种对列表 + 涨跌 + 周期极值（本系统契约，后台 data 即此结构） */
export interface ExchangeRateOverview {
  /** 数据来源：backend / frankfurter 等 */
  source: string;
  /** 查询周期（1m/3m/6m/12m） */
  period: ExchangeRatePeriod;
  /** 关注的币种对列表 */
  symbols: string[];
  /** 各币种对最新价 + 涨跌 + 周期极值 */
  rates: ExchangeRatePoint[];
  /**
   * 周期窗口内的历史日序列（仅三方 frankfurter 修复附带，后台返回时为空）：
   * 按日期升序，key 为展示用币种对（base/quote）→ 日收盘价。供 UI 绘制走势图。
   */
  history?: Record<string, HistoryDay[]>;
}

/** 汇率查询入参（未填写的取 app.yaml 默认） */
export interface ExchangeRateQuery {
  /** 关注的币种对列表（如 EUR/USD、USD/CNY），不传取其他.exchangeRate.symbols */
  symbols?: string[];
  /** 周期（1m/3m/6m/12m），决定涨跌基价与高/低点窗口 */
  period?: ExchangeRatePeriod;
}

/** 历史日查询结果：日期 + 各目标币种的收盘价 */
interface HistoryDay {
  date: string;
  rates: Record<string, number>;
}

/** 按 base 分组的币种对，一个 base 对应一次 /latest?from=BASE&to=Q1,Q2 */
interface SymbolGroup {
  base: string;
  quotes: string[];
  /** 展示用币种对，与 symbols 一致（base/quote） */
  symbols: string[];
}

/** 数值兜底：非有限数值取 fallback */
function num(value: unknown, fallback = Number.NaN): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** 数组兜底：非数组返回空数组 */
function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** URL 安全字符串 */
function safe(s: unknown): string {
  return String(s ?? "").replace(/[^A-Za-z0-9/+]/g, "");
}

/**
 * 解析币种对（支持 "EUR/USD" 与 "EURUSD" 两种写法）为 base/quote。
 */
function parseSymbol(symbol: string): { base: string; quote: string } | null {
  const s = String(symbol).trim().toUpperCase();
  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) {
    return { base: s.slice(0, 3), quote: s.slice(3, 6) };
  }
  const [base, quote] = s.split("/").map((seg) => seg.trim());
  if (!base || !quote || !/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) return null;
  return { base, quote };
}

/** 展示用币种对：normalize 成 A/BBB 格式 */
function displaySymbol(symbol: string): string {
  const parsed = parseSymbol(symbol);
  if (!parsed) return safe(symbol) ?? String(symbol);
  return `${parsed.base}/${parsed.quote}`;
}

/**
 * 按 base 将币种对分组（frankfurter 的 from 只支持单 base，to 支持多 base）。
 */
function groupSymbols(symbols: string[]): SymbolGroup[] {
  const groups: Record<string, { quotes: string[]; symbols: string[] }> = {};
  for (const raw of symbols) {
    const parsed = parseSymbol(raw);
    if (!parsed) {
      log.warn("exchangeRate", `无法解析币种对：${raw}`);
      continue;
    }
    const group = groups[parsed.base] ??= { quotes: [], symbols: [] };
    const display = `${parsed.base}/${parsed.quote}`;
    if (!group.quotes.includes(parsed.quote)) group.quotes.push(parsed.quote);
    if (!group.symbols.includes(display)) group.symbols.push(display);
  }
  return Object.keys(groups).map((base) => ({ base, ...groups[base] }));
}

/**
 * 从各支持的取值对象中取 rate。
 *
 * frankfurter 返回标准结构：
 *   {"date": "2019-05-01", "amount": 1, "base": "EUR", "rates": {"USD": 1.13}}
 * 部分代理/旧接口可能只返回 rates 的第一层。
 */
function parseRates(raw: unknown): Record<string, number> | null {
  const obj = (raw as Record<string, unknown> | null)?.rates ?? (raw as Record<string, unknown> | null);
  if (!obj || typeof obj !== "object") return null;
  const rates: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "date" || key === "base" || key === "from" || key === "to" || key === "amount" || key === "success") continue;
    const r = num(value);
    if (Number.isFinite(r)) rates[key] = r;
  }
  return Object.keys(rates).length > 0 ? rates : null;
}

/**
 * 依次尝试多个基地址，返回第一个成功响应的 JSON。
 *
 * 先试 vite 代理前缀（配了就走，免跨域），404/网络错误再试直连域名。
 */
async function fetchJson(candidates: string[], path: string): Promise<unknown> {
  let lastError: unknown = null;
  for (const base of candidates) {
    try {
      // 路径必须带前导 /：候选基址混用了相对前缀（/exchange-api）与绝对域名
      // （https://api.frankfurter.dev/v1），历史日如果不补 /，请求路径会粘到域名上
      // （api.frankfurter.dev/v1+2026-10-10 = api.frankfurter.dev/v12026-10-10），
      // 表现为 ERR_NAME_NOT_RESOLVED 类型的网络错误而非 404。
      const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(THIRD_PARTY_TIMEOUT),
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
  throw lastError ?? new Error("[exchangeRate] 三方数据源全部不可用");
}

/**
 * 有界并发的批量请求执行器（用于把逐日查询的 tens/hundreds 个请求放流）。
 *
 * 丢包/超时的项会留 null，调用方自行判断空值。
 */
async function fetchAll<F>(items: string[], fn: (item: string) => Promise<F>, limit = HISTORY_CONCURRENCY): Promise<(F | null)[]> {
  const results = new Array<F | null>(items.length);
  const urls = [...items];
  let cursor = 0;
  const work = async (): Promise<void> => {
    while (cursor < urls.length) {
      const index = cursor++;
      try {
        results[index] = await fn(urls[index]);
      } catch (error) {
        log.warn("exchangeRate", `历史日查询失败 ${urls[index]}`, error);
        results[index] = null;
      }
    }
  };
  const runners = Array.from({ length: Math.min(limit, urls.length) }, work);
  await Promise.all(runners);
  return results;
}

/** 比准到 ISO 日期串 YYYY-MM-DD */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * 当前价（每个 base 分组一次：/latest?from=BASE&to=Q1,Q2）。
 *
 * @returns symbol（展示用，base/quote） → rate，未拿到则那条汇率点后续报 NaN
 */
async function fetchLatestRates(groups: SymbolGroup[]): Promise<Record<string, number>> {
  const latest: Record<string, number> = {};
  for (const group of groups) {
    try {
      const raw = await fetchJson(FRANKFURTER_CANDIDATES, `/latest?from=${group.base}&to=${group.quotes.join(",")}`);
      const rates = parseRates(raw);
      for (const quote of group.quotes) {
        const rate = rates?.[quote] ?? Number.NaN;
        if (!Number.isFinite(rate)) continue;
        latest[`${group.base}/${quote}`] = rate;
      }
    } catch (error) {
      log.warn("exchangeRate", `三方取 ${group.base} 的当前价格失败`, error);
    }
  }
  return latest;
}

/**
 * 历史数据：从 start 到 end（含）逐日请求。
 *
 * frankfurter 的日期范围语法（`/YYYY-MM-DD&YYYY-MM-DD`）返回 404，只能逐日请求：
 * `https://api.frankfurter.dev/v1/2019-05-01?from=EUR&to=USD`。
 * 同一个 base 组在一次日查询里带过，所以单日最多一次请求（多 to 一次返回）。
 *
 * 给同一天内重复发生的请求（不同周期、不同 base）做了 session 级日缓存，
 * 避免切换周期时重复请求已拿到的交易日。
 */
const historyDayCache = new Map<string, Record<string, number>>();

async function fetchHistoryDays(groups: SymbolGroup[], start: Date, end: Date): Promise<HistoryDay[]> {
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(toIso(d));

  // 打平所有 "date × base" 请求：每个 base 组独立一次，to 合并
  const units: { date: string; url: string }[] = [];
  for (const date of dates) {
    for (const group of groups) {
      units.push({
        date,
        url: `/${date}?from=${group.base}&to=${group.quotes.join(",")}`,
      });
    }
  }
  const results = await fetchAll(units.map((u) => u.url), (url) =>
    fetchJson(FRANKFURTER_CANDIDATES, url).then(parseRates).catch(() => null),
  );
  const byDate = new Map<string, Record<string, number>>();
  for (const [i, rates] of results.entries()) {
    if (!rates || !units[i]) continue;
    const date = units[i].date;
    const existing = byDate.get(date) ?? {};
    const merged = { ...existing, ...rates };
    byDate.set(date, merged);
    historyDayCache.set(date, merged);
  }
  // 按日期排序后返回（历史日在排序窗口里使用时才是有序的）
  const days: HistoryDay[] = [];
  for (const date of dates) {
    const rates = byDate.get(date);
    if (rates) days.push({ date, rates });
  }
  return days;
}

/** 经 normalizeQuery 归一化后的查询：symbols 与 period 均有值 */
interface NormalizedQuery {
  /** 全部 normalize 成展示格式，零条时调用的 API 会抛错 */
  symbols: string[];
  /** 默认周期 */
  period: ExchangeRatePeriod;
}

/**
 * 把查询归一化：symbols 取 config 默认，period 取默认，并全部 normalize 成展示格式。
 */
function normalizeQuery(query: ExchangeRateQuery): NormalizedQuery {
  const symbols = (query.symbols ?? getConfig().other?.exchangeRate?.symbols ?? []).map(displaySymbol);
  const period = query.period ?? DEFAULT_PERIOD;
  return { symbols, period };
}

/**
 * 以拿到的 rate 列表为基准，通过数组下标把每个 symbol 的涨跌/极值算出来。
 *
 * 窗口 = 排序后的历史日列表 ÷ 周期，window 里该币种对的价格纵向取极值，
 * 起点的价格（window 第一条日期的价格）作为涨跌基价。
 */
function buildOverview(symbols: string[], latest: Record<string, number>, history: HistoryDay[], period: ExchangeRatePeriod): ExchangeRatePoint[] {
  const points: ExchangeRatePoint[] = [];
  // 用日期排序后的历史数据求极值
  const sortedDays = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const startIdx = Math.max(0, sortedDays.length - PERIOD_DAYS[period]);
  const windowDays = sortedDays.slice(startIdx);
  for (const symbol of symbols) {
    const parsed = parseSymbol(symbol);
    if (!parsed) continue;
    const { base, quote } = parsed;
    const rate = latest[symbol] ?? Number.NaN;
    if (!Number.isFinite(rate)) continue;
    const pointsInWindow = windowDays
      .map((day) => day.rates?.[quote] ?? Number.NaN)
      .filter((r) => Number.isFinite(r));
    const highest = Math.max(...pointsInWindow, rate);
    const lowest = Math.min(...pointsInWindow, rate);
    // 基价：窗口第一天的价格；取不到则用 window 最老价格
    const baseRate = pointsInWindow.length > 0 ? pointsInWindow[0] : rate;
    const change = rate - baseRate;
    const changePercent = baseRate !== 0 ? change / baseRate * 100 : 0;
    points.push({
      symbol,
      rate,
      change,
      changePercent,
      high: highest,
      low: lowest,
    });
  }
  return points;
}

/**
 * 把 frankfurter 的逐日汇率（每份 `rates` 按目标币种 key）转成展示币种对维度的历史日。
 *
 * `history` 的 key 为展示用币种对（base/quote），value 为按日期升序的历史日，
 * 非交易日（周末/节假日）不吐数据，走不到的交易日用 NaN 占位，省着后面的走势图画线。
 */
function toHistoryBySymbol(symbols: string[], days: HistoryDay[]): Record<string, HistoryDay[]> {
  const bySymbol: Record<string, HistoryDay[]> = {};
  for (const symbol of symbols) {
    const parsed = parseSymbol(symbol);
    if (!parsed) continue;
    bySymbol[symbol] = days.map((day) => ({
      date: day.date,
      rates: { [parsed.quote]: day.rates[parsed.quote] ?? Number.NaN },
    }));
  }
  return bySymbol;
}

/** 后台返回的结构补齐缺省字段（数值/数组），保证 UI 消费端无需逐字段判空 */
function normalizeBackendOverview(data: ExchangeRateOverview | any): ExchangeRateOverview {
  const symbols = arr(data?.symbols ?? data?.rates)?.map((item) => (item as any)?.symbol ?? "").filter((s) => !!s);
  const rates = (data?.rates ?? [])
    .filter((item: unknown) => !!item)
    .map((item: any) => ({
      symbol: displaySymbol(item?.symbol ?? ""),
      rate: num(item?.rate ?? item?.value ?? item?.last ?? Number.NaN),
      change: num(item?.change ?? item?.changeAbsolute ?? Number.NaN),
      changePercent: num(item?.changePercent ?? item?.changePct ?? item?.changePercentage ?? Number.NaN),
      high: num(item?.high ?? item?.highRate ?? Number.NaN),
      low: num(item?.low ?? item?.lowRate ?? Number.NaN),
    }))
    .filter((p: Record<string, unknown>) => Number.isFinite(p.rate));
  // 未带 symbols 时从 rates 取
  return {
    source: data?.source || "backend",
    period: data?.period ?? DEFAULT_PERIOD,
    symbols: symbols.length > 0 ? symbols : rates.map((p: Record<string, unknown>) => p.symbol),
    rates,
  };
}

/**
 * 从 frankfurter 取最新价 + 历史日，合成概览。
 */
async function fetchRatesFromFrankfurter(query: ExchangeRateQuery): Promise<ExchangeRateOverview> {
  const { symbols, period } = normalizeQuery(query);
  const groups = groupSymbols(symbols);
  if (!groups.length) throw new Error("[exchangeRate] 未配置需要获取的币种对 (symbols)");
  const latestRates = await fetchLatestRates(groups);
  // 周期窗口：从今天起倒推 PERIOD_DAYS[period] 天（frankfurter 的日接口
  // 对周末/节假日做归一化，直接取到的日期未必连续，窗口按 "可用日" 算）
  const latestDate = new Date();
  const start = new Date(latestDate);
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  const history = await fetchHistoryDays(groups, start, latestDate);
  const points = buildOverview(symbols, latestRates, history, period);
  return {
    source: "frankfurter",
    period,
    symbols,
    rates: points,
    // 走势图数据（仅在三方链路附带，后台按自身契约返回）：每行 key 为展示币种对
    history: toHistoryBySymbol(symbols, history),
  };
}

/**
 * 获取汇率概览。
 *
 * 后台已实现（HEAD 探测命中）→ GET /v2/exchange-rate/overview；
 * 否则直连 frankfurter（三路网关）并归一化。两条链路都失败时抛出最后一个错误，由调用方决定空态展示。
 * 除非被显式要求，否则 symbols/period 均取 app.yaml 默认。
 */
export async function getExchangeRateOverview(query: ExchangeRateQuery = {}): Promise<ExchangeRateOverview> {
  // 能力位显式关闭：不回落 frankfurter。只挡后台探测等于没关。
  if (!isCapabilityEnabled("exchangeRate")) {
    throw new Error("[exchangeRate] 能力位已关闭（other.capabilities.exchangeRate=false），不发起任何请求");
  }
  const effective = normalizeQuery(query);
  if (await probeBackend(EXCHANGE_RATE_OVERVIEW_PATH)) {
    try {
      const res = await http()
        .get(EXCHANGE_RATE_OVERVIEW_PATH)
        .query(effective as unknown as Record<string, unknown>)
        // 汇率是"后台可选增强"能力，失败要在本函数内部静默回落三方，
        // 不能让拦截器把抛出的错误弹成全局 toast。
        .noToast(true)
        .then<ApiResult<ExchangeRateOverview>>((r) => r.data);
      if (res?.data) {
        return normalizeBackendOverview(res.data);
      }
      log.warn("exchangeRate", "后台返回空数据，回落三方");
    } catch (error) {
      log.warn("exchangeRate", "后台汇率接口失败，回落三方", error);
    }
  }
  return fetchRatesFromFrankfurter(effective);
}
