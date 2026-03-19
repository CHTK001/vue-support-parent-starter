<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card">
        <p>流水条数</p>
        <strong>{{ pagination.total }}</strong>
        <span>覆盖支付、退款等交易动作，辅助对账与问题追踪。</span>
      </article>
      <article class="hero-card">
        <p>成功流水</p>
        <strong>{{ successCount }}</strong>
        <span>状态为成功的支付与退款流水。</span>
      </article>
      <article class="hero-card">
        <p>处理中流水</p>
        <strong>{{ processingCount }}</strong>
        <span>适合排查待回调、待确认和退款处理中场景。</span>
      </article>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Transaction Trace</p>
            <h3>交易流水</h3>
          </div>
        </div>
      </template>

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

      <el-table :data="transactionList" v-loading="loading" border class="table">
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

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pager"
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
.view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.hero-card,
.panel {
  border: none;
  border-radius: 24px;
  box-shadow: 0 18px 60px rgba(54, 37, 23, 0.08);
}

.hero-card {
  padding: 20px 22px;
  background: linear-gradient(160deg, rgba(255, 246, 234, 0.9) 0%, rgba(255, 255, 255, 0.88) 100%);
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #8e6945;
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
  margin-bottom: 18px;
}

.table {
  border-radius: 18px;
  overflow: hidden;
}

.pager {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1100px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
