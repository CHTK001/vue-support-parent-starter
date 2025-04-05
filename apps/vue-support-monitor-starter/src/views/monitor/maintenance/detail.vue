<template>
  <div class="maintenance-detail-container">
    <div class="detail-header">
      <div class="header-left">
        <el-button plain class="back-button" @click="backToList">
          <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
          返回
        </el-button>
        <div class="title-section">
          <span class="detail-title">{{ groupInfo.maintenanceGroupName || "维护组详情" }}</span>
          <el-tag :type="groupInfo.maintenanceGroupEnabled ? 'success' : 'danger'" class="status-tag">
            {{ groupInfo.maintenanceGroupEnabled ? "启用" : "禁用" }}
          </el-tag>
        </div>
      </div>
      <el-button v-if="hasHosts" type="primary" class="upload-btn" @click="openFileUpload">
        <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
        文件上传
      </el-button>
    </div>

    <div class="detail-container">
      <!-- 基本信息 -->
      <div class="info-card">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="section-title">基本信息</span>
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
            <maintenance-hosts ref="hostsRef" :group-id="groupId" @hosts-updated="checkHosts" />
          </el-tab-pane>
          <el-tab-pane v-if="hasHosts" label="脚本管理" name="scripts">
            <maintenance-scripts ref="scriptsRef" :group-id="groupId" />
          </el-tab-pane>
          <el-tab-pane v-if="hasHosts" label="文件管理" name="files">
            <maintenance-files ref="filesRef" :group-id="groupId" />
          </el-tab-pane>
          <el-tab-pane label="日志记录" name="logs">
            <maintenance-logs ref="logsRef" :group-id="groupId" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 使用对话框组件 -->
    <file-upload-dialog ref="fileUploadDialogRef" @upload="handleUploadSubmit" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import { fetchMaintenanceGroupDetail, uploadFileToGroup, fetchMaintenanceHosts } from "@/api/monitor/maintenance";

// 异步加载子组件
const MaintenanceHosts = defineAsyncComponent(() => import("./components/MaintenanceHosts.vue"));
const MaintenanceScripts = defineAsyncComponent(() => import("./components/MaintenanceScripts.vue"));
const MaintenanceFiles = defineAsyncComponent(() => import("./components/MaintenanceFiles.vue"));
const MaintenanceLogs = defineAsyncComponent(() => import("./components/MaintenanceLogs.vue"));
const FileUploadDialog = defineAsyncComponent(() => import("./components/dialogs/FileUploadDialog.vue"));
const TaskMonitorDialog = defineAsyncComponent(() => import("./components/dialogs/TaskMonitorDialog.vue"));

// 组件引用
const hostsRef = ref(null);
const scriptsRef = ref(null);
const filesRef = ref(null);
const logsRef = ref(null);
const fileUploadDialogRef = ref(null);
const taskMonitorDialogRef = ref(null);

// 路由
const route = useRoute();
const router = useRouter();

// 数据
const groupId = ref(null);
const groupInfo = ref({});
const activeTab = ref("hosts");
const hasHosts = ref(false);

// 任务ID
const currentTaskId = ref(null);

// 获取维护组详情
const fetchGroupDetail = () => {
  fetchMaintenanceGroupDetail(groupId.value)
    .then(res => {
      groupInfo.value = res.data;
      // 获取主机列表，检查是否有主机
      checkHosts();
    })
    .catch(error => {
      console.error("获取维护组详情失败:", error);
      message("获取维护组详情失败", { type: "error" });
    });
};

// 检查是否有主机
const checkHosts = () => {
  fetchMaintenanceHosts({ maintenanceGroupId: groupId.value })
    .then(res => {
      hasHosts.value = res.data && res.data.length > 0;

      // 如果当前标签页是脚本或文件管理，但没有主机，则切换到主机管理标签
      if (!hasHosts.value && (activeTab.value === "scripts" || activeTab.value === "files")) {
        activeTab.value = "hosts";
      }
    })
    .catch(error => {
      console.error("获取主机列表失败:", error);
    });
};

// 返回列表页
const backToList = () => {
  router.push("/maintenance/index");
};

// 处理标签页切换
const handleTabClick = () => {
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
  if (!hasHosts.value) {
    message("请先添加维护主机", { type: "warning" });
    return;
  }
  fileUploadDialogRef.value?.open();
};

// 处理文件上传
const handleUploadSubmit = ({ files, path, extract, override }) => {
  if (!files || files.length === 0) return;

  const formData = new FormData();
  formData.append("maintenanceGroupId", groupId.value);
  formData.append("maintenanceFilePath", path);
  formData.append("maintenanceFileExtract", extract ? 1 : 0);
  formData.append("maintenanceFileOverride", override ? 1 : 0);

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

// 监听路由变化
watch(
  () => route.params.id,
  newId => {
    if (newId) {
      groupId.value = newId;
      fetchGroupDetail();
    }
  },
  { immediate: true }
);

// 组件挂载
onMounted(() => {
  // 从路由参数获取 groupId
  const { id } = route.params;
  if (id) {
    groupId.value = id;
    fetchGroupDetail();
  } else {
    message("未找到有效的维护组ID", { type: "error" });
    router.push("/maintenance/index");
  }
});
</script>

<style lang="scss" scoped>
.maintenance-detail-container {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  overflow: hidden;
  max-height: 100vh;
  box-sizing: border-box;
  animation: fadeIn 0.4s ease-out;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100px;
    height: 2px;
    background: var(--el-color-primary);
    border-radius: 2px;
  }

  .header-left {
    display: flex;
    align-items: center;

    .back-button {
      margin-right: 16px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(-3px);
      }
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .status-tag {
      border-radius: 16px;
      padding: 6px 12px;
      font-weight: 500;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;

  .info-card {
    margin-bottom: 10px;
    transform: translateY(0);
    transition: transform 0.3s ease;

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

.mr-1 {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .upload-btn {
      align-self: flex-end;
    }
  }

  .info-list {
    grid-template-columns: 1fr !important;
  }
}
</style>
