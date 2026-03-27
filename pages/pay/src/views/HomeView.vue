<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card hero-card--main">
        <p>Payment Readiness</p>
        <strong>{{ readinessScore }}%</strong>
        <span>基于商户激活、订单执行、钱包处理和微信支付分履约情况生成的运行态快照。</span>
      </article>
      <article class="hero-card">
        <p>商户与渠道</p>
        <strong>{{ merchantTotal }}</strong>
        <span>激活商户 {{ activeMerchantCount }}，当前页已配置渠道 {{ configuredChannelCount }}。</span>
      </article>
      <article class="hero-card">
        <p>订单与流水</p>
        <strong>{{ orderTotal }}</strong>
        <span>待处理订单 {{ pendingOrderCount }}，交易流水 {{ transactionTotal }}。</span>
      </article>
      <article class="hero-card">
        <p>钱包订单</p>
        <strong>{{ walletTotal }}</strong>
        <span>处理中 {{ walletProcessingCount }}，成功 {{ walletSuccessCount }}。</span>
      </article>
      <article class="hero-card">
        <p>微信支付分</p>
        <strong>{{ payScoreTotal }}</strong>
        <span>服务中 {{ payScoreDoingCount }}，已完结 {{ payScoreCompletedCount }}。</span>
      </article>
    </div>

    <div class="dashboard-grid">
      <el-card class="panel panel--highlight" shadow="never">
        <template #header>
          <div class="panel__header">
            <div>
              <p class="panel__eyebrow">Mission Board</p>
              <h3>关键动作入口</h3>
            </div>
          </div>
        </template>

        <div class="action-grid">
          <button class="action-tile" type="button" @click="router.push('/merchants')">
            <span class="action-tile__tag">配置</span>
            <strong>商户与渠道</strong>
            <p>补齐商户、provider SPI、回调地址和可执行子渠道。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/orders')">
            <span class="action-tile__tag">执行</span>
            <strong>支付订单台</strong>
            <p>查看订单状态机、发起支付、同步第三方状态和退款动作。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/wallet-orders')">
            <span class="action-tile__tag">钱包</span>
            <strong>钱包订单台</strong>
            <p>创建充值、转账、提现订单，并确认回调地址与处理结果。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/wechat-pay-score')">
            <span class="action-tile__tag">增强</span>
            <strong>微信支付分</strong>
            <p>创建服务订单、同步状态、完结订单并追踪专属回调。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/transactions')">
            <span class="action-tile__tag">对账</span>
            <strong>交易流水</strong>
            <p>核对支付、退款和处理中流水，快速定位异常交易。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/refunds')">
            <span class="action-tile__tag">退款</span>
            <strong>退款管理</strong>
            <p>集中查看退款单、确认成功/失败，并核对第三方退款单号。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/wallet-console')">
            <span class="action-tile__tag">余额</span>
            <strong>钱包账户</strong>
            <p>查询余额、查看账变、直接充值，为钱包支付链路测试做准备。</p>
          </button>
          <button class="action-tile" type="button" @click="router.push('/operations')">
            <span class="action-tile__tag">运维</span>
            <strong>运营中心</strong>
            <p>查看回调诊断、动态调整任务 cron，并处理回调异常重试。</p>
          </button>
        </div>
      </el-card>

      <el-card class="panel" shadow="never">
        <template #header>
          <div class="panel__header">
            <div>
              <p class="panel__eyebrow">Capability Matrix</p>
              <h3>执行能力矩阵</h3>
            </div>
          </div>
        </template>

        <div class="matrix-grid">
          <div class="matrix-item">
            <span class="matrix-item__label">标准支付</span>
            <strong>微信 / 支付宝 / 钱包 / 聚合路由</strong>
            <p>JSAPI、H5、APP、MINI_PROGRAM、NATIVE、WEB、WAP 与钱包余额链路已统一进主线。</p>
          </div>
          <div class="matrix-item">
            <span class="matrix-item__label">回调识别</span>
            <strong>路径携带业务号</strong>
            <p>`pay/refund/payscore/wallet` 都按路径上的订单号或退款号做精确分发。</p>
          </div>
          <div class="matrix-item">
            <span class="matrix-item__label">特殊能力</span>
            <strong>微信支付分与钱包订单已单独建模</strong>
            <p>不混入普通支付订单，独立保存服务订单、钱包订单、状态和通知结果。</p>
          </div>
          <div class="matrix-item">
            <span class="matrix-item__label">当前风险</span>
            <strong>{{ readinessRisk }}</strong>
            <p>{{ readinessAdvice }}</p>
          </div>
        </div>
      </el-card>

      <el-card class="panel" shadow="never">
        <template #header>
          <div class="panel__header">
            <div>
              <p class="panel__eyebrow">Runtime Snapshot</p>
              <h3>实时快照</h3>
            </div>
            <el-button text @click="loadDashboard">刷新</el-button>
          </div>
        </template>

        <div class="snapshot-list">
          <div class="snapshot-row">
            <span>激活商户占比</span>
            <el-progress :percentage="merchantActivationRate" :stroke-width="10" color="#b86f2c" />
          </div>
          <div class="snapshot-row">
            <span>成功订单占比</span>
            <el-progress :percentage="paidOrderRate" :stroke-width="10" color="#3f7b53" />
          </div>
          <div class="snapshot-row">
            <span>钱包成功占比</span>
            <el-progress :percentage="walletSuccessRate" :stroke-width="10" color="#7d5d2e" />
          </div>
          <div class="snapshot-row">
            <span>支付分完结占比</span>
            <el-progress :percentage="payScoreCompletedRate" :stroke-width="10" color="#446d8f" />
          </div>
        </div>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getMerchantChannels,
  getMerchantList,
  getOrderList,
  getTransactionList,
  getWalletOrderList,
  getWechatPayScoreList,
} from "../api/payment";
import type { Merchant } from "../types/payment";

const router = useRouter();

const merchantTotal = ref(0);
const activeMerchantCount = ref(0);
const configuredChannelCount = ref(0);
const orderTotal = ref(0);
const pendingOrderCount = ref(0);
const paidOrderCount = ref(0);
const transactionTotal = ref(0);
const walletTotal = ref(0);
const walletProcessingCount = ref(0);
const walletSuccessCount = ref(0);
const payScoreTotal = ref(0);
const payScoreDoingCount = ref(0);
const payScoreCompletedCount = ref(0);

const readinessScore = computed(() => {
  const scores = [
    merchantActivationRate.value,
    paidOrderRate.value,
    walletSuccessRate.value,
    payScoreCompletedRate.value,
  ];
  return Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length);
});

const merchantActivationRate = computed(() => percentage(activeMerchantCount.value, merchantTotal.value));
const paidOrderRate = computed(() => percentage(paidOrderCount.value, orderTotal.value));
const walletSuccessRate = computed(() => percentage(walletSuccessCount.value, walletTotal.value));
const payScoreCompletedRate = computed(() => percentage(payScoreCompletedCount.value, payScoreTotal.value));

const readinessRisk = computed(() => {
  if (merchantTotal.value === 0) {
    return "尚未配置商户";
  }
  if (configuredChannelCount.value === 0) {
    return "商户已存在但渠道未落地";
  }
  if (walletProcessingCount.value > walletSuccessCount.value && walletTotal.value > 0) {
    return "钱包订单处理中偏多";
  }
  if (payScoreTotal.value === 0) {
    return "支付分能力已接入但尚未实际创建订单";
  }
  if (pendingOrderCount.value > paidOrderCount.value) {
    return "待处理订单偏多";
  }
  return "主链路可用";
});

const readinessAdvice = computed(() => {
  if (merchantTotal.value === 0) {
    return "先去商户页录入商户和渠道，否则后续页面都只有空壳数据。";
  }
  if (configuredChannelCount.value === 0) {
    return "至少启用一个真实可执行渠道，再做订单、钱包或支付分联调。";
  }
  if (walletProcessingCount.value > walletSuccessCount.value && walletTotal.value > 0) {
    return "优先确认钱包回调地址和第三方状态，避免转账、提现长时间挂起。";
  }
  if (payScoreTotal.value === 0) {
    return "如果这轮要测微信支付分，下一步直接在“微信支付分”页创建服务订单。";
  }
  if (pendingOrderCount.value > paidOrderCount.value) {
    return "优先处理支付中、退款中和待回调订单，避免积压。";
  }
  return "可以继续做钱包、回调和支付分的联调验证。";
});

async function loadDashboard() {
  const merchantRes = await getMerchantList({ page: 1, size: 200 });
  const merchants = merchantRes.data.records;
  merchantTotal.value = merchantRes.data.total;
  activeMerchantCount.value = merchants.filter((item) => item.status === 1).length;

  const channelResults = await Promise.all(
    merchants.slice(0, 50).map((item: Merchant) => getMerchantChannels(item.id, { status: 1 })),
  );
  configuredChannelCount.value = channelResults.reduce((sum, item) => sum + item.data.length, 0);

  const orderRes = await getOrderList({ page: 1, size: 200 });
  orderTotal.value = orderRes.data.total;
  pendingOrderCount.value = orderRes.data.records.filter((item) =>
    ["PENDING", "PAYING", "REFUNDING"].includes(item.status),
  ).length;
  paidOrderCount.value = orderRes.data.records.filter((item) =>
    ["PAID", "COMPLETED", "REFUNDED"].includes(item.status),
  ).length;

  const transactionRes = await getTransactionList({ pageNum: 1, pageSize: 200 });
  transactionTotal.value = transactionRes.data.total;

  const walletRes = await getWalletOrderList({ pageNum: 1, pageSize: 200 });
  walletTotal.value = walletRes.data.total;
  walletProcessingCount.value = walletRes.data.records.filter((item) =>
    ["PENDING", "PROCESSING"].includes(item.status),
  ).length;
  walletSuccessCount.value = walletRes.data.records.filter((item) => item.status === "SUCCESS").length;

  const payScoreRes = await getWechatPayScoreList({ pageNum: 1, pageSize: 200 });
  payScoreTotal.value = payScoreRes.data.total;
  payScoreDoingCount.value = payScoreRes.data.records.filter((item) => item.state === "DOING").length;
  payScoreCompletedCount.value = payScoreRes.data.records.filter((item) =>
    ["COMPLETED", "SUCCESS"].includes(item.state),
  ).length;
}

function percentage(value: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

onMounted(loadDashboard);
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 18px;
}

.hero-card,
.panel {
  border: none;
  border-radius: 24px;
  box-shadow: 0 18px 60px rgba(54, 37, 23, 0.08);
}

.hero-card {
  padding: 20px 22px;
  background: linear-gradient(160deg, rgba(255, 246, 234, 0.92) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.hero-card--main {
  background:
    radial-gradient(circle at top right, rgba(216, 150, 74, 0.25), transparent 32%),
    linear-gradient(160deg, #2a1a10 0%, #53321b 60%, #8a5623 100%);
  color: #f9efe2;
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #8e6945;
}

.hero-card--main p,
.hero-card--main span,
.hero-card--main strong {
  color: #f9efe2;
}

.hero-card strong {
  display: block;
  margin: 10px 0 12px;
  font-size: 34px;
  color: #291b12;
}

.hero-card span {
  line-height: 1.7;
  color: #705847;
}

.panel {
  background: rgba(255, 251, 246, 0.92);
}

.panel--highlight {
  grid-row: span 2;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #bf8445;
}

.panel__header h3 {
  margin: 0;
  font-size: 24px;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.action-tile {
  text-align: left;
  border: 1px solid rgba(92, 63, 38, 0.08);
  border-radius: 22px;
  padding: 20px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 235, 218, 0.96) 100%);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(75, 46, 22, 0.12);
}

.action-tile__tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(187, 123, 49, 0.12);
  color: #9a5d20;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.action-tile strong,
.matrix-item strong {
  display: block;
  margin-top: 14px;
  font-size: 20px;
  color: #26170f;
}

.action-tile p,
.matrix-item p {
  margin: 10px 0 0;
  line-height: 1.7;
  color: #705847;
}

.matrix-grid {
  display: grid;
  gap: 12px;
}

.matrix-item {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(86, 54, 28, 0.08);
}

.matrix-item__label {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #bf8445;
}

.snapshot-list {
  display: grid;
  gap: 20px;
}

.snapshot-row {
  display: grid;
  gap: 8px;
}

.snapshot-row span {
  color: #6f5844;
}

@media (max-width: 1320px) {
  .hero-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .panel--highlight {
    grid-row: auto;
  }
}

@media (max-width: 720px) {
  .hero-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
