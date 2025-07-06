<template>
  <div class="component-data-query">
    <!-- 查询条件 -->
    <div class="query-header">
      <div class="query-controls">
        <div class="time-range-selector">
          <el-date-picker
            v-model="timeRangeValue"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="X"
            :default-time="defaultTime"
            :shortcuts="dateShortcuts"
            class="!w-[400px]"
          />
          <el-button type="primary" :loading="loading" @click="handleQuery">
            <IconifyIconOnline icon="ep:search" />
            查询
          </el-button>
        </div>

        <div class="query-options">
          <el-select v-model="selectedComponentId" placeholder="选择组件" style="width: 200px" @change="handleComponentChange">
            <el-option
              v-for="component in components"
              :key="component.monitorSysGenServerComponentId"
              :label="component.monitorSysGenServerComponentName"
              :value="component.monitorSysGenServerComponentId"
            />
          </el-select>

          <el-select v-model="stepValue" placeholder="步长" style="width: 120px">
            <el-option label="15秒" :value="15" />
            <el-option label="30秒" :value="30" />
            <el-option label="1分钟" :value="60" />
            <el-option label="5分钟" :value="300" />
            <el-option label="15分钟" :value="900" />
          </el-select>
        </div>
      </div>

      <div class="query-stats" v-if="queryResult">
        <el-tag type="success" size="small">查询时间: {{ queryTime }}ms</el-tag>
        <el-tag type="info" size="small">数据点: {{ dataPointCount }}</el-tag>
        <el-tag type="warning" size="small">更新时间: {{ lastUpdateTime }}</el-tag>
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div class="query-content" v-loading="loading">
      <div v-if="!queryResult" class="empty-state">
        <el-empty description="请选择组件并设置时间范围进行查询">
          <el-button type="primary" @click="handleQuickQuery">快速查询（最近1小时）</el-button>
        </el-empty>
      </div>

      <div v-else class="data-display">
        <!-- 组件信息 -->
        <div class="component-info">
          <h3>{{ selectedComponent?.monitorSysGenServerComponentName }}</h3>
          <div class="component-meta">
            <el-tag :type="getComponentTypeColor(selectedComponent?.monitorSysGenServerComponentType)" size="small">
              {{ getComponentTypeName(selectedComponent?.monitorSysGenServerComponentType) }}
            </el-tag>
            <el-tag type="info" size="small">
              {{ getExpressionTypeName(selectedComponent?.monitorSysGenServerComponentExpressionType) }}
            </el-tag>
          </div>
        </div>

        <!-- 数据内容 -->
        <div class="data-content">
          <el-tabs v-model="activeTab" type="card">
            <el-tab-pane label="图表视图" name="chart">
              <div class="chart-container">
                <div ref="chartRef" class="chart" style="height: 400px"></div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="原始数据" name="raw">
              <div class="raw-data">
                <pre>{{ JSON.stringify(queryResult, null, 2) }}</pre>
              </div>
            </el-tab-pane>

            <el-tab-pane label="表格视图" name="table">
              <div class="table-view">
                <el-table :data="tableData" style="width: 100%" max-height="400">
                  <el-table-column prop="timestamp" label="时间" width="180">
                    <template #default="{ row }">
                      {{ formatTimestamp(row.timestamp) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="value" label="值" />
                  <el-table-column prop="metric" label="指标" />
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { getComponentsByServerId, getComponentData, getComponentRealtimeData, type ServerComponent } from "@/api/server";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 响应式数据
const loading = ref(false);
const components = ref<ServerComponent[]>([]);
const selectedComponentId = ref<number>();
const timeRangeValue = ref<string[]>([]);
const stepValue = ref(60);
const queryResult = ref<any>(null);
const queryTime = ref(0);
const lastUpdateTime = ref("");
const dataPointCount = ref(0);
const activeTab = ref("chart");
const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

// 默认时间
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)];

// 时间快捷选项
const dateShortcuts = [
  {
    text: "最近15分钟",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 15 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近1小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近6小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 6 * 60 * 60 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近24小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
      return [start, end];
    }
  }
];

// 计算属性
const selectedComponent = computed(() => {
  return components.value.find(c => c.monitorSysGenServerComponentId === selectedComponentId.value);
});

const tableData = computed(() => {
  if (!queryResult.value || !queryResult.value.data) return [];

  // 根据数据格式转换为表格数据
  if (Array.isArray(queryResult.value.data)) {
    return queryResult.value.data.map((item: any, index: number) => ({
      timestamp: item.timestamp || Date.now() - index * 60 * 1000,
      value: item.value || item,
      metric: item.metric || selectedComponent.value?.monitorSysGenServerComponentName || "未知"
    }));
  }

  return [
    {
      timestamp: Date.now(),
      value: queryResult.value.data,
      metric: selectedComponent.value?.monitorSysGenServerComponentName || "未知"
    }
  ];
});

/**
 * 加载组件列表
 */
const loadComponents = async () => {
  try {
    const res = await getComponentsByServerId(props.serverId);
    if (res.code === "00000") {
      components.value = res.data || [];
      if (components.value.length > 0) {
        selectedComponentId.value = components.value[0].monitorSysGenServerComponentId;
      }
    }
  } catch (error) {
    console.error("加载组件列表失败:", error);
    ElMessage.error("加载组件列表失败");
  }
};

/**
 * 处理查询
 */
const handleQuery = async () => {
  if (!selectedComponentId.value) {
    ElMessage.warning("请选择要查询的组件");
    return;
  }

  if (!timeRangeValue.value || timeRangeValue.value.length !== 2) {
    ElMessage.warning("请选择有效的时间范围");
    return;
  }

  try {
    loading.value = true;
    const startTime = parseInt(timeRangeValue.value[0]);
    const endTime = parseInt(timeRangeValue.value[1]);

    // 获取选中组件的信息
    const selectedComponent = components.value.find(c => c.monitorSysGenServerComponentId === selectedComponentId.value);

    const start = Date.now();
    let res;

    // 根据组件的表达式类型选择查询方式
    if (selectedComponent?.monitorSysGenServerComponentExpressionType === "REALTIME") {
      // 实时数据查询
      res = await getComponentRealtimeData(selectedComponentId.value);
    } else {
      // 其他类型使用统一的数据查询接口
      res = await getComponentData(selectedComponentId.value, startTime, endTime, stepValue.value);
    }

    queryTime.value = Date.now() - start;

    if (res.code === "00000") {
      queryResult.value = res.data;
      lastUpdateTime.value = new Date().toLocaleTimeString();

      // 计算数据点数量
      if (Array.isArray(res.data?.data)) {
        dataPointCount.value = res.data.data.length;
      } else {
        dataPointCount.value = 1;
      }

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
 * 快速查询
 */
const handleQuickQuery = () => {
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 60 * 60 * 1000); // 最近1小时

  timeRangeValue.value = [Math.floor(start.getTime() / 1000).toString(), Math.floor(end.getTime() / 1000).toString()];

  handleQuery();
};

/**
 * 处理组件变化
 */
const handleComponentChange = () => {
  queryResult.value = null;
};

/**
 * 更新图表
 */
const updateChart = () => {
  if (!chartRef.value || !queryResult.value) return;

  if (!chart) {
    chart = echarts.init(chartRef.value);
  }

  // 根据数据格式生成图表配置
  const option = {
    title: {
      text: selectedComponent.value?.monitorSysGenServerComponentName || "组件数据",
      left: "center"
    },
    tooltip: {
      trigger: "axis"
    },
    xAxis: {
      type: "time"
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        name: "数值",
        type: "line",
        data: generateChartData()
      }
    ]
  };

  chart.setOption(option);
};

/**
 * 生成图表数据
 */
const generateChartData = () => {
  if (!queryResult.value?.data) return [];

  if (Array.isArray(queryResult.value.data)) {
    return queryResult.value.data.map((item: any, index: number) => [item.timestamp ? new Date(item.timestamp * 1000) : new Date(Date.now() - index * 60 * 1000), item.value || item]);
  }

  return [[new Date(), queryResult.value.data]];
};

/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * 获取组件类型颜色
 */
const getComponentTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    card: "primary",
    gauge: "success",
    line: "info",
    bar: "warning",
    pie: "danger"
  };
  return colorMap[type] || "info";
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    card: "卡片",
    gauge: "仪表盘",
    line: "折线图",
    bar: "柱状图",
    pie: "饼图"
  };
  return nameMap[type] || "未知";
};

/**
 * 获取表达式类型名称
 */
const getExpressionTypeName = (type?: string) => {
  const typeMap: Record<string, string> = {
    PROMETHEUS: "Prometheus PromQL",
    SQL: "SQL查询",
    COMPONENT: "组件选择",
    REALTIME: "实时数据"
  };
  return typeMap[type || "COMPONENT"] || "未知";
};

// 生命周期
onMounted(() => {
  loadComponents();
});
</script>

<style lang="scss" scoped>
.component-data-query {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.query-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.query-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-options {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-stats {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.component-info {
  margin-bottom: 20px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.component-meta {
  display: flex;
  gap: 8px;
}

.raw-data {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;

  pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
  }
}

.chart {
  width: 100%;
}
</style>
