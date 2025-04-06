<template>
  <el-drawer v-model="visible" :append-to-body="true" :title="groupInfo.maintenanceGroupName || '维护组详情'" direction="rtl" size="80%" :close-on-click-modal="false" :destroy-on-close="true">
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">{{ groupInfo.maintenanceGroupName || "维护组详情" }}</span>
        <el-button type="primary" class="upload-btn" @click="openFileUpload">
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
              <span class="section-title">基本信息</span>
              <el-tag :type="groupInfo.maintenanceGroupStatus === 1 ? 'success' : 'danger'" class="status-tag">
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
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabClick">
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
              <el-empty description="任务记录功能开发中" :image-size="180" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 使用对话框组件 -->
    <file-upload-dialog ref="fileUploadDialogRef" @upload="handleUploadSubmit" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
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
const FileUploadDialog = defineAsyncComponent(() => import("./dialogs/FileUploadDialog.vue"));
const TaskMonitorDialog = defineAsyncComponent(() => import("./dialogs/TaskMonitorDialog.vue"));

// 组件引用
const hostsRef = ref(null);
const scriptsRef = ref(null);
const filesRef = ref(null);
const fileUploadDialogRef = ref(null);
const taskMonitorDialogRef = ref(null);

// 确定当前显示的抽屉
const visible = ref(false);
const groupId = ref(null);
const groupInfo = ref({});
const activeTab = ref("hosts");

// 任务ID
const currentTaskId = ref(null);

// 打开抽屉
const open = id => {
  groupId.value = id;
  visible.value = true;

  // 获取维护组详情
  fetchGroupDetail();
};

// 获取维护组详情
const fetchGroupDetail = () => {
  fetchMaintenanceGroupDetail(groupId.value?.maintenanceGroupId)
    .then(res => {
      if (res.code === 200 && res.data) {
        groupInfo.value = res.data;
      }
    })
    .catch(error => {
      console.error("获取维护组详情失败:", error);
      message("获取维护组详情失败", { type: "error" });
    });
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
    default:
      // 不处理其他标签页
      break;
  }
};

// 打开文件上传对话框
const openFileUpload = () => {
  fileUploadDialogRef.value?.open();
};

// 处理文件上传
const handleUploadSubmit = ({ files, path, extract, override }) => {
  if (!files || files.length === 0) return;

  const formData = new FormData();
  formData.append("maintenanceGroupId", groupId.value);
  formData.append("maintenanceFilePath", path);
  formData.append("extract", extract ? 1 : 0);
  formData.append("overwrite", override ? 1 : 0);

  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  fileUploadDialogRef.value.uploading = true;

  uploadFileToGroup(formData)
    .then(res => {
      message("文件上传任务已提交", { type: "success" });
      fileUploadDialogRef.value.close();

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId) {
        currentTaskId.value = res.data.taskId;
        taskMonitorDialogRef.value?.open(res.data.taskId);
      }

      // 刷新文件列表
      if (activeTab.value === "files" && filesRef.value) {
        filesRef.value.fetchFiles();
      }

      fileUploadDialogRef.value.uploading = false;
    })
    .catch(error => {
      console.error("文件上传失败:", error);
      message("文件上传失败", { type: "error" });
      fileUploadDialogRef.value.uploading = false;
    });
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

  .drawer-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 12px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 18px;
      background: var(--el-color-primary);
      border-radius: 2px;
    }
  }

  .upload-btn {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }
}

.detail-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 12px 20px;

  .info-card {
    margin-bottom: 10px;
    transform: translateY(0);
    transition: transform 0.3s ease;
    max-height: 200px;

    &:hover {
      transform: translateY(-4px);
    }

    :deep(.el-card) {
      border-radius: 12px;
      overflow: hidden;
      border: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

      .el-card__header {
        background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-fill-color-light));
        border-bottom: none;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .status-tag {
        border-radius: 16px;
        padding: 2px 12px;
        font-weight: 500;
      }
    }

    .info-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      padding: 8px 0;

      .info-item {
        display: flex;
        transition: all 0.2s ease;
        padding: 8px 12px;
        border-radius: 8px;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        .info-label {
          font-weight: 500;
          color: var(--el-text-color-secondary);
          width: 80px;
          flex-shrink: 0;
        }

        .info-value {
          flex: 1;
          word-break: break-word;
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  .detail-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    overflow: hidden;

    .custom-tabs {
      height: 100%;
      display: flex;
      flex-direction: column;

      :deep(.el-tabs__header) {
        padding: 0 12px;
        margin: 0;
        background: var(--el-fill-color-light);

        .el-tabs__nav-wrap::after {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--el-border-color-light), transparent);
        }

        .el-tabs__item {
          height: 50px;
          line-height: 50px;
          font-size: 15px;
          transition: all 0.3s ease;

          &.is-active {
            font-weight: 600;
            color: var(--el-color-primary);
            transform: translateY(-2px);
          }

          &:hover {
            color: var(--el-color-primary);
          }
        }

        .el-tabs__active-bar {
          height: 3px;
          border-radius: 3px;
        }
      }

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: hidden;
        padding: 16px;

        .el-tab-pane {
          height: 100%;
          animation: fadeIn 0.3s ease-in-out;
        }
      }
    }

    .empty-content {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

      :deep(.el-empty__image) {
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
      }

      :deep(.el-empty__description) {
        margin-top: 16px;
        color: var(--el-text-color-secondary);
        font-size: 15px;
      }
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

.upload-area {
  width: 100%;
  border: 2px dashed var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary);
    background-color: rgba(var(--el-color-primary-rgb), 0.02);
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 20px;

    .upload-icon {
      font-size: 48px;
      color: var(--el-color-primary);
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
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
      margin-bottom: 12px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .selected-file-list {
      max-height: 200px;
      overflow-y: auto;
      border-radius: 8px;
      background-color: var(--el-fill-color-light);
      padding: 8px;

      .selected-file-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 6px;
        background-color: var(--el-bg-color);
        margin-bottom: 8px;
        transition: all 0.2s ease;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          background-color: var(--el-fill-color);
        }

        .selected-file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--el-text-color-primary);
        }

        .selected-file-size {
          color: var(--el-text-color-secondary);
          margin: 0 8px;
        }
      }
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
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

:deep(.el-drawer__body) {
  overflow: hidden;
  padding: 0;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .drawer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .upload-btn {
      align-self: flex-end;
    }
  }

  .info-list {
    grid-template-columns: 1fr !important;
  }
}
</style>
