<template>
  <div class="server-file-upload-page system-container modern-bg">
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

<style lang="scss" scoped>
.server-file-upload-page {
  padding: 32px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  
  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.04);
  }
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
}

.page-description {
  font-size: 15px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  gap: 12px;
  
  .el-button {
    border-radius: 12px;
    padding: 10px 20px;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.stats-cards {
  margin-bottom: 32px;
}

.stat-card {
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
  }
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.progress-monitoring {
  margin-bottom: 32px;
}

.task-management {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.header-tabs {
  margin-left: auto;
  
  :deep(.el-radio-group) {
    .el-radio-button__inner {
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
  }
}

:deep(.el-card__header) {
  padding: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
}

:deep(.el-card__body) {
  padding: 24px;
}
</style>
