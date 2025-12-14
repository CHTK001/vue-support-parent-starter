<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { wsService } from "@/utils/websocket";

const loading = ref(false);
const summary = ref<any>({});
const topEndpoints = ref<any[]>([]);
const slowEndpoints = ref<any[]>([]);
const errorEndpoints = ref<any[]>([]);
const activeTab = ref("summary");
let unsubscribe: (() => void) | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

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
  // 每10秒刷新一次
  refreshTimer = setInterval(fetchData, 10000);
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
  <div class="http-perf-container">
    <el-card class="summary-card">
      <template #header>
        <div class="card-header">
          <span>HTTP性能汇总</span>
          <div class="header-actions">
            <el-tag :type="wsConnected ? 'success' : 'danger'" size="small">
              {{ wsConnected ? 'WS已连接' : 'WS未连接' }}
            </el-tag>
            <el-button type="info" size="small" @click="fetchData" :loading="loading">
              刷新
            </el-button>
            <el-button type="primary" size="small" @click="clearStats">
              清除统计
            </el-button>
          </div>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">总请求数</div>
            <div class="stat-value">{{ summary.totalRequests || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">总错误数</div>
            <div class="stat-value error">{{ summary.totalErrors || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">平均耗时(ms)</div>
            <div class="stat-value">{{ summary.avgDuration || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">错误率(%)</div>
            <div class="stat-value error">
              {{ (summary.errorRate || 0).toFixed(2) }}
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-tabs v-model="activeTab" class="tabs-container">
      <el-tab-pane label="Top接口" name="top">
        <el-table :data="topEndpoints" v-loading="loading" stripe>
          <el-table-column prop="method" label="方法" width="80" />
          <el-table-column prop="url" label="URL" min-width="200" />
          <el-table-column prop="totalRequests" label="请求数" width="100" />
          <el-table-column prop="avgDuration" label="平均耗时(ms)" width="120">
            <template #default="{ row }">
              {{ row.avgDuration.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="p50" label="P50(ms)" width="100" />
          <el-table-column prop="p90" label="P90(ms)" width="100" />
          <el-table-column prop="p95" label="P95(ms)" width="100" />
          <el-table-column prop="p99" label="P99(ms)" width="100" />
          <el-table-column prop="errorRate" label="错误率(%)" width="100">
            <template #default="{ row }">
              <span :class="{ error: row.errorRate > 0 }">
                {{ row.errorRate.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="慢接口" name="slow">
        <el-table :data="slowEndpoints" v-loading="loading" stripe>
          <el-table-column prop="method" label="方法" width="80" />
          <el-table-column prop="url" label="URL" min-width="200" />
          <el-table-column prop="avgDuration" label="平均耗时(ms)" width="120">
            <template #default="{ row }">
              <span class="slow">{{ row.avgDuration.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="maxDuration" label="最大耗时(ms)" width="120" />
          <el-table-column prop="p95" label="P95(ms)" width="100" />
          <el-table-column prop="p99" label="P99(ms)" width="100" />
          <el-table-column prop="totalRequests" label="请求数" width="100" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="错误接口" name="errors">
        <el-table :data="errorEndpoints" v-loading="loading" stripe>
          <el-table-column prop="method" label="方法" width="80" />
          <el-table-column prop="url" label="URL" min-width="200" />
          <el-table-column prop="errorCount" label="错误数" width="100">
            <template #default="{ row }">
              <span class="error">{{ row.errorCount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="errorRate" label="错误率(%)" width="100">
            <template #default="{ row }">
              <span class="error">{{ row.errorRate.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalRequests" label="总请求数" width="100" />
          <el-table-column prop="avgDuration" label="平均耗时(ms)" width="120">
            <template #default="{ row }">
              {{ row.avgDuration.toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.http-perf-container {
  padding: 20px;
}

.summary-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.stat-item {
  text-align: center;
  padding: 10px;

  .stat-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #409eff;

    &.error {
      color: #f56c6c;
    }
  }
}

.tabs-container {
  margin-top: 20px;
}

.error {
  color: #f56c6c;
  font-weight: bold;
}

.slow {
  color: #e6a23c;
  font-weight: bold;
}
</style>
