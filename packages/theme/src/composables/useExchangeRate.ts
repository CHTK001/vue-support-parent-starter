/**
 * 顶栏汇率组件数据源（@repo/theme）
 *
 * 只做"契约结构 -> 组件展示字段"的映射，不关心数据来自后台还是三方：
 * 链路选择（HEAD 探测后台 -> 后台优先 -> 三方归一化）由 @repo/core 的
 * getExchangeRateOverview 收口，UI 消费的是同一套字段。
 *
 * 缓存策略：概览 1 小时，历史日会话级（切周期时不重复请求已拿到的交易日）。
 */
import { ref, computed } from "vue";
import {
  getAppStorage,
  getExchangeRateOverview,
  type ExchangeRateOverview,
  type ExchangeRatePeriod,
  type ExchangeRatePoint,
  type ExchangeRateQuery,
} from "@repo/core";

const CACHE_KEY = "exchange-rate-cache";
const CACHE_TTL = 60 * 60 * 1000;

/** 支持的查询周期（与面板周期按钮一一对应） */
export const EXCHANGE_RATE_PERIODS: readonly ExchangeRatePeriod[] = ["1m", "3m", "6m", "12m"];

/** 周期展示文案 */
const PERIOD_LABEL: Record<ExchangeRatePeriod, string> = {
  "1m": "1月",
  "3m": "3月",
  "6m": "6月",
  "12m": "1年",
};

/** 周期展示文案（供面板周期按钮一一对应） */
export function periodLabel(period: ExchangeRatePeriod): string {
  return PERIOD_LABEL[period] ?? period;
}

/** 各周期对应的查询天数（与 @repo/core 口径一致，core 未对外导出此常量，主题层不能省略） */
const PERIOD_DAYS: Record<ExchangeRatePeriod, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "12m": 365,
};

/**
 * 每日收盘价序列（frankfurter 日接口按 `?from=BASE&to=Q1,Q2` 返回的当日汇率）
 *
 * `rates` 的 key 是目标币种（USD / CNY ...），字段的 key 是展示用币种对。
 */
interface HistoryDay {
  date: string;
  rates: Record<string, number>;
}

/** 走势点：日期 + 展示币种对的收盘价 */
interface TrendPoint {
  date: string;
  rate: number;
}

/** 走势点（按币种对分组） */
interface TrendHistory {
  [symbol: string]: TrendPoint[];
}

/** 按 base 分组的币种对：`from=BASE` 一次查多 `to` */
interface SymbolGroup {
  base: string;
  quotes: string[];
  /** 展示用币种对的完整列表（base/quote） */
  symbols: string[];
}

const rates = ref<ExchangeRatePoint[]>([]);
const history = ref<TrendHistory>({});
const period = ref<ExchangeRatePeriod>("1m");
const symbols = ref<string[]>([]);
const selectedSymbol = ref<string | null>(null);
const loading = ref(false);
const error = ref("");
const source = ref("");
const updatedAt = ref("");

const hasRates = computed(() => rates.value.length > 0);

/** 涨跌方向（供颜色区分） */
export function changeTone(change: number | undefined): "up" | "down" | "flat" {
  if (change == null || Number.isNaN(change)) return "flat";
  return change > 0 ? "up" : change < 0 ? "down" : "flat";
}

/** 百分比格式化（两个小数位 + %） */
export function formatPercent(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/** 价格格式化（两位小数，带千分位） */
export function formatPrice(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return "--";
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 数值兜底：非有限数值取 fallback */
function num(value: unknown, fallback = Number.NaN): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 比准到 ISO 日期串 YYYY-MM-DD（本地时区，与 frankfurter 日接口对齐）。
 */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readCache(): { period: ExchangeRatePeriod; overview: ExchangeRateOverview } | null {
  try {
    const raw = getAppStorage().get(CACHE_KEY);
    if (!raw) return null;
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(payload: Record<string, unknown>): void {
  try {
    getAppStorage().set(CACHE_KEY, { ...payload, timestamp: Date.now() });
  } catch {
    /* ignore */
  }
}

/** frankfurter 展示用币种对 -> base/quote（支持 "EUR/USD" 与 "EURUSD" 两种写法） */
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
  if (!parsed) return String(symbol);
  return `${parsed.base}/${parsed.quote}`;
}

/**
 * 按 base 将币种对分组（frankfurter 的 `?from=` 只支持单 base，`to` 支持多目标）。
 */
function groupSymbols(symbols: string[]): SymbolGroup[] {
  const groups: Record<string, { quotes: string[]; symbols: string[] }> = {};
  for (const raw of symbols) {
    const parsed = parseSymbol(raw);
    if (!parsed) continue;
    const group = groups[parsed.base] ??= { quotes: [], symbols: [] };
    const display = `${parsed.base}/${parsed.quote}`;
    if (!group.quotes.includes(parsed.quote)) group.quotes.push(parsed.quote);
    if (!group.symbols.includes(display)) group.symbols.push(display);
  }
  return Object.keys(groups).map((base) => ({ base, ...groups[base] }));
}

/**
 * 会话内日缓存：同一天内不重复请求，切周期时公用已拿到的交易日。
 *
 * key = ISO 日期，value = date 该日所有目标币种的收盘汇率表。
 */
const historyDayCache = new Map<string, Record<string, number>>();

/** 连续查询的并发量（天不是本地的，并发太大会被网关打流） */
const HISTORY_CONCURRENCY = 8;

/** frankfurter 公网地址（代理前缀由核心层处理，这里只能兜底） */
const FRANKFURTER_CANDIDATE = "https://api.frankfurter.app";

/** 三方请求超时（ms） */
const THIRD_PARTY_TIMEOUT = 8000;

/**
 * 逐日请求历史日（frankfurter 的日期范围语法返回 404，只能逐日查）。
 *
 * 同一个 base 组一次拿回该日多目标汇率，所以单日最多一次请求。
 * 会话级日缓存只拦"同一天"：跨周期切回时，已拿到的交易日不用重跑。
 *
 * @param symbols 展示用币种对（base/quote）
 * @param start 窗口首日（含）
 * @param end 窗口末日（含）
 * @returns 按日期升序的今日历史日
 */
async function fetchHistoryDays(symbols: string[], start: Date, end: Date): Promise<HistoryDay[]> {
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(toIso(d));

  const groups = groupSymbols(symbols);
  // 算出需要补请求的 (date, base) 单元
  const units: Array<{ date: string; base: string; quotes: string[] }> = [];
  for (const date of dates) {
    for (const group of groups) {
      const cached = historyDayCache.get(date);
      const hasAllQuotes = group.quotes.every((quote) => cached?.[quote] != null);
      if (hasAllQuotes) continue;
      units.push({ date, base: group.base, quotes: group.quotes });
    }
  }

  const results: Array<Record<string, number> | null> = new Array(units.length);
  const cursor = { value: 0 };
  const work = async (): Promise<void> => {
    while (cursor.value < units.length) {
      const index = cursor.value++;
      const unit = units[index];
      try {
        const res = await fetch(`${FRANKFURTER_CANDIDATE}/${unit.date}?from=${unit.base}&to=${unit.quotes.join(",")}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(THIRD_PARTY_TIMEOUT),
        });
        if (!res.ok) continue;
        const obj = (await res.json()) as Record<string, any>;
        const rates = obj?.rates ?? obj;
        if (typeof rates !== "object" || rates === null) continue;
        const data: Record<string, number> = {};
        for (const [key, value] of Object.entries(rates)) {
          if (["date", "base", "from", "to", "amount", "success"].includes(key)) continue;
          const r = num(value);
          if (Number.isFinite(r)) data[key] = r;
        }
        if (Object.keys(data).length) results[index] = data;
      } catch {
        results[index] = null;
      }
    }
  };
  const runners = Array.from({ length: Math.min(HISTORY_CONCURRENCY, units.length) }, work);
  await Promise.all(runners);

  // 按日期合并（同一日的多次 base 请求取并集），更新会话缓存后返回
  const byDate = new Map<string, Record<string, number>>();
  const days: HistoryDay[] = [];
  for (const date of dates) byDate.set(date, {});
  for (let i = 0; i < units.length; i++) {
    const data = results[i];
    if (!data || !units[i]) continue;
    const date = units[i].date;
    const merged = { ...byDate.get(date), ...data };
    byDate.set(date, merged);
    historyDayCache.set(date, merged);
  }
  for (const date of dates) {
    const data = byDate.get(date);
    if (data && Object.keys(data).length) days.push({ date, rates: data });
  }
  return days;
}

/**
 * 每日历史 -> 按币种对分组的走势点（按日期升序）。
 *
 * 窗口中取不到的交易日用 NaN 占位，走势图连线时跳过 NaN 点即可。
 */
function buildTrendHistory(symbols: string[], days: HistoryDay[]): TrendHistory {
  const trend: TrendHistory = {};
  for (const symbol of symbols) {
    const parsed = parseSymbol(symbol);
    if (!parsed) continue;
    trend[symbol] = days.map((day) => ({
      date: day.date,
      rate: day.rates?.[parsed.quote] ?? Number.NaN,
    }));
  }
  return trend;
}

/**
 * 概览信号落地：缓存命中与实时拉取共用同一条赋值链路。
 */
function applyOverview(overview: ExchangeRateOverview): void {
  period.value = overview.period ?? ("1m" as ExchangeRatePeriod);
  symbols.value = overview.symbols ?? [];
  rates.value = overview.rates ?? [];
  source.value = overview.source ?? "";
  updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  // 历史日（仅三方 frankfurter 修复附带：.history 的 key 是展示用币种对，每个 day.rates
  // 按目标的 quote 币种 key 存放，取值必须用 parsed.quote）
  const historyBySymbol: TrendHistory = {};
  for (const [symbol, dayList] of Object.entries(overview.history ?? {})) {
    const parsed = parseSymbol(symbol);
    if (!parsed || !dayList?.length) continue;
    historyBySymbol[symbol] = dayList.map((day) => ({
      date: day.date,
      rate: day.rates?.[parsed.quote] ?? Number.NaN,
    }));
  }
  history.value = { ...historyBySymbol, ...history.value };
}

/**
 * 查询（period 来自面板，symbols 来自 app.yaml 默认或上一次查询）。
 */
async function fetchOverview(): Promise<void> {
  const cached = readCache();
  if (cached?.period === period.value) {
    if (cached.overview?.rates) applyOverview(cached.overview);
    return;
  }

  loading.value = true;
  try {
    const query: ExchangeRateQuery = {
      symbols: symbols.value.length ? symbols.value : undefined,
      period: period.value,
    };
    const overview = await getExchangeRateOverview(query);
    // 概览自带走势图（后台）时直接用，否则补逐日历史
    if (!overview.history || Object.keys(overview.history).length === 0) {
      const days = await fetchHistoryDays(overview.symbols, periodStartOf(period.value), new Date());
      history.value = buildTrendHistory(overview.symbols, days);
    }
    writeCache({ overview });
    applyOverview(overview);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

/** 周期窗口首日（按交易日算，frankfurter 会忽略周末与节假日） */
function periodStartOf(period: ExchangeRatePeriod): Date {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  return start;
}

/** 切换周期（重新查，不在面板保留选中状态） */
function setPeriod(newPeriod: ExchangeRatePeriod): void {
  if (newPeriod === period.value) return;
  period.value = newPeriod;
  selectedSymbol.value = null;
  void fetchOverview();
}

/** 刷新（忽略缓存，强制回源） */
async function refresh(): Promise<void> {
  try {
    getAppStorage().remove?.(CACHE_KEY);
  } catch {
    /* ignore */
  }
  void fetchOverview();
}

export function useExchangeRate() {
  return {
    rates,
    history,
    period,
    symbols,
    selectedSymbol,
    loading,
    error,
    source,
    updatedAt,
    hasRates,
    changeTone,
    formatPercent,
    formatPrice,
    periodLabel,
    fetchOverview,
    setPeriod,
    refresh,
    historyDayCache,
    groupSymbols,
    parseSymbol,
    displaySymbol,
  };
}
