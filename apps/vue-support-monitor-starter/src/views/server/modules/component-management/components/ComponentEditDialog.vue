<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑组件' : '添加组件'"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="组件名称" prop="monitorSysGenServerComponentName">
        <el-input
          v-model="formData.monitorSysGenServerComponentName"
          placeholder="请输入组件名称"
        />
      </el-form-item>
      
      <el-form-item label="组件类型" prop="monitorSysGenServerComponentType">
        <el-select
          v-model="formData.monitorSysGenServerComponentType"
          placeholder="请选择组件类型"
          style="width: 100%"
        >
          <el-option label="卡片" value="card" />
          <el-option label="仪表盘" value="gauge" />
          <el-option label="折线图" value="line" />
          <el-option label="柱状图" value="bar" />
          <el-option label="饼图" value="pie" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="表达式类型" prop="monitorSysGenServerComponentExpressionType">
        <el-select
          v-model="formData.monitorSysGenServerComponentExpressionType"
          placeholder="请选择表达式类型"
          style="width: 100%"
        >
          <el-option label="Prometheus PromQL" value="PROMETHEUS" />
          <el-option label="SQL查询" value="SQL" />
          <el-option label="组件选择" value="COMPONENT" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="表达式" prop="monitorSysGenServerComponentExpression">
        <el-input
          v-model="formData.monitorSysGenServerComponentExpression"
          type="textarea"
          :rows="4"
          placeholder="请输入表达式"
        />
      </el-form-item>
      
      <el-form-item label="单位">
        <el-input
          v-model="formData.monitorSysGenServerComponentUnit"
          placeholder="请输入单位，如：%、MB、个等"
        />
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input
          v-model="formData.monitorSysGenServerComponentDescription"
          type="textarea"
          :rows="2"
          placeholder="请输入组件描述"
        />
      </el-form-item>
      
      <el-form-item label="启用状态">
        <el-switch
          v-model="formData.monitorSysGenServerComponentEnabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
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
  type ServerComponent
} from "@/api/server";
import {
  convertFormDataToApiData,
  convertApiDataToFormData,
  validateComponentData,
  type ComponentFormData
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
  monitorSysGenServerComponentName: '',
  monitorSysGenServerComponentType: 'card',
  monitorSysGenServerComponentExpressionType: 'PROMETHEUS',
  monitorSysGenServerComponentExpression: '',
  monitorSysGenServerComponentUnit: '',
  monitorSysGenServerComponentDescription: '',
  monitorSysGenServerComponentEnabled: true
});

// 表单验证规则
const formRules: FormRules = {
  monitorSysGenServerComponentName: [
    { required: true, message: '请输入组件名称', trigger: 'blur' }
  ],
  monitorSysGenServerComponentType: [
    { required: true, message: '请选择组件类型', trigger: 'change' }
  ],
  monitorSysGenServerComponentExpressionType: [
    { required: true, message: '请选择表达式类型', trigger: 'change' }
  ],
  monitorSysGenServerComponentExpression: [
    { required: true, message: '请输入表达式', trigger: 'blur' }
  ]
};

// 计算属性
const isEdit = computed(() => !!props.component?.monitorSysGenServerComponentId);

// 监听对话框显示状态
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
  if (val) {
    initForm();
  }
});

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
      monitorSysGenServerComponentName: '',
      monitorSysGenServerComponentType: 'card',
      monitorSysGenServerComponentExpressionType: 'PROMETHEUS',
      monitorSysGenServerComponentExpression: '',
      monitorSysGenServerComponentUnit: '',
      monitorSysGenServerComponentDescription: '',
      monitorSysGenServerComponentEnabled: true
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
    formData.value.monitorSysGenServerId = props.serverId || formData.value.monitorSysGenServerId;

    // 使用工具函数验证数据
    const validation = validateComponentData(formData.value);
    if (!validation.isValid) {
      message(validation.errors.join(', ', { type: "error" }));
      return;
    }

    loading.value = true;

    // 使用工具函数转换数据
    const submitData = convertFormDataToApiData(formData.value);

    if (isEdit.value) {
      // 更新组件
      const res = await updateServerComponent(
        formData.value.monitorSysGenServerComponentId!,
        submitData
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
