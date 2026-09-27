<template>
  <!-- 顶栏环境信息：天气 + 活跃台风（数据取自后台 /v2/**，能力未提供时自动回落三方） -->
  <div class="flex items-center gap-1">
  
  </div>
</template>

<script setup lang="ts">
/**
 * 顶栏环境信息入口（天气 / 活跃台风）
 *
 * 本应用不使用 koi 框架布局，故不复用 @repo/theme 的 ReWeather / ReTyphoon（那两个组件
 * 绑定 koi 顶栏样式与 Leaflet 地图），改为直接消费 @repo/core 的接口层：
 * 数据、缓存、三方回落、后台能力探测全部由 core 负责，本组件只做展示。
 *
 * 显隐口径（三者全开才显示）：
 *   - app.yaml other.toolbar.weather / other.toolbar.typhoon：顶栏入口开关
 *   - other.weather.enable：天气显隐
 *   - other.capabilities.<key>：后台能力开关（false 时 core 不发请求，直接回落三方）
 */
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'
import {
  AcUnitFilled,
  CloudFilled,
  FilterDramaFilled,
  GrainFilled,
  ThunderstormFilled,
  UmbrellaFilled,
  WaterDropFilled,
  WbSunnyFilled,
} from '@vicons/material'
import { getConfig } from '@repo/config'
import { getActiveTyphoonList, getWeatherOverview, type TyphoonItem } from '@repo/core'
import LTooltip from './ui/LTooltip.vue'

const { t } = useI18n()

/** 天气轮询间隔（ms）：与后台数据源缓存节奏一致，1 小时足够 */
const WEATHER_INTERVAL = 60 * 60 * 1000
/** 台风轮询间隔（ms） */
const TYPHOON_INTERVAL = 60 * 60 * 1000

/**
 * 天气码 → 图标组件（WMO 4677 分档）
 *
 * 图标取自本应用已在用的 @vicons 图标库（material），不落地任何新资源文件；
 * 未命中任何档位时退到晴天图标，与 koi useWeather 的兜底口径一致。
 */
const WEATHER_ICONS: Array<{ max: number; icon: Component }> = [
  { max: 0, icon: WbSunnyFilled },
  { max: 2, icon: FilterDramaFilled },
  { max: 3, icon: CloudFilled },
  { max: 48, icon: CloudFilled },
  { max: 57, icon: GrainFilled },
  { max: 67, icon: WaterDropFilled },
  { max: 77, icon: AcUnitFilled },
  { max: 82, icon: UmbrellaFilled },
  { max: 86, icon: AcUnitFilled },
  { max: 99, icon: ThunderstormFilled },
]

/** 天气码 → 中文描述（WMO 4677） */
const WEATHER_DESC: Record<number, string> = {
  0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
  45: '雾', 48: '雾凇',
  51: '小毛雨', 53: '毛雨', 55: '大毛雨',
  56: '冻毛雨', 57: '冻毛雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  66: '冻雨', 67: '冻雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
  80: '阵雨', 81: '强阵雨', 82: '暴雨',
  85: '阵雪', 86: '强阵雪',
  95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '强雷暴伴冰雹',
}

const other = computed(() => getConfig().other)
const showWeather = computed(
  () => !!other.value?.toolbar?.weather && other.value?.weather?.enable !== false,
)
const showTyphoon = computed(() => !!other.value?.toolbar?.typhoon)

/** 天气展示态 */
const weatherLoading = ref(false)
const weatherCode = ref<number | null>(null)
const temperature = ref<number | null>(null)
const feelsLike = ref<number | null>(null)
const humidity = ref<number | null>(null)
const windSpeed = ref<number | null>(null)
const location = ref('')
const forecast = ref<Array<{ date: string; weatherCode: number; tempMin: number; tempMax: number }>>([])

/** 台风展示态 */
const typhoonList = ref<TyphoonItem[]>([])
const typhoonLoading = ref(false)

let weatherTimer: ReturnType<typeof setInterval> | undefined
let typhoonTimer: ReturnType<typeof setInterval> | undefined

const weatherDesc = computed(() => WEATHER_DESC[weatherCode.value ?? -1] ?? t('ui.weather.unknown'))
const weatherTemp = computed(() =>
  temperature.value == null ? '' : `${Math.round(temperature.value)}°`,
)
const weatherIcon = computed(() => {
  const code = weatherCode.value
  if (code == null) return WbSunnyFilled
  return WEATHER_ICONS.find((item) => code <= item.max)?.icon ?? WbSunnyFilled
})
const typhoonCount = computed(() => typhoonList.value.length)

const weatherTip = computed(() => {
  if (weatherCode.value == null) return t('ui.weather.unavailable')
  const parts = [`${location.value || t('ui.weather.local')} · ${weatherDesc.value}`, weatherTemp.value]
  if (feelsLike.value != null) parts.push(`${t('ui.weather.feelsLike')} ${Math.round(feelsLike.value)}°`)
  if (humidity.value != null) parts.push(`${t('ui.weather.humidity')} ${humidity.value}%`)
  if (windSpeed.value != null) parts.push(`${t('ui.weather.wind')} ${windSpeed.value}km/h`)
  if (forecast.value.length) {
    const days = forecast.value
      .slice(0, 3)
      .map((day) => `${day.date.slice(5)} ${Math.round(day.tempMin)}~${Math.round(day.tempMax)}°`)
    parts.push(days.join('  '))
  }
  return parts.join('\n')
})

const typhoonTip = computed(() => {
  if (typhoonLoading.value && !typhoonCount.value) return t('ui.typhoon.loading')
  if (!typhoonCount.value) return t('ui.typhoon.none')
  const names = typhoonList.value
    .slice(0, 3)
    .map((item) => `${item.name || item.id}${item.strong ? `（${item.strong}）` : ''}`)
  return `${t('ui.typhoon.active')} ${typhoonCount.value}\n${names.join('\n')}`
})

/** 拉取天气（失败静默：顶栏是增强信息，不该打扰用户） */
async function loadWeather(): Promise<void> {
  if (!showWeather.value || weatherLoading.value) return
  weatherLoading.value = true
  try {
    const data = await getWeatherOverview()
    weatherCode.value = data.weatherCode ?? null
    temperature.value = data.temperature ?? null
    feelsLike.value = data.feelsLike ?? null
    humidity.value = data.humidity ?? null
    windSpeed.value = data.windSpeed ?? null
    location.value = data.location || ''
    forecast.value = (data.daily || []).slice(0, 3)
  } catch {
    /* 保持上次数据 */
  } finally {
    weatherLoading.value = false
  }
}

/** 拉取活跃台风（失败按"无活跃台风"处理，接口不显示入口） */
async function loadTyphoon(): Promise<void> {
  if (!showTyphoon.value || typhoonLoading.value) return
  typhoonLoading.value = true
  try {
    typhoonList.value = await getActiveTyphoonList()
  } catch {
    typhoonList.value = []
  } finally {
    typhoonLoading.value = false
  }
}

onMounted(() => {
  void loadWeather()
  void loadTyphoon()
  weatherTimer = setInterval(() => void loadWeather(), WEATHER_INTERVAL)
  typhoonTimer = setInterval(() => void loadTyphoon(), TYPHOON_INTERVAL)
})

onBeforeUnmount(() => {
  if (weatherTimer) clearInterval(weatherTimer)
  if (typhoonTimer) clearInterval(typhoonTimer)
})
</script>
