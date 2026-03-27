<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card">
        <p>钱包订单</p>
        <strong>{{ pagination.total }}</strong>
        <span>充值、转账、提现三个钱包业务的统一订单视图。</span>
      </article>
      <article class="hero-card">
        <p>处理中</p>
        <strong>{{ processingCount }}</strong>
        <span>待回调或第三方仍在处理中的钱包订单。</span>
      </article>
      <article class="hero-card">
        <p>成功率</p>
        <strong>{{ successRate }}%</strong>
        <span>当前页钱包订单的成功处理比例。</span>
      </article>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Wallet Operations</p>
            <h3>钱包订单台</h3>
          </div>
          <div class="header-actions">
            <el-button @click="openCreateDialog('RECHARGE')">充值订单</el-button>
            <el-button @click="openCreateDialog('TRANSFER')">转账订单</el-button>
            <el-button type="primary" @click="openCreateDialog('WITHDRAW')">提现订单</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="toolbar">
        <el-form-item label="商户">
          <el-select v-model="searchForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input-number v-model="searchForm.userId" :min="1" :precision="0" />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.orderType" clearable placeholder="全部类型" style="width: 180px">
            <el-option v-for="(label, value) in WalletOrderTypeMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部状态" style="width: 180px">
            <el-option v-for="(label, value) in WalletOrderStatusMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="walletOrders" v-loading="loading" border class="table">
        <el-table-column prop="orderNo" label="钱包订单号" min-width="200" />
        <el-table-column label="业务类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ WalletOrderTypeMap[row.orderType] || row.orderType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="merchantId" label="商户ID" width="110" />
        <el-table-column prop="userId" label="用户ID" width="110" />
        <el-table-column prop="relatedUserId" label="关联用户ID" width="120" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.amount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ WalletOrderStatusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="thirdPartyOrderNo" label="第三方单号" min-width="180" />
        <el-table-column prop="notifyUrl" label="回调地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
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
        @current-change="loadWalletOrders"
        @size-change="handlePageSizeChange"
      />
    </el-card>

    <el-dialog v-model="createDialogVisible" :title="dialogTitle" width="760px">
      <el-form :model="createForm" label-width="110px">
        <div class="form-grid">
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
          <el-form-item label="回调地址" class="span-2">
            <el-input v-model="createForm.notifyUrl" placeholder="可选，默认使用后端自动生成的钱包回调地址" />
          </el-form-item>
          <template v-if="currentAction === 'WITHDRAW'">
            <el-form-item label="开户名">
              <el-input v-model="createForm.accountName" placeholder="请输入开户名" />
            </el-form-item>
            <el-form-item label="银行卡号">
              <el-input v-model="createForm.bankAccount" placeholder="请输入银行卡号" />
            </el-form-item>
            <el-form-item label="开户行" class="span-2">
              <el-input v-model="createForm.bankName" placeholder="请输入开户行" />
            </el-form-item>
          </template>
          <el-form-item label="操作人">
            <el-input v-model="createForm.operator" placeholder="例如：payment-console" />
          </el-form-item>
          <el-form-item label="备注" class="span-2">
            <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="填写业务备注或联调说明" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" size="560px" title="钱包订单详情">
      <el-descriptions v-if="currentOrder" :column="1" border>
        <el-descriptions-item label="钱包订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ WalletOrderTypeMap[currentOrder.orderType] || currentOrder.orderType }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ WalletOrderStatusMap[currentOrder.status] || currentOrder.status }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ formatCurrency(currentOrder.amount) }}</el-descriptions-item>
        <el-descriptions-item label="第三方单号">{{ currentOrder.thirdPartyOrderNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="回调地址">{{ currentOrder.notifyUrl || "-" }}</el-descriptions-item>
        <el-descriptions-item label="开户名">{{ currentOrder.accountName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="银行卡号">{{ currentOrder.bankAccount || "-" }}</el-descriptions-item>
        <el-descriptions-item label="开户行">{{ currentOrder.bankName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="请求快照">{{ currentOrder.requestPayload || "-" }}</el-descriptions-item>
        <el-descriptions-item label="响应快照">{{ currentOrder.responsePayload || "-" }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
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

const loading = ref(false);
const submitting = ref(false);
const createDialogVisible = ref(false);
const detailVisible = ref(false);
const currentAction = ref<WalletAction>("RECHARGE");
const currentOrder = ref<WalletOrder | null>(null);

const merchantOptions = ref<Merchant[]>([]);
const walletOrders = ref<WalletOrder[]>([]);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const searchForm = reactive({
  merchantId: undefined as number | undefined,
  userId: undefined as number | undefined,
  orderType: "",
  status: "",
});

const createForm = reactive<WalletCreateForm>(createDefaultCreateForm());

const processingCount = computed(() => walletOrders.value.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).length);
const successRate = computed(() => {
  if (!walletOrders.value.length) {
    return 0;
  }
  const successCount = walletOrders.value.filter((item) => item.status === "SUCCESS").length;
  return Math.round((successCount / walletOrders.value.length) * 100);
});

const dialogTitle = computed(() => `${WalletOrderTypeMap[currentAction.value]}钱包订单`);
const numberFieldLabel = computed(() => {
  if (currentAction.value === "TRANSFER") {
    return "转账单号";
  }
  if (currentAction.value === "WITHDRAW") {
    return "提现单号";
  }
  return "充值单号";
});
const numberFieldPlaceholder = computed(() => `可选，不填则后端自动生成${numberFieldLabel.value}`);

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records;
}

async function loadWalletOrders() {
  loading.value = true;
  try {
    const res = await getWalletOrderList({
      pageNum: pagination.page,
      pageSize: pagination.size,
      merchantId: searchForm.merchantId,
      userId: searchForm.userId,
      orderType: searchForm.orderType || undefined,
      status: searchForm.status || undefined,
    });
    walletOrders.value = res.data.records;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
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
    await loadWalletOrders();
  } finally {
    submitting.value = false;
  }
}

async function handleSearch() {
  pagination.page = 1;
  await loadWalletOrders();
}

async function handleResetSearch() {
  searchForm.merchantId = undefined;
  searchForm.userId = undefined;
  searchForm.orderType = "";
  searchForm.status = "";
  await handleSearch();
}

function handlePageSizeChange(size: number) {
  pagination.size = size;
  pagination.page = 1;
  loadWalletOrders();
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
  await loadWalletOrders();
  if (currentOrder.value?.orderNo === order.orderNo) {
    await showDetail(order);
  }
}

function statusTag(status: string) {
  if (status === "SUCCESS") {
    return "success";
  }
  if (status === "FAILED") {
    return "danger";
  }
  if (status === "PROCESSING") {
    return "warning";
  }
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
  await Promise.all([loadMerchants(), loadWalletOrders()]);
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

.panel__header,
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel__header {
  justify-content: space-between;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}

.span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .panel__header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-wrap: wrap;
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
