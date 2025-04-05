<template>
  <el-dialog v-model="visible" top="10px" :title="isCreate ? '添加脚本' : '编辑脚本'" width="80%" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="脚本名称" prop="maintenanceScriptName">
        <el-input v-model="form.maintenanceScriptName" placeholder="请输入脚本名称" />
      </el-form-item>
      <el-form-item label="脚本路径" prop="maintenanceScriptPath">
        <el-input v-model="form.maintenanceScriptPath" placeholder="请输入脚本路径，如：/usr/local/scripts" />
      </el-form-item>
      <el-form-item label="脚本描述" prop="maintenanceScriptDesc">
        <el-input v-model="form.maintenanceScriptDesc" type="textarea" rows="2" placeholder="请输入脚本描述" />
      </el-form-item>
      <el-form-item label="脚本内容" prop="maintenanceScriptContent">
        <div class="code-editor-container">
          <ScCodeEditor v-model="form.maintenanceScriptContent" height="400px" mode="text/x-sh" :options="editorOptions" />
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="maintenanceScriptStatus">
        <el-switch v-model="form.maintenanceScriptStatus" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineEmits, defineExpose } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import "codemirror/mode/shell/shell.js";
import "codemirror/theme/idea.css";
import "codemirror/addon/selection/active-line.js";
import "codemirror/addon/edit/matchbrackets.js";
const emit = defineEmits(["update:visible", "submit", "close"]);

const visible = ref(false);
const isCreate = ref(true);
const submitting = ref(false);
const formRef = ref(null);

// 编辑器配置
const editorOptions = {
  lineNumbers: true,
  theme: "idea",
  lineWrapping: true,
  styleActiveLine: true,
  tabSize: 2
};

// 表单数据
const form = reactive({
  maintenanceScriptId: null,
  maintenanceGroupId: null,
  maintenanceScriptName: "",
  maintenanceScriptPath: "",
  maintenanceScriptContent: "",
  maintenanceScriptDesc: "",
  maintenanceScriptStatus: 1
});

// 表单验证规则
const rules = {
  maintenanceScriptName: [{ required: true, message: "请输入脚本名称", trigger: "blur" }],
  maintenanceScriptContent: [{ required: true, message: "请输入脚本内容", trigger: "blur" }]
};

// 打开添加对话框
const openAdd = groupId => {
  isCreate.value = true;
  resetForm();
  form.maintenanceGroupId = groupId;
  visible.value = true;
};

// 打开编辑对话框
const openEdit = script => {
  isCreate.value = false;
  resetForm();
  Object.assign(form, script);
  visible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.maintenanceScriptId = null;
  form.maintenanceGroupId = null;
  form.maintenanceScriptName = "";
  form.maintenanceScriptPath = "";
  form.maintenanceScriptContent = "";
  form.maintenanceScriptDesc = "";
  form.maintenanceScriptStatus = 1;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 提交表单
const submit = () => {
  if (formRef.value) {
    formRef.value.validate(valid => {
      if (valid) {
        submitting.value = true;
        // 触发提交事件
        emit("submit", { ...form }, isCreate.value);
      }
    });
  }
};

defineExpose({
  openAdd,
  openEdit,
  close,
  submitting: {
    get: () => submitting.value,
    set: val => (submitting.value = val)
  }
});
</script>

<style lang="scss" scoped>
.code-editor-container {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}
</style>
