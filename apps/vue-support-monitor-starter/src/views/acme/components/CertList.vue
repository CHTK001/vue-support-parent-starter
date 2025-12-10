<template>
  <div class="cert-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="域名">
          <el-input
            v-model="queryForm.acmeCertPrimaryDomain"
            placeholder="请输入主域名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.acmeCertStatus"
            placeholder="全部"
            clearable
          >
            <el-option
              v-for="item in CERT_STATUS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="mdi:magnify" />
            查询
          </el-button>
          <el-button @click="handleReset">
            <IconifyIconOnline icon="mdi:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
      <div class="toolbar-right">
        <el-tooltip content="检查续签" placement="top">
          <el-button type="primary" @click="handleRenewCheck">
            <IconifyIconOnline icon="mdi:autorenew" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 证书表格 -->
    <ScTable
      ref="tableRef"
      v-loading="loading"
      :data="tableData"
      :params="{}"
      row-key="acmeCertId"
      stripe
      border
      :page-size="pagination.size"
      :current-page="pagination.page"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <el-table-column prop="acmeCertId" label="ID" width="80" />
      <el-table-column
        prop="acmeCertPrimaryDomain"
        label="主域名"
        min-width="180"
      >
        <template #default="{ row }">
          <div class="domain-cell">
            <IconifyIconOnline icon="mdi:web" class="domain-icon" />
            <span>{{ row.acmeCertPrimaryDomain }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="acmeCertChallengeType"
        label="验证类型"
        width="120"
      >
        <template #default="{ row }">
          <el-tag size="small">{{ row.acmeCertChallengeType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="acmeCertStatus" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.acmeCertStatus)" size="small">
            {{ getStatusLabel(row.acmeCertStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="acmeCertNotAfter" label="到期时间" width="180">
        <template #default="{ row }">
          <span
            :class="{ 'text-danger': isExpiringSoon(row.acmeCertNotAfter) }"
          >
            {{ row.acmeCertNotAfter || "-" }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button-group size="small">
            <el-button @click="handleView(row)">
              <IconifyIconOnline icon="mdi:eye" />
              详情
            </el-button>
            <el-button
              v-if="row.acmeCertStatus === 'valid'"
              type="primary"
              @click="handleDownload(row)"
            >
              <IconifyIconOnline icon="mdi:download" />
              下载
            </el-button>
            <el-button
              v-if="row.acmeCertStatus === 'valid'"
              type="warning"
              @click="handleRenew(row)"
            >
              <IconifyIconOnline icon="mdi:autorenew" />
              续签
            </el-button>
            <el-button type="danger" @click="handleDelete(row)">
              <IconifyIconOnline icon="mdi:delete" />
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </ScTable>

    <!-- 证书详情对话框 -->
    <CertDetailDialog
      v-model:visible="detailDialogVisible"
      :cert-id="currentCertId"
    />

    <!-- 下载对话框 -->
    <DownloadDialog
      v-model:visible="downloadDialogVisible"
      :cert="currentCert"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getCertPage,
  deleteCert,
  renewCert,
  triggerRenewCheck,
  CERT_STATUS,
  type AcmeCertificate,
} from "@/api/acme";
import CertDetailDialog from "./CertDetailDialog.vue";
import DownloadDialog from "./DownloadDialog.vue";

defineOptions({
  name: "CertList",
});

const loading = ref(false);
const tableRef = ref();
const tableData = ref<AcmeCertificate[]>([]);
const detailDialogVisible = ref(false);
const downloadDialogVisible = ref(false);
const currentCertId = ref<number>(0);
const currentCert = ref<AcmeCertificate>();

const queryForm = reactive({
  acmeCertPrimaryDomain: "",
  acmeCertStatus: "",
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

/**
 * 获取状态类型
 */
function getStatusType(
  status: string
): "success" | "warning" | "danger" | "info" | "primary" {
  const item = CERT_STATUS.find((s) => s.value === status);
  return (item?.type || "info") as
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "primary";
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: string) {
  const item = CERT_STATUS.find((s) => s.value === status);
  return item?.label || status;
}

/**
 * 判断是否即将到期（30天内）
 */
function isExpiringSoon(notAfter: string) {
  if (!notAfter) return false;
  const expireDate = new Date(notAfter);
  const now = new Date();
  const diffDays = Math.ceil(
    (expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 30 && diffDays >= 0;
}

/**
 * 加载数据
 */
async function loadData() {
  loading.value = true;
  try {
    const res = await getCertPage({
      page: pagination.page,
      size: pagination.size,
      ...queryForm,
    });
    const data = res as unknown as {
      records: AcmeCertificate[];
      total: number;
    };
    tableData.value = data.records || [];
    pagination.total = data.total || 0;
  } catch (error) {
    console.error("加载证书列表失败", error);
  } finally {
    loading.value = false;
  }
}

/**
 * 搜索
 */
function handleSearch() {
  pagination.page = 1;
  loadData();
}

/**
 * 分页变化
 */
function handlePageChange(page: number) {
  pagination.page = page;
  loadData();
}

/**
 * 每页条数变化
 */
function handleSizeChange(size: number) {
  pagination.size = size;
  pagination.page = 1;
  loadData();
}

/**
 * 重置
 */
function handleReset() {
  queryForm.acmeCertPrimaryDomain = "";
  queryForm.acmeCertStatus = "";
  handleSearch();
}

/**
 * 查看详情
 */
function handleView(row: AcmeCertificate) {
  currentCertId.value = row.acmeCertId!;
  detailDialogVisible.value = true;
}

/**
 * 下载
 */
function handleDownload(row: AcmeCertificate) {
  currentCert.value = row;
  downloadDialogVisible.value = true;
}

/**
 * 续签
 */
async function handleRenew(row: AcmeCertificate) {
  try {
    await ElMessageBox.confirm(
      `确定要续签证书 ${row.acmeCertPrimaryDomain} 吗？`,
      "续签确认",
      { type: "warning" }
    );
    await renewCert(row.acmeCertId!);
    message("续签请求已提交", { type: "success" });
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      message("续签失败", { type: "error" });
    }
  }
}

/**
 * 删除
 */
async function handleDelete(row: AcmeCertificate) {
  try {
    await ElMessageBox.confirm(
      `确定要删除证书 ${row.acmeCertPrimaryDomain} 吗？此操作不可恢复！`,
      "删除确认",
      { type: "warning" }
    );
    await deleteCert(row.acmeCertId!);
    message("删除成功", { type: "success" });
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
}

/**
 * 检查续签
 */
async function handleRenewCheck() {
  try {
    await triggerRenewCheck();
    message("续签检查已触发", { type: "success" });
  } catch (error) {
    message("续签检查失败", { type: "error" });
  }
}

/**
 * 刷新
 */
function refresh() {
  loadData();
}

defineExpose({ refresh });

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.cert-list {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .search-form {
      margin-bottom: 0;
    }
  }

  .domain-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .domain-icon {
      color: var(--el-color-primary);
    }
  }

  .text-danger {
    color: var(--el-color-danger);
    font-weight: 500;
  }
}
</style>
