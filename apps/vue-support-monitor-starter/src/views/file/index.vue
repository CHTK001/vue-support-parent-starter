<template>
  <div class="file-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">文件管理</h1>
        <p class="page-description">
          统一的文件管理平台，支持服务器文件管理、文件上传、文件同步等功能
        </p>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="navigateToUpload">
          <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-1" />
          文件上传
        </el-button>
        <el-button @click="navigateToManagement">
          <IconifyIconOnline icon="ri:folder-line" class="mr-1" />
          文件管理
        </el-button>
      </div>
    </div>

    <!-- 功能卡片 -->
    <div class="feature-cards">
      <el-row :gutter="24">
        <el-col :span="8">
          <el-card class="feature-card" @click="navigateToUpload">
            <div class="card-content">
              <div class="card-icon upload">
                <IconifyIconOnline icon="ri:upload-cloud-2-line" />
              </div>
              <div class="card-info">
                <h3>文件上传</h3>
                <p>批量上传文件到服务器，支持定时上传和实时监控</p>
                <div class="card-stats">
                  <span class="stat-item">
                    <IconifyIconOnline icon="ri:file-line" class="mr-1" />
                    {{ statistics.totalUploadTasks || 0 }} 个任务
                  </span>
                  <span class="stat-item">
                    <IconifyIconOnline icon="ri:time-line" class="mr-1" />
                    {{ statistics.pendingTasks || 0 }} 待处理
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="feature-card" @click="navigateToManagement">
            <div class="card-content">
              <div class="card-icon management">
                <IconifyIconOnline icon="ri:folder-open-line" />
              </div>
              <div class="card-info">
                <h3>文件管理</h3>
                <p>浏览和管理服务器文件，支持多种连接方式</p>
                <div class="card-stats">
                  <span class="stat-item">
                    <IconifyIconOnline icon="ri:server-line" class="mr-1" />
                    {{ statistics.connectedServers || 0 }} 个服务器
                  </span>
                  <span class="stat-item">
                    <IconifyIconOnline icon="ri:folder-line" class="mr-1" />
                    在线管理
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="feature-card" @click="navigateToSync">
            <div class="card-content">
              <div class="card-icon sync">
                <IconifyIconOnline icon="ri:refresh-line" />
              </div>
              <div class="card-info">
                <h3>文件同步</h3>
                <p>自动同步文件到多个服务器，保持数据一致性</p>
                <div class="card-stats">
                  <span class="stat-item">
                    <IconifyIconOnline icon="ri:links-line" class="mr-1" />
                    {{ statistics.syncTasks || 0 }} 个同步任务
                  </span>
                  <span class="stat-item">
                    <IconifyIconOnline icon="ri:check-line" class="mr-1" />
                    自动同步
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快速统计 -->
    <div class="quick-stats">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>快速统计</span>
            <el-button text @click="refreshStats">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item-large">
              <div class="stat-value">{{ statistics.totalFiles || 0 }}</div>
              <div class="stat-label">总文件数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item-large">
              <div class="stat-value">
                {{ formatFileSize(statistics.totalSize || 0) }}
              </div>
              <div class="stat-label">总文件大小</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item-large">
              <div class="stat-value">{{ statistics.todayUploads || 0 }}</div>
              <div class="stat-label">今日上传</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item-large">
              <div class="stat-value">
                {{ statistics.activeConnections || 0 }}
              </div>
              <div class="stat-label">活跃连接</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
            <el-button text @click="viewAllActivities"> 查看全部 </el-button>
          </div>
        </template>

        <div class="activity-list">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon" :class="activity.type">
              <IconifyIconOnline :icon="getActivityIcon(activity.type)" />
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatTime(activity.time) }}</div>
            </div>
            <div class="activity-status" :class="activity.status">
              {{ getStatusText(activity.status) }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import dayjs from "dayjs";

// 路由
const router = useRouter();

// 响应式数据
const statistics = reactive({
  totalUploadTasks: 0,
  pendingTasks: 0,
  connectedServers: 0,
  syncTasks: 0,
  totalFiles: 0,
  totalSize: 0,
  todayUploads: 0,
  activeConnections: 0,
});

const recentActivities = ref([
  {
    id: 1,
    type: "upload",
    title: "文件上传完成",
    description: "config.json 已成功上传到 web-server-01",
    time: new Date(),
    status: "success",
  },
  {
    id: 2,
    type: "management",
    title: "文件删除",
    description: "删除了 /tmp/old-logs/ 目录下的过期日志文件",
    time: new Date(Date.now() - 30 * 60 * 1000),
    status: "success",
  },
  {
    id: 3,
    type: "sync",
    title: "文件同步失败",
    description: "database-backup.sql 同步到 backup-server 失败",
    time: new Date(Date.now() - 60 * 60 * 1000),
    status: "error",
  },
]);

// 生命周期
onMounted(() => {
  loadStatistics();
});

// 方法
const loadStatistics = async () => {
  try {
    // 这里可以调用实际的API获取统计数据
    // 暂时使用模拟数据
    Object.assign(statistics, {
      totalUploadTasks: 156,
      pendingTasks: 8,
      connectedServers: 12,
      syncTasks: 24,
      totalFiles: 8432,
      totalSize: 2.5 * 1024 * 1024 * 1024, // 2.5GB
      todayUploads: 23,
      activeConnections: 8,
    });
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
};

const refreshStats = () => {
  loadStatistics();
  ElMessage.success("统计数据已刷新");
};

const navigateToUpload = () => {
  router.push("/file/upload");
};

const navigateToManagement = () => {
  router.push("/server/file-management");
};

const navigateToSync = () => {
  ElMessage.info("文件同步功能即将上线");
};

const viewAllActivities = () => {
  ElMessage.info("查看全部活动功能即将上线");
};

const formatFileSize = (size: number) => {
  return formatBytes(size);
};

const formatTime = (time: Date) => {
  return dayjs(time).format("MM-DD HH:mm");
};

const getActivityIcon = (type: string) => {
  const iconMap = {
    upload: "ri:upload-line",
    management: "ri:folder-line",
    sync: "ri:refresh-line",
    download: "ri:download-line",
  };
  return iconMap[type] || "ri:file-line";
};

const getStatusText = (status: string) => {
  const statusMap = {
    success: "成功",
    error: "失败",
    pending: "处理中",
    warning: "警告",
  };
  return statusMap[status] || status;
};
</script>

<style scoped>
.file-management-page {
  padding: 24px;
  background-color: #f5f5f5;
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

.feature-cards {
  margin-bottom: 24px;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 160px;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: flex-start;
  height: 100%;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.card-icon.upload {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.management {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.sync {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-info {
  flex: 1;
}

.card-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.card-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.card-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
}

.quick-stats {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item-large {
  text-align: center;
  padding: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.recent-activities {
  background-color: white;
  border-radius: 8px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
  color: white;
}

.activity-icon.upload {
  background-color: #3b82f6;
}

.activity-icon.management {
  background-color: #10b981;
}

.activity-icon.sync {
  background-color: #f59e0b;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.activity-description {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 11px;
  color: #9ca3af;
}

.activity-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.activity-status.success {
  background-color: #dcfce7;
  color: #166534;
}

.activity-status.error {
  background-color: #fef2f2;
  color: #dc2626;
}

.activity-status.pending {
  background-color: #fef3c7;
  color: #d97706;
}
</style>
