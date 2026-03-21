<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card">
        <p>订单总数</p>
        <strong>{{ pagination.total }}</strong>
        <span>管理创建、支付、完成、退款和删除全链路状态。</span>
      </article>
      <article class="hero-card">
        <p>待处理订单</p>
        <strong>{{ pendingCount }}</strong>
        <span>包括待支付、支付中、退款中的订单。</span>
      </article>
      <article class="hero-card">
        <p>成功支付金额</p>
        <strong>{{ formatCurrency(successPaidAmount) }}</strong>
        <span>基于当前页订单估算，用于快速巡检支付状态。</span>
      </article>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Order State Machine</p>
            <h3>订单管理</h3>
          </div>
          <el-button type="primary" @click="openCreateDialog">创建订单</el-button>
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部状态" style="width: 180px">
            <el-option v-for="(label, value) in OrderStatusMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orderList" v-loading="loading" border class="table">
        <el-table-column prop="orderNo" label="平台订单号" min-width="220" />
        <el-table-column prop="businessOrderNo" label="业务订单号" min-width="180" />
        <el-table-column prop="merchantName" label="商户" width="160" />
        <el-table-column prop="channelName" label="支付方式" width="180" />
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.orderAmount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ row.statusDesc || OrderStatusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付/退款" width="180">
          <template #default="{ row }">
            <div class="cell-stack">
              <span>已付：{{ formatCurrency(row.paidAmount) }}</span>
              <span>已退：{{ formatCurrency(row.refundAmount) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openLogDrawer(row)">流转日志</el-button>
            <el-button v-if="canRealPay(row.status)" link type="success" @click="handleRealPay(row)">真实支付</el-button>
            <el-button v-if="canSync(row.status)" link type="warning" @click="handleSync(row)">同步状态</el-button>
            <el-button v-if="canStartPay(row.status)" link type="primary" @click="handleStartPay(row)">发起支付</el-button>
            <el-button v-if="canMarkPaid(row.status)" link type="success" @click="handleMarkPaid(row)">支付成功</el-button>
            <el-button v-if="canMarkPaid(row.status)" link type="danger" @click="handleMarkPayFail(row)">支付失败</el-button>
            <el-button v-if="canComplete(row.status)" link type="warning" @click="handleComplete(row)">完成</el-button>
            <el-button v-if="canCancel(row.status)" link @click="handleCancel(row)">取消</el-button>
            <el-button v-if="canRefund(row.status)" link type="warning" @click="handleRefund(row)">申请退款</el-button>
            <el-button v-if="canRefundConfirm(row.status)" link type="success" @click="handleRefundSuccess(row)">退款成功</el-button>
            <el-button v-if="canRefundConfirm(row.status)" link type="danger" @click="handleRefundFail(row)">退款失败</el-button>
            <el-button v-if="canDelete(row.status)" link type="danger" @click="handleDelete(row)">删除</el-button>
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
        @current-change="loadOrders"
        @size-change="loadOrders"
      />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="创建订单" width="760px">
      <el-form :model="createForm" label-width="110px">
        <div class="form-grid">
          <el-form-item label="商户" required>
            <el-select v-model="createForm.merchantId" placeholder="请选择商户" @change="handleMerchantChange">
              <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付方式" required>
            <el-select v-model="createForm.channelId" placeholder="请选择支付方式">
              <el-option
                v-for="item in createChannelOptions"
                :key="item.id"
                :label="`${item.channelName} (${item.channelSubType})`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="业务订单号">
            <el-input v-model="createForm.businessOrderNo" placeholder="可选，不填则系统自动生成" />
          </el-form-item>
          <el-form-item label="用户ID">
            <el-input-number v-model="createForm.userId" :min="1" :precision="0" />
          </el-form-item>
          <el-form-item label="订单金额" required>
            <el-input-number v-model="createForm.orderAmount" :min="0.01" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="优惠金额">
            <el-input-number v-model="createForm.discountAmount" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="订单标题">
            <el-input v-model="createForm.subject" placeholder="例如：会员充值" />
          </el-form-item>
          <el-form-item label="币种">
            <el-input v-model="createForm.currency" placeholder="默认 CNY" />
          </el-form-item>
          <el-form-item label="订单描述" class="span-2">
            <el-input v-model="createForm.body" type="textarea" :rows="3" placeholder="补充订单描述" />
          </el-form-item>
          <el-form-item label="支付回调地址" class="span-2">
            <el-input v-model="createForm.notifyUrl" placeholder="可覆盖商户/渠道默认回调地址" />
          </el-form-item>
          <el-form-item label="返回地址" class="span-2">
            <el-input v-model="createForm.returnUrl" placeholder="可覆盖商户/渠道默认返回地址" />
          </el-form-item>
          <el-form-item label="过期分钟">
            <el-input-number v-model="createForm.expireMinutes" :min="1" :max="1440" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="createForm.remark" placeholder="例如：后台补单" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="logDrawerVisible" size="520px" :title="currentOrder ? `${currentOrder.orderNo} - 流转日志` : '流转日志'">
      <el-timeline v-if="orderLogs.length">
        <el-timeline-item
          v-for="item in orderLogs"
          :key="item.id"
          :timestamp="item.createdAt"
          placement="top"
        >
          <div class="log-card">
            <strong>{{ item.event }}</strong>
            <p>{{ item.fromState || "INIT" }} -> {{ item.toState }}</p>
            <span>操作人：{{ item.operator || "-" }}</span>
            <span>备注：{{ item.remark || "-" }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无状态流转记录" />
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  applyRefund,
  cancelOrder,
  completeOrder,
  createOrder,
  deleteOrder,
  getMerchantChannels,
  getMerchantList,
  getOrderList,
  getOrderLogs,
  markOrderPaid,
  markOrderPayFail,
  markRefundFail,
  markRefundSuccess,
  payOrder,
  syncOrder,
  startOrderPay,
} from "../api/payment";
import type {
  Merchant,
  MerchantChannel,
  OrderForm,
  PaymentLaunchResult,
  OrderStateLog,
  PaymentOrder,
} from "../types/payment";
import { OrderStatusMap, isExecutableChannel } from "../types/payment";

const loading = ref(false);
const creating = ref(false);

const merchantOptions = ref<Merchant[]>([]);
const createChannelOptions = ref<MerchantChannel[]>([]);
const orderList = ref<PaymentOrder[]>([]);
const orderLogs = ref<OrderStateLog[]>([]);
const currentOrder = ref<PaymentOrder | null>(null);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const searchForm = reactive({
  merchantId: undefined as number | undefined,
  orderNo: "",
  status: "",
});

const createDialogVisible = ref(false);
const logDrawerVisible = ref(false);

const createForm = reactive<OrderForm>(createDefaultOrderForm());

const pendingCount = computed(() =>
  orderList.value.filter((item) => ["PENDING", "PAYING", "REFUNDING"].includes(item.status)).length
);
const successPaidAmount = computed(() =>
  orderList.value
    .filter((item) => item.status === "PAID" || item.status === "COMPLETED" || item.status === "REFUNDING" || item.status === "REFUNDED")
    .reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
);

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records;
}

async function loadOrders() {
  loading.value = true;
  try {
    const res = await getOrderList({
      page: pagination.page,
      size: pagination.size,
      merchantId: searchForm.merchantId,
      orderNo: searchForm.orderNo || undefined,
      status: searchForm.status || undefined,
    });
    orderList.value = res.data.records;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadOrders();
}

function handleResetSearch() {
  searchForm.merchantId = undefined;
  searchForm.orderNo = "";
  searchForm.status = "";
  handleSearch();
}

function openCreateDialog() {
  Object.assign(createForm, createDefaultOrderForm());
  createChannelOptions.value = [];
  createDialogVisible.value = true;
}

async function handleMerchantChange(merchantId: number) {
  const res = await getMerchantChannels(merchantId, { status: 1 });
  createChannelOptions.value = res.data.filter((item) => isExecutableChannel(item.channelType, item.channelSubType));
  if (!createChannelOptions.value.find((item) => item.id === createForm.channelId)) {
    createForm.channelId = createChannelOptions.value[0]?.id || 0;
  }
}

async function submitCreate() {
  if (!createForm.merchantId || !createForm.channelId || !createForm.orderAmount) {
    ElMessage.error("商户、支付方式和订单金额不能为空");
    return;
  }
  creating.value = true;
  try {
    await createOrder(createForm);
    ElMessage.success("订单创建成功");
    createDialogVisible.value = false;
    await loadOrders();
  } finally {
    creating.value = false;
  }
}

async function openLogDrawer(order: PaymentOrder) {
  currentOrder.value = order;
  const res = await getOrderLogs(order.id);
  orderLogs.value = res.data;
  logDrawerVisible.value = true;
}

async function handleRealPay(order: PaymentOrder) {
  const payload: Record<string, unknown> = {
    operator: "payment-console",
    clientIp: "127.0.0.1",
    userAgent: navigator.userAgent,
  };
  if (order.channelType === "WECHAT" && ["JSAPI", "MINI_PROGRAM", "MINIPROGRAM"].includes(order.channelSubType || "")) {
    const title = order.channelSubType === "JSAPI" ? "微信 JSAPI 支付" : "微信小程序支付";
    const { value } = await ElMessageBox.prompt("请输入 payerOpenId", title, {
      inputPlaceholder: "例如：oUpF8uMuAJO_M2pxb1Q9zNjWeS6o",
    });
    payload.payerOpenId = value;
  }
  const res = await payOrder(order.id, payload);
  await presentPayLaunch(order, res.data);
  await loadOrders();
}

async function handleSync(order: PaymentOrder) {
  const res = await syncOrder(order.id);
  ElMessage.success(`订单已同步为 ${res.data.statusDesc || OrderStatusMap[res.data.status] || res.data.status}`);
  await loadOrders();
}

async function handleStartPay(order: PaymentOrder) {
  await startOrderPay(order.id, { operator: "payment-console" });
  ElMessage.success("订单已进入支付中");
  await loadOrders();
}

async function handleMarkPaid(order: PaymentOrder) {
  await markOrderPaid(order.id, {
    operator: "payment-console",
    paidAmount: order.orderAmount,
    thirdPartyOrderNo: order.thirdPartyOrderNo || `TP${Date.now()}`,
  });
  ElMessage.success("订单已标记支付成功");
  await loadOrders();
}

async function handleMarkPayFail(order: PaymentOrder) {
  const { value } = await ElMessageBox.prompt("请输入失败原因", "支付失败", {
    inputPlaceholder: "例如：第三方返回签名错误",
  });
  await markOrderPayFail(order.id, { operator: "payment-console", remark: value });
  ElMessage.success("订单已标记支付失败");
  await loadOrders();
}

async function handleComplete(order: PaymentOrder) {
  await completeOrder(order.id, { operator: "payment-console" });
  ElMessage.success("订单已完成");
  await loadOrders();
}

async function handleCancel(order: PaymentOrder) {
  const { value } = await ElMessageBox.prompt("请输入取消原因", "取消订单", {
    inputPlaceholder: "例如：用户主动取消",
  });
  await cancelOrder(order.id, { operator: "payment-console", remark: value });
  ElMessage.success("订单已取消");
  await loadOrders();
}

async function handleRefund(order: PaymentOrder) {
  const { value } = await ElMessageBox.prompt("请输入退款金额", "申请退款", {
    inputPlaceholder: "例如：88.00",
    inputPattern: /^\d+(\.\d{1,2})?$/,
    inputErrorMessage: "请输入正确的金额",
  });
  await applyRefund(order.id, {
    refundAmount: Number(value),
    refundReason: "管理台发起退款",
    operator: "payment-console",
  });
  ElMessage.success("退款申请已提交");
  await loadOrders();
}

async function handleRefundSuccess(order: PaymentOrder) {
  await markRefundSuccess(order.id, {
    operator: "payment-console",
    refundAmount: Number(order.paidAmount || order.orderAmount),
  });
  ElMessage.success("订单已标记退款成功");
  await loadOrders();
}

async function handleRefundFail(order: PaymentOrder) {
  const { value } = await ElMessageBox.prompt("请输入退款失败原因", "退款失败", {
    inputPlaceholder: "例如：原交易已关闭",
  });
  await markRefundFail(order.id, {
    operator: "payment-console",
    remark: value,
  });
  ElMessage.success("订单已标记退款失败");
  await loadOrders();
}

async function handleDelete(order: PaymentOrder) {
  await ElMessageBox.confirm(`确认删除订单 ${order.orderNo} 吗？`, "删除确认", { type: "warning" });
  await deleteOrder(order.id);
  ElMessage.success("订单已删除");
  await loadOrders();
}

function statusTag(status: string) {
  if (["PAID", "COMPLETED", "REFUNDED"].includes(status)) {
    return "success";
  }
  if (["PAYING", "REFUNDING"].includes(status)) {
    return "warning";
  }
  if (["CANCELLED"].includes(status)) {
    return "info";
  }
  if (["FAILED"].includes(status)) {
    return "danger";
  }
  return "";
}

function canStartPay(status: string) {
  return status === "PENDING";
}

function canRealPay(status: string) {
  return status === "PENDING" || status === "PAYING";
}

function canSync(status: string) {
  return status === "PENDING" || status === "PAYING" || status === "REFUNDING";
}

function canMarkPaid(status: string) {
  return status === "PENDING" || status === "PAYING";
}

function canComplete(status: string) {
  return status === "PAID";
}

function canCancel(status: string) {
  return status === "PENDING";
}

function canRefund(status: string) {
  return status === "PAID" || status === "COMPLETED";
}

function canRefundConfirm(status: string) {
  return status === "REFUNDING";
}

function canDelete(status: string) {
  return ["PENDING", "CANCELLED", "FAILED", "REFUNDED"].includes(status);
}

async function presentPayLaunch(order: PaymentOrder, launch: PaymentLaunchResult) {
  if (launch.launchType === "HTML_FORM" && launch.formHtml) {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (win) {
      win.document.write(launch.formHtml);
      win.document.close();
      ElMessage.success("支付表单已在新窗口打开");
      return;
    }
  }
  if (launch.launchType === "REDIRECT_URL" && launch.payUrl) {
    window.open(launch.payUrl, "_blank", "noopener,noreferrer");
    ElMessage.success("支付链接已在新窗口打开");
    return;
  }
  if ((launch.launchType === "JSAPI" || launch.launchType === "MINI_PROGRAM" || launch.launchType === "APP") && launch.sdkParams) {
    const payload = typeof launch.sdkParams.orderString === "string"
      ? launch.sdkParams.orderString
      : JSON.stringify(launch.sdkParams, null, 2);
    await ElMessageBox.alert(payload, `${order.orderNo} - ${launch.launchType} 参数`, {
      confirmButtonText: "关闭",
    });
    return;
  }
  if (launch.launchType === "NATIVE") {
    const codeUrl = launch.payUrl || String(launch.sdkParams?.codeUrl || "");
    await ElMessageBox.alert(codeUrl || "渠道已返回 Native 拉起结果", `${order.orderNo} - Native 参数`, {
      confirmButtonText: "关闭",
    });
    return;
  }
  await ElMessageBox.alert(launch.message || "支付请求已提交", `${order.orderNo} - 支付结果`, {
    confirmButtonText: "关闭",
  });
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function createDefaultOrderForm(): OrderForm {
  return {
    merchantId: 0,
    channelId: 0,
    userId: undefined,
    businessOrderNo: "",
    orderAmount: 0,
    discountAmount: 0,
    currency: "CNY",
    subject: "",
    body: "",
    notifyUrl: "",
    returnUrl: "",
    expireMinutes: 30,
    remark: "",
  };
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadOrders()]);
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

.cell-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}

.span-2 {
  grid-column: 1 / -1;
}

.log-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-card p,
.log-card span {
  margin: 0;
}

@media (max-width: 1100px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }
}
</style>
