/**
 * 天气 / 定位 API 封装（@repo/core）
 *
 * 数据来源两条链路，产出同一套结构（本系统的契约，UI 只认这套字段）：
 *   ① 后台接口：启动期 HEAD 探测 /v2/weather/overview，命中则走后台
 *      —— 三方调用、缓存、字段口径都由后台统一收口；
 *   ② 后台未实现时：浏览器直连三方（Open-Meteo 及其地理编码服务），
 *      在本文件里归一化成同一套 WeatherOverview，由 source 标明来源。
 *
 * 三方请求不走项目 http 拦截器（跨域公开接口，无需签名/加密），用原生 fetch + 超时。
 * dev 期若应用配了 /weather-api、/geo-api 等代理前缀，会优先用代理（免跨域、可走内网），
 * 代理不存在时自动退回直连。
 */
import { getConfig } from "@repo/config";
import { log } from "@repo/utils";
import { http } from "./index";
import { probeBackend } from "./backendProbe";
import { WEATHER_OVERVIEW_PATH, LOCATION_RESOLVE_PATH } from "./capability";
import type { ApiResult } from "./index";

/** 逐小时天气点（本系统契约） */
export interface WeatherHour {
  /** yyyy-MM-ddTHH:mm */
  time: string;
  /** WMO 天气代码，UI 据此出图标与文案 */
  weatherCode: number;
  temperature: number;
  feelsLike: number;
  /** 相对湿度 % */
  humidity: number;
  /** 风速 km/h */
  windSpeed: number;
  /** 风向（度，0=北） */
  windDirection: number;
  /** 降水量 mm */
  precipitation: number;
  /** 降水概率 % */
  precipitationProbability: number;
}

/** 逐日预报（本系统契约） */
export interface WeatherDay {
  /** yyyy-MM-dd */
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  feelsMax: number;
  feelsMin: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  /** HH:mm */
  sunrise: string;
  /** HH:mm */
  sunset: string;
}

/** 天气总览：实况 + 逐小时 + 逐日（本系统契约，后台 data 即此结构） */
export interface WeatherOverview {
  /** 展示地名 */
  location: string;
  latitude: number;
  longitude: number;
  weatherCode: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  /** 气压 hPa */
  pressure: number;
  /** 观测时间（ISO 字符串） */
  observedAt: string;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  /** 数据来源：backend / open-meteo-direct 等 */
  source: string;
}

/** 定位结果（本系统契约） */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  /** 来源：backend / browser / ip / config */
  source: string;
}

/** 天气查询入参：坐标优先，缺省时由数据源按城市解析 */
export interface WeatherQuery {
  latitude?: number;
  longitude?: number;
  city?: string;
  /** 预报天数，默认取配置的天数窗口 */
  days?: number;
  /** 逐小时点数，默认 24 */
  hours?: number;
}

/** 三方兜底默认预报天数 */
const DEFAULT_DAYS = 7;
/** 三方兜底默认逐小时点数 */
const DEFAULT_HOURS = 24;
/** 三方请求超时（ms） */
const THIRD_PARTY_TIMEOUT = 8000;

/** Open-Meteo 预报接口（代理前缀优先，其次直连） */
const OPEN_METEO_CANDIDATES = ["/weather-api", "https://api.open-meteo.com"];
/** Open-Meteo 地理编码接口 */
const GEOCODING_CANDIDATES = ["https://geocoding-api.open-meteo.com"];
/** BigDataCloud 反向地理编码（浏览器定位 → 城市名） */
const REVERSE_GEO_CANDIDATES = ["/geo-api", "https://api.bigdatacloud.net"];
/** freeipapi IP 定位 */
const FREE_IP_CANDIDATES = ["/freeip-api", "https://freeipapi.com"];
/** ip-api IP 定位（免费版仅 HTTP，HTTPS 页面下会被混合内容拦截） */
const IP_API_CANDIDATES = ["/ip-api", "http://ip-api.com"];

/** 数值兜底：非有限值取 fallback */
function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** 数组兜底：非数组返回空数组 */
function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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
      const res = await fetch(`${base}${path}`, {
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
  throw lastError ?? new Error("[weather] 三方数据源全部不可用");
}

/** Open-Meteo 响应 → WeatherOverview（缺字段按 0 兜底，保证 UI 拿到的字段齐全） */
function toOverview(raw: Record<string, any>, fallbackLocation: string, lat: number, lon: number): WeatherOverview {
  const current = raw?.current ?? {};
  const hourly = raw?.hourly ?? {};
  const daily = raw?.daily ?? {};
  const hourlyList: WeatherHour[] = arr(hourly.time).map((time, i) => ({
    time: String(time),
    weatherCode: num(hourly.weather_code?.[i]),
    temperature: num(hourly.temperature_2m?.[i]),
    feelsLike: num(hourly.apparent_temperature?.[i]),
    humidity: num(hourly.relative_humidity_2m?.[i]),
    windSpeed: num(hourly.wind_speed_10m?.[i]),
    windDirection: num(hourly.wind_direction_10m?.[i]),
    precipitation: num(hourly.precipitation?.[i]),
    precipitationProbability: num(hourly.precipitation_probability?.[i]),
  }));
  const dailyList: WeatherDay[] = arr(daily.time).map((date, i) => ({
    date: String(date),
    weatherCode: num(daily.weather_code?.[i]),
    tempMax: num(daily.temperature_2m_max?.[i]),
    tempMin: num(daily.temperature_2m_min?.[i]),
    feelsMax: num(daily.apparent_temperature_max?.[i] ?? daily.temperature_2m_max?.[i]),
    feelsMin: num(daily.apparent_temperature_min?.[i] ?? daily.temperature_2m_min?.[i]),
    precipitation: num(daily.precipitation_sum?.[i]),
    precipitationProbability: num(daily.precipitation_probability_max?.[i]),
    windSpeed: num(daily.wind_speed_10m_max?.[i]),
    windDirection: num(daily.wind_direction_10m_dominant?.[i]),
    uvIndex: num(daily.uv_index_max?.[i]),
    sunrise: String(daily.sunrise?.[i] ?? "").slice(11, 16),
    sunset: String(daily.sunset?.[i] ?? "").slice(11, 16),
  }));
  return {
    location: String(raw?.resolvedCity ?? raw?.city ?? fallbackLocation ?? "本地"),
    latitude: num(raw?.latitude, lat),
    longitude: num(raw?.longitude, lon),
    weatherCode: num(current.weather_code),
    temperature: num(current.temperature_2m),
    feelsLike: num(current.apparent_temperature),
    humidity: num(current.relative_humidity_2m),
    windSpeed: num(current.wind_speed_10m),
    windDirection: num(current.wind_direction_10m),
    pressure: num(current.pressure_msl),
    observedAt: String(current.time ?? new Date().toISOString()),
    hourly: hourlyList,
    daily: dailyList,
    source: "open-meteo-direct",
  };
}

/** 逐小时参数串（Open-Meteo） */
const HOURLY_FIELDS =
  "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code," +
  "wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability";

/** 逐日参数串（Open-Meteo） */
const DAILY_FIELDS =
  "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max," +
  "apparent_temperature_min,precipitation_sum,precipitation_probability_max," +
  "wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset";

/**
 * 三方兜底：按坐标（或城市解析出的坐标）向 Open-Meteo 取实况 + 逐小时 + 逐日。
 *
 * 逐小时窗口按"当前时刻起算"截取 hours 个点：Open-Meteo 从当日 00:00 开始返回，
 * 直接取前 N 个会把过去的时段当作预报展示。
 */
async function fetchOverviewFromThirdParty(query: WeatherQuery): Promise<WeatherOverview> {
  let lat = num(query.latitude);
  let lon = num(query.longitude);
  let city = query.city?.trim() ?? "";
  if ((!lat && !lon) && city) {
    const geo: any = await fetchJson(GEOCODING_CANDIDATES, `/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`);
    const first = arr(geo?.results)[0] as Record<string, unknown> | undefined;
    if (!first) {
      throw new Error(`[weather] 无法解析城市：${city}`);
    }
    lat = num(first.latitude);
    lon = num(first.longitude);
    city = String(first.name ?? city);
  }
  // 坐标缺失/非法（含 0,0）时不再硬发请求：Open-Meteo 会照单全收并返回
  // 几内亚湾上空的天气，界面显示"0° 阴"，比"暂无天气"更像出了故障。
  // 城市也解析不出来就明确报错，让调用方展示空态。
  if (!isUsableCoord(lat, lon)) {
    throw new Error(`[weather] 无有效坐标（lat=${lat}, lon=${lon}）与可解析的城市`);
  }
  const days = query.days ?? DEFAULT_DAYS;
  const hours = query.hours ?? DEFAULT_HOURS;
  const path =
    `/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
    `wind_speed_10m,wind_direction_10m,pressure_msl` +
    `&hourly=${HOURLY_FIELDS}&daily=${DAILY_FIELDS}` +
    `&forecast_days=${days}&timezone=auto`;
  const raw: any = await fetchJson(OPEN_METEO_CANDIDATES, path);
  const overview = toOverview(raw, city || "本地", lat, lon);
  // timezone=auto 时 Open-Meteo 的 time 是当地时间，须用响应里的时区偏移换算"此刻"再裁剪，
  // 直接拿 UTC 的 now 比较会把整个当天判成"已过去"
  const offsetSeconds = num(raw?.utc_offset_seconds);
  const nowLocalHour = new Date(Date.now() + offsetSeconds * 1000).toISOString().slice(0, 13);
  const future = overview.hourly.filter((h) => h.time.slice(0, 13) >= nowLocalHour);
  overview.hourly = (future.length ? future : overview.hourly).slice(0, hours);
  return overview;
}

/**
 * 获取天气总览。
 *
 * 后台已实现（HEAD 探测命中）→ GET /v2/weather/overview；
 * 否则直连三方并归一化。两条链路都失败时抛出最后一个错误，由调用方决定空态展示。
 *
 * <p>入参未带坐标/城市时，先自行解析一次定位再请求：后台天气接口按
 * {@code latitude/longitude} 或 {@code city} 取数，两者都没有时
 * {@code WeatherDataServiceImpl#load} 直接返回 null，接口回"无可用天气数据源"。
 * 调用方（顶栏环境信息等）往往只想要"当前天气"，不该要求它先自己定位。</p>
 */
export async function getWeatherOverview(query: WeatherQuery = {}): Promise<WeatherOverview> {
  const effective = await withResolvedLocation(query);
  if (await probeBackend(WEATHER_OVERVIEW_PATH)) {
    try {
      const res = await http()
        .get(WEATHER_OVERVIEW_PATH)
        .query(effective as Record<string, unknown>)
        // 天气是"后台可选增强"能力，失败要在本函数内部静默回落三方，
        // 不能让拦截器把后端 msg 弹成全局 toast —— 那条提示对用户无意义
        // （"无可用天气数据源"只是后台此刻没数据源，界面本就该继续用三方数据），
        // 却会打断正在进行的操作。定位接口同理。
        .noToast(true)
        .then<ApiResult<WeatherOverview>>((r) => r.data);
      if (res?.data) {
        return normalizeBackendOverview(res.data);
      }
      log.warn("weather", "后台返回空数据，回落三方");
    } catch (error) {
      log.warn("weather", "后台天气接口失败，回落三方", error);
    }
  }
  return fetchOverviewFromThirdParty(effective);
}

/**
 * 入参缺坐标/城市时补一次定位解析。
 *
 * <p>定位解析失败（无浏览器定位、IP 定位不通、配置里也没写经纬度）时原样返回入参，
 * 由后续链路各自报错 —— 这里不抛错，避免"定位失败"把"天气失败"的成因盖掉。</p>
 */
async function withResolvedLocation(query: WeatherQuery): Promise<WeatherQuery> {
  // 注意用 isUsableCoord 而不是"非 undefined"：调用方可能传 0（定位没取到时的
  // 缺省值），那等同于没定位，这里必须再尝试解析一次，否则 0,0 会一路带到三方接口。
  const hasCoord = isUsableCoord(num(query.latitude, NaN), num(query.longitude, NaN));
  const hasCity = !!query.city?.trim() && query.city.trim() !== "本地";
  if (hasCoord || hasCity) return query;
  try {
    const geo = await resolveGeoLocation();
    return {
      ...query,
      latitude: geo.latitude,
      longitude: geo.longitude,
      city: geo.city,
    };
  } catch (error) {
    log.warn("weather", "定位解析失败，天气请求将不带坐标", error);
    return query;
  }
}

/** 后台返回的结构补齐缺省字段（数组/数值），保证 UI 消费端无需逐字段判空 */
function normalizeBackendOverview(data: WeatherOverview): WeatherOverview {
  return {
    ...data,
    location: String(data.location ?? "本地"),
    hourly: arr(data.hourly) as WeatherHour[],
    daily: arr(data.daily) as WeatherDay[],
    source: data.source || "backend",
  };
}

/** 读取浏览器定位（失败/超时返回 null） */
function locateInBrowser(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 },
    );
  });
}

/** 按坐标反查城市名（BigDataCloud），失败时返回占位名 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const g: any = await fetchJson(
      REVERSE_GEO_CANDIDATES,
      `/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
    );
    return String(g?.city || g?.locality || g?.principalSubdivision || "本地");
  } catch {
    return "本地";
  }
}

/**
 * IP 定位兜底：按一组候选基地址请求，字段名由调用方传入
 * （freeipapi 用 latitude/longitude/cityName，ip-api 用 lat/lon/city）。
 * 拿到非法坐标或请求失败时返回 null，由调用方继续下一个兜底源。
 */
async function locateByIp(
  candidates: string[],
  path: string,
  latField: string,
  lonField: string,
  cityField: string,
): Promise<GeoLocation | null> {
  try {
    const d: any = await fetchJson(candidates, path);
    const latitude = num(d?.[latField]);
    const longitude = num(d?.[lonField]);
    if (!latitude || !longitude) return null;
    return { latitude, longitude, city: String(d?.[cityField] ?? "本地"), source: "ip" };
  } catch {
    return null;
  }
}

/**
 * 校验经纬度是否可用于天气查询。
 *
 * <p>赤道与本初子午线交点（0,0）是几内亚湾外海，不是任何人的位置；
 * 定位链路任何一环失败时都会把 0 当缺省值传下来，若不拦截，
 * 三方接口会返回一片虚无的"当地"天气（界面显示 0° 的加勒比海），
 * 比"取不到天气"更迷惑人。纬度合法区间 [-90, 90]，经度 [-180, 180]。</p>
 *
 * @param lat 纬度
 * @param lon 经度
 * @returns 是否是可用于查询的坐标
 */
function isUsableCoord(lat: number, lon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
  // 0,0 视为无效（等同"没定位到"）
  return lat !== 0 || lon !== 0;
}

/**
 * 解析展示用定位。
 *
 * 链路：后台（按客户端 IP 服务端解析）→ 浏览器定位 → IP 定位 → app.yaml 配置的经纬度。
 * 前三步都是"能拿到就用"，最后一步缺配置则抛错，由调用方展示空态。
 */
export async function resolveGeoLocation(): Promise<GeoLocation> {
  const weather = getConfig().other.weather;
  if (await probeBackend(LOCATION_RESOLVE_PATH)) {
    try {
      const res = await http()
        .get(LOCATION_RESOLVE_PATH)
        // 同 getWeatherOverview：定位失败要静默回落到浏览器/IP 定位，
        // 不弹全局 toast（后台没有定位能力是部署常态，不是用户可处理的错误）。
        .noToast(true)
        .then<ApiResult<GeoLocation>>((r) => r.data);
      const data = res?.data;
      if (data && isUsableCoord(num(data.latitude), num(data.longitude))) {
        return {
          latitude: num(data.latitude),
          longitude: num(data.longitude),
          city: String(data.city || "本地"),
          source: data.source || "backend",
        };
      }
    } catch (error) {
      log.warn("weather", "后台定位接口失败，回落前端定位", error);
    }
  }

  const browser = await locateInBrowser();
  if (browser && isUsableCoord(browser.latitude, browser.longitude)) {
    return {
      latitude: browser.latitude,
      longitude: browser.longitude,
      city: await reverseGeocode(browser.latitude, browser.longitude),
      source: "browser",
    };
  }

  const freeIp = await locateByIp(FREE_IP_CANDIDATES, "/api/json/", "latitude", "longitude", "cityName");
  if (freeIp) return freeIp;
  const ipApi = await locateByIp(IP_API_CANDIDATES, "/json/?lang=zh-CN&fields=lat,lon,city", "lat", "lon", "city");
  if (ipApi) return ipApi;

  const lat = num(weather.latitude);
  const lon = num(weather.longitude);
  // 配置缺省是 0（见 shared.ts 的 other.weather 默认值），0,0 不是合法位置，
  // 按"未配置"处理并抛错，由调用方展示空态 —— 而不是拿几内亚湾当当地天气。
  if (!isUsableCoord(lat, lon)) {
    throw new Error("[weather] 后台未提供定位接口且未配置 weather 经纬度");
  }
  return { latitude: lat, longitude: lon, city: weather.city || "本地", source: "config" };
}
