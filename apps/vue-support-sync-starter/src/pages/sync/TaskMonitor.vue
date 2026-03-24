<template>
  <div class="monitor-container">
    <div class="hero-grid">
      <el-card class="hero-card hero-card--focus" shadow="never">
        <p>{{ taskId ? "任务监控" : "监控仪表板" }}</p>
        <strong>{{ summary.totalExecutions }}</strong>
        <span>展示执行趋势、状态分布、实时任务快照和告警时间线。</span>
      </el-card>
      <el-card class="hero-card" shadow="never">
        <p>运行中任务</p>
        <strong>{{ summary.runningCount }}</strong>
        <span>当前筛选范围内处于运行状态的任务数。</span>
      </el-card>
      <el-card class="hero-card" shadow="never">
        <p>成功率</p>
        <strong>{{ Number(summary.successRate || 0).toFixed(2) }}%</strong>
        <span>基于统计周期聚合得到的执行成功率。</span>
      </el-card>
      <el-card class="hero-card" shadow="never">
        <p>活跃告警</p>
        <strong>{{ activeAlertCount }}</strong>
        <span>尚未确认的运行风险和资源告警。</span>
      </el-card>
    </div>

    <el-card class="panel" shadow="never">
      <template #header>
        <div class="header-actions">
          <div class="title-group">
            <div>
              <p class="panel__eyebrow">Monitor Center</p>
              <h3>{{ taskId ? "任务监控" : "监控仪表板" }}</h3>
            </div>
            <el-tag v-if="taskId" type="info">任务 #{{ taskId }}</el-tag>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="granularity" style="width: 120px" @change="loadDashboard">
              <el-option label="按小时" value="hour" />
              <el-option label="按天" value="day" />
            </el-select>
            <el-button :loading="loading" @click="handleRefresh">刷新</el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <div class="insight-grid">
        <el-card class="sub-panel" shadow="never">
          <template #header>
            <div class="sub-panel__header">
              <span>执行趋势</span>
            </div>
          </template>
          <el-table :data="trendRows" border size="small" class="table">
            <el-table-column prop="label" label="时间" min-width="120" />
            <el-table-column prop="executions" label="执行次数" width="100" />
            <el-table-column prop="successCounts" label="成功" width="90" />
            <el-table-column prop="failCounts" label="失败" width="90" />
            <el-table-column prop="avgCosts" label="平均耗时(ms)" width="130" />
            <el-table-column prop="dataCounts" label="数据量" width="100" />
          </el-table>
        </el-card>

        <el-card class="sub-panel" shadow="never">
          <template #header>
            <div class="sub-panel__header">
              <span>状态分布与触发来源</span>
            </div>
          </template>
          <div class="distribution-grid">
            <div>
              <h4>状态分布</h4>
              <div class="badge-list">
                <div v-for="item in statistics?.statusDistribution || []" :key="item.status" class="badge-item">
                  <span>{{ item.statusName }}</span>
                  <strong>{{ item.count }}</strong>
                  <small>{{ Number(item.percentage || 0).toFixed(2) }}%</small>
                </div>
              </div>
            </div>
            <div>
              <h4>触发类型</h4>
              <div class="badge-list">
                <div v-for="item in statistics?.triggerTypeDistribution || []" :key="item.triggerType" class="badge-item">
                  <span>{{ item.triggerTypeName }}</span>
                  <strong>{{ item.count }}</strong>
                  <small>{{ Number(item.percentage || 0).toFixed(2) }}%</small>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <el-card class="sub-panel section-gap" shadow="never">
        <template #header>
          <span>实时任务状态</span>
        </template>
        <el-table :data="realtimeTasks" max-height="320" v-loading="loadingRealtime" border class="table">
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

      <el-card class="sub-panel section-gap" shadow="never">
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

const activeAlertCount = computed(() => alerts.value.filter((item) => item.isResolved !== 1).length);
const trendRows = computed(() =>
  (statistics.value?.trend?.labels || []).map((label, index) => ({
    label,
    executions: statistics.value?.trend?.executions?.[index] || 0,
    successCounts: statistics.value?.trend?.successCounts?.[index] || 0,
    failCounts: statistics.value?.trend?.failCounts?.[index] || 0,
    avgCosts: statistics.value?.trend?.avgCosts?.[index] || 0,
    dataCounts: statistics.value?.trend?.dataCounts?.[index] || 0,
  })),
);

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
        ? [{ ...matchedTask, progress: Number(realtimePayload?.progress || 0), throughput: realtimePayload?.throughput }]
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
        item.syncTaskId ? monitorStore.fetchRealtimeData(item.syncTaskId).catch(() => null) : Promise.resolve(null),
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

let refreshInterval: number | null = null;

onMounted(async () => {
  await loadDashboard();

  if (taskId.value) {
    monitorStore.connectWebSocket(taskId.value, (data) => {
      applyRealtimePatch(data);
    });
  }

  refreshInterval = window.setInterval(() => {
    loadDashboard();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  monitorStore.disconnectWebSocket();
});
</script>

<style scoped lang="scss">
.monitor-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.hero-card,
.panel,
.sub-panel {
  border: none;
  border-radius: 24px;
  box-shadow: 0 18px 60px rgba(37, 33, 30, 0.08);
}

.hero-card :deep(.el-card__body) {
  padding: 22px;
}

.hero-card {
  background: linear-gradient(160deg, rgba(247, 251, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.hero-card--focus {
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.26), transparent 35%),
    linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #2563eb 100%);
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #6f7681;
}

.hero-card--focus p,
.hero-card--focus span,
.hero-card--focus strong {
  color: #eff6ff;
}

.hero-card strong {
  display: block;
  margin: 10px 0 12px;
  font-size: 34px;
  color: #111827;
}

.hero-card span {
  line-height: 1.7;
  color: #5f6977;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #5a7aa0;
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

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.sub-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  h4 {
    margin: 0 0 12px;
  }
}

.badge-list {
  display: grid;
  gap: 10px;
}

.badge-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.16);

  strong {
    font-size: 18px;
    color: #0f172a;
  }

  small {
    color: #64748b;
  }
}

.section-gap {
  margin-top: 18px;
}

.table {
  border-radius: 18px;
  overflow: hidden;
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

@media (max-width: 1180px) {
  .hero-grid,
  .insight-grid,
  .distribution-grid {
    grid-template-columns: 1fr;
  }
}
</style>
