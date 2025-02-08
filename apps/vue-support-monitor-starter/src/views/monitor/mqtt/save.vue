<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable @close="handleClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="monitorMqttServerName">
          <el-input v-model="form.monitorMqttServerName" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="地址" prop="monitorMqttServerHost">
          <el-input v-model="form.monitorMqttServerHost" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="端口" prop="monitorMqttServerPort">
          <el-input v-model="form.monitorMqttServerPort" placeholder="请输入端口" type="number" />
        </el-form-item>
        <el-form-item label="用户名" prop="monitorMqttServerUsername">
          <el-input v-model="form.monitorMqttServerUsername" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="monitorMqttServerPassword">
          <el-input v-model="form.monitorMqttServerPassword" placeholder="请输入密码" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" :loading="config.confirmLoading" @click="handleUpdate">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchSaveForMqtt, fetchUpdateForMqtt } from "@/api/monitor/mqtt";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
};
const formRef = ref();
let form = reactive({});
const rules = {
  monitorMqttServerName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  monitorMqttServerHost: [{ required: true, message: "请输入地址", trigger: "blur" }],
  monitorMqttServerPort: [{ required: true, message: "请输入端口", trigger: "blur" }]
};

const visible = ref(false);

const handleUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        fetchSaveForMqtt(form)
          .then(res => {
            if (res.code == "00000") {
              message("保存成功", { type: "success" });
              handleClose();
            }
          })
          .finally(() => {
            config.confirmLoading = false;
          });
        return;
      }

      fetchUpdateForMqtt(form)
        .then(res => {
          if (res.code == "00000") {
            message(, { type: "success" });
            handleClose();
          }
        })
        .finally(() => {
          config.confirmLoading = false;
        });
    }
  });
};

const handleClose = async () => {
  visible.value = false;
  form = reactive({});
  formRef.value.resetFields();
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  config.mode = mode;
  Object.assign(form, data);
  if (mode === "edit") {
    config.title = `修改配置${data.monitorMqttServerName}`;
  } else {
    config.title = `添加配置${data.monitorMqttServerName || ""}`;
    form.monitorMqttServerHost = "0.0.0.0";
  }
};

defineExpose({
  handleOpen
});
</script>
