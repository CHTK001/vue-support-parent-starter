import { ref, computed, type Ref } from "vue";
import { getConfig } from "@repo/config";
import { getAppStorage } from "@repo/core";

const CACHE_KEY = "weather-cache";
const LOCATION_KEY = "weather-location";
const CACHE_TTL = 60 * 60 * 1000;
const LOCATION_TTL = 24 * 60 * 60 * 1000;

export interface ForecastDay {
  day: string;
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  feelsMax: number;
  feelsMin: number;
  precip: number;
  precipProb: number;
  wind: number;
  windDir: string;
  uv: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyPoint {
  hour: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  windDir: string;
  precip: number;
  weatherCode: number;
  isPast: boolean;
  isNow: boolean;
}
// 类型定义
interface SimpleForecast {
  dateText: string;
  weatherCode: number;
  weatherDesc: string;
  tempMax: number;
  tempMin: number;
  windDir: string;
  precipProb: number;
}
interface HourForecastItem {
  time: string;
  weatherCode: number;
  temp: number;
  windDir: string;
  isNow: boolean;
  isPast: boolean;
}

const dayForecast = ref<SimpleForecast[]>([]);
const nightForecast = ref<SimpleForecast[]>([]);
const hourForecast = ref<HourForecastItem[]>([]);
const sourcePublishTime = ref('');
const weatherCode = ref<number | null>(null);
const temp = ref<number | null>(null);
const feelsLike = ref<number | null>(null);
const humidity = ref<number | null>(null);
const windSpeed = ref<number | null>(null);
const windDir = ref("");
const location = ref("本地");
const updatedAt = ref("");
const forecast = ref<ForecastDay[]>([]);
const hourlyForecast = ref<HourlyPoint[]>([]);
const loading = ref(false);
const error = ref("");

const hasWeather = computed(() => temp.value != null);

const weatherDesc = computed(() => {
  const desc: Record<number, string> = {
    0: "晴", 1: "大部晴朗", 2: "局部多云", 3: "阴",
    45: "雾", 48: "冻雾",
    51: "小毛毛雨", 53: "毛毛雨", 55: "浓毛毛雨",
    61: "小雨", 63: "中雨", 65: "大雨",
    71: "小雪", 73: "中雪", 75: "大雪",
    80: "阵雨", 81: "强阵雨", 82: "暴雨",
    95: "雷暴",
  };
  return weatherCode.value != null ? desc[weatherCode.value] ?? "天气" : "天气";
});

function wmoToFluentIcon(wmo: number | null | undefined): string {
  if (wmo == null) return "fluent:weather-sunny-24-regular";
  if (wmo === 0) return "fluent:weather-sunny-24-regular";
  if (wmo <= 2) return "fluent:weather-partly-cloudy-day-24-regular";
  if (wmo <= 3) return "fluent:weather-cloudy-24-regular";
  if (wmo <= 48) return "fluent:weather-haze-24-regular";
  if (wmo <= 55) return "fluent:weather-drizzle-24-regular";
  if (wmo <= 57) return "fluent:weather-rain-24-regular";
  if (wmo <= 62) return "fluent:weather-rain-24-regular";
  if (wmo <= 64) return "fluent:weather-rain-24-regular";
  if (wmo <= 67) return "fluent:weather-rain-24-regular";
  if (wmo <= 72) return "fluent:weather-snow-24-regular";
  if (wmo <= 74) return "fluent:weather-snow-24-regular";
  if (wmo <= 77) return "fluent:weather-snow-24-regular";
  if (wmo <= 82) return "fluent:weather-rain-showers-day-24-regular";
  if (wmo <= 86) return "fluent:weather-snow-showers-day-24-regular";
  if (wmo <= 99) return "fluent:weather-thunderstorm-24-regular";
  return "fluent:weather-sunny-24-regular";
}

function windDegToDir(deg: number | undefined): string {
  if (deg == null) return "无持续风向";
  const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  return dirs[Math.round(deg / 45) % 8] + "风";
}

function formatTime12(isoStr: string): string {
  if (!isoStr) return "--:--";
  try {
    const parts = isoStr.split("T")[1] ?? isoStr;
    const [hh, mm] = parts.split(":");
    return `${hh}:${mm}`;
  } catch { return "--:--"; }
}

function readCache(key: string, ttl: number): Record<string, any> | null {
  try {
    const raw = getAppStorage().get(key);
    if (!raw) return null;
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Date.now() - data.timestamp > ttl) return null;
    return data;
  } catch { return null; }
}

function writeCache(key: string, payload: Record<string, any>): void {
  try {
    getAppStorage().set(key, { ...payload, timestamp: Date.now() });
  } catch { /* ignore */ }
}

async function resolveLocation(): Promise<{ lat: number; lon: number; city: string }> {
  const cached = readCache(LOCATION_KEY, LOCATION_TTL);
  if (cached && cached.lat && cached.lon) {
    return { lat: cached.lat, lon: cached.lon, city: cached.city || "本地" };
  }
  const weatherConfig = getConfig().other.weather;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false, timeout: 5000, maximumAge: 600000,
      });
    });
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    let city = "本地";
    try {
      const geo = await fetch(
        `/geo-api/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
      );
      if (geo.ok) {
        const g = await geo.json();
        city = g.city || g.locality || g.principalSubdivision || "本地";
      }
    } catch { /* ignore */ }
    writeCache(LOCATION_KEY, { lat, lon, city });
    return { lat, lon, city };
  } catch {
    try {
      const r1 = await fetch("/freeip-api/api/json/", {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (r1.ok) {
        const d: any = await r1.json();
        const lat = Number(d.latitude);
        const lon = Number(d.longitude);
        const city = d.cityName ?? d.city ?? d.region ?? "本地";
        if (lat && lon && city) {
          writeCache(LOCATION_KEY, { lat, lon, city });
          return { lat, lon, city };
        }
      }
    } catch { /* continue */ }
    try {
      const r2 = await fetch("/ip-api/json/?lang=zh-CN&fields=lat,lon,city", {
        signal: AbortSignal.timeout(8000),
      });
      if (r2.ok) {
        const d: any = await r2.json();
        const lat = Number(d.lat);
        const lon = Number(d.lon);
        const city = d.city ?? "本地";
        if (lat && lon && city) {
          writeCache(LOCATION_KEY, { lat, lon, city });
          return { lat, lon, city };
        }
      }
    } catch { /* continue */ }
    const cfg = weatherConfig;
    const lat = Number(cfg.latitude) || 0;
    const lon = Number(cfg.longitude) || 0;
    const city = cfg.city || "本地";
    if (!lat || !lon) throw new Error("未配置天气位置");
    return { lat, lon, city };
  }
}

function markHourlyNow(nowMs: number): void {
  const list = hourlyForecast.value;
  if (!list.length) return;
  const d = new Date(nowMs);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let changed = false;
  list.forEach((item) => {
    const itemMs = new Date(`${dateStr}T${item.hour}:00`).getTime();
    const diffMin = (nowMs - itemMs) / 60000;
    const nextPast = diffMin > 60;
    const nextNow = diffMin >= 0 && diffMin <= 60;
    if (item.isPast !== nextPast || item.isNow !== nextNow) {
      item.isPast = nextPast;
      item.isNow = nextNow;
      changed = true;
    }
  });
  if (changed) hourlyForecast.value = [...list];
}

async function fetchWeather(): Promise<void> {
  const cached = readCache(CACHE_KEY, CACHE_TTL);
  if (cached) {
    temp.value = cached.temp;
    feelsLike.value = cached.feelsLike;
    humidity.value = cached.humidity;
    windSpeed.value = cached.windSpeed;
    windDir.value = cached.windDir ?? "";
    weatherCode.value = cached.code;
    location.value = cached.location || "本地";
    updatedAt.value = cached.updatedAt || "";
    sourcePublishTime.value = cached.sourcePublishTime ?? "";
    if (cached.dayForecast) dayForecast.value = cached.dayForecast;
    if (cached.nightForecast) nightForecast.value = cached.nightForecast;
    if (cached.hourForecast) hourForecast.value = cached.hourForecast;
    if (cached.forecast) forecast.value = cached.forecast;
    if (cached.hourlyForecast) {
      const list = cached.hourlyForecast as HourlyPoint[];
      hourlyForecast.value = list;
      markHourlyNow(Date.now());
    }
    return;
  }

  loading.value = true;
  try {
    const loc = await resolveLocation();
    location.value = loc.city;

    const url = `/weather-api/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather request failed");
    const data = await res.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly || {};

    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const forecastList: ForecastDay[] = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const d = new Date(daily.time[i] + "T00:00:00");
        forecastList.push({
          day: dayNames[d.getDay()],
          date: daily.time[i].slice(5),
          weatherCode: daily.weather_code[i],
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          feelsMax: Math.round(daily.apparent_temperature_max[i] ?? daily.temperature_2m_max[i]),
          feelsMin: Math.round(daily.apparent_temperature_min[i] ?? daily.temperature_2m_min[i]),
          precip: daily.precipitation_sum[i] ?? 0,
          precipProb: daily.precipitation_probability_max[i] ?? 0,
          wind: Math.round(daily.wind_speed_10m_max[i] ?? 0),
          windDir: windDegToDir(daily.wind_direction_10m_dominant?.[i]),
          uv: daily.uv_index_max[i] ?? 0,
          sunrise: formatTime12(daily.sunrise[i]),
          sunset: formatTime12(daily.sunset[i]),
        });
      }
    }

    const hourlyList: HourlyPoint[] = [];
    if (hourly.time && hourly.temperature_2m) {
      const endIdx = Math.min(24, hourly.time.length);
      for (let i = 0; i < endIdx; i++) {
        const t = hourly.time[i];
        const h = Number(t.slice(11, 13));
        const hourStr = `${h < 10 ? "0" : ""}${h}:00`;
        hourlyList.push({
          hour: hourStr,
          temp: Math.round(hourly.temperature_2m[i]),
          feelsLike: Math.round(hourly.apparent_temperature[i]),
          humidity: Math.round(hourly.relative_humidity_2m[i] ?? 0),
          wind: Math.round(hourly.wind_speed_10m[i] ?? 0),
          windDir: windDegToDir(hourly.wind_direction_10m?.[i]),
          precip: hourly.precipitation[i] ?? 0,
          weatherCode: hourly.weather_code[i] ?? 0,
          isPast: false,
          isNow: false,
        });
      }
    }

    buildDerivedForecasts(forecastList, hourlyList);
    const payload = {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      windDir: windDegToDir(daily.wind_direction_10m_dominant?.[0]),
      code: current.weather_code,
      location: location.value,
      updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      sourcePublishTime: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      forecast: forecastList,
      hourlyForecast: hourlyList,
      dayForecast: dayForecast.value,
      nightForecast: nightForecast.value,
      hourForecast: hourForecast.value,
    };
    writeCache(CACHE_KEY, payload);

    temp.value = payload.temp;
    feelsLike.value = payload.feelsLike;
    humidity.value = payload.humidity;
    windSpeed.value = payload.windSpeed;
    windDir.value = payload.windDir;
    weatherCode.value = payload.code;
    updatedAt.value = payload.updatedAt;
    sourcePublishTime.value = payload.sourcePublishTime;
    forecast.value = forecastList;
    hourlyForecast.value = hourlyList;
    markHourlyNow(Date.now());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function buildDerivedForecasts(daily: ForecastDay[], hourly: HourlyPoint[]) {
  const desc: Record<number, string> = {
    0: "晴", 1: "大部晴朗", 2: "局部多云", 3: "阴",
    45: "雾", 48: "冻雾",
    51: "小毛毛雨", 53: "毛毛雨", 55: "浓毛毛雨",
    61: "小雨", 63: "中雨", 65: "大雨",
    71: "小雪", 73: "中雪", 75: "大雪",
    80: "阵雨", 81: "强阵雨", 82: "暴雨",
    95: "雷暴",
  };
  const d = desc;
  dayForecast.value = daily.map((f) => ({
    dateText: f.date,
    weatherCode: f.weatherCode,
    weatherDesc: d[f.weatherCode] ?? "天气",
    tempMax: f.tempMax,
    tempMin: f.tempMin,
    windDir: f.windDir,
    precipProb: f.precipProb,
  }));
  nightForecast.value = daily.map((f) => ({
    dateText: f.date,
    weatherCode: f.weatherCode,
    weatherDesc: d[f.weatherCode] ?? "天气",
    tempMax: f.tempMax,
    tempMin: f.tempMin,
    windDir: f.windDir,
    precipProb: f.precipProb,
  }));
  const nowHour = new Date().getHours();
  hourForecast.value = hourly.map((h) => {
    const hourNum = parseInt(h.hour, 10);
    return {
      time: h.hour,
      weatherCode: h.weatherCode,
      temp: h.temp,
      windDir: h.windDir,
      isNow: hourNum === nowHour,
      isPast: hourNum < nowHour,
    };
  });
}

export function useWeather() {
  return {
    weatherCode,
    temp,
    feelsLike,
    humidity,
    windSpeed,
    windDir,
    location,
    updatedAt,
    sourcePublishTime,
    forecast,
    hourlyForecast,
    dayForecast,
    nightForecast,
    hourForecast,
    loading,
    error,
    hasWeather,
    weatherDesc,
    fetchWeather,
    resolveLocation,
    markHourlyNow,
    wmoToFluentIcon,
    windDegToDir,
    formatTime12,
  };
}