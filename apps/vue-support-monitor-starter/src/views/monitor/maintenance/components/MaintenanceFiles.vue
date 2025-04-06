<template>
  <div class="files-container">
    <div class="files-header">
      <div class="left-actions">
        <el-button type="info" @click="refreshFiles">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
      <div class="right-actions">
        <el-radio-group v-model="viewMode" size="small" class="mode-switch">
          <el-radio-button label="table">
            <IconifyIconOnline icon="ri:table-line" />
          </el-radio-button>
          <el-radio-button label="card">
            <IconifyIconOnline icon="ri:layout-grid-line" />
          </el-radio-button>
        </el-radio-group>
        <input ref="fileInputRef" type="file" style="display: none" multiple @change="handleFileChange" />
        <el-input v-model="searchKeyword" placeholder="搜索文件名称" prefix-icon="Search" clearable style="width: 220px" class="search-input" />
      </div>
    </div>

    <!-- 文件列表 - 表格视图 -->
    <div v-if="viewMode === 'table'" class="files-content">
      <ScTable
        ref="fileTable"
        :url="fetchMaintenanceFiles"
        :params="{
          groupId: props.groupId
        }"
        border
        stripe
        style="width: 100%"
        class="files-table"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)',
          fontWeight: '600',
          fontSize: '14px'
        }"
        :cell-style="{
          fontSize: '14px'
        }"
        @row-dblclick="openEditDialog"
      >
        <el-table-column prop="maintenanceFileName" label="文件名称" min-width="180">
          <template #default="{ row }">
            <div class="file-name">
              <IconifyIconOnline :icon="getFileIcon(row.maintenanceFileName)" class="file-icon" />
              <span class="file-label">{{ row.maintenanceFileName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFilePath" label="目标路径" min-width="180">
          <template #default="{ row }">
            <div class="file-path">
              <IconifyIconOnline icon="ri:folder-line" class="folder-icon" />
              <span>{{ row.maintenanceFilePath || "/" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileType" label="文件类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getFileTypeColor(row.maintenanceFileType)" class="type-tag">
              {{ getFileTypeDisplay(row.maintenanceFileType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileSize" label="文件大小" width="120">
          <template #default="{ row }">
            <span class="file-size">{{ formatFileSize(row.maintenanceFileSize) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileOverride" label="覆盖设置" width="100">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceFileOverride ? 'warning' : 'info'" size="small" class="setting-tag" :effect="row.maintenanceFileOverride ? 'light' : 'plain'">
              {{ row.maintenanceFileOverride ? "覆盖" : "不覆盖" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceFileStatus ? 'success' : 'danger'" :effect="row.maintenanceFileStatus ? 'light' : 'plain'" size="small" class="status-tag">
              <IconifyIconOnline :icon="row.maintenanceFileStatus ? 'ri:checkbox-circle-fill' : 'ri:forbid-2-fill'" class="status-icon" />
              {{ row.maintenanceFileStatus ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="action-group">
              <el-button type="success" size="small" class="sync-btn" @click="syncFile(row)">
                <IconifyIconOnline icon="ri:refresh-line" />
                同步
              </el-button>
              <el-dropdown trigger="click" @command="command => handleCommand(command, row)">
                <el-button size="small" class="more-btn">
                  <IconifyIconOnline icon="ri:more-line" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="deploy">
                      <IconifyIconOnline icon="ri:server-line" />
                      部署
                    </el-dropdown-item>
                    <el-dropdown-item command="replace">
                      <IconifyIconOnline icon="ri:upload-line" />
                      替换
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">
                      <IconifyIconOnline icon="ri:edit-line" />
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="status">
                      <IconifyIconOnline :icon="row.maintenanceFileStatus ? 'ri:forbid-line' : 'ri:check-line'" />
                      {{ row.maintenanceFileStatus ? "禁用" : "启用" }}
                    </el-dropdown-item>
                    <el-dropdown-item command="download">
                      <IconifyIconOnline icon="ri:download-line" />
                      下载
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline icon="ri:delete-bin-line" class="text-danger" />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </div>

    <!-- 文件列表 - 卡片视图 -->
    <div v-else class="files-content cards-view">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      <el-empty v-else-if="!fileList.length" description="暂无文件" :image-size="180" class="empty-files" />
      <div v-else class="card-grid">
        <div v-for="file in filteredFiles" :key="file.maintenanceFileId" class="card-item">
          <FileCard :file="file" @sync="syncFile" @edit="openEditDialog" @command="handleCommand" @replace="handleReplaceFile" />
        </div>
      </div>
    </div>

    <!-- 添加文件替换的文件输入 -->
    <input ref="replaceFileInputRef" type="file" style="display: none" @change="handleReplaceFileChange" />

    <!-- 使用对话框组件 -->
    <file-settings-dialog ref="fileSettingsDialogRef" @upload="handleUploadSubmit" />
    <file-deploy-dialog ref="fileDeployDialogRef" @deploy="handleFileDeploy" />
    <file-edit-dialog ref="fileEditDialogRef" @submit="handleEditSubmit" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  fetchMaintenanceFiles,
  deleteMaintenanceFile,
  uploadFileToGroup,
  deployFile as deployFileApi,
  updateMaintenanceFile,
  syncMaintenanceFile,
  replaceFile as replaceFileApi
} from "@/api/monitor/maintenance";
import FileCard from "./FileCard.vue";

// 异步加载对话框组件
const FileSettingsDialog = defineAsyncComponent(() => import("./dialogs/FileSettingsDialog.vue"));
const FileDeployDialog = defineAsyncComponent(() => import("./dialogs/FileDeployDialog.vue"));
const FileEditDialog = defineAsyncComponent(() => import("./dialogs/FileEditDialog.vue"));
const TaskMonitorDialog = defineAsyncComponent(() => import("./dialogs/TaskMonitorDialog.vue"));

// 定义props
const props = defineProps({
  groupId: {
    type: [Number, String],
    required: true
  }
});

// 文件列表相关
const fileTable = ref(null);
const fileList = ref([]);
const loading = ref(false);
const searchKeyword = ref("");
const viewMode = ref("table"); // 'table' 或 'card'

// 文件上传相关
const fileInputRef = ref(null);
const replaceFileInputRef = ref(null);
const selectedFiles = ref([]);
const uploading = ref(false);
const fileToReplace = ref(null);

// 对话框引用
const fileSettingsDialogRef = ref(null);
const fileDeployDialogRef = ref(null);
const fileEditDialogRef = ref(null);
const taskMonitorDialogRef = ref(null);

// 当前操作相关
const currentFile = ref({});
const currentTaskId = ref(null);

// 根据关键字过滤文件列表
const filteredFiles = computed(() => {
  if (!searchKeyword.value) return fileList.value;

  const keyword = searchKeyword.value.toLowerCase();
  return fileList.value.filter(file => file.maintenanceFileName && file.maintenanceFileName.toLowerCase().includes(keyword));
});

// 获取维护文件列表
const fetchFiles = () => {
  loading.value = true;
  fetchMaintenanceFiles(props.groupId)
    .then(res => {
      fileList.value = res.data || [];
      loading.value = false;
    })
    .catch(error => {
      console.error("获取维护文件列表失败:", error);
      message("获取维护文件列表失败", { type: "error" });
      loading.value = false;
    });
};

// 刷新文件列表
const refreshFiles = () => {
  if (viewMode.value === "table" && fileTable.value) {
    loading.value = true;
    fileTable.value.refresh();
  }
};

// 触发文件选择
const triggerUpload = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileChange = event => {
  const files = event.target.files;
  if (files.length > 0) {
    selectedFiles.value = Array.from(files);
    fileSettingsDialogRef.value?.open(selectedFiles.value);
  }
  // 重置文件输入以允许重新选择相同的文件
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// 触发替换文件
const triggerReplaceFile = fileId => {
  fileToReplace.value = fileId;
  replaceFileInputRef.value?.click();
};

// 处理替换文件选择
const handleReplaceFileChange = event => {
  const files = event.target.files;
  if (files.length > 0 && fileToReplace.value) {
    const file = files[0];
    handleReplaceFile(fileToReplace.value, file);
  }
  // 重置文件输入以允许重新选择相同的文件
  if (replaceFileInputRef.value) {
    replaceFileInputRef.value.value = "";
  }
};

// 处理替换文件
const handleReplaceFile = (fileId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("overwrite", true);
  formData.append("groupId", props.groupId);

  loading.value = true;
  replaceFileApi(fileId, formData)
    .then(res => {
      message("文件替换任务已提交", { type: "success" });

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId && inject("socket")) {
        currentTaskId.value = res.data.taskId;
        taskMonitorDialogRef.value?.open(res.data.taskId);
      }

      // 刷新文件列表
      refreshFiles();
    })
    .catch(error => {
      console.error("文件替换失败:", error);
      message("文件替换失败", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 处理文件上传提交
const handleUploadSubmit = uploadData => {
  if (!uploadData.files || uploadData.files.length === 0) return;

  const formData = new FormData();
  formData.append("maintenanceGroupId", props.groupId);
  formData.append("targetPath", uploadData.maintenanceFilePath);
  formData.append("overwrite", uploadData.maintenanceFileOverride);

  for (let i = 0; i < uploadData.files.length; i++) {
    formData.append("files", uploadData.files[i]);
  }

  fileSettingsDialogRef.value.uploading = true;

  uploadFileToGroup(formData)
    .then(res => {
      message("文件上传任务已提交", { type: "success" });
      fileSettingsDialogRef.value.close();

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId) {
        currentTaskId.value = res.data.taskId;
        taskMonitorDialogRef.value?.open(res.data.taskId);
      }

      // 刷新文件列表
      refreshFiles();
      fileSettingsDialogRef.value.uploading = false;
    })
    .catch(error => {
      console.error("文件上传失败:", error);
      message("文件上传失败", { type: "error" });
      fileSettingsDialogRef.value.uploading = false;
    });
};

// 同步文件
const syncFile = file => {
  if (!file || !file.maintenanceFileId) {
    message("文件信息不完整，无法同步", { type: "error" });
    return;
  }

  ElMessageBox.confirm(`确定要同步文件 "${file.maintenanceFileName}" 到所有服务器吗？`, "同步确认", {
    confirmButtonText: "确认同步",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      loading.value = true;
      syncMaintenanceFile(file.maintenanceFileId)
        .then(res => {
          message("文件同步任务已提交", { type: "success" });

          // 如果返回任务ID，打开任务监控
          if (res.data && res.data.taskId) {
            currentTaskId.value = res.data.taskId;
            taskMonitorDialogRef.value?.open(res.data.taskId);
          }
        })
        .catch(error => {
          console.error("文件同步失败:", error);
          message("文件同步失败", { type: "error" });
        })
        .finally(() => {
          loading.value = false;
        });
    })
    .catch(() => {
      // 用户取消同步操作
    });
};

// 部署文件
const deployFile = file => {
  if (!file || !file.maintenanceFileId) {
    message("文件信息不完整，无法部署", { type: "error" });
    return;
  }

  currentFile.value = file;
  fileDeployDialogRef.value?.open(file);
};

// 处理文件部署
const handleFileDeploy = deployData => {
  if (!deployData || !deployData.fileId || !deployData.groupId) {
    message("部署参数不完整", { type: "error" });
    return;
  }

  loading.value = true;
  deployFileApi({
    maintenanceFileId: deployData.fileId,
    maintenanceGroupId: deployData.groupId,
    targetHosts: deployData.targetHosts || []
  })
    .then(res => {
      message("文件部署任务已提交", { type: "success" });
      fileDeployDialogRef.value?.close();

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId) {
        currentTaskId.value = res.data.taskId;
        taskMonitorDialogRef.value?.open(res.data.taskId);
      }
    })
    .catch(error => {
      console.error("文件部署失败:", error);
      message("文件部署失败", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 打开编辑对话框
const openEditDialog = file => {
  if (!file || !file.maintenanceFileId) {
    message("文件信息不完整，无法编辑", { type: "error" });
    return;
  }

  currentFile.value = file;
  fileEditDialogRef.value?.open(file);
};

// 处理编辑提交
const handleEditSubmit = editData => {
  if (!editData || !editData.maintenanceFileId) {
    message("编辑参数不完整", { type: "error" });
    return;
  }

  loading.value = true;
  updateMaintenanceFile(editData)
    .then(() => {
      message("文件信息更新成功", { type: "success" });
      fileEditDialogRef.value?.close();

      // 刷新文件列表
      refreshFiles();
    })
    .catch(error => {
      console.error("更新文件信息失败:", error);
      message("更新文件信息失败", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 更新文件状态
const updateFileStatus = file => {
  if (!file || !file.maintenanceFileId) {
    message("文件信息不完整，无法更新状态", { type: "error" });
    return;
  }

  const newStatus = !file.maintenanceFileStatus;
  const statusText = newStatus ? "启用" : "禁用";

  loading.value = true;
  updateMaintenanceFile({
    maintenanceFileId: file.maintenanceFileId,
    maintenanceFileStatus: newStatus
  })
    .then(() => {
      message(`文件已${statusText}`, { type: "success" });

      // 刷新文件列表
      refreshFiles();
    })
    .catch(error => {
      console.error(`${statusText}文件失败:`, error);
      message(`${statusText}文件失败`, { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 下载文件
const downloadFile = file => {
  if (!file || !file.maintenanceFileId) {
    message("文件信息不完整，无法下载", { type: "error" });
    return;
  }

  message("文件下载请求已发送，请等待浏览器下载提示", { type: "info" });

  // 构建下载URL并创建下载链接
  const downloadUrl = `/api/v1/maintenance/file/download/${file.maintenanceFileId}`;
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.target = "_blank";
  link.download = file.maintenanceFileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 删除文件
const deleteFile = file => {
  if (!file || !file.maintenanceFileId) {
    message("文件信息不完整，无法删除", { type: "error" });
    return;
  }

  loading.value = true;
  deleteMaintenanceFile(file.maintenanceFileId)
    .then(() => {
      message("文件删除成功", { type: "success" });

      // 刷新文件列表
      refreshFiles();
    })
    .catch(error => {
      console.error("删除文件失败:", error);
      message("删除文件失败", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 处理下拉菜单命令
const handleCommand = (command, file) => {
  switch (command) {
    case "status":
      updateFileStatus(file);
      break;
    case "download":
      downloadFile(file);
      break;
    case "deploy":
      deployFile(file);
      break;
    case "edit":
      openEditDialog(file);
      break;
    case "replace":
      triggerReplaceFile(file.maintenanceFileId);
      break;
    case "delete":
      ElMessageBox.confirm(`确定要删除文件 "${file.maintenanceFileName}" 吗？删除后将同时从远程主机删除。`, "删除确认", {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteFile(file);
        })
        .catch(() => {
          // 用户取消删除
        });
      break;
  }
};

// 监听viewMode变化
watch(viewMode, newMode => {
  if (newMode === "card") {
    fetchFiles();
  }
});

// 组件挂载时获取数据
onMounted(() => {
  if (props.groupId) {
    if (viewMode.value === "card") {
      fetchFiles();
    }
  }
});

// 监听groupId变化
watch(
  () => props.groupId,
  newVal => {
    if (newVal) {
      if (viewMode.value === "card") {
        fetchFiles();
      } else if (fileTable.value) {
        fileTable.value.reload();
      }
    }
  }
);

// 获取文件图标
const getFileIcon = (fileName = "") => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // 根据文件扩展名返回对应的图标
  switch (extension) {
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return "ri:file-zip-line";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "bmp":
      return "ri:image-line";
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
    case "flv":
      return "ri:video-line";
    case "pdf":
      return "ri:file-pdf-line";
    case "doc":
    case "docx":
      return "ri:file-word-line";
    case "xls":
    case "xlsx":
      return "ri:file-excel-line";
    case "ppt":
    case "pptx":
      return "ri:file-ppt-line";
    case "txt":
    case "log":
      return "ri:file-text-line";
    case "html":
    case "htm":
      return "ri:html5-line";
    case "css":
      return "ri:css3-line";
    case "js":
    case "mjs":
    case "cjs":
      return "ri:javascript-line";
    case "java":
      return "ri:terminal-box-line";
    case "xml":
    case "svg":
      return "ri:file-code-line";
    case "sh":
    case "bat":
    case "cmd":
      return "ri:terminal-line";
    case "json":
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
      return "ri:settings-3-line";
    default:
      return "ri:file-line";
  }
};

// 获取文件类型颜色
const getFileTypeColor = fileType => {
  if (!fileType) return "info";

  switch (fileType.toLowerCase()) {
    case "image":
    case "img":
      return "success";
    case "video":
      return "danger";
    case "audio":
      return "warning";
    case "document":
    case "doc":
      return "primary";
    case "archive":
    case "zip":
      return "warning";
    case "executable":
    case "exe":
      return "danger";
    case "script":
      return "info";
    default:
      return "info";
  }
};

// 获取文件类型显示文本
const getFileTypeDisplay = fileType => {
  if (!fileType) return "未知";

  switch (fileType.toLowerCase()) {
    case "image":
    case "img":
      return "图片";
    case "video":
      return "视频";
    case "audio":
      return "音频";
    case "document":
    case "doc":
      return "文档";
    case "archive":
    case "zip":
      return "压缩包";
    case "executable":
    case "exe":
      return "可执行文件";
    case "script":
      return "脚本";
    default:
      return fileType;
  }
};

// 格式化文件大小
const formatFileSize = size => {
  if (size === null || size === undefined) return "未知";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let fileSize = size;
  let unitIndex = 0;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
};
</script>

<style lang="scss" scoped>
.files-container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    position: relative;
    background: linear-gradient(to right, rgba(var(--el-color-primary-rgb), 0.05), transparent);
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-7), transparent);
      border-radius: 2px;
    }

    .left-section {
      display: flex;
      gap: 12px;
      align-items: center;

      .toggle-view {
        display: flex;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

        .view-btn {
          transition: all 0.3s ease;
          border-radius: 6px;
          padding: 6px 8px;

          &.active {
            background-color: var(--el-color-primary);
            color: white;

            &:hover {
              background-color: var(--el-color-primary-dark-2);
            }
          }

          &:not(.active) {
            color: var(--el-text-color-secondary);

            &:hover {
              background-color: var(--el-fill-color);
              color: var(--el-color-primary);
            }
          }
        }
      }
    }

    .right-section {
      .action-button {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);
        }
      }
    }
  }

  .files-content {
    flex: 1;
    overflow: auto;

    // 表格视图样式增强
    :deep(.el-table) {
      --el-table-border-color: transparent;
      border-radius: 12px;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
      overflow: hidden;

      .el-table__header-wrapper {
        th {
          background: linear-gradient(to right, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
          color: var(--el-color-primary-dark-2);
          font-weight: 600;
          padding: 14px 8px;

          &:first-child {
            border-top-left-radius: 12px;
          }

          &:last-child {
            border-top-right-radius: 12px;
          }
        }
      }

      .el-table__row {
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(var(--el-color-primary-rgb), 0.05) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          z-index: 2;
          position: relative;
        }

        td {
          padding: 12px 8px;
          transition: all 0.3s ease;

          .cell {
            line-height: 1.5;
          }
        }
      }
    }

    // 卡片视图样式增强
    .file-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      animation: fadeIn 0.5s ease-out;

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }

    // 空状态美化
    .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: radial-gradient(circle at center, rgba(var(--el-color-primary-rgb), 0.03), transparent);
      border-radius: 16px;

      .empty-desc {
        margin: 20px 0;
        color: var(--el-text-color-secondary);
        font-size: 16px;
      }

      .el-button {
        padding: 12px 24px;
        border-radius: 8px;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(var(--el-color-primary-rgb), 0.2);
        }
      }
    }
  }
}

// 按钮样式美化
.action-icon-btn {
  transition: all 0.3s ease;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    background-color: var(--el-color-primary-light-9);
  }

  &.edit-btn:hover {
    color: var(--el-color-primary);
  }

  &.deploy-btn:hover {
    color: var(--el-color-success);
  }

  &.delete-btn:hover {
    color: var(--el-color-danger);
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

// 标签样式美化
.setting-tag {
  border-radius: 12px;
  padding: 2px 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  border-radius: 12px;
  padding: 2px 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }

  .status-icon {
    font-size: 14px;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .files-container {
    .files-header {
      flex-direction: column;
      align-items: flex-start;

      .left-section {
        margin-bottom: 12px;
        width: 100%;
      }

      .right-section {
        width: 100%;
      }
    }

    .files-content {
      .file-cards {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
    }
  }
}
</style>
