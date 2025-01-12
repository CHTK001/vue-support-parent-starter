<template>
  <div>
    <el-drawer v-model="visible" :title="config.title" draggable :close-on-click-modal="false" size="80%" @close="handleClose">
      <el-text>{{ form.monitorNginxConfigPath }}</el-text>
      <el-divider />
      <div />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" :loading="config.confirmLoading" @click="handleUpdate">确 定</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { fetchSaveNginxConfig, fetchUpdateNginxConfig } from "@/api/monitor/nginx";
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref, defineAsyncComponent } from "vue";
const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
};
const formRef = ref();
let form = reactive({});
const rules = {};

const visible = ref(false);

const handleUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        fetchSaveNginxConfig(form)
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

      fetchUpdateNginxConfig(form)
        .then(res => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
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
    config.title = `修改配置${data.monitorNginxConfigName}`;
  } else {
    config.title = `添加配置${data.monitorNginxConfigName || ""}`;
    form.monitorNginxConfigWorkerProcesses = 8;
  }
};

defineExpose({
  handleOpen
});
</script>
