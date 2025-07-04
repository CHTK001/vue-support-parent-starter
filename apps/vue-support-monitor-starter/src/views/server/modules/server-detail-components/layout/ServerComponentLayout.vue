<template>
  <div ref="serverLayoutRef" class="server-component-layout h-full">
    <div class="layout-header">
      <div v-if="editable" class="layout-actions-left">
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
      <div v-if="editable && layoutChanged" class="layout-actions">
        <el-button type="primary" @click="saveConfigToServer">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存布局
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
    <el-drawer v-model="showAddComponentDrawer" title="添加组件" size="600px" direction="rtl">
      <div class="add-component-form">
        <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="120px">
          <el-form-item label="组件名称" prop="title">
            <el-input v-model="addForm.title" placeholder="请输入组件名称" />
          </el-form-item>
          
          <el-form-item label="组件类型" prop="type">
            <el-select
              v-model="addForm.type"
              placeholder="请选择组件类型"
              style="width: 100%"
            >
              <el-option
                v-for="option in componentTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="表达式类型" prop="expressionType">
            <el-select
              v-model="addForm.expressionType"
              placeholder="请选择表达式类型"
              style="width: 100%"
            >
              <el-option
                v-for="option in expressionTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="addForm.expressionType === 'PROMETHEUS' ? 'PromQL表达式' : '组件选择'" prop="expression">
            <!-- Prometheus 表达式输入 -->
            <template v-if="addForm.expressionType === 'PROMETHEUS'">
              <el-input
                v-model="addForm.expression"
                type="textarea"
                :rows="4"
                placeholder="请输入PromQL查询表达式"
              />
              <div class="expression-examples">
                <div class="examples-header">常用表达式示例：</div>
                <div class="examples-list">
                  <el-tag
                    v-for="example in prometheusExamples"
                    :key="example.value"
                    size="small"
                    class="example-tag"
                    @click="addForm.expression = example.value"
                  >
                    {{ example.label }}
                  </el-tag>
                </div>
              </div>
            </template>

            <!-- 固定组件选择 -->
            <template v-else>
              <el-select
                v-model="addForm.expression"
                placeholder="请选择监控组件"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="option in componentOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </template>
          </el-form-item>

          <el-form-item label="刷新间隔" prop="refreshInterval">
            <el-input-number
              v-model="addForm.refreshInterval"
              :min="5"
              :max="3600"
              style="width: 100%"
            />
            <span class="form-help">秒</span>
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
            <el-select
              v-model="addForm.valueUnit"
              placeholder="请选择数值单位"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="option in valueUnitOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
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
    </el-drawer>

    <!-- 组件选择器对话框 -->
    <el-dialog v-model="showComponentSelector" title="选择组件" width="60%" destroy-on-close>
      <div class="component-selector">
        <el-tabs v-model="componentSelectorTab">
          <el-tab-pane label="我的组件" name="my">
            <div class="component-cards">
              <el-empty v-if="myComponents.length === 0" description="暂无可用组件" />
              <div v-else class="component-grid">
                <div 
                  v-for="item in myComponents" 
                  :key="item.monitorSysGenServerDetailComponentId" 
                  class="component-card" 
                  :class="{ 'component-card-selected': selectedComponents.includes(item.monitorSysGenServerDetailComponentId) }" 
                  @click="toggleComponentSelection(item)"
                >
                  <div class="component-card-header">
                    <span class="component-card-title">{{ item.monitorSysGenServerDetailComponentTitle || item.monitorSysGenServerDetailComponentName }}</span>
                    <el-tag size="small" :type="getComponentTypeTag(item.monitorSysGenServerDetailComponentType)">
                      {{ getComponentTypeName(item.monitorSysGenServerDetailComponentType) }}
                    </el-tag>
                  </div>
                  <div class="component-card-content">
                    <div class="component-expression">{{ item.monitorSysGenServerDetailComponentExpression }}</div>
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
                  :key="item.monitorSysGenServerDetailComponentId" 
                  class="component-card" 
                  :class="{ 'component-card-selected': selectedComponents.includes(item.monitorSysGenServerDetailComponentId) }" 
                  @click="toggleComponentSelection(item)"
                >
                  <div class="component-card-header">
                    <span class="component-card-title">{{ item.monitorSysGenServerDetailComponentTitle || item.monitorSysGenServerDetailComponentName }}</span>
                    <el-tag size="small" :type="getComponentTypeTag(item.monitorSysGenServerDetailComponentType)">
                      {{ getComponentTypeName(item.monitorSysGenServerDetailComponentType) }}
                    </el-tag>
                  </div>
                  <div class="component-card-content">
                    <div class="component-expression">{{ item.monitorSysGenServerDetailComponentExpression }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="selector-footer">
          <div class="selected-info">
            已选择 {{ selectedComponents.length }} 个组件
          </div>
          <div class="selector-actions">
            <el-button @click="showComponentSelector = false">取消</el-button>
            <el-button type="primary" @click="addSelectedComponents" :disabled="selectedComponents.length === 0">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加选中组件
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 图表配置对话框 -->
    <ChartConfigDialog
      ref="chartConfigDialogRef"
      @save="handleChartConfigSave"
    />

    <!-- 组件编辑对话框 -->
    <ComponentEditDialog
      ref="componentEditDialogRef"
      :server-id="serverId"
      @saved="handleComponentSaved"
    />
  </div>
</template>

<script setup lang="ts">
import {
  getEnabledServerDetailComponents,
  createServerDetailComponent,
  updateServerDetailComponent,
  deleteServerDetailComponent
} from "@/api/server";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { ElMessage, ElMessageBox } from "element-plus";
import { GridItem, GridLayout } from "grid-layout-plus";
import { defineExpose, defineProps, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ChartConfigDialog from "../components/ChartConfigDialog.vue";
import ComponentEditDialog from "../components/ComponentEditDialog.vue";
import ServerComponent from "./ServerComponent.vue";

const props = defineProps({
  serverId: {
    type: Number,
    required: true
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

// 添加组件相关
const showAddComponentDrawer = ref(false);
const addLoading = ref(false);
const addFormRef = ref();
const addForm = reactive({
  title: "",
  type: "card",
  expressionType: "COMPONENT",
  expression: "",
  refreshInterval: 30,
  w: 6,
  h: 6,
  valueUnit: ""
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
  { label: "表格", value: "table" }
];

// 表达式类型选项
const expressionTypeOptions = [
  { label: "固定组件", value: "COMPONENT" },
  { label: "Prometheus PromQL", value: "PROMETHEUS" }
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
  { label: "系统负载", value: "load_average" }
];

// Prometheus 示例表达式
const prometheusExamples = [
  { label: "CPU使用率", value: "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)" },
  { label: "内存使用率", value: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100" },
  { label: "磁盘使用率", value: "100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes)" },
  { label: "网络接收", value: "irate(node_network_receive_bytes_total[5m])" },
  { label: "系统负载", value: "node_load1" },
  { label: "服务状态", value: "up" }
];

// 数值单位选项
const valueUnitOptions = [
  { label: "百分比", value: "percent" },
  { label: "字节", value: "bytes" },
  { label: "状态", value: "status" },
  { label: "数量", value: "count" },
  { label: "时间", value: "time" }
];

// 表单验证规则
const addFormRules = {
  title: [{ required: true, message: "请输入组件名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择组件类型", trigger: "change" }],
  expressionType: [{ required: true, message: "请选择表达式类型", trigger: "change" }],
  expression: [{ required: true, message: "请输入表达式或选择组件", trigger: "blur" }]
};

// 监听布局变化
watch(() => layout.value, () => {
  layoutChanged.value = true;
}, { deep: true });

// 生命周期
onMounted(() => {
  loadComponents();
});

onBeforeUnmount(() => {
  // 清理定时器
  Object.values(componentTimers.value).forEach((timer: any) => {
    if (timer) clearInterval(timer);
  });
});

/**
 * 加载组件
 */
const loadComponents = async () => {
  if (!props.serverId) return;

  try {
    loading.value = true;
    const res = await getEnabledServerDetailComponents(props.serverId);

    if (res.code === "00000" && res.data) {
      // 转换组件数据为布局格式
      layout.value = res.data.map(component => {
        let position = { x: 0, y: 0, w: 6, h: 6 };
        try {
          if (component.monitorSysGenServerDetailComponentPosition) {
            position = JSON.parse(component.monitorSysGenServerDetailComponentPosition);
          }
        } catch (e) {
          console.warn("解析组件位置失败:", e);
        }

        return {
          i: `component-${component.monitorSysGenServerDetailComponentId}`,
          x: position.x || 0,
          y: position.y || 0,
          w: position.w || 6,
          h: position.h || 6,
          componentId: component.monitorSysGenServerDetailComponentId,
          title: component.monitorSysGenServerDetailComponentTitle,
          type: component.monitorSysGenServerDetailComponentType,
          expressionType: component.monitorSysGenServerDetailComponentExpressionType,
          expression: component.monitorSysGenServerDetailComponentExpression,
          refreshInterval: component.monitorSysGenServerDetailComponentRefreshInterval || 30,
          valueUnit: (component as any).monitorSysGenServerDetailComponentValueUnit,
          chartConfig: component.monitorSysGenServerDetailComponentChartConfig,
          enabled: component.monitorSysGenServerDetailComponentEnabled
        };
      });

      // 加载组件数据
      for (const item of layout.value) {
        await loadComponentData(item);
        setupComponentRefreshTimer(item);
      }
    }
  } catch (error) {
    console.error("加载组件失败:", error);
    ElMessage.error("加载组件失败");
  } finally {
    loading.value = false;
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

    // 批量更新组件位置
    const updates = layout.value.map(item => ({
      monitorSysGenServerDetailComponentId: item.componentId,
      monitorSysGenServerDetailComponentPosition: JSON.stringify({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i
      })
    }));

    // 批量更新组件位置 - 这里需要实现批量更新API
    const updatePromises = updates.map(update =>
      updateServerDetailComponent({
        ...update,
        monitorSysGenServerId: props.serverId,
        monitorSysGenServerDetailComponentName: '',
        monitorSysGenServerDetailComponentTitle: '',
        monitorSysGenServerDetailComponentType: 'card',
        monitorSysGenServerDetailComponentExpressionType: 'COMPONENT',
        monitorSysGenServerDetailComponentExpression: '',
        monitorSysGenServerDetailComponentEnabled: 1
      } as any)
    );

    const results = await Promise.all(updatePromises);
    const res = results[0]; // 使用第一个结果作为响应

    if (res.code === "00000") {
      ElMessage.success("布局保存成功");
      layoutChanged.value = false;
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存布局失败:", error);
    ElMessage.error("保存布局失败");
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
      monitorSysGenServerDetailComponentName: addForm.title,
      monitorSysGenServerDetailComponentTitle: addForm.title,
      monitorSysGenServerDetailComponentType: addForm.type,
      monitorSysGenServerDetailComponentExpressionType: addForm.expressionType,
      monitorSysGenServerDetailComponentExpression: addForm.expression,
      monitorSysGenServerDetailComponentRefreshInterval: addForm.refreshInterval,
      monitorSysGenServerDetailComponentValueUnit: addForm.valueUnit,
      monitorSysGenServerDetailComponentEnabled: 1,
      monitorSysGenServerDetailComponentSortOrder: layout.value.length,
      monitorSysGenServerDetailComponentPosition: JSON.stringify({
        x: 0,
        y: getNextY(),
        w: addForm.w,
        h: addForm.h
      })
    };

    const res = await createServerDetailComponent(componentData);

    if (res.code === "00000") {
      ElMessage.success("组件添加成功");
      showAddComponentDrawer.value = false;
      resetAddForm();
      await loadComponents();
    } else {
      ElMessage.error(res.msg || "添加失败");
    }
  } catch (error) {
    console.error("添加组件失败:", error);
    ElMessage.error("添加组件失败");
  } finally {
    addLoading.value = false;
  }
};

/**
 * 获取下一个Y位置
 */
const getNextY = () => {
  if (layout.value.length === 0) return 0;
  const maxY = Math.max(...layout.value.map(item => item.y + item.h));
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
    refreshInterval: 30,
    w: 6,
    h: 6,
    valueUnit: ""
  });
  addFormRef.value?.clearValidate();
};

/**
 * 编辑组件
 */
const editComponent = (item: any) => {
  componentEditDialogRef.value?.open("edit", {
    monitorSysGenServerDetailComponentId: item.componentId,
    monitorSysGenServerId: props.serverId,
    monitorSysGenServerDetailComponentName: item.title,
    monitorSysGenServerDetailComponentTitle: item.title,
    monitorSysGenServerDetailComponentType: item.type,
    monitorSysGenServerDetailComponentExpressionType: item.expressionType,
    monitorSysGenServerDetailComponentExpression: item.expression,
    monitorSysGenServerDetailComponentRefreshInterval: item.refreshInterval,
    monitorSysGenServerDetailComponentEnabled: item.enabled,
    monitorSysGenServerDetailComponentChartConfig: item.chartConfig,
    monitorSysGenServerDetailComponentPosition: JSON.stringify({
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      i: item.i
    })
  });
};

/**
 * 删除组件
 */
const removeComponent = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除组件 "${item.title}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const res = await deleteServerDetailComponent(item.componentId);

    if (res.code === "00000") {
      ElMessage.success("组件删除成功");
      await loadComponents();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除组件失败:", error);
      ElMessage.error("删除组件失败");
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
      monitorSysGenServerDetailComponentId: item.componentId,
      monitorSysGenServerId: props.serverId,
      monitorSysGenServerDetailComponentName: item.title || '',
      monitorSysGenServerDetailComponentTitle: item.title || '',
      monitorSysGenServerDetailComponentType: item.type || 'card',
      monitorSysGenServerDetailComponentExpressionType: item.expressionType || 'COMPONENT',
      monitorSysGenServerDetailComponentExpression: item.expression || '',
      monitorSysGenServerDetailComponentEnabled: item.enabled || 1,
      monitorSysGenServerDetailComponentChartConfig: JSON.stringify(config)
    } as any);

    if (res.code === "00000") {
      ElMessage.success("图表配置保存成功");
      // 更新本地数据
      const layoutItem = layout.value.find(l => l.componentId === item.componentId);
      if (layoutItem) {
        layoutItem.chartConfig = JSON.stringify(config);
      }
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存图表配置失败:", error);
    ElMessage.error("保存图表配置失败");
  }
};

/**
 * 组件保存成功
 */
const handleComponentSaved = () => {
  loadComponents();
};

/**
 * 加载组件数据
 */
const loadComponentData = async (item: any) => {
  if (!item.expression) return;

  try {
    // 根据表达式类型加载不同的数据
    if (item.expressionType === "PROMETHEUS") {
      // TODO: 实现 Prometheus 数据查询
      componentsData.value[item.i] = generateMockData(item.type);
    } else {
      // TODO: 实现固定组件数据查询
      componentsData.value[item.i] = generateMockData(item.type);
    }
  } catch (error) {
    console.error("加载组件数据失败:", error);
  }
};

/**
 * 设置组件刷新定时器
 */
const setupComponentRefreshTimer = (item: any) => {
  if (item.refreshInterval && item.refreshInterval > 0) {
    const timer = setInterval(() => {
      loadComponentData(item);
    }, item.refreshInterval * 1000);

    componentTimers.value[item.i] = timer;
  }
};

/**
 * 生成模拟数据
 */
const generateMockData = (type: string) => {
  const now = Date.now();

  switch (type) {
    case 'card':
      return {
        value: Math.floor(Math.random() * 100),
        unit: '%',
        updateTime: new Date().toLocaleString()
      };

    case 'gauge':
      return {
        value: Math.floor(Math.random() * 100),
        max: 100,
        unit: '%'
      };

    case 'line':
    case 'bar':
      return {
        labels: Array.from({ length: 10 }, (_, i) =>
          new Date(now - (9 - i) * 60000).toLocaleTimeString()
        ),
        datasets: [{
          label: '示例数据',
          data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
          borderColor: '#409EFF',
          backgroundColor: 'rgba(64, 158, 255, 0.1)'
        }]
      };

    case 'pie':
      return {
        labels: ['已使用', '空闲'],
        datasets: [{
          data: [65, 35],
          backgroundColor: ['#409EFF', '#E6F7FF']
        }]
      };

    case 'table':
      return {
        columns: [
          { prop: 'name', label: '名称' },
          { prop: 'value', label: '值' },
          { prop: 'status', label: '状态' }
        ],
        data: [
          { name: 'CPU', value: '45%', status: '正常' },
          { name: '内存', value: '67%', status: '正常' },
          { name: '磁盘', value: '23%', status: '正常' }
        ]
      };

    default:
      return null;
  }
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
 * 获取组件高度
 */
const getComponentHeight = (item: any) => {
  return item.h * 30 + (item.h - 1) * 10 - 40; // 减去头部高度
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
 * 时间范围变化处理
 */
const handleTimeRangeChange = (item: any, _timeRange: any) => {
  // TODO: 实现时间范围变化逻辑
  loadComponentData(item);
};

/**
 * 加载我的组件
 */
const loadMyComponents = async () => {
  try {
    const res = await getEnabledServerDetailComponents(props.serverId);

    if (res.code === "00000" && res.data) {
      // 过滤掉已经在布局中的组件
      myComponents.value = res.data.filter(component =>
        !layout.value.some(layoutItem => layoutItem.componentId === component.monitorSysGenServerDetailComponentId)
      );
    }
  } catch (error) {
    console.error("加载我的组件失败:", error);
    ElMessage.error("加载我的组件失败");
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
    ElMessage.error("加载共享组件失败");
  }
};

/**
 * 切换组件选择
 */
const toggleComponentSelection = (component: any) => {
  const componentId = component.monitorSysGenServerDetailComponentId;
  const index = selectedComponents.value.indexOf(componentId);

  if (index > -1) {
    selectedComponents.value.splice(index, 1);
  } else {
    selectedComponents.value.push(componentId);
  }
};

/**
 * 添加选中组件
 */
const addSelectedComponents = async () => {
  try {
    loading.value = true;

    const allComponents = [...myComponents.value, ...sharedComponents.value];
    const selectedItems = allComponents.filter(component =>
      selectedComponents.value.includes(component.monitorSysGenServerDetailComponentId)
    );

    // 添加组件到布局
    for (const component of selectedItems) {
      const componentItem = {
        i: `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        x: 0,
        y: getNextY(),
        w: 6,
        h: 6,
        componentId: component.monitorSysGenServerDetailComponentId,
        title: component.monitorSysGenServerDetailComponentTitle || component.monitorSysGenServerDetailComponentName,
        type: component.monitorSysGenServerDetailComponentType,
        expressionType: component.monitorSysGenServerDetailComponentExpressionType,
        expression: component.monitorSysGenServerDetailComponentExpression,
        refreshInterval: component.monitorSysGenServerDetailComponentRefreshInterval || 30,
        chartConfig: component.monitorSysGenServerDetailComponentChartConfig,
        enabled: component.monitorSysGenServerDetailComponentEnabled
      };

      layout.value.push(componentItem);
      await loadComponentData(componentItem);
      setupComponentRefreshTimer(componentItem);
    }

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

/**
 * 获取组件类型标签
 */
const getComponentTypeTag = (type: string): "success" | "warning" | "info" | "primary" | "danger" => {
  const typeMap: Record<string, "success" | "warning" | "info" | "primary" | "danger"> = {
    card: 'primary',
    gauge: 'success',
    line: 'info',
    bar: 'warning',
    pie: 'danger',
    table: 'primary'
  };
  return typeMap[type] || 'primary';
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    card: '卡片',
    gauge: '仪表盘',
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    table: '表格'
  };
  return typeMap[type] || '未知';
};

// 监听组件选择器显示状态
watch(() => showComponentSelector.value, (show) => {
  if (show) {
    loadMyComponents();
  }
});

// 暴露方法
defineExpose({
  loadComponents,
  saveConfigToServer
});
</script>

<style lang="scss" scoped>
.server-component-layout {
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
    position: relative;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;

    .grid-item-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;

      &:hover {
        opacity: 1;
      }

      .grid-item-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .empty-layout {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e0e0e0;
  }
}

.add-component-form {
  .expression-examples {
    margin-top: 8px;

    .examples-header {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin-bottom: 8px;
    }

    .examples-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .example-tag {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  .form-help {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-regular);
  }

  .drawer-footer {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.component-selector {
  .component-cards {
    min-height: 300px;
  }

  .component-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    padding: 16px 0;
  }

  .component-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--el-bg-color);

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.component-card-selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .component-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .component-card-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .component-card-content {
      .component-expression {
        font-size: 12px;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-light);
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        word-break: break-all;
      }
    }
  }

  .selector-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid var(--el-border-color-light);
    margin-top: 16px;

    .selected-info {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .selector-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
