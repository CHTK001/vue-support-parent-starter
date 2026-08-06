<template>
  <el-popover
    placement="bottom-end"
    :width="280"
    trigger="hover"
    :offset="10"
    popper-class="koi-weather-popover"
    :show-arrow="false"
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
 * 默认按 IP 定位；可通过 app.yaml other.weather 配置经纬度启用。
 * localStorage 缓存 1 小时，避免频繁请求。
 */
import { ref, computed, onMounted } from "vue";
import { Sunny, Cloudy, PartlyCloudy, Moon, Loading, Warning } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

/** 天气配置（app.yaml other.weather） */
const weatherConfig = computed(() => getConfig().other.weather);

/** 缓存 key & 有效期（1 小时 = 3600 秒） */
const CACHE_KEY = "koi-weather-cache";
const CACHE_TTL = 60 * 60 * 1000;

const loading = ref(false);
const temp = ref<number | null>(null);
const feelsLike = ref<number | null>(null);
const humidity = ref<number | null>(null);
const windSpeed = ref<number | null>(null);
const weatherCode = ref<number | null>(null);
const location = ref("本地");
const updatedAt = ref("");
const error = ref("");

/** 是否有天气数据 */
const hasWeather = computed(() => temp.value != null);

/** 天气类型（用于图标） */
const weatherType = computed(() => {
  if (weatherCode.value == null) return "loading";
  const c = weatherCode.value;
  if (c === 0) return "sunny";
  if (c <= 3) return "partly";
  if (c <= 48) return "cloudy";
  if (c <= 67 || c <= 82) return "cloudy";
  return "cloudy";
});

/** 天气描述 */
const weatherDesc = computed(() => {
  const desc: Record<number, string> = {
    0: "晴",
    1: "大部晴朗",
    2: "局部多云",
    3: "阴",
    45: "雾",
    48: "冻雾",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "浓毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "强阵雨",
    82: "暴雨",
    95: "雷暴",
  };
  return weatherCode.value != null ? desc[weatherCode.value] ?? "天气" : "天气";
});

/** 读取缓存 */
function readCache(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const now = Date.now();
    if (now - data.timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

/** 写入缓存 */
function writeCache(payload: Record<string, any>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, timestamp: Date.now() }));
  } catch {
    // 忽略写入失败
  }
}

/** 获取天气：优先缓存，缓存过期则请求 Open-Meteo API */
async function fetchWeather(): Promise<void> {
  // 1. 读取缓存
  const cached = readCache();
  if (cached) {
    temp.value = cached.temp;
    feelsLike.value = cached.feelsLike;
    humidity.value = cached.humidity;
    windSpeed.value = cached.windSpeed;
    weatherCode.value = cached.code;
    location.value = cached.location || "本地";
    updatedAt.value = cached.updatedAt || "";
    return;
  }

  loading.value = true;
  try {
    // 2. 配置经纬度（未配置则用默认北京坐标）
    const lat = weatherConfig.value.latitude ?? 39.9042;
    const lon = weatherConfig.value.longitude ?? 116.4074;
    const city = weatherConfig.value.city ?? location.value;

    // 3. 请求 Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather request failed");
    const data = await res.json();
    const current = data.current;

    const payload = {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      code: current.weather_code,
      location: city,
      updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    writeCache(payload);

    temp.value = payload.temp;
    feelsLike.value = payload.feelsLike;
    humidity.value = payload.humidity;
    windSpeed.value = payload.windSpeed;
    weatherCode.value = payload.code;
    location.value = city;
    updatedAt.value = payload.updatedAt;
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