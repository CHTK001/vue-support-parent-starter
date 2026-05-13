<template>
  <PmPageShell page-class="withdraw-approval-page">
    <PmSurface
      title="提现审批"
      description="审核商户发起的钱包提现申请，通过后自动创建提现订单。"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="审批单总数" hint="包含待审批、已通过、已拒绝的全部记录。">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="待审批" hint="等待管理员处理的提现申请。">
        <template #value>{{ stats.pending }}</template>
      </PmStatCard>
      <PmStatCard label="已通过金额" hint="审批通过的提现总金额。">
        <template #value>{{ formatCurrency(stats.approvedAmount) }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <el-input v-model="queryForm.withdrawNo" clearable placeholder="提现单号" style="width: 220px" @keyup.enter="handleSearch" />
        <ScSelect v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
          <ScOption label="待审批" value="PENDING" />
          <ScOption label="已通过" value="APPROVED" />
          <ScOption label="已拒绝" value="REJECTED" />
        </ScSelect>
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleSearch">查询</ScButton>
        <ScButton @click="handleReset">重置</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="提现审批主表" description="查看提现申请详情，执行通过或拒绝操作。">
      <ScTable
        ref="tableRef"
        table-name="payment-withdraw-approval-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchApprovalTable"
      >
        <el-table-column label="提现单号 / 备注" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.withdrawNo }}</strong>
              <span>{{ row.remark || "---" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商户 / 用户" min-width="180">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>商户 #{{ row.merchantId }}</strong>
              <span>用户 #{{ row.userId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="银行信息" min-width="240">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.bankName || "-" }}</strong>
              <span>{{ row.bankAccount }} · {{ row.accountName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提现金额" width="140" align="center">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.amount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" effect="plain">{{ WithdrawApprovalStatusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            <span>{{ row.operator || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span>{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批时间" width="170">
          <template #default="{ row }">
            <span>{{ row.status !== 'PENDING' ? formatTime(row.approveTime) : "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions ops-hover-actions">
              <el-tooltip content="查看详情">
                <ScButton circle :icon="Document" @click="showDetail(row)" />
              </el-tooltip>
              <el-tooltip v-if="row.status === 'PENDING'" content="通过审批">
                <ScButton circle type="success" :icon="CircleCheck" @click="handleApprove(row)" />
              </el-tooltip>
              <el-tooltip v-if="row.status === 'PENDING'" content="拒绝">
                <ScButton circle type="danger" :icon="CloseBold" @click="handleReject(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <ScDrawer v-model="detailVisible" size="600px" :title="currentRow ? `${currentRow.withdrawNo} · 审批详情` : '审批详情'" layout="simple">
      <template v-if="currentRow">
        <div class="pm-dialog-shell">
          <PmStatusStrip>
            <PmStatusCard label="审批状态" :hint="currentRow.remark || '---'">
              <template #value>{{ WithdrawApprovalStatusMap[currentRow.status] || currentRow.status }}</template>
            </PmStatusCard>
            <PmStatusCard label="提现金额" :hint="'商户 #' + currentRow.merchantId">
              <template #value>{{ formatCurrency(currentRow.amount) }}</template>
            </PmStatusCard>
            <PmStatusCard label="提现单号" :hint="'用户 #' + currentRow.userId">
              <template #value>{{ currentRow.withdrawNo }}</template>
            </PmStatusCard>
          </PmStatusStrip>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>基础信息</h3>
                <p>提现申请详情与银行账户信息。</p>
              </div>
            </div>
            <div class="pm-readonly-grid">
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">提现单号</span>
                <strong class="pm-readonly-item__value">{{ currentRow.withdrawNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">商户ID</span>
                <strong class="pm-readonly-item__value">{{ currentRow.merchantId }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">用户ID</span>
                <strong class="pm-readonly-item__value">{{ currentRow.userId }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">提现金额</span>
                <strong class="pm-readonly-item__value">{{ formatCurrency(currentRow.amount) }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">银行名称</span>
                <strong class="pm-readonly-item__value">{{ currentRow.bankName || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">银行账号</span>
                <strong class="pm-readonly-item__value">{{ currentRow.bankAccount }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">账户名</span>
                <strong class="pm-readonly-item__value">{{ currentRow.accountName }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">操作人</span>
                <strong class="pm-readonly-item__value">{{ currentRow.operator || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">创建时间</span>
                <strong class="pm-readonly-item__value">{{ formatTime(currentRow.createdAt) || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">审批时间</span>
                <strong class="pm-readonly-item__value">{{ currentRow.status !== 'PENDING' ? formatTime(currentRow.approveTime) : "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">备注</span>
                <strong class="pm-readonly-item__value">{{ currentRow.remark || "-" }}</strong>
              </div>
            </div>
          </section>
        </div>
      </template>
    </ScDrawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, CloseBold, Document, RefreshRight, Search } from "@element-plus/icons-vue";
import { getWithdrawApprovalPage, approveWithdraw, rejectWithdraw } from "../api/payment";
import type { WithdrawApproval } from "../types/payment";
import { WithdrawApprovalStatusMap } from "../types/payment";
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
import { ScButton } from "@repo/components/ScButton";
import { ScSelect } from "@repo/components/ScSelect";
import { ScOption } from "@repo/components/ScOption";
import ScTable from "@repo/components/ScTable/index.vue";
import { ScDrawer } from "@repo/components/ScDrawer";

const tableRef = ref();
const detailVisible = ref(false);
const currentRow = ref<WithdrawApproval | null>(null);

onMounted(() => {
  tableRef.value?.reload();
});

const queryForm = reactive({
  withdrawNo: "",
  status: "",
});

const stats = reactive({
  total: 0,
  pending: 0,
  approvedAmount: 0,
});

const fetchApprovalTable = (params: Record<string, unknown>) =>
  getWithdrawApprovalPage({
    pageNum: params.page,
    pageSize: params.pageSize,
    withdrawNo: params.withdrawNo || undefined,
    status: params.status || undefined,
  });

async function loadStats() {
  try {
    const res = await getWithdrawApprovalPage({ pageNum: 1, pageSize: 1, status: "" });
    stats.total = res.data.total;
  } catch { /* ignore */ }
  try {
    const pendingRes = await getWithdrawApprovalPage({ pageNum: 1, pageSize: 1, status: "PENDING" });
    stats.pending = pendingRes.data.total;
  } catch { /* ignore */ }
  try {
    const approvedRes = await getWithdrawApprovalPage({ pageNum: 1, pageSize: 200, status: "APPROVED" });
    stats.approvedAmount = (approvedRes.data.records || []).reduce((sum: number, r: WithdrawApproval) => sum + Number(r.amount), 0);
  } catch { /* ignore */ }
}

function reloadAll() {
  loadStats();
  tableRef.value?.reload();
}

function handleSearch() {
  tableRef.value?.reload();
}

function handleReset() {
  queryForm.withdrawNo = "";
  queryForm.status = "";
  tableRef.value?.reload();
}

function showDetail(row: WithdrawApproval) {
  currentRow.value = row;
  detailVisible.value = true;
}

async function handleApprove(row: WithdrawApproval) {
  try {
    const { ElMessageBox } = await import("element-plus");
    await ElMessageBox.confirm(
      `确认通过提现申请 ${row.withdrawNo}（¥${row.amount}）？此操作将扣除冻结余额并创建提现订单。`,
      "通过审批",
      { type: "warning", confirmButtonText: "确认通过", cancelButtonText: "取消" },
    );
    await approveWithdraw(row.id);
    ElMessage.success("提现审批已通过");
    await reloadAll();
  } catch { /* cancelled */ }
}

async function handleReject(row: WithdrawApproval) {
  try {
    const { ElMessageBox } = await import("element-plus");
    const { value: reason } = await ElMessageBox.prompt(
      `确认拒绝提现申请 ${row.withdrawNo}？冻结余额将返还至可用余额。`,
      "拒绝提现",
      { confirmButtonText: "确认拒绝", cancelButtonText: "取消", inputPlaceholder: "请输入拒绝原因（可选）" },
    );
    await rejectWithdraw(row.id, undefined, reason || undefined);
    ElMessage.success("提现申请已拒绝，冻结余额已释放");
    await reloadAll();
  } catch { /* cancelled or closed */ }
}

function statusTag(status: string) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  if (status === "PENDING") return "warning";
  return "info";
}
</script>

<style scoped>
.withdraw-approval-page :deep(.pm-surface) {
  background:
    radial-gradient(circle at top right, rgba(55, 134, 214, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(240, 248, 255, 0.9));
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-main span {
  font-size: 12px;
  color: #94a3b8;
}

.pm-icon-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.ops-hover-actions .el-button {
  transition: opacity 0.15s ease;
}

.pm-dialog-shell {
  padding: 0 4px;
}

.pm-section {
  margin-top: 20px;
}

.pm-section__head {
  margin-bottom: 12px;
}

.pm-section__head h3 {
  font-size: 14px;
  font-weight: 600;
  color: #0b0f1a;
  margin: 0;
}

.pm-section__head p {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.pm-readonly-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pm-readonly-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm-readonly-item__label {
  font-size: 11px;
  color: #94a3b8;
}

.pm-readonly-item__value {
  font-size: 13px;
  color: #0b0f1a;
}
</style>
