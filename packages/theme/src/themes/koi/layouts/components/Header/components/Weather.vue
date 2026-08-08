<template>
  <el-popover
    placement="bottom-end"
    :width="320"
    trigger="hover"
    :offset="10"
    popper-class="koi-weather-popover"
    :show-arrow="false"
    :disabled="!hasWeather"
  >
    <template #reference>
      <div class="weather-trigger" :title="t('header.weather.tip')">
        <el-icon :size="16" class="trigger-icon">
          <Sunny v-if="weatherType === 'sunny'" />
          <Cloudy v-else-if="weatherType === 'cloudy'" />
          <PartlyCloudy v-else-if="weatherType === 'partly'" />
          <Moon v-else-if="weatherType === 'night'" />
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
              <Cloudy v-else-if="weatherType === 'cloudy'" />
              <PartlyCloudy v-else-if="weatherType === 'partly'" />
              <Moon v-else-if="weatherType === 'night'" />
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

        <div v-if="forecast.length" class="weather-panel__forecast">
          <div class="weather-forecast-head">
            <span class="weather-forecast-title">一周预报</span>
            <span class="weather-forecast-days-count">{{ forecast.length }} / 7 天</span>
          </div>
          <div class="weather-forecast-list">
            <div v-for="(item, index) in forecast" :key="item.date" class="weather-forecast-item">
              <span class="weather-forecast-day">{{ index === 0 ? "今天" : item.day }}</span>
              <span class="weather-forecast-icon">
                <el-icon :size="20">
                  <Sunny v-if="getForecastIcon(item.weatherCode) === 'sunny'" />
                  <PartlyCloudy v-else-if="getForecastIcon(item.weatherCode) === 'partly'" />
                  <Cloudy v-else />
                </el-icon>
              </span>
              <span class="weather-forecast-temp">
                <span class="temp-min">{{ item.tempMin }}°</span>
                <span class="temp-sep">/</span>
                <span class="temp-max">{{ item.tempMax }}°</span>
              </span>
              <span class="weather-forecast-precip">
                <el-icon :size="12"><Umbrella /></el-icon>
                {{ item.precip }}mm
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
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
  precip: number;
}
const forecast = ref<ForecastDay[]>([]);

/** 是否有天气数据 */
const hasWeather = computed(() => temp.value != null);

/** 天气类型（用于图标） */
const weatherType = computed(() => {
  if (weatherCode.value == null) return "loading";
  const c = weatherCode.value;
  if (c === 0) return "sunny";
  if (c <= 3) return "partly";
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

/** 获取预报天气图标 */
function getForecastIcon(code: number): string {
  if (code === 0) return "sunny";
  if (code <= 3) return "partly";
  return "cloudy";
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
    // 浏览器定位失败：尝试 IP 地理定位
    // 使用 freeipapi.com：开 CORS（ACAO: *）、无需 key、免费。
    // 字段：latitude / longitude / cityName / regionName / countryName / ipAddress
    try {
      const ipRes = await fetch("https://freeipapi.com/api/json");
      if (ipRes.ok) {
        const ipData: any = await ipRes.json();
        const lat = Number(ipData.latitude);
        const lon = Number(ipData.longitude);
        // 格式与浏览器定位分支一致：返回纯城市名（如 "杭州"），与 BigDataCloud 的 city 字段对齐
        const city = formatCityName(ipData);
        if (lat && lon && city) {
          writeCache(LOCATION_KEY, { lat, lon, city });
          return { lat, lon, city };
        }
      }
    } catch { /* IP 定位失败，继续回退 */ }
    // 回退到 app.yaml 配置的经纬度；均未配置（0）时天气不可用
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
    return;
  }

  loading.value = true;
  try {
    const loc = await resolveLocation();
    location.value = loc.city;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather request failed");
    const data = await res.json();
    const current = data.current;
    const daily = data.daily;

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
          precip: daily.precipitation_sum[i] ?? 0,
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
    };
    writeCache(CACHE_KEY, payload);

    temp.value = payload.temp;
    feelsLike.value = payload.feelsLike;
    humidity.value = payload.humidity;
    windSpeed.value = payload.windSpeed;
    weatherCode.value = payload.code;
    updatedAt.value = payload.updatedAt;
    forecast.value = forecastList;
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