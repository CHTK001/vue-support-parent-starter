<template>
  <div class="acme-container system-container modern-bg">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <ScCard
        layout="stats-simple"
        theme="purple"
        icon="mdi:account-key"
        :value="stats.accountCount"
        label="ACME 账户"
      />
      <ScCard
        layout="stats-simple"
        theme="success"
        icon="mdi:certificate"
        :value="stats.validCount"
        label="有效证书"
      />
      <ScCard
        layout="stats-simple"
        theme="warning"
        icon="mdi:clock-alert"
        :value="stats.expiringCount"
        label="即将到期"
      />
      <ScCard
        layout="stats-simple"
        theme="blue"
        icon="mdi:timer-sand"
        :value="stats.pendingCount"
        label="待验证"
      />
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
        <CertList ref="certListRef" @copy="handleCopyCert" />
      </div>
      <!-- 账户管理内容 -->
      <div class="tab-content" v-show="activeTab === 'accounts'">
        <AccountList ref="accountListRef" />
      </div>
    </div>

    <!-- 申请证书对话框 -->
    <ApplyCertDialog
      v-model:visible="applyDialogVisible"
      :init-data="applyInitData"
      @success="handleApplySuccess"
      @view-cert="handleViewCert"
    />

    <!-- 添加账户对话框 -->
    <AccountDialog
      v-model:visible="accountDialogVisible"
      @success="handleAccountSuccess"
    />

    <!-- 证书详情对话框 -->
    <CertDetailDialog
      v-model:visible="detailDialogVisible"
      :cert-id="currentCertId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ScCard } from "@repo/components";
import { getCertStats, type AcmeCertStats, type AcmeCertificate } from "@/api/acme";
import CertList from "./components/CertList.vue";
import AccountList from "./components/AccountList.vue";
import ApplyCertDialog from "./components/ApplyCertDialog.vue";
import AccountDialog from "./components/AccountDialog.vue";
import CertDetailDialog from "./components/CertDetailDialog.vue";

defineOptions({
  name: "AcmeCertManagement",
});

const activeTab = ref("certs");
const certListRef = ref();
const accountListRef = ref();
const applyDialogVisible = ref(false);
const accountDialogVisible = ref(false);
const applyInitData = ref<Partial<AcmeCertificate>>();
const detailDialogVisible = ref(false);
const currentCertId = ref<number>(0);

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
  applyInitData.value = undefined;
  applyDialogVisible.value = true;
}

/**
 * 复制证书申请
 */
function handleCopyCert(cert: AcmeCertificate) {
  applyInitData.value = cert;
  applyDialogVisible.value = true;
}

/**
 * 查看证书详情
 */
function handleViewCert(certId: number) {
  currentCertId.value = certId;
  detailDialogVisible.value = true;
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
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.acme-container {
  @include system-container;
  @include modern-bg;
  @include flex-column;
  gap: $spacing-lg;
  padding: $padding-container;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;

  @include respond-to(lg) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include respond-to(sm) {
    grid-template-columns: 1fr;
  }
}

/* 主卡片 */
.main-card {
  @include card-style;
  flex: 1;
  @include flex-column;
  min-height: 0;
  overflow: hidden;

  .tabs-header {
    @include flex-between;
    padding: $spacing-md $spacing-xl 0;
    border-bottom: 1px solid $border-light;
  }

  .tabs-actions {
    @include flex-align-center;
    gap: $spacing-md;
    padding-bottom: $spacing-md;

    .el-button {
      @include flex-align-center;
      gap: $spacing-sm;
      border-radius: $radius-md;
    }
  }

  .tab-content {
    flex: 1;
    padding: $spacing-lg $spacing-xl;
    @include flex-column;
    min-height: 0;
    overflow: hidden;
  }
}

/* 自定义标签页 */
.custom-tabs {
  @include flex-align-center;
  gap: $spacing-sm;
}

.tab-item {
  @include flex-align-center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-xl;
  font-size: $font-md;
  font-weight: $font-weight-medium;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all $duration-normal $ease-standard;

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
    padding: 0 $spacing-sm;
    font-size: 11px;
    font-weight: $font-weight-semibold;
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
@include respond-to(md) {
  .main-card .tabs-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;

    .custom-tabs {
      justify-content: center;
    }

    .tabs-actions {
      justify-content: center;
    }
  }
}
</style>
