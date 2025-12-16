<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const loading = ref(false);
const recordings = ref<any[]>([]);
const status = ref<any>({});
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 获取JFR状态
const fetchStatus = async () => {
  try {
    const response = await fetch("/agent/api/jfr?action=status");
    const data = await response.json();
    status.value = data;
  } catch (error) {
    console.error(error);
  }
};

// 获取录制列表
const fetchRecordings = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/jfr?action=list");
    const data = await response.json();
    recordings.value = data.recordings || [];
  } catch (error) {
    ElMessage.error("获取JFR录制列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 开始录制
const startRecording = async () => {
  ElMessageBox.prompt("请输入录制时长（秒）", "开始JFR录制", {
    confirmButtonText: "开始",
    cancelButtonText: "取消",
    inputPattern: /^\d+$/,
    inputErrorMessage: "请输入有效的数字"
  })
    .then(async ({ value }) => {
      try {
        await fetch(`/agent/api/jfr?action=start&duration=${value}`);
        ElMessage.success("JFR录制已开始");
        fetchRecordings();
        fetchStatus();
      } catch (error) {
        ElMessage.error("开始录制失败");
        console.error(error);
      }
    })
    .catch(() => {});
};

// 停止录制
const stopRecording = async (id: number) => {
  try {
    await fetch(`/agent/api/jfr?action=stop&id=${id}`);
    ElMessage.success("录制已停止");
    fetchRecordings();
    fetchStatus();
  } catch (error) {
    ElMessage.error("停止录制失败");
    console.error(error);
  }
};

// 下载录制文件
const downloadRecording = async (id: number) => {
  try {
    const response = await fetch(`/agent/api/jfr?action=dump&id=${id}`);
    const data = await response.json();
    if (data.file) {
      ElMessage.success(`录制文件已保存: ${data.file}`);
    }
  } catch (error) {
    ElMessage.error("下载录制失败");
    console.error(error);
  }
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

// 格式化大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

// 刷新所有数据
const refreshAll = () => {
  fetchStatus();
  fetchRecordings();
};

onMounted(() => {
  refreshAll();
  // 每30秒刷新一次
  refreshTimer = setInterval(refreshAll, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:record-circle-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">JFR 性能录制</h2>
          <p class="header-desc">JDK Flight Recorder 性能分析工具</p>
        </div>
      </div>
      <div class="header-right">
        <div class="stat-card">
          <div class="stat-number">{{ status.activeRecordings || 0 }}</div>
          <div class="stat-label">活跃录制</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ recordings.length }}</div>
          <div class="stat-label">录制总数</div>
        </div>
        <el-tag :type="status.available ? 'success' : 'danger'" effect="light" size="large">
          {{ status.available ? 'JFR可用' : 'JFR不可用' }}
        </el-tag>
        <el-button type="info" @click="refreshAll" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="startRecording">
          <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" />
          开始录制
        </el-button>
      </div>
    </div>

    <!-- JFR状态卡片 -->
    <el-card class="modern-card status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:information-line" class="card-icon" />
            JFR 状态
          </span>
        </div>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="JFR支持">
          <el-tag :type="status.available ? 'success' : 'danger'" effect="plain">
            {{ status.available ? "可用" : "不可用" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活跃录制">
          <span class="highlight-number">{{ status.activeRecordings || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="Java版本">
          {{ status.javaVersion || "N/A" }}
        </el-descriptions-item>
        <el-descriptions-item label="录制总数">
          <span class="highlight-number">{{ recordings.length }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 录制列表卡片 -->
    <el-card class="modern-card recordings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            录制列表
          </span>
        </div>
      </template>
      <el-table :data="recordings" v-loading="loading" stripe class="modern-table" max-height="400">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="名称" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <IconifyIconOnline icon="ri:file-chart-line" class="text-primary" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.state === 'RUNNING' ? 'success' : 'info'" effect="plain">
              {{ row.state }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(秒)" width="100" align="center" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ row.startTime ? formatTime(row.startTime) : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.size" type="info" effect="plain" size="small">
              {{ formatSize(row.size) }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.state === 'RUNNING'"
              type="warning"
              size="small"
              @click="stopRecording(row.id)"
            >
              <IconifyIconOnline icon="ri:stop-circle-line" class="mr-1" />
              停止
            </el-button>
            <el-button
              v-if="row.state === 'STOPPED'"
              type="primary"
              size="small"
              @click="downloadRecording(row.id)"
            >
              <IconifyIconOnline icon="ri:download-line" class="mr-1" />
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="recordings.length === 0" description="暂无录制记录" />
    </el-card>

    <!-- 使用说明卡片 -->
    <el-card class="modern-card info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:question-line" class="card-icon" />
            使用说明
          </span>
        </div>
      </template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          <span class="alert-title">JDK Flight Recorder (JFR)</span>
        </template>
        <template #default>
          <p class="alert-content">
            JFR 是一个内置于 JVM 的性能分析工具，可以收集详细的诊断和性能数据。需要 Java 11+ 支持。
            录制的数据可以使用 JDK Mission Control 或其他工具进行分析。
          </p>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-warning-light-9) 0%, var(--el-color-warning-light-8) 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;
      color: var(--el-color-warning);
      padding: 12px;
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      border-radius: 12px;
    }

    .header-info {
      .header-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-desc {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .stat-card {
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: var(--el-color-warning);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-warning);
      }
    }
  }
}

.modern-table {
  :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter);
    font-weight: 600;
  }
}

.highlight-number {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

.alert-title {
  font-weight: 600;
}

.alert-content {
  margin: 8px 0 0 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .page-header {
    background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    .header-right .stat-card {
      background: var(--el-bg-color);
    }
  }

  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
