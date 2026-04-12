<template>
  <section class="home-view">
    <div class="home-shell">
      <section class="dashboard-card">
        <div class="dashboard-card__header">
          <div>
            <p class="dashboard-card__eyebrow">Business Dashboard</p>
            <h1>支付业务首页</h1>
            <p class="dashboard-card__desc">
              首页只保留业务统计和常用入口，默认展示今天的数据。
            </p>
          </div>
          <div class="dashboard-card__actions">
            <el-button-group>
              <el-button
                v-for="item in rangePresets"
                :key="item.value"
                :type="activePreset === item.value ? 'primary' : 'default'"
                @click="applyPreset(item.value)"
              >
                {{ item.label }}
              </el-button>
            </el-button-group>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleRangeChange"
            />
            <el-button type="primary" :icon="RefreshRight" :loading="loading" @click="loadDashboard">
              刷新
            </el-button>
          </div>
        </div>

        <div class="dashboard-card__tips">
          <el-tag effect="plain" type="success">统计周期 {{ currentRangeLabel }}</el-tag>
          <el-tag effect="plain">自动关单 {{ schedulerEngineLabel }}</el-tag>
          <span class="dashboard-card__tip-text">支付、退款、回调均来自后端真实汇总接口</span>
        </div>
      </section>

      <section class="stats-grid">
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

      <section class="info-strip">
        <article class="info-chip">
          <span>商户数</span>
          <strong>{{ merchantTotal }}</strong>
          <small>激活 {{ activeMerchantCount }} / 已配 {{ configuredMerchantCount }}</small>
        </article>
        <article class="info-chip">
          <span>流水数</span>
          <strong>{{ transactionCount }}</strong>
          <small>按后端时间范围聚合</small>
        </article>
        <article class="info-chip">
          <span>成功回调</span>
          <strong>{{ successNotifyCount }}</strong>
          <small>失败 {{ failedNotifyCount }}</small>
        </article>
        <article class="info-chip">
          <span>定时任务</span>
          <strong>{{ enabledTaskCount }}</strong>
          <small>支持 payment / job</small>
        </article>
      </section>

      <section class="entry-card">
        <div class="entry-card__header">
          <div>
            <p class="dashboard-card__eyebrow">Quick Entry</p>
            <h2>业务入口</h2>
          </div>
        </div>

        <div class="entry-grid">
          <a
            v-for="item in entryCards"
            :key="item.path"
            class="entry-button"
            :href="item.path"
          >
            <span class="entry-button__icon" :style="{ background: item.softColor, color: item.color }">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <span class="entry-button__content">
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>
          </a>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { userKey } from "@repo/config";
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
import { getPaymentDashboardSummary, getSchedulerTasks } from "../api/payment";
import type { PaymentDashboardSummary, PaymentSchedulerTask } from "../types/payment";
import { formatCurrency } from "./support/paymentView";

type PresetValue = "today" | "7d" | "30d" | "custom";

const loading = ref(false);
const activePreset = ref<PresetValue>("today");
const dateRange = ref<[Date, Date] | null>(createPresetRange("today"));
const schedulerTasks = ref<PaymentSchedulerTask[]>([]);
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

const rangePresets: Array<{ label: string; value: PresetValue }> = [
  { label: "今天", value: "today" },
  { label: "近7天", value: "7d" },
  { label: "近30天", value: "30d" },
];

const roles = computed(() => {
  try {
    const raw = localStorage.getItem(userKey);
    if (!raw) {
      return [] as string[];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.roles) ? parsed.roles : Array.isArray(parsed?.userInfo?.roles) ? parsed.userInfo.roles : [];
  } catch {
    return [] as string[];
  }
});

const isAdmin = computed(() =>
  roles.value.some((role) => ["ADMIN", "SUPER_ADMIN", "admin", "superadmin"].includes(String(role))),
);

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
  if (!schedulerTasks.value.length) {
    return "未发现任务";
  }
  return "内置调度，可切换 job-starter";
});

const currentRangeLabel = computed(() => {
  if (!dateRange.value) {
    return "-";
  }
  return `${formatDate(dateRange.value[0])} 至 ${formatDate(dateRange.value[1])}`;
});

const summaryCards = computed(() => [
  {
    label: "支付订单数",
    value: `${paymentOrderCount.value}`,
    hint: "按后端真实支付时间聚合",
    icon: Tickets,
    color: "#0f766e",
    softColor: "rgba(15, 118, 110, 0.12)",
  },
  {
    label: "退款数量",
    value: `${refundCount.value}`,
    hint: "按退款成功记录统计",
    icon: CreditCard,
    color: "#c2410c",
    softColor: "rgba(194, 65, 12, 0.12)",
  },
  {
    label: "总消费金额",
    value: formatCurrency(totalConsumeAmount.value),
    hint: "后端汇总 paidAmount / orderAmount",
    icon: Money,
    color: "#2563eb",
    softColor: "rgba(37, 99, 235, 0.12)",
  },
  {
    label: "退款金额",
    value: formatCurrency(totalRefundAmount.value),
    hint: "后端汇总退款成功金额",
    icon: DataAnalysis,
    color: "#9333ea",
    softColor: "rgba(147, 51, 234, 0.12)",
  },
  {
    label: "回调请求数量",
    value: `${callbackRequestCount.value}`,
    hint: `成功 ${successNotifyCount.value} / 失败 ${failedNotifyCount.value}`,
    icon: Bell,
    color: "#d97706",
    softColor: "rgba(217, 119, 6, 0.12)",
  },
  {
    label: "平均耗时",
    value: averageDuration.value,
    hint: "回调接收至处理完成耗时",
    icon: Timer,
    color: "#475467",
    softColor: "rgba(71, 84, 103, 0.12)",
  },
]);

const entryCards = computed(() => {
  const cards = [
    {
      title: "商户管理",
      description: "维护商户、支付方式和回调地址",
      path: "/merchants",
      icon: Shop,
      color: "#0f766e",
      softColor: "rgba(15, 118, 110, 0.12)",
    },
    {
      title: "订单管理",
      description: "查看订单、支付状态和退款动作",
      path: "/orders",
      icon: Tickets,
      color: "#2563eb",
      softColor: "rgba(37, 99, 235, 0.12)",
    },
    {
      title: "交易流水",
      description: "排查支付、退款、第三方交易记录",
      path: "/transactions",
      icon: CreditCard,
      color: "#7c3aed",
      softColor: "rgba(124, 58, 237, 0.12)",
    },
  ];

  if (isAdmin.value) {
    cards.push({
      title: "订单配置",
      description: "管理自动关单、分表和迁移策略",
      path: "/order-config",
      icon: Setting,
      color: "#475467",
      softColor: "rgba(71, 84, 103, 0.12)",
    });
  }

  return cards;
});

function createPresetRange(preset: Exclude<PresetValue, "custom">): [Date, Date] {
  const end = endOfDay(new Date());
  if (preset === "today") {
    return [startOfDay(new Date()), end];
  }
  if (preset === "7d") {
    return [startOfDay(addDays(new Date(), -6)), end];
  }
  return [startOfDay(addDays(new Date(), -29)), end];
}

function applyPreset(preset: Exclude<PresetValue, "custom">) {
  activePreset.value = preset;
  dateRange.value = createPresetRange(preset);
  void loadDashboard();
}

function handleRangeChange(value: [Date, Date] | null) {
  if (!value) {
    applyPreset("today");
    return;
  }
  activePreset.value = "custom";
  void loadDashboard();
}

function formatDuration(value: number) {
  if (!value) {
    return "-";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }
  return `${Math.round(value)} ms`;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadDashboard() {
  loading.value = true;
  try {
    const [summaryRes, schedulerRes] = await Promise.all([
      getPaymentDashboardSummary({
        startDate: dateRange.value ? formatDate(dateRange.value[0]) : undefined,
        endDate: dateRange.value ? formatDate(dateRange.value[1]) : undefined,
      }),
      getSchedulerTasks(),
    ]);
    dashboardSummary.value = {
      ...dashboardSummary.value,
      ...(summaryRes.data || {}),
    };
    schedulerTasks.value = schedulerRes.data || [];
  } catch (error) {
    console.error(error);
    ElMessage.error("首页统计加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  dateRange.value = createPresetRange("today");
  loadDashboard();
});
</script>

<style scoped>
.home-view {
  min-height: 100%;
  padding: 24px;
  background:
    linear-gradient(180deg, #f2f6f5 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.home-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dashboard-card,
.entry-card {
  border: 1px solid #dde5e7;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
}

.dashboard-card {
  padding: 24px 28px 20px;
}

.dashboard-card__header,
.entry-card__header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.dashboard-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.dashboard-card h1,
.entry-card h2 {
  margin: 0;
  color: #101828;
}

.dashboard-card__desc {
  margin: 10px 0 0;
  color: #667085;
  line-height: 1.75;
}

.dashboard-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.dashboard-card__tips {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.dashboard-card__tip-text {
  color: #667085;
  font-size: 13px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 22px;
  border: 1px solid #dde5e7;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.04);
}

.metric-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.metric-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-card__label {
  color: #667085;
  font-size: 13px;
}

.metric-card__value {
  color: #101828;
  font-size: 28px;
  line-height: 1.1;
}

.metric-card__hint {
  color: #667085;
  line-height: 1.7;
}

.info-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.info-chip {
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px solid #dde5e7;
  background: rgba(255, 255, 255, 0.9);
}

.info-chip span,
.info-chip small {
  display: block;
  color: #667085;
}

.info-chip strong {
  display: block;
  margin: 8px 0 6px;
  color: #101828;
  font-size: 24px;
}

.entry-card {
  padding: 24px 28px 28px;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.entry-button {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid #d8e1e4;
  border-radius: 20px;
  background: #fff;
  text-align: left;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.entry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.08);
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

.entry-button__content strong {
  color: #101828;
  font-size: 16px;
}

.entry-button__content small {
  color: #667085;
  line-height: 1.7;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .info-strip,
  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .home-view {
    padding: 16px;
  }

  .dashboard-card,
  .entry-card {
    padding-inline: 18px;
  }

  .dashboard-card__header,
  .entry-card__header {
    flex-direction: column;
  }

  .dashboard-card__actions {
    justify-content: flex-start;
  }

  .stats-grid,
  .info-strip,
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
