<template>
  <div class="mpw">
    <div v-if="!widget.hideTitle" class="mpw__header">
      <div class="mpw__title">
        <el-icon class="mpw__title-icon"><TrendCharts /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <el-tag type="info" round size="small" class="mpw__tag">现货</el-tag>
      <span class="mpw__updated" :title="updatedTitle">{{ updatedText }}</span>
      <button v-if="showRefreshEnabled" type="button" class="mpw__refresh" :disabled="loading" @click="load" aria-label="刷新价格">
        <el-icon :size="16"><RefreshRight /></el-icon>
      </button>
    </div>

    <div class="mpw__body" v-loading="loading">
      <div v-if="error" class="mpw__error">
        <el-icon :size="28"><CircleCloseFilled /></el-icon>
        <span>数据加载失败</span>
        <button type="button" class="mpw__retry" @click="load">重新加载</button>
      </div>
      <div v-else class="mpw__grid">
        <div v-for="m in metals" :key="m.symbol" class="mpw__metal" :title="ozTitle(m)">
          <div class="mpw__metal-head">
            <div class="mpw__metal-icon" :class="iconClass(m.symbol)">
              <span>{{ m.abbr }}</span>
            </div>
            <span class="mpw__metal-name">{{ m.name }}</span>
          </div>
          <div class="mpw__metal-price">
            <span class="mpw__metal-price-value">{{ priceText(m.price) }}</span>
            <span class="mpw__metal-unit">{{ m.unit }}</span>
          </div>
          <div class="mpw__metal-change" :class="changeClass(m.change)">
            <el-icon class="mpw__change-icon">
              <CaretTop v-if="m.change != null && m.change > 0" />
              <CaretBottom v-else-if="m.change != null && m.change < 0" />
            </el-icon>
            <span>{{ changeText(m.change) }}</span>
            <span class="mpw__metal-status">{{ changeLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="MetalsPriceWidget">
/**
 * 贵金属行情（金 / 银 / 铂 / 钯）
 *
 * 数据源：{@code https://api.gold-api.com/price}，CORS 白名单站，
 * 前端直接请求（后端若再套一层反而易截断 live 价格）。
 *
 * <p>该接口只有 spot price，没有历史 K 线/时序数据，所以不自己轮询——每 30s 向一个只返回当前
 * 牌价的接口重复请求，既占流量也没有任何意义。</p>
 *
 * <p>刷新交给页面生命周期：<b>页面挂载时一次，Tab 切回可见时一次</b>，由浏览器管新鲜度。
 * 涨跌用 localStorage 存留的上一档成交价做基准，用户每次打开都能看到自上次离开后的价格变化。</p>
 *
 * <p>价格口径：API 按金衡盎司（USD）计价，面板除以 {@code 31.1035} 叫出每克价；
 * 悬停会上浮原始盎司牌价的 {@code title}，两者互补。</p>
 */
import { CaretBottom, CaretTop, CircleCloseFilled, RefreshRight, TrendCharts } from "@element-plus/icons-vue";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { subscribeRefresh, unregisterRefresh } from "./refreshRegistry";
import type { WidgetItem } from "../types";

defineProps<{ widget: WidgetItem }>();

/** 刷新图标是否可用（配置显式关闭时才不显示，默认开启） */
const showRefreshEnabled = computed(() => props.widget.appearance?.showRefresh !== false);

/** 贵金属列表：排好序，决定面板里的视觉顺序（金 → 银 → 铂 → 钯） */
const METALS = [
  { symbol: "XAU", name: "黄金", abbr: "Au" },
  { symbol: "XAG", name: "白银", abbr: "Ag" },
  { symbol: "XPT", name: "铂金", abbr: "Pt" },
  { symbol: "XPD", name: "钯金", abbr: "Pd" },
];

const loading = ref(true);
const error = ref(false);
/** 上一档成交价：本地存留，不对外暴露，只用于计算涨跌 */
const prevPrice = reactive<Record<string, number>>(lastPricesStore());
const lastUpdatedAt = ref<Date | null>(null);

const PRICE_URL = "https://api.gold-api.com/price";
/** localStorage 里存留的上一档成交价，跨 session 占位 */
const LAST_METALS_KEY = "koi_home_metals_last_price";

const changeLabel = computed(() => {
  /** 没对比基准就留空，避免“实时”类词描述跨 session 的变化 */
  const has = Object.values(prevPrice).some((v) => v != null);
  return has ? "较上次" : "暂无对比";
});

const updatedText = computed(() => (lastUpdatedAt.value ? lastUpdatedAt.value.toLocaleTimeString() : "等待更新"));
const updatedTitle = computed(() => (lastUpdatedAt.value ? lastUpdatedAt.value.toISOString() : ""));

/** 区衡盎司 → 克：1 金衡盎司 = 31.1035 g */
const TROY_OZ_PER_GRAM = 31.1035;

/** 语言成本：巴塞尔问题的价钱跟上标 + 百分比无语义，不能省 */
function priceText(v: number | null | undefined): string {
  if (v == null || v < 0) return "—";
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(gramPrice(v));
}

/** 盎司牌价（API 中所有金属都是 USD/盎司）转每克价，按金衡盎司换算 */
function gramPrice(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round((v / TROY_OZ_PER_GRAM) * 100) / 100;
}

/** 涨跌幅文本：±0.00%，零值不带正负号 */
function changeText (v: number | null): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function changeClass(v: number | null): string {
  if (v == null) return "";
  return v > 0 ? "mpw__change--up" : v < 0 ? "mpw__change--down" : "mpw__change--neutral";
}

/** 按行情种类下牌价参考配色卡着主题走 */
function iconClass(symbol: string): string {
  switch (symbol) {
    case "XAU":
      return "mpw__metal-icon--gold";
    case "XAG":
      return "mpw__metal-icon--silver";
    case "XPT":
      return "mpw__metal-icon--platinum";
    case "XPD":
      return "mpw__metal-icon--palladium";
    default:
      return "";
  }
}

/** 本地态：涨跌方向（> 0 上升 / < 0 下降 / 0 无涨跌 / null 未知） */
interface MetalRow {
  symbol: string;
  name: string;
  abbr: string;
  price: number | null;
  change: number | null;
  /** 每克计价单位（来自 API 返回的 currencySymbol，如 "$/克"） */
  unit: string;
}

const metals = reactive<MetalRow[]>(
  METALS.map((m) => ({
    symbol: m.symbol,
    name: m.name,
    abbr: m.abbr,
    price: null,
    change: null,
    unit: "USD/克",
  })),
);

/** 读本地存留的上一档成交价（容错，杜绝一切读写异常） */
function lastPricesStore(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LAST_METALS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** 把当前牌价落盘，作为下次打开的对比基准 */
function saveLastPrices(p: Record<string, number>): void {
  try {
    localStorage.setItem(LAST_METALS_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

/** 拉取一档价格（从本地存留的上一价算涨跌幅） */
async function loadMetal(metal: MetalRow): Promise<void> {
  let res: Response | undefined;
  try {
    res = await fetch(`${PRICE_URL}/${metal.symbol}`);
  } catch {
    return;
  }
  if (!res.ok) return;
  const json = (await res.json()) as {
    price?: number;
    symbol?: string;
    currencySymbol?: string;
    updatedAt?: string;
  };
  const price = json?.price ?? json?.val?.price;
  if (price == null) return;
  // 计价单位：API 返回的 currencySymbol（美元 $ → "$/克"）
  if (json?.currencySymbol) metal.unit = `${json.currencySymbol}/克`;
  const prev = prevPrice[metal.symbol] ?? null;
  prevPrice[metal.symbol] = price;
  metal.price = price;
  metal.change = prev === null ? null : Math.round(((price - prev) / prev) * 10000) / 100;
  lastUpdatedAt.value = json?.updatedAt ? new Date(json.updatedAt) : new Date();
}

/** 拉取全部四档，并只把成功的结果推入面板 */
async function loadAllMetals(): Promise<void> {
  loading.value = true;
  error.value = false;
  const results = await Promise.allSettled(metals.map((m) => loadMetal(m)));
  // 只要有一档拒绝（断网/跨域/无应答），就挂上错误态，给出手动重开按钮
  if (results.some((r) => r.status === "rejected")) {
    error.value = true;
  }
  loading.value = false;
  /** 落盘：当下的一档牌价就是下次打开的对比基准 */
  saveLastPrices({ ...prevPrice });
}

/** 悬停浮层：露出 API 返回的原始盎司牌价（USD），与面板的每克价互补 */
function ozTitle(m: MetalRow): string {
  if (m.price == null) return "";
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 3 }).format(m.price)} 美元/盎司`;
}

async function load(): Promise<void> {
  await loadAllMetals();
}

onMounted(() => {
  load();
  subscribeRefresh("metals", load);
});

onBeforeUnmount(() => {
  unregisterRefresh("metals", load);
});
</script>

<style lang="scss" scoped>
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.mpw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--koi-widget-bg, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}
.mpw__header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 8px; }
.mpw__title { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.mpw__title-icon { flex-shrink: 0; color: var(--el-color-primary); }
.mpw__tag { flex-shrink: 0; }
.mpw__updated { flex-shrink: 0; font-size: 12px; color: var(--el-text-color-tertiary); white-space: nowrap; margin-left: auto; }

.mpw__refresh {
  flex-shrink: 0; width: 28px; height: 28px; padding: 0;
  border: none; border-radius: 50%; cursor: pointer; color: var(--el-text-color-tertiary);
  background: transparent; transition: color var(--el-transition-duration, 0.2s),
    background var(--el-transition-duration, 0.2s);
}
.mpw__refresh:hover:not(:disabled) { background: var(--el-fill-color); color: var(--el-color-primary); }
.mpw__refresh:disabled { opacity: 0.4; cursor: not-allowed; }
.mpw__refresh:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }

.mpw__body { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 0 12px 12px; }

.mpw__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; }

.mpw__metal {
  display: flex; flex-direction: column; padding: 12px;
  background: var(--koi-widget-bg, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}
.mpw__metal:hover { border-color: var(--el-border-color); box-shadow: var(--shadow-md); }

.mpw__metal-head { display: flex; align-items: center; gap: 8px; }
.mpw__metal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  font-size: 12px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.mpw__metal-icon--gold    { background: linear-gradient(135deg, #d97706 0%, #fbbf24 100%); }
.mpw__metal-icon--silver  { background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%); }
.mpw__metal-icon--platinum { background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); }
.mpw__metal-icon--palladium { background: linear-gradient(135deg, #e879f9 0%, #f0abfc 100%); }
.mpw__metal-name { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }

.mpw__metal-price { display: flex; align-items: baseline; gap: 6px; margin-top: 10px; font-size: 22px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px; color: var(--el-text-color-primary); }
.mpw__metal-price-value { flex: 1; min-width: 0; }
.mpw__metal-unit { flex-shrink: 0; font-size: 11px; font-weight: 600; line-height: 1.2; color: var(--el-text-color-tertiary); margin-top: 2px; }

.mpw__metal-change {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; font-weight: 600;
}
.mpw__change-icon { font-size: 12px; }
.mpw__metal-status { font-size: 11px; color: var(--el-text-color-tertiary); margin-left: auto; }

.mpw__change--up { color: var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 12%, transparent); padding: 4px 8px; border-radius: 20px; }
.mpw__change--down { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); padding: 4px 8px; border-radius: 20px; }
.mpw__change--neutral { color: var(--el-text-color-tertiary); background: var(--el-fill-color-lighter); padding: 4px 8px; border-radius: 20px; }

.mpw__error {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  height: 100%; font-size: 13px; color: var(--el-text-color-disabled);
}
.mpw__retry {
  margin-top: 4px; padding: 8px 16px; cursor: pointer;
  font-size: 12px; color: var(--el-color-primary);
  background: transparent; border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}
.mpw__retry:hover { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
.mpw__retry:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }

/* 深色主题：金属徽标的亮色渐变需要提亮 */
html.dark {
  .mpw__metal-icon--gold    { background: linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%); }
  .mpw__metal-icon--silver  { background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); }
  .mpw__metal-icon--platinum { background: linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%); }
  .mpw__metal-icon--palladium { background: linear-gradient(135deg, #f0abfc 0%, #f9a8d4 100%); }
}
</style>
