<template>
  <div class="system-container merchant-page">
    <div class="merchant-header">
      <div class="left">
        <IconifyIconOnline icon="ri:store-2-line" width="20" />
        <div>
          <div class="title">设备商户管理</div>
          <div class="subtitle">维护独立设备接入商户和厂商连接配置</div>
        </div>
      </div>
      <div class="right">
        <ScForm :inline="true" :model="form">
          <ScFormItem label="商户名称">
            <ScInput
              v-model="form.sysProjectName"
              placeholder="请输入商户名称"
              clearable
              @keyup.enter="handleRefresh"
            />
          </ScFormItem>
          <ScFormItem label="厂商">
            <ScSelect
              v-model="form.sysProjectVender"
              :data="vendorOptions"
              clearable
              filterable
              placeholder="全部厂商"
            />
          </ScFormItem>
          <ScFormItem>
            <ScButton @click="handleRefresh">
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

    <ScTable
      ref="tableRef"
      layout="card"
      :col-size="3"
      :row-size="2"
      :url="fetchPageDeviceMerchant"
      :params="form"
      class="merchant-table"
    >
      <template #default="{ row }">
        <ScCard shadow="hover" class="merchant-card">
          <template #header>
            <div class="card-header">
              <div class="identity">
                <div class="brand-icon">
                  <IconifyIconOnline icon="ri:server-line" />
                </div>
                <div>
                  <div class="merchant-name">{{ row.sysProjectName }}</div>
                  <div class="merchant-meta">
                    {{ row.sysProjectDictItemLabel || "未设置厂商" }}
                  </div>
                </div>
              </div>
              <ScSwitch
                v-model="row.sysProjectStatus"
                :active-value="1"
                :inactive-value="0"
                layout="modern"
                @change="() => onToggle(row)"
              />
            </div>
          </template>

          <div class="merchant-body">
            <div class="metric">
              <span class="metric-label">API 地址</span>
              <span class="metric-value">{{ row.sysProjectApiAddress || row.sysProjectEndpoint || "-" }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">应用标识</span>
              <span class="metric-value">{{ row.sysProjectAppId || "-" }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">项目编码</span>
              <span class="metric-value">{{ row.sysProjectCode || "-" }}</span>
            </div>
          </div>

          <div class="merchant-actions">
            <ScButton size="small" @click="handleGoDevices(row)">
              <IconifyIconOnline icon="mingcute:computer-camera-fill" />
              设备管理
            </ScButton>
            <ScButton size="small" @click="handleTestConnection(row)">
              <IconifyIconOnline icon="ri:pulse-line" />
              测试连接
            </ScButton>
            <ScButton size="small" @click="handleOpen('edit', row)">
              <IconifyIconOnline icon="ep:edit" />
              编辑
            </ScButton>
            <ScPopconfirm title="确认删除该商户？" @confirm="onDelete(row)">
              <template #reference>
                <ScButton size="small" type="danger">
                  <IconifyIconOnline icon="ep:delete" />
                  删除
                </ScButton>
              </template>
            </ScPopconfirm>
          </div>
        </ScCard>
      </template>
    </ScTable>

    <SaveDialog ref="saveDialogRef" @success="handleRefresh" />
  </div>
</template>

<script setup lang="ts">
import { fetchListDictItem, router } from "@repo/core";
import { message } from "@repo/utils";
import { defineAsyncComponent, onMounted, reactive, ref } from "vue";
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

const form = reactive<any>({
  sysProjectName: "",
  sysProjectVender: null,
});

const handleRefresh = () => {
  tableRef.value?.reload(form);
};

const handleOpen = (type: "add" | "edit", row: any) => {
  saveDialogRef.value?.handleOpen(type, row);
};

const handleGoDevices = (row: any) => {
  router.push({
    path: "/device/manage",
    query: {
      sysProjectId: row.sysProjectId,
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

const onToggle = async (row: any) => {
  await fetchUpdateDeviceMerchant({
    sysProjectId: row.sysProjectId,
    sysProjectStatus: row.sysProjectStatus,
  });
  handleRefresh();
};

const onDelete = async (row: any) => {
  await fetchDeleteDeviceMerchant({
    sysProjectId: row.sysProjectId,
  });
  handleRefresh();
};

onMounted(async () => {
  const res = await fetchListDictItem({
    sysDictId: 1,
  });
  vendorOptions.value =
    res?.data?.map((item) => ({
      label: item.sysDictItemName,
      value: item.sysDictItemId,
    })) || [];
});
</script>

<style scoped lang="scss">
.merchant-page {
  padding: 24px;
}

.merchant-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 45%),
    linear-gradient(135deg, #f8fbff 0%, #f5f9ff 55%, #fff7ed 100%);
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 18px;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.merchant-card {
  width: 100%;
}

.card-header,
.merchant-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.12);
}

.merchant-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.merchant-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.merchant-body {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
}

.metric {
  display: grid;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
}

.metric-value {
  font-size: 14px;
  color: #0f172a;
  word-break: break-all;
}

.merchant-actions {
  justify-content: flex-start;
  flex-wrap: wrap;
}
</style>
