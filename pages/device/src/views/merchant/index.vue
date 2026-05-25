<template>
  <div class="merchant-page">
    <!-- ─── Header ────────────────────────────────────────── -->
    <div class="merchant-header">
      <div class="header-left">
        <div class="header-icon">
          <IconifyIconOnline icon="ri:key-2-line" />
        </div>
        <div>
          <div class="header-title">设备商户管理</div>
          <div class="header-subtitle">维护安防平台密钥配置，支持多选批量管理设备</div>
        </div>
      </div>
      <div class="header-right">
        <ScForm :inline="true" :model="form">
          <ScFormItem>
            <ScInput
              v-model="form.sysProjectName"
              placeholder="搜索商户名称"
              clearable
              @keyup.enter="handleRefresh"
            >
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </ScInput>
          </ScFormItem>
          <ScFormItem>
            <ScSelect
              v-model="form.sysProjectVender"
              :data="vendorOptions"
              clearable
              filterable
              placeholder="全部厂商"
              style="width: 140px"
            />
          </ScFormItem>
          <ScFormItem>
            <ScButton @click="handleRefresh" circle>
              <IconifyIconOnline icon="ep:refresh" />
            </ScButton>
            <ScButton type="primary" @click="handleOpen('add', {})">
              <IconifyIconOnline icon="ep:plus" />
              新增商户
            </ScButton>
          </ScFormItem>
        </ScForm>
      </div>
    </div>

    <!-- ─── Action bar (visible when merchants exist) ────── -->
    <div class="action-bar" v-if="totalCount > 0">
      <div class="action-bar-left">
        <ElCheckbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="handleToggleAll"
        >
          全选
        </ElCheckbox>
        <span class="selection-count" v-if="selectedIds.size > 0">
          已选 <strong>{{ selectedIds.size }}</strong> 个商户
        </span>
      </div>
      <div class="action-bar-right">
        <ScButton
          type="primary"
          :disabled="selectedIds.size === 0"
          @click="handleGoDevices"
        >
          <IconifyIconOnline icon="mingcute:computer-camera-fill" />
          管理设备{{ selectedIds.size > 0 ? ` (${selectedIds.size})` : '' }}
        </ScButton>
      </div>
    </div>

    <!-- ─── Card grid ────────────────────────────────────── -->
    <ScTable
      ref="tableRef"
      layout="card"
      :col-size="3"
      :row-size="2"
      :url="fetchPageDeviceMerchant"
      :params="form"
      class="merchant-table"
      @data-loaded="onDataLoaded"
    >
      <template #default="{ row }">
        <div
          class="key-card"
          :class="{
            'is-selected': selectedIds.has(row.sysProjectId),
            'is-disabled': row.sysProjectStatus === 0,
            [`vendor-${getVendorType(row)}`]: true,
          }"
          @click="handleCardClick(row)"
        >
          <!-- Hover delete button -->
          <ElButton
            size="small"
            circle
            type="danger"
            class="card-delete-btn"
            @click.stop="handleDelete(row)"
          >
            <IconifyIconOffline icon="ep:delete" />
          </ElButton>

          <!-- Checkbox -->
          <div class="card-checkbox" @click.stop>
            <ElCheckbox
              :model-value="selectedIds.has(row.sysProjectId)"
              @change="() => toggleSelect(row)"
            />
          </div>

          <!-- Header -->
          <div class="card-header">
            <div class="card-icon" :class="`icon-${getVendorType(row)}`">
              <IconifyIconOnline :icon="getVendorIcon(row)" />
            </div>
            <div class="card-info">
              <div class="card-name">{{ row.sysProjectName || '未命名商户' }}</div>
              <div class="card-version">
                <ElTag
                  :type="getVendorTagType(row)"
                  size="small"
                  effect="plain"
                  class="vendor-tag"
                >
                  {{ row.sysProjectDictItemLabel || '未知厂商' }}
                </ElTag>
              </div>
            </div>
            <div class="card-status-tags">
              <ElTag
                v-if="row.sysProjectStatus === 1"
                size="small"
                type="success"
              >启用</ElTag>
              <ElTag v-else size="small" type="info">禁用</ElTag>
              <span
                class="status-dot"
                :class="row.sysProjectStatus === 1 ? 'dot-running' : 'dot-stopped'"
              />
            </div>
          </div>

          <!-- Body -->
          <div class="card-body">
            <div class="meta-item">
              <IconifyIconOnline icon="ep:link" />
              <span class="meta-text">{{ row.sysProjectApiAddress || row.sysProjectEndpoint || '-' }}</span>
            </div>
            <div class="meta-item">
              <IconifyIconOnline icon="ep:key" />
              <span class="meta-text">{{ row.sysProjectAppId || '-' }}</span>
            </div>
            <div class="meta-item" v-if="row.sysProjectCode">
              <IconifyIconOnline icon="ep:document" />
              <span class="meta-text">{{ row.sysProjectCode }}</span>
            </div>
          </div>

          <!-- Actions (hover reveal) -->
          <div class="card-actions">
            <ElTooltip content="设备管理" placement="top">
              <ElButton size="small" type="primary" circle @click.stop="handleGoSingle(row)">
                <IconifyIconOnline icon="mingcute:computer-camera-fill" />
              </ElButton>
            </ElTooltip>
            <ElTooltip content="测试连接" placement="top">
              <ElButton size="small" circle @click.stop="handleTestConnection(row)">
                <IconifyIconOnline icon="ri:pulse-line" />
              </ElButton>
            </ElTooltip>
            <ElTooltip content="编辑" placement="top">
              <ElButton size="small" circle @click.stop="handleOpen('edit', row)">
                <IconifyIconOnline icon="ep:edit" />
              </ElButton>
            </ElTooltip>
            <ElTooltip content="删除" placement="top">
              <ElButton size="small" type="danger" circle plain @click.stop="handleDelete(row)">
                <IconifyIconOnline icon="ep:delete" />
              </ElButton>
            </ElTooltip>
          </div>
        </div>
      </template>
    </ScTable>

    <SaveDialog ref="saveDialogRef" @success="handleRefresh" />
  </div>
</template>

<script setup lang="ts">
import { fetchListDictItem, router } from "@repo/core";
import { message } from "@repo/utils";
import { ElButton, ElCheckbox, ElMessageBox, ElTag, ElTooltip } from "element-plus";
import { defineAsyncComponent, onMounted, reactive, ref, computed } from "vue";
import {
  fetchDeleteDeviceMerchant,
  fetchPageDeviceMerchant,
  fetchTestDeviceMerchantConnection,
  fetchUpdateDeviceMerchant,
} from "../../api/manage/device-merchant";

const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const tableRef = ref();
const saveDialogRef = ref();
const vendorOptions = ref([]);
const selectedIds = ref<Set<number>>(new Set());
const totalCount = ref(0);
const allRows = ref<any[]>([]);

const form = reactive<any>({
  sysProjectName: "",
  sysProjectVender: null,
});

// ─── Vendor helpers ─────────────────────────────────────

const getVendorType = (row: any): string => {
  const label = (row.sysProjectDictItemLabel || "").toLowerCase();
  if (label.includes("云眸") || label.includes("yun_mou")) return "hik-yunmou";
  if (label.includes("云耀") || label.includes("云曜") || label.includes("yun_yao")) return "hik-yunyao";
  if (label.includes("海康") || label.includes("hikvision") || label.includes("isecure") || label.includes("hai_kang")) return "hik-isecure";
  if (label.includes("大华") || label.includes("dahua") || label.includes("da_hua")) return "dahua";
  if (label.includes("宇视") || label.includes("uniview") || label.includes("yu_shi")) return "uniview";
  if (label.includes("华为") || label.includes("huawei") || label.includes("hua_wei")) return "huawei";
  return "default";
};

const getVendorIcon = (row: any): string => {
  const type = getVendorType(row);
  const iconMap: Record<string, string> = {
    "hik-yunmou": "mdi:cloud-outline",
    "hik-yunyao": "mdi:sun-wireless-outline",
    "hik-isecure": "mdi:shield-lock-outline",
    "dahua": "mdi:cctv",
    "uniview": "mdi:eye-outline",
    "huawei": "mdi:cellphone-link",
    "default": "mdi:key-chain-variant",
  };
  return iconMap[type] || iconMap.default;
};

const getVendorTagType = (row: any): string => {
  const type = getVendorType(row);
  if (type.startsWith("hik-")) return "primary";
  if (type === "dahua") return "warning";
  if (type === "uniview") return "success";
  if (type === "huawei") return "danger";
  return "info";
};

// ─── Selection ──────────────────────────────────────────

const isAllSelected = computed(() => {
  return allRows.value.length > 0 && allRows.value.every((r) => selectedIds.value.has(r.sysProjectId));
});

const isIndeterminate = computed(() => {
  const count = allRows.value.filter((r) => selectedIds.value.has(r.sysProjectId)).length;
  return count > 0 && count < allRows.value.length;
});

const toggleSelect = (row: any) => {
  const s = new Set(selectedIds.value);
  if (s.has(row.sysProjectId)) {
    s.delete(row.sysProjectId);
  } else {
    s.add(row.sysProjectId);
  }
  selectedIds.value = s;
};

const handleToggleAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(allRows.value.map((r) => r.sysProjectId));
  }
};

const handleCardClick = (row: any) => {
  toggleSelect(row);
};

const onDataLoaded = (data: any) => {
  if (data?.records) {
    allRows.value = data.records;
    totalCount.value = data.total || data.records.length;
  }
};

// ─── Actions ────────────────────────────────────────────

const handleRefresh = () => {
  tableRef.value?.reload(form);
};

const handleOpen = (type: "add" | "edit", row: any) => {
  saveDialogRef.value?.handleOpen(type, row);
};

const handleGoDevices = () => {
  const ids = [...selectedIds.value];
  const names = allRows.value
    .filter((r) => selectedIds.value.has(r.sysProjectId))
    .map((r) => r.sysProjectName);
  router.push({
    path: "/device/manage",
    query: {
      sysProjectId: ids.join(","),
      sysProjectName: names.join(","),
    },
  });
};

const handleGoSingle = (row: any) => {
  router.push({
    path: "/device/manage",
    query: {
      sysProjectId: String(row.sysProjectId),
      sysProjectName: row.sysProjectName,
    },
  });
};

const handleTestConnection = async (row: any) => {
  const res = await fetchTestDeviceMerchantConnection({
    sysProjectId: row.sysProjectId,
  });
  if (res.code === "00000") {
    message("连接成功", { type: "success" });
    return;
  }
  message(res.msg || "连接失败", { type: "error" });
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认删除商户 "${row.sysProjectName}"？此操作不可撤销。`,
      "确认删除",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" },
    );
    await fetchDeleteDeviceMerchant({ sysProjectId: row.sysProjectId });
    message("删除成功", { type: "success" });
    selectedIds.value.delete(row.sysProjectId);
    handleRefresh();
  } catch {
    /* cancelled */
  }
};

onMounted(async () => {
  const res = await fetchListDictItem({ sysDictId: 1 });
  vendorOptions.value =
    res?.data?.map((item) => ({
      label: item.sysDictItemName,
      value: item.sysDictItemId,
    })) || [];
});
</script>

<style scoped lang="scss">
/* ─── Page ──────────────────────────────────────────────── */

.merchant-page {
  padding: 24px;
  min-height: 100%;
}

/* ─── Header ────────────────────────────────────────────── */

.merchant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 20px 24px;
  background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 45%),
    linear-gradient(135deg, #f8fbff 0%, #f5f9ff 55%, #fff7ed 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 18px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.header-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 22px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.12);
}
.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}
.header-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

/* ─── Action bar ────────────────────────────────────────── */

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}
.action-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.selection-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  strong {
    color: var(--el-color-primary);
  }
}

/* ─── Key card ──────────────────────────────────────────── */

.key-card {
  position: relative;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  padding: 18px 20px 14px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  overflow: visible;
  user-select: none;
}

/* Left accent border */
.key-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  transition: all 0.4s ease;
}

/* Vendor color variants */
.key-card.vendor-hik-yunmou::before { background: linear-gradient(180deg, #3b82f6, #60a5fa); }
.key-card.vendor-hik-yunyao::before { background: linear-gradient(180deg, #6366f1, #818cf8); }
.key-card.vendor-hik-isecure::before { background: linear-gradient(180deg, #2563eb, #3b82f6); }
.key-card.vendor-dahua::before { background: linear-gradient(180deg, #f59e0b, #fbbf24); }
.key-card.vendor-uniview::before { background: linear-gradient(180deg, #10b981, #34d399); }
.key-card.vendor-huawei::before { background: linear-gradient(180deg, #ef4444, #f87171); }
.key-card.vendor-default::before { background: linear-gradient(180deg, #64748b, #94a3b8); }

.key-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
}
.key-card:hover::before {
  top: 0;
  bottom: 0;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

.key-card.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
.key-card.is-selected::before {
  top: 0;
  bottom: 0;
  width: 4px;
}

.key-card.is-disabled {
  opacity: 0.55;
}

/* ─── Hover delete ──────────────────────────────────────── */

.card-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.key-card:hover .card-delete-btn {
  opacity: 1;
  transform: scale(1);
}

/* ─── Checkbox ──────────────────────────────────────────── */

.card-checkbox {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 5;
}

/* ─── Header ────────────────────────────────────────────── */

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 24px;
}
.card-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 20px;
  transition: all 0.3s ease;
}
.card-icon.icon-hik-yunmou { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.card-icon.icon-hik-yunyao { color: #6366f1; background: rgba(99, 102, 241, 0.1); }
.card-icon.icon-hik-isecure { color: #2563eb; background: rgba(37, 99, 235, 0.1); }
.card-icon.icon-dahua { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.card-icon.icon-uniview { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.card-icon.icon-huawei { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.card-icon.icon-default { color: #64748b; background: rgba(100, 116, 139, 0.1); }

.card-info {
  flex: 1;
  min-width: 0;
}
.card-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--el-text-color-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vendor-tag {
  margin-top: 2px;
}

.card-status-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ─── Status dot ────────────────────────────────────────── */

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.dot-running {
  background: var(--el-color-success);
  box-shadow: 0 0 6px var(--el-color-success);
  animation: pulse-dot 2s ease-in-out infinite;
}
.dot-stopped {
  background: var(--el-color-info);
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 4px var(--el-color-success); }
  50% { box-shadow: 0 0 10px var(--el-color-success); }
}

/* ─── Body ──────────────────────────────────────────────── */

.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 24px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Actions (hover reveal) ────────────────────────────── */

.card-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transform: translateY(6px) scale(0.97);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}
.key-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* ─── Entrance animation ────────────────────────────────── */

.key-card {
  animation: cardSlideIn 0.4s ease-out both;
}
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── Dark mode ─────────────────────────────────────────── */

html.dark .merchant-header {
  background: radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 45%),
    linear-gradient(135deg, #1e1e2e 0%, #1a1a2e 55%, #1e1e2e 100%);
}
html.dark .key-card {
  background: var(--el-bg-color-overlay, #1e1e2e);
}

/* ─── Responsive ────────────────────────────────────────── */

@media (width <= 768px) {
  .merchant-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
