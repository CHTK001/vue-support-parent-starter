<template>
  <div class="account-list">
    <!-- 工具栏（保留刷新功能，添加账户已移到顶部） -->
    <div class="toolbar">
      <el-tooltip content="刷新" placement="top">
        <el-button type="primary" @click="refresh">
          <IconifyIconOnline icon="mdi:refresh" />
        </el-button>
      </el-tooltip>
    </div>

    <!-- 账户表格 -->
    <ScTable
      ref="tableRef"
      :url="getAccountPage"
      row-key="acmeAccountId"
      stripe
      height="auto"
    >
      <el-table-column
        prop="acmeAccountId"
        label="ID"
        width="80"
        align="center"
      >
        <template #default="{ row }">
          <span class="id-cell">#{{ row.acmeAccountId }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="acmeAccountEmail" label="邮箱" min-width="220">
        <template #default="{ row }">
          <div class="email-cell">
            <IconifyIconOnline icon="mdi:email-outline" class="email-icon" />
            <span>{{ row.acmeAccountEmail }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="acmeAccountServer"
        label="ACME服务器"
        min-width="200"
      >
        <template #default="{ row }">
          <el-tag class="server-tag" effect="plain">
            <IconifyIconOnline icon="mdi:server" class="server-icon" />
            {{ getServerName(row.acmeAccountServer) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="acmeAccountStatus"
        label="状态"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <div class="status-cell">
            <span
              class="status-dot"
              :class="`status-${row.acmeAccountStatus || 'unknown'}`"
            ></span>
            <span class="status-text">{{
              getStatusLabel(row.acmeAccountStatus)
            }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="170">
        <template #default="{ row }">
          <div class="time-cell">
            <IconifyIconOnline icon="mdi:clock-outline" class="time-icon" />
            <span>{{ row.updateTime || "-" }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <div class="action-cell">
            <el-tooltip content="编辑" placement="top">
              <el-button class="action-btn" @click="handleEdit(row)">
                <IconifyIconOnline icon="mdi:pencil-outline" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button class="action-btn danger" @click="handleDelete(row)">
                <IconifyIconOnline icon="mdi:delete-outline" />
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </ScTable>

    <!-- 账户编辑对话框 -->
    <AccountDialog
      v-model:visible="dialogVisible"
      :account="currentAccount"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getAccountPage,
  deleteAccount,
  ACME_SERVERS,
  ACCOUNT_STATUS,
  type AcmeAccount,
} from "@/api/acme";
import AccountDialog from "./AccountDialog.vue";

defineOptions({
  name: "AccountList",
});

const tableRef = ref();
const dialogVisible = ref(false);
const currentAccount = ref<AcmeAccount>();

/**
 * 获取服务器名称
 */
function getServerName(url: string) {
  const server = ACME_SERVERS.find((s) => s.value === url);
  return server?.label || url;
}

/**
 * 获取状态类型
 */
function getStatusType(
  status: string
): "success" | "warning" | "danger" | "info" {
  const item = ACCOUNT_STATUS.find((s) => s.value === status);
  return (item?.type as "success" | "warning" | "danger" | "info") || "info";
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: string) {
  const item = ACCOUNT_STATUS.find((s) => s.value === status);
  return item?.label || status || "未知";
}

/**
 * 编辑账户
 */
function handleEdit(row: AcmeAccount) {
  currentAccount.value = { ...row };
  dialogVisible.value = true;
}

/**
 * 删除账户
 */
async function handleDelete(row: AcmeAccount) {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户 ${row.acmeAccountEmail} 吗？`,
      "删除确认",
      { type: "warning" }
    );
    await deleteAccount(row.acmeAccountId!);
    message("删除成功", { type: "success" });
    tableRef.value?.refresh();
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败，该账户可能有关联的证书", { type: "error" });
    }
  }
}

/**
 * 保存成功回调
 */
function handleSuccess() {
  tableRef.value?.refresh();
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
.account-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .toolbar {
    margin-bottom: 16px;
  }
}

/* ID 单元格 */
.id-cell {
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 邮箱单元格 */
.email-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .email-icon {
    color: var(--el-text-color-secondary);
    font-size: 16px;
  }
}

/* 服务器标签 */
.server-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;

  .server-icon {
    font-size: 14px;
  }
}

/* 状态单元格 */
.status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.status-valid {
    background: var(--el-color-success);
    box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
  }

  &.status-deactivated {
    background: var(--el-color-warning);
  }

  &.status-revoked {
    background: var(--el-color-danger);
  }

  &.status-unknown {
    background: var(--el-color-info);
  }
}

.status-text {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/* 时间单元格 */
.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .time-icon {
    font-size: 14px;
  }
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
  padding: 0;
  border: none;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    transform: translateY(-2px);
  }

  &.danger:hover {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}
</style>
