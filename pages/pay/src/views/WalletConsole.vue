<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card hero-card--accent">
        <p>钱包测试控制台</p>
        <strong>{{ currentAccount ? formatCurrency(currentAccount.availableBalance) : "¥0.00" }}</strong>
        <span>当前查询账户的可用余额，适合做钱包支付、退款、转账、提现联调前检查。</span>
      </article>
      <article class="hero-card">
        <p>冻结余额</p>
        <strong>{{ currentAccount ? formatCurrency(currentAccount.frozenBalance) : "¥0.00" }}</strong>
        <span>若出现异常冻结，需先检查业务侧是否有额外控制逻辑。</span>
      </article>
      <article class="hero-card">
        <p>账户流水</p>
        <strong>{{ logPagination.total }}</strong>
        <span>展示当前筛选条件下的钱包账变记录。</span>
      </article>
    </div>

    <div class="dashboard-grid">
      <el-card class="panel" shadow="never">
        <template #header>
          <div class="panel__header">
            <div>
              <p class="panel__eyebrow">Wallet Account</p>
              <h3>钱包账户与余额</h3>
            </div>
            <el-button text @click="loadAccountAndLogs">刷新</el-button>
          </div>
        </template>

        <el-form :model="queryForm" label-width="96px" class="query-form">
          <div class="form-grid">
            <el-form-item label="商户" required>
              <el-select v-model="queryForm.merchantId" placeholder="请选择商户">
                <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="用户ID" required>
              <el-input-number v-model="queryForm.userId" :min="1" :precision="0" />
            </el-form-item>
          </div>
          <div class="query-actions">
            <el-button type="primary" @click="loadAccountAndLogs">查询账户</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </div>
        </el-form>

        <div class="account-panel">
          <div class="account-metric">
            <span>可用余额</span>
            <strong>{{ currentAccount ? formatCurrency(currentAccount.availableBalance) : "未查询" }}</strong>
          </div>
          <div class="account-metric">
            <span>冻结余额</span>
            <strong>{{ currentAccount ? formatCurrency(currentAccount.frozenBalance) : "未查询" }}</strong>
          </div>
          <div class="account-metric">
            <span>账户状态</span>
            <strong>{{ currentAccount ? (currentAccount.status === 1 ? "启用" : "禁用") : "未查询" }}</strong>
          </div>
        </div>

        <el-divider />

        <div class="panel__header panel__header--sub">
          <div>
            <p class="panel__eyebrow">Quick Recharge</p>
            <h4>直接充值</h4>
          </div>
        </div>

        <el-form :model="rechargeForm" label-width="96px">
          <div class="form-grid">
            <el-form-item label="充值单号">
              <el-input v-model="rechargeForm.rechargeNo" placeholder="可选，不填则后端生成" />
            </el-form-item>
            <el-form-item label="充值金额" required>
              <el-input-number v-model="rechargeForm.amount" :min="0.01" :precision="2" :step="0.01" />
            </el-form-item>
            <el-form-item label="操作人">
              <el-input v-model="rechargeForm.operator" placeholder="例如：payment-console" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="rechargeForm.remark" placeholder="例如：钱包联调充值" />
            </el-form-item>
          </div>
          <div class="query-actions">
            <el-button type="primary" :loading="recharging" @click="handleRecharge">执行充值</el-button>
          </div>
        </el-form>
      </el-card>

      <el-card class="panel" shadow="never">
        <template #header>
          <div class="panel__header">
            <div>
              <p class="panel__eyebrow">Test Checklist</p>
              <h3>钱包联调指引</h3>
            </div>
          </div>
        </template>

        <div class="checklist">
          <article class="checklist-card">
            <span>1</span>
            <div>
              <strong>先在商户页启用钱包能力</strong>
              <p>商户必须激活，且至少有一个 `WALLET / BALANCE` 渠道处于启用状态。</p>
            </div>
          </article>
          <article class="checklist-card">
            <span>2</span>
            <div>
              <strong>在此页查询账户并充值</strong>
              <p>先给测试用户充入可用余额，再去订单页选择钱包渠道发起支付。</p>
            </div>
          </article>
          <article class="checklist-card">
            <span>3</span>
            <div>
              <strong>订单页做钱包支付与退款</strong>
              <p>支付成功后回到此页确认余额扣减，退款后确认余额回退。</p>
            </div>
          </article>
          <article class="checklist-card">
            <span>4</span>
            <div>
              <strong>钱包订单页测充值/转账/提现回调</strong>
              <p>钱包订单支持模拟处理中、成功、失败，成功后会真实落余额变更。</p>
            </div>
          </article>
        </div>
      </el-card>
    </div>

    <el-card class="panel" shadow="never">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Wallet Logs</p>
            <h3>钱包账户流水</h3>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="logSearchForm" class="toolbar">
        <el-form-item label="业务类型">
          <el-select v-model="logSearchForm.bizType" clearable placeholder="全部类型" style="width: 200px">
            <el-option label="充值" value="RECHARGE" />
            <el-option label="支付" value="PAY" />
            <el-option label="退款" value="REFUND" />
            <el-option label="转出" value="TRANSFER_OUT" />
            <el-option label="转入" value="TRANSFER_IN" />
            <el-option label="提现" value="WITHDRAW" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务单号">
          <el-input v-model="logSearchForm.bizNo" clearable placeholder="请输入业务单号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="walletLogs" v-loading="logLoading" border class="table">
        <el-table-column prop="bizType" label="业务类型" width="140" />
        <el-table-column prop="bizNo" label="业务单号" min-width="180" />
        <el-table-column prop="changeType" label="方向" width="100" />
        <el-table-column label="变动金额" width="140">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.changeAmount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="变动前" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.balanceBefore) }}
          </template>
        </el-table-column>
        <el-table-column label="变动后" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.balanceAfter) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="140" />
        <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="logPagination.page"
        v-model:page-size="logPagination.size"
        :total="logPagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pager"
        @current-change="loadLogs"
        @size-change="handleLogSizeChange"
      />
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import {
  getMerchantList,
  getWalletAccount,
  getWalletAccountLogs,
  rechargeWalletAccount,
} from "../api/payment";
import type { Merchant, WalletAccount, WalletAccountLog } from "../types/payment";

const merchantOptions = ref<Merchant[]>([]);
const currentAccount = ref<WalletAccount | null>(null);
const walletLogs = ref<WalletAccountLog[]>([]);
const logLoading = ref(false);
const recharging = ref(false);
const route = useRoute();

const queryForm = reactive({
  merchantId: undefined as number | undefined,
  userId: undefined as number | undefined,
});

const rechargeForm = reactive({
  rechargeNo: "",
  amount: 0,
  operator: "payment-console",
  remark: "钱包联调充值",
});

const logSearchForm = reactive({
  bizType: "",
  bizNo: "",
});

const logPagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records;
}

async function loadAccountAndLogs() {
  if (!queryForm.merchantId || !queryForm.userId) {
    ElMessage.warning("请先选择商户并填写用户ID");
    return;
  }
  try {
    const res = await getWalletAccount({
      merchantId: queryForm.merchantId,
      userId: queryForm.userId,
    });
    currentAccount.value = res.data;
  } catch (error) {
    currentAccount.value = null;
    ElMessage.error("钱包账户不存在，请先充值或触发钱包业务");
  }
  await loadLogs();
}

async function loadLogs() {
  if (!queryForm.merchantId || !queryForm.userId) {
    return;
  }
  logLoading.value = true;
  try {
    const res = await getWalletAccountLogs({
      pageNum: logPagination.page,
      pageSize: logPagination.size,
      merchantId: queryForm.merchantId,
      userId: queryForm.userId,
      bizType: logSearchForm.bizType || undefined,
      bizNo: logSearchForm.bizNo || undefined,
    });
    walletLogs.value = res.data.records;
    logPagination.total = res.data.total;
  } finally {
    logLoading.value = false;
  }
}

async function handleRecharge() {
  if (!queryForm.merchantId || !queryForm.userId) {
    ElMessage.warning("请先选择商户并填写用户ID");
    return;
  }
  if (!rechargeForm.amount || rechargeForm.amount <= 0) {
    ElMessage.warning("请输入正确的充值金额");
    return;
  }
  recharging.value = true;
  try {
    await rechargeWalletAccount({
      merchantId: queryForm.merchantId,
      userId: queryForm.userId,
      rechargeNo: rechargeForm.rechargeNo || undefined,
      amount: rechargeForm.amount,
      operator: rechargeForm.operator || undefined,
      remark: rechargeForm.remark || undefined,
    });
    ElMessage.success("钱包余额已充值");
    await loadAccountAndLogs();
  } finally {
    recharging.value = false;
  }
}

function resetQuery() {
  queryForm.merchantId = undefined;
  queryForm.userId = undefined;
  currentAccount.value = null;
  walletLogs.value = [];
  logPagination.total = 0;
}

function handleLogSizeChange(size: number) {
  logPagination.size = size;
  logPagination.page = 1;
  loadLogs();
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

onMounted(async () => {
  await loadMerchants();
  const merchantId = Number(route.query.merchantId || 0);
  const userId = Number(route.query.userId || 0);
  if (merchantId > 0) {
    queryForm.merchantId = merchantId;
  }
  if (userId > 0) {
    queryForm.userId = userId;
  }
  if (queryForm.merchantId && queryForm.userId) {
    await loadAccountAndLogs();
  }
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 18px;
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

.hero-card--accent {
  background:
    radial-gradient(circle at top right, rgb(189 139 67 / 28%), transparent 30%),
    linear-gradient(140deg, #2b1b10 0%, #63411f 58%, #a96a2e 100%);
  color: #f8efe3;
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #8e6945;
}

.hero-card--accent p,
.hero-card--accent span,
.hero-card--accent strong {
  color: #f8efe3;
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

.panel__header--sub {
  margin-bottom: 12px;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #bf8445;
}

.panel__header h3,
.panel__header h4 {
  margin: 0;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.panel__header h3 {
  font-size: 24px;
}

.panel__header h4 {
  font-size: 18px;
}

.query-form,
.toolbar {
  margin-bottom: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}

.query-actions {
  display: flex;
  gap: 12px;
}

.account-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.account-metric {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgb(255 253 249 / 96%) 0%, rgb(248 238 221 / 88%) 100%);
  border: 1px solid rgb(125 84 45 / 10%);
}

.account-metric span,
.account-metric strong {
  display: block;
}

.account-metric span {
  color: #8e6945;
}

.account-metric strong {
  margin-top: 12px;
  font-size: 24px;
  color: #2b1b10;
}

.checklist {
  display: grid;
  gap: 12px;
}

.checklist-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgb(255 253 249 / 96%) 0%, rgb(246 236 220 / 86%) 100%);
  border: 1px solid rgb(125 84 45 / 10%);
}

.checklist-card span {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(185 120 49 / 14%);
  color: #9d5f24;
  font-weight: 700;
}

.checklist-card strong,
.checklist-card p {
  display: block;
}

.checklist-card p {
  margin: 8px 0 0;
  line-height: 1.7;
  color: #705847;
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
  .hero-grid,
  .dashboard-grid,
  .account-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
