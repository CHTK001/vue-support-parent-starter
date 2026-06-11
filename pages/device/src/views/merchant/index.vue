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
          <div class="header-subtitle">密钥、厂商、设备同步入口集中管理</div>
        </div>
      </div>
      <div class="header-metrics">
        <div class="header-metric">
          <span>商户</span>
          <strong>{{ totalCount }}</strong>
        </div>
        <div class="header-metric">
          <span>启用</span>
          <strong>{{ enabledCount }}</strong>
        </div>
        <div class="header-metric">
          <span>厂商</span>
          <strong>{{ vendorCount }}</strong>
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
              :options="vendorOptions"
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
    <div v-loading="loading" class="merchant-grid">
      <template v-if="allRows.length > 0">
        <div
          v-for="row in allRows"
          :key="row.sysProjectId"
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
                  {{ getVendorMeta(row).label }}
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
      <ElEmpty v-else class="merchant-empty" description="暂无设备商户" />
    </div>

    <div v-if="totalCount > pageSize" class="merchant-pager">
      <ElButton :disabled="page <= 1 || loading" @click="handlePageChange(page - 1)">
        上一页
      </ElButton>
      <span>{{ page }} / {{ totalPages }}</span>
      <ElButton :disabled="page >= totalPages || loading" @click="handlePageChange(page + 1)">
        下一页
      </ElButton>
    </div>

    <SaveDialog
      v-if="saveDialogMounted"
      ref="saveDialogRef"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { router } from "@repo/core";
import { message } from "@repo/utils";
import { ElButton, ElCheckbox, ElEmpty, ElMessageBox, ElTag, ElTooltip } from "element-plus";
import { computed, defineAsyncComponent, nextTick, onMounted, reactive, ref } from "vue";
import {
  fetchDeleteDeviceMerchant,
  fetchPageDeviceMerchant,
  fetchTestDeviceMerchantConnection,
} from "../../api/manage/device-merchant";
import {
  getDeviceVendorMeta,
  getDeviceVendorOptions,
  resolveDeviceVendorCode,
} from "../../constants/device-vendors";

const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = ref();
const saveDialogMounted = ref(false);
const selectedIds = ref<Set<number>>(new Set());
const totalCount = ref(0);
const allRows = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(6);
const vendorOptions = getDeviceVendorOptions();

const form = reactive<any>({
  sysProjectName: "",
  sysProjectVender: null,
});

const getVendorMeta = (row: any) =>
  getDeviceVendorMeta(
    row?.sysProjectVender || row?.sysProjectDictItemCode || row?.sysProjectDictItemLabel,
  );

const getVendorType = (row: any): string => getVendorMeta(row).family;

const getVendorIcon = (row: any): string => getVendorMeta(row).icon;

const getVendorTagType = (row: any): string => getVendorMeta(row).tone;

const getVendorCode = (row: any): string =>
  resolveDeviceVendorCode(
    row?.sysProjectVender || row?.sysProjectDictItemCode || row?.sysProjectDictItemId,
  );

// ─── Selection ──────────────────────────────────────────

const isAllSelected = computed(() => {
  return allRows.value.length > 0 && allRows.value.every((r) => selectedIds.value.has(r.sysProjectId));
});

const isIndeterminate = computed(() => {
  const count = allRows.value.filter((r) => selectedIds.value.has(r.sysProjectId)).length;
  return count > 0 && count < allRows.value.length;
});

const enabledCount = computed(() => allRows.value.filter((row) => row.sysProjectStatus === 1).length);
const vendorCount = computed(
  () =>
    new Set(
      allRows.value.map((row) => getVendorCode(row)).filter(Boolean),
    ).size,
);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value)),
);

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

const normalizePageData = (payload: any) => {
  const data = payload?.data ?? payload ?? {};
  const records = Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
  return {
    records,
    total: Number(data.total ?? data.recordsTotal ?? records.length),
  };
};

const pruneSelection = () => {
  const visibleIds = new Set(allRows.value.map((row) => row.sysProjectId));
  selectedIds.value = new Set(
    [...selectedIds.value].filter((id) => visibleIds.has(id)),
  );
};

const loadMerchants = async () => {
  loading.value = true;
  try {
    const res = await fetchPageDeviceMerchant({
      ...form,
      page: page.value,
      pageSize: pageSize.value,
    });
    const { records, total } = normalizePageData(res);
    allRows.value = records;
    totalCount.value = total;
    pruneSelection();
  } finally {
    loading.value = false;
  }
};

// ─── Actions ────────────────────────────────────────────

const handleRefresh = () => {
  page.value = 1;
  loadMerchants();
};

const handlePageChange = (nextPage: number) => {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value);
  loadMerchants();
};

const handleOpen = async (type: "add" | "edit", row: any) => {
  saveDialogMounted.value = true;
  await nextTick();
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
    const nextSelected = new Set(selectedIds.value);
    nextSelected.delete(row.sysProjectId);
    selectedIds.value = nextSelected;
    await loadMerchants();
  } catch {
    /* cancelled */
  }
};

onMounted(loadMerchants);

</script>

<style scoped lang="scss">
/* ─── Page ──────────────────────────────────────────────── */

.merchant-page {
  padding: 16px;
  min-height: 100%;
  background: var(--el-bg-color);
}

/* ─── Header ────────────────────────────────────────────── */

.merchant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 14px 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
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
  border-radius: 8px;
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

.header-metrics {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  gap: 8px;
}

.header-metric {
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);

  span {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  strong {
    display: block;
    margin-top: 2px;
    font-size: 18px;
    color: var(--el-text-color-primary);
  }
}

/* ─── Action bar ────────────────────────────────────────── */

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.merchant-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  min-height: 260px;
}

.merchant-empty {
  grid-column: 1 / -1;
  min-height: 260px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
}

.merchant-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 14px;
  color: var(--el-text-color-secondary);
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
  border-radius: 8px;
  padding: 14px 16px 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
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
  border-radius: 8px;
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
  background: var(--el-bg-color-overlay);
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

  .header-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }

  .merchant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
