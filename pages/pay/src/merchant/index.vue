<template>
  <PmPageShell page-class="merchant-page">
    <PmSurface title="商户管理" description="管理商户信息，支持新增、编辑、删除和开关设置。">
      <template #actions>
        <ScButton :icon="Refresh" @click="handleRefresh">刷新</ScButton>
        <ScButton type="primary" :icon="Plus" @click="handleOpen('add', {})">新增商户</ScButton>
      </template>
    </PmSurface>

    <PmToolbar>
      <template #form>
        <ScInput v-model="form.payMerchantName" placeholder="商户名称" clearable @keyup.enter="handleRefresh" style="width: 220px" />
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleRefresh">查询</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="商户列表">
      <ScTable
        ref="tableRef"
        layout="card"
        :col-size="3"
        :row-size="2"
        :url="fetchPageMerchant"
        :params="form"
        class="merchant-table"
        @data-loaded="handleDataLoaded"
      >
        <template #default="{ row }">
          <ScCard shadow="hover" class="w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <iconifyIconOnline icon="ri:store-2-fill" />
                  <ScTag effect="plain">{{ row.payMerchantName }}</ScTag>
                  <el-text type="info">#{{ row.payMerchantCode }}</el-text>
                </div>
                <div class="pm-icon-actions ops-hover-actions flex items-center gap-2">
                  <ScSwitch v-model="row.payMerchantStatus" :active-value="1" :inactive-value="0" layout="modern" @change="() => onToggle(row)" />
                  <el-tooltip content="设置">
                    <ScButton circle :icon="Setting" size="small" @click.stop="handleSetting(row)" />
                  </el-tooltip>
                  <el-tooltip content="编辑">
                    <ScButton circle :icon="Edit" size="small" @click.stop="handleOpen('edit', row)" />
                  </el-tooltip>
                  <ScPopconfirm title="确认删除该商户？" @confirm="onDelete(row)">
                    <template #reference>
                      <ScButton circle :icon="Delete" size="small" type="danger" @click.stop />
                    </template>
                  </ScPopconfirm>
                </div>
              </div>
            </template>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <el-text>钱包</el-text>
                  <ScSwitch v-model="row.payMerchantOpenWallet" :active-value="1" :inactive-value="0" layout="modern" @change="() => onToggle(row)" />
                </div>
                <div class="flex items-center gap-2">
                  <el-text>订单超时</el-text>
                  <ScSwitch v-model="row.payMerchantOpenTimeout" :active-value="1" :inactive-value="0" layout="modern" @change="() => onToggle(row)" />
                  <template v-if="row.payMerchantOpenTimeout === 1">
                    <ScInputNumber v-model="row.payMerchantOpenTimeoutTime" :min="1" :max="1440" size="small" @change="() => onToggle(row)" />
                    <ScTag effect="plain">min</ScTag>
                  </template>
                </div>
              </div>
              <el-text type="info">创建时间：{{ row.createTime || "-" }}</el-text>
            </div>
          </ScCard>
        </template>
      </ScTable>
    </PmPanel>

    <SaveDialog ref="saveDialogRef" @success="handleRefresh" />
    <SettingDialog ref="settingDialogRef" @updated="handleRefresh" />
  </PmPageShell>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, reactive, ref, defineExpose, watch } from "vue";
import { Delete, Edit, Plus, Refresh, Search, Setting } from "@element-plus/icons-vue";
import { fetchPageMerchant, fetchDeleteMerchant, fetchUpdateMerchant } from "../api/merchant";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { ScForm } from "@repo/components/ScForm";
import { ScFormItem } from "@repo/components/ScFormItem";
import { ScInput } from "@repo/components/ScInput";
import { ScButton } from "@repo/components/ScButton";
import ScTable from "@repo/components/ScTable/index.vue";
import { ScCard } from "@repo/components/ScCard";
import { ScTag } from "@repo/components/ScTag";
import { ScPopconfirm } from "@repo/components/ScPopconfirm";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";

const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const SettingDialog = defineAsyncComponent(() => import("./setting.vue"));

const tableRef = ref();
const saveDialogRef = ref();
const settingDialogRef = ref();
const total = ref(0);

const form = reactive<any>({});

const handleDataLoaded = (data: any, _total: number) => {
  total.value = _total;
};

const handleOpen = (type: "add" | "edit", row: any) => {
  nextTick(() => {
    saveDialogRef.value?.handleOpen(type, row);
  });
};

const handleSetting = (row: any) => {
  nextTick(() => {
    settingDialogRef.value?.open(row);
  });
};

const handleRefresh = () => {
  tableRef.value?.reload(form);
};

const onToggle = (row: any) => {
  fetchUpdateMerchant({
    payMerchantId: row.payMerchantId,
    payMerchantStatus: row.payMerchantStatus,
    payMerchantOpenWallet: row.payMerchantOpenWallet,
    payMerchantOpenTimeout: row.payMerchantOpenTimeout,
    payMerchantOpenTimeoutTime: row.payMerchantOpenTimeoutTime,
  }).then(() => handleRefresh());
};

const onDelete = (row: any) => {
  fetchDeleteMerchant(row).then(() => handleRefresh());
};

defineExpose({ handleRefresh });

watch(form, () => {}, { deep: true });
</script>

<style scoped>
.merchant-table {
  --el-table-row-hover-bg-color: var(--el-fill-color-lighter);
}
.merchant-table :deep(.el-card) {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
  overflow: hidden;
}
.merchant-table :deep(.el-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}
.merchant-table :deep(.el-card__header) {
  padding: 16px 20px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.merchant-table :deep(.el-card__body) {
  padding: 20px;
}
.ops-hover-actions .el-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.el-table__row:hover .ops-hover-actions .el-button {
  opacity: 1;
}
</style>
