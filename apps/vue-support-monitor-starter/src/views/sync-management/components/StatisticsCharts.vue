<template>
  <div class="statistics-charts">
    <!-- 时间范围选择 -->
    <div class="filter-bar">
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        :shortcuts="dateShortcuts"
        @change="handleDateChange"
      />
      <el-select v-model="granularity" placeholder="统计粒度" style="width: 120px; margin-left: 12px" @change="loadData">
        <el-option label="按小时" value="hour" />
        <el-option label="按天" value="day" />
      </el-select>
      <el-button :loading="loading" style="margin-left: 12px" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 汇总卡片 -->
    <el-row :gutter="16" class="summary-row">
      <el-col :span="4">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-value">{{ statistics?.summary?.totalExecutions || 0 }}</div>
          <div class="summary-label">总执行次数</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="summary-card success" shadow="hover">
          <div class="summary-value">{{ statistics?.summary?.successCount || 0 }}</div>
          <div class="summary-label">成功次数</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="summary-card danger" shadow="hover">
          <div class="summary-value">{{ statistics?.summary?.failCount || 0 }}</div>
          <div class="summary-label">失败次数</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-value">{{ formatPercent(statistics?.summary?.successRate) }}</div>
          <div class="summary-label">成功率</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-value">{{ formatDuration(statistics?.summary?.avgCost) }}</div>
          <div class="summary-label">平均耗时</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-value">{{ formatNumber(statistics?.summary?.totalReadCount) }}</div>
          <div class="summary-label">总数据量</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>执行趋势</span>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>状态分布</span>
            </div>
          </template>
          <div ref="statusPieRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>触发类型分布</span>
            </div>
          </template>
          <div ref="triggerPieRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>数据量趋势</span>
            </div>
          </template>
          <div ref="dataChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务排行榜(仅全局统计时显示) -->
    <el-card v-if="!taskId && statistics?.taskRanking?.length" class="ranking-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>任务执行排行榜 TOP 10</span>
        </div>
      </template>
      <el-table :data="statistics.taskRanking" stripe>
        <el-table-column type="index" label="排名" width="70" />
        <el-table-column prop="taskName" label="任务名称" min-width="150" />
        <el-table-column prop="executions" label="执行次数" width="100" />
        <el-table-column label="成功率" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="row.successRate"
              :color="getProgressColor(row.successRate)"
              :stroke-width="10"
              :show-text="false"
            />
            <span class="progress-text">{{ row.successRate.toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="平均耗时" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.avgCost) }}
          </template>
        </el-table-column>
        <el-table-column label="数据量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.totalDataCount) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { getStatistics, getTaskStatistics, type SyncTaskStatistics } from "@/api/sync";

const props = defineProps<{
  taskId?: number;
}>();

// 时间范围
const dateRange = ref<[string, string] | null>(null);
const granularity = ref("day");
const dateShortcuts = [
  {
    text: "最近24小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
      return [start, end];
    },
  },
  {
    text: "最近7天",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      return [start, end];
    },
  },
  {
    text: "最近30天",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 30 * 24 * 60 * 60 * 1000);
      return [start, end];
    },
  },
];

// 数据
const loading = ref(false);
const statistics = ref<SyncTaskStatistics | null>(null);

// 图表引用
const trendChartRef = ref<HTMLElement>();
const statusPieRef = ref<HTMLElement>();
const triggerPieRef = ref<HTMLElement>();
const dataChartRef = ref<HTMLElement>();

// ECharts实例
let trendChart: echarts.ECharts | null = null;
let statusPie: echarts.ECharts | null = null;
let triggerPie: echarts.ECharts | null = null;
let dataChart: echarts.ECharts | null = null;

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = { granularity: granularity.value };
    if (dateRange.value) {
      params.startTime = dateRange.value[0];
      params.endTime = dateRange.value[1];
    }

    const res = props.taskId
      ? await getTaskStatistics(props.taskId, params)
      : await getStatistics(params);

    if (res.data?.success) {
      statistics.value = res.data.data;
      await nextTick();
      renderCharts();
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 处理日期变化
const handleDateChange = () => {
  loadData();
};

// 渲染图表
const renderCharts = () => {
  renderTrendChart();
  renderStatusPie();
  renderTriggerPie();
  renderDataChart();
};

// 执行趋势图
const renderTrendChart = () => {
  if (!trendChartRef.value || !statistics.value?.trend) return;

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }

  const trend = statistics.value.trend;
  trendChart.setOption({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    legend: {
      data: ["执行次数", "成功", "失败"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: trend.labels,
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "执行次数",
        type: "line",
        data: trend.executions,
        smooth: true,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: "#409EFF" },
      },
      {
        name: "成功",
        type: "line",
        data: trend.successCounts,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: "#67C23A" },
      },
      {
        name: "失败",
        type: "line",
        data: trend.failCounts,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: "#F56C6C" },
      },
    ],
  });
};

// 状态饼图
const renderStatusPie = () => {
  if (!statusPieRef.value || !statistics.value?.statusDistribution) return;

  if (!statusPie) {
    statusPie = echarts.init(statusPieRef.value);
  }

  const colorMap: Record<string, string> = {
    SUCCESS: "#67C23A",
    FAIL: "#F56C6C",
    RUNNING: "#E6A23C",
    TIMEOUT: "#909399",
    UNKNOWN: "#C0C4CC",
  };

  const data = statistics.value.statusDistribution.map((item) => ({
    name: item.statusName,
    value: item.count,
    itemStyle: { color: colorMap[item.status] || "#409EFF" },
  }));

  statusPie.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["40%", "50%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: { show: false },
        data,
      },
    ],
  });
};

// 触发类型饼图
const renderTriggerPie = () => {
  if (!triggerPieRef.value || !statistics.value?.triggerTypeDistribution) return;

  if (!triggerPie) {
    triggerPie = echarts.init(triggerPieRef.value);
  }

  const colorMap: Record<string, string> = {
    MANUAL: "#409EFF",
    SCHEDULE: "#67C23A",
    API: "#E6A23C",
    UNKNOWN: "#909399",
  };

  const data = statistics.value.triggerTypeDistribution.map((item) => ({
    name: item.triggerTypeName,
    value: item.count,
    itemStyle: { color: colorMap[item.triggerType] || "#409EFF" },
  }));

  triggerPie.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["40%", "50%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: { show: false },
        data,
      },
    ],
  });
};

// 数据量趋势图
const renderDataChart = () => {
  if (!dataChartRef.value || !statistics.value?.trend) return;

  if (!dataChart) {
    dataChart = echarts.init(dataChartRef.value);
  }

  const trend = statistics.value.trend;
  dataChart.setOption({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["数据量", "平均耗时(ms)"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: trend.labels,
      axisLabel: { rotate: 30 },
    },
    yAxis: [
      {
        type: "value",
        name: "数据量",
        position: "left",
      },
      {
        type: "value",
        name: "耗时(ms)",
        position: "right",
      },
    ],
    series: [
      {
        name: "数据量",
        type: "bar",
        data: trend.dataCounts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#83bff6" },
            { offset: 0.5, color: "#188df0" },
            { offset: 1, color: "#188df0" },
          ]),
        },
      },
      {
        name: "平均耗时(ms)",
        type: "line",
        yAxisIndex: 1,
        data: trend.avgCosts,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: "#E6A23C" },
      },
    ],
  });
};

// 格式化函数
const formatPercent = (value?: number) => {
  if (value === undefined || value === null) return "0%";
  return `${value.toFixed(1)}%`;
};

const formatDuration = (ms?: number) => {
  if (ms === undefined || ms === null) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return "0";
  if (num < 1000) return String(num);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return "#67C23A";
  if (percentage >= 70) return "#E6A23C";
  return "#F56C6C";
};

// 窗口大小变化时重绘图表
const handleResize = () => {
  trendChart?.resize();
  statusPie?.resize();
  triggerPie?.resize();
  dataChart?.resize();
};

// 监听taskId变化
watch(() => props.taskId, () => {
  loadData();
});

onMounted(() => {
  loadData();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  trendChart?.dispose();
  statusPie?.dispose();
  triggerPie?.dispose();
  dataChart?.dispose();
});
</script>

<style scoped lang="scss">
.statistics-charts {
  .filter-bar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .summary-row {
    margin-bottom: 16px;

    .summary-card {
      text-align: center;
      padding: 12px 0;

      .summary-value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
      }

      .summary-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }

      &.success .summary-value {
        color: #67C23A;
      }

      &.danger .summary-value {
        color: #F56C6C;
      }
    }
  }

  .chart-row {
    margin-bottom: 16px;

    .chart-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chart-container {
        height: 300px;
      }
    }
  }

  .ranking-card {
    .progress-text {
      margin-left: 8px;
      font-size: 12px;
      color: #606266;
    }
  }
}
</style>
