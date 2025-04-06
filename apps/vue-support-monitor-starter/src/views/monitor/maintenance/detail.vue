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

    <!-- 全局日志悬浮窗口 -->
    <div v-show="showGlobalLog" class="global-log-panel" :class="{ expanded: logPanelExpanded }">
      <div class="panel-header" @click="toggleLogPanelExpand">
        <div class="title-area">
          <IconifyIconOnline icon="ri:terminal-box-line" class="mr-1" />
          <span>实时日志监控</span>
          <el-tag size="small" type="info" class="ml-2">{{ groupInfo.maintenanceGroupName }}</el-tag>
        </div>
        <div class="controls">
          <el-tooltip content="最小化" placement="top" :offset="5">
            <el-button v-show="logPanelExpanded" type="primary" link size="small" @click.stop="toggleLogPanelExpand">
              <IconifyIconOnline icon="ri:arrow-down-s-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="关闭" placement="top" :offset="5">
            <el-button type="primary" link size="small" @click.stop="toggleGlobalLog">
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div v-show="logPanelExpanded" class="panel-content">
        <real-time-log-monitor :channel="globalLogChannel" />
      </div>
    </div>

    <!-- 显示日志悬浮按钮 -->
    <div v-show="!showGlobalLog" class="show-log-button" @click="toggleGlobalLog">
      <IconifyIconOnline icon="ri:terminal-box-line" class="mr-1" />
      显示日志
    </div>

    <!-- 使用对话框组件 -->
    <file-upload-dialog ref="fileUploadDialogRef" @upload="handleUploadSubmit" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent, inject, watch, computed, onBeforeUnmount } from "vue";
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
const RealTimeLogMonitor = defineAsyncComponent(() => import("./components/RealTimeLogMonitor.vue"));

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

// 全局日志
const showGlobalLog = ref(true);
const logPanelExpanded = ref(true);
const globalLogChannel = computed(() => `event-maintenance-${groupId.value}`);
const socket = ref(null);

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
  formData.append("targetPath", path);
  formData.append("extract", !!extract);
  formData.append("overwrite", !!override);

  formData.append("file", files[0]);

  fileUploadDialogRef.value.uploading = true;

  uploadFileToGroup(formData)
    .then(res => {
      message("文件上传任务已提交", { type: "success" });
      fileUploadDialogRef.value.close();

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId && inject("socket")) {
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

// 切换日志面板显示
const toggleGlobalLog = () => {
  showGlobalLog.value = !showGlobalLog.value;
  if (showGlobalLog.value) {
    logPanelExpanded.value = true;
  }
};

// 切换日志面板收缩状态
const toggleLogPanelExpand = () => {
  logPanelExpanded.value = !logPanelExpanded.value;
};

// 初始化Socket连接
const initSocket = () => {
  socket.value = inject("socket");

  if (!socket.value) {
    console.error("Socket实例不存在");
    return;
  }

  // 监听全局事件
  socket.value.on(`group:${groupId.value}:status`, data => {
    try {
      const statusData = typeof data === "string" ? JSON.parse(data) : data;
      if (statusData.message) {
        message(statusData.message, { type: getMessageType(statusData.status) });
      }
    } catch (error) {
      console.error("处理状态消息错误:", error);
    }
  });
};

// 获取消息类型
const getMessageType = status => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "RUNNING":
      return "info";
    case "COMPLETED_WITH_ERRORS":
      return "warning";
    default:
      return "info";
  }
};

// 在组件卸载前清理
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.off(`group:${groupId.value}:status`);
  }
});

// 监听路由变化
watch(
  () => route.params.id,
  newId => {
    if (newId) {
      groupId.value = newId;
      fetchGroupDetail();
      initSocket();
    }
  },
  { immediate: true }
);

// 组件挂载
onMounted(() => {
  // 从路由参数获取 groupId
  const { id } = route.params;
  if (!id) {
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
  overflow-x: hidden; /* 防止横向滚动 */
  overflow-y: auto; /* 允许纵向滚动 */
  max-height: 100vh;
  box-sizing: border-box;
  position: relative;
  width: 100%; /* 确保容器不会超出父容器宽度 */

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%; /* 修改为100%，防止溢出 */
    height: 100%; /* 修改为100%，防止溢出 */
    opacity: 0.8;
    pointer-events: none;
    z-index: 0;
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  position: relative;
  padding: 18px 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--el-border-color-light);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.03),
    0 0 0 1px rgba(var(--el-color-primary-rgb), 0.05);
  z-index: 1;
  background-color: rgba(var(--el-bg-color-rgb), 0.7);
  animation: fadeIn 0.5s ease-in-out;
  width: 100%; /* 确保不超出父容器 */
  box-sizing: border-box; /* 确保padding不会增加宽度 */
  max-width: 100%; /* 限制最大宽度 */
  width: 100%; /* 确保不超出父容器 */
  box-sizing: border-box; /* 确保padding不会增加宽度 */
  max-width: 100%; /* 限制最大宽度 */

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 120px;
    height: 3px;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-5), transparent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 180px;
  }

  .header-left {
    display: flex;
    align-items: center;

    .back-button {
      margin-right: 18px;
      border-radius: 12px;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      padding: 10px 16px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      &:hover {
        transform: translateX(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &:active {
        transform: translateX(-2px);
      }
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .detail-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
      padding-bottom: 2px;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
        transition: width 0.3s ease;
      }

      &:hover::after {
        width: 100%;
      }
    }

    .status-tag {
      border-radius: 20px;
      padding: 6px 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
    }
  }

  .upload-btn {
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 10px 18px;
    font-weight: 500;
    position: relative;
    overflow: hidden;
    z-index: 1;
    box-shadow: 0 4px 15px rgba(var(--el-color-primary-rgb), 0.2);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
      transition: left 0.7s ease;
      z-index: -1;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(var(--el-color-primary-rgb), 0.3);

      &::before {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

.detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  .info-card {
    margin-bottom: 12px;
    transform: translateY(0);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    will-change: transform, box-shadow;

    &:hover {
      transform: translateY(-6px);
    }

    :deep(.el-card) {
      border-radius: 20px;
      overflow: hidden;
      border: none;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.03),
        0 0 0 1px rgba(var(--el-color-primary-rgb), 0.05);
      transition: all 0.4s ease;
      background-color: rgba(var(--el-bg-color-rgb), 0.8);

      .info-card:hover & {
        box-shadow:
          0 15px 30px rgba(0, 0, 0, 0.1),
          0 2px 8px rgba(0, 0, 0, 0.05),
          0 0 0 1px rgba(var(--el-color-primary-rgb), 0.08);
      }

      .el-card__header {
        background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-fill-color-light));
        border-bottom: none;
        padding: 16px 20px;
      }

      .el-card__body {
        padding: 20px;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;

      .section-title {
        font-size: 17px;
        font-weight: 600;
        color: var(--el-color-primary);
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
    }

    .info-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 18px;
      padding: 10px 0;

      .info-item {
        display: flex;
        transition: all 0.3s ease;
        padding: 10px 14px;
        border-radius: 12px;
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          background-color: var(--el-fill-color-light);
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

          &::before {
            opacity: 1;
          }
        }

        .info-label {
          font-weight: 500;
          color: var(--el-text-color-secondary);
          width: 80px;
          flex-shrink: 0;
          position: relative;
          transition: all 0.3s ease;

          &::after {
            content: "";
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--el-color-primary-light-5);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .info-item:hover &::after {
            opacity: 1;
          }
        }

        .info-value {
          flex: 1;
          word-break: break-word;
          color: var(--el-text-color-primary);
          transition: all 0.3s ease;
          padding-left: 0;

          .info-item:hover & {
            padding-left: 8px;
            font-weight: 500;
          }
        }
      }
    }
  }

  .detail-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(var(--el-color-primary-rgb), 0.05);
    overflow: hidden;
    transition: all 0.4s ease;
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.05);

    &:hover {
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.1),
        0 4px 12px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(var(--el-color-primary-rgb), 0.08);
    }

    .custom-tabs {
      height: 100%;
      display: flex;
      flex-direction: column;

      :deep(.el-tabs__header) {
        padding: 0 16px;
        margin: 0;
        background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-fill-color-light));
        border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.08);

        .el-tabs__nav-wrap::after {
          height: 0; /* 移除默认的底部线 */
        }

        .el-tabs__nav {
          padding: 8px 0;
        }

        .el-tabs__item {
          height: 54px;
          line-height: 54px;
          font-size: 16px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 0 20px;
          position: relative;
          margin: 0 4px;
          border-radius: 8px 8px 0 0;

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(var(--el-color-primary-rgb), 0.1), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: 8px 8px 0 0;
          }

          &.is-active {
            font-weight: 600;
            color: var(--el-color-primary);
            transform: translateY(-4px);
            background-color: rgba(var(--el-color-primary-rgb), 0.05);
            box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.03);

            &::before {
              opacity: 1;
            }
          }

          &:hover:not(.is-active) {
            color: var(--el-color-primary);
            transform: translateY(-2px);
          }
        }

        .el-tabs__active-bar {
          height: 4px;
          border-radius: 4px 4px 0 0;
          bottom: -1px;
          background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
        }
      }

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: hidden;
        padding: 20px;
        background-color: rgba(255, 255, 255, 0.6);

        .el-tab-pane {
          height: 100%;
          animation: fadeIn 0.5s ease-in-out;
          position: relative;

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 90% 10%, rgba(var(--el-color-primary-rgb), 0.03), transparent 70%);
            pointer-events: none;
          }
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
    transform: translateY(20px);
    filter: blur(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(var(--el-color-primary-rgb), 0);
    transform: scale(1.08);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
    transform: scale(1);
  }
}

.global-log-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 700px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--el-border-color);
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  max-height: 500px;

  &.expanded {
    max-height: 500px;
    height: 500px;
  }

  &:not(.expanded) {
    max-height: 52px;
    height: 52px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-fill-color-light));
    border-bottom: 1px solid var(--el-border-color-light);
    cursor: pointer;
    user-select: none;

    .title-area {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--el-color-primary-darken-10);

      .ml-2 {
        margin-left: 8px;
      }
    }

    .controls {
      display: flex;
      gap: 8px;
    }
  }

  .panel-content {
    height: calc(100% - 52px);
    overflow: hidden;
  }
}

.show-log-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--el-color-primary);
  color: white;
  padding: 10px 16px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(var(--el-color-primary-rgb), 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.4);
  }

  &:active {
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
    padding: 15px;

    .upload-btn {
      align-self: flex-end;
    }
  }

  .info-list {
    grid-template-columns: 1fr !important;
  }

  .maintenance-detail-container {
    padding: 10px;
  }

  .detail-container {
    gap: 15px;
  }

  .detail-tabs :deep(.el-tabs__header) {
    padding: 0 10px;
  }

  .detail-tabs :deep(.el-tabs__content) {
    padding: 15px 10px;
  }

  .global-log-panel {
    width: calc(100% - 40px);
    bottom: 10px;
    right: 10px;
    max-height: 400px;

    &.expanded {
      max-height: 400px;
      height: 400px;
    }
  }

  .show-log-button {
    bottom: 10px;
    right: 10px;
  }
}
</style>
