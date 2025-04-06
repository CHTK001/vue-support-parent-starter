<template>
  <el-dialog v-model="visible" title="编辑文件信息" width="500px" :close-on-click-modal="false" :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="文件名称" prop="maintenanceFileName">
        <el-input v-model="form.maintenanceFileName" placeholder="请输入文件名称" />
      </el-form-item>
      <el-form-item label="目标路径" prop="maintenanceFilePath">
        <el-input v-model="form.maintenanceFilePath" placeholder="请输入文件路径，如：/usr/local/app" />
      </el-form-item>
      <el-form-item label="覆盖设置" prop="maintenanceFileIsOverride">
        <el-switch v-model="form.maintenanceFileIsOverride" :active-value="1" :inactive-value="0" active-text="覆盖" inactive-text="不覆盖" />
      </el-form-item>
      <el-form-item label="文件状态" prop="maintenanceFileStatus">
        <el-switch v-model="form.maintenanceFileStatus" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineEmits, defineExpose } from "vue";

const emit = defineEmits(["update:visible", "submit", "close"]);

const visible = ref(false);
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const form = reactive({
  maintenanceFileId: null,
  maintenanceGroupId: null,
  maintenanceFileName: "",
  maintenanceFilePath: "",
  maintenanceFileType: "",
  maintenanceFileSize: null,
  maintenanceFileIsCompressed: false,
  maintenanceFileStatus: 1,
  maintenanceFileIsOverride: 0
});

// 表单验证规则
const rules = {
  maintenanceFileName: [{ required: true, message: "请输入文件名称", trigger: "blur" }],
  maintenanceFilePath: [{ required: true, message: "请输入文件路径", trigger: "blur" }]
};

// 打开编辑对话框
const open = file => {
  // 重置表单
  resetForm();

  // 填充表单数据
  if (file) {
    form.maintenanceFileId = file.maintenanceFileId;
    form.maintenanceGroupId = file.maintenanceGroupId;
    form.maintenanceFileName = file.maintenanceFileName;
    form.maintenanceFilePath = file.maintenanceFilePath || "/";
    form.maintenanceFileType = file.maintenanceFileType;
    form.maintenanceFileSize = file.maintenanceFileSize;
    form.maintenanceFileIsCompressed = file.maintenanceFileIsCompressed;
    form.maintenanceFileStatus = file.maintenanceFileStatus;
    form.maintenanceFileIsOverride = file.maintenanceFileIsOverride;
  }

  visible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }

  form.maintenanceFileId = null;
  form.maintenanceGroupId = null;
  form.maintenanceFileName = "";
  form.maintenanceFilePath = "";
  form.maintenanceFileType = "";
  form.maintenanceFileSize = null;
  form.maintenanceFileIsCompressed = false;
  form.maintenanceFileStatus = 1;
  form.maintenanceFileIsOverride = 0;
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
  resetForm();
  emit("close");
};

// 提交表单
const submitForm = () => {
  if (formRef.value) {
    formRef.value.validate(valid => {
      if (valid) {
        submitting.value = true;
        emit("submit", { ...form });
      }
    });
  }
};

// 暴露方法
defineExpose({
  open,
  close: handleClose,
  submitting: {
    get: () => submitting.value,
    set: val => (submitting.value = val)
  }
});
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
