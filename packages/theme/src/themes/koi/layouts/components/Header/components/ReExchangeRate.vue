<template>
  <el-popover
    placement="bottom-end"
    :width="440"
    trigger="click"
    :offset="10"
    popper-class="koi-exchange-rate-popover"
    :show-arrow="false"
  >
    <template #reference>
      <!-- 顶栏触发器：两枚咬合的硬币（基准币 / 计价币）+ 「1 = 汇率」+ 涨幅 -->
      <div class="koi-exchange-rate-trigger" :title="triggerTitle">
        <span class="trigger-pair" aria-hidden="true">
          <i class="trigger-pair__coin is-base">{{ headBaseSign }}</i>
          <i class="trigger-pair__coin is-quote">{{ headQuoteSign }}</i>
        </span>
        <span class="trigger-expr">
          <b class="trigger-expr__one">1</b>
          <span class="trigger-expr__eq">=</span>
          <b class="trigger-expr__rate">{{ formatPrice(headPoint?.rate) }}</b>
        </span>
        <span
          v-if="headPoint"
          class="trigger-change"
          :class="`is-${changeTone(headPoint?.change)}`"
        >
          {{ formatPercent(headPoint?.changePercent) }}
        </span>
        <!-- 数据来源标记：三方兜底时亮灯 -->
        <i class="koi-exchange-rate-trigger__source" :class="`is-${source}`" />
      </div>
    </template>

    <div class="koi-er-panel" v-loading="loading">
      <!-- ① 币种选择视图：搜索 + 全量目录（不进二级弹层，避免被外层 popover 裁切） -->
      <template v-if="pickerOpen">
        <div class="koi-er-picker__head">
          <button type="button" class="koi-er-picker__back" @click="closePicker">
            <el-icon :size="12"><ArrowLeft /></el-icon>
            <span>{{ t("header.exchangeRate.back") }}</span>
          </button>
          <span class="koi-er-picker__title">
            {{ pickerSide === "from" ? t("header.exchangeRate.pickFrom") : t("header.exchangeRate.pickTo") }}
          </span>
        </div>

        <label class="koi-er-search">
          <el-icon class="koi-er-search__icon" :size="13"><Search /></el-icon>
          <input
            v-model="pickerQuery"
            class="koi-er-search__input"
            :placeholder="t('header.exchangeRate.search')"
            :aria-label="t('header.exchangeRate.search')"
          />
          <button v-if="pickerQuery" type="button" class="koi-er-search__clear" @click="pickerQuery = ''">×</button>
        </label>

        <ul class="koi-er-curlist">
          <li
            v-for="item in pickerList"
            :key="item.code"
            class="koi-er-curlist__item"
            :class="{ 'is-active': item.code === pickerCurrent }"
            @click="pickCurrency(item.code)"
          >
            <i class="koi-er-curlist__sign" aria-hidden="true">{{ item.sign }}</i>
            <span class="koi-er-curlist__code">{{ item.code }}</span>
            <span class="koi-er-curlist__name">{{ item.name }}</span>
            <el-icon v-if="item.code === pickerCurrent" class="koi-er-curlist__check" :size="13"><Check /></el-icon>
          </li>
        </ul>

        <p v-if="!pickerList.length" class="koi-er-picker__empty">{{ t("header.exchangeRate.searchEmpty") }}</p>
      </template>

      <template v-else-if="hasRates">
        <!-- ② 汇率计算器：任意金额按当前汇率换算，可换向、可固定到顶栏 -->
        <section class="koi-er-calc">
          <div class="koi-er-calc__head">
            <span class="koi-er-calc__label">{{ t("header.exchangeRate.calcTitle") }}</span>
            <span class="koi-er-calc__unit">
              1 {{ calcFrom }} = {{ formatPrice(unitRate) }} {{ calcTo }}
            </span>
          </div>

          <!-- 源金额 + 源币种 -->
          <div class="koi-er-calc__row">
            <input
              v-model="amountInput"
              class="koi-er-calc__input"
              inputmode="decimal"
              :aria-label="t('header.exchangeRate.amount')"
              @input="onAmountInput"
            />
            <button type="button" class="koi-er-calc__pick" @click="openPicker('from')">
              <span class="koi-er-calc__pick-sign">{{ currencySign(calcFrom) }}</span>
              <span class="koi-er-calc__pick-code">{{ calcFrom }}</span>
              <el-icon class="koi-er-calc__pick-caret" :size="10"><ArrowDown /></el-icon>
            </button>
          </div>

          <div class="koi-er-calc__divider">
            <button
              type="button"
              class="koi-er-calc__swap"
              :aria-label="t('header.exchangeRate.swap')"
              :title="t('header.exchangeRate.swap')"
              @click="swapCurrencies"
            >
              ⇅
            </button>
          </div>

          <!-- 目标金额 + 目标币种 -->
          <div class="koi-er-calc__row">
            <output class="koi-er-calc__output">{{ convertedText }}</output>
            <button type="button" class="koi-er-calc__pick" @click="openPicker('to')">
              <span class="koi-er-calc__pick-sign">{{ currencySign(calcTo) }}</span>
              <span class="koi-er-calc__pick-code">{{ calcTo }}</span>
              <el-icon class="koi-er-calc__pick-caret" :size="10"><ArrowDown /></el-icon>
            </button>
          </div>

          <div class="koi-er-calc__foot">
            <span class="koi-er-calc__names">
              {{ currencyName(calcFrom) }} → {{ currencyName(calcTo) }}
            </span>
            <button
              type="button"
              class="koi-er-calc__pin"
              :class="{ 'is-on': isPinned }"
              :title="isPinned ? t('header.exchangeRate.unpin') : t('header.exchangeRate.pin')"
              @click="togglePin"
            >
              <el-icon :size="11"><StarFilled v-if="isPinned" /><Star v-else /></el-icon>
              <span>{{ isPinned ? t("header.exchangeRate.pinned") : t("header.exchangeRate.pin") }}</span>
            </button>
          </div>
        </section>

        <!-- ③ 走势与周期：当前币对的周期极值（后台有逐日序列时补一条迷你走势） -->
        <section class="koi-er-trend" v-if="stripPoint">
          <div class="koi-er-trend__head">
            <span class="koi-er-trend__pair">{{ stripPoint.symbol }}</span>
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
          </div>

          <div class="koi-er-trend__chart" v-if="trendMatrix">
            <svg class="koi-er-trend__svg" :viewBox="`0 0 ${CHART_W} ${CHART_H}`" preserveAspectRatio="none">
              <defs>
                <linearGradient id="koi-er-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--el-color-primary)" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="var(--el-color-primary)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polyline class="koi-er-trend__line" :points="trendPoints" vector-effect="non-scaling-stroke" />
              <path class="koi-er-trend__area" :d="trendArea" fill="url(#koi-er-area-grad)" stroke="none" />
            </svg>
            <!-- 高/低点标记（HTML 圆点，避开 preserveAspectRatio=none 的椭圆化） -->
            <i
              v-for="marker in trendMarkers"
              :key="marker.key"
              class="koi-er-trend__marker"
              :class="marker.key"
              :style="{ left: `${marker.left}%`, top: `${marker.top}%` }"
              aria-hidden="true"
            />
          </div>

          <div class="koi-er-trend__stats">
            <span class="koi-er-trend__stat">
              <em>{{ highLabel }}</em>
              <b>{{ formatPrice(stripPoint.high) }}</b>
            </span>
            <span class="koi-er-trend__stat">
              <em>{{ lowestLabel }}</em>
              <b>{{ formatPrice(stripPoint.low) }}</b>
            </span>
          </div>
        </section>

        <!-- ④ 币对检索 -->
        <label class="koi-er-search">
          <el-icon class="koi-er-search__icon" :size="13"><Search /></el-icon>
          <input
            v-model="searchText"
            class="koi-er-search__input"
            :placeholder="t('header.exchangeRate.searchPair')"
            :aria-label="t('header.exchangeRate.searchPair')"
          />
          <button v-if="searchText" type="button" class="koi-er-search__clear" @click="searchText = ''">×</button>
        </label>

        <!-- ⑤ 币对列表：点一行即把该币对设为计算器的 from/to -->
        <ul class="koi-er-list" v-if="filteredRates.length">
          <li
            v-for="point in filteredRates"
            :key="point.symbol"
            class="koi-er-row"
            :class="{ 'is-selected': point.symbol === selectedSymbol }"
            @click="selectSymbol(point.symbol)"
          >
            <span class="koi-er-row__coin" aria-hidden="true">{{ currencySign(quoteOf(point.symbol)) }}</span>
            <div class="koi-er-row__pair">
              <span class="koi-er-row__code">{{ point.symbol }}</span>
              <span class="koi-er-row__unit">1 {{ baseOf(point.symbol) }} · {{ currencyName(baseOf(point.symbol)) }}/{{ currencyName(quoteOf(point.symbol)) }}</span>
            </div>
            <div class="koi-er-row__body">
              <div class="koi-er-row__rate">{{ formatPrice(point.rate) }}</div>
              <div class="koi-er-row__change" :class="`is-${changeTone(point.change)}`">
                {{ formatPercent(point.changePercent) }}
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

        <p v-else class="koi-er-list__empty">{{ t("header.exchangeRate.searchEmpty") }}</p>

        <!-- ⑥ 目录里存在、但不在顶栏列表里的币种：一键接进计算器 -->
        <ul class="koi-er-list koi-er-list--extra" v-if="otherCurrencies.length">
          <li class="koi-er-list__title">{{ t("header.exchangeRate.otherCurrencies") }}</li>
          <li
            v-for="item in otherCurrencies"
            :key="item.code"
            class="koi-er-row koi-er-row--extra"
            @click="applyExtra(item.code)"
          >
            <span class="koi-er-row__coin" aria-hidden="true">{{ item.sign }}</span>
            <div class="koi-er-row__pair">
              <span class="koi-er-row__code">{{ item.code }}</span>
              <span class="koi-er-row__unit">{{ item.name }}</span>
            </div>
            <span class="koi-er-row__hint">{{ t("header.exchangeRate.convertTo", { name: item.name }) }}</span>
          </li>
        </ul>

        <p class="koi-er-foot">
          {{ t("header.exchangeRate.updated", { time: updatedAt }) }} ·
          {{ source === "frankfurter" ? t("header.exchangeRate.sourceFrankfurter") : t("header.exchangeRate.sourceBackend") }}
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ArrowDown, ArrowLeft, Check, Search, Star, StarFilled, Warning } from "@element-plus/icons-vue";
import {
  getAppStorage,
  getExchangeRateOverview,
  type ExchangeRatePoint,
} from "@repo/core";
import { useExchangeRate } from "@repo/theme/composables/useExchangeRate";
import { currencyName, currencySign, searchCurrencies } from "./currencyCatalog";

const { t } = useI18n();

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
  parseSymbol,
} = useExchangeRate();

/** 计算器币对偏好（用户自定设定，跨会话保留） */
const STORAGE_CALC = "exchange-rate-calc";
/** 顶栏固定币对（自定设定，跨会话保留） */
const STORAGE_PIN = "exchange-rate-pin";

/* ==================== 币对拆分 ==================== */

/** 币种对拆分（"USD/CNY" -> base/quote） */
function splitPair(symbol: string | undefined): { base: string; quote: string } {
  const parsed = symbol ? parseSymbol(symbol) : null;
  return parsed ?? { base: "", quote: "" };
}

const baseOf = (symbol: string): string => splitPair(symbol).base;
const quoteOf = (symbol: string): string => splitPair(symbol).quote;

/* ==================== 顶栏展示点 ==================== */

/** 顶栏固定币对（为空表示跟随列表当前选中项） */
const pinned = ref<{ from: string; to: string } | null>(null);
/** 固定币对的行情点（后端列表里没有该币对时按需查询） */
const pinPoint = ref<ExchangeRatePoint | null>(null);

/** 列表当前选中项 */
const activePoint = computed(() => {
  const list = rates.value;
  if (!list.length) return undefined;
  return list.find((p) => p.symbol === selectedSymbol.value) ?? list[0];
});

/** 顶栏实际展示的点：固定币对优先 */
const headPoint = computed<ExchangeRatePoint | undefined>(() =>
  pinned.value ? (pinPoint.value ?? undefined) : activePoint.value,
);

/** 顶栏两枚硬币：基准币 / 计价币 */
const headBaseSign = computed(() => currencySign(baseOf(headPoint.value?.symbol ?? "")));
const headQuoteSign = computed(() => currencySign(quoteOf(headPoint.value?.symbol ?? "")));

/** 顶栏悬浮提示：完整读出「1 基准 = 汇率 计价」 */
const triggerTitle = computed(() => {
  const point = headPoint.value;
  if (!point) return "";
  const { base, quote } = splitPair(point.symbol);
  return `1 ${base} = ${formatPrice(point.rate)} ${quote}`;
});

/* ==================== 汇率计算器 ==================== */

/** 计算器源币种 / 目标币种 */
const calcFrom = ref("USD");
const calcTo = ref("CNY");
/** 源金额（字符串，保留用户输入原样） */
const amountInput = ref("100");

/** 金额解析：非有限数值按 0 处理 */
const amount = computed(() => {
  const n = Number(amountInput.value);
  return Number.isFinite(n) ? n : 0;
});

/**
 * 按需补取的行情点（后端列表里没有的币对）。
 *
 * <p>键是展示用币种对 `BASE/QUOTE`，值是该币对的行情点。
 * 取到后与列表数据一起参与换算，不再重复请求。</p>
 */
const extraPoints = reactive<Record<string, ExchangeRatePoint>>({});
/** 正在请求中的币对，避免同一币对并发重复请求 */
const pendingPoints = new Set<string>();

/**
 * 查找币对的行情点：列表 → 按需缓存 → 反向币对取倒数。
 *
 * <p>反向推导只在拿不到正向价时兜底，涨跌方向取反、极值互换，够用来展示
 * 涨跌色与区间，不会用来做账。</p>
 */
function pointFor(symbol: string): ExchangeRatePoint | undefined {
  const direct = rates.value.find((p) => p.symbol === symbol) ?? extraPoints[symbol];
  if (direct) return direct;
  const parsed = splitPair(symbol);
  if (!parsed.base || !parsed.quote || parsed.base === parsed.quote) return undefined;
  const inverseSymbol = `${parsed.quote}/${parsed.base}`;
  const inverse = rates.value.find((p) => p.symbol === inverseSymbol) ?? extraPoints[inverseSymbol];
  if (!inverse || !Number.isFinite(inverse.rate) || inverse.rate === 0) return undefined;
  const safeInverse = (value: number): number => (Number.isFinite(value) && value !== 0 ? 1 / value : Number.NaN);
  return {
    symbol,
    rate: 1 / inverse.rate,
    change: Number.isFinite(inverse.change) ? -inverse.change : Number.NaN,
    changePercent: Number.isFinite(inverse.changePercent) ? -inverse.changePercent : Number.NaN,
    high: safeInverse(inverse.low),
    low: safeInverse(inverse.high),
  };
}

/** 计算器当前币种对 */
const calcPair = computed(() => `${calcFrom.value}/${calcTo.value}`);

/** 计算器币对的行情点（决定单位汇率、区间与涨跌） */
const calcRatePoint = computed<ExchangeRatePoint | undefined>(() => pointFor(calcPair.value));

/** 周期条展示的行情点：优先计算器币对，取不到退回顶栏币对 */
const stripPoint = computed<ExchangeRatePoint | undefined>(() => calcRatePoint.value ?? headPoint.value);

/** 单位汇率：1 calcFrom = ? calcTo */
const unitRate = computed(() => {
  const point = calcRatePoint.value;
  if (!point || !Number.isFinite(point.rate)) return Number.NaN;
  return point.rate;
});

/** 换算结果 */
const converted = computed(() => amount.value * unitRate.value);

/** 结果文案：大额自动降精度，避免面板被撑爆 */
const convertedText = computed(() => {
  const value = converted.value;
  if (!Number.isFinite(value)) return "--";
  const digits = Math.abs(value) >= 1000 ? 2 : 4;
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
});

/**
 * 取某币对的行情点（列表优先，其次按需请求后台）。
 *
 * <p>后台 `/v2/exchange-rate/overview` 支持任意币对，因此「人民币 → 乌克兰格里夫纳」
 * 这类不在顶栏配置里的组合也能直接查，不需要前端自带全量汇率表。</p>
 */
async function fetchPoint(symbol: string): Promise<ExchangeRatePoint | null> {
  const hit = rates.value.find((p) => p.symbol === symbol);
  if (hit) return hit;
  if (extraPoints[symbol]) return extraPoints[symbol];
  if (pendingPoints.has(symbol)) return null;
  pendingPoints.add(symbol);
  try {
    const overview = await getExchangeRateOverview({ symbols: [symbol], period: period.value });
    const point = overview.rates.find((p) => p.symbol === symbol) ?? overview.rates[0];
    if (point && Number.isFinite(point.rate)) {
      extraPoints[symbol] = point;
      return point;
    }
  } catch {
    /* 取不到就保持 `--`，不弹全局错误 */
  } finally {
    pendingPoints.delete(symbol);
  }
  return null;
}

/**
 * 补齐计算器币对的行情：列表里没有的组合按需查后台。
 *
 * <p>只查一次并落到 extraPoints，之后换回来直接用缓存。</p>
 */
async function ensureCalcPoint(): Promise<void> {
  if (!hasRates.value) return;
  const symbol = calcPair.value;
  if (!symbol || calcFrom.value === calcTo.value) return;
  if (pointFor(symbol)) return;
  await fetchPoint(symbol);
}

/** 输入框只接受数字与一个小数点，保留末尾小数点以便继续输入 */
function onAmountInput(): void {
  const cleaned = amountInput.value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
  if (normalized !== amountInput.value) {
    amountInput.value = normalized;
  }
}

/** 换向：源/目标币种互换（金额保持不变，结果随之变化） */
function swapCurrencies(): void {
  const from = calcFrom.value;
  calcFrom.value = calcTo.value;
  calcTo.value = from;
}

/* ---------- 币种选择视图 ---------- */

/** 是否处于币种选择视图 */
const pickerOpen = ref(false);
/** 选择视图作用于哪一侧 */
const pickerSide = ref<"from" | "to">("from");
/** 选择视图的搜索词 */
const pickerQuery = ref("");

/** 选择视图当前已选币种 */
const pickerCurrent = computed(() => (pickerSide.value === "from" ? calcFrom.value : calcTo.value));

/** 选择视图列表（目录全量，按关键字过滤） */
const pickerList = computed(() => searchCurrencies(pickerQuery.value));

/** 打开某一侧的币种选择 */
function openPicker(side: "from" | "to"): void {
  pickerSide.value = side;
  pickerQuery.value = "";
  pickerOpen.value = true;
}

/** 关闭币种选择（保留已选） */
function closePicker(): void {
  pickerOpen.value = false;
}

/** 选中币种：写回对应侧并回到计算器视图 */
function pickCurrency(code: string): void {
  if (pickerSide.value === "from") {
    calcFrom.value = code;
  } else {
    calcTo.value = code;
  }
  pickerOpen.value = false;
}

/* ---------- 币对检索 ---------- */

/** 币对检索词 */
const searchText = ref("");

/** 过滤后的顶栏币对列表（代码 / 中文名 / 别名都能搜） */
const filteredRates = computed(() => {
  const raw = searchText.value.trim();
  if (!raw) return rates.value;
  const lower = raw.toLowerCase();
  // 别名（rmb、乌克兰…）先解析成币种代码，再按代码命中币对
  const codes = new Set(searchCurrencies(raw).map((item) => item.code));
  return rates.value.filter((point) => {
    const { base, quote } = splitPair(point.symbol);
    if (codes.has(base) || codes.has(quote)) return true;
    return [point.symbol, base, quote].some((text) => text.toLowerCase().includes(lower));
  });
});

/** 目录里有、但顶栏列表里没有的币种（用于自定义币对） */
const otherCurrencies = computed(() => {
  const raw = searchText.value.trim();
  if (!raw) return [];
  const known = new Set<string>();
  for (const point of rates.value) {
    known.add(baseOf(point.symbol));
    known.add(quoteOf(point.symbol));
  }
  return searchCurrencies(raw).filter((item) => !known.has(item.code)).slice(0, 6);
});

/** 点「其他币种」：把它接成当前计算器的目标币种 */
function applyExtra(code: string): void {
  if (code === calcFrom.value) {
    swapCurrencies();
  } else {
    calcTo.value = code;
  }
  searchText.value = "";
}

/** 选中币对（点击列表项：把该币对设为计算器的 from/to） */
function selectSymbol(symbol: string): void {
  selectedSymbol.value = symbol;
  const { base, quote } = splitPair(symbol);
  if (base) calcFrom.value = base;
  if (quote) calcTo.value = quote;
}

/* ---------- 自定设定：固定到顶栏 ---------- */

/** 当前计算器币对是否就是顶栏固定币对 */
const isPinned = computed(
  () => !!pinned.value && pinned.value.from === calcFrom.value && pinned.value.to === calcTo.value,
);

/** 拉取固定币对的行情点（列表有就直接用，没有就按需查） */
async function ensurePinPoint(): Promise<void> {
  if (!pinned.value) {
    pinPoint.value = null;
    return;
  }
  const symbol = `${pinned.value.from}/${pinned.value.to}`;
  const point = await fetchPoint(symbol);
  if (point) {
    pinPoint.value = point;
    savePin();
  }
}

/** 固定/取消固定当前币对到顶栏 */
async function togglePin(): Promise<void> {
  if (isPinned.value) {
    pinned.value = null;
    pinPoint.value = null;
    savePin();
    return;
  }
  pinned.value = { from: calcFrom.value, to: calcTo.value };
  await ensurePinPoint();
  savePin();
}

/* ---------- 持久化 ---------- */

/** 保存计算器币对 */
function saveCalc(): void {
  try {
    getAppStorage().set(STORAGE_CALC, { from: calcFrom.value, to: calcTo.value });
  } catch {
    /* ignore */
  }
}

/** 保存顶栏固定币对（连带行情点，首屏直接有数） */
function savePin(): void {
  try {
    getAppStorage().set(STORAGE_PIN, {
      from: pinned.value?.from ?? "",
      to: pinned.value?.to ?? "",
      point: pinPoint.value,
    });
  } catch {
    /* ignore */
  }
}

/** 读回一条自定义设定（存储层可能给对象，也可能给 JSON 字符串） */
function readStored<T>(key: string): T | null {
  try {
    const raw = getAppStorage().get(key);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

/** 读回自定设定（计算器币对 + 顶栏固定币对） */
function restore(): void {
  const calc = readStored<{ from?: string; to?: string }>(STORAGE_CALC);
  if (calc?.from) calcFrom.value = String(calc.from);
  if (calc?.to) calcTo.value = String(calc.to);

  const stored = readStored<{ from?: string; to?: string; point?: ExchangeRatePoint }>(STORAGE_PIN);
  if (stored?.from && stored?.to) {
    pinned.value = { from: String(stored.from), to: String(stored.to) };
    if (stored.point && Number.isFinite(stored.point.rate)) {
      pinPoint.value = stored.point;
    }
  }
}

restore();

/** 挂载即取数（与 ReWeather 同节奏：顶栏一出现就拉概览，命中缓存则秒开） */
onMounted(() => {
  void fetchOverview();
});

/* ---------- 数据联动 ---------- */

/** 币种或数据变化：补齐计算器币对行情 + 记下用户偏好 */
watch(
  [calcFrom, calcTo, hasRates],
  () => {
    saveCalc();
    void ensureCalcPoint();
  },
  { immediate: true },
);

/** 数据就绪：刷新顶栏固定币对（首屏先用缓存值渲染，再对齐后台最新价） */
watch(hasRates, (ready) => {
  if (ready) void ensurePinPoint();
});

/** 周期切换：极值/涨跌随周期变，固定币对要丢掉旧点重新取 */
watch(period, () => {
  if (!pinned.value) return;
  delete extraPoints[`${pinned.value.from}/${pinned.value.to}`];
  if (hasRates.value) void ensurePinPoint();
});

/* ---------- 走势 ---------- */

/** 高/低标签 */
const highLabel = computed(() => t("header.exchangeRate.high"));
const lowestLabel = computed(() => t("header.exchangeRate.low"));

/** 周期候选（1m/3m/6m/12m） */
const PERIODS: readonly ("1m" | "3m" | "6m" | "12m")[] = ["1m", "3m", "6m", "12m"];

/** 汇率面板图表坐标系：与 ReWeather 温度曲线同口径（viewBox = 0 0 100 36） */
const CHART_W = 100;
const CHART_H = 36;
/** 曲线与 panel 边缘的留白（归一化后直接落 viewBox 单位） */
const CHART_PAD = 4;

/**
 * 走势矩阵：把历史日序列拍平成 panel 坐标（横向 0-100 等距，纵向 0-36 等比缩放）
 *
 * <p>后台概览不带逐日序列时返回 null，图表整块不渲染（不摆一个空框）。</p>
 */
const trendMatrix = computed(() => {
  const symbol = stripPoint.value?.symbol ?? "";
  const list = history.value[symbol] ?? [];
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

</script>

<style lang="scss" scoped>
/* ==================== 触发器（顶栏） ==================== */
.koi-exchange-rate-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: var(--el-radius-sm, 6px);
  transition:
    background-color 0.2s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 两枚咬合的硬币：基准币在上层，计价币错位压在下层 */
  .trigger-pair {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .trigger-pair__coin {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    font-size: 10px;
    font-style: normal;
    font-weight: 800;
    line-height: 1;
    color: var(--el-color-white);
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px var(--el-header-bg-color, var(--el-bg-color));
    transition:
      background-color 0.2s ease,
      transform 0.3s ease;
  }

  .trigger-pair__coin.is-base {
    z-index: 1;
    background: var(--el-color-primary);
  }

  .trigger-pair__coin.is-quote {
    margin-left: -7px;
    background: var(--el-color-primary-light-3);
  }

  /* 「1 = 7.2418」：数字用等宽，1 弱化、汇率强化 */
  .trigger-expr {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    font-variant-numeric: tabular-nums;
    color: var(--el-header-text-color, var(--el-text-color-primary));
    letter-spacing: 0.2px;
  }

  .trigger-expr__one {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  .trigger-expr__eq {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  .trigger-expr__rate {
    font-size: 13.5px;
    font-weight: 700;
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

    .trigger-pair__coin.is-base {
      transform: translateX(1px);
    }

    .trigger-pair__coin.is-quote {
      transform: translateX(-1px);
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
  gap: 10px;
  max-height: min(80vh, 620px);
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

  /* 面板是纵向 flex：子项一旦参与收缩，计算器会被压成一条标题条（620px 上限的真实踩坑）。
     这里显式禁止收缩，超出部分交给面板自身滚动。 */
  > * {
    flex: 0 0 auto;
  }
}

/* ==================== ① 汇率计算器 ==================== */
.koi-er-calc {
  position: relative;
  padding: 12px 14px;
  overflow: hidden;
  color: var(--el-color-white);
  border-radius: var(--el-radius-xl, 16px);
  background: linear-gradient(
    160deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 58%,
    var(--el-color-primary-light-5) 100%
  );

  /* 装饰光斑：不影响读数 */
  &::after {
    position: absolute;
    top: -52px;
    right: -44px;
    width: 156px;
    height: 156px;
    content: "";
    background: color-mix(in srgb, var(--el-color-white) 10%, transparent);
    border-radius: 50%;
  }

  &__head {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  &__label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--el-color-white) 76%, transparent);
  }

  &__unit {
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: color-mix(in srgb, var(--el-color-white) 88%, transparent);
  }

  &__row {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* 金额输入：透明背景，字号即层级 */
  &__input {
    flex: 1;
    min-width: 0;
    padding: 0;
    font-family: inherit;
    font-size: 26px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
    color: var(--el-color-white);
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: color-mix(in srgb, var(--el-color-white) 50%, transparent);
    }
  }

  &__output {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 26px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 币种选择钮：半透明底，避免与金额抢视觉 */
  &__pick {
    display: inline-flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;
    padding: 5px 8px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: var(--el-color-white);
    cursor: pointer;
    background: color-mix(in srgb, var(--el-color-white) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--el-color-white) 26%, transparent);
    border-radius: var(--el-radius-md, 8px);
    transition: background-color 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--el-color-white) 28%, transparent);
    }
  }

  &__pick-sign {
    font-size: 12px;
    font-weight: 800;
    opacity: 0.9;
  }

  &__pick-code {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.4px;
  }

  &__pick-caret {
    opacity: 0.75;
  }

  /* 换向：分隔线上的一枚圆钮 */
  &__divider {
    position: relative;
    z-index: 1;
    height: 1px;
    margin: 8px 0;
    background: color-mix(in srgb, var(--el-color-white) 22%, transparent);
  }

  &__swap {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    color: var(--el-color-primary);
    cursor: pointer;
    background: color-mix(in srgb, var(--el-color-white) 92%, transparent);
    border: none;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: transform 0.25s ease;

    &:hover {
      transform: translate(-50%, -50%) rotate(180deg);
    }
  }

  &__foot {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }

  &__names {
    overflow: hidden;
    font-size: 10.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: color-mix(in srgb, var(--el-color-white) 82%, transparent);
  }

  /* 固定到顶栏：默认弱化成文字按钮，固定后实心星 + 高亮 */
  &__pin {
    display: inline-flex;
    flex-shrink: 0;
    gap: 3px;
    align-items: center;
    padding: 3px 7px;
    font-family: inherit;
    font-size: 10.5px;
    font-weight: 600;
    color: color-mix(in srgb, var(--el-color-white) 82%, transparent);
    cursor: pointer;
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--el-color-white) 24%, transparent);
    border-radius: 999px;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      color: var(--el-color-white);
      background: color-mix(in srgb, var(--el-color-white) 16%, transparent);
    }

    &.is-on {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-white) 92%, transparent);
      border-color: transparent;
    }
  }
}

/* 暗色下降低渐变亮度，避免白字发灰 */
html.dark .koi-er-calc {
  background: linear-gradient(
    160deg,
    var(--el-color-primary-dark-2, #25485c) 0%,
    var(--el-color-primary-light-3, #2d5f7a) 58%,
    var(--el-color-primary-light-5, #346882) 100%
  );
}

/* ==================== ② 走势与周期 ==================== */
.koi-er-trend {
  padding: 8px 12px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);

  &__head {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  &__pair {
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__chart {
    position: relative;
    height: 40px;
    margin-top: 6px;
  }

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  &__line {
    fill: none;
    stroke: var(--el-color-primary);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__area {
    stroke: none;
  }

  &__marker {
    position: absolute;
    width: 6px;
    height: 6px;
    pointer-events: none;
    background: var(--el-color-primary);
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--el-color-primary) 26%, transparent);
    transform: translate(-50%, -50%);
  }

  &__marker.high {
    background: var(--el-color-success, #67c23a);
  }

  &__marker.low {
    background: var(--el-color-danger, #f56c6c);
  }

  &__stats {
    display: flex;
    gap: 16px;
    margin-top: 6px;
  }

  &__stat {
    display: flex;
    gap: 4px;
    align-items: baseline;
    font-variant-numeric: tabular-nums;

    em {
      font-size: 10px;
      font-style: normal;
      color: var(--el-text-color-placeholder);
    }

    b {
      font-size: 12px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }
}

/* ==================== 周期切换 ==================== */
.koi-er-period {
  display: flex;
  gap: 4px;
}

.koi-er-period__btn {
  padding: 3px 9px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;

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

/* ==================== ③ 检索框 ==================== */
.koi-er-search {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 0 10px;
  background: var(--el-fill-color-light);
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;

  &:focus-within {
    background: var(--el-bg-color);
    border-color: var(--el-color-primary-light-5);
  }

  &__icon {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
  }

  &__input {
    flex: 1;
    min-width: 0;
    height: 32px;
    padding: 0;
    font-family: inherit;
    font-size: 12.5px;
    color: var(--el-text-color-primary);
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }

  &__clear {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    padding: 0;
    font-size: 14px;
    line-height: 1;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    background: var(--el-fill-color-dark);
    border: none;
    border-radius: 50%;

    &:hover {
      color: var(--el-text-color-primary);
    }
  }
}

/* ==================== ④ 币对列表 ==================== */
.koi-er-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.koi-er-list__empty {
  margin: 0;
  padding: 14px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.koi-er-list__title {
  padding: 2px 4px 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
}

.koi-er-row {
  display: grid;
  grid-template-areas: "coin pair rate hl";
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  padding: 9px 11px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  /* 计价币的货币符号：与顶栏硬币同一视觉语言 */
  &__coin {
    display: grid;
    place-items: center;
    grid-area: coin;
    width: 22px;
    height: 22px;
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 7px;
  }

  &__pair {
    display: flex;
    flex-direction: column;
    grid-area: pair;
    gap: 1px;
    min-width: 0;
  }

  &__code {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__unit {
    overflow: hidden;
    font-size: 10px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__body {
    display: flex;
    flex-direction: column;
    grid-area: rate;
    gap: 2px;
    align-items: flex-end;
    min-width: 0;
  }

  &__rate {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__change {
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
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
    display: flex;
    grid-area: hl;
    gap: 3px;
    align-items: center;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-secondary);

    .koi-er-row__hl-label {
      font-weight: 400;
    }

    .koi-er-row__hl-value {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .koi-er-row__hl-sep {
      padding: 0 2px;
      font-size: 9px;
      color: var(--el-text-color-placeholder);
    }
  }

  &__hint {
    grid-column: 3;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-color-primary);
    white-space: nowrap;
  }

  &.is-selected {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);

    .koi-er-row__code {
      color: var(--el-color-primary);
    }

    .koi-er-row__coin {
      color: var(--el-color-white);
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  &:hover:not(.is-selected) {
    background: var(--el-fill-color-extra-light);
    border-color: var(--el-border-color-light);
  }
}

/* 目录补充币种：两列布局，右侧是动作提示而不是价格 */
.koi-er-row--extra {
  grid-template-areas: "coin pair hint";
  grid-template-columns: auto minmax(0, 1fr) auto;

  &:hover {
    border-color: var(--el-color-primary-light-7);
  }
}

/* ==================== ⑤ 币种选择视图 ==================== */
.koi-er-picker__head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.koi-er-picker__back {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 2px 4px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.koi-er-picker__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.koi-er-picker__empty {
  margin: 0;
  padding: 18px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.koi-er-curlist {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.koi-er-curlist__item {
  display: grid;
  grid-template-columns: 20px auto minmax(0, 1fr) 12px;
  gap: 6px;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);

    .koi-er-curlist__code {
      color: var(--el-color-primary);
    }

    .koi-er-curlist__sign {
      color: var(--el-color-white);
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
}

.koi-er-curlist__sign {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: 9px;
  font-weight: 800;
  font-style: normal;
  line-height: 1;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 6px;
}

.koi-er-curlist__code {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.koi-er-curlist__name {
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.koi-er-curlist__check {
  color: var(--el-color-primary);
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
