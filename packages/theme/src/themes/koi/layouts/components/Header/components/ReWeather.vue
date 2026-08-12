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
        <ReIcon v-if="weatherCode != null" :name="wmoToFluentIcon(weatherCode)" size="20" class="trigger-icon" />
        <el-icon v-else :size="16" class="trigger-icon"><Loading /></el-icon>
          <span v-if="hasWeather" class="trigger-temp">{{ temp }}°C</span>
        </div>
      </template>

      <div class="weather-panel" v-loading="loading">
      <template v-if="hasWeather">
        <div class="weather-panel__head">
          <span class="weather-panel__head-icon">
            <ReIcon :name="wmoToFluentIcon(weatherCode)" size="36" class="panel-icon" />
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
                <ReIcon :name="wmoToFluentIcon(item.weatherCode)" size="24" class="hourly-icon" />
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
                <ReIcon :name="wmoToFluentIcon(item.weatherCode)" size="24" class="forecast-icon" />
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
import { onMounted, onBeforeUnmount } from "vue";
import { Loading, Warning } from "@element-plus/icons-vue";
import { useWeather } from "@repo/theme/composables/useWeather";
import { getGlobalTimer } from "@repo/work/timer";

const {
  weatherCode, temp, feelsLike, humidity, windSpeed,
  location, updatedAt, forecast, hourlyForecast, loading, error,
  hasWeather, weatherDesc,
  fetchWeather, markHourlyNow, wmoToFluentIcon,
} = useWeather();

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

function getHourlyClass(code: number): string {
  return `weather-hourly--${getForecastIcon(code)}`;
}

let unsubscribeTimer: (() => void) | null = null;

onMounted(async () => {
  await fetchWeather();
  unsubscribeTimer = getGlobalTimer().subscribe((tick) => {
    markHourlyNow(tick.timestamp);
  });
});

onBeforeUnmount(() => {
  unsubscribeTimer?.();
  unsubscribeTimer = null;
});
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
    width: 20px;
    height: 20px;
    object-fit: contain;
    transition: transform 0.3s ease;
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