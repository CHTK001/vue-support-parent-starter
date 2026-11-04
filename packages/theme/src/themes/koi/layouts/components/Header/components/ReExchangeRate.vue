<template>
  <el-popover
    placement="bottom-end"
    :width="440"
    trigger="hover"
    :offset="10"
    popper-class="koi-exchange-rate-popover"
    :show-arrow="false"
    :disabled="!hasRates"
  >
    <template #reference>
      <div class="koi-exchange-rate-trigger">
        <ReIcon name="ep:Money" size="20" class="trigger-icon" />
        <span v-if="hasRates" class="trigger-rate">
          {{ formatPrice(activePoint?.rate) }}
        </span>
        <span
          v-if="hasRates && activePoint?.change"
          class="trigger-change"
          :class="`is-${changeTone(activePoint?.change)}`"
        >
          {{ formatPercent(activePoint?.changePercent) }}
        </span>
        <!-- 数据来源标记：三方兜底时亮灯 -->
        <i class="koi-exchange-rate-trigger__source" :class="`is-${source}`" />
      </div>
    </template>

    <div class="koi-er-panel" v-loading="loading">
      <template v-if="hasRates">
        <!-- ① 选中币种大字区：汇率 + 涨跌 + 周期极值 + 迷你走势 -->
        <section class="koi-er-hero" :class="`is-${changeTone(activePoint?.change)}`">
          <div class="koi-er-hero__main">
            <div class="koi-er-hero__pair">{{ activePoint?.symbol }}</div>
            <div class="koi-er-hero__board">
              <div class="koi-er-hero__rate">{{ formatPrice(activePoint?.rate) }}</div>
              <div class="koi-er-hero__change">
                <span class="koi-er-hero__change-icon">
                  <svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
                    <polyline :points="changeArrowPoints" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span>{{ formatPercent(activePoint?.changePercent) }}</span>
                <span class="koi-er-hero__change-amount">{{ changeAmountOf(activePoint) }}</span>
              </div>
            </div>
          </div>

          <div class="koi-er-hero__stats">
            <div class="koi-er-hero__stat">
              <span class="koi-er-hero__stat-label">{{ highLabel }}</span>
              <span class="koi-er-hero__stat-value">{{ formatPrice(activePoint?.high) }}</span>
            </div>
            <div class="koi-er-hero__stat">
              <span class="koi-er-hero__stat-label">{{ lowestLabel }}</span>
              <span class="koi-er-hero__stat-value">{{ formatPrice(activePoint?.low) }}</span>
            </div>
          </div>

          <!-- 迷你趋势线：选中币种的历史日序列 -->
          <div class="koi-er-hero__chart" v-if="activePoint">
            <svg class="koi-er-hero__svg" :viewBox="`0 0 ${CHART_W} ${CHART_H}`" preserveAspectRatio="none">
              <defs>
                <linearGradient id="koi-er-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--el-color-primary)" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="var(--el-color-primary)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polyline class="koi-er-hero__line" :points="trendPoints" vector-effect="non-scaling-stroke" />
              <path
                class="koi-er-hero__area"
                :d="trendArea"
                fill="url(#koi-er-area-grad)"
                stroke="none"
              />
            </svg>
            <!-- 高/低点标记（HTML 圆点，避开 preserveAspectRatio=none 的椭圆化） -->
            <i
              v-for="marker in trendMarkers"
              :key="marker.key"
              class="koi-er-hero__marker"
              :class="marker.key"
              :style="{ left: `${marker.left}%`, top: `${marker.top}%` }"
              aria-hidden="true"
            />
          </div>
        </section>

        <!-- ② 周期切换 -->
        <div class="koi-er-period">
          <button
            v-for="p in PERIODS"
            :key="p"
            type="button"
            class="koi-er-period__btn"
            :class="{ 'is-active': period === p }"
            @click="setPeriod(p)"
          >
            {{ periodLabel(p) }}
          </button>
        </div>

        <!-- ③ 币种列表 -->
        <ul class="koi-er-list">
          <li
            v-for="point in rates"
            :key="point.symbol"
            class="koi-er-row"
            :class="{ 'is-selected': point.symbol === selectedSymbol }"
            @click="selectSymbol(point.symbol)"
          >
            <div class="koi-er-row__pair">{{ point.symbol }}</div>
            <div class="koi-er-row__body">
              <div class="koi-er-row__rate">{{ formatPrice(point.rate) }}</div>
              <div class="koi-er-row__change" :class="`is-${changeTone(point.change)}`">
                <span>{{ formatPercent(point.changePercent) }}</span>
              </div>
            </div>
            <div class="koi-er-row__hl">
              <span class="koi-er-row__hl-label">{{ highLabel }}</span>
              <span class="koi-er-row__hl-value">{{ formatPrice(point.high) }}</span>
              <span class="koi-er-row__hl-sep">/</span>
              <span class="koi-er-row__hl-label">{{ lowestLabel }}</span>
              <span class="koi-er-row__hl-value">{{ formatPrice(point.low) }}</span>
            </div>
          </li>
        </ul>

        <p class="koi-er-foot">
          更新于 {{ updatedAt }} · {{ source === "frankfurter" ? "来源 frankfurter" : "来源 后台" }}
        </p>
      </template>

      <div v-else-if="!loading" class="koi-er-empty">
        <el-icon :size="14"><Warning /></el-icon>
        <span>{{ t("header.exchangeRate.empty") }}</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Warning } from "@element-plus/icons-vue";
import { useExchangeRate } from "@repo/theme/composables/useExchangeRate";

const { t } = useI18n();

/** 周期候选（1m/3m/6m/12m） */
const PERIODS: readonly ("1m" | "3m" | "6m" | "12m")[] = ["1m", "3m", "6m", "12m"];

const {
  rates,
  history,
  period,
  selectedSymbol,
  source,
  updatedAt,
  loading,
  hasRates,
  formatPrice,
  formatPercent,
  changeTone,
  periodLabel,
  fetchOverview,
  setPeriod,
} = useExchangeRate();

/** 挂载即取数（与 ReWeather 同节奏：顶栏一出现就拉概览，命中缓存则秒开） */
onMounted(() => {
  void fetchOverview();
});

/** 涨跌箭头：上涨上指、下跌下指、平横线 */
const changeArrowPoints = computed(() => {
  const tone = changeTone(activePoint.value?.change);
  return tone === "up" ? "1,5 5,1 9,5" : tone === "down" ? "1,3 5,7 9,3" : "1,4 11,4";
});

/** 涨跌额文案（包含正负号） */
function changeAmountOf(point: (typeof rates.value)[number] | undefined): string {
  if (point == null || Number.isNaN(point.change)) return "--";
  return `${point.change > 0 ? "+" : ""}${point.change.toFixed(2)}`;
}

/** 当前展示币种：优先用户选中，未选中回退到列表首项（hero 与走势图共用） */
const activePoint = computed(() => {
  const list = rates.value;
  if (!list.length) return undefined;
  return list.find((p) => p.symbol === selectedSymbol.value) ?? list[0];
});

/** 选中币种（点击列表项切换 hero 与走势图） */
function selectSymbol(symbol: string): void {
  selectedSymbol.value = symbol;
}

/** 汇率面板图表坐标系：与 ReWeather 温度曲线同口径（viewBox = 0 0 100 36） */
const CHART_W = 100;
const CHART_H = 36;
/** 曲线与 panel 边缘的留白（归一化后直接落 viewBox 单位） */
const CHART_PAD = 4;

/**
 * 走势矩阵：把历史日序列拍平成 panel 坐标（横向 0-100 等距，纵向 0-36 等比缩放）
 */
const trendMatrix = computed(() => {
  const list = history.value[activePoint.value?.symbol ?? selectedSymbol.value ?? ""] ?? [];
  if (list.length < 2) return null;
  const valid = list.filter((p) => !Number.isNaN(p.rate));
  if (valid.length < 2) return null;
  const min = Math.min(...valid.map((p) => p.rate));
  const max = Math.max(...valid.map((p) => p.rate));
  const span = Math.max(max - min, 0.0001);
  const height = CHART_H - 2 * CHART_PAD;
  return valid.map((p, i) => ({
    date: p.date,
    rate: p.rate,
    x: (100 * i) / (valid.length - 1),
    /** y 直接落在 viewBox 单位内：高价顶线（pad）、低价底线（pad + height） */
    y: CHART_PAD + height * (1 - (p.rate - min) / span),
  }));
});

/** 走势线（SVG polyline points 串） */
const trendPoints = computed(() =>
  trendMatrix.value ? trendMatrix.value.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") : "",
);

/** 走势面积（折线 → 底部闭合） */
const trendArea = computed(() => {
  if (!trendMatrix.value) return "";
  const line = trendMatrix.value.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  return `${line} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;
});

/**
 * 高/低点标记（HTML 圆点百分比坐标，避开 preserveAspectRatio=none 的椭圆化）
 *
 * <p>x 已是 0-100 的横向百分比；y 是 viewBox 单位（0-36），换算成高度百分比。</p>
 */
const trendMarkers = computed(() => {
  const list = trendMatrix.value;
  if (!list) return [];
  const max = Math.max(...list.map((p) => p.rate));
  const min = Math.min(...list.map((p) => p.rate));
  const rs: Array<{ key: string; left: number; top: number }> = [];
  for (const p of list) {
    const top = (p.y / CHART_H) * 100;
    if (Math.abs(p.rate - max) < 1e-9) rs.push({ key: "high", left: p.x, top });
    if (Math.abs(p.rate - min) < 1e-9) rs.push({ key: "low", left: p.x, top });
  }
  return rs;
});

/** 高/低标签 */
const highLabel = computed(() => "最高");
const lowestLabel = computed(() => "最低");
</script>

<style lang="scss" scoped>
/* ==================== 触发器（顶栏） ==================== */
.koi-exchange-rate-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: var(--el-radius-sm, 6px);
  transition:
    background-color var(--el-header-icon-hover-bg-color, var(--el-fill-color-light, #f5f7fa)) 0.2s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .trigger-icon {
    width: 20px;
    height: 20px;
    color: var(--el-header-text-color, var(--el-text-color-primary));
    object-fit: contain;
    transition:
      transform 0.3s ease,
      color 0.2s ease;
    z-index: 1;
  }

  .trigger-rate {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-header-text-color, var(--el-text-color-primary));
    letter-spacing: 0.5px;
  }

  .trigger-change {
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-color-success, #67c23a);
  }

  .trigger-change.is-up {
    color: var(--el-color-success, #67c23a);
  }

  .trigger-change.is-down {
    color: var(--el-color-danger, #f56c6c);
  }

  .trigger-change.is-flat {
    color: var(--el-text-color-secondary, #909399);
  }

  /* 来源标记：三方兜底时亮黄灯 */
  .koi-exchange-rate-trigger__source {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: transparent;
    box-shadow: none;

    &.is-frankfurter {
      background: var(--el-color-warning, #e6a23c);
      box-shadow: 0 0 4px var(--el-color-warning, #e6a23c);
    }

    &.is-backend {
      background: var(--el-color-success, #67c23a);
      box-shadow: 0 0 4px var(--el-color-success, #67c23a);
    }
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
.koi-er-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(76vh, 520px);
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

/* ==================== ① 选中币种大字区 ==================== */
.koi-er-hero {
  position: relative;
  padding: 16px;
  overflow: hidden;
  color: var(--el-color-white);
  border-radius: var(--el-radius-xl, 16px);
  background: linear-gradient(
    160deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 58%,
    var(--el-color-primary-light-5) 100%
  );

  &__main {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: baseline;
  }

  &__pair {
    font-size: 15px;
    font-weight: 700;
    color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
  }

  &__board {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: baseline;
  }

  &__rate {
    font-size: 34px;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }

  &__change {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
  }

  &__change-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: color-mix(in srgb, var(--el-color-white) 100%, transparent);
  }

  &__change-amount {
    color: color-mix(in srgb, var(--el-color-white) 100%, transparent);
  }

  &__stats {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: color-mix(in srgb, var(--el-color-white) 64%, transparent);
  }

  &__stat-value {
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* 高/低点位标记底 */
  &__chart {
    position: relative;
    z-index: 1;
    height: 36px;
    margin-top: 10px;
    color: var(--el-color-white);
  }

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  &__line {
    fill: none;
    stroke: color-mix(in srgb, var(--el-color-white) 100%, transparent);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__area {
    stroke: none;
  }

  /* 高/低点标记：HTML 圆点，按百分比定位（避免 viewBox 横向拉伸成椭圆） */
  &__marker {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-white);
    box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--el-color-white) 30%, transparent);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  &__marker.high {
    background: var(--el-color-success, #67c23a);
  }

  &__marker.low {
    background: var(--el-color-danger, #f56c6c);
  }

  /* 深底上更实一点 */
  html.dark &__stats,
  html.dark &__chart {
    color: var(--el-color-white);
  }
}

/* 涨跌色：只在深底降低饱和度，避免白字对比度不足 */
html.dark .koi-er-hero {
  background: linear-gradient(
    160deg,
    var(--el-color-primary-dark-2, #25485c) 0%,
    var(--el-color-primary-light-3, #2d5f7a) 58%,
    var(--el-color-primary-light-5, #346882) 100%
  );
}

/* ==================== ② 周期切换 ==================== */
.koi-er-period {
  display: flex;
  gap: 6px;
  padding: 2px 0;
}

.koi-er-period__btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition:
    color var(--el-transition-duration, 0.2s),
    background-color var(--el-transition-duration, 0.2s);

  &:hover {
    color: var(--el-text-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }

  &.is-active {
    color: var(--el-color-white);
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

/* ==================== ③ 币种列表 ==================== */
.koi-er-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.koi-er-row {
  display: grid;
  grid-template-areas:
    "pair rate change hl";
  grid-template-columns: minmax(0, 70px) minmax(0, 80px) minmax(0, 80px) 1fr;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  transition:
    border-color var(--el-transition-duration, 0.2s),
    background-color var(--el-transition-duration, 0.2s);

  &__pair {
    grid-area: pair;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    grid-area: rate;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__rate {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__change {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  &__change.is-up {
    color: var(--el-color-success, #67c23a);
  }

  &__change.is-down {
    color: var(--el-color-danger, #f56c6c);
  }

  &__change.is-flat {
    color: var(--el-text-color-placeholder);
  }

  &__hl {
    grid-area: hl;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    font-variant-numeric: tabular-nums;

    .koi-er-row__hl-label {
      font-weight: 400;
    }

    .koi-er-row__hl-value {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .koi-er-row__hl-sep {
      font-size: 9px;
      color: var(--el-text-color-placeholder);
      padding: 0 2px;
    }
  }

  & + & {
    /* 等距 */
  }

  &.is-selected {
    border-color: var(--el-color-primary-light-7);
    background: var(--el-color-primary-light-9);

    .koi-er-row__pair {
      color: var(--el-color-primary);
    }
  }

  &:hover:not(.is-selected) {
    border-color: var(--el-border-color-light);
    background: var(--el-fill-color-extra-light);
  }
}

/* ==================== 页脚 / 空态 ==================== */
.koi-er-foot {
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.koi-er-empty {
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
.koi-exchange-rate-popover {
  padding: 0 !important;
  overflow: hidden;
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: var(--el-radius-xl, 16px) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}
</style>
