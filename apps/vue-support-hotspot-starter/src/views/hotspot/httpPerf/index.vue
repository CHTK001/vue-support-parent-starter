<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { wsService } from "@/utils/websocket";

const loading = ref(false);
const summary = ref<any>({});
const topEndpoints = ref<any[]>([]);
const slowEndpoints = ref<any[]>([]);
const errorEndpoints = ref<any[]>([]);
let unsubscribe: (() => void) | null = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 处理 WebSocket 消息 - HTTP 性能数据推送
const handleWsMessage = (message: any) => {
  if (message.event === "HTTP_PERF_UPDATE") {
    try {
      const data = message.data;
      if (data.summary) summary.value = data.summary;
      if (data.topEndpoints) topEndpoints.value = data.topEndpoints;
      if (data.slowEndpoints) slowEndpoints.value = data.slowEndpoints;
      if (data.errorEndpoints) errorEndpoints.value = data.errorEndpoints;
    } catch (error) {
      console.error("解析HTTP性能数据失败:", error);
    }
  }
};

// 获取汇总数据
const fetchSummary = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/http-perf?action=summary");
    const data = await response.json();
    summary.value = data;
  } catch (error) {
    ElMessage.error("获取HTTP性能汇总失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取Top接口
const fetchTopEndpoints = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/http-perf?action=top&limit=20");
    const data = await response.json();
    topEndpoints.value = data.endpoints || [];
  } catch (error) {
    ElMessage.error("获取Top接口失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取慢接口
const fetchSlowEndpoints = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/http-perf?action=slow&limit=20");
    const data = await response.json();
    slowEndpoints.value = data.endpoints || [];
  } catch (error) {
    ElMessage.error("获取慢接口失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取错误接口
const fetchErrorEndpoints = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/http-perf?action=errors&limit=20");
    const data = await response.json();
    errorEndpoints.value = data.endpoints || [];
  } catch (error) {
    ElMessage.error("获取错误接口失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 清除统计
const clearStats = async () => {
  try {
    await fetch("/agent/api/http-perf?action=clear");
    ElMessage.success("统计数据已清除");
    fetchData();
  } catch (error) {
    ElMessage.error("清除失败");
    console.error(error);
  }
};

// 获取所有数据
const fetchData = () => {
  fetchSummary();
  fetchTopEndpoints();
  fetchSlowEndpoints();
  fetchErrorEndpoints();
};

onMounted(() => {
  // 连接 WebSocket
  wsService.connect();
  // 订阅 HTTP 性能数据推送
  unsubscribe = wsService.subscribe("PERFORMANCE", "HTTP_PERF_UPDATE", handleWsMessage);
  // 初始加载数据
  fetchData();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:speed-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">HTTP 性能监控</h2>
          <p class="header-desc">实时监控和分析 HTTP 接口性能</p>
        </div>
      </div>
      <div class="header-right">
        <el-tag :type="wsConnected ? 'success' : 'danger'" effect="light" size="large">
          {{ wsConnected ? 'WS已连接' : 'WS未连接' }}
        </el-tag>
        <el-button type="info" @click="fetchData" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="danger" @click="clearStats">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清除
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:send-plane-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.totalRequests || 0 }}</div>
              <div class="stat-label">总请求数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper danger">
              <IconifyIconOnline icon="ri:error-warning-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value error">{{ summary.totalErrors || 0 }}</div>
              <div class="stat-label">总错误数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:time-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.avgDuration || 0 }}</div>
              <div class="stat-label">平均耗时(ms)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" :class="(summary.errorRate || 0) > 5 ? 'danger' : 'success'">
              <IconifyIconOnline icon="ri:percent-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="{ error: (summary.errorRate || 0) > 5 }">
                {{ (summary.errorRate || 0).toFixed(2) }}%
              </div>
              <div class="stat-label">错误率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Top接口 -->
    <el-card class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:bar-chart-line" class="card-icon" />
            Top 接口
          </span>
          <el-tag type="info" effect="plain">{{ topEndpoints.length }} 条</el-tag>
        </div>
      </template>
      <el-table :data="topEndpoints" v-loading="loading" stripe max-height="300">
        <el-table-column prop="method" label="方法" width="80" />
        <el-table-column prop="url" label="URL" min-width="200" />
        <el-table-column prop="totalRequests" label="请求数" width="100" />
        <el-table-column prop="avgDuration" label="平均耗时(ms)" width="120">
          <template #default="{ row }">
            {{ row.avgDuration?.toFixed(2) || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="p50" label="P50" width="80" />
        <el-table-column prop="p90" label="P90" width="80" />
        <el-table-column prop="p99" label="P99" width="80" />
        <el-table-column prop="errorRate" label="错误率(%)" width="100">
          <template #default="{ row }">
            <span :class="{ error: row.errorRate > 0 }">
              {{ row.errorRate?.toFixed(2) || 0 }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="topEndpoints.length === 0" description="暂无数据" :image-size="60" />
    </el-card>

    <!-- 慢接口 + 错误接口 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:time-line" class="card-icon warning" />
                慢接口
              </span>
              <el-tag type="warning" effect="plain">{{ slowEndpoints.length }} 条</el-tag>
            </div>
          </template>
          <el-table :data="slowEndpoints" v-loading="loading" stripe max-height="280">
            <el-table-column prop="method" label="方法" width="70" />
            <el-table-column prop="url" label="URL" min-width="150" show-overflow-tooltip />
            <el-table-column prop="avgDuration" label="平均(ms)" width="90">
              <template #default="{ row }">
                <span class="slow">{{ row.avgDuration?.toFixed(0) || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="maxDuration" label="最大(ms)" width="90" />
            <el-table-column prop="totalRequests" label="请求数" width="80" />
          </el-table>
          <el-empty v-if="slowEndpoints.length === 0" description="暂无慢接口" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:error-warning-line" class="card-icon danger" />
                错误接口
              </span>
              <el-tag type="danger" effect="plain">{{ errorEndpoints.length }} 条</el-tag>
            </div>
          </template>
          <el-table :data="errorEndpoints" v-loading="loading" stripe max-height="280">
            <el-table-column prop="method" label="方法" width="70" />
            <el-table-column prop="url" label="URL" min-width="150" show-overflow-tooltip />
            <el-table-column prop="errorCount" label="错误数" width="80">
              <template #default="{ row }">
                <span class="error">{{ row.errorCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="errorRate" label="错误率(%)" width="90">
              <template #default="{ row }">
                <span class="error">{{ row.errorRate?.toFixed(2) || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="totalRequests" label="请求数" width="80" />
          </el-table>
          <el-empty v-if="errorEndpoints.length === 0" description="暂无错误接口" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
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
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;
      color: var(--el-color-primary);
      padding: 12px;
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
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
  }
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
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon { color: var(--el-color-danger); }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon { color: var(--el-color-warning); }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon { color: var(--el-color-success); }
    }

    .stat-icon {
      font-size: 24px;
    }
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;

      &.error {
        color: var(--el-color-danger);
      }
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);

        &.warning { color: var(--el-color-warning); }
        &.danger { color: var(--el-color-danger); }
      }
    }
  }

  :deep(.el-card__header) {
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

.error {
  color: var(--el-color-danger);
  font-weight: 600;
}

.slow {
  color: var(--el-color-warning);
  font-weight: 600;
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .page-header {
    background: var(--el-bg-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .stat-card, .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
