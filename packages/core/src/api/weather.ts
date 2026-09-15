/**
 * 天气 API 封装（@repo/core）
 *
 * 优先调用项目后端接口（/v2/weather/*），后端不可用或返回空数据时
 * 自动降级到开源接口 wttr.in（j1 JSON），对调用方暴露统一的 WeatherInfo /
 * WeatherForecast 结构，由 source 字段标识数据来源。
 *
 * 降级链路使用原生 fetch（外部跨域接口，不走项目 http 拦截器/签名/加密），
 * 超时 8s；浏览器环境无法设置 User-Agent，直接请求即可。
 */
import { http, type ApiResult } from "./index";

/** 当前天气 */
export interface WeatherInfo {
  city: string;
  temperatureC: number | null;
  humidity: string | number | null;
  windKmph: string | number | null;
  windDirection?: string;
  description: string;
  icon?: string;
  /** 观测时间戳（ms） */
  observedAt: number;
  /** 是否命中缓存（后端侧缓存） */
  cached: boolean;
  /** 数据来源：backend / wttr.in-direct 等 */
  source: string;
}

/** 单日预报 */
export interface ForecastDay {
  /** yyyy-MM-dd */
  date: string;
  maxTempC: number | null;
  minTempC: number | null;
  description: string;
  icon?: string;
}

/** 多日预报 */
export interface WeatherForecast {
  city: string;
  days: ForecastDay[];
  source: string;
}

/** wttr.in j1 格式 current_condition[0] 原始字段（仅声明用到的部分） */
interface WttrCurrentCondition {
  temp_C?: string | number;
  humidity?: string | number;
  windspeedKmph?: string | number;
  winddir16Point?: string;
  weatherCode?: string | number;
  weatherDesc?: { value?: string }[];
  observation_time?: string;
  localObsDateTime?: string;
  [key: string]: unknown;
}

/** wttr.in j1 格式 weather[i] 原始字段 */
interface WttrDay {
  date?: string;
  maxtempC?: string | number;
  mintempC?: string | number;
  hourly?: {
    time?: string;
    weatherCode?: string | number;
    weatherDesc?: { value?: string }[];
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

/** wttr.in j1 顶层结构 */
interface WttrJ1 {
  current_condition?: WttrCurrentCondition[];
  weather?: WttrDay[];
  nearest_area?: unknown[];
  [key: string]: unknown;
}

/** 降级请求超时（ms） */
const WTTR_TIMEOUT = 8000;
/** wttr.in 基础地址 */
const WTTR_BASE = "https://wttr.in";

/**
 * 解析 wttr.in j1 的 current_condition[0] 为统一 WeatherInfo。
 * 降级来源标记为 "wttr.in-direct"。
 */
function parseWttrCurrent(json: WttrJ1, city: string): WeatherInfo {
  const cc = json?.current_condition?.[0] ?? ({} as WttrCurrentCondition);
  const descArr = cc.weatherDesc;
  const description =
    Array.isArray(descArr) && descArr[0]?.value ? String(descArr[0].value) : "";
  const tempRaw = cc.temp_C;
  const windRaw = cc.windspeedKmph;
  return {
    city,
    temperatureC: tempRaw != null && tempRaw !== "" ? Number(tempRaw) : null,
    humidity: cc.humidity ?? null,
    windKmph: windRaw ?? null,
    windDirection: cc.winddir16Point ? String(cc.winddir16Point) : undefined,
    description,
    observedAt: Date.now(),
    cached: false,
    source: "wttr.in-direct",
  };
}

/**
 * 解析 wttr.in j1 的 weather 数组为 ForecastDay[]。
 * 描述取中午时段（time=1200）的 weatherDesc，缺失时回退到 hourly[4] / hourly[0]。
 */
function parseWttrForecast(json: WttrJ1, city: string): WeatherForecast {
  const rawDays = Array.isArray(json?.weather) ? json.weather : [];
  const days: ForecastDay[] = rawDays.map((w) => {
    const hourly = Array.isArray(w.hourly) ? w.hourly : [];
    const midday =
      hourly.find((h) => String(h?.time) === "1200") ??
      hourly[4] ??
      hourly[0] ??
      ({} as NonNullable<WttrDay["hourly"]>[number]);
    const descArr = midday?.weatherDesc;
    const description =
      Array.isArray(descArr) && descArr[0]?.value ? String(descArr[0].value) : "";
    return {
      date: w.date ?? "",
      maxTempC: w.maxtempC != null && w.maxtempC !== "" ? Number(w.maxtempC) : null,
      minTempC: w.mintempC != null && w.mintempC !== "" ? Number(w.mintempC) : null,
      description,
    };
  });
  return { city, days, source: "wttr.in-direct" };
}

/**
 * 降级：直接请求 wttr.in j1（原生 fetch，跨域）。
 * 失败时抛错，由调用方决定如何处理。
 */
async function fetchWttrJ1(city: string): Promise<WttrJ1> {
  const res = await fetch(`${WTTR_BASE}/${encodeURIComponent(city)}?format=j1`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(WTTR_TIMEOUT),
  });
  if (!res.ok) {
    throw new Error(`[weather] wttr.in http ${res.status}`);
  }
  return (await res.json()) as WttrJ1;
}

/**
 * 获取当前天气。
 *
 * 优先 GET /v2/weather/current?city=&ip=；后端失败（网络错误 / 非 2xx / 空 data）
 * 时降级到 wttr.in。降级必须显式传入 city（无法用 IP 定位），否则抛错。
 */
export async function getCurrentWeather(params: {
  city?: string;
  ip?: string;
}): Promise<WeatherInfo> {
  // 1) 优先后端
  try {
    const res = await http()
      .get("/v2/weather/current")
      .query(params as Record<string, unknown>)
      .then<ApiResult<WeatherInfo>>((r) => r.data);
    if (res?.data) {
      return res.data;
    }
    // 后端 2xx 但 data 为空 → 继续降级
  } catch {
    // 网络/4xx/5xx → 降级
  }

  // 2) 降级 wttr.in
  const city = params.city?.trim();
  if (!city) {
    throw new Error("[weather] 后端不可用且未提供 city，无法降级到 wttr.in");
  }
  const json = await fetchWttrJ1(city);
  return parseWttrCurrent(json, city);
}

/**
 * 获取多日预报。
 *
 * 优先 GET /v2/weather/forecast?city=；失败时降级 wttr.in，解析 weather 数组。
 * 降级也失败（或不支持该城市）时返回空 days 数组，不向上抛错。
 */
export async function getWeatherForecast(city: string): Promise<WeatherForecast> {
  // 1) 优先后端
  try {
    const res = await http()
      .get("/v2/weather/forecast")
      .query({ city })
      .then<ApiResult<WeatherForecast>>((r) => r.data);
    if (res?.data) {
      return res.data;
    }
  } catch {
    // 继续降级
  }

  // 2) 降级 wttr.in
  try {
    const json = await fetchWttrJ1(city);
    return parseWttrForecast(json, city);
  } catch {
    return { city, days: [], source: "wttr.in-direct" };
  }
}
