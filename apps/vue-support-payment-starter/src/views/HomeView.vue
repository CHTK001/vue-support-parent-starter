<template>
  <section class="ops-view home-view">
    <div class="ops-hero">
      <article class="ops-hero__intro">
        <p class="ops-kicker">Payment Home</p>
        <h3 class="ops-title">支付中台总览先给出状态，再进入执行页</h3>
        <p class="ops-copy">
          首页收拢商户、订单、流水和能力目录，避免一进系统就落到单一列表。
          这里优先回答三个问题：当前有没有可操作商户、订单状态是否健康、联调应该走钱包还是第三方 mock。
        </p>
        <div class="ops-ribbon">
          <span class="ops-ribbon__item">钱包可真实闭环</span>
          <span class="ops-ribbon__item">第三方默认走 mock 验证返回结构</span>
          <span class="ops-ribbon__item">商户 / 订单 / 流水一跳直达</span>
        </div>
      </article>

      <div class="ops-hero__stats">
        <article class="ops-stat">
          <p class="ops-stat__label">商户总数</p>
          <strong class="ops-stat__value">{{ metrics.merchantTotal }}</strong>
          <p class="ops-stat__desc">已激活 {{ metrics.activeMerchants }} 个，钱包开启 {{ metrics.walletMerchants }} 个。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">订单总数</p>
          <strong class="ops-stat__value">{{ metrics.orderTotal }}</strong>
          <p class="ops-stat__desc">支付中 {{ metrics.payingOrders }} 个，退款中 {{ metrics.refundingOrders }} 个。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">流水总数</p>
          <strong class="ops-stat__value">{{ metrics.transactionTotal }}</strong>
          <p class="ops-stat__desc">成功 {{ metrics.successTransactions }} 条，处理中 {{ metrics.processingTransactions }} 条。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">能力目录</p>
          <strong class="ops-stat__value">{{ metrics.executableGuides }}</strong>
          <p class="ops-stat__desc">当前可执行渠道 {{ metrics.executableGuides }} 个，仅指引 {{ metrics.guideOnlyGuides }} 个。</p>
        </article>
      </div>
    </div>

    <div class="ops-split">
      <div class="ops-subpanel">
        <p class="ops-kicker">Quick Entry</p>
        <h4 class="drawer-title">从首页进入具体执行页</h4>
        <p class="ops-section-copy">
          首页负责概览和分流，真正的配置、支付、查单、退款和对账分别放在对应页面中操作。
        </p>
        <div class="entry-grid">
          <button class="entry-card" type="button" @click="go('/merchants')">
            <strong>商户与支付方式</strong>
            <span>配置商户、渠道、Provider SPI 与开通指引。</span>
          </button>
          <button class="entry-card" type="button" @click="go('/orders')">
            <strong>订单管理</strong>
            <span>创建订单、执行支付、查单、退款和状态补偿。</span>
          </button>
          <button class="entry-card" type="button" @click="go('/transactions')">
            <strong>交易流水</strong>
            <span>按订单号和状态核对支付、退款和异常流水。</span>
          </button>
        </div>
      </div>

      <div class="ops-note">
        <p class="ops-note__label">联调建议</p>
        <p class="ops-note__text">
          需要验证真实扣款与退款时优先走钱包；需要验证 `launchType`、`sdkParams`、`payUrl`
          和订单状态机时走微信/支付宝 mock；要做正式联调再切换到真实商户密钥。
        </p>
      </div>
    </div>

    <div class="ops-split">
      <div class="ops-subpanel">
        <p class="ops-kicker">Health Check</p>
        <h4 class="drawer-title">当前系统看板</h4>
        <div class="health-list">
          <div class="health-item">
            <span>支付测试建议</span>
            <strong>{{ metrics.walletMerchants > 0 ? "可直接走钱包闭环" : "先在商户页打开钱包能力" }}</strong>
          </div>
          <div class="health-item">
            <span>第三方渠道联调</span>
            <strong>{{ metrics.executableGuides > 0 ? "先用 mock 验证页面拉起" : "先补齐可执行渠道" }}</strong>
          </div>
          <div class="health-item">
            <span>订单状态压力</span>
            <strong>{{ metrics.payingOrders + metrics.refundingOrders }}</strong>
          </div>
        </div>
      </div>

      <div class="ops-subpanel">
        <p class="ops-kicker">Notes</p>
        <h4 class="drawer-title">首页存在的意义</h4>
        <p class="ops-section-copy">
          以前一进系统直接落商户页，信息密度高但不告诉你“当前该做什么”。现在先看总览，再决定去配置、执行还是对账。
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { getChannelCatalog, getMerchantList, getOrderList, getTransactionList } from "../api/payment";
import { isExecutableChannel } from "../types/payment";

const router = useRouter();

const metrics = reactive({
  merchantTotal: 0,
  activeMerchants: 0,
  walletMerchants: 0,
  orderTotal: 0,
  payingOrders: 0,
  refundingOrders: 0,
  transactionTotal: 0,
  successTransactions: 0,
  processingTransactions: 0,
  executableGuides: 0,
  guideOnlyGuides: 0,
});

function go(path: string) {
  router.push(path);
}

async function loadHome() {
  const [merchantRes, orderRes, transactionRes, catalogRes] = await Promise.all([
    getMerchantList({ page: 1, size: 200 }),
    getOrderList({ page: 1, size: 200 }),
    getTransactionList({ pageNum: 1, pageSize: 200 }),
    getChannelCatalog(),
  ]);

  const merchants = merchantRes.data.records || [];
  const orders = orderRes.data.records || [];
  const transactions = transactionRes.data.records || [];
  const guides = catalogRes.data || [];

  metrics.merchantTotal = merchantRes.data.total || merchants.length;
  metrics.activeMerchants = merchants.filter((item) => item.status === 1).length;
  metrics.walletMerchants = merchants.filter((item) => item.walletEnabled).length;

  metrics.orderTotal = orderRes.data.total || orders.length;
  metrics.payingOrders = orders.filter((item) => item.status === "PAYING").length;
  metrics.refundingOrders = orders.filter((item) => item.status === "REFUNDING").length;

  metrics.transactionTotal = transactionRes.data.total || transactions.length;
  metrics.successTransactions = transactions.filter((item) => item.status === 1).length;
  metrics.processingTransactions = transactions.filter((item) => item.status === 2).length;

  metrics.executableGuides = guides.filter((item) => isExecutableChannel(item.channelType, item.channelSubType)).length;
  metrics.guideOnlyGuides = Math.max(guides.length - metrics.executableGuides, 0);
}

onMounted(loadHome);
</script>

<style scoped>
.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.entry-card {
  padding: 18px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.92) 0%, rgba(246, 236, 223, 0.92) 100%);
  color: #24170f;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(122, 87, 53, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 0 0 1px rgba(122, 87, 53, 0.08),
    0 18px 32px rgba(56, 34, 18, 0.1);
}

.entry-card strong,
.entry-card span {
  display: block;
}

.entry-card span {
  margin-top: 8px;
  color: #6d5541;
  line-height: 1.75;
}

.drawer-title {
  margin: 0;
  font-size: 22px;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.health-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.health-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(122, 87, 53, 0.08);
}

.health-item span {
  color: #7b624d;
}

.health-item strong {
  color: #271911;
}

@media (max-width: 1100px) {
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
