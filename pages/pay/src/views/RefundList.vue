<template>
  <section class="payment-page refund-page">
    <header class="payment-surface">
      <div>
        <h1 class="payment-surface__title">退款管理</h1>
        <p class="payment-surface__desc">统一查看退款单状态、金额、原订单和渠道处理结果。</p>
      </div>
      <div class="payment-surface__actions">
        <el-tooltip content="刷新">
          <el-button circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat">
        <span class="payment-stat__label">退款单总数</span>
        <strong class="payment-stat__value">{{ stats.total }}</strong>
        <span class="payment-stat__hint">覆盖处理中、成功、失败的退款单全量视图。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">处理中</span>
        <strong class="payment-stat__value">{{ stats.processing }}</strong>
        <span class="payment-stat__hint">需要渠道回调或人工确认的退款单。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">已退款金额</span>
        <strong class="payment-stat__value">{{ formatCurrency(stats.refundedAmount) }}</strong>
        <span class="payment-stat__hint">基于当前退款单列表统计的退款成功金额。</span>
      </article>
    </section>

    <section class="payment-toolbar">
      <div class="payment-toolbar__row">
        <div class="payment-toolbar__form">
          <el-select v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
          <el-input v-model="queryForm.orderNo" clearable placeholder="订单号" style="width: 220px" @keyup.enter="handleSearch" />
          <el-input v-model="queryForm.refundNo" clearable placeholder="退款单号" style="width: 220px" @keyup.enter="handleSearch" />
          <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已退款" value="REFUNDED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </section>

    <section class="payment-panel">
      <div class="payment-panel__head">
        <div>
          <h2 class="payment-panel__title">退款主表</h2>
          <p class="payment-panel__desc">集中查看退款单号、原订单、渠道、第三方退款单号和处理动作。</p>
        </div>
      </div>

      <ScTable
        ref="tableRef"
        table-name="payment-refund-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchRefundTable"
      >
        <el-table-column label="退款单" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.refundNo }}</strong>
              <span>{{ row.thirdPartyRefundNo || "未回填第三方退款单号" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单 / 商户" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.orderNo }}</strong>
              <span>{{ row.merchantName || `商户#${row.merchantId}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付方式 / 原状态" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.channelName || "-" }}</strong>
              <span>{{ row.sourceOrderStatusDesc || row.sourceOrderStatus || "未记录原订单状态" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="140" align="center">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.refundAmount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" effect="plain">{{ row.statusDesc || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="payment-icon-actions">
              <el-tooltip content="查看详情">
                <el-button circle :icon="Document" @click="showDetail(row)" />
              </el-tooltip>
              <el-tooltip v-if="row.status === 'PROCESSING'" content="标记成功">
                <el-button circle type="success" :icon="CircleCheck" @click="handleMarkSuccess(row)" />
              </el-tooltip>
              <el-tooltip v-if="row.status === 'PROCESSING'" content="标记失败">
                <el-button circle type="danger" :icon="CloseBold" @click="handleMarkFail(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </section>

    <el-drawer v-model="detailVisible" size="720px" :title="currentRefund ? `${currentRefund.refundNo} · 退款详情` : '退款详情'">
      <template v-if="currentRefund">
        <div class="payment-dialog-shell">
          <div class="payment-status-strip">
            <div class="payment-status-card">
              <span class="payment-status-card__label">退款状态</span>
              <strong class="payment-status-card__value">{{ currentRefund.statusDesc || currentRefund.status }}</strong>
              <span class="payment-status-card__hint">{{ currentRefund.thirdPartyRefundNo || "未回填第三方退款单号" }}</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">退款金额</span>
              <strong class="payment-status-card__value">{{ formatCurrency(currentRefund.refundAmount) }}</strong>
              <span class="payment-status-card__hint">{{ currentRefund.reason || "未填写退款原因" }}</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">原订单</span>
              <strong class="payment-status-card__value">{{ currentRefund.orderNo }}</strong>
              <span class="payment-status-card__hint">{{ currentRefund.channelName || "-" }}</span>
            </div>
          </div>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>基础信息</h3>
                <p>用于核对退款单、原订单、商户、渠道和备注信息。</p>
              </div>
            </div>
            <div class="payment-readonly-grid">
              <div class="payment-readonly-item">
                <span>退款单号</span>
                <strong>{{ currentRefund.refundNo }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>订单号</span>
                <strong>{{ currentRefund.orderNo }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>商户</span>
                <strong>{{ currentRefund.merchantName || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>支付方式</span>
                <strong>{{ currentRefund.channelName || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>原订单状态</span>
                <strong>{{ currentRefund.sourceOrderStatusDesc || currentRefund.sourceOrderStatus || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>备注</span>
                <strong>{{ currentRefund.remark || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>请求与响应快照</h3>
                <p>便于定位渠道入参、出参和回写字段。</p>
              </div>
            </div>
            <div class="payment-form-stack">
              <div class="payment-soft-panel">
                <strong>请求快照</strong>
                <pre class="payment-code-preview">{{ currentRefund.requestPayload || "-" }}</pre>
              </div>
              <div class="payment-soft-panel">
                <strong>响应快照</strong>
                <pre class="payment-code-preview">{{ currentRefund.responsePayload || "-" }}</pre>
              </div>
            </div>
          </section>
        </div>
      </template>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, CloseBold, Document, RefreshRight, Search } from "@element-plus/icons-vue";
import { getMerchantList, getRefundDetail, getRefundList, markRefundOrderFail, markRefundOrderSuccess } from "../api/payment";
import type { Merchant, RefundOrder } from "../types/payment";

const tableRef = ref();
const detailVisible = ref(false);
const merchantOptions = ref<Merchant[]>([]);
const currentRefund = ref<RefundOrder | null>(null);

const queryForm = reactive({
  merchantId: undefined as number | undefined,
  orderNo: "",
  refundNo: "",
  status: "",
});

const stats = reactive({
  total: 0,
  processing: 0,
  refundedAmount: 0,
});

const fetchRefundTable = (params: Record<string, unknown>) =>
  getRefundList({
    pageNum: params.page,
    pageSize: params.pageSize,
    merchantId: params.merchantId,
    orderNo: params.orderNo || undefined,
    refundNo: params.refundNo || undefined,
    status: params.status || undefined,
  });

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records || [];
}

async function loadStats() {
  const res = await getRefundList({ pageNum: 1, pageSize: 200 });
  const records = res.data.records || [];
  stats.total = res.data.total || 0;
  stats.processing = records.filter((item) => item.status === "PROCESSING").length;
  stats.refundedAmount = records.filter((item) => item.status === "REFUNDED").reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);
}

async function reloadAll() {
  await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]);
}

function handleSearch() {
  tableRef.value?.reload({ ...queryForm }, 1);
}

function handleReset() {
  queryForm.merchantId = undefined;
  queryForm.orderNo = "";
  queryForm.refundNo = "";
  queryForm.status = "";
  handleSearch();
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
  await reloadAll();
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
  await reloadAll();
}

function statusTag(status?: string) {
  if (status === "REFUNDED") return "success";
  if (status === "PROCESSING") return "warning";
  if (status === "FAILED") return "danger";
  return "info";
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadStats()]);
});
</script>

<style scoped>
@import "./support/payment-page.css";

.refund-page {
  background: linear-gradient(180deg, #eef7f6 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-main span {
  color: #667085;
  line-height: 1.6;
}
</style>
