<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`组件数据查询 - ${component?.monitorSysGenServerComponentName}`"
    width="80%"
    :before-close="handleClose"
    class="component-data-dialog"
  >
    <div class="dialog-content">
      <!-- 查询条件 -->
      <div class="query-section">
        <div class="query-controls">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="�?
            start-placeholder="开始时�?
            end-placeholder="结束时间"
            value-format="X"
            :shortcuts="timeShortcuts"
            class="!w-[350px]"
          />
          
          <el-select v-model="step" placeholder="步长" style="width: 120px">
            <el-option label="15�? :value="15" />
            <el-option label="30�? :value="30" />
            <el-option label="1分钟" :value="60" />
            <el-option label="5分钟" :value="300" />
            <el-option label="15分钟" :value="900" />
          </el-select>
          
          <el-button type="primary" :loading="loading" @click="handleQuery">
            <IconifyIconOnline icon="ep:search" />
            查询
          </el-button>
          
          <el-button @click="handleRealtime" :loading="realtimeLoading">
            <IconifyIconOnline icon="ep:refresh" />
            实时数据
          </el-button>
        </div>
        
        <div class="query-info" v-if="component">
          <div class="info-item">
            <span class="label">组件类型:</span>
            <el-tag :type="getComponentTypeColor(component.monitorSysGenServerComponentType)" size="small">
              {{ getComponentTypeName(component.monitorSysGenServerComponentType) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">表达式类�?</span>
            <el-tag type="info" size="small">
              {{ getExpressionTypeName(component.monitorSysGenServerComponentExpressionType) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">表达�?</span>
            <el-text size="small" class="expression-text">
              {{ component.monitorSysGenServerComponentExpression || '未设�? }}
            </el-text>
          </div>
        </div>
      </div>
      
      <!-- 查询统计 -->
      <div class="stats-section" v-if="queryStats">
        <el-tag type="success" size="small">查询时间: {{ queryStats.queryTime }}ms</el-tag>
        <el-tag type="info" size="small">数据�? {{ queryStats.dataPoints }}</el-tag>
        <el-tag size="small">更新时间: {{ queryStats.updateTime }}</el-tag>
      </div>
      
      <!-- 数据展示 -->
      <div class="data-section" v-loading="loading">
        <div v-if="!queryResult" class="empty-state">
          <el-empty description="请设置时间范围并点击查询">
            <el-button type="primary" @click="handleQuickQuery">
              快速查询（最�?小时�?
            </el-button>
          </el-empty>
        </div>
        
        <div v-else class="data-content">
          <el-tabs v-model="activeTab" type="card">
            <!-- 图表视图 -->
            <el-tab-pane label="图表视图" name="chart">
              <div class="chart-container">
                <div ref="chartRef" class="chart"></div>
              </div>
            </el-tab-pane>
            
            <!-- 表格视图 -->
            <el-tab-pane label="表格视图" name="table">
              <div class="table-container">
                <el-table :data="tableData" style="width: 100%" max-height="400" stripe>
                  <el-table-column prop="timestamp" label="时间" width="180" sortable>
                    <template #default="{ row }">
                      {{ formatTimestamp(row.timestamp) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="value" label="�? sortable>
                    <template #default="{ row }">
                      <el-text :type="getValueType(row.value)">
                        {{ formatValue(row.value) }}
                      </el-text>
                    </template>
                  </el-table-column>
                  <el-table-column prop="unit" label="单位" width="80">
                    <template #default="{ row }">
                      {{ row.unit || component?.monitorSysGenServerComponentUnit || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="metric" label="指标" show-overflow-tooltip />
                </el-table>
              </div>
            </el-tab-pane>
            
            <!-- 原始数据 -->
            <el-tab-pane label="原始数据" name="raw">
              <div class="raw-data-container">
                <div class="raw-data-header">
                  <el-button size="small" @click="copyRawData">
                    <IconifyIconOnline icon="ep:copy-document" />
                    复制数据
                  </el-button>
                  <el-button size="small" @click="downloadRawData">
                    <IconifyIconOnline icon="ep:download" />
                    下载JSON
                  </el-button>
                </div>
                <div class="raw-data-content">
                  <pre>{{ JSON.stringify(queryResult, null, 2) }}</pre>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleExport">导出数据</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { getComponentData, getComponentRealtimeData, type ServerComponent } from "@/api/server";

// 定义属�?
const props = defineProps<{
  modelValue: boolean;
  component?: ServerComponent;
  serverId?: number;
}>();

// 定义事件
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// 响应式数�?
const dialogVisible = ref(false);
const loading = ref(false);
const realtimeLoading = ref(false);
const timeRange = ref<string[]>([]);
const step = ref(60);
const queryResult = ref<any>(null);
const activeTab = ref("chart");
const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

// 查询统计
const queryStats = ref<{
  queryTime: number;
  dataPoints: number;
  updateTime: string;
} | null>(null);

// 时间快捷选项
const timeShortcuts = [
  {
    text: '最�?5分钟',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 15 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: '最�?小时',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: '最�?小时',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 6 * 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: '最�?4小时',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
      return [start, end];
    }
  }
];

// 计算属�?
const tableData = computed(() => {
  if (!queryResult.value?.data) return [];
  
  if (Array.isArray(queryResult.value.data)) {
    return queryResult.value.data.map((item: any, index: number) => ({
      timestamp: item.timestamp || (Date.now() / 1000 - index * 60),
      value: item.value !== undefined ? item.value : item,
      unit: item.unit,
      metric: item.metric || props.component?.monitorSysGenServerComponentName || '未知'
    }));
  }
  
  return [{
    timestamp: Date.now() / 1000,
    value: queryResult.value.data,
    unit: props.component?.monitorSysGenServerComponentUnit,
    metric: props.component?.monitorSysGenServerComponentName || '未知'
  }];
});

// 监听对话框显示状�?
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
  if (val) {
    initDialog();
  }
});

watch(dialogVisible, (val) => {
  emit("update:modelValue", val);
});

/**
 * 初始化对话框
 */
const initDialog = () => {
  // 设置默认时间范围（最�?小时�?
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 60 * 60 * 1000);
  
  timeRange.value = [
    Math.floor(start.getTime() / 1000).toString(),
    Math.floor(end.getTime() / 1000).toString()
  ];
  
  queryResult.value = null;
  queryStats.value = null;
  activeTab.value = "chart";
};

/**
 * 处理查询
 */
const handleQuery = async () => {
  if (!props.component?.monitorSysGenServerComponentId) {
    ElMessage.warning("组件信息不完�?);
    return;
  }
  
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning("请选择有效的时间范�?);
    return;
  }

  try {
    loading.value = true;
    const startTime = parseInt(timeRange.value[0]);
    const endTime = parseInt(timeRange.value[1]);
    
    const start = Date.now();
    const res = await getComponentData(
      props.component.monitorSysGenServerComponentId,
      startTime,
      endTime,
      step.value
    );
    const queryTime = Date.now() - start;
    
    if (res.code === "00000") {
      queryResult.value = res.data;
      
      // 更新统计信息
      queryStats.value = {
        queryTime,
        dataPoints: Array.isArray(res.data?.data) ? res.data.data.length : 1,
        updateTime: new Date().toLocaleTimeString()
      };
      
      // 更新图表
      await nextTick();
      updateChart();
      
      ElMessage.success("查询成功");
    } else {
      ElMessage.error(res.msg || "查询失败");
    }
  } catch (error) {
    console.error("查询失败:", error);
    ElMessage.error("查询失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 处理实时数据查询
 */
const handleRealtime = async () => {
  if (!props.component?.monitorSysGenServerComponentId) {
    ElMessage.warning("组件信息不完�?);
    return;
  }

  try {
    realtimeLoading.value = true;
    const res = await getComponentRealtimeData(props.component.monitorSysGenServerComponentId);
    
    if (res.code === "00000") {
      queryResult.value = res.data;
      
      // 更新统计信息
      queryStats.value = {
        queryTime: 0,
        dataPoints: Array.isArray(res.data?.data) ? res.data.data.length : 1,
        updateTime: new Date().toLocaleTimeString()
      };
      
      // 更新图表
      await nextTick();
      updateChart();
      
      ElMessage.success("获取实时数据成功");
    } else {
      ElMessage.error(res.msg || "获取实时数据失败");
    }
  } catch (error) {
    console.error("获取实时数据失败:", error);
    ElMessage.error("获取实时数据失败");
  } finally {
    realtimeLoading.value = false;
  }
};

/**
 * 快速查�?
 */
const handleQuickQuery = () => {
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 60 * 60 * 1000);
  
  timeRange.value = [
    Math.floor(start.getTime() / 1000).toString(),
    Math.floor(end.getTime() / 1000).toString()
  ];
  
  handleQuery();
};

/**
 * 更新图表
 */
const updateChart = () => {
  if (!chartRef.value || !queryResult.value) return;
  
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }
  
  const option = {
    title: {
      text: props.component?.monitorSysGenServerComponentName || '组件数据',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0];
        return `
          <div>
            <div>时间: ${new Date(point.data[0]).toLocaleString()}</div>
            <div>�? ${point.data[1]} ${props.component?.monitorSysGenServerComponentUnit || ''}</div>
          </div>
        `;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: props.component?.monitorSysGenServerComponentUnit || ''
    },
    series: [{
      name: '数�?,
      type: 'line',
      data: generateChartData(),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: {
        width: 2
      },
      areaStyle: {
        opacity: 0.1
      }
    }]
  };
  
  chart.setOption(option, true);
};

/**
 * 生成图表数据
 */
const generateChartData = () => {
  if (!queryResult.value?.data) return [];
  
  if (Array.isArray(queryResult.value.data)) {
    return queryResult.value.data.map((item: any, index: number) => [
      item.timestamp ? new Date(item.timestamp * 1000) : new Date(Date.now() - (index * 60 * 1000)),
      item.value !== undefined ? item.value : item
    ]);
  }
  
  return [[new Date(), queryResult.value.data]];
};

/**
 * 复制原始数据
 */
const copyRawData = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(queryResult.value, null, 2));
    ElMessage.success("数据已复制到剪贴�?);
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

/**
 * 下载原始数据
 */
const downloadRawData = () => {
  const data = JSON.stringify(queryResult.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `component-data-${props.component?.monitorSysGenServerComponentId}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 导出数据
 */
const handleExport = () => {
  if (!queryResult.value) {
    ElMessage.warning("暂无数据可导�?);
    return;
  }
  
  // 导出为CSV格式
  const csvData = tableData.value.map(row => [
    formatTimestamp(row.timestamp),
    row.value,
    row.unit || '',
    row.metric
  ]);
  
  const csvContent = [
    ['时间', '�?, '单位', '指标'],
    ...csvData
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `component-data-${props.component?.monitorSysGenServerComponentId}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  ElMessage.success("数据导出成功");
};

/**
 * 关闭对话�?
 */
const handleClose = () => {
  dialogVisible.value = false;
  if (chart) {
    chart.dispose();
    chart = null;
  }
};

/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * 格式化�?
 */
const formatValue = (value: any) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
};

/**
 * 获取值类�?
 */
const getValueType = (value: any) => {
  if (typeof value === 'number') {
    if (value > 0) return 'success';
    if (value < 0) return 'danger';
  }
  return 'info';
};

/**
 * 获取组件类型颜色
 */
const getComponentTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'card': 'primary',
    'gauge': 'success',
    'line': 'info',
    'bar': 'warning',
    'pie': 'danger'
  };
  return colorMap[type] || 'info';
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    'card': '卡片',
    'gauge': '仪表�?,
    'line': '折线�?,
    'bar': '柱状�?,
    'pie': '饼图'
  };
  return nameMap[type] || '未知';
};

/**
 * 获取表达式类型名�?
 */
const getExpressionTypeName = (type?: string) => {
  const typeMap: Record<string, string> = {
    'PROMETHEUS': 'Prometheus PromQL',
    'SQL': 'SQL查询',
    'COMPONENT': '组件选择'
  };
  return typeMap[type || 'COMPONENT'] || '未知';
};
</script>

<style lang="scss" scoped>
.component-data-dialog {
  :deep(.el-dialog) {
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.el-dialog__body) {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }
}

.dialog-content {
  height: 70vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.query-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.query-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.query-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .label {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
  
  .expression-text {
    max-width: 200px;
    word-break: break-all;
  }
}

.stats-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.data-section {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.data-content {
  height: 100%;
  
  :deep(.el-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }
  
  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.chart-container {
  height: 100%;
  min-height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}

.table-container {
  height: 100%;
  overflow: auto;
}

.raw-data-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.raw-data-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.raw-data-content {
  flex: 1;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  overflow: auto;
  
  pre {
    margin: 0;
    padding: 16px;
    font-size: 12px;
    line-height: 1.4;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
