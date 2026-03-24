<template>
  <div class="cert-list system-container modern-bg">
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
            style="width: 120px"
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
      :url="getCertPage"
      :params="queryForm"
      row-key="acmeCertId"
      class="cert-table"
      height="auto"
    >
      <el-table-column prop="acmeCertId" label="ID" width="80" align="center">
        <template #default="{ row }">
          <span class="id-cell">#{{ row.acmeCertId }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="acmeCertPrimaryDomain"
        label="主域名"
        min-width="200"
      >
        <template #default="{ row }">
          <div class="domain-cell">
            <div class="domain-icon-wrapper">
              <IconifyIconOnline icon="mdi:web" />
            </div>
            <div class="domain-info">
              <span class="domain-name">{{ row.acmeCertPrimaryDomain }}</span>
              <span class="domain-san" v-if="row.acmeCertSan">
                +{{ (row.acmeCertSan || '').split(',').length }} 个备用域名
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="acmeCertChallengeType"
        label="验证类型"
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <div class="challenge-badge" :class="row.acmeCertChallengeType === 'DNS-01' ? 'dns' : 'http'">
            <IconifyIconOnline :icon="row.acmeCertChallengeType === 'DNS-01' ? 'mdi:dns' : 'mdi:web'" />
            <span>{{ row.acmeCertChallengeType }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="acmeCertStatus" label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.acmeCertStatus === 'failed' && row.acmeCertLastError"
            :content="row.acmeCertLastError"
            placement="top"
            :show-after="200"
          >
            <div class="status-badge" :class="`status-${row.acmeCertStatus}`">
              <span class="status-dot"></span>
              <span>{{ getStatusLabel(row.acmeCertStatus) }}</span>
            </div>
          </el-tooltip>
          <div v-else class="status-badge" :class="`status-${row.acmeCertStatus}`">
            <span class="status-dot"></span>
            <span>{{ getStatusLabel(row.acmeCertStatus) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="acmeCertNotAfter" label="有效期" width="200">
        <template #default="{ row }">
          <div class="expiry-cell" v-if="row.acmeCertNotAfter">
            <div class="expiry-info">
              <span class="expiry-date">{{ formatDate(row.acmeCertNotAfter) }}</span>
              <span class="expiry-days" :class="getExpiryClass(row.acmeCertNotAfter)">
                {{ getExpiryText(row.acmeCertNotAfter) }}
              </span>
            </div>
            <div class="expiry-progress">
              <div class="progress-bar" :class="getExpiryClass(row.acmeCertNotAfter)" :style="{ width: getExpiryProgress(row) + '%' }"></div>
            </div>
          </div>
          <span class="empty-text" v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <div class="action-cell">
            <el-tooltip content="复制申请" placement="top">
              <button class="action-btn" @click="handleCopy(row)">
                <IconifyIconOnline icon="mdi:content-copy" />
              </button>
            </el-tooltip>
            <el-tooltip content="查看详情" placement="top">
              <button class="action-btn" @click="handleView(row)">
                <IconifyIconOnline icon="mdi:eye-outline" />
              </button>
            </el-tooltip>
            <el-tooltip content="下载证书" placement="top" v-if="row.acmeCertStatus === 'valid'">
              <button class="action-btn primary" @click="handleDownload(row)">
                <IconifyIconOnline icon="mdi:download" />
              </button>
            </el-tooltip>
            <el-tooltip content="重新验证" placement="top" v-if="row.acmeCertStatus === 'validating'">
              <button class="action-btn warning" @click="handleRetryValidation(row)">
                <IconifyIconOnline icon="mdi:refresh" />
              </button>
            </el-tooltip>
            <el-popconfirm
              v-if="row.acmeCertStatus === 'valid'"
              title="确定要续签该证书吗？"
              confirm-button-text="续签"
              cancel-button-text="取消"
              @confirm="handleRenew(row)"
            >
              <template #reference>
                <button class="action-btn warning">
                  <IconifyIconOnline icon="mdi:autorenew" />
                </button>
              </template>
            </el-popconfirm>
            <el-popconfirm
              title="确定要删除该证书吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <button class="action-btn danger">
                  <IconifyIconOnline icon="mdi:delete-outline" />
                </button>
              </template>
            </el-popconfirm>
          </div>
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
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import {
  getCertPage,
  deleteCert,
  renewCert,
  triggerRenewCheck,
  retryValidation,
  CERT_STATUS,
  type AcmeCertificate,
} from "@/api/acme";
import CertDetailDialog from "./CertDetailDialog.vue";
import DownloadDialog from "./DownloadDialog.vue";

defineOptions({
  name: "CertList",
});

const emit = defineEmits<{
  copy: [cert: AcmeCertificate];
}>();

const tableRef = ref();
const detailDialogVisible = ref(false);
const downloadDialogVisible = ref(false);
const currentCertId = ref<number>(0);
const currentCert = ref<AcmeCertificate>();

const queryForm = reactive({
  acmeCertPrimaryDomain: "",
  acmeCertStatus: "",
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
 * 格式化日期
 */
function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 获取到期天数
 */
function getDaysUntilExpiry(notAfter: string) {
  if (!notAfter) return -1;
  const expireDate = new Date(notAfter);
  const now = new Date();
  return Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 获取到期文本
 */
function getExpiryText(notAfter: string) {
  const days = getDaysUntilExpiry(notAfter);
  if (days < 0) return '已过期';
  if (days === 0) return '今天到期';
  if (days <= 7) return `${days}天后到期`;
  if (days <= 30) return `${days}天后`;
  return `${days}天`;
}

/**
 * 获取到期样式类名
 */
function getExpiryClass(notAfter: string) {
  const days = getDaysUntilExpiry(notAfter);
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'normal';
}

/**
 * 获取到期进度百分比
 */
function getExpiryProgress(row: AcmeCertificate) {
  if (!row.acmeCertNotAfter || !row.acmeCertNotBefore) return 0;
  const start = new Date(row.acmeCertNotBefore).getTime();
  const end = new Date(row.acmeCertNotAfter).getTime();
  const now = Date.now();
  const total = end - start;
  const remaining = end - now;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

/**
 * 搜索
 */
function handleSearch() {
  tableRef.value?.refresh();
}

/**
 * 重置
 */
function handleReset() {
  queryForm.acmeCertPrimaryDomain = "";
  queryForm.acmeCertStatus = "";
  tableRef.value?.refresh();
}

/**
 * 复制申请
 */
function handleCopy(row: AcmeCertificate) {
  emit("copy", row);
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
    await renewCert(row.acmeCertId!);
    message("续签请求已提交", { type: "success" });
    tableRef.value?.refresh();
  } catch (error) {
    message("续签失败", { type: "error" });
  }
}

/**
 * 删除
 */
async function handleDelete(row: AcmeCertificate) {
  try {
    await deleteCert(row.acmeCertId!);
    message("删除成功", { type: "success" });
    tableRef.value?.refresh();
  } catch (error) {
    message("删除失败", { type: "error" });
  }
}

/**
 * 重新验证
 */
async function handleRetryValidation(row: AcmeCertificate) {
  try {
    await retryValidation(row.acmeCertId!);
    message("重新验证已提交，请在消息中心查看进度", { type: "success" });
    tableRef.value?.refresh();
  } catch (error) {
    message("重新验证失败", { type: "error" });
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
  tableRef.value?.refresh();
}

defineExpose({ refresh });
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.cert-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    flex-wrap: wrap;
    gap: 12px;

    .search-form {
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper) {
        border-radius: 8px;
      }
    }

    .toolbar-right {
      :deep(.el-button) {
        border-radius: 8px;
      }
    }
  }
}

/* 表格样式 */
.cert-table {
  :deep(.el-table) {
    border-radius: 12px;
    overflow: hidden;

    .el-table__header th {
      background: var(--el-fill-color-lighter) !important;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .el-table__row {
      transition: all 0.2s ease;

      &:hover {
        background: var(--el-color-primary-light-9) !important;
      }
    }
  }
}

/* ID 单元格 */
.id-cell {
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

/* 域名单元格 */
.domain-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .domain-icon-wrapper {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: #fff;
    font-size: 18px;
    flex-shrink: 0;
  }

  .domain-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .domain-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .domain-san {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}

/* 验证类型徽章 */
.challenge-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  &.http {
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    color: #667eea;
  }

  &.dns {
    background: linear-gradient(135deg, #11998e15 0%, #38ef7d15 100%);
    color: #11998e;
  }
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.status-valid {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    .status-dot {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }
  }

  &.status-pending,
  &.status-validating {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    .status-dot {
      background: #f59e0b;
      animation: pulse 2s infinite;
    }
  }

  &.status-expired {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    .status-dot {
      background: #ef4444;
    }
  }

  &.status-revoked {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    .status-dot {
      background: #6b7280;
    }
  }

  &.status-failed {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    .status-dot {
      background: #ef4444;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 有效期单元格 */
.expiry-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .expiry-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .expiry-date {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .expiry-days {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;

    &.normal {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    &.warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    &.critical {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    &.expired {
      background: rgba(107, 114, 128, 0.1);
      color: #6b7280;
    }
  }

  .expiry-progress {
    height: 4px;
    background: var(--el-fill-color);
    border-radius: 2px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;

      &.normal {
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      &.warning {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
      }

      &.critical {
        background: linear-gradient(90deg, #ef4444, #f87171);
      }

      &.expired {
        background: var(--el-fill-color-dark);
      }
    }
  }
}

.empty-text {
  color: var(--el-text-color-placeholder);
}

/* 操作单元格 */
.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.primary {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);

    &:hover {
      background: var(--el-color-primary);
      color: #fff;
    }
  }

  &.warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);

    &:hover {
      background: var(--el-color-warning);
      color: #fff;
    }
  }

  &.danger {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);

    &:hover {
      background: var(--el-color-danger);
      color: #fff;
    }
  }
}

.text-danger {
  color: var(--el-color-danger);
  font-weight: 500;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
