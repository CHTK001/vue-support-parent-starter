<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card">
        <p>退款单总数</p>
        <strong>{{ pagination.total }}</strong>
        <span>覆盖处理中、成功、失败的退款单全量视图。</span>
      </article>
      <article class="hero-card">
        <p>处理中</p>
        <strong>{{ processingCount }}</strong>
        <span>需要渠道回调或人工确认的退款单。</span>
      </article>
      <article class="hero-card">
        <p>已退款金额</p>
        <strong>{{ formatCurrency(refundedAmount) }}</strong>
        <span>基于当前页统计的退款成功金额。</span>
      </article>
    </div>

    <el-card class="panel" shadow="never">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Refund Center</p>
            <h3>退款管理</h3>
          </div>
          <el-button text @click="loadRefunds">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="toolbar">
        <el-form-item label="商户">
          <el-select v-model="searchForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" clearable placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="退款单号">
          <el-input v-model="searchForm.refundNo" clearable placeholder="请输入退款单号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部状态" style="width: 180px">
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已退款" value="REFUNDED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="refundList" v-loading="loading" border class="table">
        <el-table-column prop="refundNo" label="退款单号" min-width="180" />
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="merchantName" label="商户" width="160" />
        <el-table-column prop="channelName" label="支付方式" width="180" />
        <el-table-column label="原订单状态" width="140">
          <template #default="{ row }">
            {{ row.sourceOrderStatusDesc || row.sourceOrderStatus || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="140">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.refundAmount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ row.statusDesc || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="thirdPartyRefundNo" label="第三方退款单号" min-width="180" />
        <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'PROCESSING'" link type="success" @click="handleMarkSuccess(row)">成功</el-button>
            <el-button v-if="row.status === 'PROCESSING'" link type="danger" @click="handleMarkFail(row)">失败</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pager"
        @current-change="loadRefunds"
        @size-change="handlePageSizeChange"
      />
    </el-card>

    <el-drawer v-model="detailVisible" size="560px" title="退款单详情">
      <el-descriptions v-if="currentRefund" :column="1" border>
        <el-descriptions-item label="退款单号">{{ currentRefund.refundNo }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentRefund.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="商户">{{ currentRefund.merchantName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ currentRefund.channelName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentRefund.statusDesc || currentRefund.status }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">{{ formatCurrency(currentRefund.refundAmount) }}</el-descriptions-item>
        <el-descriptions-item label="第三方退款单号">{{ currentRefund.thirdPartyRefundNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="退款原因">{{ currentRefund.reason || "-" }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRefund.remark || "-" }}</el-descriptions-item>
        <el-descriptions-item label="请求快照">{{ currentRefund.requestPayload || "-" }}</el-descriptions-item>
        <el-descriptions-item label="响应快照">{{ currentRefund.responsePayload || "-" }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getMerchantList,
  getRefundDetail,
  getRefundList,
  markRefundOrderFail,
  markRefundOrderSuccess,
} from "../api/payment";
import type { Merchant, RefundOrder } from "../types/payment";

const loading = ref(false);
const detailVisible = ref(false);
const merchantOptions = ref<Merchant[]>([]);
const refundList = ref<RefundOrder[]>([]);
const currentRefund = ref<RefundOrder | null>(null);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const searchForm = reactive({
  merchantId: undefined as number | undefined,
  orderNo: "",
  refundNo: "",
  status: "",
});

const processingCount = computed(() => refundList.value.filter((item) => item.status === "PROCESSING").length);
const refundedAmount = computed(() =>
  refundList.value
    .filter((item) => item.status === "REFUNDED")
    .reduce((sum, item) => sum + Number(item.refundAmount || 0), 0),
);

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records;
}

async function loadRefunds() {
  loading.value = true;
  try {
    const res = await getRefundList({
      pageNum: pagination.page,
      pageSize: pagination.size,
      merchantId: searchForm.merchantId,
      orderNo: searchForm.orderNo || undefined,
      refundNo: searchForm.refundNo || undefined,
      status: searchForm.status || undefined,
    });
    refundList.value = res.data.records;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadRefunds();
}

function handleResetSearch() {
  searchForm.merchantId = undefined;
  searchForm.orderNo = "";
  searchForm.refundNo = "";
  searchForm.status = "";
  handleSearch();
}

function handlePageSizeChange(size: number) {
  pagination.size = size;
  pagination.page = 1;
  loadRefunds();
}

async function showDetail(row: RefundOrder) {
  const res = await getRefundDetail(row.id);
  currentRefund.value = res.data;
  detailVisible.value = true;
}

async function handleMarkSuccess(row: RefundOrder) {
  const { value } = await ElMessageBox.prompt("请输入第三方退款单号，可留空", "标记退款成功", {
    inputPlaceholder: "例如：ALI_REF_20260324001",
  });
  await markRefundOrderSuccess(row.id, {
    operator: "payment-console",
    refundAmount: row.refundAmount,
    thirdPartyRefundNo: value || undefined,
    remark: "管理台确认退款成功",
  });
  ElMessage.success("退款单已标记成功");
  await loadRefunds();
}

async function handleMarkFail(row: RefundOrder) {
  const { value } = await ElMessageBox.prompt("请输入失败原因", "标记退款失败", {
    inputPlaceholder: "例如：渠道退款失败",
  });
  await markRefundOrderFail(row.id, {
    operator: "payment-console",
    remark: value || "管理台确认退款失败",
  });
  ElMessage.success("退款单已标记失败");
  await loadRefunds();
}

function statusTag(status?: string) {
  if (status === "REFUNDED") {
    return "success";
  }
  if (status === "PROCESSING") {
    return "warning";
  }
  if (status === "FAILED") {
    return "danger";
  }
  return "info";
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadRefunds()]);
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
  box-shadow: 0 18px 60px rgb(54 37 23 / 8%);
}

.hero-card {
  padding: 20px 22px;
  background: linear-gradient(160deg, rgb(255 246 234 / 90%) 0%, rgb(255 255 255 / 88%) 100%);
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
