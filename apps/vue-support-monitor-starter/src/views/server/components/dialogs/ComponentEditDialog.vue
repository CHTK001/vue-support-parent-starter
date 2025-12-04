<template>
  <el-dialog v-model="visible" :title="mode === 'add' ? '添加组件' : '编辑组件'" width="800px" :close-on-click-modal="false" destroy-on-close class="component-edit-dialog">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="component-form">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="组件名称" prop="monitorSysGenServerDetailComponentName">
            <el-input v-model="formData.monitorSysGenServerDetailComponentName" placeholder="请输入组件名�? clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="组件标题" prop="monitorSysGenServerDetailComponentTitle">
            <el-input v-model="formData.monitorSysGenServerDetailComponentTitle" placeholder="请输入组件标�? clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="组件类型" prop="monitorSysGenServerDetailComponentType">
            <el-select v-model="formData.monitorSysGenServerDetailComponentType" placeholder="选择组件类型" style="width: 100%" @change="handleComponentTypeChange">
              <el-option label="卡片" value="card" />
              <el-option label="仪表�? value="gauge" />
              <el-option label="折线�? value="line" />
              <el-option label="柱状�? value="bar" />
              <el-option label="饼图" value="pie" />
              <el-option label="表格" value="table" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="表达式类�? prop="monitorSysGenServerDetailComponentExpressionType">
            <el-select v-model="formData.monitorSysGenServerDetailComponentExpressionType" placeholder="选择表达式类�? style="width: 100%" @change="handleExpressionTypeChange">
              <el-option label="Prometheus" value="PROMETHEUS" />
              <el-option label="SQL" value="SQL" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="查询表达�? prop="monitorSysGenServerDetailComponentExpression">
        <el-input v-model="formData.monitorSysGenServerDetailComponentExpression" type="textarea" :rows="4" :placeholder="expressionPlaceholder" show-word-limit maxlength="2000" />
        <div class="expression-help">
          <el-button type="primary" text @click="handleValidateExpression" :loading="validating" size="small">
            <IconifyIconOnline icon="ri:check-line" class="mr-1" />
            验证表达�?
          </el-button>
          <el-button type="info" text @click="showExpressionHelp" size="small">
            <IconifyIconOnline icon="ri:question-line" class="mr-1" />
            语法帮助
          </el-button>
        </div>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="刷新间隔(�?">
            <el-input-number v-model="formData.monitorSysGenServerDetailComponentRefreshInterval" :min="10" :max="3600" placeholder="�? style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="宽度">
            <el-input-number v-model="layoutConfig.w" :min="2" :max="24" placeholder="网格单位" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="高度">
            <el-input-number v-model="layoutConfig.h" :min="2" :max="20" placeholder="网格单位" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="组件描述">
        <el-input v-model="formData.monitorSysGenServerDetailComponentDesc" type="textarea" :rows="2" placeholder="请输入组件描�? maxlength="500" show-word-limit />
      </el-form-item>

      <!-- 图表配置 -->
      <el-form-item label="图表配置" v-if="needChartConfig">
        <el-input v-model="chartConfigStr" type="textarea" :rows="6" placeholder="请输入JSON格式的图表配�? @blur="handleChartConfigChange" />
        <div class="config-help">
          <el-button type="primary" text @click="handleValidateConfig" size="small">
            <IconifyIconOnline icon="ri:check-line" class="mr-1" />
            验证配置
          </el-button>
          <el-button type="info" text @click="showConfigTemplate" size="small">
            <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
            配置模板
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ mode === "add" ? "添加" : "保存" }}
        </el-button>
      </div>
    </template>

    <!-- 表达式帮助对话框 -->
    <ExpressionHelpDialog ref="expressionHelpDialogRef" />

    <!-- 配置模板对话�?-->
    <ConfigTemplateDialog ref="configTemplateDialogRef" @select="handleTemplateSelect" />
  </el-dialog>
</template>

<script setup lang="ts">
import { saveServerDetailComponent, validateComponentExpression, type ServerDetailComponent } from "@/api/server";
import { message } from "@repo/utils";
import { computed, nextTick, reactive, ref } from "vue";

// 导入子组�?
import ConfigTemplateDialog from "./ConfigTemplateDialog.vue";
import ExpressionHelpDialog from "./ExpressionHelpDialog.vue";

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状�?
const visible = ref(false);
const loading = ref(false);
const validating = ref(false);
const mode = ref<"add" | "edit">("add");
const formRef = ref();

// 子组件引�?
const expressionHelpDialogRef = ref();
const configTemplateDialogRef = ref();

// 表单数据
const formData = reactive<Partial<ServerDetailComponent & any>>({
  monitorSysGenServerId: 0,
  monitorSysGenServerDetailComponentName: "",
  monitorSysGenServerDetailComponentTitle: "",
  monitorSysGenServerDetailComponentType: "card",
  monitorSysGenServerDetailComponentExpressionType: "PROMETHEUS",
  monitorSysGenServerDetailComponentExpression: "",
  monitorSysGenServerDetailComponentRefreshInterval: 30,
  monitorSysGenServerDetailComponentDesc: "",
  monitorSysGenServerDetailComponentChartConfig: "",
});

// 布局配置
const layoutConfig = reactive({
  x: 0,
  y: 0,
  w: 6,
  h: 6,
});

// 图表配置字符�?
const chartConfigStr = ref("");

// 表单验证规则
const rules = {
  monitorSysGenServerDetailComponentName: [
    { required: true, message: "请输入组件名�?, trigger: "blur" },
    { min: 2, max: 50, message: "长度�?2 �?50 个字�?, trigger: "blur" },
  ],
  monitorSysGenServerDetailComponentTitle: [{ required: true, message: "请输入组件标�?, trigger: "blur" }],
  monitorSysGenServerDetailComponentType: [{ required: true, message: "请选择组件类型", trigger: "change" }],
  monitorSysGenServerDetailComponentExpressionType: [{ required: true, message: "请选择表达式类�?, trigger: "change" }],
  monitorSysGenServerDetailComponentExpression: [{ required: true, message: "请输入查询表达式", trigger: "blur" }],
};

// 计算属�?
const expressionPlaceholder = computed(() => {
  if (formData.monitorSysGenServerDetailComponentExpressionType === "PROMETHEUS") {
    return "请输入Prometheus PromQL表达式，例如：cpu_usage_percent";
  } else {
    return "请输入SQL查询语句，例如：SELECT cpu_usage FROM metrics WHERE server_id = ?";
  }
});

const needChartConfig = computed(() => {
  return ["gauge", "line", "bar", "pie"].includes(formData.monitorSysGenServerDetailComponentType || "");
});

/**
 * 打开对话�?
 */
const open = (editMode: "add" | "edit" = "add", data?: any) => {
  mode.value = editMode;
  visible.value = true;

  if (editMode === "edit" && data) {
    Object.assign(formData, data);

    // 解析位置信息
    try {
      if (data.monitorSysGenServerDetailComponentPosition) {
        const position = JSON.parse(data.monitorSysGenServerDetailComponentPosition);
        Object.assign(layoutConfig, position);
      }
    } catch (e) {
      console.warn("解析位置信息失败:", e);
    }

    // 设置图表配置
    chartConfigStr.value = data.monitorSysGenServerDetailComponentChartConfig || "";
  } else if (editMode === "add" && data) {
    formData.monitorSysGenServerId = data.serverId;
    resetForm();
  } else {
    resetForm();
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerDetailComponentId: undefined,
    monitorSysGenServerDetailComponentName: "",
    monitorSysGenServerDetailComponentTitle: "",
    monitorSysGenServerDetailComponentType: "card",
    monitorSysGenServerDetailComponentExpressionType: "PROMETHEUS",
    monitorSysGenServerDetailComponentExpression: "",
    monitorSysGenServerDetailComponentRefreshInterval: 30,
    monitorSysGenServerDetailComponentDesc: "",
    monitorSysGenServerDetailComponentChartConfig: "",
  });

  Object.assign(layoutConfig, {
    x: 0,
    y: 0,
    w: 6,
    h: 6,
  });

  chartConfigStr.value = "";

  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

/**
 * 处理组件类型变化
 */
const handleComponentTypeChange = () => {
  // 根据组件类型设置默认尺寸
  const sizeMap = {
    card: { w: 6, h: 4 },
    gauge: { w: 6, h: 6 },
    line: { w: 12, h: 8 },
    bar: { w: 12, h: 8 },
    pie: { w: 8, h: 8 },
    table: { w: 12, h: 10 },
  };

  const defaultSize = sizeMap[formData.monitorSysGenServerDetailComponentType as keyof typeof sizeMap];
  if (defaultSize) {
    Object.assign(layoutConfig, defaultSize);
  }
};

/**
 * 处理表达式类型变�?
 */
const handleExpressionTypeChange = () => {
  formData.monitorSysGenServerDetailComponentExpression = "";
};

/**
 * 验证表达�?
 */
const handleValidateExpression = async () => {
  if (!formData.monitorSysGenServerDetailComponentExpression) {
    message.warning("请先输入表达�?);
    return;
  }

  try {
    validating.value = true;
    const res = await validateComponentExpression(formData.monitorSysGenServerDetailComponentExpressionType!, formData.monitorSysGenServerDetailComponentExpression, formData.monitorSysGenServerId!);

    if (res.code === "00000") {
      message.success(res.data ? "表达式验证通过" : "表达式验证失�?);
    } else {
      message.error(res.msg || "验证失败");
    }
  } catch (error) {
    console.error("验证表达式失�?", error);
    message.error("验证异常");
  } finally {
    validating.value = false;
  }
};

/**
 * 显示表达式帮�?
 */
const showExpressionHelp = () => {
  expressionHelpDialogRef.value?.open(formData.monitorSysGenServerDetailComponentExpressionType);
};

/**
 * 处理图表配置变化
 */
const handleChartConfigChange = () => {
  try {
    if (chartConfigStr.value) {
      JSON.parse(chartConfigStr.value);
      formData.monitorSysGenServerDetailComponentChartConfig = chartConfigStr.value;
    }
  } catch (e) {
    message.warning("图表配置格式不正确，请检查JSON格式");
  }
};

/**
 * 验证配置
 */
const handleValidateConfig = () => {
  try {
    if (chartConfigStr.value) {
      JSON.parse(chartConfigStr.value);
      message.success("配置格式正确");
    } else {
      message.warning("请输入配置内�?);
    }
  } catch (e) {
    message.error("配置格式错误�? + (e as Error).message);
  }
};

/**
 * 显示配置模板
 */
const showConfigTemplate = () => {
  configTemplateDialogRef.value?.open(formData.monitorSysGenServerDetailComponentType);
};

/**
 * 处理模板选择
 */
const handleTemplateSelect = (template: string) => {
  chartConfigStr.value = template;
  handleChartConfigChange();
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    loading.value = true;

    // 设置位置信息
    formData.monitorSysGenServerDetailComponentPosition = JSON.stringify(layoutConfig);

    // 设置图表配置
    if (chartConfigStr.value) {
      formData.monitorSysGenServerDetailComponentChartConfig = chartConfigStr.value;
    }

    const res = await saveServerDetailComponent(formData as ServerDetailComponent);

    if (res.code === "00000") {
      message.success(mode.value === "add" ? "添加成功" : "保存成功");
      visible.value = false;
      emit("success");
    } else {
      message.error(res.msg || "操作失败");
    }
  } catch (error) {
    console.error("保存组件失败:", error);
    if (error !== false) {
      message.error("操作异常，请稍后重试");
    }
  } finally {
    loading.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.component-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.component-form {
  .expression-help,
  .config-help {
    margin-top: 8px;
    display: flex;
    gap: 12px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
