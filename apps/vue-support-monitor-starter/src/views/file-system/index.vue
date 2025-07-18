<template>
  <div class="file-system-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:file-list-3-line" class="mr-2" />
          文件管理
        </h2>
        <p class="page-description">分片上传、文件管理、HTTP访问控制</p>
      </div>
      <div class="header-right">
        <!-- WebSocket连接状态 -->
        <div class="connection-status">
          <el-tooltip :content="connectionStatusText" placement="bottom">
            <div class="status-indicator" :class="connectionStatusClass">
              <IconifyIconOnline
                :icon="connectionStatusIcon"
                class="status-icon"
              />
              <span class="status-text">{{ connectionStatusText }}</span>
            </div>
          </el-tooltip>
        </div>

        <el-button @click="showSettingsDialog = true">
          <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
          设置
        </el-button>
        <el-button @click="showMD5TestDialog = true">
          <IconifyIconOnline icon="ri:shield-check-line" class="mr-1" />
          MD5测试
        </el-button>
        <el-button type="primary" @click="showUploadDialog = true">
          <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
          上传文件
        </el-button>
        <el-button @click="refreshData">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button @click="showDebugInfo = !showDebugInfo">
          <IconifyIconOnline icon="ri:bug-line" class="mr-1" />
          调试
        </el-button>
      </div>
    </div>

    <!-- 调试信息面板 -->
    <div v-if="showDebugInfo" class="debug-panel">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>SSE连接调试信息</span>
            <el-button @click="testSSEConnection" type="primary" size="small">
              测试连接
            </el-button>
            <el-button @click="testBackendAPI" type="success" size="small">
              测试后端API
            </el-button>
          </div>
        </template>
        <div class="debug-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="连接状态">
              {{ connectionStatusText }}
            </el-descriptions-item>
            <el-descriptions-item label="客户端ID">
              {{ sseState.clientId || "未分配" }}
            </el-descriptions-item>
            <el-descriptions-item label="连接中">
              {{ sseState.connecting ? "是" : "否" }}
            </el-descriptions-item>
            <el-descriptions-item label="已连接">
              {{ sseState.connected ? "是" : "否" }}
            </el-descriptions-item>
            <el-descriptions-item label="重连次数">
              {{ sseState.reconnectAttempts }}
            </el-descriptions-item>
            <el-descriptions-item label="最后心跳">
              {{
                sseState.lastHeartbeat
                  ? new Date(sseState.lastHeartbeat).toLocaleString()
                  : "无"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="错误信息" :span="2">
              {{ sseState.error || "无" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <IconifyIconOnline icon="ri:file-list-line" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalFiles }}</div>
              <div class="stat-label">总文件数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card size">
            <div class="stat-icon">
              <IconifyIconOnline icon="ri:hard-drive-line" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ formatFileSize(statistics.totalSize) }}
              </div>
              <div class="stat-label">总大小</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card completed">
            <div class="stat-icon">
              <IconifyIconOnline icon="ri:checkbox-circle-line" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.completedFiles }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card failed">
            <div class="stat-icon">
              <IconifyIconOnline icon="ri:error-warning-line" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.failedFiles }}</div>
              <div class="stat-label">失败</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 分组树和文件列表 -->
    <div class="content-layout">
      <!-- 左侧分组树 -->
      <div class="group-tree-container">
        <div class="group-tree-header">
          <h3>文件分组</h3>
          <el-button type="primary" size="small" @click="handleCreateGroup">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            新建分组
          </el-button>
        </div>
        <div class="group-tree-content">
          <el-tree
            ref="groupTreeRef"
            :data="groupTree"
            :props="groupTreeProps"
            node-key="fileSystemGroupId"
            :default-expand-all="true"
            :highlight-current="true"
            @node-click="handleGroupSelect"
          >
            <template #default="{ data }">
              <div class="group-tree-node">
                <IconifyIconOnline
                  :icon="data.fileSystemGroupIcon || 'ri:folder-line'"
                  :style="{ color: data.fileSystemGroupColor || '#409EFF' }"
                  class="mr-2"
                />
                <span class="group-name">{{ data.fileSystemGroupName }}</span>
                <span class="file-count">({{ data.fileCount || 0 }})</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧文件列表 -->
      <div class="file-list-container">
        <div class="list-header">
          <div class="search-bar">
            <el-input
              v-model="searchQuery.fileName"
              placeholder="搜索文件名..."
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-select
              v-model="searchQuery.fileStatus"
              placeholder="文件状态"
              clearable
              @change="handleSearch"
            >
              <el-option label="全部" :value="null" />
              <el-option label="待合并" :value="0" />
              <el-option label="合并中" :value="1" />
              <el-option label="已完成" :value="2" />
              <el-option label="合并失败" :value="3" />
            </el-select>
            <el-button type="primary" @click="handleSearch">
              <IconifyIconOnline icon="ri:search-line" class="mr-1" />
              搜索
            </el-button>
          </div>
          <div class="list-actions">
            <el-button
              type="primary"
              :disabled="!selectedFiles.length"
              @click="showMoveToGroupDialog = true"
            >
              <IconifyIconOnline icon="ri:folder-transfer-line" class="mr-1" />
              移动到分组
            </el-button>
            <el-button
              type="danger"
              :disabled="!selectedFiles.length"
              @click="handleBatchDelete"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              批量删除
            </el-button>
            <el-button @click="handleCleanExpired">
              <IconifyIconOnline icon="ri:delete-bin-2-line" class="mr-1" />
              清理过期
            </el-button>
          </div>
        </div>

        <!-- 文件表格 -->
        <div class="file-table">
          <ScTable
            ref="tableRef"
            :url="getFileSystemPage"
            :params="searchQuery"
            table-name="file-system"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="文件名" min-width="200">
              <template #default="{ row }">
                <div class="file-name-cell">
                  <IconifyIconOnline
                    :icon="getFileIcon(row.fileSystemType)"
                    class="file-icon"
                  />
                  <span class="file-name" :title="row.fileSystemName">
                    {{ row.fileSystemName }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="文件大小" width="120" align="right">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSystemSize) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.fileSystemStatus)">
                  {{ getStatusText(row.fileSystemStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="150">
              <template #default="{ row }">
                <div v-if="row.fileSystemChunkTotal > 0" class="progress-cell">
                  <el-progress
                    :percentage="
                      Math.round(
                        (row.fileSystemChunkUploaded /
                          row.fileSystemChunkTotal) *
                          100
                      )
                    "
                    :status="getProgressStatus(row.fileSystemStatus)"
                    :stroke-width="6"
                  />
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="HTTP访问" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.fileSystemHttpAccessEnabled"
                  :disabled="row.fileSystemStatus !== 2"
                  @change="handleToggleHttpAccess(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.fileSystemStatus === 2"
                  size="small"
                  type="primary"
                  @click="handleDownload(row)"
                >
                  下载
                </el-button>
                <el-button
                  v-if="row.fileSystemStatus === 3"
                  size="small"
                  type="warning"
                  @click="handleRetryMerge(row)"
                >
                  重试
                </el-button>
                <el-button
                  v-if="row.fileSystemStatus === 0"
                  size="small"
                  type="success"
                  @click="handleManualMerge(row)"
                >
                  合并
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </ScTable>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <FileUploadDialog
      v-model="showUploadDialog"
      :queue-status="queueStatus"
      :on-message="onMessage"
      :MESSAGE_TYPE="MESSAGE_TYPE"
      @upload-success="handleUploadSuccess"
      @add-to-queue="handleAddToQueue"
    />

    <!-- 队列状态组件 -->
    <UploadQueueStatusComponent
      ref="queueStatusRef"
      :queue-status="queueStatus"
      @queue-update="handleQueueUpdate"
    />

    <!-- 文件系统设置对话框 -->
    <FileSystemSettings
      v-model="showSettingsDialog"
      @settings-updated="handleSettingsUpdated"
    />

    <!-- MD5测试对话框 -->
    <MD5TestDialog v-model="showMD5TestDialog" />

    <!-- 分组管理对话框 -->
    <FileSystemGroupDialog
      ref="groupDialogRef"
      v-model="showGroupDialog"
      @success="handleGroupSuccess"
    />

    <!-- 移动到分组对话框 -->
    <el-dialog
      v-model="showMoveToGroupDialog"
      title="移动文件到分组"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="move-to-group-dialog">
        <div class="selected-files-info">
          <p>已选择 {{ selectedFiles.length }} 个文件：</p>
          <div class="file-list">
            <div
              v-for="file in selectedFiles.slice(0, 5)"
              :key="file.fileSystemId"
              class="file-item"
            >
              <IconifyIconOnline
                :icon="getFileIcon(file.fileSystemType)"
                class="file-icon"
              />
              <span class="file-name">{{ file.fileSystemName }}</span>
            </div>
            <div v-if="selectedFiles.length > 5" class="more-files">
              还有 {{ selectedFiles.length - 5 }} 个文件...
            </div>
          </div>
        </div>

        <el-divider />

        <div class="group-selection">
          <p>选择目标分组：</p>
          <el-tree
            ref="moveGroupTreeRef"
            :data="groupTree"
            :props="groupTreeProps"
            node-key="fileSystemGroupId"
            :highlight-current="true"
            :expand-on-click-node="false"
            @current-change="handleMoveGroupSelect"
          >
            <template #default="{ node, data }">
              <div class="group-tree-node">
                <IconifyIconOnline
                  :icon="data.fileSystemGroupIcon || 'ri:folder-line'"
                  :style="{ color: data.fileSystemGroupColor || '#409eff' }"
                />
                <span class="group-name">{{ data.fileSystemGroupName }}</span>
                <span class="file-count">({{ data.fileCount || 0 }})</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMoveToGroupDialog = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!selectedMoveGroupId"
            :loading="moveToGroupLoading"
            @click="handleMoveToGroup"
          >
            移动
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import dayjs from "dayjs";
import type {
  FileSystem,
  FileStatistics,
  UploadQueueStatus,
} from "@/api/monitor/filesystem";
import {
  getFileSystemPage,
  getFileStatistics,
  deleteFile,
  batchDeleteFiles,
  downloadFile,
  toggleHttpAccess,
  cleanExpiredFiles,
  retryMergeTask,
  manualMergeFile,
} from "@/api/monitor/filesystem";
import {
  getGroupTree,
  migrateFilesToGroup,
  type FileSystemGroup,
} from "@/api/monitor/filesystem-group";
import { useFileSystemSSE } from "@/composables/useFileSystemSSE";
import FileUploadDialog from "./components/FileUploadDialog.vue";
import UploadQueueStatusComponent from "./components/UploadQueueStatus.vue";
import FileSystemSettings from "./components/FileSystemSettings.vue";
import MD5TestDialog from "./components/MD5TestDialog.vue";
import FileSystemGroupDialog from "./components/FileSystemGroupDialog.vue";

// SSE连接
const {
  state: sseState,
  queueStatus,
  connect: connectSSE,
  disconnect: disconnectSSE,
  onMessage,
  MESSAGE_TYPE,
} = useFileSystemSSE();

// 响应式数据
const showUploadDialog = ref(false);
const showSettingsDialog = ref(false);
const showMD5TestDialog = ref(false);
const showDebugInfo = ref(false);
const showGroupDialog = ref(false);
const showMoveToGroupDialog = ref(false);

// 分组相关数据
const groupTree = ref([]);
const groupTreeRef = ref();
const groupDialogRef = ref();
const selectedGroupId = ref(null);

// 移动到分组相关数据
const moveGroupTreeRef = ref();
const selectedMoveGroupId = ref(null);
const moveToGroupLoading = ref(false);
const groupTreeProps = {
  children: "children",
  label: "fileSystemGroupName",
};
const selectedFiles = ref<FileSystem[]>([]);
const queueStatusRef = ref();
const tableRef = ref();

// 统计信息
const statistics = ref<FileStatistics>({
  totalFiles: 0,
  totalSize: 0,
  pendingFiles: 0,
  mergingFiles: 0,
  completedFiles: 0,
  failedFiles: 0,
  httpAccessEnabledFiles: 0,
  todayUploadFiles: 0,
  todayUploadSize: 0,
  averageFileSize: 0,
  storageUsageRate: 0,
});

// 搜索条件
const searchQuery = reactive({
  fileName: "",
  fileStatus: null as number | null,
  groupId: null as number | null,
});

// SSE连接状态
const connectionStatusText = computed(() => {
  if (sseState.value.connecting) return "连接中";
  if (sseState.value.connected) return "已连接";
  if (sseState.value.error) return "连接失败";
  return "未连接";
});

const connectionStatusClass = computed(() => {
  if (sseState.value.connecting) return "status-connecting";
  if (sseState.value.connected) return "status-connected";
  if (sseState.value.error) return "status-error";
  return "status-disconnected";
});

const connectionStatusIcon = computed(() => {
  if (sseState.value.connecting) return "ri:loader-4-line";
  if (sseState.value.connected) return "ri:wifi-line";
  if (sseState.value.error) return "ri:wifi-off-line";
  return "ri:wifi-off-line";
});

/**
 * 加载分组树
 */
const loadGroupTree = async () => {
  try {
    const res = await getGroupTree();
    if (String(res.code) === "00000") {
      groupTree.value = res.data || [];
    } else {
      console.error("加载分组树失败:", res.msg);
    }
  } catch (error) {
    console.error("加载分组树异常:", error);
  }
};

/**
 * 处理分组选择
 */
const handleGroupSelect = (data: FileSystemGroup) => {
  selectedGroupId.value = data.fileSystemGroupId;
  searchQuery.groupId = data.fileSystemGroupId;

  // 重新加载文件列表
  handleSearch();

  console.log(
    "选择分组:",
    data.fileSystemGroupName,
    "ID:",
    data.fileSystemGroupId
  );
};

/**
 * 处理分组操作成功
 */
const handleGroupSuccess = () => {
  // 重新加载分组树
  loadGroupTree();
  // 重新加载文件列表
  handleSearch();
};

/**
 * 处理移动分组选择
 */
const handleMoveGroupSelect = (data: FileSystemGroup) => {
  selectedMoveGroupId.value = data?.fileSystemGroupId || null;
};

/**
 * 处理移动到分组
 */
const handleMoveToGroup = async () => {
  if (!selectedMoveGroupId.value || !selectedFiles.value.length) {
    return;
  }

  moveToGroupLoading.value = true;
  try {
    const fileIds = selectedFiles.value.map((file) => file.fileSystemId!);
    const res = await migrateFilesToGroup(fileIds, selectedMoveGroupId.value);

    if (String(res.code) === "00000") {
      ElMessage.success(`成功移动 ${res.data} 个文件到指定分组`);
      showMoveToGroupDialog.value = false;
      selectedMoveGroupId.value = null;
      selectedFiles.value = [];
      // 重新加载数据
      handleSearch();
      loadGroupTree();
    } else {
      ElMessage.error(res.msg || "移动文件失败");
    }
  } catch (error) {
    console.error("移动文件到分组失败:", error);
    ElMessage.error("移动文件失败");
  } finally {
    moveToGroupLoading.value = false;
  }
};

/**
 * 处理创建分组
 */
const handleCreateGroup = () => {
  groupDialogRef.value?.openCreate();
};

// 生命周期
onMounted(() => {
  loadStatistics();
  loadGroupTree(); // 加载分组树
  connectSSE(); // 连接SSE

  // 注册SSE消息处理器
  onMessage(MESSAGE_TYPE.UPLOAD_COMPLETED, () => {
    refreshData();
  });

  onMessage(MESSAGE_TYPE.MERGE_COMPLETED, () => {
    refreshData();
  });

  onMessage(MESSAGE_TYPE.FILE_DELETED, () => {
    refreshData();
  });
});

onUnmounted(() => {
  disconnectSSE(); // 断开SSE连接
});

/**
 * 加载统计信息
 */
const loadStatistics = async () => {
  try {
    console.log("正在加载文件系统统计信息...");
    const res = await getFileStatistics();
    console.log("统计信息API响应:", res);

    if (String(res.code) === "00000" && res.data) {
      statistics.value = res.data;
      console.log("统计信息数据:", statistics.value);
    } else {
      console.error("统计信息API返回错误:", res);
    }
  } catch (error) {
    console.error("加载统计信息失败:", error);
  }
};

/**
 * 刷新数据
 */
const refreshData = () => {
  tableRef.value?.refresh();
  loadStatistics();
};

/**
 * 搜索处理
 */
const handleSearch = () => {
  tableRef.value?.refresh();
};

// 监听搜索条件变化，自动刷新表格
watch(
  () => searchQuery,
  () => {
    tableRef.value?.refresh();
  },
  { deep: true }
);

/**
 * 选择变化
 */
const handleSelectionChange = (selection: FileSystem[]) => {
  selectedFiles.value = selection;
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime: string) => {
  return dateTime ? dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss") : "-";
};

/**
 * 获取文件图标
 */
const getFileIcon = (fileType: string) => {
  const iconMap: Record<string, string> = {
    image: "ri:image-line",
    video: "ri:video-line",
    audio: "ri:music-line",
    document: "ri:file-text-line",
    archive: "ri:file-zip-line",
    code: "ri:code-line",
  };
  return iconMap[fileType] || "ri:file-line";
};

/**
 * 获取状态类型
 */
const getStatusType = (
  status: number
): "success" | "warning" | "info" | "primary" | "danger" => {
  const typeMap: Record<
    number,
    "success" | "warning" | "info" | "primary" | "danger"
  > = {
    0: "warning", // 待合并
    1: "primary", // 合并中
    2: "success", // 已完成
    3: "danger", // 合并失败
  };
  return typeMap[status] || "info";
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: "待合并",
    1: "合并中",
    2: "已完成",
    3: "合并失败",
  };
  return textMap[status] || "未知";
};

/**
 * 获取进度状态
 */
const getProgressStatus = (status: number) => {
  if (status === 2) return "success";
  if (status === 3) return "exception";
  return undefined;
};

/**
 * 处理下载
 */
const handleDownload = async (file: FileSystem) => {
  try {
    const blob = await downloadFile(file.fileSystemId!);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileSystemName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success("下载成功");
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error("下载失败");
  }
};

/**
 * 处理删除
 */
const handleDelete = async (file: FileSystem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.fileSystemName}" 吗？`,
      "确认删除",
      {
        type: "warning",
      }
    );

    const res = await deleteFile(file.fileSystemId!);
    if (res.code === "00000") {
      ElMessage.success("删除成功");
      refreshData();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

/**
 * 处理批量删除
 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
      "确认批量删除",
      {
        type: "warning",
      }
    );

    const fileIds = selectedFiles.value.map((f) => f.fileSystemId!);
    const res = await batchDeleteFiles(fileIds);
    if (res.code === "00000") {
      ElMessage.success("批量删除成功");
      refreshData();
    } else {
      ElMessage.error(res.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("批量删除失败");
    }
  }
};

/**
 * 处理HTTP访问切换
 */
const handleToggleHttpAccess = async (file: FileSystem) => {
  try {
    const res = await toggleHttpAccess(
      file.fileSystemId!,
      file.fileSystemHttpAccessEnabled!
    );
    if (res.code === "00000") {
      ElMessage.success(
        file.fileSystemHttpAccessEnabled ? "已启用HTTP访问" : "已禁用HTTP访问"
      );
    } else {
      // 恢复原状态
      file.fileSystemHttpAccessEnabled = !file.fileSystemHttpAccessEnabled;
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (error) {
    // 恢复原状态
    file.fileSystemHttpAccessEnabled = !file.fileSystemHttpAccessEnabled;
    console.error("切换HTTP访问失败:", error);
    ElMessage.error("操作失败");
  }
};

/**
 * 处理清理过期文件
 */
const handleCleanExpired = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清理过期文件吗？此操作不可恢复。",
      "确认清理",
      {
        type: "warning",
      }
    );

    const res = await cleanExpiredFiles();
    if (res.code === "00000") {
      ElMessage.success(`清理完成，共清理 ${res.data} 个文件`);
      refreshData();
    } else {
      ElMessage.error(res.msg || "清理失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("清理过期文件失败:", error);
      ElMessage.error("清理失败");
    }
  }
};

/**
 * 处理重试合并
 */
const handleRetryMerge = async (file: FileSystem) => {
  try {
    const res = await retryMergeTask(file.fileSystemId!);
    if (res.code === "00000") {
      ElMessage.success("重试合并任务已提交");
      refreshData();
    } else {
      ElMessage.error(res.msg || "重试失败");
    }
  } catch (error) {
    console.error("重试合并失败:", error);
    ElMessage.error("重试失败");
  }
};

/**
 * 处理手动合并
 */
const handleManualMerge = async (file: FileSystem) => {
  try {
    const res = await manualMergeFile(file.fileSystemId!);
    if (res.code === "00000") {
      ElMessage.success("手动合并任务已提交");
      refreshData();
    } else {
      ElMessage.error(res.msg || "合并失败");
    }
  } catch (error) {
    console.error("手动合并失败:", error);
    ElMessage.error("合并失败");
  }
};

/**
 * 处理上传成功
 */
const handleUploadSuccess = () => {
  refreshData();
};

/**
 * 处理添加到队列
 */
const handleAddToQueue = (task: UploadQueueStatus) => {
  // SSE会自动更新queueStatus，这里不需要手动处理
  console.log("添加到上传队列:", task);
};

/**
 * 处理队列更新
 */
const handleQueueUpdate = (queue: UploadQueueStatus[]) => {
  // 可以在这里处理队列状态更新
  console.log("队列状态更新:", queue);
};

/**
 * 处理设置更新
 */
const handleSettingsUpdated = () => {
  ElMessage.success("设置已更新");
  // 可以在这里刷新相关数据
  loadStatistics();
};

/**
 * 测试SSE连接
 */
const testSSEConnection = async () => {
  try {
    console.log("开始测试SSE连接...");

    // 断开现有连接
    disconnectSSE();

    // 等待一秒后重新连接
    setTimeout(() => {
      console.log("重新建立SSE连接...");
      connectSSE();
    }, 1000);

    ElMessage.info("正在重新建立SSE连接...");
  } catch (error) {
    console.error("测试SSE连接失败:", error);
    ElMessage.error("测试连接失败");
  }
};

/**
 * 测试后端API连接
 */
const testBackendAPI = async () => {
  try {
    console.log("开始测试后端API连接...");

    // 测试基本的文件统计API
    const res = await getFileStatistics();
    console.log("后端API响应:", res);

    if (res.code === "00000") {
      ElMessage.success("后端API连接正常");

      // 测试SSE状态端点
      const baseUrl = "/monitor/api";
      const statusResponse = await fetch(`${baseUrl}/v1/filesystem/sse/status`);
      console.log(
        "SSE状态端点响应:",
        statusResponse.status,
        statusResponse.statusText
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log("SSE状态数据:", statusData);
        ElMessage.success("SSE状态端点也正常");
      } else {
        ElMessage.warning(`SSE状态端点返回: ${statusResponse.status}`);
      }
    } else {
      ElMessage.error(`后端API错误: ${res.msg}`);
    }
  } catch (error) {
    console.error("测试后端API失败:", error);
    ElMessage.error(`后端API连接失败: ${error.message}`);
  }
};
</script>

<style scoped lang="scss">
.file-system-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
      }

      .page-description {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .connection-status {
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          .status-icon {
            font-size: 14px;
          }

          &.status-connected {
            background: #f0f9ff;
            color: #0ea5e9;
            border: 1px solid #bae6fd;

            .status-icon {
              animation: none;
            }
          }

          &.status-connecting {
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fde68a;

            .status-icon {
              animation: spin 1s linear infinite;
            }
          }

          &.status-error,
          &.status-disconnected {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
          }

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }

  .statistics-cards {
    margin-bottom: 20px;

    .stat-card {
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        font-size: 24px;
        color: white;
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }

      &.total .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.size .stat-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.completed .stat-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.failed .stat-icon {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
    }
  }

  .content-layout {
    display: flex;
    gap: 20px;
    height: calc(100vh - 300px);
  }

  .group-tree-container {
    width: 280px;
    background: white;
    border-radius: 8px;
    padding: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .group-tree-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ebeef5;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .group-tree-content {
      flex: 1;
      overflow-y: auto;

      .group-tree-node {
        display: flex;
        align-items: center;
        width: 100%;

        .group-name {
          flex: 1;
          margin-right: 8px;
        }

        .file-count {
          font-size: 12px;
          color: #909399;
          background: #f5f7fa;
          padding: 2px 6px;
          border-radius: 10px;
        }
      }
    }
  }

  .file-list-container {
    padding: 20px;
    flex: 1;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .list-header {
      padding: 20px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .search-bar {
        display: flex;
        gap: 12px;
        align-items: center;
        flex: 1;
        min-width: 400px;

        .el-input {
          width: 200px;
        }

        .el-select {
          width: 120px;
        }
      }

      .list-actions {
        display: flex;
        gap: 12px;
      }
    }

    .file-table {
      .file-name-cell {
        display: flex;
        align-items: center;
        gap: 8px;

        .file-icon {
          font-size: 18px;
          color: #409eff;
        }

        .file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .progress-cell {
        padding: 0 8px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .file-system-page {
    padding: 10px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .header-right {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .statistics-cards {
      .el-col {
        margin-bottom: 16px;
      }
    }

    .file-list-container .list-header {
      flex-direction: column;
      align-items: stretch;

      .search-bar {
        min-width: auto;
        flex-wrap: wrap;

        .el-input,
        .el-select {
          width: 100%;
        }
      }

      .list-actions {
        justify-content: flex-end;
      }
    }
  }
}

// 移动到分组对话框样式
.move-to-group-dialog {
  .selected-files-info {
    margin-bottom: 16px;

    p {
      margin: 0 0 12px 0;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .file-list {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      padding: 8px;
      background-color: var(--el-fill-color-extra-light);

      .file-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        font-size: 13px;

        .file-icon {
          font-size: 16px;
          color: var(--el-color-primary);
        }

        .file-name {
          color: var(--el-text-color-regular);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .more-files {
        padding: 4px 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        text-align: center;
        font-style: italic;
      }
    }
  }

  .group-selection {
    p {
      margin: 0 0 12px 0;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .group-tree-node {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .group-name {
        flex: 1;
        color: var(--el-text-color-primary);
      }

      .file-count {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
