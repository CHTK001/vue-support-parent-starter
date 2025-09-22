<template>
  <div class="component-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>组件管理</h2>
        <p class="header-desc">管理服务器监控组件，支持时间范围查询和数据分析</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAddComponent">
          <IconifyIconOnline icon="ep:plus" />
          添加组件
        </el-button>
      </div>
    </div>

    <!-- 查询条件栏 -->
    <div class="query-bar">
      <div class="query-left">
        <el-select v-model="selectedServerId" placeholder="选择服务器" style="width: 200px" @change="handleServerChange">
          <el-option v-for="server in servers" :key="server.monitorSysGenServerId" :label="server.monitorSysGenServerName" :value="server.monitorSysGenServerId" />
        </el-select>

        <el-date-picker v-model="timeRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="X" :shortcuts="timeShortcuts" class="!w-[350px]" />

        <el-select v-model="queryStep" placeholder="步长" style="width: 100px">
          <el-option label="1分钟" :value="60" />
          <el-option label="5分钟" :value="300" />
          <el-option label="15分钟" :value="900" />
          <el-option label="30分钟" :value="1800" />
        </el-select>
      </div>

      <div class="query-right">
        <el-button type="primary" :loading="loading" @click="handleQuery">
          <IconifyIconOnline icon="ep:search" />
          查询数据
        </el-button>
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar" v-if="queryStats">
      <div class="stats-item">
        <span class="stats-label">查询时间:</span>
        <el-tag type="success" size="small">{{ queryStats.queryTime }}ms</el-tag>
      </div>
      <div class="stats-item">
        <span class="stats-label">组件数量:</span>
        <el-tag type="info" size="small">{{ queryStats.componentCount }}</el-tag>
      </div>
      <div class="stats-item">
        <span class="stats-label">数据点:</span>
        <el-tag type="warning" size="small">{{ queryStats.dataPoints }}</el-tag>
      </div>
      <div class="stats-item">
        <span class="stats-label">更新时间:</span>
        <el-tag size="small">{{ queryStats.updateTime }}</el-tag>
      </div>
    </div>

    <!-- 组件列表 -->
    <div class="component-list" v-loading="loading">
      <div v-if="components.length === 0" class="empty-state">
        <el-empty description="暂无组件数据">
          <el-button type="primary" @click="handleAddComponent"> 添加第一个组件 </el-button>
        </el-empty>
      </div>

      <div v-else class="component-grid">
        <div v-for="component in components" :key="component.monitorSysGenServerComponentId" class="component-card">
          <!-- 组件头部 -->
          <div class="card-header">
            <div class="card-title">
              <h4>{{ component.monitorSysGenServerComponentName }}</h4>
              <div class="card-meta">
                <el-tag :type="getComponentTypeTagColor(component.monitorSysGenServerComponentType)" size="small">
                  {{ getComponentTypeDisplayName(component.monitorSysGenServerComponentType) }}
                </el-tag>
                <el-tag type="info" size="small">
                  {{ getExpressionTypeDisplayName(component.monitorSysGenServerComponentExpressionType) }}
                </el-tag>
              </div>
            </div>
            <div class="card-actions">
              <el-dropdown @command="(cmd: string) => handleAction(cmd, component)">
                <el-button text>
                  <IconifyIconOnline icon="ep:more" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看数据</el-dropdown-item>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="clone">克隆</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 组件内容 -->
          <div class="card-content">
            <div class="component-info">
              <div class="info-item">
                <span class="info-label">表达式:</span>
                <span class="info-value">{{ component.monitorSysGenServerComponentExpression || "未设置" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">单位:</span>
                <span class="info-value">{{ component.monitorSysGenServerComponentUnit || "无" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态:</span>
                <el-tag :type="getComponentStatusTagType(component.monitorSysGenServerComponentStatus)" size="small">
                  {{ getComponentStatusText(component.monitorSysGenServerComponentStatus) }}
                </el-tag>
              </div>
            </div>

            <!-- 数据预览 -->
            <div class="data-preview" v-if="componentData[component.monitorSysGenServerComponentId!]">
              <div class="preview-chart" :ref="(el) => setChartRef(component.monitorSysGenServerComponentId!, el)"></div>
            </div>
            <div v-else class="no-data">
              <el-text type="info" size="small">暂无数据</el-text>
            </div>
          </div>

          <!-- 组件底部 -->
          <div class="card-footer">
            <div class="footer-left">
              <el-text size="small" type="info"> 创建时间: {{ formatDate(component.createTime || component.monitorSysGenServerComponentCreateTime) }} </el-text>
            </div>
            <div class="footer-right">
              <el-button size="small" type="primary" text @click="handleQueryComponent(component)" :loading="componentLoading[component.monitorSysGenServerComponentId!]">
                <IconifyIconOnline icon="ep:refresh" />
                查询
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 组件数据查询对话框 -->
    <ComponentDataDialog v-model="dataDialogVisible" :component="selectedComponent" :server-id="selectedServerId" />

    <!-- 组件编辑对话框 -->
    <ComponentEditDialog v-model="editDialogVisible" :component="selectedComponent" :server-id="selectedServerId" @success="handleRefresh" />
  </div>
</template>

<script setup lang="ts">
import { deleteServerComponent, getBatchComponentData, getComponentsByServerId, getServerList, ServerInfo, type ServerComponent } from "@/api/server";
import { getComponentStatusTagType, getComponentStatusText, getComponentTypeDisplayName, getComponentTypeTagColor, getExpressionTypeDisplayName } from "@/utils/component-field-mapping";
import * as echarts from "echarts";
import { ElMessage, ElMessageBox } from "element-plus";
import { nextTick, onMounted, reactive, ref } from "vue";
import ComponentDataDialog from "./components/ComponentDataDialog.vue";
import ComponentEditDialog from "./components/ComponentEditDialog.vue";

// 响应式数据
const loading = ref(false);
const servers = ref<ServerInfo[]>([]);
const components = ref<ServerComponent[]>([]);
const selectedServerId = ref<number>();
const timeRange = ref<string[]>([]);
const queryStep = ref(60);
const componentData = reactive<Record<number, any>>({});
const componentLoading = reactive<Record<number, boolean>>({});
const chartRefs = reactive<Record<number, HTMLElement>>({});
const charts = reactive<Record<number, echarts.ECharts>>({});

// 对话框状态
const dataDialogVisible = ref(false);
const editDialogVisible = ref(false);
const selectedComponent = ref<ServerComponent>();

// 查询统计
const queryStats = ref<{
  queryTime: number;
  componentCount: number;
  dataPoints: number;
  updateTime: string;
} | null>(null);

// 时间快捷选项
const timeShortcuts = [
  {
    text: "最近1小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 60 * 60 * 1000);
      return [start, end];
    },
  },
  {
    text: "最近6小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 6 * 60 * 60 * 1000);
      return [start, end];
    },
  },
  {
    text: "最近24小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
      return [start, end];
    },
  },
];

/**
 * 加载服务器列表
 */
const loadServers = async () => {
  try {
    const res = await getServerList();
    if (res.code === "00000") {
      servers.value = res.data || [];
      if (servers.value.length > 0) {
        selectedServerId.value = servers.value[0].monitorSysGenServerId;
        await loadComponents();
      }
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
    ElMessage.error("加载服务器列表失败");
  }
};

/**
 * 加载组件列表
 */
const loadComponents = async () => {
  if (!selectedServerId.value) return;

  try {
    loading.value = true;
    const res = await getComponentsByServerId(selectedServerId.value);
    if (res.code === "00000") {
      components.value = res.data || [];
    }
  } catch (error) {
    console.error("加载组件列表失败:", error);
    ElMessage.error("加载组件列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 处理查询
 */
const handleQuery = async () => {
  if (!selectedServerId.value) {
    ElMessage.warning("请选择服务器");
    return;
  }

  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning("请选择时间范围");
    return;
  }

  try {
    loading.value = true;
    const startTime = parseInt(timeRange.value[0]);
    const endTime = parseInt(timeRange.value[1]);

    const start = Date.now();
    const res = await getBatchComponentData(selectedServerId.value, startTime, endTime, queryStep.value);
    const queryTime = Date.now() - start;

    if (res.code === "00000") {
      // 更新组件数据
      Object.assign(componentData, res.data?.components || {});

      // 更新统计信息
      queryStats.value = {
        queryTime,
        componentCount: Object.keys(res.data?.components || {}).length,
        dataPoints: Object.values(res.data?.components || {}).reduce((sum: number, data: any) => {
          return sum + (Array.isArray(data?.data) ? data.data.length : 1);
        }, 0),
        updateTime: new Date().toLocaleTimeString(),
      };

      // 更新图表
      await nextTick();
      updateAllCharts();

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
 * 设置图表引用
 */
const setChartRef = (componentId: number, el: any) => {
  if (el) {
    chartRefs[componentId] = el;
  }
};

/**
 * 更新所有图表
 */
const updateAllCharts = () => {
  components.value.forEach((component) => {
    const componentId = component.monitorSysGenServerComponentId!;
    const data = componentData[componentId];
    const chartEl = chartRefs[componentId];

    if (data && chartEl) {
      updateChart(componentId, data, chartEl);
    }
  });
};

/**
 * 更新单个图表
 */
const updateChart = (componentId: number, data: any, chartEl: HTMLElement) => {
  if (!charts[componentId]) {
    charts[componentId] = echarts.init(chartEl);
  }

  const chart = charts[componentId];
  const option = {
    grid: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 20,
    },
    xAxis: {
      type: "time",
      show: false,
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "line",
        data: generateChartData(data),
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 2,
          color: "#409eff",
        },
      },
    ],
  };

  chart.setOption(option);
};

/**
 * 生成图表数据
 */
const generateChartData = (data: any) => {
  if (!data?.data) return [];

  if (Array.isArray(data.data)) {
    return data.data.map((item: any, index: number) => [item.timestamp ? new Date(item.timestamp * 1000) : new Date(Date.now() - index * 60 * 1000), item.value || item]);
  }

  return [[new Date(), data.data]];
};

/**
 * 处理服务器变化
 */
const handleServerChange = () => {
  components.value = [];
  Object.keys(componentData).forEach((key) => {
    delete componentData[parseInt(key)];
  });
  queryStats.value = null;
  loadComponents();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadComponents();
};

/**
 * 处理添加组件
 */
const handleAddComponent = () => {
  selectedComponent.value = undefined;
  editDialogVisible.value = true;
};

/**
 * 处理操作
 */
const handleAction = (command: string, component: ServerComponent) => {
  selectedComponent.value = component;

  switch (command) {
    case "view":
      dataDialogVisible.value = true;
      break;
    case "edit":
      editDialogVisible.value = true;
      break;
    case "clone":
      handleCloneComponent(component);
      break;
    case "delete":
      handleDeleteComponent(component);
      break;
  }
};

/**
 * 处理查询单个组件
 */
const handleQueryComponent = async (component: ServerComponent) => {
  const componentId = component.monitorSysGenServerComponentId!;

  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning("请先设置时间范围");
    return;
  }

  try {
    componentLoading[componentId] = true;
    // 这里可以调用单个组件的查询接口
    // 暂时使用批量查询的结果
    ElMessage.success("查询成功");
  } catch (error) {
    console.error("查询组件失败:", error);
    ElMessage.error("查询组件失败");
  } finally {
    componentLoading[componentId] = false;
  }
};

/**
 * 处理克隆组件
 */
const handleCloneComponent = (component: ServerComponent) => {
  ElMessage.info("克隆功能开发中");
};

/**
 * 处理删除组件
 */
const handleDeleteComponent = async (component: ServerComponent) => {
  try {
    await ElMessageBox.confirm(`确定要删除组件 "${component.monitorSysGenServerComponentName}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await deleteServerComponent(component.monitorSysGenServerComponentId!);
    if (res.code === "00000") {
      ElMessage.success("删除成功");
      handleRefresh();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch (error) {
    // 用户取消删除
  }
};

/**
 * 格式化日期
 */
const formatDate = (date?: string) => {
  if (!date) return "未知";
  return new Date(date).toLocaleDateString();
};

// 生命周期
onMounted(() => {
  loadServers();

  // 设置默认时间范围（最近1小时）
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 60 * 60 * 1000);
  timeRange.value = [Math.floor(start.getTime() / 1000).toString(), Math.floor(end.getTime() / 1000).toString()];
});
</script>

<style lang="scss" scoped>
.component-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  h2 {
    margin: 0 0 4px 0;
    font-size: 24px;
    font-weight: 600;
  }

  .header-desc {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
  }
}

.query-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.query-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  margin-bottom: 16px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;

  .stats-label {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
}

.component-list {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.component-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-title {
  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.card-meta {
  display: flex;
  gap: 6px;
}

.card-content {
  padding: 16px;
}

.component-info {
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;

  .info-label {
    width: 60px;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .info-value {
    flex: 1;
    font-size: 13px;
    word-break: break-all;
  }
}

.data-preview {
  height: 80px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.preview-chart {
  width: 100%;
  height: 100%;
}

.no-data {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
  border-top: 1px solid #ebeef5;
}
</style>
