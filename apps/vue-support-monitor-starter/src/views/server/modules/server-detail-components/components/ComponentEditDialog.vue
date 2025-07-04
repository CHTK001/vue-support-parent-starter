<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '创建组件' : '编辑组件'"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      v-loading="loading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="组件名称" prop="monitorSysGenServerDetailComponentName">
            <el-input
              v-model="formData.monitorSysGenServerDetailComponentName"
              placeholder="请输入组件名称"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="组件标题" prop="monitorSysGenServerDetailComponentTitle">
            <el-input
              v-model="formData.monitorSysGenServerDetailComponentTitle"
              placeholder="请输入组件标题"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="组件类型" prop="monitorSysGenServerDetailComponentType">
            <el-select
              v-model="formData.monitorSysGenServerDetailComponentType"
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
        </el-col>
        <el-col :span="12">
          <el-form-item label="表达式类型" prop="monitorSysGenServerDetailComponentExpressionType">
            <el-select
              v-model="formData.monitorSysGenServerDetailComponentExpressionType"
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

      <el-form-item :label="serverReportType === 'prometheus' ? '查询表达式' : '组件选择'" prop="monitorSysGenServerDetailComponentExpression">
        <!-- Prometheus 表达式输入 -->
        <template v-if="serverReportType === 'prometheus'">
          <el-input
            v-model="formData.monitorSysGenServerDetailComponentExpression"
            type="textarea"
            :rows="4"
            placeholder="请输入查询表达式"
          />
        </template>

        <!-- 固定组件选择 -->
        <template v-else>
          <el-select
            v-model="formData.monitorSysGenServerDetailComponentExpression"
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

        <div class="form-help">
          <el-button type="text" @click="handleExpressionHelp">
            <IconifyIconOnline icon="ri:question-line" class="mr-1" />
            {{ serverReportType === 'prometheus' ? '表达式帮助' : '选择组件' }}
          </el-button>
          <el-button type="text" @click="handleValidateExpression" v-if="serverReportType === 'prometheus'">
            <IconifyIconOnline icon="ri:check-line" class="mr-1" />
            验证表达式
          </el-button>
        </div>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="刷新间隔(秒)" prop="monitorSysGenServerDetailComponentRefreshInterval">
            <el-input-number
              v-model="formData.monitorSysGenServerDetailComponentRefreshInterval"
              :min="5"
              :max="3600"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序序号" prop="monitorSysGenServerDetailComponentSortOrder">
            <el-input-number
              v-model="formData.monitorSysGenServerDetailComponentSortOrder"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="组件描述">
        <el-input
          v-model="formData.monitorSysGenServerDetailComponentDesc"
          type="textarea"
          :rows="2"
          placeholder="请输入组件描述（可选）"
        />
      </el-form-item>

      <el-form-item label="图表配置">
        <el-input
          v-model="formData.monitorSysGenServerDetailComponentChartConfig"
          type="textarea"
          :rows="4"
          placeholder="请输入图表配置JSON（可选）"
        />
        <div class="form-help">
          <span class="help-text">JSON格式的图表配置，用于自定义图表样式和行为</span>
        </div>
      </el-form-item>
    </el-form>

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

// 表单引用
const formRef = ref();
const expressionHelpDialogRef = ref();
const componentPreviewDialogRef = ref();

// 表单数据
const formData = reactive<Partial<ServerDetailComponent>>({
  monitorSysGenServerId: props.serverId,
  monitorSysGenServerDetailComponentName: "",
  monitorSysGenServerDetailComponentTitle: "",
  monitorSysGenServerDetailComponentType: "card",
  monitorSysGenServerDetailComponentExpressionType: "PROMETHEUS",
  monitorSysGenServerDetailComponentExpression: "",
  monitorSysGenServerDetailComponentRefreshInterval: 30,
  monitorSysGenServerDetailComponentSortOrder: 0,
  monitorSysGenServerDetailComponentEnabled: 1,
  monitorSysGenServerDetailComponentDesc: "",
  monitorSysGenServerDetailComponentChartConfig: "",
  monitorSysGenServerDetailComponentPosition: JSON.stringify({ x: 0, y: 0, w: 6, h: 6 })
});

// 表单验证规则
const rules = {
  monitorSysGenServerDetailComponentName: [
    { required: true, message: "请输入组件名称", trigger: "blur" }
  ],
  monitorSysGenServerDetailComponentTitle: [
    { required: true, message: "请输入组件标题", trigger: "blur" }
  ],
  monitorSysGenServerDetailComponentType: [
    { required: true, message: "请选择组件类型", trigger: "change" }
  ],
  monitorSysGenServerDetailComponentExpressionType: [
    { required: true, message: "请选择表达式类型", trigger: "change" }
  ],
  monitorSysGenServerDetailComponentExpression: [
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
      const serverData = res.data;
      if (serverData.monitorSysGenServerSettingDataReportMethod === "prometheus") {
        serverReportType.value = "prometheus";
        formData.monitorSysGenServerDetailComponentExpressionType = "PROMETHEUS";
      } else {
        serverReportType.value = "local"; // 或其他类型
        formData.monitorSysGenServerDetailComponentExpressionType = "COMPONENT";
      }
    }
  } catch (error) {
    console.error("加载服务器信息失败:", error);
    // 默认为非prometheus类型
    serverReportType.value = "local";
    formData.monitorSysGenServerDetailComponentExpressionType = "COMPONENT";
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerId: props.serverId,
    monitorSysGenServerDetailComponentName: "",
    monitorSysGenServerDetailComponentTitle: "",
    monitorSysGenServerDetailComponentType: "card",
    monitorSysGenServerDetailComponentExpressionType: serverReportType.value === "prometheus" ? "PROMETHEUS" : "COMPONENT",
    monitorSysGenServerDetailComponentExpression: "",
    monitorSysGenServerDetailComponentRefreshInterval: 30,
    monitorSysGenServerDetailComponentSortOrder: 0,
    monitorSysGenServerDetailComponentEnabled: 1,
    monitorSysGenServerDetailComponentDesc: "",
    monitorSysGenServerDetailComponentChartConfig: "",
    monitorSysGenServerDetailComponentPosition: JSON.stringify({ x: 0, y: 0, w: 6, h: 6 })
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
    formData.monitorSysGenServerDetailComponentExpressionType,
    serverReportType.value
  );
};

/**
 * 验证表达式
 */
const handleValidateExpression = async () => {
  if (!formData.monitorSysGenServerDetailComponentExpression) {
    message.warning("请先输入表达式");
    return;
  }

  try {
    loading.value = true;
    const res = await validateComponentExpressionDetail(
      formData.monitorSysGenServerDetailComponentExpressionType!,
      formData.monitorSysGenServerDetailComponentExpression,
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
  formData.monitorSysGenServerDetailComponentExpression = expression;
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
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
</style>
