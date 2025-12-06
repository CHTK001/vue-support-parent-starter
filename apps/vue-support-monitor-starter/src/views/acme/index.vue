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
import ScCard from "@repo/components/ScCard/index.vue";
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
  }
}
</style>
