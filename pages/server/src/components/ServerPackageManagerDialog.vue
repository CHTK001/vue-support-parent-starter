<template>
  <ScDialog
    :model-value="modelValue"
    :title="`包管理器 - ${hostName}`"
    width="960px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-pkg-dialog">
      <!-- 包管理器不可用警告 -->
      <div
        v-if="pkgManagerInfo && !pkgManagerInfo.available"
        class="server-pkg-dialog__warning"
      >
        <div class="server-pkg-dialog__warning-icon">&#9888;</div>
        <div class="server-pkg-dialog__warning-content">
          <strong>包管理器不可用</strong>
          <p>{{ pkgManagerInfo.message || "远程服务器上未检测到可用的包管理器（winget / apt）" }}</p>
          <p v-if="pkgManagerInfo.osType" class="server-pkg-dialog__warning-os">
            操作系统：{{ pkgManagerInfo.osType }}
          </p>
        </div>
      </div>

      <!-- 包管理器信息栏 -->
      <div
        v-if="pkgManagerInfo && pkgManagerInfo.available"
        class="server-pkg-dialog__info-bar"
      >
        <div class="server-pkg-dialog__info-item">
          <span class="server-pkg-dialog__info-label">管理器</span>
          <strong>{{ pkgManagerInfo.name || "-" }}</strong>
        </div>
        <div class="server-pkg-dialog__info-item">
          <span class="server-pkg-dialog__info-label">版本</span>
          <strong>{{ pkgManagerInfo.version || "-" }}</strong>
        </div>
        <div class="server-pkg-dialog__info-item">
          <span class="server-pkg-dialog__info-label">系统</span>
          <strong>{{ pkgManagerInfo.osType || "-" }}</strong>
        </div>
        <div class="server-pkg-dialog__info-actions">
          <ScButton :loading="refreshing" @click="handleRefresh">
            刷新
          </ScButton>
          <ScButton
            type="danger"
            :loading="upgradingAll"
            :disabled="upgradablePackages.length === 0"
            @click="confirmUpgradeAll"
          >
            全部升级
          </ScButton>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="server-pkg-dialog__tabs">
        <!-- Tab 1: 可更新包 -->
        <el-tab-pane label="可更新包" name="upgradable">
          <div class="server-pkg-dialog__table-container">
            <el-table
              :data="upgradablePackages"
              v-loading="loadingUpgradable"
              stripe
              empty-text="暂无可用更新"
              style="width: 100%"
              @row-click="handleRowClick"
            >
              <el-table-column prop="name" label="包名" min-width="160" show-overflow-tooltip />
              <el-table-column prop="installedVersion" label="当前版本" width="130" />
              <el-table-column prop="latestVersion" label="最新版本" width="130" />
              <el-table-column prop="source" label="源" width="100" />
              <el-table-column prop="architecture" label="架构" width="80" />
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <ScButton
                    size="small"
                    type="primary"
                    :loading="upgradingMap[row.name]"
                    @click.stop="handleUpgrade(row.name)"
                  >
                    升级
                  </ScButton>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 已安装包 -->
        <el-tab-pane label="已安装包" name="installed">
          <div class="server-pkg-dialog__search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索已安装的包..."
              clearable
              prefix-icon="Search"
              class="server-pkg-dialog__search-input"
            />
          </div>
          <div class="server-pkg-dialog__table-container">
            <el-table
              :data="installedPackages"
              v-loading="loadingInstalled"
              stripe
              empty-text="暂无已安装包"
              style="width: 100%"
            >
              <el-table-column prop="name" label="包名" min-width="160" show-overflow-tooltip />
              <el-table-column prop="version" label="版本" width="130" />
              <el-table-column prop="source" label="源" width="100" />
              <el-table-column prop="architecture" label="架构" width="80" />
              <el-table-column prop="size" label="大小" width="100" />
              <el-table-column prop="installDate" label="安装日期" width="120" />
              <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="server-pkg-dialog__footer">
        <ScButton @click="emit('update:modelValue', false)">关闭</ScButton>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { ScDialog } from "@repo/components/ScDialog";
import { ScButton } from "@repo/components/ScButton";
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  checkPackageManager,
  listUpgradablePackages,
  upgradePackage,
  upgradeAllPackages,
  listInstalledPackages,
} from "../api";
import type {
  PackageManagerInfo,
  UpgradablePackage,
  InstalledPackage,
  PackageUpgradeResult,
} from "../api/types";

defineOptions({ name: "ServerPackageManagerDialog" });

const props = defineProps<{
  modelValue: boolean;
  hostId: number;
  hostName: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const activeTab = ref("upgradable");
const pkgManagerInfo = ref<PackageManagerInfo | null>(null);
const upgradablePackages = ref<UpgradablePackage[]>([]);
const installedPackages = ref<InstalledPackage[]>([]);
const loadingUpgradable = ref(false);
const loadingInstalled = ref(false);
const refreshing = ref(false);
const upgradingAll = ref(false);
const upgradingMap = ref<Record<string, boolean>>({});
const searchKeyword = ref("");

let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ── 初始化 ────────────────────────────────────────────
const init = async () => {
  try {
    const res = await checkPackageManager(props.hostId);
    pkgManagerInfo.value = res.data;
    if (res.data.available) {
      await Promise.all([loadUpgradablePackages(), loadInstalledPackages()]);
    }
  } catch {
    pkgManagerInfo.value = {
      available: false,
      message: "无法连接到服务器，请检查网络或服务器状态",
    };
    ElMessage.error("获取包管理器信息失败");
  }
};

// ── 加载可更新包 ─────────────────────────────────────
const loadUpgradablePackages = async () => {
  loadingUpgradable.value = true;
  try {
    const res = await listUpgradablePackages(props.hostId);
    upgradablePackages.value = res.data || [];
  } catch {
    ElMessage.error("获取可更新包列表失败");
  } finally {
    loadingUpgradable.value = false;
  }
};

// ── 加载已安装包 ─────────────────────────────────────
const loadInstalledPackages = async () => {
  loadingInstalled.value = true;
  try {
    const keyword = searchKeyword.value || undefined;
    const res = await listInstalledPackages(props.hostId, keyword);
    installedPackages.value = res.data || [];
  } catch {
    ElMessage.error("获取已安装包列表失败");
  } finally {
    loadingInstalled.value = false;
  }
};

// ── 刷新 ─────────────────────────────────────────────
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    const res = await checkPackageManager(props.hostId);
    pkgManagerInfo.value = res.data;
    if (res.data.available) {
      await Promise.all([loadUpgradablePackages(), loadInstalledPackages()]);
    }
    ElMessage.success("刷新成功");
  } catch {
    ElMessage.error("刷新失败");
  } finally {
    refreshing.value = false;
  }
};

// ── 升级单个包 ───────────────────────────────────────
const handleUpgrade = async (packageName: string) => {
  upgradingMap.value[packageName] = true;
  try {
    const res = await upgradePackage(props.hostId, packageName);
    if (res.data?.success) {
      ElMessage.success(`"${packageName}" 升级成功`);
      await Promise.all([loadUpgradablePackages(), loadInstalledPackages()]);
    } else {
      ElMessage.warning(res.data?.message || `"${packageName}" 升级未返回成功状态`);
    }
  } catch {
    ElMessage.error(`"${packageName}" 升级失败`);
  } finally {
    upgradingMap.value[packageName] = false;
  }
};

// ── 全部升级 ─────────────────────────────────────────
const confirmUpgradeAll = () => {
  ElMessageBox.confirm(
    `确定要对 "${hostName}" 上的 ${upgradablePackages.value.length} 个包执行全部升级吗？`,
    "全部升级确认",
    {
      confirmButtonText: "确定升级",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: false,
    },
  )
    .then(() => doUpgradeAll())
    .catch(() => {
      // 用户取消操作
    });
};

const doUpgradeAll = async () => {
  upgradingAll.value = true;
  try {
    const res = await upgradeAllPackages(props.hostId);
    const results = res.data || [];
    const successCount = results.filter((r: PackageUpgradeResult) => r.success).length;
    const failCount = results.length - successCount;
    if (failCount === 0) {
      ElMessage.success(`全部升级完成，共 ${results.length} 个包`);
    } else {
      ElMessage.warning(`升级完成：${successCount} 成功，${failCount} 失败`);
      const failedNames = results
        .filter((r: PackageUpgradeResult) => !r.success)
        .map((r: PackageUpgradeResult) => r.name)
        .join("、");
      const failedMessages = results
        .filter((r: PackageUpgradeResult) => !r.success && r.message)
        .map((r: PackageUpgradeResult) => `${r.name}: ${r.message}`)
        .join("\n");
      ElMessageBox.alert(
        failedMessages || `以下包升级失败：${failedNames}`,
        "升级失败详情",
        { confirmButtonText: "知道了", type: "error" },
      );
    }
    await Promise.all([loadUpgradablePackages(), loadInstalledPackages()]);
  } catch {
    ElMessage.error("全部升级操作失败");
  } finally {
    upgradingAll.value = false;
  }
};

// ── 搜索防抖 ─────────────────────────────────────────
watch(searchKeyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    loadInstalledPackages();
  }, 400);
});

// ── 行点击（可更新包） ──────────────────────────────
const handleRowClick = (row: UpgradablePackage) => {
  handleUpgrade(row.name);
};

// ── 打开时初始化 ─────────────────────────────────────
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      activeTab.value = "upgradable";
      searchKeyword.value = "";
      pkgManagerInfo.value = null;
      upgradablePackages.value = [];
      installedPackages.value = [];
      init();
    }
  },
);
</script>

<style scoped lang="scss">
.server-pkg-dialog {
  display: grid;
  gap: 16px;
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding-bottom: 4px;
}

// ── 警告横幅 ──────────────────────────────────────
.server-pkg-dialog__warning {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 20px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.server-pkg-dialog__warning-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(251, 191, 36, 0.2);
  color: #b45309;
  font-size: 18px;
  font-weight: 700;
}

.server-pkg-dialog__warning-content {
  display: grid;
  gap: 4px;

  strong {
    color: #92400e;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: #a16207;
    font-size: 13px;
    line-height: 1.6;
  }
}

.server-pkg-dialog__warning-os {
  font-size: 12px;
  opacity: 0.8;
}

// ── 信息栏 ────────────────────────────────────────
.server-pkg-dialog__info-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 18px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, rgba(148, 163, 184, 0.18));
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-pkg-dialog__info-item {
  display: grid;
  gap: 2px;

  .server-pkg-dialog__info-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  strong {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.server-pkg-dialog__info-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

// ── 标签页 ────────────────────────────────────────
.server-pkg-dialog__tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  :deep(.el-tabs__item) {
    font-size: 13px;
    font-weight: 600;
  }
}

// ── 搜索栏 ────────────────────────────────────────
.server-pkg-dialog__search-bar {
  margin-bottom: 12px;
}

.server-pkg-dialog__search-input {
  max-width: 360px;
}

// ── 表格容器 ──────────────────────────────────────
.server-pkg-dialog__table-container {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 8%, rgba(148, 163, 184, 0.12));
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.04), transparent 24%),
    color-mix(in srgb, var(--el-bg-color-page) 94%, white);

  :deep(.el-table) {
    --el-table-border-color: transparent;
    --el-table-header-background-color: transparent;

    th.el-table__cell {
      background: transparent;
      font-weight: 600;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    td.el-table__cell {
      font-size: 13px;
    }

    .el-table__inner-wrapper::before {
      display: none;
    }

    .el-table__body-wrapper {
      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }
  }
}

// ── 底部 ──────────────────────────────────────────
.server-pkg-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
