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
      </div>
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

    <!-- 文件列表 -->
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
            <el-option label="待合并" :value="1" />
            <el-option label="合并中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="合并失败" :value="4" />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" class="mr-1" />
            搜索
          </el-button>
        </div>
        <div class="list-actions">
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
                  :icon="getFileIcon(row.fileType)"
                  class="file-icon"
                />
                <span class="file-name" :title="row.fileName">
                  {{ row.fileName }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="文件大小" width="120" align="right">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.fileStatus)">
                {{ getStatusText(row.fileStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="150">
            <template #default="{ row }">
              <div v-if="row.chunkTotal > 0" class="progress-cell">
                <el-progress
                  :percentage="
                    Math.round((row.chunkUploaded / row.chunkTotal) * 100)
                  "
                  :status="getProgressStatus(row.fileStatus)"
                  :stroke-width="6"
                />
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="HTTP访问" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.httpAccessEnabled"
                :disabled="row.fileStatus !== 3"
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
                v-if="row.fileStatus === 3"
                size="small"
                type="primary"
                @click="handleDownload(row)"
              >
                下载
              </el-button>
              <el-button
                v-if="row.fileStatus === 4"
                size="small"
                type="warning"
                @click="handleRetryMerge(row)"
              >
                重试
              </el-button>
              <el-button
                v-if="row.fileStatus === 1"
                size="small"
                type="success"
                @click="handleManualMerge(row)"
              >
                合并
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </div>

    <!-- 上传对话框 -->
    <FileUploadDialog
      v-model="showUploadDialog"
      @upload-success="handleUploadSuccess"
    />

    <!-- 队列状态组件 -->
    <UploadQueueStatus ref="queueStatusRef" @queue-update="handleQueueUpdate" />

    <!-- 文件系统设置对话框 -->
    <FileSystemSettings
      v-model="showSettingsDialog"
      @settings-updated="handleSettingsUpdated"
    />

    <!-- MD5测试对话框 -->
    <MD5TestDialog v-model="showMD5TestDialog" />
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
  UploadQueueStatus as QueueStatus,
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
import { useFileSystemWebSocket } from "@/composables/useFileSystemWebSocket";
import FileUploadDialog from "./components/FileUploadDialog.vue";
import UploadQueueStatus from "./components/UploadQueueStatus.vue";
import FileSystemSettings from "./components/FileSystemSettings.vue";
import MD5TestDialog from "./components/MD5TestDialog.vue";

// WebSocket连接
const {
  state: wsState,
  connect: connectWS,
  disconnect: disconnectWS,
} = useFileSystemWebSocket();

// 响应式数据
const showUploadDialog = ref(false);
const showSettingsDialog = ref(false);
const showMD5TestDialog = ref(false);
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
});

// 搜索条件
const searchQuery = reactive({
  fileName: "",
  fileStatus: null as number | null,
});

// WebSocket连接状态
const connectionStatusText = computed(() => {
  if (wsState.value.connecting) return "连接中";
  if (wsState.value.connected) return "已连接";
  if (wsState.value.error) return "连接失败";
  return "未连接";
});

const connectionStatusClass = computed(() => {
  if (wsState.value.connecting) return "status-connecting";
  if (wsState.value.connected) return "status-connected";
  if (wsState.value.error) return "status-error";
  return "status-disconnected";
});

const connectionStatusIcon = computed(() => {
  if (wsState.value.connecting) return "ri:loader-4-line";
  if (wsState.value.connected) return "ri:wifi-line";
  if (wsState.value.error) return "ri:wifi-off-line";
  return "ri:wifi-off-line";
});

// 生命周期
onMounted(() => {
  loadStatistics();
  connectWS(); // 连接WebSocket
});

onUnmounted(() => {
  disconnectWS(); // 断开WebSocket连接
});

/**
 * 加载统计信息
 */
const loadStatistics = async () => {
  try {
    console.log("正在加载文件系统统计信息...");
    const res = await getFileStatistics();
    console.log("统计信息API响应:", res);

    if (res.code === "00000" && res.data) {
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
    1: "warning", // 待合并
    2: "primary", // 合并中
    3: "success", // 已完成
    4: "danger", // 合并失败
  };
  return typeMap[status] || "info";
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    1: "待合并",
    2: "合并中",
    3: "已完成",
    4: "合并失败",
  };
  return textMap[status] || "未知";
};

/**
 * 获取进度状态
 */
const getProgressStatus = (status: number) => {
  if (status === 3) return "success";
  if (status === 4) return "exception";
  return undefined;
};

/**
 * 处理下载
 */
const handleDownload = async (file: FileSystem) => {
  try {
    const blob = await downloadFile(file.fileId!);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
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
      `确定要删除文件 "${file.fileName}" 吗？`,
      "确认删除",
      {
        type: "warning",
      }
    );

    const res = await deleteFile(file.fileId!);
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

    const fileIds = selectedFiles.value.map((f) => f.fileId!);
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
    const res = await toggleHttpAccess(file.fileId!, file.httpAccessEnabled!);
    if (res.code === "00000") {
      ElMessage.success(
        file.httpAccessEnabled ? "已启用HTTP访问" : "已禁用HTTP访问"
      );
    } else {
      // 恢复原状态
      file.httpAccessEnabled = !file.httpAccessEnabled;
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (error) {
    // 恢复原状态
    file.httpAccessEnabled = !file.httpAccessEnabled;
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
    const res = await retryMergeTask(file.fileId!);
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
    const res = await manualMergeFile(file.fileId!);
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
 * 处理队列更新
 */
const handleQueueUpdate = (queue: QueueStatus[]) => {
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
</script>

<style scoped lang="scss">
.file-system-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

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

  .file-list-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;

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
