<template>
  <PmPageShell page-class="payment-console-page">
    <PmSurface
      :eyebrow="eyebrow"
      :title="title"
      :description="description"
    >
      <template #actions>
        <ScButton @click="drawerVisible = true">
          <el-icon style="font-size:18px"><Menu /></el-icon>
        </ScButton>
      </template>
    </PmSurface>

    <!-- Row 1: 金额类统计 -->
    <div class="pm-stats-row">
      <div class="pm-stat-card">
        <span class="pm-stat-label">总收益</span>
        <strong class="pm-stat-value">{{ formatCurrency(dashboard.totalIncome) }}</strong>
        <span class="pm-stat-hint">累计收入金额</span>
      </div>
      <div class="pm-stat-card pm-stat-card--primary">
        <span class="pm-stat-label">今日收益</span>
        <strong class="pm-stat-value">{{ formatCurrency(dashboard.todayIncome) }}</strong>
        <span class="pm-stat-hint">今日新增收入</span>
      </div>
      <div class="pm-stat-card">
        <span class="pm-stat-label">到账金额</span>
        <strong class="pm-stat-value">{{ formatCurrency(dashboard.settledAmount) }}</strong>
        <span class="pm-stat-hint">已结算金额</span>
      </div>
      <div class="pm-stat-card pm-stat-card--danger">
        <span class="pm-stat-label">退款金额</span>
        <strong class="pm-stat-value">{{ formatCurrency(dashboard.refundAmount) }}</strong>
        <span class="pm-stat-hint">累计退款</span>
      </div>
      <div class="pm-stat-card pm-stat-card--warn">
        <span class="pm-stat-label">冻结金额</span>
        <strong class="pm-stat-value">{{ formatCurrency(dashboard.frozenAmount) }}</strong>
        <span class="pm-stat-hint">当前冻结</span>
      </div>
    </div>

    <!-- Row 2: 订单类统计 -->
    <div class="pm-stats-row pm-stats-row--order">
      <div class="pm-stat-card">
        <span class="pm-stat-label">今日订单数</span>
        <strong class="pm-stat-value">{{ orderStats.todayOrders ?? 0 }}</strong>
        <span class="pm-stat-hint">今日新增订单</span>
      </div>
      <div class="pm-stat-card pm-stat-card--danger">
        <span class="pm-stat-label">退款订单数</span>
        <strong class="pm-stat-value">{{ orderStats.refundOrders ?? 0 }}</strong>
        <span class="pm-stat-hint">退款中的订单</span>
      </div>
      <div class="pm-stat-card pm-stat-card--warn">
        <span class="pm-stat-label">超时订单数</span>
        <strong class="pm-stat-value">{{ orderStats.timeoutOrders ?? 0 }}</strong>
        <span class="pm-stat-hint">已超时未支付</span>
      </div>
      <div class="pm-stat-card">
        <span class="pm-stat-label">总订单数</span>
        <strong class="pm-stat-value">{{ orderStats.totalOrders ?? 0 }}</strong>
        <span class="pm-stat-hint">累计订单总量</span>
      </div>
    </div>

    <!-- Row 3: 交易趋势图 -->
    <div class="pm-chart-row">
      <div class="pm-chart-card">
        <div class="pm-chart-header">
          <span class="pm-chart-title">交易趋势</span>
        </div>
        <ScEcharts :option="trendChartOption" height="280px" />
      </div>
      <div class="pm-chart-card">
        <div class="pm-chart-header">
          <span class="pm-chart-title">支付方式分布</span>
        </div>
        <ScEcharts :option="pieChartOption" height="280px" />
      </div>
    </div>

    <!-- Row 4: 支付通道占比图 -->
    <div class="pm-chart-row">
      <div class="pm-chart-card pm-chart-card--full">
        <div class="pm-chart-header">
          <span class="pm-chart-title">各通道交易对比</span>
        </div>
        <ScEcharts :option="barChartOption" height="280px" />
      </div>
    </div>

    <!-- Drawer: 功能导航 -->
    <el-drawer v-model="drawerVisible" title="功能导航" direction="rtl" size="380px">
      <div class="pm-drawer-grid">
        <div v-for="card in functionCards" :key="card.key" class="pm-drawer-card" @click="navigateTo(card.key)">
          <el-icon :size="28"><component :is="card.icon" /></el-icon>
          <span class="pm-drawer-card__title">{{ card.title }}</span>
          <span class="pm-drawer-card__desc">{{ card.description }}</span>
        </div>
      </div>
    </el-drawer>

    <div class="pm-toast-stack">
      <div v-for="toast in toasts" :key="toast.id" class="pm-toast" :class="`pm-toast-${toast.type}`">{{ toast.message }}</div>
    </div>
  </PmPageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { Menu, Shop, Tickets, CreditCard, RefreshLeft, Setting, Tools } from "@element-plus/icons-vue";
import { ScButton } from "@repo/components/ScButton";
import { ScEcharts } from "@repo/components/ScEcharts";
import PmPageShell from "../../components/layout/PmPageShell.vue";
import PmSurface from "../../components/layout/PmSurface.vue";
import { formatCurrency } from "../../utils/format";

let router: ReturnType<typeof useRouter> | null = null;
try {
  router = useRouter();
} catch {
  // no router available (embedded mode)
}

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  eyebrow?: string;
  storageKey?: string;
}>(), {
  title: "台账",
  description: "支付台账概览，汇总收益、订单与交易趋势。",
  eyebrow: "支付管理台",
  storageKey: "spring.pages.payment-console.settings",
});

const drawerVisible = ref(false);

interface FunctionCard {
  key: string;
  title: string;
  icon: any;
  description: string;
}

const functionCards: FunctionCard[] = [
  { key: "merchants", title: "商户与支付方式", icon: Shop, description: "维护商户、支付方式和回调地址" },
  { key: "orders", title: "订单管理", icon: Tickets, description: "查看订单状态、金额和流转日志" },
  { key: "transactions", title: "交易流水", icon: CreditCard, description: "排查支付、退款、第三方交易记录" },
  { key: "refunds", title: "退款管理", icon: RefreshLeft, description: "处理退款申请和退款状态查询" },
  { key: "global-config", title: "支付全局配置", icon: Setting, description: "配置支付系统全局参数" },
  { key: "order-config", title: "订单配置", icon: Tools, description: "订单分表策略和业务配置" },
];

const API_ROOT = "../api/test/ops/";

const dashboard = reactive({
  totalIncome: 0,
  todayIncome: 0,
  settledAmount: 0,
  refundAmount: 0,
  frozenAmount: 0,
});

const orderStats = reactive({
  todayOrders: 0,
  refundOrders: 0,
  timeoutOrders: 0,
  totalOrders: 0,
});

const toasts = ref<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
let toastSeed = 0;

// --- Chart options ---
const trendChartOption = shallowRef({
  tooltip: { trigger: "axis" as const },
  grid: { left: "4%", right: "4%", bottom: "12%", top: "6%", containLabel: true },
  xAxis: {
    type: "category" as const,
    data: ["1日", "2日", "3日", "4日", "5日", "6日", "7日"],
    axisLabel: { color: "#94a3b8", fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value" as const,
    splitLine: { lineStyle: { color: "#f1f5f9" } },
    axisLabel: { color: "#94a3b8", fontSize: 11 },
  },
  series: [
    {
      name: "交易金额",
      type: "line" as const,
      smooth: true,
      symbol: "none",
      lineStyle: { width: 2.5, color: "#d18b44" },
      areaStyle: {
        color: {
          type: "linear" as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(209, 139, 68, 0.25)" },
            { offset: 1, color: "rgba(209, 139, 68, 0.02)" },
          ],
        },
      },
      data: [0, 0, 0, 0, 0, 0, 0],
    },
  ],
});

const pieChartOption = shallowRef({
  tooltip: { trigger: "item" as const, formatter: "{b}: ¥{c}" },
  grid: { left: "4%", right: "4%", bottom: "4%", top: "4%", containLabel: true },
  series: [
    {
      type: "pie" as const,
      radius: ["36%", "62%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "{b}\n{d}%",
        fontSize: 11,
        color: "#64748b",
      },
      labelLine: { length: 12, length2: 8 },
      data: [
        { value: 0, name: "微信支付", itemStyle: { color: "#07c160" } },
        { value: 0, name: "支付宝", itemStyle: { color: "#1677ff" } },
        { value: 0, name: "钱包余额", itemStyle: { color: "#d18b44" } },
      ],
    },
  ],
});

const barChartOption = shallowRef({
  tooltip: { trigger: "axis" as const },
  grid: { left: "4%", right: "4%", bottom: "12%", top: "6%", containLabel: true },
  xAxis: {
    type: "category" as const,
    data: ["微信支付", "支付宝", "钱包余额", "银联", "其他"],
    axisLabel: { color: "#94a3b8", fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value" as const,
    splitLine: { lineStyle: { color: "#f1f5f9" } },
    axisLabel: { color: "#94a3b8", fontSize: 11 },
  },
  series: [
    {
      name: "交易金额",
      type: "bar" as const,
      barWidth: "40%",
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: "linear" as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#d18b44" },
            { offset: 1, color: "#b76716" },
          ],
        },
      },
      data: [0, 0, 0, 0, 0],
    },
  ],
});

// --- Navigation ---
function navigateTo(path: string) {
  if (router) {
    drawerVisible.value = false;
    router.push(`/${path}`).catch(() => {});
  }
}

// --- Data ---
function notify(message: string, type: "success" | "error" | "info") {
  const id = ++toastSeed;
  toasts.value.push({ id, message, type });
  window.setTimeout(() => { toasts.value = toasts.value.filter((item) => item.id !== id); }, 3200);
}

onMounted(async () => {
  try {
    const [today, total, trendData, distData, compData] = await Promise.all([
      request("dashboard/summary"),
      request("dashboard/summary?startDate=2000-01-01&endDate=2099-12-31"),
      request("dashboard/trend"),
      request("dashboard/channel-distribution"),
      request("dashboard/channel-comparison"),
    ]);

    dashboard.todayIncome = today?.totalConsumeAmount ?? 0;
    dashboard.totalIncome = total?.totalConsumeAmount ?? 0;
    dashboard.settledAmount = total?.settledAmount ?? 0;
    dashboard.refundAmount = total?.refundAmount ?? 0;
    dashboard.frozenAmount = total?.frozenAmount ?? 0;
    orderStats.todayOrders = today?.orderCount ?? 0;
    orderStats.refundOrders = total?.refundOrders ?? 0;
    orderStats.timeoutOrders = total?.timeoutOrders ?? 0;
    orderStats.totalOrders = total?.orderCount ?? 0;

    if (trendData?.length) {
      trendChartOption.value = {
        ...trendChartOption.value,
        series: [{ ...trendChartOption.value.series[0], data: trendData.map((d: any) => d.amount) }],
      };
    }
    if (distData?.length) {
      pieChartOption.value = {
        ...pieChartOption.value,
        series: [{ ...pieChartOption.value.series[0], data: distData }],
      };
    }
    if (compData?.categories) {
      barChartOption.value = {
        ...barChartOption.value,
        xAxis: { ...barChartOption.value.xAxis, data: compData.categories },
        series: [{ ...barChartOption.value.series[0], data: compData.values }],
      };
    }
  } catch {
    // backend not available
  }
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
.payment-console-page {
  background: linear-gradient(180deg, #eef7f6 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.payment-console-page :deep(.pm-surface) {
  background:
    radial-gradient(circle at top right, rgba(214, 134, 55, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 248, 242, 0.9));
}

/* ── Stats rows ── */
.pm-stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.pm-stats-row--order {
  grid-template-columns: repeat(4, 1fr);
}

.pm-stat-card {
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(203, 213, 225, 0.5);
  transition: all 0.2s ease;
}

.pm-stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  border-color: rgba(203, 213, 225, 0.8);
}

.pm-stat-card--primary {
  background:
    radial-gradient(circle at top right, rgba(255, 196, 144, 0.36), transparent 34%),
    linear-gradient(140deg, #402518 0%, #8f552d 54%, #d18b44 100%);
  border-color: transparent;
}

.pm-stat-card--primary .pm-stat-label,
.pm-stat-card--primary .pm-stat-value,
.pm-stat-card--primary .pm-stat-hint {
  color: #fff4eb;
}

.pm-stat-card--danger {
  border-left: 3px solid #ef4444;
}

.pm-stat-card--warn {
  border-left: 3px solid #f59e0b;
}

.pm-stat-label {
  display: block;
  font-size: 11.5px;
  font-weight: 500;
  color: #64748b;
}

.pm-stat-value {
  display: block;
  margin-top: 4px;
  font-size: 20px;
  font-weight: 700;
  color: #0b0f1a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.pm-stat-hint {
  display: block;
  margin-top: 4px;
  font-size: 10.5px;
  color: #94a3b8;
}

/* ── Chart rows ── */
.pm-chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 14px;
}

.pm-chart-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.5);
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.pm-chart-card--full {
  grid-column: 1 / -1;
}

.pm-chart-header {
  margin-bottom: 8px;
}

.pm-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #0b0f1a;
}

/* ── Toast ── */
.pm-toast-stack {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.pm-toast {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: pm-toast-in 0.25s ease-out;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}

@keyframes pm-toast-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.pm-toast-success {
  background: rgba(236, 253, 245, 0.95);
  color: #065f46;
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.pm-toast-error {
  background: rgba(254, 242, 242, 0.95);
  color: #991b1b;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.pm-toast-info {
  background: rgba(239, 246, 255, 0.95);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* ── Drawer cards ── */
.pm-drawer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 0;
}

.pm-drawer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 16px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  color: #1f1a16;
}

.pm-drawer-card:hover {
  background: linear-gradient(135deg, #f5f0eb, #faead7);
  border-color: #d18b44;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(209, 139, 68, 0.15);
}

.pm-drawer-card__title {
  font-size: 13px;
  font-weight: 600;
}

.pm-drawer-card__desc {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .pm-stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .pm-stats-row--order {
    grid-template-columns: repeat(2, 1fr);
  }
  .pm-chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
