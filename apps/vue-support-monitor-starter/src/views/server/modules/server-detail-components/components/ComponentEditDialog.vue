<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '创建组件' : '编辑组件'"
    width="1200px"
    :close-on-click-modal="false"
    destroy-on-close
    class="component-edit-dialog"
    align-center
    top="5vh"
  >
    <!-- 自定义头部 -->
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-left">
          <IconifyIconOnline :icon="mode === 'create' ? 'ri:add-circle-line' : 'ri:edit-line'" class="header-icon" />
          <span :id="titleId" :class="titleClass" class="dialog-title">
            {{ mode === 'create' ? '创建组件' : '编辑组件' }}
          </span>
        </div>
        <div class="header-right">
          <el-tag v-if="serverReportType === 'prometheus'" type="success" size="small">
            <IconifyIconOnline icon="logos:prometheus" class="mr-1" />
            Prometheus
          </el-tag>
          <el-tag v-else type="primary" size="small">
            <IconifyIconOnline icon="ri:server-line" class="mr-1" />
            本地监控
          </el-tag>
        </div>
      </div>
    </template>

    <div class="dialog-content">
      <!-- 左侧：表单配置 -->
      <div class="form-section">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
          v-loading="loading"
          class="component-form"
        >
          <!-- 基本信息区域 -->
          <div class="form-group">
            <div class="group-header">
              <IconifyIconOnline icon="ri:information-line" class="group-icon" />
              <span class="group-title">基本信息</span>
            </div>
            <div class="group-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="组件名称" prop="monitorSysGenServerComponentName">
                    <el-input
                      v-model="formData.monitorSysGenServerComponentName"
                      placeholder="请输入组件名称"
                      clearable
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:file-text-line" />
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="组件描述" prop="monitorSysGenServerComponentDescription">
                    <el-input
                      v-model="formData.monitorSysGenServerComponentDescription"
                      placeholder="请输入组件描述"
                      clearable
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:bookmark-line" />
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="组件类型" prop="monitorSysGenServerComponentType">
                    <el-select
                      v-model="formData.monitorSysGenServerComponentType"
                      placeholder="请选择组件类型"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="option in componentTypeOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      >
                        <div class="option-item">
                          <IconifyIconOnline :icon="getComponentTypeIcon(option.value)" class="option-icon" />
                          <span>{{ option.label }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="表达式类型" prop="monitorSysGenServerComponentExpressionType">
                    <el-select
                      v-model="formData.monitorSysGenServerComponentExpressionType"
                      placeholder="请选择表达式类型"
                      style="width: 100%"
                      :disabled="serverReportType !== 'prometheus'"
                    >
                      <el-option
                        v-for="option in expressionTypeOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 表达式配置区域 -->
          <div class="form-group">
            <div class="group-header">
              <IconifyIconOnline icon="ri:code-line" class="group-icon" />
              <span class="group-title">{{ serverReportType === 'prometheus' ? '查询表达式' : '组件选择' }}</span>
            </div>
            <div class="group-content">
              <el-form-item prop="monitorSysGenServerComponentExpression">
                <!-- Prometheus 表达式输入 -->
                <template v-if="serverReportType === 'prometheus'">
                  <div class="expression-editor">
                    <el-input
                      v-model="formData.monitorSysGenServerComponentExpression"
                      type="textarea"
                      :rows="6"
                      placeholder="请输入 PromQL 查询表达式，例如：up{job=&quot;node&quot;}"
                      class="expression-input"
                    />
                    <div class="expression-examples">
                      <div class="examples-header">
                        <span>常用表达式示例：</span>
                      </div>
                      <div class="examples-list">
                        <el-tag
                          v-for="example in prometheusExamples"
                          :key="example.value"
                          size="small"
                          class="example-tag"
                          @click="handleExampleClick(example.value)"
                        >
                          {{ example.label }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 固定组件选择 -->
                <template v-else>
                  <el-select
                    v-model="formData.monitorSysGenServerComponentExpression"
                    placeholder="请选择监控组件"
                    style="width: 100%"
                    filterable
                  >
                    <el-option
                      v-for="option in componentOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    >
                      <div class="option-item">
                        <IconifyIconOnline :icon="getComponentIcon(option.value)" class="option-icon" />
                        <span>{{ option.label }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </template>

                <div class="form-actions">
                  <el-button type="primary" text @click="handleExpressionHelp">
                    <IconifyIconOnline icon="ri:question-line" class="mr-1" />
                    {{ serverReportType === 'prometheus' ? '表达式帮助' : '选择组件' }}
                  </el-button>
                  <el-button type="success" text @click="handleValidateExpression" v-if="serverReportType === 'prometheus'">
                    <IconifyIconOnline icon="ri:check-line" class="mr-1" />
                    验证表达式
                  </el-button>
                  <el-button type="info" text @click="handlePreview">
                    <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                    预览效果
                  </el-button>
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 高级配置区域 -->
          <div class="form-group">
            <div class="group-header">
              <IconifyIconOnline icon="ri:settings-3-line" class="group-icon" />
              <span class="group-title">高级配置</span>
            </div>
            <div class="group-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="刷新间隔(秒)" prop="monitorSysGenServerComponentRefreshInterval">
                    <el-input-number
                      v-model="formData.monitorSysGenServerComponentRefreshInterval"
                      :min="5"
                      :max="3600"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="排序序号" prop="monitorSysGenServerComponentSort">
                    <el-input-number
                      v-model="formData.monitorSysGenServerComponentSort"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 组件描述已在上面处理，这里移除重复 -->

              <el-form-item label="图表配置">
                <el-input
                  v-model="formData.monitorSysGenServerComponentConfig"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入图表配置JSON（可选）"
                />
                <div class="form-help">
                  <span class="help-text">JSON格式的图表配置，用于自定义图表样式和行为</span>
                </div>
              </el-form-item>
            </div>
          </div>
        </el-form>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="preview-section">
        <div class="preview-header">
          <IconifyIconOnline icon="ri:eye-line" class="preview-icon" />
          <span class="preview-title">实时预览</span>
          <el-button size="small" @click="handleRefreshPreview" :loading="previewLoading">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </div>
        <div class="preview-content" v-loading="previewLoading">
          <div class="preview-wrapper">
            <component
              :is="getPreviewComponent(formData.monitorSysGenServerComponentType)"
              :component-data="formData"
              :server-id="serverId"
              :preview-mode="true"
              :chart-data="previewData"
              :height="300"
              class="preview-component"
            />
          </div>
        </div>

        <!-- 预览配置信息 -->
        <div class="preview-info">
          <el-collapse v-model="activePreviewCollapse" size="small">
            <el-collapse-item title="组件信息" name="info">
              <div class="info-item">
                <span class="info-label">组件类型：</span>
                <span class="info-value">{{ getComponentTypeName(formData.monitorSysGenServerComponentType) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">表达式类型：</span>
                <span class="info-value">{{ formData.monitorSysGenServerComponentExpressionType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">刷新间隔：</span>
                <span class="info-value">{{ formData.monitorSysGenServerComponentRefreshInterval }}秒</span>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handlePreview" :loading="loading">
          <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
          预览
        </el-button>
        <el-button type="success" @click="handleSave" :loading="loading">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存
        </el-button>
      </div>
    </template>

    <!-- 表达式帮助对话框 -->
    <ExpressionHelpDialog
      ref="expressionHelpDialogRef"
      :server-id="serverId"
      @expression-selected="handleExpressionSelected"
    />

    <!-- 组件预览对话框 -->
    <ComponentPreviewDialog
      ref="componentPreviewDialogRef"
      :server-id="serverId"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed } from "vue";
import { message } from "@repo/utils";
import {
  createServerDetailComponent,
  updateServerDetailComponent,
  validateComponentExpressionDetail,
  getServerInfo,
  type ServerDetailComponent
} from "@/api/server";

// 导入子组件
import ExpressionHelpDialog from "./ExpressionHelpDialog.vue";
import ComponentPreviewDialog from "./ComponentPreviewDialog.vue";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 定义事件
const emit = defineEmits<{
  saved: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const mode = ref<"create" | "edit">("create");
const serverReportType = ref("prometheus"); // 服务器上报类型
const previewLoading = ref(false);
const previewData = ref<any>(null);
const activePreviewCollapse = ref(['info']);

// 选项数据
const componentTypeOptions = [
  { label: "卡片", value: "card" },
  { label: "仪表盘", value: "gauge" },
  { label: "折线图", value: "line" },
  { label: "柱状图", value: "bar" },
  { label: "饼图", value: "pie" },
  { label: "表格", value: "table" }
];

const expressionTypeOptions = computed(() => {
  if (serverReportType.value === 'prometheus') {
    return [{ label: "Prometheus PromQL", value: "PROMETHEUS" }];
  } else {
    return [{ label: "固定组件", value: "COMPONENT" }];
  }
});

const componentOptions = [
  { label: "CPU使用率", value: "cpu_usage" },
  { label: "内存使用率", value: "memory_usage" },
  { label: "磁盘使用率", value: "disk_usage" },
  { label: "网络IO", value: "network_io" },
  { label: "磁盘列表", value: "disk_list" },
  { label: "磁盘IO统计", value: "disk_io" },
  { label: "磁盘空间使用", value: "disk_space" },
  { label: "进程列表", value: "process_list" },
  { label: "进程数量统计", value: "process_count" },
  { label: "资源占用TOP进程", value: "top_processes" },
  { label: "系统基本信息", value: "system_info" },
  { label: "系统运行时间", value: "uptime" },
  { label: "系统负载", value: "load_average" }
];

// Prometheus 示例表达式
const prometheusExamples = [
  { label: "CPU使用率", value: "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)" },
  { label: "内存使用率", value: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100" },
  { label: "磁盘使用率", value: "100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes)" },
  { label: "网络接收", value: "irate(node_network_receive_bytes_total[5m])" },
  { label: "网络发送", value: "irate(node_network_transmit_bytes_total[5m])" },
  { label: "系统负载", value: "node_load1" },
  { label: "服务状态", value: "up" }
];

// 表单引用
const formRef = ref();
const expressionHelpDialogRef = ref();
const componentPreviewDialogRef = ref();

// 表单数据
const formData = reactive<Partial<ServerDetailComponent>>({
  monitorSysGenServerId: props.serverId,
  monitorSysGenServerComponentName: "",
  monitorSysGenServerComponentType: "card",
  monitorSysGenServerComponentExpressionType: "PROMETHEUS",
  monitorSysGenServerComponentExpression: "",
  monitorSysGenServerComponentRefreshInterval: 30,
  monitorSysGenServerComponentSort: 0,
  monitorSysGenServerComponentStatus: 1,
  monitorSysGenServerComponentDescription: "",
  monitorSysGenServerComponentConfig: "",
  monitorSysGenServerComponentPosition: JSON.stringify({ x: 0, y: 0, w: 6, h: 6 })
});

// 表单验证规则
const rules = {
  monitorSysGenServerComponentName: [
    { required: true, message: "请输入组件名称", trigger: "blur" }
  ],
  monitorSysGenServerComponentDescription: [
    { required: false, message: "请输入组件描述", trigger: "blur" }
  ],
  monitorSysGenServerComponentType: [
    { required: true, message: "请选择组件类型", trigger: "change" }
  ],
  monitorSysGenServerComponentExpressionType: [
    { required: true, message: "请选择表达式类型", trigger: "change" }
  ],
  monitorSysGenServerComponentExpression: [
    { required: true, message: "请输入查询表达式", trigger: "blur" }
  ]
};

/**
 * 打开对话框
 */
const open = (editMode: "create" | "edit" = "create", data?: ServerDetailComponent) => {
  mode.value = editMode;
  visible.value = true;

  if (editMode === "edit" && data) {
    // 编辑模式，填充数据
    Object.assign(formData, data);
  } else {
    // 创建模式，重置表单
    resetForm();
  }

  // 获取服务器信息以确定上报类型
  loadServerInfo();

  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

/**
 * 加载服务器信息
 */
const loadServerInfo = async () => {
  try {
    const res = await getServerInfo(String(props.serverId));
    if (res.code === "00000" && res.data) {
      // 根据服务器的监控配置确定上报类型
      // 这里需要根据实际的服务器数据结构调整
      const serverData = res.data as any;
      // 检查服务器是否配置了 prometheus 上报方式
      if (serverData.reportMethod === "prometheus" ||
          serverData.dataReportMethod === "prometheus" ||
          serverData.monitorSysGenServerSettingDataReportMethod === "prometheus") {
        serverReportType.value = "prometheus";
        formData.monitorSysGenServerComponentExpressionType = "PROMETHEUS";
      } else {
        serverReportType.value = "local"; // 或其他类型
        formData.monitorSysGenServerComponentExpressionType = "COMPONENT";
      }
    }
  } catch (error) {
    console.error("加载服务器信息失败:", error);
    // 默认为非prometheus类型
    serverReportType.value = "local";
    formData.monitorSysGenServerComponentExpressionType = "COMPONENT";
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerId: props.serverId,
    monitorSysGenServerComponentName: "",
    monitorSysGenServerComponentType: "card",
    monitorSysGenServerComponentExpressionType: serverReportType.value === "prometheus" ? "PROMETHEUS" : "COMPONENT",
    monitorSysGenServerComponentExpression: "",
    monitorSysGenServerComponentRefreshInterval: 30,
    monitorSysGenServerComponentSort: 0,
    monitorSysGenServerComponentStatus: 1,
    monitorSysGenServerComponentDescription: "",
    monitorSysGenServerComponentConfig: "",
    monitorSysGenServerComponentPosition: JSON.stringify({ x: 0, y: 0, w: 6, h: 6 })
  });
};

/**
 * 取消
 */
const handleCancel = () => {
  visible.value = false;
};

/**
 * 保存
 */
const handleSave = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    let res;
    if (mode.value === "create") {
      res = await createServerDetailComponent(formData as ServerDetailComponent);
    } else {
      res = await updateServerDetailComponent(formData as ServerDetailComponent);
    }

    if (res.code === "00000") {
      message.success(mode.value === "create" ? "创建成功" : "更新成功");
      visible.value = false;
      emit("saved");
    } else {
      message.error(res.msg || "操作失败");
    }
  } catch (error) {
    console.error("保存组件失败:", error);
    message.error("操作失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 预览
 */
const handlePreview = async () => {
  try {
    await formRef.value?.validate();
    componentPreviewDialogRef.value?.open(formData);
  } catch (error) {
    console.error("预览失败:", error);
  }
};

/**
 * 表达式帮助
 */
const handleExpressionHelp = () => {
  expressionHelpDialogRef.value?.open(
    formData.monitorSysGenServerComponentExpressionType,
    serverReportType.value
  );
};

/**
 * 验证表达式
 */
const handleValidateExpression = async () => {
  if (!formData.monitorSysGenServerComponentExpression) {
    message.warning("请先输入表达式");
    return;
  }

  try {
    loading.value = true;
    const res = await validateComponentExpressionDetail(
      formData.monitorSysGenServerComponentExpressionType!,
      formData.monitorSysGenServerComponentExpression,
      props.serverId
    );

    if (res.code === "00000") {
      message.success("表达式验证通过");
    } else {
      message.error(res.msg || "表达式验证失败");
    }
  } catch (error) {
    console.error("验证表达式失败:", error);
    message.error("验证失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 表达式选择
 */
const handleExpressionSelected = (expression: string) => {
  formData.monitorSysGenServerComponentExpression = expression;
};

/**
 * 获取组件类型图标
 */
const getComponentTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    card: 'ri:file-text-line',
    gauge: 'ri:dashboard-line',
    line: 'ri:line-chart-line',
    bar: 'ri:bar-chart-line',
    pie: 'ri:pie-chart-line',
    table: 'ri:table-line'
  };
  return iconMap[type] || 'ri:file-text-line';
};

/**
 * 获取组件图标
 */
const getComponentIcon = (value: string) => {
  const iconMap: Record<string, string> = {
    cpu_usage: 'ri:cpu-line',
    memory_usage: 'ri:database-line',
    disk_usage: 'ri:hard-drive-line',
    network_io: 'ri:wifi-line',
    disk_list: 'ri:folder-line',
    disk_io: 'ri:exchange-line',
    disk_space: 'ri:pie-chart-line',
    process_list: 'ri:list-check',
    process_count: 'ri:numbers-line',
    top_processes: 'ri:trophy-line',
    system_info: 'ri:information-line',
    uptime: 'ri:time-line',
    load_average: 'ri:speed-line'
  };
  return iconMap[value] || 'ri:file-text-line';
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type?: string) => {
  const typeMap: Record<string, string> = {
    card: '卡片',
    gauge: '仪表盘',
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    table: '表格'
  };
  return typeMap[type || 'card'] || '未知';
};

/**
 * 示例点击处理
 */
const handleExampleClick = (value: string) => {
  formData.monitorSysGenServerComponentExpression = value;
};

/**
 * 获取预览组件
 */
const getPreviewComponent = (type?: string) => {
  // 这里应该导入实际的预览组件
  return 'div'; // 临时返回
};

/**
 * 刷新预览
 */
const handleRefreshPreview = () => {
  previewLoading.value = true;
  // 生成模拟预览数据
  setTimeout(() => {
    previewData.value = generateMockPreviewData();
    previewLoading.value = false;
  }, 1000);
};

/**
 * 生成模拟预览数据
 */
const generateMockPreviewData = () => {
  const type = formData.monitorSysGenServerComponentType;
  switch (type) {
    case 'card':
      return { value: Math.floor(Math.random() * 100), unit: '%' };
    case 'gauge':
      return { value: Math.floor(Math.random() * 100), max: 100 };
    default:
      return null;
  }
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.component-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    max-height: 95vh;
    height: 95vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(20px);
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
    backdrop-filter: blur(12px);
    height: 60px;
    display: flex;
    align-items: center;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    padding: 0;
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid rgba(226, 232, 240, 0.6);
    background: rgba(248, 250, 252, 0.8);
    backdrop-filter: blur(8px);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 20px;
      color: var(--el-color-primary);
    }

    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.dialog-content {
  display: flex;
  height: 100%;
  overflow: hidden;

  .form-section {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    border-right: 1px solid rgba(226, 232, 240, 0.6);

    .component-form {
      .form-group {
        margin-bottom: 32px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        .group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);

          .group-icon {
            font-size: 16px;
            color: var(--el-color-primary);
          }

          .group-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .group-content {
          padding: 20px;
        }
      }
    }
  }

  .preview-section {
    width: 400px;
    display: flex;
    flex-direction: column;
    background: rgba(248, 250, 252, 0.8);
    backdrop-filter: blur(8px);

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.6);
      background: rgba(255, 255, 255, 0.9);

      .preview-icon {
        font-size: 16px;
        color: var(--el-color-primary);
        margin-right: 8px;
      }

      .preview-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        flex: 1;
      }
    }

    .preview-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;

      .preview-wrapper {
        height: 300px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;

        .preview-component {
          width: 100%;
          height: 100%;
        }
      }
    }

    .preview-info {
      padding: 16px 20px;
      border-top: 1px solid rgba(226, 232, 240, 0.6);

      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;

        .info-label {
          color: var(--el-text-color-regular);
        }

        .info-value {
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }
    }
  }
}

.expression-editor {
  .expression-input {
    margin-bottom: 16px;
  }

  .expression-examples {
    .examples-header {
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--el-text-color-regular);
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
}

.form-actions {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .option-icon {
    font-size: 14px;
    color: var(--el-color-primary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-help {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  align-items: center;

  .help-text {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
