<template>
  <div class="prometheus-container h-full">
    <!-- 空状态展示 -->
    <el-empty v-if="!data.genId" class="h-full" description="请选择数据源" />

    <!-- 主内容区域 -->
    <div v-else class="prometheus-content h-full">
      <!-- 顶部信息栏 -->
      <div class="prometheus-header">
        <!-- 数据源信息 -->
        <div class="prometheus-header__info">
          <IconifyIconOnline icon="logos:prometheus" class="prometheus-header__icon" />
          <span class="prometheus-header__name" :title="data.genName">{{ data.genName }}</span>
        </div>

        <!-- 状态信息 -->
        <el-divider direction="vertical" />
        <div class="prometheus-header__metric">
          <IconifyIconOnline icon="ri:time-line" class="prometheus-header__icon" />
          <span class="prometheus-header__value">{{ queryTime }} ms</span>
          <span class="prometheus-header__label">查询时间</span>
        </div>

        <el-divider direction="vertical" />
        <div class="prometheus-header__metric">
          <IconifyIconOnline icon="ri:signal-tower-line" class="prometheus-header__icon" />
          <span class="prometheus-header__value" :class="{ 'text-success': isOnline, 'text-danger': !isOnline }">
            {{ isOnline ? '在线' : '离线' }}
          </span>
          <span class="prometheus-header__label">状态</span>
        </div>

        <!-- 时间范围选择器 -->
        <div class="prometheus-header__actions ml-auto">
          <el-select v-model="timeRange" placeholder="选择时间范围" size="small" @change="handleTimeRangeChange">
            <el-option v-for="item in timeRangeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" size="small" @click="handleRefresh" :loading="loading">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </el-button>
          <el-button type="success" size="small" @click="toggleEditMode">
            <IconifyIconOnline :icon="editMode ? 'ri:eye-line' : 'ri:settings-line'" />
            {{ editMode ? '预览' : '编辑' }}
          </el-button>
        </div>
      </div>

      <!-- 数据内容区域 -->
      <div class="prometheus-body">
        <el-scrollbar class="prometheus-scrollbar">
          <div class="prometheus-content-wrapper">
            <!-- 默认视图模式 -->
            <div v-if="!editMode" class="default-view">
              <!-- 系统监控卡片 -->
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-card class="metric-card">
                    <template #header>
                      <div class="card-header">
                        <span>CPU使用率</span>
                        <el-tooltip content="系统CPU使用百分比">
                          <IconifyIconOnline icon="ri:information-line" />
                        </el-tooltip>
                      </div>
                    </template>
                    <div class="metric-value">{{ cpuUsage }}%</div>
                    <div class="chart-container">
                      <LineChart :chart-data="cpuChartData" :height="100" />
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="6">
                  <el-card class="metric-card">
                    <template #header>
                      <div class="card-header">
                        <span>内存使用率</span>
                        <el-tooltip content="系统内存使用百分比">
                          <IconifyIconOnline icon="ri:information-line" />
                        </el-tooltip>
                      </div>
                    </template>
                    <div class="metric-value">{{ memoryUsage }}%</div>
                    <div class="chart-container">
                      <LineChart :chart-data="memoryChartData" :height="100" />
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="6">
                  <el-card class="metric-card">
                    <template #header>
                      <div class="card-header">
                        <span>磁盘使用率</span>
                        <el-tooltip content="系统磁盘使用百分比">
                          <IconifyIconOnline icon="ri:information-line" />
                        </el-tooltip>
                      </div>
                    </template>
                    <div class="metric-value">{{ diskUsage }}%</div>
                    <div class="chart-container">
                      <LineChart :chart-data="diskChartData" :height="100" />
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="6">
                  <el-card class="metric-card">
                    <template #header>
                      <div class="card-header">
                        <span>网络流量</span>
                        <el-tooltip content="系统网络流量(KB/s)">
                          <IconifyIconOnline icon="ri:information-line" />
                        </el-tooltip>
                      </div>
                    </template>
                    <div class="metric-value">{{ networkTraffic }} KB/s</div>
                    <div class="chart-container">
                      <LineChart :chart-data="networkChartData" :height="100" />
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
            
            <!-- 自定义布局视图 -->
            <PrometheusLayout 
              ref="prometheusLayoutRef"
              :data="data" 
              :editable="editMode"
              class="custom-layout"
            />
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, defineProps, defineExpose } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchPrometheusQueryRangeGen } from '@/api/prometheus/index';
import { fetchPrometheusOnline, fetchPrometheusReload } from '@/api/prometheus/system';
import LineChart from './components/LineChart.vue';
import PrometheusLayout from './components/PrometheusLayout.vue';

// 组件属性
const props = defineProps({
  data: Object
});

// 状态变量
const loading = ref(false);
const isOnline = ref(true);
const queryTime = ref(0);
const editMode = ref(false);
const prometheusLayoutRef = ref(null);

// 时间范围选择
const timeRange = ref('1h');
const timeRangeOptions = [
  { label: '最近30分钟', value: '30m' },
  { label: '最近1小时', value: '1h' },
  { label: '最近3小时', value: '3h' },
  { label: '最近6小时', value: '6h' },
  { label: '最近12小时', value: '12h' },
  { label: '最近24小时', value: '24h' }
];

// 指标数据
const cpuUsage = ref('0');
const memoryUsage = ref('0');
const diskUsage = ref('0');
const networkTraffic = ref('0');

// 图表数据
const cpuChartData = reactive({
  labels: [],
  datasets: [
    {
      label: 'CPU使用率',
      data: [],
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      fill: true
    }
  ]
});

const memoryChartData = reactive({
  labels: [],
  datasets: [
    {
      label: '内存使用率',
      data: [],
      borderColor: '#67C23A',
      backgroundColor: 'rgba(103, 194, 58, 0.1)',
      fill: true
    }
  ]
});

const diskChartData = reactive({
  labels: [],
  datasets: [
    {
      label: '磁盘使用率',
      data: [],
      borderColor: '#E6A23C',
      backgroundColor: 'rgba(230, 162, 60, 0.1)',
      fill: true
    }
  ]
});

const networkChartData = reactive({
  labels: [],
  datasets: [
    {
      label: '网络流量',
      data: [],
      borderColor: '#F56C6C',
      backgroundColor: 'rgba(245, 108, 108, 0.1)',
      fill: true
    }
  ]
});

// 定时器
let refreshTimer = null;

// 切换编辑模式
const toggleEditMode = () => {
  editMode.value = !editMode.value;
};

// 检查Prometheus是否在线
const checkOnlineStatus = async () => {
  try {
    const res = await fetchPrometheusOnline({ id: props.data.genId });
    isOnline.value = res.data || false;
  } catch (error) {
    console.error('检查Prometheus状态失败:', error);
    isOnline.value = false;
  }
};

// 获取时间范围参数
const getTimeRangeParams = () => {
  const end = Math.floor(Date.now() / 1000);
  let start = end;
  let step = 60; // 默认步长60秒

  switch (timeRange.value) {
    case '30m':
      start = end - 30 * 60;
      step = 30;
      break;
    case '1h':
      start = end - 60 * 60;
      step = 60;
      break;
    case '3h':
      start = end - 3 * 60 * 60;
      step = 180;
      break;
    case '6h':
      start = end - 6 * 60 * 60;
      step = 360;
      break;
    case '12h':
      start = end - 12 * 60 * 60;
      step = 720;
      break;
    case '24h':
      start = end - 24 * 60 * 60;
      step = 1440;
      break;
  }

  return { start, end, step };
};

// 加载系统指标数据
const loadMetricsData = async () => {
  if (!props.data.genId) return;
  
  loading.value = true;
  const timeParams = getTimeRangeParams();
  
  try {
    // 检查在线状态
    await checkOnlineStatus();
    if (!isOnline.value) {
      ElMessage.warning('Prometheus服务离线，无法获取监控数据');
      loading.value = false;
      return;
    }

    const startTime = Date.now();
    
    // CPU使用率查询
    const cpuRes = await fetchPrometheusQueryRangeGen({
      monitorSysGenId: props.data.genId,
      promQL: '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
      ...timeParams
    });
    
    if (cpuRes.code === 200 && cpuRes.data && cpuRes.data.result && cpuRes.data.result.length > 0) {
      const result = cpuRes.data.result[0];
      const values = result.values || [];
      
      cpuChartData.labels = values.map(item => new Date(item[0] * 1000).toLocaleTimeString());
      cpuChartData.datasets[0].data = values.map(item => parseFloat(item[1]).toFixed(2));
      
      // 最新的CPU使用率
      if (values.length > 0) {
        cpuUsage.value = parseFloat(values[values.length - 1][1]).toFixed(2);
      }
    }
    
    // 内存使用率查询
    const memoryRes = await fetchPrometheusQueryRangeGen({
      monitorSysGenId: props.data.genId,
      promQL: '100 * (1 - ((node_memory_MemFree_bytes + node_memory_Cached_bytes + node_memory_Buffers_bytes) / node_memory_MemTotal_bytes))',
      ...timeParams
    });
    
    if (memoryRes.code === 200 && memoryRes.data && memoryRes.data.result && memoryRes.data.result.length > 0) {
      const result = memoryRes.data.result[0];
      const values = result.values || [];
      
      memoryChartData.labels = values.map(item => new Date(item[0] * 1000).toLocaleTimeString());
      memoryChartData.datasets[0].data = values.map(item => parseFloat(item[1]).toFixed(2));
      
      // 最新的内存使用率
      if (values.length > 0) {
        memoryUsage.value = parseFloat(values[values.length - 1][1]).toFixed(2);
      }
    }
    
    // 磁盘使用率查询
    const diskRes = await fetchPrometheusQueryRangeGen({
      monitorSysGenId: props.data.genId,
      promQL: '100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"})',
      ...timeParams
    });
    
    if (diskRes.code === 200 && diskRes.data && diskRes.data.result && diskRes.data.result.length > 0) {
      const result = diskRes.data.result[0];
      const values = result.values || [];
      
      diskChartData.labels = values.map(item => new Date(item[0] * 1000).toLocaleTimeString());
      diskChartData.datasets[0].data = values.map(item => parseFloat(item[1]).toFixed(2));
      
      // 最新的磁盘使用率
      if (values.length > 0) {
        diskUsage.value = parseFloat(values[values.length - 1][1]).toFixed(2);
      }
    }
    
    // 网络流量查询
    const networkRes = await fetchPrometheusQueryRangeGen({
      monitorSysGenId: props.data.genId,
      promQL: 'sum(rate(node_network_receive_bytes_total[5m])) / 1024',
      ...timeParams
    });
    
    if (networkRes.code === 200 && networkRes.data && networkRes.data.result && networkRes.data.result.length > 0) {
      const result = networkRes.data.result[0];
      const values = result.values || [];
      
      networkChartData.labels = values.map(item => new Date(item[0] * 1000).toLocaleTimeString());
      networkChartData.datasets[0].data = values.map(item => parseFloat(item[1]).toFixed(2));
      
      // 最新的网络流量
      if (values.length > 0) {
        networkTraffic.value = parseFloat(values[values.length - 1][1]).toFixed(2);
      }
    }
    
    // 刷新自定义布局组件
    if (prometheusLayoutRef.value) {
      prometheusLayoutRef.value.refresh();
    }
    
    // 计算查询时间
    queryTime.value = Date.now() - startTime;
  } catch (error) {
    console.error('加载指标数据失败:', error);
    ElMessage.error('加载指标数据失败');
  } finally {
    loading.value = false;
  }
};

// 处理时间范围变更
const handleTimeRangeChange = () => {
  loadMetricsData();
};

// 处理刷新
const handleRefresh = () => {
  loadMetricsData();
};

// 设置定时刷新
const setupRefreshTimer = () => {
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    loadMetricsData();
  }, 60000); // 默认每分钟刷新一次
};

// 组件挂载时
onMounted(() => {
  if (props.data.genId) {
    loadMetricsData();
    setupRefreshTimer();
  }
});

// 组件卸载前
onBeforeUnmount(() => {
  clearInterval(refreshTimer);
});

// 暴露方法给父组件
defineExpose({
  refresh: loadMetricsData
});
</script>

<style lang="scss" scoped>
.prometheus-container {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.prometheus-content {
  display: flex;
  flex-direction: column;
}

.prometheus-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);

  &__info {
    display: flex;
    align-items: center;
    min-width: 100px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__icon {
    font-size: 18px;
    margin-right: 6px;
    color: var(--el-color-primary);
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  &__metric {
    display: flex;
    align-items: center;
    margin: 0 8px;
  }

  &__value {
    font-weight: 500;
    margin: 0 4px;
  }

  &__label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.prometheus-body {
  flex: 1;
  overflow: hidden;
}

.prometheus-scrollbar {
  height: 100%;
}

.prometheus-content-wrapper {
  padding: 16px;
  height: 100%;
}

.metric-card {
  margin-bottom: 16px;
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .metric-value {
    font-size: 24px;
    font-weight: bold;
    margin: 8px 0;
    color: var(--el-color-primary);
  }
  
  .chart-container {
    height: 100px;
  }
}

.custom-layout {
  height: calc(100% - 16px);
}

.default-view + .custom-layout {
  margin-top: 16px;
}

.ml-auto {
  margin-left: auto;
}

.ml-2 {
  margin-left: 8px;
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}
</style> 