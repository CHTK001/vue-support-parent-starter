<template>
  <div class="skywalking-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="28"><Monitor /></el-icon>
        </div>
        <div class="header-info">
          <h2 class="header-title">SkyWalking 仪表盘</h2>
          <p class="header-desc">实时监控应用程序性能指标</p>
        </div>
      </div>
      <div class="header-actions">
        <el-select v-model="filterForm.configId" placeholder="选择服务器" @change="handleConfigChange" class="config-select">
          <el-option
            v-for="item in configList"
            :key="item.skywalkingConfigId"
            :label="item.skywalkingConfigName"
            :value="item.skywalkingConfigId"
          />
        </el-select>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
          format="MM-DD HH:mm"
          value-format="YYYY-MM-DD HHmm"
          @change="handleTimeChange"
          class="time-picker"
        />
        <el-button type="primary" @click="fetchAllData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button :type="autoRefresh ? 'success' : 'default'" @click="toggleAutoRefresh">
          <el-icon><Refresh /></el-icon>
          {{ autoRefresh ? '刷新中' : '自动刷新' }}
        </el-button>
      </div>
    </div>

    <!-- 无配置提示 -->
    <el-card v-if="!configList.length && !configLoading" class="empty-config-card" shadow="never">
      <el-empty description="暂无 SkyWalking 配置" :image-size="120">
        <template #description>
          <div class="empty-config-desc">
            <p>请先添加 SkyWalking 服务器配置，才能查看监控数据</p>
          </div>
        </template>
        <el-button type="primary" @click="goToConfig">
          <el-icon><Plus /></el-icon>
          添加配置
        </el-button>
      </el-empty>
    </el-card>

    <!-- 指标概览卡片 -->
    <template v-if="configList.length">
    <el-row :gutter="16" class="metrics-row">
      <el-col :span="6">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon services">
              <el-icon :size="32"><Monitor /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ globalOverview.totalServices }}</div>
              <div class="metric-label">服务总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon cpm">
              <el-icon :size="32"><Odometer /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ formatNumber(globalOverview.totalCpm) }}</div>
              <div class="metric-label">总 CPM</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon resptime">
              <el-icon :size="32"><Timer /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ globalOverview.avgRespTime }} ms</div>
              <div class="metric-label">平均响应时间</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon sla">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ (globalOverview.avgSla / 100).toFixed(2) }}%</div>
              <div class="metric-label">平均成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never" v-loading="trendLoading">
          <template #header>
            <span>CPM 趋势</span>
          </template>
          <div v-if="hasTrendData" ref="cpmChartRef" class="chart-container"></div>
          <el-empty v-else-if="!trendLoading" description="暂无数据" :image-size="100" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never" v-loading="trendLoading">
          <template #header>
            <span>响应时间趋势</span>
          </template>
          <div v-if="hasTrendData" ref="respTimeChartRef" class="chart-container"></div>
          <el-empty v-else-if="!trendLoading" description="暂无数据" :image-size="100" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never" v-loading="slowEndpointsLoading">
          <template #header>
            <span>慢端点排行 (Top 10)</span>
          </template>
          <div v-if="slowEndpoints.length" ref="slowEndpointsChartRef" class="chart-container"></div>
          <el-empty v-else-if="!slowEndpointsLoading" description="暂无数据" :image-size="100" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never" v-loading="trendLoading">
          <template #header>
            <span>成功率趋势</span>
          </template>
          <div v-if="hasTrendData" ref="slaChartRef" class="chart-container"></div>
          <el-empty v-else-if="!trendLoading" description="暂无数据" :image-size="100" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 错误服务排行 -->
    <el-row :gutter="16" class="charts-row">
      <el-col :span="24">
        <el-card class="table-card" shadow="never" v-loading="errorServicesLoading">
          <template #header>
            <span>高错误率服务</span>
          </template>
          <el-table v-if="errorServices.length" :data="errorServices" stripe border style="width: 100%" max-height="300">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="name" label="服务名称" min-width="200" show-overflow-tooltip />
            <el-table-column label="错误率" width="200">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.min((row.value / 100), 100)"
                  :color="getErrorColor(row.value)"
                  :stroke-width="16"
                  :format="() => (row.value / 100).toFixed(2) + '%'"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="goToService(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else-if="!errorServicesLoading" description="暂无数据" :image-size="100" />
        </el-card>
      </el-col>
    </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Monitor, Odometer, Timer, CircleCheck, Plus, Search, Refresh } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { getEnabledSkywalkingConfigs, type SkywalkingConfig } from "@/api/skywalking/config";
import {
  getDefaultTimeRange,
  getGlobalMetricsOverview,
  getGlobalMetricsTrend,
  getSlowEndpoints,
  getErrorRateServices,
} from "@/api/skywalking/data";

defineOptions({ name: "SkywalkingDashboard" });

const router = useRouter();

// 配置列表
const configList = ref<SkywalkingConfig[]>([]);
const configLoading = ref(false);
const timeRange = ref<string[]>([]);
const autoRefresh = ref(false);
let refreshTimer: number | null = null;

// 筛选表单
const filterForm = reactive({
  configId: undefined as number | undefined,
  startTime: "",
  endTime: "",
});

// 全局概览数据
const globalOverview = reactive({
  totalServices: 0,
  totalEndpoints: 0,
  totalCpm: 0,
  avgRespTime: 0,
  avgSla: 10000,
});

// 加载状态
const trendLoading = ref(false);
const slowEndpointsLoading = ref(false);
const errorServicesLoading = ref(false);

// 数据
const slowEndpoints = ref<Array<{ id: string; name: string; value: number }>>([]);
const errorServices = ref<Array<{ id: string; name: string; value: number }>>([]);
const hasTrendData = ref(false);

// 图表引用
const cpmChartRef = ref<HTMLElement>();
const respTimeChartRef = ref<HTMLElement>();
const slaChartRef = ref<HTMLElement>();
const slowEndpointsChartRef = ref<HTMLElement>();

let cpmChart: echarts.ECharts | null = null;
let respTimeChart: echarts.ECharts | null = null;
let slaChart: echarts.ECharts | null = null;
let slowEndpointsChart: echarts.ECharts | null = null;

// 初始化时间范围
const initTimeRange = () => {
  const range = getDefaultTimeRange(30);
  filterForm.startTime = range.startTime;
  filterForm.endTime = range.endTime;
  timeRange.value = [range.startTime, range.endTime];
};

// 加载配置列表
const loadConfigList = async () => {
  configLoading.value = true;
  try {
    const res = await getEnabledSkywalkingConfigs();
    if (res.code === "00000") {
      configList.value = res.data || [];
      if (configList.value.length > 0) {
        filterForm.configId = configList.value[0].skywalkingConfigId;
        fetchAllData();
      }
    }
  } finally {
    configLoading.value = false;
  }
};

// 跳转到配置页面
const goToConfig = () => {
  router.push('/skywalking/config');
};

// 配置变更
const handleConfigChange = () => {
  fetchAllData();
};

// 时间变更
const handleTimeChange = (val: string[]) => {
  if (val && val.length === 2) {
    filterForm.startTime = val[0];
    filterForm.endTime = val[1];
  }
};

// 获取所有数据
const fetchAllData = async () => {
  if (!filterForm.configId) {
    ElMessage.warning("请先选择 SkyWalking 配置");
    return;
  }
  await Promise.all([
    fetchGlobalOverview(),
    fetchGlobalTrend(),
    fetchSlowEndpoints(),
    fetchErrorServices(),
  ]);
};

// 获取全局概览
const fetchGlobalOverview = async () => {
  try {
    const res = await getGlobalMetricsOverview({
      configId: filterForm.configId!,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
    });
    if (res.code === "00000" && res.data) {
      Object.assign(globalOverview, res.data);
    }
  } catch (e) {
    console.error("获取全局概览失败", e);
  }
};

// 获取趋势数据
const fetchGlobalTrend = async () => {
  trendLoading.value = true;
  hasTrendData.value = false;
  try {
    const res = await getGlobalMetricsTrend({
      configId: filterForm.configId!,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
    });
    if (res.code === "00000" && res.data) {
      const hasData = res.data.timestamps?.length > 0 || res.data.cpm?.length > 0;
      hasTrendData.value = hasData;
      if (hasData) {
        await nextTick();
        renderCpmChart(res.data);
        renderRespTimeChart(res.data);
        renderSlaChart(res.data);
      }
    }
  } finally {
    trendLoading.value = false;
  }
};

// 获取慢端点
const fetchSlowEndpoints = async () => {
  slowEndpointsLoading.value = true;
  try {
    const res = await getSlowEndpoints({
      configId: filterForm.configId!,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
      limit: 10,
    });
    if (res.code === "00000") {
      slowEndpoints.value = res.data || [];
      await nextTick();
      renderSlowEndpointsChart();
    }
  } finally {
    slowEndpointsLoading.value = false;
  }
};

// 获取高错误率服务
const fetchErrorServices = async () => {
  errorServicesLoading.value = true;
  try {
    const res = await getErrorRateServices({
      configId: filterForm.configId!,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
      limit: 10,
    });
    if (res.code === "00000") {
      errorServices.value = res.data || [];
    }
  } finally {
    errorServicesLoading.value = false;
  }
};

// 渲染 CPM 图表
const renderCpmChart = (data: { timestamps: string[]; cpm: number[] }) => {
  if (!cpmChartRef.value) return;
  if (!cpmChart) {
    cpmChart = echarts.init(cpmChartRef.value);
  }
  cpmChart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: data.timestamps, boundaryGap: false },
    yAxis: { type: "value", name: "次/分钟" },
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    series: [{
      name: "CPM",
      type: "line",
      data: data.cpm,
      smooth: true,
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: "#409EFF" },
    }],
  });
};

// 渲染响应时间图表
const renderRespTimeChart = (data: { timestamps: string[]; respTime: number[] }) => {
  if (!respTimeChartRef.value) return;
  if (!respTimeChart) {
    respTimeChart = echarts.init(respTimeChartRef.value);
  }
  respTimeChart.setOption({
    tooltip: { trigger: "axis", formatter: "{b}<br/>{a}: {c} ms" },
    xAxis: { type: "category", data: data.timestamps, boundaryGap: false },
    yAxis: { type: "value", name: "ms" },
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    series: [{
      name: "响应时间",
      type: "line",
      data: data.respTime,
      smooth: true,
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: "#E6A23C" },
    }],
  });
};

// 渲染 SLA 图表
const renderSlaChart = (data: { timestamps: string[]; sla: number[] }) => {
  if (!slaChartRef.value) return;
  if (!slaChart) {
    slaChart = echarts.init(slaChartRef.value);
  }
  const slaPercent = data.sla.map((v) => (v / 100).toFixed(2));
  slaChart.setOption({
    tooltip: { trigger: "axis", formatter: "{b}<br/>{a}: {c}%" },
    xAxis: { type: "category", data: data.timestamps, boundaryGap: false },
    yAxis: { type: "value", name: "%", min: 90, max: 100 },
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    series: [{
      name: "成功率",
      type: "line",
      data: slaPercent,
      smooth: true,
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: "#67C23A" },
    }],
  });
};

// 渲染慢端点排行图表
const renderSlowEndpointsChart = () => {
  if (!slowEndpointsChartRef.value) return;
  if (!slowEndpointsChart) {
    slowEndpointsChart = echarts.init(slowEndpointsChartRef.value);
  }
  const names = slowEndpoints.value.map((e) => e.name).reverse();
  const values = slowEndpoints.value.map((e) => e.value).reverse();
  slowEndpointsChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: "{b}<br/>响应时间: {c} ms" },
    xAxis: { type: "value", name: "ms" },
    yAxis: { type: "category", data: names, axisLabel: { width: 120, overflow: "truncate" } },
    grid: { left: 140, right: 20, top: 10, bottom: 30 },
    series: [{
      name: "响应时间",
      type: "bar",
      data: values,
      itemStyle: {
        color: (params: any) => {
          const v = params.value;
          if (v > 3000) return "#F56C6C";
          if (v > 1000) return "#E6A23C";
          return "#67C23A";
        },
      },
    }],
  });
};

// 格式化数字
const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

// 获取错误率颜色
const getErrorColor = (val: number) => {
  const pct = val / 100;
  if (pct > 5) return "#F56C6C";
  if (pct > 1) return "#E6A23C";
  return "#67C23A";
};

// 跳转服务详情
const goToService = (row: { id: string; name: string }) => {
  router.push({
    path: "/skywalking/service",
    query: { configId: filterForm.configId, serviceId: row.id },
  });
};

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    refreshTimer = window.setInterval(() => {
      fetchAllData();
    }, 30000); // 30 秒刷新
  } else if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// 窗口大小变化
const handleResize = () => {
  cpmChart?.resize();
  respTimeChart?.resize();
  slaChart?.resize();
  slowEndpointsChart?.resize();
};

onMounted(() => {
  initTimeRange();
  loadConfigList();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (refreshTimer) clearInterval(refreshTimer);
  cpmChart?.dispose();
  respTimeChart?.dispose();
  slaChart?.dispose();
  slowEndpointsChart?.dispose();
});
</script>

<style scoped lang="scss">
.skywalking-dashboard {
  padding: 24px;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-lighter) 100%);
  min-height: 100%;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
        border-radius: 10px;
        color: white;
      }

      .header-info {
        .header-title {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .header-desc {
          margin: 0;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .config-select {
        width: 180px;
      }

      .time-picker {
        width: 280px;
      }
    }
  }

  .metrics-row {
    margin-bottom: 20px;

    .metric-card {
      border-radius: 16px;
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
      }

      .metric-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px;

        .metric-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);

          &.services {
            background: linear-gradient(135deg, #409EFF, #66b1ff);
          }

          &.cpm {
            background: linear-gradient(135deg, #67C23A, #85ce61);
          }

          &.resptime {
            background: linear-gradient(135deg, #E6A23C, #ebb563);
          }

          &.sla {
            background: linear-gradient(135deg, #909399, #a6a9ad);
          }
        }

        .metric-info {
          .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--el-text-color-primary);
          }

          .metric-label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin-top: 4px;
          }
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .chart-card {
      border-radius: 16px;
      border: none;

      :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .chart-container {
        height: 280px;
      }
    }
  }

  .table-card {
    border-radius: 16px;
    border: none;

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      font-weight: 600;
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    :deep(.el-table) {
      border-radius: 12px;
      overflow: hidden;
    }
  }

  .empty-config-card {
    margin-bottom: 20px;
    border-radius: 16px;
    border: 2px dashed var(--el-border-color);
    background: var(--el-fill-color-lighter);
    
    :deep(.el-empty) {
      padding: 80px 0;
    }

    .empty-config-desc {
      text-align: center;
      color: var(--el-text-color-secondary);
      
      p {
        margin: 8px 0 0;
        font-size: 14px;
      }
    }
  }
}
</style>
