<template>
  <PmPageShell page-class="merchant-page">
    <PmSurface title="商户管理" description="管理支付商户及其支付方式配置。">
      <template #actions>
        <ScButton type="primary" :icon="Plus" @click="openMerchantDialog()">新增商户</ScButton>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="总商户数" hint="当前已注册的支付商户总数">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="已启用" hint="当前状态为已激活的商户">
        <template #value>{{ stats.active }}</template>
      </PmStatCard>
      <PmStatCard label="已配置支付方式" hint="至少配置了一个支付方式的商户">
        <template #value>{{ stats.configured }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <el-form :model="queryForm" inline>
          <el-form-item label="商户名称">
            <el-input v-model="queryForm.merchantName" placeholder="搜索商户名称" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <ScSelect v-model="queryForm.status" placeholder="全部状态" clearable>
              <el-option label="已激活" :value="1" />
              <el-option label="已停用" :value="2" />
              <el-option label="待审核" :value="0" />
            </ScSelect>
          </el-form-item>
          <el-form-item>
            <ScButton @click="handleSearch">查询</ScButton>
            <ScButton @click="handleReset">重置</ScButton>
          </el-form-item>
        </el-form>
      </template>
    </PmToolbar>

    <PmPanel title="商户列表" description="所有已注册的支付商户信息">
      <ScTable
        ref="tableRef"
        table-name="payment-merchant-list"
        :request-api="getMerchantList"
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
              <el-tag v-if="row.paymentAutoCloseEnabled" size="small" type="warning">自动关单</el-tag>
              <el-tag v-if="row.paymentSplitTableEnabled" size="small" type="primary">自动分表</el-tag>
              <el-tag v-if="row.paymentProfitSharingEnabled" size="small" type="success">自动分账</el-tag>
              <el-tag v-if="row.paymentCouponEnabled" size="small">优惠</el-tag>
              <span v-if="!row.paymentWalletEnabled && !row.paymentAutoCloseEnabled && !row.paymentSplitTableEnabled && !row.paymentProfitSharingEnabled && !row.paymentCouponEnabled" class="pm-subtle">无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" prop="channelCount" width="80" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="merchantStatusTag(row.status)" effect="dark">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <ScButton link type="primary" @click="openMerchantDialog(row)">编辑</ScButton>
            <ScButton link type="primary" @click="openChannelDrawer(row)">支付方式</ScButton>
            <ScButton link type="primary" @click="openSettingDrawer(row)">设置</ScButton>
            <ScButton link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleMerchantStatus(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </ScButton>
            <ScButton link type="danger" @click="removeMerchant(row)">删除</ScButton>
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
      :saving="saving"
      @saved="submitChannel"
    />
  </PmPageShell>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { Plus } from "@element-plus/icons-vue";
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
import { merchantStatusTag } from "../components/merchant/merchant";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import MerchantFormDialog from "../components/merchant/MerchantFormDialog.vue";
import MerchantSettingDrawer from "../components/merchant/MerchantSettingDrawer.vue";
import MerchantChannelDrawer from "../components/merchant/MerchantChannelDrawer.vue";
import MerchantChannelFormDialog from "../components/merchant/MerchantChannelFormDialog.vue";

/* ── State ── */

const queryForm = reactive({ merchantName: "", status: undefined as number | undefined });
const tableRef = ref<InstanceType<typeof ScTable> | null>(null);
const stats = reactive({ total: 0, active: 0, configured: 0 });
const saving = ref(false);

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

/* ── Stats ── */

async function loadStats() {
  try {
    const res = await getMerchantList({ page: 1, size: 200 });
    const list = res.data?.records || [];
    stats.total = list.length;
    stats.active = list.filter((m) => m.status === 1).length;
    stats.configured = list.filter((m) => m.channelCount && m.channelCount > 0).length;
  } catch {
    // stats remain at current values
  }
}

async function refreshAll() {
  await loadStats();
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
    await ElMessageBox.confirm(`确认删除商户「${row.merchantName}」？此操作不可撤销。`, "删除确认", { type: "warning" });
    await deleteMerchant(row.id);
    ElMessage.success("商户已删除");
    refreshAll();
  } catch {
    // cancelled or error
  }
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
  loadStats();
});
</script>

<style scoped>
.merchant-page {
  --page-gradient: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

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
</style>
