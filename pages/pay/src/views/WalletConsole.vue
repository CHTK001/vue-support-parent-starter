<template>
  <section class="payment-page wallet-console-page">
    <header class="payment-surface">
      <div>
        <h1 class="payment-surface__title">钱包账户台</h1>
        <p class="payment-surface__desc">查询账户余额、执行测试充值，并追踪当前账户的钱包账变流水。</p>
      </div>
      <div class="payment-surface__actions">
        <el-tooltip content="刷新">
          <el-button circle :icon="RefreshRight" @click="loadAccountAndLogs" />
        </el-tooltip>
        <el-tooltip content="执行充值">
          <el-button circle type="primary" :icon="WalletFilled" :loading="recharging" @click="handleRecharge" />
        </el-tooltip>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat payment-stat--accent">
        <span class="payment-stat__label">可用余额</span>
        <strong class="payment-stat__value">{{ currentAccount ? formatCurrency(currentAccount.availableBalance) : "¥0.00" }}</strong>
        <span class="payment-stat__hint">当前查询账户可立即用于钱包支付和转账的余额。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">冻结余额</span>
        <strong class="payment-stat__value">{{ currentAccount ? formatCurrency(currentAccount.frozenBalance) : "¥0.00" }}</strong>
        <span class="payment-stat__hint">若出现异常冻结，需检查业务侧是否仍持有控制逻辑。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">账户流水</span>
        <strong class="payment-stat__value">{{ logPagination.total }}</strong>
        <span class="payment-stat__hint">展示当前筛选条件下的钱包账变记录总数。</span>
      </article>
    </section>

    <section class="wallet-console-grid">
      <section class="payment-panel">
        <div class="payment-panel__head">
          <div>
            <h2 class="payment-panel__title">钱包账户与充值</h2>
            <p class="payment-panel__desc">先锁定商户和用户，再查询账户余额并直接执行测试充值。</p>
          </div>
        </div>

        <div class="wallet-console-stack">
          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>账户查询</h3>
                <p>钱包账户依赖商户和用户维度，支持从路由 query 自动回填。</p>
              </div>
            </div>
            <el-form label-width="96px">
              <div class="payment-form-grid">
                <el-form-item label="商户" required>
                  <el-select v-model="queryForm.merchantId" placeholder="请选择商户">
                    <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="用户ID" required>
                  <el-input-number v-model="queryForm.userId" :min="1" :precision="0" />
                </el-form-item>
              </div>
              <div class="payment-card-actions">
                <el-button type="primary" @click="loadAccountAndLogs">查询账户</el-button>
                <el-button @click="resetQuery">重置</el-button>
              </div>
            </el-form>
          </section>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>账户概览</h3>
                <p>适合在钱包支付、退款、转账、提现联调前快速确认余额和状态。</p>
              </div>
            </div>
            <div class="payment-readonly-grid">
              <div class="payment-readonly-item">
                <span>可用余额</span>
                <strong>{{ currentAccount ? formatCurrency(currentAccount.availableBalance) : "未查询" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>冻结余额</span>
                <strong>{{ currentAccount ? formatCurrency(currentAccount.frozenBalance) : "未查询" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>账户状态</span>
                <strong>{{ currentAccount ? (currentAccount.status === 1 ? "启用" : "禁用") : "未查询" }}</strong>
              </div>
            </div>
          </section>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>直接充值</h3>
                <p>给当前账户快速充入测试余额，便于后续在订单台验证钱包支付和退款。</p>
              </div>
            </div>
            <el-form label-width="96px">
              <div class="payment-form-grid">
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
              <div class="payment-card-actions">
                <el-button type="primary" :loading="recharging" @click="handleRecharge">执行充值</el-button>
              </div>
            </el-form>
          </section>
        </div>
      </section>

      <section class="payment-panel">
        <div class="payment-panel__head">
          <div>
            <h2 class="payment-panel__title">钱包联调指引</h2>
            <p class="payment-panel__desc">把商户、账户、订单和回调链路串起来，减少联调时来回找入口。</p>
          </div>
        </div>

        <div class="wallet-checklist">
          <article class="wallet-checklist__item">
            <span>1</span>
            <div>
              <strong>先在商户页启用钱包能力</strong>
              <p>商户必须激活，且至少有一个 `WALLET / BALANCE` 渠道处于启用状态。</p>
            </div>
          </article>
          <article class="wallet-checklist__item">
            <span>2</span>
            <div>
              <strong>在此页查询账户并充值</strong>
              <p>先给测试用户充入可用余额，再去订单页选择钱包渠道发起支付。</p>
            </div>
          </article>
          <article class="wallet-checklist__item">
            <span>3</span>
            <div>
              <strong>订单页做钱包支付与退款</strong>
              <p>支付成功后回到此页确认余额扣减，退款后确认余额回退。</p>
            </div>
          </article>
          <article class="wallet-checklist__item">
            <span>4</span>
            <div>
              <strong>钱包订单页测充值/转账/提现回调</strong>
              <p>钱包订单支持模拟处理中、成功、失败，成功后会真实落余额变更。</p>
            </div>
          </article>
        </div>
      </section>
    </section>

    <section class="payment-panel">
      <div class="payment-panel__head">
        <div>
          <h2 class="payment-panel__title">钱包账户流水</h2>
          <p class="payment-panel__desc">展示当前商户和用户下的钱包账变方向、前后余额和业务单号。</p>
        </div>
      </div>

      <section class="payment-toolbar payment-toolbar--flat">
        <div class="payment-toolbar__row">
          <div class="payment-toolbar__form">
            <el-select v-model="logSearchForm.bizType" clearable placeholder="业务类型" style="width: 200px">
              <el-option label="充值" value="RECHARGE" />
              <el-option label="支付" value="PAY" />
              <el-option label="退款" value="REFUND" />
              <el-option label="转出" value="TRANSFER_OUT" />
              <el-option label="转入" value="TRANSFER_IN" />
              <el-option label="提现" value="WITHDRAW" />
            </el-select>
            <el-input v-model="logSearchForm.bizNo" clearable placeholder="业务单号" style="width: 220px" />
            <el-button type="primary" @click="loadLogs">查询</el-button>
          </div>
        </div>
      </section>

      <ScTable
        table-name="payment-wallet-log-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :data="{ records: walletLogs, total: logPagination.total, current: logPagination.page, size: logPagination.size }"
      >
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
      </ScTable>

      <el-pagination
        v-model:current-page="logPagination.page"
        v-model:page-size="logPagination.size"
        :total="logPagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="payment-pagination"
        @current-change="loadLogs"
        @size-change="handleLogSizeChange"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import { RefreshRight, WalletFilled } from "@element-plus/icons-vue";
import { getMerchantList, getWalletAccount, getWalletAccountLogs, rechargeWalletAccount } from "../api/payment";
import type { Merchant, WalletAccount, WalletAccountLog } from "../types/payment";

const merchantOptions = ref<Merchant[]>([]);
const currentAccount = ref<WalletAccount | null>(null);
const walletLogs = ref<WalletAccountLog[]>([]);
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
  merchantOptions.value = res.data.records || [];
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
    console.error(error);
    currentAccount.value = null;
    ElMessage.error("钱包账户不存在，请先充值或触发钱包业务");
  }
  await loadLogs();
}

async function loadLogs() {
  if (!queryForm.merchantId || !queryForm.userId) {
    return;
  }
  const res = await getWalletAccountLogs({
    pageNum: logPagination.page,
    pageSize: logPagination.size,
    merchantId: queryForm.merchantId,
    userId: queryForm.userId,
    bizType: logSearchForm.bizType || undefined,
    bizNo: logSearchForm.bizNo || undefined,
  });
  walletLogs.value = res.data.records || [];
  logPagination.total = res.data.total || 0;
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
@import "./support/payment-page.css";

.wallet-console-page {
  background: linear-gradient(180deg, #eef7f6 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.payment-stat--accent {
  background: linear-gradient(140deg, #2b1b10 0%, #63411f 58%, #a96a2e 100%);
}

.payment-stat--accent .payment-stat__label,
.payment-stat--accent .payment-stat__value,
.payment-stat--accent .payment-stat__hint {
  color: #f8efe3;
}

.wallet-console-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr);
}

.wallet-console-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wallet-checklist {
  display: grid;
  gap: 12px;
}

.wallet-checklist__item {
  display: grid;
  gap: 14px;
  grid-template-columns: 44px minmax(0, 1fr);
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(205, 216, 222, 0.96);
  background: linear-gradient(145deg, rgba(255, 253, 249, 0.96) 0%, rgba(246, 236, 220, 0.86) 100%);
}

.wallet-checklist__item span {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(185, 120, 49, 0.14);
  color: #9d5f24;
  font-weight: 700;
}

.wallet-checklist__item strong {
  display: block;
  color: #101828;
}

.wallet-checklist__item p {
  margin: 8px 0 0;
  color: #705847;
  line-height: 1.7;
}

.payment-toolbar--flat {
  margin-bottom: 12px;
  padding: 0;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.payment-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 1180px) {
  .wallet-console-grid {
    grid-template-columns: 1fr;
  }
}
</style>
