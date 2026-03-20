<template>
  <div class="monitor-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <div class="title-group">
            <h3>{{ taskId ? "任务监控" : "监控仪表板" }}</h3>
            <el-tag v-if="taskId" type="info">任务 #{{ taskId }}</el-tag>
          </div>
          <div class="toolbar-actions">
            <el-select
              v-model="granularity"
              style="width: 120px"
              @change="loadDashboard"
            >
              <el-option label="按小时" value="hour" />
              <el-option label="按天" value="day" />
            </el-select>
            <el-button :loading="loading" @click="handleRefresh">刷新</el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="运行中任务" :value="summary.runningCount" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总执行次数" :value="summary.totalExecutions" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic
              title="成功率"
              :value="summary.successRate"
              suffix="%"
              :precision="2"
            />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="活跃告警" :value="activeAlertCount" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>执行趋势</span>
            </template>
            <div ref="trendChartRef" style="height: 320px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>状态分布</span>
            </template>
            <div ref="statusChartRef" style="height: 320px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>触发类型分布</span>
            </template>
            <div ref="triggerChartRef" style="height: 320px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>数据量与平均耗时</span>
            </template>
            <div ref="dataChartRef" style="height: 320px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px">
        <template #header>
          <span>实时任务状态</span>
        </template>
        <el-table :data="realtimeTasks" max-height="320" v-loading="loadingRealtime">
          <el-table-column prop="syncTaskName" label="任务名称" min-width="180" />
          <el-table-column prop="syncTaskStatus" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.syncTaskStatus)">
                {{ getStatusText(row.syncTaskStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" min-width="220">
            <template #default="{ row }">
              <el-progress :percentage="Number(row.progress || 0)" />
            </template>
          </el-table-column>
          <el-table-column label="吞吐量" min-width="140">
            <template #default="{ row }">
              {{ formatThroughput(row.throughput) }}
            </template>
          </el-table-column>
          <el-table-column label="最近执行时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.syncTaskLastRunTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card style="margin-top: 20px">
        <template #header>
          <span>告警时间线</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="alert in alerts"
            :key="alert.alertId"
            :timestamp="formatDateTime(alert.alertTime)"
            :type="getAlertType(alert.alertLevel)"
          >
            <div class="alert-item">
              <div class="alert-content">
                <div class="alert-title">
                  <el-tag size="small" :type="getAlertType(alert.alertLevel)">
                    {{ alert.alertLevel || "INFO" }}
                  </el-tag>
                  <span>{{ alert.alertType || "告警" }}</span>
                </div>
                <p>{{ alert.alertMessage }}</p>
              </div>
              <el-button
                v-if="alert.isResolved !== 1"
                size="small"
                @click="handleResolveAlert(alert.alertId)"
              >
                确认
              </el-button>
              <el-tag v-else size="small" type="success">已确认</el-tag>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="alerts.length === 0" description="暂无告警" />
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { useMonitorStore } from "../../stores/monitor";
import {
  getStatistics,
  getSyncTaskDesign,
  getTaskStatistics,
  listSyncTasks,
  type SyncTask,
  type SyncTaskStatistics,
} from "../../api/sync";

const route = useRoute();
const router = useRouter();
const monitorStore = useMonitorStore();

const taskId = computed(() => {
  const value = Number(route.query.taskId || route.params.taskId);
  return Number.isFinite(value) && value > 0 ? value : undefined;
});

const trendChartRef = ref<HTMLElement>();
const statusChartRef = ref<HTMLElement>();
const triggerChartRef = ref<HTMLElement>();
const dataChartRef = ref<HTMLElement>();

const loading = ref(false);
const loadingRealtime = ref(false);
const granularity = ref<"hour" | "day">("day");
const statistics = ref<SyncTaskStatistics | null>(null);
const realtimeTasks = ref<Array<SyncTask & { progress?: number; throughput?: number }>>([]);
const alerts = ref<any[]>([]);

const summary = reactive({
  runningCount: 0,
  totalExecutions: 0,
  successRate: 0,
  totalReadCount: 0,
});

const activeAlertCount = computed(
  () => alerts.value.filter((item) => item.isResolved !== 1).length,
);

let trendChart: echarts.ECharts | null = null;
let statusChart: echarts.ECharts | null = null;
let triggerChart: echarts.ECharts | null = null;
let dataChart: echarts.ECharts | null = null;
let refreshInterval: number | null = null;

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const formatThroughput = (value?: number) => {
  if (value === undefined || value === null) {
    return "-";
  }
  return `${Number(value).toFixed(2)} 条/秒`;
};

const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "success",
    STOPPED: "info",
    ERROR: "danger",
  };
  return status ? map[status] || "info" : "info";
};

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "运行中",
    STOPPED: "已停止",
    ERROR: "异常",
  };
  return status ? map[status] || status : "未知";
};

const getAlertType = (level?: string) => {
  const map: Record<string, string> = {
    INFO: "primary",
    WARNING: "warning",
    ERROR: "danger",
    CRITICAL: "danger",
  };
  return level ? map[level] || "info" : "info";
};

const initCharts = () => {
  if (trendChartRef.value && !trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }
  if (statusChartRef.value && !statusChart) {
    statusChart = echarts.init(statusChartRef.value);
  }
  if (triggerChartRef.value && !triggerChart) {
    triggerChart = echarts.init(triggerChartRef.value);
  }
  if (dataChartRef.value && !dataChart) {
    dataChart = echarts.init(dataChartRef.value);
  }
};

const renderCharts = () => {
  const stats = statistics.value;
  if (!stats) {
    return;
  }

  trendChart?.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["执行次数", "成功", "失败"], bottom: 0 },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: { type: "category", data: stats.trend.labels, axisLabel: { rotate: 30 } },
    yAxis: { type: "value" },
    series: [
      { name: "执行次数", type: "line", smooth: true, data: stats.trend.executions },
      { name: "成功", type: "line", smooth: true, data: stats.trend.successCounts },
      { name: "失败", type: "line", smooth: true, data: stats.trend.failCounts },
    ],
  });

  statusChart?.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", left: "left" },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: stats.statusDistribution.map((item) => ({
          value: item.count,
          name: item.statusName,
        })),
      },
    ],
  });

  triggerChart?.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", left: "left" },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        data: stats.triggerTypeDistribution.map((item) => ({
          value: item.count,
          name: item.triggerTypeName,
        })),
      },
    ],
  });

  dataChart?.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["数据量", "平均耗时(ms)"], bottom: 0 },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: { type: "category", data: stats.trend.labels, axisLabel: { rotate: 30 } },
    yAxis: [
      { type: "value", name: "数据量" },
      { type: "value", name: "平均耗时(ms)" },
    ],
    series: [
      { name: "数据量", type: "bar", data: stats.trend.dataCounts },
      {
        name: "平均耗时(ms)",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: stats.trend.avgCosts,
      },
    ],
  });
};

const applyRealtimePatch = (data: any) => {
  if (!taskId.value || data.taskId !== taskId.value) {
    return;
  }

  const target = realtimeTasks.value.find((item) => item.syncTaskId === taskId.value);
  if (!target) {
    return;
  }

  if (data.progress !== undefined) {
    target.progress = Number(data.progress);
  }
  if (data.throughput !== undefined) {
    target.throughput = Number(data.throughput);
  }
  if (data.status) {
    target.syncTaskStatus = data.status;
  }
  if (data.readCount !== undefined) {
    target.syncTaskReadCount = Number(data.readCount);
  }
  if (data.writeCount !== undefined) {
    target.syncTaskWriteCount = Number(data.writeCount);
  }
  if (data.successCount !== undefined) {
    target.syncTaskSuccessCount = Number(data.successCount);
  }
  if (data.failCount !== undefined) {
    target.syncTaskFailCount = Number(data.failCount);
  }
};

const loadStatistics = async () => {
  const params = { granularity: granularity.value };
  const payload = taskId.value
    ? await getTaskStatistics(taskId.value, params)
    : await getStatistics(params);

  statistics.value = payload.data ?? null;

  summary.runningCount = statistics.value?.summary?.runningCount || 0;
  summary.totalExecutions = statistics.value?.summary?.totalExecutions || 0;
  summary.successRate = statistics.value?.summary?.successRate || 0;
  summary.totalReadCount = statistics.value?.summary?.totalReadCount || 0;
};

const loadRealtimeTasks = async () => {
  loadingRealtime.value = true;
  try {
    if (taskId.value) {
      const [designPayload, realtimePayload] = await Promise.all([
        getSyncTaskDesign(taskId.value),
        monitorStore.fetchRealtimeData(taskId.value),
      ]);

      const matchedTask = designPayload.data?.task;

      realtimeTasks.value = matchedTask
        ? [
            {
              ...matchedTask,
              progress: Number(realtimePayload?.progress || 0),
              throughput: realtimePayload?.throughput,
            },
          ]
        : [];
      return;
    }

    const taskListPayload = await listSyncTasks({
      page: 1,
      size: 100,
      taskStatus: "RUNNING",
    });

    const tasks = taskListPayload.data?.records ?? [];
    const realtimeList = await Promise.all(
      tasks.map((item) =>
        item.syncTaskId
          ? monitorStore.fetchRealtimeData(item.syncTaskId).catch(() => null)
          : Promise.resolve(null),
      ),
    );

    realtimeTasks.value = tasks.map((item, index) => ({
      ...item,
      progress: Number(realtimeList[index]?.progress || 0),
      throughput: realtimeList[index]?.throughput,
    }));
  } finally {
    loadingRealtime.value = false;
  }
};

const loadAlerts = async () => {
  alerts.value = await monitorStore.fetchAlerts(taskId.value);
};

const loadDashboard = async () => {
  loading.value = true;
  try {
    await Promise.all([loadStatistics(), loadRealtimeTasks(), loadAlerts()]);
    renderCharts();
  } catch (error: any) {
    ElMessage.error(error?.message || "加载监控数据失败");
  } finally {
    loading.value = false;
  }
};

const handleResolveAlert = async (alertId: number) => {
  try {
    await monitorStore.resolveAlert(alertId);
    ElMessage.success("告警已确认");
    await loadAlerts();
  } catch (error: any) {
    ElMessage.error(error?.message || "操作失败");
  }
};

const handleRefresh = async () => {
  await loadDashboard();
};

const handleBack = () => {
  router.push("/sync/tasks");
};

const handleResize = () => {
  trendChart?.resize();
  statusChart?.resize();
  triggerChart?.resize();
  dataChart?.resize();
};

onMounted(async () => {
  initCharts();
  await loadDashboard();

  if (taskId.value) {
    monitorStore.connectWebSocket(taskId.value, (data) => {
      applyRealtimePatch(data);
    });
  }

  refreshInterval = window.setInterval(() => {
    loadDashboard();
  }, 30000);

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  trendChart?.dispose();
  statusChart?.dispose();
  triggerChart?.dispose();
  dataChart?.dispose();
  monitorStore.disconnectWebSocket();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.monitor-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    margin: 0;
  }
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-weight: 500;
}

.alert-content p {
  margin: 0;
  color: #606266;
}
</style>
