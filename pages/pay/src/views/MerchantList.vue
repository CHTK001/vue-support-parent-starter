<template>
  <PmPageShell page-class="merchant-page">
    <PmSurface title="商户管理">
      <template #actions>
        <el-tooltip content="新增商户">
          <ScButton type="primary" circle :icon="Plus" @click="openMerchantDialog()" />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmToolbar>
      <template #form>
        <el-form :model="queryForm" inline class="merchant-search-form">
          <el-form-item>
            <el-input v-model="queryForm.merchantName" placeholder="搜索商户名称" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <ScSelect v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="已激活" :value="1" />
              <el-option label="已停用" :value="2" />
              <el-option label="待审核" :value="0" />
            </ScSelect>
          </el-form-item>
          <el-form-item class="search-actions">
            <el-tooltip content="查询">
              <ScButton circle :icon="Search" @click="handleSearch" />
            </el-tooltip>
            <el-tooltip content="重置">
              <ScButton circle :icon="Refresh" @click="handleReset" />
            </el-tooltip>
          </el-form-item>
        </el-form>
      </template>
    </PmToolbar>

    <PmPanel title="商户列表" description="所有已注册的支付商户信息">
      <ScTable
        ref="tableRef"
        table-name="payment-merchant-list"
        :url="getMerchantList"
        :search="false"
        :hide-do="true"
        :init-params="queryForm"
      >
        <el-table-column label="编号" prop="id" width="70" />
        <el-table-column label="商户名称" min-width="140">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.merchantName }}</strong>
              <p>{{ row.merchantNo }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" prop="contactName" width="100" />
        <el-table-column label="联系电话" prop="contactPhone" width="120" />
        <el-table-column label="商户能力" min-width="160">
          <template #default="{ row }">
            <div class="capability-list">
              <el-tag v-if="row.paymentWalletEnabled" size="small">钱包</el-tag>
              <el-tag v-if="row.paymentSplitTableEnabled" size="small" type="primary">自动分表</el-tag>
              <el-tag v-if="row.paymentProfitSharingEnabled" size="small" type="success">自动分账</el-tag>
              <el-tag v-if="row.paymentCouponEnabled" size="small">优惠</el-tag>
              <span v-if="!row.paymentWalletEnabled && !row.paymentSplitTableEnabled && !row.paymentProfitSharingEnabled && !row.paymentCouponEnabled" class="pm-subtle">无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" min-width="180" align="center">
          <template #default="{ row }">
            <template v-if="row.channelTypeDetails && row.channelTypeDetails.length">
              <el-tooltip v-for="detail in row.channelTypeDetails" :key="detail" :content="resolveChannelTypeDetail(detail)">
                <span :class="['channel-icon-badge', `channel-icon-${detail.split(':')[0].toLowerCase()}`]" :style="{ marginRight: '2px' }" :title="resolveChannelTypeDetail(detail)">
                  {{ resolveChannelIcon(detail) }}
                </span>
              </el-tooltip>
              <span v-if="row.channelTypes?.length !== row.channelTypeDetails?.length" class="channel-type-summary">
                <el-tag size="small" effect="plain">{{ row.channelTypes?.length }} 类</el-tag>
              </span>
            </template>
            <span v-else-if="row.channelTypes && row.channelTypes.length">
              <el-tooltip v-for="ct in row.channelTypes" :key="ct" :content="channelTypeLabel(ct)">
                <span :class="['channel-icon-badge', `channel-icon-${ct.toLowerCase()}`]" :style="{ marginRight: '2px' }">
                  {{ channelTypeIcon(ct) }}
                </span>
              </el-tooltip>
            </span>
            <span v-else class="pm-subtle">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="merchantStatusTag(row.status)" effect="dark">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions ops-hover-actions">
            <el-tooltip content="编辑">
              <ScButton link circle type="primary" :icon="Edit" @click="openMerchantDialog(row)" />
            </el-tooltip>
            <el-tooltip content="支付方式">
              <ScButton link circle type="primary" :icon="CreditCard" @click="openChannelDrawer(row)" />
            </el-tooltip>
            <el-tooltip content="钱包">
              <ScButton link circle type="primary" :icon="Wallet" @click="navigateToWallet(row)" />
            </el-tooltip>
            <el-tooltip content="设置">
              <ScButton link circle type="primary" :icon="Setting" @click="openSettingDrawer(row)" />
            </el-tooltip>
            <el-tooltip :content="row.status === 1 ? '停用' : '启用'">
              <ScButton link circle :type="row.status === 1 ? 'warning' : 'success'" :icon="row.status === 1 ? SwitchButton : CircleCheck" @click="toggleMerchantStatus(row)" />
            </el-tooltip>
            <el-tooltip content="注销">
              <ScButton link circle type="danger" :icon="Delete" @click="removeMerchant(row)" />
            </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <MerchantFormDialog
      v-model="merchantDialogVisible"
      :merchant="editingMerchant"
      :saving="saving"
      @saved="submitMerchant"
    />

    <MerchantSettingDrawer
      v-model="settingDrawerVisible"
      :merchant="activeMerchant"
      :payment-config="paymentConfig"
      :wallet-limit="walletLimit"
      :saving="saving"
      @saved="saveMerchantSettings"
    />

    <MerchantChannelDrawer
      v-model="channelDrawerVisible"
      :merchant="activeMerchant"
      :channels="merchantChannels"
      @add-channel="openChannelDialog()"
      @edit-channel="openChannelDialog($event)"
      @toggle-channel="toggleChannelStatus"
      @delete-channel="removeChannel"
    />

    <MerchantChannelFormDialog
      v-model="channelDialogVisible"
      :merchant="activeMerchant"
      :catalog="channelCatalog"
      :channel="editingChannel"
      :existing-channels="merchantChannels"
      :saving="saving"
      @saved="submitChannel"
    />
  </PmPageShell>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { CircleCheck, CreditCard, Delete, Edit, Plus, Search, Setting, Refresh, SwitchButton, Wallet } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Merchant, MerchantChannel, MerchantPaymentConfig, MerchantWalletLimit, PaymentMethodGuide } from "../types/payment";
import {
  getMerchantList,
  createMerchant,
  updateMerchant,
  activateMerchant,
  deactivateMerchant,
  deleteMerchant,
  getMerchantPaymentConfig,
  updateMerchantPaymentConfig,
  getMerchantWalletLimit,
  updateMerchantWalletLimit,
  getChannelCatalog,
  getMerchantChannels,
  createChannel,
  updateChannel,
  enableChannel,
  disableChannel,
  deleteChannel,
} from "../api/payment";
import { merchantStatusTag, resolveChannelTypeDetail, resolveChannelIcon } from "../components/merchant/merchant";
import { ChannelTypeMap } from "../types/payment";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import MerchantFormDialog from "../components/merchant/MerchantFormDialog.vue";
import MerchantSettingDrawer from "../components/merchant/MerchantSettingDrawer.vue";
import MerchantChannelDrawer from "../components/merchant/MerchantChannelDrawer.vue";
import MerchantChannelFormDialog from "../components/merchant/MerchantChannelFormDialog.vue";

/* ── State ── */

const queryForm = reactive({ merchantName: "", status: undefined as number | undefined });
const tableRef = ref<InstanceType<typeof ScTable> | null>(null);
const saving = ref(false);
const router = useRouter();

// Dialog / drawer visibility
const merchantDialogVisible = ref(false);
const settingDrawerVisible = ref(false);
const channelDrawerVisible = ref(false);
const channelDialogVisible = ref(false);

// Editing / active references
const editingMerchant = ref<Merchant | null>(null);
const activeMerchant = ref<Merchant | null>(null);
const paymentConfig = ref<MerchantPaymentConfig | null>(null);
const walletLimit = ref<MerchantWalletLimit | null>(null);
const merchantChannels = ref<MerchantChannel[]>([]);
const channelCatalog = ref<PaymentMethodGuide[]>([]);
const editingChannel = ref<MerchantChannel | null>(null);

/* ── Helpers ── */

function statusLabel(status?: number) {
  if (status === 1) return "已激活";
  if (status === 2) return "已停用";
  if (status === 0) return "待审核";
  return "-";
}

const ChannelIconMap: Record<string, string> = {
  WECHAT: "微",
  ALIPAY: "支",
  EPAY: "易",
  WALLET: "钱",
};

const ChannelColorMap: Record<string, string> = {
  WECHAT: "#07c160",
  ALIPAY: "#1677ff",
  EPAY: "#f59e0b",
  WALLET: "#8b5cf6",
};

function channelTypeLabel(channelType?: string) {
  if (!channelType) return "";
  return ChannelTypeMap[channelType] || channelType;
}

function channelTypeIcon(channelType?: string) {
  if (!channelType) return "";
  return ChannelIconMap[channelType] || channelType.charAt(0);
}

/* ── Refresh ── */

async function refreshAll() {
  tableRef.value?.reload();
}

/* ── Search ── */

function handleSearch() {
  tableRef.value?.reload();
}

function handleReset() {
  queryForm.merchantName = "";
  queryForm.status = undefined;
  tableRef.value?.reload();
}

/* ── Merchant CRUD ── */

function openMerchantDialog(row?: Merchant) {
  editingMerchant.value = row || null;
  merchantDialogVisible.value = true;
}

async function submitMerchant(formData: Record<string, unknown>) {
  saving.value = true;
  try {
    if (formData.id) {
      await updateMerchant(formData.id as number, formData);
      ElMessage.success("商户已更新");
    } else {
      await createMerchant(formData);
      ElMessage.success("商户已创建");
    }
    merchantDialogVisible.value = false;
    refreshAll();
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false;
  }
}

async function toggleMerchantStatus(row: Merchant) {
  try {
    if (row.status === 1) {
      await deactivateMerchant(row.id);
      ElMessage.success("商户已停用");
    } else {
      await activateMerchant(row.id);
      ElMessage.success("商户已启用");
    }
    refreshAll();
  } catch {
    // error handled by interceptor
  }
}

async function removeMerchant(row: Merchant) {
  try {
    await ElMessageBox.confirm(`确认注销商户「${row.merchantName}」？注销后商户将停用，数据保留。`, "注销确认", { type: "warning" });
    await deactivateMerchant(row.id);
    ElMessage.success("商户已注销");
    refreshAll();
  } catch {
    // cancelled or error
  }
}

/* ── Wallet Management ── */

function navigateToWallet(row: Merchant) {
  router.push(`/wallet-console?merchantId=${row.id}`);
}

/* ── Merchant Settings ── */

async function openSettingDrawer(row: Merchant) {
  activeMerchant.value = row;
  try {
    const [configRes, walletRes] = await Promise.all([
      getMerchantPaymentConfig(row.id),
      getMerchantWalletLimit(row.id),
    ]);
    paymentConfig.value = configRes.data;
    walletLimit.value = walletRes.data;
    settingDrawerVisible.value = true;
  } catch {
    // error handled by interceptor
  }
}

async function saveMerchantSettings(
  formData: Record<string, unknown>,
  paymentConfigData: MerchantPaymentConfig,
  walletLimitData: MerchantWalletLimit,
) {
  if (!activeMerchant.value) return;
  saving.value = true;
  try {
    const mid = activeMerchant.value.id;
    await Promise.all([
      updateMerchant(mid, formData),
      updateMerchantPaymentConfig(mid, paymentConfigData),
      updateMerchantWalletLimit(mid, walletLimitData),
    ]);
    ElMessage.success("设置已保存");
    settingDrawerVisible.value = false;
    refreshAll();
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false;
  }
}

/* ── Channel Management ── */

async function ensureChannelCatalog() {
  if (channelCatalog.value.length) return;
  try {
    const res = await getChannelCatalog();
    channelCatalog.value = res.data || [];
  } catch {
    // error handled by interceptor
  }
}

async function openChannelDrawer(row: Merchant) {
  activeMerchant.value = row;
  try {
    await ensureChannelCatalog();
    const res = await getMerchantChannels(row.id);
    merchantChannels.value = res.data || [];
    channelDrawerVisible.value = true;
  } catch {
    // error handled by interceptor
  }
}

function openChannelDialog(row?: MerchantChannel) {
  editingChannel.value = row || null;
  channelDialogVisible.value = true;
}

async function submitChannel(formData: Record<string, unknown>, extConfig: string) {
  if (!activeMerchant.value) return;
  saving.value = true;
  try {
    const payload = {
      ...formData,
      merchantId: activeMerchant.value.id,
      extConfig: extConfig === "{}" ? "" : extConfig,
    };
    if (payload.id) {
      await updateChannel(payload.id as number, payload);
      ElMessage.success("支付方式已更新");
    } else {
      await createChannel(payload);
      ElMessage.success("支付方式已创建");
    }
    channelDialogVisible.value = false;
    // Refresh channels so the drawer shows updated list
    const res = await getMerchantChannels(activeMerchant.value.id);
    merchantChannels.value = res.data || [];
    refreshAll();
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false;
  }
}

async function toggleChannelStatus(row: MerchantChannel) {
  try {
    if (row.status === 1) {
      await disableChannel(row.id);
    } else {
      await enableChannel(row.id);
    }
    const res = await getMerchantChannels(row.merchantId);
    merchantChannels.value = res.data || [];
  } catch {
    // error handled by interceptor
  }
}

async function removeChannel(row: MerchantChannel) {
  try {
    await ElMessageBox.confirm("确认删除此支付方式？此操作不可撤销。", "删除确认", { type: "warning" });
    await deleteChannel(row.id);
    const res = await getMerchantChannels(row.merchantId);
    merchantChannels.value = res.data || [];
    refreshAll();
  } catch {
    // cancelled or error
  }
}

/* ── Lifecycle ── */

onMounted(() => {
  tableRef.value?.reload();
});
</script>

<style scoped>

.cell-main strong {
  display: block;
  color: #0f172a;
}

.cell-main p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ops-hover-actions .el-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.el-table__row:hover .ops-hover-actions .el-button {
  opacity: 1;
}

/* 搜索表单 - 紧凑居中 */
.merchant-page :deep(.pm-toolbar) {
  padding: 0;
  min-height: unset;
}
.merchant-page :deep(.pm-toolbar__row) {
  min-height: 44px;
  padding: 6px 0;
  gap: 0;
  row-gap: 0;
}
.merchant-page :deep(.pm-toolbar__form) {
  width: 100%;
  display: flex;
  align-items: center;
}
.merchant-search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  width: 100%;
}
.merchant-search-form .search-actions {
  margin-left: auto !important;
}
.merchant-search-form .search-actions :deep(.el-form-item__content) {
  display: flex;
  gap: 4px;
}
.merchant-search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

/* 支付方式图标 */
.channel-icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  cursor: default;
  vertical-align: middle;
}
.channel-icon-wechat { background: #07c160; }
.channel-icon-alipay  { background: #1677ff; }
.channel-icon-epay    { background: #f59e0b; }
.channel-icon-wallet  { background: #8b5cf6; }

.channel-type-summary {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 4px;
}
</style>
