<template>
  <div ref="prometheusLayoutRef" class="prometheus-layout h-full">
    <div class="layout-header">
      <div v-if="editable" class="layout-actions-left">
        <el-button type="primary" @click="showAddComponentDrawer = true">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        </el-button>
        <el-button type="primary" @click="showComponentSelector = true">
          <IconifyIconOnline icon="ri:file-list-line" class="mr-1" />
        </el-button>
        <el-button type="primary" @click="loadSharedComponents">
          <IconifyIconOnline icon="ri:share-line" class="mr-1" />
        </el-button>
      </div>
      <div v-if="editable && layoutChanged" class="layout-actions">
        <el-button type="primary" @click="saveConfigToServer">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
        </el-button>
      </div>
    </div>

    <GridLayout
      v-if="layout.length > 0"
      class="h-full"
      :layout="layout"
      :col-num="24"
      :row-height="30"
      :is-draggable="editable"
      :is-resizable="editable"
      :vertical-compact="true"
      :use-css-transforms="true"
      :margin="[10, 10]"
      @layout-updated="handleLayoutUpdated"
    >
      <GridItem v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">
        <div class="grid-item-content">
          <div v-if="editable" class="grid-item-overlay">
            <div class="grid-item-actions">
              <el-tooltip content="编辑组件">
                <el-button type="primary" circle size="small" @click="editComponent(item)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="图表配置">
                <el-button type="warning" circle size="small" @click="editChartConfig(item)">
                  <IconifyIconOnline icon="ri:settings-3-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除组件">
                <el-button type="danger" circle size="small" @click="removeComponent(item)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </div>
            <div class="grid-item-drag-handle">
              <IconifyIconOnline icon="ri:drag-move-fill" />
            </div>
          </div>

          <component
            :is="getComponentByType(item.type)"
            :chart-data="getComponentData(item)"
            :height="getComponentHeight(item)"
            :loading="loading"
            :chart-config="getChartConfig(item)"
            :item="item"
            :editable="editable"
            :query-time="getComponentUpdateTime(item)"
            @click="handleChartClick(item)"
            @editComponent="editComponent"
            @removeComponent="removeComponent"
            @editChartConfig="editChartConfig"
            @fetchData="loadComponentData"
            @timeRangeChange="handleTimeRangeChange"
          />
        </div>
      </GridItem>
    </GridLayout>

    <div v-else class="empty-layout">
      <el-empty description="暂无监控组件" :image-size="100">
        <template #image>
          <IconifyIconOnline icon="ri:dashboard-line" style="font-size: 80px; color: #4db6ac" />
        </template>
        <el-button v-if="editable" type="primary" @click="showAddComponentDrawer = true">添加组件</el-button>
      </el-empty>
    </div>

    <!-- 添加/编辑组件抽屉 -->
    <el-drawer v-model="showAddComponentDrawer" class="component-drawer-parent" :title="editingComponent ? '编辑监控组件' : '添加监控组件'" size="40%" destroy-on-close>
      <div class="component-drawer">
        <el-form ref="componentFormRef" :model="componentForm" :rules="componentFormRules" label-width="100px">
          <el-form-item label="组件标题" prop="title">
            <el-input v-model="componentForm.title" placeholder="请输入组件标题" />
          </el-form-item>
          <el-form-item label="组件类型" prop="type">
            <ScSelect v-model="componentForm.type" :options="componentTypeOptions" layout="card" :columns="3" :gap="8" width="100px" icon-position="center" />
          </el-form-item>
          <el-form-item label="PromQL" prop="promQL">
            <div class="promql-input-group">
              <el-input v-model="componentForm.promQL" class="promql-input" type="textarea" :rows="4" placeholder="请输入Prometheus查询语句" />
              <el-button type="primary" @click="showPromQLExamples">
                <IconifyIconOnline icon="ri:code-line" class="mr-1" />
                查询示例
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="组件宽度" prop="width">
            <el-slider
              v-model="componentForm.width"
              :min="6"
              :max="24"
              :step="6"
              :marks="{
                6: '25%',
                12: '50%',
                18: '75%',
                24: '100%'
              }"
            />
          </el-form-item>
          <el-form-item label="组件高度" prop="height">
            <el-slider
              v-model="componentForm.height"
              :min="6"
              :max="18"
              :step="3"
              :marks="{
                6: '小',
                9: '中',
                12: '大',
                18: '特大'
              }"
            />
          </el-form-item>
          <el-form-item label="刷新间隔" prop="refreshInterval">
            <el-input-number v-model="componentForm.refreshInterval" :min="10" :max="600" :step="10" />
            <span class="ml-2">秒</span>
          </el-form-item>
          <el-form-item label="数据单位" prop="valueUnit">
            <el-select v-model="componentForm.valueUnit" placeholder="请选择数据单位">
              <el-option label="默认" value="" />
              <el-option label="百分比 (%)" value="percent" />
              <el-option label="字节 (B/KB/MB)" value="bytes" />
              <el-option label="数值 (K/M/B)" value="number" />
              <el-option label="时间 (秒/分/时)" value="time" />
              <el-option label="状态 (在线/离线)" value="status" />
            </el-select>
          </el-form-item>
          <el-form-item label="提示信息" prop="tip">
            <el-input v-model="componentForm.tip" type="textarea" :rows="2" placeholder="可选：添加图表提示信息" />
          </el-form-item>
          <el-form-item label="是否共享" prop="isShared">
            <el-switch v-model="componentForm.isShared" active-text="开启共享" inactive-text="仅自己可见" />
          </el-form-item>
        </el-form>
        <div class="drawer-footer">
          <el-button @click="showAddComponentDrawer = false">取消</el-button>
          <el-button type="primary" @click="saveComponent">保存</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 添加组件选择器对话框 -->
    <el-dialog v-model="showComponentSelector" title="选择组件" width="60%" destroy-on-close>
      <div class="component-selector">
        <el-tabs v-model="componentSelectorTab">
          <el-tab-pane label="我的组件" name="my">
            <div class="component-cards">
              <el-empty v-if="myComponents.length === 0" description="暂无可用组件" />
              <div v-else class="component-grid">
                <div
                  v-for="item in myComponents"
                  :key="item.monitorSysGenPrometheusConfigId"
                  class="component-card"
                  :class="{ 'component-card-selected': selectedComponents.includes(item.monitorSysGenPrometheusConfigId) }"
                  @click="toggleComponentSelection(item)"
                >
                  <div class="component-card-header">
                    <span class="component-card-title">{{ item.monitorSysGenPrometheusConfigTitle || item.monitorSysGenPrometheusConfigName }}</span>
                    <el-tag size="small" :type="getComponentTypeTag(item.monitorSysGenPrometheusConfigChartType)">
                      {{ getComponentTypeName(item.monitorSysGenPrometheusConfigChartType) }}
                    </el-tag>
                  </div>
                  <div class="component-card-content">
                    <IconifyIconOnline :icon="getComponentTypeIcon(item.monitorSysGenPrometheusConfigChartType)" class="component-card-icon" />
                  </div>
                  <div class="component-card-footer">
                    <el-checkbox :model-value="selectedComponents.includes(item.monitorSysGenPrometheusConfigId)" @change="() => toggleComponentSelection(item)" @click.stop>选择</el-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="共享组件" name="shared">
            <div class="component-cards">
              <el-empty v-if="sharedComponents.length === 0" description="暂无共享组件" />
              <div v-else class="component-grid">
                <div
                  v-for="item in sharedComponents"
                  :key="item.monitorSysGenPrometheusConfigId"
                  class="component-card"
                  :class="{ 'component-card-selected': selectedComponents.includes(item.monitorSysGenPrometheusConfigId) }"
                  @click="toggleComponentSelection(item)"
                >
                  <div class="component-card-header">
                    <span class="component-card-title">{{ item.monitorSysGenPrometheusConfigTitle || item.monitorSysGenPrometheusConfigName }}</span>
                    <el-tag size="small" :type="getComponentTypeTag(item.monitorSysGenPrometheusConfigChartType)">
                      {{ getComponentTypeName(item.monitorSysGenPrometheusConfigChartType) }}
                    </el-tag>
                  </div>
                  <div class="component-card-content">
                    <IconifyIconOnline :icon="getComponentTypeIcon(item.monitorSysGenPrometheusConfigChartType)" class="component-card-icon" />
                  </div>
                  <div class="component-card-footer">
                    <el-checkbox :model-value="selectedComponents.includes(item.monitorSysGenPrometheusConfigId)" @change="() => toggleComponentSelection(item)" @click.stop>选择</el-checkbox>
                    <span class="component-card-author">{{ item.createName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="dialog-footer">
          <el-button @click="showComponentSelector = false">取消</el-button>
          <el-button type="primary" @click="addSelectedComponents">添加所选组件</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- PromQL 示例对话框 -->
    <el-dialog v-model="showPromQLExamplesDialog" title="PromQL 查询示例" width="60%" destroy-on-close>
      <div class="promql-examples">
        <el-tabs>
          <el-tab-pane label="系统监控">
            <el-descriptions title="系统监控示例" :column="1" border>
              <el-descriptions-item v-for="(example, index) in systemExamples" :key="index" :label="example.name">
                <div class="example-content">
                  <div class="example-query">{{ example.query }}</div>
                  <div class="example-actions">
                    <el-button type="primary" size="small" @click="applyPromQLExample(example.query)">使用</el-button>
                  </div>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="Java 应用">
            <el-descriptions title="Java 应用监控示例" :column="1" border>
              <el-descriptions-item v-for="(example, index) in javaExamples" :key="index" :label="example.name">
                <div class="example-content">
                  <div class="example-query">{{ example.query }}</div>
                  <div class="example-actions">
                    <el-button type="primary" size="small" @click="applyPromQLExample(example.query)">使用</el-button>
                  </div>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="Spring Boot">
            <el-descriptions title="Spring Boot 监控示例" :column="1" border>
              <el-descriptions-item v-for="(example, index) in springBootExamples" :key="index" :label="example.name">
                <div class="example-content">
                  <div class="example-query">{{ example.query }}</div>
                  <div class="example-actions">
                    <el-button type="primary" size="small" @click="applyPromQLExample(example.query)">使用</el-button>
                  </div>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 图表配置对话框 -->
    <ChartConfigDialog ref="chartConfigDialogRef" @confirm="handleChartConfigConfirm" @cancel="handleChartConfigCancel" />
  </div>
</template>

<script setup lang="ts">
import {
  fetchPrometheusDeleteConfig,
  fetchPrometheusListConfig,
  fetchPrometheusSaveConfig,
  fetchPrometheusShareConfig,
  fetchPrometheusUpdateConfig,
  MonitorSysGenPrometheusConfig
} from "@/api/prometheus/config";
import { fetchPrometheusQueryGen, fetchPrometheusQueryRangeGen } from "@/api/prometheus/index";
// import { saveComponentChartConfig } from "@/api/server/layout";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { GridItem, GridLayout } from "grid-layout-plus";
import { defineExpose, defineProps, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { formatValue, getValueUnit, formatStatus, getStatusUnit } from "../utils/format";
import ChartConfigDialog from "./ChartConfigDialog.vue";
import PrometheusComponent from "./PrometheusComponent.vue";
import BatteryChart from "./BatteryChart.vue";

const props = defineProps({
  data: Object,
  editable: {
    type: Boolean,
    default: false
  },
  timeParams: {
    type: Object,
    default: () => ({})
  }
});

// 布局相关
const layout = ref([]);
const loading = ref(false);
const layoutChanged = ref(false);
const configId = ref(null);

// 全屏相关
const prometheusLayoutRef = ref(null);
const isBrowserFullscreen = ref(false);

// 图表配置相关
const chartConfigDialogRef = ref(null);
const configEditingComponent = ref(null);

// 组件类型选项
const componentTypeOptions = [
  { label: "折线图", value: "line", icon: "ri:line-chart-line" },
  { label: "柱状图", value: "bar", icon: "ri:bar-chart-horizontal-line" },
  { label: "仪表盘", value: "gauge", icon: "ri:dashboard-3-line" },
  { label: "卡片", value: "card", icon: "ri:layout-grid-line" },
  { label: "电池图", value: "battery", icon: "ri:battery-charge-line" }
];

// 组件表单
const showAddComponentDrawer = ref(false);
const editingComponent = ref(null);
const componentFormRef = ref(null);
const componentForm = reactive({
  title: "",
  type: "line",
  promQL: "",
  width: 12,
  height: 9,
  refreshInterval: 60,
  valueUnit: "",
  tip: "",
  isShared: false
} as any);
const componentFormRules = {
  title: [{ required: true, message: "请输入组件标题", trigger: "blur" }],
  type: [{ required: true, message: "请选择组件类型", trigger: "change" }],
  promQL: [{ required: true, message: "请输入Prometheus查询语句", trigger: "blur" }]
};

// 组件选择器相关
const showComponentSelector = ref(false);
const componentSelectorTab = ref("my");
const myComponents = ref([]);
const sharedComponents = ref([]);
const selectedComponents = ref<string[]>([]);

// PromQL 示例相关
const showPromQLExamplesDialog = ref(false);
const systemExamples = [
  { name: "主机存活检测", query: 'up{job="node-exporter"}' },
  { name: "CPU 使用率", query: '100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)' },
  { name: "内存使用率", query: "100 * (1 - ((node_memory_MemFree_bytes + node_memory_Cached_bytes + node_memory_Buffers_bytes) / node_memory_MemTotal_bytes))" },
  { name: "磁盘使用率", query: '100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"})' },
  { name: "网络流入流量", query: 'irate(node_network_receive_bytes_total{device!="lo"}[5m])' },
  { name: "网络流出流量", query: 'irate(node_network_transmit_bytes_total{device!="lo"}[5m])' }
];

const javaExamples = [
  { name: "JVM 堆内存使用", query: 'sum(jvm_memory_used_bytes{area="heap"}) by (instance)' },
  { name: "JVM 非堆内存使用", query: 'sum(jvm_memory_used_bytes{area="nonheap"}) by (instance)' },
  { name: "GC 暂停时间", query: "sum(increase(jvm_gc_pause_seconds_sum[1m])) by (instance)" },
  { name: "线程数", query: "jvm_threads_live_threads" },
  { name: "类加载数", query: "jvm_classes_loaded_classes" }
];

const springBootExamples = [
  { name: "HTTP 请求总数", query: "sum(http_server_requests_seconds_count) by (instance)" },
  { name: "HTTP 请求延迟", query: "sum(rate(http_server_requests_seconds_sum[5m])) by (instance) / sum(rate(http_server_requests_seconds_count[5m])) by (instance)" },
  { name: "HTTP 错误率", query: 'sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (instance) / sum(rate(http_server_requests_seconds_count[5m])) by (instance)' },
  { name: "数据库连接数", query: "hikaricp_connections_active" },
  { name: "系统负载", query: "system_load_average_1m" },
  { name: "Tomcat 活跃会话数", query: "tomcat_sessions_active_current_sessions" },
  { name: "QPS (每秒查询数)", query: "sum(rate(http_server_requests_seconds_count[1m])) by (instance)" },
  { name: "HTTP 请求耗时分布", query: "sum(rate(http_server_requests_seconds_bucket[5m])) by (le)" },
  { name: "HTTP 请求状态码分布", query: "sum(rate(http_server_requests_seconds_count[5m])) by (status)" },
  { name: "HTTP 请求方法分布", query: "sum(rate(http_server_requests_seconds_count[5m])) by (method)" },
  { name: "HTTP 端点访问排行", query: "topk(10, sum(rate(http_server_requests_seconds_count[5m])) by (uri))" }
];

// 组件数据
const componentsData = ref({});
let refreshTimers = {};

// 获取时间范围参数
const getTimeRangeParams = (customTimeRange = null) => {
  if (customTimeRange && customTimeRange.startTime && customTimeRange.endTime) {
    return {
      start: Math.floor(new Date(customTimeRange.startTime).getTime() / 1000),
      end: Math.floor(new Date(customTimeRange.endTime).getTime() / 1000),
      step: 15
    };
  }

  // 默认查询最近30分钟的数据
  const end = Math.floor(Date.now() / 1000);
  const start = end - 30 * 60;

  return {
    start: start,
    end: end,
    step: 15
  };
};

// 根据组件类型获取对应的组件
const getComponentByType = type => {
  // 如果是电池图，则返回BatteryChart组件
  if (type === "battery") {
    return BatteryChart;
  }
  // 其他类型返回PrometheusComponent
  return PrometheusComponent;
};

// 获取组件数据
const getComponentData = item => {
  if (!componentsData.value[item.i]) {
    return {
      labels: [],
      datasets: [
        {
          label: item.title || "数据",
          data: [],
          borderColor: item.color || "#409EFF",
          backgroundColor: item.bgColor || "rgba(64, 158, 255, 0.1)",
          fill: true
        }
      ]
    };
  }
  return componentsData.value[item.i];
};

// 获取组件高度
const getComponentHeight = item => {
  return "100%";
};

// 浏览器全屏切换
const toggleBrowserFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .then(() => {
        isBrowserFullscreen.value = true;
      })
      .catch(err => {
        ElMessage.error(`全屏错误: ${err.message}`);
      });
  } else {
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .then(() => {
          isBrowserFullscreen.value = false;
        })
        .catch(err => {
          ElMessage.error(`退出全屏错误: ${err.message}`);
        });
    }
  }
};

// 显示 PromQL 示例对话框
const showPromQLExamples = () => {
  showPromQLExamplesDialog.value = true;
};

// 应用 PromQL 示例
const applyPromQLExample = query => {
  componentForm.promQL = query;
  showPromQLExamplesDialog.value = false;
};

// 监听全屏变化事件
const handleFullscreenChange = () => {
  isBrowserFullscreen.value = !!document.fullscreenElement;
};

// 加载组件数据
const loadComponentData = async (item, timeRange = null) => {
  if (!props.data.genId || !item.promQL) return;

  try {
    // 对于卡片、仪表盘和电池图类型，只需要最新的一条记录
    if (item.type === "card" || item.type === "gauge" || item.type === "battery") {
      // 使用即时查询接口获取最新值
      const res = await fetchPrometheusQueryGen({
        monitorSysGenId: item.monitorSysGenPrometheusConfigOrigin || props.data.genId,
        promQL: item.promQL
      });

      // 处理返回数据
      if (res.code === "00000" && res.data) {
        // 处理 Prometheus 格式的数据
        const prometheusData = res.data;

        // 初始化组件数据
        if (!componentsData.value[item.i]) {
          componentsData.value[item.i] = {
            labels: [],
            datasets: [],
            updateTime: new Date().toLocaleString()
          };
        }

        // 更新时间
        componentsData.value[item.i].updateTime = new Date().toLocaleString();

        // 提取数据值
        if (prometheusData.data.resultType === "vector" && prometheusData.data.result && prometheusData.data.result.length > 0) {
          // 处理即时查询结果
          const result = prometheusData.data.result[0];
          const value = parseFloat(result.value[1]);

          // 根据组件类型不同处理数据
          if (item.type === "card") {
            // 使用formatValue函数格式化值
            const valueUnit = item.valueUnit || item.monitorSysGenPrometheusConfigValueUnit || "";

            // 特殊处理"status"类型，或者检测到up指标
            const isStatusType = valueUnit === "status" || (result.metric && result.metric.__name__ === "up");

            // 如果是状态类型但没有明确设置valueUnit，则自动设置
            const effectiveValueUnit = isStatusType && !valueUnit ? "status" : valueUnit;

            const formattedValue = formatValue(value, effectiveValueUnit, item.chartConfig?.unit);
            const unitDisplay = getValueUnit(value, effectiveValueUnit, item.chartConfig);

            // 保留原有数据结构，只更新需要的字段
            componentsData.value[item.i] = {
              ...componentsData.value[item.i],
              unitValue: effectiveValueUnit,
              rawValue: value, // 保存原始值用于比较
              metric: result.metric,
              metricName: formatMetricName(result.metric),
              formattedValue: formattedValue,
              datasets: [
                {
                  label: item.title || "数据",
                  data: [value],
                  borderColor: isStatusType ? (value === 1 ? "#67C23A" : "#F56C6C") : item.color || "#409EFF",
                  unitValue: effectiveValueUnit,
                  backgroundColor: isStatusType ? (value === 1 ? "rgba(103, 194, 58, 0.1)" : "rgba(245, 108, 108, 0.1)") : item.bgColor || "rgba(64, 158, 255, 0.1)",
                  fill: true
                }
              ]
            };
          } else if (item.type === "gauge" || item.type === "battery") {
            // 使用formatValue函数格式化值
            const valueUnit = item.valueUnit || item.monitorSysGenPrometheusConfigValueUnit || "";

            // 特殊处理"status"类型，或者检测到up指标
            const isStatusType = valueUnit === "status" || (result.metric && result.metric.__name__ === "up");

            // 如果是状态类型但没有明确设置valueUnit，则自动设置
            const effectiveValueUnit = isStatusType && !valueUnit ? "status" : valueUnit;

            const formattedValue = formatValue(value, effectiveValueUnit, item.chartConfig?.unit);
            const unitDisplay = getValueUnit(value, effectiveValueUnit, item.chartConfig);

            // 保留原有数据结构，只更新需要的字段
            componentsData.value[item.i] = {
              ...componentsData.value[item.i],
              valueUnit: effectiveValueUnit,
              rawValue: value, // 保存原始值用于比较
              metric: result.metric,
              metricName: formatMetricName(result.metric),
              formattedValue: formattedValue,
              title: item.title, // 添加标题，用于电池图显示
              datasets: [
                {
                  label: item.title || "数据",
                  data: [value],
                  borderColor: isStatusType ? (value === 1 ? "#67C23A" : "#F56C6C") : item.color || "#409EFF",
                  unitValue: effectiveValueUnit,
                  backgroundColor: isStatusType ? (value === 1 ? "rgba(103, 194, 58, 0.1)" : "rgba(245, 108, 108, 0.1)") : item.bgColor || "rgba(64, 158, 255, 0.1)",
                  fill: true
                }
              ]
            };
          }
        }
      }
    } else {
      // 其他图表类型使用fetchPrometheusQueryRangeGen接口
      const timeParams = getTimeRangeParams(timeRange);
      const res = await fetchPrometheusQueryRangeGen({
        monitorSysGenId: item.monitorSysGenPrometheusConfigOrigin || props.data.genId,
        promQL: item.promQL,
        ...timeParams
      });

      // 处理返回数据
      if (res.code === "00000" && res.data) {
        // 处理 Prometheus 格式的数据
        const prometheusData = res.data;

        // 初始化组件数据
        if (!componentsData.value[item.i]) {
          componentsData.value[item.i] = {
            labels: [],
            datasets: [],
            updateTime: new Date().toLocaleString()
          };
        }

        // 更新时间
        componentsData.value[item.i].updateTime = new Date().toLocaleString();

        // 提取数据值
        if (prometheusData.data.resultType === "matrix" && prometheusData.data.result && prometheusData.data.result.length > 0) {
          // 处理时间序列数据
          const datasets = [];
          const labels = [];

          // 提取时间标签
          if (prometheusData.data.result[0] && prometheusData.data.result[0].values && prometheusData.data.result[0].values.length > 0) {
            prometheusData.data.result[0].values.forEach(point => {
              const timestamp = new Date(point[0] * 1000).toLocaleTimeString();
              labels.push(timestamp);
            });
          }

          // 为每个结果创建一个数据集
          prometheusData.data.result.forEach(series => {
            const metricName = formatMetricName(series.metric);

            // 获取值单位
            const valueUnit = item.valueUnit || item.monitorSysGenPrometheusConfigValueUnit || "";

            // 特殊处理"status"类型，或者检测到up指标
            const isStatusType = valueUnit === "status" || (series.metric && series.metric.__name__ === "up");

            // 如果是状态类型但没有明确设置valueUnit，则自动设置
            const effectiveValueUnit = isStatusType && !valueUnit ? "status" : valueUnit;

            // 格式化数据点
            const data = series.values.map(point => {
              const rawValue = parseFloat(point[1]);
              // 对于图表数据，我们保留原始数值以便正确显示图表
              return rawValue;
            });

            // 创建数据集
            datasets.push({
              label: metricName,
              data: data,
              symbol: "none", // 去除折线图上的点
              borderColor: isStatusType ? "#67C23A" : item.color || getRandomColor(),
              backgroundColor: isStatusType ? "rgba(103, 194, 58, 0.1)" : item.bgColor || getRandomColor(0.1),
              fill: item.chartConfig?.fill !== false,
              tension: item.chartConfig?.smooth ? 0.4 : 0,
              valueUnit: effectiveValueUnit, // 保存值单位以便在图表提示中使用
              chartConfig: item.chartConfig, // 保存图表配置以便在图表提示中使用
              isStatusType: isStatusType // 标记是否为状态类型
            });
          });

          // 更新组件数据，保留原有结构
          componentsData.value[item.i] = {
            ...componentsData.value[item.i],
            labels: labels,
            datasets: datasets
          };
        }
      }
    }
  } catch (error) {
    console.error("加载组件数据失败:", error);
  }
};

// 格式化指标名称，从 metric 对象中提取有用信息
const formatMetricName = metric => {
  if (!metric) return "未知指标";

  // 特殊处理 up 指标，将 1 转换为 "在线"，0 转换为 "离线"
  if (metric.__name__ === "up" && metric.value) {
    const value = parseFloat(metric.value[1]);
    return value === 1 ? "在线" : "离线";
  }

  // 尝试从常见的 Prometheus 标签中获取有意义的名称
  const nameFromLabels = metric.__name__ || metric.name || metric.job || metric.instance;

  if (nameFromLabels) {
    // 如果有其他重要标签，可以添加到名称中
    const instance = metric.instance ? ` (${metric.instance})` : "";
    return `${nameFromLabels}${instance}`;
  }

  // 如果没有常见标签，则将所有标签组合成一个字符串
  const labels = Object.entries(metric)
    .filter(([key]) => key !== "__name__")
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");

  return labels ? `{${labels}}` : "未知指标";
};

// 设置组件刷新定时器
const setupComponentRefreshTimer = item => {
  // 清除已有的定时器
  if (refreshTimers[item.i]) {
    clearInterval(refreshTimers[item.i]);
  }

  // 设置新的定时器
  if (item.refreshInterval && item.refreshInterval > 0) {
    refreshTimers[item.i] = setInterval(() => {
      loadComponentData(item);
    }, item.refreshInterval * 1000);
  }
};

// 清除所有定时器
const clearAllRefreshTimers = () => {
  Object.values(refreshTimers).forEach(timer => {
    //@ts-ignore
    clearInterval(timer);
  });
  refreshTimers = {};
};

// 布局更新处理
const handleLayoutUpdated = newLayout => {
  layout.value = newLayout;
  layoutChanged.value = true;
};

// 保存配置到服务器
const saveConfigToServer = async () => {
  if (!props.data.genId) return;

  try {
    const config = {
      monitorSysGenId: props.data.genId,
      monitorSysGenPrometheusConfigOrigin: props.data.genId,
      monitorSysGenPrometheusConfigType: "layout",
      monitorSysGenPrometheusConfigQl: JSON.stringify({
        layout: layout.value
      }),
      monitorSysGenPrometheusConfigName: "布局配置",
      monitorSysGenPrometheusConfigTitle: "布局配置",
      monitorSysGenPrometheusConfigEnable: true,
      monitorSysGenPrometheusConfigChartType: "layout",
      monitorSysGenPrometheusConfigShare: false
    } as MonitorSysGenPrometheusConfig;

    // 如果是更新已有配置
    if (configId.value) {
      config.monitorSysGenPrometheusConfigId = configId.value;
      await fetchPrometheusUpdateConfig(config);
    } else {
      // 如果是新建配置
      const res = await fetchPrometheusSaveConfig(config);
      if (res.code === "00000" && res.data) {
        // 保存配置ID，用于后续更新
        //@ts-ignore
        configId.value = res.data.monitorSysGenPrometheusConfigId;
      }
    }

    layoutChanged.value = false;
    ElMessage.success("布局已保存");
  } catch (error) {
    console.error("保存布局失败:", error);
    ElMessage.error("保存布局失败");
  }
};

// 加载组件配置
const loadComponentConfigs = async () => {
  if (!props.data.genId) return;

  try {
    const res = await fetchPrometheusListConfig({
      genId: props.data.genId,
      monitorSysGenPrometheusConfigType: "component"
    });

    if (res.code === "00000" && res.data && res.data.length > 0) {
      // 将组件配置与布局项关联
      for (const config of res.data) {
        try {
          const position = JSON.parse(config.monitorSysGenPrometheusConfigPostion || "{}");
          const itemIndex = layout.value.findIndex(item => item.i === position.i);

          if (itemIndex !== -1) {
            // 更新布局项的配置ID
            layout.value[itemIndex].configId = config.monitorSysGenPrometheusConfigId;
          }
        } catch (e) {
          console.error("解析组件位置配置失败:", e);
        }
      }
    }
  } catch (error) {
    console.error("加载组件配置失败:", error);
  }
};

// 加载配置
const loadConfig = async () => {
  if (!props.data.genId) return;

  try {
    loading.value = true;
    const res = await fetchPrometheusListConfig({
      genId: props.data.genId,
      monitorSysGenPrometheusConfigType: "layout"
    });

    if (res.code === "00000" && res.data && res.data.length > 0) {
      const config = res.data[0];
      configId.value = config.monitorSysGenPrometheusConfigId;

      try {
        const content = JSON.parse(config.monitorSysGenPrometheusConfigQl || "{}");
        if (content.layout && Array.isArray(content.layout)) {
          layout.value = content.layout;

          // 加载组件配置
          await loadComponentConfigs();

          // 加载所有组件数据
          for (const item of layout.value) {
            await loadComponentData(item);
            setupComponentRefreshTimer(item);
          }
        }
      } catch (e) {
        console.error("解析布局配置失败:", e);
      }
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    ElMessage.error("加载配置失败");
  } finally {
    loading.value = false;
  }
};

// 编辑组件
const editComponent = item => {
  editingComponent.value = item;

  componentForm.title = item.title || item.monitorSysGenPrometheusConfigTitle || item.monitorSysGenPrometheusConfigName || "";
  componentForm.type = item.type || item.monitorSysGenPrometheusConfigChartType || "line";
  componentForm.promQL = item.promQL || item.monitorSysGenPrometheusConfigQl || "";
  componentForm.width = item.w || item.monitorSysGenPrometheusConfigWidth || 12;
  componentForm.height = item.h || item.monitorSysGenPrometheusConfigHeight || 9;
  componentForm.refreshInterval = item.refreshInterval || item.monitorSysGenPrometheusConfigRefreshInterval || 60;
  componentForm.valueUnit = item.valueUnit || item.monitorSysGenPrometheusConfigValueUnit || "";
  componentForm.monitorSysGenPrometheusConfigValueUnit = item.valueUnit || item.monitorSysGenPrometheusConfigValueUnit || "";
  componentForm.tip = item.tip || item.monitorSysGenPrometheusConfigTip || "";
  componentForm.isShared = item.isShared || item.monitorSysGenPrometheusConfigShare === true || item.monitorSysGenPrometheusConfigIsShared === 1;

  showAddComponentDrawer.value = true;
};

// 删除组件
const removeComponent = item => {
  ElMessageBox.confirm("确定要删除此监控组件吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      // 清除定时器
      if (refreshTimers[item.i]) {
        clearInterval(refreshTimers[item.i]);
        delete refreshTimers[item.i];
      }

      // 删除组件数据
      delete componentsData.value[item.i];

      // 从布局中移除
      layout.value = layout.value.filter(i => i.i !== item.i);

      // 删除组件配置
      if (item.configId) {
        try {
          await fetchPrometheusDeleteConfig({
            monitorSysGenPrometheusConfigId: item.configId,
            monitorSysGenId: props.data.genId,
            monitorSysGenPrometheusConfigType: "component",
            monitorSysGenPrometheusConfigName: item.title || "",
            monitorSysGenPrometheusConfigTitle: item.title || "",
            monitorSysGenPrometheusConfigEnable: true,
            monitorSysGenPrometheusConfigChartType: item.type || "line",
            monitorSysGenPrometheusConfigShare: false
          } as MonitorSysGenPrometheusConfig);
        } catch (error) {
          console.error("删除组件配置失败:", error);
        }
      }

      // 保存布局配置
      saveConfigToServer();

      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

// 获取组件图表配置
const getChartConfig = item => {
  // 获取值单位
  const valueUnit = item.valueUnit || item.monitorSysGenPrometheusConfigValueUnit || "";

  // 检查是否为状态类型
  const isStatusType = valueUnit === "status";

  // 如果组件有配置，则使用组件配置
  if (item.chartConfig) {
    return {
      ...item.chartConfig,
      valueUnit: valueUnit,
      isStatusType: isStatusType,
      symbol: item.type === "line" ? "none" : undefined, // 折线图不显示数据点
      formatValue: value => {
        // 如果是状态类型，使用formatStatus函数
        if (isStatusType) {
          return formatStatus(value);
        }
        return formatValue(value, valueUnit, item.chartConfig.unit);
      },
      getValueUnit: value => {
        // 如果是状态类型，使用getStatusUnit函数
        if (isStatusType) {
          return getStatusUnit();
        }
        return getValueUnit(value, valueUnit, item.chartConfig);
      }
    };
  }

  // 默认配置
  return {
    yAxisMin: null,
    yAxisMax: null,
    unit: "",
    mainColor: isStatusType ? "#67C23A" : item.color || "#409EFF",
    bgColor: isStatusType ? "rgba(103, 194, 58, 0.1)" : item.bgColor || "rgba(64, 158, 255, 0.1)",
    showLegend: true,
    stacked: false,
    fill: true,
    smooth: false,
    symbol: item.type === "line" ? "none" : undefined, // 折线图不显示数据点
    thresholds: isStatusType
      ? [
          { value: 0, color: "#F56C6C", label: "离线" },
          { value: 1, color: "#67C23A", label: "在线" }
        ]
      : [
          { value: 0, color: "#67C23A", label: "正常" },
          { value: 60, color: "#E6A23C", label: "警告" },
          { value: 80, color: "#F56C6C", label: "危险" }
        ],
    valueUnit: valueUnit,
    isStatusType: isStatusType,
    formatValue: value => {
      // 如果是状态类型，使用formatStatus函数
      if (isStatusType) {
        return formatStatus(value);
      }
      return formatValue(value, valueUnit);
    },
    getValueUnit: value => {
      // 如果是状态类型，使用getStatusUnit函数
      if (isStatusType) {
        return getStatusUnit();
      }
      return getValueUnit(value, valueUnit);
    }
  };
};

// 处理图表点击事件
const handleChartClick = item => {
  if (props.editable) {
    editChartConfig(item);
  }
};

// 编辑图表配置
const editChartConfig = item => {
  configEditingComponent.value = item;

  // 初始化表单数据
  const config = getChartConfig(item);
  const chartConfig = {
    title: item.title || "",
    type: item.type || "line",
    yAxisMin: config.yAxisMin,
    yAxisMax: config.yAxisMax,
    unit: config.unit || "",
    mainColor: config.mainColor || "#409EFF",
    bgColor: config.bgColor || "rgba(64, 158, 255, 0.1)",
    showLegend: config.showLegend !== false,
    stacked: config.stacked || false,
    fill: config.fill !== false,
    smooth: config.smooth || false,
    showGrid: config.showGrid !== false,
    showLabel: config.showLabel !== false,
    thresholds: config.thresholds || [
      { value: 0, color: "#67C23A", label: "正常" },
      { value: 60, color: "#E6A23C", label: "警告" },
      { value: 80, color: "#F56C6C", label: "危险" }
    ],
    animation: config.animation !== false,
    animationDuration: config.animationDuration || 1000,
    animationDelay: config.animationDelay || 0
  };

  // 打开配置对话框
  chartConfigDialogRef.value?.open(chartConfig);
};

// 处理图表配置确认
const handleChartConfigConfirm = async config => {
  if (!configEditingComponent.value) return;

  try {
    // 保存配置到组件
    configEditingComponent.value.chartConfig = {
      yAxisMin: config.yAxisMin,
      yAxisMax: config.yAxisMax,
      unit: config.unit,
      mainColor: config.mainColor,
      bgColor: config.bgColor,
      showLegend: config.showLegend,
      stacked: config.stacked,
      fill: config.fill,
      smooth: config.smooth,
      showGrid: config.showGrid,
      showLabel: config.showLabel,
      thresholds: config.thresholds,
      animation: config.animation,
      animationDuration: config.animationDuration,
      animationDelay: config.animationDelay
    };

    // 更新组件标题
    if (config.title && config.title !== configEditingComponent.value.title) {
      configEditingComponent.value.title = config.title;
    }

    // 更新组件类型
    if (config.type && config.type !== configEditingComponent.value.type) {
      configEditingComponent.value.type = config.type;
    }

    // 更新组件颜色
    configEditingComponent.value.color = config.mainColor;
    configEditingComponent.value.bgColor = config.bgColor;

    // 刷新组件数据
    loadComponentData(configEditingComponent.value);

    // 保存组件配置到服务器
    await saveComponentConfig(configEditingComponent.value);

    configEditingComponent.value = null;
    ElMessage.success("图表配置已保存");
  } catch (error) {
    console.error("保存图表配置失败:", error);
    ElMessage.error("保存图表配置失败");
  }
};

// 处理图表配置取消
const handleChartConfigCancel = () => {
  configEditingComponent.value = null;
};

// 保存组件配置到服务器
const saveComponentConfig = async item => {
  if (!props.data.genId) return;

  try {
    // 准备图表配置
    const chartConfig = item.chartConfig ? JSON.stringify(item.chartConfig) : "";

    const config = {
      monitorSysGenId: props.data.genId,
      monitorSysGenPrometheusConfigOrigin: item.monitorSysGenPrometheusConfigOrigin || props.data.genId,
      monitorSysGenPrometheusConfigType: "component",
      monitorSysGenPrometheusConfigQl: item.promQL,
      monitorSysGenPrometheusConfigName: item.title,
      monitorSysGenPrometheusConfigTitle: item.title,
      monitorSysGenPrometheusConfigChartType: item.type,
      monitorSysGenPrometheusConfigEnable: true,
      monitorSysGenPrometheusConfigShare: item.isShared,
      monitorSysGenPrometheusConfigChartConfig: chartConfig,
      monitorSysGenPrometheusConfigValueUnit: item.valueUnit,
      monitorSysGenPrometheusConfigPostion: JSON.stringify({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i,
        refreshInterval: item.refreshInterval,
        color: item.color,
        bgColor: item.bgColor
      })
    } as any;

    // 如果组件已有配置ID
    if (item.configId) {
      config.monitorSysGenPrometheusConfigId = item.configId;
      await fetchPrometheusUpdateConfig(config);
    } else {
      // 如果是新建组件配置
      const res = await fetchPrometheusSaveConfig(config);
      if (res.code === "00000" && res.data) {
        // 保存组件配置ID
        //@ts-ignore
        item.configId = (res.data as any).monitorSysGenPrometheusConfigId;
      }
    }
  } catch (error) {
    console.error("保存组件配置失败:", error);
  }
};

// 保存组件
const saveComponent = () => {
  componentFormRef.value.validate(async valid => {
    if (!valid) return;

    try {
      loading.value = true;

      // 构建组件配置
      const component = {
        monitorSysGenPrometheusConfigName: componentForm.title,
        monitorSysGenPrometheusConfigTitle: componentForm.title,
        monitorSysGenPrometheusConfigPromql: componentForm.promQL,
        monitorSysGenPrometheusConfigChartType: componentForm.type,
        monitorSysGenPrometheusConfigWidth: componentForm.width,
        monitorSysGenPrometheusConfigHeight: componentForm.height,
        monitorSysGenPrometheusConfigRefreshInterval: componentForm.refreshInterval,
        monitorSysGenPrometheusConfigValueUnit: componentForm.valueUnit,
        monitorSysGenPrometheusConfigTip: componentForm.tip,
        monitorSysGenPrometheusConfigIsShared: componentForm.isShared ? 1 : 0
      };

      // 生成唯一ID
      const componentId = editingComponent.value ? editingComponent.value.i : `component-${Date.now()}`;

      // 创建或更新组件
      const componentItem = {
        i: componentId,
        x: editingComponent.value ? editingComponent.value.x : 0,
        y: editingComponent.value ? editingComponent.value.y : layout.value.length,
        w: componentForm.width,
        h: componentForm.height,
        title: componentForm.title,
        type: componentForm.type,
        promQL: componentForm.promQL,
        refreshInterval: componentForm.refreshInterval,
        valueUnit: componentForm.valueUnit,
        tip: componentForm.tip,
        isShared: componentForm.isShared,
        color: editingComponent.value ? editingComponent.value.color : getRandomColor(),
        bgColor: editingComponent.value ? editingComponent.value.bgColor : getRandomColor(0.1),
        configId: editingComponent.value ? editingComponent.value.configId : null,
        chartConfig: editingComponent.value ? editingComponent.value.chartConfig : null,
        monitorSysGenPrometheusConfigOrigin: editingComponent.value ? editingComponent.value.monitorSysGenPrometheusConfigOrigin : props.data.genId
      };

      if (editingComponent.value) {
        // 更新现有组件
        const index = layout.value.findIndex(item => item.i === componentId);
        if (index !== -1) {
          layout.value[index] = componentItem;
        }
      } else {
        // 添加新组件
        layout.value.push(componentItem);
      }

      // 加载组件数据
      await loadComponentData(componentItem);

      // 设置刷新定时器
      setupComponentRefreshTimer(componentItem);

      // 保存组件配置
      await saveComponentConfig(componentItem);

      // 保存布局配置
      saveConfigToServer();

      // 关闭抽屉
      showAddComponentDrawer.value = false;

      // 重置表单
      editingComponent.value = null;

      ElMessage.success(editingComponent.value ? "组件更新成功" : "组件添加成功");
    } catch (error) {
      console.error("保存组件失败:", error);
      ElMessage.error("保存组件失败");
    } finally {
      loading.value = false;
    }
  });
};

// 生成随机颜色
const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 获取组件类型标签颜色
const getComponentTypeTag = type => {
  const typeMap = {
    line: "primary",
    bar: "success",
    gauge: "warning",
    card: "info",
    battery: "danger"
  };
  return typeMap[type] || "info";
};

// 获取组件类型名称
const getComponentTypeName = type => {
  const typeMap = {
    line: "折线图",
    bar: "柱状图",
    gauge: "仪表盘",
    card: "卡片",
    battery: "电池图"
  };
  return typeMap[type] || "未知类型";
};

// 获取组件类型图标
const getComponentTypeIcon = type => {
  const iconMap = {
    line: "ri:line-chart-line",
    bar: "ri:bar-chart-horizontal-line",
    gauge: "ri:dashboard-3-line",
    card: "ri:layout-grid-line",
    battery: "ri:battery-charge-line"
  };
  return iconMap[type] || "ri:question-line";
};

// 加载我的组件
const loadMyComponents = async () => {
  if (!props.data.genId) return;

  try {
    const res = await fetchPrometheusListConfig({
      genId: props.data.genId,
      monitorSysGenPrometheusConfigType: "component"
    });

    if (res.code === "00000" && res.data) {
      myComponents.value = res.data.filter(item => !layout.value.some(layoutItem => layoutItem.configId === item.monitorSysGenPrometheusConfigId));
    }
  } catch (error) {
    console.error("加载我的组件失败:", error);
    ElMessage.error("加载我的组件失败");
  }
};

// 加载共享组件
const loadSharedComponents = async () => {
  if (!props.data.genId) return;

  try {
    const res = await fetchPrometheusShareConfig({
      monitorSysGenId: props.data.genId
    });

    if (res.code === "00000" && res.data) {
      sharedComponents.value = res.data.filter(item => !layout.value.some(layoutItem => layoutItem.configId === item.monitorSysGenPrometheusConfigId));
    }

    // 打开组件选择器并切换到共享标签
    showComponentSelector.value = true;
    componentSelectorTab.value = "shared";
  } catch (error) {
    console.error("加载共享组件失败:", error);
    ElMessage.error("加载共享组件失败");
  }
};

// 切换组件选择
const toggleComponentSelection = item => {
  const id = item.monitorSysGenPrometheusConfigId;
  const index = selectedComponents.value.indexOf(id);

  if (index > -1) {
    selectedComponents.value.splice(index, 1);
  } else {
    selectedComponents.value.push(id);
  }
};

// 添加选中的组件
const addSelectedComponents = async () => {
  if (selectedComponents.value.length === 0) {
    ElMessage.warning("请至少选择一个组件");
    return;
  }

  try {
    loading.value = true;

    // 获取所有选中的组件
    const selectedItems = [
      ...myComponents.value.filter(item => selectedComponents.value.includes(item.monitorSysGenPrometheusConfigId)),
      ...sharedComponents.value.filter(item => selectedComponents.value.includes(item.monitorSysGenPrometheusConfigId))
    ];

    // 添加组件到布局
    for (const item of selectedItems) {
      const componentItem = {
        i: `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        x: 0,
        y: layout.value.length,
        w: 12,
        h: 9,
        monitorSysGenPrometheusConfigOrigin: item.monitorSysGenId || item.monitorSysGenPrometheusConfigOrigin,
        title: item.monitorSysGenPrometheusConfigTitle || item.monitorSysGenPrometheusConfigName,
        valueUnit: item.monitorSysGenPrometheusConfigValueUnit,
        type: item.monitorSysGenPrometheusConfigChartType,
        promQL: item.monitorSysGenPrometheusConfigQl,
        refreshInterval: 60,
        color: getRandomColor(),
        bgColor: getRandomColor(0.1),
        configId: null // 初始设置为null，后续会更新
      };

      layout.value.push(componentItem);

      // 对于共享的组件，需要复制一份到当前genId
      try {
        // 准备图表配置
        const chartConfig = item.monitorSysGenPrometheusConfigChartConfig || "";

        // 创建新的配置对象
        const config = {
          monitorSysGenId: props.data.genId,
          monitorSysGenPrometheusConfigOrigin: componentItem.monitorSysGenPrometheusConfigOrigin,
          monitorSysGenPrometheusConfigType: "component",
          monitorSysGenPrometheusConfigQl: componentItem.promQL,
          monitorSysGenPrometheusConfigName: componentItem.title,
          monitorSysGenPrometheusConfigTitle: componentItem.title,
          monitorSysGenPrometheusConfigChartType: componentItem.type,
          monitorSysGenPrometheusConfigEnable: true,
          monitorSysGenPrometheusConfigShare: false, // 默认不共享
          monitorSysGenPrometheusConfigChartConfig: chartConfig,
          monitorSysGenPrometheusConfigValueUnit: item.monitorSysGenPrometheusConfigValueUnit || "",
          monitorSysGenPrometheusConfigPostion: JSON.stringify({
            x: componentItem.x,
            y: componentItem.y,
            w: componentItem.w,
            h: componentItem.h,
            i: componentItem.i,
            refreshInterval: componentItem.refreshInterval,
            color: componentItem.color,
            bgColor: componentItem.bgColor
          })
        } as any;

        // 保存新配置
        const res = await fetchPrometheusSaveConfig(config);
        if (res.code === "00000" && res.data) {
          // 更新组件的configId
          componentItem.configId = (res.data as any).monitorSysGenPrometheusConfigId;

          // 更新布局中的组件
          const index = layout.value.findIndex(item => item.i === componentItem.i);
          if (index !== -1) {
            layout.value[index].configId = componentItem.configId;
          }
        }
      } catch (error) {
        console.error("复制组件配置失败:", error);
      }

      // 加载组件数据
      await loadComponentData(componentItem);

      // 设置刷新定时器
      setupComponentRefreshTimer(componentItem);
    }

    // 保存布局配置
    saveConfigToServer();

    // 关闭选择器
    showComponentSelector.value = false;
    selectedComponents.value = [];

    ElMessage.success(`成功添加 ${selectedItems.length} 个组件`);
  } catch (error) {
    console.error("添加组件失败:", error);
    ElMessage.error("添加组件失败");
  } finally {
    loading.value = false;
  }
};

// 获取组件更新时间
const getComponentUpdateTime = item => {
  if (!componentsData.value[item.i]) {
    return new Date().toLocaleString();
  }
  return componentsData.value[item.i].updateTime || new Date().toLocaleString();
};

// 处理时间范围变化
const handleTimeRangeChange = async range => {
  if (!range || !range.componentId) return;

  const item = layout.value.find(i => i.i === range.componentId);
  if (!item) return;

  // 设置时间范围但不显示在区间里
  const startTime = new Date(range.startTime);
  const endTime = new Date(range.endTime);

  // 调用loadComponentData方法加载指定时间范围的数据
  await loadComponentData(item, {
    startTime,
    endTime,
    isDefault: range.isDefault || false
  });
};

// 监听数据源变化
watch(
  () => props.data.genId,
  () => {
    if (props.data.genId) {
      clearAllRefreshTimers();
      loadConfig();
    }
  }
);

// 组件挂载时
onMounted(() => {
  if (props.data.genId) {
    loadConfig();
    loadMyComponents(); // 加载我的组件
  }

  // 添加全屏变化事件监听
  document.addEventListener("fullscreenchange", handleFullscreenChange);
});

// 组件卸载前
onBeforeUnmount(() => {
  clearAllRefreshTimers();

  // 移除全屏变化事件监听
  document.removeEventListener("fullscreenchange", handleFullscreenChange);

  // 如果处于全屏状态，退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => {
      console.error("退出全屏失败:", err);
    });
  }
});

// 暴露方法给父组件
defineExpose({
  refresh: () => {
    layout.value.forEach(item => {
      loadComponentData(item);
    });
  }
});
</script>

<style lang="scss" scoped>
.prometheus-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #1e1e2e;

  &:deep(.vue-grid-layout) {
    flex: 1;
    overflow: auto;
  }

  .layout-header {
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #1e1e2e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10;
    color: #e0e0e0;

    .layout-actions-left {
      display: flex;
      gap: 8px;
    }

    .layout-actions {
      display: flex;
      gap: 8px;
    }
  }

  .grid-item-content {
    height: 100%;
    width: 100%;
    background-color: #292a3e;
    border-radius: 8px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    color: #e0e0e0;
  }

  .grid-item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(30, 30, 46, 0.8);
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;

    &:hover {
      opacity: 1;
    }
  }

  .grid-item-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .grid-item-drag-handle {
    cursor: move;
    font-size: 24px;
    color: #4db6ac;
  }

  .empty-layout {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #e0e0e0;
  }

  :deep(.el-tabs__item),
  :deep(.el-dialog__title),
  :deep(.el-switch__label),
  :deep(.el-descriptions__title),
  :deep(.el-descriptions__label),
  :deep(.el-drawer__header) {
    color: #e0e0e0;
  }
  :deep(.el-input__wrapper) {
    background-color: #292a3e !important;
  }
  :deep(.el-dialog),
  :deep(.el-drawer),
  :deep(.el-descriptions__cell),
  :deep(.el-input__wrapper),
  .component-drawer-parent {
    background-color: #1e1e2e !important;
  }

  .component-drawer {
    padding: 16px;
    background-color: #1e1e2e;
    color: #e0e0e0;

    :deep(.el-form) {
      .el-form-item__label {
        color: #e0e0e0;
      }

      .el-input__inner,
      .el-textarea__inner {
        background-color: #292a3e;
        border-color: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
      }

      .el-slider__runway {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .el-slider__bar {
        background-color: #4db6ac;
      }

      .el-slider__button {
        border-color: #4db6ac;
      }
    }

    .drawer-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background-color: #1e1e2e;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .ml-2 {
    margin-left: 8px;
  }

  .component-selector {
    .component-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }

    .component-card {
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s;
      cursor: pointer;
      background-color: #292a3e;
      color: #e0e0e0;

      &:hover {
        box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.3);
        transform: translateY(-2px);
      }

      &-selected {
        border-color: #4db6ac;
        box-shadow: 0 0 0 1px rgba(77, 182, 172, 0.3);
      }

      &-header {
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &-title {
        font-weight: bold;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 120px;
      }

      &-content {
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
      }

      &-icon {
        font-size: 48px;
        color: #4db6ac;
      }

      &-footer {
        padding: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &-author {
        font-size: 12px;
        color: #a0a0a0;
      }
    }

    .dialog-footer {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

.promql-input-group {
  display: flex;
  flex-direction: row;
  gap: 8px;

  .promql-input {
    width: 480px;
  }
  .el-button {
    align-self: flex-end;
    height: 100%;
  }
}

.promql-examples {
  .example-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .example-query {
    font-family: monospace;
    background-color: #292a3e;
    padding: 8px;
    border-radius: 4px;
    color: #e0e0e0;
    flex: 1;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .example-actions {
    flex-shrink: 0;
  }
}

.chart-config-dialog {
  .thresholds-config {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .threshold-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

:deep(.prometheus-layout-fullscreen) {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  background-color: #1e1e2e;
}
</style>
