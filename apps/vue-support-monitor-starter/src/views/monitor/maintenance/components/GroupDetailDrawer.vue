<template>
  <el-drawer v-model="visible" :title="groupInfo.maintenanceGroupName || '维护组详情'" direction="rtl" size="80%" :close-on-click-modal="false" :destroy-on-close="true">
    <template #header>
      <div class="drawer-header">
        <span>{{ groupInfo.maintenanceGroupName || "维护组详情" }}</span>
        <el-button type="primary" @click="openFileUpload">
          <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
          文件上传
        </el-button>
      </div>
    </template>

    <div class="detail-container">
      <!-- 基本信息 -->
      <div class="info-card">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag :type="groupInfo.maintenanceGroupStatus === 1 ? 'success' : 'danger'">
                {{ groupInfo.maintenanceGroupStatus === 1 ? "启用" : "禁用" }}
              </el-tag>
            </div>
          </template>
          <div class="info-list">
            <div class="info-item">
              <div class="info-label">名称：</div>
              <div class="info-value">{{ groupInfo.maintenanceGroupName }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">描述：</div>
              <div class="info-value">{{ groupInfo.maintenanceGroupDesc || "暂无描述" }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建时间：</div>
              <div class="info-value">{{ groupInfo.createTime }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">更新时间：</div>
              <div class="info-value">{{ groupInfo.updateTime }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 详情标签页 -->
      <div class="detail-tabs">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="主机管理" name="hosts">
            <maintenance-hosts ref="hostsRef" :group-id="groupId" />
          </el-tab-pane>
          <el-tab-pane label="脚本管理" name="scripts">
            <maintenance-scripts ref="scriptsRef" :group-id="groupId" />
          </el-tab-pane>
          <el-tab-pane label="文件管理" name="files">
            <maintenance-files ref="filesRef" :group-id="groupId" />
          </el-tab-pane>
          <el-tab-pane label="任务记录" name="tasks">
            <div class="empty-content">
              <el-empty description="任务记录功能开发中" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 文件上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="文件上传" width="500px" :close-on-click-modal="false">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="目标路径">
          <el-input v-model="uploadForm.path" placeholder="请输入文件上传的目标路径，如：/usr/local/app" />
        </el-form-item>
        <el-form-item label="自动解压">
          <el-switch v-model="uploadForm.extract" />
          <div class="upload-tip">仅支持zip、tar、tar.gz、tar.bz2格式的压缩文件</div>
        </el-form-item>
        <el-form-item label="覆盖已有文件">
          <el-switch v-model="uploadForm.override" />
        </el-form-item>
        <el-form-item label="选择文件">
          <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
            <input type="file" ref="fileInputRef" style="display: none" @change="handleFileSelect" multiple />
            <div class="upload-content">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" class="upload-icon" />
              <div class="upload-text">
                <span>点击上传文件或将文件拖放到此处</span>
                <span class="upload-hint">支持多个文件同时上传</span>
              </div>
            </div>
            <div v-if="selectedFiles.length > 0" class="selected-files">
              <div class="selected-files-title">已选择 {{ selectedFiles.length }} 个文件：</div>
              <div class="selected-file-list">
                <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file-item">
                  <span class="selected-file-name">{{ file.name }}</span>
                  <span class="selected-file-size">({{ formatFileSize(file.size) }})</span>
                  <el-button type="danger" size="small" circle @click.stop="removeFile(index)">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div>
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :disabled="selectedFiles.length === 0 || uploading" :loading="uploading">开始上传</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务监控对话框 -->
    <el-dialog v-model="monitorDialogVisible" title="上传任务监控" width="70%" :close-on-click-modal="false" :destroy-on-close="true">
      <task-monitor ref="taskMonitorRef" :task-id="currentTaskId" />
    </el-dialog>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceGroupDetail, uploadFileToGroup } from "@/api/monitor/maintenance";

// 异步加载子组件
const MaintenanceHosts = defineAsyncComponent(() => import("./MaintenanceHosts.vue"));
const MaintenanceScripts = defineAsyncComponent(() => import("./MaintenanceScripts.vue"));
const MaintenanceFiles = defineAsyncComponent(() => import("./MaintenanceFiles.vue"));
const TaskMonitor = defineAsyncComponent(() => import("./TaskMonitor.vue"));

// 组件引用
const hostsRef = ref(null);
const scriptsRef = ref(null);
const filesRef = ref(null);
const taskMonitorRef = ref(null);

// 确定当前显示的抽屉
const visible = ref(false);
const groupId = ref(null);
const groupInfo = ref({});
const activeTab = ref("hosts");

// 文件上传对话框
const uploadDialogVisible = ref(false);
const uploadForm = reactive({
  path: "/",
  extract: false,
  override: false
});
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const uploading = ref(false);

// 任务监控对话框
const monitorDialogVisible = ref(false);
const currentTaskId = ref(null);

// 打开抽屉
const open = id => {
  groupId.value = id;
  visible.value = true;

  // 获取维护组详情
  fetchGroupDetail();

  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, 300);
  });
};

// 获取维护组详情
const fetchGroupDetail = async () => {
  try {
    const res = await fetchMaintenanceGroupDetail(groupId.value);
    if (res.code === 200 && res.data) {
      groupInfo.value = res.data;
    }
  } catch (error) {
    console.error("获取维护组详情失败:", error);
    message("获取维护组详情失败", { type: "error" });
  }
};

// 处理标签页切换
const handleTabClick = () => {
  // 可以在这里添加标签页切换逻辑
  // 例如刷新当前标签页的数据
  refreshCurrentTabData();
};

// 刷新当前标签页数据
const refreshCurrentTabData = () => {
  switch (activeTab.value) {
    case "hosts":
      hostsRef.value?.fetchHosts();
      break;
    case "scripts":
      scriptsRef.value?.fetchScripts();
      break;
    case "files":
      filesRef.value?.fetchFiles();
      break;
    default:
      // 不处理其他标签页
      break;
  }
};

// 打开文件上传对话框
const openFileUpload = () => {
  uploadDialogVisible.value = true;
  selectedFiles.value = [];
  uploadForm.path = "/";
  uploadForm.extract = false;
  uploadForm.override = false;
};

// 点击触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileSelect = event => {
  const files = event.target.files;
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      selectedFiles.value.push(files[i]);
    }
  }
  // 重置文件输入以允许重新选择相同的文件
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// 处理文件拖放
const handleDrop = event => {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      selectedFiles.value.push(files[i]);
    }
  }
};

// 移除已选择的文件
const removeFile = index => {
  selectedFiles.value.splice(index, 1);
};

// 格式化文件大小
const formatFileSize = bytes => {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
};

// 提交上传
const submitUpload = async () => {
  if (selectedFiles.value.length === 0) {
    message("请选择要上传的文件", { type: "warning" });
    return;
  }

  uploading.value = true;
  try {
    // 创建FormData对象
    const formData = new FormData();

    // 添加文件
    selectedFiles.value.forEach(file => {
      formData.append("files", file);
    });

    // 添加其他参数
    formData.append("maintenanceGroupId", groupId.value);
    formData.append("maintenanceFilePath", uploadForm.path);
    formData.append("maintenanceFileExtract", uploadForm.extract ? 1 : 0);
    formData.append("maintenanceFileOverride", uploadForm.override ? 1 : 0);

    // 发送上传请求
    const res = await uploadFileToGroup(formData);

    if (res.code === 200) {
      message("文件上传成功", { type: "success" });
      uploadDialogVisible.value = false;

      // 如果返回了任务ID，打开任务监控
      if (res.data && res.data.taskId) {
        currentTaskId.value = res.data.taskId;
        monitorDialogVisible.value = true;
        // 等待DOM更新后再调用子组件方法
        setTimeout(() => {
          if (taskMonitorRef.value) {
            taskMonitorRef.value.startMonitor(res.data.taskId);
          }
        }, 100);
      }

      // 如果当前标签是文件管理，刷新文件列表
      if (activeTab.value === "files" && filesRef.value) {
        filesRef.value.fetchFiles();
      }
    } else {
      message(res.message || "文件上传失败", { type: "error" });
    }
  } catch (error) {
    console.error("文件上传失败:", error);
    message("文件上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
};

// 监听抽屉关闭
watch(visible, newVal => {
  if (!newVal) {
    // 抽屉关闭时，重置一些状态
    activeTab.value = "hosts";
  }
});

// 导出方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.detail-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .info-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;

      .info-item {
        display: flex;

        .info-label {
          font-weight: 500;
          color: var(--el-text-color-secondary);
          width: 80px;
          flex-shrink: 0;
        }

        .info-value {
          flex: 1;
          word-break: break-word;
        }
      }
    }
  }

  .detail-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs) {
      height: 100%;
      display: flex;
      flex-direction: column;

      .el-tabs__content {
        flex: 1;
        overflow: hidden;

        .el-tab-pane {
          height: 100%;
        }
      }
    }

    .empty-content {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}

.upload-area {
  width: 100%;
  border: 2px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;

    .upload-icon {
      font-size: 48px;
      color: var(--el-color-primary);
      margin-bottom: 16px;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
      align-items: center;

      .upload-hint {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 8px;
      }
    }
  }

  .selected-files {
    padding: 16px;
    border-top: 1px dashed var(--el-border-color);

    .selected-files-title {
      margin-bottom: 8px;
      font-weight: 500;
    }

    .selected-file-list {
      max-height: 200px;
      overflow-y: auto;

      .selected-file-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .selected-file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selected-file-size {
          color: var(--el-text-color-secondary);
          margin: 0 8px;
        }
      }
    }
  }
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.mr-1 {
  margin-right: 4px;
}
</style>
