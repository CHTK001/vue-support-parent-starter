<template>
  <section class="payment-page wallet-order-page">
    <header class="payment-surface">
      <div>
        <h1 class="payment-surface__title">钱包订单台</h1>
        <p class="payment-surface__desc">统一查看充值、转账、提现订单，并支持模拟回调和明细排查。</p>
      </div>
      <div class="payment-surface__actions">
        <el-tooltip content="刷新">
          <el-button circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
        <el-tooltip content="充值订单">
          <el-button circle :icon="WalletFilled" @click="openCreateDialog('RECHARGE')" />
        </el-tooltip>
        <el-tooltip content="转账订单">
          <el-button circle :icon="Switch" @click="openCreateDialog('TRANSFER')" />
        </el-tooltip>
        <el-tooltip content="提现订单">
          <el-button circle type="primary" :icon="CreditCard" @click="openCreateDialog('WITHDRAW')" />
        </el-tooltip>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat">
        <span class="payment-stat__label">钱包订单</span>
        <strong class="payment-stat__value">{{ stats.total }}</strong>
        <span class="payment-stat__hint">充值、转账、提现三个钱包业务的统一订单视图。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">处理中</span>
        <strong class="payment-stat__value">{{ stats.processing }}</strong>
        <span class="payment-stat__hint">待回调或第三方仍在处理中的钱包订单。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">成功率</span>
        <strong class="payment-stat__value">{{ stats.successRate }}%</strong>
        <span class="payment-stat__hint">基于当前查询结果估算的钱包订单成功处理比例。</span>
      </article>
    </section>

    <section class="payment-toolbar">
      <div class="payment-toolbar__row">
        <div class="payment-toolbar__form">
          <el-select v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
          <el-input-number v-model="queryForm.userId" :min="1" :precision="0" placeholder="用户ID" />
          <el-select v-model="queryForm.orderType" clearable placeholder="业务类型" style="width: 180px">
            <el-option v-for="(label, value) in WalletOrderTypeMap" :key="value" :label="label" :value="value" />
          </el-select>
          <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
            <el-option v-for="(label, value) in WalletOrderStatusMap" :key="value" :label="label" :value="value" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </section>

    <section class="payment-panel">
      <div class="payment-panel__head">
        <div>
          <h2 class="payment-panel__title">钱包订单主表</h2>
          <p class="payment-panel__desc">集中查看钱包订单号、类型、用户、回调地址、第三方单号和模拟动作。</p>
        </div>
      </div>

      <ScTable
        ref="tableRef"
        table-name="payment-wallet-order-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchWalletOrderTable"
      >
        <el-table-column label="钱包订单" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.orderNo }}</strong>
              <span>{{ row.thirdPartyOrderNo || "未回填第三方单号" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务类型 / 商户" min-width="180">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ WalletOrderTypeMap[row.orderType] || row.orderType }}</strong>
              <span>商户 #{{ row.merchantId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.userId || row.relatedUserId || "-" }}</strong>
              <span>
                {{ row.orderType === "TRANSFER" ? `转入用户 ${row.relatedUserId || "-"}` : row.relatedUserId ? `关联用户 ${row.relatedUserId}` : "单用户钱包订单" }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140" align="center">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.amount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" effect="plain">{{ WalletOrderStatusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notifyUrl" label="回调地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <div class="wallet-order-actions">
              <el-button
                v-if="row.status === 'PENDING' || row.status === 'PROCESSING'"
                link
                type="warning"
                @click="handleSimulateNotify(row, 'PROCESSING')"
              >
                模拟处理中
              </el-button>
              <el-button v-if="row.status !== 'SUCCESS'" link type="success" @click="handleSimulateNotify(row, 'SUCCESS')">
                模拟成功
              </el-button>
              <el-button v-if="row.status !== 'FAILED'" link type="danger" @click="handleSimulateNotify(row, 'FAILED')">
                模拟失败
              </el-button>
              <el-button link type="primary" @click="showDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </section>

    <el-dialog v-model="createDialogVisible" :title="dialogTitle" width="920px" destroy-on-close>
      <div class="payment-dialog-shell">
        <div class="payment-status-strip">
          <div class="payment-status-card">
            <span class="payment-status-card__label">业务类型</span>
            <strong class="payment-status-card__value">{{ WalletOrderTypeMap[currentAction] }}</strong>
            <span class="payment-status-card__hint">{{ currentActionHint }}</span>
          </div>
          <div class="payment-status-card">
            <span class="payment-status-card__label">当前商户</span>
            <strong class="payment-status-card__value">{{ currentCreateMerchantLabel }}</strong>
            <span class="payment-status-card__hint">钱包订单创建后可在此页直接模拟回调。</span>
          </div>
          <div class="payment-status-card">
            <span class="payment-status-card__label">订单金额</span>
            <strong class="payment-status-card__value">{{ formatCurrency(createForm.amount) }}</strong>
            <span class="payment-status-card__hint">支持业务侧自定义单号和订单级回调地址。</span>
          </div>
        </div>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>基础参数</h3>
              <p>先确定商户、用户和金额，再补充单号、回调和银行信息。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="商户" required>
                <el-select v-model="createForm.merchantId" placeholder="请选择商户">
                  <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item :label="numberFieldLabel">
                <el-input v-model="createForm.orderNo" :placeholder="numberFieldPlaceholder" />
              </el-form-item>
              <el-form-item v-if="currentAction !== 'TRANSFER'" label="用户ID" required>
                <el-input-number v-model="createForm.userId" :min="1" :precision="0" />
              </el-form-item>
              <el-form-item v-if="currentAction === 'TRANSFER'" label="转出用户" required>
                <el-input-number v-model="createForm.fromUserId" :min="1" :precision="0" />
              </el-form-item>
              <el-form-item v-if="currentAction === 'TRANSFER'" label="转入用户" required>
                <el-input-number v-model="createForm.toUserId" :min="1" :precision="0" />
              </el-form-item>
              <el-form-item label="金额" required>
                <el-input-number v-model="createForm.amount" :min="0.01" :precision="2" :step="0.01" />
              </el-form-item>
              <el-form-item label="回调地址" class="payment-form-span-2">
                <el-input v-model="createForm.notifyUrl" placeholder="可选，默认使用后端自动生成的钱包回调地址" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section v-if="currentAction === 'WITHDRAW'" class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>提现账户信息</h3>
              <p>提现订单需要补全开户名、银行卡号和开户行。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="开户名">
                <el-input v-model="createForm.accountName" placeholder="请输入开户名" />
              </el-form-item>
              <el-form-item label="银行卡号">
                <el-input v-model="createForm.bankAccount" placeholder="请输入银行卡号" />
              </el-form-item>
              <el-form-item label="开户行" class="payment-form-span-2">
                <el-input v-model="createForm.bankName" placeholder="请输入开户行" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>操作信息</h3>
              <p>保留业务备注和操作人，用于后续排查和审计。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="操作人">
                <el-input v-model="createForm.operator" placeholder="例如：payment-console" />
              </el-form-item>
              <el-form-item label="说明">
                <div class="payment-soft-panel payment-subtle">钱包订单支持在本页模拟处理中、成功、失败回调，成功后会真实落余额变更。</div>
              </el-form-item>
              <el-form-item label="备注" class="payment-form-span-2">
                <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="填写业务备注或联调说明" />
              </el-form-item>
            </div>
          </el-form>
        </section>
      </div>

      <template #footer>
        <div class="payment-dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitCreate">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" size="720px" :title="currentOrder ? `${currentOrder.orderNo} · 钱包订单详情` : '钱包订单详情'">
      <template v-if="currentOrder">
        <div class="payment-dialog-shell">
          <div class="payment-status-strip">
            <div class="payment-status-card">
              <span class="payment-status-card__label">订单状态</span>
              <strong class="payment-status-card__value">{{ WalletOrderStatusMap[currentOrder.status] || currentOrder.status }}</strong>
              <span class="payment-status-card__hint">{{ currentOrder.thirdPartyOrderNo || "未回填第三方单号" }}</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">业务类型</span>
              <strong class="payment-status-card__value">{{ WalletOrderTypeMap[currentOrder.orderType] || currentOrder.orderType }}</strong>
              <span class="payment-status-card__hint">金额 {{ formatCurrency(currentOrder.amount) }}</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">用户信息</span>
              <strong class="payment-status-card__value">{{ currentOrder.userId || currentOrder.relatedUserId || "-" }}</strong>
              <span class="payment-status-card__hint">{{ currentOrder.notifyUrl || "未配置订单级回调地址" }}</span>
            </div>
          </div>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>基础信息</h3>
                <p>核对订单号、业务类型、银行账户和回调信息。</p>
              </div>
            </div>
            <div class="payment-readonly-grid">
              <div class="payment-readonly-item">
                <span>钱包订单号</span>
                <strong>{{ currentOrder.orderNo }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>第三方单号</span>
                <strong>{{ currentOrder.thirdPartyOrderNo || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>商户ID</span>
                <strong>{{ currentOrder.merchantId }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>用户ID</span>
                <strong>{{ currentOrder.userId || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>关联用户ID</span>
                <strong>{{ currentOrder.relatedUserId || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>回调地址</span>
                <strong>{{ currentOrder.notifyUrl || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>开户名</span>
                <strong>{{ currentOrder.accountName || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>银行卡号</span>
                <strong>{{ currentOrder.bankAccount || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>开户行</span>
                <strong>{{ currentOrder.bankName || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>备注</span>
                <strong>{{ currentOrder.remark || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>请求与响应快照</h3>
                <p>用于核对钱包订单入参与回调结果。</p>
              </div>
            </div>
            <div class="payment-form-stack">
              <div class="payment-soft-panel">
                <strong>请求快照</strong>
                <pre class="payment-code-preview">{{ currentOrder.requestPayload || "-" }}</pre>
              </div>
              <div class="payment-soft-panel">
                <strong>响应快照</strong>
                <pre class="payment-code-preview">{{ currentOrder.responsePayload || "-" }}</pre>
              </div>
            </div>
          </section>
        </div>
      </template>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CreditCard, RefreshRight, Search, Switch, WalletFilled } from "@element-plus/icons-vue";
import {
  createWalletRechargeOrder,
  createWalletTransferOrder,
  createWalletWithdrawOrder,
  getMerchantList,
  getWalletOrderDetail,
  getWalletOrderList,
  simulateWalletOrderNotify,
} from "../api/payment";
import type { Merchant, WalletOrder } from "../types/payment";
import { WalletOrderStatusMap, WalletOrderTypeMap } from "../types/payment";

type WalletAction = "RECHARGE" | "TRANSFER" | "WITHDRAW";

interface WalletCreateForm {
  merchantId: number;
  userId: number | undefined;
  fromUserId: number | undefined;
  toUserId: number | undefined;
  orderNo: string;
  notifyUrl: string;
  amount: number;
  bankAccount: string;
  bankName: string;
  accountName: string;
  operator: string;
  remark: string;
}

const tableRef = ref();
const loading = ref(false);
const submitting = ref(false);
const createDialogVisible = ref(false);
const detailVisible = ref(false);
const currentAction = ref<WalletAction>("RECHARGE");
const currentOrder = ref<WalletOrder | null>(null);

const merchantOptions = ref<Merchant[]>([]);

const queryForm = reactive({
  merchantId: undefined as number | undefined,
  userId: undefined as number | undefined,
  orderType: "",
  status: "",
});

const stats = reactive({
  total: 0,
  processing: 0,
  successRate: 0,
});

const createForm = reactive<WalletCreateForm>(createDefaultCreateForm());

const dialogTitle = computed(() => `${WalletOrderTypeMap[currentAction.value]}钱包订单`);
const currentActionHint = computed(() => {
  if (currentAction.value === "TRANSFER") {
    return "需要同时填写转出用户和转入用户。";
  }
  if (currentAction.value === "WITHDRAW") {
    return "提现订单需要补全银行卡和开户行信息。";
  }
  return "充值成功后会直接增加钱包可用余额。";
});
const currentCreateMerchantLabel = computed(
  () => merchantOptions.value.find((item) => item.id === createForm.merchantId)?.merchantName || "待选择",
);
const numberFieldLabel = computed(() => {
  if (currentAction.value === "TRANSFER") return "转账单号";
  if (currentAction.value === "WITHDRAW") return "提现单号";
  return "充值单号";
});
const numberFieldPlaceholder = computed(() => `可选，不填则后端自动生成${numberFieldLabel.value}`);

const fetchWalletOrderTable = async (params: Record<string, unknown>) => {
  loading.value = true;
  try {
    const res = await getWalletOrderList({
      pageNum: params.page,
      pageSize: params.pageSize,
      merchantId: params.merchantId,
      userId: params.userId,
      orderType: params.orderType || undefined,
      status: params.status || undefined,
    });
    return res;
  } finally {
    loading.value = false;
  }
};

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records || [];
}

async function loadStats() {
  const res = await getWalletOrderList({ pageNum: 1, pageSize: 200 });
  const records = res.data.records || [];
  stats.total = res.data.total || 0;
  stats.processing = records.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).length;
  const successCount = records.filter((item) => item.status === "SUCCESS").length;
  stats.successRate = records.length ? Math.round((successCount / records.length) * 100) : 0;
}

async function reloadAll() {
  await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]);
}

function handleSearch() {
  tableRef.value?.reload({ ...queryForm }, 1);
}

function handleReset() {
  queryForm.merchantId = undefined;
  queryForm.userId = undefined;
  queryForm.orderType = "";
  queryForm.status = "";
  handleSearch();
}

function openCreateDialog(action: WalletAction) {
  currentAction.value = action;
  Object.assign(createForm, createDefaultCreateForm());
  createDialogVisible.value = true;
}

async function submitCreate() {
  if (!createForm.merchantId || !createForm.amount) {
    ElMessage.error("商户和金额不能为空");
    return;
  }
  if (currentAction.value === "RECHARGE" && !createForm.userId) {
    ElMessage.error("充值订单必须填写用户ID");
    return;
  }
  if (currentAction.value === "TRANSFER" && (!createForm.fromUserId || !createForm.toUserId)) {
    ElMessage.error("转账订单必须填写转出用户和转入用户");
    return;
  }
  if (currentAction.value === "WITHDRAW" && !createForm.userId) {
    ElMessage.error("提现订单必须填写用户ID");
    return;
  }

  submitting.value = true;
  try {
    if (currentAction.value === "RECHARGE") {
      await createWalletRechargeOrder({
        merchantId: createForm.merchantId,
        userId: createForm.userId,
        rechargeNo: createForm.orderNo || undefined,
        notifyUrl: createForm.notifyUrl || undefined,
        amount: createForm.amount,
        operator: createForm.operator || undefined,
        remark: createForm.remark || undefined,
      });
    } else if (currentAction.value === "TRANSFER") {
      await createWalletTransferOrder({
        merchantId: createForm.merchantId,
        fromUserId: createForm.fromUserId,
        toUserId: createForm.toUserId,
        transferNo: createForm.orderNo || undefined,
        notifyUrl: createForm.notifyUrl || undefined,
        amount: createForm.amount,
        operator: createForm.operator || undefined,
        remark: createForm.remark || undefined,
      });
    } else {
      await createWalletWithdrawOrder({
        merchantId: createForm.merchantId,
        userId: createForm.userId,
        withdrawNo: createForm.orderNo || undefined,
        notifyUrl: createForm.notifyUrl || undefined,
        amount: createForm.amount,
        bankAccount: createForm.bankAccount || undefined,
        bankName: createForm.bankName || undefined,
        accountName: createForm.accountName || undefined,
        operator: createForm.operator || undefined,
        remark: createForm.remark || undefined,
      });
    }
    ElMessage.success(`${WalletOrderTypeMap[currentAction.value]}订单创建成功`);
    createDialogVisible.value = false;
    await reloadAll();
  } finally {
    submitting.value = false;
  }
}

async function showDetail(order: WalletOrder) {
  const res = await getWalletOrderDetail(order.orderNo);
  currentOrder.value = res.data;
  detailVisible.value = true;
}

async function handleSimulateNotify(order: WalletOrder, status: "PROCESSING" | "SUCCESS" | "FAILED") {
  let reason = "";
  if (status === "FAILED") {
    const result = await ElMessageBox.prompt("请输入失败原因", "模拟钱包回调失败", {
      inputPlaceholder: "例如：渠道拒绝",
    });
    reason = result.value || "管理台模拟失败";
  }
  await simulateWalletOrderNotify(order.orderNo, {
    status,
    thirdPartyOrderNo: order.thirdPartyOrderNo || `WALLET_SIM_${Date.now()}`,
    reason: reason || undefined,
  });
  ElMessage.success(`钱包订单已模拟为${WalletOrderStatusMap[status] || status}`);
  await reloadAll();
  if (currentOrder.value?.orderNo === order.orderNo) {
    await showDetail(order);
  }
}

function statusTag(status: string) {
  if (status === "SUCCESS") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PROCESSING") return "warning";
  return "info";
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function createDefaultCreateForm(): WalletCreateForm {
  return {
    merchantId: 0,
    userId: undefined,
    fromUserId: undefined,
    toUserId: undefined,
    orderNo: "",
    notifyUrl: "",
    amount: 0,
    bankAccount: "",
    bankName: "",
    accountName: "",
    operator: "payment-console",
    remark: "",
  };
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadStats()]);
});
</script>

<style scoped>
@import "./support/payment-page.css";

.wallet-order-page {
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

.wallet-order-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
