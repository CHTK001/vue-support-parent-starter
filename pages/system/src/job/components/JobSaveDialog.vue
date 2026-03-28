<template>
  <ScDialog
    v-model="visible"
    :title="mode === 'edit' ? '编辑任务' : '新增任务'"
    width="900px"
    @confirm="handleSave"
    @close="handleClose"
  >
    <ScForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ScRow :gutter="20">
        <!-- 基本信息 -->
        <ScCol :span="24">
          <div class="form-section-title">基本信息</div>
        </ScCol>

        <ScCol :span="12">
          <ScFormItem label="任务名称" prop="jobName">
            <ScInput
              v-model="form.jobName"
              placeholder="请输入任务名称"
              clearable
            />
          </ScFormItem>
        </ScCol>

        <ScCol :span="12">
          <ScFormItem label="任务分组" prop="jobGroup">
            <ScDictSelect
              v-model="form.jobGroup"
              dict-code="job_group"
              placeholder="请选择任务分组"
            />
          </ScFormItem>
        </ScCol>

        <!-- Cron表达式 - 复用现有组件 -->
        <ScCol :span="24">
          <ScFormItem label="Cron表达式" prop="cronExpression">
            <ScCron
              v-model="form.cronExpression"
              placeholder="请输入Cron定时规则"
              :shortcuts="cronShortcuts"
            />
          </ScFormItem>
        </ScCol>

        <!-- 执行配置 -->
        <ScCol :span="24">
          <div class="form-section-title">执行配置</div>
        </ScCol>

        <ScCol :span="24">
          <ScFormItem label="执行方式" prop="executeType">
            <ScRadio
              v-model="form.executeType"
              @change="handleExecuteTypeChange"
            >
              <ScRadioButton label="bean">Bean方法</ScRadioButton>
              <ScRadioButton label="groovy">Groovy脚本</ScRadioButton>
              <ScRadioButton label="shell">Shell脚本</ScRadioButton>
              <ScRadioButton label="python">Python脚本</ScRadioButton>
            </ScRadio>
          </ScFormItem>
        </ScCol>

        <template v-if="form.executeType === 'bean'">
          <ScCol :span="12">
            <ScFormItem label="Bean名称" prop="beanName">
              <ScInput
                v-model="form.beanName"
                placeholder="请输入Bean名称"
                clearable
              />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="方法名称" prop="methodName">
              <ScInput
                v-model="form.methodName"
                placeholder="请输入方法名称"
                clearable
              />
            </ScFormItem>
          </ScCol>
        </template>

        <!-- 复用MonacoEditor组件 -->
        <ScCol v-if="form.executeType !== 'bean'" :span="24">
          <ScFormItem label="脚本内容" prop="scriptContent">
            <MonacoEditor
              v-model="form.scriptContent"
              :language="getEditorLanguage()"
              height="300px"
              :options="editorOptions"
            />
          </ScFormItem>
        </ScCol>

        <!-- 任务参数 -->
        <ScCol :span="24">
          <ScFormItem label="任务参数" prop="jobParams">
            <ScInput
              v-model="form.jobParams"
              type="textarea"
              :rows="3"
              placeholder='JSON格式参数，例如：{"key": "value"}'
            />
          </ScFormItem>
        </ScCol>

        <!-- 高级配置 -->
        <ScCol :span="24">
          <div class="form-section-title">高级配置</div>
        </ScCol>

        <ScCol :span="12">
          <ScFormItem label="失效策略" prop="misfirePolicy">
            <ScSelect v-model="form.misfirePolicy" placeholder="请选择失效策略">
              <ScOption label="立即执行" value="FIRE_ONCE_NOW" />
              <ScOption label="不执行" value="DO_NOTHING" />
            </ScSelect>
          </ScFormItem>
        </ScCol>

        <ScCol :span="12">
          <ScFormItem label="状态" prop="status">
            <ScSwitch
              v-model="form.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </ScFormItem>
        </ScCol>

        <!-- 备注 -->
        <ScCol :span="24">
          <ScFormItem label="备注" prop="remark">
            <ScInput
              v-model="form.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息"
            />
          </ScFormItem>
        </ScCol>
      </ScRow>
    </ScForm>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ScDialog } from "@repo/components/ScDialog"
import { ScForm } from "@repo/components/ScForm"
import { ScFormItem } from "@repo/components/ScFormItem"
import { ScInput } from "@repo/components/ScInput"
import { ScCron } from "@repo/components/ScCron"
import { ScRadio } from "@repo/components/ScRadio"
import { ScRadioButton } from "@repo/components/ScRadioButton"
import { ScSelect } from "@repo/components/ScSelect"
import { ScOption } from "@repo/components/ScOption"
import { ScSwitch } from "@repo/components/ScSwitch"
import { ScDictSelect } from "@repo/components/ScDictSelect"
import { ScRow } from "@repo/components/ScRow"
import { ScCol } from "@repo/components/ScCol"
import {  } from "@repo/components/";
import { message } from "@repo/utils";

const emit = defineEmits(["success", "close"]);

const visible = ref(false);
const mode = ref("add");
const formRef = ref();

// Cron快捷选项
const cronShortcuts = [
  { label: "每秒", value: "* * * * * ?" },
  { label: "每分钟", value: "0 * * * * ?" },
  { label: "每小时", value: "0 0 * * * ?" },
  { label: "每天0点", value: "0 0 0 * * ?" },
  { label: "每周一0点", value: "0 0 0 ? * MON" },
  { label: "每月1号0点", value: "0 0 0 1 * ?" },
];

// 表单数据
const form = reactive({
  jobName: "",
  jobGroup: "DEFAULT",
  cronExpression: "0 0 * * * ?",
  executeType: "bean",
  beanName: "",
  methodName: "",
  scriptContent: "",
  jobParams: "",
  misfirePolicy: "DO_NOTHING",
  status: 1,
  remark: "",
});

// 表单验证规则
const rules = {
  jobName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  jobGroup: [{ required: true, message: "请选择任务分组", trigger: "change" }],
  cronExpression: [
    { required: true, message: "请输入Cron表达式", trigger: "blur" },
  ],
  executeType: [
    { required: true, message: "请选择执行方式", trigger: "change" },
  ],
  beanName: [{ required: true, message: "请输入Bean名称", trigger: "blur" }],
  methodName: [{ required: true, message: "请输入方法名称", trigger: "blur" }],
  scriptContent: [
    { required: true, message: "请输入脚本内容", trigger: "blur" },
  ],
};

// Monaco Editor 配置
const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: "on",
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  theme: "vs-dark",
};

// 根据执行类型获取编辑器语言
const getEditorLanguage = () => {
  switch (form.executeType) {
    case "groovy":
      return "groovy";
    case "shell":
      return "shell";
    case "python":
      return "python";
    default:
      return "text";
  }
};

// 执行方式变化
const handleExecuteTypeChange = () => {
  // 清空相关字段
  if (form.executeType === "bean") {
    form.scriptContent = "";
  } else {
    form.beanName = "";
    form.methodName = "";
  }
};

// 打开对话框
const open = (data = {}, editMode = "add") => {
  mode.value = editMode;
  if (editMode === "edit" && data) {
    Object.assign(form, data);
  } else {
    resetForm();
  }
  visible.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    jobName: "",
    jobGroup: "DEFAULT",
    cronExpression: "0 0 * * * ?",
    executeType: "bean",
    beanName: "",
    methodName: "",
    scriptContent: "",
    jobParams: "",
    misfirePolicy: "DO_NOTHING",
    status: 1,
    remark: "",
  });
  formRef.value?.clearValidate();
};

// 保存
const handleSave = async () => {
  try {
    await formRef.value?.validate();

    // 验证JSON格式
    if (form.jobParams) {
      try {
        JSON.parse(form.jobParams);
      } catch (e) {
        message("任务参数必须是有效的JSON格式", { type: "error" });
        return;
      }
    }

    // TODO: 调用保存接口
    // const result = await saveJob(form)

    message(mode.value === "edit" ? "修改成功" : "新增成功", {
      type: "success",
    });
    visible.value = false;
    emit("success");
  } catch (error) {
    console.error("保存失败:", error);
  }
};

// 关闭
const handleClose = () => {
  visible.value = false;
  emit("close");
};

defineExpose({
  open,
});
</script>

<style scoped lang="scss">
.form-section-title {
  position: relative;
  padding-left: 12px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 4px;
    height: 16px;
    content: "";
    background: var(--el-color-primary);
    border-radius: 2px;
    transform: translateY(-50%);
  }
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-radio-button) {
  margin-right: 8px;
}
</style>
