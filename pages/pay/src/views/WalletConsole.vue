<template>
  <PmPageShell page-class="wallet-console-page">
    <PmSurface
      title="钱包账户台"
      description="统一查看所有有钱包账户的用户余额、状态，并执行充值与管理。"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="钱包账户数" hint="当前拥有钱包账户的用户总数">
        <template #value>{{ walletAccountTotal }}</template>
      </PmStatCard>
      <PmStatCard label="可用余额总计" hint="全部钱包账户的可用余额之和">
        <template #value>{{ formatCurrency(totalAvailableBalance) }}</template>
      </PmStatCard>
      <PmStatCard label="冻结余额总计" hint="全部钱包账户的冻结余额之和">
        <template #value>{{ formatCurrency(totalFrozenBalance) }}</template>
      </PmStatCard>
      <PmStatCard label="启用账户" hint="状态为已启用的钱包账户数">
        <template #value>{{ activeAccountCount }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmPanel title="钱包账户列表" description="所有有钱包账户的用户，支持余额查询、充值及流水追溯。">
      <template #actions>
        <ScSelect v-model="queryForm.merchantId" clearable placeholder="按商户筛选" style="width: 200px">
          <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
        </ScSelect>
        <ScButton type="primary" @click="reloadAll">查询</ScButton>
        <ScButton @click="resetQuery">重置</ScButton>
      </template>

      <ScTable
        ref="tableRef"
        table-name="payment-wallet-account-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchWalletAccountPage"
      >
        <el-table-column label="商户" min-width="160">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ merchantNameMap[row.merchantId] || `商户 #${row.merchantId}` }}</strong>
              <span>ID: {{ row.merchantId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column label="可用余额" width="140" align="center">
          <template #default="{ row }">
            <strong class="cell-balance">{{ formatCurrency(row.availableBalance) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="冻结余额" width="140" align="center">
          <template #default="{ row }">
            <span class="cell-frozen">{{ formatCurrency(row.frozenBalance) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '启用' : row.status === 2 ? '冻结' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="充值">
              <ScButton circle type="primary" :icon="WalletFilled" @click="openRechargeDialog(row)" />
            </el-tooltip>
            <el-tooltip content="流水">
              <ScButton circle :icon="Document" @click="openLogDrawer(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <!-- 充值对话框 -->
    <ScDialog
      v-model="rechargeDialogVisible"
      title="钱包充值"
      width="520px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="商户">
          <strong>{{ rechargeTarget ? merchantNameMap[rechargeTarget.merchantId] || `商户 #${rechargeTarget.merchantId}` : '-' }}</strong>
        </el-form-item>
        <el-form-item label="用户ID">
          <strong>{{ rechargeTarget?.userId }}</strong>
        </el-form-item>
        <el-form-item label="当前余额">
          <strong>{{ rechargeTarget ? formatCurrency(rechargeTarget.availableBalance) : '-' }}</strong>
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
      </el-form>
      <template #footer>
        <ScButton @click="rechargeDialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="recharging" @click="handleRecharge">确认充值</ScButton>
      </template>
    </ScDialog>

    <!-- 流水抽屉 -->
    <ScDrawer
      v-model="logDrawerVisible"
      size="720px"
      :title="logDrawerTitle"
      destroy-on-close
    >
      <template v-if="rechargeTarget">
        <PmStatusStrip>
          <PmStatusCard label="可用余额" :hint="`商户 #${rechargeTarget.merchantId} · 用户 ${rechargeTarget.userId}`">
            <template #value>{{ formatCurrency(rechargeTarget.availableBalance) }}</template>
          </PmStatusCard>
          <PmStatusCard label="冻结余额">
            <template #value>{{ formatCurrency(rechargeTarget.frozenBalance) }}</template>
          </PmStatusCard>
          <PmStatusCard label="流水记录">
            <template #value>{{ logPagination.total }}</template>
          </PmStatusCard>
        </PmStatusStrip>

        <section class="pm-section" style="margin-top: 16px;">
          <div class="pm-toolbar--flat">
            <ScSelect v-model="logSearchForm.bizType" clearable placeholder="业务类型" style="width: 200px">
              <ScOption label="充值" value="RECHARGE" />
              <ScOption label="支付" value="PAY" />
              <ScOption label="退款" value="REFUND" />
              <ScOption label="转出" value="TRANSFER_OUT" />
              <ScOption label="转入" value="TRANSFER_IN" />
              <ScOption label="提现" value="WITHDRAW" />
            </ScSelect>
            <el-input v-model="logSearchForm.bizNo" clearable placeholder="业务单号" style="width: 200px" />
            <ScButton type="primary" @click="loadLogs">查询</ScButton>
          </div>

          <el-table :data="walletLogs" border stripe style="width: 100%;">
            <el-table-column prop="bizType" label="业务类型" width="120" />
            <el-table-column prop="bizNo" label="业务单号" min-width="160" />
            <el-table-column prop="changeType" label="方向" width="80" />
            <el-table-column label="变动金额" width="130">
              <template #default="{ row }">
                <strong>{{ formatCurrency(row.changeAmount) }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="变动前" width="120">
              <template #default="{ row }">{{ formatCurrency(row.balanceBefore) }}</template>
            </el-table-column>
            <el-table-column label="变动后" width="120">
              <template #default="{ row }">{{ formatCurrency(row.balanceAfter) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="170" />
          </el-table>

          <el-pagination
            v-model:current-page="logPagination.page"
            v-model:page-size="logPagination.size"
            :total="logPagination.total"
            :page-sizes="[5, 10, 20]"
            layout="total, sizes, prev, pager, next"
            class="pager"
            @current-change="loadLogs"
            @size-change="handleLogSizeChange"
          />
        </section>
      </template>
    </ScDrawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Document, RefreshRight, WalletFilled } from "@element-plus/icons-vue";
import { getMerchantList, getWalletAccountPage, getWalletAccountLogs, rechargeWalletAccount } from "../api/payment";
import type { Merchant, WalletAccount, WalletAccountLog } from "../types/payment";
import { formatCurrency } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import { ScButton } from "@repo/components/ScButton";
import { ScSelect } from "@repo/components/ScSelect";
import { ScOption } from "@repo/components/ScOption";
import ScTable from "@repo/components/ScTable/index.vue";

const tableRef = ref();
const merchantOptions = ref<Merchant[]>([]);
const walletAccounts = ref<WalletAccount[]>([]);
const walletLogs = ref<WalletAccountLog[]>([]);
const recharging = ref(false);
const rechargeTarget = ref<WalletAccount | null>(null);
const merchantNameMap = ref<Record<number, string>>({});

const queryForm = reactive({
  merchantId: undefined as number | undefined,
});

const rechargeForm = reactive({
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

const rechargeDialogVisible = ref(false);
const logDrawerVisible = ref(false);

/* ── Computed Stats ── */

const walletAccountTotal = computed(() => walletAccounts.value.length);
const totalAvailableBalance = computed(() => walletAccounts.value.reduce((sum, a) => sum + (a.availableBalance || 0), 0));
const totalFrozenBalance = computed(() => walletAccounts.value.reduce((sum, a) => sum + (a.frozenBalance || 0), 0));
const activeAccountCount = computed(() => walletAccounts.value.filter((a) => a.status === 1).length);
const logDrawerTitle = computed(() =>
  rechargeTarget.value
    ? `${merchantNameMap.value[rechargeTarget.value.merchantId] || `商户 #${rechargeTarget.value.merchantId}`} · 用户 ${rechargeTarget.value.userId} · 流水`
    : "钱包流水"
);

/* ── API ── */

const fetchWalletAccountPage = async (params: Record<string, unknown>) => {
  const res = await getWalletAccountPage({ pageNum: params.page, pageSize: params.pageSize, merchantId: params.merchantId || undefined });
  walletAccounts.value = res.data.records || [];
  return res.data;
};

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  const list = res.data.records || [];
  merchantOptions.value = list;
  list.forEach((m) => { merchantNameMap.value[m.id] = m.merchantName; });
}

async function loadLogs() {
  if (!rechargeTarget.value) return;
  const res = await getWalletAccountLogs({
    pageNum: logPagination.page,
    pageSize: logPagination.size,
    merchantId: rechargeTarget.value.merchantId,
    userId: rechargeTarget.value.userId,
    bizType: logSearchForm.bizType || undefined,
    bizNo: logSearchForm.bizNo || undefined,
  });
  walletLogs.value = res.data.records || [];
  logPagination.total = res.data.total || 0;
}

async function reloadAll() {
  await loadMerchants();
  tableRef.value?.reload({ ...queryForm }, 1);
}

function resetQuery() {
  queryForm.merchantId = undefined;
  tableRef.value?.reload({ ...queryForm }, 1);
}

/* ── Recharge ── */

function openRechargeDialog(row: WalletAccount) {
  rechargeTarget.value = row;
  rechargeForm.amount = 0;
  rechargeForm.operator = "payment-console";
  rechargeForm.remark = "钱包联调充值";
  rechargeDialogVisible.value = true;
}

async function handleRecharge() {
  if (!rechargeTarget.value || !rechargeForm.amount || rechargeForm.amount <= 0) {
    ElMessage.warning("请输入正确的充值金额");
    return;
  }
  recharging.value = true;
  try {
    await rechargeWalletAccount({
      merchantId: rechargeTarget.value.merchantId,
      userId: rechargeTarget.value.userId,
      amount: rechargeForm.amount,
      operator: rechargeForm.operator || undefined,
      remark: rechargeForm.remark || undefined,
    });
    ElMessage.success("钱包余额已充值");
    rechargeDialogVisible.value = false;
    await reloadAll();
  } finally {
    recharging.value = false;
  }
}

/* ── Log Drawer ── */

function openLogDrawer(row: WalletAccount) {
  rechargeTarget.value = row;
  logPagination.page = 1;
  logPagination.total = 0;
  logSearchForm.bizType = "";
  logSearchForm.bizNo = "";
  walletLogs.value = [];
  logDrawerVisible.value = true;
  loadLogs();
}

function handleLogSizeChange(size: number) {
  logPagination.size = size;
  logPagination.page = 1;
  loadLogs();
}

/* ── Lifecycle ── */

onMounted(async () => {
  await loadMerchants();
  tableRef.value?.reload();
});
</script>

<style scoped>
.wallet-console-page {
  background: linear-gradient(180deg, #eef7f6 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.wallet-console-page :deep(.pm-stat-card:first-child) {
  background: linear-gradient(140deg, #2b1b10 0%, #63411f 58%, #a96a2e 100%);
}

.wallet-console-page :deep(.pm-stat-card:first-child .pm-stat-card__label),
.wallet-console-page :deep(.pm-stat-card:first-child .pm-stat-card__value),
.wallet-console-page :deep(.pm-stat-card:first-child .pm-stat-card__hint) {
  color: #f8efe3;
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-main span {
  color: #667085;
  font-size: 12px;
}

.cell-balance {
  color: #067647;
}

.cell-frozen {
  color: #b54708;
}

.pm-toolbar--flat {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
