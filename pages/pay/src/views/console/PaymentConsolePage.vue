<template>
  <PmPageShell page-class="payment-console-page">
    <PmSurface
      eyebrow="支付管理台"
      title="台账"
      description="今日收益、总交易额与退款统计概览。"
    />

    <PmStatGrid>
      <PmStatCard
        label="今日收益"
        hint="今日新增收入金额"
        class="stat-primary"
      >
        <template #value>{{ formatCurrency(dashboard.todayIncome) }}</template>
      </PmStatCard>
      <PmStatCard
        label="总交易额"
        hint="累计收入金额"
      >
        <template #value>{{ formatCurrency(dashboard.totalIncome) }}</template>
      </PmStatCard>
      <PmStatCard
        label="退款金额"
        hint="累计退款"
        class="stat-danger"
      >
        <template #value>{{ formatCurrency(dashboard.refundAmount) }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmPanel title="功能导航" description="快捷进入各管理模块">
      <div class="nav-grid">
        <div v-for="card in functionCards" :key="card.key" class="nav-card" @click="navigateTo(card.key)">
          <el-icon :size="24"><component :is="card.icon" /></el-icon>
          <span class="nav-card__title">{{ card.title }}</span>
          <span class="nav-card__desc">{{ card.description }}</span>
        </div>
      </div>
    </PmPanel>
  </PmPageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { Shop, Tickets, CreditCard, RefreshLeft, Coin, WalletFilled, CircleCheck, Setting } from "@element-plus/icons-vue";
import PmPageShell from "../../components/layout/PmPageShell.vue";
import PmSurface from "../../components/layout/PmSurface.vue";
import PmStatGrid from "../../components/layout/PmStatGrid.vue";
import PmStatCard from "../../components/layout/PmStatCard.vue";
import PmPanel from "../../components/layout/PmPanel.vue";
import { formatCurrency } from "../../utils/format";

let router: ReturnType<typeof useRouter> | null = null;
try {
  router = useRouter();
} catch {
  // no router available (embedded mode)
}

interface FunctionCard {
  key: string;
  title: string;
  icon: unknown;
  description: string;
}

const functionCards: FunctionCard[] = [
  { key: "merchants", title: "商户与支付方式", icon: Shop, description: "维护商户、支付方式和回调地址" },
  { key: "orders", title: "订单管理", icon: Tickets, description: "查看订单状态、金额和流转日志" },
  { key: "transactions", title: "交易流水", icon: CreditCard, description: "排查支付、退款、第三方交易记录" },
  { key: "refunds", title: "退款管理", icon: RefreshLeft, description: "处理退款申请和退款状态查询" },
  { key: "coupons", title: "优惠券管理", icon: Coin, description: "管理优惠券模板和发放记录" },
  { key: "wallet-console", title: "钱包管理", icon: WalletFilled, description: "管理钱包账户余额、充值及流水追溯" },
  { key: "withdraw-approvals", title: "提现审批", icon: CircleCheck, description: "审核商户发起的钱包提现申请" },
  { key: "global-config", title: "支付全局配置", icon: Setting, description: "配置支付系统全局参数" },
];

const API_ROOT = "/api/ops/";

const dashboard = reactive({
  totalIncome: 0,
  todayIncome: 0,
  refundAmount: 0,
});

function navigateTo(path: string) {
  if (router) {
    router.push(`/${path}`).catch(() => {});
  }
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mapSummary(data: any) {
  return {
    totalConsumeAmount: data?.totalConsumeAmount ?? 0,
    totalRefundAmount: data?.totalRefundAmount ?? 0,
  };
}

onMounted(async () => {
  try {
    const today = todayStr();
    const [todayResult, totalResult] = await Promise.all([
      request(`dashboard/summary?startDate=${today}&endDate=${today}`),
      request("dashboard/summary"),
    ]);

    dashboard.todayIncome = mapSummary(todayResult).totalConsumeAmount;
    dashboard.totalIncome = mapSummary(totalResult).totalConsumeAmount;
    dashboard.refundAmount = mapSummary(totalResult).totalRefundAmount;
  } catch (e) {
    console.error("[PaymentConsole]台账数据加载失败", e);
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
.stat-primary :deep(.pm-stat-card .pm-stat-card__hint) {
  color: #eef2ff !important;
}

.stat-danger :deep(.pm-stat-card) {
  border-left: 3px solid var(--pm-color-danger, #dc2626);
}

/* ── Nav Grid ── */
.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--pm-space-md, 14px);
  margin-top: var(--pm-space-sm, 8px);
}

.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--pm-space-sm, 8px);
  padding: 28px 16px;
  border-radius: var(--pm-border-radius-md, 16px);
  background: var(--pm-surface-card, rgba(255, 255, 255, 0.85));
  border: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  color: var(--pm-text-primary, #070b15);
  box-shadow: var(--pm-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.nav-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--pm-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
  border-color: var(--pm-color-brand, #4f46e5);
  background: var(--pm-color-brand-light, #eef2ff);
}

.nav-card .el-icon {
  color: var(--pm-color-brand, #4f46e5);
}

.nav-card__title {
  font-size: var(--pm-font-size-sm, 12.5px);
  font-weight: var(--pm-font-weight-semibold, 600);
  color: var(--pm-text-primary, #070b15);
}

.nav-card__desc {
  font-size: var(--pm-font-size-xs, 11px);
  color: var(--pm-text-muted, #8b97a9);
  line-height: 1.4;
}

@media (max-width: 900px) {
  .nav-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
