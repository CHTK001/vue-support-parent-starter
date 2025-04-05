<template>
  <div class="files-container">
    <div class="files-header">
      <el-button type="primary" @click="triggerUpload">
        <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
        上传文件
      </el-button>
      <input type="file" ref="fileInputRef" style="display: none" @change="handleFileChange" multiple />
      <el-input v-model="searchKeyword" placeholder="搜索文件名称" prefix-icon="Search" clearable style="width: 220px" />
    </div>

    <!-- 文件列表 -->
    <div class="files-content">
      <el-table v-loading="loading" :data="filteredFiles" border stripe style="width: 100%">
        <el-table-column prop="maintenanceFileName" label="文件名称" min-width="180">
          <template #default="{ row }">
            <div class="file-name">
              <IconifyIconOnline :icon="getFileIcon(row.maintenanceFileName)" class="file-icon" />
              <span>{{ row.maintenanceFileName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFilePath" label="目标路径" min-width="180">
          <template #default="{ row }">
            {{ row.maintenanceFilePath || "/" }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileType" label="文件类型" width="120">
          <template #default="{ row }">
            {{ getFileTypeDisplay(row.maintenanceFileType) }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileSize" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.maintenanceFileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileExtract" label="解压设置" width="100">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceFileExtract ? 'success' : 'info'" size="small">
              {{ row.maintenanceFileExtract ? "自动解压" : "不解压" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileOverride" label="覆盖设置" width="100">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceFileOverride ? 'warning' : 'info'" size="small">
              {{ row.maintenanceFileOverride ? "覆盖" : "不覆盖" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceFileStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceFileStatus ? 'success' : 'danger'" size="small">
              {{ row.maintenanceFileStatus ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="deployFile(row)">
              <IconifyIconOnline icon="ri:server-line" />
              部署
            </el-button>
            <el-dropdown trigger="click" @command="command => handleCommand(command, row)">
              <el-button size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
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
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态展示 -->
      <el-empty v-if="filteredFiles.length === 0" description="暂无文件" :image-size="200" />
    </div>

    <!-- 上传设置对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="文件上传设置" width="500px" :close-on-click-modal="false" :before-close="handleUploadDialogClose">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="目标路径" prop="maintenanceFilePath">
          <el-input v-model="uploadForm.maintenanceFilePath" placeholder="请输入文件上传的目标路径，如：/usr/local/app" />
        </el-form-item>
        <el-form-item label="自动解压" prop="maintenanceFileExtract">
          <el-switch v-model="uploadForm.maintenanceFileExtract" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
          <div class="form-tip">仅支持zip、tar、tar.gz、tar.bz2格式的压缩文件</div>
        </el-form-item>
        <el-form-item label="覆盖已有文件" prop="maintenanceFileOverride">
          <el-switch v-model="uploadForm.maintenanceFileOverride" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="选择文件">
          <div class="selected-files">
            <template v-if="selectedFiles.length > 0">
              <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file-item">
                <IconifyIconOnline :icon="getFileIcon(file.name)" class="file-icon" />
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ formatFileSize(file.size) }})</span>
                <IconifyIconOnline icon="ri:close-circle-line" class="remove-icon" @click="removeSelectedFile(index)" />
              </div>
            </template>
            <div v-else class="no-files">暂未选择文件</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">开始上传</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 部署确认对话框 -->
    <el-dialog v-model="deployDialogVisible" title="文件部署" width="500px" :close-on-click-modal="false">
      <div class="deploy-warning">
        <IconifyIconOnline icon="ri:alert-line" class="warning-icon" />
        <span>确定要将该文件部署到维护组下的所有主机上吗？</span>
      </div>
      <div class="file-info">
        <div class="info-item">
          <span class="info-label">文件名称：</span>
          <span class="info-value">{{ currentFile.maintenanceFileName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">目标路径：</span>
          <span class="info-value">{{ currentFile.maintenanceFilePath || "/" }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">自动解压：</span>
          <span class="info-value">{{ currentFile.maintenanceFileExtract ? "是" : "否" }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">覆盖文件：</span>
          <span class="info-value">{{ currentFile.maintenanceFileOverride ? "是" : "否" }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deployDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDeploy" :loading="deploying">确认部署</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务监控对话框 -->
    <el-dialog v-model="taskMonitorVisible" title="文件部署监控" width="70%" :close-on-click-modal="false">
      <task-monitor ref="taskMonitorRef" :task-id="currentTaskId" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceFiles, deleteMaintenanceFile, uploadFileToGroup, deployFile as deployFileApi } from "@/api/monitor/maintenance";

const TaskMonitor = defineAsyncComponent(() => import("./TaskMonitor.vue"));

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
const uploadDialogVisible = ref(false);
const uploadFormRef = ref(null);
const uploading = ref(false);

// 部署相关
const deployDialogVisible = ref(false);
const currentFile = ref({});
const deploying = ref(false);

// 任务监控相关
const taskMonitorVisible = ref(false);
const taskMonitorRef = ref(null);
const currentTaskId = ref(null);

// 上传表单数据
const uploadForm = reactive({
  maintenanceFilePath: "/",
  maintenanceFileExtract: 0,
  maintenanceFileOverride: 0
});

// 上传表单验证规则
const uploadRules = {
  maintenanceFilePath: [{ required: true, message: "请输入目标路径", trigger: "blur" }]
};

// 根据关键字过滤文件列表
const filteredFiles = computed(() => {
  if (!searchKeyword.value) return fileList.value;

  const keyword = searchKeyword.value.toLowerCase();
  return fileList.value.filter(file => file.maintenanceFileName && file.maintenanceFileName.toLowerCase().includes(keyword));
});

// 获取维护文件列表
const fetchFiles = async () => {
  loading.value = true;
  try {
    const res = await fetchMaintenanceFiles(props.groupId);
    fileList.value = res.data || [];
  } catch (error) {
    console.error("获取维护文件列表失败:", error);
    message("获取维护文件列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 触发文件选择
const triggerUpload = () => {
  fileInputRef.value.click();
};

// 处理文件选择
const handleFileChange = event => {
  const files = Array.from(event.target.files || []);
  if (files.length > 0) {
    selectedFiles.value = files;
    uploadDialogVisible.value = true;
  }

  // 重置input，确保可以重复选择相同文件
  fileInputRef.value.value = "";
};

// 移除选择的文件
const removeSelectedFile = index => {
  selectedFiles.value.splice(index, 1);
};

// 处理上传对话框关闭
const handleUploadDialogClose = () => {
  selectedFiles.value = [];
  uploadFormRef.value?.resetFields();
};

// 提交上传
const submitUpload = async () => {
  if (selectedFiles.value.length === 0) {
    message("请选择要上传的文件", { type: "warning" });
    return;
  }

  if (uploadFormRef.value) {
    await uploadFormRef.value.validate(async valid => {
      if (valid) {
        uploading.value = true;

        try {
          const formData = new FormData();

          // 添加文件
          selectedFiles.value.forEach(file => {
            formData.append("files", file);
          });

          // 添加其他参数
          formData.append("maintenanceGroupId", props.groupId);
          formData.append("maintenanceFilePath", uploadForm.maintenanceFilePath);
          formData.append("maintenanceFileExtract", uploadForm.maintenanceFileExtract);
          formData.append("maintenanceFileOverride", uploadForm.maintenanceFileOverride);

          const res = await uploadFileToGroup(formData);

          message("文件上传成功", { type: "success" });
          uploadDialogVisible.value = false;
          selectedFiles.value = [];
          fetchFiles();

          // 如果返回任务ID，打开任务监控
          if (res.data && res.data.taskId) {
            openTaskMonitor(res.data.taskId);
          }
        } catch (error) {
          console.error("文件上传失败:", error);
          message("文件上传失败", { type: "error" });
        } finally {
          uploading.value = false;
        }
      }
    });
  }
};

// 部署文件
const deployFile = file => {
  currentFile.value = file;
  deployDialogVisible.value = true;
};

// 确认部署
const confirmDeploy = async () => {
  deploying.value = true;
  try {
    const res = await deployFileApi(currentFile.value.maintenanceFileId, props.groupId);

    message("文件部署任务已提交", { type: "success" });
    deployDialogVisible.value = false;

    // 如果返回任务ID，打开任务监控
    if (res.data && res.data.taskId) {
      openTaskMonitor(res.data.taskId);
    }
  } catch (error) {
    console.error("文件部署失败:", error);
    message("文件部署失败", { type: "error" });
  } finally {
    deploying.value = false;
  }
};

// 打开任务监控
const openTaskMonitor = taskId => {
  currentTaskId.value = taskId;
  taskMonitorVisible.value = true;

  // 等待DOM更新后再调用子组件方法
  setTimeout(() => {
    if (taskMonitorRef.value) {
      taskMonitorRef.value.startMonitor(taskId);
    }
  }, 100);
};

// 删除文件
const deleteFile = async file => {
  try {
    await deleteMaintenanceFile(file.maintenanceFileId);
    message("删除文件成功", { type: "success" });
    fetchFiles();
  } catch (error) {
    console.error("删除文件失败:", error);
    message("删除文件失败", { type: "error" });
  }
};

// 更新文件状态
const updateFileStatus = async file => {
  const newStatus = file.maintenanceFileStatus === 1 ? 0 : 1;
  try {
    const data = { ...file, maintenanceFileStatus: newStatus };
    await updateMaintenanceFile(data);
    message(`${newStatus === 1 ? "启用" : "禁用"}文件成功`, { type: "success" });
    fetchFiles();
  } catch (error) {
    console.error("更新文件状态失败:", error);
    message("更新文件状态失败", { type: "error" });
  }
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
    case "delete":
      ElMessageBox.confirm("确定要删除该文件吗？删除后无法恢复。", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteFile(file);
        })
        .catch(() => {});
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
  fetchFiles
});
</script>

<style lang="scss" scoped>
.files-container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .files-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .files-content {
    flex: 1;
    overflow-y: auto;
  }

  .file-name {
    display: flex;
    align-items: center;

    .file-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }

  .selected-files {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 8px;

    .no-files {
      color: var(--el-text-color-secondary);
      padding: 16px;
      text-align: center;
    }

    .selected-file-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .file-icon {
        margin-right: 8px;
        color: var(--el-color-primary);
      }

      .file-name {
        flex: 1;
        word-break: break-all;
      }

      .file-size {
        color: var(--el-text-color-secondary);
        margin: 0 8px;
      }

      .remove-icon {
        color: var(--el-color-danger);
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .file-info {
    margin-top: 16px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    .info-item {
      margin-bottom: 8px;
      display: flex;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-weight: 500;
        color: var(--el-text-color-secondary);
        min-width: 80px;
      }

      .info-value {
        flex: 1;
        word-break: break-all;
      }
    }
  }

  .deploy-warning {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: var(--el-color-warning-light-9);
    border-radius: 4px;
    margin-bottom: 16px;

    .warning-icon {
      font-size: 24px;
      color: var(--el-color-warning);
      margin-right: 8px;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
