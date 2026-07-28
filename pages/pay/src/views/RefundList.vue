<template>
  <PmPageShell page-class="refund-page">
    <PmSurface
      title="退款管理"
      :description="surfaceDescription"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
        <el-tooltip :content="autoRefreshEnabled ? '关闭自动刷新' : '开启自动刷新'">
          <ScButton
            circle
            :type="autoRefreshEnabled ? 'primary' : 'default'"
            :icon="VideoPlay"
            @click="toggleAutoRefresh"
          />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="退款单总数" hint="覆盖处理中、成功、失败的退款单全量视图。">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="处理中" hint="需要渠道回调或人工确认的退款单。">
        <template #value>{{ stats.processing }}</template>
      </PmStatCard>
      <PmStatCard label="已退款金额" hint="基于当前退款单统计的退款成功金额。">
        <template #value>{{ formatCurrency(stats.refundedAmount) }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <ScSelect v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
          <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
        </ScSelect>
        <el-input v-model="queryForm.orderNo" clearable placeholder="订单号" style="width: 220px" @keyup.enter="handleSearch" />
        <el-input v-model="queryForm.refundNo" clearable placeholder="退款单号" style="width: 220px" @keyup.enter="handleSearch" />
        <ScSelect v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
          <ScOption label="处理中" value="PROCESSING" />
          <ScOption label="已退款" value="REFUNDED" />
          <ScOption label="失败" value="FAILED" />
        </ScSelect>
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleSearch">查询</ScButton>
        <ScButton @click="handleReset">重置</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="退款主表" description="集中查看退款单号、原订单、渠道、第三方退款单号和处理动作。">
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
        <el-table-column label="退款原因" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.reason || "未填写" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span>{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="到账时间" width="170">
          <template #default="{ row }">
            <span>{{ row.status === 'REFUNDED' ? formatTime(row.updatedAt) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions ops-hover-actions">
              <el-tooltip content="查看详情">
                <ScButton circle :icon="Document" @click="showDetail(row)" />
              </el-tooltip>
              <el-tooltip v-if="row.status === 'PROCESSING'" content="标记成功">
                <ScButton circle type="success" :icon="CircleCheck" @click="handleMarkSuccess(row)" />
              </el-tooltip>
              <el-tooltip v-if="row.status === 'PROCESSING'" content="标记失败">
                <ScButton circle type="danger" :icon="CloseBold" @click="handleMarkFail(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <ScDrawer v-model="detailVisible" size="720px" :title="currentRefund ? `${currentRefund.refundNo} · 退款详情` : '退款详情'" layout="simple">
      <template v-if="currentRefund">
        <div class="pm-dialog-shell">
          <PmStatusStrip>
            <PmStatusCard label="退款状态" :hint="currentRefund.thirdPartyRefundNo || '未回填第三方退款单号'">
              <template #value>{{ currentRefund.statusDesc || currentRefund.status }}</template>
            </PmStatusCard>
            <PmStatusCard label="退款金额" :hint="currentRefund.reason || '未填写退款原因'">
              <template #value>{{ formatCurrency(currentRefund.refundAmount) }}</template>
            </PmStatusCard>
            <PmStatusCard label="原订单" :hint="currentRefund.channelName || '-'">
              <template #value>{{ currentRefund.orderNo }}</template>
            </PmStatusCard>
          </PmStatusStrip>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>基础信息</h3>
                <p>用于核对退款单、原订单、商户、渠道和备注信息。</p>
              </div>
            </div>
            <div class="pm-readonly-grid">
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">退款单号</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.refundNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">订单号</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.orderNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">商户</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.merchantName || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">支付方式</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.channelName || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">原订单状态</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.sourceOrderStatusDesc || currentRefund.sourceOrderStatus || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">创建时间</span>
                <strong class="pm-readonly-item__value">{{ formatTime(currentRefund.createdAt) || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">到账时间</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.status === 'REFUNDED' ? formatTime(currentRefund.updatedAt) : "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">备注</span>
                <strong class="pm-readonly-item__value">{{ currentRefund.remark || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>请求与响应快照</h3>
                <p>便于定位渠道入参、出参和回写字段。</p>
              </div>
            </div>
            <div class="pm-form-stack">
              <div class="pm-soft-panel">
                <strong>请求快照</strong>
                <pre class="pm-code-preview">{{ currentRefund.requestPayload || "-" }}</pre>
              </div>
              <div class="pm-soft-panel">
                <strong>响应快照</strong>
                <pre class="pm-code-preview">{{ currentRefund.responsePayload || "-" }}</pre>
              </div>
            </div>
          </section>
        </div>
      </template>
    </ScDrawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, CloseBold, Document, RefreshRight, Search, VideoPlay } from "@element-plus/icons-vue";
import { getMerchantList, getPaymentGlobalConfig, getRefundDetail, getRefundList, markRefundOrderFail, markRefundOrderSuccess } from "../api/payment";
import type { Merchant, RefundOrder } from "../types/payment";
import { formatCurrency } from "../utils/format";
function formatTime(time?: string) {
  if (!time) return "-";
  const d = new Date(time);
  if (isNaN(d.getTime())) return time;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import PmStatusStrip from "../components/layout/PmStatusStrip.vue";
import PmStatusCard from "../components/layout/PmStatusCard.vue";
import { ScOption } from "@repo/components/ScOption";
import ScTable from "@repo/components/ScTable/index.vue";
import { ScDrawer } from "@repo/components/ScDrawer";

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

const REFUND_AUTO_REFRESH_KEY = "payment.refund.autoRefresh";
const autoRefreshEnabled = ref(localStorage.getItem(REFUND_AUTO_REFRESH_KEY) === "true");
const refreshTimer = ref<number | null>(null);
const surfaceDescription = ref("统一查看退款单状态、金额、原订单和渠道处理结果。");

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

const DEFAULT_REFRESH_MS = 60000;
const refreshIntervalMs = ref(DEFAULT_REFRESH_MS);

async function loadRefreshConfig() {
  try {
    const res = await getPaymentGlobalConfig();
    if (res?.data?.paymentAutoRefreshSeconds) {
      refreshIntervalMs.value = res.data.paymentAutoRefreshSeconds * 1000;
    }
  } catch { /* 使用默认值 */ }
}

function startAutoRefresh() {
  if (refreshTimer.value !== null) window.clearInterval(refreshTimer.value);
  refreshTimer.value = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      reloadAll();
    }
  }, refreshIntervalMs.value);
  surfaceDescription.value = `统一查看退款单状态、金额、原订单和渠道处理结果。每隔 ${refreshIntervalMs.value / 1000}s 自动刷新`;
}

function stopAutoRefresh() {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
  surfaceDescription.value = "统一查看退款单状态、金额、原订单和渠道处理结果。";
}

function toggleAutoRefresh() {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  localStorage.setItem(REFUND_AUTO_REFRESH_KEY, String(autoRefreshEnabled.value));
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
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

onMounted(async () => {
  await Promise.all([loadMerchants(), loadStats()]);
  tableRef.value?.reload();
  await loadRefreshConfig();
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
});
</script>

<style scoped>

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-main span {
  color: var(--pm-text-muted, #8b97a9);
  font-size: var(--pm-font-size-xs, 11px);
  line-height: 1.6;
}

.cell-main strong {
  color: var(--pm-text-primary, #070b15);
}

.ops-hover-actions .el-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.el-table__row:hover .ops-hover-actions .el-button {
  opacity: 1;
}

.refund-page :deep(.pm-dialog-shell .pm-soft-panel) {
  background: var(--pm-surface-card, rgba(255, 255, 255, 0.85)) !important;
  backdrop-filter: blur(8px);
  border: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  border-radius: var(--pm-border-radius-md, 16px);
  padding: var(--pm-space-md, 14px);
}

.refund-page :deep(.pm-soft-panel strong) {
  display: block;
  margin-bottom: var(--pm-space-sm, 8px);
  color: var(--pm-text-primary, #070b15);
  font-size: var(--pm-font-size-sm, 12.5px);
}
</style>
