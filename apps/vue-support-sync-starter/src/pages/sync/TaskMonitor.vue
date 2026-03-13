<template>
  <div class="monitor-container">
    <el-card>
      <template #header>
        <h3>监控仪表板</h3>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="运行中任务" :value="stats.running" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="今日同步" :value="stats.todaySync" suffix="条" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="成功率" :value="stats.successRate" suffix="%" :precision="2" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="活跃告警" :value="stats.activeAlerts" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>同步趋势</span>
            </template>
            <div ref="trendChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>任务状态分布</span>
            </template>
            <div ref="statusChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px">
        <template #header>
          <span>实时任务列表</span>
        </template>
        <el-table :data="realtimeTasks" max-height="300">
          <el-table-column prop="syncTaskName" label="任务名称" />
          <el-table-column prop="syncTaskStatus" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.syncTaskStatus)">
                {{ row.syncTaskStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" />
            </template>
          </el-table-column>
          <el-table-column prop="throughput" label="吞吐量" />
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
            :timestamp="alert.alertTime"
            :type="getAlertType(alert.alertLevel)"
          >
            <p>{{ alert.alertMessage }}</p>
            <el-button
              v-if="!alert.isResolved"
              size="small"
              @click="handleResolveAlert(alert.alertId)"
            >
              确认
            </el-button>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useMonitorStore } from '../../stores/monitor';
import * as echarts from 'echarts';

const monitorStore = useMonitorStore();
const trendChartRef = ref<HTMLElement>();
const statusChartRef = ref<HTMLElement>();

const stats = reactive({
  running: 0,
  todaySync: 0,
  successRate: 0,
  activeAlerts: 0,
});

const realtimeTasks = ref<any[]>([]);
const alerts = ref<any[]>([]);

let trendChart: echarts.ECharts;
let statusChart: echarts.ECharts;

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['同步数量', '成功数量', '失败数量'] },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [
        { name: '同步数量', type: 'line', data: [], smooth: true, itemStyle: { color: '#409EFF' } },
        { name: '成功数量', type: 'line', data: [], smooth: true, itemStyle: { color: '#67C23A' } },
        { name: '失败数量', type: 'line', data: [], smooth: true, itemStyle: { color: '#F56C6C' } },
      ],
    });
  }

  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value);
    statusChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    });
  }
};

const loadData = async () => {
  try {
    // 加载告警数据
    await monitorStore.fetchAlerts();
    alerts.value = monitorStore.alerts;
    stats.activeAlerts = alerts.value.filter(a => !a.isResolved).length;

    // 加载统计数据
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // 模拟加载趋势数据
    const trendData = await loadTrendData(startTime, endTime);
    updateTrendChart(trendData);

    // 模拟加载状态分布数据
    const statusData = await loadStatusData();
    updateStatusChart(statusData);

    // 加载实时任务列表
    await loadRealtimeTasks();

    // 更新统计卡片
    updateStats();
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败');
  }
};

const loadTrendData = async (startTime: string, endTime: string) => {
  // 这里应该调用真实的API获取趋势数据
  // 暂时返回模拟数据
  const days = 7;
  const dates = [];
  const syncCounts = [];
  const successCounts = [];
  const failCounts = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
    syncCounts.push(Math.floor(Math.random() * 10000) + 5000);
    successCounts.push(Math.floor(Math.random() * 9000) + 4500);
    failCounts.push(Math.floor(Math.random() * 500));
  }
  
  return { dates, syncCounts, successCounts, failCounts };
};

const updateTrendChart = (data: any) => {
  if (trendChart) {
    trendChart.setOption({
      xAxis: { data: data.dates },
      series: [
        { data: data.syncCounts },
        { data: data.successCounts },
        { data: data.failCounts },
      ],
    });
  }
};

const loadStatusData = async () => {
  // 这里应该调用真实的API获取状态分布数据
  // 暂时返回模拟数据
  return [
    { value: 5, name: '运行中', itemStyle: { color: '#409EFF' } },
    { value: 12, name: '已停止', itemStyle: { color: '#909399' } },
    { value: 2, name: '失败', itemStyle: { color: '#F56C6C' } },
    { value: 8, name: '等待中', itemStyle: { color: '#E6A23C' } },
  ];
};

const updateStatusChart = (data: any[]) => {
  if (statusChart) {
    statusChart.setOption({
      series: [{ data }],
    });
  }
};

const loadRealtimeTasks = async () => {
  // 这里应该调用真实的API获取实时任务列表
  // 暂时返回模拟数据
  realtimeTasks.value = [
    {
      syncTaskName: '用户数据同步',
      syncTaskStatus: 'RUNNING',
      progress: 75,
      throughput: '1200条/秒',
    },
    {
      syncTaskName: '订单数据同步',
      syncTaskStatus: 'RUNNING',
      progress: 45,
      throughput: '800条/秒',
    },
  ];
};

const updateStats = () => {
  stats.running = realtimeTasks.value.filter(t => t.syncTaskStatus === 'RUNNING').length;
  stats.todaySync = 125000;
  stats.successRate = 98.5;
};

const handleResolveAlert = async (alertId: number) => {
  try {
    await monitorStore.resolveAlert(alertId);
    ElMessage.success('告警已确认');
    loadData();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    RUNNING: 'success',
    STOPPED: 'info',
    FAILED: 'danger',
  };
  return map[status] || 'info';
};

const getAlertType = (level: string) => {
  const map: Record<string, any> = {
    INFO: 'primary',
    WARNING: 'warning',
    ERROR: 'danger',
    CRITICAL: 'danger',
  };
  return map[level] || 'primary';
};

onMounted(() => {
  initCharts();
  loadData();
  
  // 连接WebSocket接收实时更新
  monitorStore.connectWebSocket(0, (data) => {
    // 更新实时任务数据
    if (data.taskId && data.progress !== undefined) {
      const task = realtimeTasks.value.find(t => t.syncTaskId === data.taskId);
      if (task) {
        task.progress = data.progress;
        task.throughput = data.throughput || task.throughput;
      }
    }
    
    // 更新统计数据
    if (data.stats) {
      Object.assign(stats, data.stats);
    }
  });
  
  // 定时刷新数据
  const refreshInterval = setInterval(() => {
    loadData();
  }, 30000); // 每30秒刷新一次
  
  // 清理定时器
  onUnmounted(() => {
    clearInterval(refreshInterval);
  });
});

onUnmounted(() => {
  trendChart?.dispose();
  statusChart?.dispose();
  monitorStore.disconnectWebSocket();
});
</script>

<style scoped lang="scss">
.monitor-container {
  padding: 20px;
}
</style>
