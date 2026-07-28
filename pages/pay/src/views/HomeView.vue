<template>
  <PmPageShell page-class="home-page">
    <PmSurface
      title="支付业务首页"
      :description="`${currentRangeLabel} · ${autoRefreshLabel} · 最近刷新 ${lastUpdatedLabel}`"
    >
      <template #actions>
        <ScButton-group size="small">
          <ScButton
            v-for="item in rangePresets"
            :key="item.value"
            :type="activePreset === item.value ? 'primary' : 'default'"
            @click="applyPreset(item.value)"
          >
            {{ item.label }}
          </ScButton>
        </ScButton-group>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleRangeChange"
        />
        <ScSelect
          v-model="refreshIntervalMs"
          size="small"
          class="home-refresh-select"
          @change="handleRefreshIntervalChange"
        >
          <ScOption
            v-for="item in refreshIntervalOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ScSelect>
        <ScButton circle type="primary" :icon="RefreshRight" :loading="loading" @click="loadDashboard" />
      </template>
    </PmSurface>

    <section class="metric-grid">
      <article v-for="item in summaryCards" :key="item.label" class="metric-card">
        <div class="metric-card__icon" :style="{ background: item.softColor, color: item.color }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="metric-card__body">
          <span class="metric-card__label">{{ item.label }}</span>
          <strong class="metric-card__value">{{ item.value }}</strong>
          <span class="metric-card__hint">{{ item.hint }}</span>
        </div>
      </article>
    </section>

    <section class="insight-row">
      <div class="insight-chip-group">
        <article class="insight-chip">
          <span>商户数</span>
          <strong>{{ merchantTotal }}</strong>
          <small>激活 {{ activeMerchantCount }} / 已配置 {{ configuredMerchantCount }}</small>
        </article>
        <article class="insight-chip">
          <span>交易流水</span>
          <strong>{{ transactionCount }}</strong>
          <small>按当前筛选时间统计</small>
        </article>
        <article class="insight-chip">
          <span>回调成功</span>
          <strong>{{ successNotifyCount }}</strong>
          <small>失败 {{ failedNotifyCount }}</small>
        </article>
        <article class="insight-chip">
          <span>定时任务</span>
          <strong>{{ enabledTaskCount }}</strong>
          <small>{{ schedulerEngineLabel }}</small>
        </article>
      </div>
      <PmPanel title="交易趋势" class="trend-panel">
        <div class="chart-wrap">
          <ScEcharts v-if="trendOption" :option="trendOption" height="200px" />
          <span v-else class="chart-placeholder">加载趋势数据中...</span>
        </div>
      </PmPanel>
    </section>

    <PmPanel title="常用入口">
      <div class="entry-grid">
        <router-link
          v-for="item in entryCards"
          :key="item.path"
          class="entry-button"
          :to="withPrefix(item.path)"
        >
          <span class="entry-button__icon" :style="{ background: item.softColor, color: item.color }">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="entry-button__content">
            <strong>{{ item.title }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </router-link>
      </div>
    </PmPanel>
  </PmPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  Bell,
  CreditCard,
  DataAnalysis,
  Money,
  RefreshRight,
  Setting,
  Shop,
  Tickets,
  Timer,
} from "@element-plus/icons-vue";
import { getPaymentDashboardSummary, getPaymentGlobalConfig, getSchedulerTasks } from "../api/payment";
import type { PaymentDashboardSummary, PaymentGlobalConfig, PaymentSchedulerTask } from "../types/payment";
import { formatCurrency } from "../utils/format";
import { usePaymentRoleGuard } from "../composables/usePaymentRoleGuard";
import { withPrefix } from "../config";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import type { ScButton, ScSelect, ScOption } from "@repo/components";
import ScOption from "@repo/components/ScOption";

type PresetValue = "today" | "7d" | "30d" | "90d" | "thisMonth" | "thisYear" | "custom";
const DEFAULT_AUTO_REFRESH_MS = 30000;
const AUTO_REFRESH_STORAGE_KEY = "payment.dashboard.autoRefreshMs";

const { isAdmin } = usePaymentRoleGuard();
const loading = ref(false);
const activePreset = ref<PresetValue>("7d");
const dateRange = ref<[Date, Date] | null>(createPresetRange("7d"));
const schedulerTasks = ref<PaymentSchedulerTask[]>([]);
const lastUpdatedAt = ref<Date | null>(null);
const refreshIntervalMs = ref(DEFAULT_AUTO_REFRESH_MS);
let refreshTimer: number | null = null;
const dashboardSummary = ref<PaymentDashboardSummary>({
  merchantTotal: 0,
  activeMerchantCount: 0,
  configuredMerchantCount: 0,
  paymentOrderCount: 0,
  refundCount: 0,
  transactionCount: 0,
  callbackRequestCount: 0,
  successNotifyCount: 0,
  failedNotifyCount: 0,
  averageProcessDurationMs: 0,
  totalConsumeAmount: 0,
  totalRefundAmount: 0,
});
const trendRaw = ref<any[]>([]);
const trendOption = computed(() => {
  if (!trendRaw.value.length) return null;
  const dates = trendRaw.value.map((d: any) => {
    if (typeof d.dateKey === "number") {
      const dt = new Date(d.dateKey);
      return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
    }
    const p = (d.dateKey || "").split("-");
    return p.length === 3 ? `${p[1]}/${p[2]}` : d.dateKey;
  });
  const amounts = trendRaw.value.map((d: any) => Number(d.amount || 0));
  return {
    tooltip: { trigger: "axis", valueFormatter: (v: any) => `¥${Number(v).toLocaleString()}` },
    grid: { left: 50, right: 10, top: 10, bottom: 20 },
    xAxis: { type: "category", data: dates, axisLabel: { fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: "value", show: false, splitLine: { show: false } },
    series: [{ type: "line", data: amounts, smooth: true, symbol: "none", lineStyle: { width: 2 }, areaStyle: { opacity: 0.12 } }],
  };
});

const rangePresets: Array<{ label: string; value: PresetValue }> = [
  { label: "今天", value: "today" },
  { label: "近7天", value: "7d" },
  { label: "近30天", value: "30d" },
  { label: "近90天", value: "90d" },
  { label: "本月", value: "thisMonth" },
  { label: "本年", value: "thisYear" },
];
const refreshIntervalOptions = [
  { label: "关闭自动刷新", value: 0 },
  { label: "15 秒刷新", value: 15000 },
  { label: "30 秒刷新", value: 30000 },
  { label: "60 秒刷新", value: 60000 },
  { label: "5 分钟刷新", value: 300000 },
];

const merchantTotal = computed(() => Number(dashboardSummary.value.merchantTotal || 0));
const activeMerchantCount = computed(() => Number(dashboardSummary.value.activeMerchantCount || 0));
const configuredMerchantCount = computed(() => Number(dashboardSummary.value.configuredMerchantCount || 0));
const paymentOrderCount = computed(() => Number(dashboardSummary.value.paymentOrderCount || 0));
const refundCount = computed(() => Number(dashboardSummary.value.refundCount || 0));
const totalConsumeAmount = computed(() => Number(dashboardSummary.value.totalConsumeAmount || 0));
const totalRefundAmount = computed(() => Number(dashboardSummary.value.totalRefundAmount || 0));
const callbackRequestCount = computed(() => Number(dashboardSummary.value.callbackRequestCount || 0));
const successNotifyCount = computed(() => Number(dashboardSummary.value.successNotifyCount || 0));
const failedNotifyCount = computed(() => Number(dashboardSummary.value.failedNotifyCount || 0));
const transactionCount = computed(() => Number(dashboardSummary.value.transactionCount || 0));
const averageDuration = computed(() => formatDuration(Number(dashboardSummary.value.averageProcessDurationMs || 0)));
const enabledTaskCount = computed(() => schedulerTasks.value.filter((item) => item.enabled).length);

const schedulerEngineLabel = computed(() => {
  if (!schedulerTasks.value.length) return "暂无启用任务";
  return "自动关单与分表任务已接入";
});

const currentRangeLabel = computed(() => {
  if (!dateRange.value) return "-";
  return `${formatDate(dateRange.value[0])} 至 ${formatDate(dateRange.value[1])}`;
});

const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return "-";
  const h = `${lastUpdatedAt.value.getHours()}`.padStart(2, "0");
  const m = `${lastUpdatedAt.value.getMinutes()}`.padStart(2, "0");
  const s = `${lastUpdatedAt.value.getSeconds()}`.padStart(2, "0");
  return `${h}:${m}:${s}`;
});

const autoRefreshLabel = computed(() => {
  if (refreshIntervalMs.value <= 0) return "自动刷新已关闭";
  return `${formatRefreshInterval(refreshIntervalMs.value)}自动刷新`;
});

const summaryCards = computed(() => [
  { label: "支付订单数", value: `${paymentOrderCount.value}`, hint: "按支付订单生成与完成记录统计", icon: Tickets, color: "#0f766e", softColor: "rgba(15, 118, 110, 0.12)" },
  { label: "退款数量", value: `${refundCount.value}`, hint: "按退款成功记录统计", icon: CreditCard, color: "#c2410c", softColor: "rgba(194, 65, 12, 0.12)" },
  { label: "总消费金额", value: formatCurrency(totalConsumeAmount.value), hint: "按实付金额与下单金额汇总后的消费金额", icon: Money, color: "#2563eb", softColor: "rgba(37, 99, 235, 0.12)" },
  { label: "退款金额", value: formatCurrency(totalRefundAmount.value), hint: "后端汇总退款成功金额", icon: DataAnalysis, color: "#9333ea", softColor: "rgba(147, 51, 234, 0.12)" },
  { label: "回调请求数量", value: `${callbackRequestCount.value}`, hint: `成功 ${successNotifyCount.value} / 失败 ${failedNotifyCount.value}`, icon: Bell, color: "#d97706", softColor: "rgba(217, 119, 6, 0.12)" },
  { label: "平均耗时", value: averageDuration.value, hint: "回调接收至处理完成耗时", icon: Timer, color: "#475467", softColor: "rgba(71, 84, 103, 0.12)" },
]);

const entryCards = computed(() => {
  const cards = [
    { title: "商户管理", description: "维护商户、支付方式和回调地址", path: "/merchants", icon: Shop, color: "#0f766e", softColor: "rgba(15, 118, 110, 0.12)" },
    { title: "订单管理", description: "查看订单、支付状态和退款动作", path: "/orders", icon: Tickets, color: "#2563eb", softColor: "rgba(37, 99, 235, 0.12)" },
    { title: "交易流水", description: "排查支付、退款、第三方交易记录", path: "/transactions", icon: CreditCard, color: "#7c3aed", softColor: "rgba(124, 58, 237, 0.12)" },
  ];
  if (isAdmin.value) {
    cards.push(
      { title: "支付全局配置", description: "维护回调基础地址、回跳地址和默认自动刷新", path: "/global-config", icon: Setting, color: "#0f766e", softColor: "rgba(15, 118, 110, 0.12)" },
      { title: "订单配置", description: "管理自动关单、分表和迁移策略", path: "/order-config", icon: Setting, color: "#475467", softColor: "rgba(71, 84, 103, 0.12)" },
    );
  }
  return cards;
});

function createPresetRange(preset: Exclude<PresetValue, "custom">): [Date, Date] {
  const end = endOfDay(new Date());
  switch (preset) {
    case "today": return [startOfDay(new Date()), end];
    case "7d": return [startOfDay(addDays(new Date(), -6)), end];
    case "30d": return [startOfDay(addDays(new Date(), -29)), end];
    case "90d": return [startOfDay(addDays(new Date(), -89)), end];
    case "thisMonth": { const n = new Date(); return [startOfDay(new Date(n.getFullYear(), n.getMonth(), 1)), end]; }
    case "thisYear": { const n = new Date(); return [startOfDay(new Date(n.getFullYear(), 0, 1)), end]; }
    default: return [startOfDay(addDays(new Date(), -6)), end];
  }
}

function applyPreset(preset: Exclude<PresetValue, "custom">) {
  activePreset.value = preset;
  dateRange.value = createPresetRange(preset);
  void loadDashboard();
}

function handleRangeChange(value: [Date, Date] | null) {
  if (!value) { applyPreset("today"); return; }
  activePreset.value = "custom";
  void loadDashboard();
}

function formatDuration(value: number) {
  if (!value) return "-";
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

function formatRefreshInterval(value: number) {
  if (!value) return "关闭";
  if (value >= 60000) { const m = value / 60000; return `${Number.isInteger(m) ? m : m.toFixed(1)} 分钟`; }
  return `${Math.round(value / 1000)} 秒`;
}

function startOfDay(date: Date) { const n = new Date(date); n.setHours(0, 0, 0, 0); return n; }
function endOfDay(date: Date) { const n = new Date(date); n.setHours(23, 59, 59, 999); return n; }
function addDays(date: Date, offset: number) { const n = new Date(date); n.setDate(n.getDate() + offset); return n; }
function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadDashboard() {
  loading.value = true;
  try {
    const summaryPromise = getPaymentDashboardSummary({
      startDate: dateRange.value ? formatDate(dateRange.value[0]) : undefined,
      endDate: dateRange.value ? formatDate(dateRange.value[1]) : undefined,
    });
    const [summaryRes, schedulerRes] = await Promise.all([
      summaryPromise,
      getSchedulerTasks().catch(() => ({ data: [] })),
    ]);
    dashboardSummary.value = { ...dashboardSummary.value, ...(summaryRes.data || {}) };
    schedulerTasks.value = Array.isArray(schedulerRes?.data) ? schedulerRes.data : [];
    lastUpdatedAt.value = new Date();
  } catch (error) {
    console.error(error);
    ElMessage.error("首页统计加载失败");
  } finally {
    loading.value = false;
  }
}

async function fetchTrend() {
  try {
    const resp = await fetch(`/api/ops/dashboard/trend?days=30`, { credentials: "include" });
    const text = await resp.text();
    const json = JSON.parse(text);
    if (json?.code === "00000" && Array.isArray(json.data)) trendRaw.value = json.data;
  } catch { /* ignore */ }
}

function resolveRefreshIntervalFromConfig(config?: PaymentGlobalConfig | null) {
  const seconds = Number(config?.paymentAutoRefreshSeconds || 0);
  if (!seconds) return DEFAULT_AUTO_REFRESH_MS;
  const ms = seconds * 1000;
  return refreshIntervalOptions.some((item) => item.value === ms) ? ms : DEFAULT_AUTO_REFRESH_MS;
}

async function restoreRefreshInterval() {
  let fallbackValue = DEFAULT_AUTO_REFRESH_MS;
  try { const c = await getPaymentGlobalConfig(); fallbackValue = resolveRefreshIntervalFromConfig(c.data); } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
    const resolved = Number(raw);
    if (refreshIntervalOptions.some((item) => item.value === resolved)) { refreshIntervalMs.value = resolved; return; }
  } catch { /* ignore */ }
  refreshIntervalMs.value = fallbackValue;
}

function handleRefreshIntervalChange(value: number) {
  refreshIntervalMs.value = value;
  try { localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, String(value)); } catch { /* ignore */ }
  startAutoRefresh();
}

function startAutoRefresh() {
  if (refreshTimer !== null) { window.clearInterval(refreshTimer); refreshTimer = null; }
  if (refreshIntervalMs.value <= 0) return;
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") void loadDashboard();
  }, refreshIntervalMs.value);
}

onMounted(async () => {
  await restoreRefreshInterval();
  dateRange.value = createPresetRange("7d");
  void loadDashboard();
  void fetchTrend();
  startAutoRefresh();
});

onUnmounted(() => { if (refreshTimer !== null) window.clearInterval(refreshTimer); });
</script>

<style scoped>
.home-refresh-select { width: 148px; }

/* ── Metric Grid ── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--pm-space-md, 14px);
  margin-bottom: var(--pm-space-md, 14px);
}

.metric-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: var(--pm-border-radius-md, 16px);
  border: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  background: var(--pm-surface-card, rgba(255, 255, 255, 0.85));
  box-shadow: var(--pm-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.metric-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.metric-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-card__label { color: var(--pm-text-muted, #8b97a9); font-size: var(--pm-font-size-sm, 12.5px); }
.metric-card__value { color: var(--pm-text-primary, #070b15); font-size: 28px; line-height: 1.1; }
.metric-card__hint { color: var(--pm-text-muted, #8b97a9); font-size: var(--pm-font-size-xs, 11px); line-height: 1.7; }

/* ── Insight Row ── */
.insight-row {
  display: flex;
  gap: var(--pm-space-md, 14px);
  margin-bottom: var(--pm-space-md, 14px);
}

.insight-chip-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--pm-space-sm, 8px);
  min-width: 0;
  flex: 1;
}

.insight-chip {
  padding: 18px 20px;
  border-radius: var(--pm-border-radius-md, 16px);
  border: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  background: var(--pm-surface-card, rgba(255, 255, 255, 0.85));
}

.insight-chip span,
.insight-chip small {
  display: block;
  color: var(--pm-text-muted, #8b97a9);
  font-size: var(--pm-font-size-xs, 11px);
}

.insight-chip strong {
  display: block;
  margin: 8px 0 6px;
  color: var(--pm-text-primary, #070b15);
  font-size: 24px;
}

.trend-panel { flex: 1; min-width: 280px; }
.chart-wrap { padding: var(--pm-space-sm, 8px) 0; }
.chart-placeholder { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--pm-text-muted, #8b97a9); font-size: var(--pm-font-size-sm, 12.5px); }

/* ── Entry Grid ── */
.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--pm-space-md, 14px);
}

.entry-button {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  border-radius: var(--pm-border-radius-md, 16px);
  background: var(--pm-surface-card, rgba(255, 255, 255, 0.85));
  text-align: left;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  color: inherit;
}

.entry-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--pm-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
  border-color: var(--pm-color-brand, #4f46e5);
  background: var(--pm-color-brand-light, #eef2ff);
}

.entry-button__icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.entry-button__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.entry-button__content strong { color: var(--pm-text-primary, #070b15); font-size: var(--pm-font-size-sm, 12.5px); }
.entry-button__content small { color: var(--pm-text-muted, #8b97a9); font-size: var(--pm-font-size-xs, 11px); line-height: 1.7; }

@media (max-width: 1180px) {
  .metric-grid { grid-template-columns: repeat(2, 1fr); }
  .insight-row { flex-direction: column; }
  .entry-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 860px) {
  .metric-grid { grid-template-columns: 1fr; }
  .insight-chip-group { grid-template-columns: 1fr; }
  .entry-grid { grid-template-columns: 1fr; }
}
</style>
