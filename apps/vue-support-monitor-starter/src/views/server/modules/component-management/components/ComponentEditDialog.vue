<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑组件' : '添加组件'"
    width="600px"
    :before-close="handleClose"
  >
    <ScForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <ScFormItem label="组件名称" prop="monitorSysGenServerComponentName">
        <ScInput
          v-model="formData.monitorSysGenServerComponentName"
          placeholder="请输入组件名称"
        />
      </ScFormItem>

      <ScFormItem label="组件类型" prop="monitorSysGenServerComponentType">
        <ScSelect
          v-model="formData.monitorSysGenServerComponentType"
          placeholder="请选择组件类型"
          style="width: 100%"
        >
          <ScOption label="卡片" value="card" />
          <ScOption label="仪表盘" value="gauge" />
          <ScOption label="折线图" value="line" />
          <ScOption label="柱状图" value="bar" />
          <ScOption label="饼图" value="pie" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem
        label="表达式类型"
        prop="monitorSysGenServerComponentExpressionType"
      >
        <ScSelect
          v-model="formData.monitorSysGenServerComponentExpressionType"
          placeholder="请选择表达式类型"
          style="width: 100%"
        >
          <ScOption label="Prometheus PromQL" value="PROMETHEUS" />
          <ScOption label="SQL查询" value="SQL" />
          <ScOption label="组件选择" value="COMPONENT" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem
        label="表达式"
        prop="monitorSysGenServerComponentExpression"
      >
        <ScInput
          v-model="formData.monitorSysGenServerComponentExpression"
          type="textarea"
          :rows="4"
          placeholder="请输入表达式"
        />
      </ScFormItem>

      <ScFormItem label="单位">
        <ScInput
          v-model="formData.monitorSysGenServerComponentUnit"
          placeholder="请输入单位，如：%、MB、个等"
        />
      </ScFormItem>

      <ScFormItem label="描述">
        <ScInput
          v-model="formData.monitorSysGenServerComponentDescription"
          type="textarea"
          :rows="2"
          placeholder="请输入组件描述"
        />
      </ScFormItem>

      <ScFormItem label="启用状态">
        <ScSwitch
          v-model="formData.monitorSysGenServerComponentEnabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </ScFormItem>
    </ScForm>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? "更新" : "创建" }}
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { type FormInstance, type FormRules } from "element-plus";
import {
  createServerComponent,
  updateServerComponent,
  type ServerComponent,
} from "@/api/server";
import {
  convertFormDataToApiData,
  convertApiDataToFormData,
  validateComponentData,
  type ComponentFormData,
} from "@/utils/component-field-mapping";

// 定义属性
const props = defineProps<{
  modelValue: boolean;
  component?: ServerComponent;
  serverId?: number;
}>();

// 定义事件
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

// 响应式数据
const dialogVisible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const formData = ref<ComponentFormData>({
  monitorSysGenServerId: 0,
  monitorSysGenServerComponentName: "",
  monitorSysGenServerComponentType: "card",
  monitorSysGenServerComponentExpressionType: "PROMETHEUS",
  monitorSysGenServerComponentExpression: "",
  monitorSysGenServerComponentUnit: "",
  monitorSysGenServerComponentDescription: "",
  monitorSysGenServerComponentEnabled: true,
});

// 表单验证规则
const formRules: FormRules = {
  monitorSysGenServerComponentName: [
    { required: true, message: "请输入组件名称", trigger: "blur" },
  ],
  monitorSysGenServerComponentType: [
    { required: true, message: "请选择组件类型", trigger: "change" },
  ],
  monitorSysGenServerComponentExpressionType: [
    { required: true, message: "请选择表达式类型", trigger: "change" },
  ],
  monitorSysGenServerComponentExpression: [
    { required: true, message: "请输入表达式", trigger: "blur" },
  ],
};

// 计算属性
const isEdit = computed(
  () => !!props.component?.monitorSysGenServerComponentId,
);

// 监听对话框显示状态
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val;
    if (val) {
      initForm();
    }
  },
);

watch(dialogVisible, (val) => {
  emit("update:modelValue", val);
});

/**
 * 初始化表单
 */
const initForm = () => {
  if (props.component) {
    // 编辑模式，使用工具函数转换数据
    formData.value = convertApiDataToFormData(props.component);
  } else {
    // 新增模式，重置表单
    formData.value = {
      monitorSysGenServerId: props.serverId || 0,
      monitorSysGenServerComponentName: "",
      monitorSysGenServerComponentType: "card",
      monitorSysGenServerComponentExpressionType: "PROMETHEUS",
      monitorSysGenServerComponentExpression: "",
      monitorSysGenServerComponentUnit: "",
      monitorSysGenServerComponentDescription: "",
      monitorSysGenServerComponentEnabled: true,
    };
  }

  // 清除验证状态
  formRef.value?.clearValidate();
};

/**
 * 处理提交
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    // 确保服务器ID正确设置
    formData.value.monitorSysGenServerId =
      props.serverId || formData.value.monitorSysGenServerId;

    // 使用工具函数验证数据
    const validation = validateComponentData(formData.value);
    if (!validation.isValid) {
      message(validation.errors.join(", ", { type: "error" }));
      return;
    }

    loading.value = true;

    // 使用工具函数转换数据
    const submitData = convertFormDataToApiData(formData.value);

    if (isEdit.value) {
      // 更新组件
      const res = await updateServerComponent(
        formData.value.monitorSysGenServerComponentId!,
        submitData,
      );

      if (res.code === "00000") {
        message("更新成功", { type: "success" });
        emit("success");
        handleClose();
      } else {
        message(res.msg || "更新失败", { type: "error" });
      }
    } else {
      // 创建组件
      const res = await createServerComponent(submitData);

      if (res.code === "00000") {
        message("创建成功", { type: "success" });
        emit("success");
        handleClose();
      } else {
        message(res.msg || "创建失败", { type: "error" });
      }
    }
  } catch (error) {
    console.error("提交失败:", error);
    message("操作失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  dialogVisible.value = false;
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
