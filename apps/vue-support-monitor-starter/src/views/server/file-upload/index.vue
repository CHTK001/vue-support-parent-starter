<template>
  <div class="server-file-upload-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">服务器文件上传</h1>
        <p class="page-description">
          管理SSH服务器的文件上传任务，支持实时上传和定时上传
        </p>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="handleCreateTask">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          新建上传任务
        </el-button>
        <el-button @click="handleRefreshStats">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新统计
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <IconifyIconOnline icon="ep:clock" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.pendingCount || 0 }}</div>
                <div class="stat-label">待处理任务</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon processing">
                <IconifyIconOnline icon="ep:loading" />
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ statistics.processingCount || 0 }}
                </div>
                <div class="stat-label">处理中任务</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon completed">
                <IconifyIconOnline icon="ep:check" />
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ statistics.completedCount || 0 }}
                </div>
                <div class="stat-label">已完成任务</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon failed">
                <IconifyIconOnline icon="ep:close" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.failedCount || 0 }}</div>
                <div class="stat-label">失败任务</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 实时进度监控 -->
    <div class="progress-monitoring">
      <ServerFileUploadProgress
        @view-task-detail="handleViewTaskDetail"
        @refresh="handleRefreshStats"
      />
    </div>

    <!-- 任务管理 -->
    <div class="task-management">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>任务管理</span>
            <div class="header-tabs">
              <el-radio-group v-model="activeTab" @change="handleTabChange">
                <el-radio-button value="all">全部任务</el-radio-button>
                <el-radio-button value="pending">待处理</el-radio-button>
                <el-radio-button value="processing">处理中</el-radio-button>
                <el-radio-button value="completed">已完成</el-radio-button>
                <el-radio-button value="failed">失败</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>

        <ServerFileUploadTasks
          ref="taskManagerRef"
          :ssh-servers="sshServers"
          @task-updated="handleTaskUpdated"
        />
      </el-card>
    </div>

    <!-- 上传对话框 -->
    <ServerFileUploadDialog
      ref="uploadDialogRef"
      :ssh-servers="sshServers"
      @success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
// 移除 @element-plus/icons-vue 导入，使用全局 IconifyIconOnline 组件
import {
  getServerFileUploadTaskStatistics,
  getServerFileUploadTaskById,
} from "@/api/server-file-upload";
import { getServerList } from "@/api/server";
import ServerFileUploadTasks from "../components/ServerFileUploadTasks.vue";
import ServerFileUploadDialog from "../components/dialogs/ServerFileUploadDialog.vue";
import ServerFileUploadProgress from "../components/ServerFileUploadProgress.vue";

// 响应式数据
const loading = ref(false);
const activeTab = ref("all");
const taskManagerRef = ref();
const uploadDialogRef = ref();

// SSH服务器列表
const sshServers = ref<
  Array<{
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerType: string;
  }>
>([]);

// 统计数据
const statistics = reactive({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  failedCount: 0,
  cancelledCount: 0,
  successRate: 0,
  avgUploadTime: 0,
  totalFileSize: 0,
});

// 定时器
let statsTimer: NodeJS.Timeout | null = null;

// 生命周期
onMounted(() => {
  loadSshServers();
  loadStatistics();

  // 启动定时刷新
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 方法
const loadSshServers = async () => {
  try {
    const { data } = await getServerList({
      current: 1,
      size: 1000,
      serverType: "SSH",
    });

    sshServers.value = data.records || [];
  } catch (error: any) {
    console.error("加载SSH服务器列表失败:", error);
    message("加载SSH服务器列表失败", { type: "error" });
  }
};

const loadStatistics = async () => {
  try {
    const { data } = await getServerFileUploadTaskStatistics();

    Object.assign(statistics, {
      totalCount: data.totalCount || 0,
      pendingCount: data.pendingCount || 0,
      processingCount: data.processingCount || 0,
      completedCount: data.completedCount || 0,
      failedCount: data.failedCount || 0,
      cancelledCount: data.cancelledCount || 0,
      successRate: data.successRate || 0,
      avgUploadTime: data.avgUploadTime || 0,
      totalFileSize: data.totalFileSize || 0,
    });
  } catch (error: any) {
    console.error("加载统计数据失败:", error);
  }
};

const handleRefreshStats = () => {
  loadStatistics();
  taskManagerRef.value?.handleRefresh();
};

const handleCreateTask = () => {
  uploadDialogRef.value?.open();
};

const handleUploadSuccess = () => {
  message("上传任务创建成功", { type: "success" });
  loadStatistics();
  taskManagerRef.value?.handleRefresh();
};

const handleTaskUpdated = () => {
  loadStatistics();
};

const handleTabChange = (tab: string) => {
  // 根据选中的标签页过滤任务
  const statusMap = {
    all: "",
    pending: "PENDING",
    processing: "PROCESSING",
    completed: "COMPLETED",
    failed: "FAILED",
  };

  const status = statusMap[tab] || "";
  taskManagerRef.value?.setStatusFilter(status);
};

const handleViewTaskDetail = async (taskId: number) => {
  try {
    const { data } = await getServerFileUploadTaskById(taskId);
    // 这里可以打开任务详情对话框或跳转到详情页面
    console.log("任务详情:", data);
  } catch (error: any) {
    message(error.message || "获取任务详情失败", { type: "error" });
  }
};

const startAutoRefresh = () => {
  // 每30秒刷新统计数据
  statsTimer = setInterval(() => {
    loadStatistics();
  }, 30000);
};

const stopAutoRefresh = () => {
  if (statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
};
</script>

<style scoped>
.server-file-upload-page {
  padding: 24px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.stat-icon.pending {
  background-color: #3b82f6;
}

.stat-icon.processing {
  background-color: #f59e0b;
}

.stat-icon.completed {
  background-color: #10b981;
}

.stat-icon.failed {
  background-color: #ef4444;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.progress-monitoring {
  margin-bottom: 24px;
}

.task-management {
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tabs {
  margin-left: auto;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-card__body) {
  padding: 0;
}
</style>
