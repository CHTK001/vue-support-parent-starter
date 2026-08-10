<template>
  <el-popover
    placement="bottom-end"
    :width="440"
    trigger="hover"
    :offset="10"
    popper-class="koi-weather-popover"
    :show-arrow="false"
    :disabled="!hasWeather"
  >
    <template #reference>
      <div class="weather-trigger">
        <el-icon :size="16" class="trigger-icon">
          <Sunny v-if="weatherType === 'sunny'" />
            <Moon v-else-if="weatherType === 'night'" />
            <PartlyCloudy v-else-if="weatherType === 'partly'" />
            <Cloudy v-else-if="weatherType === 'cloudy'" />
            <span v-else-if="weatherType === 'rain'" class="emoji-icon">🌧</span>
            <span v-else-if="weatherType === 'snow'" class="emoji-icon">🌨</span>
            <span v-else-if="weatherType === 'thunderstorm'" class="emoji-icon">⛈</span>
            <span v-else-if="weatherType === 'fog'" class="emoji-icon">🌫</span>
            <span v-else-if="weatherType === 'drizzle'" class="emoji-icon">🌦</span>
            <Loading v-else />
          </el-icon>
          <span v-if="hasWeather" class="trigger-temp">{{ temp }}°C</span>
        </div>
      </template>

      <div class="weather-panel" v-loading="loading">
      <template v-if="hasWeather">
        <div class="weather-panel__head">
           <span class="weather-panel__head-icon">
            <el-icon :size="18">
               <Sunny v-if="weatherType === 'sunny'" />
               <Moon v-else-if="weatherType === 'night'" />
               <PartlyCloudy v-else-if="weatherType === 'partly'" />
               <Cloudy v-else-if="weatherType === 'cloudy'" />
               <span v-else-if="weatherType === 'rain'" class="emoji-icon">🌧</span>
               <span v-else-if="weatherType === 'snow'" class="emoji-icon">🌨</span>
               <span v-else-if="weatherType === 'thunderstorm'" class="emoji-icon">⛈</span>
               <span v-else-if="weatherType === 'fog'" class="emoji-icon">🌫</span>
               <span v-else-if="weatherType === 'drizzle'" class="emoji-icon">🌦</span>
             </el-icon>
           </span>
          <div class="weather-panel__head-info">
            <span class="weather-panel__city">{{ location }}</span>
            <span class="weather-panel__status">{{ weatherDesc }}</span>
          </div>
          <span class="weather-panel__temp">{{ temp }}°C</span>
        </div>

        <div class="weather-panel__detail">
          <div class="weather-detail-item">
            <span class="weather-detail-label">湿度</span>
            <span class="weather-detail-value">{{ humidity }}%</span>
          </div>
          <div class="weather-detail-item">
            <span class="weather-detail-label">风速</span>
            <span class="weather-detail-value">{{ windSpeed }} km/h</span>
          </div>
          <div class="weather-detail-item">
            <span class="weather-detail-label">体感</span>
            <span class="weather-detail-value">{{ feelsLike }}°C</span>
          </div>
        </div>

        <div v-if="hourlyForecast.length" class="weather-panel__hourly">
          <div class="weather-forecast-head">
            <span class="weather-forecast-title">逐小时</span>
            <span class="weather-forecast-days-count">未来 24h</span>
          </div>
          <div class="weather-hourly-list">
            <div
              v-for="(item, index) in hourlyForecast"
              :key="index"
              :class="['weather-hourly-item', getHourlyClass(item.weatherCode), item.isPast ? 'weather-hourly--past' : '', item.isNow ? 'weather-hourly--now' : '']"
            >
              <span class="weather-hourly-time" :class="{ 'weather-hourly-time--past': item.isPast, 'weather-hourly-time--now': item.isNow }">{{ item.hour }}</span>
              <span class="weather-hourly-icon">
                <el-icon :size="14">
                  <Sunny v-if="getForecastIcon(item.weatherCode) === 'sunny'" />
                  <PartlyCloudy v-else-if="getForecastIcon(item.weatherCode) === 'partly'" />
                  <Cloudy v-else-if="getForecastIcon(item.weatherCode) === 'cloudy'" />
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'rain'" class="emoji-icon">🌧</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'snow'" class="emoji-icon">🌨</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'thunderstorm'" class="emoji-icon">⛈</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'fog'" class="emoji-icon">🌫</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'drizzle'" class="emoji-icon">🌦</span>
                </el-icon>
              </span>
              <span class="weather-hourly-temp">{{ item.temp }}°</span>
            </div>
          </div>
        </div>
        <div v-if="forecast.length" class="weather-panel__forecast">
          <div class="weather-forecast-head">
            <span class="weather-forecast-title">一周预报</span>
            <span class="weather-forecast-days-count">{{ forecast.length }} / 7 天</span>
          </div>
          <div class="weather-forecast-list">
            <div
              v-for="(item, index) in forecast"
              :key="item.date"
              class="weather-forecast-item"
            >
              <span class="weather-forecast-day">{{ index === 0 ? "今天" : item.day }}</span>
              <span class="weather-forecast-icon">
                <el-icon :size="16">
                  <Sunny v-if="getForecastIcon(item.weatherCode) === 'sunny'" />
                  <PartlyCloudy v-else-if="getForecastIcon(item.weatherCode) === 'partly'" />
                  <Cloudy v-else-if="getForecastIcon(item.weatherCode) === 'cloudy'" />
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'rain'" class="emoji-icon">🌧</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'snow'" class="emoji-icon">🌨</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'thunderstorm'" class="emoji-icon">⛈</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'fog'" class="emoji-icon">🌫</span>
                  <span v-else-if="getForecastIcon(item.weatherCode) === 'drizzle'" class="emoji-icon">🌦</span>
                </el-icon>
              </span>
              <span class="weather-forecast-temp">
                <span class="temp-min">{{ item.tempMin }}°</span>
                <span class="temp-sep">/</span>
                <span class="temp-max">{{ item.tempMax }}°</span>
              </span>
            </div>
          </div>
        </div>

        <div class="weather-panel__updated">
          更新于 {{ updatedAt }} · 每小时缓存
        </div>
      </template>

      <div v-else-if="!loading" class="weather-panel__empty">
        <el-icon :size="14"><Warning /></el-icon>
        <span>天气数据暂不可用</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
/**
 * Weather —— 顶部右侧天气组件
 *
 * 数据源：Open-Meteo 免费天气 API（无需 API Key）
 * 默认使用浏览器地理定位获取本地天气；定位失败时 fallback 到 app.yaml 配置经纬度，
 * 配置为空则隐藏天气（不写死默认城市）。
 * 当前天气缓存 1 小时，预报缓存 6 小时，定位缓存 24 小时。
 */
import { ref, computed, onMounted } from "vue";
import { Sunny, Cloudy, PartlyCloudy, Moon, Loading, Warning, Umbrella } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { getAppStorage } from "@repo/core";


/** 天气配置（app.yaml other.weather） */
const weatherConfig = computed(() => getConfig().other.weather);

/** 缓存 key（StorageWrapper 内部已按 app 命名空间加前缀，这里用裸 key） */
const CACHE_KEY = "weather-cache";
const LOCATION_KEY = "weather-location";
/** 当前天气缓存有效期：1 小时 */
const CACHE_TTL = 60 * 60 * 1000;
/** 定位缓存有效期：24 小时 */
const LOCATION_TTL = 24 * 60 * 60 * 1000;

/**
 * 把任意来源的城市字段统一规范成"纯中文城市名"格式（与浏览器定位走 BigDataCloud
 * 拿到的 city 字段一致，例如 "杭州"），便于顶栏天气显示统一处理。
 *
 * 优先级：cityName > regionName > countryName
 * 兜底：以上都缺失/为空时返回空串（让上层走 "本地" 兜底，不在此处写死字面量）
 */
function formatCityName(raw: Record<string, any> | null | undefined): string {
  if (!raw) return "";
  const pick = (...keys: string[]) =>
    keys
      .map((k) => (raw?.[k] ?? "").toString().trim())
      .find((v) => v.length > 0) || "";
  // freeipapi.com 标准字段
  let city = pick("cityName", "city", "locality");
  if (city) return city;
  let region = pick("regionName", "region", "principalSubdivision", "state");
  if (region) return region;
  let country = pick("countryName", "country", "countryName");
  return country;
}

const loading = ref(false);
const temp = ref<number | null>(null);
const feelsLike = ref<number | null>(null);
const humidity = ref<number | null>(null);
const windSpeed = ref<number | null>(null);
const weatherCode = ref<number | null>(null);
const location = ref("本地");
const updatedAt = ref("");
const error = ref("");

/** 7 天预报 */
interface ForecastDay {
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
  uv: number;
  sunrise: string;
  sunset: string;
}
const forecast = ref<ForecastDay[]>([]);

/** 未来 24 小时逐小时预报 */
interface HourlyPoint {
  hour: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  precip: number;
  weatherCode: number;
  isPast: boolean;
  isNow: boolean;
}
const hourlyForecast = ref<HourlyPoint[]>([]);

/** 是否有天气数据 */
const hasWeather = computed(() => temp.value != null);

/** 天气类型（用于图标） */
const weatherType = computed(() => {
  if (weatherCode.value == null) return "loading";
  const c = weatherCode.value;
  if (c === 0) return "sunny";
  if (c <= 3) return "partly";
  if (c <= 49) return "fog";
  if (c <= 60) return "drizzle";
  if (c <= 67) return "rain";
  if (c <= 77) return "snow";
  if (c <= 82) return "rain";
  if (c <= 86) return "snow";
  if (c <= 99) return "thunderstorm";
  return "cloudy";
});

/** 天气描述 */
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

/** 时间格式化（12:00） */
function formatTime12(isoStr: string): string {
  if (!isoStr) return "--:--";
  try {
    const parts = isoStr.split("T")[1] ?? isoStr;
    const [hh, mm] = parts.split(":");
    return `${hh}:${mm}`;
  } catch {
    return "--:--";
  }
}

/** 获取预报天气图标 */
function getForecastIcon(code: number): string {
  if (code === 0) return "sunny";
  if (code <= 3) return "partly";
  if (code <= 49) return "fog";
  if (code <= 60) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  if (code <= 86) return "snow";
  if (code <= 99) return "thunderstorm";
  return "cloudy";
}

/** 逐小时格子背景场景类 */
function getHourlyClass(code: number): string {
  return `weather-hourly--${getForecastIcon(code)}`;
}

/** 读取缓存 */
function readCache(key: string, ttl: number): Record<string, any> | null {
  try {
    const raw = getAppStorage().get(key);
    if (!raw) return null;
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Date.now() - data.timestamp > ttl) return null;
    return data;
  } catch { return null; }
}

/** 写入缓存 */
function writeCache(key: string, payload: Record<string, any>): void {
  try {
    getAppStorage().set(key, { ...payload, timestamp: Date.now() });
  } catch { /* ignore */ }
}

/** 获取定位：优先缓存，失败则请求浏览器定位 + 反向地理编码，最终 fallback 到配置 */
async function resolveLocation(): Promise<{ lat: number; lon: number; city: string }> {
  const cached = readCache(LOCATION_KEY, LOCATION_TTL);
  if (cached && cached.lat && cached.lon) {
    return { lat: cached.lat, lon: cached.lon, city: cached.city || "本地" };
  }

  // 使用浏览器定位 + 反向地理编码（BigDataCloud 免费，返回中文城市名）
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
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
      );
      if (geo.ok) {
        const g = await geo.json();
        city = g.city || g.locality || g.principalSubdivision || "本地";
      }
    } catch { /* 反向地理编码失败，显示"本地" */ }
    writeCache(LOCATION_KEY, { lat, lon, city });
    return { lat, lon, city };
  } catch {
    // 浏览器定位失败：使用多个 IP 定位源级联回退
    try {
      // 源 1：freeipapi（HTTPS，支持 CORS，返回 lat/lon/cityName）
      const r1 = await fetch("https://freeipapi.com/api/json/", {
        headers: { "Accept": "application/json" },
        method: "GET",
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

    // 源 2：ip-api（HTTP，HTTPS 返回 403；返回 lat/lon/city）
    try {
      const r2 = await fetch("http://ip-api.com/json/?fields=lat,lon,city", {
        headers: { "Accept": "application/json" },
        method: "GET",
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

    // 全部失败，回退到 app.yaml 配置的经纬度
    const cfg = weatherConfig.value;
    const lat = Number(cfg.latitude) || 0;
    const lon = Number(cfg.longitude) || 0;
    const city = cfg.city || "本地";
    if (!lat || !lon) {
      throw new Error("未配置天气位置");
    }
    return { lat, lon, city };
  }
}

/** 获取天气：优先缓存，缓存过期则请求 Open-Meteo API */
async function fetchWeather(): Promise<void> {
  const cached = readCache(CACHE_KEY, CACHE_TTL);
  if (cached) {
    temp.value = cached.temp;
    feelsLike.value = cached.feelsLike;
    humidity.value = cached.humidity;
    windSpeed.value = cached.windSpeed;
    weatherCode.value = cached.code;
    location.value = cached.location || "本地";
    updatedAt.value = cached.updatedAt || "";
    if (cached.forecast) forecast.value = cached.forecast;
    if (cached.hourlyForecast) {
      const list = cached.hourlyForecast as HourlyPoint[];
      const now = new Date();
      const nowMs = now.getTime();
      list.forEach((item) => {
        const hour = Number(item.hour.split(":")[0]);
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const itemMs = new Date(`${dateStr}T${item.hour}:00`).getTime();
        const diffMin = (nowMs - itemMs) / 60000;
        item.isPast = diffMin > 60;
        item.isNow = diffMin >= 0 && diffMin <= 60;
      });
      hourlyForecast.value = list;
    }
    return;
  }

  loading.value = true;
  try {
    const loc = await resolveLocation();
    location.value = loc.city;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`;
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
          uv: daily.uv_index_max[i] ?? 0,
          sunrise: formatTime12(daily.sunrise[i]),
          sunset: formatTime12(daily.sunset[i]),
        });
      }
    }

    // 取未来 24 小时逐小时预报
    const hourlyList: HourlyPoint[] = [];
    if (hourly.time && hourly.temperature_2m) {
      const now = new Date();
      let startIdx = 0;
      const endIdx = Math.min(startIdx + 24, hourly.time.length);
      for (let i = startIdx; i < endIdx; i++) {
        const t = hourly.time[i];
        const h = Number(t.slice(11, 13));
        const hourStr = `${h < 10 ? "0" : ""}${h}:00`;
        // 判断是否在当前时间之前
        const itemHour = new Date(t + ":00").getTime();
        const nowMs = now.getTime();
        const diffMin = (nowMs - itemHour) / 60000;
        const isPast = diffMin > 60;
        const isNow = diffMin >= 0 && diffMin <= 60;
        hourlyList.push({
          hour: hourStr,
          temp: Math.round(hourly.temperature_2m[i]),
          feelsLike: Math.round(hourly.apparent_temperature[i]),
          humidity: Math.round(hourly.relative_humidity_2m[i] ?? 0),
          wind: Math.round(hourly.wind_speed_10m[i] ?? 0),
          precip: hourly.precipitation[i] ?? 0,
          weatherCode: hourly.weather_code[i] ?? 0,
          isPast,
          isNow,
        });
      }
    }

    const payload = {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      code: current.weather_code,
      location: location.value,
      updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      forecast: forecastList,
      hourlyForecast: hourlyList,
    };
    writeCache(CACHE_KEY, payload);

    temp.value = payload.temp;
    feelsLike.value = payload.feelsLike;
    humidity.value = payload.humidity;
    windSpeed.value = payload.windSpeed;
    weatherCode.value = payload.code;
    updatedAt.value = payload.updatedAt;
    forecast.value = forecastList;
    hourlyForecast.value = hourlyList;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchWeather);
</script>

<style lang="scss" scoped>
.weather-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 36px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: 8px;
  transition:
    background-color 0.3s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .trigger-icon {
    color: var(--el-text-color-regular);
    transition: color 0.3s ease;
  }

  .emoji-icon {
    font-size: 16px;
    line-height: 1;
  }

  .trigger-temp {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
    letter-spacing: 0.5px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);

    .trigger-icon {
      color: var(--el-color-primary);
    }
  }
}

html.dark {
  .weather-trigger {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

/* ==================== popover 面板内容 ==================== */
.weather-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px;
}

.weather-panel__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .weather-panel__head-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: #fff;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.35);
  }

  .weather-panel__head-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;

    .weather-panel__city {
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .weather-panel__status {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .weather-panel__temp {
    font-size: 28px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--el-color-primary);
  }
}

.weather-panel__detail {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;

  .weather-detail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    .weather-detail-label {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }

    .weather-detail-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.weather-panel__updated {
  font-size: 11px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.weather-panel__forecast {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.weather-forecast-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.weather-forecast-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.weather-forecast-days-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.weather-forecast-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.weather-forecast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 2px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  &:last-child { border-bottom: none; }
}

.weather-forecast-day {
  width: 30px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.weather-forecast-icon {
  display: flex;
  align-items: center;
  width: 24px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.weather-forecast-temp {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  flex: 1;
}

.temp-min {
  color: var(--el-text-color-secondary);
}

.temp-sep {
  color: var(--el-border-color);
  font-size: 11px;
}

.temp-max {
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.weather-forecast-precip {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.weather-panel__hourly {
  margin-top: 12px;
}

.weather-hourly-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-top: 6px;
  padding: 8px;
  background: var(--el-bg-color);
  border-radius: 8px;
}

.weather-hourly-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border-radius: 6px;
  padding: 4px 2px;
  overflow: hidden;
}

/* 天气场景动画背景 */

/* 晴：旋转光晕 */
.weather-hourly--sunny {
  background: radial-gradient(circle at 50% 40%, #FFF7E6 0%, #FFF7E6 40%, transparent 70%);
  animation: sunny-pulse 3s ease-in-out infinite;
}
.weather-hourly--sunny::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  background: radial-gradient(circle, #FFD700 0%, transparent 70%);
  opacity: 0.35;
  animation: sunny-pulse 3s ease-in-out infinite;
}

/* 多云/晴间多云：缓慢移动的云朵 */
.weather-hourly--partly {
  background: linear-gradient(180deg, #E8F0F5 0%, #EEF4F8 100%);
}
.weather-hourly--partly::before {
  content: "";
  position: absolute;
  top: 6px;
  left: -30%;
  width: 60%;
  height: 8px;
  border-radius: 4px;
  background: #C8D8E2;
  opacity: 0.4;
  animation: cloud-drift 6s linear infinite;
}
.weather-hourly--partly::after {
  content: "";
  position: absolute;
  top: 14px;
  left: 80%;
  width: 40%;
  height: 6px;
  border-radius: 3px;
  background: #D8E4EC;
  opacity: 0.3;
  animation: cloud-drift 8s linear infinite reverse;
}

/* 阴：均匀灰暗 */
.weather-hourly--cloudy {
  background: #E5E8EB;
}
.weather-hourly--cloudy::before {
  content: "";
  position: absolute;
  top: 4px;
  left: -40%;
  width: 80%;
  height: 10px;
  border-radius: 5px;
  background: #B8BEC4;
  opacity: 0.3;
  animation: cloud-drift 7s linear infinite;
}
.weather-hourly--cloudy::after {
  content: "";
  position: absolute;
  top: 12px;
  left: 70%;
  width: 60%;
  height: 8px;
  border-radius: 4px;
  background: #C8CED4;
  opacity: 0.25;
  animation: cloud-drift 9s linear infinite reverse;
}

/* 雾：模糊白雾层 */
.weather-hourly--fog {
  background: #E8EAEC;
}
.weather-hourly--fog::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.5);
  animation: fog-fade 4s ease-in-out infinite;
  border-radius: 6px;
}

/* 毛毛雨：细碎浅雨线 */
.weather-hourly--drizzle {
  background: #E0E8EE;
}
.weather-hourly--drizzle::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    75deg,
    transparent 0,
    transparent 3px,
    rgba(120, 160, 190, 0.3) 3px,
    rgba(120, 160, 190, 0.3) 4px
  );
  animation: rain-fall 0.6s linear infinite;
}

/* 雨：密集斜雨线 */
.weather-hourly--rain {
  background: #D6E4EC;
}
.weather-hourly--rain::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    70deg,
    transparent 0,
    transparent 4px,
    rgba(80, 130, 170, 0.45) 4px,
    rgba(80, 130, 170, 0.45) 5px
  );
  animation: rain-fall 0.4s linear infinite;
}
.weather-hourly--rain::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 20%;
  width: 30%;
  height: 3px;
  background: rgba(80, 130, 170, 0.25);
  border-radius: 50%;
  animation: puddle-splash 2s ease-in-out infinite;
}

/* 雪：下落雪花点 */
.weather-hourly--snow {
  background: #EDF2F5;
}
.weather-hourly--snow::before {
  content: "❄";
  position: absolute;
  top: -4px;
  left: 20%;
  font-size: 8px;
  color: rgba(120, 160, 200, 0.5);
  animation: snow-fall 3s linear infinite;
}
.weather-hourly--snow::after {
  content: "❄";
  position: absolute;
  top: -8px;
  left: 70%;
  font-size: 6px;
  color: rgba(150, 180, 210, 0.4);
  animation: snow-fall 4s linear infinite reverse;
}

/* 雷暴：暗紫背景 + 闪电闪烁 */
.weather-hourly--thunderstorm {
  background: #D8D5E0;
}
.weather-hourly--thunderstorm::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  animation: lightning-flash 2.5s ease-in-out infinite;
  border-radius: 6px;
}
.weather-hourly--thunderstorm::after {
  content: "⚡";
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 8px;
  color: rgba(255, 200, 50, 0.6);
  animation: lightning-bolt 2.5s ease-in-out infinite;
}

/* 已过/当前时间样式 */
.weather-hourly--past {
  opacity: 0.45;
  filter: grayscale(0.6);
}
.weather-hourly--now {
  box-shadow: 0 0 0 2px var(--el-color-primary);
  background: var(--el-fill-color);
}

.weather-hourly-time {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.weather-hourly-time--past {
  color: var(--el-text-color-placeholder);
}
.weather-hourly-time--now {
  color: var(--el-color-primary);
  font-weight: 700;
}

.weather-hourly-icon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
}

.weather-hourly-icon .emoji-icon {
  font-size: 14px;
}

.weather-hourly-temp {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.weather-detail-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 2px;
}

.weather-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  font-size: 12px;
}

.weather-detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.detail-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.weather-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>

<style lang="scss">
/* popover 外框（teleport 到 body，须用非 scoped 样式） */
.koi-weather-popover {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18) !important;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
}
</style>