<template>
  <div class="files-container">
    <div class="files-header">
      <el-button type="primary" class="upload-button" @click="triggerUpload">
        <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
        上传文件
      </el-button>
      <input ref="fileInputRef" type="file" style="display: none" multiple @change="handleFileChange" />
      <el-input v-model="searchKeyword" placeholder="搜索文件名称" prefix-icon="Search" clearable style="width: 220px" class="search-input" />
    </div>

    <!-- 文件列表 -->
    <div class="files-content">
      <el-table
        v-loading="loading"
        :data="filteredFiles"
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
            <el-tag :type="row.maintenanceFileStatus ? 'success' : 'danger'" size="small" class="status-tag">
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
      </el-table>

      <!-- 空状态展示 -->
      <el-empty v-if="filteredFiles.length === 0" description="暂无文件" :image-size="180" class="empty-files" />
    </div>

    <!-- 使用对话框组件 -->
    <file-settings-dialog ref="fileSettingsDialogRef" @upload="handleUploadSubmit" />
    <file-deploy-dialog ref="fileDeployDialogRef" @deploy="handleFileDeploy" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { fetchMaintenanceFiles, deleteMaintenanceFile, uploadFileToGroup, deployFile as deployFileApi, updateMaintenanceFile, syncMaintenanceFile } from "@/api/monitor/maintenance";

// 异步加载对话框组件
const FileSettingsDialog = defineAsyncComponent(() => import("./dialogs/FileSettingsDialog.vue"));
const FileDeployDialog = defineAsyncComponent(() => import("./dialogs/FileDeployDialog.vue"));
const TaskMonitorDialog = defineAsyncComponent(() => import("./dialogs/TaskMonitorDialog.vue"));

// 定义props
const props = defineProps({
  groupId: {
    type: [Number, String],
    required: true
  }
});

// 文件列表数据
const fileList = ref([]);
const loading = ref(false);
const searchKeyword = ref("");

// 文件上传相关
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const uploading = ref(false);

// 对话框引用
const fileSettingsDialogRef = ref(null);
const fileDeployDialogRef = ref(null);
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
      fetchFiles();
      fileSettingsDialogRef.value.uploading = false;
    })
    .catch(error => {
      console.error("文件上传失败:", error);
      message("文件上传失败", { type: "error" });
      fileSettingsDialogRef.value.uploading = false;
    });
};

// 同步文件到远程主机
const syncFile = file => {
  currentFile.value = file;

  // 确认同步
  ElMessageBox.confirm(`确认将文件 "${file.maintenanceFileName}" 同步到维护组下所有启用的主机吗？`, "同步确认", {
    confirmButtonText: "确认同步",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      message(`正在同步文件...`, { type: "info" });

      syncMaintenanceFile(file.maintenanceFileId)
        .then(res => {
          message("同步请求已发送，请查看系统消息获取进度", { type: "success" });
          // 可以打开任务监控对话框查看进度
          if (res.data) {
            currentTaskId.value = res.data;
            taskMonitorDialogRef.value?.open(res.data);
          }
        })
        .catch(error => {
          console.error("同步文件失败:", error);
          message("同步文件失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 打开部署文件对话框
const deployFile = file => {
  currentFile.value = file;
  fileDeployDialogRef.value?.open(file);
};

// 处理文件部署
const handleFileDeploy = fileId => {
  const params = {
    maintenanceGroupId: props.groupId
  };

  deployFileApi(fileId, params)
    .then(res => {
      message("文件部署任务已提交", { type: "success" });
      fileDeployDialogRef.value.close();

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId) {
        currentTaskId.value = res.data.taskId;
        taskMonitorDialogRef.value?.open(res.data.taskId);
      }

      fileDeployDialogRef.value.deploying = false;
    })
    .catch(error => {
      console.error("文件部署失败:", error);
      message("文件部署失败", { type: "error" });
      fileDeployDialogRef.value.deploying = false;
    });
};

// 删除文件
const deleteFile = file => {
  deleteMaintenanceFile(file.maintenanceFileId)
    .then(() => {
      message("删除文件成功", { type: "success" });
      fetchFiles();
    })
    .catch(error => {
      console.error("删除文件失败:", error);
      message("删除文件失败", { type: "error" });
    });
};

// 更新文件状态
const updateFileStatus = file => {
  const newStatus = file.maintenanceFileStatus === 1 ? 0 : 1;
  const data = { ...file, maintenanceFileStatus: newStatus };

  updateMaintenanceFile(data)
    .then(() => {
      message(`${newStatus === 1 ? "启用" : "禁用"}文件成功`, { type: "success" });
      fetchFiles();
    })
    .catch(error => {
      console.error("更新文件状态失败:", error);
      message("更新文件状态失败", { type: "error" });
    });
};

// 下载文件
const downloadFile = file => {
  // 这里假设后端提供了文件下载的API端点
  const downloadUrl = `/api/monitor/maintenance/file/download/${file.maintenanceFileId}`;

  // 创建一个临时的a标签来触发下载
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = file.maintenanceFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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

// 获取文件图标
const getFileIcon = fileName => {
  if (!fileName) return "ri:file-line";

  const ext = fileName.split(".").pop().toLowerCase();

  switch (ext) {
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
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      return "ri:image-line";
    case "zip":
    case "rar":
    case "tar":
    case "gz":
    case "bz2":
      return "ri:file-zip-line";
    case "sh":
    case "bash":
      return "ri:terminal-line";
    case "py":
      return "ri:python-line";
    case "js":
      return "ri:javascript-line";
    case "java":
      return "ri:java-line";
    case "html":
    case "htm":
      return "ri:html5-line";
    case "css":
      return "ri:css3-line";
    default:
      return "ri:file-line";
  }
};

// 格式化文件大小
const formatFileSize = size => {
  if (size === null || size === undefined) return "未知";

  // 将字节转换为更友好的单位
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let formattedSize = size;

  while (formattedSize >= 1024 && i < units.length - 1) {
    formattedSize /= 1024;
    i++;
  }

  return `${formattedSize.toFixed(2)} ${units[i]}`;
};

// 获取文件类型显示名称
const getFileTypeDisplay = type => {
  if (!type) return "未知";

  const typeMap = {
    text: "文本",
    image: "图片",
    audio: "音频",
    video: "视频",
    document: "文档",
    archive: "压缩包",
    executable: "可执行文件",
    script: "脚本",
    binary: "二进制",
    other: "其他"
  };

  return typeMap[type] || type;
};

// 获取文件类型颜色
const getFileTypeColor = type => {
  if (!type) return "info";

  const typeColorMap = {
    text: "info",
    image: "success",
    audio: "warning",
    video: "danger",
    document: "primary",
    archive: "warning",
    executable: "danger",
    script: "success",
    binary: "info",
    other: "info"
  };

  return typeColorMap[type] || "info";
};

// 监听groupId变化
watch(
  () => props.groupId,
  newVal => {
    if (newVal) {
      fetchFiles();
    }
  }
);

// 组件挂载时获取数据
onMounted(() => {
  if (props.groupId) {
    fetchFiles();
  }
});

// 导出公开方法
defineExpose({
  refreshFiles: fetchFiles
});
</script>

<style lang="scss" scoped>
.files-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;

  .files-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .upload-button {
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      }
    }

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:focus-within {
          box-shadow:
            0 0 0 1px var(--el-color-primary) inset,
            0 4px 10px rgba(var(--el-color-primary-rgb), 0.1);
        }
      }
    }
  }

  .files-content {
    flex: 1;
    overflow-y: auto;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-color-primary-light-8);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    .files-table {
      border-radius: 12px;
      overflow: hidden;

      :deep(.el-table__header-wrapper) {
        th {
          padding: 12px 0;
        }
      }

      :deep(.el-table__row) {
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--el-fill-color);
        }

        td {
          transition: all 0.2s ease;
        }
      }
    }

    .empty-files {
      margin-top: 60px;

      :deep(.el-empty__image) {
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
      }

      :deep(.el-empty__description) {
        margin-top: 20px;
        color: var(--el-text-color-secondary);
        font-size: 15px;
      }
    }
  }

  .file-name {
    display: flex;
    align-items: center;

    .file-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
      font-size: 18px;
    }

    .file-label {
      font-weight: 500;
    }
  }

  .file-path {
    display: flex;
    align-items: center;
    color: var(--el-text-color-secondary);

    .folder-icon {
      margin-right: 6px;
      color: var(--el-color-warning);
      font-size: 16px;
    }
  }

  .file-size {
    font-family: "Roboto Mono", monospace;
    color: var(--el-text-color-secondary);
  }

  .type-tag,
  .setting-tag,
  .status-tag {
    border-radius: 12px;
    padding: 0 10px;
    font-weight: 500;
    font-size: 12px;
  }

  .action-group {
    display: flex;
    gap: 8px;

    .sync-btn,
    .more-btn {
      transition: all 0.3s ease;
      border-radius: 6px;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .sync-btn:hover {
      box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.2);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mr-1 {
  margin-right: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .files-container {
    .files-header {
      flex-direction: column;
      gap: 12px;

      .search-input {
        width: 100% !important;
      }
    }
  }
}
</style>
