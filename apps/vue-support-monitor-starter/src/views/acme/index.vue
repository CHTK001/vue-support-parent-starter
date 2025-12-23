<template>
  <div class="acme-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card accounts">
        <div class="stat-icon">
          <IconifyIconOnline icon="mdi:account-key" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.accountCount }}</div>
          <div class="stat-label">ACME 账户</div>
        </div>
        <div class="stat-decoration"></div>
      </div>
      <div class="stat-card valid">
        <div class="stat-icon">
          <IconifyIconOnline icon="mdi:certificate" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.validCount }}</div>
          <div class="stat-label">有效证书</div>
        </div>
        <div class="stat-decoration"></div>
      </div>
      <div class="stat-card expiring">
        <div class="stat-icon">
          <IconifyIconOnline icon="mdi:clock-alert" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.expiringCount }}</div>
          <div class="stat-label">即将到期</div>
        </div>
        <div class="stat-decoration"></div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">
          <IconifyIconOnline icon="mdi:timer-sand" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingCount }}</div>
          <div class="stat-label">待验证</div>
        </div>
        <div class="stat-decoration"></div>
      </div>
    </div>

    <!-- 标签页切换 -->
    <div class="main-card">
      <div class="tabs-header">
        <div class="custom-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'certs' }"
            @click="activeTab = 'certs'"
          >
            <IconifyIconOnline icon="mdi:certificate" />
            <span>证书列表</span>
            <span class="tab-badge" v-if="stats.validCount">{{ stats.validCount }}</span>
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'accounts' }"
            @click="activeTab = 'accounts'"
          >
            <IconifyIconOnline icon="mdi:account-group" />
            <span>账户管理</span>
            <span class="tab-badge" v-if="stats.accountCount">{{ stats.accountCount }}</span>
          </div>
        </div>
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
      <div class="tab-content" v-show="activeTab === 'certs'">
        <CertList ref="certListRef" />
      </div>
      <!-- 账户管理内容 -->
      <div class="tab-content" v-show="activeTab === 'accounts'">
        <AccountList ref="accountListRef" />
      </div>
    </div>

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
  min-height: 100vh;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 24px;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
    min-width: 0;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  .stat-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .stat-decoration {
    position: absolute;
    right: -20px;
    top: -20px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    opacity: 0.1;
  }

  /* 账户卡片 */
  &.accounts {
    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .stat-decoration {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }

  /* 有效证书卡片 */
  &.valid {
    .stat-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #fff;
    }
    .stat-decoration {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
  }

  /* 即将到期卡片 */
  &.expiring {
    .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: #fff;
    }
    .stat-decoration {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  /* 待验证卡片 */
  &.pending {
    .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: #fff;
    }
    .stat-decoration {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }
}

/* 主卡片 */
.main-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .tabs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .tabs-actions {
    display: flex;
    gap: 10px;
    padding-bottom: 12px;

    .el-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 8px;
    }
  }

  .tab-content {
    padding: 16px 20px;
  }
}

/* 自定义标签页 */
.custom-tabs {
  display: flex;
  gap: 8px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.3s ease;

  &:hover {
    color: var(--el-color-primary);
  }

  &.active {
    color: var(--el-color-primary);
    border-bottom-color: var(--el-color-primary);
  }

  .tab-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    line-height: 20px;
    text-align: center;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 10px;
  }

  &.active .tab-badge {
    background: var(--el-color-primary);
    color: #fff;
  }
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .main-card .tabs-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .custom-tabs {
      justify-content: center;
    }

    .tabs-actions {
      justify-content: center;
    }
  }
}
</style>
