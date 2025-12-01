<template>
  <div class="file-system-page">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <IconifyIconOnline icon="ri:file-list-3-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalFiles }}</div>
            <div class="stat-label">总文件</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon size">
            <IconifyIconOnline icon="ri:hard-drive-2-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatFileSize(statistics.totalSize) }}</div>
            <div class="stat-label">总大小</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon completed">
            <IconifyIconOnline icon="ri:checkbox-circle-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.completedFiles }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar modern-toolbar">
        <div class="left">
          <el-input
            v-model="searchQuery.fileName"
            placeholder="搜索文件名..."
            clearable
            class="w-280"
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
            class="w-160"
            @change="handleSearch"
          >
            <el-option label="全部" :value="null" />
            <el-option label="待合并" :value="0" />
            <el-option label="合并中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="合并失败" :value="3" />
          </el-select>
          <!-- 连接状态 -->
          <el-tooltip :content="connectionStatusText" placement="bottom">
            <div class="connection-badge" :class="connectionStatusClass">
              <IconifyIconOnline :icon="connectionStatusIcon" class="status-icon" />
              <span>{{ connectionStatusText }}</span>
            </div>
          </el-tooltip>
        </div>
        <div class="right">
          <el-button type="primary" @click="showUploadDialog = true">
            <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
            上传文件
          </el-button>
          <el-button @click="showSettingsDialog = true">
            <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
            设置
          </el-button>
          <el-button @click="refreshData">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button v-if="showDebugInfo" @click="showDebugInfo = false" type="info" plain>
            <IconifyIconOnline icon="ri:bug-line" class="mr-1" />
            关闭调试
          </el-button>
          <el-button v-else @click="showDebugInfo = true" plain>
            <IconifyIconOnline icon="ri:bug-line" class="mr-1" />
            调试
          </el-button>
        </div>
      </div>
    </div>

    <!-- 调试信息面板 -->
    <div v-if="showDebugInfo" class="debug-panel">
      <el-card class="debug-card">
        <template #header>
          <div class="debug-header">
            <span><IconifyIconOnline icon="ri:terminal-box-line" class="mr-2" />SSE连接调试</span>
            <div class="debug-actions">
              <el-button @click="testSSEConnection" type="primary" size="small">测试连接</el-button>
              <el-button @click="testBackendAPI" type="success" size="small">测试API</el-button>
            </div>
          </div>
        </template>
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="连接状态">
            <el-tag :type="sseState.connected ? 'success' : 'danger'" size="small">
              {{ connectionStatusText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户端ID">{{ sseState.clientId || "未分配" }}</el-descriptions-item>
          <el-descriptions-item label="重连次数">{{ sseState.reconnectAttempts }}</el-descriptions-item>
          <el-descriptions-item label="最后心跳">
            {{ sseState.lastHeartbeat ? new Date(sseState.lastHeartbeat).toLocaleString() : "无" }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧分组树 -->
      <div class="group-panel">
        <div class="panel-header">
          <h3><IconifyIconOnline icon="ri:folder-3-line" class="mr-2" />文件分组</h3>
          <el-button type="primary" size="small" circle @click="handleCreateGroup">
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
        </div>
        <div class="panel-body">
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
              <div class="tree-node">
                <IconifyIconOnline
                  :icon="data.fileSystemGroupIcon || 'ri:folder-line'"
                  :style="{ color: data.fileSystemGroupColor || '#3b82f6' }"
                  class="node-icon"
                />
                <span class="node-name">{{ data.fileSystemGroupName }}</span>
                <el-tag size="small" type="info" class="node-count">{{ data.fileCount || 0 }}</el-tag>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧文件列表 -->
      <div class="file-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3><IconifyIconOnline icon="ri:file-list-3-line" class="mr-2" />文件列表</h3>
            <el-tag v-if="selectedGroupId" type="primary" size="small" closable @close="clearGroupFilter">
              {{ getSelectedGroupName() }}
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="!selectedFiles.length"
              @click="showMoveToGroupDialog = true"
            >
              <IconifyIconOnline icon="ri:folder-transfer-line" class="mr-1" />
              移动 {{ selectedFiles.length > 0 ? `(${selectedFiles.length})` : '' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="!selectedFiles.length"
              @click="handleBatchDelete"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              删除
            </el-button>
            <el-button size="small" @click="handleCleanExpired">
              <IconifyIconOnline icon="ri:delete-bin-2-line" class="mr-1" />
              清理过期
            </el-button>
          </div>
        </div>

        <!-- 文件表格 -->
        <div class="panel-body table-body">
          <ScTable
            ref="tableRef"
            :url="getFileSystemPage"
            :params="searchQuery"
            table-name="file-system"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column label="文件名" min-width="240">
              <template #default="{ row }">
                <div class="file-cell">
                  <div class="file-icon-wrapper" :class="getFileTypeClass(row.fileSystemType)">
                    <IconifyIconOnline :icon="getFileIcon(row.fileSystemType)" />
                  </div>
                  <div class="file-info">
                    <span class="file-name" :title="row.fileSystemName">{{ row.fileSystemName }}</span>
                    <span class="file-meta">{{ formatFileSize(row.fileSystemSize) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.fileSystemStatus)" size="small" effect="light">
                  <IconifyIconOnline :icon="getStatusIcon(row.fileSystemStatus)" class="mr-1" />
                  {{ getStatusText(row.fileSystemStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="上传进度" width="160">
              <template #default="{ row }">
                <div v-if="row.fileSystemChunkTotal > 0" class="progress-wrapper">
                  <el-progress
                    :percentage="Math.round((row.fileSystemChunkUploaded / row.fileSystemChunkTotal) * 100)"
                    :status="getProgressStatus(row.fileSystemStatus)"
                    :stroke-width="8"
                    :show-text="false"
                  />
                  <span class="progress-text">
                    {{ row.fileSystemChunkUploaded }}/{{ row.fileSystemChunkTotal }}
                  </span>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="HTTP" width="80" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.fileSystemHttpAccessEnabled"
                  :disabled="row.fileSystemStatus !== 2"
                  size="small"
                  @change="handleToggleHttpAccess(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                <span class="time-text">{{ formatDateTime(row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    v-if="row.fileSystemStatus === 2"
                    link
                    type="primary"
                    @click="handleDownload(row)"
                  >
                    <IconifyIconOnline icon="ri:download-line" />
                  </el-button>
                  <el-button
                    v-if="row.fileSystemStatus === 2"
                    link
                    type="success"
                    @click="openDistribute(row)"
                  >
                    <IconifyIconOnline icon="ri:share-forward-line" />
                  </el-button>
                  <el-button
                    v-if="row.fileSystemStatus === 3"
                    link
                    type="warning"
                    @click="handleRetryMerge(row)"
                  >
                    <IconifyIconOnline icon="ri:restart-line" />
                  </el-button>
                  <el-button
                    v-if="row.fileSystemStatus === 0"
                    link
                    type="success"
                    @click="handleManualMerge(row)"
                  >
                    <IconifyIconOnline icon="ri:git-merge-line" />
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="handleDelete(row)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </ScTable>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <FileSystemDistributeDialog
      v-model="showDistributeDialog"
      :file="currentDistributeFile"
      @success="handleDistributeSuccess"
    />

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
import FileSystemDistributeDialog from "./components/FileSystemDistributeDialog.vue";
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
 * 打开同步对话框
 */
const showDistributeDialog = ref(false);
const currentDistributeFile = ref<FileSystem | null>(null);
const openDistribute = (file: FileSystem) => {
  currentDistributeFile.value = file;
  showDistributeDialog.value = true;
};

const handleDistributeSuccess = () => {
  ElMessage.success("同步任务已完成");
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: "待合并",
    1: "合并中",
    2: "已完成",
    3: "失败",
  };
  return textMap[status] || "未知";
};

/**
 * 获取状态图标
 */
const getStatusIcon = (status: number) => {
  const iconMap: Record<number, string> = {
    0: "ri:time-line",
    1: "ri:loader-4-line",
    2: "ri:checkbox-circle-line",
    3: "ri:error-warning-line",
  };
  return iconMap[status] || "ri:question-line";
};

/**
 * 获取文件类型样式类
 */
const getFileTypeClass = (fileType: string) => {
  const classMap: Record<string, string> = {
    image: "type-image",
    video: "type-video",
    audio: "type-audio",
    document: "type-document",
    archive: "type-archive",
    code: "type-code",
  };
  return classMap[fileType] || "type-default";
};

/**
 * 获取选中分组名称
 */
const getSelectedGroupName = () => {
  const findGroup = (groups: any[], id: number): string => {
    for (const g of groups) {
      if (g.fileSystemGroupId === id) return g.fileSystemGroupName;
      if (g.children) {
        const found = findGroup(g.children, id);
        if (found) return found;
      }
    }
    return "";
  };
  return selectedGroupId.value ? findGroup(groupTree.value, selectedGroupId.value) : "";
};

/**
 * 清除分组筛选
 */
const clearGroupFilter = () => {
  selectedGroupId.value = null;
  searchQuery.groupId = null;
  groupTreeRef.value?.setCurrentKey(null);
  handleSearch();
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
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;

  // 统计卡片区域
  .stats-section {
    padding: 16px 32px;
    background: rgba(255, 255, 255, 0.6);
    border-bottom: 1px solid rgba(226, 232, 240, 0.5);

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--app-card-bg, #fff);
      border-radius: 12px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;

        &.total {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #2563eb;
        }

        &.size {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          color: #9333ea;
        }

        &.completed {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #16a34a;
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--app-text-primary, #1e293b);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 12px;
          color: var(--app-text-secondary, #64748b);
        }
      }
    }
  }

  // 页面头部
  .page-header {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding: 24px 32px;
    margin-bottom: 0;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      .page-title-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .title-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .title-content {
          .page-title {
            margin: 0 0 4px 0;
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .page-subtitle {
            margin: 0;
            color: #64748b;
            font-size: 14px;
          }
        }
      }
    }

    .header-right {
      .stats-overview {
        display: flex;
        gap: 24px;

        .stat-item {
          text-align: center;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          min-width: 90px;

          .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #3b82f6;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
        }
      }
    }
  }

  // 工具栏
  .toolbar-section {
    padding: 16px 32px;
    background: rgba(255, 255, 255, 0.6);
    border-bottom: 1px solid rgba(226, 232, 240, 0.5);

    .modern-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      .left, .right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .w-280 { width: 280px; }
      .w-160 { width: 160px; }

      .connection-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        .status-icon { font-size: 14px; }

        &.status-connected {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #16a34a;
          border: 1px solid #86efac;
        }

        &.status-connecting {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706;
          border: 1px solid #fcd34d;
          .status-icon { animation: spin 1s linear infinite; }
        }

        &.status-error, &.status-disconnected {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
          border: 1px solid #fca5a5;
        }
      }
    }
  }

  // 调试面板
  .debug-panel {
    padding: 0 32px 16px;

    .debug-card {
      border-radius: 12px;
      border: 1px solid #e2e8f0;

      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .debug-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  // 主内容区域
  .main-content {
    display: flex;
    flex-direction: row;
    gap: 20px;
    padding: 20px 32px;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  // 分组面板
  .group-panel {
    width: 280px;
    min-width: 280px;
    max-width: 280px;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

      h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #334155;
        display: flex;
        align-items: center;
      }
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;

      .tree-node {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 8px;
        transition: all 0.2s;

        &:hover {
          background: #f1f5f9;
        }

        .node-icon { font-size: 18px; }
        .node-name { flex: 1; font-size: 14px; color: #334155; }
        .node-count { font-size: 11px; }
      }
    }
  }

  // 文件面板
  .file-panel {
    flex: 1;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .table-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
  }

  // 文件单元格
  .file-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .file-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;

      &.type-image { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; }
      &.type-video { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #2563eb; }
      &.type-audio { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); color: #9333ea; }
      &.type-document { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); color: #16a34a; }
      &.type-archive { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #dc2626; }
      &.type-code { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #4f46e5; }
      &.type-default { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #64748b; }
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: #1e293b;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-meta {
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }

  // 进度条
  .progress-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .progress-text {
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
  }

  // 操作按钮
  .action-buttons {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  // 时间文本
  .time-text {
    font-size: 13px;
    color: #64748b;
  }

  .text-muted {
    color: #94a3b8;
  }
}

// 移动到分组对话框
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
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      background: #f8fafc;

      .file-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        font-size: 13px;
        border-radius: 6px;

        &:hover { background: #e2e8f0; }

        .file-icon { font-size: 16px; color: #3b82f6; }
        .file-name { color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      }

      .more-files {
        padding: 6px;
        font-size: 12px;
        color: #64748b;
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

      .group-name { flex: 1; color: #334155; }
      .file-count { font-size: 12px; color: #64748b; }
    }
  }
}

// 动画
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计 - 只在小屏幕上才变成上下布局
@media (max-width: 768px) {
  .file-system-page {
    .page-header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        gap: 16px;
      }
    }

    .toolbar-section {
      padding: 12px 16px;

      .modern-toolbar {
        flex-wrap: wrap;
      }
    }

    .main-content {
      flex-direction: column;
      padding: 12px 16px;
    }

    .group-panel {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      max-height: 200px;
    }
  }
}
</style>
