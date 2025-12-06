<template>
  <div class="acme-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon account">
              <IconifyIconOnline icon="mdi:account-key" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.accountCount }}</div>
              <div class="stat-label">账户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon cert">
              <IconifyIconOnline icon="mdi:certificate" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.validCount }}</div>
              <div class="stat-label">有效证书</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon expiring">
              <IconifyIconOnline icon="mdi:clock-alert" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.expiringCount }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <IconifyIconOnline icon="mdi:timer-sand" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingCount }}</div>
              <div class="stat-label">待验证</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页切换 -->
    <el-card class="main-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="证书列表" name="certs">
          <CertList ref="certListRef" @apply="handleApplyCert" />
        </el-tab-pane>
        <el-tab-pane label="账户管理" name="accounts">
          <AccountList ref="accountListRef" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 申请证书对话框 -->
    <ApplyCertDialog
      v-model:visible="applyDialogVisible"
      @success="handleApplySuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getCertStats, type AcmeCertStats } from "@/api/acme";
import CertList from "./components/CertList.vue";
import AccountList from "./components/AccountList.vue";
import ApplyCertDialog from "./components/ApplyCertDialog.vue";

defineOptions({
  name: "AcmeCertManagement",
});

const activeTab = ref("certs");
const certListRef = ref();
const accountListRef = ref();
const applyDialogVisible = ref(false);

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
 * 申请成功回调
 */
function handleApplySuccess() {
  loadStats();
  certListRef.value?.refresh();
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">
.acme-container {
  padding: 16px;

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;

      &.account {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.cert {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.expiring {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.pending {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }

    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .main-card {
    min-height: 500px;
  }
}
</style>
