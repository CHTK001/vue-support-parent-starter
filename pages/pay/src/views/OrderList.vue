<template>
  <PmPageShell page-class="order-page">
    <PmSurface
      title="订单管理"
      description="查看订单状态、金额、支付动作与流转日志。"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
        <el-tooltip content="创建订单">
          <ScButton circle type="primary" :icon="Plus" @click="openCreateDialog" />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="订单总数" hint="当前支付台录入的订单总量。">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="待处理订单" hint="包含待支付、支付中、退款中。">
        <template #value>{{ stats.pending }}</template>
      </PmStatCard>
      <PmStatCard label="成功金额" hint="按已支付/已完成/已退款订单汇总。">
        <template #value>{{ formatCurrency(stats.successAmount) }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <ScSelect v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
          <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
        </ScSelect>
        <el-input v-model="queryForm.orderNo" clearable placeholder="订单号" style="width: 220px" @keyup.enter="handleSearch" />
        <ScSelect v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
          <ScOption v-for="(label, value) in OrderStatusMap" :key="value" :label="label" :value="value" />
        </ScSelect>
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleSearch">查询</ScButton>
        <ScButton @click="handleReset">重置</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="订单主表" description="统一查看订单号、商户、金额、状态和处理动作。">
      <ScTable ref="tableRef" table-name="payment-order-table" row-key="id" border stripe :search="false" :hide-do="true" :hide-refresh="true" :hide-setting="true" :params="queryForm" :url="fetchOrderTable">
        <el-table-column label="订单信息" min-width="260">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.orderNo }}</strong>
              <span>{{ row.businessOrderNo || "未传业务单号" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商户 / 支付方式" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.merchantName || `商户#${row.merchantId}` }}</strong>
              <span>{{ row.channelName || `${row.channelType}/${row.channelSubType || "-"}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额信息" width="180" align="center">
          <template #default="{ row }">
            <div class="cell-main cell-main--center">
              <strong>下单金额 {{ formatCurrency(row.orderAmount) }}</strong>
              <span>实付金额 {{ formatCurrency(row.paidAmount) }}</span>
              <span>退款金额 {{ formatCurrency(row.refundAmount) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip :content="statusTooltip(row.status, row.remark)" placement="top" :disabled="!statusTooltip(row.status, row.remark)">
              <el-tag :type="statusTag(row.status)" effect="plain">{{ formatOrderStatus(row.status, row.statusDesc) }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions">
              <el-tooltip content="流转日志"><ScButton circle :icon="Document" @click="openLogDrawer(row)" /></el-tooltip>
              <el-tooltip content="同步状态"><ScButton circle :icon="RefreshRight" @click="handleSync(row)" /></el-tooltip>
              <el-tooltip content="真实支付"><ScButton circle type="success" :icon="Promotion" @click="handleRealPay(row)" /></el-tooltip>
              <el-dropdown @command="(command) => handleCommand(row, command)">
                <ScButton circle :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="startPay">发起支付</el-dropdown-item>
                    <el-dropdown-item command="markPaid">支付成功</el-dropdown-item>
                    <el-dropdown-item command="markFail">支付失败</el-dropdown-item>
                    <el-dropdown-item command="complete">完成订单</el-dropdown-item>
                    <el-dropdown-item command="cancel">取消订单</el-dropdown-item>
                    <el-dropdown-item command="refund">申请退款</el-dropdown-item>
                    <el-dropdown-item command="refundSuccess">退款成功</el-dropdown-item>
                    <el-dropdown-item command="refundFail">退款失败</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除订单</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <ScDialog v-model="createDialogVisible" title="创建订单" width="900px" destroy-on-close>
      <div class="pm-dialog-shell">
        <PmStatusStrip>
          <PmStatusCard label="选中商户" hint="先选商户，再联动可执行支付方式。">
            <template #value>{{ currentCreateMerchantLabel }}</template>
          </PmStatusCard>
          <PmStatusCard label="支付方式" hint="只展示当前商户下可直接发起支付的渠道。">
            <template #value>{{ currentCreateChannelLabel }}</template>
          </PmStatusCard>
          <PmStatusCard label="订单金额" hint="优惠金额、回调和回跳都支持按订单单独覆盖。">
            <template #value>{{ formatCurrency(createForm.orderAmount || 0) }}</template>
          </PmStatusCard>
        </PmStatusStrip>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>基础下单参数</h3>
              <p>先确定商户、支付方式和金额，再补充业务单号、用户和标题描述。</p>
            </div>
          </div>
          <el-form label-width="110px">
            <div class="pm-form-grid">
              <el-form-item label="商户" required>
                <ScSelect v-model="createForm.merchantId" placeholder="请选择商户" @change="handleMerchantChange">
                  <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
                </ScSelect>
              </el-form-item>
              <el-form-item label="支付方式" required>
                <ScSelect v-model="createForm.channelId" placeholder="请选择支付方式">
                  <ScOption v-for="item in createChannelOptions" :key="item.id" :label="`${item.channelName} (${item.channelSubType})`" :value="item.id" />
                </ScSelect>
              </el-form-item>
              <el-form-item label="业务单号">
                <el-input v-model="createForm.businessOrderNo" placeholder="可选，不填系统生成" />
              </el-form-item>
              <el-form-item label="用户ID">
                <el-input-number v-model="createForm.userId" :min="1" />
              </el-form-item>
              <el-form-item label="下单金额" required>
                <el-input-number v-model="createForm.orderAmount" :min="0.01" :precision="2" :step="0.01" />
              </el-form-item>
              <el-form-item label="优惠金额">
                <el-input-number v-model="createForm.discountAmount" :min="0" :precision="2" :step="0.01" />
              </el-form-item>
              <el-form-item label="标题">
                <el-input v-model="createForm.subject" placeholder="例如：会员充值" />
              </el-form-item>
              <el-form-item label="币种">
                <el-input v-model="createForm.currency" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>回调与说明</h3>
              <p>订单级地址优先级高于商户和支付方式默认值。</p>
            </div>
          </div>
          <el-form label-width="110px">
            <div class="pm-form-grid">
              <el-form-item label="支付回调" class="pm-form-span-2">
                <el-input v-model="createForm.notifyUrl" placeholder="可覆盖商户/渠道默认结果回调" />
              </el-form-item>
              <el-form-item label="返回地址" class="pm-form-span-2">
                <el-input v-model="createForm.returnUrl" placeholder="可覆盖商户/渠道浏览器回跳地址" />
              </el-form-item>
              <el-form-item label="描述" class="pm-form-span-2">
                <el-input v-model="createForm.body" type="textarea" :rows="3" />
              </el-form-item>
            </div>
          </el-form>
        </section>
      </div>
      <template #footer>
        <div class="pm-dialog-footer">
          <ScButton @click="createDialogVisible = false">取消</ScButton>
          <ScButton type="primary" :loading="creating" @click="submitCreate">创建</ScButton>
        </div>
      </template>
    </ScDialog>

    <ScDrawer v-model="logDrawerVisible" size="720px" :title="currentOrder ? `${currentOrder.orderNo} · 流转日志` : '流转日志'">
      <div v-if="currentOrder" class="pm-dialog-shell">
        <PmStatusStrip>
          <PmStatusCard label="订单状态" :hint="currentOrder.channelName || `${currentOrder.channelType}/${currentOrder.channelSubType || '-'}`">
            <template #value>{{ formatOrderStatus(currentOrder.status, currentOrder.statusDesc) }}</template>
          </PmStatusCard>
          <PmStatusCard label="下单金额" :hint="`实付 ${formatCurrency(currentOrder.paidAmount)} / 退款 ${formatCurrency(currentOrder.refundAmount)}`">
            <template #value>{{ formatCurrency(currentOrder.orderAmount) }}</template>
          </PmStatusCard>
          <PmStatusCard label="商户" :hint="`创建时间 ${currentOrder.createdAt || '-'}`">
            <template #value>{{ currentOrder.merchantName || `商户#${currentOrder.merchantId}` }}</template>
          </PmStatusCard>
          <PmStatusCard v-if="currentFailureReason" class="pm-status-card--danger" label="失败原因" hint="最近一次失败或取消时记录的业务说明。">
            <template #value>{{ currentFailureReason }}</template>
          </PmStatusCard>
        </PmStatusStrip>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>状态流转</h3>
              <p>用于核对状态机动作、同步结果和人工补偿记录。</p>
            </div>
          </div>
          <ScTable table-name="payment-order-log-table" :search="false" :hide-do="true" :hide-pagination="true" :hide-refresh="true" :hide-setting="true" :data="logTableData">
            <el-table-column prop="eventLabel" label="事件" min-width="140" />
            <el-table-column label="状态流转" min-width="160">
              <template #default="{ row }">
                <div class="order-flow-cell">
                  <el-tag size="small" effect="plain">{{ row.fromStateLabel }}</el-tag>
                  <span class="order-flow-cell__arrow">→</span>
                  <el-tag size="small" effect="plain" :type="statusTag(row.toStateKey)">{{ row.toStateLabel }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column prop="remarkLabel" label="失败原因 / 备注" min-width="260" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="发生时间" width="180" />
          </ScTable>
        </section>
      </div>
    </ScDrawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ScDrawer } from "@repo/components";

import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Document, MoreFilled, Plus, Promotion, RefreshRight, Search } from "@element-plus/icons-vue";
import { ScButton } from "@repo/components/ScButton";
import { ScSelect } from "@repo/components/ScSelect";
import { ScOption } from "@repo/components/ScOption";
import { ScDialog } from "@repo/components/ScDialog";
import ScTable from "@repo/components/ScTable/index.vue";
import { applyRefund, cancelOrder, completeOrder, createOrder, deleteOrder, getMerchantChannels, getMerchantList, getOrderList, getOrderLogs, markOrderPaid, markOrderPayFail, markRefundFail, markRefundSuccess, payOrder, startOrderPay, syncOrder } from "../api/payment";
import type { Merchant, MerchantChannel, OrderForm, OrderStateLog, PaymentOrder } from "../types/payment";
import { OrderStatusMap, isExecutableChannel } from "../types/payment";
import { formatCurrency, normalizeTableResult } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import PmStatusStrip from "../components/layout/PmStatusStrip.vue";
import PmStatusCard from "../components/layout/PmStatusCard.vue";

const tableRef = ref();
const merchantOptions = ref<Merchant[]>([]);
const createChannelOptions = ref<MerchantChannel[]>([]);
const orderLogs = ref<OrderStateLog[]>([]);
const currentOrder = ref<PaymentOrder | null>(null);
const stats = reactive({ total: 0, pending: 0, successAmount: 0 });
const queryForm = reactive({ merchantId: undefined as number | undefined, orderNo: "", status: "" });
const createDialogVisible = ref(false);
const creating = ref(false);
const createForm = reactive<OrderForm>({ merchantId: 0, channelId: 0, userId: undefined, businessOrderNo: "", orderAmount: 0, discountAmount: 0, currency: "CNY", subject: "", body: "", notifyUrl: "", returnUrl: "", expireMinutes: 30, remark: "" });
const logDrawerVisible = ref(false);
const logTableData = computed(() =>
  normalizeTableResult(
    orderLogs.value.map((item, index) => ({
      ...item,
      id: item.id ?? `${item.createdAt || "row"}-${index}`,
      eventLabel: formatOrderEvent(item.event),
      fromStateLabel: formatOrderStatus(item.fromState || "INIT"),
      toStateLabel: formatOrderStatus(item.toState),
      toStateKey: normalizeStatusKey(item.toState),
      remarkLabel: formatOrderLogRemark(item),
      createdAt: item.createdAt || "-",
    })),
    orderLogs.value.length,
  ),
);
const currentCreateMerchantLabel = computed(() => merchantOptions.value.find((item) => item.id === createForm.merchantId)?.merchantName || "待选择");
const currentCreateChannelLabel = computed(() => createChannelOptions.value.find((item) => item.id === createForm.channelId)?.channelName || "待选择");
const currentFailureReason = computed(() => {
  const failedLog = [...orderLogs.value]
    .reverse()
    .find((item) => ["FAILED", "CANCELLED", "CANCELED", "TIMEOUT"].includes(normalizeStatusKey(item.toState)) && String(item.remark || "").trim());
  return String(failedLog?.remark || currentOrder.value?.remark || "").trim();
});

const fetchOrderTable = (params: Record<string, unknown>) => getOrderList({ page: params.page, size: params.pageSize, merchantId: params.merchantId, orderNo: params.orderNo, status: params.status });

async function loadBase() { const res = await getMerchantList({ page: 1, size: 200 }); merchantOptions.value = res.data.records || []; }
async function loadStats() { const res = await getOrderList({ page: 1, size: 200 }); const records = res.data.records || []; stats.total = res.data.total || 0; stats.pending = records.filter((item) => ["PENDING", "PAYING", "REFUNDING"].includes(item.status)).length; stats.successAmount = records.filter((item) => ["PAID", "COMPLETED", "REFUNDED"].includes(item.status)).reduce((sum, item) => sum + Number(item.paidAmount || 0), 0); }
async function reloadAll() { await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]); }
function handleSearch() { tableRef.value?.reload({ ...queryForm }, 1); }
function handleReset() { queryForm.merchantId = undefined; queryForm.orderNo = ""; queryForm.status = ""; handleSearch(); }
function statusTag(status: string) {
  const key = normalizeStatusKey(status);
  if (["PAID", "COMPLETED", "REFUNDED"].includes(key)) return "success";
  if (["PAYING", "REFUNDING"].includes(key)) return "warning";
  if (["FAILED", "REFUND_FAILED", "TIMEOUT"].includes(key)) return "danger";
  return "info";
}
function statusTooltip(status?: string, remark?: string) {
  const key = normalizeStatusKey(status);
  if (key === "TIMEOUT") return "订单支付超时，系统已自动关闭";
  if (key === "FAILED") return remark ? `支付失败：${remark}` : "支付失败，查看失败原因了解详情";
  if (key === "CANCELLED") return remark ? `已取消：${remark}` : "订单已被取消";
  return "";
}
function normalizeStatusKey(value?: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}
function formatOrderStatus(status?: string, statusDesc?: string) {
  const raw = String(statusDesc || "").trim();
  if (raw) {
    const normalized = normalizeStatusKey(raw);
    const translated = OrderStatusLabelMap[normalized];
    if (translated) return translated;
  }
  const normalizedStatus = normalizeStatusKey(status);
  return OrderStatusLabelMap[normalizedStatus] || status || "-";
}
function formatOrderEvent(event?: string) {
  const normalized = normalizeStatusKey(event);
  return OrderEventLabelMap[normalized] || event || "-";
}
function formatOrderLogRemark(log: OrderStateLog) {
  const remark = String(log.remark || "").trim();
  if (!remark) {
    if (["FAILED", "CANCELLED", "CANCELED", "TIMEOUT"].includes(normalizeStatusKey(log.toState))) {
      return "未记录原因";
    }
    return "-";
  }
  if (["FAILED"].includes(normalizeStatusKey(log.toState))) {
    return `支付失败：${remark}`;
  }
  if (["TIMEOUT"].includes(normalizeStatusKey(log.toState))) {
    return `支付超时：${remark}`;
  }
  if (["CANCELLED", "CANCELED"].includes(normalizeStatusKey(log.toState))) {
    return `取消原因：${remark}`;
  }
  return remark;
}
function openCreateDialog() { Object.assign(createForm, { merchantId: 0, channelId: 0, userId: undefined, businessOrderNo: "", orderAmount: 0, discountAmount: 0, currency: "CNY", subject: "", body: "", notifyUrl: "", returnUrl: "", expireMinutes: 30, remark: "" }); createChannelOptions.value = []; createDialogVisible.value = true; }
async function handleMerchantChange(merchantId: number) { const res = await getMerchantChannels(merchantId, { status: 1 }); createChannelOptions.value = (res.data || []).filter((item) => isExecutableChannel(item.channelType, item.channelSubType)); createForm.channelId = createChannelOptions.value[0]?.id || 0; }
async function submitCreate() { if (!createForm.merchantId || !createForm.channelId || !createForm.orderAmount) { ElMessage.error("商户、支付方式和订单金额不能为空"); return; } creating.value = true; try { await createOrder(createForm); ElMessage.success("订单创建成功"); createDialogVisible.value = false; await reloadAll(); } finally { creating.value = false; } }
async function openLogDrawer(order: PaymentOrder) { currentOrder.value = order; const res = await getOrderLogs(order.id); orderLogs.value = res.data || []; logDrawerVisible.value = true; }
async function handleSync(order: PaymentOrder) { await syncOrder(order.id); ElMessage.success("订单状态已同步"); await reloadAll(); }
async function handleRealPay(order: PaymentOrder) { const payload: Record<string, unknown> = { operator: "payment-console", clientIp: "127.0.0.1", userAgent: navigator.userAgent }; if (order.channelType === "WECHAT" && ["JSAPI", "MINI_PROGRAM", "MINIPROGRAM"].includes(order.channelSubType || "")) { const { value } = await ElMessageBox.prompt("请输入 payerOpenId", "微信支付", { inputPlaceholder: "例如：oUpF8uMuAJO_M2pxb1Q9zNjWeS6o" }); payload.payerOpenId = value; } await payOrder(order.id, payload); ElMessage.success("已发起真实支付"); await reloadAll(); }
async function handleCommand(order: PaymentOrder, command: string) { if (command === "startPay") await startOrderPay(order.id, { operator: "payment-console" }); else if (command === "markPaid") await markOrderPaid(order.id, { operator: "payment-console", paidAmount: order.orderAmount }); else if (command === "markFail") { const { value } = await ElMessageBox.prompt("请输入失败原因", "支付失败"); await markOrderPayFail(order.id, { operator: "payment-console", remark: value }); } else if (command === "complete") await completeOrder(order.id, { operator: "payment-console" }); else if (command === "cancel") { const { value } = await ElMessageBox.prompt("请输入取消原因", "取消订单"); await cancelOrder(order.id, { operator: "payment-console", remark: value }); } else if (command === "refund") { const { value } = await ElMessageBox.prompt("请输入退款金额", "申请退款", { inputPattern: /^\d+(\.\d{1,2})?$/, inputErrorMessage: "请输入正确金额" }); await applyRefund(order.id, { refundAmount: Number(value), refundReason: "管理台发起退款", operator: "payment-console" }); } else if (command === "refundSuccess") await markRefundSuccess(order.id, { operator: "payment-console", refundAmount: Number(order.paidAmount || order.orderAmount) }); else if (command === "refundFail") { const { value } = await ElMessageBox.prompt("请输入退款失败原因", "退款失败"); await markRefundFail(order.id, { operator: "payment-console", remark: value }); } else if (command === "delete") { await ElMessageBox.confirm(`确认删除订单 ${order.orderNo} 吗？`, "删除确认", { type: "warning" }); await deleteOrder(order.id); } ElMessage.success("订单操作成功"); await reloadAll(); }

onMounted(async () => { await Promise.all([loadBase(), loadStats()]); });

const OrderStatusLabelMap: Record<string, string> = {
  INIT: "初始化",
  PENDING: "待支付",
  PAYING: "支付中",
  PAID: "已支付",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  CANCELED: "已取消",
  FAILED: "支付失败",
  REFUNDING: "退款中",
  REFUNDED: "已退款",
  REFUND_FAILED: "退款失败",
};

const OrderEventLabelMap: Record<string, string> = {
  CREATE: "创建订单",
  CREATED: "创建订单",
  PAY_START: "发起支付",
  START_PAY: "发起支付",
  MARKPAID: "人工标记支付成功",
  MARKFAIL: "人工标记支付失败",
  MARK_FAIL: "人工标记支付失败",
  PAY_SUCCESS: "支付成功",
  PAY_FAIL: "支付失败",
  COMPLETE: "完成订单",
  COMPLETED: "完成订单",
  CANCEL: "取消订单",
  CANCELLED: "取消订单",
  CANCELED: "取消订单",
  REFUND: "申请退款",
  REFUND_APPLY: "申请退款",
  REFUND_SUCCESS: "退款成功",
  REFUND_FAIL: "退款失败",
  SYNC: "同步订单",
  DELETE: "删除订单",
};
</script>

<style scoped>
.order-page {
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

.cell-main--center {
  align-items: center;
}

.order-page :deep(.pm-status-card--danger) {
  background: linear-gradient(145deg, rgba(254, 242, 242, 0.98) 0%, rgba(255, 235, 235, 0.92) 100%);
  border-color: rgba(248, 113, 113, 0.24);
}

.order-page :deep(.pm-status-card--danger .pm-status-card__label),
.order-page :deep(.pm-status-card--danger .pm-status-card__hint) {
  color: #b42318;
}

.order-page :deep(.pm-status-card--danger .pm-status-card__value) {
  color: #7a271a;
}

.order-flow-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.order-flow-cell__arrow {
  color: #98a2b3;
  font-weight: 700;
}
</style>
