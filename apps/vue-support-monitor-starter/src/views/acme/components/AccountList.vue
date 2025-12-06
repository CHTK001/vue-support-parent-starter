<template>
  <div class="account-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <IconifyIconOnline icon="mdi:plus" />
        添加账户
      </el-button>
    </div>

    <!-- 账户表格 -->
    <el-table v-loading="loading" :data="tableData" stripe border>
      <el-table-column prop="acmeAccountId" label="ID" width="80" />
      <el-table-column prop="acmeAccountEmail" label="邮箱" min-width="200" />
      <el-table-column
        prop="acmeAccountServer"
        label="ACME服务器"
        min-width="300"
      >
        <template #default="{ row }">
          <el-tooltip :content="row.acmeAccountServer" placement="top">
            <span class="ellipsis">{{
              getServerName(row.acmeAccountServer)
            }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="acmeAccountStatus" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.acmeAccountStatus)" size="small">
            {{ getStatusLabel(row.acmeAccountStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button-group size="small">
            <el-button @click="handleEdit(row)">
              <IconifyIconOnline icon="mdi:pencil" />
              编辑
            </el-button>
            <el-button type="danger" @click="handleDelete(row)">
              <IconifyIconOnline icon="mdi:delete" />
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 账户编辑对话框 -->
    <AccountDialog
      v-model:visible="dialogVisible"
      :account="currentAccount"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
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

const loading = ref(false);
const tableData = ref<AcmeAccount[]>([]);
const dialogVisible = ref(false);
const currentAccount = ref<AcmeAccount>();

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

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
function getStatusType(status: string) {
  const item = ACCOUNT_STATUS.find((s) => s.value === status);
  return item?.type || "info";
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: string) {
  const item = ACCOUNT_STATUS.find((s) => s.value === status);
  return item?.label || status || "未知";
}

/**
 * 加载数据
 */
async function loadData() {
  loading.value = true;
  try {
    const res = await getAccountPage({
      page: pagination.page,
      size: pagination.size,
    });
    const data = res as unknown as { records: AcmeAccount[]; total: number };
    tableData.value = data.records || [];
    pagination.total = data.total || 0;
  } catch (error) {
    console.error("加载账户列表失败", error);
  } finally {
    loading.value = false;
  }
}

/**
 * 添加账户
 */
function handleAdd() {
  currentAccount.value = undefined;
  dialogVisible.value = true;
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
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败，该账户可能有关联的证书");
    }
  }
}

/**
 * 保存成功回调
 */
function handleSuccess() {
  loadData();
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
.account-list {
  .toolbar {
    margin-bottom: 16px;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    max-width: 280px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
