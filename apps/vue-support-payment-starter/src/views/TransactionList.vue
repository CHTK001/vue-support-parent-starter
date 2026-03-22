<template>
  <section class="ops-view transaction-view">
    <div class="ops-hero">
      <article class="ops-hero__intro">
        <p class="ops-kicker">Transaction Trace</p>
        <h3 class="ops-title">把支付动作、退款动作和对账线索压缩到一张追踪面板里</h3>
        <p class="ops-copy">
          流水页面向排障和对账，重点是快速识别成功、处理中和失败的交易段，
          判断是状态机未完成、查单未执行，还是第三方返回和本地订单不一致。
        </p>
        <div class="ops-ribbon">
          <span class="ops-ribbon__item">支付 / 退款统一追踪</span>
          <span class="ops-ribbon__item">支持订单号快速定位</span>
          <span class="ops-ribbon__item">适合联调 mock 与钱包实测后的核账</span>
        </div>
      </article>

      <div class="ops-hero__stats">
        <article class="ops-stat">
          <p class="ops-stat__label">流水条数</p>
          <strong class="ops-stat__value">{{ pagination.total }}</strong>
          <p class="ops-stat__desc">覆盖支付、退款等交易动作，辅助对账与问题追踪。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">成功流水</p>
          <strong class="ops-stat__value">{{ successCount }}</strong>
          <p class="ops-stat__desc">状态为成功的支付与退款流水。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">处理中流水</p>
          <strong class="ops-stat__value">{{ processingCount }}</strong>
          <p class="ops-stat__desc">适合排查待回调、待确认和退款处理中场景。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">失败流水</p>
          <strong class="ops-stat__value">{{ failedCount }}</strong>
          <p class="ops-stat__desc">优先核对失败原因、第三方单号和请求快照是否齐全。</p>
        </article>
      </div>
    </div>

    <div class="ops-note">
      <p class="ops-note__label">对账建议</p>
      <p class="ops-note__text">
        钱包支付应当直接看到本地扣款流水；第三方 mock 场景会记录请求与返回快照，
        适合先验证字段语义，再切换到真实商户配置做正式联调。
      </p>
    </div>

    <el-card class="ops-panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Transaction Trace</p>
            <h3>交易流水</h3>
          </div>
        </div>
      </template>

      <div class="ops-toolbar">
        <el-form :inline="true" :model="searchForm" class="toolbar">
          <el-form-item label="商户">
            <el-select v-model="searchForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
              <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable />
          </el-form-item>
          <el-form-item label="交易类型">
            <el-select v-model="searchForm.transactionType" clearable placeholder="全部类型" style="width: 180px">
              <el-option label="支付" value="PAY" />
              <el-option label="退款" value="REFUND" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" clearable placeholder="全部状态" style="width: 180px">
              <el-option v-for="(label, value) in TransactionStatusMap" :key="value" :label="label" :value="Number(value)" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleResetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="ops-toolbar__meta">
          <span class="ops-chip">支付流水 {{ payCount }}</span>
          <span class="ops-chip">退款流水 {{ refundCount }}</span>
          <span class="ops-chip">当前页金额 {{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>

      <div class="ops-table">
        <el-table :data="transactionList" v-loading="loading" border>
        <el-table-column prop="transactionNo" label="流水号" min-width="220" />
        <el-table-column prop="orderNo" label="订单号" min-width="220" />
        <el-table-column prop="merchantId" label="商户ID" width="120" />
        <el-table-column prop="channelType" label="渠道类型" width="120" />
        <el-table-column prop="transactionType" label="交易类型" width="120" />
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.amount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ TransactionStatusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="thirdPartyTransactionNo" label="第三方流水号" min-width="200" />
        <el-table-column prop="remark" label="备注" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        </el-table>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="ops-pager"
        @current-change="loadTransactions"
        @size-change="loadTransactions"
      />
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { getMerchantList, getTransactionList } from "../api/payment";
import type { Merchant, TransactionRecord } from "../types/payment";
import { TransactionStatusMap } from "../types/payment";

const loading = ref(false);
const merchantOptions = ref<Merchant[]>([]);
const transactionList = ref<TransactionRecord[]>([]);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const searchForm = reactive({
  merchantId: undefined as number | undefined,
  orderNo: "",
  transactionType: "",
  status: undefined as number | undefined,
});

const successCount = computed(() => transactionList.value.filter((item) => item.status === 1).length);
const processingCount = computed(() => transactionList.value.filter((item) => item.status === 2).length);
const failedCount = computed(() => transactionList.value.filter((item) => item.status === 0).length);
const payCount = computed(() => transactionList.value.filter((item) => item.transactionType === "PAY").length);
const refundCount = computed(() => transactionList.value.filter((item) => item.transactionType === "REFUND").length);
const totalAmount = computed(() =>
  transactionList.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
);

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records;
}

async function loadTransactions() {
  loading.value = true;
  try {
    const res = await getTransactionList({
      pageNum: pagination.page,
      pageSize: pagination.size,
      merchantId: searchForm.merchantId,
      orderNo: searchForm.orderNo || undefined,
      transactionType: searchForm.transactionType || undefined,
      status: searchForm.status,
    });
    transactionList.value = res.data.records;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadTransactions();
}

function handleResetSearch() {
  searchForm.merchantId = undefined;
  searchForm.orderNo = "";
  searchForm.transactionType = "";
  searchForm.status = undefined;
  handleSearch();
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function statusTag(status: number) {
  if (status === 1) {
    return "success";
  }
  if (status === 2) {
    return "warning";
  }
  return "danger";
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadTransactions()]);
});
</script>

<style scoped>
.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.toolbar {
  flex: 1 1 auto;
}

@media (max-width: 1100px) {
  .panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
