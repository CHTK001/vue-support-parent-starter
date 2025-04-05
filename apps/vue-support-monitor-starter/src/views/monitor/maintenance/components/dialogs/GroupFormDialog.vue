<template>
  <el-dialog v-model="visible" :title="isCreate ? '新增维护组' : '编辑维护组'" width="500px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="名称" prop="maintenanceGroupName">
        <el-input v-model="form.maintenanceGroupName" placeholder="请输入维护组名称" />
      </el-form-item>
      <el-form-item label="描述" prop="maintenanceGroupDesc">
        <el-input v-model="form.maintenanceGroupDesc" type="textarea" rows="3" placeholder="请输入维护组描述" />
      </el-form-item>
      <el-form-item label="状态" prop="maintenanceGroupStatus">
        <el-switch v-model="form.maintenanceGroupStatus" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="submit" :loading="submitting">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineEmits, defineExpose } from "vue";

const emit = defineEmits(["update:visible", "submit", "close"]);

const visible = ref(false);
const isCreate = ref(true);
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const form = reactive({
  maintenanceGroupId: null,
  maintenanceGroupName: "",
  maintenanceGroupDesc: "",
  maintenanceGroupStatus: 1
});

// 表单验证规则
const rules = {
  maintenanceGroupName: [
    { required: true, message: "请输入维护组名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ]
};

// 打开添加对话框
const openAdd = () => {
  isCreate.value = true;
  resetForm();
  visible.value = true;
};

// 打开编辑对话框
const openEdit = group => {
  isCreate.value = false;
  resetForm();
  Object.assign(form, group);
  visible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.maintenanceGroupId = null;
  form.maintenanceGroupName = "";
  form.maintenanceGroupDesc = "";
  form.maintenanceGroupStatus = 1;
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
