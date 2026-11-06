<template>
  <el-popover
    placement="bottom-end"
    :width="440"
    trigger="hover"
    :offset="10"
    popper-class="koi-weather-popover"
    :show-arrow="false"
  >
    <template #reference>
      <div class="weather-trigger">
        <ReIcon v-if="weatherCode != null" :name="wmoToFluentIcon(weatherCode)" size="20" class="trigger-icon" />
        <el-icon v-else :size="16" class="trigger-icon"><Loading /></el-icon>
        <!-- 温度常驻顶栏（无数据/加载中为 `--`，数据就绪后直接展示实况温度） -->
        <span class="trigger-temp">
          {{ temp ?? '--' }}°C
        </span>
        </div>
      </template>

    <div class="kw-panel" v-loading="loading">
      <template v-if="hasWeather">
        <!-- ① 天区：定位 / 天气描述 + 大图标 + 大温度，下方三项玻璃指标卡 -->
        <section class="kw-hero" :class="`kw-hero--${heroScene}`">
          <i class="kw-hero__glow kw-hero__glow--a" aria-hidden="true"></i>
          <i class="kw-hero__glow kw-hero__glow--b" aria-hidden="true"></i>
          <!-- 天气动画层：两层做视差。仅装饰，场景类决定其背景与动画，默认 opacity:0 不显示 -->
          <i class="kw-hero__fx kw-hero__fx--far" aria-hidden="true"></i>
          <i class="kw-hero__fx kw-hero__fx--near" aria-hidden="true"></i>

          <div class="kw-hero__main">
            <div class="kw-hero__info">
              <span class="kw-hero__city">{{ location }}</span>
              <span class="kw-hero__desc">{{ weatherDesc }}</span>
            </div>
            <div class="kw-hero__icon">
              <el-tooltip :content="weatherDesc" placement="top" :show-after="150">
                <span class="kw-hero__icon-btn" role="img" :aria-label="weatherDesc">
                  <ReIcon :name="heroIcon" size="64" class="kw-hero__icon-svg" />
                </span>
              </el-tooltip>
            </div>
            <div class="kw-hero__temp">
              <span class="kw-hero__temp-num">{{ temp }}</span>
              <span class="kw-hero__temp-unit">°C</span>
            </div>
          </div>

          <div class="kw-metrics">
            <div v-for="item in metrics" :key="item.label" class="kw-metric">
              <el-tooltip :content="item.tip" placement="top" :show-after="150">
                <span class="kw-metric__icon" role="img" :aria-label="item.tip"><ReIcon :name="item.icon" size="15" /></span>
              </el-tooltip>
              <div class="kw-metric__body">
                <span class="kw-metric__label">{{ item.label }}</span>
                <span class="kw-metric__value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ② 逐小时 + 温度曲线 -->
        <section v-if="hourlyForecast.length" class="kw-section">
          <header class="kw-section__head">
            <span class="kw-section__title">逐小时</span>
            <span class="kw-section__extra">未来 24h</span>
          </header>

          <div ref="hoursEl" class="kw-hours">
            <div
              v-for="(item, index) in hourlyForecast"
              :key="index"
              :ref="(el) => setHourRef(el, index)"
              class="kw-hour"
              :class="{ 'is-now': item.isNow, 'is-past': item.isPast }"
            >
              <span class="kw-hour__time">{{ item.hour }}</span>
              <el-tooltip :content="hourTip(item)" placement="top" :show-after="150">
                <span class="kw-hour__icon" role="img" :aria-label="hourTip(item)">
                  <ReIcon :name="wmoToFluentIcon(item.weatherCode)" size="26" />
                </span>
              </el-tooltip>
              <span class="kw-hour__temp">{{ item.temp }}°</span>
            </div>
          </div>

          <div
            v-if="chart"
            class="kw-chart"
            @pointermove="onChartMove"
            @pointerleave="onChartLeave"
            @pointercancel="onChartLeave"
          >
            <svg class="kw-chart__svg" :viewBox="`0 0 ${CHART_W} ${CHART_H}`" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="koi-weather-area" x1="0" y1="0" x2="0" y2="1">
                  <stop class="kw-chart__stop-a" offset="0%" />
                  <stop class="kw-chart__stop-b" offset="100%" />
                </linearGradient>
              </defs>
              <path class="kw-chart__area" :d="chart.area" fill="url(#koi-weather-area)" />
              <path class="kw-chart__line kw-chart__line--ghost" :d="chart.feels" vector-effect="non-scaling-stroke" />
              <path class="kw-chart__line" :d="chart.line" vector-effect="non-scaling-stroke" />
            </svg>
            <i class="kw-chart__dot" :style="{ left: `${chart.dotX}%`, top: `${chart.dotY}%` }" aria-hidden="true"></i>

            <!-- 悬浮取数：竖线 + 跟随点 + 数据气泡 -->
            <template v-if="hoverPoint">
              <i class="kw-chart__guide" :style="{ left: `${hoverPoint.x}%` }" aria-hidden="true"></i>
              <i
                class="kw-chart__dot kw-chart__dot--hover"
                :style="{ left: `${hoverPoint.x}%`, top: `${hoverPoint.y}%` }"
                aria-hidden="true"
              ></i>
              <div
                class="kw-tip"
                :class="{ 'kw-tip--below': tipBelow }"
                :style="{ left: `${tipLeft}%`, top: `${hoverPoint.y}%` }"
              >
                <span class="kw-tip__time">{{ hoverPoint.item.hour }}</span>
                <span class="kw-tip__main">{{ wmoToDesc(hoverPoint.item.weatherCode) }} <b>{{ hoverPoint.item.temp }}°</b></span>
                <span class="kw-tip__sub">
                  体感 {{ hoverPoint.item.feelsLike }}°{{ hoverPoint.item.precip ? ` · 降水 ${hoverPoint.item.precip}mm` : "" }}
                </span>
              </div>
            </template>
          </div>
        </section>

        <!-- ③ 一周预报 -->
        <section v-if="forecast.length" class="kw-section">
          <header class="kw-section__head">
            <span class="kw-section__title">一周预报</span>
            <span class="kw-legend"><i class="kw-legend__dot" aria-hidden="true"></i>最低°/最高°</span>
          </header>

          <div class="kw-week">
            <div
              v-for="(item, index) in forecast"
              :key="item.date"
              class="kw-week__col"
            >
              <span class="kw-week__day">{{ index === 0 ? "今天" : item.day }}</span>
              <el-tooltip :content="weekTip(item, index)" placement="top" :show-after="150">
                <span class="kw-week__icon" role="img" :aria-label="weekTip(item, index)">
                  <ReIcon :name="wmoToFluentIcon(item.weatherCode)" size="28" />
                </span>
              </el-tooltip>
              <span class="kw-week__temp">
                <span class="kw-week__min">{{ item.tempMin }}°</span>
                <span class="kw-week__sep">/</span>
                <span class="kw-week__max">{{ item.tempMax }}°</span>
              </span>
            </div>
          </div>
        </section>

        <p class="kw-foot">更新于 {{ updatedAt }} · 每小时缓存</p>
      </template>

      <div v-else-if="!loading" class="kw-empty">
        <el-icon :size="14"><Warning /></el-icon>
        <span>天气数据暂不可用</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Loading, Warning } from "@element-plus/icons-vue";
import { useWeather, wmoToDesc } from "@repo/theme/composables/useWeather";
import { getGlobalTimer } from "@repo/work/timer";

const {
  weatherCode, temp, feelsLike, humidity, windSpeed, windDir,
  location, updatedAt, forecast, hourlyForecast, loading,
  hasWeather, weatherDesc,
  fetchWeather, markHourlyNow, wmoToFluentIcon,
} = useWeather();

/**
 * 天区大图标：命中 fluent filled 变体的天气图标。
 * 雪阵雨无 filled 变体（iconify fluent 集合），保持 regular。
 */
function wmoToHeroIcon(wmo: number | null | undefined): string {
  const regular = wmoToFluentIcon(wmo);
  if (regular === "fluent:weather-snow-showers-day-24-regular") return regular;
  return regular.replace("-24-regular", "-24-filled");
}

const heroIcon = computed(() => wmoToHeroIcon(weatherCode.value));

/**
 * 天区动画场景。
 *
 * WMO 代码有 20 多档，逐档写动画不现实，按「视觉上要区分得开」归并成 6 种：
 * clear 晴 / cloudy 多云阴 / fog 雾霾 / rain 雨 / snow 雪 / thunder 雷阵雨。
 * 归并口径与 wmoToFluentIcon 的分段保持一致（同一条分界线，避免图标说雨、
 * 背景却在飘云）。
 */
type HeroScene = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

function wmoToHeroScene(wmo: number | null | undefined): HeroScene {
  if (wmo == null) return "cloudy";
  if (wmo === 0) return "clear";
  if (wmo <= 3) return "cloudy";
  if (wmo <= 48) return "fog";
  if (wmo <= 57) return "rain";
  if (wmo <= 67) return "rain";
  if (wmo <= 77) return "snow";
  if (wmo <= 82) return "rain";
  if (wmo <= 86) return "snow";
  if (wmo <= 99) return "thunder";
  return "cloudy";
}

const heroScene = computed<HeroScene>(() => wmoToHeroScene(weatherCode.value));

/** 曲线/滚动/悬浮提示只消费的逐小时字段（部分 app 的 tsconfig 未映射 @repo/theme/*，此处显式收窄） */
interface HourlyPointLike {
  hour: string;
  temp: number;
  feelsLike: number;
  weatherCode: number;
  precip?: number;
  isNow: boolean;
}

/** 逐日悬浮提示只消费的字段 */
interface ForecastDayLike {
  day: string;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
  precipProb?: number;
}

/** 逐小时图标悬浮信息：时间 + 天气 + 温度（有降水追加） */
function hourTip(item: HourlyPointLike): string {
  const base = `${item.hour} ${wmoToDesc(item.weatherCode)} ${item.temp}°`;
  return item.precip ? `${base} · 降水 ${item.precip}mm` : base;
}

/** 逐日图标悬浮信息：日期 + 天气 + 最低/最高温（有降水概率追加） */
function weekTip(item: ForecastDayLike, index: number): string {
  const base = `${index === 0 ? "今天" : item.day} ${wmoToDesc(item.weatherCode)} ${item.tempMin}°/${item.tempMax}°`;
  return item.precipProb ? `${base} · 降水概率 ${item.precipProb}%` : base;
}

/** 三项指标卡（湿度 / 风速 / 体感），图标沿用系统 iconify 前缀约定；tip 为图标悬浮补充信息 */
const metrics = computed(() => [
  {
    label: "湿度",
    value: `${humidity.value ?? 0}%`,
    icon: "fluent:drop-24-regular",
    tip: `相对湿度 ${humidity.value ?? 0}% · 今日降水 ${forecast.value[0]?.precip ?? 0}mm`,
  },
  {
    label: "风速",
    value: `${windSpeed.value ?? 0}km/h`,
    icon: "humbleicons:wind",
    tip: `${windDir.value || "无持续风向"} · ${windSpeed.value ?? 0}km/h`,
  },
  {
    label: "体感",
    value: `${feelsLike.value ?? 0}°`,
    icon: "fluent:temperature-24-regular",
    tip: `体感 ${feelsLike.value ?? 0}°C · 实况 ${temp.value ?? 0}°C`,
  },
]);

/* ==================== 温度曲线（SVG 平滑折线 + 面积） ==================== */

/** 曲线坐标系宽高（等比缩放到容器，曲线描边用 non-scaling-stroke 保持粗细） */
const CHART_W = 100;
const CHART_H = 36;

interface ChartPaths {
  line: string;
  area: string;
  feels: string;
  dotX: number;
  dotY: number;
}

/** 曲线点（百分比坐标 + 原始数据）：路径生成与悬浮取数共用同一份归一化结果 */
interface ChartPoint {
  /** 横向百分比 0-100 */
  x: number;
  /** 实况温度纵向百分比 0-100 */
  y: number;
  /** 体感温度纵向百分比 0-100 */
  yFeels: number;
  item: HourlyPointLike;
}

const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Catmull-Rom → 三次贝塞尔，生成平滑路径 */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  let d = `M ${r2(points[0].x)} ${r2(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d +=
      ` C ${r2(p1.x + (p2.x - p0.x) / 6)} ${r2(p1.y + (p2.y - p0.y) / 6)},` +
      ` ${r2(p2.x - (p3.x - p1.x) / 6)} ${r2(p2.y - (p3.y - p1.y) / 6)},` +
      ` ${r2(p2.x)} ${r2(p2.y)}`;
  }
  return d;
}

const chartPoints = computed<ChartPoint[]>(() => {
  const list = (hourlyForecast.value ?? []) as HourlyPointLike[];
  if (list.length < 2) return [];

  const temps = list.map((p) => p.temp);
  const feels = list.map((p) => p.feelsLike);
  const min = Math.min(...temps, ...feels);
  const span = Math.max(Math.max(...temps, ...feels) - min, 1);
  const top = 5;
  const height = CHART_H - top - 7;
  const yPct = (v: number): number => ((top + height * (1 - (v - min) / span)) / CHART_H) * 100;

  return list.map((item, i) => ({
    x: r2((100 * i) / (list.length - 1)),
    y: r2(yPct(item.temp)),
    yFeels: r2(yPct(item.feelsLike)),
    item,
  }));
});

const chart = computed<ChartPaths | null>(() => {
  const points = chartPoints.value;
  if (points.length < 2) return null;

  const toView = (p: { x: number; y: number }): { x: number; y: number } => ({
    x: (p.x * CHART_W) / 100,
    y: (p.y * CHART_H) / 100,
  });
  const line = smoothPath(points.map(toView));
  const now = points.find((p) => p.item.isNow) ?? points[0];

  return {
    line,
    area: `${line} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`,
    feels: smoothPath(points.map((p) => toView({ x: p.x, y: p.yFeels }))),
    dotX: now.x,
    dotY: now.y,
  };
});

/* ==================== 曲线悬浮取数 ==================== */

/** 当前悬浮点下标（-1 = 未悬浮） */
const hoverIndex = ref(-1);

const hoverPoint = computed<ChartPoint | null>(() =>
  hoverIndex.value >= 0 ? chartPoints.value[hoverIndex.value] ?? null : null,
);

/** 气泡横向钳制，避免贴边溢出面板 */
const tipLeft = computed(() => Math.min(84, Math.max(16, hoverPoint.value?.x ?? 50)));

/** 点位靠上时气泡翻到下方，避免被面板上缘裁剪 */
const tipBelow = computed(() => (hoverPoint.value?.y ?? 0) < 40);

/** 指针位置 → 最近数据点（点等距分布，直接按比例取整） */
function onChartMove(event: PointerEvent): void {
  const count = chartPoints.value.length;
  if (count < 2) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  if (!rect.width) return;
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  hoverIndex.value = Math.round(ratio * (count - 1));
}

function onChartLeave(): void {
  hoverIndex.value = -1;
}

/* ==================== 逐小时横向滚动：初始定位到当前小时 ==================== */

const hoursEl = ref<HTMLElement | null>(null);
const hourEls: Array<HTMLElement | null> = [];

function setHourRef(el: unknown, index: number): void {
  hourEls[index] = (el as HTMLElement | null) ?? null;
}

function scrollToNow(): void {
  const index = (hourlyForecast.value as HourlyPointLike[]).findIndex((item) => item.isNow);
  if (index < 0) return;
  nextTick(() => {
    const parent = hoursEl.value;
    const target = hourEls[index];
    if (!parent || !target) return;
    parent.scrollTo({
      left: target.offsetLeft - (parent.clientWidth - target.clientWidth) / 2,
      behavior: "smooth",
    });
  });
}

watch(hourlyForecast, () => scrollToNow(), { immediate: true });

let unsubscribeTimer: (() => void) | null = null;

onMounted(async () => {
  await fetchWeather();
  scrollToNow();
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
/* ==================== 触发器（顶栏） ==================== */
.weather-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 36px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: var(--el-radius-sm, 6px);
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .trigger-icon {
    width: 20px;
    height: 20px;
    color: var(--el-header-text-color, var(--el-text-color-primary));
    object-fit: contain;
    transition:
      transform 0.3s ease,
      color 0.2s ease;
  }

  .trigger-temp {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-header-text-color, var(--el-text-color-primary));
    letter-spacing: 0.5px;
  }

  &:hover {
    background: var(--el-header-icon-hover-bg-color, var(--el-fill-color-light));

    .trigger-icon {
      color: var(--el-color-primary);
      transform: scale(1.06);
    }
  }

  &:active {
    transform: scale(0.96);
  }
}

/* ==================== 面板容器 ==================== */
.kw-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(76vh, 640px);
  padding: 12px;
  overflow-y: auto;
  background: var(--el-bg-color);
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color-dark) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-dark);
    border-radius: var(--el-radius-sm, 6px);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* ==================== ① 天区 ==================== */
.kw-hero {
  position: relative;
  padding: 16px;
  overflow: hidden;
  color: var(--el-color-white);
  border-radius: var(--el-radius-xl, 16px);
  background:
    radial-gradient(120% 95% at 88% -12%, var(--el-color-primary-light-3) 0%, transparent 58%),
    linear-gradient(
      160deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 58%,
      var(--el-color-primary-light-5) 100%
    );

  &__glow {
    position: absolute;
    border-radius: 50%;
    background: color-mix(in srgb, var(--el-color-white) 18%, transparent);
    pointer-events: none;

    &--a {
      top: -46px;
      right: -30px;
      width: 130px;
      height: 130px;
    }

    &--b {
      bottom: -56px;
      left: -34px;
      width: 150px;
      height: 150px;
      opacity: 0.55;
    }
  }

  /* ---------- 天气动画层 ----------
     两层做视差（--far 慢而淡、--near 快而明显）。
     颗粒图案一律用「垂直等距重复渐变 / background-size 平铺」，
     动画位移取一个完整节距，保证循环无跳变（不靠肉眼调参试出来的）。
     默认 opacity:0：没命中场景时不渲染任何东西，也不占合成层。 */
  &__fx {
    position: absolute;
    inset: -30% -20%;
    pointer-events: none;
    opacity: 0;
    will-change: transform, opacity;
  }

  /* 场景配色：只做「氛围染色」，底色仍是深色渐变，白字才读得清。
     色标是按「最浅一档 + 白字 ≥ 4.5:1」反推出来的，不是随手挑的 ——
     改动前的原设计用 --el-color-primary-light-5(#a0cfff) 收尾，
     白字实测只有 1.47:1，属于既有缺陷，这里一并修掉。 */
  &--clear {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, #ffd35c 26%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #0b3a63 0%, #114d80 58%, #16608f 100%);
  }

  &--cloudy {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 18%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #2f3d4d 0%, #3d4e63 58%, #4c607a 100%);
  }

  &--fog {
    background:
      radial-gradient(130% 100% at 88% -12%, color-mix(in srgb, var(--el-color-white) 16%, transparent) 0%, transparent 60%),
      linear-gradient(160deg, #3a4147 0%, #485057 58%, #565f66 100%);
  }

  &--rain {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 14%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #1a2b3b 0%, #233a4c 58%, #2d4a60 100%);
  }

  &--snow {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 20%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #26374a 0%, #32485e 58%, #3f5a72 100%);
  }

  &--thunder {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 12%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #161a28 0%, #202438 58%, #2b3148 100%);
  }

  /* 晴：极慢自转的光束扫过 */
  &--clear &__fx--far {
    opacity: 1;
    background-image: conic-gradient(
      from 0deg,
      transparent 0 14deg,
      color-mix(in srgb, #ffe9a8 22%, transparent) 14deg 19deg,
      transparent 19deg 46deg
    );
    animation: kw-sun-spin 44s linear infinite;
  }

  /* 多云 / 阴 / 雾：扁平的雾团横向漂移（雾更扁更淡、云团更立体） */
  &--cloudy &__fx--far,
  &--fog &__fx--far {
    opacity: 1;
    background-image:
      radial-gradient(60% 34% at 22% 34%, color-mix(in srgb, var(--el-color-white) 24%, transparent) 0%, transparent 70%),
      radial-gradient(52% 28% at 68% 62%, color-mix(in srgb, var(--el-color-white) 18%, transparent) 0%, transparent 72%);
    animation: kw-cloud-drift 26s ease-in-out infinite;
  }

  &--cloudy &__fx--near,
  &--fog &__fx--near {
    opacity: 1;
    background-image: radial-gradient(46% 26% at 46% 70%, color-mix(in srgb, var(--el-color-white) 16%, transparent) 0%, transparent 74%);
    animation: kw-cloud-drift-rev 19s ease-in-out infinite;
  }

  /* 雾：整体更扁更慢，贴近「霾」而非「云」 */
  &--fog &__fx--far {
    opacity: 0.7;
    animation-duration: 38s;
  }

  &--fog &__fx--near {
    opacity: 0.6;
    animation-duration: 30s;
  }

  /* 雨 / 雷雨：斜向雨丝，节距 13px，位移取整数倍节距 → 循环无跳变 */
  &--rain &__fx--near,
  &--thunder &__fx--near {
    opacity: 1;
    background-image: repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--el-color-white) 34%, transparent) 0 1.5px,
      transparent 1.5px 13px
    );
    animation: kw-fall 0.62s linear infinite;
  }

  &--rain &__fx--far,
  &--thunder &__fx--far {
    opacity: 1;
    background-image: repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--el-color-white) 18%, transparent) 0 1px,
      transparent 1px 19px
    );
    animation: kw-fall-far 1.05s linear infinite;
  }

  /* 雪：平铺圆点，位移 = background-size 的高度 → 无跳变 */
  &--snow &__fx--near {
    opacity: 1;
    background-image: radial-gradient(circle, color-mix(in srgb, var(--el-color-white) 92%, transparent) 0 1.7px, transparent 2.2px);
    background-size: 26px 30px;
    animation: kw-snow 3.4s linear infinite;
  }

  &--snow &__fx--far {
    opacity: 1;
    background-image: radial-gradient(circle, color-mix(in srgb, var(--el-color-white) 62%, transparent) 0 1.2px, transparent 1.7px);
    background-size: 41px 47px;
    animation: kw-snow-far 6.2s linear infinite;
  }

  /* 雷雨：雨丝之外，间歇闪电（只闪右上那团光晕，不整屏闪） */
  &--thunder &__glow--a {
    animation: kw-flash 7s linear infinite;
  }

  /* ---------- 暗色模式 ----------
     场景渐变整体再压暗一档；颗粒同时调亮，否则深底上雨丝几乎看不见。 */
  html.dark &--clear {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, #ffd35c 22%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #0a3252 0%, #0e4570 58%, #135a8c 100%);
  }

  html.dark &--cloudy {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 12%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #27333f 0%, #323f4f 58%, #3e4c60 100%);
  }

  html.dark &--fog {
    background:
      radial-gradient(130% 100% at 88% -12%, color-mix(in srgb, var(--el-color-white) 10%, transparent) 0%, transparent 60%),
      linear-gradient(160deg, #30363b 0%, #3c4249 58%, #484f57 100%);
  }

  html.dark &--rain {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 10%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #141f29 0%, #1c2c3a 58%, #243a4b 100%);
  }

  html.dark &--snow {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 16%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #202c38 0%, #2b3b4c 58%, #384c60 100%);
  }

  html.dark &--thunder {
    background:
      radial-gradient(120% 95% at 88% -12%, color-mix(in srgb, var(--el-color-white) 10%, transparent) 0%, transparent 58%),
      linear-gradient(160deg, #0f1118 0%, #171a24 58%, #212633 100%);
  }

  /* 深底上颗粒要更实一点才看得见 */
  html.dark &--rain &__fx--near {
    background-image: repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--el-color-white) 46%, transparent) 0 1.5px,
      transparent 1.5px 13px
    );
  }

  html.dark &--rain &__fx--far,
  html.dark &--thunder &__fx--far {
    background-image: repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--el-color-white) 28%, transparent) 0 1px,
      transparent 1px 19px
    );
  }

  &__main {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 6px;
    align-items: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__city {
    overflow: hidden;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 天区文字一律不低于 90% 白：13px 的描述属于小字，需 ≥4.5:1。
     原先 78%/80%/82% 的「层次感」是靠牺牲对比度换来的，实测不达标。 */
  &__desc {
    font-size: 13px;
    color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 6px 16px color-mix(in srgb, var(--el-color-primary-dark-2, var(--el-color-primary)) 45%, transparent));
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon-svg {
    color: var(--el-color-white);
  }

  &__temp {
    display: flex;
    align-items: flex-start;
    justify-self: end;
    font-variant-numeric: tabular-nums;
  }

  &__temp-num {
    font-size: 46px;
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -1px;
  }

  &__temp-unit {
    margin-top: 6px;
    font-size: 15px;
    font-weight: 600;
    color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
  }
}

/* ==================== 天气动画关键帧 ==================== */
/* 位移一律取「图案节距的整数倍」，否则循环边界会跳一下 */
@keyframes kw-fall {
  from {
    transform: skewX(-11deg) translateY(-13px);
  }

  to {
    transform: skewX(-11deg) translateY(13px);
  }
}

/* 远层雨：节距 19px（与近层的 13px 不同），位移必须换成 2×19=38px，
   否则一个周期的位移不是节距整数倍，循环边界会横向跳一下。 */
@keyframes kw-fall-far {
  from {
    transform: skewX(-8deg) translateY(-19px);
  }

  to {
    transform: skewX(-8deg) translateY(19px);
  }
}

@keyframes kw-snow {
  from {
    transform: translate3d(0, -30px, 0);
  }

  to {
    transform: translate3d(0, 30px, 0);
  }
}

/* 远层雪：平铺高度 47px → 位移取 2×47=94px */
@keyframes kw-snow-far {
  from {
    transform: translate3d(0, -47px, 0);
  }

  to {
    transform: translate3d(0, 47px, 0);
  }
}

@keyframes kw-sun-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes kw-cloud-drift {
  0%,
  100% {
    transform: translate3d(-6%, 0, 0);
  }

  50% {
    transform: translate3d(7%, -3%, 0);
  }
}

@keyframes kw-cloud-drift-rev {
  0%,
  100% {
    transform: translate3d(5%, 2%, 0);
  }

  50% {
    transform: translate3d(-6%, -2%, 0);
  }
}

/* 闪电：绝大部分时间保持常亮，只在极短窗口内瞬暗再回亮 */
@keyframes kw-flash {
  0%,
  87%,
  100% {
    opacity: 1;
  }

  88% {
    opacity: 0.22;
  }

  89.5% {
    opacity: 1;
  }

  91% {
    opacity: 0.34;
  }

  93% {
    opacity: 1;
  }
}

/* 尊重「减少动态效果」系统偏好：关掉所有天气动画，
   但保留场景配色（配色是信息，不是动效） */
@media (prefers-reduced-motion: reduce) {
  .kw-hero__fx,
  .kw-hero--thunder .kw-hero__glow--a {
    animation: none !important;
  }

  .kw-hero__fx {
    opacity: 0 !important;
  }
}

/* ==================== 三项玻璃指标卡 ==================== */
.kw-metrics {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.kw-metric {
  display: flex;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding: 9px 8px;
  /* 玻璃卡用「压暗」而不是「提亮」：天区底色本身已是深色，
     再叠 20% 白会把卡内小字对比度拉到 3.2~3.5:1（需 4.5）。
     改成黑色半透明overlay 既保留玻璃质感，又把卡内白字对比度抬到 5:1 以上。 */
  background: color-mix(in srgb, #000 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-white) 26%, transparent);
  border-radius: var(--el-radius-lg, 12px);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    /* 深一档的主色：#409eff 压在近白圆底上只有 2.78:1（图形需 ≥3:1） */
    color: var(--el-color-primary-dark-2, #337ecc);
    background: color-mix(in srgb, var(--el-color-white) 92%, transparent);
    border-radius: 50%;
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__label {
    font-size: 11px;
    line-height: 1.2;
    color: color-mix(in srgb, var(--el-color-white) 94%, transparent);
  }

  &__value {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
}

/* ==================== 分节通用 ==================== */
.kw-section {
  display: flex;
  flex-direction: column;
}

.kw-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.kw-section__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.kw-section__extra {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ==================== ② 逐小时 ==================== */
.kw-hours {
  display: flex;
  gap: 7px;
  margin: 0 -2px;
  padding: 2px 2px 6px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.kw-hour {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  width: 58px;
  padding: 9px 0;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition:
    border-color var(--el-transition-duration, 0.2s),
    background-color var(--el-transition-duration, 0.2s),
    transform var(--el-transition-duration, 0.2s);

  &__time {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    font-variant-numeric: tabular-nums;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 26px;
    color: var(--el-text-color-primary);
  }

  &__temp {
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &.is-past {
    opacity: 0.5;
  }

  &.is-now {
    color: var(--el-color-white);
    background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    border-color: transparent;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 30%, transparent);

    .kw-hour__time,
    .kw-hour__icon {
      color: var(--el-color-white);
    }
  }

  &:not(.is-now):hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }
}

/* ==================== 温度曲线 ==================== */
.kw-chart {
  position: relative;
  height: 92px;
  margin-top: 2px;
  cursor: crosshair;

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__stop-a {
    stop-color: var(--el-color-primary);
    stop-opacity: 0.32;
  }

  &__stop-b {
    stop-color: var(--el-color-primary);
    stop-opacity: 0;
  }

  &__line {
    fill: none;
    stroke: var(--el-color-primary);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__line--ghost {
    stroke: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    stroke-width: 1.5;
  }

  &__dot {
    position: absolute;
    width: 11px;
    height: 11px;
    pointer-events: none;
    background: var(--el-bg-color);
    border: 3px solid var(--el-color-primary);
    border-radius: 50%;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
    transform: translate(-50%, -50%);
  }

  /* 悬浮跟随点：略大、光环加强 */
  &__dot--hover {
    z-index: 1;
    width: 13px;
    height: 13px;
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  }

  /* 悬浮竖向指示线 */
  &__guide {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    pointer-events: none;
    background: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    transform: translateX(-50%);
  }
}

/* 曲线数据气泡（跟随悬浮点） */
.kw-tip {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: center;
  padding: 5px 9px;
  pointer-events: none;
  white-space: nowrap;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  box-shadow: var(--el-box-shadow-light);
  transform: translate(-50%, calc(-100% - 12px));

  &--below {
    transform: translate(-50%, 12px);
  }

  &__time {
    font-size: 10px;
    line-height: 1.3;
    color: var(--el-text-color-secondary);
    font-variant-numeric: tabular-nums;
  }

  &__main {
    font-size: 12px;
    line-height: 1.35;
    color: var(--el-text-color-primary);

    b {
      font-weight: 700;
      color: var(--el-color-primary);
    }
  }

  &__sub {
    font-size: 10px;
    line-height: 1.3;
    color: var(--el-text-color-placeholder);
    font-variant-numeric: tabular-nums;
  }
}

/* ==================== ③ 一周预报 ==================== */
.kw-legend {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.kw-legend__dot {
  width: 7px;
  height: 7px;
  background: var(--el-text-color-placeholder);
  border-radius: 50%;
}

.kw-week {
  display: flex;
  align-items: stretch;
}

.kw-week__col {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding: 4px 2px 2px;

  & + & {
    border-left: 1px solid var(--el-border-color-extra-light);
  }
}

.kw-week__day {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.kw-week__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  color: var(--el-text-color-primary);
}

.kw-week__temp {
  display: flex;
  gap: 1px;
  align-items: baseline;
  font-size: 12px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.kw-week__min {
  color: var(--el-text-color-secondary);
}

.kw-week__sep {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.kw-week__max {
  font-weight: 700;
  color: var(--el-text-color-primary);
}

/* ==================== 页脚 / 空态 ==================== */
.kw-foot {
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.kw-empty {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>

<style lang="scss">
/* popover 外框（teleport 到 body，须用非 scoped 样式） */
.koi-weather-popover {
  padding: 0 !important;
  overflow: hidden;
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: var(--el-radius-xl, 16px) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}
</style>
