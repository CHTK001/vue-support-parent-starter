<template>
  <el-dialog v-model="visible" :title="isCreate ? '添加主机' : '编辑主机'" width="500px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="主机地址" prop="maintenanceHostAddress">
        <el-input v-model="form.maintenanceHostAddress" placeholder="请输入主机IP地址" />
      </el-form-item>
      <el-form-item label="端口" prop="maintenanceHostPort">
        <el-input-number v-model="form.maintenanceHostPort" :min="1" :max="65535" placeholder="请输入端口号" />
      </el-form-item>
      <el-form-item label="用户名" prop="maintenanceHostUsername">
        <el-input v-model="form.maintenanceHostUsername" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="maintenanceHostPassword">
        <el-input v-model="form.maintenanceHostPassword" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-form-item label="状态" prop="maintenanceHostEnabled">
        <el-switch v-model="form.maintenanceHostEnabled" :active-value="true" :inactive-value="false" active-text="启用" inactive-text="禁用" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, defineEmits, defineExpose } from "vue";
import { crypto } from "@repo/utils";

const emit = defineEmits(["update:visible", "submit", "close"]);

const visible = ref(false);
const isCreate = ref(true);
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const form = reactive({
  maintenanceHostId: null,
  maintenanceGroupId: null,
  maintenanceHostAddress: "",
  maintenanceHostPort: 22,
  maintenanceHostUsername: "",
  maintenanceHostPassword: "",
  maintenanceHostEnabled: true
});

// 表单验证规则
const rules = {
  maintenanceHostAddress: [{ required: true, message: "请输入主机地址", trigger: "blur" }],
  maintenanceHostPort: [{ required: true, message: "请输入端口号", trigger: "blur" }],
  maintenanceHostUsername: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  maintenanceHostPassword: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

// 打开添加对话框
const openAdd = groupId => {
  isCreate.value = true;
  resetForm();
  form.maintenanceGroupId = groupId;
  visible.value = true;
};

// 打开编辑对话框
const openEdit = host => {
  isCreate.value = false;
  resetForm();
  Object.assign(form, host);
  visible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.maintenanceHostId = null;
  form.maintenanceGroupId = null;
  form.maintenanceHostAddress = "";
  form.maintenanceHostPort = 22;
  form.maintenanceHostUsername = "";
  form.maintenanceHostPassword = "";
  form.maintenanceHostEnabled = true;
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
        // 对密码进行加密处理
        const formData = { ...form };
        if (formData.maintenanceHostPassword) {
          // 使用AES加密密码
          formData.maintenanceHostPassword = crypto.default.AES.encrypt(formData.maintenanceHostPassword, "1234567890Oil#@1");
        }
        // 触发提交事件
        emit("submit", formData, isCreate.value);
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
