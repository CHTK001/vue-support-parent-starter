<template>
  <PmPageShell page-class="wallet-order-page">
    <PmSurface
      title="钱包订单台"
      description="统一查看充值、转账、提现订单，并支持模拟回调和明细排查。"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
        <el-tooltip content="充值订单">
          <ScButton circle :icon="WalletFilled" @click="openCreateDialog('RECHARGE')" />
        </el-tooltip>
        <el-tooltip content="转账订单">
          <ScButton circle :icon="Switch" @click="openCreateDialog('TRANSFER')" />
        </el-tooltip>
        <el-tooltip content="提现订单">
          <ScButton circle type="primary" :icon="CreditCard" @click="openCreateDialog('WITHDRAW')" />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="钱包订单" hint="充值、转账、提现三个钱包业务的统一订单视图。">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="处理中" hint="待回调或第三方仍在处理中的钱包订单。">
        <template #value>{{ stats.processing }}</template>
      </PmStatCard>
      <PmStatCard label="成功率" hint="基于当前查询结果估算的钱包订单成功处理比例。">
        <template #value>{{ stats.successRate }}%</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <ScSelect v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
          <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
        </ScSelect>
        <el-input-number v-model="queryForm.userId" :min="1" :precision="0" placeholder="用户ID" />
        <ScSelect v-model="queryForm.orderType" clearable placeholder="业务类型" style="width: 180px">
          <ScOption v-for="(label, value) in WalletOrderTypeMap" :key="value" :label="label" :value="value" />
        </ScSelect>
        <ScSelect v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
          <ScOption v-for="(label, value) in WalletOrderStatusMap" :key="value" :label="label" :value="value" />
        </ScSelect>
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleSearch">查询</ScButton>
        <ScButton @click="handleReset">重置</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="钱包订单主表" description="集中查看钱包订单号、类型、用户、回调地址、第三方单号和模拟动作。">
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
              <ScButton
                v-if="row.status === 'PENDING' || row.status === 'PROCESSING'"
                link
                type="warning"
                @click="handleSimulateNotify(row, 'PROCESSING')"
              >
                模拟处理中
              </ScButton>
              <ScButton v-if="row.status !== 'SUCCESS'" link type="success" @click="handleSimulateNotify(row, 'SUCCESS')">
                模拟成功
              </ScButton>
              <ScButton v-if="row.status !== 'FAILED'" link type="danger" @click="handleSimulateNotify(row, 'FAILED')">
                模拟失败
              </ScButton>
              <ScButton link type="primary" @click="showDetail(row)">详情</ScButton>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <ScDialog v-model="createDialogVisible" :title="dialogTitle" width="920px" destroy-on-close>
      <div class="pm-dialog-shell">
        <PmStatusStrip>
          <PmStatusCard label="业务类型" :hint="currentActionHint">
            <template #value>{{ WalletOrderTypeMap[currentAction] }}</template>
          </PmStatusCard>
          <PmStatusCard label="当前商户" hint="钱包订单创建后可在此页直接模拟回调。">
            <template #value>{{ currentCreateMerchantLabel }}</template>
          </PmStatusCard>
          <PmStatusCard label="订单金额" hint="支持业务侧自定义单号和订单级回调地址。">
            <template #value>{{ formatCurrency(createForm.amount) }}</template>
          </PmStatusCard>
        </PmStatusStrip>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>基础参数</h3>
              <p>先确定商户、用户和金额，再补充单号、回调和银行信息。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="pm-form-grid">
              <el-form-item label="商户" required>
                <ScSelect v-model="createForm.merchantId" placeholder="请选择商户">
                  <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
                </ScSelect>
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
              <el-form-item label="回调地址" class="pm-form-span-2">
                <el-input v-model="createForm.notifyUrl" placeholder="可选，默认使用后端自动生成的钱包回调地址" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section v-if="currentAction === 'WITHDRAW'" class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>提现账户信息</h3>
              <p>提现订单需要补全开户名、银行卡号和开户行。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="pm-form-grid">
              <el-form-item label="开户名">
                <el-input v-model="createForm.accountName" placeholder="请输入开户名" />
              </el-form-item>
              <el-form-item label="银行卡号">
                <el-input v-model="createForm.bankAccount" placeholder="请输入银行卡号" />
              </el-form-item>
              <el-form-item label="开户行" class="pm-form-span-2">
                <el-input v-model="createForm.bankName" placeholder="请输入开户行" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>操作信息</h3>
              <p>保留业务备注和操作人，用于后续排查和审计。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="pm-form-grid">
              <el-form-item label="操作人">
                <el-input v-model="createForm.operator" placeholder="例如：payment-console" />
              </el-form-item>
              <el-form-item label="说明">
                <div class="pm-soft-panel pm-subtle">钱包订单支持在本页模拟处理中、成功、失败回调，成功后会真实落余额变更。</div>
              </el-form-item>
              <el-form-item label="备注" class="pm-form-span-2">
                <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="填写业务备注或联调说明" />
              </el-form-item>
            </div>
          </el-form>
        </section>
      </div>

      <template #footer>
        <div class="pm-dialog-footer">
          <ScButton @click="createDialogVisible = false">取消</ScButton>
          <ScButton type="primary" :loading="submitting" @click="submitCreate">创建</ScButton>
        </div>
      </template>
    </ScDialog>

    <ScDrawer v-model="detailVisible" size="720px" :title="currentOrder ? `${currentOrder.orderNo} · 钱包订单详情` : '钱包订单详情'">
      <template v-if="currentOrder">
        <div class="pm-dialog-shell">
          <PmStatusStrip>
            <PmStatusCard label="订单状态" :hint="currentOrder.thirdPartyOrderNo || '未回填第三方单号'">
              <template #value>{{ WalletOrderStatusMap[currentOrder.status] || currentOrder.status }}</template>
            </PmStatusCard>
            <PmStatusCard label="业务类型" :hint="`金额 ${formatCurrency(currentOrder.amount)}`">
              <template #value>{{ WalletOrderTypeMap[currentOrder.orderType] || currentOrder.orderType }}</template>
            </PmStatusCard>
            <PmStatusCard label="用户信息" :hint="currentOrder.notifyUrl || '未配置订单级回调地址'">
              <template #value>{{ currentOrder.userId || currentOrder.relatedUserId || "-" }}</template>
            </PmStatusCard>
          </PmStatusStrip>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>基础信息</h3>
                <p>核对订单号、业务类型、银行账户和回调信息。</p>
              </div>
            </div>
            <div class="pm-readonly-grid">
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">钱包订单号</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.orderNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">第三方单号</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.thirdPartyOrderNo || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">商户ID</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.merchantId }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">用户ID</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.userId || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">关联用户ID</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.relatedUserId || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">回调地址</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.notifyUrl || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">开户名</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.accountName || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">银行卡号</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.bankAccount || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">开户行</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.bankName || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">备注</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.remark || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>请求与响应快照</h3>
                <p>用于核对钱包订单入参与回调结果。</p>
              </div>
            </div>
            <div class="pm-form-stack">
              <div class="pm-soft-panel">
                <strong>请求快照</strong>
                <pre class="pm-code-preview">{{ currentOrder.requestPayload || "-" }}</pre>
              </div>
              <div class="pm-soft-panel">
                <strong>响应快照</strong>
                <pre class="pm-code-preview">{{ currentOrder.responsePayload || "-" }}</pre>
              </div>
            </div>
          </section>
        </div>
      </template>
    </ScDrawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ScDrawer } from "@repo/components";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CreditCard, RefreshRight, Search, Switch, WalletFilled } from "@element-plus/icons-vue";
import { ScButton } from "@repo/components/ScButton";
import { ScSelect } from "@repo/components/ScSelect";
import { ScOption } from "@repo/components/ScOption";
import { ScDialog } from "@repo/components/ScDialog";
import ScTable from "@repo/components/ScTable/index.vue";
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
import { formatCurrency } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import PmStatusStrip from "../components/layout/PmStatusStrip.vue";
import PmStatusCard from "../components/layout/PmStatusCard.vue";

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
