<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import {
  getCertPage,
  getAccountPage,
  getCertStats,
  deleteCert,
  renewCert,
  revokeCert,
  retryValidation,
  triggerRenewCheck,
  deleteAccount,
  certStatusInfo,
  accountStatusInfo,
  serverLabel,
  type AcmeCertificate,
  type AcmeAccount,
  type AcmeCertStats,
} from "../../api/acmeApi";
import ApplyCertDialog, { type AcmeHostPrefill } from "./components/ApplyCertDialog.vue";
import AccountDialog from "./components/AccountDialog.vue";
import CertDetailDialog from "./components/CertDetailDialog.vue";
import DownloadDialog from "./components/DownloadDialog.vue";

defineOptions({ name: "AcmeCertManagement" });

const route = useRoute();

// ==================== 状态 ====================

const activeTab = ref<"certs" | "accounts">("certs");

const certRows = ref<AcmeCertificate[]>([]);
const certTotal = ref(0);
const certPage = ref(1);
const certPageSize = ref(20);
const certLoading = ref(false);

const accountRows = ref<AcmeAccount[]>([]);
const accountTotal = ref(0);
const accountPage = ref(1);
const accountPageSize = ref(20);
const accountLoading = ref(false);

const stats = ref<AcmeCertStats>({
  accountCount: 0,
  certCount: 0,
  validCount: 0,
  pendingCount: 0,
  expiringCount: 0,
  expiredCount: 0,
  revokedCount: 0,
  failedCount: 0,
});

const filters = reactive({ keyword: "", status: "" });

// ==================== 弹窗 ====================

const applyVisible = ref(false);
const applyInit = ref<Partial<AcmeCertificate> | null>(null);
const hostPrefill = ref<AcmeHostPrefill | null>(null);

const accountDialogVisible = ref(false);
const currentAccount = ref<AcmeAccount | null>(null);

const detailVisible = ref(false);
const currentCertId = ref<number | null>(null);

const downloadVisible = ref(false);
const currentCert = ref<AcmeCertificate | null>(null);

const renewingId = ref<number | null>(null);
const retryingId = ref<number | null>(null);
const renewCheckLoading = ref(false);

// ==================== 数据加载 ====================

async function loadStats(): Promise<void> {
  try {
    const d = await getCertStats();
    stats.value = { ...stats.value, ...(d ?? {}) };
  } catch {
    // 统计不是主链路，单卡失败不打断列表
  }
}

async function loadCerts(): Promise<void> {
  certLoading.value = true;
  try {
    const d = await getCertPage({
      page: certPage.value,
      pageSize: certPageSize.value,
      acmeCertPrimaryDomain: filters.keyword || undefined,
      acmeCertStatus: filters.status || undefined,
    });
    certRows.value = d?.records ?? [];
    certTotal.value = Number(d?.total ?? 0);
  } catch (e) {
    message.error(`证书列表加载失败：${String((e as Error)?.message ?? e)}`);
    certRows.value = [];
    certTotal.value = 0;
  } finally {
    certLoading.value = false;
  }
}

async function loadAccounts(): Promise<void> {
  accountLoading.value = true;
  try {
    const d = await getAccountPage({
      page: accountPage.value,
      pageSize: accountPageSize.value,
    });
    accountRows.value = d?.records ?? [];
    accountTotal.value = Number(d?.total ?? 0);
  } catch (e) {
    message.error(`账户列表加载失败：${String((e as Error)?.message ?? e)}`);
    accountRows.value = [];
    accountTotal.value = 0;
  } finally {
    accountLoading.value = false;
  }
}

function refresh(): void {
  void loadStats();
  if (activeTab.value === "certs") void loadCerts();
  else void loadAccounts();
}

function searchCerts(): void {
  certPage.value = 1;
  void loadCerts();
}

function resetSearch(): void {
  filters.keyword = "";
  filters.status = "";
  certPage.value = 1;
  void loadCerts();
}

watch(activeTab, (tab) => {
  if (tab === "certs") void loadCerts();
  else void loadAccounts();
});

watch(certPage, () => void loadCerts());
watch(certPageSize, () => {
  certPage.value = 1;
  void loadCerts();
});
watch(accountPage, () => void loadAccounts());
watch(accountPageSize, () => {
  accountPage.value = 1;
  void loadAccounts();
});

onMounted(() => {
  void loadStats();
  void loadCerts();

  const q = route.query;
  const domain = String(q.domain ?? q.host ?? "");
  if (domain) {
    hostPrefill.value = {
      hostId: q.hostId ? Number(q.hostId) : undefined,
      hostName: String(q.hostName ?? ""),
      domain,
      port: q.port ? Number(q.port) : undefined,
      username: String(q.username ?? ""),
    };
    if (String(q.autoApply ?? "") === "1") {
      applyVisible.value = true;
    }
  }
});

// ==================== 操作 ====================

function openApply(row?: AcmeCertificate | null): void {
  applyInit.value = row ?? null;
  applyVisible.value = true;
}

function handleApplySuccess(): void {
  void loadStats();
  void loadCerts();
}

function viewCert(certId: number): void {
  currentCertId.value = certId;
  detailVisible.value = true;
}

function openDownload(row: AcmeCertificate): void {
  currentCert.value = row;
  downloadVisible.value = true;
}

async function confirmRenew(row: AcmeCertificate): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定续签证书「${row.acmeCertPrimaryDomain}」？`, "续签确认", { confirmButtonText: "续签", type: "warning" });
  } catch {
    return;
  }
  renewingId.value = row.acmeCertId ?? null;
  try {
    await renewCert(Number(row.acmeCertId));
    message.success("续签请求已受理");
    await loadCerts();
    await loadStats();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    renewingId.value = null;
  }
}

async function confirmRetry(row: AcmeCertificate): Promise<void> {
  retryingId.value = row.acmeCertId ?? null;
  try {
    await retryValidation(Number(row.acmeCertId));
    message.success("已重新触发验证");
    await loadCerts();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    retryingId.value = null;
  }
}

async function confirmRevoke(row: AcmeCertificate): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定吊销证书「${row.acmeCertPrimaryDomain}」？该操作不可恢复。`, "吊销确认", { confirmButtonText: "吊销", type: "error" });
  } catch {
    return;
  }
  try {
    await revokeCert(Number(row.acmeCertId));
    message.success("证书已吊销");
    await loadCerts();
    await loadStats();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

async function confirmDelete(row: AcmeCertificate): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除证书「${row.acmeCertPrimaryDomain}」？关联订单会一并删除。`, "删除确认", { confirmButtonText: "删除", type: "error" });
  } catch {
    return;
  }
  try {
    await deleteCert(Number(row.acmeCertId));
    message.success("证书已删除");
    await loadCerts();
    await loadStats();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

async function renewCheckAll(): Promise<void> {
  renewCheckLoading.value = true;
  try {
    const msg = await triggerRenewCheck();
    message.success(msg || "续签检查已触发");
    await loadCerts();
    await loadStats();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    renewCheckLoading.value = false;
  }
}

function addAccount(): void {
  currentAccount.value = null;
  accountDialogVisible.value = true;
}

function editAccount(row: AcmeAccount): void {
  currentAccount.value = { ...row };
  accountDialogVisible.value = true;
}

function handleAccountSuccess(): void {
  void loadStats();
  void loadAccounts();
}

async function confirmDeleteAccount(row: AcmeAccount): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除账户「${row.acmeAccountEmail}」？存在关联证书时后端会拒绝。`, "删除确认", { confirmButtonText: "删除", type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteAccount(Number(row.acmeAccountId));
    message.success("账户已删除");
    await loadAccounts();
    await loadStats();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

// ==================== 列定义 ====================

const certColumns = computed(() => [
  { prop: "acmeCertPrimaryDomain", label: "主域名", minWidth: 200, slot: "domain" },
  { prop: "acmeCertChallengeType", label: "验证方式", width: 120, slot: "challenge" },
  { prop: "acmeCertStatus", label: "状态", width: 120, slot: "status" },
  { prop: "acmeCertNotBefore", label: "有效起", width: 170 },
  { prop: "acmeCertNotAfter", label: "有效止", width: 170 },
  { prop: "acmeCertSan", label: "SAN", minWidth: 140 },
  { prop: "id", label: "操作", width: 300, fixed: "right", slot: "actions" },
]);

const certTableData = computed(() => certRows.value as unknown as Record<string, unknown>[]);

const accountColumns = computed(() => [
  { prop: "acmeAccountEmail", label: "邮箱", minWidth: 220 },
  { prop: "acmeAccountServer", label: "ACME 服务商", minWidth: 220, slot: "server" },
  { prop: "acmeAccountStatus", label: "状态", width: 120, slot: "status" },
  { prop: "updateTime", label: "更新时间", width: 170 },
  { prop: "acmeAccountRemark", label: "备注", minWidth: 160 },
  { prop: "op", label: "操作", width: 150, fixed: "right", slot: "ops" },
]);

const accountTableData = computed(() => accountRows.value as unknown as Record<string, unknown>[]);
</script>

<template>
  <div class="acme-page">
    <!-- hero：标题栏包成卡片 -->
    <div class="card acme-hero">
      <div class="page-header">
        <div>
          <h1 class="page-title">ACME 证书</h1>
          <p class="page-desc">账户 · 申请 · 续签 · 验证 · 吊销 · 下载</p>
        </div>
        <div class="page-actions">
          <el-button :loading="renewCheckLoading" @click="renewCheckAll">续签检查</el-button>
          <el-button @click="addAccount">添加账户</el-button>
          <el-button type="primary" @click="openApply()">申请证书</el-button>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ stats.accountCount }}</div>
        <div class="stat-label">ACME 账户</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.validCount }}</div>
        <div class="stat-label">有效证书</div>
      </div>
      <div class="stat-card">
        <div class="stat-num warn">{{ stats.expiringCount }}</div>
        <div class="stat-label">即将到期</div>
      </div>
      <div class="stat-card">
        <div class="stat-num info">{{ stats.pendingCount }}</div>
        <div class="stat-label">处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-num danger">{{ stats.expiredCount }}</div>
        <div class="stat-label">已过期</div>
      </div>
    </div>

    <!-- 页签 + 筛选 + 表格 整体包成一张卡片 -->
    <div class="card acme-main">
      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'certs' }]" @click="activeTab = 'certs'">证书管理</button>
        <button :class="['tab-btn', { active: activeTab === 'accounts' }]" @click="activeTab = 'accounts'">账户管理</button>
      </div>

      <!-- 证书 -->
      <template v-if="activeTab === 'certs'">
        <div class="filter-bar">
          <el-input v-model="filters.keyword" placeholder="主域名" clearable style="width:260px" @keyup.enter="searchCerts" @clear="searchCerts" />
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:140px" @change="searchCerts">
            <el-option label="待处理" value="pending" />
            <el-option label="验证中" value="validating" />
            <el-option label="有效" value="valid" />
            <el-option label="已过期" value="expired" />
            <el-option label="已吊销" value="revoked" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-button type="primary" @click="searchCerts">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button :loading="certLoading" circle @click="loadCerts"><el-icon><Refresh /></el-icon></el-button>
          <span class="filter-count">共 {{ certTotal }} 条</span>
        </div>

        <ReTable
          :data="certTableData"
          :columns="certColumns"
          :loading="certLoading"
          :total="certTotal"
          :page="certPage"
          :page-size="certPageSize"
          :page-sizes="[20, 50, 100]"
          server-data
          row-key="acmeCertId"
          border
          style="width:100%"
          empty-text="暂无证书"
          :toolbar="false"
          @update:page="certPage = $event"
          @update:page-size="certPageSize = $event"
        >
          <template #col-domain="{ row }">
            <b>{{ row.acmeCertPrimaryDomain }}</b>
            <div v-if="row.acmeCertSan" class="san-tip">+{{ String(row.acmeCertSan).split(",").filter(Boolean).length }} 个 SAN</div>
          </template>
          <template #col-challenge="{ row }">
            <el-tag effect="plain" :type="row.acmeCertChallengeType === 'DNS-01' ? 'success' : 'primary'">{{ row.acmeCertChallengeType }}</el-tag>
          </template>
          <template #col-status="{ row }">
            <el-tooltip v-if="row.acmeCertStatus === 'failed' && row.acmeCertLastError" :content="row.acmeCertLastError" placement="top">
              <el-tag :type="certStatusInfo(row.acmeCertStatus).type" effect="plain">{{ certStatusInfo(row.acmeCertStatus).label }}</el-tag>
            </el-tooltip>
            <el-tag v-else :type="certStatusInfo(row.acmeCertStatus).type" effect="plain">{{ certStatusInfo(row.acmeCertStatus).label }}</el-tag>
          </template>
          <template #col-actions="{ row }">
            <div class="op-cell">
              <el-button size="small" @click="viewCert(Number(row.acmeCertId))">详情</el-button>
              <el-button size="small" :loading="renewingId === row.acmeCertId" @click="confirmRenew(row as unknown as AcmeCertificate)">续签</el-button>
              <el-button v-if="row.acmeCertStatus === 'validating'" size="small" :loading="retryingId === row.acmeCertId" type="warning" plain @click="confirmRetry(row as unknown as AcmeCertificate)">重新验证</el-button>
              <el-button size="small" @click="openDownload(row as unknown as AcmeCertificate)">下载</el-button>
              <el-button size="small" type="danger" plain @click="confirmRevoke(row as unknown as AcmeCertificate)">吊销</el-button>
              <el-button size="small" type="danger" @click="confirmDelete(row as unknown as AcmeCertificate)">删除</el-button>
            </div>
          </template>
        </ReTable>
      </template>

      <!-- 账户 -->
      <template v-else>
        <div class="filter-bar">
          <el-button :loading="accountLoading" circle @click="loadAccounts"><el-icon><Refresh /></el-icon></el-button>
          <span class="filter-count">共 {{ accountTotal }} 条</span>
        </div>
        <ReTable
          :data="accountTableData"
          :columns="accountColumns"
          :loading="accountLoading"
          :total="accountTotal"
          :page="accountPage"
          :page-size="accountPageSize"
          :page-sizes="[20, 50, 100]"
          server-data
          row-key="acmeAccountId"
          border
          style="width:100%"
          empty-text="暂无账户"
          :toolbar="false"
          @update:page="accountPage = $event"
          @update:page-size="accountPageSize = $event"
        >
          <template #col-server="{ row }">{{ serverLabel(row.acmeAccountServer) }}</template>
          <template #col-status="{ row }">
            <el-tag :type="accountStatusInfo(row.acmeAccountStatus).type" effect="plain">{{ accountStatusInfo(row.acmeAccountStatus).label }}</el-tag>
          </template>
          <template #col-ops="{ row }">
            <div class="op-cell">
              <el-button size="small" @click="editAccount(row as unknown as AcmeAccount)">编辑</el-button>
              <el-button size="small" type="danger" @click="confirmDeleteAccount(row as unknown as AcmeAccount)">删除</el-button>
            </div>
          </template>
        </ReTable>
      </template>
    </div>

    <ApplyCertDialog
      v-model="applyVisible"
      :init-data="applyInit"
      :host="hostPrefill"
      @success="handleApplySuccess"
      @view-cert="viewCert"
    />
    <AccountDialog v-model="accountDialogVisible" :account="currentAccount" @success="handleAccountSuccess" />
    <CertDetailDialog v-model="detailVisible" :cert-id="currentCertId" />
    <DownloadDialog v-model="downloadVisible" :cert="currentCert" />
  </div>
</template>

<style scoped>
.acme-page {
  padding: 4px 0;
}
.acme-hero {
  margin-bottom: 16px;
}
.acme-main {
  margin-bottom: 16px;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.page-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}
.stat-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.stat-num.warn { color: var(--el-color-warning); }
.stat-num.info { color: var(--el-color-primary); }
.stat-num.danger { color: var(--el-color-danger); }
.stat-label {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  margin-bottom: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
.tab-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
}
.tab-btn.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: var(--el-box-shadow-lighter);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.san-tip {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.op-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.op-cell .el-button + .el-button {
  margin-left: 0;
}
</style>
