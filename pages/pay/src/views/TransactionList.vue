<template>
  <section class="payment-page transaction-page">
    <header class="payment-surface">
      <div>
        <p class="payment-surface__eyebrow">Transaction Trace</p>
        <h1 class="payment-surface__title">交易流水</h1>
        <p class="payment-surface__desc">流水统一切回 `ScTable`，只保留对账需要的字段和筛选条件，避免在一页塞太多排障信息。</p>
      </div>
      <div class="payment-surface__actions">
        <el-button :icon="RefreshRight" @click="reloadAll">刷新</el-button>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat">
        <span class="payment-stat__label">流水总数</span>
        <strong class="payment-stat__value">{{ stats.total }}</strong>
        <span class="payment-stat__hint">支付、退款统一在此追踪。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">成功流水</span>
        <strong class="payment-stat__value">{{ stats.success }}</strong>
        <span class="payment-stat__hint">用于快速核对已落账记录。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">处理中</span>
        <strong class="payment-stat__value">{{ stats.processing }}</strong>
        <span class="payment-stat__hint">适合排查待确认、待回调问题。</span>
      </article>
    </section>

    <section class="payment-toolbar">
      <div class="payment-toolbar__row">
        <div class="payment-toolbar__form">
          <el-select v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
          <el-input v-model="queryForm.orderNo" clearable placeholder="订单号" style="width: 220px" @keyup.enter="handleSearch" />
          <el-select v-model="queryForm.transactionType" clearable placeholder="交易类型" style="width: 160px">
            <el-option label="支付" value="PAY" />
            <el-option label="退款" value="REFUND" />
          </el-select>
          <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 160px">
            <el-option v-for="(label, value) in TransactionStatusMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </section>

    <section class="payment-panel">
      <div class="payment-panel__head">
        <div>
          <p class="payment-panel__eyebrow">ScTable</p>
          <h2 class="payment-panel__title">流水主表</h2>
          <p class="payment-panel__desc">统一使用标准表格视图，保留流水号、订单号、金额、状态和第三方流水号。</p>
        </div>
      </div>
      <ScTable ref="tableRef" table-name="payment-transaction-table" row-key="id" border stripe :search="false" :hide-do="true" :hide-refresh="true" :hide-setting="true" :params="queryForm" :url="fetchTransactionTable">
        <el-table-column label="流水号" min-width="220">
          <template #default="{ row }">
            <div class="cell-main"><strong>{{ row.transactionNo }}</strong><span>{{ row.thirdPartyTransactionNo || "未回填第三方流水号" }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="订单" min-width="220">
          <template #default="{ row }">
            <div class="cell-main"><strong>{{ row.orderNo }}</strong><span>商户 #{{ row.merchantId }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="类型 / 渠道" min-width="160">
          <template #default="{ row }">
            <div class="cell-main"><strong>{{ row.transactionType }}</strong><span>{{ row.channelType }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140" align="center">
          <template #default="{ row }"><strong>{{ formatCurrency(row.amount) }}</strong></template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'danger'" effect="plain">{{ TransactionStatusMap[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
      </ScTable>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { RefreshRight, Search } from "@element-plus/icons-vue";
import { getMerchantList, getTransactionList } from "../api/payment";
import type { Merchant } from "../types/payment";
import { TransactionStatusMap } from "../types/payment";
import { formatCurrency } from "./support/paymentView";

const tableRef = ref();
const merchantOptions = ref<Merchant[]>([]);
const stats = reactive({ total: 0, success: 0, processing: 0 });
const queryForm = reactive({ merchantId: undefined as number | undefined, orderNo: "", transactionType: "", status: undefined as number | undefined });

const fetchTransactionTable = (params: Record<string, unknown>) => getTransactionList({ pageNum: params.page, pageSize: params.pageSize, merchantId: params.merchantId, orderNo: params.orderNo, transactionType: params.transactionType, status: params.status });

async function loadBase() { const res = await getMerchantList({ page: 1, size: 200 }); merchantOptions.value = res.data.records || []; }
async function loadStats() { const res = await getTransactionList({ pageNum: 1, pageSize: 200 }); const records = res.data.records || []; stats.total = res.data.total || 0; stats.success = records.filter((item) => item.status === 1).length; stats.processing = records.filter((item) => item.status === 2).length; }
async function reloadAll() { await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]); }
function handleSearch() { tableRef.value?.reload({ ...queryForm }, 1); }
function handleReset() { queryForm.merchantId = undefined; queryForm.orderNo = ""; queryForm.transactionType = ""; queryForm.status = undefined; handleSearch(); }

onMounted(async () => { await Promise.all([loadBase(), loadStats()]); });
</script>

<style scoped>
@import "./support/payment-page.css";

.transaction-page { background: linear-gradient(180deg, #f5faf7 0%, #f8fbf9 180px, #fafcfa 100%); }
.cell-main { display: flex; flex-direction: column; gap: 6px; }
.cell-main span { color: #667085; line-height: 1.6; }
</style>
