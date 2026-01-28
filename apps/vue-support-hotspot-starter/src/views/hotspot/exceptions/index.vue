<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { wsService } from "@/utils/websocket";

const loading = ref(false);
const exceptions = ref<any[]>([]);
const stats = ref<any[]>([]);
const activeTab = ref("list");
const selectedEx = ref<any>(null);
const dialogVisible = ref(false);
let unsubscribe: (() => void) | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 处理 WebSocket 消息 - 异常数据推送
const handleWsMessage = (message: any) => {
  if (message.event === "EXCEPTION_UPDATE") {
    try {
      const exData = message.data;
      // 添加到列表开头
      exceptions.value.unshift(exData);
      // 限制最大记录数
      while (exceptions.value.length > 200) {
        exceptions.value.pop();
      }
    } catch (error) {
      console.error("解析异常数据失败:", error);
    }
  }
};

// 获取最近异常列表
const fetchExceptions = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/exceptions?action=list&limit=100");
    const data = await response.json();
    exceptions.value = data.exceptions || [];
  } catch (error) {
    ElMessage.error("获取异常列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取异常统计
const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/exceptions?action=stats");
    const data = await response.json();
    stats.value = data.statistics || [];
  } catch (error) {
    ElMessage.error("获取异常统计失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查看异常详情
const viewException = (row: any) => {
  selectedEx.value = row;
  dialogVisible.value = true;
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

// 清除统计
const clearStats = async () => {
  try {
    await fetch("/agent/api/exceptions?action=clear");
    ElMessage.success("异常统计已清除");
    fetchData();
  } catch (error) {
    ElMessage.error("清除失败");
    console.error(error);
  }
};

// 获取所有数据
const fetchData = () => {
  fetchExceptions();
  fetchStats();
};

onMounted(() => {
  // 连接 WebSocket
  wsService.connect();
  // 订阅异常数据推送
  unsubscribe = wsService.subscribe("EXCEPTION", "EXCEPTION_UPDATE", handleWsMessage);
  // 加载历史数据
  fetchData();
  // 每30秒刷新一次
  refreshTimer = setInterval(fetchData, 30000);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper danger">
              <IconifyIconOnline icon="ri:bug-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ exceptions.length }}</div>
              <div class="stat-label">异常记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:bar-chart-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.length }}</div>
              <div class="stat-label">异常类型</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div :class="['stat-icon-wrapper', wsConnected ? 'success' : 'danger']">
              <IconifyIconOnline icon="ri:wifi-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ wsConnected ? '已连接' : '未连接' }}</div>
              <div class="stat-label">WebSocket 状态</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper info">
              <IconifyIconOnline icon="ri:settings-3-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-actions">
                <el-button type="primary" size="small" :loading="loading" @click="fetchData">刷新</el-button>
                <el-button type="danger" size="small" @click="clearStats">清除</el-button>
              </div>
              <div class="stat-label">操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 内容卡片 -->
    <el-card class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            异常列表
          </span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="modern-tabs">
        <el-tab-pane label="异常列表" name="list">
          <el-table
            v-loading="loading"
            :data="exceptions"
            stripe
            max-height="600"
          >
            <el-table-column prop="exceptionType" label="异常类型" width="250">
              <template #default="{ row }">
                <el-tag type="danger">{{
                  row.exceptionType.split(".").pop()
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="message"
              label="异常消息"
              min-width="300"
              show-overflow-tooltip
            />
            <el-table-column prop="thread" label="线程" width="150" />
            <el-table-column prop="location" label="位置" width="200" />
            <el-table-column prop="timestamp" label="发生时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="text"
                  size="small"
                  @click="viewException(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="异常统计" name="stats">
          <el-table v-loading="loading" :data="stats" stripe>
            <el-table-column prop="exceptionType" label="异常类型" width="300">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.exceptionType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="发生次数" width="120" />
            <el-table-column
              prop="firstOccurrence"
              label="首次发生"
              width="180"
            >
              <template #default="{ row }">
                {{ formatTime(row.firstOccurrence) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="lastOccurrence"
              label="最后发生"
              width="180"
            >
              <template #default="{ row }">
                {{ formatTime(row.lastOccurrence) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 异常详情对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      title="异常详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedEx" class="exception-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="异常类型">
            <el-tag type="danger">{{ selectedEx.exceptionType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            {{ formatTime(selectedEx.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="线程">
            {{ selectedEx.thread }}
          </el-descriptions-item>
          <el-descriptions-item label="位置">
            {{ selectedEx.location }}
          </el-descriptions-item>
          <el-descriptions-item label="异常消息" :span="2">
            {{ selectedEx.message }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="stack-trace">
          <h4>堆栈跟踪：</h4>
          <pre>{{ selectedEx.stackTrace }}</pre>
        </div>
      </div>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      .stat-icon { color: var(--el-color-primary); }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon { color: var(--el-color-success); }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon { color: var(--el-color-warning); }
    }
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon { color: var(--el-color-danger); }
    }
    &.info {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      .stat-icon { color: var(--el-color-info); }
    }

    .stat-icon {
      font-size: 24px;
    }
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .stat-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

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
        color: var(--el-color-danger);
      }
    }
  }
}

.modern-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.exception-detail {
  .stack-trace {
    margin-top: 20px;

    h4 {
      margin-bottom: 10px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    pre {
      background: var(--el-fill-color-lighter);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: "Monaco", "Menlo", monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--el-color-danger);
    }
  }
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .stat-card, .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
