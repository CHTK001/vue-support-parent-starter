<template>
  <div class="acme-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <ScCard
        layout="stats"
        icon="mdi:account-key"
        :value="stats.accountCount"
        label="账户总数"
        theme="primary"
        size="small"
      />
      <ScCard
        layout="stats"
        icon="mdi:certificate"
        :value="stats.validCount"
        label="有效证书"
        theme="success"
        size="small"
      />
      <ScCard
        layout="stats"
        icon="mdi:clock-alert"
        :value="stats.expiringCount"
        label="即将到期"
        theme="warning"
        size="small"
      />
      <ScCard
        layout="stats"
        icon="mdi:timer-sand"
        :value="stats.pendingCount"
        label="待验证"
        theme="info"
        size="small"
      />
    </div>

    <!-- 标签页切换 -->
    <el-card class="main-card">
      <div class="tabs-header">
        <el-tabs v-model="activeTab" class="tabs-content">
          <el-tab-pane label="证书列表" name="certs" />
          <el-tab-pane label="账户管理" name="accounts" />
        </el-tabs>
        <div class="tabs-actions">
          <el-button type="primary" @click="handleApplyCert">
            <IconifyIconOnline icon="mdi:certificate-outline" />
            申请证书
          </el-button>
          <el-button @click="handleAddAccount">
            <IconifyIconOnline icon="mdi:account-plus" />
            添加账户
          </el-button>
        </div>
      </div>
      <!-- 证书列表内容 -->
      <div v-show="activeTab === 'certs'">
        <CertList ref="certListRef" />
      </div>
      <!-- 账户管理内容 -->
      <div v-show="activeTab === 'accounts'">
        <AccountList ref="accountListRef" />
      </div>
    </el-card>

    <!-- 申请证书对话框 -->
    <ApplyCertDialog
      v-model:visible="applyDialogVisible"
      @success="handleApplySuccess"
    />

    <!-- 添加账户对话框 -->
    <AccountDialog
      v-model:visible="accountDialogVisible"
      @success="handleAccountSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getCertStats, type AcmeCertStats } from "@/api/acme";
import ScCard from "@repo/components/ScCard/index.vue";
import CertList from "./components/CertList.vue";
import AccountList from "./components/AccountList.vue";
import ApplyCertDialog from "./components/ApplyCertDialog.vue";
import AccountDialog from "./components/AccountDialog.vue";

defineOptions({
  name: "AcmeCertManagement",
});

const activeTab = ref("certs");
const certListRef = ref();
const accountListRef = ref();
const applyDialogVisible = ref(false);
const accountDialogVisible = ref(false);

const stats = ref<AcmeCertStats>({
  accountCount: 0,
  certCount: 0,
  validCount: 0,
  pendingCount: 0,
  expiringCount: 0,
  expiredCount: 0,
  revokedCount: 0,
  failedCount: 0,
});

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const res = (await getCertStats()) as unknown as { data: AcmeCertStats };
    stats.value = res.data || stats.value;
  } catch (error) {
    console.error("加载统计数据失败", error);
  }
}

/**
 * 打开申请证书对话框
 */
function handleApplyCert() {
  applyDialogVisible.value = true;
}

/**
 * 打开添加账户对话框
 */
function handleAddAccount() {
  accountDialogVisible.value = true;
}

/**
 * 申请成功回调
 */
function handleApplySuccess() {
  loadStats();
  certListRef.value?.refresh();
}

/**
 * 账户添加成功回调
 */
function handleAccountSuccess() {
  loadStats();
  accountListRef.value?.refresh();
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">
.acme-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;

  .stats-row {
    display: flex;
    gap: 16px;

    > * {
      flex: 1;
      min-width: 0;
    }
  }

  .main-card {
    flex: 1;
    min-height: 500px;

    .tabs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .tabs-content {
        flex: 1;

        :deep(.el-tabs__header) {
          margin-bottom: 0;
        }

        :deep(.el-tabs__nav-wrap::after) {
          display: none;
        }
      }

      .tabs-actions {
        display: flex;
        gap: 12px;
        padding-bottom: 10px;
      }
    }
  }
}
</style>
