<template>
  <div class="system-container modern-bg server-component-layout h-full" ref="serverLayoutRef">
    <div class="layout-header" v-if="editable">
      <!-- 左侧编辑操作区 -->
      <div class="layout-actions-left">
        <el-button type="primary" @click="showAddComponentDrawer = true">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加组件
        </el-button>
        <el-button type="primary" @click="showComponentSelector = true">
          <IconifyIconOnline icon="ri:file-list-line" class="mr-1" />
          组件库
        </el-button>
        <el-button type="primary" @click="loadSharedComponents">
          <IconifyIconOnline icon="ri:share-line" class="mr-1" />
          共享组件
        </el-button>
      </div>

      <!-- 右侧保存操作区 -->
      <div v-if="editable && layoutChanged" class="layout-actions-right">
        <el-button type="primary" @click="saveConfigToServer">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存布局
        </el-button>
      </div>
    </div>

    <GridLayout v-if="layout.length > 0" class="h-full" :layout="layout" :col-num="24" :row-height="30" :is-draggable="editable" :is-resizable="editable" :vertical-compact="true" :use-css-transforms="true" :margin="[10, 10]" @layout-updated="handleLayoutUpdated">
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
                  <IconifyIconOnline icon="ri:settings-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除组件">
                <el-button type="danger" circle size="small" @click="removeComponent(item)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <component
            :is="getComponentByType(item.type)"
            :chart-data="getComponentData(item)"
            :height="getComponentHeight(item)"
            :loading="loading"
            :error="getComponentError(item)"
            :chart-config="getChartConfig(item)"
            :item="item"
            :editable="editable"
            :show-title="item.showTitle !== false"
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

    <!-- 空状态 -->
    <div v-else class="empty-layout">
      <el-empty description="暂无组件">
        <el-button type="primary" @click="showAddComponentDrawer = true">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加第一个组件
        </el-button>
      </el-empty>
    </div>

    <!-- 添加组件抽屉 -->
    <sc-drawer v-model="showAddComponentDrawer" title="添加组件" size="600px" direction="rtl">
      <div class="add-component-form">
        <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="120px">
          <el-form-item label="组件名称" prop="title">
            <el-input v-model="addForm.title" placeholder="请输入组件名称" />
          </el-form-item>

          <el-form-item label="组件类型" prop="type">
            <el-select v-model="addForm.type" placeholder="请选择组件类型" style="width: 100%">
              <el-option v-for="option in componentTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="表达式类型" prop="expressionType">
            <el-select v-model="addForm.expressionType" placeholder="请选择表达式类型" style="width: 100%">
              <el-option v-for="option in expressionTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <el-form-item :label="addForm.expressionType === 'PROMETHEUS' ? 'PromQL表达式' : '组件选择'" prop="expression">
            <!-- Prometheus 表达式输入 -->
            <template v-if="addForm.expressionType === 'PROMETHEUS'">
              <el-input v-model="addForm.expression" type="textarea" :rows="4" placeholder="请输入PromQL查询表达式" />
              <div class="expression-examples">
                <div class="examples-header">常用表达式示例：</div>
                <div class="examples-list">
                  <el-tag v-for="example in prometheusExamples" :key="example.value" size="small" class="example-tag" @click="addForm.expression = example.value">
                    {{ example.label }}
                  </el-tag>
                </div>
              </div>
            </template>

            <!-- 固定组件选择 -->
            <template v-else>
              <el-select v-model="addForm.expression" placeholder="请选择监控组件" style="width: 100%" filterable>
                <el-option v-for="option in componentOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </template>
          </el-form-item>

          <el-form-item label="组件大小">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-input-number v-model="addForm.w" :min="1" :max="24" placeholder="宽度" style="width: 100%" />
              </el-col>
              <el-col :span="12">
                <el-input-number v-model="addForm.h" :min="1" :max="20" placeholder="高度" style="width: 100%" />
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item label="数值单位" prop="valueUnit">
            <el-select v-model="addForm.valueUnit" placeholder="请选择数值单位" style="width: 100%" clearable>
              <el-option v-for="option in valueUnitOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="显示标题">
            <el-switch v-model="addForm.showTitle" active-text="显示" inactive-text="隐藏" />
          </el-form-item>
        </el-form>

        <div class="drawer-footer">
          <el-button @click="showAddComponentDrawer = false">取消</el-button>
          <el-button type="primary" @click="addComponent" :loading="addLoading">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加组件
          </el-button>
        </div>
      </div>
    </sc-drawer>

    <!-- 组件选择器对话框 -->
    <sc-dialog v-model="showComponentSelector" title="选择组件" width="60%" destroy-on-close>
      <div class="component-selector">
        <el-tabs v-model="componentSelectorTab">
          <el-tab-pane label="我的组件" name="my">
            <div class="component-cards">
              <el-empty v-if="myComponents.length === 0" description="暂无可用组件" />
              <div v-else class="component-grid">
                <div v-for="item in myComponents" :key="item.monitorSysGenServerComponentId" class="component-card" :class="{ 'component-card-selected': selectedComponents.includes(item.monitorSysGenServerComponentId) }" @click="toggleComponentSelection(item)">
                  <div class="component-card-header">
                    <span class="component-card-title">{{ item.monitorSysGenServerComponentName }}</span>
                    <el-tag size="small" :type="getComponentTypeTag(item.monitorSysGenServerComponentType)">
                      {{ getComponentTypeName(item.monitorSysGenServerComponentType) }}
                    </el-tag>
                  </div>
                  <div class="component-card-content">
                    <div class="component-expression">{{ item.monitorSysGenServerComponentExpression || item.monitorSysGenServerComponentDescription }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="共享组件" name="shared">
            <div class="component-cards">
              <el-empty v-if="sharedComponents.length === 0" description="暂无共享组件" />
              <div v-else class="component-grid">
                <div v-for="item in sharedComponents" :key="item.monitorSysGenServerComponentId" class="component-card" :class="{ 'component-card-selected': selectedComponents.includes(item.monitorSysGenServerComponentId) }" @click="toggleComponentSelection(item)">
                  <div class="component-card-header">
                    <span class="component-card-title">{{ item.monitorSysGenServerComponentName }}</span>
                    <el-tag size="small" :type="getComponentTypeTag(item.monitorSysGenServerComponentType)">
                      {{ getComponentTypeName(item.monitorSysGenServerComponentType) }}
                    </el-tag>
                  </div>
                  <div class="component-card-content">
                    <div class="component-expression">{{ item.monitorSysGenServerComponentExpression || item.monitorSysGenServerComponentDescription }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="selector-footer">
          <div class="selected-info">已选择 {{ selectedComponents.length }} 个组件</div>
          <div class="selector-actions">
            <el-button @click="showComponentSelector = false">取消</el-button>
            <el-button type="primary" @click="addSelectedComponents" :disabled="selectedComponents.length === 0">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加选中组件
            </el-button>
          </div>
        </div>
      </div>
    </sc-dialog>

    <!-- 图表配置对话框 -->
    <ChartConfigDialog ref="chartConfigDialogRef" @save="handleChartConfigSave" />

    <!-- 组件编辑对话框 -->
    <ComponentEditDialog ref="componentEditDialogRef" :server-id="serverId" @saved="handleComponentSaved" />
  </div>
</template>

<script setup lang="ts">
import type { ComponentRealtimeMessage } from "@/api/server";
import {
  batchUpdateLayoutPositions,
  createServerComponentLayout,
  createServerDetailComponent,
  deleteServerComponentLayout,
  executeComponentQuery,
  getAvailableComponentDefinitions,
  getComponentsByServerId,
  getEnabledServerComponentLayouts,
  updateServerDetailComponent,
  type ServerComponentLayout,
} from "@/api/server";
import { useServerMetrics } from "@/composables/useServerWebSocket";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { GridItem, GridLayout } from "grid-layout-plus";
import { defineExpose, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ChartConfigDialog from "../components/ChartConfigDialog.vue";
import ComponentEditDialog from "../components/ComponentEditDialog.vue";
import ServerComponent from "./ServerComponent.vue";

const props = defineProps({
  serverId: {
    type: Number,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  timeParams: {
    type: Object,
    default: () => ({}),
  },
});

// 响应式状态
const serverLayoutRef = ref();
const loading = ref(false);
const layout = ref([]);
const layoutChanged = ref(false);
const componentsData = ref({});
const componentTimers = ref({});

// 查询控制相关
const queryTimeRange = ref([]);

const globalRefreshTimer = ref(null);

// Socket.IO实时数据相关
const serverMetrics = useServerMetrics(props.serverId);
const realtimeUnsubscribeFunctions = ref(new Map());

// 添加组件相关
const showAddComponentDrawer = ref(false);
const addLoading = ref(false);
const addFormRef = ref();
const addForm = reactive({
  title: "",
  type: "card",
  expressionType: "COMPONENT",
  expression: "",
  w: 6,
  h: 6,
  valueUnit: "",
  showTitle: true,
});

// 组件选择器相关
const showComponentSelector = ref(false);
const componentSelectorTab = ref("my");
const myComponents = ref([]);
const sharedComponents = ref([]);
const selectedComponents = ref([]);

// 对话框引用
const chartConfigDialogRef = ref();
const componentEditDialogRef = ref();

// 组件类型选项
const componentTypeOptions = [
  { label: "卡片", value: "card" },
  { label: "仪表盘", value: "gauge" },
  { label: "折线图", value: "line" },
  { label: "柱状图", value: "bar" },
  { label: "饼图", value: "pie" },
  { label: "表格", value: "table" },
];

// 表达式类型选项
const expressionTypeOptions = [
  { label: "固定组件", value: "COMPONENT" },
  { label: "Prometheus PromQL", value: "PROMETHEUS" },
];

// 组件选项
const componentOptions = [
  { label: "CPU使用率", value: "cpu_usage" },
  { label: "内存使用率", value: "memory_usage" },
  { label: "磁盘使用率", value: "disk_usage" },
  { label: "网络IO", value: "network_io" },
  { label: "磁盘列表", value: "disk_list" },
  { label: "系统信息", value: "system_info" },
  { label: "进程列表", value: "process_list" },
  { label: "系统负载", value: "load_average" },
];

// Prometheus 示例表达式
const prometheusExamples = [
  { label: "CPU使用率", value: '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)' },
  { label: "内存使用率", value: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100" },
  { label: "磁盘使用率", value: "100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes)" },
  { label: "网络接收", value: "irate(node_network_receive_bytes_total[5m])" },
  { label: "系统负载", value: "node_load1" },
  { label: "服务状态", value: "up" },
];

// 数值单位选项
const valueUnitOptions = [
  { label: "百分比", value: "percent" },
  { label: "字节", value: "bytes" },
  { label: "状态", value: "status" },
  { label: "数量", value: "count" },
  { label: "时间", value: "time" },
];

// 表单验证规则
const addFormRules = {
  title: [{ required: true, message: "请输入组件名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择组件类型", trigger: "change" }],
  expressionType: [{ required: true, message: "请选择表达式类型", trigger: "change" }],
  expression: [{ required: true, message: "请输入表达式或选择组件", trigger: "blur" }],
};

// 监听布局变化
watch(
  () => layout.value,
  () => {
    layoutChanged.value = true;
  },
  { deep: true }
);

// 监听timeParams变化，更新查询时间范围
watch(
  () => props.timeParams,
  (newTimeParams) => {
    if (newTimeParams && newTimeParams.start && newTimeParams.end) {
      queryTimeRange.value = [new Date(newTimeParams.start), new Date(newTimeParams.end)];
      console.log("时间参数更新:", newTimeParams, "转换后的时间范围:", queryTimeRange.value);
    }
  },
  { deep: true, immediate: true }
);

// 生命周期
onMounted(() => {
  // 初始化默认时间范围（最近1小时）
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 3600 * 1000);
  queryTimeRange.value = [start, end];

  loadComponents();
});

onBeforeUnmount(() => {
  // 清理所有定时器
  if (globalRefreshTimer.value) {
    clearInterval(globalRefreshTimer.value);
  }

  Object.values(componentTimers.value).forEach((timer: any) => {
    if (timer) clearInterval(timer);
  });

  // 清理所有实时数据订阅
  realtimeUnsubscribeFunctions.value.forEach((unsubscribe) => {
    if (unsubscribe) unsubscribe();
  });
  realtimeUnsubscribeFunctions.value.clear();
});

/**
 * 加载组件布局（使用新的布局API）
 */
const loadComponents = async () => {
  if (!props.serverId) return;
  console.log("开始加载组件布局，服务器ID:", props.serverId);

  try {
    loading.value = true;

    // 1. 获取启用的组件布局配置
    const layoutRes = await getEnabledServerComponentLayouts(props.serverId);

    if (layoutRes.code === "00000" && layoutRes.data) {
      // 2. 获取所有组件定义信息
      const componentsRes = await getComponentsByServerId(props.serverId);
      const componentsMap = new Map();

      if (componentsRes.code === "00000" && componentsRes.data) {
        componentsRes.data.forEach((component) => {
          componentsMap.set(component.monitorSysGenServerComponentId, component);
        });
      }

      // 3. 合并布局配置和组件定义
      layout.value = layoutRes.data
        .map((layoutConfig) => {
          const component = componentsMap.get(layoutConfig.monitorSysGenServerComponentId);

          if (!component) {
            console.warn("找不到组件定义:", layoutConfig.monitorSysGenServerComponentId);
            return null;
          }

          return {
            i: `layout-${layoutConfig.monitorSysGenServerComponentLayoutId}`,
            x: layoutConfig.monitorSysGenServerComponentLayoutX || 0,
            y: layoutConfig.monitorSysGenServerComponentLayoutY || 0,
            w: layoutConfig.monitorSysGenServerComponentLayoutW || 6,
            h: layoutConfig.monitorSysGenServerComponentLayoutH || 6,
            // 布局相关字段
            layoutId: layoutConfig.monitorSysGenServerComponentLayoutId,
            componentId: layoutConfig.monitorSysGenServerComponentId,
            zIndex: layoutConfig.monitorSysGenServerComponentLayoutZIndex || 1,
            movable: layoutConfig.monitorSysGenServerComponentLayoutMovable !== false,
            resizable: layoutConfig.monitorSysGenServerComponentLayoutResizable !== false,
            // 组件定义字段
            title: component.monitorSysGenServerComponentName,
            type: component.monitorSysGenServerComponentType,
            expressionType: component.monitorSysGenServerComponentExpressionType,
            expression: component.monitorSysGenServerComponentExpression,
            showTitle: component.monitorSysGenServerComponentShowTitle !== false,
            valueUnit: (component as any).monitorSysGenServerComponentValueUnit,
            chartConfig: component.monitorSysGenServerComponentChartConfig,
            enabled: component.monitorSysGenServerComponentEnabled,
          };
        })
        .filter((item) => item !== null);

      console.log("加载的布局配置:", layout.value);

      // 4. 加载组件数据
      for (const item of layout.value) {
        await loadComponentData(item);
      }
    } else {
      console.log("没有找到布局配置，显示空布局");
      layout.value = [];
    }
  } catch (error) {
    console.error("加载组件布局失败:", error);
    message("加载组件布局失败", { type: "error" });
  } finally {
    loading.value = false;

    // 延迟触发图表resize，确保所有图表正确显示
    nextTick(() => {
      setTimeout(() => {
        // 触发窗口resize事件，让所有图表重新调整尺寸
        window.dispatchEvent(new Event("resize"));
      }, 200);
    });
  }
};

/**
 * 布局更新处理
 */
const handleLayoutUpdated = (newLayout: any) => {
  layout.value = newLayout;
  layoutChanged.value = true;
};

/**
 * 保存配置到服务器
 */
const saveConfigToServer = async () => {
  try {
    loading.value = true;

    // 构建布局更新数据
    const layoutUpdates = layout.value.map(
      (item) =>
        ({
          monitorSysGenServerComponentLayoutId: item.layoutId,
          monitorSysGenServerId: props.serverId,
          monitorSysGenServerComponentId: item.componentId,
          monitorSysGenServerComponentLayoutX: item.x,
          monitorSysGenServerComponentLayoutY: item.y,
          monitorSysGenServerComponentLayoutW: item.w,
          monitorSysGenServerComponentLayoutH: item.h,
          monitorSysGenServerComponentLayoutZIndex: item.zIndex || 1,
          monitorSysGenServerComponentLayoutMovable: item.movable !== false,
          monitorSysGenServerComponentLayoutResizable: item.resizable !== false,
          monitorSysGenServerComponentLayoutStatus: 1,
        }) as ServerComponentLayout
    );

    // 使用新的批量更新布局位置API
    const res = await batchUpdateLayoutPositions(layoutUpdates);

    if (res.code === "00000") {
      message("布局保存成功", { type: "success" });
      layoutChanged.value = false;
    } else {
      message(res.msg || "保存布局失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存布局失败:", error);
    message("保存布局失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 添加组件
 */
const addComponent = async () => {
  try {
    await addFormRef.value?.validate();
    addLoading.value = true;

    const componentData = {
      monitorSysGenServerId: props.serverId,
      monitorSysGenServerComponentName: addForm.title,
      monitorSysGenServerComponentTitle: addForm.title,
      monitorSysGenServerComponentType: addForm.type,
      monitorSysGenServerComponentExpressionType: addForm.expressionType,
      monitorSysGenServerComponentExpression: addForm.expression,
      monitorSysGenServerComponentShowTitle: addForm.showTitle !== false,
      monitorSysGenServerComponentValueUnit: addForm.valueUnit,
      monitorSysGenServerComponentEnabled: 1,
      monitorSysGenServerComponentSortOrder: layout.value.length,
      monitorSysGenServerComponentPosition: JSON.stringify({
        x: 0,
        y: getNextY(),
        w: addForm.w,
        h: addForm.h,
      }),
    };

    const res = await createServerDetailComponent(componentData);

    if (res.code === "00000") {
      message("组件添加成功", { type: "success" });
      showAddComponentDrawer.value = false;
      resetAddForm();
      await loadComponents();
    } else {
      message(res.msg || "添加失败", { type: "error" });
    }
  } catch (error) {
    console.error("添加组件失败:", error);
    message("添加组件失败", { type: "error" });
  } finally {
    addLoading.value = false;
  }
};

/**
 * 获取下一个Y位置
 */
const getNextY = () => {
  if (layout.value.length === 0) return 0;
  const maxY = Math.max(...layout.value.map((item) => item.y + item.h));
  return maxY;
};

/**
 * 重置添加表单
 */
const resetAddForm = () => {
  Object.assign(addForm, {
    title: "",
    type: "card",
    expressionType: "COMPONENT",
    expression: "",
    showTitle: true,
    w: 6,
    h: 6,
    valueUnit: "",
  });
  addFormRef.value?.clearValidate();
};

/**
 * 编辑组件
 */
const editComponent = (item: any) => {
  componentEditDialogRef.value?.open("edit", {
    monitorSysGenServerComponentId: item.componentId,
    monitorSysGenServerId: props.serverId,
    monitorSysGenServerComponentName: item.title,
    monitorSysGenServerComponentTitle: item.title,
    monitorSysGenServerComponentType: item.type,
    monitorSysGenServerComponentExpressionType: item.expressionType,
    monitorSysGenServerComponentExpression: item.expression,
    monitorSysGenServerComponentShowTitle: item.showTitle !== false,
    monitorSysGenServerComponentEnabled: item.enabled,
    monitorSysGenServerComponentChartConfig: item.chartConfig,
    monitorSysGenServerComponentPosition: JSON.stringify({
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      i: item.i,
    }),
  });
};

/**
 * 删除组件（删除布局配置）
 */
const removeComponent = async (item: any) => {
  try {
    await ElMessageBox.confirm(`确定要从布局中移除组件 "${item.title}" 吗？这只会删除布局配置，不会删除组件定义。`, "移除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 删除布局配置，而不是删除组件定义
    const res = await deleteServerComponentLayout(item.layoutId);

    if (res.code === "00000") {
      message("组件已从布局中移除", { type: "success" });

      // 从前端布局中移除
      const index = layout.value.findIndex((layoutItem) => layoutItem.layoutId === item.layoutId);
      if (index > -1) {
        layout.value.splice(index, 1);
      }

      // 清理定时器
      if (componentTimers.value[item.i]) {
        clearInterval(componentTimers.value[item.i]);
        delete componentTimers.value[item.i];
      }

      // 重新加载可用组件列表
      if (showComponentSelector.value) {
        await loadMyComponents();
      }
    } else {
      message(res.msg || "移除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("移除组件失败:", error);
      message("移除组件失败", { type: "error" });
    }
  }
};

/**
 * 编辑图表配置
 */
const editChartConfig = (item: any) => {
  chartConfigDialogRef.value?.open(item);
};

/**
 * 图表配置保存
 */
const handleChartConfigSave = async (item: any, config: any) => {
  try {
    const res = await updateServerDetailComponent({
      monitorSysGenServerComponentId: item.componentId,
      monitorSysGenServerId: props.serverId,
      monitorSysGenServerComponentName: item.title || "",
      monitorSysGenServerComponentTitle: item.title || "",
      monitorSysGenServerComponentType: item.type || "card",
      monitorSysGenServerComponentExpressionType: item.expressionType || "COMPONENT",
      monitorSysGenServerComponentExpression: item.expression || "",
      monitorSysGenServerComponentEnabled: item.enabled || 1,
      monitorSysGenServerComponentChartConfig: JSON.stringify(config),
    } as any);

    if (res.code === "00000") {
      message("图表配置保存成功", { type: "success" });
      // 更新本地数据
      const layoutItem = layout.value.find((l) => l.componentId === item.componentId);
      if (layoutItem) {
        layoutItem.chartConfig = JSON.stringify(config);
      }
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存图表配置失败:", error);
    message("保存图表配置失败", { type: "error" });
  }
};

/**
 * 组件保存成功
 */
const handleComponentSaved = () => {
  loadComponents();
};

/**
 * 统一查询函数 - 支持手动查询和定时查询
 */
const executeUnifiedQuery = async (item: any, timeRangeOverride?: any) => {
  if (!item.expression || !item.componentId) return;

  try {
    const componentId = item.componentId;
    const expressionType = item.expressionType || "COMPONENT";

    // 使用传入的时间范围或默认时间范围
    const currentTimeRange = timeRangeOverride || queryTimeRange.value;

    if (!currentTimeRange || currentTimeRange.length !== 2) {
      console.warn("时间范围无效，跳过查询");
      return;
    }

    console.log(`开始统一查询组件数据: ${item.expression}`, {
      componentId,
      expressionType,
      timeRange: currentTimeRange,
      serverId: props.serverId,
    });

    // 构建时间范围参数
    const timeRange = {
      startTime: Math.floor(currentTimeRange[0].getTime() / 1000),
      endTime: Math.floor(currentTimeRange[1].getTime() / 1000),
      step: 60,
    };

    let result: any;

    // 根据表达式类型选择不同的数据查询方式
    switch (expressionType.toUpperCase()) {
      case "REALTIME":
        // 使用现有Socket.IO推送机制获取实时数据
        result = await handleRealtimeQuery(item, componentId);
        break;

      case "PROMETHEUS":
        // 使用Prometheus查询
        result = await executeComponentQuery(componentId, timeRange);
        break;

      case "COMPONENT":
        // 使用组件时序数据查询
        result = await executeComponentQuery(componentId, timeRange);
        break;

      case "SQL":
        // 使用SQL查询
        result = await executeComponentQuery(componentId, timeRange);
        break;

      default:
        console.warn(`不支持的表达式类型: ${expressionType}`);
        result = await executeComponentQuery(componentId, timeRange);
    }

    if (result && result.code === "00000") {
      componentsData.value[item.i] = {
        ...result.data,
        updateTime: new Date().toLocaleTimeString(),
        expressionType: expressionType,
      };
      console.log(`组件数据查询成功: ${item.expression}`, result.data);
    } else {
      console.warn(`组件数据查询失败: ${item.expression}`, result?.msg);
      componentsData.value[item.i] = {
        error: result?.msg || "数据查询失败",
        updateTime: new Date().toLocaleTimeString(),
        expressionType: expressionType,
      };
    }
  } catch (error) {
    console.error("统一查询失败:", error);
    componentsData.value[item.i] = {
      error: error.message || "数据查询异常",
      updateTime: new Date().toLocaleTimeString(),
      expressionType: item.expressionType || "COMPONENT",
    };
  }
};

/**
 * 处理实时数据查询 - 复用现有Socket.IO机制
 */
const handleRealtimeQuery = async (item: any, componentId: number) => {
  try {
    // 先取消之前的订阅
    const existingUnsubscribe = realtimeUnsubscribeFunctions.value.get(item.i);
    if (existingUnsubscribe) {
      existingUnsubscribe();
      realtimeUnsubscribeFunctions.value.delete(item.i);
    }

    // 订阅服务器指标数据
    const unsubscribe = serverMetrics.onServerMetrics((metrics: any, message: any) => {
      // 根据组件表达式从服务器指标中提取相应数据
      const extractedData = extractDataFromServerMetrics(metrics, item.expression);

      // 构建实时消息格式
      const realtimeMessage: ComponentRealtimeMessage = {
        componentId: componentId,
        componentName: item.title,
        data: extractedData,
        type: "realtime",
        timestamp: message.timestamp || Date.now(),
      };

      // 更新组件数据
      componentsData.value[item.i] = {
        data: extractedData,
        updateTime: new Date().toLocaleTimeString(),
        expressionType: "REALTIME",
        realtimeMessage: realtimeMessage,
      };

      console.log(`实时数据更新: ${item.title}`, extractedData);
    });

    // 保存取消订阅函数
    realtimeUnsubscribeFunctions.value.set(item.i, unsubscribe);

    // 返回成功结果
    return {
      code: "00000",
      data: {
        message: "实时数据订阅已启动，数据将通过Socket.IO推送更新",
        subscribed: true,
      },
    };
  } catch (error) {
    console.error("实时数据查询失败:", error);
    return {
      code: "50000",
      msg: error.message || "实时数据订阅失败",
    };
  }
};

/**
 * 从服务器指标中提取组件数据
 */
const extractDataFromServerMetrics = (metrics: any, expression: string) => {
  // 根据表达式从服务器指标中提取数据
  // 这里可以根据expression的内容来决定提取哪些指标
  if (!metrics) return {};

  // 示例：根据表达式关键词提取相应数据
  const data: any = {};

  if (expression.includes("cpu") || expression.includes("CPU")) {
    data.cpuUsage = metrics.cpuUsage || 0;
  }

  if (expression.includes("memory") || expression.includes("内存")) {
    data.memoryUsage = metrics.memoryUsage || 0;
  }

  if (expression.includes("disk") || expression.includes("磁盘")) {
    data.diskUsage = metrics.diskUsage || 0;
  }

  if (expression.includes("network") || expression.includes("网络")) {
    data.networkIn = metrics.networkIn || 0;
    data.networkOut = metrics.networkOut || 0;
  }

  // 如果没有匹配的关键词，返回所有可用指标
  if (Object.keys(data).length === 0) {
    return {
      cpuUsage: metrics.cpuUsage || 0,
      memoryUsage: metrics.memoryUsage || 0,
      diskUsage: metrics.diskUsage || 0,
      networkIn: metrics.networkIn || 0,
      networkOut: metrics.networkOut || 0,
    };
  }

  return data;
};

/**
 * 加载组件数据 - 兼容原有接口
 */
const loadComponentData = async (item: any) => {
  return executeUnifiedQuery(item);
};

/**
 * 获取组件类型
 */
const getComponentByType = (_type: string) => {
  return ServerComponent;
};

/**
 * 获取组件数据
 */
const getComponentData = (item: any) => {
  return componentsData.value[item.i] || {};
};

/**
 * 获取组件错误信息
 */
const getComponentError = (item: any) => {
  const data = componentsData.value[item.i];
  return data?.error || "";
};

/**
 * 获取组件高度
 */
const getComponentHeight = (item: any) => {
  // GridLayout配置: row-height=30, margin=[10,10]
  // 网格总高度计算
  const gridHeight = item.h * 30 + (item.h - 1) * 10;

  // 减去固定的高度占用
  const gridItemBorder = 2; // grid-item-content的border
  const serverComponentHeader = 40; // ServerComponent头部高度
  const serverComponentBorder = 1; // ServerComponent边框

  // 根据组件类型调整内部图表高度
  const componentType = item.type || "card";
  let chartPadding = 0;

  if (componentType === "card") {
    // Card组件有内边距 16px * 2 = 32px
    chartPadding = 32;
  }

  const finalHeight = gridHeight - gridItemBorder - serverComponentHeader - serverComponentBorder - chartPadding;

  // 确保最小高度，避免图表显示异常
  return Math.max(finalHeight, 80);
};

/**
 * 获取图表配置
 */
const getChartConfig = (item: any) => {
  try {
    return item.chartConfig ? JSON.parse(item.chartConfig) : {};
  } catch (e) {
    return {};
  }
};

/**
 * 获取组件更新时间
 */
const getComponentUpdateTime = (item: any) => {
  const data = componentsData.value[item.i];
  return data?.updateTime || "";
};

/**
 * 图表点击处理
 */
const handleChartClick = (_item: any) => {
  // TODO: 实现图表点击逻辑
};

/**
 * 手动查询所有组件数据 - 供父组件调用
 */
const handleManualQuery = async () => {
  console.log("执行手动查询，当前时间范围:", queryTimeRange.value);

  if (!queryTimeRange.value || queryTimeRange.value.length !== 2) {
    console.warn("时间范围无效，无法执行查询");
    return;
  }

  // 遍历所有布局组件，执行统一查询
  for (const item of layout.value) {
    await executeUnifiedQuery(item, queryTimeRange.value);
  }
};

/**
 * 时间范围变化处理
 */
const handleTimeRangeChange = (item: any, timeRange: any) => {
  // 当单个组件的时间范围变化时，使用新的时间范围查询该组件
  if (timeRange && timeRange.length === 2) {
    executeUnifiedQuery(item, timeRange);
  } else {
    executeUnifiedQuery(item);
  }
};

/**
 * 加载可用的组件定义（用于组件选择器）
 */
const loadMyComponents = async () => {
  try {
    console.log("开始加载可用组件定义，服务器ID:", props.serverId);

    // 使用新的API获取所有可用的组件定义（不过滤状态）
    const res = await getAvailableComponentDefinitions(props.serverId);
    console.log("组件定义API响应:", res);

    if (res.code === "00000" && res.data) {
      console.log("获取到组件定义:", res.data.length, "个组件");

      // 过滤掉已经在布局中的组件
      const availableComponents = res.data.filter((component: any) => !layout.value.some((layoutItem) => layoutItem.componentId === component.monitorSysGenServerComponentId));

      myComponents.value = availableComponents;
      console.log("可选组件定义:", availableComponents.length, "个");

      if (availableComponents.length === 0) {
        message("所有组件都已添加到布局中", { type: "info" });
      } else {
        message(`找到 ${availableComponents.length} 个可选组件`, { type: "success" });
      }
    } else {
      console.warn("API返回错误:", res);
      myComponents.value = [];
      message(res.msg || "获取组件定义失败", { type: "warning" });
    }
  } catch (error) {
    console.error("加载组件定义失败:", error);
    myComponents.value = [];
    message("加载组件定义失败: " + ((error as any, { type: "error" }).message || "未知错误"));
  }
};

/**
 * 加载共享组件
 */
const loadSharedComponents = async () => {
  try {
    // TODO: 实现共享组件加载逻辑
    sharedComponents.value = [];

    // 打开组件选择器并切换到共享标签
    showComponentSelector.value = true;
    componentSelectorTab.value = "shared";
  } catch (error) {
    console.error("加载共享组件失败:", error);
    message("加载共享组件失败", { type: "error" });
  }
};

/**
 * 切换组件选择
 */
const toggleComponentSelection = (component: any) => {
  const componentId = component.monitorSysGenServerComponentId;
  const index = selectedComponents.value.indexOf(componentId);

  if (index > -1) {
    selectedComponents.value.splice(index, 1);
  } else {
    selectedComponents.value.push(componentId);
  }
};

/**
 * 添加选中组件（创建布局配置）
 */
const addSelectedComponents = async () => {
  try {
    loading.value = true;

    const allComponents = [...myComponents.value, ...sharedComponents.value];
    const selectedItems = allComponents.filter((component) => selectedComponents.value.includes(component.monitorSysGenServerComponentId));

    // 为每个选中的组件创建布局配置
    for (const component of selectedItems) {
      const x = 0;
      const y = getNextY();
      const w = 6;
      const h = 6;

      // 调用后端API创建布局配置
      const layoutRes = await createServerComponentLayout(props.serverId, component.monitorSysGenServerComponentId, x, y, w, h);

      if (layoutRes.code === "00000" && layoutRes.data) {
        // 创建成功后，添加到前端布局中
        const componentItem = {
          i: `layout-${layoutRes.data.monitorSysGenServerComponentLayoutId}`,
          x: x,
          y: y,
          w: w,
          h: h,
          // 布局相关字段
          layoutId: layoutRes.data.monitorSysGenServerComponentLayoutId,
          componentId: component.monitorSysGenServerComponentId,
          zIndex: 1,
          movable: true,
          resizable: true,
          // 组件定义字段
          title: component.monitorSysGenServerComponentName,
          type: component.monitorSysGenServerComponentType,
          expressionType: component.monitorSysGenServerComponentExpressionType,
          expression: component.monitorSysGenServerComponentExpression,
          showTitle: component.monitorSysGenServerComponentShowTitle !== false,
          valueUnit: (component as any).monitorSysGenServerComponentValueUnit,
          chartConfig: component.monitorSysGenServerComponentChartConfig,
          enabled: component.monitorSysGenServerComponentEnabled,
        };

        layout.value.push(componentItem);
        await loadComponentData(componentItem);
      } else {
        console.error("创建布局配置失败:", layoutRes);
        message(`创建组件 ${component.monitorSysGenServerComponentName} 的布局配置失败`, { type: "error" });
      }
    }

    showComponentSelector.value = false;
    selectedComponents.value = [];
    message(`成功添加 ${selectedItems.length} 个组件`, { type: "success" });

    // 重新加载可用组件列表
    await loadMyComponents();
  } catch (error) {
    console.error("添加组件失败:", error);
    message("添加组件失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 获取组件类型标签
 */
const getComponentTypeTag = (type: string): "success" | "warning" | "info" | "primary" | "danger" => {
  const typeMap: Record<string, "success" | "warning" | "info" | "primary" | "danger"> = {
    card: "primary",
    gauge: "success",
    line: "info",
    bar: "warning",
    pie: "danger",
    table: "primary",
  };
  return typeMap[type] || "primary";
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    card: "卡片",
    gauge: "仪表盘",
    line: "折线图",
    bar: "柱状图",
    pie: "饼图",
    table: "表格",
  };
  return typeMap[type] || "未知";
};

// 监听组件选择器显示状态
watch(
  () => showComponentSelector.value,
  (show) => {
    if (show) {
      loadMyComponents();
    }
  }
);

// 暴露方法
defineExpose({
  loadComponents,
  saveConfigToServer,
  handleManualQuery,
  executeUnifiedQuery,
});
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    @include gradient-bg;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.server-component-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: $spacing-md;
  border-radius: $radius-lg;

  &:deep(.vue-grid-layout) {
    flex: 1;
    overflow: auto;
    padding: $spacing-sm;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.02);
    transition: all $duration-normal $ease-standard;
  }

  .layout-header {
    padding: $spacing-md $spacing-lg;
    display: flex;
    justify-content: space-between;
    align-items: center;
    @include glass-effect(0.95, 16px);
    border-bottom: 1px solid $border-light;
    border-radius: $radius-md $radius-md 0 0;
    z-index: 10;
    min-height: 60px;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-sm;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: $gradient-line-top;
    }

    .layout-actions-left {
      display: flex;
      gap: $spacing-sm;
      flex-shrink: 0;

      .el-button {
        border-radius: $radius-sm;
        padding: $button-padding-md;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: $shadow-md;
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      }
    }

    .layout-actions-right {
      display: flex;
      gap: $spacing-sm;

      .el-button {
        border-radius: $radius-sm;
        padding: $button-padding-md;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: $shadow-md;
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      }
    }
  }

  .grid-item-content {
    height: 100%;
    position: relative;
    @include glass-effect(0.9, 12px);
    border-radius: $radius-md;
    border: 1px solid $border-light;
    overflow: hidden;
    transition: all $duration-normal $ease-standard;
    box-shadow: $shadow-sm;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: $gradient-line-top;
      opacity: 0;
      transition: opacity $duration-normal ease;
      z-index: 1;
    }

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: $shadow-md;
      transform: translateY(-2px);

      &::before {
        opacity: 1;
      }
    }

    .grid-item-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity $duration-fast $ease-standard;
      z-index: 10;
      border-radius: $radius-md;

      &:hover {
        opacity: 1;
      }

      .grid-item-actions {
        display: flex;
        gap: $spacing-sm;

        .el-button {
          border-radius: 50%;
          transition: all $duration-fast $ease-standard;
          box-shadow: $shadow-md;

          &:hover {
            transform: scale(1.1);
            box-shadow: $shadow-lg;
          }

          &:active {
            transform: scale(0.95);
          }
        }
      }
    }
  }

  .empty-layout {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-3xl;
    border-radius: $radius-md;
    @include glass-effect(0.9, 16px);
    border: 2px dashed $border-light;

    :deep(.el-empty) {
      .el-empty__description {
        color: var(--el-text-color-placeholder);
        font-size: $font-md;
      }

      .el-button {
        border-radius: $radius-sm;
        padding: $button-padding-md;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: $shadow-md;
        }
      }
    }
  }
}

.add-component-form {
  padding: $spacing-md 0;

  .expression-examples {
    margin-top: $spacing-sm;

    .examples-header {
      font-size: $font-sm;
      color: var(--el-text-color-regular);
      margin-bottom: $spacing-sm;
      font-weight: $font-weight-medium;
    }

    .examples-list {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-sm;

      .example-tag {
        cursor: pointer;
        transition: all $duration-fast $ease-standard;
        border-radius: $radius-sm;

        &:hover {
          transform: translateY(-1px);
          box-shadow: $shadow-md;
          border-color: var(--el-color-primary);
        }
      }
    }
  }

  .form-help {
    margin-left: $spacing-sm;
    font-size: $font-sm;
    color: var(--el-text-color-regular);
  }

  .drawer-footer {
    margin-top: $spacing-xl;
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;

    .el-button {
      border-radius: $radius-sm;
      padding: $button-padding-md;
      transition: all $duration-fast $ease-standard;
      font-weight: $font-weight-medium;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: $shadow-md;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }
  }
}

.component-selector {
  .component-cards {
    min-height: 300px;
    padding: $spacing-md 0;
  }

  .component-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: $spacing-lg;
    padding: $spacing-md 0;
  }

  .component-card {
    border: 1px solid $border-light;
    border-radius: $radius-md;
    padding: $spacing-lg;
    cursor: pointer;
    transition: all $duration-normal $ease-standard;
    @include glass-effect(0.9, 12px);
    box-shadow: $shadow-sm;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: $gradient-line-top;
      opacity: 0;
      transition: opacity $duration-normal ease;
    }

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: $shadow-md;
      transform: translateY(-2px);

      &::before {
        opacity: 1;
      }
    }

    &.component-card-selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      box-shadow: $shadow-md;

      &::before {
        opacity: 1;
      }
    }

    .component-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;

      .component-card-title {
        font-weight: $font-weight-semibold;
        color: var(--el-text-color-primary);
        font-size: $font-md;
      }
    }

    .component-card-content {
      .component-expression {
        font-size: $font-sm;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-light);
        padding: $spacing-sm;
        border-radius: $radius-sm;
        font-family: monospace;
        word-break: break-all;
        border: 1px solid $border-light;
      }
    }
  }

  .selector-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg 0;
    border-top: 1px solid $border-light;
    margin-top: $spacing-lg;

    .selected-info {
      font-size: $font-md;
      color: var(--el-text-color-regular);
      font-weight: $font-weight-medium;
      padding: $spacing-xs $spacing-sm;
      background: var(--el-color-primary-light-9);
      border-radius: $radius-sm;
      border: 1px solid var(--el-color-primary-light-7);
    }

    .selector-actions {
      display: flex;
      gap: $spacing-md;

      .el-button {
        border-radius: $radius-sm;
        padding: $button-padding-md;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: $shadow-md;
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      }
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

// 响应式设计
@include respond-to(lg) {
  .server-component-layout {
    padding: $spacing-sm;

    .layout-header {
      flex-direction: column;
      gap: $spacing-sm;
      align-items: stretch;

      .layout-actions-left,
      .layout-actions-right {
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    .component-selector .component-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: $spacing-md;
    }
  }
}

@include respond-to(sm) {
  .server-component-layout {
    padding: $spacing-xs;

    .layout-header {
      padding: $spacing-sm;
      flex-direction: column;
      gap: $spacing-xs;

      .layout-actions-left,
      .layout-actions-right {
        width: 100%;
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }

    .component-selector {
      .component-grid {
        grid-template-columns: 1fr;
        gap: $spacing-sm;
      }

      .selector-footer {
        flex-direction: column;
        gap: $spacing-sm;
        align-items: stretch;

        .selector-actions {
          width: 100%;
          flex-direction: column;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}

</style>
