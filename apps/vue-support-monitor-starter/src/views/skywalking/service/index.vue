<template>
  <div class="skywalking-service">
    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="SkyWalking">
          <el-select v-model="filterForm.configId" placeholder="请选择配置" @change="handleConfigChange">
            <el-option
              v-for="item in configList"
              :key="item.skywalkingConfigId"
              :label="item.skywalkingConfigName"
              :value="item.skywalkingConfigId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HHmm"
            @change="handleTimeChange"
          />
        </el-form-item>
        <el-form-item label="层">
          <el-select v-model="filterForm.layer" placeholder="请选择层" clearable style="width: 150px">
            <el-option v-for="layer in layerList" :key="layer" :label="layer" :value="layer" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务名">
          <el-input v-model="filterForm.keyword" placeholder="请输入服务名关键字" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 服务列表 -->
    <el-card class="table-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>服务列表</span>
          <span class="count">共 {{ filteredList.length }} 个服务</span>
        </div>
      </template>

      <el-table :data="filteredList" stripe border style="width: 100%" max-height="calc(100vh - 340px)">
        <el-table-column prop="name" label="服务名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="viewServiceDetail(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="layer" label="层" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.layer || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="group" label="分组" width="120" align="center">
          <template #default="{ row }">
            {{ row.group || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="shortName" label="短名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="是否正常" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.normal === false ? 'danger' : 'success'" size="small">
              {{ row.normal === false ? '异常' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewServiceDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="viewServiceTopology(row)">拓扑</el-button>
            <el-button type="primary" link size="small" @click="viewServiceTrace(row)">链路</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 服务详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="服务详情" size="720px">
      <template v-if="selectedService">
        <!-- 指标概览卡片 -->
        <el-row :gutter="12" class="metrics-overview">
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-value">{{ serviceMetrics.cpm }}</div>
              <div class="metric-label">CPM</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-value">{{ serviceMetrics.respTime }} ms</div>
              <div class="metric-label">响应时间</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-value">{{ (serviceMetrics.sla / 100).toFixed(2) }}%</div>
              <div class="metric-label">成功率</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-value">{{ (serviceMetrics.apdex / 10000).toFixed(2) }}</div>
              <div class="metric-label">Apdex</div>
            </div>
          </el-col>
        </el-row>

        <!-- 趋势图表 -->
        <div class="section-title">指标趋势</div>
        <el-tabs v-model="activeMetricTab">
          <el-tab-pane label="CPM" name="cpm">
            <div ref="serviceCpmChartRef" class="service-chart"></div>
          </el-tab-pane>
          <el-tab-pane label="响应时间" name="respTime">
            <div ref="serviceRespTimeChartRef" class="service-chart"></div>
          </el-tab-pane>
          <el-tab-pane label="成功率" name="sla">
            <div ref="serviceSlaChartRef" class="service-chart"></div>
          </el-tab-pane>
        </el-tabs>

        <el-descriptions :column="2" border class="service-info">
          <el-descriptions-item label="服务ID">{{ selectedService.id }}</el-descriptions-item>
          <el-descriptions-item label="服务名称">{{ selectedService.name }}</el-descriptions-item>
          <el-descriptions-item label="短名称">{{ selectedService.shortName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="层">{{ selectedService.layer || '-' }}</el-descriptions-item>
          <el-descriptions-item label="分组">{{ selectedService.group || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedService.normal === false ? 'danger' : 'success'" size="small">
              {{ selectedService.normal === false ? '异常' : '正常' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="drawer-actions">
          <el-button type="primary" @click="viewServiceTopology(selectedService)">查看拓扑</el-button>
          <el-button type="primary" @click="viewServiceTrace(selectedService)">查看链路</el-button>
        </div>

        <!-- 服务实例列表 -->
        <div class="section-title">服务实例</div>
        <el-table
          v-loading="instanceLoading"
          :data="serviceInstances"
          stripe
          border
          size="small"
          style="width: 100%"
        >
          <el-table-column prop="name" label="实例名称" show-overflow-tooltip />
          <el-table-column prop="language" label="语言" width="80" align="center" />
          <el-table-column prop="id" label="ID" width="180" show-overflow-tooltip />
        </el-table>
        <el-empty v-if="!instanceLoading && !serviceInstances.length" description="暂无实例数据" :image-size="60" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { getEnabledSkywalkingConfigs, type SkywalkingConfig } from "@/api/skywalking/config";
import {
  getSkywalkingServices,
  getSkywalkingLayers,
  getSkywalkingInstances,
  getDefaultTimeRange,
  getServiceMetricsOverview,
  getServiceMetricsTrend,
  type SkywalkingService,
  type SkywalkingInstance,
  type ServiceMetricsOverview,
  type ServiceMetricsTrend,
} from "@/api/skywalking/data";

defineOptions({ name: "SkywalkingService" });

const router = useRouter();

// 配置列表
const configList = ref<SkywalkingConfig[]>([]);
const layerList = ref<string[]>([]);
const loading = ref(false);
const instanceLoading = ref(false);
const drawerVisible = ref(false);
const activeMetricTab = ref("cpm");

// 服务指标
const serviceMetrics = reactive<ServiceMetricsOverview>({
  cpm: 0,
  sla: 10000,
  respTime: 0,
  apdex: 10000,
});
const serviceTrend = ref<ServiceMetricsTrend | null>(null);

// 图表引用
const serviceCpmChartRef = ref<HTMLElement>();
const serviceRespTimeChartRef = ref<HTMLElement>();
const serviceSlaChartRef = ref<HTMLElement>();
let serviceCpmChart: echarts.ECharts | null = null;
let serviceRespTimeChart: echarts.ECharts | null = null;
let serviceSlaChart: echarts.ECharts | null = null;

// 时间范围
const timeRange = ref<string[]>([]);

// 筛选表单
const filterForm = reactive({
  configId: undefined as number | undefined,
  layer: "",
  keyword: "",
  startTime: "",
  endTime: "",
});

// 服务列表
const serviceList = ref<SkywalkingService[]>([]);
const selectedService = ref<SkywalkingService | null>(null);
const serviceInstances = ref<SkywalkingInstance[]>([]);

// 过滤后的列表
const filteredList = computed(() => {
  let list = serviceList.value;
  if (filterForm.keyword) {
    const keyword = filterForm.keyword.toLowerCase();
    list = list.filter(
      (s) =>
        s.name?.toLowerCase().includes(keyword) ||
        s.shortName?.toLowerCase().includes(keyword)
    );
  }
  return list;
});

// 初始化时间范围
const initTimeRange = () => {
  const range = getDefaultTimeRange(30);
  filterForm.startTime = range.startTime;
  filterForm.endTime = range.endTime;
  timeRange.value = [range.startTime, range.endTime];
};

// 加载配置列表
const loadConfigList = async () => {
  const res = await getEnabledSkywalkingConfigs();
  if (res.code === "00000") {
    configList.value = res.data || [];
    if (configList.value.length > 0) {
      filterForm.configId = configList.value[0].skywalkingConfigId;
      loadLayers();
      fetchData();
    }
  }
};

// 加载层列表
const loadLayers = async () => {
  if (!filterForm.configId) return;
  const res = await getSkywalkingLayers(filterForm.configId);
  if (res.code === "00000") {
    layerList.value = res.data || [];
  }
};

// 配置变更
const handleConfigChange = () => {
  loadLayers();
  fetchData();
};

// 时间变更
const handleTimeChange = (val: string[]) => {
  if (val && val.length === 2) {
    filterForm.startTime = val[0];
    filterForm.endTime = val[1];
  }
};

// 获取服务列表
const fetchData = async () => {
  if (!filterForm.configId) {
    ElMessage.warning("请先选择 SkyWalking 配置");
    return;
  }

  loading.value = true;
  try {
    const res = await getSkywalkingServices({
      configId: filterForm.configId,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
      layer: filterForm.layer || undefined,
    });
    if (res.code === "00000") {
      serviceList.value = res.data || [];
    } else {
      ElMessage.error(res.msg || "获取服务列表失败");
    }
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilter = () => {
  filterForm.layer = "";
  filterForm.keyword = "";
  initTimeRange();
  fetchData();
};

// 查看服务详情
const viewServiceDetail = async (service: SkywalkingService) => {
  selectedService.value = service;
  drawerVisible.value = true;
  loadServiceInstances(service);
  loadServiceMetrics(service);
};

// 加载服务指标
const loadServiceMetrics = async (service: SkywalkingService) => {
  if (!filterForm.configId) return;
  try {
    const [overviewRes, trendRes] = await Promise.all([
      getServiceMetricsOverview({
        configId: filterForm.configId,
        serviceId: service.id,
        startTime: filterForm.startTime,
        endTime: filterForm.endTime,
      }),
      getServiceMetricsTrend({
        configId: filterForm.configId,
        serviceId: service.id,
        startTime: filterForm.startTime,
        endTime: filterForm.endTime,
      }),
    ]);
    if (overviewRes.code === "00000" && overviewRes.data) {
      Object.assign(serviceMetrics, overviewRes.data);
    }
    if (trendRes.code === "00000" && trendRes.data) {
      serviceTrend.value = trendRes.data;
      await nextTick();
      renderServiceCharts();
    }
  } catch (e) {
    console.error("加载服务指标失败", e);
  }
};

// 渲染服务图表
const renderServiceCharts = () => {
  if (!serviceTrend.value) return;
  const data = serviceTrend.value;
  // CPM
  if (serviceCpmChartRef.value) {
    if (!serviceCpmChart) serviceCpmChart = echarts.init(serviceCpmChartRef.value);
    serviceCpmChart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: data.timestamps, boundaryGap: false },
      yAxis: { type: "value" },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      series: [{ name: "CPM", type: "line", data: data.cpm, smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: "#409EFF" } }],
    });
  }
  // 响应时间
  if (serviceRespTimeChartRef.value) {
    if (!serviceRespTimeChart) serviceRespTimeChart = echarts.init(serviceRespTimeChartRef.value);
    serviceRespTimeChart.setOption({
      tooltip: { trigger: "axis", formatter: "{b}<br/>{a}: {c} ms" },
      xAxis: { type: "category", data: data.timestamps, boundaryGap: false },
      yAxis: { type: "value", name: "ms" },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      series: [{ name: "响应时间", type: "line", data: data.respTime, smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: "#E6A23C" } }],
    });
  }
  // SLA
  if (serviceSlaChartRef.value) {
    if (!serviceSlaChart) serviceSlaChart = echarts.init(serviceSlaChartRef.value);
    const slaPercent = data.sla.map((v) => (v / 100).toFixed(2));
    serviceSlaChart.setOption({
      tooltip: { trigger: "axis", formatter: "{b}<br/>{a}: {c}%" },
      xAxis: { type: "category", data: data.timestamps, boundaryGap: false },
      yAxis: { type: "value", name: "%", min: 90, max: 100 },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      series: [{ name: "成功率", type: "line", data: slaPercent, smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: "#67C23A" } }],
    });
  }
};

// 监听 tab 切换重新渲染图表
watch(activeMetricTab, async () => {
  await nextTick();
  serviceCpmChart?.resize();
  serviceRespTimeChart?.resize();
  serviceSlaChart?.resize();
});

// 加载服务实例
const loadServiceInstances = async (service: SkywalkingService) => {
  if (!filterForm.configId) return;
  instanceLoading.value = true;
  try {
    const res = await getSkywalkingInstances(service.id, {
      configId: filterForm.configId,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
    });
    if (res.code === "00000") {
      serviceInstances.value = res.data || [];
    }
  } finally {
    instanceLoading.value = false;
  }
};

// 查看服务拓扑
const viewServiceTopology = (service: SkywalkingService) => {
  router.push({
    path: "/skywalking/topology",
    query: {
      configId: filterForm.configId,
      serviceId: service.id,
      serviceName: service.name,
    },
  });
};

// 查看服务链路
const viewServiceTrace = (service: SkywalkingService) => {
  router.push({
    path: "/skywalking/trace",
    query: {
      configId: filterForm.configId,
      serviceId: service.id,
    },
  });
};

onMounted(() => {
  initTimeRange();
  loadConfigList();
});

onUnmounted(() => {
  serviceCpmChart?.dispose();
  serviceRespTimeChart?.dispose();
  serviceSlaChart?.dispose();
});
</script>

<style scoped lang="scss">
.skywalking-service {
  padding: 16px;

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .count {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .section-title {
    font-weight: 600;
    margin: 16px 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .drawer-actions {
    margin-top: 16px;
    display: flex;
    gap: 8px;
  }

  .metrics-overview {
    margin-bottom: 16px;

    .metric-item {
      text-align: center;
      padding: 12px 8px;
      background: var(--el-fill-color-light);
      border-radius: 8px;

      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .metric-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }

  .service-chart {
    height: 200px;
  }

  .service-info {
    margin-top: 16px;
  }
}
</style>
