<template>
  <div class="node-maintenance system-container modern-bg">
    <!-- 节点选择 -->
    <ScCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">节点维护</span>
        </div>
      </template>
      <div class="flex items-center gap-4">
        <ScInput
          v-model="nodeInfo.ipAddress"
          placeholder="节点IP地址"
          style="width: 200px"
        />
        <ScInputNumber
          v-model="nodeInfo.port"
          :min="1"
          :max="65535"
          placeholder="端口"
          style="width: 120px"
        />
        <ScTooltip content="连接节点" placement="top">
          <ScButton type="primary" :icon="Connection" @click="connectNode" />
        </ScTooltip>
      </div>
      <div v-if="connected" class="mt-3">
        <ScTag type="success">
          <IconifyIconOnline icon="ep:success-filled" class="mr-1" />
          已连接: {{ upgradeStatus?.applicationName }} ({{
            upgradeStatus?.currentVersion
          }})
        </ScTag>
      </div>
    </ScCard>

    <!-- 功能标签页 -->
    <ScTabs v-model="activeTab" type="border-card">
      <!-- 备份管理 -->
      <ScTabPane label="备份管理" name="backup">
        <div class="mb-4 flex items-center gap-4">
          <ScInput
            v-model="backupDescription"
            placeholder="备份描述"
            style="width: 300px"
          />
          <ScTooltip content="创建备份" placement="top">
            <ScButton
              type="primary"
              :icon="Plus"
              :loading="creating"
              :disabled="!connected"
              @click="createBackup"
            />
          </ScTooltip>
          <ScTooltip content="刷新列表" placement="top">
            <ScButton
              type="primary"
              :icon="Refresh"
              :disabled="!connected"
              @click="loadBackups"
            />
          </ScTooltip>
        </div>

        <ScTable
          :url="backupTableUrl"
          :columns="backupColumns"
          :pagination="false"
        >
          <template #operation="{ row }">
            <ScTooltip content="查看" placement="top">
              <ScButton
                type="primary"
                link
                :icon="View"
                @click="viewBackup(row)"
              />
            </ScTooltip>
            <ScTooltip content="还原" placement="top">
              <ScButton
                type="warning"
                link
                :icon="RefreshLeft"
                @click="previewRestore(row)"
              />
            </ScTooltip>
            <ScTooltip content="删除" placement="top">
              <ScButton
                type="danger"
                link
                :icon="Delete"
                @click="deleteBackup(row)"
              />
            </ScTooltip>
          </template>
        </ScTable>
      </ScTabPane>

      <!-- 升级管理 -->
      <ScTabPane label="升级管理" name="upgrade">
        <div class="mb-4 flex items-center gap-4">
          <ScUpload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".jar,.zip"
            :on-change="handleFileChange"
          >
            <ScButton :icon="Upload" :disabled="!connected"
              >选择升级包</ScButton
            >
          </ScUpload>
          <span v-if="selectedFile" class="text-sm text-gray-500">
            {{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})
          </span>
          <ScButton
            type="primary"
            :loading="uploading"
            :disabled="!selectedFile || !connected"
            @click="uploadPackage"
          >
            上传
          </ScButton>
          <ScTooltip content="刷新列表" placement="top">
            <ScButton
              type="primary"
              :icon="Refresh"
              :disabled="!connected"
              @click="loadUpgradePackages"
            />
          </ScTooltip>
        </div>

        <!-- 当前版本信息 -->
        <ScDescriptions v-if="upgradeStatus" :column="3" border class="mb-4">
          <ScDescriptionsItem label="应用名称">
            {{ upgradeStatus.applicationName }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="当前版本">
            {{ upgradeStatus.currentVersion }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="JAR大小">
            {{ formatSize(upgradeStatus.jarSize) }}
          </ScDescriptionsItem>
        </ScDescriptions>

        <ScTable
          :url="upgradeTableUrl"
          :columns="upgradeColumns"
          :pagination="false"
        >
          <template #operation="{ row }">
            <ScPopconfirm
              title="确定要执行升级吗？升级前会自动备份当前配置"
              @confirm="executeUpgrade(row)"
            >
              <template #reference>
                <ScButton type="primary" link :icon="Upload">
                  执行升级
                </ScButton>
              </template>
            </ScPopconfirm>
          </template>
        </ScTable>
      </ScTabPane>

      <!-- 还原管理 -->
      <ScTabPane label="还原预览" name="restore">
        <div v-if="!restorePreview" class="text-center text-gray-500 py-10">
          请在备份管理中选择一个备份进行还原预览
        </div>
        <div v-else>
          <ScDescriptions :column="2" border class="mb-4">
            <ScDescriptionsItem label="备份时间">
              {{ formatTime(restorePreview.backupTime) }}
            </ScDescriptionsItem>
            <ScDescriptionsItem label="备份描述">
              {{ restorePreview.description }}
            </ScDescriptionsItem>
            <ScDescriptionsItem label="差异项数">
              <ScTag
                :type="
                  restorePreview.differenceCount > 0 ? 'warning' : 'success'
                "
              >
                {{ restorePreview.differenceCount }}
              </ScTag>
            </ScDescriptionsItem>
          </ScDescriptions>

          <ScTable
            :data="restorePreview.differences"
            border
            stripe
            max-height="400"
          >
            <ScTableColumn prop="key" label="配置项" min-width="200" />
            <ScTableColumn
              prop="currentValue"
              label="当前值"
              min-width="150"
            />
            <ScTableColumn
              prop="backupValue"
              label="备份值"
              min-width="150"
            />
            <ScTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ScTag
                  :type="row.status === '新增' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.status }}
                </ScTag>
              </template>
            </ScTableColumn>
          </ScTable>

          <div class="mt-4 text-right">
            <ScPopconfirm
              title="确定要还原配置吗？部分配置需要重启后生效"
              @confirm="executeRestore"
            >
              <template #reference>
                <ScButton type="primary" :loading="restoring">
                  执行还原
                </ScButton>
              </template>
            </ScPopconfirm>
          </div>
        </div>
      </ScTabPane>
    </ScTabs>

    <!-- 备份内容查看对话框 -->
    <sc-dialog v-model="viewDialogVisible" title="备份内容" width="70%">
      <ScInput
        v-model="backupContentJson"
        type="textarea"
        :rows="20"
        readonly
      />
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Connection,
  Plus,
  Refresh,
  View,
  Delete,
  Upload,
  RefreshLeft,
} from "@element-plus/icons-vue";
import { message } from "@repo/utils";
import {
  createBackupForMaintenance,
  listBackupsForMaintenance,
  deleteBackupForMaintenance,
  getBackupContentForMaintenance,
  listUpgradePackagesForMaintenance,
  uploadUpgradePackageForMaintenance,
  executeUpgradeForMaintenance,
  getUpgradeStatusForMaintenance,
  previewRestoreForMaintenance,
  executeRestoreForMaintenance,
  type BackupInfo,
  type UpgradePackageInfo,
  type UpgradeStatus,
  type RestorePreview,
} from "@/api/server/node-maintenance";

defineOptions({ name: "NodeMaintenance" });

const nodeInfo = ref({ ipAddress: "", port: 8080 });
const connected = ref(false);
const activeTab = ref("backup");

// 备份相关
const backupDescription = ref("");
const creating = ref(false);
const backups = ref<BackupInfo[]>([]);
const viewDialogVisible = ref(false);
const backupContentJson = ref("");

// 升级相关
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const upgradeStatus = ref<UpgradeStatus | null>(null);
const upgradePackages = ref<UpgradePackageInfo[]>([]);

// 还原相关
const restorePreview = ref<RestorePreview | null>(null);
const restoreFileName = ref("");
const restoring = ref(false);

// 备份表格列
const backupColumns = [
  { prop: "fileName", label: "文件名", minWidth: 250 },
  { prop: "description", label: "描述", minWidth: 150 },
  {
    prop: "backupTime",
    label: "备份时间",
    width: 180,
    formatter: (row: BackupInfo) => formatTime(row.backupTime),
  },
  {
    prop: "size",
    label: "大小",
    width: 100,
    formatter: (row: BackupInfo) => formatSize(row.size),
  },
  { prop: "operation", label: "操作", width: 150, slot: "operation" },
];

// 升级包表格列
const upgradeColumns = [
  { prop: "fileName", label: "文件名", minWidth: 300 },
  {
    prop: "size",
    label: "大小",
    width: 120,
    formatter: (row: UpgradePackageInfo) => formatSize(row.size),
  },
  {
    prop: "lastModified",
    label: "上传时间",
    width: 180,
    formatter: (row: UpgradePackageInfo) => formatTime(row.lastModified),
  },
  { prop: "operation", label: "操作", width: 120, slot: "operation" },
];

// 表格 URL 函数
const backupTableUrl = computed(() => {
  if (!connected.value) return () => Promise.resolve({ data: [] });
  return async () => {
    const res = await listBackupsForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
    );
    backups.value = res.data || [];
    return { data: res.data || [] };
  };
});

const upgradeTableUrl = computed(() => {
  if (!connected.value) return () => Promise.resolve({ data: [] });
  return async () => {
    const res = await listUpgradePackagesForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
    );
    upgradePackages.value = res.data || [];
    return { data: res.data || [] };
  };
});

/**
 * 连接节点
 */
const connectNode = async () => {
  if (!nodeInfo.value.ipAddress || !nodeInfo.value.port) {
    message("请输入节点IP和端口", { type: "warning" });
    return;
  }

  try {
    const res = await getUpgradeStatusForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
    );
    upgradeStatus.value = res.data;
    connected.value = true;
    message("连接成功", { type: "success" });
    loadBackups();
    loadUpgradePackages();
  } catch {
    message("连接失败，请检查节点是否在线", { type: "error" });
  }
};

/**
 * 加载备份列表
 */
const loadBackups = async () => {
  if (!connected.value) return;
  try {
    const res = await listBackupsForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
    );
    backups.value = res.data || [];
  } catch {
    message("加载备份列表失败", { type: "error" });
  }
};

/**
 * 创建备份
 */
const createBackup = async () => {
  creating.value = true;
  try {
    await createBackupForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      backupDescription.value || "手动备份",
    );
    message("备份创建成功", { type: "success" });
    backupDescription.value = "";
    loadBackups();
  } catch {
    message("备份创建失败", { type: "error" });
  } finally {
    creating.value = false;
  }
};

/**
 * 查看备份内容
 */
const viewBackup = async (row: BackupInfo) => {
  try {
    const res = await getBackupContentForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      row.fileName,
    );
    backupContentJson.value = JSON.stringify(res.data, null, 2);
    viewDialogVisible.value = true;
  } catch {
    message("获取备份内容失败", { type: "error" });
  }
};

/**
 * 删除备份
 */
const deleteBackup = async (row: BackupInfo) => {
  try {
    await deleteBackupForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      row.fileName,
    );
    message("删除成功", { type: "success" });
    loadBackups();
  } catch {
    message("删除失败", { type: "error" });
  }
};

/**
 * 加载升级包列表
 */
const loadUpgradePackages = async () => {
  if (!connected.value) return;
  try {
    const res = await listUpgradePackagesForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
    );
    upgradePackages.value = res.data || [];
  } catch {
    message("加载升级包列表失败", { type: "error" });
  }
};

/**
 * 文件选择变化
 */
const handleFileChange = (file: { raw?: File }) => {
  if (file.raw) {
    selectedFile.value = file.raw;
  }
};

/**
 * 上传升级包
 */
const uploadPackage = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await uploadUpgradePackageForMaintenance(
        nodeInfo.value.ipAddress,
        nodeInfo.value.port,
        selectedFile.value!.name,
        base64,
      );
      message("上传成功", { type: "success" });
      selectedFile.value = null;
      loadUpgradePackages();
      uploading.value = false;
    };
    reader.readAsDataURL(selectedFile.value);
  } catch {
    message("上传失败", { type: "error" });
    uploading.value = false;
  }
};

/**
 * 执行升级
 */
const executeUpgrade = async (row: UpgradePackageInfo) => {
  try {
    await executeUpgradeForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      row.fileName,
      true,
      true,
    );
    message("升级成功，节点即将重启", { type: "success" });
  } catch {
    message("升级失败", { type: "error" });
  }
};

/**
 * 预览还原
 */
const previewRestore = async (row: BackupInfo) => {
  try {
    const res = await previewRestoreForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      row.fileName,
    );
    restorePreview.value = res.data;
    restoreFileName.value = row.fileName;
    activeTab.value = "restore";
  } catch {
    message("获取还原预览失败", { type: "error" });
  }
};

/**
 * 执行还原
 */
const executeRestore = async () => {
  restoring.value = true;
  try {
    await executeRestoreForMaintenance(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      restoreFileName.value,
    );
    message("还原成功，部分配置需要重启后生效", { type: "success" });
    restorePreview.value = null;
    activeTab.value = "backup";
  } catch {
    message("还原失败", { type: "error" });
  } finally {
    restoring.value = false;
  }
};

/**
 * 格式化时间
 */
const formatTime = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
};

/**
 * 格式化文件大小
 */
const formatSize = (bytes?: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
};
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

.node-maintenance {
  padding: 20px;
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
