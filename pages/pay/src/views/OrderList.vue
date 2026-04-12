<template>
  <section class="payment-page order-page">
    <header class="payment-surface">
      <div>
        <p class="payment-surface__eyebrow">Order Console</p>
        <h1 class="payment-surface__title">订单管理</h1>
        <p class="payment-surface__desc">订单页只处理建单、支付、同步、退款和流转日志，其他配置都放到商户页和订单配置页。</p>
      </div>
      <div class="payment-surface__actions">
        <el-button :icon="RefreshRight" @click="reloadAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建订单</el-button>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat">
        <span class="payment-stat__label">订单总数</span>
        <strong class="payment-stat__value">{{ stats.total }}</strong>
        <span class="payment-stat__hint">当前支付台录入的订单总量。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">待处理订单</span>
        <strong class="payment-stat__value">{{ stats.pending }}</strong>
        <span class="payment-stat__hint">包含待支付、支付中、退款中。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">成功金额</span>
        <strong class="payment-stat__value">{{ formatCurrency(stats.successAmount) }}</strong>
        <span class="payment-stat__hint">按已支付/已完成/已退款订单汇总。</span>
      </article>
    </section>

    <section class="payment-toolbar">
      <div class="payment-toolbar__row">
        <div class="payment-toolbar__form">
          <el-select v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
          <el-input v-model="queryForm.orderNo" clearable placeholder="订单号" style="width: 220px" @keyup.enter="handleSearch" />
          <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
            <el-option v-for="(label, value) in OrderStatusMap" :key="value" :label="label" :value="value" />
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
          <h2 class="payment-panel__title">订单主表</h2>
          <p class="payment-panel__desc">操作区只保留最常用动作，复杂流转通过更多菜单处理。</p>
        </div>
      </div>
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
        <el-table-column label="金额" width="150" align="center">
          <template #default="{ row }">
            <div class="cell-main cell-main--center">
              <strong>{{ formatCurrency(row.orderAmount) }}</strong>
              <span>已付 {{ formatCurrency(row.paidAmount) }} / 已退 {{ formatCurrency(row.refundAmount) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" effect="plain">{{ row.statusDesc || OrderStatusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="payment-icon-actions">
              <el-tooltip content="流转日志"><el-button circle :icon="Document" @click="openLogDrawer(row)" /></el-tooltip>
              <el-tooltip content="同步状态"><el-button circle :icon="RefreshRight" @click="handleSync(row)" /></el-tooltip>
              <el-tooltip content="真实支付"><el-button circle type="success" :icon="Promotion" @click="handleRealPay(row)" /></el-tooltip>
              <el-dropdown @command="(command) => handleCommand(row, command)">
                <el-button circle :icon="MoreFilled" />
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
    </section>

    <el-dialog v-model="createDialogVisible" title="创建订单" width="860px">
      <el-form label-width="110px">
        <div class="payment-form-grid">
          <el-form-item label="商户" required>
            <el-select v-model="createForm.merchantId" placeholder="请选择商户" @change="handleMerchantChange">
              <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付方式" required>
            <el-select v-model="createForm.channelId" placeholder="请选择支付方式">
              <el-option v-for="item in createChannelOptions" :key="item.id" :label="`${item.channelName} (${item.channelSubType})`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="业务单号"><el-input v-model="createForm.businessOrderNo" placeholder="可选，不填系统生成" /></el-form-item>
          <el-form-item label="用户ID"><el-input-number v-model="createForm.userId" :min="1" /></el-form-item>
          <el-form-item label="订单金额" required><el-input-number v-model="createForm.orderAmount" :min="0.01" :precision="2" :step="0.01" /></el-form-item>
          <el-form-item label="优惠金额"><el-input-number v-model="createForm.discountAmount" :min="0" :precision="2" :step="0.01" /></el-form-item>
          <el-form-item label="标题"><el-input v-model="createForm.subject" placeholder="例如：会员充值" /></el-form-item>
          <el-form-item label="币种"><el-input v-model="createForm.currency" /></el-form-item>
          <el-form-item label="支付回调" class="payment-form-span-2"><el-input v-model="createForm.notifyUrl" placeholder="可覆盖商户/渠道默认结果回调" /></el-form-item>
          <el-form-item label="返回地址" class="payment-form-span-2"><el-input v-model="createForm.returnUrl" placeholder="可覆盖商户/渠道浏览器回跳地址" /></el-form-item>
          <el-form-item label="描述" class="payment-form-span-2"><el-input v-model="createForm.body" type="textarea" :rows="3" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="logDrawerVisible" size="620px" :title="currentOrder ? `${currentOrder.orderNo} · 流转日志` : '流转日志'">
      <ScTable table-name="payment-order-log-table" :search="false" :hide-do="true" :hide-pagination="true" :hide-refresh="true" :hide-setting="true" :data="logTableData">
        <el-table-column prop="event" label="事件" min-width="120" />
        <el-table-column label="状态流转" min-width="160">
          <template #default="{ row }">{{ row.fromState || "INIT" }} -> {{ row.toState }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="remark" label="备注" min-width="180" />
        <el-table-column prop="createdAt" label="时间" width="180" />
      </ScTable>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Document, MoreFilled, Plus, Promotion, RefreshRight, Search } from "@element-plus/icons-vue";
import { applyRefund, cancelOrder, completeOrder, createOrder, deleteOrder, getMerchantChannels, getMerchantList, getOrderList, getOrderLogs, markOrderPaid, markOrderPayFail, markRefundFail, markRefundSuccess, payOrder, startOrderPay, syncOrder } from "../api/payment";
import type { Merchant, MerchantChannel, OrderForm, OrderStateLog, PaymentOrder } from "../types/payment";
import { OrderStatusMap, isExecutableChannel } from "../types/payment";
import { formatCurrency, normalizeTableResult } from "./support/paymentView";

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
const logTableData = computed(() => normalizeTableResult(orderLogs.value, orderLogs.value.length));

const fetchOrderTable = (params: Record<string, unknown>) => getOrderList({ page: params.page, size: params.pageSize, merchantId: params.merchantId, orderNo: params.orderNo, status: params.status });

async function loadBase() { const res = await getMerchantList({ page: 1, size: 200 }); merchantOptions.value = res.data.records || []; }
async function loadStats() { const res = await getOrderList({ page: 1, size: 200 }); const records = res.data.records || []; stats.total = res.data.total || 0; stats.pending = records.filter((item) => ["PENDING", "PAYING", "REFUNDING"].includes(item.status)).length; stats.successAmount = records.filter((item) => ["PAID", "COMPLETED", "REFUNDED"].includes(item.status)).reduce((sum, item) => sum + Number(item.paidAmount || 0), 0); }
async function reloadAll() { await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]); }
function handleSearch() { tableRef.value?.reload({ ...queryForm }, 1); }
function handleReset() { queryForm.merchantId = undefined; queryForm.orderNo = ""; queryForm.status = ""; handleSearch(); }
function statusTag(status: string) { if (["PAID", "COMPLETED", "REFUNDED"].includes(status)) return "success"; if (["PAYING", "REFUNDING"].includes(status)) return "warning"; if (["FAILED"].includes(status)) return "danger"; return "info"; }
function openCreateDialog() { Object.assign(createForm, { merchantId: 0, channelId: 0, userId: undefined, businessOrderNo: "", orderAmount: 0, discountAmount: 0, currency: "CNY", subject: "", body: "", notifyUrl: "", returnUrl: "", expireMinutes: 30, remark: "" }); createChannelOptions.value = []; createDialogVisible.value = true; }
async function handleMerchantChange(merchantId: number) { const res = await getMerchantChannels(merchantId, { status: 1 }); createChannelOptions.value = (res.data || []).filter((item) => isExecutableChannel(item.channelType, item.channelSubType)); createForm.channelId = createChannelOptions.value[0]?.id || 0; }
async function submitCreate() { if (!createForm.merchantId || !createForm.channelId || !createForm.orderAmount) { ElMessage.error("商户、支付方式和订单金额不能为空"); return; } creating.value = true; try { await createOrder(createForm); ElMessage.success("订单创建成功"); createDialogVisible.value = false; await reloadAll(); } finally { creating.value = false; } }
async function openLogDrawer(order: PaymentOrder) { currentOrder.value = order; const res = await getOrderLogs(order.id); orderLogs.value = res.data || []; logDrawerVisible.value = true; }
async function handleSync(order: PaymentOrder) { await syncOrder(order.id); ElMessage.success("订单状态已同步"); await reloadAll(); }
async function handleRealPay(order: PaymentOrder) { const payload: Record<string, unknown> = { operator: "payment-console", clientIp: "127.0.0.1", userAgent: navigator.userAgent }; if (order.channelType === "WECHAT" && ["JSAPI", "MINI_PROGRAM", "MINIPROGRAM"].includes(order.channelSubType || "")) { const { value } = await ElMessageBox.prompt("请输入 payerOpenId", "微信支付", { inputPlaceholder: "例如：oUpF8uMuAJO_M2pxb1Q9zNjWeS6o" }); payload.payerOpenId = value; } await payOrder(order.id, payload); ElMessage.success("已发起真实支付"); await reloadAll(); }
async function handleCommand(order: PaymentOrder, command: string) { if (command === "startPay") await startOrderPay(order.id, { operator: "payment-console" }); else if (command === "markPaid") await markOrderPaid(order.id, { operator: "payment-console", paidAmount: order.orderAmount }); else if (command === "markFail") { const { value } = await ElMessageBox.prompt("请输入失败原因", "支付失败"); await markOrderPayFail(order.id, { operator: "payment-console", remark: value }); } else if (command === "complete") await completeOrder(order.id, { operator: "payment-console" }); else if (command === "cancel") { const { value } = await ElMessageBox.prompt("请输入取消原因", "取消订单"); await cancelOrder(order.id, { operator: "payment-console", remark: value }); } else if (command === "refund") { const { value } = await ElMessageBox.prompt("请输入退款金额", "申请退款", { inputPattern: /^\d+(\.\d{1,2})?$/, inputErrorMessage: "请输入正确金额" }); await applyRefund(order.id, { refundAmount: Number(value), refundReason: "管理台发起退款", operator: "payment-console" }); } else if (command === "refundSuccess") await markRefundSuccess(order.id, { operator: "payment-console", refundAmount: Number(order.paidAmount || order.orderAmount) }); else if (command === "refundFail") { const { value } = await ElMessageBox.prompt("请输入退款失败原因", "退款失败"); await markRefundFail(order.id, { operator: "payment-console", remark: value }); } else if (command === "delete") { await ElMessageBox.confirm(`确认删除订单 ${order.orderNo} 吗？`, "删除确认", { type: "warning" }); await deleteOrder(order.id); } ElMessage.success("订单操作成功"); await reloadAll(); }

onMounted(async () => { await Promise.all([loadBase(), loadStats()]); });
</script>

<style scoped>
@import "./support/payment-page.css";

.order-page { background: linear-gradient(180deg, #f0f7fb 0%, #f7fbfd 180px, #f8fafc 100%); }
.cell-main { display: flex; flex-direction: column; gap: 6px; }
.cell-main span { color: #667085; line-height: 1.6; }
.cell-main--center { align-items: center; }
</style>
