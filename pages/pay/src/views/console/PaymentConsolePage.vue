<template>
  <PmPageShell page-class="payment-console-page">
    <PmSurface
      eyebrow="支付管理台"
      title="台账"
      description="今日订单与昨日对比、总交易额、退款统计概览。"
    />

    <!-- 核心指标卡片 -->
    <PmStatGrid>
      <PmStatCard
        label="今日订单"
        :hint="`入账 ${formatCurrency(dashboard.todayIncome)}`"
        class="stat-primary"
      >
        <template #value>{{ dashboard.todayOrderCount }} <small>笔</small></template>
        <template #sub>
          <span :class="orderTrendClass">较昨日 {{ orderComparisonText }}</span>
        </template>
      </PmStatCard>
      <PmStatCard
        label="总额"
        :hint="`累计订单 ${dashboard.totalOrderCount} 笔`"
      >
        <template #value>{{ formatCurrency(dashboard.totalIncome) }}</template>
      </PmStatCard>
      <PmStatCard
        label="退款"
        :hint="`退款笔数 ${dashboard.totalRefundCount} 笔`"
        class="stat-danger"
      >
        <template #value>{{ formatCurrency(dashboard.totalRefundAmount) }}</template>
      </PmStatCard>
    </PmStatGrid>

    <!-- 图表区域 -->
    <section class="chart-section">
      <div class="chart-row">
        <PmPanel title="交易趋势" description="近 30 天交易金额走势" class="chart-panel chart-panel--wide">
          <div class="chart-container">
            <ScEcharts v-if="trendChartOption" :option="trendChartOption" height="320px" />
            <div v-else class="chart-empty">暂无交易数据</div>
          </div>
        </PmPanel>
        <PmPanel title="支付方式占比" description="各渠道交易金额分布" class="chart-panel chart-panel--narrow">
          <div class="chart-container">
            <ScEcharts v-if="pieChartOption" :option="pieChartOption" height="320px" />
            <div v-else class="chart-empty">暂无渠道数据</div>
          </div>
        </PmPanel>
      </div>
      <div class="chart-row">
        <PmPanel title="近 7 日交易对比" description="每日交易与退款金额对比" class="chart-panel chart-panel--full">
          <div class="chart-container">
            <ScEcharts v-if="barChartOption" :option="barChartOption" height="280px" />
            <div v-else class="chart-empty">暂无对比数据</div>
          </div>
        </PmPanel>
      </div>
    </section>

  </PmPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from "vue";
import PmPageShell from "../../components/layout/PmPageShell.vue";
import PmSurface from "../../components/layout/PmSurface.vue";
import PmStatGrid from "../../components/layout/PmStatGrid.vue";
import PmStatCard from "../../components/layout/PmStatCard.vue";
import PmPanel from "../../components/layout/PmPanel.vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { formatCurrency } from "../../utils/format";
import { getPaymentDashboardSummary } from "../../api/payment";

const API_ROOT = "/api/ops/";

const dashboard = reactive({
  todayOrderCount: 0,
  todayIncome: 0,
  yesterdayOrderCount: 0,
  yesterdayIncome: 0,
  totalOrderCount: 0,
  totalIncome: 0,
  totalRefundAmount: 0,
  totalRefundCount: 0,
});

const trendChartOption = ref<any>(null);
const pieChartOption = ref<any>(null);
const barChartOption = ref<any>(null);

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const orderComparisonText = computed(() => {
  const diff = dashboard.todayOrderCount - dashboard.yesterdayOrderCount;
  if (dashboard.yesterdayOrderCount === 0 && dashboard.todayOrderCount === 0) return "-";
  if (diff > 0) return `↑ +${diff} 笔`;
  if (diff < 0) return `↓ ${diff} 笔`;
  return "→ 持平";
});

const orderTrendClass = computed(() => {
  const diff = dashboard.todayOrderCount - dashboard.yesterdayOrderCount;
  if (diff > 0) return "stat-trend-up";
  if (diff < 0) return "stat-trend-down";
  return "stat-trend-flat";
});

function mapSummary(data: any) {
  return {
    totalConsumeAmount: data?.totalConsumeAmount ?? 0,
    totalRefundAmount: data?.totalRefundAmount ?? 0,
    paymentOrderCount: data?.paymentOrderCount ?? 0,
    refundCount: data?.refundCount ?? 0,
  };
}

// ====== 图表数据处理 ======

const channelTypeLabel: Record<string, string> = {
  WECHAT: "微信支付",
  ALIPAY: "支付宝",
  WALLET: "钱包",
};

function formatDateKey(raw: any): string {
  if (typeof raw === "number") {
    const d = new Date(raw);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }
  const parts = (raw || "").split("-");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : String(raw);
}

function buildTrendOption(rawData: any[]): any {
  if (!rawData || rawData.length === 0) return null;
  const dates = rawData.map((d: any) => formatDateKey(d.dateKey));
  const amounts = rawData.map((d: any) => Number(d.amount || 0));

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: any) => `¥${Number(v).toLocaleString()}`,
    },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontSize: 11, rotate: dates.length > 20 ? 45 : 0 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11,
        formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`,
      },
      splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
    },
    series: [{
      type: "line",
      data: amounts,
      smooth: true,
      symbol: "none",
      lineStyle: { width: 3 },
      areaStyle: {
        opacity: 0.15,
      },
    }],
  };
}

function buildPieOption(rawData: any[]): any {
  if (!rawData || rawData.length === 0) return null;
  const total = rawData.reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
  const series = rawData.map((d: any) => ({
    name: channelTypeLabel[d.channelType] || d.channelType || "未知",
    value: Number(d.amount || 0),
  }));

  return {
    tooltip: {
      trigger: "item",
      valueFormatter: (v: any) => `¥${Number(v).toLocaleString()}`,
    },
    series: [{
      type: "pie",
      radius: ["40%", "68%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: "var(--pm-surface-bg, #fff)",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: (p: any) => {
          const pct = ((p.value / total) * 100).toFixed(1);
          return `${p.name}\n${pct}%`;
        },
        fontSize: 11,
      },
      labelLine: { length: 8, length2: 12 },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.15)",
        },
      },
      data: series,
    }],
  };
}

function buildBarOption(rawData: any[]): any {
  if (!rawData || rawData.length === 0) return null;
  // Take last 7 days
  const recent = rawData.slice(-7);
  const dates = recent.map((d: any) => formatDateKey(d.dateKey));
  const amounts = recent.map((d: any) => Number(d.amount || 0));
  const refunds = recent.map((d: any) => Number(d.refundAmount || 0));

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: any) => `¥${Number(v).toLocaleString()}`,
    },
    legend: {
      data: ["交易金额", "退款金额"],
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11,
        formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`,
      },
      splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
    },
    series: [
      {
        name: "交易金额",
        type: "bar",
        barWidth: "32%",
        data: amounts,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: "退款金额",
        type: "bar",
        barWidth: "32%",
        data: refunds,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

async function fetchChartData() {
  try {
    const today = todayStr();
    const [trendRes, distRes, summaryRes] = await Promise.all([
      request("dashboard/trend?days=30"),
      request("dashboard/channel-distribution"),
      request(`dashboard/summary?startDate=${today}&endDate=${today}`),
    ]);

    trendChartOption.value = buildTrendOption(Array.isArray(trendRes) ? trendRes : []);
    pieChartOption.value = buildPieOption(Array.isArray(distRes) ? distRes : []);
    barChartOption.value = buildBarOption(Array.isArray(trendRes) ? trendRes : []);

    // Also update today stats from daily summary
    if (summaryRes) {
      const m = mapSummary(summaryRes);
      dashboard.todayIncome = m.totalConsumeAmount;
    }
  } catch (e) {
    console.error("[PaymentConsole] 图表数据加载失败", e);
  }
}

onMounted(async () => {
  try {
    const today = todayStr();
    const yesterday = yesterdayStr();
    const [todayResult, yesterdayResult, totalResult] = await Promise.all([
      getPaymentDashboardSummary({ startDate: today, endDate: today }),
      getPaymentDashboardSummary({ startDate: yesterday, endDate: yesterday }),
      getPaymentDashboardSummary({}),
    ]);

    const todayMapped = mapSummary(todayResult as any);
    const yesterdayMapped = mapSummary(yesterdayResult as any);
    const totalMapped = mapSummary(totalResult as any);

    dashboard.todayOrderCount = todayMapped.paymentOrderCount;
    dashboard.todayIncome = todayMapped.totalConsumeAmount;
    dashboard.yesterdayOrderCount = yesterdayMapped.paymentOrderCount;
    dashboard.yesterdayIncome = yesterdayMapped.totalConsumeAmount;
    dashboard.totalOrderCount = totalMapped.paymentOrderCount;
    dashboard.totalIncome = totalMapped.totalConsumeAmount;
    dashboard.totalRefundAmount = totalMapped.totalRefundAmount;
    dashboard.totalRefundCount = totalMapped.refundCount;
  } catch (e) {
    console.error("[PaymentConsole] 台账数据加载失败", e);
  }

  await fetchChartData();
});

async function request(path: string, init?: RequestInit) {
  const url = new URL(path.replace(/^\/+/, ""), new URL(API_ROOT, window.location.href)).toString();
  const response = await fetch(url, { credentials: "include", ...init });
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    return "data" in payload ? payload.data : payload;
  }
  return payload;
}

function safeJsonParse(value: string) {
  try { return JSON.parse(value); } catch { return value; }
}

function resolveMessage(payload: any) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return payload.message || payload.msg || payload.error || "";
}
</script>

<style scoped>
.payment-console-page :deep(.pm-surface) {
  background:
    radial-gradient(circle at top right, rgba(79, 70, 229, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(238, 242, 255, 0.9));
}

/* ── Stat Card Variants ── */
.stat-primary :deep(.pm-stat-card) {
  background:
    radial-gradient(circle at top right, rgba(79, 70, 229, 0.24), transparent 34%),
    linear-gradient(140deg, #1e1b4b 0%, #3730a3 54%, #4f46e5 100%) !important;
  border-color: transparent !important;
}

.stat-primary :deep(.pm-stat-card .pm-stat-card__label),
.stat-primary :deep(.pm-stat-card .pm-stat-card__value),
.stat-primary :deep(.pm-stat-card .pm-stat-card__sub),
.stat-primary :deep(.pm-stat-card .pm-stat-card__hint) {
  color: #eef2ff !important;
}

.stat-danger :deep(.pm-stat-card) {
  border-left: 3px solid var(--pm-color-danger, #dc2626);
}

/* ── Stat Trend Indicators ── */
.stat-trend-up { color: var(--pm-color-success, #10b981); font-weight: 600; }
.stat-trend-down { color: var(--pm-color-danger, #dc2626); font-weight: 600; }
.stat-trend-flat { color: var(--pm-text-muted, #8b97a9); font-weight: 600; }

:deep(.pm-stat-card__value small) {
  font-size: 20px;
  font-weight: 400;
  color: inherit;
  opacity: 0.75;
}

/* ── Chart Section ── */
.chart-section {
  display: flex;
  flex-direction: column;
  gap: var(--pm-space-md, 14px);
  margin-bottom: var(--pm-space-md, 14px);
}

.chart-row {
  display: flex;
  gap: var(--pm-space-md, 14px);
}

.chart-panel {
  flex: 1;
  min-width: 0;
}

.chart-panel--wide {
  flex: 2;
}

.chart-panel--narrow {
  flex: 1;
}

.chart-panel--full {
  flex: 1 1 100%;
}

.chart-container {
  padding: var(--pm-space-sm, 8px) 0;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  color: var(--pm-text-muted, #8b97a9);
  font-size: var(--pm-font-size-sm, 12.5px);
}

@media (max-width: 900px) {
  .chart-row {
    flex-direction: column;
  }
}
</style>
