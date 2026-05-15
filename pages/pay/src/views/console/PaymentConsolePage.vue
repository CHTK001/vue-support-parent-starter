<template>
  <PmPageShell page-class="payment-console-page">
    <!-- ===== HERO: 核心数据大看板 ===== -->
    <header class="console-hero">
      <div class="console-hero__bg" />
      <div class="console-hero__body">
        <div class="console-hero__intro">
          <p class="console-hero__eyebrow">支付管理台</p>
          <h1 class="console-hero__title">台账总览</h1>
          <p class="console-hero__desc">
            今日订单 <strong>{{ dashboard.todayOrderCount }}</strong> 笔 ·
            累计交易 <strong>{{ dashboard.totalOrderCount }}</strong> 笔
          </p>
        </div>
        <div class="console-hero__kpi">
          <article class="console-hero-kpi">
            <span class="console-hero-kpi__label">总交易额</span>
            <strong class="console-hero-kpi__value">{{ formatCurrency(dashboard.totalIncome) }}</strong>
            <span class="console-hero-kpi__trend" :class="incomeTrendClass">
              {{ incomeComparisonText }}
            </span>
          </article>
          <div class="console-hero-kpi__divider" />
          <article class="console-hero-kpi">
            <span class="console-hero-kpi__label">总退款额</span>
            <strong class="console-hero-kpi__value">{{ formatCurrency(dashboard.totalRefundAmount) }}</strong>
            <span class="console-hero-kpi__trend console-hero-kpi__trend--danger">
              退款 {{ dashboard.totalRefundCount }} 笔
            </span>
          </article>
          <div class="console-hero-kpi__divider" />
          <article class="console-hero-kpi">
            <span class="console-hero-kpi__label">商户总数</span>
            <strong class="console-hero-kpi__value">{{ summary.merchantTotal }}</strong>
            <span class="console-hero-kpi__trend">
              活跃 {{ summary.activeMerchantCount }} / 已配置 {{ summary.configuredMerchantCount }}
            </span>
          </article>
        </div>
      </div>
    </header>

    <!-- ===== 6 指标卡片 ===== -->
    <section class="kpi-grid">
      <article
        v-for="card in kpiCards"
        :key="card.label"
        class="kpi-card"
        :style="{ '--kpi-accent': card.accent, '--kpi-bg': card.bgColor }"
      >
        <div class="kpi-card__icon-wrap">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="kpi-card__body">
          <span class="kpi-card__label">{{ card.label }}</span>
          <strong class="kpi-card__value">{{ card.value }}</strong>
          <span class="kpi-card__hint">{{ card.hint }}</span>
        </div>
        <div class="kpi-card__spark" />
      </article>
    </section>

    <!-- ===== 图表区域 ===== -->
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

    <!-- ===== 系统健康 + 快捷入口 ===== -->
    <div class="bottom-row">
      <PmPanel title="系统健康" description="回调与任务状态概览" class="bottom-row__health">
        <div class="health-grid">
          <div class="health-item">
            <div class="health-item__dot health-item__dot--success" />
            <div>
              <span class="health-item__label">回调成功率</span>
              <strong class="health-item__value">{{ callbackSuccessRate }}</strong>
            </div>
          </div>
          <div class="health-item">
            <div class="health-item__dot health-item__dot--info" />
            <div>
              <span class="health-item__label">回调请求总数</span>
              <strong class="health-item__value">{{ summary.callbackRequestCount }}</strong>
            </div>
          </div>
          <div class="health-item">
            <div class="health-item__dot" :class="healthDurationDotClass" />
            <div>
              <span class="health-item__label">平均处理耗时</span>
              <strong class="health-item__value">{{ formatDuration(summary.averageProcessDurationMs) }}</strong>
            </div>
          </div>
          <div class="health-item">
            <div class="health-item__dot" :class="healthNotifyDotClass" />
            <div>
              <span class="health-item__label">失败待处理</span>
              <strong class="health-item__value">{{ summary.failedNotifyCount }} 条</strong>
            </div>
          </div>
        </div>
      </PmPanel>

      <PmPanel title="快捷入口" class="bottom-row__entries">
        <div class="entry-grid">
          <router-link
            v-for="item in entryItems"
            :key="item.path"
            class="entry-chip"
            :to="item.path"
          >
            <el-icon :size="16"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </div>
      </PmPanel>
    </div>
  </PmPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from "vue";
import {
  Bell,
  CreditCard,
  DataAnalysis,
  Money,
  Shop,
  Tickets,
  Timer,
  TrendCharts,
  Wallet,
  RefreshRight,
} from "@element-plus/icons-vue";
import PmPageShell from "../../components/layout/PmPageShell.vue";
import PmPanel from "../../components/layout/PmPanel.vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { formatCurrency } from "../../utils/format";
import { getPaymentDashboardSummary } from "../../api/payment";
import type { PaymentDashboardSummary } from "../../types/payment";
import { withPrefix } from "../../config";

// ====== 数据模型 ======
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

const summary = reactive<PaymentDashboardSummary>({
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

const trendChartOption = ref<any>(null);
const pieChartOption = ref<any>(null);
const barChartOption = ref<any>(null);

// ====== 计算属性 ======
const incomeComparisonText = computed(() => {
  const diff = dashboard.todayIncome - dashboard.yesterdayIncome;
  if (dashboard.yesterdayIncome === 0 && dashboard.todayIncome === 0) return "暂无对比";
  if (diff > 0) return `今日 ↑ ¥${diff.toFixed(2)}`;
  if (diff < 0) return `今日 ↓ ¥${Math.abs(diff).toFixed(2)}`;
  return "持平";
});

const incomeTrendClass = computed(() => {
  const diff = dashboard.todayIncome - dashboard.yesterdayIncome;
  if (diff > 0) return "console-hero-kpi__trend--up";
  if (diff < 0) return "console-hero-kpi__trend--down";
  return "";
});

const callbackSuccessRate = computed(() => {
  const total = summary.callbackRequestCount;
  if (!total) return "—";
  const rate = ((summary.successNotifyCount / total) * 100).toFixed(1);
  return `${rate}%`;
});

const healthDurationDotClass = computed(() => {
  const ms = summary.averageProcessDurationMs;
  if (!ms) return "health-item__dot--info";
  if (ms > 5000) return "health-item__dot--danger";
  if (ms > 1000) return "health-item__dot--warning";
  return "health-item__dot--success";
});

const healthNotifyDotClass = computed(() => {
  return summary.failedNotifyCount > 0 ? "health-item__dot--danger" : "health-item__dot--success";
});

// ====== KPI 卡片 ======
const kpiCards = computed(() => [
  {
    label: "支付订单",
    value: `${summary.paymentOrderCount}`,
    hint: `今日 +${dashboard.todayOrderCount}`,
    icon: Tickets,
    accent: "#4f46e5",
    bgColor: "rgba(79, 70, 229, 0.08)",
  },
  {
    label: "消费金额",
    value: formatCurrency(summary.totalConsumeAmount),
    hint: `今日 ¥${dashboard.todayIncome.toFixed(2)}`,
    icon: Money,
    accent: "#059669",
    bgColor: "rgba(5, 150, 105, 0.08)",
  },
  {
    label: "退款金额",
    value: formatCurrency(summary.totalRefundAmount),
    hint: `${summary.refundCount} 笔退款`,
    icon: CreditCard,
    accent: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.08)",
  },
  {
    label: "交易流水",
    value: `${summary.transactionCount}`,
    hint: "含支付与退款",
    icon: TrendCharts,
    accent: "#7c3aed",
    bgColor: "rgba(124, 58, 237, 0.08)",
  },
  {
    label: "商户总数",
    value: `${summary.merchantTotal}`,
    hint: `激活 ${summary.activeMerchantCount} 个`,
    icon: Shop,
    accent: "#d97706",
    bgColor: "rgba(217, 119, 6, 0.08)",
  },
  {
    label: "回调状态",
    value: `${summary.callbackRequestCount}`,
    hint: `成功 ${summary.successNotifyCount} / 失败 ${summary.failedNotifyCount}`,
    icon: Bell,
    accent: "#0891b2",
    bgColor: "rgba(8, 145, 178, 0.08)",
  },
]);

// ====== 快捷入口 ======
const entryItems = [
  { label: "商户管理", path: withPrefix("/merchants"), icon: Shop },
  { label: "订单管理", path: withPrefix("/orders"), icon: Tickets },
  { label: "交易流水", path: withPrefix("/transactions"), icon: TrendCharts },
  { label: "退款管理", path: withPrefix("/refunds"), icon: CreditCard },
  { label: "钱包管理", path: withPrefix("/wallet-console"), icon: Wallet },
  { label: "运营中心", path: withPrefix("/operations"), icon: DataAnalysis },
  { label: "全局配置", path: withPrefix("/global-config"), icon: Bell },
  { label: "订单配置", path: withPrefix("/order-config"), icon: Timer },
];

// ====== 日期工具 ======
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(value: number) {
  if (!value) return "-";
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
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
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "rgba(215,223,235,0.7)",
      borderWidth: 1,
      textStyle: { fontSize: 12, color: "#1a2332" },
    },
    grid: { left: 60, right: 20, top: 25, bottom: 30 },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontSize: 11, color: "#8b97a9", rotate: dates.length > 20 ? 45 : 0 },
      axisLine: { show: false },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11, color: "#8b97a9",
        formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`,
      },
      splitLine: { lineStyle: { type: "dashed", color: "rgba(215,223,235,0.5)" } },
    },
    series: [{
      type: "line",
      data: amounts,
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 3, color: "#4f46e5" },
      itemStyle: { color: "#4f46e5" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(79,70,229,0.25)" },
            { offset: 1, color: "rgba(79,70,229,0.02)" },
          ],
        },
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

  const colorPalette = ["#4f46e5", "#059669", "#d97706", "#7c3aed", "#0891b2", "#dc2626"];

  return {
    tooltip: {
      trigger: "item",
      valueFormatter: (v: any) => `¥${Number(v).toLocaleString()}`,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "rgba(215,223,235,0.7)",
      borderWidth: 1,
      textStyle: { fontSize: 12, color: "#1a2332" },
    },
    color: colorPalette,
    series: [{
      type: "pie",
      radius: ["42%", "70%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: "var(--pm-surface-page, #f4f6fb)",
        borderWidth: 3,
      },
      label: {
        show: true,
        formatter: (p: any) => {
          const pct = ((p.value / total) * 100).toFixed(1);
          return `${p.name}\n${pct}%`;
        },
        fontSize: 11,
        fontWeight: 500,
        color: "#546174",
      },
      labelLine: { length: 10, length2: 14, lineStyle: { color: "rgba(215,223,235,0.8)" } },
      emphasis: {
        itemStyle: { shadowBlur: 12, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.12)" },
        label: { fontWeight: 600 },
      },
      data: series,
    }],
  };
}

function buildBarOption(rawData: any[]): any {
  if (!rawData || rawData.length === 0) return null;
  const recent = rawData.slice(-7);
  const dates = recent.map((d: any) => formatDateKey(d.dateKey));
  const amounts = recent.map((d: any) => Number(d.amount || 0));
  const refunds = recent.map((d: any) => Number(d.refundAmount || 0));

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: any) => `¥${Number(v).toLocaleString()}`,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "rgba(215,223,235,0.7)",
      borderWidth: 1,
      textStyle: { fontSize: 12, color: "#1a2332" },
    },
    legend: {
      data: ["交易金额", "退款金额"],
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: "#546174" },
    },
    grid: { left: 60, right: 20, top: 20, bottom: 42 },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontSize: 11, color: "#8b97a9" },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11, color: "#8b97a9",
        formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`,
      },
      splitLine: { lineStyle: { type: "dashed", color: "rgba(215,223,235,0.5)" } },
    },
    series: [
      {
        name: "交易金额",
        type: "bar",
        barWidth: "28%",
        data: amounts,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: "#4f46e5" },
      },
      {
        name: "退款金额",
        type: "bar",
        barWidth: "28%",
        data: refunds,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: "rgba(220,38,38,0.7)" },
      },
    ],
  };
}

function mapSummary(data: any) {
  return {
    totalConsumeAmount: data?.totalConsumeAmount ?? 0,
    totalRefundAmount: data?.totalRefundAmount ?? 0,
    paymentOrderCount: data?.paymentOrderCount ?? 0,
    refundCount: data?.refundCount ?? 0,
  };
}

async function fetchChartData() {
  try {
    const [trendRes, distRes] = await Promise.all([
      request("dashboard/trend?days=30"),
      request("dashboard/channel-distribution"),
    ]);

    trendChartOption.value = buildTrendOption(Array.isArray(trendRes) ? trendRes : []);
    pieChartOption.value = buildPieOption(Array.isArray(distRes) ? distRes : []);
    barChartOption.value = buildBarOption(Array.isArray(trendRes) ? trendRes : []);
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

    // Fill summary from totalResult
    Object.assign(summary, totalResult as any || {});
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
/* ============================
   HERO
   ============================ */
.console-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--pm-border-radius-xl, 24px);
  margin-bottom: var(--pm-space-md, 14px);
}

.console-hero__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 90% 70% at 0% 20%, rgba(79, 70, 229, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 70% 60% at 100% 80%, rgba(124, 58, 237, 0.12) 0%, transparent 70%),
    linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%);
  z-index: 0;
}

.console-hero__body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pm-space-xl, 24px) var(--pm-space-2xl, 32px);
  gap: var(--pm-space-xl, 24px);
}

.console-hero__intro {
  flex-shrink: 0;
}

.console-hero__eyebrow {
  margin: 0 0 4px;
  font-size: var(--pm-font-size-xs, 11px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.55);
}

.console-hero__title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.console-hero__desc {
  margin: 0;
  font-size: var(--pm-font-size-sm, 12.5px);
  color: rgba(255, 255, 255, 0.65);
}

.console-hero__desc strong {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.console-hero__kpi {
  display: flex;
  align-items: center;
  gap: var(--pm-space-xl, 24px);
}

.console-hero-kpi {
  text-align: right;
}

.console-hero-kpi__label {
  display: block;
  font-size: var(--pm-font-size-xs, 11px);
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
}

.console-hero-kpi__value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 2px;
}

.console-hero-kpi__trend {
  font-size: var(--pm-font-size-xs, 11px);
  color: rgba(255, 255, 255, 0.5);
}

.console-hero-kpi__trend--up { color: #6ee7b7; }
.console-hero-kpi__trend--down { color: #fca5a5; }
.console-hero-kpi__trend--danger { color: rgba(252, 165, 165, 0.8); }

.console-hero-kpi__divider {
  width: 1px;
  height: 48px;
  background: rgba(255, 255, 255, 0.12);
}

/* ============================
   KPI 卡片网格
   ============================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--pm-space-md, 14px);
  margin-bottom: var(--pm-space-md, 14px);
}

.kpi-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: var(--pm-border-radius-md, 16px);
  border: 1px solid var(--pm-border-color-light, rgba(233,238,246,0.6));
  background: var(--pm-surface-card, rgba(255,255,255,0.85));
  box-shadow: var(--pm-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--pm-shadow-md, 0 4px 12px rgba(15,23,42,0.06));
}

.kpi-card__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--kpi-bg, rgba(79,70,229,0.08));
  color: var(--kpi-accent, #4f46e5);
  position: relative;
  z-index: 1;
}

.kpi-card__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.kpi-card__label {
  color: var(--pm-text-muted, #8b97a9);
  font-size: var(--pm-font-size-xs, 11px);
}

.kpi-card__value {
  color: var(--pm-text-primary, #070b15);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.kpi-card__hint {
  color: var(--pm-text-muted, #8b97a9);
  font-size: var(--pm-font-size-xs, 11px);
  line-height: 1.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-card__spark {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--kpi-bg, rgba(79,70,229,0.06)) 0%, transparent 70%);
  pointer-events: none;
}

/* ============================
   图表区域
   ============================ */
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

.chart-panel--wide { flex: 2; }
.chart-panel--narrow { flex: 1; }
.chart-panel--full { flex: 1 1 100%; }

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

/* ============================
   底部行: 系统健康 + 快捷入口
   ============================ */
.bottom-row {
  display: flex;
  gap: var(--pm-space-md, 14px);
  margin-bottom: var(--pm-space-md, 14px);
}

.bottom-row__health {
  flex: 1;
}

.bottom-row__entries {
  flex: 1;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--pm-space-md, 14px);
  padding: var(--pm-space-sm, 8px) 0;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--pm-border-radius-sm, 12px);
  background: rgba(244, 246, 251, 0.5);
  border: 1px solid var(--pm-border-color-light, rgba(233,238,246,0.6));
}

.health-item__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.health-item__dot--success { background: var(--pm-color-success, #059669); }
.health-item__dot--warning { background: var(--pm-color-warning, #d97706); }
.health-item__dot--danger { background: var(--pm-color-danger, #dc2626); }
.health-item__dot--info { background: var(--pm-color-info, #6b7280); }

.health-item div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.health-item__label {
  font-size: var(--pm-font-size-xs, 11px);
  color: var(--pm-text-muted, #8b97a9);
}

.health-item__value {
  font-size: var(--pm-font-size-lg, 16px);
  font-weight: 600;
  color: var(--pm-text-primary, #070b15);
}

/* ── 快捷入口 ── */
.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--pm-space-sm, 8px);
  padding: var(--pm-space-sm, 8px) 0;
}

.entry-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--pm-border-radius-sm, 12px);
  border: 1px solid var(--pm-border-color-light, rgba(233,238,246,0.6));
  background: rgba(244, 246, 251, 0.5);
  color: var(--pm-text-secondary, #1a2332);
  text-decoration: none;
  font-size: var(--pm-font-size-sm, 12.5px);
  font-weight: 500;
  transition: all 0.2s ease;
}

.entry-chip:hover {
  background: var(--pm-color-brand-light, #eef2ff);
  border-color: var(--pm-color-brand, #4f46e5);
  color: var(--pm-color-brand, #4f46e5);
  transform: translateY(-1px);
}

/* ============================
   响应式
   ============================ */
@media (max-width: 900px) {
  .console-hero__body {
    flex-direction: column;
    align-items: flex-start;
  }

  .console-hero__kpi {
    width: 100%;
    justify-content: space-between;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-row {
    flex-direction: column;
  }

  .bottom-row {
    flex-direction: column;
  }

  .entry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .console-hero__kpi {
    flex-wrap: wrap;
    gap: var(--pm-space-md, 14px);
  }

  .console-hero-kpi__divider {
    display: none;
  }

  .health-grid {
    grid-template-columns: 1fr;
  }

  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
